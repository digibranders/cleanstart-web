import type { GlobalConfig, JSONFieldValidation } from 'payload';

import { isAdmin } from '../access';
import { mediaUploadField } from '../fields/media-upload';
import { filterToMergeable, validatePartialOverride } from '../lib/jsonld/filter-override';
import { isValidExternalLink, normalizeOptionalUrlHook, validateOptionalUrl } from '../lib/url-shape';

export const SeoDefaults: GlobalConfig = {
  slug: 'seoDefaults',
  label: 'SEO defaults',
  admin: { group: 'SEO' },
  access: {
    // Public read: the anonymous web build fetches this global to compose the
    // site-wide Organization/WebSite JSON-LD, verification <meta> tags, and
    // OG/title fallbacks. Every field here is public-facing markup by
    // definition. Update stays admin-only.
    read: () => true,
    update: isAdmin,
  },
  versions: { drafts: false, max: 50 },
  // Field order: the most-used site defaults first, then the Organization
  // entity (with its bulky sub-sections collapsed), the global custom-schema
  // editor, then the advanced/rarely-touched groups collapsed at the bottom.
  // Collapsibles are UI-only wrappers around named groups — data shape (and
  // DB columns) are unchanged.
  fields: [
    {
      // Right rail: live preview of the site-wide @graph this global emits on
      // every page (Organization/WebSite from the fields below + any global
      // override), with rich-result health + validate. Reflects unsaved edits.
      name: 'globalSchemaView',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field:
            './payload/admin/components/SchemaManager/GlobalSchemaView.tsx#GlobalSchemaView',
        },
      },
    },

    // ── Core site defaults ──────────────────────────────────────────────
    {
      name: 'defaultTitleTemplate',
      type: 'text',
      defaultValue: '%s | CleanStart',
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
    mediaUploadField({
      name: 'defaultOgImage',
      folderHint: 'web/general',
      description:
        'Site-wide fallback when seo.ogImage and the page hero are both empty.',
      guidance: {
        dimensions: '1200 × 630 px',
        aspectRatio: '1.91:1 (Open Graph)',
        note: 'Social-share preview (LinkedIn, Facebook, X). Keep text and logo away from the edges.',
      },
    }),
    {
      name: 'twitterHandle',
      type: 'text',
      admin: { description: 'Used as twitter:site fallback when no author handle is set.' },
    },

    // ── Organization entity (emitted on every page) ─────────────────────
    {
      type: 'group',
      name: 'organizationJsonLd',
      label: 'Organization JSON-LD',
      admin: {
        description:
          'The site-wide Organization entity, surfaced on every page as the publisher reference.',
      },
      fields: [
        { name: 'name', type: 'text', defaultValue: 'CleanStart, Inc.' },
        { name: 'legalName', type: 'text' },
        { name: 'alternateName', type: 'text', admin: { description: 'Alternate / short brand name (Schema.org alternateName).' } },
        {
          name: 'url',
          type: 'text',
          defaultValue: 'https://www.cleanstart.com',
          hooks: { beforeValidate: [normalizeOptionalUrlHook] },
          validate: validateOptionalUrl,
        },
        mediaUploadField({
          name: 'logo',
          folderHint: 'web/general',
          guidance: {
            dimensions: '≥ 512 × 512 px',
            aspectRatio: 'Square (1:1)',
            note: 'Organization logo emitted in structured data (Google Knowledge Panel). Transparent PNG on a square canvas.',
          },
        }),
        { name: 'slogan', type: 'text', admin: { description: 'Company tagline (Schema.org slogan).' } },
        {
          name: 'foundingDate',
          type: 'text',
          admin: { description: 'Company / website founding date — ISO 8601 (e.g. 2024-01-15). Schema.org foundingDate.' },
        },
        { name: 'foundingLocation', type: 'text', admin: { description: 'City/region where the company was founded (Schema.org foundingLocation → Place).' } },
        { name: 'numberOfEmployees', type: 'number', admin: { description: 'Approximate employee count (Schema.org numberOfEmployees).' } },
        {
          name: 'email',
          type: 'email',
          admin: { description: 'General contact email (Schema.org email).' },
        },
        { name: 'telephone', type: 'text', admin: { description: 'General contact phone, E.164 preferred e.g. +1-555-555-5555 (Schema.org telephone).' } },
        {
          name: 'sameAs',
          type: 'array',
          labels: { singular: 'Profile URL', plural: 'sameAs profile URLs' },
          admin: {
            description: 'Authoritative profile URLs (LinkedIn, GitHub, Crunchbase, etc.).',
          },
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              // Stricter than validateOptionalUrl: this field is required, so an
              // empty value is invalid (validateOptionalUrl passes blanks).
              validate: (value: string | string[] | null | undefined): true | string =>
                typeof value === 'string' && isValidExternalLink(value)
                  ? true
                  : 'Must be a valid URL (https?://, /path, mailto:, or tel:).',
            },
          ],
        },
        {
          name: 'founders',
          type: 'array',
          labels: { singular: 'Founder', plural: 'Founders' },
          admin: { description: 'Company founders — emitted as Schema.org founder (Person[]).' },
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'jobTitle', type: 'text' },
            {
              name: 'url',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: { description: 'Optional profile URL (LinkedIn, etc.).' },
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Address',
          admin: { initCollapsed: true, description: 'Headquarters / primary address — Schema.org PostalAddress.' },
          fields: [
            {
              type: 'group',
              name: 'address',
              label: false,
              fields: [
                { name: 'streetAddress', type: 'text' },
                { name: 'addressLocality', type: 'text', admin: { description: 'City.' } },
                { name: 'addressRegion', type: 'text', admin: { description: 'State / region.' } },
                { name: 'postalCode', type: 'text' },
                { name: 'addressCountry', type: 'text', admin: { description: 'ISO 3166-1 alpha-2 (e.g. US, IN).' } },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Contact points',
          admin: { initCollapsed: true, description: 'Typed contact channels — Schema.org contactPoint (ContactPoint[]).' },
          fields: [
            {
              name: 'contactPoints',
              type: 'array',
              labels: { singular: 'Contact point', plural: 'Contact points' },
              fields: [
                {
                  name: 'contactType',
                  type: 'text',
                  required: true,
                  admin: { description: 'e.g. customer support, sales, technical support.' },
                },
                { name: 'telephone', type: 'text' },
                { name: 'email', type: 'email' },
                { name: 'areaServed', type: 'text', admin: { description: 'e.g. US, Worldwide.' } },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Identifiers (entity disambiguation)',
          admin: {
            initCollapsed: true,
            description:
              'Optional registry identifiers that help search/AI engines disambiguate the entity for the Knowledge Panel. Leave blank if unknown.',
          },
          fields: [
            {
              type: 'group',
              name: 'identifiers',
              label: false,
              fields: [
                { name: 'vatID', type: 'text', admin: { description: 'VAT registration number.' } },
                { name: 'taxID', type: 'text', admin: { description: 'Tax ID / EIN.' } },
                { name: 'duns', type: 'text', admin: { description: 'Dun & Bradstreet DUNS number.' } },
                { name: 'naics', type: 'text', admin: { description: 'NAICS industry code.' } },
                { name: 'iso6523', type: 'text', admin: { description: 'ISO 6523 ICD identifier.' } },
              ],
            },
          ],
        },
      ],
    },

    // ── Global custom JSON-LD ───────────────────────────────────────────
    {
      // Site-wide custom JSON-LD — emitted on EVERY page's @graph at build time
      // (composed per-@type alongside the auto Organization/WebSite). Use for
      // global types not covered by the structured fields above. Same allow-list,
      // validation, and 16 KB cap as the per-page override.
      name: 'additionalSchema',
      type: 'json',
      validate: validatePartialOverride as JSONFieldValidation,
      hooks: {
        beforeChange: [({ value }) => filterToMergeable(value).kept],
      },
      admin: {
        description:
          'Raw Schema.org JSON-LD added to every page (single object or array, each with @context + an allow-listed @type). Validated + capped at 16 KB; composed per-@type into the site-wide @graph at build time.',
        components: {
          Field:
            './payload/admin/components/SchemaManager/SchemaOverrideField.tsx#SchemaOverrideField',
        },
      },
    },

    // ── Advanced / rarely touched (collapsed) ───────────────────────────
    {
      type: 'collapsible',
      label: 'Search engine verification',
      admin: {
        initCollapsed: true,
        description:
          'Site-verification tokens. Each renders as a <meta> tag in the public site head (production host only). Paste the value from each console verbatim — no quotes, no <meta> wrapper.',
      },
      fields: [
        {
          type: 'group',
          name: 'verification',
          label: false,
          fields: [
            {
              name: 'google',
              type: 'text',
              admin: {
                description:
                  'google-site-verification (Google Search Console → Settings → Ownership verification → HTML tag).',
              },
            },
            {
              name: 'bing',
              type: 'text',
              admin: {
                description:
                  'msvalidate.01 (Bing Webmaster Tools → Site Settings → Site verification → Meta tag).',
              },
            },
            {
              name: 'pinterest',
              type: 'text',
              admin: {
                description:
                  'p:domain_verify (Pinterest → Settings → Claim → claim a website → HTML tag).',
              },
            },
            {
              name: 'yandex',
              type: 'text',
              admin: {
                description:
                  'yandex-verification (Yandex Webmaster → Settings → Site verification → Meta tag).',
              },
            },
            {
              name: 'facebookDomain',
              type: 'text',
              admin: {
                description:
                  'facebook-domain-verification (Meta Business Suite → Brand Safety → Domains → Verify → Meta-tag).',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'News publisher (NewsMediaOrganization)',
      admin: {
        initCollapsed: true,
        description:
          'When enabled, the site-wide Organization blob upgrades to a NewsMediaOrganization. Pairs with NewsArticle JSON-LD and /sitemap-news.xml for Google News eligibility. Leave disabled until the policy URLs below are real, published pages.',
      },
      fields: [
        {
          type: 'group',
          name: 'newsMediaOrganization',
          label: false,
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
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
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
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the editorial-ethics policy page.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'correctionsPolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
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
              // `verificationFactCheckingPolicy` (the Schema.org property name).
              name: 'factCheckingPolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the fact-checking / verification policy page.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'actionableFeedbackPolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the page describing how readers submit feedback / complaints.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'unnamedSourcesPolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the policy page on use of anonymous / unnamed sources.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'diversityPolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the diversity / inclusion policy page.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'ownershipFundingInfo',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the page disclosing ownership / funding sources.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              // Field name shortened for the same Postgres-identifier-limit reason
              // as factCheckingPolicy. Surfaced as missionCoveragePrioritiesPolicy.
              name: 'coveragePolicy',
              type: 'text',
              hooks: { beforeValidate: [normalizeOptionalUrlHook] },
              validate: validateOptionalUrl,
              admin: {
                description: 'URL of the page describing editorial mission and coverage priorities.',
                condition: (_data, siblingData) => siblingData?.enabled === true,
              },
            },
          ],
        },
      ],
    },
  ],
};
