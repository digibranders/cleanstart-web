import { describe, expect, it } from "vitest";

import {
  CLEAN_LIBRARIES_VIDEO,
  formatDurationLabel,
  spokenDuration,
  toIso8601Duration,
} from "./clean-libraries-video";

describe("formatDurationLabel", () => {
  it("renders mm:ss with a zero-padded seconds field", () => {
    expect(formatDurationLabel(159)).toBe("2:39");
    expect(formatDurationLabel(65)).toBe("1:05");
    expect(formatDurationLabel(9)).toBe("0:09");
  });

  it("adds an hours field only past the hour", () => {
    expect(formatDurationLabel(3599)).toBe("59:59");
    expect(formatDurationLabel(3600)).toBe("1:00:00");
    expect(formatDurationLabel(3725)).toBe("1:02:05");
  });
});

describe("toIso8601Duration", () => {
  it("omits zero components", () => {
    expect(toIso8601Duration(159)).toBe("PT2M39S");
    expect(toIso8601Duration(120)).toBe("PT2M");
    expect(toIso8601Duration(45)).toBe("PT45S");
    expect(toIso8601Duration(3600)).toBe("PT1H");
    expect(toIso8601Duration(3725)).toBe("PT1H2M5S");
  });

  it("represents a zero duration as PT0S rather than a bare PT", () => {
    expect(toIso8601Duration(0)).toBe("PT0S");
  });
});

describe("spokenDuration", () => {
  it("reads out minutes and seconds for screen readers", () => {
    expect(spokenDuration(159)).toBe("2 min 39 sec");
    expect(spokenDuration(120)).toBe("2 min");
    expect(spokenDuration(45)).toBe("45 sec");
  });
});

describe("CLEAN_LIBRARIES_VIDEO", () => {
  it("carries the fields Google requires for VideoObject rich results", () => {
    expect(CLEAN_LIBRARIES_VIDEO.videoId).toMatch(/^[\w-]{11}$/);
    expect(CLEAN_LIBRARIES_VIDEO.title.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(CLEAN_LIBRARIES_VIDEO.uploadDate))).toBe(false);
    expect(CLEAN_LIBRARIES_VIDEO.durationSeconds).toBeGreaterThan(0);
  });

  it("points at a self-hosted poster with a 16:9 intrinsic size", () => {
    expect(CLEAN_LIBRARIES_VIDEO.posterPath.startsWith("/images/")).toBe(true);
    const ratio =
      CLEAN_LIBRARIES_VIDEO.posterWidth / CLEAN_LIBRARIES_VIDEO.posterHeight;
    expect(ratio).toBeCloseTo(16 / 9, 2);
  });
});
