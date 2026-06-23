import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Resource-type taxonomy for the Resources collection. Promoted from the
 * hardcoded `resources.type` select enum so editors can manage the list and
 * each type can carry metadata (description, icon, SEO) for a landing page.
 * Seeded from the original enum options; `slug` equals the old enum value so
 * existing `?type=<value>` URLs keep working.
 */
export const ResourceTypes: CollectionConfig = {
  slug: 'resourceTypes',
  labels: { singular: 'Resource type', plural: 'Resource types' },
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
  fields: buildTaxonomyFields('resourceTypes'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('resourceTypes')],
    afterChange: [slugChangeRedirectHook('resourceTypes')],
  },
  versions: { drafts: true },
  timestamps: true,
};
