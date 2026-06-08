// Client-safe news helpers extracted from `lib/news.ts` so client
// components don't transitively pull `next/headers` via `cms-fetch`.

import type { NewsRegion, PressType } from "./news";

const PRESS_TYPE_LABEL: Record<PressType, string> = {
  "press-release": "Press Release",
  news: "News",
  announcement: "Announcement",
  feature: "Feature",
};

export function pressTypeLabel(value: PressType | null | undefined): string {
  return PRESS_TYPE_LABEL[value ?? "press-release"];
}

export const REGION_LABEL: Record<NewsRegion, string> = {
  "asia-pacific": "Asia Pacific",
  "europe-middle-east": "Europe & Middle East",
  "usa-north-america": "North America",
};

/** Regions offered in the filter sidebar, in display order. */
export const FILTERABLE_REGIONS: ReadonlyArray<NewsRegion> = [
  "asia-pacific",
  "europe-middle-east",
  "usa-north-america",
];

export function regionLabel(value: string | null | undefined): string {
  if (!value) return "";
  return REGION_LABEL[value as NewsRegion] ?? value;
}

export function parseRegionParam(
  value: string | undefined,
): NewsRegion | undefined {
  if (!value) return undefined;
  return FILTERABLE_REGIONS.includes(value as NewsRegion)
    ? (value as NewsRegion)
    : undefined;
}

/** Earliest year CleanStart has news for; the filter lists this → current year. */
const NEWS_FIRST_YEAR = 2025;

/**
 * Years offered in the filter sidebar, newest first. Computed at module
 * load so a new calendar year appears without a code change.
 */
export const FILTERABLE_YEARS: ReadonlyArray<number> = (() => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= NEWS_FIRST_YEAR; y -= 1) years.push(y);
  return years;
})();

export function parseYearParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value, 10);
  return FILTERABLE_YEARS.includes(year) ? year : undefined;
}

export function formatNewsDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
