import { afterEach, describe, expect, it, vi } from "vitest";
import {
  leadfeederAccountId,
  resolveLeadfeederAccountId,
} from "./leadfeeder";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("leadfeederAccountId", () => {
  it("returns a valid alphanumeric account id", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4RXRqJ8RlvP");
    expect(leadfeederAccountId()).toBe("kn9Eq4RXRqJ8RlvP");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "  kn9Eq4RXRqJ8RlvP  ");
    expect(leadfeederAccountId()).toBe("kn9Eq4RXRqJ8RlvP");
  });

  it("returns null when unset (staging / preview)", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "");
    expect(leadfeederAccountId()).toBeNull();
  });

  it("returns null for a malformed id (fails safe, no broken loader)", () => {
    // Script-breaking characters must never reach the loader URL.
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4_RXRqJ");
    expect(leadfeederAccountId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9.js?x=1");
    expect(leadfeederAccountId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9 Eq4");
    expect(leadfeederAccountId()).toBeNull();
  });
});

describe("resolveLeadfeederAccountId", () => {
  it("returns the id on the canonical production host", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4RXRqJ8RlvP");
    expect(resolveLeadfeederAccountId("www.cleanstart.com")).toBe(
      "kn9Eq4RXRqJ8RlvP",
    );
  });

  it("returns null on the staging alias (shares the prod build)", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4RXRqJ8RlvP");
    expect(resolveLeadfeederAccountId("staging.cleanstart.com")).toBeNull();
  });

  it("returns null on a *.vercel.app preview alias", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4RXRqJ8RlvP");
    expect(
      resolveLeadfeederAccountId("cleanstart-web-git-development.vercel.app"),
    ).toBeNull();
  });

  it("returns null when the host is missing (fail-safe)", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "kn9Eq4RXRqJ8RlvP");
    expect(resolveLeadfeederAccountId(null)).toBeNull();
    expect(resolveLeadfeederAccountId(undefined)).toBeNull();
  });

  it("returns null when the id is unset regardless of host", () => {
    vi.stubEnv("NEXT_PUBLIC_LEADFEEDER_ID", "");
    expect(resolveLeadfeederAccountId("www.cleanstart.com")).toBeNull();
  });
});
