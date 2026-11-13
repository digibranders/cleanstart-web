import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { invites, partners, staffScopes, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { systemClock } from '@/lib/clock';
import type { StaffRegion, StaffRole } from '@/lib/domain';
import type { ManagerOptionDto, StaffMemberDto } from '@/lib/dto';
import { nameFromEmail, staffTeamLabel } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError } from '@/server/errors';
import { iso } from '@/server/people';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** People of the CleanStart team: users with a login plus teammates who only have an open invite (id is then the invite id). */
export async function listStaff(tx: Tx, viewer: Viewer): Promise<StaffMemberDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select({ user: users, region: staffScopes.region })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.kind, 'staff'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const managerIds = rows.filter((r) => r.user.role === 'partner_manager').map((r) => r.user.id);
  const managed =
    managerIds.length === 0
      ? []
      : await tx.select({ managerId: partners.managerId, name: partners.name }).from(partners).where(inArray(partners.managerId, managerIds)).orderBy(asc(partners.name));

  const members: StaffMemberDto[] = rows.map(({ user, region }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as StaffRole,
    region: region ?? 'all',
    partners: managed.filter((m) => m.managerId === user.id).map((m) => m.name),
    status: user.status === 'active' ? 'active' : 'invited',
    lastActiveAt: iso(user.lastLoginAt),
    inviteId: open.find((i) => i.email === user.email)?.id ?? null,
    isYou: user.id === viewer.id,
  }));
  for (const invite of open) {
    if (rows.some((r) => r.user.email === invite.email)) continue;
    members.push({
      id: invite.id,
      name: nameFromEmail(invite.email),
      email: invite.email,
      role: invite.role as StaffRole,
      region: invite.staffRegion ?? 'all',
      partners: [],
      status: 'invited',
      lastActiveAt: null,
      inviteId: invite.id,
      isYou: false,
    });
  }
  return [...members.filter((m) => m.status === 'active'), ...members.filter((m) => m.status === 'invited')];
}

/** The active partner managers a registration can be routed to, with their regions. Readable by partners (C.3). */
export async function listManagerOptions(tx: Tx, _viewer: Viewer): Promise<ManagerOptionDto[]> {
  const rows = await tx
    .select({ id: users.id, name: users.name, region: staffScopes.region })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(asc(users.createdAt));
  return rows.map((r) => ({ id: r.id, name: r.name, region: r.region ?? 'all', team: staffTeamLabel(r.region) }));
}

const loadTarget = async (tx: Tx, userId: string) => {
  const [row] = await tx
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.kind, 'staff'), ne(users.status, 'disabled')))
    .limit(1)
    .for('update');
  return row ?? null;
};

/** Throws ConflictError('last_partner_manager') unless another active partner manager stays behind. */
const assertAnotherManager = async (tx: Tx, leavingId: string): Promise<void> => {
  const [other] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active'), ne(users.id, leavingId)))
    .limit(1)
    .for('update');
  if (!other) throw new ConflictError('last_partner_manager', 'CleanStart needs at least one partner manager.');
};

const memberAfter = async (tx: Tx, viewer: Viewer, id: string): Promise<StaffMemberDto> => {
  const member = (await listStaff(tx, viewer)).find((m) => m.id === id);
  if (!member) throw new NotFoundError('staff member');
  return member;
};

/** Throws ConflictError('last_partner_manager') and ConflictError('cannot_remove_self'). */
export async function changeStaffRole(tx: Tx, viewer: Viewer, input: { userId: string; role: StaffRole }): Promise<StaffMemberDto> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (!target) throw new NotFoundError('staff member');
  if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot change your own access.');
  if (target.role !== input.role) {
    if (target.role === 'partner_manager') await assertAnotherManager(tx, target.id);
    await tx.update(users).set({ role: input.role }).where(eq(users.id, target.id));
  }
  return memberAfter(tx, viewer, target.id);
}

export async function changeStaffRegion(tx: Tx, viewer: Viewer, input: { userId: string; region: StaffRegion }): Promise<StaffMemberDto> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (!target) throw new NotFoundError('staff member');
  await tx
    .insert(staffScopes)
    .values({ userId: target.id, region: input.region })
    .onConflictDoUpdate({ target: staffScopes.userId, set: { region: input.region } });
  return memberAfter(tx, viewer, target.id);
}

/**
 * Disables a teammate, or withdraws the invite when the id is a teammate who has not accepted yet. Throws
 * ConflictError('last_partner_manager') and ConflictError('cannot_remove_self'). Deleting the person's Better Auth
 * sessions is the action's job after commit (auth_session is system-only under RLS).
 */
export async function removeStaff(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string },
  clock: Clock,
): Promise<{ userId: string; name: string; email: string }> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (target) {
    if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot remove yourself.');
    if (target.role === 'partner_manager') await assertAnotherManager(tx, target.id);
    await tx.update(users).set({ status: 'disabled', removedAt: clock.now() }).where(eq(users.id, target.id));
    return { userId: target.id, name: target.name, email: target.email };
  }
  const [invite] = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.id, input.userId), eq(invites.kind, 'staff'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .limit(1)
    .for('update');
  if (!invite) throw new NotFoundError('staff member');
  await tx.update(invites).set({ revokedAt: clock.now() }).where(eq(invites.id, invite.id));
  return { userId: invite.id, name: nameFromEmail(invite.email), email: invite.email };
}

export const isolation = defineIsolation<'listStaff' | 'listManagerOptions' | 'changeStaffRole' | 'changeStaffRegion' | 'removeStaff'>({
  listStaff: { scope: 'staff-only', probe: (tx, viewer) => listStaff(tx, viewer), expect: 'forbidden' },
  listManagerOptions: { scope: 'tenant', probe: (tx, viewer) => listManagerOptions(tx, viewer), expect: 'unchanged' },
  changeStaffRole: { scope: 'staff-only', probe: (tx, viewer, ctx) => changeStaffRole(tx, viewer, { userId: ctx.staffUserId, role: 'sales' }), expect: 'forbidden' },
  changeStaffRegion: { scope: 'staff-only', probe: (tx, viewer, ctx) => changeStaffRegion(tx, viewer, { userId: ctx.staffUserId, region: 'all' }), expect: 'forbidden' },
  removeStaff: { scope: 'staff-only', probe: (tx, viewer, ctx) => removeStaff(tx, viewer, { userId: ctx.staffUserId }, systemClock), expect: 'forbidden' },
});
