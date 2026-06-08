import { SITE_URL } from '@/lib/seo/canonical';
import { isIndexingAllowed } from '@/lib/seo/indexing';
import type { MetadataRoute } from 'next';

/**
 * Single sitemap.xml — we're orders of magnitude below the 50k URL cap.
 *
 * Per Google Search Central (2023+), `<priority>` and `<changefreq>` are
 * ignored — Next.js's MetadataRoute.Sitemap type makes them optional and we
 * deliberately omit them. `<lastmod>` IS used, but only when accurate, so we
 * source it from CMS document timestamps. Static routes have no lastmod.
 *
 * When indexing is disallowed (any non-production deploy without the
 * ALLOW_INDEXING override) we return an empty sitemap — robots.ts blocks
 * indexing there too, so emitting the URLs would only invite scrapers.
 *
 * Docs flagged `seo.indexable = noindex` are excluded — the sitemap must never
 * advertise a URL the page itself tells Google not to index.
 */

type CmsDoc = {
  slug: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  displayPublishedAt?: string | null;
  publicationDate?: string | null;
  seo?: { indexable?: string | null } | null;
};

type CmsList<T> = { docs: T[] };

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3000';

// Per-collection published filters mirror each collection's lifecycle field:
// blogs/resources/events/authors use `publishedAt`, news uses `publicationDate`,
// jobs surface only open + published roles.
const BLOG_FILTER = 'where[_status][equals]=published&where[publishedAt][exists]=true';
const NEWS_FILTER = 'where[_status][equals]=published&where[publicationDate][exists]=true';
const JOBS_FILTER = 'where[_status][equals]=published&where[hiringStatus][equals]=open';

async function fetchDocs(collection: string, filter: string): Promise<CmsDoc[]> {
  try {
    const res = await fetch(`${CMS_URL}/api/${collection}?${filter}&depth=0&limit=1000`, {
      next: { revalidate: 3600, tags: [`sitemap:${collection}`] },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as CmsList<CmsDoc>;
    return (data.docs ?? []).filter(isIndexable);
  } catch {
    return [];
  }
}

// A doc is indexable unless the editor explicitly set seo.indexable to a
// noindex value. Missing/empty → default index.
function isIndexable(doc: CmsDoc): boolean {
  const value = doc.seo?.indexable;
  return !value || value === 'index';
}

// Every built non-dynamic route. Keep in sync with docs/web/WEB-PAGES.md.
// `/pricing` and `/webinars/[slug]` are intentionally omitted (not built).
const STATIC_ROUTES: ReadonlyArray<{ path: string }> = [
  { path: '/' },
  { path: '/about-us' },
  { path: '/attack-surface-reduction' },
  { path: '/blogs' },
  { path: '/book-a-demo' },
  { path: '/careers' },
  { path: '/cleansight' },
  { path: '/cleanstart-images' },
  { path: '/community' },
  { path: '/contact-us' },
  { path: '/deal-registration' },
  { path: '/events' },
  { path: '/fips' },
  { path: '/for-ciso' },
  { path: '/for-developers' },
  { path: '/guide' },
  { path: '/knowledge-hub' },
  // `/legal` is a 308 redirect (not a page) — excluded here. The individual
  // /legal/<slug> docs are emitted dynamically from the legalDocuments CMS.
  { path: '/news' },
  { path: '/partners' },
  { path: '/podcast' },
  { path: '/privacy-policy' },
  { path: '/resource-center' },
  { path: '/software-bill-materials' },
  // `/software-composition-analysis` is intentionally de-listed — the page code
  // is kept (reachable by direct URL) but excluded from sitemap and site nav.
  { path: '/teams' },
  { path: '/vulnerability-remediation' },
  { path: '/webinars' },
];

function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) return [];

  const [blogs, resources, authors, news, events, jobs, guides, legal, knowledgeBase] =
    await Promise.all([
      fetchDocs('blogs', BLOG_FILTER),
      fetchDocs('resources', BLOG_FILTER),
      fetchDocs('authors', BLOG_FILTER),
      fetchDocs('news', NEWS_FILTER),
      fetchDocs('events', BLOG_FILTER),
      fetchDocs('jobs', JOBS_FILTER),
      fetchDocs('guides', BLOG_FILTER),
      fetchDocs('legalDocuments', BLOG_FILTER),
      fetchDocs('knowledgeBase', BLOG_FILTER),
    ]);

  return [
    ...STATIC_ROUTES.map((r) => entry(r.path)),
    ...knowledgeBase.map((k) =>
      entry(
        `/knowledge-hub/${k.slug}`,
        k.updatedAt ?? k.displayPublishedAt ?? k.publishedAt ?? undefined,
      ),
    ),
    ...blogs.map((b) =>
      entry(`/blogs/${b.slug}`, b.updatedAt ?? b.displayPublishedAt ?? b.publishedAt ?? undefined),
    ),
    ...resources.map((r) =>
      entry(
        `/resources/${r.slug}`,
        r.updatedAt ?? r.displayPublishedAt ?? r.publishedAt ?? undefined,
      ),
    ),
    ...authors.map((a) =>
      entry(`/author/${a.slug}`, a.updatedAt ?? a.displayPublishedAt ?? a.publishedAt ?? undefined),
    ),
    ...news.map((n) => entry(`/news/${n.slug}`, n.updatedAt ?? n.publicationDate ?? undefined)),
    ...events.map((e) => entry(`/event/${e.slug}`, e.updatedAt ?? e.publishedAt ?? undefined)),
    ...jobs.map((j) => entry(`/job/${j.slug}`, j.updatedAt ?? undefined)),
    ...guides.map((g) => entry(`/guide/${g.slug}`, g.updatedAt ?? g.publishedAt ?? undefined)),
    ...legal.map((d) => entry(`/legal/${d.slug}`, d.updatedAt ?? d.publishedAt ?? undefined)),
  ];
}
