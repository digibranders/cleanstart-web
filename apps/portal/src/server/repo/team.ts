import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import { accessRequests, invites, partners, registrations, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { ACCESS_REQUEST_ROLES, type AccessRequestRole, type PartnerRole } from '@/lib/domain';
import type { AccessRequestDto, CreatedInviteDto, TeamDto, TeamMemberDto } from '@/lib/dto';
import { emailDomain } from '@/lib/people';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite } from '@/server/invite-core';
import { loadPartnerPeople } from '@/server/partner-people';
import { resolvePartnerScope } from '@/server/partner-scope';
import { iso } from '@/server/people';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listPartnerAdminRecipients } from './partners';

type AccessRequestRow = typeof accessRequests.$inferSelect;

const toRequestDto = (row: AccessRequestRow): AccessRequestDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  requestedAt: row.createdAt.toISOString(),
  note: row.note,
  role: row.requestedRole,
  status: row.status,
});

/** Partner admin: own company. Partner manager: pass partnerId. */
export async function getTeam(tx: Tx, viewer: Viewer, input: { partnerId?: string }): Promise<TeamDto> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [partner] = await tx.select({ id: partners.id, name: partners.name }).from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');

  const people = await loadPartnerPeople(tx, partner.id);
  const dealRows = await tx
    .select({ userId: registrations.registeredBy, n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.partnerId, partner.id))
    .groupBy(registrations.registeredBy);
  const deals = new Map(dealRows.map((r) => [r.userId, r.n]));
  const requests = await tx
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.partnerId, partner.id), eq(accessRequests.status, 'open')))
    .orderBy(asc(accessRequests.createdAt));

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    members: people.map(
      (p): TeamMemberDto => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        status: p.status,
        lastActiveAt: iso(p.lastLoginAt),
        invitedAt: iso(p.invitedAt),
        deals: p.userId ? (deals.get(p.userId) ?? 0) : 0,
        isYou: p.userId !== null && p.userId === viewer.id,
        inviteId: p.inviteId,
      }),
    ),
    requests: requests.map(toRequestDto),
  };
}

/** The person a team action is about: a partner user in the viewer's company (any company for staff). Locks the row. */
const loadMember = async (tx: Tx, viewer: Viewer, userId: string) => {
  const [row] = await tx
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.kind, 'partner'),
        ne(users.status, 'disabled'),
        viewer.kind === 'partner' ? eq(users.partnerId, viewer.partnerId) : undefined,
      ),
    )
    .limit(1)
    .for('update');
  if (!row || !row.partnerId) throw new NotFoundError('user');
  return { ...row, partnerId: row.partnerId };
};

/** Throws ConflictError('last_admin') unless another active partner admin stays behind. */
const assertAnotherAdmin = async (tx: Tx, partnerId: string, leavingId: string): Promise<void> => {
  const [other] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.partnerId, partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active'), ne(users.id, leavingId)))
    .limit(1)
    .for('update');
  if (!other) throw new ConflictError('last_admin', 'Every company needs at least one partner admin.');
};

/** Throws ConflictError('last_admin') when it would leave the company with no partner admin. */
export async function changeMemberRole(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string; role: PartnerRole },
): Promise<TeamMemberDto> {
  const target = await loadMember(tx, viewer, input.userId);
  if (target.role !== input.role) {
    if (target.role === 'partner_admin') await assertAnotherAdmin(tx, target.partnerId, target.id);
    await tx.update(users).set({ role: input.role }).where(eq(users.id, target.id));
  }
  const team = await getTeam(tx, viewer, viewer.kind === 'staff' ? { partnerId: target.partnerId } : {});
  const member = team.members.find((m) => m.id === target.id);
  if (!member) throw new NotFoundError('user');
  return member;
}

/**
 * Sets status 'disabled' and removed_at. Their registrations stay with the company. Throws ConflictError('cannot_remove_self')
 * and ConflictError('last_admin'). Deleting the person's Better Auth sessions is the action's job after commit
 * (auth_session is system-only under RLS).
 */
