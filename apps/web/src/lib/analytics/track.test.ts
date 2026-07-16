import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./track";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEvent", () => {
  it("forwards the event name and params to window.gtag", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackEvent("generate_lead", { form_slug: "contact-sales" });

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
      form_slug: "contact-sales",
    });
  });

  it("emits with no params when none are given", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    trackEvent("cta_click");

    expect(gtag).toHaveBeenCalledWith("event", "cta_click", undefined);
  });

  it("no-ops when the tag is not loaded (staging/preview/pre-hydration)", () => {
    vi.stubGlobal("window", {});
    expect(() =>
      trackEvent("file_download", { file_name: "x.pdf" }),
    ).not.toThrow();
  });

  it("no-ops on the server (no window)", () => {
    // window is undefined in the default node test env (not stubbed here).
    expect(() => trackEvent("generate_lead")).not.toThrow();
  });
});
