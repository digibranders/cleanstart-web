import { SITE_URL } from '@/lib/seo/canonical';
import { legalHref } from '@/lib/legal';
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

/**
 * Re-render the route hourly.
 *
 * Without this the segment is prerendered once at build and served unchanged
 * until the next deploy: the per-fetch `revalidate` below refreshes the data
 * cache, but nothing re-runs this function, so a doc published between deploys
 * never reaches the sitemap. Observed 2026-08-26 — the live sitemap's newest
 * `lastmod` predated the last deploy and two documents published after it were
 * absent while the CMS returned them correctly.
 *
 * The CMS publish hook also purges `/sitemap.xml` on every publish, so this is
 * the backstop for changes that bypass the hook (a direct DB edit, a failed
 * webhook), not the primary path.
 */
export const revalidate = 3600;

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
// blogs/resources/events/guides/knowledgeBase/legalDocuments use `publishedAt`,
// news uses `publicationDate`, jobs surface only open + published roles.
// Authors has no `publishedAt` field — status-only filter is correct.
const BLOG_FILTER = 'where[_status][equals]=published&where[publishedAt][exists]=true';
const AUTHORS_FILTER = 'where[_status][equals]=published';
const NEWS_FILTER = 'where[_status][equals]=published&where[publicationDate][exists]=true';
const JOBS_FILTER = 'where[_status][equals]=published&where[hiringStatus][equals]=open';

// Only the fields CmsDoc actually reads — keeps each response well under
// Next's 2 MB data-cache ceiling (knowledgeBase full-body was 19.8 MB).
const SITEMAP_SELECT =
  'select[slug]=true&select[updatedAt]=true&select[publishedAt]=true' +
  '&select[displayPublishedAt]=true&select[publicationDate]=true&select[seo]=true';

async function fetchDocs(collection: string, filter: string): Promise<CmsDoc[]> {
  try {
    const res = await fetch(
      `${CMS_URL}/api/${collection}?${filter}&depth=0&limit=1000&${SITEMAP_SELECT}`,
      { next: { revalidate: 3600, tags: [`sitemap:${collection}`] } },
    );
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
  { path: '/case-studies' },
  { path: '/clean-libraries' },
  { path: '/cleansight' },
  { path: '/cleanstart-images' },
  // `/cleanstart-platform` is intentionally de-listed — the page is not yet
  // complete, so it is noindex'd and excluded from the sitemap. Re-add when it
  // ships (and drop the `noindex` in its page metadata).
  { path: '/community' },
  // `/compare/cleanstart-vs-docker-hardened-images` is intentionally de-listed
  // — the page is not signed off yet, so it is noindex,nofollow and excluded
  // from the sitemap. Re-add when it ships (and drop the `noindex` / `nofollow`
  // in its page metadata).
  { path: '/contact-us' },
  { path: '/deal-registration' },
  { path: '/events' },
  { path: '/fips' },
  { path: '/for-ciso' },
  { path: '/for-developers' },
  { path: '/guide' },
  { path: '/industries/financial-services-container-security' },
  { path: '/modern-applications' },
  // `/industries` itself has no page, so there is no hub URL to list.
  // `/knowledge-hub` is a redirect to the first article (no standalone listing) —
  // excluded here. The individual /knowledge-hub/<slug> articles are emitted below.
  // `/legal` is a 308 redirect (not a page) — excluded here. The individual
  // /legal/<slug> docs are emitted dynamically from the legalDocuments CMS.
  { path: '/news' },
  { path: '/partners' },
  { path: '/podcast' },
  { path: '/pricing' },
  // `/privacy-policy` is emitted from the legalDocuments block below (via
  // `legalHref`), which carries a real CMS lastmod. Listing it here too would
  // duplicate the URL.
  { path: '/resource-center' },
  { path: '/software-bill-materials' },
  { path: '/teams' },
  { path: '/vulnerability-remediation' },
  { path: '/webinars' },
];

/**
 * Root is emitted as the bare origin (no trailing slash) so the `<loc>` matches
 * the homepage's own `rel=canonical` byte-for-byte.
 *
 * The two forms are equivalent — RFC 3986 §6.2.3 normalises an empty http(s)
 * path to `/` — so this changes nothing Google acts on. It exists because the
 * canonical is the side we cannot move: Next's metadata resolver collapses any
 * root-path canonical to the origin unless `trailingSlash` is enabled, and
 * enabling that would invert the trailing-slash policy `proxy.ts` applies to
 * every other route. Aligning the sitemap is the side that is safe to change.
 *
 * Every non-root path already lacks a trailing slash, so this only affects `/`.
 */
function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return {
    url: path === '/' ? SITE_URL : `${SITE_URL}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) return [];

  const [blogs, resources, authors, news, events, jobs, guides, legal, knowledgeBase] =
    await Promise.all([
      fetchDocs('blogs', BLOG_FILTER),
      fetchDocs('resources', BLOG_FILTER),
      fetchDocs('authors', AUTHORS_FILTER),
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
    // `legalHref` — not `/legal/<slug>` — because the Privacy Policy's canonical
    // public URL is the standalone `/privacy-policy`; `/legal/privacy-policy`
    // permanently redirects to it. Emitting the raw path put a 308 in the
    // sitemap alongside its own destination.
    ...legal.map((d) => entry(legalHref(d.slug), d.updatedAt ?? d.publishedAt ?? undefined)),
  ];
}
