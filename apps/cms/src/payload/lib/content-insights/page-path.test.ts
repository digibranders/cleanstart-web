import { describe, expect, it } from 'vitest';

import { docPath, normalizePath, pathToDocKey } from './page-path';

describe('normalizePath', () => {
  it('strips origin, query, hash, trailing slash', () => {
    expect(normalizePath('https://www.cleanstart.com/blogs/sbom-101/?x=1#h')).toBe('/blogs/sbom-101');
  });
  it('keeps a bare path and leading slash', () => {
    expect(normalizePath('/guide/hardened-container-image')).toBe('/guide/hardened-container-image');
    expect(normalizePath('news/foo')).toBe('/news/foo');
  });
  it('normalizes the site root to "/"', () => {
    expect(normalizePath('https://www.cleanstart.com/')).toBe('/');
  });
});

describe('docPath', () => {
  it('joins the collection prefix with the slug', () => {
    expect(docPath('blogs', 'sbom-101')).toBe('/blogs/sbom-101');
    expect(docPath('knowledgeBase', 'dev-vs-prod-images')).toBe('/knowledge-hub/dev-vs-prod-images');
  });
  it('returns null for a collection with no public prefix', () => {
    expect(docPath('authors', 'jane')).toBeNull();
  });
});

describe('pathToDocKey', () => {
  it('maps a path to {collection, slug} by longest prefix', () => {
    expect(pathToDocKey('/blogs/sbom-101')).toEqual({ collection: 'blogs', slug: 'sbom-101' });
    expect(pathToDocKey('/knowledge-hub/dev-vs-prod-images')).toEqual({
      collection: 'knowledgeBase',
      slug: 'dev-vs-prod-images',
    });
  });
  it('returns null for unmapped or prefix-only paths', () => {
    expect(pathToDocKey('/about-us')).toBeNull();
    expect(pathToDocKey('/blogs')).toBeNull();
    expect(pathToDocKey('/')).toBeNull();
  });
});
