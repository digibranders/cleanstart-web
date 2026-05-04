import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

export const NewsCategories: CollectionConfig = {
  slug: 'newsCategories',
  labels: { singular: 'News category', plural: 'News categories' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'updatedAt'],
    group: 'Taxonomies',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: buildTaxonomyFields('newsCategories'),
  hooks: {
    afterChange: [slugChangeRedirectHook('newsCategories')],
  },
  versions: { drafts: true },
  timestamps: true,
};
