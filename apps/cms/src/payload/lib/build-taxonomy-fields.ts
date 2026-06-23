import type { Field } from 'payload';

import { mediaUploadField } from '../fields/media-upload';
import { seoFieldsForSidebar, seoSidebarFields } from '../fields/seo';
import { slugField } from '../fields/slug';

// Public URL prefix per taxonomy slug — used by the SERP preview
// sidebar field to compose the displayed URL.
const PATH_PREFIX_BY_SLUG: Record<string, string> = {
  categories: '/blogs',
  newsCategories: '/news',
  knowledgeCategories: '/knowledge-hub',
  industries: '/case-studies/industry',
  resourceTypes: '/resources/type',
  departments: '/careers/department',
  regions: '/region',
  pressTypes: '/news/type',
  webinarTypes: '/webinar/type',
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
  selfSlug:
    | 'categories'
    | 'newsCategories'
    | 'knowledgeCategories'
    | 'industries'
    | 'resourceTypes'
    | 'departments'
    | 'regions'
    | 'pressTypes'
    | 'webinarTypes',
): Field[] => [
  { name: 'name', type: 'text', required: true },
  slugField({ source: 'name' }),
  { name: 'description', type: 'textarea' },
  mediaUploadField({ name: 'icon', folderHint: 'web/general' }),
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
