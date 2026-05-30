// apps/web/src/lib/seo/canonical.test.ts
import { describe, it, expect } from "vitest";
import { buildPageMetadata } from "./canonical";

const ogUrl = (m: ReturnType<typeof buildPageMetadata>): string =>
  // @ts-expect-error narrow for test
  m.openGraph?.images?.[0]?.url as string;

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
