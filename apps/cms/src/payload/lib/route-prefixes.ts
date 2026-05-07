/**
 * Public URL prefix per collection. Verbatim from the live Webflow site —
 * arch doc §migration hard constraint #1: every URL ships 1:1 with no
 * pluralisation/normalisation drift.
 *
 * Pages are absent from this map because their URL is the computed `path`
 * field (handles parent nesting), not a fixed prefix.
 */
export const ROUTE_PREFIX: Record<string, string> = {
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
};

export const collectionUrlFromSlug = (collection: string, slug: string): string | null => {
  const prefix = ROUTE_PREFIX[collection];
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
