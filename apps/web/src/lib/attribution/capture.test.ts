import { describe, expect, it } from "vitest";

import {
  advanceState,
  buildSnapshot,
  composeSubmission,
  detectDevice,
  hasCampaignSignal,
  parseClickIds,
  parseUtm,
} from "./capture";
import type { AttributionSnapshot } from "./types";

const AT = "2026-07-15T10:00:00.000Z";

const snapshotOf = (search: string, referrer = "", origin = "https://www.cleanstart.com") =>
  buildSnapshot({
    href: `${origin}/book-a-demo${search}`,
    search,
    origin,
    referrer,
    userAgent: "Mozilla/5.0 (Macintosh)",
    at: AT,
  });

describe("parseUtm / parseClickIds", () => {
  it("extracts and trims utm params", () => {
    const utm = parseUtm(new URLSearchParams("utm_source=google&utm_medium=cpc&utm_campaign= spring "));
    expect(utm).toEqual({ source: "google", medium: "cpc", campaign: "spring" });
  });

  it("omits empty params", () => {
    expect(parseUtm(new URLSearchParams("utm_source=&foo=bar"))).toEqual({});
  });

  it("extracts click IDs including li_fat_id", () => {
    expect(parseClickIds(new URLSearchParams("gclid=abc&li_fat_id=xyz"))).toEqual({
      gclid: "abc",
      liFatId: "xyz",
    });
  });
});

describe("detectDevice", () => {
  it("classifies mobile, tablet, desktop", () => {
    expect(detectDevice("iPhone; CPU iPhone OS Mobile")).toBe("mobile");
    expect(detectDevice("Mozilla/5.0 (iPad; CPU OS)")).toBe("tablet");
    expect(detectDevice("Mozilla/5.0 (Macintosh)")).toBe("desktop");
  });
});

describe("buildSnapshot", () => {
  it("records the landing page and drops a same-origin referrer", () => {
    const snap = snapshotOf("?utm_source=google", "https://www.cleanstart.com/pricing");
    expect(snap.touch.landingPage).toContain("/book-a-demo");
    expect(snap.touch.referrer).toBeUndefined();
    expect(snap.touch.source).toBe("google");
  });

  it("keeps an external referrer", () => {
    const snap = snapshotOf("", "https://news.ycombinator.com/");
    expect(snap.touch.referrer).toBe("https://news.ycombinator.com/");
  });
});

describe("hasCampaignSignal", () => {
  it("is false for a bare visit and true with utm or click id", () => {
    expect(hasCampaignSignal({}, {})).toBe(false);
    expect(hasCampaignSignal({ source: "google" }, {})).toBe(true);
    expect(hasCampaignSignal({}, { gclid: "x" })).toBe(true);
  });
});

describe("advanceState", () => {
  it("seeds first and last from the first touch", () => {
    const snap = snapshotOf("?utm_source=google&utm_medium=cpc");
    const state = advanceState(null, snap);
    expect(state.first.source).toBe("google");
    expect(state.last.source).toBe("google");
  });

  it("keeps first touch but advances last on a new campaign", () => {
    const first = advanceState(null, snapshotOf("?utm_source=google"));
    const second: AttributionSnapshot = snapshotOf("?utm_source=linkedin&utm_medium=paidsocial");
    const next = advanceState(first, second);
    expect(next.first.source).toBe("google");
    expect(next.last.source).toBe("linkedin");
  });

  it("does not advance last touch on a bare internal visit", () => {
    const first = advanceState(null, snapshotOf("?utm_source=google"));
    const next = advanceState(first, snapshotOf(""));
    expect(next.last.source).toBe("google");
  });
});

describe("composeSubmission", () => {
  it("falls back to the current snapshot when no state is persisted", () => {
    const snap = snapshotOf("?utm_source=google&utm_medium=cpc", "https://news.ycombinator.com/");
    const out = composeSubmission(null, snap);
    expect(out.utm).toEqual({ source: "google", medium: "cpc" });
    expect(out.attribution?.firstTouch?.source).toBe("google");
    expect(out.attribution?.device).toBe("desktop");
  });

  it("uses persisted first/last touch when present", () => {
    const state = advanceState(null, snapshotOf("?utm_source=google"));
    const advanced = advanceState(state, snapshotOf("?utm_source=bing&utm_medium=cpc"));
    const out = composeSubmission(advanced, snapshotOf(""));
    expect(out.attribution?.firstTouch?.source).toBe("google");
    expect(out.utm).toEqual({ source: "bing", medium: "cpc" });
  });

  it("emits no utm for a bare direct visit", () => {
    const out = composeSubmission(null, snapshotOf(""));
    expect(out.utm).toBeUndefined();
  });
});
