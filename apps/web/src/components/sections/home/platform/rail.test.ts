import { describe, expect, it } from "vitest";
import { pointAt, polyPath, railCommands, toPathD, toPoints, RAIL_H, type RailIndex } from "./rail";

const INDEXES: readonly RailIndex[] = [0, 1, 2];

describe("rail geometry", () => {
  it("starts at the card centre and ends at the node on the bar", () => {
    for (const i of INDEXES) {
      const pts = toPoints(railCommands(i));
      const first = pts[0] as readonly [number, number];
      const last = pts[pts.length - 1] as readonly [number, number];
      expect(first[1]).toBe(0);
      expect(last[0]).toBeCloseTo(500, 5);
      expect(last[1]).toBe(RAIL_H);
    }
  });

  it("keeps the middle wire straight", () => {
    expect(toPathD(railCommands(1))).toBe("M500 0V100");
  });

  it("builds mirrored left and right wires", () => {
    const left = toPoints(railCommands(0));
    const right = toPoints(railCommands(2));
    expect(left.length).toBe(right.length);
    left.forEach((p, k) => {
      const q = right[k] as readonly [number, number];
      expect(p[0] + q[0]).toBeCloseTo(1000, 2);
      expect(p[1]).toBeCloseTo(q[1], 5);
    });
  });

  it("emits a path string with a curve for the outer wires", () => {
    expect(toPathD(railCommands(0))).toContain("Q");
    expect(toPathD(railCommands(0)).startsWith("M158.333 0")).toBe(true);
  });

  it("interpolates by arc length", () => {
    const path = polyPath(toPoints(railCommands(1)));
    expect(pointAt(path, 0)).toEqual([500, 0]);
    expect(pointAt(path, 1)).toEqual([500, 100]);
    const mid = pointAt(path, 0.5);
    expect(mid[1]).toBeCloseTo(50, 5);
    expect(pointAt(path, 2)).toEqual([500, 100]);
    expect(pointAt(path, -1)).toEqual([500, 0]);
  });
});
