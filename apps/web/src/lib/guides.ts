import { cache } from "react";
import type { BlogAuthor, BlogImage, LexicalRoot, TocEntry } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";

import { fetchCMS } from "./cms-fetch";

export type GuideImage = BlogImage;

export type GuideFaqItem = {
  id?: string;
  question: string;
  answer: string;
};

export type Guide = {
  id: string;
  title: string;
  slug: string;
  abstract?: string | null;
  heroImage?: GuideImage | null;
  authors?: BlogAuthor[] | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  readingMinutes?: number | null;
  seo?: CmsSeo | null;
};

export type GuideDetail = Guide & {
  body?: LexicalRoot | null;
  tableOfContents?: TocEntry[] | null;
  faqs?: GuideFaqItem[] | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  totalPages: number;
};

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

// Shared loader. In draft mode the published filter is dropped so the preview
// route can render unpublished edits (cms-fetch authenticates the draft read).
async function loadGuideBySlug(
  slug: string,
  draft = false,
): Promise<GuideDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<GuideDetail>>(
    `/api/guides?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=3&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getGuideBySlug = cache(
  async (slug: string): Promise<GuideDetail | null> => loadGuideBySlug(slug, false),
);

/** Draft variant for the `/preview/guides/[slug]` route. Not cached. */
export async function getGuideBySlugDraft(
  slug: string,
): Promise<GuideDetail | null> {
  return loadGuideBySlug(slug, true);
}
