// @vitest-environment happy-dom
import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_MODE_SNIPPET,
  CONSENT_MODE_SNIPPET_HASH,
  CONSENT_REQUIRED_REGIONS,
} from "./consent-mode-snippet";

type ConsentDefault = Record<string, unknown> & { region?: string[] };

/** Runs the snippet as the browser would and returns its `consent default` calls. */
function consentDefaults(): ConsentDefault[] {
  new Function(CONSENT_MODE_SNIPPET).call(globalThis.window);
  const queue = (globalThis.window as unknown as { dataLayer: unknown[] })
    .dataLayer;
  return queue
    .map((entry) => Array.from(entry as IArguments))
    .filter((args) => args[0] === "consent" && args[1] === "default")
    .map((args) => args[2] as ConsentDefault);
}

beforeEach(() => {
  const w = globalThis.window as unknown as {
    dataLayer?: unknown[] | undefined;
    gtag?: unknown;
  };
  w.dataLayer = undefined;
  w.gtag = undefined;
});

describe("CONSENT_MODE_SNIPPET", () => {
  it("declares exactly two defaults: a regional one and a global fallback", () => {
    const defaults = consentDefaults();
    expect(defaults).toHaveLength(2);
    expect(defaults.filter((d) => d.region !== undefined)).toHaveLength(1);
    expect(defaults.filter((d) => d.region === undefined)).toHaveLength(1);
  });

  it("denies analytics_storage in the consent-required regions", () => {
    const regional = consentDefaults().find((d) => d.region !== undefined);
    expect(regional?.analytics_storage).toBe("denied");
  });

  it("grants analytics_storage for everyone else (GA4 un-gated, 2026-07-22)", () => {
    const global = consentDefaults().find((d) => d.region === undefined);
    expect(global?.analytics_storage).toBe("granted");
  });

  it("covers the EEA plus the UK and Switzerland", () => {
    const regional = consentDefaults().find((d) => d.region !== undefined);
    // EU-27 + EEA-3 + GB + CH
    expect(regional?.region).toHaveLength(32);
    for (const code of ["DE", "FR", "IE", "NO", "IS", "LI", "GB", "CH"]) {
      expect(regional?.region).toContain(code);
    }
    expect(regional?.region).not.toContain("US");
    expect(regional?.region).not.toContain("IN");
  });

  it("uses uppercase ISO 3166-1 alpha-2 codes, as Google's region parameter requires", () => {
    for (const code of CONSENT_REQUIRED_REGIONS) {
      expect(code).toMatch(/^[A-Z]{2}$/);
    }
    expect(new Set(CONSENT_REQUIRED_REGIONS).size).toBe(
      CONSENT_REQUIRED_REGIONS.length,
    );
  });

  it("denies every advertising signal in BOTH defaults", () => {
    for (const d of consentDefaults()) {
      expect(d.ad_storage).toBe("denied");
      expect(d.ad_user_data).toBe("denied");
      expect(d.ad_personalization).toBe("denied");
    }
  });

  it("keeps the documented hash in sync with the snippet", () => {
    const actual = `sha256-${createHash("sha256")
      .update(CONSENT_MODE_SNIPPET, "utf8")
      .digest("base64")}`;
    expect(CONSENT_MODE_SNIPPET_HASH).toBe(actual);
  });
});
