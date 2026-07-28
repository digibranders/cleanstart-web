import { afterEach, describe, expect, it, vi } from "vitest";
import { ga4MeasurementId } from "./ga4";

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
