import type { CollectionConfig } from 'payload';

import { isAdminEditorOrHr } from '../access';
import { slugField } from '../fields/slug';

/**
 * Department list for the Jobs collection. Editors add entries from the Job
 * editor's Department field (+ New) or here. Name and slug only: nothing on
 * the public site renders a department page, so there is no SEO, parent or
 * icon to maintain. Seed slugs equal the old `jobs.department` enum values so
 * `?department=<slug>` careers URLs keep working.
 */
export const Departments: CollectionConfig = {
  slug: 'departments',
  labels: { singular: 'Department', plural: 'Departments' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Taxonomies',
  },
  access: {
    read: () => true,
    create: isAdminEditorOrHr,
    update: isAdminEditorOrHr,
    delete: isAdminEditorOrHr,
  },
  fields: [{ name: 'name', type: 'text', required: true }, slugField({ source: 'name' })],
  timestamps: true,
};
