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
  legalDocuments: '/legal',
} as const satisfies Record<string, string>;

export type RoutePrefixKey = keyof typeof ROUTE_PREFIX;

/**
 * Listing (index) route per collection, used only for cache revalidation of
 * the index page. For most collections the listing lives at its ROUTE_PREFIX,
 * but several were rebuilt with a listing route that differs from the
 * (singular / legacy) detail prefix — e.g. detail `/resources/<slug>` but
 * listing `/resource-center`, detail `/job/<slug>` but listing `/careers`.
 * Revalidating the detail prefix for those purges a 301 redirect, never the
 * real listing, so a newly published doc never appears until the ISR TTL
 * lapses. Collections absent here list at their ROUTE_PREFIX.
 */
const LISTING_PATH_OVERRIDE: Record<string, string> = {
  resources: '/resource-center',
  events: '/events',
  webinars: '/webinars',
  jobs: '/careers',
  // case-studies is listing-only on the web (no `/case-studies/[slug]` detail
  // route) and is intentionally absent from ROUTE_PREFIX, so it has no detail
  // prefix to fall back to. Without this entry the publish hook revalidates
  // nothing for a case study — not even its `/case-studies` index — leaving
  // newly published case studies hidden until the ISR TTL lapses.
  'case-studies': '/case-studies',
};

/** Index-page path for a collection, preferring an explicit listing override. */
export const listingPathForCollection = (collection: string): string | null => {
  const override = LISTING_PATH_OVERRIDE[collection];
  if (override) return override;
  return (ROUTE_PREFIX as Record<string, string>)[collection] ?? null;
};

/**
 * Collections whose documents produce a `<loc>` entry in apps/web's
 * /sitemap.xml. Mirrors the `fetchDocs` calls in apps/web/src/app/sitemap.ts —
 * keep the two in sync when a collection starts or stops being listed.
 *
 * Collections that only affect a hard-coded static route (webinars and
 * case-studies list at `/webinars` and `/case-studies`, which are constants in
 * the web sitemap) are excluded: publishing one cannot change the URL set.
 * emailSignatures is excluded because the whole section is noindex.
 */
const SITEMAP_COLLECTIONS = new Set([
  'blogs',
  'news',
  'guides',
  'resources',
  'events',
  'jobs',
  'authors',
  'knowledgeBase',
  'legalDocuments',
]);

/** Whether publishing in this collection can change the set of sitemap URLs. */
export const affectsSitemap = (collection: string): boolean =>
  SITEMAP_COLLECTIONS.has(collection);

/** apps/web sitemap route, revalidated on publish so new URLs appear at once. */
export const SITEMAP_PATH = '/sitemap.xml';

export const collectionUrlFromSlug = (collection: string, slug: string): string | null => {
  const prefix = (ROUTE_PREFIX as Record<string, string>)[collection];
  if (!prefix) return null;
  return `${prefix}/${slug}`;
};

/**
 * URL resolver that prefers the doc-level `path` field for Pages
 * (which encodes the full nested path), uses the nested
 * `/podcast/episode/<slug>` path for podcast episodes, and falls back to
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
  if (collection === 'podcastEpisodes') {
    if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
    return `/podcast/episode/${doc.slug}`;
  }
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
  return collectionUrlFromSlug(collection, doc.slug);
};
