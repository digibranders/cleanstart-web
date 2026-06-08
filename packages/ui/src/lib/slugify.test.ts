import { describe, expect, it } from "vitest";

import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphen-separates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics via NFKD normalisation", () => {
    expect(slugify("Café Münchën")).toBe("cafe-munchen");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugify("a  --  b__c")).toBe("a-b-c");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  !!Edge Case!!  ")).toBe("edge-case");
  });

  it("drops non-ASCII letters that have no ASCII fold", () => {
    expect(slugify("日本語 name")).toBe("name");
  });

  it("returns an empty string for empty/nullish input", () => {
    expect(slugify("")).toBe("");
    expect(slugify(null)).toBe("");
    expect(slugify(undefined)).toBe("");
  });

  it("is idempotent on an already-slugified value", () => {
    const once = slugify("Some Title: Part 2");
    expect(slugify(once)).toBe(once);
  });
});
