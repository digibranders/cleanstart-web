import { describe, expect, it } from "vitest";

import * as content from "./content";

const strings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
};

describe("State of Software Dependency Trust landing content", () => {
  it("has no em or en dashes in any visible string", () => {
    const offenders = strings(content).filter((text) => /[–—]/.test(text));
    expect(offenders).toEqual([]);
  });

  it("states the five headline figures exactly as the report does", () => {
    const { stats } = content.GLANCE;
    expect([
      stats.vulnerabilities.value,
      stats.components.value,
      stats.age.value,
      stats.malicious.value,
      stats.ai.value,
    ]).toEqual([107, 1180, 68, 454648, 20]);
    expect(stats.vulnerabilities.caption).toContain("280 to 581");
  });

  it("keeps the five findings numbered 01 to 05 in order", () => {
    expect(content.FINDINGS.items.map((item) => item.number)).toEqual(["01", "02", "03", "04", "05"]);
  });
});
