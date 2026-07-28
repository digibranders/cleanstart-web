import { describe, expect, it } from "vitest";

import { CONTENT_SIGNALS, buildRobotsTxt } from "./robots";

describe("buildRobotsTxt (indexable)", () => {
  const body = buildRobotsTxt({ indexable: true });
  const lines = body.split("\n");

  it("declares Content Signals inside the wildcard group", () => {
    const wildcardIndex = lines.indexOf("User-Agent: *");
    const signalIndex = lines.indexOf(`Content-Signal: ${CONTENT_SIGNALS}`);
    const nextGroupIndex = lines.indexOf("User-Agent: Bytespider");
    expect(wildcardIndex).toBeGreaterThanOrEqual(0);
    expect(signalIndex).toBeGreaterThan(wildcardIndex);
    expect(signalIndex).toBeLessThan(nextGroupIndex);
  });

  it("signals all three usage categories per the documented allow-all policy", () => {
    expect(CONTENT_SIGNALS).toBe("search=yes, ai-input=yes, ai-train=yes");
  });

  it("keeps the existing crawl rules", () => {
    expect(lines).toContain("Allow: /");
    expect(lines).toContain("Disallow: /preview/");
    expect(lines).toContain("Disallow: /api/preview/");
  });

  it("disallows the internal email-signature directory inside the wildcard group", () => {
    const wildcardIndex = lines.indexOf("User-Agent: *");
    const signaturesIndex = lines.indexOf("Disallow: /email-signatures");
    const nextGroupIndex = lines.indexOf("User-Agent: Bytespider");
    expect(signaturesIndex).toBeGreaterThan(wildcardIndex);
    expect(signaturesIndex).toBeLessThan(nextGroupIndex);
  });

  it("disallows Next.js RSC prefetch query variants inside the wildcard group", () => {
    const wildcardIndex = lines.indexOf("User-Agent: *");
    const rscIndex = lines.indexOf("Disallow: /*_rsc=");
    const nextGroupIndex = lines.indexOf("User-Agent: Bytespider");
    expect(rscIndex).toBeGreaterThan(wildcardIndex);
    expect(rscIndex).toBeLessThan(nextGroupIndex);
  });

  it("keeps the symbolic Bytespider block as its own group", () => {
    const byteIndex = lines.indexOf("User-Agent: Bytespider");
    expect(lines[byteIndex + 1]).toBe("Disallow: /");
  });

  it("keeps sitemap and host", () => {
    expect(lines).toContain("Sitemap: https://www.cleanstart.com/sitemap.xml");
    expect(lines).toContain("Host: https://www.cleanstart.com");
  });

  it("explains the signal semantics in a leading comment block", () => {
    expect(lines[0]).toMatch(/^# /);
    expect(body).toContain("contentsignals.org");
  });
});

describe("buildRobotsTxt (non-indexable)", () => {
  const body = buildRobotsTxt({ indexable: false });
  const lines = body.split("\n");

  it("disallows everything and signals no usage", () => {
    expect(lines).toContain("User-Agent: *");
    expect(lines).toContain("Disallow: /");
    expect(lines).toContain("Content-Signal: search=no, ai-input=no, ai-train=no");
    expect(body).not.toContain("Allow: /");
    expect(body).not.toContain("Sitemap:");
  });
});
