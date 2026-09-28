import path from 'node:path';

/**
 * Pure diffing logic behind `scripts/check-page-registry-coverage.ts` —
 * split out so it's unit-testable without touching the filesystem or
 * importing `apps/web`. See that script for the CLI wrapper and the "why"
 * (a route with no pageRegistry row gets no Schema Manager entry AND no
 * ⌘K search entry).
 */

/**
 * Routes that intentionally have no pageRegistry row: noindex utility
 * pages, internal tools, and generated-content endpoints that aren't a
 * "page" in the Schema Manager / search sense. Add to this list only for a
 * route that should NEVER be indexed — a page that's merely unbuilt yet
 * belongs in PAGE_REGISTRY_SEED instead, not here.
 */
export const INTENTIONALLY_UNREGISTERED: ReadonlySet<string> = new Set([
  // Internal signature-builder tool. noindex/nofollow + robots Disallow +
  // kept out of the sitemap by design (apps/web/src/app/email-signatures).
  '/email-signatures',
  // Post-submission utility pages, not content — one per form, no
  // standalone identity worth a search result.
  '/thank-you/[type]',
  // Internal draft-preview harness, never public.
  '/preview/[collection]/[slug]',
]);

/** Segment names that don't produce a URL segment (Next.js route groups). */
const isRouteGroupSegment = (segment: string): boolean =>
  segment.startsWith('(') && segment.endsWith(')');

/**
 * Convert a `page.tsx` file's path (relative to the app router root) to
 * its site-relative URL, preserving dynamic segments literally
 * (`[slug]`) — that's exactly how PAGE_REGISTRY_SEED encodes its
 * `cms-template` rows, so the two compare directly with no normalisation.
 */
export const routeFromPageFile = (relativeFilePath: string): string => {
  const segments = relativeFilePath.split(path.sep).slice(0, -1); // drop page.tsx/page.ts
  const urlSegments = segments.filter((s) => !isRouteGroupSegment(s));
  return urlSegments.length === 0 ? '/' : `/${urlSegments.join('/')}`;
};

export interface CoverageResult {
  readonly missing: readonly string[];
  readonly orphaned: readonly string[];
}

/**
 * Pure diff: which web routes have no seed row (fails CI), and which seed
 * rows point at a route that no longer exists (warns only). Both lists are
 * sorted for stable, readable output.
 */
export const diffPageRegistryCoverage = (
  webRoutes: readonly string[],
  seedPaths: readonly string[],
  intentionallyUnregistered: ReadonlySet<string> = INTENTIONALLY_UNREGISTERED,
): CoverageResult => {
  const seedSet = new Set(seedPaths);
  const webSet = new Set(webRoutes);

  const missing = webRoutes
    .filter((r) => !seedSet.has(r) && !intentionallyUnregistered.has(r))
    .sort();
  const orphaned = seedPaths.filter((p) => !webSet.has(p)).sort();

  return { missing, orphaned };
};
