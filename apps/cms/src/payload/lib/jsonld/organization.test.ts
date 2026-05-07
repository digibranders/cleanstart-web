import { describe, expect, it } from 'vitest';

import {
  buildJsonLdContext,
  type NewsMediaOrganizationSource,
  type OrganizationSource,
} from './context';
import { buildOrganizationBlob } from './organization';

const ctx = (org: OrganizationSource, news: NewsMediaOrganizationSource = {}) =>
  buildJsonLdContext({
    siteSettings: {
      siteName: 'CleanStart',
      baseUrl: 'https://cleanstart.com',
      defaultLocale: 'en-US',
    },
    seoDefaults: { organizationJsonLd: org, newsMediaOrganization: news },
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

describe('buildOrganizationBlob — NewsMediaOrganization upgrade', () => {
  it('stays Organization when news group is unset', () => {
    const blob = buildOrganizationBlob(ctx({ name: 'CleanStart' }));
    expect(blob['@type']).toBe('Organization');
    expect(blob.foundingDate).toBeUndefined();
  });

  it('stays Organization when news.enabled is false even with policy URLs', () => {
    const blob = buildOrganizationBlob(
      ctx(
        { name: 'CleanStart' },
        { enabled: false, ethicsPolicy: 'https://cleanstart.com/ethics' },
      ),
    );
    expect(blob['@type']).toBe('Organization');
    expect(blob.ethicsPolicy).toBeUndefined();
  });

  it('stays Organization when news.enabled is true but no fields are filled', () => {
    // Avoids a hollow NewsMediaOrganization that Google would flag
    // as incomplete — both conditions must be true.
    const blob = buildOrganizationBlob(ctx({ name: 'CleanStart' }, { enabled: true }));
    expect(blob['@type']).toBe('Organization');
  });

  it('upgrades to NewsMediaOrganization when enabled with at least one policy URL', () => {
    const blob = buildOrganizationBlob(
      ctx(
        { name: 'CleanStart' },
        { enabled: true, ethicsPolicy: 'https://cleanstart.com/ethics' },
      ),
    );
    expect(blob['@type']).toBe('NewsMediaOrganization');
    expect(blob.ethicsPolicy).toBe('https://cleanstart.com/ethics');
  });

  it('preserves the canonical Organization @id under upgrade', () => {
    const blob = buildOrganizationBlob(
      ctx({ name: 'CleanStart' }, { enabled: true, foundingDate: '2024-01-15' }),
    );
    expect(blob['@id']).toBe('https://cleanstart.com/#organization');
  });

  it('upgrades when only foundingDate or slogan is set (treated as news-publisher signal)', () => {
    const founding = buildOrganizationBlob(
      ctx({ name: 'CleanStart' }, { enabled: true, foundingDate: '2024-01-15' }),
    );
    expect(founding['@type']).toBe('NewsMediaOrganization');
    expect(founding.foundingDate).toBe('2024-01-15');

    const slogan = buildOrganizationBlob(
      ctx({ name: 'CleanStart' }, { enabled: true, slogan: 'Hardened by default' }),
    );
    expect(slogan['@type']).toBe('NewsMediaOrganization');
    expect(slogan.slogan).toBe('Hardened by default');
  });

  it('emits every populated news-publisher field, drops empty ones', () => {
    const blob = buildOrganizationBlob(
      ctx(
        { name: 'CleanStart' },
        {
          enabled: true,
          foundingDate: '2024-01-15',
          slogan: 'Tagline',
          masthead: 'https://cleanstart.com/about',
          ethicsPolicy: 'https://cleanstart.com/ethics',
          correctionsPolicy: 'https://cleanstart.com/corrections',
          factCheckingPolicy: 'https://cleanstart.com/fact-check',
          actionableFeedbackPolicy: '',
          unnamedSourcesPolicy: null,
          diversityPolicy: 'https://cleanstart.com/diversity',
          ownershipFundingInfo: 'https://cleanstart.com/ownership',
          coveragePolicy: 'https://cleanstart.com/mission',
        },
      ),
    );
    expect(blob['@type']).toBe('NewsMediaOrganization');
    // Output uses the canonical Schema.org property names regardless
    // of the shorter Payload field names on input.
    expect(blob).toMatchObject({
      foundingDate: '2024-01-15',
      slogan: 'Tagline',
      masthead: 'https://cleanstart.com/about',
      ethicsPolicy: 'https://cleanstart.com/ethics',
      correctionsPolicy: 'https://cleanstart.com/corrections',
      verificationFactCheckingPolicy: 'https://cleanstart.com/fact-check',
      diversityPolicy: 'https://cleanstart.com/diversity',
      ownershipFundingInfo: 'https://cleanstart.com/ownership',
      missionCoveragePrioritiesPolicy: 'https://cleanstart.com/mission',
    });
    expect(blob.actionableFeedbackPolicy).toBeUndefined();
    expect(blob.unnamedSourcesPolicy).toBeUndefined();
  });
});
