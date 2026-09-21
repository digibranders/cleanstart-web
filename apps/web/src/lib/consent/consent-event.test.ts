import { describe, expect, it } from "vitest";
import { CONSENT_UPDATE_EVENT, consentUpdateEvent } from "./consent-event";

describe("consentUpdateEvent", () => {
  it("carries the event name GTM triggers on", () => {
    expect(CONSENT_UPDATE_EVENT).toBe("cs_consent_update");
  });

  it("exposes each optional category as a boolean flag", () => {
    expect(
      consentUpdateEvent({
        strictlyNecessary: true,
        performance: true,
        functional: false,
        targeting: true,
      }),
    ).toEqual({
      event: "cs_consent_update",
      cs_consent_performance: true,
      cs_consent_functional: false,
      cs_consent_targeting: true,
    });
  });

  it("reports every category as false after a reject-all", () => {
    expect(
      consentUpdateEvent({
        strictlyNecessary: true,
        performance: false,
        functional: false,
        targeting: false,
      }),
    ).toEqual({
      event: "cs_consent_update",
      cs_consent_performance: false,
      cs_consent_functional: false,
      cs_consent_targeting: false,
    });
  });
});
