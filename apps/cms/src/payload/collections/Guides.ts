import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';

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
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'authors',
      hasMany: true,
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
      name: 'faqs',
      type: 'array',
      labels: { singular: 'FAQ', plural: 'FAQs' },
      admin: {
        description:
          'Replaces Webflow Q1…Q5 / Ans1…Ans5. Drives FAQPage JSON-LD when non-empty.',
      },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'richText', required: true },
      ],
    },
    {
      name: 'articleSections',
      type: 'array',
      labels: { singular: 'Section', plural: 'Article sections' },
      admin: {
        description: 'Replaces Webflow Article About 1…8.',
      },
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'body', type: 'richText', required: true },
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
      name: 'readingMinutes',
      type: 'number',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Computed from body word count on save (Phase D hook).',
        position: 'sidebar',
      },
    },
    {
      name: 'wordCount',
      type: 'number',
      access: { update: () => false },
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    seoField,
  ],
  hooks: {
    afterChange: [slugChangeRedirectHook('guides')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
