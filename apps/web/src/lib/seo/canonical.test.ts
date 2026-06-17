import { describe, it, expect } from "vitest";
import { buildPageMetadata, stripBrandSuffix } from "./canonical";

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
