import { describe, expect, it } from 'vitest';
import {
  generateInviteToken,
  generateNumericCode,
  hashCode,
  hashToken,
  INVITE_TTL_DAYS,
  inviteExpiresAt,
  inviteState,
  verifyCode,
} from './tokens';

const NOW = new Date('2026-11-12T10:00:00.000Z');
const HOUR = 3_600_000;

describe('invite tokens', () => {
  it('is 32 random bytes as base64url and stores only the SHA-256 hex digest', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toContain(token);
  });

  it('never repeats', () => {
    expect(generateInviteToken().token).not.toBe(generateInviteToken().token);
  });

  it('a changed token hashes to something else', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(hashToken(`${token}x`)).not.toBe(tokenHash);
  });

  it('expires seven days after it is made', () => {
    expect(INVITE_TTL_DAYS).toBe(7);
    expect(inviteExpiresAt(NOW).toISOString()).toBe('2026-11-19T10:00:00.000Z');
  });
});

describe('inviteState', () => {
  const open = { acceptedAt: null, revokedAt: null, expiresAt: new Date(NOW.getTime() + HOUR) };

  it('ok while open and in date', () => {
    expect(inviteState(open, NOW)).toBe('ok');
  });

  it('expired at the expiry instant and after it', () => {
    expect(inviteState({ ...open, expiresAt: NOW }, NOW)).toBe('expired');
    expect(inviteState({ ...open, expiresAt: new Date(NOW.getTime() - HOUR) }, NOW)).toBe('expired');
  });

  it('used once accepted, even if it was also withdrawn or has expired', () => {
    const closed = { ...open, acceptedAt: NOW, revokedAt: NOW, expiresAt: new Date(NOW.getTime() - HOUR) };
    expect(inviteState(closed, NOW)).toBe('used');
  });

  it('revoked when withdrawn, even after it expires', () => {
    expect(inviteState({ ...open, revokedAt: NOW }, NOW)).toBe('revoked');
    expect(inviteState({ ...open, revokedAt: NOW, expiresAt: new Date(NOW.getTime() - HOUR) }, NOW)).toBe('revoked');
  });
});

describe('numeric codes', () => {
  it('is six digits by default and keeps leading zeros', () => {
    for (let i = 0; i < 200; i += 1) expect(generateNumericCode()).toMatch(/^\d{6}$/);
    expect(generateNumericCode(4)).toMatch(/^\d{4}$/);
  });

  it('verifies with the salt it was hashed with and nothing else', () => {
    const expectedHash = hashCode('042913', 'salt-a');
    expect(verifyCode({ code: '042913', salt: 'salt-a', expectedHash })).toBe(true);
    expect(verifyCode({ code: '042914', salt: 'salt-a', expectedHash })).toBe(false);
    expect(verifyCode({ code: '042913', salt: 'salt-b', expectedHash })).toBe(false);
    expect(verifyCode({ code: '042913', salt: 'salt-a', expectedHash: 'abcd' })).toBe(false);
  });
});
