import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import type { NotificationDto, NotificationsDto, NotificationsPageDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import { assertUuid } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation, type IsolationContext } from './isolation.registry';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const toDto = (row: typeof notifications.$inferSelect): NotificationDto => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  body: row.body,
  link: row.link,
  readAt: row.readAt ? row.readAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

/** The viewer's own notifications, newest first, plus how many are unread in total. RLS keeps other users' rows out as well. */
export async function listNotifications(tx: Tx, viewer: Viewer, input: { limit?: number }): Promise<NotificationsDto> {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const rows = await tx
    .select()
    .from(notifications)
    .where(eq(notifications.userId, viewer.id))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);
  const [unread] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, viewer.id), isNull(notifications.readAt)));
  return { items: rows.map(toDto), unread: unread?.n ?? 0 };
}

export const NOTIFICATIONS_PAGE_SIZE = 25;

/** One page of the viewer's own notifications for the full list, newest first. `unreadOnly` narrows it. */
export async function listNotificationsPage(
  tx: Tx,
  viewer: Viewer,
  input: { page: number; unreadOnly: boolean },
): Promise<NotificationsPageDto> {
  const page = Math.max(Math.floor(input.page), 1);
  const where = input.unreadOnly
    ? and(eq(notifications.userId, viewer.id), isNull(notifications.readAt))
    : eq(notifications.userId, viewer.id);
  const rows = await tx
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(NOTIFICATIONS_PAGE_SIZE)
    .offset((page - 1) * NOTIFICATIONS_PAGE_SIZE);
  const [total] = await tx.select({ n: sql<number>`count(*)::int` }).from(notifications).where(where);
  const [unread] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, viewer.id), isNull(notifications.readAt)));
  return { items: rows.map(toDto), unread: unread?.n ?? 0, total: total?.n ?? 0, page, pageSize: NOTIFICATIONS_PAGE_SIZE };
}

export async function markAllRead(tx: Tx, viewer: Viewer, clock: Clock): Promise<void> {
  await tx
    .update(notifications)
    .set({ readAt: clock.now() })
    .where(and(eq(notifications.userId, viewer.id), isNull(notifications.readAt)));
}

/** Idempotent: an already read notification keeps its first read time. Throws NotFoundError for somebody else's id. */
export async function markRead(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<void> {
  assertUuid(input.id, 'notification');
  const rows = await tx
    .update(notifications)
    .set({ readAt: sql`coalesce(${notifications.readAt}, ${clock.now().toISOString()}::timestamptz)` })
    .where(and(eq(notifications.id, input.id), eq(notifications.userId, viewer.id)))
    .returning({ id: notifications.id });
  if (rows.length === 0) throw new NotFoundError('notification');
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

/** A notification for another user of the same company, written by the probing viewer (the insert policy allows it). */
const foreignNotification = async (tx: Tx, viewerId: string, ctx: IsolationContext): Promise<string> => {
  const owner = [ctx.a.userId, ctx.a.adminViewer.id, ctx.a.salesViewer.id].find((id) => id !== viewerId) ?? ctx.a.userId;
  const id = randomUUID();
  await tx.insert(notifications).values({ id, userId: owner, kind: 'document_new', title: 'isolation probe' });
  return id;
};

export const isolation = defineIsolation<'listNotifications' | 'listNotificationsPage' | 'markAllRead' | 'markRead'>({
  listNotifications: {
    scope: 'own-user',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => {
      await foreignNotification(tx, viewer.id, ctx);
      return (await listNotifications(tx, viewer, {})).items.filter((item) => item.title === 'isolation probe');
    },
  },
  listNotificationsPage: {
    scope: 'own-user',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => {
      await foreignNotification(tx, viewer.id, ctx);
      return (await listNotificationsPage(tx, viewer, { page: 1, unreadOnly: false })).items.filter((item) => item.title === 'isolation probe');
    },
  },
  markAllRead: {
    scope: 'own-user',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => {
      await foreignNotification(tx, viewer.id, ctx);
      await markAllRead(tx, viewer, probeClock);
      return null;
    },
  },
  markRead: {
    scope: 'own-user',
    expect: 'not_found',
    probe: async (tx, viewer, ctx) => markRead(tx, viewer, { id: await foreignNotification(tx, viewer.id, ctx) }, probeClock),
  },
});
