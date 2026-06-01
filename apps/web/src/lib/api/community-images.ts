import { cache } from 'react';
import { unstable_cache } from 'next/cache';

/**
 * Shared client for the CleanStart image catalog — the SAME backend that powers
 * images.cleanstart.com (its own route handler, `POST /api/image-list`). We send
 * the catalog's own `isPublic:true` request flag, so this list matches the
 * catalog's "Community Images" view (latest-first). Per-item `isPublic` is kept
 * on each result so the Products hero can narrow to anonymously-pullable images.
 * Treat the endpoint as an internal dependency that could change shape without notice.
 *
 * Caching: the endpoint is a POST, which Next's fetch Data Cache does NOT cache,
 * so the parsed result is memoised two ways instead:
 *   1. unstable_cache  — caches the parsed list across requests for `revalidate`
 *                        seconds, tag-invalidatable via `COMMUNITY_IMAGES_TAG`.
 *   2. React.cache()   — dedupes within a single render pass so multiple
 *                        consumers (community page + Products hero) make one call.
 */

export const COMMUNITY_IMAGES_TAG = 'community-images';

// The catalog's own image-list route (same origin as images.cleanstart.com).
// POST body: { page, limit, sort:'latest', isPublic:true }; response: { success, data:{ items, meta } }.
// `isPublic:true` is the request flag that selects the catalog's "Community Images"
// view (NOT the same as the per-item `is_public` field) — it's what images.cleanstart.com
// sends, so our list matches the catalog's Community Images ordering.
const IMAGE_LIST_URL = 'https://images.cleanstart.com/api/image-list';

/**
 * Page size requested from the catalog. Large enough that the latest-first page
 * always contains several anonymously-pullable images for the Products hero pool
 * (8), on top of the community page's 4 cards.
 */
const IMAGE_LIST_LIMIT = 48;

/**
 * Revalidate window in seconds — 30 min. The catalog list is fetched from the
 * images server at most once per window and shared across all visitors/loads
 * (stale-while-revalidate), so reloads and menu opens never hit the origin.
 */
const REVALIDATE_SECONDS = 1800;

/** Subset of the API payload the web app actually consumes. */
export interface CommunityImage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  updatedAt?: string;
  publishedAt?: string;
  isFips?: boolean;
  /**
   * True ⇒ anonymously pullable from Docker Hub (`docker pull cleanstart/<name>`).
   * False ⇒ enterprise/org-scoped (`clnstrt-images.cleanstart.com/$ORGANIZATION/<name>`).
   * The community page lists both (it shows no pull command); the Products hero
   * narrows to `isPublic === true` so its command is always runnable.
   */
  isPublic?: boolean;
  /** Supported CPU architectures, e.g. ["amd64", "arm64"]. */
  architecture?: string[];
  /** SPDX license id, e.g. "Apache-2.0". */
  license?: string;
  /**
   * Curated "featured" tag labels from the API (e.g. "Security Hardened").
   * The FIPS tag is intentionally excluded in `parseItem` because the per-image
   * `is_fips` flag can disagree with it — we don't surface a mixed signal.
   */
  featuredTags?: string[];
}

interface RawApiItem {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  image_url?: unknown;
  updated_at?: unknown;
  published_at?: unknown;
  is_fips?: unknown;
  is_public?: unknown;
  is_valid?: unknown;
  architecture?: unknown;
  license?: unknown;
  tags?: unknown;
}

/** Extract non-FIPS featured tag labels from the raw `tags.featured` array. */
function parseFeaturedTags(rawTags: unknown): string[] {
  if (rawTags === null || typeof rawTags !== 'object') return [];
  const featured = (rawTags as { featured?: unknown }).featured;
  if (!Array.isArray(featured)) return [];
  return featured
    .filter(
      (t): t is { label: string; value?: unknown } =>
        t !== null &&
        typeof t === 'object' &&
        typeof (t as { label?: unknown }).label === 'string',
    )
    .filter((t) => t.value !== 'fips-available' && !/fips/i.test(t.label))
    .map((t) => t.label);
}

function parseItem(raw: RawApiItem): CommunityImage | null {
  if (typeof raw.id !== 'string' || raw.id.length === 0) return null;
  if (typeof raw.name !== 'string' || raw.name.length === 0) return null;
  if (typeof raw.image_url !== 'string' || !raw.image_url.startsWith('https://')) return null;
  // Keep both pullable and enterprise images so the community page mirrors the
  // catalog's "Community Images" list. Pullability is carried per-item via
  // `isPublic` below; the Products hero filters on it. Only invalid images drop.
  if (raw.is_valid === false) return null;

  const out: CommunityImage = {
    id: raw.id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    imageUrl: raw.image_url,
  };
  if (typeof raw.updated_at === 'string') out.updatedAt = raw.updated_at;
  if (typeof raw.published_at === 'string') out.publishedAt = raw.published_at;
  if (typeof raw.is_fips === 'boolean') out.isFips = raw.is_fips;
  if (typeof raw.is_public === 'boolean') out.isPublic = raw.is_public;

  if (Array.isArray(raw.architecture)) {
    const arch = raw.architecture.filter(
      (a): a is string => typeof a === 'string' && a.length > 0,
    );
    if (arch.length > 0) out.architecture = arch;
  }
  if (typeof raw.license === 'string' && raw.license.length > 0) out.license = raw.license;

  const featuredTags = parseFeaturedTags(raw.tags);
  if (featuredTags.length > 0) out.featuredTags = featuredTags;

  return out;
}

async function fetchImageList(): Promise<CommunityImage[]> {
  try {
    const res = await fetch(IMAGE_LIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: 1,
        limit: IMAGE_LIST_LIMIT,
        sort: 'latest',
        isPublic: true,
      }),
      // The cross-request cache is provided by unstable_cache below; the raw
      // POST itself is never cached by Next's fetch Data Cache.
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { items?: unknown } };
    const items = json.data?.items;
    if (!Array.isArray(items)) return [];
    return items
      .map((item) => parseItem(item as RawApiItem))
      .filter((x): x is CommunityImage => x !== null);
  } catch {
    return [];
  }
}

/**
 * Fetch the public (anonymously-pullable) CleanStart images, newest-first, from
 * the same backend as images.cleanstart.com.
 *
 * Returns an empty array on any failure (network, non-2xx, malformed payload).
 * Callers are expected to provide their own page-appropriate fallback rather
 * than this fetcher returning hardcoded marketing data.
 */
export const fetchCommunityImages = cache(
  unstable_cache(fetchImageList, ['community-images-list'], {
    revalidate: REVALIDATE_SECONDS,
    tags: [COMMUNITY_IMAGES_TAG],
  }),
);
