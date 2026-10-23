import type { CollectionConfig } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { contentUpdatedAtField } from '../fields/content-updated-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { faqsBulkPasteField, faqsField } from '../fields/faqs';
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
import { ROUTE_PREFIX } from '../lib/route-prefixes';

const ABSTRACT_CHAR_HINT = 160;

/**
 * Security advisories: one write-up per vulnerability disclosure, listed at
 * `/advisories` under the Resources menu. Same editorial shape as Blogs
 * (authors, FAQs, TOC, SEO, schedule publish) minus the blog-only sidebar CTA
 * picks and previous/next journey fields.
 */
export const Advisories: CollectionConfig = {
  slug: 'advisories',
  labels: { singular: 'Advisory', plural: 'Advisories' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', '_status', 'publishedAt', 'updatedAt'],
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
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({
      name: 'heroImage',
      folderHint: 'web/general',
      guidance: {
        dimensions: '1600 × 900 px',
        aspectRatio: '16:9 (landscape)',
        note: 'Cover for the listing cards and the featured hero. Cropped to fill, so keep the subject centered. Min 1280 px wide.',
      },
    }),
    { name: 'body', type: 'richText' },
    faqsBulkPasteField,
    faqsField,
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
      admin: {
        description:
          'Multi-author supported: every byline is credited in JSON-LD author[]. Authors with "accepting new bylines" off are hidden from the picker.',
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'authors' },
          },
        },
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        description: 'Author who reviewed this advisory for accuracy. Surfaced in JSON-LD reviewedBy.',
      },
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        description:
          'Date of the most recent review pass. When unset, falls back to updatedAt with a note in the SEO panel.',
        date: { pickerAppearance: 'dayAndTime' },
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
    ...seoFieldsForSidebar('advisories'),
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Shown in the /advisories hero. When none is featured, the newest advisory is.',
      },
    },
  ],
  hooks: {
    beforeChange: [
      normalizeLexicalHook(),
      contentUpdatedAtHook(),
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
