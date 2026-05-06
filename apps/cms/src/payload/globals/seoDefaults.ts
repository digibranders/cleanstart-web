import type { GlobalConfig } from 'payload';

import { isAdmin, isAuthenticated } from '../access';
import { validateOptionalUrl } from '../lib/url-shape';

export const SeoDefaults: GlobalConfig = {
  slug: 'seoDefaults',
  label: 'SEO defaults',
  admin: { group: 'Globals' },
  access: {
    read: isAuthenticated,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  fields: [
    {
      name: 'defaultTitleTemplate',
      type: 'text',
      defaultValue: '%s — CleanStart',
      admin: {
        description:
          'Used when seo.title is unset. %s is replaced with the document title.',
      },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
      admin: {
        description: 'Site-wide fallback for seo.description when nothing else is set.',
      },
    },
    {
      name: 'defaultOgImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Site-wide fallback when seo.ogImage and the page hero are both empty.',
      },
    },
    {
      name: 'twitterHandle',
      type: 'text',
      admin: { description: 'Used as twitter:site fallback when no author handle is set.' },
    },
    {
      type: 'group',
      name: 'organizationJsonLd',
      label: 'Organization JSON-LD',
      admin: {
        description:
          'Surfaced on every page as the publisher reference. Required for News content.',
      },
      fields: [
        { name: 'name', type: 'text', defaultValue: 'CleanStart, Inc.' },
        { name: 'legalName', type: 'text' },
        { name: 'url', type: 'text', defaultValue: 'https://cleanstart.com' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        {
          name: 'sameAs',
          type: 'array',
          labels: { singular: 'Profile URL', plural: 'sameAs profile URLs' },
          admin: {
            description: 'Authoritative profile URLs (LinkedIn, GitHub, Crunchbase, etc.).',
          },
          fields: [{ name: 'url', type: 'text', required: true }],
        },
      ],
    },
    {
      type: 'group',
      name: 'newsMediaOrganization',
      label: 'News publisher (NewsMediaOrganization)',
      admin: {
        description:
          'When enabled, the site-wide Organization blob upgrades to a NewsMediaOrganization. Pairs with NewsArticle JSON-LD (isAccessibleForFree: true) and /sitemap-news.xml to satisfy Google News eligibility (signals-based since October 2025). Leave disabled until the policy URLs below are real, published pages — Google penalises NewsMediaOrganization claims that point at empty or missing policies.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Toggle on once the policy pages below exist and link from the site footer.',
          },
        },
        {
          name: 'foundingDate',
          type: 'text',
          admin: {
            description: 'ISO 8601 date (e.g. 2024-01-15). Surfaced as Schema.org foundingDate.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'slogan',
          type: 'text',
          admin: {
            description: 'One-line tagline. Surfaced as Schema.org slogan.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'masthead',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description:
              'URL of the masthead / about-us page that lists editorial leadership. Surfaced as Schema.org masthead.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'ethicsPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the editorial-ethics policy page.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'correctionsPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the corrections / retractions policy page.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          // Field name shortened to keep the Postgres column under the
          // 63-char identifier limit once Payload's `version_` prefix is
          // applied to the version-table copy. Surfaced in JSON-LD as
          // `verificationFactCheckingPolicy` (the Schema.org property
          // name) via the emitter — the DB column name is internal.
          name: 'factCheckingPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the fact-checking / verification policy page.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'actionableFeedbackPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the page describing how readers submit feedback / complaints.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'unnamedSourcesPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the policy page on use of anonymous / unnamed sources.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'diversityPolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the diversity / inclusion policy page.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          name: 'ownershipFundingInfo',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the page disclosing ownership / funding sources.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
        {
          // Field name shortened for the same Postgres-identifier-limit
          // reason as `factCheckingPolicy` above. Surfaced in JSON-LD
          // as `missionCoveragePrioritiesPolicy` (Schema.org name).
          name: 'coveragePolicy',
          type: 'text',
          validate: validateOptionalUrl,
          admin: {
            description: 'URL of the page describing editorial mission and coverage priorities.',
            condition: (_data, siblingData) => siblingData?.enabled === true,
          },
        },
      ],
    },
  ],
};
