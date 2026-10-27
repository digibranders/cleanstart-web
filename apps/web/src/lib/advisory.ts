import { cache } from "react";

import type { AdvisoryRow } from "./advisory-utils";
import type { LexicalRoot } from "./blog";
import { fetchCMS } from "./cms-fetch";
import type { CmsSeo } from "./seo/cms-seo";

export type AdvisoryDetail = AdvisoryRow & {
  body?: LexicalRoot | null;
  impact?: LexicalRoot | null;
  resolution?: LexicalRoot | null;
  contentUpdatedAt?: string | null;
  updatedAt?: string;
  seo?: CmsSeo | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  page: number;
  totalPages: number;
};

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

// Row-only projection: keeps the listing read free of the three rich-text
// sections, which would push the response past Next's 2 MB data-cache ceiling.
const ROW_SELECT = [
  "title",
  "slug",
  "technology",
  "cves",
  "cvssScore",
  "fixStatus",
  "abstract",
  "publishedAt",
  "displayPublishedAt",
]
  .map((field) => `select[${field}]=true`)
  .join("&");

export async function getAdvisorySlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    `/api/advisories?${PUBLISHED_FILTER}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

/**
 * Every published advisory, newest first, for the client-filtered table and
 * the RSS feed. Tagged like the sitemap reads, so the publish hook's
 * `sitemap:advisories` purge refreshes the feed route too.
 */
export async function getAdvisories(): Promise<AdvisoryRow[]> {
  const res = await fetchCMS<PayloadListResponse<AdvisoryRow>>(
    `/api/advisories?${PUBLISHED_FILTER}&depth=0&limit=1000&sort=-displayPublishedAt&${ROW_SELECT}`,
    { tags: ["sitemap:advisories"] },
  );
  return res.docs;
}

async function loadAdvisoryBySlug(slug: string, draft: boolean): Promise<AdvisoryDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<AdvisoryDetail>>(
    `/api/advisories?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getAdvisoryBySlug = cache(
  async (slug: string): Promise<AdvisoryDetail | null> => loadAdvisoryBySlug(slug, false),
);

/** Draft read for `/preview/advisories/[slug]`; falls back to the published doc. */
export async function getAdvisoryBySlugDraft(slug: string): Promise<AdvisoryDetail | null> {
  return (await loadAdvisoryBySlug(slug, true)) ?? loadAdvisoryBySlug(slug, false);
}
