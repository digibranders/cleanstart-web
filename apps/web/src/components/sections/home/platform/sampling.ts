/**
 * Turns a painted stencil into `count` points. The stencil is an RGBA image:
 * alpha says "inside the logo", and (optionally) luminance says how much of the
 * artwork a pixel is. With a luminance floor, dark backing is skipped and
 * brighter pixels get proportionally more points, which reads like a halftone
 * of the logo: the rim and the glyph stay sharp and the mid-tones thin out.
 * Each point keeps the colour of the pixel it came from.
 */

export interface SampleOptions {
  /** Skip pixels darker than this (0 to 255 luminance); also turns on brightness and outline weighting. */
  readonly minLuma?: number;
  /**
   * Weight points by brightness and outline so the rim and glyph are packed
   * a little tighter than flat fills. Pixels under `minLuma` (the dark glass
   * body) get no points at all, so only the clean, bright artwork is drawn.
   */
  readonly halftone?: boolean;
  /** Thin out the hexagonal rim: pixels beyond this fraction of the badge radius get `rimFactor` of the points. */
  readonly rimFrom?: number;
  readonly rimFactor?: number;
}

export type Sample = readonly [x: number, y: number, r: number, g: number, b: number];

type Point5 = [number, number, number, number, number];

const ALPHA_CUT = 140;
const OVERSAMPLE = 1.7;
const BRIGHT = 220;

function luma(data: Uint8ClampedArray, k: number): number {
  return 0.2126 * (data[k] as number) + 0.7152 * (data[k + 1] as number) + 0.0722 * (data[k + 2] as number);
}

/** Local contrast around a pixel, 0 to 1: high on the outlines of shapes. */
function edge(data: Uint8ClampedArray, size: number, k: number): number {
  const stride = size * 4;
  const x = (k / 4) % size;
  const y = Math.floor(k / 4 / size);
  if (x < 1 || y < 1 || x >= size - 1 || y >= size - 1) return 0;
  const gx = luma(data, k + 4) - luma(data, k - 4);
  const gy = luma(data, k + stride) - luma(data, k - stride);
  return Math.min(1, (Math.abs(gx) + Math.abs(gy)) / 160);
}

/** 0 at the centre, 1 on a pointy-top hexagon of the given circumradius. */
function hexNorm(k: number, size: number): number {
  const half = size / 2;
  const dx = Math.abs(((k / 4) % size) + 0.5 - half);
  const dy = Math.abs(Math.floor(k / 4 / size) + 0.5 - half);
  const apothem = (half * 0.8 * Math.sqrt(3)) / 2;
  return Math.max(dx / apothem, (dx * (Math.sqrt(3) / 2) + dy / 2) / apothem);
}

/** Chance that a pixel gets a point: 1 for an unweighted stencil. */
function weight(data: Uint8ClampedArray, size: number, k: number, o: SampleOptions): number {
  if ((data[k + 3] as number) <= ALPHA_CUT) return 0;
  const minLuma = o.minLuma ?? 0;
  if (o.halftone) {
    const l = luma(data, k);
    if (l <= minLuma) return 0;
    const bright = Math.min(1, l / BRIGHT) ** 1.2;
    return Math.min(1, 0.4 + 0.8 * bright + 1.0 * edge(data, size, k));
  }
  if (minLuma <= 0) return 1;
  const l = luma(data, k);
  if (l <= minLuma) return 0;
  const bright = Math.min(1, (l - minLuma) / (BRIGHT - minLuma)) ** 1.3;
  let w = Math.min(1, Math.max(0.5, 0.6 * bright + 1.2 * edge(data, size, k)));
  if (o.rimFrom !== undefined && hexNorm(k, size) > o.rimFrom) w *= o.rimFactor ?? 0.5;
  return w;
}

export function sampleAlpha(
  data: Uint8ClampedArray,
  size: number,
  count: number,
  rand: () => number,
  opts: SampleOptions = {},
): Sample[] {
  let area = 0;
  for (let i = 0; i < data.length; i += 4) if (weight(data, size, i, opts) > 0) area++;
  if (area === 0 || count <= 0) return [];

  const step = Math.max(1.1, Math.sqrt(area / (count * ((opts.minLuma ?? 0) > 0 || opts.halftone ? OVERSAMPLE : 1))));
  const jitter = step * 0.2;
  const pts: Point5[] = [];

  for (let pass = 0; pass < 4 && pts.length < count; pass++) {
    for (let y = step / 2; y < size; y += step) {
      for (let x = step / 2; x < size; x += step) {
        const jx = x + (rand() - 0.5) * jitter;
        const jy = y + (rand() - 0.5) * jitter;
        if (jx < 0 || jy < 0 || jx >= size || jy >= size) continue;
        const k = (Math.floor(jy) * size + Math.floor(jx)) * 4;
        const w = weight(data, size, k, opts);
        if (w <= 0 || rand() > w) continue;
        pts.push([jx, jy, data[k] as number, data[k + 1] as number, data[k + 2] as number]);
      }
    }
  }

  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = pts[i] as Point5;
    pts[i] = pts[j] as Point5;
    pts[j] = t;
  }
  while (pts.length < count && pts.length > 0) {
    const q = pts[Math.floor(rand() * pts.length)] as Point5;
    pts.push([q[0] + (rand() - 0.5) * step, q[1] + (rand() - 0.5) * step, q[2], q[3], q[4]]);
  }
  pts.length = count;
  return pts;
}
