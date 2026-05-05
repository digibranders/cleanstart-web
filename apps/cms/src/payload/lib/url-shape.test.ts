import { describe, expect, it } from 'vitest';

import { classifyUrlShape, isValidExternalLink } from './url-shape';

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
});
