import type { CollectionConfig } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { mediaUploadField } from '../fields/media-upload';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { schemaHealthListField, seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { bodyStatsHook } from '../hooks/body-stats';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
import { firstPublishHook } from '../hooks/first-publish';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

const ABSTRACT_CHAR_HINT = 160;

export const KnowledgeBase: CollectionConfig = {
  slug: 'knowledgeBase',
  labels: { singular: 'Knowledge article', plural: 'Knowledge Hub' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'schemaHealth', '_status', 'lastReviewedAt', 'updatedAt'],
    group: 'Content',
    description:
      'Technical knowledge-base articles surfaced under /knowledge-hub. Each article gets its own indexable URL — replaces the single-page Webflow KB.',
    components: {
      edit: docStatusBarEditConfig({ showStats: true, showPublishedAt: true }),
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
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback and the listing-card lede. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/general' }),
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        description:
          'Optional lesson video (direct MP4 URL). When set, a "Watch the Lesson" player renders above the article body on /knowledge-hub.',
      },
    },
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
        initCollapsed: true,
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
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: '/knowledge-hub', descriptionSource: 'abstract' }),
    {
      name: 'tocDepth',
      type: 'select',
      defaultValue: 'h2',
      options: [
        { label: 'H2 only', value: 'h2' },
        { label: 'H2 + H3', value: 'h2_h3' },
        { label: 'H2 + H3 + H4', value: 'h2_h3_h4' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Heading levels that appear in the Table of Contents. Re-save to apply.',
      },
    },
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
        components: {
          RowLabel: '@/payload/admin/components/TocRowLabel.tsx#TocRowLabel',
        },
      },
      fields: [
        // `level` + `text` are auto-derived and rendered in the row
        // summary — hidden from the row body to keep TOC rows compact.
        // Only `anchor` is exposed on expand (the slug used in the
        // permalink fragment).
        {
          name: 'level',
          type: 'number',
          admin: {
            readOnly: true,
            components: { Field: '@/payload/admin/components/HiddenField.tsx#HiddenField' },
          },
        },
        {
          name: 'text',
          type: 'text',
          admin: {
            readOnly: true,
            components: { Field: '@/payload/admin/components/HiddenField.tsx#HiddenField' },
          },
        },
        { name: 'anchor', type: 'text', admin: { readOnly: true } },
      ],
    },
    ...seoFieldsForSidebar('knowledgeBase'),
    schemaHealthListField('knowledgeBase'),
  ],
  hooks: {
    beforeChange: [
      normalizeLexicalHook(),
      firstPublishHook(),
      displayPublishedAtBackfillHook,
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
      slugChangeRedirectHook('knowledgeBase'),
      schemaOverrideAuditHook('knowledgeBase'),
      displayPublishedAtAuditHook('knowledgeBase'),
      searchSyncAfterChangeHook('knowledgeBase'),
      webhooksPublishAfterChangeHook('knowledgeBase'),
      indexNowPublishAfterChangeHook('knowledgeBase'),
      revalidateWebPublishAfterChangeHook('knowledgeBase'),
    ],
    afterDelete: [
      searchSyncAfterDeleteHook('knowledgeBase'),
      revalidateWebAfterDeleteHook('knowledgeBase'),
    ],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
