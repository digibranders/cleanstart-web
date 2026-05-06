import { describe, expect, it } from 'vitest';

import { buildJsonLdContext } from './context';
import { buildJsonLdBlobs } from './dispatch';

const ctx = buildJsonLdContext({
  siteSettings: {
    siteName: 'CleanStart',
    baseUrl: 'https://cleanstart.com',
    defaultLocale: 'en-US',
  },
  seoDefaults: {
    organizationJsonLd: {
      name: 'CleanStart, Inc.',
      url: 'https://cleanstart.com',
      logo: { url: 'https://cdn.example/logo.png' },
    },
  },
});

describe('buildJsonLdBlobs', () => {
  it('returns [] for an unsupported collection', () => {
    expect(buildJsonLdBlobs(ctx, 'mystery', { slug: 'x', title: 'X' })).toEqual([]);
  });

  it('returns [] when title or slug is missing on an article-like collection', () => {
    expect(buildJsonLdBlobs(ctx, 'blogs', { slug: '', title: 'X' })).toEqual([]);
    expect(buildJsonLdBlobs(ctx, 'blogs', { slug: 'x' })).toEqual([]);
  });

  describe('blogs', () => {
    it('emits Organization + WebSite + Article + Breadcrumb', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        abstract: 'A short lede.',
        updatedAt: '2026-05-05T12:00:00Z',
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual(['Organization', 'WebSite', 'Article', 'BreadcrumbList']);

      const article = blobs.find((b) => b['@type'] === 'Article');
      expect(article).toMatchObject({
        '@id': 'https://cleanstart.com/blogs/example',
        url: 'https://cleanstart.com/blogs/example',
        headline: 'Example post',
        description: 'A short lede.',
        dateModified: '2026-05-05T12:00:00Z',
      });
    });

    it('inlines a byline Person blob and adds FAQPage when faqs[] non-empty', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        authors: [{ slug: 'jane-doe', name: 'Jane Doe', role: 'Researcher' }],
        faqs: [{ question: 'Why?', answer: 'Because.' }],
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual([
        'Organization',
        'WebSite',
        'Article',
        'Person',
        'BreadcrumbList',
        'FAQPage',
      ]);
    });

    it('promotes the first resolved category into about{}', () => {
      const blobs = buildJsonLdBlobs(ctx, 'blogs', {
        slug: 'example',
        title: 'Example post',
        categories: [{ name: 'Container security' }, { name: 'CI/CD' }],
      });
      const article = blobs.find((b) => b['@type'] === 'Article');
      expect(article?.about).toEqual({ '@type': 'Thing', name: 'Container security' });
    });
  });

  describe('news', () => {
    it('emits NewsArticle and uses publicationDate as datePublished', () => {
      const blobs = buildJsonLdBlobs(ctx, 'news', {
        slug: 'launch',
        title: 'CleanStart launches v1',
        publicationDate: '2026-05-04T09:00:00Z',
        newsCategories: [{ name: 'Press' }],
      });
      const article = blobs.find((b) => b['@type'] === 'NewsArticle');
      expect(article).toMatchObject({
        '@type': 'NewsArticle',
        '@id': 'https://cleanstart.com/news/launch',
        datePublished: '2026-05-04T09:00:00Z',
        isAccessibleForFree: true,
        about: { '@type': 'Thing', name: 'Press' },
      });
    });
  });

  describe('guides', () => {
    it('emits TechArticle and surfaces keywords[] as mentions[]', () => {
      const blobs = buildJsonLdBlobs(ctx, 'guides', {
        slug: 'sbom-101',
        title: 'SBOM 101',
        wordCount: 1850,
        keywords: [{ keyword: 'SBOM' }, { keyword: 'CVE' }, { keyword: '' }],
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle');
      expect(article).toMatchObject({
        '@type': 'TechArticle',
        wordCount: 1850,
        mentions: [
          { '@type': 'Thing', name: 'SBOM' },
          { '@type': 'Thing', name: 'CVE' },
        ],
      });
    });
  });

  describe('knowledgeBase', () => {
    it('emits TechArticle with about{} from the single category relation', () => {
      const blobs = buildJsonLdBlobs(ctx, 'knowledgeBase', {
        slug: 'vex-documents',
        title: 'How to use VEX documents',
        category: { name: 'Emerging Standards' },
      });
      const article = blobs.find((b) => b['@type'] === 'TechArticle');
      expect(article).toMatchObject({
        '@id': 'https://cleanstart.com/knowledge-hub/vex-documents',
        '@type': 'TechArticle',
        about: { '@type': 'Thing', name: 'Emerging Standards' },
      });
      // breadcrumb should target the KB landing page
      const breadcrumb = blobs.find((b) => b['@type'] === 'BreadcrumbList') as
        | { itemListElement: { item: string }[] }
        | undefined;
      expect(breadcrumb?.itemListElement[1]?.item).toBe('https://cleanstart.com/knowledge-hub');
    });
  });

  describe('authors', () => {
    it('emits Organization + WebSite + Person + Breadcrumb (no Article)', () => {
      const blobs = buildJsonLdBlobs(ctx, 'authors', {
        slug: 'jane-doe',
        name: 'Jane Doe',
        role: 'Senior Researcher',
        topicAreas: [{ topic: 'Container security' }],
      });
      const types = blobs.map((b) => b['@type']);
      expect(types).toEqual(['Organization', 'WebSite', 'Person', 'BreadcrumbList']);

      const person = blobs.find((b) => b['@type'] === 'Person');
      expect(person).toMatchObject({
        '@id': 'https://cleanstart.com/author/jane-doe#person',
        name: 'Jane Doe',
        jobTitle: 'Senior Researcher',
        knowsAbout: ['Container security'],
      });
    });

    it('returns [] when an author has no slug or name', () => {
      expect(buildJsonLdBlobs(ctx, 'authors', { slug: '', name: 'X' })).toEqual([]);
      expect(buildJsonLdBlobs(ctx, 'authors', { slug: 'x', name: '' })).toEqual([]);
    });
  });
});
