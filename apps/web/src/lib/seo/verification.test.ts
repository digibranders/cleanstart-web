import { afterEach, describe, expect, it, vi } from "vitest";
import { siteVerification } from "./verification";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteVerification", () => {
  it("returns the google token when set", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "abc123token");
    expect(siteVerification()).toEqual({ google: "abc123token" });
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "  abc123token  ");
    expect(siteVerification()).toEqual({ google: "abc123token" });
  });

  it("returns undefined when unset, so no empty meta tag is emitted", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "");
    expect(siteVerification()).toBeUndefined();
  });

  it("returns undefined for a whitespace-only value", () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "   ");
    expect(siteVerification()).toBeUndefined();
  });
});
