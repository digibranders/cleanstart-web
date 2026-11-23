import { and, desc, eq, isNull } from 'drizzle-orm';
import { applications, authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { PartnerRole, StaffRegion, StaffRole, UserKind } from '@/lib/domain';
import type { CreatedInviteDto, InviteDto, InvitePreviewDto, InviteState } from '@/lib/dto';
import { isValidEmail } from '@/lib/people';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { hashToken, inviteState } from '@/server/auth/tokens';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite, rotateInviteToken, toInviteDto } from '@/server/invite-core';
import { listManagerRecipients } from './applications';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { assertStaffScopeAssignable } from './regions';

export interface AcceptInviteInput {
  token: string;
  name: string;
  /** Produced by hashPassword() in the action, after assertPasswordOk. The repo never sees the clear password. */
  passwordHash: string;
  /** Required true when the preview says needsAgreement. */
  acceptAgreement: boolean;
  agreementVersion: string;
}

export interface AcceptInviteResult {
  userId: string;
  email: string;
  kind: UserKind;
  role: PartnerRole | StaffRole;
  partnerId: string | null;
  partnerName: string | null;
  agreementAccepted: boolean;
}

/** A real token is 43 characters; anything much longer is junk and never reaches the hash lookup. */
const MAX_TOKEN_LENGTH = 200;

const stateError = (state: Exclude<InviteState, 'ok'>): ConflictError => {
  switch (state) {
    case 'expired':
      return new ConflictError('invite_expired', 'This invite has expired. Ask for a new one.');
    case 'used':
      return new ConflictError('invite_used', 'This invite was already used. Sign in instead.');
    case 'revoked':
      return new ConflictError('invite_revoked', 'This invite was withdrawn. Ask for a new one.');
    case 'unknown':
      return new ConflictError('invite_unknown', 'This invite link is not valid.');
  }
};

/** A partner's first admin on an onboarding partner that has not signed the agreement yet. */
const needsAgreementFor = (
  invite: { kind: UserKind; role: string },
  partner: { status: string; agreementAcceptedAt: Date | null } | undefined,
): boolean =>
  invite.kind === 'partner' && invite.role === 'partner_admin' && partner?.status === 'onboarding' && partner.agreementAcceptedAt === null;

/** Public (M1.5). State only, never throws for a bad token: distinct states for expired, used, revoked and unknown (tampered). */
export async function previewInvite(tx: Tx, _actor: SystemActor, token: string, clock: Clock): Promise<InvitePreviewDto> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return { state: 'unknown' };
  const [invite] = await tx.select().from(invites).where(eq(invites.tokenHash, hashToken(token))).limit(1);
  if (!invite) return { state: 'unknown' };
  const state = inviteState(invite, clock.now());
  if (state !== 'ok') return { state };

  const [partner] = invite.partnerId ? await tx.select().from(partners).where(eq(partners.id, invite.partnerId)).limit(1) : [];
  const [application] = invite.partnerId
    ? await tx
        .select({ name: applications.applicantName })
        .from(applications)
        .where(and(eq(applications.partnerId, invite.partnerId), eq(applications.email, invite.email), eq(applications.status, 'approved')))
        .limit(1)
    : [];
  return {
    state: 'ok',
    email: invite.email,
    kind: invite.kind,
    role: invite.role as PartnerRole | StaffRole,
    partnerName: partner?.name ?? null,
    name: invite.name ?? application?.name ?? null,
    needsAgreement: needsAgreementFor(invite, partner),
    ...(partner?.agreementVersion ? { agreementVersion: partner.agreementVersion } : {}),
  };
}

/**
 * Public (M1.5). One transaction: marks the invite accepted (single use), creates the users row (status 'active'),
 * the Better Auth credential account with `passwordHash`, the staff_scopes row for a staff invite, stamps the partner
 * agreement for a partner admin of an onboarding partner, and returns what the action needs to enqueue user.upsert,
 * audit and notify. Throws ConflictError('invite_expired' | 'invite_used' | 'invite_revoked' | 'invite_unknown' | 'partner_suspended'),
 * ConflictError('already_has_login') and ValidationError when the agreement is required and not accepted.
 * The invite row is locked first, so two simultaneous accepts serialise and the second sees it as used.
 */
