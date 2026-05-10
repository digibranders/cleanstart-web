import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { bodyStatsHook } from '../hooks/body-stats';
import { firstPublishHook } from '../hooks/first-publish';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

const ABSTRACT_CHAR_HINT = 160;

export const KnowledgeBase: CollectionConfig = {
  slug: 'knowledgeBase',
  labels: { singular: 'Knowledge article', plural: 'Knowledge Hub' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', '_status', 'lastReviewedAt', 'updatedAt'],
    group: 'Content',
    description:
      'Technical knowledge-base articles surfaced under /knowledge-hub. Each article gets its own indexable URL — replaces the single-page Webflow KB.',
    components: {
      edit: docStatusBarEditConfig({ showStats: true, showPublishedAt: true }),
    },
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField({ source: 'title' }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback and the listing-card lede. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/general' }),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'knowledgeCategories',
      required: true,
      admin: {
        description:
          'Editorial taxonomy — drives the sidebar grouping on /knowledge-hub. Pick the most-specific leaf category; ancestors are inferred via the category parent chain.',
      },
    },
    { name: 'body', type: 'richText' },
    {
      name: 'faqsBulkPaste',
      type: 'ui',
      admin: {
        components: {
          Field: {
            path: '@/payload/admin/components/FaqBulkPaste.tsx#FaqBulkPaste',
            clientProps: { targetField: 'faqs' },
          },
        },
      },
    },
    {
      name: 'faqs',
      type: 'array',
      labels: { singular: 'FAQ', plural: 'FAQs' },
      admin: {
        description:
          'Optional. When non-empty, emits FAQPage JSON-LD on the rendered page.',
        components: {
          RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
        },
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        description:
          'Author who reviewed this article for technical accuracy. Surfaced in JSON-LD reviewedBy + Person — high-leverage E-E-A-T signal for KB content.',
      },
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        description:
          'Date of the most recent technical review. Surfaced as Schema.org dateReviewed.',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'knowledgeBase',
      hasMany: true,
      admin: {
        description: 'Manually curated. Empty = listing component picks by category.',
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
            clientProps: { pathPrefix: '/knowledge-hub' },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: '/knowledge-hub', descriptionSource: 'abstract' }),
    {
      // Data-only — surfaced via the DocStatusBar in the top status bar.
      // Hidden here so the form doesn't double-render.
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
    {
      name: 'tableOfContents',
      type: 'array',
      access: { update: () => false },
      labels: { singular: 'Heading', plural: 'Table of contents' },
      admin: {
        readOnly: true,
        initCollapsed: true,
        description: 'Auto-built from H2/H3 headings in the body on save.',
        components: {
          RowLabel: '@/payload/admin/components/TocRowLabel.tsx#TocRowLabel',
        },
      },
      fields: [
        // Sub-fields explicitly readOnly: parent array's
        // `admin.readOnly` doesn't propagate to children rendered by
        // custom Field adapters.
        { name: 'level', type: 'number', admin: { readOnly: true } },
        { name: 'text', type: 'text', admin: { readOnly: true } },
        { name: 'anchor', type: 'text', admin: { readOnly: true } },
      ],
    },
    ...seoFieldsForSidebar('knowledgeBase'),
  ],
  hooks: {
    beforeChange: [
      firstPublishHook(),
      bodyStatsHook({
        fields: {
          readingMinutes: 'readingMinutes',
          wordCount: 'wordCount',
          tableOfContents: 'tableOfContents',
        },
      }),
    ],
    afterChange: [
      slugChangeRedirectHook('knowledgeBase'),
      schemaOverrideAuditHook('knowledgeBase'),
      searchSyncAfterChangeHook('knowledgeBase'),
      webhooksPublishAfterChangeHook('knowledgeBase'),
      indexNowPublishAfterChangeHook('knowledgeBase'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('knowledgeBase')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