export async function removeMember(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string },
  clock: Clock,
): Promise<{ userId: string; name: string; email: string; role: PartnerRole; partnerId: string }> {
  const target = await loadMember(tx, viewer, input.userId);
  if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot remove yourself.');
  if (target.role === 'partner_admin') await assertAnotherAdmin(tx, target.partnerId, target.id);
  await tx.update(users).set({ status: 'disabled', removedAt: clock.now() }).where(eq(users.id, target.id));
  // A person who was only invited still has an open invite; leaving it would keep the row and the link alive.
  await tx
    .update(invites)
    .set({ revokedAt: clock.now() })
    .where(and(eq(invites.email, target.email), eq(invites.partnerId, target.partnerId), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
  return { userId: target.id, name: target.name, email: target.email, role: target.role as PartnerRole, partnerId: target.partnerId };
}

/**
 * Public (M1.6). Matches the email domain to a partner. Always resolves; `matched` tells the action whether to
 * notify. The UI shows the same confirmation either way. Creates an access_requests row (deduplicated by the open
 * partial index) only when matched and the email has no login.
 */
export async function createAccessRequest(
  tx: Tx,
  _actor: SystemActor,
  input: { email: string; name: string; note: string | null },
  _clock: Clock,
): Promise<{
  matched: boolean;
  partnerId: string | null;
  partnerName: string | null;
  requestId: string | null;
  adminRecipients: Array<{ userId: string; email: string; name: string }>;
}> {
  const none = { matched: false, partnerId: null, partnerName: null, requestId: null, adminRecipients: [] };
  const email = input.email.trim().toLowerCase();
  const domain = emailDomain(email);
  if (!domain) return none;
  const [partner] = await tx.select().from(partners).where(eq(partners.domain, domain)).limit(1);
  if (!partner || (partner.status !== 'active' && partner.status !== 'onboarding')) return none;
  const [login] = await tx.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.status, 'disabled'))).limit(1);
  if (login) return none;

  const name = input.name.trim();
  const note = input.note?.trim() || null;
  const [open] = await tx
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.partnerId, partner.id), eq(accessRequests.email, email), eq(accessRequests.status, 'open')))
    .limit(1)
    .for('update');
  if (open) {
    await tx.update(accessRequests).set({ name, note }).where(eq(accessRequests.id, open.id));
    return { matched: true, partnerId: partner.id, partnerName: partner.name, requestId: open.id, adminRecipients: [] };
  }
  const [created] = await tx
    .insert(accessRequests)
    .values({ partnerId: partner.id, email, name, note })
    .onConflictDoNothing()
    .returning({ id: accessRequests.id });
  return {
    matched: true,
    partnerId: partner.id,
    partnerName: partner.name,
    requestId: created?.id ?? null,
    adminRecipients: created ? await listPartnerAdminRecipients(tx, { partnerId: partner.id }) : [],
  };
}

/**
 * Partner admin of that company, or partner manager. 'approve' creates a partner invite with `role` (sales or
 * technical) and returns it for emailing; 'decline' only closes the request.
 */
export async function decideAccessRequest(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; decision: 'approve'; role: AccessRequestRole } | { id: string; decision: 'decline' },
  clock: Clock,
): Promise<{ request: AccessRequestDto; invite: CreatedInviteDto | null }> {
  if (input.decision === 'approve' && !(ACCESS_REQUEST_ROLES as readonly string[]).includes(input.role)) {
    throw new ValidationError([{ path: 'role', message: 'Choose sales or technical.' }]);
  }
  const [row] = await tx.select().from(accessRequests).where(eq(accessRequests.id, input.id)).limit(1).for('update');
  if (!row) throw new NotFoundError('access request');
  if (viewer.kind === 'partner' && row.partnerId !== viewer.partnerId) throw new NotFoundError('access request');
  if (row.status !== 'open') throw new ConflictError('already_decided', 'This request was already handled.');

  const invite =
    input.decision === 'approve'
      ? await issueInvite(tx, { kind: 'partner', partnerId: row.partnerId, email: row.email, role: input.role, staffRegion: null, invitedBy: viewer.id }, clock)
      : null;
  const [decided] = await tx
    .update(accessRequests)
    .set({ status: input.decision === 'approve' ? 'approved' : 'declined', decidedBy: viewer.id, decidedAt: clock.now() })
    .where(eq(accessRequests.id, row.id))
    .returning();
  if (!decided) throw new Error('access request update returned no row');
  return { request: toRequestDto(decided), invite };
}

export const isolation = defineIsolation<'getTeam' | 'changeMemberRole' | 'removeMember' | 'createAccessRequest' | 'decideAccessRequest'>({
  getTeam: { scope: 'tenant', probe: (tx, viewer, ctx) => getTeam(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  changeMemberRole: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => changeMemberRole(tx, viewer, { userId: ctx.b.userId, role: 'sales' }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  removeMember: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => removeMember(tx, viewer, { userId: ctx.b.userId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  createAccessRequest: { scope: 'public', reason: 'Public request-access flow. Takes a SystemActor; covered by team.test.ts and actions/invites.test.ts.' },
  decideAccessRequest: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => decideAccessRequest(tx, viewer, { id: ctx.b.accessRequestId, decision: 'decline' }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'access_requests', id: ctx.b.accessRequestId }],
  },
});
