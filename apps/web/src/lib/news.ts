import { cache } from "react";
import type { LexicalRoot, BlogImage, TocEntry } from "@/lib/blog";

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

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

async function fetchCMS<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

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

export const getNewsBySlug = cache(
  async (slug: string): Promise<NewsDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<NewsDetail>>(
      `/api/news?where[slug][equals]=${encodeURIComponent(slug)}&${PUBLISHED_FILTER}&depth=3&limit=1`,
    );
    return data.docs[0] ?? null;
  },
);

export async function getRelatedNews(
  newsId: string,
  categoryIds: string[],
  limit = 3,
): Promise<News[]> {
  if (categoryIds.length === 0) {
    const data = await fetchCMS<PayloadListResponse<News>>(
      `/api/news?${PUBLISHED_FILTER}&where[id][not_equals]=${newsId}&depth=2&limit=${limit}&sort=-publicationDate`,
    );
    return data.docs;
  }
  const catParam = categoryIds
    .map((id, i) => `where[newsCategories][in][${i}]=${encodeURIComponent(id)}`)
    .join("&");
  const data = await fetchCMS<PayloadListResponse<News>>(
    `/api/news?${PUBLISHED_FILTER}&where[id][not_equals]=${newsId}&${catParam}&depth=2&limit=${limit}&sort=-publicationDate`,
  );
  if (data.docs.length < limit) {
    const fallback = await fetchCMS<PayloadListResponse<News>>(
      `/api/news?${PUBLISHED_FILTER}&where[id][not_equals]=${newsId}&depth=2&limit=${limit}&sort=-publicationDate`,
    );
    return fallback.docs;
  }
  return data.docs;
}

const PRESS_TYPE_LABEL: Record<PressType, string> = {
  "press-release": "Press Release",
  news: "News",
  announcement: "Announcement",
  feature: "Feature",
};

export function pressTypeLabel(value: PressType | null | undefined): string {
  return PRESS_TYPE_LABEL[value ?? "press-release"];
}

export function formatNewsDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
