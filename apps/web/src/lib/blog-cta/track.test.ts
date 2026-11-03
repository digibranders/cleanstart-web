import { describe, expect, it } from "vitest";

import { ctaEventName, ctaPagePath } from "./track";

describe("ctaEventName", () => {
  it("keeps the blog names GA4 already reports", () => {
    expect(ctaEventName({ surface: "blog", layout: "ladder", placement: "rail", stage: "learn" })).toBe(
      "blog_ladder_rail_learn",
    );
    expect(ctaEventName({ layout: "ladder", placement: "bar", stage: "explore", action: "copy" })).toBe(
      "blog_ladder_bar_explore_copy",
    );
  });

  it("prefixes advisory clicks with the advisory surface", () => {
    expect(ctaEventName({ surface: "advisory", layout: "ladder", placement: "rail", stage: "prove" })).toBe(
      "advisory_ladder_rail_prove",
    );
  });
});

describe("ctaPagePath", () => {
  it("points at the page the CTA sat on", () => {
    expect(ctaPagePath("blog", "redis-image")).toBe("/blogs/redis-image");
    expect(ctaPagePath("advisory", "cve-2026-1")).toBe("/advisories/cve-2026-1");
  });
});
