import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Shared region taxonomy, referenced by BOTH News and Webinars. Promoted
 * from the two collections' separate (and divergent) `region` select enums
 * — News used { north-america, apac }, Webinars used { north-america,
 * asia-mea, emea, global } — which is exactly the duplicated-vocabulary
 * drift this consolidation removes. Seeded from the UNION of both enums so
 * no existing value is lost; editors can later merge/rename terms. `slug`
 * equals the old enum value so existing `?region=<value>` URLs keep working.
 */
export const Regions: CollectionConfig = {
  slug: 'regions',
  labels: { singular: 'Region', plural: 'Regions' },
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
  fields: buildTaxonomyFields('regions'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('regions')],
    afterChange: [slugChangeRedirectHook('regions')],
  },
  versions: { drafts: true },
  timestamps: true,
};
