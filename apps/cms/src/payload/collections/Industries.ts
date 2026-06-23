import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Industry taxonomy for Case Studies. Promoted from the hardcoded
 * `case-studies.industry` select enum so editors can manage the list and
 * each industry can carry metadata (description, icon, SEO) for a landing
 * page. Seeded from the original enum options; `slug` equals the old enum
 * value so existing `?industry=<value>` URLs keep working.
 */
export const Industries: CollectionConfig = {
  slug: 'industries',
  labels: { singular: 'Industry', plural: 'Industries' },
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
  fields: buildTaxonomyFields('industries'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('industries')],
    afterChange: [slugChangeRedirectHook('industries')],
  },
  versions: { drafts: true },
  timestamps: true,
};
