import { cache } from 'react';

/**
 * Shared client for the public CleanStart community-images API.
 *
 * Caching layers (all stack for free in the App Router):
 *   1. React.cache()            — dedupes within a single render pass so multiple
 *                                  consumers (community page + developer hero)
 *                                  trigger one call.
 *   2. Next fetch Data Cache    — `next: { revalidate: 600, tags: [TAG] }` means
 *                                  at most one origin call every 10 min, shared
 *                                  across all visitors.
 *   3. Full Route Cache         — server components that consume this fetcher are
 *                                  statically rendered, so a page reload hits the
 *                                  CDN, not this fetcher.
 *
 * On-demand invalidation: call `revalidateTag(COMMUNITY_IMAGES_TAG)` from a
 * server action / webhook to drop the cache immediately when the API publishes
 * a new image.
 */

export const COMMUNITY_IMAGES_TAG = 'community-images';

const COMMUNITY_IMAGES_URL =
  'https://api-cleanstart-images.vercel.app/api/community-images';

/** Revalidate window in seconds — 10 min. */
const REVALIDATE_SECONDS = 600;

/** Subset of the API payload the web app actually consumes. */
export interface CommunityImage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  updatedAt?: string;
  publishedAt?: string;
  isFips?: boolean;
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
  if (raw.is_valid === false || raw.is_public === false) return null;

  const out: CommunityImage = {
    id: raw.id,
    name: raw.name,
    description: typeof raw.description === 'string' ? raw.description : '',
    imageUrl: raw.image_url,
  };
  if (typeof raw.updated_at === 'string') out.updatedAt = raw.updated_at;
  if (typeof raw.published_at === 'string') out.publishedAt = raw.published_at;
  if (typeof raw.is_fips === 'boolean') out.isFips = raw.is_fips;

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

/**
 * Fetch the public community-images catalog.
 *
 * Returns an empty array on any failure (network, non-2xx, malformed payload).
 * Callers are expected to provide their own page-appropriate fallback rather
 * than this fetcher returning hardcoded marketing data.
 */
export const fetchCommunityImages = cache(
  async (): Promise<CommunityImage[]> => {
    try {
      const res = await fetch(COMMUNITY_IMAGES_URL, {
        next: { revalidate: REVALIDATE_SECONDS, tags: [COMMUNITY_IMAGES_TAG] },
      });
      if (!res.ok) return [];
      const json = (await res.json()) as { items?: unknown };
      if (!Array.isArray(json.items)) return [];
      return json.items
        .map((item) => parseItem(item as RawApiItem))
        .filter((x): x is CommunityImage => x !== null);
    } catch {
      return [];
    }
  },
);