export async function acceptInvite(tx: Tx, _actor: SystemActor, input: AcceptInviteInput, clock: Clock): Promise<AcceptInviteResult> {
  if (input.token.length === 0 || input.token.length > MAX_TOKEN_LENGTH) throw stateError('unknown');
  const [invite] = await tx.select().from(invites).where(eq(invites.tokenHash, hashToken(input.token))).limit(1).for('update');
  if (!invite) throw stateError('unknown');
  const state = inviteState(invite, clock.now());
  if (state !== 'ok') throw stateError(state);

  const [partner] = invite.partnerId
    ? await tx.select().from(partners).where(eq(partners.id, invite.partnerId)).limit(1).for('update')
    : [];
  if (invite.kind === 'partner' && !partner) throw new NotFoundError('partner');
  if (partner?.status === 'suspended') {
    throw new ConflictError('partner_suspended', 'This company is suspended, so the invite cannot be used. Contact your CleanStart partner manager.');
  }

  const needsAgreement = needsAgreementFor(invite, partner);
  const name = input.name.trim();
  const issues = [
    ...(name ? [] : [{ path: 'name', message: 'Enter your name.' }]),
    ...(needsAgreement && !input.acceptAgreement ? [{ path: 'acceptAgreement', message: 'Accept the agreement to continue.' }] : []),
  ];
  if (issues.length > 0) throw new ValidationError(issues);

  const now = clock.now();
  const [existing] = await tx.select().from(users).where(eq(users.email, invite.email)).limit(1).for('update');
  let userId: string;
  if (existing) {
    // A pending row is only adopted by an invite for the same kind and company; it is never moved (that would leave a staff scope on a partner user).
    const foreignPending = existing.status === 'invited' && (existing.kind !== invite.kind || existing.partnerId !== invite.partnerId);
    if (existing.status === 'active' || foreignPending) {
      throw new ConflictError('already_has_login', 'This email already has a portal login. Sign in instead.');
    }
    // A removed person invited again, or a pending person whose users row was created with the invite (the dev seed),
    // gets that account back, with a new password and no old two-step secret.
    await tx
      .update(users)
      .set({
        name,
        kind: invite.kind,
        partnerId: invite.partnerId,
        role: invite.role,
        status: 'active',
        emailVerified: true,
        removedAt: null,
        invitedAt: invite.createdAt,
        passwordChangedAt: now,
        twoFactorEnabled: false,
      })
      .where(eq(users.id, existing.id));
    await tx.delete(authAccounts).where(and(eq(authAccounts.userId, existing.id), eq(authAccounts.providerId, 'credential')));
    await tx.delete(authTwoFactors).where(eq(authTwoFactors.userId, existing.id));
    userId = existing.id;
  } else {
    const [created] = await tx
      .insert(users)
      .values({
        email: invite.email,
        name,
        emailVerified: true,
        kind: invite.kind,
        partnerId: invite.partnerId,
        role: invite.role,
        status: 'active',
        invitedAt: invite.createdAt,
        passwordChangedAt: now,
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });
    if (!created) throw new ConflictError('already_has_login', 'This email already has a portal login. Sign in instead.');
    userId = created.id;
  }

  await tx.insert(authAccounts).values({ accountId: userId, providerId: 'credential', userId, password: input.passwordHash });
  if (invite.kind === 'staff' && invite.staffRegion) {
    await tx
      .insert(staffScopes)
      .values({ userId, region: invite.staffRegion })
      .onConflictDoUpdate({ target: staffScopes.userId, set: { region: invite.staffRegion } });
  }
  if (needsAgreement && partner) {
    await tx.update(partners).set({ agreementVersion: input.agreementVersion, agreementAcceptedAt: now }).where(eq(partners.id, partner.id));
  }
  await tx.update(invites).set({ acceptedAt: now, userId }).where(eq(invites.id, invite.id));

  return {
    userId,
    email: invite.email,
    kind: invite.kind,
    role: invite.role as PartnerRole | StaffRole,
    partnerId: invite.partnerId,
    partnerName: partner?.name ?? null,
    agreementAccepted: needsAgreement,
  };
}

