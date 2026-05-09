import { describe, expect, it } from 'vitest';

import { lintHreflang, lintSummary } from './hreflang-lint';

describe('lintHreflang', () => {
  it('returns no issues for empty rows', () => {
    expect(lintHreflang({ rows: [] })).toEqual([]);
  });

  it('passes a clean cluster (BCP-47 codes, x-default, self-ref, https)', () => {
    const issues = lintHreflang({
      rows: [
        { hreflang: 'en-US', href: 'https://x/us' },
        { hreflang: 'en-AE', href: 'https://x/ae' },
        { hreflang: 'x-default', href: 'https://x/' },
      ],
      selfHref: 'https://x/us',
    });
    expect(issues).toEqual([]);
  });

  it('flags invalid BCP-47 codes', () => {
    const issues = lintHreflang({
      rows: [
        { hreflang: '', href: 'https://x/a' }, // empty
        { hreflang: 'EN_US', href: 'https://x/b' }, // underscore (must be hyphen)
        { hreflang: 'en-INVALID', href: 'https://x/c' }, // 7-letter region
        { hreflang: 'english', href: 'https://x/d' }, // 7-letter language (max is 3)
        { hreflang: 'en-US', href: 'https://x/e' }, // valid
        { hreflang: 'x-default', href: 'https://x/' }, // valid special
      ],
    });
    const bcp47 = issues.find((i) => i.code === 'invalid-bcp47');
    expect(bcp47).toBeDefined();
    expect(bcp47?.rowIndices).toEqual([0, 1, 2, 3]);
  });

  it('flags duplicate codes case-insensitively', () => {
    const issues = lintHreflang({
      rows: [
        { hreflang: 'en-US', href: 'https://x/us-a' },
        { hreflang: 'EN-US', href: 'https://x/us-b' },
        { hreflang: 'de', href: 'https://x/de' },
        { hreflang: 'x-default', href: 'https://x/' },
      ],
    });
    const dup = issues.find((i) => i.code === 'duplicate-code');
    expect(dup).toBeDefined();
    expect(dup?.rowIndices).toEqual([0, 1]);
  });

  it('flags missing self-ref when selfHref is provided', () => {
    const issues = lintHreflang({
      rows: [
        { hreflang: 'en-US', href: 'https://x/us' },
        { hreflang: 'x-default', href: 'https://x/' },
      ],
      selfHref: 'https://x/de',
    });
    expect(issues.some((i) => i.code === 'missing-self-ref')).toBe(true);
  });

  it('passes self-ref check when an alternate href matches selfHref (trailing-slash insensitive)', () => {
    const issues = lintHreflang({
      rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
      selfHref: 'https://x/us/',
    });
    expect(issues.some((i) => i.code === 'missing-self-ref')).toBe(false);
  });

  it('does NOT flag missing self-ref when selfHref is null/undefined', () => {
    const issues = lintHreflang({
      rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
    });
    expect(issues.some((i) => i.code === 'missing-self-ref')).toBe(false);
  });

  it('flags missing x-default as info', () => {
    const issues = lintHreflang({
      rows: [{ hreflang: 'en-US', href: 'https://x/us' }],
    });
    const info = issues.find((i) => i.code === 'missing-x-default');
    expect(info?.severity).toBe('info');
  });

  it('flags relative hrefs', () => {
    const issues = lintHreflang({
      rows: [
        { hreflang: 'en-US', href: '/us' },
        { hreflang: 'x-default', href: 'https://x/' },
      ],
    });
    expect(issues.some((i) => i.code === 'non-absolute-href')).toBe(true);
  });
});

describe('lintSummary', () => {
  it('counts warnings and infos', () => {
    expect(
      lintSummary([
        { severity: 'warning', code: 'invalid-bcp47', message: '', rowIndices: [] },
        { severity: 'warning', code: 'duplicate-code', message: '', rowIndices: [] },
        { severity: 'info', code: 'missing-x-default', message: '', rowIndices: [] },
      ]),
    ).toEqual({ warnings: 2, infos: 1 });
  });

  it('handles empty', () => {
    expect(lintSummary([])).toEqual({ warnings: 0, infos: 0 });
  });
});
