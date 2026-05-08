import { describe, expect, it } from 'vitest';

import { type ArticleSource, buildArticleBlob, inlineByline } from './article';
import { buildJsonLdContext } from './context';
import type { AuthorSource } from './person';

const ctx = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: { organizationJsonLd: { name: 'CleanStart, Inc.' } },
});

const baseSource = (over: Partial<ArticleSource> = {}): ArticleSource => ({
  variant: 'Article',
  url: 'https://cleanstart.com/blogs/example',
  title: 'Example post',
  ...over,
});

describe('buildArticleBlob', () => {
  it('returns null when title or url is missing', () => {
    expect(buildArticleBlob(ctx, baseSource({ title: '' }))).toBeNull();
    expect(buildArticleBlob(ctx, baseSource({ url: '' }))).toBeNull();
  });

  it('emits the required Article frame for blogs', () => {
    const blob = buildArticleBlob(ctx, baseSource());
    expect(blob).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': 'https://cleanstart.com/blogs/example',
      url: 'https://cleanstart.com/blogs/example',
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://cleanstart.com/blogs/example' },
      headline: 'Example post',
      inLanguage: 'en-US',
      publisher: { '@id': 'https://cleanstart.com/#organization' },
      isAccessibleForFree: true,
    });
    // speakable always present (defaults applied when no editor selectors set)
    expect(blob?.speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['.lead', 'article p:first-of-type'],
    });
  });

  it('uses NewsArticle for news', () => {
    const blob = buildArticleBlob(ctx, baseSource({ variant: 'NewsArticle' }));
    expect(blob?.['@type']).toBe('NewsArticle');
    expect(blob?.isAccessibleForFree).toBe(true);
  });

  it('uses TechArticle for guides / knowledge base', () => {
    const blob = buildArticleBlob(ctx, baseSource({ variant: 'TechArticle' }));
    expect(blob?.['@type']).toBe('TechArticle');
  });

  it('prefers seoTitle for headline when set', () => {
    const blob = buildArticleBlob(ctx, baseSource({ seoTitle: 'Custom SEO Title' }));
    expect(blob?.headline).toBe('Custom SEO Title');
  });

  it('inlines image, dates, and wordCount when present', () => {
    const blob = buildArticleBlob(
      ctx,
      baseSource({
        heroImage: { url: 'https://cdn.example/hero.jpg', width: 1200, height: 630 },
        datePublished: '2026-05-01T10:00:00Z',
        dateModified: '2026-05-05T12:00:00Z',
        wordCount: 850,
      }),
    );
    expect(blob).toMatchObject({
      image: {
        '@type': 'ImageObject',
        url: 'https://cdn.example/hero.jpg',
        width: 1200,
        height: 630,
      },
      datePublished: '2026-05-01T10:00:00Z',
      dateModified: '2026-05-05T12:00:00Z',
      wordCount: 850,
    });
  });

  it('drops image / dates / wordCount when not provided', () => {
    const blob = buildArticleBlob(ctx, baseSource());
    expect(blob?.image).toBeUndefined();
    expect(blob?.datePublished).toBeUndefined();
    expect(blob?.wordCount).toBeUndefined();
  });

  it('emits author[] as Person references with @id (not full inline)', () => {
    const author: AuthorSource = {
      slug: 'jane-doe',
      name: 'Jane Doe',
      role: 'Senior Researcher',
    };
    const blob = buildArticleBlob(ctx, baseSource({ authors: [author] }));
    expect(blob?.author).toEqual([
      {
        '@type': 'Person',
        '@id': 'https://cleanstart.com/author/jane-doe#person',
        name: 'Jane Doe',
      },
    ]);
  });

  it('falls back to the publishing Organization when no resolved Person authors exist', () => {
    // schema.org Article requires `author`. When the doc has no
    // resolved Person authors (staff-written posts where the editor
    // didn't pick a byline, or unresolved relationships at this
    // depth), the builder uses the publishing Organization as the
    // author — same pattern major news sites use for unbylined
    // posts. Keeps Google Rich Results eligibility intact instead
    // of silently emitting an invalid blob.
    const blob = buildArticleBlob(ctx, baseSource({ authors: [1, 2, null] }));
    expect(blob?.author).toEqual({ '@id': ctx.organizationId });
  });

  it('falls back to the publishing Organization when authors is null', () => {
    const blob = buildArticleBlob(ctx, baseSource({ authors: null }));
    expect(blob?.author).toEqual({ '@id': ctx.organizationId });
  });

  it('emits reviewedBy as inline Person + dateReviewed when set', () => {
    const reviewer: AuthorSource = { slug: 'rev-doe', name: 'Rev Doe', role: 'Editor' };
    const blob = buildArticleBlob(
      ctx,
      baseSource({
        reviewedBy: reviewer,
        dateReviewed: '2026-04-01',
        dateModified: '2026-05-05',
      }),
    );
    expect(blob?.reviewedBy).toEqual({
      '@type': 'Person',
      '@id': 'https://cleanstart.com/author/rev-doe#person',
      name: 'Rev Doe',
      jobTitle: 'Editor',
    });
    expect(blob?.dateReviewed).toBe('2026-04-01');
  });

  it('falls back dateReviewed to dateModified when lastReviewedAt is unset', () => {
    const reviewer: AuthorSource = { slug: 'rev', name: 'Rev' };
    const blob = buildArticleBlob(
      ctx,
      baseSource({ reviewedBy: reviewer, dateModified: '2026-05-05' }),
    );
    expect(blob?.dateReviewed).toBe('2026-05-05');
  });

  it('emits about as a Thing entity when set, with sameAs when provided', () => {
    const blob = buildArticleBlob(
      ctx,
      baseSource({ about: { name: 'Container security', sameAs: 'https://wiki/container' } }),
    );
    expect(blob?.about).toEqual({
      '@type': 'Thing',
      name: 'Container security',
      sameAs: 'https://wiki/container',
    });
  });

  it('emits mentions[] from keywords (Layer-1 AEO/GEO signal)', () => {
    const blob = buildArticleBlob(
      ctx,
      baseSource({ keywords: ['SBOM', 'CVE', 'VEX'] }),
    );
    expect(blob?.mentions).toEqual([
      { '@type': 'Thing', name: 'SBOM' },
      { '@type': 'Thing', name: 'CVE' },
      { '@type': 'Thing', name: 'VEX' },
    ]);
  });
});

describe('inlineByline', () => {
  it('returns the full Person blob for a resolved author', () => {
    const blob = inlineByline(ctx, { slug: 'jane-doe', name: 'Jane Doe' });
    expect(blob?.['@type']).toBe('Person');
    expect(blob?.['@id']).toBe('https://cleanstart.com/author/jane-doe#person');
  });

  it('returns null for a number ID', () => {
    expect(inlineByline(ctx, 42)).toBeNull();
  });
});
