import { cache } from "react";

import type { Blog, BlogAuthor, BlogDetail } from "./blog";
import { fetchCMS } from "./cms-fetch";

/**
 * Security advisories. Same document shape as a blog post minus categories and
 * the blog-only sidebar/journey fields, so the listing and article reuse the
 * blog types and components.
 */
export type Advisory = Blog;
export type AdvisoryDetail = Omit<
  BlogDetail,
  "relatedPosts" | "previousPost" | "nextPost" | "ctaResource" | "ctaImage"
>;

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  page: number;
  totalPages: number;
};

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

// Card-only projection: keeps every list read free of the Lexical body, which
// would push multi-doc responses past Next's 2 MB data-cache ceiling.
const CARD_SELECT = [
  "title",
  "slug",
  "abstract",
  "heroImage",
  "authors",
  "publishedAt",
  "displayPublishedAt",
  "updatedAt",
  "readingMinutes",
  "featured",
  "seo",
]
  .map((field) => `select[${field}]=true`)
  .join("&");

const RELATED_TARGET = 3;

export async function getAdvisorySlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    `/api/advisories?${PUBLISHED_FILTER}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

/** Every published advisory, newest first, for the client-filtered listing. */
export async function getAdvisories(): Promise<Advisory[]> {
  const res = await fetchCMS<PayloadListResponse<Advisory>>(
    `/api/advisories?${PUBLISHED_FILTER}&depth=1&limit=1000&sort=-displayPublishedAt&${CARD_SELECT}`,
  );
  return res.docs;
}

/** The editor-featured advisory, falling back to the newest. */
export function pickFeaturedAdvisory(all: Advisory[]): Advisory | null {
  return all.find((a) => a.featured) ?? all[0] ?? null;
}

async function loadAdvisoryBySlug(slug: string, draft: boolean): Promise<AdvisoryDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<AdvisoryDetail>>(
    `/api/advisories?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  const advisory = data.docs[0] ?? null;
  if (!advisory) return null;

  // The storage adapter leaves `url` unset on uploads nested past depth=1
  // (advisory -> author -> photo), so re-read the authors to resolve photos.
  if (advisory.authors && advisory.authors.length > 0) {
    const idParams = advisory.authors
      .map((a, i) => `where[id][in][${i}]=${encodeURIComponent(a.id)}`)
      .join("&");
    try {
      const authorsData = await fetchCMS<PayloadListResponse<BlogAuthor>>(
        `/api/authors?${idParams}&depth=1&limit=10`,
        { draft },
      );
      const authorMap = new Map(authorsData.docs.map((a) => [a.id, a]));
      advisory.authors = advisory.authors.map((a) => authorMap.get(a.id) ?? a);
    } catch {
      // Non-fatal: keep the authors embedded in the advisory.
    }
  }

  return advisory;
}

export const getAdvisoryBySlug = cache(
  async (slug: string): Promise<AdvisoryDetail | null> => loadAdvisoryBySlug(slug, false),
);

/** Draft read for `/preview/advisories/[slug]`; falls back to the published doc. */
export async function getAdvisoryBySlugDraft(slug: string): Promise<AdvisoryDetail | null> {
  return (await loadAdvisoryBySlug(slug, true)) ?? loadAdvisoryBySlug(slug, false);
}

/** The newest other advisories, for the "Related Advisories" grid. */
export async function getRelatedAdvisories(
  advisoryId: string,
  { draft = false }: { draft?: boolean } = {},
): Promise<Advisory[]> {
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  const data = await fetchCMS<PayloadListResponse<Advisory>>(
    `/api/advisories?${filter}where[id][not_equals]=${encodeURIComponent(advisoryId)}&depth=1&${CARD_SELECT}&limit=${RELATED_TARGET}&sort=-displayPublishedAt`,
    { draft },
  );
  return data.docs;
}
