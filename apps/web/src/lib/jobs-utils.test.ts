import { describe, expect, it } from "vitest";

import { jobValidThrough } from "./jobs-utils";

describe("jobValidThrough", () => {
  it("uses the application deadline first", () => {
    expect(
      jobValidThrough({
        applicationDeadline: "2026-11-30T00:00:00.000Z",
        expiresAt: "2026-12-31T00:00:00.000Z",
      }),
    ).toBe("2026-11-30T00:00:00.000Z");
  });

  it("falls back to the expiry date", () => {
    expect(jobValidThrough({ expiresAt: "2026-12-31T00:00:00.000Z" })).toBe(
      "2026-12-31T00:00:00.000Z",
    );
  });

  it("is undefined for an open-ended role, so no expiry is invented", () => {
    expect(jobValidThrough({})).toBeUndefined();
    expect(jobValidThrough({ applicationDeadline: null, expiresAt: null })).toBeUndefined();
  });
});
