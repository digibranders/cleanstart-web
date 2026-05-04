import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';

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
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
      admin: {
        description:
          'Multi-author supported — every byline is credited in JSON-LD author[]. Defaults to current user on draft create (Phase D hook).',
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
    },
    {
      name: 'faqs',
      type: 'array',
      labels: { singular: 'FAQ', plural: 'FAQs' },
      admin: {
        description:
          'Optional. When non-empty, emits FAQPage JSON-LD on the rendered page.',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
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
      name: 'readingMinutes',
      type: 'number',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Computed from body word count on save (Phase D hook).',
        position: 'sidebar',
      },
    },
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('blogs')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
