import { absoluteUrl } from '../jsonld/url';
import { ROUTE_PREFIX } from '../route-prefixes';
import type { ChangeFreq, NewsSitemapEntry, SitemapEntry } from './xml';

/**
 * Collections + listing-page paths that participate in /sitemap.xml.
 *
 * The defaults below are picked per arch doc §sitemap.xml: blogs/news
 * weekly 0.7, guides monthly 0.8, jobs daily 0.5, pages monthly 0.6.
 * For collections without an explicit guidance line we pick a
 * conservative monthly cadence and a priority that reflects relative
 * editorial importance.
 *
 * Excluded by design: aboutGalleries (data, not pages), media (covered
 * by the future image sitemap), users / forms / leads / redirects /
 * audit-log (system collections — never indexed).
 */
export const SITEMAP_COLLECTIONS: ReadonlyArray<{
  collection: string;
  defaultPriority: number;
  defaultChangeFreq: ChangeFreq;
  /** Listing-page path emitted alongside detail pages. */
  listingPath: string | null;
}> = [
  { collection: 'blogs', defaultPriority: 0.7, defaultChangeFreq: 'weekly', listingPath: '/blogs' },
  { collection: 'news', defaultPriority: 0.7, defaultChangeFreq: 'weekly', listingPath: '/news' },
  { collection: 'guides', defaultPriority: 0.8, defaultChangeFreq: 'monthly', listingPath: '/guide' },
  { collection: 'knowledgeBase', defaultPriority: 0.7, defaultChangeFreq: 'weekly', listingPath: '/knowledge-hub' },
  { collection: 'resources', defaultPriority: 0.5, defaultChangeFreq: 'monthly', listingPath: '/resources' },
  { collection: 'events', defaultPriority: 0.5, defaultChangeFreq: 'monthly', listingPath: '/events' },
  { collection: 'webinars', defaultPriority: 0.5, defaultChangeFreq: 'monthly', listingPath: '/webinars' },
  { collection: 'jobs', defaultPriority: 0.5, defaultChangeFreq: 'daily', listingPath: '/jobs' },
  { collection: 'authors', defaultPriority: 0.3, defaultChangeFreq: 'monthly', listingPath: '/authors' },
  { collection: 'categories', defaultPriority: 0.4, defaultChangeFreq: 'monthly', listingPath: null },
  { collection: 'newsCategories', defaultPriority: 0.4, defaultChangeFreq: 'monthly', listingPath: null },
  { collection: 'knowledgeCategories', defaultPriority: 0.4, defaultChangeFreq: 'monthly', listingPath: null },
  { collection: 'pages', defaultPriority: 0.6, defaultChangeFreq: 'monthly', listingPath: null },
];

const PER_PAGE = 200;
const MAX_PAGES = 250; // hard cap: 50k urls — well above the 45k split-threshold.

interface DocLite {
  slug?: string | null;
  path?: string | null;
  updatedAt?: string | null;
  _status?: string | null;
  seo?: { indexable?: string | null } | null;
}

const isIndexable = (doc: DocLite): boolean => {
  const indexable = doc.seo?.indexable;
  if (indexable == null) return true;
  return indexable !== 'noindex' && indexable !== 'noindex,nofollow';
};

const buildLoc = (
  baseUrl: string,
  collection: string,
  doc: DocLite,
): string | null => {
  if (collection === 'pages') {
    if (typeof doc.path === 'string' && doc.path.length > 0) {
      return absoluteUrl(baseUrl, doc.path);
    }
    if (typeof doc.slug === 'string' && doc.slug.length > 0) {
      return absoluteUrl(baseUrl, `/${doc.slug}`);
    }
    return null;
  }
  if (typeof doc.slug !== 'string' || doc.slug.length === 0) return null;
  const prefix = ROUTE_PREFIX[collection];
  if (!prefix) return null;
  return absoluteUrl(baseUrl, `${prefix}/${doc.slug}`);
};

/**
 * Loose subset of `payload` we actually use. Keeps the collector
 * easy to mock in tests without pulling the full Payload types.
 */
