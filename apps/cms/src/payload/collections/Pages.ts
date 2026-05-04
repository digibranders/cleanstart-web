import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';

/**
 * Page-builder host collection. Block schemas are added in Phase C; for now
 * `layout` is an empty blocks array so the schema is valid and types compile.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', '_status', 'publishedAt', 'updatedAt'],
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
      name: 'parent',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        description: 'Optional parent page. Builds nested URLs (e.g. /solutions/fips).',
      },
    },
    {
      name: 'path',
      type: 'text',
      access: { update: () => false },
      admin: {
        readOnly: true,
        description: 'Computed full URL path. System-managed by the path-builder hook (Phase D).',
        position: 'sidebar',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [],
      admin: {
        description:
          'Page-builder content. Block library lands in Phase C — Hero, FeatureGrid, FAQ, CTA, etc.',
      },
    },
    {
      name: 'pageLayout',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Default', value: 'default' },
        { label: 'Narrow', value: 'narrow' },
        { label: 'Full-bleed', value: 'full-bleed' },
      ],
      admin: {
        description: 'Container width and chrome. Block picker filters by layout in Phase C.',
        position: 'sidebar',
      },
    },
    seoField,
  ],
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 25 },
  timestamps: true,
};
