import type { CollectionConfig } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { firstPublishHook } from '../hooks/first-publish';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import { searchSyncAfterChangeHook, searchSyncAfterDeleteHook } from '../hooks/search-sync';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';
import { ROUTE_PREFIX } from '../lib/route-prefixes';

/**
 * Case Studies — listing plus a per-study detail page.
 *
 * Each case study has a page at `/case-studies/<slug>` and a downloadable PDF
 * in R2, surfaced together on the `/case-studies` listing.
 *
 * This collection used to be listing-only, and its fields still show it: the
 * detail page was added in 2026-09 and the collection grew the machinery every
 * routed collection needs at the same time — slug-change redirects (a rename
 * would otherwise break an indexed URL with nothing to catch it), SEO fields,
 * IndexNow, search sync, and a Lexical `body`.
 *
 * Field split worth knowing before editing one:
 *  - `summary` is the CARD blurb. Two or three sentences, listing and hero.
 *  - `body` is the article. Everything the detail page shows under "What
 *    happened" comes from here.
 *  - `outcomes` drives the figures on the detail hero's result card, and
 *    `glance` the facts rail beside the article. Both optional; the page
 *    reshapes itself around whichever are filled rather than leaving holes.
 */
export const CaseStudies: CollectionConfig = {
  slug: 'case-studies',
  labels: { singular: 'Case Study', plural: 'Case Studies' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'industry', '_status', 'updatedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: false, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'industry',
      type: 'select',
      options: [
        { label: 'Healthcare', value: 'healthcare' },
        { label: 'Telecom', value: 'telecom' },
        { label: 'Finance', value: 'finance' },
        { label: 'Technology', value: 'technology' },
        { label: 'Manufacturing', value: 'manufacturing' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description:
          'Legacy enum — superseded by the Industry relationship below. Kept during the taxonomy transition; removed once apps/web reads the relationship.',
      },
    },
    {
      name: 'industryRef',
      type: 'relationship',
      relationTo: 'industries',
      admin: {
        description:
          'Industry taxonomy reference. Seeded/backfilled from the legacy `industry` enum; editors manage the list under Taxonomies → Industries.',
      },
    },
    {
      name: 'company',
      type: 'text',
      required: true,
      admin: {
        description: 'Customer / company name shown above the card title.',
      },
    },
    mediaUploadField({
      name: 'companyLogo',
      required: true,
      folderHint: 'web/case-study',
      description: 'Company wordmark shown beside the company name.',
      guidance: {
        dimensions: '≥ 200 × 200 px',
        aspectRatio: 'Square or horizontal wordmark',
        note: 'Rendered small beside the company name. Transparent PNG or SVG preferred.',
      },
    }),
    mediaUploadField({
      name: 'coverImage',
      folderHint: 'web/case-study',
      description: 'Optional card thumbnail image.',
      guidance: {
        dimensions: '1600 × 900 px',
        aspectRatio: '16:9 (landscape)',
        note: 'Card thumbnail. Cropped to fill — keep the subject centered. Min 1280 px wide.',
      },
    }),
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'Card blurb — two or three sentences. Shown on the listing card and as the detail hero standfirst. The full story goes in Body below, not here.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      admin: {
        description:
          'The case study itself, rendered under "What happened" on the detail page. Leave empty and the page invites the reader to the PDF instead.',
      },
    },
    {
      name: 'outcomes',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Outcome', plural: 'Outcomes' },
      admin: {
        description:
          'Headline figures for the detail hero. Publish only what the customer has approved — these are the most prominent claim on the page. No outcomes and the hero shows their quote instead.',
      },
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "Up to 88%", "3x", "Zero".' },
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "less vulnerability noise". Lowercase, no full stop.' },
        },
      ],
    },
    {
      name: 'glance',
      type: 'array',
      maxRows: 4,
      labels: { singular: 'Fact', plural: 'At a glance' },
      admin: {
        description:
          'Environment facts for the rail beside the article. Company, industry and publish date are added automatically — add what those do not cover.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "Migrated from".' },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: { description: 'e.g. "Bitnami images".' },
        },
      ],
    },
    {
      name: 'quote',
      type: 'textarea',
      admin: {
        description:
          'Approved customer quote. Shown on the detail page — in the hero card when there are no outcomes, in its own band when there are. Do not paste the summary back in here.',
      },
    },
    {
      name: 'quoteAuthor',
      type: 'text',
      admin: {
        description: 'Who said it.',
        condition: (_data, sibling) => Boolean(sibling?.quote),
      },
    },
    {
      name: 'quoteRole',
      type: 'text',
      admin: {
        description: 'Their role and company, e.g. "Head of Risk and App Security, IIFL Finance".',
        condition: (_data, sibling) => Boolean(sibling?.quote),
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'Spotlight this study at the top of the listing. With none set the newest published study is used.',
      },
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX['case-studies'] },
          },
        },
      },
    },
    mediaUploadField({
      name: 'asset',
      required: true,
      folderHint: 'web/case-study',
      description: 'Downloadable case-study PDF. Routed to web/case-study/ in R2.',
      accept: ['application/pdf'],
    }),
    publishedAtField,
    ...seoSidebarFields({
      pathPrefix: ROUTE_PREFIX['case-studies'],
      descriptionSource: 'summary',
    }),
    ...seoFieldsForSidebar('case-studies'),
  ],
  hooks: {
    beforeChange: [normalizeLexicalHook(), firstPublishHook()],
    afterChange: [
      slugChangeRedirectHook('case-studies'),
      schemaOverrideAuditHook('case-studies'),
      searchSyncAfterChangeHook('case-studies'),
      webhooksPublishAfterChangeHook('case-studies'),
      indexNowPublishAfterChangeHook('case-studies'),
      revalidateWebPublishAfterChangeHook('case-studies'),
    ],
    afterDelete: [
      searchSyncAfterDeleteHook('case-studies'),
      revalidateWebAfterDeleteHook('case-studies'),
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
