import { cache } from "react";
import type { BlogImage, LexicalRoot } from "@/lib/blog";
import type { CmsSeo } from "@/lib/seo/cms-seo";

import { fetchCMS } from "./cms-fetch";

export type EventImage = BlogImage;

export type EventStatus = "scheduled" | "postponed" | "cancelled";
export type RegistrationMode = "internal" | "external";
export type EventCountry = "india" | "united-states" | "uae" | "thailand";

export type Event = {
  id: string;
  title: string;
  slug: string;
  venue: string;
  country?: EventCountry | null;
  abstract?: string | null;
  heroImage?: EventImage | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  customDateLabel?: string | null;
  registrationMode: RegistrationMode;
  registrationUrl?: string | null;
  registrationForm?: { id: string; title?: string } | string | null;
  attendeesCap?: number | null;
  ctaLabel?: string | null;
  postEventCta?: {
    enabled?: boolean | null;
    label?: string | null;
    url?: string | null;
  } | null;
  eventStatus: EventStatus;
  cancelledAt?: string | null;
  previousStartDate?: string | null;
  publishedAt?: string | null;
  seo?: CmsSeo | null;
};

export type EventDetail = Event & {
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

export type EventsListResponse = PayloadListResponse<Event>;

// Client-safe helpers live in `events-utils.ts`. Re-exported for convenience.
export {
  COUNTRY_LABEL,
  FILTERABLE_COUNTRIES,
  FILTERABLE_YEARS,
  countryLabel,
  parseCountryParam,
  parseYearParam,
} from "./events-utils";

const PUBLISHED_FILTER =
  "where[_status][equals]=published&where[publishedAt][exists]=true";

export async function getUpcomingEvents({
  limit = 1,
}: { limit?: number } = {}): Promise<EventsListResponse> {
  const nowIso = new Date().toISOString();
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[startsAt][greater_than]": nowIso,
    "where[eventStatus][not_equals]": "cancelled",
    depth: "2",
    limit: String(limit),
    sort: "startsAt",
  });
  return fetchCMS<EventsListResponse>(`/api/events?${params.toString()}`);
}

export interface PastEventsParams {
  page?: number;
  limit?: number;
  country?: EventCountry;
  year?: number;
}

export async function getPastEvents({
  page = 1,
  limit = 9,
  country,
  year,
}: PastEventsParams = {}): Promise<EventsListResponse> {
  const nowIso = new Date().toISOString();
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[publishedAt][exists]": "true",
    "where[startsAt][less_than_equal]": nowIso,
    depth: "2",
    limit: String(limit),
    page: String(page),
    sort: "-startsAt",
  });
  if (country) params.set("where[country][equals]", country);
  if (year) {
    // Year window intersects the existing `<= now` past-events constraint,
    // so the current year correctly yields only events up to today.
    params.set("where[startsAt][greater_than_equal]", `${year}-01-01T00:00:00.000Z`);
    params.set("where[startsAt][less_than]", `${year + 1}-01-01T00:00:00.000Z`);
  }
  return fetchCMS<EventsListResponse>(`/api/events?${params.toString()}`);
}

async function loadEventBySlug(slug: string, draft = false): Promise<EventDetail | null> {
  const filter = draft ? "" : `&${PUBLISHED_FILTER}`;
  const data = await fetchCMS<PayloadListResponse<EventDetail>>(
    `/api/events?where[slug][equals]=${encodeURIComponent(slug)}${filter}&depth=3&limit=1`,
    { draft },
  );
  return data.docs[0] ?? null;
}

export const getEventBySlug = cache(
  async (slug: string): Promise<EventDetail | null> => loadEventBySlug(slug, false),
);

/** Draft variant for the `/preview/events/[slug]` route. Not cached. */
export async function getEventBySlugDraft(slug: string): Promise<EventDetail | null> {
  return loadEventBySlug(slug, true);
}

type FormatStyle = "long" | "short";

function intlDate(iso: string, timezone: string, style: FormatStyle): string {
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { day: "numeric", month: "long", year: "numeric", timeZone: timezone }
      : { day: "2-digit", month: "short", year: "numeric", timeZone: timezone };
  try {
    return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(
      new Date(iso),
    );
  }
}

export function formatEventDate(
  iso: string | null | undefined,
  timezone: string | null | undefined,
  customDateLabel: string | null | undefined,
  style: FormatStyle = "long",
): string {
  if (customDateLabel && customDateLabel.trim().length > 0) return customDateLabel;
  if (!iso) return "";
  return intlDate(iso, timezone ?? "UTC", style);
}
