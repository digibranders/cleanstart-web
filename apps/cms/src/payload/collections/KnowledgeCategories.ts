import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

export const KnowledgeCategories: CollectionConfig = {
  slug: 'knowledgeCategories',
  labels: { singular: 'Knowledge category', plural: 'Knowledge categories' },
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
  fields: buildTaxonomyFields('knowledgeCategories'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('knowledgeCategories')],
    afterChange: [slugChangeRedirectHook('knowledgeCategories')],
  },
  versions: { drafts: true },
  timestamps: true,
};
