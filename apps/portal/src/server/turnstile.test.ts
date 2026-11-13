import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/env';
import { IntegrationError, ValidationError } from '@/server/errors';
import { verifyTurnstile } from './turnstile';

const respond = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('verifyTurnstile', () => {
  it('passes when Cloudflare says success and sends secret, token and ip as a form', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => respond({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyTurnstile({ token: 'tok-1', ip: '203.0.113.9' })).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const form = init?.body as URLSearchParams;
    expect(form.get('secret')).toBe(env.TURNSTILE_SECRET_KEY);
    expect(form.get('response')).toBe('tok-1');
    expect(form.get('remoteip')).toBe('203.0.113.9');
  });

  it('throws a validation error on the turnstile path when the check fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respond({ success: false, 'error-codes': ['timeout-or-duplicate'] })));
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toMatchObject({
      issues: [{ path: 'turnstile' }],
    });
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a missing token without calling Cloudflare', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyTurnstile({ token: null, ip: null })).rejects.toBeInstanceOf(ValidationError);
    await expect(verifyTurnstile({ token: '   ', ip: null })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws an integration error when Cloudflare is unreachable or answers with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toMatchObject({ service: 'turnstile' });
    vi.stubGlobal('fetch', vi.fn(async () => respond({}, 503)));
    const error = await verifyTurnstile({ token: 'tok', ip: null }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IntegrationError);
    expect((error as IntegrationError).upstreamStatus).toBe(503);
  });
});
