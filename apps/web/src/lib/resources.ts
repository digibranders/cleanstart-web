// Resource Center data layer — mirrors the blog.ts pattern.

import { cache } from "react";

import { cmsBaseUrl, fetchCMS } from "./cms-fetch";
import type { CmsSeo } from "./seo/cms-seo";

export type ResourceType =
  | "whitepaper"
  | "ebook"
  | "datasheet"
  | "architecture-insights"
  | "report";

export type ResourceImage = {
  id: string;
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type Resource = {
  id: string;
  title: string;
  slug: string;
  type?: ResourceType | null;
  summary?: string | null;
  publishedAt?: string | null;
  displayPublishedAt?: string | null;
  updatedAt?: string | null;
  gated?: boolean;
  ctaButtonText?: string | null;
  asset?: ResourceImage | null;
  seo?: CmsSeo | null;
};

export type ResourceDetail = Resource & {
  body?: import("./blog").LexicalRoot | null;
  heroImage?: ResourceImage | null;
  accessLevel?: "public" | "lead-gated" | "customer-only" | null;
  gateForm?: { id: string | number } | string | number | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  nextPage?: number | null;
  page: number;
  totalPages: number;
};

export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${cmsBaseUrl()}${url}`;
}

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

export async function getResources({
  page = 1,
  limit = 9,
  type,
  search,
}: {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
} = {}): Promise<PayloadListResponse<Resource>> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  if (type) params.set("where[type][equals]", type);
  if (search) params.set("where[title][contains]", search);
  return fetchCMS<PayloadListResponse<Resource>>(
    `/api/resources?${params.toString()}`,
  );
}

async function loadResourceBySlug(slug: string, draft = false): Promise<ResourceDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<ResourceDetail>>(
    `/api/resources?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=3&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getResourceBySlug = cache(
  async (slug: string): Promise<ResourceDetail | null> => loadResourceBySlug(slug, false),
);

/** Draft variant for the `/preview/resources/[slug]` route. Not cached. */
export async function getResourceBySlugDraft(slug: string): Promise<ResourceDetail | null> {
  return loadResourceBySlug(slug, true);
}

// Client-safe helpers live in `resources-utils.ts`. Re-exported here
// for backward compatibility with existing consumers.
export {
  RESOURCE_TYPES,
  resourceCoverPoster,
  resourceCtaLabel,
  resourceLeadCaptureHeading,
  resourceTypeLabel,
} from "./resources-utils";
