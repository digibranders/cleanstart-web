import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const fetchCMS = vi.fn();

vi.mock('./cms-fetch', () => ({
  fetchCMS: (...args: unknown[]) => fetchCMS(...args),
  cmsBaseUrl: () => 'http://localhost:3000',
}));

const { searchContent, collectionLabel } = await import('./search');

beforeEach(() => {
  fetchCMS.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('collectionLabel', () => {
  test('maps known collections and falls back to "Result"', () => {
    expect(collectionLabel('knowledgeBase')).toBe('Knowledge Hub');
    expect(collectionLabel('blogs')).toBe('Blog');
    expect(collectionLabel('mystery')).toBe('Result');
  });
});

describe('searchContent', () => {
  test('short-circuits an empty query without hitting the CMS', async () => {
    expect(await searchContent({ q: '   ' })).toEqual([]);
    expect(fetchCMS).not.toHaveBeenCalled();
  });

  test('passes q/collection/limit through to the CMS endpoint', async () => {
    fetchCMS.mockResolvedValueOnce({ ok: true, hits: [] });
    await searchContent({ q: 'fips', collection: 'knowledgeBase', limit: 5 });
    const path = fetchCMS.mock.calls[0]?.[0] as string;
    expect(path).toContain('/api/search?');
    expect(path).toContain('q=fips');
    expect(path).toContain('collection=knowledgeBase');
    expect(path).toContain('limit=5');
  });

  test('maps hits to UI shape with relative href + label', async () => {
    fetchCMS.mockResolvedValueOnce({
      ok: true,
      hits: [
        {
          id: 'knowledgeBase_3',
          collection: 'knowledgeBase',
          title: 'Images and Containers',
          description: 'How static artifacts become running processes.',
          slug: 'images-and-containers',
          url: 'https://cleanstart.com/knowledge-hub/images-and-containers',
          categories: ['Fundamentals'],
        },
      ],
    });
    const hits = await searchContent({ q: 'images' });
    expect(hits).toEqual([
      {
        id: 'knowledgeBase_3',
        collection: 'knowledgeBase',
        label: 'Knowledge Hub',
        title: 'Images and Containers',
        description: 'How static artifacts become running processes.',
        href: '/knowledge-hub/images-and-containers',
        categories: ['Fundamentals'],
      },
    ]);
  });

  test('drops hits that have no resolvable URL', async () => {
    fetchCMS.mockResolvedValueOnce({
      ok: true,
      hits: [
        { id: 'a_1', collection: 'blogs', title: 'No URL', categories: [] },
        {
          id: 'b_2',
          collection: 'news',
          title: 'Has URL',
          url: 'https://cleanstart.com/news/has-url',
          categories: [],
        },
      ],
    });
    const hits = await searchContent({ q: 'x' });
    expect(hits.map((h) => h.id)).toEqual(['b_2']);
  });

  test('returns [] when the CMS call throws', async () => {
    fetchCMS.mockRejectedValueOnce(new Error('boom'));
    expect(await searchContent({ q: 'kubernetes' })).toEqual([]);
  });

  test('returns [] when the response shape is unexpected', async () => {
    fetchCMS.mockResolvedValueOnce({ unexpected: true });
    expect(await searchContent({ q: 'kubernetes' })).toEqual([]);
  });
});
