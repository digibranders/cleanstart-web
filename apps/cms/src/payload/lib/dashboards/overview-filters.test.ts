import { describe, expect, it } from 'vitest';

import { buildGa4DimensionFilter, buildOverviewCacheKey, WINDOW_DAYS } from './overview-filters';

describe('WINDOW_DAYS', () => {
  it('maps windows to day counts', () => {
    expect(WINDOW_DAYS['7d']).toBe(7);
    expect(WINDOW_DAYS['28d']).toBe(28);
    expect(WINDOW_DAYS['90d']).toBe(90);
  });
});

describe('buildOverviewCacheKey', () => {
  it('uses "all" for null filters', () => {
    expect(buildOverviewCacheKey('ga4', { window: '28d', country: null, collection: null })).toBe(
      'overview:ga4:28d:all:all',
    );
  });
  it('slugs country + collection', () => {
    expect(
      buildOverviewCacheKey('ga4', { window: '7d', country: 'United States', collection: 'blogs' }),
    ).toBe('overview:ga4:7d:united-states:blogs');
  });
});

describe('buildGa4DimensionFilter', () => {
  it('returns undefined when no filters set', () => {
    expect(buildGa4DimensionFilter(null, null)).toBeUndefined();
  });
  it('builds a country-only filter', () => {
    expect(buildGa4DimensionFilter('India', null)).toEqual({
      andGroup: {
        expressions: [
          { filter: { fieldName: 'country', stringFilter: { matchType: 'EXACT', value: 'India' } } },
        ],
      },
    });
  });
  it('builds a country + path-prefix filter', () => {
    const f = buildGa4DimensionFilter('India', '/blogs');
    expect(f?.andGroup?.expressions).toHaveLength(2);
    expect(f?.andGroup?.expressions?.[1]).toEqual({
      filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blogs' } },
    });
  });
});
