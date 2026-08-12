import { describe, expect, it, vi } from "vitest";

// generateMetadata reads the CMS-managed SEO defaults global. Stub it so the
// test asserts canonical shape only and never touches the network.
vi.mock("@/lib/seo/seo-defaults", () => ({
  getSeoDefaults: async () => null,
  orgConfigFromDefaults: () => ({}),
  verificationFromDefaults: () => ({}),
  webSiteConfigFromDefaults: () => ({}),
}));

// next/font/google calls out to build-time font optimization that doesn't
// run under Vitest's node environment. The module is imported for its side
// effect (populating `variable` class names) which this test doesn't assert.
vi.mock("next/font/google", () => ({
  Manrope: () => ({ variable: "--font-manrope", className: "" }),
  Sora: () => ({ variable: "--font-sora", className: "" }),
  JetBrains_Mono: () => ({ variable: "--font-mono", className: "" }),
}));

describe("root layout canonical", () => {
  it("uses the plain path form ('/'), matching every other page's canonical style", async () => {
    const { generateMetadata } = await import("./layout");
    const meta = await generateMetadata();

    // Pinned intentionally at "/", NOT an absolute trailing-slash URL. Next's
    // resolveAbsoluteUrlWithPathname (lib/metadata/resolvers/resolve-url.js)
    // collapses ANY root-path canonical to the bare origin at render time
    // whenever `trailingSlash` is unset in next.config.ts, which it is here.
    // Passing an absolute "https://www.cleanstart.com/" changes nothing in
    // the rendered <link> tag — verified against a production build — so
    // there is no string to put here that survives Next's own resolver.
    expect(meta.alternates?.canonical).toBe("/");
  });
});
