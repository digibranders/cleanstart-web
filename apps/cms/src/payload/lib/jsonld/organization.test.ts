import { describe, expect, it } from 'vitest';

import { buildJsonLdContext, type OrganizationSource } from './context';
import { buildOrganizationBlob } from './organization';

const ctx = (org: OrganizationSource) =>
  buildJsonLdContext({
    siteSettings: { siteName: 'CleanStart', baseUrl: 'https://cleanstart.com', defaultLocale: 'en-US' },
    seoDefaults: { organizationJsonLd: org },
  });

describe('buildOrganizationBlob', () => {
  it('emits required Organization fields with the canonical @id', () => {
    const blob = buildOrganizationBlob(
      ctx({ name: 'CleanStart, Inc.', url: 'https://cleanstart.com' }),
    );
    expect(blob).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://cleanstart.com/#organization',
      name: 'CleanStart, Inc.',
      url: 'https://cleanstart.com',
    });
  });

  it('falls back to siteSettings.siteName + baseUrl when org name/url unset', () => {
    const blob = buildOrganizationBlob(ctx({}));
    expect(blob.name).toBe('CleanStart');
    expect(blob.url).toBe('https://cleanstart.com');
  });

  it('inlines the logo as ImageObject when present', () => {
    const blob = buildOrganizationBlob(
      ctx({
        logo: { url: 'https://cdn.example/logo.png', width: 256, height: 256, alt: 'CleanStart' },
      }),
    );
    expect(blob.logo).toEqual({
      '@type': 'ImageObject',
      url: 'https://cdn.example/logo.png',
      width: 256,
      height: 256,
      caption: 'CleanStart',
    });
  });

  it('emits sameAs[] when at least one URL is provided', () => {
    const blob = buildOrganizationBlob(
      ctx({
        sameAs: [{ url: 'https://linkedin.com/company/cleanstart' }, { url: '' }],
      }),
    );
    expect(blob.sameAs).toEqual(['https://linkedin.com/company/cleanstart']);
  });

  it('omits sameAs[] when none of the entries are non-empty', () => {
    const blob = buildOrganizationBlob(ctx({ sameAs: [{ url: '' }] }));
    expect(blob.sameAs).toBeUndefined();
  });

  it('omits legalName + logo when not provided', () => {
    const blob = buildOrganizationBlob(ctx({ name: 'CleanStart' }));
    expect(blob.legalName).toBeUndefined();
    expect(blob.logo).toBeUndefined();
  });
});
