import { describe, expect, it } from "vitest";
import { lowercasePreservingEscapes, shouldLowercase } from "./proxy";

describe("lowercasePreservingEscapes", () => {
  it("lowercases ordinary path segments", () => {
    expect(lowercasePreservingEscapes("/Guide/Container")).toBe("/guide/container");
  });

  it("leaves percent-escape hex digits alone", () => {
    // RFC 3986 §6.2.2.1 — %5C and %5c are the same octet, so rewriting one to
    // the other is a no-op that used to cost a redirect hop.
    expect(lowercasePreservingEscapes("/guide/cgroup%5C")).toBe("/guide/cgroup%5C");
  });

  it("lowercases text around an escape without touching the escape", () => {
    expect(lowercasePreservingEscapes("/Guide/A%5CB")).toBe("/guide/a%5Cb");
  });
});

describe("shouldLowercase", () => {
  it("does not redirect when the only uppercase is inside an escape", () => {
    // The regression: this 308'd to /guide/cgroup%5c, which then 404'd, so a
    // crawler saw a redirect landing on an error rather than a plain 404.
    expect(shouldLowercase("/guide/cgroup%5C")).toBe(false);
  });

  it("still redirects a genuinely mixed-case path", () => {
    expect(shouldLowercase("/Guide/Container")).toBe(true);
  });

  it("leaves already-lowercase paths alone", () => {
    expect(shouldLowercase("/guide/container")).toBe(false);
  });

  it("skips file-extension paths and generated guide covers", () => {
    expect(shouldLowercase("/Sitemap.XML")).toBe(false);
    expect(shouldLowercase("/guide-cover/Container%20Networking")).toBe(false);
  });
});
