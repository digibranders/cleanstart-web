import { describe, expect, it } from "vitest";

import { CONSENT_MODE_SNIPPET_HASH } from "@/lib/consent/consent-mode-snippet";

import {
  buildCsp,
  generateNonce,
  PERMISSIONS_POLICY,
  REPORTING_ENDPOINTS,
} from "./csp";

const parse = (csp: string): Record<string, string> =>
  Object.fromEntries(
    csp
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const [name, ...rest] = d.split(" ");
        return [name, rest.join(" ")];
      }),
  );

const base = {
  nonce: "abc123",
  isProduction: true,
  isDraftMode: false,
};

describe("buildCsp", () => {
  it("embeds the per-request nonce in script-src and style-src", () => {
    const d = parse(buildCsp(base));
    expect(d["script-src"]).toContain("'nonce-abc123'");
    expect(d["style-src"]).toContain("'nonce-abc123'");
  });

  it("pins the consent-mode snippet hash and strict-dynamic", () => {
    const d = parse(buildCsp(base));
    expect(d["script-src"]).toContain(`'${CONSENT_MODE_SNIPPET_HASH}'`);
    expect(d["script-src"]).toContain("'strict-dynamic'");
  });

  it("locks object-src, base-uri and form-action", () => {
    const d = parse(buildCsp(base));
    expect(d["object-src"]).toBe("'none'");
    expect(d["base-uri"]).toBe("'self'");
    expect(d["form-action"]).toBe("'self'");
  });

  it("denies framing by default", () => {
    expect(parse(buildCsp(base))["frame-ancestors"]).toBe("'none'");
  });

  it("allows the preview/admin frame ancestors in draft mode", () => {
    const d = parse(buildCsp({ ...base, isDraftMode: true }));
    expect(d["frame-ancestors"]).toContain("https://cms.cleanstart.com");
    expect(d["frame-ancestors"]).not.toContain("'none'");
  });

  it("allows preview frame ancestors on a preview path", () => {
    const d = parse(buildCsp({ ...base, isPreviewPath: true }));
    expect(d["frame-ancestors"]).toContain("http://localhost:3000");
  });

  it("adds localhost CMS to connect-src only outside production", () => {
    expect(parse(buildCsp({ ...base, isProduction: false }))["connect-src"]).toContain(
      "http://localhost:3000",
    );
    expect(parse(buildCsp(base))["connect-src"]).not.toContain("http://localhost:3000");
  });

  it("enables Trusted Types only in production", () => {
    expect(buildCsp(base)).toContain("require-trusted-types-for 'script'");
    expect(buildCsp({ ...base, isProduction: false })).not.toContain(
      "require-trusted-types-for",
    );
  });

  it("emits upgrade-insecure-requests as a bare directive", () => {
    const csp = buildCsp(base);
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("upgrade-insecure-requests ;");
  });
});

describe("generateNonce", () => {
  it("returns distinct base64 values", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
    // 16 random bytes -> 24-char base64 (with padding)
    expect(Buffer.from(a, "base64").length).toBe(16);
  });
});

describe("policy constants", () => {
  it("PERMISSIONS_POLICY disables high-risk features and ad-tech APIs", () => {
    expect(PERMISSIONS_POLICY).toContain("camera=()");
    expect(PERMISSIONS_POLICY).toContain("geolocation=()");
    expect(PERMISSIONS_POLICY).toContain("browsing-topics=()");
  });

  it("REPORTING_ENDPOINTS points at the CSP report route", () => {
    expect(REPORTING_ENDPOINTS).toContain("/api/csp-report");
  });
});
