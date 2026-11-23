import { describe, expect, it } from "vitest";
import { barLayout, evenIndices, formatCompact, niceTicks, roundedBarPath, sliceAngles, topSlices } from "./geometry";

describe("sliceAngles", () => {
  it("covers the full circle in input order", () => {
    const a = sliceAngles([1, 1, 2]);
    expect(a[0]?.startAngle).toBe(0);
    expect(a[2]?.endAngle).toBeCloseTo(2 * Math.PI);
    expect((a[2]?.endAngle ?? 0) - (a[2]?.startAngle ?? 0)).toBeCloseTo(Math.PI);
    expect(a[1]?.startAngle).toBeCloseTo(a[0]?.endAngle ?? -1);
  });
});

describe("topSlices", () => {
  const items = ["a", "b", "c", "d", "e", "f", "g"].map((k, i) => ({ key: k, label: k, value: 10 - i }));
  it("folds the tail into Other and keeps the total", () => {
    const s = topSlices(items, 6);
    expect(s).toHaveLength(6);
    expect(s[5]).toMatchObject({ label: "Other", value: 5 + 4 });
    expect(s.reduce((n, i) => n + i.value, 0)).toBe(items.reduce((n, i) => n + i.value, 0));
  });
  it("leaves short lists alone and drops zeros", () => {
    expect(topSlices([{ key: "a", label: "a", value: 0 }, { key: "b", label: "b", value: 2 }])).toHaveLength(1);
  });
});

describe("niceTicks", () => {
  it("starts at 0 and ends at or above the max", () => {
    const t = niceTicks(87);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]).toBeGreaterThanOrEqual(87);
  });
  it("survives an all-zero series", () => {
    expect(niceTicks(0).length).toBeGreaterThan(1);
  });
});

describe("barLayout", () => {
  it("caps thickness at 24 and centres in the band", () => {
    const [first] = barLayout(2, 400);
    expect(first?.thickness).toBe(24);
    expect(first?.offset).toBeCloseTo((200 - 24) / 2);
  });
  it("shrinks to leave a 2px gap in a tight band", () => {
    expect(barLayout(10, 100)[0]?.thickness).toBe(8);
  });
  it("returns nothing for no bars", () => {
    expect(barLayout(0, 100)).toEqual([]);
  });
});

describe("roundedBarPath", () => {
  it("is empty for a zero-size bar", () => {
    expect(roundedBarPath(0, 0, 10, 0, "top")).toBe("");
  });
  it("rounds only the data end", () => {
    expect(roundedBarPath(0, 0, 10, 20, "top")).toContain("a4 4");
    expect(roundedBarPath(0, 0, 10, 20, "none")).not.toContain("a");
  });
});

describe("evenIndices and formatCompact", () => {
  it("includes first and last", () => {
    expect(evenIndices(12, 4)).toEqual([0, 4, 7, 11]);
    expect(evenIndices(3, 6)).toEqual([0, 1, 2]);
  });
  it("compacts", () => {
    expect(formatCompact(1284)).toBe("1,284");
    expect(formatCompact(12900)).toBe("12.9K");
    expect(formatCompact(4_200_000)).toBe("4.2M");
  });
});
