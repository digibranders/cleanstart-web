import { and, count, eq, isNull } from 'drizzle-orm';
import { notifications, partners, registrations, staffScopes, users } from '@/db/schema';
import {
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_ROLE_LABEL,
  STAFF_REGION_LABEL,
  STAFF_ROLE_LABEL,
  type StaffRegion,
} from '@/lib/domain';
import type { ShellDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
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
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email, team: teamLabel(manager.region ?? 'all') } : null,
    waitingApprovals: 0,
    unreadNotifications,
  };
}

const exportedFns = { getShell };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  // A viewer forged to claim company B must find no company row, because row level security hides it.
  getShell: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => getShell(tx, { ...viewer, partnerId: ctx.b.partnerId }),
    expect: 'not_found',
  },
});
