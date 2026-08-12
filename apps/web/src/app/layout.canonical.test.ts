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
  it("self-references the homepage with a trailing slash", async () => {
    const { generateMetadata } = await import("./layout");
    const meta = await generateMetadata();

    expect(meta.alternates?.canonical).toBe("https://www.cleanstart.com/");
  });
});
