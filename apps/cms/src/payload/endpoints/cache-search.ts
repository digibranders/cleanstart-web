import type { CollectionSlug, Endpoint } from 'payload';

import { PURGEABLE_COLLECTIONS } from '../lib/web-pages';

export interface CacheSearchResult {
  collection: string;
  id: string | number;
  title: string;
  slug: string;
  path: string;
}

const COLLECTION_LABELS: Record<string, string> = {
  blogs: 'Blog',
  news: 'News',
  guides: 'Guide',
  resources: 'Resource',
  events: 'Event',
  jobs: 'Job',
  knowledgeBase: 'Knowledge Hub',
  legalDocuments: 'Legal',
  authors: 'Author',
};

/** Collections that use `name` as their display field instead of `title`. */
const NAME_FIELD_COLLECTIONS = new Set(['authors']);

/**
 * Reduce a search input to a matchable term. Editors routinely paste a full
 * page URL (`https://cleanstart.com/blogs/<slug>`) or a bare path
 * (`/blogs/<slug>`) instead of typing a title or slug — neither matches a
 * stored `slug`/`title` verbatim, so the search returned nothing. When the
 * input contains a `/`, strip any query/hash and collapse it to the last
 * non-empty path segment (the doc slug). A plain title/slug (no slash) is
 * returned trimmed and unchanged.
 */
export const normalizeSearchQuery = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed.includes('/')) return trimmed;
  const withoutQueryOrHash = trimmed.split(/[?#]/)[0] ?? trimmed;
  const segments = withoutQueryOrHash.split('/').filter(Boolean);
  return (segments[segments.length - 1] ?? trimmed).trim();
};

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

/**
 * GET /api/cache-search?q=<query>
 *
 * Searches all purgeable detail-route collections (blogs, news, guides, …) for
 * documents whose title/slug contains the query string, then returns up to 15
 * results as `{ collection, id, title, slug, path }` objects. Used by the
 * cache admin UI's page-search picker so admins can look up docs by title
 * rather than having to type raw paths.
 *
 * Admin + editor roles may search; the `all`/`custom` purge controls are
 * further restricted to admin only.
 */
export const cacheSearchEndpoint: Endpoint = {
  path: '/cache-search',
  method: 'get',
  handler: async (req) => {
    if (!req.user) {
      return json({ ok: false, error: 'unauthorized' }, { status: 401 });
    }

    const rawUrl = typeof req.url === 'string' ? req.url : '';
    const qpStart = rawUrl.indexOf('?');
    const rawQ = qpStart >= 0
      ? new URLSearchParams(rawUrl.slice(qpStart + 1)).get('q')?.trim() ?? ''
      : '';
    // Reduce a pasted URL/path to its slug so it matches stored titles/slugs.
    const q = normalizeSearchQuery(rawQ);

    if (q.length < 2) {
      return json({ ok: true, results: [] });
    }

    // Only search collections that have per-doc detail routes — listing-only
    // collections (case-studies, webinars, podcastEpisodes) have no slug detail
    // page to look up.
    const targets = Object.entries(PURGEABLE_COLLECTIONS).filter(([, page]) => page.detailPrefix);

    const results: CacheSearchResult[] = [];

    await Promise.allSettled(
      targets.map(async ([collection, page]) => {
        const titleField = NAME_FIELD_COLLECTIONS.has(collection) ? 'name' : 'title';
        try {
          const res = await req.payload.find({
            collection: collection as CollectionSlug,
            where: {
              or: [{ [titleField]: { like: q } }, { slug: { like: q } }],
            },
            limit: 6,
            depth: 0,
            overrideAccess: false,
          });
          for (const doc of res.docs) {
            const d = doc as {
              id: string | number;
              title?: string;
              name?: string;
              slug?: string;
            };
            const slug = d.slug;
            if (!slug) continue;
            const title = (d.title ?? d.name ?? slug).trim();
            results.push({
              collection,
              id: d.id,
              title,
              slug,
              path: `${page.detailPrefix}/${slug}`,
            });
          }
        } catch {
          // Unknown collection shape or access error — skip silently.
        }
      }),
    );

    // Exact starts-with matches first; then alphabetical within each tier.
    const ql = q.toLowerCase();
    results.sort((a, b) => {
      const at = a.title.toLowerCase().startsWith(ql) ? 0 : 1;
      const bt = b.title.toLowerCase().startsWith(ql) ? 0 : 1;
      return at - bt || a.title.localeCompare(b.title);
    });

    const labelled = results.slice(0, 15).map((r) => ({
      ...r,
      collectionLabel: COLLECTION_LABELS[r.collection] ?? r.collection,
    }));

    return json({ ok: true, results: labelled });
  },
};
