import { describe, it, expect } from "vitest";
import { buildPageMetadata, clampMetaDescription, stripBrandSuffix } from "./canonical";

const ogUrl = (m: ReturnType<typeof buildPageMetadata>): string =>
  // @ts-expect-error narrow for test
  m.openGraph?.images?.[0]?.url as string;

const ogTitle = (m: ReturnType<typeof buildPageMetadata>): string =>
  m.openGraph?.title as string;

describe("buildPageMetadata OG image", () => {
  it("defaults og:image to the dynamic /api/og URL from title/eyebrow", () => {
    const m = buildPageMetadata({ title: "Hello", description: "d", path: "/x", eyebrow: "Blog" });
    expect(ogUrl(m)).toContain("/api/og?");
    expect(ogUrl(m)).toContain("title=Hello");
    expect(ogUrl(m)).toContain("eyebrow=Blog");
  });

  it("uses ogTitle for the card when provided (page title unchanged)", () => {
    const m = buildPageMetadata({ title: "CleanStart Images — CVE-Free Container & VM Images", ogTitle: "Trusted Container Foundations", description: "d", path: "/x", variant: "hero" });
    expect(m.title).toBe("CleanStart Images — CVE-Free Container & VM Images");
    expect(ogUrl(m)).toContain("title=Trusted+Container+Foundations");
    expect(ogUrl(m)).toContain("variant=hero");
  });

  it("passes description as the clamped sub-line", () => {
    expect(ogUrl(buildPageMetadata({ title: "T", description: "the lead", path: "/x" }))).toContain("sub=the+lead");
  });

  it("uses an explicit image when provided (CMS override path)", () => {
    const m = buildPageMetadata({ title: "T", description: "d", path: "/x", image: { url: "https://cdn/x.png", alt: "a" } });
    expect(ogUrl(m)).toBe("https://cdn/x.png");
  });
});

describe("stripBrandSuffix", () => {
  it("strips a trailing ' | CleanStart' so the layout template can't double it", () => {
    expect(stripBrandSuffix("Kubernetes Hardening Guide | CleanStart")).toBe("Kubernetes Hardening Guide");
  });

  it("strips dash, en/em-dash, and colon separator variants", () => {
    expect(stripBrandSuffix("Guide - CleanStart")).toBe("Guide");
    expect(stripBrandSuffix("Guide – CleanStart")).toBe("Guide");
    expect(stripBrandSuffix("Guide — CleanStart")).toBe("Guide");
    expect(stripBrandSuffix("Guide: CleanStart")).toBe("Guide");
  });

  it("collapses an already-doubled brand suffix", () => {
    expect(stripBrandSuffix("Guide | CleanStart | CleanStart")).toBe("Guide");
  });

  it("leaves a title without the brand untouched, incl. a leading 'CleanStart'", () => {
    expect(stripBrandSuffix("About Us")).toBe("About Us");
    expect(stripBrandSuffix("CleanStart Images — CVE-Free Images")).toBe("CleanStart Images — CVE-Free Images");
  });

  it("never reduces a bare 'CleanStart' title to empty", () => {
    expect(stripBrandSuffix("CleanStart")).toBe("CleanStart");
  });
});

describe("buildPageMetadata title brand handling", () => {
  it("strips the brand from the document AND og/twitter title (template re-adds one)", () => {
    const m = buildPageMetadata({ title: "VEX Documents | CleanStart", description: "d", path: "/knowledge-hub/vex" });
    expect(m.title).toBe("VEX Documents");
    expect(ogTitle(m)).toBe("VEX Documents");
    expect(m.twitter?.title).toBe("VEX Documents");
  });

  it("keeps the brand when absoluteTitle is set (template bypassed)", () => {
    const m = buildPageMetadata({ title: "Verified & Secure Container Images | CleanStart", description: "d", path: "/", absoluteTitle: true });
    expect(m.title).toEqual({ absolute: "Verified & Secure Container Images | CleanStart" });
  });
});

describe("clampMetaDescription", () => {
  const long =
    "Conventional scanners rely on a single rule: find the known flaw, match the CVE, and block the package. Modern supply-chain attacks break that assumption. Today's threats aren't buggy code.";

  it("returns short text unchanged", () => {
    expect(clampMetaDescription("A short description.")).toBe("A short description.");
  });

  it("collapses whitespace and newlines from rich-text abstracts", () => {
    expect(clampMetaDescription("  Line one.\n\n  Line   two.  ")).toBe("Line one. Line two.");
  });

  it("cuts long text at a word boundary within 160 chars and adds an ellipsis", () => {
    const out = clampMetaDescription(long);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(long.startsWith(out.slice(0, -1))).toBe(true);
    expect(long.charAt(out.length - 1)).toMatch(/[\s,;:.]/);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    // 155 chars of filler puts "end," right before the last space inside the limit.
    const text = `${"word ".repeat(31)}end, and more text that runs well past the limit`;
    expect(clampMetaDescription(text, 160)).toMatch(/ end…$/);
  });

  it("hard-cuts a single unbroken token longer than the limit", () => {
    const out = clampMetaDescription("x".repeat(400));
    expect(out).toHaveLength(160);
    expect(out.endsWith("…")).toBe(true);
  });
});
