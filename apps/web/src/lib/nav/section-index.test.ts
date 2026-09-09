import { describe, expect, it } from "vitest";

import {
  SECTION_INDEX_REDIRECTS,
  sectionIndexHref,
} from "./section-index";

describe("sectionIndexHref", () => {
  it("resolves a section landing path to its canonical document", () => {
    expect(sectionIndexHref("/knowledge-hub")).toBe(
      "/knowledge-hub/vex-documents",
    );
    expect(sectionIndexHref("/legal")).toBe(
      "/legal/additional-third-party-terms",
    );
  });

  it("returns any other path unchanged", () => {
    expect(sectionIndexHref("/blogs")).toBe("/blogs");
    expect(sectionIndexHref("/")).toBe("/");
  });

  it("never maps a path to another redirecting path", () => {
    for (const target of Object.values(SECTION_INDEX_REDIRECTS)) {
      expect(SECTION_INDEX_REDIRECTS[target]).toBeUndefined();
    }
  });
});
