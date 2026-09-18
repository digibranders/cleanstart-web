import { afterEach, describe, expect, it, vi } from "vitest";
import { trackEvent, trackPageView } from "./track";

type Push = Record<string, unknown>;

/** Stubs `window` with an empty dataLayer and returns it for inspection. */
const stubDataLayer = (): Push[] => {
  const dataLayer: Push[] = [];
  vi.stubGlobal("window", { dataLayer });
  return dataLayer;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("trackEvent", () => {
  it("pushes the event name under the `event` key with its params", () => {
    const dataLayer = stubDataLayer();

    trackEvent("generate_lead", { form_name: "contact" });

    expect(dataLayer.at(-1)).toEqual({ event: "generate_lead", form_name: "contact" });
  });

  it("nulls every known parameter before each event push", () => {
    // GTM data layer variables persist across pushes, so without a reset a
    // `job_slug` from an earlier event would attach itself to a later one.
    const dataLayer = stubDataLayer();

    trackEvent("job_application", { job_slug: "staff-engineer" });
    trackEvent("newsletter_signup", { form_name: "newsletter" });

    const reset = dataLayer.at(-2);
    expect(reset?.job_slug).toBeNull();
    expect(reset?.form_name).toBeNull();
    expect(reset).not.toHaveProperty("event");
    expect(dataLayer.at(-1)).toEqual({
      event: "newsletter_signup",
      form_name: "newsletter",
    });
  });

  it("omits undefined params so they don't overwrite the reset", () => {
    const dataLayer = stubDataLayer();

    trackEvent("cta_click", { cta: "hero_watch_video", page: undefined });

    expect(dataLayer.at(-1)).toEqual({ event: "cta_click", cta: "hero_watch_video" });
  });

  it("pushes the bare event when no params are given", () => {
    const dataLayer = stubDataLayer();

    trackEvent("cta_click");

    expect(dataLayer.at(-1)).toEqual({ event: "cta_click" });
  });

  it("no-ops when the dataLayer does not exist (preview host or tag not configured)", () => {
    vi.stubGlobal("window", {});
    expect(() =>
      trackEvent("file_download", { resource_title: "x" }),
    ).not.toThrow();
  });

  it("no-ops on the server (no window)", () => {
    // window is undefined in the default node test env (not stubbed here).
    expect(() => trackEvent("generate_lead")).not.toThrow();
  });
});

describe("trackPageView", () => {
  it("pushes a page_view event with the location payload", () => {
    const dataLayer = stubDataLayer();

    trackPageView({
      page_location: "https://www.cleanstart.com/blog",
      page_title: "Blog",
      page_referrer: "https://www.cleanstart.com/",
    });

    expect(dataLayer.at(-1)).toEqual({
      event: "page_view",
      page_location: "https://www.cleanstart.com/blog",
      page_title: "Blog",
      page_referrer: "https://www.cleanstart.com/",
    });
  });
});
