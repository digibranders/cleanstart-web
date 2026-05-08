import { describe, expect, it } from 'vitest';

import { extractAllLinks, extractLinksFromLexical } from './extract';

const wrap = (children: unknown[]) => ({ root: { children } });

describe('extractLinksFromLexical', () => {
  it('returns external link URLs from lexical anchor nodes', () => {
    const body = wrap([
      { type: 'link', fields: { url: 'https://example.com/a' } },
      { type: 'autolink', fields: { url: 'https://example.com/b' } },
    ]);
    const links = extractLinksFromLexical(body);
    expect(links).toEqual(expect.arrayContaining(['https://example.com/a', 'https://example.com/b']));
  });

  it('skips internal-doc relationships', () => {
    const body = wrap([
      { type: 'link', fields: { linkType: 'internal', url: '/foo' } },
      { type: 'link', fields: { doc: { value: 1 }, url: '/bar' } },
      { type: 'link', fields: { url: 'https://external.example' } },
    ]);
    expect(extractLinksFromLexical(body)).toEqual(['https://external.example']);
  });

  it('walks nested children', () => {
    const body = wrap([
      {
        type: 'paragraph',
        children: [
          { type: 'link', fields: { url: 'https://nested.example/a' } },
        ],
      },
    ]);
    expect(extractLinksFromLexical(body)).toEqual(['https://nested.example/a']);
  });

  it('returns [] for empty / non-object input', () => {
    expect(extractLinksFromLexical(null)).toEqual([]);
    expect(extractLinksFromLexical({})).toEqual([]);
  });
});

describe('extractAllLinks', () => {
  it('combines body links with scalar URL fields and seo.canonicalOverride', () => {
    const links = extractAllLinks({
      body: wrap([{ type: 'link', fields: { url: 'https://body.example/a' } }]),
      applyUrl: 'https://apply.example',
      registrationUrl: 'https://register.example',
      seo: { canonicalOverride: 'https://canonical.example' },
    });
    expect(links).toEqual(
      expect.arrayContaining([
        'https://body.example/a',
        'https://apply.example',
        'https://register.example',
        'https://canonical.example',
      ]),
    );
  });

  it('drops site-relative URLs and non-string scalar fields', () => {
    const links = extractAllLinks({
      body: null,
      applyUrl: '/internal-path',
      registrationUrl: null,
      atsUrl: 42,
    });
    expect(links).toEqual([]);
  });

  it('deduplicates URLs that appear in multiple sources', () => {
    const links = extractAllLinks({
      body: wrap([{ type: 'link', fields: { url: 'https://shared.example' } }]),
      applyUrl: 'https://shared.example',
    });
    expect(links).toEqual(['https://shared.example']);
  });

  it('drops editor-planted internal / metadata / loopback URLs (SSRF guard)', () => {
    const links = extractAllLinks({
      body: wrap([
        { type: 'link', fields: { url: 'https://public.example' } },
        { type: 'link', fields: { url: 'http://169.254.169.254/latest/meta-data/' } },
        { type: 'link', fields: { url: 'http://localhost/admin' } },
        { type: 'link', fields: { url: 'http://10.0.0.5/' } },
      ]),
      applyUrl: 'http://[::1]/',
      seo: { canonicalOverride: 'http://internal.local/' },
    });
    expect(links).toEqual(['https://public.example']);
  });
});
