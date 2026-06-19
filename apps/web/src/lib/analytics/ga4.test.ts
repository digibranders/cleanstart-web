import { afterEach, describe, expect, it, vi } from "vitest";
import { ga4MeasurementId, resolveGa4MeasurementId } from "./ga4";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("ga4MeasurementId", () => {
  it("returns a valid G- measurement id", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-ABC1234XYZ");
    expect(ga4MeasurementId()).toBe("G-ABC1234XYZ");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "  G-ABC1234XYZ  ");
    expect(ga4MeasurementId()).toBe("G-ABC1234XYZ");
  });

  it("returns null when unset (staging / preview)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "");
    expect(ga4MeasurementId()).toBeNull();
  });

  it("returns null for a malformed id (fails safe, no broken loader)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "UA-123456-1");
    expect(ga4MeasurementId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-abc"); // lowercase rejected, matches CMS rule
    expect(ga4MeasurementId()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-");
    expect(ga4MeasurementId()).toBeNull();
  });
});

describe("resolveGa4MeasurementId", () => {
  it("returns the id on the canonical production host", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-S6T47D7PZR");
    expect(resolveGa4MeasurementId("www.cleanstart.com")).toBe("G-S6T47D7PZR");
  });

  it("returns null on the staging alias (shares the prod build)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-S6T47D7PZR");
    expect(resolveGa4MeasurementId("staging.cleanstart.com")).toBeNull();
  });

  it("returns null on a *.vercel.app preview alias", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-S6T47D7PZR");
    expect(
      resolveGa4MeasurementId("cleanstart-web-git-development.vercel.app"),
    ).toBeNull();
  });

  it("returns null when the host is missing (fail-safe)", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "G-S6T47D7PZR");
    expect(resolveGa4MeasurementId(null)).toBeNull();
    expect(resolveGa4MeasurementId(undefined)).toBeNull();
  });

  it("returns null when the id is unset regardless of host", () => {
    vi.stubEnv("NEXT_PUBLIC_GA4_ID", "");
    expect(resolveGa4MeasurementId("www.cleanstart.com")).toBeNull();
  });
});
