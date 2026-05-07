import type { Field } from 'payload';

import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';

// Public URL prefix per taxonomy slug — used by the SERP preview
// sidebar field to compose the displayed URL.
const PATH_PREFIX_BY_SLUG: Record<string, string> = {
  categories: '/blogs',
  newsCategories: '/news',
  knowledgeCategories: '/knowledge-hub',
};

/**
 * Shared field definition for taxonomy collections (categories,
 * newsCategories, knowledgeCategories). Same shape, kept as separate
 * collections for URL parity per arch doc §03.
 *
 * SEO advanced + the sidebar SEO controls (title / description /
 * indexable / SERP preview) match the pattern used across every
 * content collection — taxonomies are content too.
 */
export const buildTaxonomyFields = (
  selfSlug: 'categories' | 'newsCategories' | 'knowledgeCategories',
): Field[] => [
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
  // Sidebar SEO controls — title / description / indexable / SERP
  // preview. Taxonomies use `name` as their `useAsTitle` and
  // `description` as their lead-text source.
  ...seoSidebarFields({
    pathPrefix: PATH_PREFIX_BY_SLUG[selfSlug] ?? '',
    titleSource: 'name',
    descriptionSource: 'description',
  }),
  // Hidden seo data group + collapsible SEO advanced sidebar panel.
  ...seoFieldsForSidebar(selfSlug),
];
