import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetRelatedDocsCacheForTests,
  fetchRelatedDocs,
} from './related-docs';

const ORIGIN = 'https://cms.example.com';

const jsonResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as Response;

describe('fetchRelatedDocs', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    __resetRelatedDocsCacheForTests();
    vi.stubGlobal('window', { location: { origin: ORIGIN } });
    fetchMock = vi.fn(async (url: string) => {
      const parsed = new URL(url);
      // `/api/{collection}/{id}` returns the doc itself; `/api/{collection}`
      // with a `where` returns a paginated envelope.
      const byId = parsed.pathname.match(/^\/api\/[^/]+\/(.+)$/);
      if (byId) {
        const id = byId[1] as string;
        return jsonResponse({ id: Number(id), title: `Doc ${id}` });
      }
      const ids = Array.from(parsed.searchParams.entries())
        .filter(([k]) => k.startsWith('where[id][in]'))
        .map(([, v]) => v);
      return jsonResponse({ docs: ids.map((id) => ({ id: Number(id), title: `Doc ${id}` })) });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('collapses many ids in one collection into a single request', async () => {
    const docs = await fetchRelatedDocs('blogs', ['1', '2', '3']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(docs.get('1')).toEqual({ id: 1, title: 'Doc 1' });
    expect(docs.get('3')).toEqual({ id: 3, title: 'Doc 3' });
  });

  it('coalesces concurrent callers for the same collection into one request', async () => {
    const [a, b] = await Promise.all([
      fetchRelatedDocs('blogs', ['1', '2']),
      fetchRelatedDocs('blogs', ['2', '3']),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.get('2')).toEqual({ id: 2, title: 'Doc 2' });
    expect(b.get('3')).toEqual({ id: 3, title: 'Doc 3' });
  });

  it('serves repeat lookups from cache without a second request', async () => {
    await fetchRelatedDocs('blogs', ['1']);
    await fetchRelatedDocs('blogs', ['1']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('requests one batch per collection', async () => {
    await Promise.all([
      fetchRelatedDocs('blogs', ['1']),
      fetchRelatedDocs('authors', ['7']),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sets limit to the batch size so Payload does not cap at its default 10', async () => {
    const ids = Array.from({ length: 12 }, (_, i) => String(i + 1));
    await fetchRelatedDocs('blogs', ids);

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('limit')).toBe('12');
  });

  it('passes select so whole documents are not fetched to render a title', async () => {
    await fetchRelatedDocs('blogs', ['1'], { select: ['title', 'name'] });

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.searchParams.get('select[title]')).toBe('true');
    expect(url.searchParams.get('select[name]')).toBe('true');
  });

  it('omits ids the batch did not return rather than inventing a doc', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ docs: [{ id: 1, title: 'Doc 1' }] }));

    const docs = await fetchRelatedDocs('blogs', ['1', '2']);

    expect(docs.get('1')).toBeDefined();
    expect(docs.has('2')).toBe(false);
  });

  it('falls back to per-id fetches when the batch query fails', async () => {
    fetchMock.mockImplementationOnce(async () => ({ ok: false, status: 400 }) as Response);

    const docs = await fetchRelatedDocs('blogs', ['1', '2']);

    // 1 failed batch + 2 per-id retries.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(docs.get('1')).toEqual({ id: 1, title: 'Doc 1' });
  });

  it('caches a separate bucket per request shape', async () => {
    await fetchRelatedDocs('blogs', ['1'], { depth: 0 });
    await fetchRelatedDocs('blogs', ['1'], { depth: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
