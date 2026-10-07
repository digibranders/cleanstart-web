import { describe, expect, it } from "vitest";
import { sampleAlpha } from "./sampling";

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** A bright ring (left half red, right half green) on a dark opaque disc. */
function badge(size: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(size * size * 4);
  const c = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - c, y + 0.5 - c);
      if (d > 56) continue;
      const k = (y * size + x) * 4;
      const ring = d > 40;
      const left = x < c;
      data[k] = ring ? (left ? 255 : 0) : 6;
      data[k + 1] = ring ? (left ? 0 : 255) : 10;
      data[k + 2] = ring ? 0 : 40;
      data[k + 3] = 255;
    }
  }
  return data;
}

describe("sampleAlpha", () => {
  const size = 128;
  const data = badge(size);

  it("returns exactly the requested number of points", () => {
    expect(sampleAlpha(data, size, 700, seeded(1))).toHaveLength(700);
    expect(sampleAlpha(data, size, 3000, seeded(2), { minLuma: 60 })).toHaveLength(3000);
  });

  it("with a luminance floor, skips the dark backing and keeps only the bright ring", () => {
    const c = size / 2;
    for (const [x, y] of sampleAlpha(data, size, 800, seeded(3), { minLuma: 60 })) {
      expect(Math.hypot(x - c, y - c)).toBeGreaterThan(40 - 3);
      expect(Math.hypot(x - c, y - c)).toBeLessThan(56 + 3);
    }
  });

  it("without a floor, fills the whole disc", () => {
    const c = size / 2;
    const pts = sampleAlpha(data, size, 1500, seeded(4));
    expect(pts.some(([x, y]) => Math.hypot(x - c, y - c) < 20)).toBe(true);
  });

  it("carries the colour of the source pixel", () => {
    const c = size / 2;
    for (const [x, , r, g] of sampleAlpha(data, size, 800, seeded(5), { minLuma: 60 })) {
      if (x < c - 4) expect(r).toBe(255);
      if (x > c + 4) expect(g).toBe(255);
    }
  });

  it("returns nothing for an empty stencil", () => {
    expect(sampleAlpha(new Uint8ClampedArray(size * size * 4), size, 100, seeded(6))).toEqual([]);
  });
});
