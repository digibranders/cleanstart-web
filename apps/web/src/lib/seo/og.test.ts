// apps/web/src/lib/seo/og.test.ts
import { describe, it, expect } from "vitest";
import { ogImageUrl, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT } from "./og";

describe("ogImageUrl", () => {
  it("points at /api/og on the canonical site origin", () => {
    expect(ogImageUrl({ title: "Hello" }).startsWith("https://www.cleanstart.com/api/og?")).toBe(true);
  });

  it("encodes the title and omits absent optional params", () => {
    const url = ogImageUrl({ title: "A & B" });
    expect(url).toContain("title=A+%26+B");
    expect(url).not.toContain("eyebrow=");
    expect(url).not.toContain("accent=");
    expect(url).not.toContain("sub=");
    expect(url).not.toContain("variant=");
  });

  it("includes optional params when provided", () => {
    const url = ogImageUrl({ variant: "hero", title: "T", eyebrow: "Blog", titleAccent: "trust", sub: "lead" });
    expect(url).toContain("variant=hero");
    expect(url).toContain("eyebrow=Blog");
    expect(url).toContain("accent=trust");
    expect(url).toContain("sub=lead");
  });

  it("omits variant when it is the default", () => {
    expect(ogImageUrl({ variant: "default", title: "T" })).not.toContain("variant=");
  });

  it("clamps over-long input", () => {
    const title = new URL(ogImageUrl({ title: "x".repeat(500) })).searchParams.get("title") ?? "";
    expect(title.length).toBe(200);
  });

  it("exposes 1200x630 dimensions", () => {
    expect([OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT]).toEqual([1200, 630]);
  });
});
