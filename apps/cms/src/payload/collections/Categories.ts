import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
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
  fields: buildTaxonomyFields('categories'),
  versions: { drafts: true },
  timestamps: true,
};
