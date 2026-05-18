import { cache } from "react";
import type { BlogImage, LexicalRoot } from "@/lib/blog";

export type EventImage = BlogImage;

export type EventStatus = "scheduled" | "postponed" | "cancelled";
export type RegistrationMode = "internal" | "external";

export type Event = {
  id: string;
  title: string;
  slug: string;
  venue: string;
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

export async function getPastEvents({
  page = 1,
  limit = 9,
}: { page?: number; limit?: number } = {}): Promise<EventsListResponse> {
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
  return fetchCMS<EventsListResponse>(`/api/events?${params.toString()}`);
}

export const getEventBySlug = cache(
  async (slug: string): Promise<EventDetail | null> => {
    const data = await fetchCMS<PayloadListResponse<EventDetail>>(
      `/api/events?where[slug][equals]=${encodeURIComponent(slug)}&${PUBLISHED_FILTER}&depth=3&limit=1`,
    );
    return data.docs[0] ?? null;
  },
);

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
