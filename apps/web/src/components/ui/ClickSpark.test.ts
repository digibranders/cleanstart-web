import { describe, expect, it } from "vitest";
import { ease } from "./ClickSpark";

describe("ease", () => {
  it("pins the endpoints for every easing", () => {
    for (const e of ["linear", "ease-in", "ease-out", "ease-in-out"] as const) {
      expect(ease(e, 0)).toBeCloseTo(0, 6);
      expect(ease(e, 1)).toBeCloseTo(1, 6);
    }
  });

  it("is linear for 'linear'", () => {
    expect(ease("linear", 0.25)).toBeCloseTo(0.25, 6);
    expect(ease("linear", 0.5)).toBeCloseTo(0.5, 6);
  });

  it("eases out fast-then-slow (above linear in the first half)", () => {
    expect(ease("ease-out", 0.25)).toBeGreaterThan(0.25);
    expect(ease("ease-out", 0.5)).toBeCloseTo(0.75, 6);
  });

  it("eases in slow-then-fast (below linear in the first half)", () => {
    expect(ease("ease-in", 0.25)).toBeLessThan(0.25);
    expect(ease("ease-in", 0.5)).toBeCloseTo(0.25, 6);
  });

  it("is symmetric for 'ease-in-out' about the midpoint", () => {
    expect(ease("ease-in-out", 0.5)).toBeCloseTo(0.5, 6);
    expect(ease("ease-in-out", 0.25) + ease("ease-in-out", 0.75)).toBeCloseTo(
      1,
      6,
    );
  });

  it("stays monotonic across the range", () => {
    for (const e of ["linear", "ease-in", "ease-out", "ease-in-out"] as const) {
      let prev = -1;
      for (let t = 0; t <= 1.0001; t += 0.1) {
        const v = ease(e, Math.min(t, 1));
        expect(v).toBeGreaterThanOrEqual(prev);
        prev = v;
      }
    }
  });
});
