import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { invites, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { PartnerRole, StaffRegion, StaffRole, UserKind } from '@/lib/domain';
import type { CreatedInviteDto, InviteDto } from '@/lib/dto';
import { generateInviteToken, inviteExpiresAt, inviteState } from '@/server/auth/tokens';
import { ConflictError } from '@/server/errors';
import type { Tx } from '@/server/repo/context';

export type InviteRow = typeof invites.$inferSelect;

export const toInviteDto = (row: InviteRow, now: Date): InviteDto => ({
  id: row.id,
  email: row.email,
  kind: row.kind,
  role: row.role as PartnerRole | StaffRole,
  partnerId: row.partnerId,
  staffRegion: row.staffRegion,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  resentCount: row.resentCount,
  state: inviteState(row, now),
});

export interface IssueInviteInput {
  kind: UserKind;
  partnerId: string | null;
  email: string;
  role: string;
  staffRegion: StaffRegion | null;
  invitedBy: string | null;
  /** The name the inviter gave, if any. */
  name?: string | null | undefined;
}

/**
 * Creates an invite and returns the clear token once. Replaces an earlier open invite for the same email, kind and
 * company (the old one is revoked first). Throws ConflictError('already_has_login') when an active or invited user has
 * the email; a removed (disabled) person may be invited again.
 */
export async function issueInvite(tx: Tx, input: IssueInviteInput, clock: Clock): Promise<CreatedInviteDto> {
  const email = input.email.trim().toLowerCase();
  const [login] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.status, 'disabled')))
    .limit(1);
  if (login) throw new ConflictError('already_has_login', 'This person already has a login.');

  const sameTarget = input.partnerId === null ? isNull(invites.partnerId) : eq(invites.partnerId, input.partnerId);
  await tx
    .update(invites)
    .set({ revokedAt: clock.now() })
    .where(and(eq(invites.email, email), eq(invites.kind, input.kind), sameTarget, isNull(invites.acceptedAt), isNull(invites.revokedAt)));

  const { token, tokenHash } = generateInviteToken();
  const [row] = await tx
    .insert(invites)
    .values({
      email,
      kind: input.kind,
      partnerId: input.partnerId,
      role: input.role,
      staffRegion: input.staffRegion,
      tokenHash,
      expiresAt: inviteExpiresAt(clock.now()),
      invitedBy: input.invitedBy,
      name: input.name?.trim() || null,
    })
    .returning();
  if (!row) throw new Error('invite insert returned no row');
  return { invite: toInviteDto(row, clock.now()), token };
}

/**
 * Replaces the token of an open invite, extends the expiry from now and counts the resend. Null when the invite is
 * missing, accepted or revoked (the caller decides which error to raise).
 */
export async function rotateInviteToken(tx: Tx, inviteId: string, clock: Clock): Promise<CreatedInviteDto | null> {
  const { token, tokenHash } = generateInviteToken();
  const [row] = await tx
    .update(invites)
    .set({ tokenHash, expiresAt: inviteExpiresAt(clock.now()), resentCount: sql`${invites.resentCount} + 1` })
    .where(and(eq(invites.id, inviteId), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .returning();
  return row ? { invite: toInviteDto(row, clock.now()), token } : null;
}