export interface SitemapPayload {
  find: (args: {
    collection: string;
    where?: unknown;
    limit?: number;
    page?: number;
    sort?: string;
    depth?: number;
    overrideAccess?: boolean;
    draft?: boolean;
  }) => Promise<{ docs: DocLite[]; hasNextPage?: boolean }>;
}

/**
 * Walk every routable collection, return the URL entries to render
 * in /sitemap.xml. Filters drafts and noindex docs.
 *
 * Listing-page entries (one per collection that has a listing path)
 * are included with `lastmod` set to the most recent child's
 * `updatedAt` — gives Googlebot a freshness signal for the listing
 * without waiting for it to publish a new doc itself.
 */
export const collectSitemapEntries = async (
  payload: SitemapPayload,
  baseUrl: string,
): Promise<SitemapEntry[]> => {
  const entries: SitemapEntry[] = [];
  // Site root entry — always present.
  entries.push({
    loc: absoluteUrl(baseUrl, '/'),
    changefreq: 'weekly',
    priority: 1.0,
  });

  for (const config of SITEMAP_COLLECTIONS) {
    let listingLastmod: string | null = null;
    let page = 1;

    while (page <= MAX_PAGES) {
      const result = await payload.find({
        collection: config.collection,
        limit: PER_PAGE,
        page,
        sort: '-updatedAt',
        depth: 0,
        overrideAccess: false,
        draft: false,
      });
      for (const doc of result.docs) {
        if (!isIndexable(doc)) continue;
        if (doc._status != null && doc._status !== 'published') continue;
        const loc = buildLoc(baseUrl, config.collection, doc);
        if (!loc) continue;
        if (!listingLastmod && doc.updatedAt) {
          listingLastmod = doc.updatedAt;
        }
        entries.push({
          loc,
          lastmod: doc.updatedAt ?? null,
          changefreq: config.defaultChangeFreq,
          priority: config.defaultPriority,
        });
      }
      if (!result.hasNextPage) break;
      page += 1;
    }

    if (config.listingPath) {
      entries.push({
        loc: absoluteUrl(baseUrl, config.listingPath),
        lastmod: listingLastmod,
        changefreq: config.defaultChangeFreq,
        priority: Math.min(1, config.defaultPriority + 0.1),
      });
    }
  }

  return entries;
};

/** Hard caps from Google's news-sitemap spec. */
export const NEWS_SITEMAP_MAX_URLS = 1000;
export const NEWS_WINDOW_HOURS = 48;

interface NewsDoc {
  slug?: string | null;
  title?: string | null;
  publicationDate?: string | null;
  updatedAt?: string | null;
  _status?: string | null;
  seo?: { indexable?: string | null } | null;
}

/**
 * Collect news-sitemap entries from the `news` collection. Per
 * Google's spec: only articles published in the last 2 days,
 * max 1000 URLs.
 */
export const collectNewsSitemapEntries = async (
  payload: SitemapPayload,
  args: {
    baseUrl: string;
    publicationName: string;
    publicationLanguage: string;
    /** Override `now` for deterministic tests. */
    now?: Date;
  },
): Promise<NewsSitemapEntry[]> => {
  const now = args.now ?? new Date();
  const cutoff = new Date(now.getTime() - NEWS_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const result = await payload.find({
    collection: 'news',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { publicationDate: { greater_than_equal: cutoff } },
      ],
    },
    limit: NEWS_SITEMAP_MAX_URLS,
    page: 1,
    sort: '-publicationDate',
    depth: 0,
    overrideAccess: false,
    draft: false,
  });

  const entries: NewsSitemapEntry[] = [];
  for (const raw of result.docs as NewsDoc[]) {
    if (!isIndexable(raw as DocLite)) continue;
    if (!raw.slug || !raw.title || !raw.publicationDate) continue;
    const loc = buildLoc(args.baseUrl, 'news', raw as DocLite);
    if (!loc) continue;
    entries.push({
      loc,
      publicationName: args.publicationName,
      publicationLanguage: args.publicationLanguage,
      publicationDate: raw.publicationDate,
      title: raw.title,
    });
  }
  return entries;
};
