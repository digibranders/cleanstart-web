import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
import { publishedAtField } from '../fields/published-at';
import { displayPublishedAtField } from '../fields/display-published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { bodyStatsHook } from '../hooks/body-stats';
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { displayPublishedAtAuditHook } from '../hooks/display-published-at-audit';
import { displayPublishedAtBackfillHook } from '../hooks/display-published-at-backfill';
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

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  labels: { singular: 'Blog post', plural: 'Blogs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', 'categories', '_status', 'publishedAt', 'updatedAt'],
    group: 'Content',
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
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/blog' }),
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
        // Start collapsed — long answer paragraphs make an expanded
        // 5-FAQ list dominate the form; the row summary already shows
        // the question text, so collapsed is the better default.
        initCollapsed: true,
        components: {
          RowLabel: '@/payload/admin/components/FaqRowLabel.tsx#FaqRowLabel',
        },
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        // Plain-text answer — matches Schema.org `acceptedAnswer.text`
        // and keeps each FAQ row compact. Multiple paragraphs via
        // line breaks.
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        // Exclude authors who've toggled themselves out of the picker.
        // Existing bylines stay intact (the saved relation still resolves).
        acceptingNewBylines: { not_equals: false },
      },
      admin: {
        description:
          'Multi-author supported — every byline is credited in JSON-LD author[]. Authors with "accepting new bylines" off are hidden from the picker.',
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
        description:
          'Author who reviewed this post for accuracy. Surfaced in JSON-LD reviewedBy + Person — high-leverage E-E-A-T signal.',
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
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: false,
      admin: {
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'categories' },
          },
        },
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blogs',
      hasMany: true,
      admin: {
        description:
          'Pin up to 3 posts the reader should see next. Curated picks appear first, in this order. Empty slots auto-fill with the latest from this post\'s category, then with the latest site-wide.',
      },
    },
    {
      name: 'previousPost',
      type: 'relationship',
      relationTo: 'blogs',
      hasMany: false,
      admin: {
        description:
          'Optional. The post the reader should have read before this one. If unset, the page auto-fills with the chronologically previous published blog (same category preferred). Renders below the author card and adds <link rel="prev"> for SEO.',
      },
    },
    {
      name: 'nextPost',
      type: 'relationship',
      relationTo: 'blogs',
      hasMany: false,
      admin: {
        description:
          'Optional. The post the reader should read after this one. If unset, the page auto-fills with the chronologically next published blog (same category preferred). Renders below the author card and adds <link rel="next"> for SEO.',
      },
    },
    {
      name: 'journeyMirrorWarning',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/payload/admin/components/JourneyMirrorWarning.tsx#JourneyMirrorWarning',
        },
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
            clientProps: { pathPrefix: ROUTE_PREFIX.blogs },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: ROUTE_PREFIX.blogs, descriptionSource: 'abstract' }),
    {
      // Data-only — surfaced via the DocStatusBar in the top status bar.
      // Hidden here so the form doesn't double-render the value as a
      // full-size number input.
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
        // Start each TOC row collapsed — they're auto-generated read-only
        // metadata. The row summary surfaces the heading text inline so
        // expand only reveals the slug-anchor.
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
    ...seoFieldsForSidebar('blogs'),
    {
      // Editorial flags — separated from the SEO band by a divider
      // styled in `_sidebar-seo.scss`. Payload's sidebar render places
      // the `seoAdvanced` UI field at the very end of the rail
      // regardless of source-order; featured / pinned therefore land
      // between Head/Header tags (last T4 card) and SEO Advanced
      // (T5). The SCSS divider sits ABOVE featured to mark the
      // SEO → editorial boundary. SEO Advanced as the final card is
      // an acceptable end-of-rail anchor for the expert toolbox.
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
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
      slugChangeRedirectHook('blogs'),
      schemaOverrideAuditHook('blogs'),
      displayPublishedAtAuditHook('blogs'),
      searchSyncAfterChangeHook('blogs'),
      webhooksPublishAfterChangeHook('blogs'),
      indexNowPublishAfterChangeHook('blogs'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('blogs')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