export type NewInviteInput =
  | { kind: 'partner'; partnerId: string; email: string; role: PartnerRole; name?: string | null | undefined }
  | { kind: 'staff'; email: string; role: StaffRole; region: StaffRegion };

/** Partner admin on own company, partner manager on any, partner manager for staff invites (M1.6, M1.8). */
export async function createInvite(tx: Tx, viewer: Viewer, input: NewInviteInput, clock: Clock): Promise<CreatedInviteDto> {
  if (!isValidEmail(input.email)) throw new ValidationError([{ path: 'email', message: 'Enter a valid work email.' }]);
  if (input.kind === 'staff') {
    assertStaff(viewer);
    await assertStaffScopeAssignable(tx, input.region);
    return issueInvite(tx, { kind: 'staff', partnerId: null, email: input.email, role: input.role, staffRegion: input.region, invitedBy: viewer.id }, clock);
  }
  if (viewer.kind === 'partner' && input.partnerId !== viewer.partnerId) throw new NotFoundError('partner');
  const [partner] = await tx.select({ id: partners.id }).from(partners).where(eq(partners.id, input.partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');
  return issueInvite(tx, { kind: 'partner', partnerId: partner.id, email: input.email, role: input.role, staffRegion: null, invitedBy: viewer.id, name: input.name }, clock);
}

const loadOpenForUpdate = async (tx: Tx, viewer: Viewer, inviteId: string) => {
  const [row] = await tx.select().from(invites).where(eq(invites.id, inviteId)).limit(1).for('update');
  // Another company's invite (and any staff invite, for a partner viewer) is invisible: same answer as a missing id.
  if (!row || (viewer.kind === 'partner' && row.partnerId !== viewer.partnerId)) throw new NotFoundError('invite');
  if (row.kind === 'staff') assertStaff(viewer);
  if (row.acceptedAt) throw new ConflictError('invite_used', 'This invite was already accepted.');
  if (row.revokedAt) throw new ConflictError('invite_revoked', 'This invite was withdrawn.');
  return row;
};

/** Rotates the token, extends the expiry by INVITE_TTL_DAYS from now, increments resentCount (M1.6, M1.8). Only for open invites. */
export async function resendInvite(tx: Tx, viewer: Viewer, input: { inviteId: string }, clock: Clock): Promise<CreatedInviteDto> {
  const row = await loadOpenForUpdate(tx, viewer, input.inviteId);
  const rotated = await rotateInviteToken(tx, row.id, clock);
  if (!rotated) throw new ConflictError('invite_used', 'This invite is no longer open.');
  return rotated;
}

/** Sets revoked_at (M1.6, M1.8). */
export async function revokeInvite(tx: Tx, viewer: Viewer, input: { inviteId: string }, clock: Clock): Promise<InviteDto> {
  const row = await loadOpenForUpdate(tx, viewer, input.inviteId);
  const [revoked] = await tx.update(invites).set({ revokedAt: clock.now() }).where(eq(invites.id, row.id)).returning();
  if (!revoked) throw new Error('invite revoke returned no row');
  return toInviteDto(revoked, clock.now());
}

/** Changes the role an open partner invite will give on acceptance. Staff invites are not touched here. */
export async function changeInviteRole(tx: Tx, viewer: Viewer, input: { inviteId: string; role: PartnerRole }): Promise<InviteDto> {
  const row = await loadOpenForUpdate(tx, viewer, input.inviteId);
  if (row.kind !== 'partner') throw new NotFoundError('invite');
  const [updated] = await tx.update(invites).set({ role: input.role }).where(eq(invites.id, row.id)).returning();
  if (!updated) throw new Error('invite role change returned no row');
  return toInviteDto(updated, new Date());
}

/** Open invites of one partner (partner viewers: their own), or all staff invites when kind is 'staff' (M1.6, M1.8). Expired ones are included, flagged by state. */
export async function listOpenInvites(
  tx: Tx,
  viewer: Viewer,
  input: { kind: UserKind; partnerId?: string },
  clock: Clock,
): Promise<InviteDto[]> {
  if (input.kind === 'staff') assertStaff(viewer);
  else if (viewer.kind === 'partner' && input.partnerId !== undefined && input.partnerId !== viewer.partnerId) {
    throw new NotFoundError('partner');
  }
  const partnerId = viewer.kind === 'partner' ? viewer.partnerId : input.partnerId;
  const rows = await tx
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.kind, input.kind),
        isNull(invites.acceptedAt),
        isNull(invites.revokedAt),
        input.kind === 'partner' && partnerId ? eq(invites.partnerId, partnerId) : undefined,
      ),
    )
    .orderBy(desc(invites.createdAt));
  return rows.map((row) => toInviteDto(row, clock.now()));
}

