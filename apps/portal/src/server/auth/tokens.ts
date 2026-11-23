import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { InviteState } from '@/lib/dto';

export const INVITE_TTL_DAYS = 7;
export const EMAIL_CHANGE_TTL_HOURS = 24;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

const DAY_MS = 86_400_000;

/** SHA-256 hex digest. Invite tokens carry 256 bits of randomness, so a fast hash is enough and no salt is needed. */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/** 32 random bytes, base64url, plus the digest that is stored (invites.token_hash). The clear token is emailed once. */
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export const inviteExpiresAt = (now: Date): Date => new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);

export const emailChangeExpiresAt = (now: Date): Date => new Date(now.getTime() + EMAIL_CHANGE_TTL_HOURS * 3_600_000);

/** A used invite stays "used" even if it was also withdrawn; a withdrawn one stays "revoked" after it expires. */
export function inviteState(
  invite: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now: Date,
): Exclude<InviteState, 'unknown'> {
  if (invite.acceptedAt) return 'used';
  if (invite.revokedAt) return 'revoked';
  return invite.expiresAt.getTime() <= now.getTime() ? 'expired' : 'ok';
}

/** Numeric code from crypto.randomInt, zero padded. For the email one-time code fallback (AUTH-SPIKE.md). */
export function generateNumericCode(digits = 6): string {
  return String(randomInt(0, 10 ** digits)).padStart(digits, '0');
}

export const hashCode = (code: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${code}`).digest('hex');

export function verifyCode(input: { code: string; salt: string; expectedHash: string }): boolean {
  const actual = Buffer.from(hashCode(input.code, input.salt), 'hex');
  const expected = Buffer.from(input.expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
