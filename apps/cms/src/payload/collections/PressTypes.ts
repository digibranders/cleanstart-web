import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Press-type taxonomy for the News collection. Promoted from the hardcoded
 * `news.pressType` select enum so editors can manage the list. Seeded from
 * the original enum options; `slug` equals the old enum value so existing
 * `?type=<value>` URLs keep working.
 */
export const PressTypes: CollectionConfig = {
  slug: 'pressTypes',
  labels: { singular: 'Press type', plural: 'Press types' },
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
  fields: buildTaxonomyFields('pressTypes'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('pressTypes')],
    afterChange: [slugChangeRedirectHook('pressTypes')],
  },
  versions: { drafts: true },
  timestamps: true,
};
