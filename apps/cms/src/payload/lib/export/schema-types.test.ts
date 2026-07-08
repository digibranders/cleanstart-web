import { describe, expect, it, vi } from 'vitest';

const buildJsonLdBlobs = vi.fn();
const buildJsonLdContext = vi.fn();
vi.mock('../jsonld', () => ({
  buildJsonLdBlobs: (...args: unknown[]) => buildJsonLdBlobs(...args),
  buildJsonLdContext: (...args: unknown[]) => buildJsonLdContext(...args),
}));

import {
  buildExportJsonLdContext,
  computeSchemaTypesLabel,
  isSchemaEmittableCollection,
} from './schema-types';

describe('isSchemaEmittableCollection', () => {
  it('is true for the 10 collections buildJsonLdBlobs supports', () => {
    expect(isSchemaEmittableCollection('blogs')).toBe(true);
    expect(isSchemaEmittableCollection('news')).toBe(true);
    expect(isSchemaEmittableCollection('guides')).toBe(true);
    expect(isSchemaEmittableCollection('knowledgeBase')).toBe(true);
    expect(isSchemaEmittableCollection('authors')).toBe(true);
    expect(isSchemaEmittableCollection('events')).toBe(true);
    expect(isSchemaEmittableCollection('webinars')).toBe(true);
    expect(isSchemaEmittableCollection('jobs')).toBe(true);
    expect(isSchemaEmittableCollection('pages')).toBe(true);
    expect(isSchemaEmittableCollection('resources')).toBe(true);
  });

  it('is false for non-schema-emitting exportable collections', () => {
    expect(isSchemaEmittableCollection('case-studies')).toBe(false);
    expect(isSchemaEmittableCollection('podcastEpisodes')).toBe(false);
    expect(isSchemaEmittableCollection('aboutGalleries')).toBe(false);
    expect(isSchemaEmittableCollection('forms')).toBe(false);
    expect(isSchemaEmittableCollection('deal-registrations')).toBe(false);
    expect(isSchemaEmittableCollection('career-applications')).toBe(false);
    expect(isSchemaEmittableCollection('legalDocuments')).toBe(false);
  });
});

describe('buildExportJsonLdContext', () => {
  it('fetches both globals and builds the context mirroring jsonld.ts defaults', async () => {
    const findGlobal = vi
      .fn()
      .mockResolvedValueOnce({ siteName: 'CleanStart', baseUrl: 'https://cleanstart.com', defaultLocale: 'en-US' })
      .mockResolvedValueOnce({ organizationJsonLd: {}, newsMediaOrganization: {} });
    buildJsonLdContext.mockReturnValue({ site: {}, organization: {}, newsOrganization: {}, organizationId: 'x' });

    const payload = { findGlobal } as unknown as Parameters<typeof buildExportJsonLdContext>[0];
    await buildExportJsonLdContext(payload);

    expect(findGlobal).toHaveBeenNthCalledWith(1, { slug: 'siteSettings' });
    expect(findGlobal).toHaveBeenNthCalledWith(2, { slug: 'seoDefaults' });
    expect(buildJsonLdContext).toHaveBeenCalledWith({
      siteSettings: { siteName: 'CleanStart', baseUrl: 'https://cleanstart.com', defaultLocale: 'en-US' },
      seoDefaults: { organizationJsonLd: {}, newsMediaOrganization: {} },
    });
  });

  it('falls back to defaults when siteSettings fields are absent', async () => {
    const findGlobal = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({});
    buildJsonLdContext.mockReturnValue({ site: {}, organization: {}, newsOrganization: {}, organizationId: 'x' });

    const payload = { findGlobal } as unknown as Parameters<typeof buildExportJsonLdContext>[0];
    await buildExportJsonLdContext(payload);

    const arg = buildJsonLdContext.mock.calls.at(-1)?.[0];
    expect(arg.siteSettings.siteName).toBe('CleanStart');
    expect(arg.siteSettings.defaultLocale).toBe('en-US');
  });
});

describe('computeSchemaTypesLabel', () => {
  const ctx = { site: {}, organization: {}, newsOrganization: {}, organizationId: 'x' } as never;

  it('returns blank for a non-emittable collection without calling buildJsonLdBlobs', () => {
    buildJsonLdBlobs.mockClear();
    const label = computeSchemaTypesLabel(ctx, 'case-studies', { id: 1 });
    expect(label).toBe('');
    expect(buildJsonLdBlobs).not.toHaveBeenCalled();
  });

  it('dedupes and joins distinct @type values with ", "', () => {
    buildJsonLdBlobs.mockReturnValue([
      { '@context': 'https://schema.org', '@type': 'Article' },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList' },
      { '@context': 'https://schema.org', '@type': 'Article' },
    ]);
    const label = computeSchemaTypesLabel(ctx, 'blogs', { id: 1 });
    expect(label).toBe('Article, BreadcrumbList');
  });

  it('flattens array-shaped @type values', () => {
    buildJsonLdBlobs.mockReturnValue([
      { '@context': 'https://schema.org', '@type': ['Article', 'HowTo'] },
    ]);
    const label = computeSchemaTypesLabel(ctx, 'guides', { id: 1 });
    expect(label).toBe('Article, HowTo');
  });

  it('returns blank when buildJsonLdBlobs throws, never propagating the error', () => {
    buildJsonLdBlobs.mockImplementation(() => {
      throw new Error('malformed doc');
    });
    const label = computeSchemaTypesLabel(ctx, 'blogs', { id: 1 });
    expect(label).toBe('');
  });
});
