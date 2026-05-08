import { describe, expect, it } from 'vitest';

import { auditLexicalBody } from './lexical-audit';

const wrap = (children: unknown[]) => ({ root: { children } });

describe('auditLexicalBody', () => {
  it('returns zeros for an empty / non-object body', () => {
    expect(auditLexicalBody(null)).toEqual({
      internalLinks: 0,
      externalLinks: 0,
      totalImages: 0,
      imagesWithAlt: 0,
    });
    expect(auditLexicalBody({})).toEqual({
      internalLinks: 0,
      externalLinks: 0,
      totalImages: 0,
      imagesWithAlt: 0,
    });
  });

  it('counts internal links via linkType, doc relation, or leading-slash URL', () => {
    const body = wrap([
      { type: 'link', fields: { linkType: 'internal', url: '/foo' } },
      { type: 'link', fields: { doc: { value: 1 } } },
      { type: 'link', fields: { url: '/bar' } },
      { type: 'link', fields: { url: 'https://example.com' } },
    ]);
    expect(auditLexicalBody(body)).toMatchObject({
      internalLinks: 3,
      externalLinks: 1,
    });
  });

  it('counts an autolink by node type', () => {
    const body = wrap([{ type: 'autolink', fields: { url: 'https://x.com' } }]);
    expect(auditLexicalBody(body).externalLinks).toBe(1);
  });

  it('counts upload + image nodes as images', () => {
    const body = wrap([
      { type: 'upload', altText: 'A clear caption' },
      { type: 'image', alt: '' },
      { type: 'inline-image', fields: { altText: 'inline alt' } },
      { type: 'paragraph', children: [{ text: 'no image' }] },
    ]);
    const result = auditLexicalBody(body);
    expect(result.totalImages).toBe(3);
    expect(result.imagesWithAlt).toBe(2);
  });

  it('walks nested children recursively', () => {
    const body = wrap([
      {
        type: 'paragraph',
        children: [
          { type: 'link', fields: { url: 'https://nested.example' } },
          { type: 'image', altText: 'nested' },
        ],
      },
    ]);
    expect(auditLexicalBody(body)).toEqual({
      internalLinks: 0,
      externalLinks: 1,
      totalImages: 1,
      imagesWithAlt: 1,
    });
  });

  it('skips link nodes with no URL and no doc relation', () => {
    const body = wrap([{ type: 'link', fields: { url: '' } }]);
    expect(auditLexicalBody(body)).toMatchObject({
      internalLinks: 0,
      externalLinks: 0,
    });
  });
});
