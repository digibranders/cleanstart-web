import { describe, expect, it } from "vitest";

import * as content from "./content";
import { ASSURANCE, buildDotColumns, ESTATE } from "./field";

const count = (columns: ReturnType<typeof buildDotColumns>, marked: boolean): number =>
  columns.flat().filter((dot) => dot.marked === marked).length;

const strings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
};

describe("dependency trust report pictures", () => {
  it("draws one dot per component in the average application, 68% of them aged", () => {
    expect(ESTATE.cols * ESTATE.rows).toBe(content.GLANCE.components.value);
    const columns = buildDotColumns(ESTATE.cols, ESTATE.rows, ESTATE.aged, ESTATE.seed);
    expect(count(columns, true)).toBe(ESTATE.aged);
    expect(ESTATE.aged / content.GLANCE.components.value).toBeCloseTo(content.GLANCE.age.value / 100, 2);
  });

  it("lights 20 of 100 cells for the AI recommendations", () => {
    const columns = buildDotColumns(ASSURANCE.cols, ASSURANCE.rows, ASSURANCE.lit, ASSURANCE.seed);
    expect(columns.flat()).toHaveLength(100);
    expect(count(columns, true)).toBe(content.GLANCE.ai.value);
  });

  it("is stable between renders and refuses an impossible share", () => {
    expect(buildDotColumns(5, 4, 7, 3)).toEqual(buildDotColumns(5, 4, 7, 3));
    expect(() => buildDotColumns(2, 2, 5, 1)).toThrow(RangeError);
  });

  it("keeps the bar figures in step with the caption", () => {
    const { from, to, caption } = content.GLANCE.vulnerabilities;
    expect(caption).toContain(`${from} to ${to}`);
    // 581 / 280 is a 107.5% rise; the report states it as 107%.
    const rise = ((to - from) / from) * 100;
    expect(Math.abs(rise - content.GLANCE.vulnerabilities.value)).toBeLessThanOrEqual(1);
  });

  it("highlights the closing words of the quote", () => {
    expect(content.VOICE.quote.endsWith(content.VOICE.highlight)).toBe(true);
  });

  it("has no em or en dashes in any visible string", () => {
    expect(strings(content).filter((text) => /[–—]/.test(text))).toEqual([]);
  });
});
