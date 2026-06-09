import { afterEach, describe, expect, it, vi } from "vitest";
import { isIndexingAllowed, isNoindexHost } from "./indexing";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isNoindexHost", () => {
  it("flags staging and any *.vercel.app alias, ignoring port and case", () => {
    expect(isNoindexHost("staging.cleanstart.com")).toBe(true);
    expect(isNoindexHost("STAGING.cleanstart.com:443")).toBe(true);
    expect(isNoindexHost("cleanstart-web-git-development.vercel.app")).toBe(true);
  });

  it("does not flag the production host or an empty host", () => {
    expect(isNoindexHost("www.cleanstart.com")).toBe(false);
    expect(isNoindexHost(null)).toBe(false);
    expect(isNoindexHost(undefined)).toBe(false);
  });
});

describe("isIndexingAllowed", () => {
  it("blocks every non-production env", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(isIndexingAllowed("www.cleanstart.com")).toBe(false);
    vi.stubEnv("VERCEL_ENV", "development");
    expect(isIndexingAllowed()).toBe(false);
  });

  it("allows the production host but blocks staging / vercel.app on production env", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isIndexingAllowed("www.cleanstart.com")).toBe(true);
    expect(isIndexingAllowed("staging.cleanstart.com")).toBe(false);
    expect(isIndexingAllowed("anything.vercel.app")).toBe(false);
  });

  it("treats a host-less (build-time) production call as indexable", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(isIndexingAllowed()).toBe(true);
  });

  it("ALLOW_INDEXING=1 forces indexing on regardless of env or host", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ALLOW_INDEXING", "1");
    expect(isIndexingAllowed("staging.cleanstart.com")).toBe(true);
    expect(isIndexingAllowed("anything.vercel.app")).toBe(true);
    expect(isIndexingAllowed()).toBe(true);
  });

  it("ignores ALLOW_INDEXING values other than the exact '1'", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("ALLOW_INDEXING", "true");
    expect(isIndexingAllowed("staging.cleanstart.com")).toBe(false);
  });
});
