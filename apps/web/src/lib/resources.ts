// Resource Center data layer — mirrors the blog.ts pattern.
// All data flows from Payload CMS via the REST API.

export type ResourceType =
  | "whitepaper"
  | "report"
  | "brief"
  | "datasheet"
  | "case-study";

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

export async function getResourceBySlug(
  slug: string,
): Promise<ResourceDetail | null> {
  const data = await fetchCMS<PayloadListResponse<ResourceDetail>>(
    `/api/resources?where[slug][equals]=${encodeURIComponent(slug)}&${PUBLISHED_FILTER}&depth=3&limit=1`,
  );
  return data.docs[0] ?? null;
}

/** Human-readable label for a resource type. */
export function resourceTypeLabel(type: ResourceType | null | undefined): string {
  switch (type) {
    case "whitepaper":
      return "Whitepaper";
    case "report":
      return "Report";
    case "brief":
      return "Brief";
    case "datasheet":
      return "Datasheet";
    case "case-study":
      return "Case Study";
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
    case "report":
      return "Read the Report";
    case "brief":
      return "Get the Brief";
    case "datasheet":
      return "Get the Datasheet";
    case "case-study":
      return "Read the Case Study";
    default:
      return "Get the Resource";
  }
}

/** "Get the Complete [Type]" label for detail page lead-capture heading. */
export function resourceLeadCaptureHeading(
  type: ResourceType | null | undefined,
): string {
  switch (type) {
    case "whitepaper":
      return "Get the Complete Whitepaper";
    case "report":
      return "Get the Complete Report";
    case "brief":
      return "Get the Complete Brief";
    case "datasheet":
      return "Get the Complete Datasheet";
    case "case-study":
      return "Read the Full Case Study";
    default:
      return "Get the Complete Resource";
  }
}

/** All filterable types in sidebar order, matching Figma. */
export const RESOURCE_TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: "whitepaper", label: "Whitepaper" },
  { value: "report", label: "Report" },
  { value: "brief", label: "Brief" },
  { value: "datasheet", label: "Datasheet" },
  { value: "case-study", label: "Case Study" },
];