export interface InviteAgainRequest {
  inviteEmail: string;
  kind: UserKind;
  role: PartnerRole | StaffRole;
  partnerId: string | null;
  partnerName: string | null;
  /** Who is asked: the person who invited, else the partner's admins, else the partner managers. */
  recipients: Array<{ userId: string; email: string; name: string }>;
}

/**
 * Public. The invitee on a dead invite page (expired, used or revoked) asks for a new one. Returns who to tell, or null
 * for an unknown token or a live invite, and the action answers the same either way. Writes nothing.
 */
export async function findInviteAgainRecipients(tx: Tx, actor: SystemActor, token: string, clock: Clock): Promise<InviteAgainRequest | null> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return null;
  const [invite] = await tx.select().from(invites).where(eq(invites.tokenHash, hashToken(token))).limit(1);
  if (!invite || inviteState(invite, clock.now()) === 'ok') return null;
  const [partner] = invite.partnerId ? await tx.select({ name: partners.name }).from(partners).where(eq(partners.id, invite.partnerId)).limit(1) : [];

  let recipients = invite.invitedBy
    ? await tx
        .select({ userId: users.id, email: users.email, name: users.name })
        .from(users)
        .where(and(eq(users.id, invite.invitedBy), eq(users.status, 'active')))
    : [];
  if (recipients.length === 0 && invite.partnerId) {
    recipients = await tx
      .select({ userId: users.id, email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.partnerId, invite.partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active')));
  }
  if (recipients.length === 0) recipients = await listManagerRecipients(tx, actor);
  return {
    inviteEmail: invite.email,
    kind: invite.kind,
    role: invite.role as PartnerRole | StaffRole,
    partnerId: invite.partnerId,
    partnerName: partner?.name ?? null,
    recipients,
  };
}

export const isolation = defineIsolation<
  'previewInvite' | 'acceptInvite' | 'findInviteAgainRecipients' | 'createInvite' | 'resendInvite' | 'revokeInvite' | 'changeInviteRole' | 'listOpenInvites'
>({
  previewInvite: { scope: 'public', reason: 'Public invite page. Takes a SystemActor; covered by invites.test.ts.' },
  acceptInvite: { scope: 'public', reason: 'Public invite flow. Takes a SystemActor; covered by invites.test.ts and actions/invites.test.ts.' },
  findInviteAgainRecipients: { scope: 'public', reason: 'Public "send me a new invite" flow. Takes a SystemActor, writes nothing; covered by invites.test.ts.' },
  createInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => createInvite(tx, viewer, { kind: 'partner', partnerId: ctx.b.partnerId, email: 'probe@example.com', role: 'sales' }, systemClock),
    expect: 'not_found',
  },
  resendInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => resendInvite(tx, viewer, { inviteId: ctx.b.inviteId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'invites', id: ctx.b.inviteId }],
  },
  revokeInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => revokeInvite(tx, viewer, { inviteId: ctx.b.inviteId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'invites', id: ctx.b.inviteId }],
  },
  changeInviteRole: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => changeInviteRole(tx, viewer, { inviteId: ctx.b.inviteId, role: 'sales' }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'invites', id: ctx.b.inviteId }],
  },
  listOpenInvites: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => listOpenInvites(tx, viewer, { kind: 'partner', partnerId: ctx.b.partnerId }, systemClock),
    expect: 'not_found',
  },
});
