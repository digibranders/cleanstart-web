import type { JsonLdContext, NewsMediaOrganizationSource } from './context';
import type { JsonLdBlob } from './types';

const NEWS_POLICY_KEYS = [
  'masthead',
  'ethicsPolicy',
  'correctionsPolicy',
  'verificationFactCheckingPolicy',
  'actionableFeedbackPolicy',
  'unnamedSourcesPolicy',
  'diversityPolicy',
  'ownershipFundingInfo',
  'missionCoveragePrioritiesPolicy',
] as const;

const hasAnyNewsField = (news: NewsMediaOrganizationSource): boolean => {
  if (news.foundingDate || news.slogan) return true;
  return NEWS_POLICY_KEYS.some((key) => {
    const value = news[key];
    return typeof value === 'string' && value.length > 0;
  });
};

/**
 * Decide whether the site-wide blob should upgrade to
 * NewsMediaOrganization. The editor must explicitly toggle
 * `enabled` AND at least one news-publisher field must be filled —
 * either condition alone produces a NewsMediaOrganization that
 * Google will mark as incomplete (defeats the point).
 */
const shouldEmitNewsMediaOrganization = (news: NewsMediaOrganizationSource): boolean =>
  news.enabled === true && hasAnyNewsField(news);

const attachNewsFields = (
  blob: Record<string, unknown>,
  news: NewsMediaOrganizationSource,
): void => {
  if (news.foundingDate) blob.foundingDate = news.foundingDate;
  if (news.slogan) blob.slogan = news.slogan;
  for (const key of NEWS_POLICY_KEYS) {
    const value = news[key];
    if (typeof value === 'string' && value.length > 0) {
      blob[key] = value;
    }
  }
};

/**
 * Site-wide Organization blob. Emitted on every page as the publisher
 * reference — every Article / NewsArticle / TechArticle blob points
 * back to this `@id` rather than re-describing the org.
 *
 * When `seoDefaults.newsMediaOrganization.enabled` is true and at
 * least one news-publisher field is filled, the `@type` upgrades to
 * `NewsMediaOrganization` (a Schema.org subclass of Organization)
 * and the news-specific fields are attached. Same `@id` either way,
 * so existing publisher references stay valid.
 */
export const buildOrganizationBlob = (ctx: JsonLdContext): JsonLdBlob => {
  const { organization, newsOrganization, organizationId } = ctx;

  const isNewsOrg = shouldEmitNewsMediaOrganization(newsOrganization);

  const blob: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': isNewsOrg ? 'NewsMediaOrganization' : 'Organization',
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

  if (isNewsOrg) {
    attachNewsFields(blob, newsOrganization);
  }

  return blob as JsonLdBlob;
};
