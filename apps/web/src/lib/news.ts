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

export type NewsRegion = "north-america" | "apac";

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
  region?: NewsRegion | null;
  newsCategories?: NewsCategory[] | null;
  externalUrl?: string | null;
  publicationDate?: string | null;
  updatedAt?: string | null;
  readingMinutes?: number | null;
  featured?: boolean | null;
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

// Fields the NewsroomCard renders — single source shared by the listing
// (getNews) and the related queries (getRelatedNews). Excludes the Lexical
// `body` so related/list responses stay under Next's 2 MB Data-Cache ceiling.
const NEWS_CARD_FIELDS = [
  "title",
  "slug",
  "abstract",
  "heroImage",
  "publicationDate",
  "updatedAt",
  "newsCategories",
  "publisher",
  "publisherLogo",
  "region",
  "seo",
] as const;
const NEWS_CARD_SELECT = NEWS_CARD_FIELDS.map(
  (f) => `select[${f}]=true`,
).join("&");

/** All published news slugs, for `generateStaticParams` (scalar-only query). */
export async function getNewsSlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    `/api/news?${PUBLISHED_FILTER}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

export async function getFeaturedNews(): Promise<News | null> {
  const featured = await fetchCMS<NewsListResponse>(
    `/api/news?${PUBLISHED_FILTER}&where[featured][equals]=true&depth=1&limit=1&sort=-publicationDate`,
  );
  if (featured.docs[0]) return featured.docs[0];

  const latest = await fetchCMS<NewsListResponse>(
    `/api/news?${PUBLISHED_FILTER}&depth=1&limit=1&sort=-publicationDate`,
  );
  return latest.docs[0] ?? null;
}

export async function getNews({
  page = 1,
  limit = 9,
  category,
  search,
  region,
  year,
}: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  region?: NewsRegion;
  year?: number;
} = {}): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publicationDate][exists]": "true",
    // depth=1 + card-field whitelist — excludes the Lexical `body` and the
    // depth-2 relationship chains the listing never renders, keeping the
    // response small enough to stay in Next's data cache (see getGuides/getBlogs).
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-publicationDate",
  });
  for (const field of NEWS_CARD_FIELDS) {
    params.set(`select[${field}]`, "true");
  }
  if (category) {
    params.set("where[newsCategories.slug][in][0]", category);
  }
  if (search) {
    params.set("where[title][contains]", search);
  }
  if (region) {
    params.set("where[region][equals]", region);
  }
  if (year) {
    params.set("where[publicationDate][greater_than_equal]", `${year}-01-01T00:00:00.000Z`);
    params.set("where[publicationDate][less_than]", `${year + 1}-01-01T00:00:00.000Z`);
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
    `/api/news?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getNewsBySlug = cache(
  async (slug: string): Promise<NewsDetail | null> => loadNewsBySlug(slug, false),
);

/** Draft variant for the `/preview/news/[slug]` route. Not cached. */
export async function getNewsBySlugDraft(slug: string): Promise<NewsDetail | null> {
  const draftDoc = await loadNewsBySlug(slug, true);
  if (draftDoc) return draftDoc;
  return loadNewsBySlug(slug, false);
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
      `/api/news?${filter}where[id][not_equals]=${newsId}&depth=1&${NEWS_CARD_SELECT}&limit=${limit}&sort=-publicationDate`,
      { draft },
    );
    return data.docs;
  }
  const catParam = categoryIds
    .map((id, i) => `where[newsCategories][in][${i}]=${encodeURIComponent(id)}`)
    .join("&");
  const data = await fetchCMS<PayloadListResponse<News>>(
    `/api/news?${filter}where[id][not_equals]=${newsId}&${catParam}&depth=1&${NEWS_CARD_SELECT}&limit=${limit}&sort=-publicationDate`,
    { draft },
  );
  if (data.docs.length < limit) {
    const fallback = await fetchCMS<PayloadListResponse<News>>(
      `/api/news?${filter}where[id][not_equals]=${newsId}&depth=1&${NEWS_CARD_SELECT}&limit=${limit}&sort=-publicationDate`,
      { draft },
    );
    return fallback.docs;
  }
  return data.docs;
}

// Client-safe helpers live in `news-utils.ts`. Re-exported for backward compat.
export {
  formatNewsDate,
  pressTypeLabel,
  REGION_LABEL,
  FILTERABLE_REGIONS,
  FILTERABLE_YEARS,
  regionLabel,
  parseRegionParam,
  parseYearParam,
} from "./news-utils";
