import type { CollectionConfig, Field } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { contentUpdatedAtField } from '../fields/content-updated-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { faqsField } from '../fields/faqs';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { bodyStatsHook } from '../hooks/body-stats';
import { contentUpdatedAtHook } from '../hooks/content-updated-at';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
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
import { ADVISORY_STATUS_OPTIONS } from '../lib/advisory-status';
import { ROUTE_PREFIX } from '../lib/route-prefixes';

const ABSTRACT_CHAR_HINT = 160;
const CVE_PATTERN = /^CVE-\d{4}-\d{4,}$/;

/**
 * Fields from the first, blog-shaped advisory model (2026-10-23). Kept defined
 * so their columns stay in place until a separately approved migration drops
 * them; hidden so editors never see them.
 */
const hidden = (field: Field): Field =>
  ({ ...field, admin: { ...('admin' in field ? field.admin : {}), hidden: true } }) as Field;

/**
 * Security advisories, listed at `/advisories` under the Resources menu. One
 * document per vulnerability disclosure: CVE IDs, CVSS score and CleanStart fix
 * status drive the listing table and its filters; the article is one rich-text
 * body that editors paste whole.
 */
export const Advisories: CollectionConfig = {
  slug: 'advisories',
  labels: { singular: 'Advisory', plural: 'Advisories' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'cves', 'technology', 'fixStatus', '_status', 'publishedAt'],
    group: 'Content',
    components: {
      edit: docStatusBarEditConfig({ showStats: true, showPublishedAt: true, showPurge: true }),
    },
  },
  access: {
    read: publishedOrAuthenticated,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      ...contentTitleField,
      label: 'Vulnerability name',
      admin: { description: 'e.g. Node.js Brotli decoder out-of-bounds write. The CVE IDs are shown before it.' },
    },
    slugField({ source: 'title' }),
    {
      name: 'cves',
      label: 'CVE IDs',
      type: 'text',
      hasMany: true,
      required: true,
      hooks: {
        beforeChange: [
          ({ value }) =>
            Array.isArray(value) ? value.map((v) => String(v).trim().toUpperCase()) : value,
        ],
      },
      validate: (value: string[] | null | undefined): true | string => {
        if (!value || value.length === 0) return 'Add at least one CVE ID.';
        const bad = value.filter((v) => !CVE_PATTERN.test(String(v).trim().toUpperCase()));
        return bad.length === 0 ? true : `Not a CVE ID: ${bad.join(', ')}. Use the form CVE-2026-111497.`;
      },
      admin: {
        description:
          'Type one ID (e.g. CVE-2026-111497) and press Enter. To add more, type the next ID and press Enter again; use the x on an ID to remove it. Searchable on the listing.',
      },
    },
    {
      name: 'technology',
      type: 'text',
      required: true,
      admin: {
        description:
          'e.g. Node.js, PHP, OpenSSL. Free text: the listing filter is built from the values in use, so keep the spelling consistent.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'cvssScore',
          label: 'CVSS score',
          type: 'number',
          required: true,
          min: 0,
          max: 10,
          admin: {
            step: 0.1,
            width: '50%',
            description: 'e.g. 9.2. The rating (Critical, High, Medium, Low) is derived from the score.',
          },
        },
        {
          // Not `status`: its enum would be named enum_advisories_status, which
          // is already the drafts `_status` enum.
          name: 'fixStatus',
          label: 'Status',
          type: 'select',
          required: true,
          defaultValue: 'identified',
          options: [...ADVISORY_STATUS_OPTIONS],
          admin: { width: '50%', description: 'Where CleanStart stands on this vulnerability.' },
        },
      ],
    },
    {
      name: 'coverTitle',
      label: 'Cover title',
      type: 'text',
      maxLength: 80,
      admin: {
        description:
          'Text shown on the cover of the listing card. Leave blank to use the vulnerability name. Keep it short: long text is shrunk or clipped on the cover.',
      },
    },
    {
      name: 'abstract',
      label: 'Summary',
      type: 'textarea',
      admin: {
        description: `One or two sentences. Used as the SEO description when none is set. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    {
      name: 'body',
      label: 'Advisory content',
      type: 'richText',
      admin: {
        description:
          'Paste the whole write-up here. Use a Heading 2 for each section: Vulnerability, Impacted packages and versions, Resolution. Tables, code and the pull command all go in this one box.',
      },
    },
    // Replaced by the single content box above (2026-10-28). Columns stay until
    // a separately approved migration drops them; the web page still renders
    // them for any advisory that has not been merged yet.
    hidden({ name: 'impact', label: 'Impacted packages and versions', type: 'richText' }),
    hidden({ name: 'resolution', type: 'richText' }),
    hidden(
      mediaUploadField({
        name: 'heroImage',
        folderHint: 'web/general',
        guidance: {
          dimensions: '1600 × 900 px',
          aspectRatio: '16:9 (landscape)',
          note: 'Cover for the listing cards and the featured hero. Cropped to fill, so keep the subject centered. Min 1280 px wide.',
        },
      }),
    ),
    hidden(faqsField),
    hidden({
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
    }),
    hidden({ name: 'reviewedBy', type: 'relationship', relationTo: 'authors' }),
    hidden({ name: 'lastReviewedAt', type: 'date' }),
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: ROUTE_PREFIX.advisories },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    contentUpdatedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.advisories, descriptionSource: 'abstract' }),
    {
      name: 'readingMinutes',
      type: 'number',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'wordCount',
      type: 'number',
      access: { update: () => false },
      admin: { readOnly: true, hidden: true },
    },
    hidden({
      name: 'tocDepth',
      type: 'select',
      defaultValue: 'h2',
      options: [
        { label: 'H2 only', value: 'h2' },
        { label: 'H2 + H3', value: 'h2_h3' },
        { label: 'H2 + H3 + H4', value: 'h2_h3_h4' },
      ],
    }),
    hidden({
      name: 'tableOfContents',
      type: 'array',
      access: { update: () => false },
      fields: [
        { name: 'level', type: 'number' },
        { name: 'text', type: 'text' },
        { name: 'anchor', type: 'text' },
      ],
    }),
    ...seoFieldsForSidebar('advisories'),
    hidden({ name: 'featured', type: 'checkbox', defaultValue: false }),
  ],
  hooks: {
    beforeChange: [
      normalizeLexicalHook(),
      contentUpdatedAtHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
      // Feeds readingMinutes, which the publish gate reads to refuse an empty advisory.
      bodyStatsHook({
        fields: {
          readingMinutes: 'readingMinutes',
          wordCount: 'wordCount',
          tableOfContents: 'tableOfContents',
        },
        tocLevelsField: 'tocDepth',
      }),
    ],
    afterChange: [
      slugChangeRedirectHook('advisories'),
      schemaOverrideAuditHook('advisories'),
      displayPublishedAtAuditHook('advisories'),
      searchSyncAfterChangeHook('advisories'),
      webhooksPublishAfterChangeHook('advisories'),
      indexNowPublishAfterChangeHook('advisories'),
      revalidateWebPublishAfterChangeHook('advisories'),
    ],
    afterDelete: [
      searchSyncAfterDeleteHook('advisories'),
      revalidateWebAfterDeleteHook('advisories'),
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
