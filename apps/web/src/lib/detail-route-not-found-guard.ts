/**
 * Existence guard for the nine dynamic CMS detail routes
 * (`/blogs/[slug]`, `/event/[slug]`, `/author/[slug]`, `/guide/[slug]`,
 * `/job/[slug]`, `/news/[slug]`, `/resources/[slug]`, `/knowledge-hub/[slug]`,
 * `/legal/[slug]`).
 *
 * Why this can't live in the page component: Next.js locks the HTTP response
 * status at 200 the instant any Suspense fallback renders — including the
 * automatically-inserted boundary a `loading.tsx` produces for every segment
 * from the one that defines it down to the leaf page — regardless of how
 * early `notFound()` is called inside that page's own render. Per the
 * Next.js docs: "The response body starts streaming when a Suspense
 * fallback renders (for example, a loading.tsx) or when a Server Component
 * suspends under a Suspense boundary. Place notFound() before those
 * boundaries and before any await that may suspend." A live CMS existence
 * check is unavoidably "an await that may suspend" (and `dynamicParams:
 * true` requires it to stay live, so newly-published content still renders
 * on demand) — so once inside any of these pages, the check is already too
 * late. The only place left to decide "does this exist" before React starts
 * rendering at all is `proxy.ts`, which runs ahead of routing. This module
 * is consumed from there — see `apps/web/src/proxy.ts`.
 *
 * This guard is independent of `loading.tsx`. It originally cited the root
 * `app/loading.tsx` as the boundary forcing the 200, but every `loading.tsx`
 * was removed (they streamed all page content into trailing `<div hidden>`
 * blocks, so text extractors saw ~100 characters instead of the article) and
 * the guard still returns correct 404s, because it runs before routing rather
 * than inside it. Do not reintroduce a `loading.tsx` to "restore" this guard —
 * it never depended on one, and doing so would re-hide page content.
 *
 * Fails open: any CMS/network error is treated as "exists" so a transient
 * CMS outage degrades to the pre-existing (SEO-imperfect but functionally
 * harmless) 200 behavior rather than 404-ing real content. Mirrors the
 * fail-open philosophy already used for CMS-managed redirects in
 * `lib/redirects-cache.ts`.
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

const PUBLISHED_FILTER: ReadonlyArray<readonly [string, string]> = [
  ["where[_status][equals]", "published"],
];

interface DetailRoute {
  readonly prefix: string;
  readonly collection: string;
  readonly extraFilter?: ReadonlyArray<readonly [string, string]>;
}

const DETAIL_ROUTES: readonly DetailRoute[] = [
  { prefix: "/blogs/", collection: "blogs", extraFilter: PUBLISHED_FILTER },
  { prefix: "/event/", collection: "events", extraFilter: PUBLISHED_FILTER },
  // Authors is a pure content collection with no draft/versioning system
  // (see CLAUDE.md "Schema decisions (locked)") — no published-status filter.
  { prefix: "/author/", collection: "authors" },
  { prefix: "/guide/", collection: "guides", extraFilter: PUBLISHED_FILTER },
  // Closed job postings still render (noindexed, not removed) — matching
  // `loadJobBySlug`'s own filter, this checks publish status only.
  { prefix: "/job/", collection: "jobs", extraFilter: PUBLISHED_FILTER },
  { prefix: "/news/", collection: "news", extraFilter: PUBLISHED_FILTER },
  { prefix: "/resources/", collection: "resources", extraFilter: PUBLISHED_FILTER },
  { prefix: "/knowledge-hub/", collection: "knowledgeBase", extraFilter: PUBLISHED_FILTER },
  { prefix: "/legal/", collection: "legalDocuments", extraFilter: PUBLISHED_FILTER },
];

// `/legal/privacy-policy` is a redirect target, not a `legalDocuments` doc —
// `app/(legal)/legal/[slug]/page.tsx` permanentRedirect()s it to
// `/privacy-policy` before ever querying the collection. Never gate it here.
const LEGAL_PRIVACY_POLICY_SLUG = "privacy-policy";

// Positive and negative results are both cached in-process per edge/node
// isolate. Short enough that an editor's publish (which also fires an
// on-demand revalidate) is visible well within the window; long enough that
// a burst of repeat/bot traffic against the same slug doesn't each cost a
// CMS round-trip.
const TTL_MS = 5 * 60_000;
const ERROR_BACKOFF_MS = 10_000;

interface CacheEntry {
  readonly exists: boolean;
  readonly expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

interface RouteMatch {
  readonly route: DetailRoute;
  readonly slug: string;
}

function matchRoute(pathname: string): RouteMatch | null {
  for (const route of DETAIL_ROUTES) {
    if (!pathname.startsWith(route.prefix)) continue;
    const rest = pathname.slice(route.prefix.length);
    // Only a bare `[slug]` segment is this route's shape. No match (or a
    // nested/empty path) means this guard has nothing to say about it.
    if (!rest || rest.includes("/")) return null;
    return { route, slug: decodeURIComponent(rest) };
  }
  return null;
}

async function slugExists(route: DetailRoute, slug: string): Promise<boolean> {
  const params = new URLSearchParams({
    "where[slug][equals]": slug,
    depth: "0",
    limit: "1",
    "select[id]": "true",
  });
  for (const [key, value] of route.extraFilter ?? []) {
    params.set(key, value);
  }
  const res = await fetch(
    `${CMS_URL}/api/${route.collection}?${params.toString()}`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    throw new Error(`detail-route-not-found-guard: ${route.collection} check failed (${res.status})`);
  }
  const body = (await res.json()) as { docs?: ReadonlyArray<{ id: unknown }> };
  return (body.docs?.length ?? 0) > 0;
}

/**
 * Resolves to `false` only when `pathname` confidently matches one of the
 * nine detail routes AND the CMS confirms no published document has that
 * slug. Resolves to `true` for every other case: a path this guard doesn't
 * cover, a slug that exists, or a lookup that failed (fail open).
 */
export async function detailRouteExists(pathname: string): Promise<boolean> {
  const match = matchRoute(pathname);
  if (!match) return true;
  if (match.route.prefix === "/legal/" && match.slug === LEGAL_PRIVACY_POLICY_SLUG) {
    return true;
  }

  const cacheKey = `${match.route.collection}:${match.slug}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (hit && hit.expiresAt > now) return hit.exists;

  try {
    const exists = await slugExists(match.route, match.slug);
    cache.set(cacheKey, { exists, expiresAt: now + TTL_MS });
    return exists;
  } catch {
    cache.set(cacheKey, { exists: true, expiresAt: now + ERROR_BACKOFF_MS });
    return true;
  }
}
