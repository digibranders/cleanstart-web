import { afterEach, describe, expect, it, vi } from "vitest";
import { apolloAppId, resolveApolloAppId } from "./apollo";

const VALID_ID = "691b73cb5443850011f553d1";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("apolloAppId", () => {
  it("returns a valid 24-char hex app id", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", VALID_ID);
    expect(apolloAppId()).toBe(VALID_ID);
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", `  ${VALID_ID}  `);
    expect(apolloAppId()).toBe(VALID_ID);
  });

  it("returns null when unset (preview deploys)", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", "");
    expect(apolloAppId()).toBeNull();
  });

  it("returns null for a malformed id (fails safe, no broken loader)", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", "not-a-hex-id");
    expect(apolloAppId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", `${VALID_ID}"});alert(1)`);
    expect(apolloAppId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", "691B73CB5443850011F553D1");
    expect(apolloAppId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", "691b73cb");
    expect(apolloAppId()).toBeNull();
  });
});

describe("resolveApolloAppId", () => {
  it("returns the id on the canonical production host", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", VALID_ID);
    expect(resolveApolloAppId("www.cleanstart.com")).toBe(VALID_ID);
  });

  it("returns null on a *.vercel.app preview alias", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", VALID_ID);
    expect(
      resolveApolloAppId("cleanstart-web-git-development.vercel.app"),
    ).toBeNull();
  });

  it("returns null when the host is missing (fail-safe)", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", VALID_ID);
    expect(resolveApolloAppId(null)).toBeNull();
    expect(resolveApolloAppId(undefined)).toBeNull();
  });

  it("returns null when the id is unset regardless of host", () => {
    vi.stubEnv("NEXT_PUBLIC_APOLLO_APP_ID", "");
    expect(resolveApolloAppId("www.cleanstart.com")).toBeNull();
  });
});
