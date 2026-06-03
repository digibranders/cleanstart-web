import { collectionUrlFromDoc } from '../route-prefixes';

/**
 * Strips a single trailing slash. JSON-LD `@id` and `url` should be
 * canonical, and we want one shape across the system — no doubles, no
 * inconsistent endings.
 */
const trimTrailingSlash = (s: string): string => (s.endsWith('/') ? s.slice(0, -1) : s);

/**
 * Compose a fully-qualified URL from `siteSettings.baseUrl` and a
 * collection-relative path. The base is normalised to drop any
 * trailing slash so the result is always `<baseUrl><path>` exactly.
 */
export const absoluteUrl = (baseUrl: string, path: string): string => {
  const trimmedBase = trimTrailingSlash(baseUrl);
  if (path.length === 0) return trimmedBase;
  return path.startsWith('/') ? `${trimmedBase}${path}` : `${trimmedBase}/${path}`;
};

/**
 * Doc shape for canonical-URL computation. `seo` is typed as `unknown`
 * because the full Payload doc shape varies per collection; we narrow
 * at runtime. This lets every dispatch site pass its own typed doc
 * (or the looser `AnyDoc` from dispatch.ts) without a cast.
 */
export type CanonicalDoc = {
  slug?: string | null;
  path?: string | null;
  seo?: unknown;
};

type SeoCanonicalShape = {
  useCustomCanonical?: boolean | null;
  canonicalOverride?: string | null;
};

const readSeoCanonical = (seo: unknown): SeoCanonicalShape => {
  if (typeof seo !== 'object' || seo === null) return {};
  const o = seo as SeoCanonicalShape;
  return {
    useCustomCanonical: o.useCustomCanonical ?? null,
    canonicalOverride: o.canonicalOverride ?? null,
  };
};

/**
 * Validates that an override looks like an absolute https URL with no
 * query / fragment. Intentionally stricter than the save-time canonical
 * validator (which historically allowed http): JSON-LD @id must use
 * https to match the live page canonical. Any http: override that reached
 * the DB via legacy import or direct edit is rejected here rather than
 * emitting a mismatched @id.
 */
const isValidOverride = (raw: string): boolean => {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    if (u.search.length > 0) return false;
    if (u.hash.length > 0) return false;
    return true;
  } catch {
    return false;
  }
};

/**
 * Compose the canonical absolute URL for a document.
 *
 * Resolution order:
 *   1. `seo.useCustomCanonical === true` AND `seo.canonicalOverride`
 *      is a valid absolute http(s) URL → return that override. This
 *      is for content originally published off-domain where Google
 *      should credit the original source.
 *   2. For `pages`, use `doc.path` (the parent-resolved path).
 *   3. For everything else, use `<route-prefix>/<slug>` from
 *      `route-prefixes.ts`.
 *
 * Returns `null` when the doc lacks a slug or the collection has no
 * registered prefix AND there's no valid override — caller decides
 * whether to skip emission entirely.
 */
export const docCanonicalUrl = (
  baseUrl: string,
  collection: string,
  doc: CanonicalDoc,
): string | null => {
  const seo = readSeoCanonical(doc.seo);
  const override = seo.canonicalOverride?.trim() ?? '';
  if (seo.useCustomCanonical === true && override.length > 0 && isValidOverride(override)) {
    return trimTrailingSlash(override);
  }
  const path = collectionUrlFromDoc(collection, doc);
  if (path == null) return null;
  return absoluteUrl(baseUrl, path);
};
