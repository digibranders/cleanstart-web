import { describe, expect, it } from 'vitest';

import { newsLinkToCanonicalPatch } from './news-canonical';

describe('newsLinkToCanonicalPatch', () => {
  it('emits a canonical patch for an external https URL', () => {
    expect(newsLinkToCanonicalPatch('https://techcrunch.com/2026/cleanstart-x')).toEqual({
      useCustomCanonical: true,
      canonicalOverride: 'https://techcrunch.com/2026/cleanstart-x',
    });
  });
  it('returns null for an http URL pointing back at cleanstart.com', () => {
    expect(newsLinkToCanonicalPatch('https://cleanstart.com/news/internal')).toBeNull();
    expect(newsLinkToCanonicalPatch('https://www.cleanstart.com/news/x')).toBeNull();
  });
  it('returns null for empty / non-string / non-URL input', () => {
    expect(newsLinkToCanonicalPatch('')).toBeNull();
    expect(newsLinkToCanonicalPatch('   ')).toBeNull();
    expect(newsLinkToCanonicalPatch(null)).toBeNull();
    expect(newsLinkToCanonicalPatch('not a url')).toBeNull();
    expect(newsLinkToCanonicalPatch(42)).toBeNull();
  });
  it('trims whitespace from the input', () => {
    const result = newsLinkToCanonicalPatch('  https://example.com/x  ');
    expect(result).toEqual({
      useCustomCanonical: true,
      canonicalOverride: 'https://example.com/x',
    });
  });
});
