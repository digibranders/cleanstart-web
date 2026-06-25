/**
 * Verified map of CMS collections → their live apps/web page URLs, used by the
 * cache-purge feature. Deliberately separate from `route-prefixes.ts`
 * (ROUTE_PREFIX), which carries stale/aspirational entries its other consumers
 * tolerate (categories, the dead `/webinar` detail, pages). Every value here was
 * verified against the actual apps/web route tree and is guarded by
 * `web-pages.routes.test.ts`, so a purge never targets a non-existent page.
 */
export interface WebPage {
  /** Detail route prefix, e.g. `/news` → `/news/<slug>`. Omit if listing-only. */
  detailPrefix?: string;
  /** Listing/index route. Omit if detail-only (e.g. authors). */
  listingPath?: string;
}

export const PURGEABLE_COLLECTIONS: Record<string, WebPage> = {
  blogs: { detailPrefix: '/blogs', listingPath: '/blogs' },
  news: { detailPrefix: '/news', listingPath: '/news' },
  guides: { detailPrefix: '/guide', listingPath: '/guide' },
  resources: { detailPrefix: '/resources', listingPath: '/resource-center' },
  events: { detailPrefix: '/event', listingPath: '/events' },
  jobs: { detailPrefix: '/job', listingPath: '/careers' },
  knowledgeBase: { detailPrefix: '/knowledge-hub', listingPath: '/knowledge-hub' },
  legalDocuments: { detailPrefix: '/legal', listingPath: '/legal' },
  authors: { detailPrefix: '/author' },
  'case-studies': { listingPath: '/case-studies' },
  webinars: { listingPath: '/webinars' },
  podcastEpisodes: { listingPath: '/podcast' },
};

export const isPurgeableCollection = (collection: string): boolean =>
  Object.prototype.hasOwnProperty.call(PURGEABLE_COLLECTIONS, collection);

/** Real page URLs to purge for a doc — never a dead path. */
export const purgePathsForDoc = (
  collection: string,
  doc: { slug?: string | null },
): string[] => {
  const entry = PURGEABLE_COLLECTIONS[collection];
  if (!entry) return [];
  const paths: string[] = [];
  if (entry.listingPath) paths.push(entry.listingPath);
  if (entry.detailPrefix && typeof doc.slug === 'string' && doc.slug.length > 0) {
    paths.push(`${entry.detailPrefix}/${doc.slug}`);
  }
  return Array.from(new Set(paths));
};
