import { describe, expect, it, vi } from 'vitest';

import { createSearchClient, searchClientConfigFromEnv } from './client';

const baseConfig = (
  overrides: Parameters<typeof createSearchClient>[0] = {},
): Parameters<typeof createSearchClient>[0] => ({
  url: 'http://localhost:7700',
  apiKey: 'masterkey',
  ...overrides,
});

describe('createSearchClient', () => {
  it('returns a no-op client when url or apiKey is missing', async () => {
    expect(createSearchClient({}).enabled).toBe(false);
    expect(createSearchClient({ url: 'http://localhost:7700' }).enabled).toBe(false);
    expect(createSearchClient({ apiKey: 'k' }).enabled).toBe(false);

    const client = createSearchClient({});
    await expect(client.upsertDocuments('content', [{ id: 'a' }])).resolves.toEqual({
      ok: true,
      skipped: true,
      reason: 'not-configured',
    });
    await expect(client.deleteDocument('content', 'a')).resolves.toEqual({
      ok: true,
      skipped: true,
      reason: 'not-configured',
    });
    await expect(client.search('content', 'q')).resolves.toBeNull();
  });

  it('treats whitespace-only url / apiKey as missing', () => {
    expect(createSearchClient({ url: '   ', apiKey: 'k' }).enabled).toBe(false);
    expect(createSearchClient({ url: 'http://x', apiKey: '' }).enabled).toBe(false);
  });

  it('strips a trailing slash from the url', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createSearchClient(
      baseConfig({ url: 'http://localhost:7700/', fetch: fetchMock as unknown as typeof fetch }),
    );
    await client.upsertDocuments('content', [{ id: 'blogs:1', title: 'X' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7700/indexes/content/documents',
      expect.any(Object),
    );
  });

  it('upserts documents with the right method, body, and auth', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );

    const docs = [{ id: 'blogs:1', title: 'X' }];
    const res = await client.upsertDocuments('content', docs);

    expect(res).toEqual({ ok: true, skipped: false, status: 202 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7700/indexes/content/documents',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(docs),
      }),
    );
    const sent = (fetchMock.mock.calls as unknown as RequestInit[][])[0]?.[1] as RequestInit;
    const headers = sent.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer masterkey');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('deletes a document by encoded id', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );
    await client.deleteDocument('content', 'blogs:1');
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe('http://localhost:7700/indexes/content/documents/blogs%3A1');
    expect(calls[0]?.[1]?.method).toBe('DELETE');
  });

  it('returns ok=false when the server responds with a 4xx/5xx', async () => {
    const fetchMock = vi.fn(
      async () => new Response('boom', { status: 400 }),
    );
    const warn = vi.fn();
    const client = createSearchClient(
      baseConfig({
        fetch: fetchMock as unknown as typeof fetch,
        logger: { warn },
      }),
    );
    const res = await client.upsertDocuments('content', [{ id: 'a' }]);
    expect(res).toEqual({ ok: false, skipped: false, status: 400, error: 'boom' });
    expect(warn).toHaveBeenCalledWith(
      'meilisearch request failed',
      expect.objectContaining({ method: 'POST', status: 400 }),
    );
  });

  it('returns ok=false when fetch throws', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network down');
    });
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );
    const res = await client.upsertDocuments('content', [{ id: 'a' }]);
    expect(res).toEqual({
      ok: false,
      skipped: false,
      status: 0,
      error: 'network down',
    });
  });

  it('updateSettings PATCHes /indexes/<uid>/settings with the body', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );
    const settings = { searchableAttributes: ['title'] as const };
    await client.updateSettings('content', settings);
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0]?.[0]).toBe('http://localhost:7700/indexes/content/settings');
    expect(calls[0]?.[1]?.method).toBe('PATCH');
    expect(calls[0]?.[1]?.body).toBe(JSON.stringify(settings));
  });

  it('updateSettings strips primaryKey (Meili /settings rejects it)', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 202 }));
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );
    await client.updateSettings('content', {
      primaryKey: 'id',
      filterableAttributes: ['collection'] as const,
    });
    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    const body = JSON.parse(String(calls[0]?.[1]?.body));
    expect(body.primaryKey).toBeUndefined();
    expect(body.filterableAttributes).toEqual(['collection']);
  });

  it('search returns the parsed body on 2xx, null on failure', async () => {
    const okResponse = new Response(
      JSON.stringify({ hits: [{ id: 'x' }], estimatedTotalHits: 1, processingTimeMs: 3 }),
      { status: 200 },
    );
    const fetchMock = vi.fn(async () => okResponse);
    const client = createSearchClient(
      baseConfig({ fetch: fetchMock as unknown as typeof fetch }),
    );
    const result = await client.search('content', 'foo', { limit: 10 });
    expect(result).toMatchObject({ hits: [{ id: 'x' }], estimatedTotalHits: 1 });

    const failingFetch = vi.fn(
      async () => new Response('boom', { status: 500 }),
    );
    const failing = createSearchClient(
      baseConfig({ fetch: failingFetch as unknown as typeof fetch }),
    );
    expect(await failing.search('content', 'foo')).toBeNull();
  });
});

describe('searchClientConfigFromEnv', () => {
  it('reads url + apiKey from process.env', () => {
    const cfg = searchClientConfigFromEnv({
      MEILISEARCH_URL: 'http://x:7700',
      MEILISEARCH_API_KEY: 'k',
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ url: 'http://x:7700', apiKey: 'k' });
  });

  it('returns nulls when env is missing', () => {
    const cfg = searchClientConfigFromEnv({} as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ url: null, apiKey: null });
  });
});
