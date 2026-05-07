import { describe, expect, it } from 'vitest';

import { buildJsonLdContext } from './context';
import { buildWebsiteBlob } from './website';

describe('buildWebsiteBlob', () => {
  it('emits a WebSite blob anchored at /#website', () => {
    const blob = buildWebsiteBlob(
      buildJsonLdContext({
        siteSettings: {
          siteName: 'CleanStart',
          baseUrl: 'https://cleanstart.com',
          defaultLocale: 'en-US',
        },
        seoDefaults: { organizationJsonLd: { name: 'CleanStart, Inc.' } },
      }),
    );

    expect(blob).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': 'https://cleanstart.com/#website',
      name: 'CleanStart',
      url: 'https://cleanstart.com',
      inLanguage: 'en-US',
      publisher: { '@id': 'https://cleanstart.com/#organization' },
    });
  });

  it('respects a baseUrl that already had a trailing slash', () => {
    const blob = buildWebsiteBlob(
      buildJsonLdContext({
        siteSettings: {
          siteName: 'CleanStart',
          baseUrl: 'https://cleanstart.com/',
          defaultLocale: 'en-US',
        },
        seoDefaults: { organizationJsonLd: {} },
      }),
    );
    expect(blob.url).toBe('https://cleanstart.com');
    expect(blob['@id']).toBe('https://cleanstart.com/#website');
  });
});
