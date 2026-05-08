import { describe, expect, it, vi } from 'vitest';

import { checkCanonicalUrl } from './canonical-check';

const fakeResponse = (init: { status?: number; location?: string } = {}): Response => {
  const status = init.status ?? 200;
  const headers = new Headers();
  if (init.location) headers.set('location', init.location);
  return new Response(null, { status, headers });
};

describe('checkCanonicalUrl', () => {
  it('rejects empty / non-http URLs without making a request', async () => {
    const fetcher = vi.fn();
    const result = await checkCanonicalUrl({
      url: '',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: false, kind: 'invalid-url' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects internal addresses without making a request (SSRF guard)', async () => {
    const fetcher = vi.fn();
    const cases = [
      'http://localhost/',
      'http://127.0.0.1/',
      'http://169.254.169.254/latest/meta-data/',
      'http://10.0.0.1/',
      'http://[::1]/',
      'http://app.internal/',
    ];
    for (const url of cases) {
      const result = await checkCanonicalUrl({
        url,
        fetcher: fetcher as unknown as typeof fetch,
      });
      expect(result).toMatchObject({ ok: false, kind: 'unsafe-url' });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('returns healthy on 2xx', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 200 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/article',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, status: 200, healthy: true, redirected: false });
  });

  it('marks 404 as not healthy but still ok=true (request succeeded)', async () => {
    const fetcher = vi.fn().mockResolvedValue(fakeResponse({ status: 404 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/missing',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: true, status: 404, healthy: false });
  });

  it('manually follows a 301 redirect to a public destination', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        fakeResponse({ status: 301, location: 'https://example.com/final' }),
      )
      .mockResolvedValueOnce(fakeResponse({ status: 200 }));
    const result = await checkCanonicalUrl({
      url: 'https://example.com/start',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({
      ok: true,
      status: 200,
      redirected: true,
      finalUrl: 'https://example.com/final',
    });
  });

  it('refuses to follow a redirect into an internal address', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        fakeResponse({ status: 302, location: 'http://169.254.169.254/' }),
      );
    const result = await checkCanonicalUrl({
      url: 'https://example.com/redirect',
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toMatchObject({ ok: false, kind: 'unsafe-url' });
    expect(fetcher).toHaveBeenCalledTimes(1);
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
