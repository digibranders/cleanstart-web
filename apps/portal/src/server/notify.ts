import { inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { notificationPrefs, notifications, users } from '@/db/schema';
import {
  NOTIFICATION_CATEGORY_OF,
  type NotificationCategory,
  type NotificationKind,
} from '@/lib/domain';
import type { Tx } from '@/server/repo/context';

export interface NewNotification {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  /** App relative path, e.g. "/partner/deals/<id>". */
  link?: string;
}

export interface EmailRecipient {
  userId: string;
  email: string;
  name: string;
  kind: NotificationKind;
  /** Echo of the notification, so the builder can use title, body and link. */
  notification: NewNotification;
}

/** Defaults from the mock's Account screen. A user with no stored row for a category gets the default. */
export const NOTIFICATION_PREF_DEFAULTS: Record<NotificationCategory, boolean> = {
  decision: true,
  stage: true,
  expiry: true,
  docs: true,
  team: true,
  messages: true,
};

/** Inserts the in-app rows. Call inside withViewer or withSystem. No .returning(). */
export async function notifyUsers(tx: Tx, items: readonly NewNotification[]): Promise<void> {
  if (items.length === 0) return;
  await tx.insert(notifications).values(
    items.map((n) => ({ userId: n.userId, kind: n.kind, title: n.title, body: n.body ?? null, link: n.link ?? null })),
  );
}

/**
 * Call after commit (inside ctx.afterCommit). Reads in system scope, drops disabled users and the users who
 * switched the category off, and returns who should get an email. Staff notifications (category null) always email.
 */
export async function resolveEmailRecipients(items: readonly NewNotification[]): Promise<EmailRecipient[]> {
  if (items.length === 0) return [];
  const ids = [...new Set(items.map((i) => i.userId))];
  const people = await db.select({ id: users.id, email: users.email, name: users.name, status: users.status }).from(users).where(inArray(users.id, ids));
  const prefs = await db.select().from(notificationPrefs).where(inArray(notificationPrefs.userId, ids));
  const out: EmailRecipient[] = [];
  for (const item of items) {
    const person = people.find((p) => p.id === item.userId);
    if (!person || person.status === 'disabled') continue;
    const category = NOTIFICATION_CATEGORY_OF[item.kind];
    const stored = category ? prefs.find((p) => p.userId === item.userId && p.category === category) : undefined;
    const wanted = category === null ? true : (stored?.email ?? NOTIFICATION_PREF_DEFAULTS[category]);
    if (wanted) out.push({ userId: person.id, email: person.email, name: person.name, kind: item.kind, notification: item });
  }
  return out;
}
