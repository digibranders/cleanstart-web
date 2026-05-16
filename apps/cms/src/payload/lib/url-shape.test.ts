import { describe, expect, it } from 'vitest';

import {
  classifyUrlShape,
  isValidExternalLink,
  normalizeOptionalUrl,
  validateOptionalUrl,
} from './url-shape';

describe('classifyUrlShape', () => {
  it.each([
    ['https://cleanstart.com', 'url'],
    ['http://example.com/post?q=1', 'url'],
    ['https://www.example.com/a/b/c#frag', 'url'],
    ['/blogs/sbom-101', 'path'],
    ['/contact', 'path'],
    ['mailto:hire@cleanstart.com', 'mailto'],
    ['tel:+1-555-1234', 'tel'],
    ['tel:5551234', 'tel'],
  ])('classifies %s as %s', (input, expected) => {
    expect(classifyUrlShape(input)).toBe(expected);
  });

  it.each([
    ['', 'invalid'],
    ['   ', 'invalid'],
    [null, 'invalid'],
    [undefined, 'invalid'],
    ['just-some-text', 'invalid'],
    ['javascript:alert(1)', 'invalid'],
    ['ftp://files.example.com', 'invalid'],
    ['mailto:notvalid', 'invalid'],
    ['mailto:hire@', 'invalid'],
    // Protocol-relative URLs must NOT be classified as site paths — they'd
    // navigate off-site to the named host as an open redirect.
    ['//evil.com', 'invalid'],
    ['//evil.com/foo', 'invalid'],
  ])('rejects %s', (input, expected) => {
    expect(classifyUrlShape(input as string | null | undefined)).toBe(expected);
  });
});

describe('isValidExternalLink', () => {
  it('passes well-formed external URLs', () => {
    expect(isValidExternalLink('https://example.com')).toBe(true);
  });

  it('passes mailto and tel', () => {
    expect(isValidExternalLink('mailto:a@b.com')).toBe(true);
    expect(isValidExternalLink('tel:+1234')).toBe(true);
  });

  it('passes site-relative paths', () => {
    expect(isValidExternalLink('/contact')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidExternalLink('not a url')).toBe(false);
    expect(isValidExternalLink('')).toBe(false);
    expect(isValidExternalLink(null)).toBe(false);
  });

  it('rejects protocol-relative URLs (open-redirect bypass)', () => {
    expect(isValidExternalLink('//evil.com')).toBe(false);
    expect(isValidExternalLink('//evil.com/path')).toBe(false);
  });
});

describe('normalizeOptionalUrl', () => {
  it('returns null for blank/whitespace/non-string', () => {
    expect(normalizeOptionalUrl('')).toBeNull();
    expect(normalizeOptionalUrl('   ')).toBeNull();
    expect(normalizeOptionalUrl(null)).toBeNull();
    expect(normalizeOptionalUrl(undefined)).toBeNull();
    expect(normalizeOptionalUrl(42)).toBeNull();
  });

  it('leaves already-scheme-qualified URLs untouched (only trimming)', () => {
    expect(normalizeOptionalUrl('https://cleanstart.com')).toBe('https://cleanstart.com');
    expect(normalizeOptionalUrl('  http://example.com/post  ')).toBe('http://example.com/post');
    expect(normalizeOptionalUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizeOptionalUrl('tel:+1234')).toBe('tel:+1234');
    expect(normalizeOptionalUrl('/contact')).toBe('/contact');
  });

  it('auto-prepends https:// to bare domains', () => {
    expect(normalizeOptionalUrl('cleanstart.com')).toBe('https://cleanstart.com');
    expect(normalizeOptionalUrl('www.example.com')).toBe('https://www.example.com');
    expect(normalizeOptionalUrl('foo.co.uk')).toBe('https://foo.co.uk');
    expect(normalizeOptionalUrl('acme.dev:8080')).toBe('https://acme.dev:8080');
    expect(normalizeOptionalUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1');
  });

  it('passes garbage through untouched (the validator rejects)', () => {
    // No protocol, no dot → not a domain. Validator says no.
    expect(normalizeOptionalUrl('not a url')).toBe('not a url');
    expect(normalizeOptionalUrl('foo')).toBe('foo');
  });

  it('does not prepend to protocol-relative open-redirect vectors', () => {
    // `//evil.com` would otherwise look domain-ish; the leading slashes
    // are not part of any TLD, so the bare-domain pattern must reject.
    expect(normalizeOptionalUrl('//evil.com')).toBe('//evil.com');
  });
});

describe('validateOptionalUrl + normalizeOptionalUrl integration', () => {
  // The normalize hook runs before the validator. Together, a bare
  // domain must pass.
  it('accepts a bare domain after normalisation', () => {
    const normalized = normalizeOptionalUrl('cleanstart.com');
    expect(validateOptionalUrl(normalized)).toBe(true);
  });

  it('accepts null (blank optional field) after normalisation', () => {
    const normalized = normalizeOptionalUrl('');
    expect(validateOptionalUrl(normalized)).toBe(true);
  });

  it('still rejects garbage', () => {
    const normalized = normalizeOptionalUrl('not a url');
    expect(validateOptionalUrl(normalized)).not.toBe(true);
  });
});
