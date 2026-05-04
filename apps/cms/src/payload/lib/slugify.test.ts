import { describe, expect, it } from 'vitest';

import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('SBOM 101 Overview')).toBe('sbom-101-overview');
  });

  it('strips punctuation', () => {
    expect(slugify("What's the SBOM?")).toBe('what-s-the-sbom');
  });

  it('collapses runs of separators', () => {
    expect(slugify('one  --__  two')).toBe('one-two');
  });

  it('strips diacritics', () => {
    expect(slugify('Café São Paulo')).toBe('cafe-sao-paulo');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('---hello---')).toBe('hello');
  });

  it('returns empty string for null/undefined/empty', () => {
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
    expect(slugify('')).toBe('');
  });

  it('returns empty string for input of only punctuation', () => {
    expect(slugify('---')).toBe('');
  });
});
