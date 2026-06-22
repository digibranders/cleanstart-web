import { describe, expect, it } from 'vitest';

import { filterToMergeable, validatePartialOverride } from './filter-override';

const ctx = 'https://schema.org';
const article = { '@context': ctx, '@type': 'Article', headline: 'X' };
const webSite = { '@context': ctx, '@type': 'WebSite', name: 'Y' }; // site-wide / off-allowlist

describe('filterToMergeable (pageRegistry keep-valid/drop-invalid)', () => {
  it('keeps a single valid blob', () => {
    const r = filterToMergeable(article);
    expect(r.kept).toEqual(article);
    expect(r.dropped).toHaveLength(0);
  });

  it('drops the conflicting block, keeps the valid one (returns a single, not array)', () => {
    const r = filterToMergeable([article, webSite]);
    expect(r.kept).toEqual(article);
    expect(r.dropped.map((d) => d.type)).toContain('WebSite');
  });

  it('returns null when every block is dropped', () => {
    const r = filterToMergeable([webSite]);
    expect(r.kept).toBeNull();
    expect(r.dropped).toHaveLength(1);
  });

  it('passes through null/empty', () => {
    expect(filterToMergeable(null).kept).toBeNull();
    expect(filterToMergeable([]).kept).toBeNull();
  });
});

describe('validatePartialOverride', () => {
  it('accepts when at least one block would apply', () => {
    expect(validatePartialOverride([article, webSite])).toBe(true);
    expect(validatePartialOverride(article)).toBe(true);
    expect(validatePartialOverride(null)).toBe(true);
  });

  it('rejects when nothing would apply, explaining why', () => {
    const res = validatePartialOverride([webSite]);
    expect(res).not.toBe(true);
    expect(String(res)).toMatch(/WebSite/);
  });
});
