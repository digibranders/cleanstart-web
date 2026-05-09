import { describe, expect, it } from 'vitest';

import { parseHeadTags, summariseParse } from './parse-head-tags';

describe('parseHeadTags', () => {
  it('returns empty buckets for null / empty / whitespace', () => {
    expect(parseHeadTags(null)).toEqual({
      alternates: [],
      metaTags: [],
      commentCount: 0,
      unrecognised: [],
    });
    expect(parseHeadTags('')).toEqual({
      alternates: [],
      metaTags: [],
      commentCount: 0,
      unrecognised: [],
    });
  });

  it('sorts the editor real-world mixed paste', () => {
    const out = parseHeadTags(`
      <!-- Eventus US site -->
      <link rel="alternate" hreflang="en-US" href="https://eventussecurity.com/usa/x">
      <link rel="alternate" hreflang="en-IN" href="https://eventussecurity.com/india/x">
      <meta name="news_keywords" content="cyber, soc">
      <meta property="og:video" content="https://x/y.mp4">
    `);
    expect(out.alternates).toEqual([
      { hreflang: 'en-US', href: 'https://eventussecurity.com/usa/x' },
      { hreflang: 'en-IN', href: 'https://eventussecurity.com/india/x' },
    ]);
    expect(out.metaTags).toEqual([
      { kind: 'meta-name', key: 'news_keywords', content: 'cyber, soc' },
      { kind: 'meta-property', key: 'og:video', content: 'https://x/y.mp4' },
    ]);
    expect(out.commentCount).toBe(1);
    expect(out.unrecognised).toEqual([]);
  });

  it('counts multiple comments', () => {
    const out = parseHeadTags(`
      <!-- one -->
      <!-- two
           multi-line -->
      <link rel="alternate" hreflang="en" href="https://x/">
    `);
    expect(out.commentCount).toBe(2);
  });

  it('does not get confused when a comment surrounds a tag', () => {
    const out = parseHeadTags(
      '<!-- <link rel="alternate" hreflang="en" href="https://x/"> -->',
    );
    expect(out.alternates).toEqual([]);
    expect(out.commentCount).toBe(1);
  });

  it('skips non-alternate <link> tags as unrecognised', () => {
    const out = parseHeadTags(
      '<link rel="canonical" href="https://x/">' +
        '<link rel="stylesheet" href="/main.css">' +
        '<link rel="alternate" hreflang="de" href="https://x/de">',
    );
    expect(out.alternates).toEqual([{ hreflang: 'de', href: 'https://x/de' }]);
    expect(out.unrecognised).toHaveLength(2);
  });

  it('flags <meta> tags missing content as unrecognised', () => {
    const out = parseHeadTags(
      '<meta name="news_keywords">' + '<meta name="x" content="y">',
    );
    expect(out.metaTags).toEqual([{ kind: 'meta-name', key: 'x', content: 'y' }]);
    expect(out.unrecognised).toHaveLength(1);
  });

  it('dedupes alternates by hreflang+href (case-insensitive)', () => {
    const out = parseHeadTags(
      '<link rel="alternate" hreflang="EN-US" href="https://x/us">' +
        '<link rel="alternate" hreflang="en-US" href="https://x/us">' +
        '<link rel="alternate" hreflang="en-US" href="https://x/diff">',
    );
    expect(out.alternates).toEqual([
      { hreflang: 'EN-US', href: 'https://x/us' },
      { hreflang: 'en-US', href: 'https://x/diff' },
    ]);
  });

  it('handles single-quoted, unquoted, and self-closing tags', () => {
    const out = parseHeadTags(
      "<link rel='alternate' hreflang='fr' href='https://x/fr'/>" +
        '<meta name=robots content=index>',
    );
    expect(out.alternates).toEqual([{ hreflang: 'fr', href: 'https://x/fr' }]);
    expect(out.metaTags).toEqual([
      { kind: 'meta-name', key: 'robots', content: 'index' },
    ]);
  });

  it('ignores meta tags without name or property', () => {
    const out = parseHeadTags('<meta charset="utf-8"><meta http-equiv="x" content="y">');
    expect(out.metaTags).toEqual([]);
    expect(out.unrecognised).toHaveLength(2);
  });
});

describe('summariseParse', () => {
  it('describes alternates and meta tags together', () => {
    expect(
      summariseParse(
        { alternates: [], metaTags: [], commentCount: 0, unrecognised: [] },
        { addedAlternates: 3, addedMetaTags: 2 },
      ),
    ).toBe('Added 3 language versions and 2 meta tags.');
  });

  it('handles singular vs plural', () => {
    expect(
      summariseParse(
        { alternates: [], metaTags: [], commentCount: 0, unrecognised: [] },
        { addedAlternates: 1, addedMetaTags: 1 },
      ),
    ).toBe('Added 1 language version and 1 meta tag.');
  });

  it('mentions ignored comments and unrecognised lines', () => {
    expect(
      summariseParse(
        {
          alternates: [],
          metaTags: [],
          commentCount: 2,
          unrecognised: ['<link rel="canonical">'],
        },
        { addedAlternates: 1, addedMetaTags: 0 },
      ),
    ).toBe(
      'Added 1 language version (2 comments ignored, 1 line couldn\'t be read).',
    );
  });

  it('says "Nothing to add" when nothing was added', () => {
    expect(
      summariseParse(
        { alternates: [], metaTags: [], commentCount: 0, unrecognised: [] },
        { addedAlternates: 0, addedMetaTags: 0 },
      ),
    ).toBe('Nothing to add.');
  });
});
