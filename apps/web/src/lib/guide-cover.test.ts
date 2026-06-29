import { describe, expect, it } from "vitest";

import {
  coverTitleSize,
  deriveCoverKeyword,
  guideCoverKeyword,
  guideCoverPath,
} from "./guide-cover";

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

describe("guideCoverKeyword", () => {
  it("uses the editor-set coverTitle verbatim when present", () => {
    expect(
      guideCoverKeyword({ coverTitle: "Software Composition Analysis (SCA)", title: "What is SCA: Working" }),
    ).toBe("Software Composition Analysis (SCA)");
  });

  it("falls back to the derived keyword when coverTitle is blank", () => {
    expect(guideCoverKeyword({ coverTitle: "  ", title: "Hardened Images: Definition" })).toBe(
      "Hardened Images",
    );
    expect(guideCoverKeyword({ coverTitle: null, title: "What Is SBOM" })).toBe("SBOM");
  });

  it("caps a long manual coverTitle to 80 characters", () => {
    const long = "A".repeat(120);
    expect(guideCoverKeyword({ coverTitle: long, title: "x" })).toHaveLength(80);
  });
});

describe("coverTitleSize", () => {
  it("uses the largest size for short titles", () => {
    expect(coverTitleSize("Container Networking")).toEqual({ px: 84, cqw: 6 });
  });

  it("shrinks monotonically as the title gets longer", () => {
    const lengths = [10, 25, 38, 55, 75];
    const pxs = lengths.map((n) => coverTitleSize("a".repeat(n)).px);
    const cqws = lengths.map((n) => coverTitleSize("a".repeat(n)).cqw);
    for (let i = 1; i < pxs.length; i += 1) {
      expect(pxs[i]).toBeLessThan(pxs[i - 1] as number);
      expect(cqws[i]).toBeLessThan(cqws[i - 1] as number);
    }
  });

  it("uses the smallest size at the 80-char cap", () => {
    expect(coverTitleSize("a".repeat(80))).toEqual({ px: 44, cqw: 3.4 });
  });
});

describe("guideCoverPath", () => {
  it("builds a path-encoded cover URL (no query string)", () => {
    expect(guideCoverPath("Hardened Images")).toBe("/guide-cover/Hardened%20Images");
  });
  it("drops forward slashes to avoid encoded-slash path segments", () => {
    expect(guideCoverPath("TLS/SSL Basics")).toBe("/guide-cover/TLS%20SSL%20Basics");
  });
});
