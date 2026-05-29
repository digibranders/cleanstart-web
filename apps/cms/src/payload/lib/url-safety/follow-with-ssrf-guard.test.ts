import { describe, expect, it, vi } from 'vitest';

import { followWithSsrfGuard, type FollowFetcher } from './follow-with-ssrf-guard';

const redirectResponse = (location: string, status = 302): Response =>
  new Response(null, { status, headers: { location } });

const okResponse = (): Response => new Response('body', { status: 200 });

describe('followWithSsrfGuard', () => {
  it('rejects an initial URL pointing at a private address', async () => {
    const fetcher = vi.fn();
    const result = await followWithSsrfGuard('http://169.254.169.254/latest/meta-data', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('unsafe-url');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects a non-http protocol up front', async () => {
    const result = await followWithSsrfGuard('ftp://example.com/x', {
      signal: new AbortController().signal,
      fetcher: vi.fn() as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('invalid-url');
  });

  it('rejects a public URL that redirects to the metadata endpoint', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse('http://169.254.169.254/latest/meta-data'));
    const result = await followWithSsrfGuard('https://images.example.com/a.png', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('unsafe-url');
      expect(result.url).toContain('169.254.169.254');
    }
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[1]?.redirect).toBe('manual');
  });

  it('follows a safe redirect chain and returns the final response', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(redirectResponse('https://cdn.example.org/final.png'))
      .mockResolvedValueOnce(okResponse());
    const result = await followWithSsrfGuard('https://images.example.com/a.png', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.finalUrl).toBe('https://cdn.example.org/final.png');
      expect(result.redirected).toBe(true);
      expect(result.response.status).toBe(200);
    }
  });

  it('returns the response directly when there is no redirect', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(okResponse());
    const result = await followWithSsrfGuard('https://images.example.com/a.png', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.redirected).toBe(false);
      expect(result.finalUrl).toBe('https://images.example.com/a.png');
    }
  });

  it('caps the redirect chain', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(redirectResponse('https://cdn.example.org/loop.png'));
    const result = await followWithSsrfGuard('https://images.example.com/a.png', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('too-many-redirects');
  });

  it('rejects a redirect with no Location header', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302 }));
    const result = await followWithSsrfGuard('https://images.example.com/a.png', {
      signal: new AbortController().signal,
      fetcher: fetcher as unknown as FollowFetcher,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe('missing-location');
  });
});
