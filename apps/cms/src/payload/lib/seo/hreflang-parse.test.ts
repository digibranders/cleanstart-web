import { describe, expect, it } from 'vitest';

import { parseHreflangPaste } from './hreflang-parse';

describe('parseHreflangPaste', () => {
  it('returns empty result for null / empty / whitespace', () => {
    expect(parseHreflangPaste(null)).toEqual({ rows: [], unparsed: [] });
    expect(parseHreflangPaste(undefined)).toEqual({ rows: [], unparsed: [] });
    expect(parseHreflangPaste('')).toEqual({ rows: [], unparsed: [] });
    expect(parseHreflangPaste('   \n  ')).toEqual({ rows: [], unparsed: [] });
  });

  it('parses a single double-quoted alternate', () => {
    const out = parseHreflangPaste(
      '<link rel="alternate" hreflang="en-US" href="https://example.com/us/">',
    );
    expect(out.rows).toEqual([{ hreflang: 'en-US', href: 'https://example.com/us/' }]);
    expect(out.unparsed).toEqual([]);
  });

  it('parses multiple lines (the editor real-world case)', () => {
    const input = `
      <link rel="alternate" hreflang="en-US" href="https://eventussecurity.com/us/x/">
      <link rel="alternate" hreflang="en-SA" href="https://eventussecurity.com/saudi-arabia/x/">
      <link rel="alternate" hreflang="en-IN" href="https://eventussecurity.com/india/x/">
    `;
    const out = parseHreflangPaste(input);
    expect(out.rows).toEqual([
      { hreflang: 'en-US', href: 'https://eventussecurity.com/us/x/' },
      { hreflang: 'en-SA', href: 'https://eventussecurity.com/saudi-arabia/x/' },
      { hreflang: 'en-IN', href: 'https://eventussecurity.com/india/x/' },
    ]);
    expect(out.unparsed).toEqual([]);
  });

  it('handles attribute order rel before / after hreflang / href', () => {
    const out = parseHreflangPaste(
      '<link href="https://x/y" hreflang="de" rel="alternate"/>',
    );
    expect(out.rows).toEqual([{ hreflang: 'de', href: 'https://x/y' }]);
  });

  it('accepts single-quoted and unquoted attrs', () => {
    const out = parseHreflangPaste(
      "<link rel='alternate' hreflang='fr-FR' href='https://x/fr'>" +
        '<link rel=alternate hreflang=es href=https://x/es>',
    );
    expect(out.rows).toEqual([
      { hreflang: 'fr-FR', href: 'https://x/fr' },
      { hreflang: 'es', href: 'https://x/es' },
    ]);
  });

  it('handles self-closing and HTML5 terminators', () => {
    const out = parseHreflangPaste(
      '<link rel="alternate" hreflang="a" href="x"/><link rel="alternate" hreflang="b" href="y">',
    );
    expect(out.rows).toEqual([
      { hreflang: 'a', href: 'x' },
      { hreflang: 'b', href: 'y' },
    ]);
  });

  it('skips non-alternate <link> tags', () => {
    const out = parseHreflangPaste(
      '<link rel="canonical" href="https://x/canonical">' +
        '<link rel="stylesheet" href="/style.css">' +
        '<link rel="alternate" hreflang="en" href="https://x/en">',
    );
    expect(out.rows).toEqual([{ hreflang: 'en', href: 'https://x/en' }]);
  });

  it('reports lines missing hreflang or href as unparsed', () => {
    const out = parseHreflangPaste(
      '<link rel="alternate" href="https://x/y">' + // missing hreflang
        '<link rel="alternate" hreflang="en">' + // missing href
        '<link rel="alternate" hreflang="de" href="https://x/de">',
    );
    expect(out.rows).toEqual([{ hreflang: 'de', href: 'https://x/de' }]);
    expect(out.unparsed).toHaveLength(2);
  });

  it('dedupes identical hreflang + href pairs (case-insensitive on hreflang)', () => {
    const out = parseHreflangPaste(
      '<link rel="alternate" hreflang="EN-US" href="https://x/us">' +
        '<link rel="alternate" hreflang="en-US" href="https://x/us">' +
        '<link rel="alternate" hreflang="en-US" href="https://x/different">',
    );
    expect(out.rows).toEqual([
      { hreflang: 'EN-US', href: 'https://x/us' },
      { hreflang: 'en-US', href: 'https://x/different' },
    ]);
  });

  it('preserves x-default exactly', () => {
    const out = parseHreflangPaste(
      '<link rel="alternate" hreflang="x-default" href="https://example.com/">',
    );
    expect(out.rows).toEqual([{ hreflang: 'x-default', href: 'https://example.com/' }]);
  });

  it('handles wrapped attribute lines', () => {
    const out = parseHreflangPaste(`
      <link
        rel="alternate"
        hreflang="ar-AE"
        href="https://example.com/ae/ar/" />
    `);
    expect(out.rows).toEqual([{ hreflang: 'ar-AE', href: 'https://example.com/ae/ar/' }]);
  });
});
