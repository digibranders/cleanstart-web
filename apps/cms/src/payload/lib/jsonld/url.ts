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
 * Compose the canonical absolute URL for a document.
 *
 * - For `pages`, uses `doc.path` (the parent-resolved path) when set.
 * - For everything else, uses `<route-prefix>/<slug>` from
 *   `route-prefixes.ts`.
 *
 * Returns `null` when the doc lacks a slug or the collection has no
 * registered prefix — caller decides whether to skip emission or
 * fall back to a custom canonical from `seo.canonicalOverride`.
 */
export const docCanonicalUrl = (
  baseUrl: string,
  collection: string,
  doc: { slug?: string | null; path?: string | null },
): string | null => {
  const path = collectionUrlFromDoc(collection, doc);
  if (path == null) return null;
  return absoluteUrl(baseUrl, path);
};
