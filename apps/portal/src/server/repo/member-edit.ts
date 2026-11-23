import { and, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { emailChangeRequests, partners, registrations, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { CreatedInviteDto } from '@/lib/dto';
import { isValidEmail } from '@/lib/people';
import { emailChangeExpiresAt, generateInviteToken, hashToken } from '@/server/auth/tokens';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite } from '@/server/invite-core';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** A real token is 43 characters; anything much longer is junk and never reaches the hash lookup. */
const MAX_TOKEN_LENGTH = 200;

export interface MemberDetails {
  name: string;
  title: string | null;
  phone: string | null;
}

/** A partner user in the viewer's company (any company for staff). Locks the row. `removed` picks disabled people instead of live ones. */
const loadCompanyUser = async (tx: Tx, viewer: Viewer, userId: string, removed: boolean) => {
  const [row] = await tx
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.kind, 'partner'),
        removed ? eq(users.status, 'disabled') : ne(users.status, 'disabled'),
        viewer.kind === 'partner' ? eq(users.partnerId, viewer.partnerId) : undefined,
      ),
    )
    .limit(1)
    .for('update');
  if (!row || !row.partnerId) throw new NotFoundError('user');
  return { ...row, partnerId: row.partnerId };
};

/** Same company only. Returns what changed so the action can audit before and after; `changed` is false when nothing differs. */
export async function updateMemberDetails(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string; name: string; title: string | null; phone: string | null },
): Promise<{ userId: string; partnerId: string; before: MemberDetails; after: MemberDetails; changed: boolean }> {
  const name = input.name.trim();
  if (!name) throw new ValidationError([{ path: 'name', message: 'Enter their name.' }]);
  const target = await loadCompanyUser(tx, viewer, input.userId, false);
  const before: MemberDetails = { name: target.name, title: target.title, phone: target.phone };
  const after: MemberDetails = { name, title: input.title?.trim() || null, phone: input.phone?.trim() || null };
  const changed = before.name !== after.name || before.title !== after.title || before.phone !== after.phone;
  if (changed) await tx.update(users).set(after).where(eq(users.id, target.id));
  return { userId: target.id, partnerId: target.partnerId, before, after, changed };
}

export interface EmailChangeRequested {
  token: string;
  userId: string;
  name: string;
  partnerId: string;
  oldEmail: string;
  newEmail: string;
  expiresAt: Date;
}

const emailTaken = (): ConflictError => new ConflictError('email_taken', 'Someone already uses that address.');

/**
 * Same company only. Stores a hashed single use token (24 hours) for the new address and returns the clear token once; the
 * email itself changes only in confirmEmailChange. An earlier open request for the person is cancelled.
 * Throws ValidationError for a malformed or unchanged address and ConflictError('email_taken') when any login already has it.
 */
export async function requestEmailChange(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string; email: string },
  clock: Clock,
): Promise<EmailChangeRequested> {
  const newEmail = input.email.trim().toLowerCase();
  if (!isValidEmail(newEmail)) throw new ValidationError([{ path: 'email', message: 'Enter a valid work email.' }]);
  const target = await loadCompanyUser(tx, viewer, input.userId, false);
  if (newEmail === target.email) throw new ValidationError([{ path: 'email', message: 'That is already their address.' }]);
  const [taken] = await tx.select({ id: users.id }).from(users).where(eq(users.email, newEmail)).limit(1);
  if (taken) throw emailTaken();

  await tx
    .update(emailChangeRequests)
    .set({ expiresAt: clock.now() })
    .where(and(eq(emailChangeRequests.userId, target.id), isNull(emailChangeRequests.usedAt), gt(emailChangeRequests.expiresAt, clock.now())));
  const { token, tokenHash } = generateInviteToken();
  const expiresAt = emailChangeExpiresAt(clock.now());
  await tx.insert(emailChangeRequests).values({
    partnerId: target.partnerId,
    userId: target.id,
    newEmail,
    tokenHash,
    requestedBy: viewer.id,
    expiresAt,
  });
  return { token, userId: target.id, name: target.name, partnerId: target.partnerId, oldEmail: target.email, newEmail, expiresAt };
}

export type EmailChangePreview =
  | { state: 'ok'; newEmail: string; name: string }
  | { state: 'expired' | 'used' | 'unknown' };

/** Public. State only, never throws for a bad token. */
export async function previewEmailChange(tx: Tx, _actor: SystemActor, token: string, clock: Clock): Promise<EmailChangePreview> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return { state: 'unknown' };
  const [row] = await tx
    .select({ request: emailChangeRequests, name: users.name, status: users.status })
    .from(emailChangeRequests)
    .innerJoin(users, eq(users.id, emailChangeRequests.userId))
    .where(eq(emailChangeRequests.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.status === 'disabled') return { state: 'unknown' };
  if (row.request.usedAt) return { state: 'used' };
  if (row.request.expiresAt.getTime() <= clock.now().getTime()) return { state: 'expired' };
  return { state: 'ok', newEmail: row.request.newEmail, name: row.name };
}

export interface EmailChangeConfirmed {
  userId: string;
  name: string;
  partnerId: string;
  partnerName: string;
  oldEmail: string;
  newEmail: string;
}

/**
 * Public. Single use: the request row is locked first, so two opens serialise and the second sees it as used. Moves the login
 * to the new address. Revoking the person's sessions is the action's job after commit (auth_session is system-only).
 * Throws ConflictError('email_change_unknown' | 'email_change_expired' | 'email_change_used' | 'email_taken').
 */
