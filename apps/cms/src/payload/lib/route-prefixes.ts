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
};

export const collectionUrlFromSlug = (collection: string, slug: string): string | null => {
  const prefix = ROUTE_PREFIX[collection];
  if (!prefix) return null;
  return `${prefix}/${slug}`;
};
