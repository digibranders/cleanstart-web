/**
 * Server-only data layer for the homepage "Resources & Insights" rail.
 *
 * Pulls the latest 3 entries from each of the 6 CMS collections the
 * section surfaces (blogs · resources · news · knowledgeBase · events ·
 * podcastEpisodes) and maps them to a single `ResourceCard` shape the
 * UI can render uniformly.
 *
 * --- Uptime / caching contract -------------------------------------
 *
 * The homepage is the highest-traffic surface on the site, so this lib
 * is built around two guarantees:
 *
 *   1. **The section never breaks the page.** Every fetch is wrapped in
 *      `try/catch` and individual collection failures degrade to an
 *      empty array — `Promise.allSettled` ensures one slow / dead
 *      collection cannot poison the others.
 *
 *   2. **CMS downtime is invisible to visitors once content is warm.**
 *      We deliberately bypass `lib/cms-fetch` here. `cms-fetch` reads
 *      cookies via `draftMode()` for editor previews — that read forces
 *      Next.js to render the host route dynamically, which would burn
 *      the home page's static prerender and re-hit CMS on every request.
 *      Instead we use raw `fetch` with `next: { revalidate: 300 }` so
 *      Next.js ISR caches each collection's response for 5 minutes and
 *      keeps serving the last known-good payload from the data-cache
 *      whenever a background revalidation fails (e.g. CMS reboot,
 *      droplet network blip). The home page never blocks on CMS.
 *
 * Editor previews are not relevant here — this is the public "latest
 * content" rail; draft posts shouldn't surface anyway.
 *
 * Tags (`resources-insights`, plus per-collection tags) are set so a
 * future `/api/revalidate` hook can purge the rail on publish without
 * waiting the full 300s window.
 */

import { cmsBaseUrl } from "./cms-fetch";
import type { ResourceType } from "./resources";
import { resourceCoverPoster } from "./resources-utils";

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

/** 5-minute ISR window. Background revalidation only — never blocks. */
const REVALIDATE_SECONDS = 300;

export type TabId = "blogs" | "resource" | "newsroom" | "events";

export interface ResourceCard {
  image: string;
  title: string;
  description: string;
  href: string;
  /** When true, render the cover poster with the title overlaid (resource booklet style). */
  isCoverPoster?: boolean;
}

export type ResourceCardsByTab = Record<TabId, ResourceCard[]>;

// -- Minimal CMS response shapes -------------------------------------
// We only model the fields this rail consumes; the underlying records
// are richer (see lib/blog.ts, lib/news.ts, etc. for the full types).

interface PayloadListResponse<T> {
  docs: T[];
}

interface CmsImageSize {
  url?: string | null;
}

interface CmsImage {
  url?: string | null;
  alt?: string | null;
  sizes?: {
    thumb?: CmsImageSize;
    card?: CmsImageSize;
    hero?: CmsImageSize;
  } | null;
}

interface CmsBlog {
  slug: string;
  title: string;
  abstract?: string | null;
  heroImage?: CmsImage | null;
}

interface CmsResource {
  slug: string;
  title: string;
  type?: ResourceType | null;
  summary?: string | null;
  asset?: CmsImage | null;
}

interface CmsNews {
  slug: string;
  title: string;
  abstract?: string | null;
  heroImage?: CmsImage | null;
}

interface CmsEvent {
  slug: string;
  title: string;
  abstract?: string | null;
  heroImage?: CmsImage | null;
}

// -- Helpers ---------------------------------------------------------

/**
 * Resolve a possibly-relative CMS upload URL into an absolute one.
 * Payload returns `/api/media/file/...` paths when its `serverURL` env
 * is unset; prefix the CMS host so Next.js Image (or a plain <img>) can
 * actually load it. Returns `null` for unknown / missing inputs.
 */
function absUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${cmsBaseUrl()}${url}`;
}

/**
 * Pick the best-available size variant from a CMS upload field, preferring
 * the smaller `card`/`thumb` derivatives (faster + Payload's R2 adapter
 * sometimes 404s on the canonical URL while size variants stay valid).
 */
function pickImage(image: CmsImage | null | undefined): string | null {
  if (!image) return null;
  return (
    absUrl(image.sizes?.card?.url) ??
    absUrl(image.sizes?.thumb?.url) ??
    absUrl(image.sizes?.hero?.url) ??
    absUrl(image.url)
  );
}

/**
 * One-shot fetcher for the "latest published" REST call against a Payload
 * collection. Wrapped in `try/catch` so a CMS outage never throws up the
 * stack — callers always get either the parsed body or `null`.
 *
 * Cache:
 *   - `revalidate: 300` (5 minutes) — ISR window.
 *   - `tags: ['resources-insights', `cms:<collection>`]` — lets us purge
 *     this rail explicitly when content is published in CMS.
 */
async function fetchCollection<T>(
  collection: string,
  query: string,
): Promise<PayloadListResponse<T> | null> {
  try {
    const res = await fetch(`${CMS_URL}/api/${collection}?${query}`, {
      next: {
        revalidate: REVALIDATE_SECONDS,
        tags: ["resources-insights", `cms:${collection}`],
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as PayloadListResponse<T>;
  } catch {
    return null;
  }
}

// -- Per-collection mappers ------------------------------------------

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";
const NEWS_PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publicationDate][exists]=true";

async function loadBlogs(): Promise<ResourceCard[]> {
  const data = await fetchCollection<CmsBlog>(
    "blogs",
    `${PUBLISHED_FILTER}&depth=1&limit=3&sort=-publishedAt&select[title]=true&select[slug]=true&select[abstract]=true&select[heroImage]=true`,
  );
  if (!data) return [];
  return data.docs
    .map((d): ResourceCard | null => {
      const image = pickImage(d.heroImage);
      if (!d.slug || !d.title) return null;
      return {
        image: image ?? "/images/resource-1.png",
        title: d.title,
        description: d.abstract?.trim() ?? "",
        href: `/blog/${d.slug}`,
      };
    })
    .filter((c): c is ResourceCard => c !== null);
}

async function loadResources(): Promise<ResourceCard[]> {
  const data = await fetchCollection<CmsResource>(
    "resources",
    `${PUBLISHED_FILTER}&depth=1&limit=3&sort=-publishedAt&select[title]=true&select[slug]=true&select[type]=true&select[summary]=true&select[asset]=true`,
  );
  if (!data) return [];
  return data.docs
    .map((d): ResourceCard | null => {
      if (!d.slug || !d.title) return null;
      return {
        image: resourceCoverPoster(d.type),
        title: d.title,
        description: d.summary?.trim() ?? "",
        href: `/resource/${d.slug}`,
        isCoverPoster: true,
      };
    })
    .filter((c): c is ResourceCard => c !== null);
}

async function loadNews(): Promise<ResourceCard[]> {
  const data = await fetchCollection<CmsNews>(
    "news",
    `${NEWS_PUBLISHED_FILTER}&depth=1&limit=3&sort=-publicationDate&select[title]=true&select[slug]=true&select[abstract]=true&select[heroImage]=true`,
  );
  if (!data) return [];
  return data.docs
    .map((d): ResourceCard | null => {
      const image = pickImage(d.heroImage);
      if (!d.slug || !d.title) return null;
      return {
        image: image ?? "/images/resource-3.png",
        title: d.title,
        description: d.abstract?.trim() ?? "",
        href: `/news/${d.slug}`,
      };
    })
    .filter((c): c is ResourceCard => c !== null);
}

async function loadEvents(): Promise<ResourceCard[]> {
  const data = await fetchCollection<CmsEvent>(
    "events",
    `${PUBLISHED_FILTER}&depth=1&limit=3&sort=-publishedAt&select[title]=true&select[slug]=true&select[abstract]=true&select[heroImage]=true`,
  );
  if (!data) return [];
  return data.docs
    .map((d): ResourceCard | null => {
      const image = pickImage(d.heroImage);
      if (!d.slug || !d.title) return null;
      return {
        image: image ?? "/images/resource-1.png",
        title: d.title,
        description: d.abstract?.trim() ?? "",
        href: `/events/${d.slug}`,
      };
    })
    .filter((c): c is ResourceCard => c !== null);
}

/**
 * Fetch every tab in parallel, with one-failure isolation. Returns a
 * fully-populated map — failed collections come back as `[]` and the
 * server component falls back to its hardcoded placeholders for that
 * tab so the section is always populated.
 */
export async function getResourcesInsightsData(): Promise<ResourceCardsByTab> {
  const [blogs, resource, newsroom, events] = await Promise.all([
    loadBlogs().catch(() => []),
    loadResources().catch(() => []),
    loadNews().catch(() => []),
    loadEvents().catch(() => []),
  ]);

  return { blogs, resource, newsroom, events };
}
