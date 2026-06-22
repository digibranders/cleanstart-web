import { describe, expect, it } from "vitest";

import type { GraphNode } from "../types";
import { lintGraph, lintNode } from "./rich-result-lint";

describe("lintNode", () => {
  it("passes a complete Article", () => {
    const node: GraphNode = {
      "@type": "Article",
      headline: "Hello",
      image: "https://x/y.png",
      datePublished: "2026-01-01",
      author: { "@type": "Person", name: "A" },
    };
    const r = lintNode(node);
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it("flags a missing required field as an error", () => {
    const r = lintNode({ "@type": "Article" });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.field)).toContain("headline");
  });

  it("flags a missing recommended field as a warning (still ok)", () => {
    const r = lintNode({ "@type": "Article", headline: "Hi" });
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.field)).toEqual(
      expect.arrayContaining(["image", "datePublished", "author"]),
    );
  });

  it("treats empty string / empty array as missing", () => {
    const r = lintNode({ "@type": "Article", headline: "   " });
    expect(r.errors.map((e) => e.field)).toContain("headline");
  });

  it("uses the primary type when @type is an array", () => {
    const r = lintNode({ "@type": ["FAQPage", "WebPage"], mainEntity: [] });
    expect(r.type).toBe("FAQPage");
    expect(r.errors.map((e) => e.field)).toContain("mainEntity");
  });

  it("deep-checks FAQ entries", () => {
    const r = lintNode({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "" } }],
    });
    expect(r.ok).toBe(false);
    expect(r.errors.map((e) => e.field)).toContain("mainEntity[0].acceptedAnswer.text");
  });

  it("passes a well-formed FAQPage", () => {
    const r = lintNode({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?", acceptedAnswer: { "@type": "Answer", text: "A." } }],
    });
    expect(r.ok).toBe(true);
  });

  it("returns ok with no issues for an unknown type", () => {
    const r = lintNode({ "@type": "SomethingExotic", foo: 1 });
    expect(r.ok).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});

describe("lintGraph", () => {
  it("aggregates counts and collects unknown types", () => {
    const g = lintGraph([
      { "@type": "Article", headline: "ok", image: "i", datePublished: "d", author: "a" },
      { "@type": "WebSite" }, // missing name + url
      { "@type": "Mystery" },
    ]);
    expect(g.errorCount).toBe(2); // WebSite name + url
    expect(g.ok).toBe(false);
    expect(g.unknownTypes).toEqual(["Mystery"]);
  });

  it("is ok when every node is complete", () => {
    const g = lintGraph([
      { "@type": "Organization", name: "C", url: "u", logo: "l", sameAs: ["s"] },
    ]);
    expect(g.ok).toBe(true);
    expect(g.warningCount).toBe(0);
  });
});
