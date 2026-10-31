import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugField } from '../fields/slug';
import {
  revalidateWebAfterDeleteHook,
  revalidateWebPublishAfterChangeHook,
} from '../hooks/revalidate-web-publish';

/**
 * Topics for /videos. Topics are filters on the listing, not pages, so this
 * taxonomy has no SEO fields, no drafts and no URL of its own. `aliases` are the
 * YouTube tags and hashtags that should suggest the topic on import.
 */
export const VideoTopics: CollectionConfig = {
  slug: 'videoTopics',
  labels: { singular: 'Video topic', plural: 'Video topics' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Taxonomies',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField({ source: 'name' }),
    { name: 'description', type: 'textarea' },
    {
      name: 'aliases',
      type: 'array',
      labels: { singular: 'Alias', plural: 'Aliases' },
      admin: {
        description:
          'YouTube tags and hashtags that suggest this topic on import, e.g. "sbom" or "software bill of materials". Case and spacing are ignored.',
      },
      fields: [{ name: 'value', type: 'text', required: true }],
    },
  ],
  hooks: {
    afterChange: [revalidateWebPublishAfterChangeHook('videoTopics')],
    afterDelete: [revalidateWebAfterDeleteHook('videoTopics')],
  },
  timestamps: true,
};
