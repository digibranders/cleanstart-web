import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { SITE_URL } from "@/lib/seo/canonical";
import { isIndexingAllowed } from "@/lib/seo/indexing";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const host = headerList.get("host");

  if (!isIndexingAllowed(host)) {
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
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
