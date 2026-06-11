import type { CollectionConfig } from 'payload';

import { isAdminOrEditor, publishedOrAuthenticated } from '../access';
import { docStatusBarEditConfig } from '../admin/doc-status-bar-mount';
import { ROUTE_PREFIX } from '../lib/route-prefixes';
import { mediaUploadField } from '../fields/media-upload';
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
import { normalizeLexicalHook } from '../hooks/normalize-lexical';
import { schemaOverrideAuditHook } from '../hooks/schema-override-audit';
import {
  searchSyncAfterChangeHook,
  searchSyncAfterDeleteHook,
} from '../hooks/search-sync';
import { indexNowPublishAfterChangeHook } from '../hooks/indexnow-publish';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { webhooksPublishAfterChangeHook } from '../hooks/webhooks-publish';

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
    contentTitleField,
    slugField({ source: 'title' }),
    {
      name: 'abstract',
      type: 'textarea',
      admin: {
        description: `Drives the SEO description fallback and listing-card lede. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/guide' }),
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
      name: 'articleSections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Article sections' },
      admin: {
        description:
          'Replaces Webflow Article About 1…8. Each section is one step when "Emit HowTo schema" is on below.',
      },
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText', required: true },
      ],
    },
    {
      type: 'group',
      name: 'howTo',
      label: 'How-to schema',
      admin: {
        description:
          'When on, the guide emits a Schema.org HowTo blob alongside the TechArticle, treating each Article Section as a step. Use only for genuine procedural content (e.g. "How to harden your SSH server in 6 steps") — Google penalises HowTo on non-procedural articles.',
      },
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'totalTime',
          type: 'text',
          admin: {
            description:
              'ISO 8601 duration for the entire guide (e.g. PT30M = 30 minutes, PT1H30M = 1 hour 30 min).',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
        },
        {
          name: 'prepTime',
          type: 'text',
          admin: {
            description: 'ISO 8601 prep duration (optional).',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
        },
        {
          name: 'performTime',
          type: 'text',
          admin: {
            description: 'ISO 8601 active-work duration (optional).',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
        },
        {
          name: 'estimatedCost',
          type: 'text',
          admin: {
            description: 'Optional cost hint (e.g. "$0", "$50 in tooling").',
            condition: (_data, sibling) => sibling?.enabled === true,
          },
        },
      ],
    },
    {
      name: 'citations',
      type: 'array',
      labels: { singular: 'Citation', plural: 'Citations' },
      admin: {
        description:
          'Replaces Webflow Article Mentions 1…10. Each citation surfaces in JSON-LD citation[].',
      },
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'source', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'keywords',
      type: 'array',
      labels: { singular: 'Keyword', plural: 'Keywords' },
      admin: {
        // Superseded by the shared `seo.keywords` sidebar card. Kept as a
        // hidden data field for back-compat reads (dispatch/search merge
        // it as a fallback) until a later migration drops the column.
        hidden: true,
        description:
          'Legacy — edit topic keywords in the SEO sidebar (Topic keywords). Retained for back-compat.',
      },
      fields: [{ name: 'keyword', type: 'text', required: true }],
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
    ],
    afterDelete: [searchSyncAfterDeleteHook('guides')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
