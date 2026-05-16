import { describe, expect, it, vi } from 'vitest';

import {
  NEWS_SITEMAP_MAX_URLS,
  SITEMAP_COLLECTIONS,
  type SitemapPayload,
  collectNewsSitemapEntries,
  collectSitemapEntries,
} from './collect';

type FindResult = Awaited<ReturnType<SitemapPayload['find']>>;

const makeFind = (
  byCollection: Record<string, FindResult[]>,
): SitemapPayload['find'] => {
  const cursor: Record<string, number> = {};
  return vi.fn(async ({ collection }: { collection: string }) => {
    const pages = byCollection[collection] ?? [{ docs: [] } as FindResult];
    const i = cursor[collection] ?? 0;
    cursor[collection] = i + 1;
    return pages[i] ?? ({ docs: [] } as FindResult);
  });
};

const blankCollections = (): Record<string, FindResult[]> => {
  const map: Record<string, FindResult[]> = {};
  for (const c of SITEMAP_COLLECTIONS) {
    map[c.collection] = [{ docs: [] }];
  }
  return map;
};

describe('collectSitemapEntries', () => {
  it('emits the site root entry first', async () => {
    const payload: SitemapPayload = { find: makeFind(blankCollections()) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');
    expect(entries[0]).toEqual({
      loc: 'https://cleanstart.com/',
      changefreq: 'weekly',
      priority: 1.0,
    });
  });

  it('emits one detail entry per indexable published doc', async () => {
    const map = blankCollections();
    map.blogs = [
      {
        docs: [
          {
            slug: 'a',
            updatedAt: '2026-05-05T12:00:00Z',
            _status: 'published',
            seo: { indexable: 'index' },
          },
          {
            slug: 'b',
            updatedAt: '2026-05-04T12:00:00Z',
            _status: 'published',
          },
        ],
      },
    ];
    const payload: SitemapPayload = { find: makeFind(map) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');

    const blogEntries = entries.filter((e) => e.loc.startsWith('https://cleanstart.com/blog/'));
    expect(blogEntries.map((e) => e.loc)).toEqual([
      'https://cleanstart.com/blog/a',
      'https://cleanstart.com/blog/b',
    ]);
    expect(blogEntries[0]?.lastmod).toBe('2026-05-05T12:00:00Z');
    expect(blogEntries[0]?.changefreq).toBe('weekly');
    expect(blogEntries[0]?.priority).toBe(0.7);
  });

  it('drops drafts and noindex docs', async () => {
    const map = blankCollections();
    map.blogs = [
      {
        docs: [
          { slug: 'published', updatedAt: '2026-05-05', _status: 'published' },
          { slug: 'draft', updatedAt: '2026-05-05', _status: 'draft' },
          {
            slug: 'noindex',
            updatedAt: '2026-05-05',
            _status: 'published',
            seo: { indexable: 'noindex' },
          },
          {
            slug: 'noindex-nofollow',
            updatedAt: '2026-05-05',
            _status: 'published',
            seo: { indexable: 'noindex,nofollow' },
          },
        ],
      },
    ];
    const payload: SitemapPayload = { find: makeFind(map) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');
    const blogEntries = entries.filter((e) => e.loc.startsWith('https://cleanstart.com/blog/'));
    expect(blogEntries.map((e) => e.loc)).toEqual(['https://cleanstart.com/blog/published']);
  });

  it('emits a listing entry for each collection that has a listingPath', async () => {
    const map = blankCollections();
    map.blogs = [
      {
        docs: [
          { slug: 'recent', updatedAt: '2026-05-05T12:00:00Z', _status: 'published' },
        ],
      },
    ];
    const payload: SitemapPayload = { find: makeFind(map) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');

    const listing = entries.find((e) => e.loc === 'https://cleanstart.com/blogs');
    expect(listing).toBeDefined();
    expect(listing?.lastmod).toBe('2026-05-05T12:00:00Z');
    // listing priority is 0.1 above the default, capped at 1.
    expect(listing?.priority).toBeCloseTo(0.8);
  });

  it('uses doc.path for pages when available', async () => {
    const map = blankCollections();
    map.pages = [
      {
        docs: [
          {
            slug: 'pricing',
            path: '/products/pricing',
            updatedAt: '2026-05-05T12:00:00Z',
            _status: 'published',
          },
        ],
      },
    ];
    const payload: SitemapPayload = { find: makeFind(map) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');
    const pageEntry = entries.find((e) => e.loc.includes('/products/pricing'));
    expect(pageEntry?.loc).toBe('https://cleanstart.com/products/pricing');
  });

  it('paginates through multi-page collection results', async () => {
    const map = blankCollections();
    map.blogs = [
      {
        docs: [{ slug: 'p1', updatedAt: '2026-05-05', _status: 'published' }],
        hasNextPage: true,
      },
      {
        docs: [{ slug: 'p2', updatedAt: '2026-05-04', _status: 'published' }],
        hasNextPage: false,
      },
    ];
    const payload: SitemapPayload = { find: makeFind(map) };
    const entries = await collectSitemapEntries(payload, 'https://cleanstart.com');
    const slugs = entries
      .filter((e) => e.loc.startsWith('https://cleanstart.com/blog/'))
      .map((e) => e.loc);
    expect(slugs).toEqual([
      'https://cleanstart.com/blog/p1',
      'https://cleanstart.com/blog/p2',
    ]);
  });
});

describe('collectNewsSitemapEntries', () => {
  const fakeNow = new Date('2026-05-05T12:00:00Z');

  it('passes a 48h cutoff `where` clause to find', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] });
    const payload: SitemapPayload = { find };
    await collectNewsSitemapEntries(payload, {
      baseUrl: 'https://cleanstart.com',
      publicationName: 'CleanStart',
      publicationLanguage: 'en',
      now: fakeNow,
    });
    const args = find.mock.calls[0]?.[0] as {
      where?: { and: { _status?: unknown; publicationDate?: { greater_than_equal: string } }[] };
      limit?: number;
      sort?: string;
    };
    expect(args.limit).toBe(NEWS_SITEMAP_MAX_URLS);
    expect(args.sort).toBe('-publicationDate');
    const cutoff = args.where?.and.find((c) => 'publicationDate' in c)?.publicationDate
      ?.greater_than_equal;
    expect(cutoff).toBe('2026-05-03T12:00:00.000Z');
  });

  it('maps each news doc into a NewsSitemapEntry', async () => {
    const payload: SitemapPayload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          {
            slug: 'launch',
            title: 'Launch',
            publicationDate: '2026-05-04T09:00:00Z',
            _status: 'published',
          },
          {
            slug: 'rollout',
            title: 'Rollout',
            publicationDate: '2026-05-04T11:00:00Z',
            _status: 'published',
          },
        ],
      }),
    };
    const entries = await collectNewsSitemapEntries(payload, {
      baseUrl: 'https://cleanstart.com',
      publicationName: 'CleanStart',
      publicationLanguage: 'en',
      now: fakeNow,
    });
    expect(entries).toEqual([
      {
        loc: 'https://cleanstart.com/news/launch',
        publicationName: 'CleanStart',
        publicationLanguage: 'en',
        publicationDate: '2026-05-04T09:00:00Z',
        title: 'Launch',
      },
      {
        loc: 'https://cleanstart.com/news/rollout',
        publicationName: 'CleanStart',
        publicationLanguage: 'en',
        publicationDate: '2026-05-04T11:00:00Z',
        title: 'Rollout',
      },
    ]);
  });

  it('drops noindex / partial / unparseable rows', async () => {
    const payload: SitemapPayload = {
      find: vi.fn().mockResolvedValue({
        docs: [
          { slug: 'no-title', publicationDate: '2026-05-04', _status: 'published' },
          {
            slug: 'noindex',
            title: 'NoIndex',
            publicationDate: '2026-05-04',
            _status: 'published',
            seo: { indexable: 'noindex' },
          },
          {
            slug: 'no-date',
            title: 'NoDate',
            _status: 'published',
          },
          {
            slug: 'good',
            title: 'Good',
            publicationDate: '2026-05-04',
            _status: 'published',
          },
        ],
      }),
    };
    const entries = await collectNewsSitemapEntries(payload, {
      baseUrl: 'https://cleanstart.com',
      publicationName: 'CleanStart',
      publicationLanguage: 'en',
      now: fakeNow,
    });
    expect(entries.map((e) => e.loc)).toEqual(['https://cleanstart.com/news/good']);
  });
});
