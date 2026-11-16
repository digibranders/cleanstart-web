import { GLANCE } from "./content";

export interface Dot {
  row: number;
  marked: boolean;
}

/** A grid of dots as columns, so each column can reveal on its own delay. */
export type DotColumns = readonly (readonly Dot[])[];

/** Small seeded generator: the same page renders the same picture on server and client. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lay out `cols` x `rows` dots and mark exactly `marked` of them, scattered by
 * a seeded shuffle so the marked ones read as a share of the whole and not as a
 * block in one corner.
 */
export function buildDotColumns(cols: number, rows: number, marked: number, seed: number): DotColumns {
  const total = cols * rows;
  if (marked < 0 || marked > total) {
    throw new RangeError(`Cannot mark ${marked} of ${total} dots`);
  }
  const order = Array.from({ length: total }, (_, index) => index);
  const random = mulberry32(seed);
  for (let i = total - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = order[i] as number;
    order[i] = order[j] as number;
    order[j] = swap;
  }
  const picked = new Set(order.slice(0, marked));
  return Array.from({ length: cols }, (_, col) =>
    Array.from({ length: rows }, (_, row) => ({ row, marked: picked.has(row * cols + col) })),
  );
}

const ESTATE_COLS = 59;
const ESTATE_ROWS = 20;
const ASSURANCE_COLS = 10;
const ASSURANCE_ROWS = 10;

/** One dot per open-source component in the average application; the aged share is hollow. */
export const ESTATE = {
  cols: ESTATE_COLS,
  rows: ESTATE_ROWS,
  aged: Math.round((ESTATE_COLS * ESTATE_ROWS * GLANCE.age.value) / 100),
  seed: 1180,
} as const;

/** One cell per hundred tested recommendations; the lit cells are the valid, clean ones. */
export const ASSURANCE = {
  cols: ASSURANCE_COLS,
  rows: ASSURANCE_ROWS,
  lit: Math.round((ASSURANCE_COLS * ASSURANCE_ROWS * GLANCE.ai.value) / 100),
  seed: 20,
} as const;
