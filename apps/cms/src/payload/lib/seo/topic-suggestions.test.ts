import { describe, expect, it } from 'vitest';

import { facetToSuggestions } from './topic-suggestions';

describe('facetToSuggestions', () => {
  const dist = { SBOM: 12, FIPS: 8, 'FIPS 140-3': 3, SCA: 5 };

  it('returns [] for undefined distribution', () => {
    expect(facetToSuggestions(undefined, '', 10)).toEqual([]);
  });

  it('sorts by count desc, then value asc, and caps at limit', () => {
    expect(facetToSuggestions(dist, '', 2)).toEqual([
      { value: 'SBOM', count: 12 },
      { value: 'FIPS', count: 8 },
    ]);
  });

  it('filters case-insensitively by substring', () => {
    expect(facetToSuggestions(dist, 'fips', 10)).toEqual([
      { value: 'FIPS', count: 8 },
      { value: 'FIPS 140-3', count: 3 },
    ]);
  });

  it('empty prefix returns everything (sorted)', () => {
    expect(facetToSuggestions(dist, '   ', 10).map((s) => s.value)).toEqual([
      'SBOM',
      'FIPS',
      'SCA',
      'FIPS 140-3',
    ]);
  });
});
