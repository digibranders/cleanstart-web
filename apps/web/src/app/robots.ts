import type { MetadataRoute } from "next";

const PRODUCTION_HOST = "https://www.cleanstart.com";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!isProduction) {
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
