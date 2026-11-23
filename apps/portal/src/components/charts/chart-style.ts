import { INK } from "./palette";

/** Mix a #RRGGBB colour with white. `t` of 0 is the colour, 1 is white. */
export function lighten(hex: string, t: number): string {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const [r = 0, g = 0, b = 0] = channels.map((c) => Math.round(c + (255 - c) * t));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function rgba(hex: string, alpha: number): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

/** A plain-object linear gradient: ECharts accepts it, and unlike its class it can cross from a server component to the client wrapper. */
export function gradient(from: string, to: string, direction: "down" | "right" = "down"): Record<string, unknown> {
  return {
    type: "linear",
    x: 0,
    y: 0,
    x2: direction === "right" ? 1 : 0,
    y2: direction === "down" ? 1 : 0,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to },
    ],
  };
}

/** Mix a #RRGGBB colour with black. `t` of 0 is the colour, 1 is black. */
export function darken(hex: string, t: number): string {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => Math.round(Number.parseInt(hex.slice(i, i + 2), 16) * (1 - t)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** Confident, flat geometry: the entity colour as a solid fill. Depth comes from shape and hierarchy, not effects. */
export function lifted(color: string, _direction: "down" | "right" = "down"): Record<string, unknown> {
  return { color };
}

/** Hover darkens the mark a step. No growth, no fade of the others. */
export function emphasisOf(color: string): Record<string, unknown> {
  return { focus: "none", itemStyle: { color: darken(color, 0.14) } };
}

export const AXIS_LABEL = { color: INK.muted, fontSize: 12, fontWeight: 500, margin: 12 } as const;
export const SPLIT_LINE = { show: true, lineStyle: { color: "#EAECF0", width: 1, type: "solid" } } as const;
export const NO_LINE = { show: false } as const;

/** A tooltip body prepared on the server so the client wrapper never needs the caller's number formatter. */
export interface TipRow {
  label: string;
  value: string;
  color?: string;
}
export interface Tip {
  title: string;
  rows: TipRow[];
}

/** A data point that carries its own formatted value (`f`), solid colour (`c`) and optional full tooltip. */
export interface Datum {
  value: number | readonly (number | string)[];
  f?: string;
  c?: string;
  tip?: Tip;
  [extra: string]: unknown;
}
