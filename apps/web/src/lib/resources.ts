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

/** All published resource slugs, for `generateStaticParams` (scalar-only query). */
export async function getResourceSlugs(): Promise<string[]> {
  const res = await fetchCMS<PayloadListResponse<{ slug: string }>>(
    `/api/resources?${PUBLISHED_FILTER}&depth=0&limit=1000&select[slug]=true`,
  );
  return res.docs.map((d) => d.slug).filter((s): s is string => Boolean(s));
}

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
    // depth=1 + a card-field whitelist. depth=2 with no projection pulled every
    // resource's full Lexical `body` across the whole (limit=1000) card set,
    // blowing past Next's 2 MB data-cache ceiling so the listing was never
    // cached and re-hit the CMS on every render. The card reads only these
    // fields.
    //
    // `asset` is deliberately absent. No card reads it, and selecting it
    // serialised every resource's file URL into the client payload, which
    // published the direct link to gated downloads on every page that lists
    // resources.
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-publishedAt",
  });
  for (const field of [
    "title",
    "slug",
    "type",
    "summary",
    "publishedAt",
    "displayPublishedAt",
    "updatedAt",
    "gated",
    "ctaButtonText",
    "seo",
  ]) {
    params.set(`select[${field}]`, "true");
  }
  if (type) params.set("where[type][equals]", type);
  if (search) params.set("where[title][contains]", search);
  return fetchCMS<PayloadListResponse<Resource>>(
    `/api/resources?${params.toString()}`,
  );
}

/**
 * Fetch a fixed set of resources by slug, for hand-curated rails (e.g. the
 * /case-studies "keep reading" row). Returns only the slugs that are still
 * published, in the order they were requested, so a card whose resource is
 * unpublished disappears instead of linking into a 404.
 */
export async function getResourcesBySlugs(slugs: readonly string[]): Promise<Resource[]> {
  if (slugs.length === 0) return [];
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[slug][in]": slugs.join(","),
    depth: "0",
    limit: String(slugs.length),
  });
  for (const field of ["title", "slug", "type", "summary", "gated", "ctaButtonText"]) {
    params.set(`select[${field}]`, "true");
  }
  const data = await fetchCMS<PayloadListResponse<Resource>>(
    `/api/resources?${params.toString()}`,
  );
  const bySlug = new Map(data.docs.map((doc) => [doc.slug, doc]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((doc): doc is Resource => doc !== undefined);
}

async function loadResourceBySlug(slug: string, draft = false): Promise<ResourceDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<ResourceDetail>>(
    `/api/resources?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=1&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getResourceBySlug = cache(
  async (slug: string): Promise<ResourceDetail | null> => loadResourceBySlug(slug, false),
);

/** Draft variant for the `/preview/resources/[slug]` route. Not cached. */
export async function getResourceBySlugDraft(slug: string): Promise<ResourceDetail | null> {
  const draftDoc = await loadResourceBySlug(slug, true);
  if (draftDoc) return draftDoc;
  return loadResourceBySlug(slug, false);
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
