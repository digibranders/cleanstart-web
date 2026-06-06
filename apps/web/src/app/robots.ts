import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const PRODUCTION_HOST = "https://www.cleanstart.com";
const NOINDEX_HOSTS = new Set(["staging.cleanstart.com"]);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const isProduction = process.env.VERCEL_ENV === "production";
  // Temporary escape hatch for a one-off external crawl/audit (SEO or security
  // scanner) of a non-production deployment. Set ALLOW_INDEXING=1 on the target
  // to force the production Allow output regardless of env/host; unset it to
  // restore the default block. Off by default — pairs with the same flag in
  // layout.tsx, which flips the per-page noindex meta tag.
  const allowIndexingOverride = process.env.ALLOW_INDEXING === "1";
  const headerList = await headers();
  const host = headerList.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  // The production deployment is also reachable at its `*.vercel.app` aliases,
  // which run with VERCEL_ENV=production and would otherwise pass the index
  // gate — creating a duplicate-content host. Block them regardless of env.
  const isNoindexHost = NOINDEX_HOSTS.has(host) || host.endsWith(".vercel.app");

  if (!allowIndexingOverride && (!isProduction || isNoindexHost)) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  // Allow all AI crawlers except Bytespider. ByteDance's Bytespider ignores
  // robots.txt, so the disallow here is symbolic — it is backed by a Vercel
  // Firewall rule matching on User-Agent.
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/preview/", "/api/preview/"] },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${PRODUCTION_HOST}/sitemap.xml`,
    host: PRODUCTION_HOST,
  };
}
