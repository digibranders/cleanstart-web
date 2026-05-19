import { describe, expect, it } from 'vitest';

import { signDownloadToken, verifyDownloadToken } from './download-token';

const SECRET = 'test-secret-do-not-use';

describe('download-token', () => {
  it('round-trips a freshly signed token', () => {
    const now = 1_700_000_000_000;
    const { token, expiresAt } = signDownloadToken({
      resourceId: 'res-123',
      secret: SECRET,
      now,
    });
    const result = verifyDownloadToken({ token, secret: SECRET, now: now + 1_000 });
    expect(result).toEqual({ ok: true, resourceId: 'res-123', expiresAt });
  });

  it('accepts numeric resourceId and stringifies', () => {
    const now = 1_700_000_000_000;
    const { token } = signDownloadToken({ resourceId: 42, secret: SECRET, now });
    const result = verifyDownloadToken({ token, secret: SECRET, now });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.resourceId).toBe('42');
  });

  it('rejects a tampered signature', () => {
    const now = 1_700_000_000_000;
    const { token } = signDownloadToken({ resourceId: 'res-1', secret: SECRET, now });
    const tampered = `${token.slice(0, -2)}AA`;
    const result = verifyDownloadToken({ token: tampered, secret: SECRET, now });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['bad_signature', 'malformed']).toContain(result.reason);
  });

  it('rejects a token signed with a different secret', () => {
    const now = 1_700_000_000_000;
    const { token } = signDownloadToken({ resourceId: 'res-1', secret: SECRET, now });
    const result = verifyDownloadToken({ token, secret: 'other-secret', now });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('bad_signature');
  });

  it('rejects an expired token', () => {
    const now = 1_700_000_000_000;
    const { token, expiresAt } = signDownloadToken({
      resourceId: 'res-1',
      secret: SECRET,
      now,
      ttlMs: 1_000,
    });
    const result = verifyDownloadToken({ token, secret: SECRET, now: expiresAt + 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('rejects malformed base64', () => {
    const result = verifyDownloadToken({ token: 'not!valid!', secret: SECRET });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(['malformed', 'bad_signature']).toContain(result.reason);
  });

  it('rejects a token missing parts', () => {
    const fakeToken = Buffer.from('only.two').toString('base64url');
    const result = verifyDownloadToken({ token: fakeToken, secret: SECRET });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('malformed');
  });
});
