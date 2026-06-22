import { describe, expect, it } from "vitest";
import { composeGraph } from "./compose-graph";

const ctx = "https://schema.org" as const;

describe("composeGraph", () => {
  it("returns a single @graph merging auto nodes", () => {
    const out = composeGraph({
      auto: [
        { "@type": "Organization", "@id": "x/#org" },
        { "@type": "WebSite" },
      ],
    });
    expect(out["@context"]).toBe("https://schema.org");
    expect(out["@graph"]).toHaveLength(2);
  });

  it("appends pre-built add-on nodes after auto nodes", () => {
    const out = composeGraph({
      auto: [{ "@type": "Article" }],
      addonNodes: [{ "@type": "FAQPage", mainEntity: [] }],
    });
    expect(out["@graph"].some((n) => n["@type"] === "FAQPage")).toBe(true);
    // order: auto first, add-ons after
    expect(out["@graph"][0]?.["@type"]).toBe("Article");
  });

  it("applies a valid override last, replacing the same @type", () => {
    const out = composeGraph({
      auto: [{ "@type": "Article", headline: "auto" }],
      override: { "@context": ctx, "@type": "Article", headline: "override" },
    });
    const article = out["@graph"].find((n) => n["@type"] === "Article");
    expect(article?.headline).toBe("override");
    // strips per-blob @context — the graph carries one top-level @context
    expect(article?.["@context"]).toBeUndefined();
    expect(out["@graph"]).toHaveLength(1);
  });

  it("appends an override node whose @type has no auto match", () => {
    const out = composeGraph({
      auto: [{ "@type": "Article" }],
      override: { "@context": ctx, "@type": "HowTo", name: "x", description: "y" },
    });
    expect(out["@graph"]).toHaveLength(2);
    expect(out["@graph"].some((n) => n["@type"] === "HowTo")).toBe(true);
  });

  it("ignores an invalid override and keeps auto (fail-safe)", () => {
    const out = composeGraph({
      auto: [{ "@type": "Article" }],
      override: { "@context": ctx, "@type": "NotAllowedType" },
    });
    expect(out["@graph"]).toHaveLength(1);
    expect(out["@graph"][0]?.["@type"]).toBe("Article");
  });

  // INV-5: per-@type merge — global propagation
  it("propagates a changed global node into an overridden page (override is on a different @type)", () => {
    const override = { "@context": ctx, "@type": "Article", headline: "override" };
    const before = composeGraph({
      auto: [
        { "@type": "Organization", name: "Old" },
        { "@type": "Article", headline: "auto" },
      ],
      override,
    });
    const after = composeGraph({
      auto: [
        { "@type": "Organization", name: "New" },
        { "@type": "Article", headline: "auto" },
      ],
      override,
    });
    const org = after["@graph"].find((n) => n["@type"] === "Organization");
    const article = after["@graph"].find((n) => n["@type"] === "Article");
    expect(org?.name).toBe("New");
    expect(article?.headline).toBe("override");
    expect(before).not.toEqual(after); // org changed, override stayed
  });

  // INV-5: persistence — same stored override re-composes identically (rebuild != reset)
  it("is deterministic: same inputs always produce the same @graph", () => {
    const input = {
      auto: [{ "@type": "Article", headline: "x" }],
      override: { "@context": ctx, "@type": "Article", headline: "y" },
    };
    expect(composeGraph(input)).toEqual(composeGraph(input));
  });

  it("de-duplicates nodes sharing an @id (last wins)", () => {
    const out = composeGraph({
      auto: [
        { "@type": "Article", "@id": "p/#article", headline: "first" },
        { "@type": "Article", "@id": "p/#article", headline: "second" },
      ],
    });
    expect(out["@graph"]).toHaveLength(1);
    expect(out["@graph"][0]?.headline).toBe("second");
  });
});