export async function confirmEmailChange(tx: Tx, _actor: SystemActor, token: string, clock: Clock): Promise<EmailChangeConfirmed> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) throw new ConflictError('email_change_unknown', 'This link is not valid.');
  const [request] = await tx.select().from(emailChangeRequests).where(eq(emailChangeRequests.tokenHash, hashToken(token))).limit(1).for('update');
  if (!request) throw new ConflictError('email_change_unknown', 'This link is not valid.');
  if (request.usedAt) throw new ConflictError('email_change_used', 'This link was already used.');
  if (request.expiresAt.getTime() <= clock.now().getTime()) {
    throw new ConflictError('email_change_expired', 'This link has expired. Ask your partner admin to send a new one.');
  }
  const [user] = await tx.select().from(users).where(eq(users.id, request.userId)).limit(1).for('update');
  if (!user || user.status === 'disabled' || !user.partnerId) throw new ConflictError('email_change_unknown', 'This link is not valid.');
  const [taken] = await tx.select({ id: users.id }).from(users).where(and(eq(users.email, request.newEmail), ne(users.id, user.id))).limit(1);
  if (taken) throw emailTaken();

  await tx.update(users).set({ email: request.newEmail, emailVerified: true }).where(eq(users.id, user.id));
  await tx.update(emailChangeRequests).set({ usedAt: clock.now() }).where(eq(emailChangeRequests.id, request.id));
  await tx
    .update(emailChangeRequests)
    .set({ expiresAt: clock.now() })
    .where(and(eq(emailChangeRequests.userId, user.id), isNull(emailChangeRequests.usedAt), gt(emailChangeRequests.expiresAt, clock.now())));
  const [partner] = await tx.select({ name: partners.name }).from(partners).where(eq(partners.id, user.partnerId)).limit(1);
  return { userId: user.id, name: user.name, partnerId: user.partnerId, partnerName: partner?.name ?? 'your company', oldEmail: user.email, newEmail: request.newEmail };
}

/**
 * Same company only. Brings a removed person back through the invite flow: they get a fresh invite for their old role and the
 * account returns to 'invited', so the old password stays dead until they set a new one. Throws NotFoundError for anyone who is
 * not removed. The action emails the invite.
 */
export async function reactivateMember(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string },
  clock: Clock,
): Promise<{ created: CreatedInviteDto; userId: string; name: string; email: string; partnerId: string }> {
  const target = await loadCompanyUser(tx, viewer, input.userId, true);
  const created = await issueInvite(
    tx,
    { kind: 'partner', partnerId: target.partnerId, email: target.email, role: target.role, staffRegion: null, invitedBy: viewer.id, name: target.name },
    clock,
  );
  await tx.update(users).set({ status: 'invited', removedAt: null, invitedAt: clock.now() }).where(eq(users.id, target.id));
  return { created, userId: target.id, name: target.name, email: target.email, partnerId: target.partnerId };
}

/**
 * Same company only. Points registrations.registered_by at another live sales or admin user; the status of a deal is not
 * touched. Partner sales see only deals they registered, so the new owner sees them from then on. Returns how many moved.
 */
export async function moveDeals(
  tx: Tx,
  viewer: Viewer,
  input: { fromUserId: string; toUserId: string },
): Promise<{ moved: number; partnerId: string; from: { id: string; name: string }; to: { id: string; name: string } }> {
  if (input.fromUserId === input.toUserId) throw new ValidationError([{ path: 'moveDealsTo', message: 'Pick someone else.' }]);
  const [from] = await tx
    .select({ id: users.id, name: users.name, partnerId: users.partnerId })
    .from(users)
    .where(and(eq(users.id, input.fromUserId), eq(users.kind, 'partner'), viewer.kind === 'partner' ? eq(users.partnerId, viewer.partnerId) : undefined))
    .limit(1);
  if (!from?.partnerId) throw new NotFoundError('user');
  const [to] = await tx
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.id, input.toUserId),
        eq(users.kind, 'partner'),
        eq(users.partnerId, from.partnerId),
        eq(users.status, 'active'),
        sql`${users.role} in ('sales', 'partner_admin')`,
      ),
    )
    .limit(1);
  if (!to) throw new ValidationError([{ path: 'moveDealsTo', message: 'Pick a remaining sales or admin person.' }]);
  const moved = await tx
    .update(registrations)
    .set({ registeredBy: to.id })
    .where(and(eq(registrations.partnerId, from.partnerId), eq(registrations.registeredBy, from.id)))
    .returning({ id: registrations.id });
  return { moved: moved.length, partnerId: from.partnerId, from: { id: from.id, name: from.name }, to };
}

export const isolation = defineIsolation<
  'updateMemberDetails' | 'requestEmailChange' | 'previewEmailChange' | 'confirmEmailChange' | 'reactivateMember' | 'moveDeals'
>({
  updateMemberDetails: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => updateMemberDetails(tx, viewer, { userId: ctx.b.userId, name: 'Probe', title: null, phone: null }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  requestEmailChange: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => requestEmailChange(tx, viewer, { userId: ctx.b.userId, email: 'probe-new@example.com' }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  previewEmailChange: { scope: 'public', reason: 'Public confirmation page. Takes a SystemActor; covered by member-edit.test.ts.' },
  confirmEmailChange: { scope: 'public', reason: 'Public confirmation link. Takes a SystemActor; covered by member-edit.test.ts.' },
  reactivateMember: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => reactivateMember(tx, viewer, { userId: ctx.b.userId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  moveDeals: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => moveDeals(tx, viewer, { fromUserId: ctx.b.userId, toUserId: ctx.a.userId }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'registrations', id: ctx.b.registrationId }],
  },
});
