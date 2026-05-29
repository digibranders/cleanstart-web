import type { MetadataRoute } from "next";
import { headers } from "next/headers";

const PRODUCTION_HOST = "https://www.cleanstart.com";
const NOINDEX_HOSTS = new Set(["staging.cleanstart.com"]);

export default async function robots(): Promise<MetadataRoute.Robots> {
  const isProduction = process.env.VERCEL_ENV === "production";
  const headerList = await headers();
  const host = headerList.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  // The production deployment is also reachable at its `*.vercel.app` aliases,
  // which run with VERCEL_ENV=production and would otherwise pass the index
  // gate — creating a duplicate-content host. Block them regardless of env.
  const isNoindexHost = NOINDEX_HOSTS.has(host) || host.endsWith(".vercel.app");

  if (!isProduction || isNoindexHost) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  // Decision §8 of WEB-PRODUCTION.md: allow all AI crawlers except Bytespider.
  // ByteDance's Bytespider ignores robots.txt — the symbolic disallow here is
  // backed by a Vercel Firewall rule on User-Agent.
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/preview/", "/api/preview/"] },
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${PRODUCTION_HOST}/sitemap.xml`,
    host: PRODUCTION_HOST,
  };
}
