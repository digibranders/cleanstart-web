import { describe, expect, it } from 'vitest';

import { buildJsonLdContext } from './context';

describe('buildJsonLdContext', () => {
  it('normalises the baseUrl by trimming trailing slashes', () => {
    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: 'CleanStart',
        baseUrl: 'https://cleanstart.com//',
        defaultLocale: 'en-US',
      },
      seoDefaults: { organizationJsonLd: {} },
    });
    expect(ctx.site.baseUrl).toBe('https://cleanstart.com');
    expect(ctx.organizationId).toBe('https://cleanstart.com/#organization');
  });

  it('treats a missing organizationJsonLd as an empty object', () => {
    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: 'CleanStart',
        baseUrl: 'https://cleanstart.com',
        defaultLocale: 'en-US',
      },
      seoDefaults: { organizationJsonLd: null },
    });
    expect(ctx.organization).toEqual({});
    expect(ctx.organizationId).toBe('https://cleanstart.com/#organization');
  });

  it('treats a missing newsMediaOrganization as an empty object', () => {
    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: 'CleanStart',
        baseUrl: 'https://cleanstart.com',
        defaultLocale: 'en-US',
      },
      seoDefaults: { organizationJsonLd: {}, newsMediaOrganization: null },
    });
    expect(ctx.newsOrganization).toEqual({});
  });

  it('passes through the newsMediaOrganization fields when set', () => {
    const ctx = buildJsonLdContext({
      siteSettings: {
        siteName: 'CleanStart',
        baseUrl: 'https://cleanstart.com',
        defaultLocale: 'en-US',
      },
      seoDefaults: {
        organizationJsonLd: {},
        newsMediaOrganization: {
          enabled: true,
          ethicsPolicy: 'https://cleanstart.com/ethics',
        },
      },
    });
    expect(ctx.newsOrganization.enabled).toBe(true);
    expect(ctx.newsOrganization.ethicsPolicy).toBe('https://cleanstart.com/ethics');
  });
});
