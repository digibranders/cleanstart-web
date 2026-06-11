import { describe, expect, it } from 'vitest';

import {
  MAX_KEYWORD_LEN,
  MAX_KEYWORDS,
  mergeKeywordSources,
  normalizeKeywords,
} from './keywords';

describe('normalizeKeywords', () => {
  it('returns an empty array for non-array / nullish input', () => {
    expect(normalizeKeywords(null)).toEqual([]);
    expect(normalizeKeywords(undefined)).toEqual([]);
    expect(normalizeKeywords('sbom signing')).toEqual([]);
    expect(normalizeKeywords({})).toEqual([]);
  });

  it('trims, drops empties, and ignores non-string entries', () => {
    expect(normalizeKeywords(['  sbom  ', '', '   ', 42, null, 'fips'])).toEqual([
      'sbom',
      'fips',
    ]);
  });

  it('dedupes case-insensitively, keeping first-seen casing', () => {
    expect(normalizeKeywords(['SBOM', 'sbom', 'Sbom', 'FIPS'])).toEqual(['SBOM', 'FIPS']);
  });

  it('caps each keyword length', () => {
    const long = 'x'.repeat(MAX_KEYWORD_LEN + 20);
    expect(normalizeKeywords([long])[0]).toHaveLength(MAX_KEYWORD_LEN);
  });

  it('caps the total number of keywords', () => {
    const many = Array.from({ length: MAX_KEYWORDS + 10 }, (_, i) => `kw-${i}`);
    expect(normalizeKeywords(many)).toHaveLength(MAX_KEYWORDS);
  });
});

describe('mergeKeywordSources', () => {
  it('prefers primary order, then appends unique legacy entries', () => {
    expect(mergeKeywordSources(['sbom', 'fips'], ['FIPS', 'sca'])).toEqual([
      'sbom',
      'fips',
      'sca',
    ]);
  });

  it('falls back to legacy when primary is empty / not an array', () => {
    expect(mergeKeywordSources(null, ['sbom'])).toEqual(['sbom']);
    expect(mergeKeywordSources(undefined, ['sbom', 'sbom'])).toEqual(['sbom']);
  });

  it('returns an empty array when both sources are empty', () => {
    expect(mergeKeywordSources(null, [])).toEqual([]);
  });
});
