import { cache } from "react";
import type { LexicalRoot, BlogImage, TocEntry } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";

import { fetchCMS } from "./cms-fetch";

export type NewsCategory = {
  id: string;
  name: string;
  slug: string;
};

export type NewsImage = BlogImage;

export type PressType =
  | "press-release"
  | "news"
  | "announcement"
  | "feature";

export type News = {
  id: string;
  title: string;
  slug: string;
  abstract?: string | null;
  heroImage?: NewsImage | null;
  publisher?: string | null;
  publisherLogo?: NewsImage | null;
  pressType?: PressType | null;
  location?: string | null;
  newsCategories?: NewsCategory[] | null;
  externalUrl?: string | null;
  publicationDate?: string | null;
  readingMinutes?: number | null;
  seo?: CmsSeo | null;
};

export type NewsDetail = News & {
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  relatedNews?: News[] | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
  page: number;
  totalPages: number;
};

export type NewsListResponse = PayloadListResponse<News>;

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publicationDate][exists]=true";

export async function getNews({
  page = 1,
  limit = 9,
  category,
  search,
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
} = {}): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publicationDate][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publicationDate",
  });
  if (category) {
    params.set("where[newsCategories.slug][in][0]", category);
  }
  if (search) {
    params.set("where[title][contains]", search);
  }
  return fetchCMS<NewsListResponse>(`/api/news?${params.toString()}`);
}

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const data = await fetchCMS<PayloadListResponse<NewsCategory>>(
    "/api/newsCategories?limit=100&sort=name",
  );
  return data.docs;
}

async function loadNewsBySlug(slug: string, draft = false): Promise<NewsDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<NewsDetail>>(
    `/api/news?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=3&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getNewsBySlug = cache(
  async (slug: string): Promise<NewsDetail | null> => loadNewsBySlug(slug, false),
);

/** Draft variant for the `/preview/news/[slug]` route. Not cached. */
export async function getNewsBySlugDraft(slug: string): Promise<NewsDetail | null> {
  return loadNewsBySlug(slug, true);
}

export async function getRelatedNews(
  newsId: string,
  categoryIds: string[],
  limit = 3,
  { draft = false }: { draft?: boolean } = {},
): Promise<News[]> {
  const filter = draft ? "" : `${PUBLISHED_FILTER}&`;
  if (categoryIds.length === 0) {
    const data = await fetchCMS<PayloadListResponse<News>>(
      `/api/news?${filter}where[id][not_equals]=${newsId}&depth=2&limit=${limit}&sort=-publicationDate`,
      { draft },
    );
    return data.docs;
  }
  const catParam = categoryIds
    .map((id, i) => `where[newsCategories][in][${i}]=${encodeURIComponent(id)}`)
    .join("&");
  const data = await fetchCMS<PayloadListResponse<News>>(
    `/api/news?${filter}where[id][not_equals]=${newsId}&${catParam}&depth=2&limit=${limit}&sort=-publicationDate`,
    { draft },
  );
  if (data.docs.length < limit) {
    const fallback = await fetchCMS<PayloadListResponse<News>>(
      `/api/news?${filter}where[id][not_equals]=${newsId}&depth=2&limit=${limit}&sort=-publicationDate`,
      { draft },
    );
    return fallback.docs;
  }
  return data.docs;
}

// Client-safe helpers live in `news-utils.ts`. Re-exported for backward compat.
export { formatNewsDate, pressTypeLabel } from "./news-utils";
