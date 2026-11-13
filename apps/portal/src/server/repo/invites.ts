import { and, eq } from 'drizzle-orm';
import { applications, authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { PartnerRole, StaffRole, UserKind } from '@/lib/domain';
import type { InvitePreviewDto, InviteState } from '@/lib/dto';
import type { SystemActor } from '@/server/auth/types';
import { hashToken, inviteState } from '@/server/auth/tokens';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

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
    name: application?.name ?? null,
    needsAgreement: needsAgreementFor(invite, partner),
    ...(partner?.agreementVersion ? { agreementVersion: partner.agreementVersion } : {}),
  };
}

/**
 * Public (M1.5). One transaction: marks the invite accepted (single use), creates the users row (status 'active'),
 * the Better Auth credential account with `passwordHash`, the staff_scopes row for a staff invite, stamps the partner
 * agreement for a partner admin of an onboarding partner, and returns what the action needs to enqueue user.upsert,
 * audit and notify. Throws ConflictError('invite_expired' | 'invite_used' | 'invite_revoked' | 'invite_unknown'),
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
    if (existing.status !== 'disabled') {
      throw new ConflictError('already_has_login', 'This email already has a portal login. Sign in instead.');
    }
    // A removed person invited again gets the same account back, with a new password and no old two-step secret.
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

export const isolation = defineIsolation<'previewInvite' | 'acceptInvite'>({
  previewInvite: { scope: 'public', reason: 'Public invite page. Takes a SystemActor; covered by invites.test.ts.' },
  acceptInvite: { scope: 'public', reason: 'Public invite flow. Takes a SystemActor; covered by invites.test.ts and actions/invites.test.ts.' },
});
