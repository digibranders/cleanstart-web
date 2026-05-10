import { describe, expect, it } from 'vitest';

import { validateCanonicalOverride } from './canonical';

describe('validateCanonicalOverride', () => {
  it('errors on empty input', () => {
    const check = validateCanonicalOverride('');
    expect(check.ok).toBe(false);
    if (!check.ok) {
      expect(check.issue).toBe('invalid-url');
      expect(check.severity).toBe('error');
    }
  });

  it('errors on null / undefined', () => {
    expect(validateCanonicalOverride(null).ok).toBe(false);
    expect(validateCanonicalOverride(undefined).ok).toBe(false);
  });

  it('errors on malformed URL', () => {
    const check = validateCanonicalOverride('not a url');
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issue).toBe('invalid-url');
  });

  it('errors on http (must be https)', () => {
    const check = validateCanonicalOverride('http://example.com/post');
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issue).toBe('not-https');
  });

  it('passes same-domain canonical (cleanstart.com) — legitimate for facets / params / migrated URLs', () => {
    expect(
      validateCanonicalOverride('https://cleanstart.com/blogs/sbom-101').ok,
    ).toBe(true);
  });

  it('passes same-domain canonical (www.cleanstart.com)', () => {
    expect(
      validateCanonicalOverride('https://www.cleanstart.com/blogs/sbom-101').ok,
    ).toBe(true);
  });

  it('warns on URLs with query strings', () => {
    const check = validateCanonicalOverride('https://example.com/post?utm=x');
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issue).toBe('has-query-or-fragment');
  });

  it('warns on URLs with fragments', () => {
    const check = validateCanonicalOverride('https://example.com/post#section');
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.issue).toBe('has-query-or-fragment');
  });

  it('passes a clean cross-domain HTTPS canonical', () => {
    expect(validateCanonicalOverride('https://medium.com/@me/sbom-101').ok).toBe(true);
  });
});
