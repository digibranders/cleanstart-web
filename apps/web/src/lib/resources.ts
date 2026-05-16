// Resource Center data layer — mirrors the blog.ts pattern.
// All data flows from Payload CMS via the REST API.

import { cache } from "react";

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
  gated?: boolean;
  ctaButtonText?: string | null;
  asset?: ResourceImage | null;
};

export type ResourceDetail = Resource & {
  body?: import("./blog").LexicalRoot | null;
  heroImage?: ResourceImage | null;
  accessLevel?: "public" | "lead-gated" | "customer-only" | null;
  gateForm?: { id: string } | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  nextPage?: number | null;
  page: number;
  totalPages: number;
};

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export function mediaUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${CMS_URL}${url}`;
}

async function fetchCMS<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`CMS fetch failed: ${res.status} ${path}`);
  return res.json() as Promise<T>;
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

export const getResourceBySlug = cache(
  async (slug: string): Promise<ResourceDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<ResourceDetail>>(
      `/api/resources?where[slug][equals]=${encodeURIComponent(slug)}&${PUBLISHED_FILTER}&depth=3&limit=1`,
    );
    return data.docs[0] ?? null;
  },
);

/** Human-readable label for a resource type. */
export function resourceTypeLabel(type: ResourceType | null | undefined): string {
  switch (type) {
    case "whitepaper":
      return "Whitepaper";
    case "ebook":
      return "Ebook";
    case "datasheet":
      return "Datasheet";
    case "architecture-insights":
      return "Architecture Insights";
    case "report":
      return "Report";
    default:
      return "Resource";
  }
}

/** CTA copy for a resource card / download button. */
export function resourceCtaLabel(
  type: ResourceType | null | undefined,
  overrideText?: string | null,
): string {
  if (overrideText) return overrideText;
  switch (type) {
    case "whitepaper":
      return "Get the Whitepaper";
    case "ebook":
      return "Get the Ebook";
    case "datasheet":
      return "Get the Datasheet";
    case "architecture-insights":
      return "Read the Insights";
    case "report":
      return "Read the Report";
    default:
      return "Get the Resource";
  }
}

/** Mapped cover poster for a resource type. Used when the CMS has no per-resource cover image. */
export function resourceCoverPoster(
  type: ResourceType | null | undefined,
): string {
  switch (type) {
    case "ebook":
      return "/images/resource-center/cover-poster/ebook-cover.png";
    case "datasheet":
    case "report":
      return "/images/resource-center/cover-poster/datasheet-report.png";
    case "whitepaper":
      return "/images/resource-center/cover-poster/datasheet-cover.png";
    default:
      return "/images/resource-center/cover-poster/architecture-insights.png";
  }
}

/** "Get the Complete [Type]" label for detail page lead-capture heading. */
export function resourceLeadCaptureHeading(
  type: ResourceType | null | undefined,
): string {
  switch (type) {
    case "whitepaper":
      return "Get the Complete Whitepaper";
    case "ebook":
      return "Get the Complete Ebook";
    case "datasheet":
      return "Get the Complete Datasheet";
    case "architecture-insights":
      return "Read the Full Insights";
    case "report":
      return "Get the Complete Report";
    default:
      return "Get the Complete Resource";
  }
}

/** All filterable types in sidebar order, matching the live site. */
export const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: "whitepaper", label: "Whitepaper" },
  { value: "ebook", label: "Ebook" },
  { value: "datasheet", label: "Datasheet" },
  { value: "architecture-insights", label: "Architecture Insights" },
  { value: "report", label: "Report" },
];
