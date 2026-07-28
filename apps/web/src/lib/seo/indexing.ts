/**
 * Single source of truth for whether this deployment may be indexed by search
 * engines. Every noindex layer (robots.txt, the per-page `robots` meta tag, the
 * `X-Robots-Tag` header in proxy.ts, and the sitemap) consults this so they can
 * never drift out of sync. Mirrors the CMS gate in
 * `apps/cms/src/payload/lib/seo-env.ts`.
 *
 * Indexing is allowed only on the production site (www.cleanstart.com), which
 * runs with `VERCEL_ENV=production`. Staging and the production deployment's
 * `*.vercel.app` aliases also run with `VERCEL_ENV=production`, so they are
 * excluded by host to avoid duplicating www in the index.
 *
 * `ALLOW_INDEXING=1` is a temporary escape hatch that forces indexing on
 * regardless of env/host — used to open a non-production deploy (e.g. staging)
 * to an external SEO/security audit tool, then re-blocked by unsetting it. Off
 * by default.
 *
 * Edge-safe: pure `process.env` reads only, so it is importable from middleware
 * (proxy.ts) as well as build-time metadata.
 */
/**
 * Exact hosts we never index. Exported so the GA4 head snippet can serialize the
 * same list into its in-browser host check (lib/analytics/ga4-snippet.ts) rather
 * than hardcoding a second copy that could drift from this one.
 */
export const NOINDEX_HOSTS: readonly string[] = ["staging.cleanstart.com"];

/** Host suffixes we never index (Vercel preview aliases). Same rationale. */
export const NOINDEX_HOST_SUFFIXES: readonly string[] = [".vercel.app"];

export function isNoindexHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const bare = host.split(":")[0]?.toLowerCase() ?? "";
  return (
    NOINDEX_HOSTS.includes(bare) ||
    NOINDEX_HOST_SUFFIXES.some((suffix) => bare.endsWith(suffix))
  );
}

/**
 * @param host Request host for host-aware callers (middleware, robots.txt) so
 *   production-env staging / `*.vercel.app` aliases stay no-index. Build-time
 *   callers (page metadata, sitemap) omit it — for those the per-host backstop
 *   is the `X-Robots-Tag` header set in proxy.ts.
 */
export function isIndexingAllowed(host?: string | null): boolean {
  if (process.env.ALLOW_INDEXING === "1") return true;
  if (process.env.VERCEL_ENV !== "production") return false;
  if (host !== undefined && isNoindexHost(host)) return false;
  return true;
}
