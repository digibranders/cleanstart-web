import { describe, expect, it } from "vitest";

import { resolveLexicalLink } from "./renderLexical";

describe("resolveLexicalLink", () => {
  it("treats www.cleanstart.com absolute URLs as internal and strips to a path", () => {
    const r = resolveLexicalLink("https://www.cleanstart.com/guide/container-runtime");
    expect(r).toEqual({
      href: "/guide/container-runtime",
      external: false,
      specialScheme: false,
    });
  });

  it("treats the apex cleanstart.com host as internal", () => {
    const r = resolveLexicalLink("https://cleanstart.com/book-a-demo");
    expect(r.external).toBe(false);
    expect(r.href).toBe("/book-a-demo");
  });

  it("keeps sibling subdomains (images./cms.) external", () => {
    expect(resolveLexicalLink("https://images.cleanstart.com/").external).toBe(true);
    expect(resolveLexicalLink("https://cms.cleanstart.com/admin").external).toBe(true);
  });

  it("keeps third-party origins external", () => {
    const r = resolveLexicalLink("https://kubernetes.io/docs");
    expect(r).toEqual({
      href: "https://kubernetes.io/docs",
      external: true,
      specialScheme: false,
    });
  });

  it("strips zero-width characters that break the path", () => {
    // trailing U+200B (zero-width space) — the exact shape seen in prod content
    const r = resolveLexicalLink(
      "https://www.cleanstart.com/guide/vulnerability-remediation\u200B",
    );
    expect(r.external).toBe(false);
    expect(r.href).toBe("/guide/vulnerability-remediation");
  });

  it("preserves query and hash when internalising", () => {
    const r = resolveLexicalLink("https://www.cleanstart.com/news?page=2#latest");
    expect(r.href).toBe("/news?page=2#latest");
    expect(r.external).toBe(false);
  });

  it("classifies root-relative paths, anchors and queries as internal", () => {
    expect(resolveLexicalLink("/about-us").external).toBe(false);
    expect(resolveLexicalLink("#section").external).toBe(false);
    expect(resolveLexicalLink("?q=1").external).toBe(false);
  });

  it("flags mailto:/tel: as external special schemes (no new tab)", () => {
    expect(resolveLexicalLink("mailto:hi@cleanstart.com")).toEqual({
      href: "mailto:hi@cleanstart.com",
      external: true,
      specialScheme: true,
    });
    expect(resolveLexicalLink("tel:+1234567890").specialScheme).toBe(true);
  });

  it("falls back to '#' for empty/whitespace hrefs", () => {
    expect(resolveLexicalLink(undefined).href).toBe("#");
    expect(resolveLexicalLink("   ").href).toBe("#");
  });
});
