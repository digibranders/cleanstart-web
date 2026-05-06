import type { JsonLdContext } from './context';
import type { JsonLdBlob } from './types';

/**
 * Site-wide Organization blob. Emitted on every page as the publisher
 * reference — every Article / NewsArticle / TechArticle blob points
 * back to this `@id` rather than re-describing the org.
 */
export const buildOrganizationBlob = (ctx: JsonLdContext): JsonLdBlob => {
  const { organization, organizationId } = ctx;

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': organizationId,
    name: organization.name ?? ctx.site.siteName,
    url: organization.url ?? ctx.site.baseUrl,
  };

  if (organization.legalName) {
    blob.legalName = organization.legalName;
  }

  if (organization.logo?.url) {
    const logo: Record<string, unknown> = {
      '@type': 'ImageObject',
      url: organization.logo.url,
    };
    if (organization.logo.width) logo.width = organization.logo.width;
    if (organization.logo.height) logo.height = organization.logo.height;
    if (organization.logo.alt) logo.caption = organization.logo.alt;
    blob.logo = logo;
  }

  const sameAs = (organization.sameAs ?? [])
    .map((entry) => entry.url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
  if (sameAs.length > 0) {
    blob.sameAs = sameAs;
  }

  return blob as JsonLdBlob;
};
