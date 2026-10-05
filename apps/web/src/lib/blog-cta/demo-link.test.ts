import { describe, expect, it } from "vitest";

import { withDemoSource } from "./demo-link";

describe("withDemoSource", () => {
  it("adds the blog source, page and CTA slot as a relative link", () => {
    expect(
      withDemoSource("/book-a-demo", { slug: "official-redis-image", layout: "ladder", placement: "rail" }),
    ).toBe("/book-a-demo?source=blog&source_page=official-redis-image&source_cta=ladder-rail");
  });

  it("keeps existing params and the hash, and never adds utm_ params", () => {
    const href = withDemoSource("/book-a-demo?plan=team#form", { slug: "a", layout: "ladder", placement: "bar" });
    expect(href).toBe("/book-a-demo?plan=team&source=blog&source_page=a&source_cta=ladder-bar#form");
    expect(href).not.toContain("utm_");
  });

  it("encodes slugs safely", () => {
    expect(withDemoSource("/book-a-demo", { slug: "a b&c", layout: "ladder", placement: "rail" })).toBe(
      "/book-a-demo?source=blog&source_page=a+b%26c&source_cta=ladder-rail",
    );
  });
});
