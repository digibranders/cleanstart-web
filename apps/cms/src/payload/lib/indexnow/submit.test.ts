import { describe, expect, it, vi } from 'vitest';

import { submitIndexNow } from './submit';

const okResponse = (status = 200): Response =>
  new Response(null, { status });

describe('submitIndexNow', () => {
  it('skips when no key is set', async () => {
    const fetcher = vi.fn();
    const result = await submitIndexNow({
      key: '',
      baseUrl: 'https://cleanstart.com',
      urls: ['https://cleanstart.com/blogs/x'],
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toEqual({ kind: 'skipped', reason: 'no-key' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('skips when no URLs are provided', async () => {
    const fetcher = vi.fn();
    const result = await submitIndexNow({
      key: 'abc123',
      baseUrl: 'https://cleanstart.com',
      urls: [],
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toEqual({ kind: 'skipped', reason: 'no-urls' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('POSTs the IndexNow JSON body to the default endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse(200));
    const result = await submitIndexNow({
      key: 'abc123',
      baseUrl: 'https://cleanstart.com',
      urls: ['https://cleanstart.com/blogs/x'],
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result).toEqual({ kind: 'submitted', status: 200, urlCount: 1 });
    expect(fetcher).toHaveBeenCalledOnce();
    const [endpoint, init] = fetcher.mock.calls[0] as [string, RequestInit];
    expect(endpoint).toBe('https://api.indexnow.org/indexnow');
    expect(init.method).toBe('POST');
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      host: 'cleanstart.com',
      key: 'abc123',
      keyLocation: 'https://cleanstart.com/abc123.txt',
      urlList: ['https://cleanstart.com/blogs/x'],
    });
  });

  it('reports failure when the fetcher throws', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('connection refused'));
    const result = await submitIndexNow({
      key: 'abc123',
      baseUrl: 'https://cleanstart.com',
      urls: ['https://cleanstart.com/blogs/x'],
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result.kind).toBe('failed');
    if (result.kind === 'failed') expect(result.reason).toBe('connection refused');
  });

  it('reports failure for an unparseable baseUrl', async () => {
    const fetcher = vi.fn();
    const result = await submitIndexNow({
      key: 'abc',
      baseUrl: 'not a url',
      urls: ['https://cleanstart.com/x'],
      fetcher: fetcher as unknown as typeof fetch,
    });
    expect(result.kind).toBe('failed');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('strips trailing slashes from baseUrl when building the keyLocation', async () => {
    const fetcher = vi.fn().mockResolvedValue(okResponse());
    await submitIndexNow({
      key: 'k',
      baseUrl: 'https://cleanstart.com///',
      urls: ['https://cleanstart.com/x'],
      fetcher: fetcher as unknown as typeof fetch,
    });
    const init = fetcher.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.keyLocation).toBe('https://cleanstart.com/k.txt');
  });
});
