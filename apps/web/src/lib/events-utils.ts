// Client-safe event helpers extracted so client components (the filter
// sidebar) don't transitively pull `next/headers` via `cms-fetch`.

import type { EventCountry } from "./events";

export const COUNTRY_LABEL: Record<EventCountry, string> = {
  india: "India",
  "united-states": "United States",
  uae: "United Arab Emirates",
  thailand: "Thailand",
};

/** Countries offered in the filter sidebar, in display order. */
export const FILTERABLE_COUNTRIES: ReadonlyArray<EventCountry> = [
  "india",
  "united-states",
  "uae",
  "thailand",
];

export function countryLabel(value: string | null | undefined): string {
  if (!value) return "";
  return COUNTRY_LABEL[value as EventCountry] ?? value;
}

export function parseCountryParam(
  value: string | undefined,
): EventCountry | undefined {
  if (!value) return undefined;
  return FILTERABLE_COUNTRIES.includes(value as EventCountry)
    ? (value as EventCountry)
    : undefined;
}

/** Earliest year CleanStart has events for; the filter lists this → current year. */
const EVENTS_FIRST_YEAR = 2024;

/**
 * Years offered in the filter sidebar, newest first. Computed at module
 * load so a new calendar year appears without a code change. The past-
 * events list never contains a future year, so capping at the current
 * year is correct.
 */
export const FILTERABLE_YEARS: ReadonlyArray<number> = (() => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= EVENTS_FIRST_YEAR; y -= 1) years.push(y);
  return years;
})();

export function parseYearParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const year = Number.parseInt(value, 10);
  return FILTERABLE_YEARS.includes(year) ? year : undefined;
}
