import { describe, expect, it } from "vitest";

import { validateOverride } from "../validate/override-validator";
import { lintNode } from "../validate/rich-result-lint";
import { webPageSchema } from "./jsonld";
import { templateForType } from "./templates";

describe("webPageSchema", () => {
  it("emits a subtype node referencing the WebSite", () => {
    const node = webPageSchema({ type: "AboutPage", path: "/about-us", name: "About CleanStart" });
    expect(node["@type"]).toBe("AboutPage");
    expect(node["@id"]).toBe("https://www.cleanstart.com/about-us#webpage");
    expect(node.url).toBe("https://www.cleanstart.com/about-us");
    expect(node.name).toBe("About CleanStart");
    expect(node.isPartOf).toEqual({ "@id": "https://www.cleanstart.com/#website" });
  });

  it("includes optional description + primary image when given", () => {
    const node = webPageSchema({
      type: "ContactPage",
      path: "/book-a-demo",
      name: "Book a demo",
      description: "Talk to us",
      primaryImagePath: "/images/demo/hero.png",
    });
    expect(node.description).toBe("Talk to us");
    expect(node.primaryImageOfPage).toEqual({
      "@type": "ImageObject",
      url: "https://www.cleanstart.com/images/demo/hero.png",
    });
  });

  it("passes the rich-result linter once named", () => {
    const node = webPageSchema({ type: "CollectionPage", path: "/blogs", name: "Blog" });
    expect(lintNode(node).ok).toBe(true);
  });
});

describe("templateForType", () => {
  it("seeds a WebPage subtype with context url/name", () => {
    const t = templateForType("AboutPage", { url: "https://x/about", name: "About" });
    expect(t["@type"]).toBe("AboutPage");
    expect(t["@context"]).toBe("https://schema.org");
    expect(t.url).toBe("https://x/about");
    expect(t.name).toBe("About");
  });

  it("produces a structurally-valid override blob", () => {
    for (const type of ["FAQPage", "HowTo", "Article", "SoftwareApplication", "Review"]) {
      const t = templateForType(type);
      expect(validateOverride(t).ok).toBe(true);
    }
  });

  it("FAQ stub has the question/answer shape but lints as incomplete until filled", () => {
    const t = templateForType("FAQPage");
    const main = t.mainEntity as Array<Record<string, unknown>>;
    expect(main[0]?.["@type"]).toBe("Question");
    expect(lintNode(t as never).ok).toBe(false); // empty name/answer text
  });

  it("falls back to a generic stub for an allowed-but-uncurated type", () => {
    const t = templateForType("Dataset");
    expect(t["@type"]).toBe("Dataset");
    expect("name" in t).toBe(true);
  });
});
