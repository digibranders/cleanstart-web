import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/canonical";

/**
 * Single sitemap.xml — we're orders of magnitude below the 50k URL cap.
 *
 * Per Google Search Central (2023+), `<priority>` and `<changefreq>` are
 * ignored — Next.js's MetadataRoute.Sitemap type makes them optional and we
 * deliberately omit them. `<lastmod>` IS used, but only when accurate, so we
 * source it from CMS document timestamps. Static routes have no lastmod.
 *
 * Off-production we return an empty sitemap; robots.ts blocks indexing
 * entirely on previews, so emitting the URLs would only invite scrapers.
 */

type CmsDoc = {
  slug: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
};

type CmsList<T> = { docs: T[] };

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

async function fetchPublished(collection: string): Promise<CmsDoc[]> {
  try {
    const res = await fetch(
      `${CMS_URL}/api/${collection}?${PUBLISHED_FILTER}&depth=0&limit=1000&sort=-publishedAt`,
      { next: { revalidate: 3600, tags: [`sitemap:${collection}`] } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as CmsList<CmsDoc>;
    return data.docs ?? [];
  } catch {
    return [];
  }
}

// Keep in sync with docs/WEB-PAGES.md as new static pages ship
// (pricing, contact-us, products, careers, etc. — currently not built).
const STATIC_ROUTES: ReadonlyArray<{ path: string }> = [
  { path: "/" },
  { path: "/about-us" },
  { path: "/blogs" },
  { path: "/resource-center" },
  { path: "/vulnerability-remediation" },
];

function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isProduction = process.env.VERCEL_ENV === "production";
  if (!isProduction) return [];

  const [blogs, resources, authors] = await Promise.all([
    fetchPublished("blogs"),
    fetchPublished("resources"),
    fetchPublished("authors"),
  ]);

  return [
    ...STATIC_ROUTES.map((r) => entry(r.path)),
    ...blogs.map((b) =>
      entry(`/blog/${b.slug}`, b.updatedAt ?? b.publishedAt ?? undefined),
    ),
    ...resources.map((r) =>
      entry(`/resource/${r.slug}`, r.updatedAt ?? r.publishedAt ?? undefined),
    ),
    ...authors.map((a) =>
      entry(`/author/${a.slug}`, a.updatedAt ?? a.publishedAt ?? undefined),
    ),
  ];
}
