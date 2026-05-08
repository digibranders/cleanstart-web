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

  describe('seo.canonicalOverride', () => {
    it('honours an off-domain override when useCustomCanonical is true', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'https://other.example/article' },
        }),
      ).toBe('https://other.example/article');
    });

    it('falls back to self-canonical when useCustomCanonical is false', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: false, canonicalOverride: 'https://other.example/article' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('falls back to self-canonical when override is empty', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: '   ' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('falls back to self-canonical when override is not a valid URL', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'not-a-url' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('rejects override URLs with query strings', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'https://other.example/x?utm=1' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('rejects override URLs with fragments', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'https://other.example/x#frag' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('rejects non-http(s) override URLs', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'ftp://other.example/x' },
        }),
      ).toBe('https://cleanstart.com/blogs/self');
    });

    it('strips trailing slash from a valid override', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'blogs', {
          slug: 'self',
          seo: { useCustomCanonical: true, canonicalOverride: 'https://other.example/article/' },
        }),
      ).toBe('https://other.example/article');
    });

    it('uses override even when self-canonical would be null (no slug)', () => {
      expect(
        docCanonicalUrl('https://cleanstart.com', 'mystery', {
          slug: '',
          seo: { useCustomCanonical: true, canonicalOverride: 'https://other.example/article' },
        }),
      ).toBe('https://other.example/article');
    });
  });
});
