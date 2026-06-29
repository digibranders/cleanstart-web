import type { CollectionConfig } from 'payload';
import { purgePageUiField } from '../fields/purge-page-ui';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { displayPublishedAtField } from '../fields/display-published-at';
import { publishedAtField } from '../fields/published-at';
import { schemaAddonsField } from '../fields/schema-addons';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { contentTitleField } from '../fields/title';
import { bodyStatsHook } from '../hooks/body-stats';
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

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', 'reviewedBy', '_status', 'lastReviewedAt', 'updatedAt'],
    group: 'Content',
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
    purgePageUiField,
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback and listing-card lede. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    {
      name: 'coverTitle',
      type: 'text',
      maxLength: 80,
      admin: {
        description:
          "Title shown on the guide's auto-generated cover (listing / related cards) and its social-share image. Leave blank to derive it from the document title. Keep it short — long titles are clipped on the cover.",
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
        // List-view cell parity with Blogs / News / Categories. Payload's
        // default relationship cell renders "<No Authors>" placeholder text
        // and (on this specific list) was implicated in a hydration-time
        // error after page load. Custom RelationshipCell resolves the
        // related doc's `useAsTitle` and caches across rows.
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
          'Author who reviewed this guide. Surfaced in JSON-LD reviewedBy + Person — high-leverage E-E-A-T signal.',
        components: {
          Cell: {
            path: '@/payload/admin/components/RelationshipCell.tsx#RelationshipCell',
            clientProps: { collectionSlug: 'authors' },
          },
        },
      },
    },
    {
      name: 'lastReviewedAt',
      type: 'date',
      admin: {
        description: 'Editorial-freshness signal. Surfaced in JSON-LD dateReviewed.',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'citations',
      type: 'array',
      labels: { singular: 'Citation', plural: 'Citations' },
      admin: {
        initCollapsed: true,
        description: 'Sources mentioned in this guide. Each citation surfaces in JSON-LD citation[].',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'source', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'relatedGuides',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
      admin: {
        description:
          'Pin up to 3 guides to surface at the bottom of this guide. Curated picks appear first, in this order; empty slots auto-fill with the most recent guides.',
      },
    },
    {
      name: 'previousGuide',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: false,
      admin: {
        description:
          'Optional. The guide the reader should have read before this one. If unset, the page auto-fills the chronological previous guide.',
      },
    },
    {
      name: 'nextGuide',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: false,
      admin: {
        description:
          'Optional. The guide the reader should read after this one. If unset, the page auto-fills the chronological next guide.',
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
            clientProps: { pathPrefix: ROUTE_PREFIX.guides },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    displayPublishedAtField,
    ...seoSidebarFields({ pathPrefix: '/guide', descriptionSource: 'abstract' }),
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
        // Auto-derived from the body on every save (bodyStatsHook). Editors
        // never touch it and it renders on the live page, so it's hidden
        // from the form to declutter the editor. Data column is unchanged.
        hidden: true,
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
    ...seoFieldsForSidebar('guides'),
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
      slugChangeRedirectHook('guides'),
      schemaOverrideAuditHook('guides'),
      displayPublishedAtAuditHook('guides'),
      searchSyncAfterChangeHook('guides'),
      webhooksPublishAfterChangeHook('guides'),
      indexNowPublishAfterChangeHook('guides'),
      revalidateWebPublishAfterChangeHook('guides'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('guides'), revalidateWebAfterDeleteHook('guides')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
