import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Department taxonomy for the Jobs collection. Promoted from the hardcoded
 * `jobs.department` select enum so editors can manage the list and each
 * department can carry metadata (description, icon, SEO) for a landing page.
 * Seeded from the original enum options; `slug` equals the old enum value so
 * existing `?department=<value>` URLs keep working. (The webflow-import
 * `normalizeDepartment` map remains the import-time normaliser for incoming
 * free-text department strings during the transition.)
 */
export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: { singular: 'Department', plural: 'Departments' },
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
  fields: buildTaxonomyFields('departments'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('departments')],
    afterChange: [slugChangeRedirectHook('departments')],
  },
  versions: { drafts: true },
  timestamps: true,
};
