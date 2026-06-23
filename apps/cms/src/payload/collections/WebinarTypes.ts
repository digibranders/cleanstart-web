import type { CollectionConfig } from 'payload';

import { isAdminOrEditor } from '../access';
import { slugChangeRedirectHook } from '../hooks/slug-change-redirect';
import { taxonomyParentCycleGuardHook } from '../hooks/taxonomy-parent-cycle-guard';
import { buildTaxonomyFields } from '../lib/build-taxonomy-fields';

/**
 * Webinar-type taxonomy for the Webinars collection. Promoted from the
 * hardcoded `webinars.webinarType` select enum so editors can manage the
 * list. Seeded from the original enum options; `slug` equals the old enum
 * value so existing `?type=<value>` URLs keep working.
 */
export const WebinarTypes: CollectionConfig = {
  slug: 'webinarTypes',
  labels: { singular: 'Webinar type', plural: 'Webinar types' },
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
  fields: buildTaxonomyFields('webinarTypes'),
  hooks: {
    beforeChange: [taxonomyParentCycleGuardHook('webinarTypes')],
    afterChange: [slugChangeRedirectHook('webinarTypes')],
  },
  versions: { drafts: true },
  timestamps: true,
};
