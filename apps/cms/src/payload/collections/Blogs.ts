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
        description: `Drives the SEO description fallback. Aim for ≤ ${ABSTRACT_CHAR_HINT} characters.`,
      },
    },
    mediaUploadField({ name: 'heroImage', folderHint: 'web/blog' }),
    { name: 'body', type: 'richText' },
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
      hasMany: true,
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
        // Plain-text answer — matches Schema.org `acceptedAnswer.text`
        // and keeps each FAQ row compact. Multiple paragraphs via
        // line breaks.
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'blogs',
      hasMany: true,
      admin: { description: 'Manually curated. Empty = listing component picks by category.' },
    },
    {
      // Glanceable stats at the very top of the sidebar — editors check
      // word count + reading minutes constantly while drafting. Compact
      // pill row replaces the two full-width read-only number fields.
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
            clientProps: { pathPrefix: '/blog' },
          },
        },
      },
    },
    schemaAddonsField,
    publishedAtField,
    ...seoSidebarFields({ pathPrefix: '/blog', descriptionSource: 'abstract' }),
    {
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
    {
      // Data-only — surfaced as a compact pill at the top of the sidebar
      // via `bodyStats` (BodyStatsField). Hidden here so the form doesn't
      // double-render the value as a full-size number input.
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
    ...seoFieldsForSidebar('blogs'),
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
      slugChangeRedirectHook('blogs'),
      schemaOverrideAuditHook('blogs'),
      searchSyncAfterChangeHook('blogs'),
      webhooksPublishAfterChangeHook('blogs'),
    ],
    afterDelete: [searchSyncAfterDeleteHook('blogs')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
