import { describe, expect, it, vi } from 'vitest';

import { checkCanonicalUrl } from './canonical-check';

const fakeResponse = (init: { status?: number; url?: string } = {}): Response => {
  const status = init.status ?? 200;
  const res = new Response(null, { status });
  // Override the read-only `url` getter so we can simulate redirects.
  Object.defineProperty(res, 'url', { value: init.url ?? '', configurable: true });
  return res;
};

describe('checkCanonicalUrl', () => {
  it('rejects empty / non-http URLs without making a request', async () => {
    const fetcher = vi.fn();
    const result = await checkCanonicalUrl({
      url: '',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toEqual({ ok: false, kind: 'invalid-url', message: expect.any(String) });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns healthy on 2xx', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 200 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/article',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, status: 200, healthy: true });
  });

  it('marks 404 as not healthy but still ok=true (request succeeded)', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 404 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/missing',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, status: 404, healthy: false });
  });

  it('reports redirected URL when fetch follows a redirect', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      fakeResponse({ status: 200, url: 'https://example.com/final' }),
    );
    const result = await checkCanonicalUrl({
      url: 'https://example.com/start',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({
      ok: true,
      redirected: true,
      finalUrl: 'https://example.com/final',
    });
  });

  it('retries with GET when HEAD returns 405', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(fakeResponse({ status: 405 }))
      .mockResolvedValueOnce(fakeResponse({ status: 200 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/x',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect((fetcher.mock.calls[0]?.[1] as RequestInit).method).toBe('HEAD');
    expect((fetcher.mock.calls[1]?.[1] as RequestInit).method).toBe('GET');
  });

  it('returns network failure on fetch throw', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('connection refused'));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/x',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: false, kind: 'network', message: 'connection refused' });
  });
});
