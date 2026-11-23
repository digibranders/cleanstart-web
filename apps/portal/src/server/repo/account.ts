import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { notificationPrefs, notifications, partners, registrations, staffScopes, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_ROLE_LABEL,
  type PartnerRole,
  STAFF_REGION_LABEL,
  STAFF_ROLE_LABEL,
  type StaffRegion,
  type StaffRole,
} from '@/lib/domain';
import type { ProfileDto, ShellDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import { NOTIFICATION_PREF_DEFAULTS } from '@/server/notify';
import { iso } from '@/server/people';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** "CleanStart India", "CleanStart Middle East", or plain "CleanStart" for a manager who covers every region. */
const teamLabel = (region: StaffRegion): string => (region === 'all' ? 'CleanStart' : `CleanStart ${STAFF_REGION_LABEL[region]}`);

async function unreadCount(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

/** Pending registrations a staff viewer may decide: the whole queue for "all", otherwise their region. */
async function waitingCount(tx: Tx, viewer: Viewer): Promise<number> {
  if (viewer.kind !== 'staff' || viewer.role === 'marketing') return 0;
  const pending = eq(registrations.status, 'pending');
  const [row] = await tx
    .select({ value: count() })
    .from(registrations)
    .where(viewer.region === 'all' ? pending : and(pending, eq(registrations.region, viewer.region)));
  return row?.value ?? 0;
}

/** Everything the layout needs (M1.1). Counts are cheap aggregates. */
export async function getShell(tx: Tx, viewer: Viewer): Promise<ShellDto> {
  const base = { viewerId: viewer.id, viewerName: viewer.name, viewerEmail: viewer.email, kind: viewer.kind };
  const unreadNotifications = await unreadCount(tx, viewer.id);

  if (viewer.kind === 'staff') {
    const region = viewer.region === 'all' ? '' : `, ${STAFF_REGION_LABEL[viewer.region]}`;
    return {
      ...base,
      roleLabel: `${STAFF_ROLE_LABEL[viewer.role]}${region}`,
      orgName: 'CleanStart',
      orgSub: 'Partnerships',
      manager: null,
      waitingApprovals: await waitingCount(tx, viewer),
      unreadNotifications,
    };
  }

  const [partner] = await tx
    .select({ category: partners.category, region: partners.region, managerId: partners.managerId })
    .from(partners)
    .where(eq(partners.id, viewer.partnerId))
    .limit(1);
  if (!partner) throw new NotFoundError('partner');

  const [manager] = partner.managerId
    ? await tx
        .select({ id: users.id, name: users.name, email: users.email, region: staffScopes.region })
        .from(users)
        .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
        .where(and(eq(users.id, partner.managerId), eq(users.status, 'active')))
        .limit(1)
    : [];

  return {
    ...base,
    roleLabel: PARTNER_ROLE_LABEL[viewer.role],
    orgName: viewer.partnerName,
    orgSub: `${PARTNER_CATEGORY_LABEL[partner.category]}, ${PARTNER_REGION_LABEL[partner.region]}`,
    partnerRegion: partner.region,
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email, team: teamLabel(manager.region ?? 'all') } : null,
    waitingApprovals: 0,
    unreadNotifications,
  };
}

export async function getProfile(tx: Tx, viewer: Viewer): Promise<ProfileDto> {
  const [user] = await tx.select().from(users).where(eq(users.id, viewer.id)).limit(1);
  if (!user) throw new NotFoundError('user');
  const stored = await tx.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id));
  const notifications: Record<NotificationCategory, boolean> = { ...NOTIFICATION_PREF_DEFAULTS };
  for (const pref of stored) notifications[pref.category] = pref.email;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.title,
    phone: user.phone,
    kind: user.kind,
    role: user.role as PartnerRole | StaffRole,
    partnerName: viewer.partnerName,
    twoFactorEnabled: user.twoFactorEnabled,
    passwordChangedAt: iso(user.passwordChangedAt),
    notifications,
  };
}

export async function updateProfile(
  tx: Tx,
  viewer: Viewer,
  input: { name: string; title: string | null; phone: string | null },
): Promise<ProfileDto> {
  const name = input.name.trim();
  if (!name) throw new ValidationError([{ path: 'name', message: 'Enter your name.' }]);
  await tx
    .update(users)
    .set({ name, title: input.title?.trim() || null, phone: input.phone?.trim() || null })
    .where(eq(users.id, viewer.id));
  return getProfile(tx, viewer);
}

/** Stores one notification_prefs row per category. */
export async function setNotificationPrefs(
  tx: Tx,
  viewer: Viewer,
  input: Record<NotificationCategory, boolean>,
): Promise<Record<NotificationCategory, boolean>> {
  await tx
    .insert(notificationPrefs)
    .values(NOTIFICATION_CATEGORIES.map((category) => ({ userId: viewer.id, category, email: input[category] })))
    .onConflictDoUpdate({ target: [notificationPrefs.userId, notificationPrefs.category], set: { email: sql`excluded.email` } });
  return { ...input };
}

/** Called by the change-password action after Better Auth has stored the new hash. Sets users.password_changed_at. */
export async function recordPasswordChanged(tx: Tx, viewer: Viewer, clock: Clock): Promise<void> {
  await tx.update(users).set({ passwordChangedAt: clock.now() }).where(eq(users.id, viewer.id));
}

const exportedFns = { getShell, getProfile, updateProfile, setNotificationPrefs, recordPasswordChanged };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  // A viewer forged to claim company B must find no company row, because row level security hides it.
  getShell: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => getShell(tx, { ...viewer, partnerId: ctx.b.partnerId }),
    expect: 'not_found',
  },
  getProfile: { scope: 'tenant', probe: (tx, viewer) => getProfile(tx, viewer), expect: 'unchanged' },
  updateProfile: { scope: 'tenant', probe: (tx, viewer) => updateProfile(tx, viewer, { name: viewer.name, title: null, phone: null }), expect: 'unchanged' },
  setNotificationPrefs: {
    scope: 'tenant',
    probe: (tx, viewer) => setNotificationPrefs(tx, viewer, { decision: true, stage: true, expiry: true, docs: false, team: true }),
    expect: 'unchanged',
  },
  recordPasswordChanged: { scope: 'tenant', probe: (tx, viewer) => recordPasswordChanged(tx, viewer, systemClock), expect: 'unchanged' },
});
