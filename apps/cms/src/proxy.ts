import { NextResponse, type NextRequest } from 'next/server';

/**
 * Edge-cacheability headers for anonymous reads of public content collections.
 *
 * Why this exists. `cms.cleanstart.com` sends no `Cache-Control` on collection
 * reads, so Cloudflare marks every response `DYNAMIC` and caches nothing. Every
 * apps/web render reaches the droplet, including all ~531 during a production
 * build. That droplet runs the CMS, Postgres and Meilisearch inside 2 GB, and
 * saturating it is the documented cause of the 520/522/525 origin errors and
 * the multi-second crawl latencies recorded on 2026-08-17 and 2026-08-18 (see
 * `14a17c94`). Letting the edge absorb the burst removes the origin from the
 * critical path of the reads that dominate it.
 *
 * Why it is opt-in. `/api` is also the Payload admin's data path. Cloudflare's
 * default cache key ignores cookies, so a stored anonymous response could be
 * served to a signed-in editor and hide their drafts. `Vary: Cookie` states the
 * correct semantics but Cloudflare does not honour it on its own. The safe
 * ordering is therefore: add the Cloudflare cache rule that bypasses cache when
 * a `payload-token` cookie is present, and only then set the env var below.
 * Unset, this module changes no response.
 *
 * Contract: only GET, only the allow-listed public collections, and only when
 * the request carries no credentials. Anything else passes through untouched.
 */

/** Public, unauthenticated-readable content collections that apps/web renders from. */
const CACHEABLE_COLLECTIONS = new Set([
  'authors',
  'blogs',
  'case-studies',
  'events',
  'guides',
  'jobs',
  'knowledgeBase',
  'legalDocuments',
  'news',
  'podcastEpisodes',
  'redirects',
  'resources',
  'webinars',
]);

/** Payload's session cookie. Its presence means the response may be user-specific. */
const AUTH_COOKIE = 'payload-token';

/**
 * Parsed TTL, or 0 when unset or malformed.
 *
 * Deliberately strict: `parseInt` would read "3.5" as 3 and "300s" as 300,
 * turning a typo in the deploy environment into a silently wrong cache window.
 * A value we do not fully understand disables the feature instead.
 */
const smaxage = (): number => {
  const raw = process.env.CMS_EDGE_CACHE_SMAXAGE?.trim();
  if (!raw || !/^\d+$/.test(raw)) return 0;
  const n = Number(raw);
  return n > 0 ? n : 0;
};

/**
 * The collection segment of `/api/<collection>[/...]`, or null when the path is
 * not a collection read (`/api/blogs/123/versions` still reads `blogs`).
 */
export const collectionFromApiPath = (pathname: string): string | null => {
  if (!pathname.startsWith('/api/')) return null;
  const segment = pathname.slice('/api/'.length).split('/')[0];
  return segment && segment.length > 0 ? segment : null;
};

/** Whether this request may be answered from a shared cache. */
export const isAnonymousPublicRead = (req: {
  method: string;
  pathname: string;
  hasAuthCookie: boolean;
  hasAuthHeader: boolean;
}): boolean => {
  if (req.method !== 'GET') return false;
  if (req.hasAuthCookie || req.hasAuthHeader) return false;
  const collection = collectionFromApiPath(req.pathname);
  return collection !== null && CACHEABLE_COLLECTIONS.has(collection);
};

export function proxy(request: NextRequest): NextResponse {
  const ttl = smaxage();
  if (ttl === 0) return NextResponse.next();

  const cacheable = isAnonymousPublicRead({
    method: request.method,
    pathname: request.nextUrl.pathname,
    hasAuthCookie: request.cookies.has(AUTH_COOKIE),
    hasAuthHeader: request.headers.has('authorization'),
  });
  if (!cacheable) return NextResponse.next();

  const response = NextResponse.next();
  // stale-while-revalidate is deliberately generous: a stale list for a few
  // minutes is a far cheaper failure than another origin saturation, and the
  // publish hooks purge apps/web directly rather than waiting on this TTL.
  response.headers.set(
    'cache-control',
    `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 4}`,
  );
  // Correct HTTP semantics even where a given CDN ignores it.
  response.headers.set('vary', 'Cookie, Authorization');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
