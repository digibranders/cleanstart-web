import type { Field } from 'payload';

import { seoField } from '../fields/seo';
import { slugField } from '../fields/slug';

/**
 * Shared field definition for taxonomy collections (categories, newsCategories).
 * Same shape, kept as separate collections for URL parity per arch doc §03.
 */
export const buildTaxonomyFields = (selfSlug: 'categories' | 'newsCategories'): Field[] => [
  { name: 'name', type: 'text', required: true },
  slugField({ source: 'name' }),
  { name: 'description', type: 'textarea' },
  { name: 'icon', type: 'upload', relationTo: 'media' },
  {
    name: 'parent',
    type: 'relationship',
    relationTo: selfSlug,
    admin: {
      description: 'Optional parent category for hierarchical taxonomies.',
    },
  },
  seoField,
];
