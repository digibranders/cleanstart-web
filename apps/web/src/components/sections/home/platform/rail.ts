/**
 * Geometry of the connector "rail" between the three product cards and the
 * Intelligence Center bar. One definition feeds both the server-rendered SVG
 * (path strings) and the canvas engine (polylines), so the two can never drift.
 *
 * Coordinates live in a 1000 x 100 box that the SVG stretches over the rail
 * element. The three cards share the row equally with a 2.5% gap, so their
 * centres sit at 15.83%, 50% and 84.17% of the row width.
 */

export type Point = readonly [x: number, y: number];

export type RailCmd =
  | readonly ["M", number, number]
  | readonly ["V", number]
  | readonly ["H", number]
  | readonly ["Q", number, number, number, number];

export const RAIL_W = 1000;
export const RAIL_H = 100;
export const RAIL_CARD_GAP_PCT = 2.5;

const COL_CENTRES: readonly [number, number, number] = [158.333, 500, 841.667];
const BEND_Y = 70;
const BEND_R = 20;

export type RailIndex = 0 | 1 | 2;

export function railCommands(index: RailIndex): readonly RailCmd[] {
  const cx = COL_CENTRES[index];
  if (index === 1) return [["M", cx, 0], ["V", RAIL_H]];
  const dir = index === 0 ? 1 : -1;
  const mid = COL_CENTRES[1];
  return [
    ["M", cx, 0],
    ["V", BEND_Y - BEND_R],
    ["Q", cx, BEND_Y, cx + dir * BEND_R, BEND_Y],
    ["H", mid - dir * BEND_R],
    ["Q", mid, BEND_Y, mid, BEND_Y + BEND_R],
    ["V", RAIL_H],
  ];
}

export function toPathD(cmds: readonly RailCmd[]): string {
  return cmds
    .map((c) => {
      switch (c[0]) {
        case "M":
          return `M${c[1]} ${c[2]}`;
        case "V":
          return `V${c[1]}`;
        case "H":
          return `H${c[1]}`;
        case "Q":
          return `Q${c[1]} ${c[2]} ${c[3]} ${c[4]}`;
      }
    })
    .join("");
}

/** Flatten commands into a polyline; curves are sampled in `steps` segments. */
export function toPoints(cmds: readonly RailCmd[], steps = 8): Point[] {
  const out: Point[] = [];
  let x = 0;
  let y = 0;
  for (const c of cmds) {
    switch (c[0]) {
      case "M":
        x = c[1];
        y = c[2];
        out.push([x, y]);
        break;
      case "V":
        y = c[1];
        out.push([x, y]);
        break;
      case "H":
        x = c[1];
        out.push([x, y]);
        break;
      case "Q": {
        const [, qx, qy, ex, ey] = c;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const u = 1 - t;
          out.push([u * u * x + 2 * u * t * qx + t * t * ex, u * u * y + 2 * u * t * qy + t * t * ey]);
        }
        x = ex;
        y = ey;
        break;
      }
    }
  }
  return out;
}

export interface PolyPath {
  readonly pts: readonly Point[];
  readonly cum: readonly number[];
  readonly total: number;
}

export function polyPath(pts: readonly Point[]): PolyPath {
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1] as Point;
    const b = pts[i] as Point;
    cum.push((cum[i - 1] as number) + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, cum, total: (cum[cum.length - 1] as number) || 1 };
}

/** Position at fraction `s` (0 to 1) of the path's length. */
export function pointAt(path: PolyPath, s: number): Point {
  const d = Math.max(0, Math.min(1, s)) * path.total;
  let lo = 0;
  let hi = path.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((path.cum[mid] as number) < d) lo = mid;
    else hi = mid;
  }
  const a = path.pts[lo] as Point;
  const b = path.pts[hi] as Point;
  const seg = (path.cum[hi] as number) - (path.cum[lo] as number) || 1;
  const f = (d - (path.cum[lo] as number)) / seg;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}
