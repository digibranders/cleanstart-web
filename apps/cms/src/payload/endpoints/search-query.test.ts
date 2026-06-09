import { describe, expect, it } from 'vitest';

import {
  buildContentFilter,
  mapSearchHit,
  parseSearchParams,
} from './search-query';

const params = (init: Record<string, string>): URLSearchParams =>
  new URLSearchParams(init);

describe('parseSearchParams', () => {
  it('accepts a plain query and applies the default limit', () => {
    const res = parseSearchParams(params({ q: 'kubernetes' }));
    expect(res).toEqual({ ok: true, data: { q: 'kubernetes', limit: 8 } });
  });

  it('trims the query', () => {
    const res = parseSearchParams(params({ q: '  fips  ' }));
    expect(res.ok && res.data.q).toBe('fips');
  });

  it('rejects an empty query with query_required', () => {
    expect(parseSearchParams(params({ q: '   ' }))).toEqual({
      ok: false,
      error: 'query_required',
    });
    expect(parseSearchParams(params({}))).toEqual({
      ok: false,
      error: 'query_required',
    });
  });

  it('keeps a known collection and drops an unknown one as invalid_params', () => {
    const ok = parseSearchParams(params({ q: 'x', collection: 'knowledgeBase' }));
    expect(ok.ok && ok.data.collection).toBe('knowledgeBase');

    expect(parseSearchParams(params({ q: 'x', collection: 'users' }))).toEqual({
      ok: false,
      error: 'invalid_params',
    });
  });

  it('coerces and clamps the limit, falling back on garbage', () => {
    const ok = parseSearchParams(params({ q: 'x', limit: '5' }));
    expect(ok.ok && ok.data.limit).toBe(5);
    // above MAX_LIMIT -> caught back to default
    const high = parseSearchParams(params({ q: 'x', limit: '999' }));
    expect(high.ok && high.data.limit).toBe(8);
    const garbage = parseSearchParams(params({ q: 'x', limit: 'abc' }));
    expect(garbage.ok && garbage.data.limit).toBe(8);
  });
});

describe('buildContentFilter', () => {
  it('always restricts to published content', () => {
    expect(buildContentFilter()).toBe('isPublished = true');
  });

  it('narrows to a collection when given', () => {
    expect(buildContentFilter('blogs')).toBe(
      "isPublished = true AND collection = 'blogs'",
    );
  });
});

describe('mapSearchHit', () => {
  it('maps a full hit to the trimmed wire shape', () => {
    expect(
      mapSearchHit({
        id: 'blogs_12',
        collection: 'blogs',
        collectionWeight: 100,
        title: 'Hello',
        description: 'A post',
        slug: 'hello',
        url: 'https://cleanstart.com/blogs/hello',
        categories: ['Security', 1, null, 'Containers'],
        body: 'should not be carried',
      }),
    ).toEqual({
      id: 'blogs_12',
      collection: 'blogs',
      title: 'Hello',
      description: 'A post',
      slug: 'hello',
      url: 'https://cleanstart.com/blogs/hello',
      categories: ['Security', 'Containers'],
    });
  });

  it('defaults a missing description to empty and categories to []', () => {
    expect(
      mapSearchHit({ id: 'news_1', collection: 'news', title: 'N' }),
    ).toEqual({
      id: 'news_1',
      collection: 'news',
      title: 'N',
      description: '',
      categories: [],
    });
  });

  it('drops a hit missing id, collection, or title', () => {
    expect(mapSearchHit({ collection: 'news', title: 'N' })).toBeNull();
    expect(mapSearchHit({ id: 'x', title: 'N' })).toBeNull();
    expect(mapSearchHit({ id: 'x', collection: 'news' })).toBeNull();
    expect(mapSearchHit(null)).toBeNull();
    expect(mapSearchHit('nope')).toBeNull();
  });
});
