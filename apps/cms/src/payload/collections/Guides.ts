import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
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

export const Guides: CollectionConfig = {
  slug: 'guides',
  labels: { singular: 'Guide', plural: 'Guides' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'authors', 'reviewedBy', '_status', 'lastReviewedAt', 'updatedAt'],
    group: 'Content',
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
    mediaUploadField({ name: 'heroImage', folderHint: 'web/guide' }),
    { name: 'body', type: 'richText' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      filterOptions: {
        acceptingNewBylines: { not_equals: false },
      },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'authors',
      admin: {
        description:
          'Author who reviewed this guide. Surfaced in JSON-LD reviewedBy + Person — high-leverage E-E-A-T signal.',
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
          'Replaces Webflow Q1…Q5 / Ans1…Ans5. Drives FAQPage JSON-LD when non-empty.',
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
        description:
          'Replaces Webflow Article keyword 1…10. Surfaced in JSON-LD mentions[] as Thing entities (AEO/GEO signal).',
      },
      fields: [{ name: 'keyword', type: 'text', required: true }],
    },
    {
      name: 'relatedGuides',
      type: 'relationship',
      relationTo: 'guides',
      hasMany: true,
    },
    {
      name: 'bodyStats',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/payload/admin/components/BodyStatsField.tsx#BodyStatsField',
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
            clientProps: { pathPrefix: '/guides' },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: '/guides', descriptionSource: 'abstract' }),
    {
      // Data-only — surfaced via the `bodyStats` pill at the top of the
      // sidebar. Hidden here so the form doesn't double-render.
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
        description: 'Auto-built from H2/H3 headings in the body on save.',
        components: {
          RowLabel: '@/payload/admin/components/TocRowLabel.tsx#TocRowLabel',
        },
      },
      fields: [
        { name: 'level', type: 'number' },
        { name: 'text', type: 'text' },
        { name: 'anchor', type: 'text' },
      ],
    },
    ...seoFieldsForSidebar('guides'),
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
      slugChangeRedirectHook('guides'),
      schemaOverrideAuditHook('guides'),
      searchSyncAfterChangeHook('guides'),
      webhooksPublishAfterChangeHook('guides'),
      indexNowPublishAfterChangeHook('guides'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('guides')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
