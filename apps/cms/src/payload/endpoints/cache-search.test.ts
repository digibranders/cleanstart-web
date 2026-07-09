import { describe, expect, it } from 'vitest';

import { normalizeSearchQuery } from './cache-search';

describe('normalizeSearchQuery', () => {
  it('returns a plain title/slug unchanged (trimmed)', () => {
    expect(normalizeSearchQuery('shift left')).toBe('shift left');
    expect(normalizeSearchQuery('  busybox-container-security-risk  ')).toBe(
      'busybox-container-security-risk',
    );
  });

  it('reduces a full page URL to its trailing slug segment', () => {
    expect(
      normalizeSearchQuery(
        'https://cleanstart.com/blogs/shift-left-moved-the-problem-integrate-left-solves-it',
      ),
    ).toBe('shift-left-moved-the-problem-integrate-left-solves-it');
  });

  it('reduces a bare path to its slug', () => {
    expect(normalizeSearchQuery('/blogs/sbom-101')).toBe('sbom-101');
  });

  it('strips a trailing slash, query string, and hash', () => {
    expect(normalizeSearchQuery('https://cleanstart.com/guides/hardened-container-image/')).toBe(
      'hardened-container-image',
    );
    expect(normalizeSearchQuery('/news/nginx-rift-exposes?utm_source=x#top')).toBe(
      'nginx-rift-exposes',
    );
  });
});
