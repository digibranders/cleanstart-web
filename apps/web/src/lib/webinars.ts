import { cache } from "react";
import type { BlogImage, LexicalRoot } from "@/lib/blog";

export type WebinarImage = BlogImage;

export type WebinarType = "live" | "on-demand" | "panel" | "demo";
export type WebinarRegion = "north-america" | "asia-mea" | "emea" | "global";
export type WebinarEventStatus = "scheduled" | "postponed" | "cancelled";
export type WebinarRegistrationMode = "internal" | "external";

export type Webinar = {
  id: string;
  title: string;
  slug: string;
  abstract?: string | null;
  heroImage?: WebinarImage | null;
  webinarType: WebinarType;
  region: WebinarRegion;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  registrationMode: WebinarRegistrationMode;
  registrationUrl?: string | null;
  registrationForm?: { id: string; title?: string } | string | null;
  eventStatus: WebinarEventStatus;
  publishedAt?: string | null;
};

export type WebinarDetail = Webinar & {
  body?: LexicalRoot | null;
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

export type WebinarsListResponse = PayloadListResponse<Webinar>;

export const REGION_LABEL: Record<WebinarRegion, string> = {
  "north-america": "North America",
  "asia-mea": "Asia & MEA",
  emea: "EMEA",
  global: "Global",
};

// Pre-migration safety: rows in the database may still hold PascalCase enum
// values until `payload migrate` is run for `20260515_100240_rename_webinars_region`.
// `regionLabel` normalizes either form so the UI never renders an empty cell.
const LEGACY_REGION_LABEL: Record<string, string> = {
  Americas: "North America",
  APAC: "Asia & MEA",
  EMEA: "EMEA",
  Global: "Global",
};

export function regionLabel(value: string | null | undefined): string {
  if (!value) return "";
  if (value in REGION_LABEL) return REGION_LABEL[value as WebinarRegion];
  return LEGACY_REGION_LABEL[value] ?? value;
}

export const WEBINAR_TYPE_LABEL: Record<WebinarType, string> = {
  live: "Live",
  "on-demand": "On-demand",
  panel: "Panel",
  demo: "Demo",
};

/** Filters shown in the sidebar — only a subset of the enum. */
export const FILTERABLE_TYPES: ReadonlyArray<WebinarType> = ["live", "on-demand"];
export const FILTERABLE_REGIONS: ReadonlyArray<WebinarRegion> = [
  "north-america",
  "asia-mea",
];

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

export interface WebinarListParams {
  page?: number;
  limit?: number;
  type?: WebinarType;
  region?: WebinarRegion;
}

export async function getWebinars({
  page = 1,
  limit = 12,
  type,
  region,
}: WebinarListParams = {}): Promise<WebinarsListResponse> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[eventStatus][not_equals]": "cancelled",
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-startsAt",
  });
  if (type) params.set("where[webinarType][equals]", type);
  if (region) params.set("where[region][equals]", region);
  return fetchCMS<WebinarsListResponse>(`/api/webinars?${params.toString()}`);
}

export const getWebinarBySlug = cache(
  async (slug: string): Promise<WebinarDetail | null> => {
    const params = new URLSearchParams({
      "where[slug][equals]": slug,
      "where[_status][equals]": "published",
      "where[publishedAt][exists]": "true",
      depth: "3",
      limit: "1",
    });
    const data = await fetchCMS<PayloadListResponse<WebinarDetail>>(
      `/api/webinars?${params.toString()}`,
    );
    return data.docs[0] ?? null;
  },
);

export function formatWebinarDate(
  iso: string | null | undefined,
  timezone: string | null | undefined,
): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: timezone ?? "UTC",
    }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(iso));
  }
}

export function parseTypeParam(value: string | undefined): WebinarType | undefined {
  if (!value) return undefined;
  return (FILTERABLE_TYPES as ReadonlyArray<string>).includes(value)
    ? (value as WebinarType)
    : undefined;
}

export function parseRegionParam(
  value: string | undefined,
): WebinarRegion | undefined {
  if (!value) return undefined;
  return (FILTERABLE_REGIONS as ReadonlyArray<string>).includes(value)
    ? (value as WebinarRegion)
    : undefined;
}
