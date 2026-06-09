import { describe, expect, it } from "vitest";

import { deriveCoverKeyword, guideCoverPath } from "./guide-cover";

describe("deriveCoverKeyword", () => {
  it("takes the lead phrase before a colon", () => {
    expect(
      deriveCoverKeyword("Hardened Images: Definition, Docker Hardened Images, Benefits & Hardening"),
    ).toBe("Hardened Images");
  });

  it("strips a 'What Is' lead", () => {
    expect(deriveCoverKeyword("What Is Attack Surface Reduction in Containers")).toBe(
      "Attack Surface Reduction in Containers",
    );
  });

  it("caps very long titles to 7 words", () => {
    expect(
      deriveCoverKeyword("NIST SP 800 53 Control Mapping for Kubernetes and Cloud Native"),
    ).toBe("NIST SP 800 53 Control Mapping for");
  });

  it("falls back when empty", () => {
    expect(deriveCoverKeyword("")).toBe("CleanStart Guide");
    expect(deriveCoverKeyword(null)).toBe("CleanStart Guide");
  });
});

describe("guideCoverPath", () => {
  it("builds an encoded cover URL", () => {
    expect(guideCoverPath("hardened-container-image", "Hardened Images")).toBe(
      "/guide-cover/hardened-container-image?kw=Hardened%20Images",
    );
  });
});
