/**
 * Chart palette. Colour follows the entity, never its rank.
 *
 * Validator (dataviz validate_palette.js, --mode light, surface #FFFFFF, the white .card surface), categorical order below:
 *   Lightness band PASS, chroma floor PASS, CVD separation PASS (worst adjacent #1F5BD6 to #0E8FB3, deutan dE 14.6, tritan 9.4),
 *   normal-vision floor PASS (worst adjacent dE 16.1), contrast vs surface WARN: #E87BA4 is 2.69:1.
 * The WARN is not dismissable: pink (slot 5) obliges visible labels or the table view. Every chart has the "View as table" toggle
 * and a legend, and marks carry aria-labels, so the relief channel is always present. Slots 1, 3 and 4 are the three product colours
 * (copied from .pm-img, .pm-sight, .pm-lib in portal.css) with orange between them to separate the two blues.
 * Light mode only: the portal has no dark theme. Re-run the validator if a slot changes.
 */
export const CATEGORICAL = ["#5B2FE2", "#EB6834", "#0E8FB3", "#1F5BD6", "#E87BA4", "#008300"] as const;

/** Product identity. Matches the product chips (components/ui/badge.tsx, .pm-* in portal.css). */
export const PRODUCT_COLOR = {
  "CleanStart Images": "#5B2FE2",
  "Clean Libraries": "#1F5BD6",
  CleanSight: "#0E8FB3",
  "All products": "#6E6B80",
} as const;

/** Status colours are reserved for state and never used as "series 4". Same hues as the status dots (.d-*) in portal.css. */
export const STATUS_COLOR = {
  pending: "#D98A00",
  accepted: "#22A05A",
  rejected: "#D23B3B",
  won: "#2B3CA8",
  lost: "#8F8CA0",
  expired: "#B4B2C0",
} as const;

/** One hue, light to dark, around the portal violet #4B23C8. Magnitude and ordered stages only. */
export const VIOLET_RAMP = ["#F1EEFB", "#D9CFF7", "#B7A3F0", "#8A66EA", "#5B2FE2", "#4B23C8", "#2F1590"] as const;

/** Chart chrome. Same values as the portal's own greys. */
export const INK = { primary: "#0F0E17", secondary: "#5E5B6E", muted: "#6B687D" } as const;
export const SURFACE = "#FFFFFF";
export const GRID = "#ECEBF1";
export const MUTED_MARK = "#B4B2C0";
export const TRACK = "#F1EEFB";
export const ACCENT = "#4B23C8";

export function categorical(index: number): string {
  return CATEGORICAL[index % CATEGORICAL.length] ?? CATEGORICAL[0];
}

/** Step of the violet ramp for a 0 to 1 position. */
export function violetAt(t: number): string {
  const i = Math.round(Math.min(1, Math.max(0, t)) * (VIOLET_RAMP.length - 1));
  return VIOLET_RAMP[i] ?? VIOLET_RAMP[0];
}
