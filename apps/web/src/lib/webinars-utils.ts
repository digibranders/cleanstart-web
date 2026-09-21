// Client-safe webinar helpers extracted from `lib/webinars.ts` so
// client components don't transitively pull `next/headers` via `cms-fetch`.

import type { WebinarRegion, WebinarType } from "./webinars";

export const REGION_LABEL: Record<WebinarRegion, string> = {
  "north-america": "North America",
  "asia-mea": "Asia & MEA",
  emea: "EMEA",
  global: "Global",
};

// Pre-migration safety: rows in the database may still hold PascalCase enum
// values until `payload migrate` is run for the rename. `regionLabel`
// normalizes either form so the UI never renders an empty cell.
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

export const FILTERABLE_TYPES: ReadonlyArray<WebinarType> = ["live", "on-demand"];
export const FILTERABLE_REGIONS: ReadonlyArray<WebinarRegion> = [
  "north-america",
  "asia-mea",
];

export function parseTypeParam(value: string | undefined): WebinarType | undefined {
  if (!value) return undefined;
  return FILTERABLE_TYPES.includes(value as WebinarType)
    ? (value as WebinarType)
    : undefined;
}

export function parseRegionParam(
  value: string | undefined,
): WebinarRegion | undefined {
  if (!value) return undefined;
  return FILTERABLE_REGIONS.includes(value as WebinarRegion)
    ? (value as WebinarRegion)
    : undefined;
}

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

/**
 * Types that describe a session held at a fixed time. Only `on-demand` is
 * already timeless, so it is the one type the date cannot override.
 */
const SCHEDULED_TYPES: ReadonlyArray<WebinarType> = ["live", "panel", "demo"];

/**
 * A scheduled webinar with no explicit `endsAt` stays "live" for the whole of
 * its start day — editors routinely save `startsAt` at midnight with no time,
 * so ending it at the start timestamp would retire it before it airs.
 */
const IMPLIED_DURATION_MS = 24 * 60 * 60 * 1000;

export type WebinarSchedule = {
  webinarType: WebinarType;
  startsAt?: string | null;
  endsAt?: string | null;
};

/** Epoch ms the session is over, or `null` when it has no usable date. */
function scheduleEndsAt(webinar: WebinarSchedule): number | null {
  if (webinar.endsAt) {
    const end = Date.parse(webinar.endsAt);
    if (!Number.isNaN(end)) return end;
  }
  if (webinar.startsAt) {
    const start = Date.parse(webinar.startsAt);
    if (!Number.isNaN(start)) return start + IMPLIED_DURATION_MS;
  }
  return null;
}

/** True once a scheduled webinar has finished. Dateless rows are never past. */
export function isWebinarPast(webinar: WebinarSchedule, now: number): boolean {
  if (!SCHEDULED_TYPES.includes(webinar.webinarType)) return false;
  const end = scheduleEndsAt(webinar);
  return end !== null && end <= now;
}

/**
 * The type the site presents, which the date decides. A `live` / `panel` /
 * `demo` webinar whose slot has passed is on-demand from that moment, so the
 * listing filter moves it without an editor touching the record.
 */
export function effectiveWebinarType(
  webinar: WebinarSchedule,
  now: number,
): WebinarType {
  return isWebinarPast(webinar, now) ? "on-demand" : webinar.webinarType;
}
