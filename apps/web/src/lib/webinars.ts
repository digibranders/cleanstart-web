import { cache } from "react";
import type { BlogImage, LexicalRoot } from "@/lib/blog";

import { fetchCMS } from "./cms-fetch";

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
  displayPublishedAt?: string | null;
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

// Client-safe helpers live in `webinars-utils.ts`. Re-exported for backward compat.
export {
  FILTERABLE_REGIONS,
  FILTERABLE_TYPES,
  REGION_LABEL,
  WEBINAR_TYPE_LABEL,
  formatWebinarDate,
  parseRegionParam,
  parseTypeParam,
  regionLabel,
} from "./webinars-utils";


export interface WebinarListParams {
  page?: number;
  limit?: number;
  type?: WebinarType;
  region?: WebinarRegion;
}

export async function getWebinars({
  page = 1,
  limit = 9,
  type,
  region,
}: WebinarListParams = {}): Promise<WebinarsListResponse> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[eventStatus][not_equals]": "cancelled",
    // depth=1 hydrates heroImage (all a card reads). depth=2 with no select
    // pulled every webinar's full Lexical `body` (a detail-only scalar),
    // ballooning the limit=1000 listing response past Next's 2 MB data-cache
    // ceiling so it was never cached — re-fetched on every regeneration.
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-startsAt",
  });
  // Whitelist the `Webinar` (list) field surface so the response excludes the
  // detail-only `body`. `registrationForm` (a relationship) is not read by the
  // card — only `registrationUrl` is — so it's intentionally omitted.
  for (const field of [
    "title",
    "slug",
    "abstract",
    "heroImage",
    "webinarType",
    "region",
    "startsAt",
    "endsAt",
    "timezone",
    "registrationMode",
    "registrationUrl",
    "eventStatus",
    "publishedAt",
    "displayPublishedAt",
  ]) {
    params.set(`select[${field}]`, "true");
  }
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

