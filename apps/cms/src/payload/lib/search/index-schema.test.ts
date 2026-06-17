import { describe, expect, it } from 'vitest';

import {
  INDEX_SETTINGS,
  INDEX_UID,
  SEARCH_INDEXED_COLLECTIONS,
  buildSearchDocument,
  buildSearchDocumentId,
  isIndexable,
  isSearchIndexedCollection,
} from './index-schema';

describe('INDEX_SETTINGS', () => {
  it('puts collectionWeight last in ranking rules so default ordering still wins ties', () => {
    expect(INDEX_SETTINGS.rankingRules).toEqual([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'collectionWeight:desc',
    ]);
  });

  it('declares title first among searchable attributes', () => {
    expect(INDEX_SETTINGS.searchableAttributes?.[0]).toBe('title');
  });

  it('declares collection as filterable for cross-collection search', () => {
    expect(INDEX_SETTINGS.filterableAttributes).toContain('collection');
  });

  it('uses `id` as the primary key', () => {
    expect(INDEX_SETTINGS.primaryKey).toBe('id');
  });
});

describe('isSearchIndexedCollection', () => {
  it('reports the locked-in catalog from arch doc §sitemap.xml', () => {
    expect(isSearchIndexedCollection('blogs')).toBe(true);
    expect(isSearchIndexedCollection('knowledgeBase')).toBe(true);
    expect(isSearchIndexedCollection('authors')).toBe(true);
    expect(isSearchIndexedCollection('users')).toBe(false);
    expect(isSearchIndexedCollection('media')).toBe(false);
    expect(isSearchIndexedCollection('leads')).toBe(false);
  });

  it('matches the SEARCH_INDEXED_COLLECTIONS list verbatim', () => {
    expect(SEARCH_INDEXED_COLLECTIONS).toContain('pages');
    expect(SEARCH_INDEXED_COLLECTIONS).not.toContain('redirects');
  });
});

describe('isIndexable', () => {
  it('drops drafts', () => {
    expect(isIndexable({ _status: 'draft' })).toBe(false);
  });

  it('drops noindex / noindex,nofollow', () => {
    expect(isIndexable({ seo: { indexable: 'noindex' } })).toBe(false);
    expect(isIndexable({ seo: { indexable: 'noindex,nofollow' } })).toBe(false);
  });

  it('keeps published + index docs', () => {
    expect(isIndexable({ _status: 'published', seo: { indexable: 'index' } })).toBe(true);
  });

  it('keeps unversioned docs (collections without drafts) by default', () => {
    expect(isIndexable({})).toBe(true);
  });
});

describe('buildSearchDocument', () => {
  it('returns null when id is missing', () => {
    expect(
      buildSearchDocument('https://cleanstart.com', 'blogs', { title: 'Example' }),
    ).toBeNull();
  });

  it('returns null when title and name are both missing', () => {
    expect(
      buildSearchDocument('https://cleanstart.com', 'blogs', { id: 1 }),
    ).toBeNull();
  });

  it('builds the canonical doc shape for a blog post', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 42,
      slug: 'my-post',
      title: 'My Post',
      abstract: 'A short lede.',
      _status: 'published',
      publishedAt: '2026-05-01',
      updatedAt: '2026-05-05',
      authors: [{ slug: 'jane', name: 'Jane Doe' }, 5, null],
      categories: [{ slug: 'sec', name: 'Container security' }],
    });
    expect(doc).toMatchObject({
      id: 'blogs_42',
      collection: 'blogs',
      title: 'My Post',
      description: 'A short lede.',
      url: 'https://cleanstart.com/blogs/my-post',
      slug: 'my-post',
      publishedAt: '2026-05-01',
      updatedAt: '2026-05-05',
      authors: ['Jane Doe'],
      categories: ['Container security'],
      isPublished: true,
    });
    expect(doc?.collectionWeight).toBeGreaterThan(50);
  });

  it('falls back to publicationDate when publishedAt is unset (news)', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'news', {
      id: 1,
      slug: 'launch',
      title: 'Launch',
      publicationDate: '2026-05-04T09:00:00Z',
      _status: 'published',
    });
    expect(doc?.publishedAt).toBe('2026-05-04T09:00:00Z');
  });

  it('uses doc.path for pages when set', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'pages', {
      id: 1,
      slug: 'pricing',
      path: '/products/pricing',
      title: 'Pricing',
    });
    expect(doc?.url).toBe('https://cleanstart.com/products/pricing');
  });

  it('uses author.bioShort when description / abstract are absent', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'authors', {
      id: 1,
      slug: 'jane',
      name: 'Jane Doe',
      bioShort: 'Senior researcher.',
    });
    expect(doc?.title).toBe('Jane Doe');
    expect(doc?.description).toBe('Senior researcher.');
  });

  it('extracts plain text from a Lexical body', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              { text: 'Hello ' },
              { text: 'world', format: 1 },
              { text: '.' },
            ],
          },
          {
            type: 'paragraph',
            children: [{ text: 'Second paragraph.' }],
          },
        ],
      },
    };
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      body: lexical,
    });
    // Inline runs concatenate without a space; block paragraphs join with one.
    expect(doc?.body).toBe('Hello world. Second paragraph.');
  });

  it('drops empty author / category arrays from the output', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      authors: [42, null],
      categories: [],
    });
    expect(doc?.authors).toBeUndefined();
    expect(doc?.categories).toBeUndefined();
  });

  it('promotes the single `category` (knowledgeBase) into the categories array', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'knowledgeBase', {
      id: 1,
      slug: 'vex',
      title: 'VEX docs',
      category: { slug: 'standards', name: 'Emerging Standards' },
    });
    expect(doc?.categories).toEqual(['Emerging Standards']);
  });

  it('does not throw when a relationship field is a non-iterable shape', () => {
    // Payload can hand back a single related object (or a partially-resolved
    // value) where the type says array; indexing must not crash one doc.
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 7,
      slug: 'x',
      title: 'X',
      authors: { name: 'Solo Author' } as never,
      categories: { name: 'Lone Category' } as never,
    });
    expect(doc?.title).toBe('X');
    expect(doc?.authors).toBeUndefined();
    expect(doc?.categories).toBeUndefined();
  });

  it('indexes seo.keywords (preferring it over legacy keywords[])', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'blogs', {
      id: 7,
      slug: 'sbom-signing',
      title: 'SBOM signing',
      seo: { indexable: 'index', keywords: ['SBOM', 'FIPS'] },
    });
    expect(doc?.keywords).toEqual(['SBOM', 'FIPS']);
  });

  it('falls back to legacy guides keywords[] when seo.keywords is empty', () => {
    const doc = buildSearchDocument('https://cleanstart.com', 'guides', {
      id: 8,
      slug: 'nist-mapping',
      title: 'NIST mapping',
      keywords: [{ keyword: 'NIST' }, { keyword: 'k8s' }],
    } as never);
    expect(doc?.keywords).toEqual(['NIST', 'k8s']);
  });
});

describe('buildSearchDocumentId', () => {
  it('composes <collection>_<id>', () => {
    expect(buildSearchDocumentId('blogs', 42)).toBe('blogs_42');
    expect(buildSearchDocumentId('pages', 'home')).toBe('pages_home');
  });
});

describe('INDEX_UID', () => {
  it('is the cross-collection content index name', () => {
    expect(INDEX_UID).toBe('content');
  });
});
