import { describe, expect, it } from 'vitest';

import { extractAllLinks, extractLinksFromLexical } from './extract';

const wrap = (children: unknown[]) => ({ root: { children } });

describe('extractLinksFromLexical', () => {
  it('captures the visible anchor text of a link', () => {
    const body = wrap([
      {
        type: 'link',
        fields: { url: 'https://example.com/a' },
        children: [{ type: 'text', text: 'click ' }, { type: 'text', text: 'here' }],
      },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://example.com/a', anchorText: 'click here' },
    ]);
  });

  it('returns null anchor text when the link has no text children', () => {
    const body = wrap([{ type: 'autolink', fields: { url: 'https://example.com/b' } }]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://example.com/b', anchorText: null },
    ]);
  });

  it('keeps the first anchor text when a url repeats', () => {
    const body = wrap([
      { type: 'link', fields: { url: 'https://dup.example' }, children: [{ type: 'text', text: 'first' }] },
      { type: 'link', fields: { url: 'https://dup.example' }, children: [{ type: 'text', text: 'second' }] },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://dup.example', anchorText: 'first' },
    ]);
  });

  it('skips internal-doc relationships', () => {
    const body = wrap([
      { type: 'link', fields: { linkType: 'internal', url: '/foo' } },
      { type: 'link', fields: { doc: { value: 1 }, url: '/bar' } },
      { type: 'link', fields: { url: 'https://external.example' }, children: [{ type: 'text', text: 'x' }] },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://external.example', anchorText: 'x' },
    ]);
  });

  it('walks nested children', () => {
    const body = wrap([
      {
        type: 'paragraph',
        children: [{ type: 'link', fields: { url: 'https://nested.example/a' }, children: [{ type: 'text', text: 'n' }] }],
      },
    ]);
    expect(extractLinksFromLexical(body)).toEqual([
      { url: 'https://nested.example/a', anchorText: 'n' },
    ]);
  });

  it('returns [] for empty / non-object input', () => {
    expect(extractLinksFromLexical(null)).toEqual([]);
    expect(extractLinksFromLexical({})).toEqual([]);
  });
});

describe('extractAllLinks', () => {
  it('labels body links as Body and typed fields by name', () => {
    const links = extractAllLinks({
      body: wrap([{ type: 'link', fields: { url: 'https://body.example' }, children: [{ type: 'text', text: 'read' }] }]),
      applyUrl: 'https://apply.example',
      registrationUrl: 'https://register.example',
      seo: { canonicalOverride: 'https://canonical.example' },
    });
    expect(links).toEqual(
      expect.arrayContaining([
        { url: 'https://body.example', anchorText: 'read', location: 'Body' },
        { url: 'https://apply.example', anchorText: null, location: 'Apply URL' },
        { url: 'https://register.example', anchorText: null, location: 'Registration URL' },
        { url: 'https://canonical.example', anchorText: null, location: 'Canonical override' },
      ]),
    );
  });

  it('drops site-relative URLs and non-string scalar fields', () => {
    const links = extractAllLinks({ body: null, applyUrl: '/internal-path', registrationUrl: null, atsUrl: 42 });
    expect(links).toEqual([]);
  });

  it('deduplicates URLs across sources, body winning', () => {
    const links = extractAllLinks({
      body: wrap([{ type: 'link', fields: { url: 'https://shared.example' }, children: [{ type: 'text', text: 'body' }] }]),
      applyUrl: 'https://shared.example',
    });
    expect(links).toEqual([{ url: 'https://shared.example', anchorText: 'body', location: 'Body' }]);
  });

  it('drops editor-planted internal / metadata / loopback URLs (SSRF guard)', () => {
    const links = extractAllLinks({
      body: wrap([
        { type: 'link', fields: { url: 'https://public.example' }, children: [{ type: 'text', text: 'ok' }] },
        { type: 'link', fields: { url: 'http://169.254.169.254/latest/meta-data/' } },
        { type: 'link', fields: { url: 'http://localhost/admin' } },
        { type: 'link', fields: { url: 'http://10.0.0.5/' } },
      ]),
      applyUrl: 'http://[::1]/',
      seo: { canonicalOverride: 'http://internal.local/' },
    });
    expect(links).toEqual([{ url: 'https://public.example', anchorText: 'ok', location: 'Body' }]);
  });
});
