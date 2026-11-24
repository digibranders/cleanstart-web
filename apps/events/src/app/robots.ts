import type { MetadataRoute } from "next";

import { SITE_URL, isIndexingAllowed } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
