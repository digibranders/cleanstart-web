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
