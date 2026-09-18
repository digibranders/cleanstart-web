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

/** Keys of a push whose value is set, i.e. what a GA4 event tag would send. */
const sent = (push: Push | undefined): Push =>
  Object.fromEntries(
    Object.entries(push ?? {}).filter(([, value]) => value !== undefined),
  );

describe("trackEvent", () => {
  it("pushes one entry carrying the event name and its params", () => {
    const dataLayer = stubDataLayer();

    trackEvent("generate_lead", { form_name: "contact" });

    expect(dataLayer).toHaveLength(1);
    expect(sent(dataLayer[0])).toEqual({ event: "generate_lead", form_name: "contact" });
  });

  it("clears every other known parameter in the same push", () => {
    // GTM data layer variables persist across pushes, so without a reset a
    // `job_slug` from an earlier event would attach itself to a later one.
    const dataLayer = stubDataLayer();

    trackEvent("job_application", { job_slug: "staff-engineer" });
    trackEvent("newsletter_signup", { form_name: "newsletter" });

    const last = dataLayer.at(-1);
    // The key must be present (so GTM's merge overwrites the stale value) but
    // undefined (so the GA4 tag omits the param rather than sending null).
    expect(last).toHaveProperty("job_slug", undefined);
    expect(sent(last)).toEqual({ event: "newsletter_signup", form_name: "newsletter" });
  });

  it("treats an explicitly undefined param as cleared", () => {
    const dataLayer = stubDataLayer();

    trackEvent("cta_click", { cta: "hero_watch_video", page: undefined });

    expect(sent(dataLayer.at(-1))).toEqual({ event: "cta_click", cta: "hero_watch_video" });
  });

  it("pushes the bare event when no params are given", () => {
    const dataLayer = stubDataLayer();

    trackEvent("cta_click");

    expect(sent(dataLayer.at(-1))).toEqual({ event: "cta_click" });
  });

  it("no-ops when window.dataLayer is missing", () => {
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

    expect(sent(dataLayer.at(-1))).toEqual({
      event: "page_view",
      page_location: "https://www.cleanstart.com/blog",
      page_title: "Blog",
      page_referrer: "https://www.cleanstart.com/",
    });
  });
});
