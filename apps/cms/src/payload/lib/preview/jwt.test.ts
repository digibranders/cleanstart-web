import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  MAX_PREVIEW_TTL_SECONDS,
  signPreviewToken,
  verifyPreviewToken,
} from './jwt';

const ORIGINAL_SECRET = process.env.PREVIEW_JWT_SECRET;
const TEST_SECRET = 'test-secret-with-enough-entropy-12345678';

beforeAll(() => {
  process.env.PREVIEW_JWT_SECRET = TEST_SECRET;
});

afterAll(() => {
  process.env.PREVIEW_JWT_SECRET = ORIGINAL_SECRET;
});

const baseArgs = {
  collection: 'blogs',
  docId: 'doc-1',
  actorId: 'user-1',
  auditId: 'audit-1',
  ttlSeconds: 60 * 60,
};

describe('signPreviewToken / verifyPreviewToken', () => {
  it('signs and verifies a valid token round-trip', () => {
    const { token, payload } = signPreviewToken(baseArgs);
    const verified = verifyPreviewToken(token);
    expect(verified.ok).toBe(true);
    if (verified.ok) {
      expect(verified.payload.collection).toBe('blogs');
      expect(verified.payload.docId).toBe('doc-1');
      expect(verified.payload.auditId).toBe('audit-1');
      expect(verified.payload.exp).toBe(payload.exp);
    }
  });

  it('rejects expired tokens', () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago
    const { token } = signPreviewToken({
      ...baseArgs,
      ttlSeconds: 60 * 60, // 1h ttl — expired by an hour relative to now
      now: past,
    });
    const verified = verifyPreviewToken(token);
    expect(verified.ok).toBe(false);
    if (!verified.ok) expect(verified.reason).toBe('expired');
  });

  it('rejects tampered signatures', () => {
    const { token } = signPreviewToken(baseArgs);
    const tampered = `${token.slice(0, -2)}xx`;
    const verified = verifyPreviewToken(tampered);
    expect(verified.ok).toBe(false);
    if (!verified.ok) expect(verified.reason).toBe('bad_signature');
  });

  it('rejects malformed tokens', () => {
    expect(verifyPreviewToken('not-a-jwt').ok).toBe(false);
    expect(verifyPreviewToken('').ok).toBe(false);
    expect(verifyPreviewToken('a.b').ok).toBe(false);
  });

  it('rejects tokens signed with a different secret', () => {
    const { token } = signPreviewToken(baseArgs);
    process.env.PREVIEW_JWT_SECRET = 'different-secret-also-with-entropy-77777777';
    try {
      const verified = verifyPreviewToken(token);
      expect(verified.ok).toBe(false);
      if (!verified.ok) expect(verified.reason).toBe('bad_signature');
    } finally {
      process.env.PREVIEW_JWT_SECRET = TEST_SECRET;
    }
  });

  it('refuses ttl above the hard cap', () => {
    expect(() =>
      signPreviewToken({ ...baseArgs, ttlSeconds: MAX_PREVIEW_TTL_SECONDS + 1 }),
    ).toThrow(/exceeds max/);
  });

  it('refuses non-positive ttl', () => {
    expect(() => signPreviewToken({ ...baseArgs, ttlSeconds: 0 })).toThrow(/> 0/);
    expect(() => signPreviewToken({ ...baseArgs, ttlSeconds: -1 })).toThrow(/> 0/);
  });

  it('refuses to sign when secret is too short', () => {
    process.env.PREVIEW_JWT_SECRET = 'short';
    try {
      expect(() => signPreviewToken(baseArgs)).toThrow(/PREVIEW_JWT_SECRET/);
    } finally {
      process.env.PREVIEW_JWT_SECRET = TEST_SECRET;
    }
  });
});
