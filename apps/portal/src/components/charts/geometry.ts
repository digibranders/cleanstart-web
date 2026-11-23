import { max as d3max } from "d3-array";
import { scaleLinear } from "d3-scale";
import { pie } from "d3-shape";

export interface Slice {
  key: string;
  label: string;
  value: number;
  color?: string;
}

/** Keep the largest `limit` slices and fold the rest into one "Other". Zero and negative values are dropped. */
export function topSlices(items: readonly Slice[], limit = 6): Slice[] {
  const kept = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  if (kept.length <= limit) return kept;
  const head = kept.slice(0, limit - 1);
  const rest = kept.slice(limit - 1).reduce((sum, i) => sum + i.value, 0);
  return [...head, { key: "other", label: "Other", value: rest }];
}

export interface SliceAngle {
  startAngle: number;
  endAngle: number;
}

/** Start and end angle in radians for each value, clockwise from 12 o'clock, in input order. */
export function sliceAngles(values: readonly number[]): SliceAngle[] {
  return pie<number>()
    .sort(null)
    .value((v) => v)([...values])
    .map(({ startAngle, endAngle }) => ({ startAngle, endAngle }));
}

/** Round tick values from 0 to a nice maximum at or above `maxValue`. */
export function niceTicks(maxValue: number, count = 4): number[] {
  const top = maxValue > 0 ? maxValue : 1;
  return scaleLinear().domain([0, top]).nice(count).ticks(count);
}

export function niceMax(maxValue: number, count = 4): number {
  const ticks = niceTicks(maxValue, count);
  return ticks[ticks.length - 1] ?? 1;
}

export interface BandBar {
  /** Offset of the bar from the start of its band. */
  offset: number;
  thickness: number;
}

/** Bars centred in `count` equal bands across `size`. Thickness is capped (default 24) so leftover band is air, never fill. */
export function barLayout(count: number, size: number, maxThickness = 24, minGap = 2): BandBar[] {
  if (count <= 0) return [];
  const band = size / count;
  const thickness = Math.max(1, Math.min(maxThickness, band - minGap));
  return Array.from({ length: count }, (_, i) => ({ offset: i * band + (band - thickness) / 2, thickness }));
}

/** Rounded data end (4px by default), square at the baseline. */
export function roundedBarPath(
  x: number,
  y: number,
  w: number,
  h: number,
  end: "top" | "right" | "none",
  radius = 4,
): string {
  if (w <= 0 || h <= 0) return "";
  if (end === "none") return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  if (end === "top") {
    const r = Math.min(radius, w / 2, h);
    return `M${x} ${y + h}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h}Z`;
  }
  const r = Math.min(radius, h / 2, w);
  return `M${x} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}H${x}Z`;
}

/** Up to `count` evenly spaced indices (always including first and last) for axis labels. */
export function evenIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  const out = new Set<number>();
  for (let i = 0; i < count; i++) out.add(Math.round((i * (length - 1)) / (count - 1)));
  return [...out];
}

export function maxOf(values: readonly number[]): number {
  return d3max(values) ?? 0;
}

function trim(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/** Compact number: 1,284 / 12.9K / 4.2M. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${trim(value / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(value / 1_000)}K`;
  return trim(value);
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
