import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as canonicalLib from '../lib/canonical-check';
import { canonicalCheckEndpoint } from './canonical-check';

const handler = canonicalCheckEndpoint.handler as (req: unknown) => Promise<Response>;

const makeReq = (
  url: string,
  user: { role?: string } | null = { role: 'editor' },
) =>
  ({
    url,
    user,
  }) as unknown as Parameters<typeof handler>[0];

beforeEach(() => {
  vi.spyOn(canonicalLib, 'checkCanonicalUrl').mockResolvedValue({
    ok: true,
    status: 200,
    healthy: true,
  } as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('canonicalCheckEndpoint', () => {
  it('returns 403 for unauthenticated users', async () => {
    const res = await handler(makeReq('http://x?url=https://example.com', null));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ ok: false, error: 'forbidden' });
  });

  it('returns 403 for non-editor users', async () => {
    const res = await handler(makeReq('http://x?url=https://example.com', { role: 'reader' }));
    expect(res.status).toBe(403);
  });

  it('allows admin role', async () => {
    const res = await handler(
      makeReq('http://x?url=https://example.com', { role: 'admin' }),
    );
    expect(res.status).toBe(200);
  });

  it('returns 400 when url query param is missing', async () => {
    const res = await handler(makeReq('http://x'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_url');
  });

  it('returns 400 when url is not a valid URL', async () => {
    const res = await handler(makeReq('http://x?url=not-a-url'));
    expect(res.status).toBe(400);
  });

  it('returns 400 when url exceeds 2 KiB', async () => {
    const long = `https://example.com/${'a'.repeat(3000)}`;
    const res = await handler(makeReq(`http://x?url=${encodeURIComponent(long)}`));
    expect(res.status).toBe(400);
  });

  it('delegates to checkCanonicalUrl on a valid request', async () => {
    const spy = vi.spyOn(canonicalLib, 'checkCanonicalUrl').mockResolvedValue({
      ok: true,
      status: 200,
      healthy: true,
    } as never);
    const res = await handler(makeReq('http://x?url=https%3A%2F%2Fexample.com%2Fa'));
    expect(res.status).toBe(200);
    expect(spy).toHaveBeenCalledWith({ url: 'https://example.com/a' });
  });
});
