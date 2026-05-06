import { describe, expect, it } from 'vitest';

import { absoluteUrl, docCanonicalUrl } from './url';

describe('absoluteUrl', () => {
  it('joins base + path with a single slash', () => {
    expect(absoluteUrl('https://cleanstart.com', '/blogs/x')).toBe('https://cleanstart.com/blogs/x');
  });

  it('strips a single trailing slash from the base', () => {
    expect(absoluteUrl('https://cleanstart.com/', '/blogs/x')).toBe('https://cleanstart.com/blogs/x');
  });

  it('prepends a slash when path is missing one', () => {
    expect(absoluteUrl('https://cleanstart.com', 'blogs/x')).toBe('https://cleanstart.com/blogs/x');
  });

  it('returns just the base when path is empty', () => {
    expect(absoluteUrl('https://cleanstart.com/', '')).toBe('https://cleanstart.com');
  });
});

describe('docCanonicalUrl', () => {
  it('builds /blogs/<slug> for blogs', () => {
    expect(
      docCanonicalUrl('https://cleanstart.com', 'blogs', { slug: 'hello' }),
    ).toBe('https://cleanstart.com/blogs/hello');
  });

  it('builds /knowledge-hub/<slug> for knowledgeBase', () => {
    expect(
      docCanonicalUrl('https://cleanstart.com', 'knowledgeBase', { slug: 'vex-documents' }),
    ).toBe('https://cleanstart.com/knowledge-hub/vex-documents');
  });

  it('uses doc.path for pages when set', () => {
    expect(
      docCanonicalUrl('https://cleanstart.com', 'pages', { slug: 'pricing', path: '/products/pricing' }),
    ).toBe('https://cleanstart.com/products/pricing');
  });

  it('returns null when slug is missing on a slug-routed collection', () => {
    expect(docCanonicalUrl('https://cleanstart.com', 'blogs', { slug: '' })).toBeNull();
  });

  it('returns null for an unregistered collection', () => {
    expect(docCanonicalUrl('https://cleanstart.com', 'mystery', { slug: 'x' })).toBeNull();
  });
});
