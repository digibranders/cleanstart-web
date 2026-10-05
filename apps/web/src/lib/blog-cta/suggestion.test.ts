import { describe, expect, it } from "vitest";

import { toSuggestion } from "./suggestion";
import type { BlogCtaSet } from "./types";

const base: BlogCtaSet = {
  slug: "post",
  explore: { kind: "catalog", imageCount: 654, featured: [], href: "https://images.cleanstart.com", pullCommand: null },
  learn: null,
  prove: { href: "/book-a-demo", label: "Book a free POC" },
};

describe("toSuggestion", () => {
  it("names the matched image and resource", () => {
    const out = toSuggestion({
      ...base,
      explore: {
        kind: "image",
        name: "ollama",
        description: null,
        logo: { src: null, tone: "light" },
        href: "https://images.cleanstart.com/images/ollama/details",
        hasFips: true,
        pullCommand: null,
      },
      learn: {
        slug: "cnapp",
        title: "Software Supply Chain Security Beyond CNAPP and CSPM",
        typeLabel: "Whitepaper",
        summary: null,
        href: "/resources/cnapp",
        ctaLabel: "Get the Whitepaper",
        coverUrl: "/c.webp",
        coverAlt: "",
        coverIsPoster: false,
        gated: false,
      },
    });
    expect(out).toEqual({
      resource: { title: "Software Supply Chain Security Beyond CNAPP and CSPM", typeLabel: "Whitepaper", slug: "cnapp" },
      image: { name: "ollama" },
    });
  });

  it("reports no image when the page falls back to the catalog, and no resource when none is published", () => {
    expect(toSuggestion(base)).toEqual({ resource: null, image: null });
  });
});
