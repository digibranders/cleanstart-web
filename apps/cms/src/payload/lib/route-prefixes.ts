/**
 * Public URL prefix per collection. Single source of truth — consumed by
 * the slug-change redirect hook, the SEO sidebar (URL history / inbound /
 * outbound redirects cards), and any other CMS-side URL composition.
 *
 * Values match the actual `apps/web` route segments under
 * `apps/web/src/app/<prefix>/[slug]/`. They are NOT the legacy Webflow
 * URLs — the marketing site was rebuilt with redesigned routes
 * (`/blogs/[slug]`, `/event/[slug]`, `/resources/[slug]` etc.), and any
 * Webflow-era URLs are handled by seeded rows in the `redirects`
 * collection, not by this map.
 *
 * Pages are absent from this map because their URL is the computed `path`
 * field (handles parent nesting), not a fixed prefix.
 */
export const ROUTE_PREFIX = {
  blogs: '/blogs',
  news: '/news',
  guides: '/guide',
  resources: '/resources',
  events: '/event',
  webinars: '/webinar',
  jobs: '/job',
  authors: '/author',
  categories: '/category',
  newsCategories: '/news-categories',
  knowledgeBase: '/knowledge-hub',
  knowledgeCategories: '/knowledge-hub/category',
} as const satisfies Record<string, string>;

export type RoutePrefixKey = keyof typeof ROUTE_PREFIX;

export const collectionUrlFromSlug = (collection: string, slug: string): string | null => {
  const prefix = (ROUTE_PREFIX as Record<string, string>)[collection];
  if (!prefix) return null;
  return `${prefix}/${slug}`;
};

/**
 * URL resolver that prefers the doc-level `path` field for Pages
 * (which encodes the full nested path) and falls back to
 * `prefix + slug` for everything else.
 */
export const collectionUrlFromDoc = (
  collection: string,
  doc: { slug?: string | null; path?: string | null },
): string | null => {
  if (collection === 'pages') {
    if (typeof doc.path === 'string' && doc.path.length > 0) return doc.path;
    if (typeof doc.slug === 'string' && doc.slug.length > 0) return `/${doc.slug}`;
    return null;
  }
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
  return collectionUrlFromSlug(collection, doc.slug);
};
