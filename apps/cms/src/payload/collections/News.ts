import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';
import { bodyStatsHook } from '../hooks/body-stats';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { validateOptionalUrl } from '../lib/url-shape';

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News article', plural: 'News' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'newsCategories', 'publicationDate', '_status', 'updatedAt'],
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
    { name: 'abstract', type: 'textarea' },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
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
      name: 'newsCategories',
      type: 'relationship',
      relationTo: 'newsCategories',
      hasMany: true,
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Optional. For press pickups / coverage on external outlets.',
      },
      validate: validateOptionalUrl,
    },
    {
      name: 'permalink',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/payload/admin/components/PermalinkField.tsx#PermalinkField',
            clientProps: { pathPrefix: '/news' },
          },
        },
      },
    },
    ...seoSidebarFields({ pathPrefix: '/news', descriptionSource: 'abstract' }),
    {
      name: 'publicationDate',
      type: 'date',
      required: true,
      admin: {
        description: 'Defaults to now on first publish.',
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'relatedNews',
      type: 'relationship',
      relationTo: 'news',
      hasMany: true,
    },
    {
      name: 'readingMinutes',
      type: 'number',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Computed from body word count on save.',
        position: 'sidebar',
      },
    },
    {
      name: 'wordCount',
      type: 'number',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Total words in the body. Computed on save.',
        position: 'sidebar',
      },
    },
    seoField,
  ],
  hooks: {
    beforeChange: [
      bodyStatsHook({
        fields: { readingMinutes: 'readingMinutes', wordCount: 'wordCount' },
      }),
    ],
    afterChange: [slugChangeRedirectHook('news')],
  },
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
