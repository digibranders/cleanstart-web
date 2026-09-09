/**
 * Section landing paths that have no standalone index page. Each permanently
 * redirects to its canonical first document, issued in `proxy.ts` before any
 * rendering so crawlers receive a hard 308.
 *
 * This is the single source of truth for those pairs. `proxy.ts` reads it to
 * issue the redirect; link sites read it through `sectionIndexHref` so no
 * internal link ever points at a URL that redirects. Keeping both sides on one
 * map is what stops the two drifting apart.
 */
export const SECTION_INDEX_REDIRECTS: Record<string, string> = {
  "/knowledge-hub": "/knowledge-hub/vex-documents",
  "/legal": "/legal/additional-third-party-terms",
};

/**
 * Resolves an internal path to the URL that actually returns 200. Paths with no
 * entry in the map are returned unchanged, so this is safe to wrap any href in.
 */
export function sectionIndexHref(path: string): string {
  return SECTION_INDEX_REDIRECTS[path] ?? path;
}
