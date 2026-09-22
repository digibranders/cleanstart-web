import { afterEach, describe, expect, it, vi } from "vitest";
import { gtmContainerId } from "./gtm";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("gtmContainerId", () => {
  it("returns a well-formed container id", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "GTM-ABC1234");
    expect(gtmContainerId()).toBe("GTM-ABC1234");
  });

  it("trims surrounding whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "  GTM-ABC1234  ");
    expect(gtmContainerId()).toBe("GTM-ABC1234");
  });

  it("returns null when unset", () => {
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", "");
    expect(gtmContainerId()).toBeNull();
  });

  it("rejects ids that could break out of the inline snippet or are the wrong product", () => {
    for (const bad of [
      "G-ABC1234XYZ",
      "gtm-abc1234",
      'GTM-ABC1234" onload="x',
      "GTM-",
      "GTM-ABC 1234",
    ]) {
      vi.stubEnv("NEXT_PUBLIC_GTM_ID", bad);
      expect(gtmContainerId()).toBeNull();
    }
  });
});
