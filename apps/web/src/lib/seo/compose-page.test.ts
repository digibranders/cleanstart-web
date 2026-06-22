import type { GraphNode } from "@cleanstart/schema";
import { describe, expect, it } from "vitest";
import { buildPageGraph, seoOverride } from "./compose-page";

const ctx = "https://schema.org" as const;

const nodes: GraphNode[] = [
  { "@type": "BreadcrumbList", itemListElement: [] },
  { "@type": "Article", headline: "x" },
];

describe("buildPageGraph (INV-1: composition is pure + survives CMS outage)", () => {
  it("composes a complete @graph from already-fetched nodes — no CMS access at compose time", () => {
    const g = buildPageGraph({ nodes });
    expect(g["@context"]).toBe("https://schema.org");
    expect(g["@graph"].map((n) => n["@type"])).toEqual(["BreadcrumbList", "Article"]);
  });

  it("falls back to auto-only when the override is absent (anonymous / CMS-down read)", () => {
    // When the authenticated fetch fails or returns no override, seoOverride
    // yields undefined and the page still emits the full auto graph.
    const g = buildPageGraph({ nodes, override: undefined });
    expect(g["@graph"]).toHaveLength(2);
  });

  it("merges a valid override per @type", () => {
    const g = buildPageGraph({
      nodes,
      override: { "@context": ctx, "@type": "Article", headline: "override" },
    });
    expect(g["@graph"].find((n) => n["@type"] === "Article")?.headline).toBe("override");
  });

  it("is deterministic — same inputs produce the same graph (rebuild != reset)", () => {
    const input = { nodes, override: { "@context": ctx, "@type": "Article", headline: "y" } };
    expect(buildPageGraph(input)).toEqual(buildPageGraph(input));
  });
});

describe("seoOverride", () => {
  it("extracts additionalSchema when present", () => {
    expect(seoOverride({ additionalSchema: { "@type": "Service" } })).toEqual({ "@type": "Service" });
  });

  it("returns undefined for missing / null / empty seo (fail-safe)", () => {
    expect(seoOverride(null)).toBeUndefined();
    expect(seoOverride(undefined)).toBeUndefined();
    expect(seoOverride({})).toBeUndefined();
    expect(seoOverride({ additionalSchema: null })).toBeUndefined();
  });
});
