import { describe, expect, it } from "vitest";

import {
  effectiveWebinarType,
  isWebinarPast,
  type WebinarSchedule,
} from "./webinars-utils";

const NOW = Date.parse("2026-09-21T12:00:00.000Z");

const schedule = (over: Partial<WebinarSchedule> = {}): WebinarSchedule => ({
  webinarType: "live",
  startsAt: null,
  endsAt: null,
  ...over,
});

describe("isWebinarPast", () => {
  it("is false while a live session is still ahead", () => {
    expect(
      isWebinarPast(schedule({ startsAt: "2026-10-01T09:00:00.000Z" }), NOW),
    ).toBe(false);
  });

  it("uses endsAt when the record carries one", () => {
    const item = schedule({
      startsAt: "2026-09-21T09:00:00.000Z",
      endsAt: "2026-09-21T10:00:00.000Z",
    });
    expect(isWebinarPast(item, NOW)).toBe(true);
    expect(isWebinarPast({ ...item, endsAt: "2026-09-21T13:00:00.000Z" }, NOW)).toBe(
      false,
    );
  });

  it("keeps a dateless-time start live for its whole day", () => {
    // Editors save midnight-only dates; the session must not retire at 00:00.
    expect(
      isWebinarPast(schedule({ startsAt: "2026-09-21T00:00:00.000Z" }), NOW),
    ).toBe(false);
    expect(
      isWebinarPast(schedule({ startsAt: "2026-09-20T00:00:00.000Z" }), NOW),
    ).toBe(true);
  });

  it("never retires an on-demand webinar", () => {
    expect(
      isWebinarPast(
        schedule({ webinarType: "on-demand", startsAt: "2020-01-01T00:00:00.000Z" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("treats a missing or unparseable date as not past", () => {
    expect(isWebinarPast(schedule(), NOW)).toBe(false);
    expect(isWebinarPast(schedule({ startsAt: "not a date" }), NOW)).toBe(false);
  });
});

describe("effectiveWebinarType", () => {
  it("moves finished live, panel and demo webinars to on-demand", () => {
    for (const webinarType of ["live", "panel", "demo"] as const) {
      expect(
        effectiveWebinarType(
          schedule({ webinarType, startsAt: "2026-05-12T00:00:00.000Z" }),
          NOW,
        ),
      ).toBe("on-demand");
    }
  });

  it("leaves an upcoming webinar on its declared type", () => {
    expect(
      effectiveWebinarType(
        schedule({ webinarType: "panel", startsAt: "2026-12-01T00:00:00.000Z" }),
        NOW,
      ),
    ).toBe("panel");
  });
});
