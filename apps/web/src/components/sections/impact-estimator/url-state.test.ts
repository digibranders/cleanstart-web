import { describe, expect, it } from "vitest";
import { DEFAULT_INPUT, buildEstimatorSearch, parseEstimatorSearch } from "./url-state";

describe("parseEstimatorSearch", () => {
  it("returns nothing for an empty query", () => {
    expect(parseEstimatorSearch("")).toEqual({});
    expect(parseEstimatorSearch("?")).toEqual({});
  });

  it("reads all four inputs", () => {
    expect(parseEstimatorSearch("?images=120&team=25&remediation=Weekly&release=Biweekly")).toEqual({
      images: 120,
      team: 25,
      remediation: "Weekly",
      release: "Biweekly",
    });
  });

  it("accepts a bare query string without the leading question mark", () => {
    expect(parseEstimatorSearch("images=120")).toEqual({ images: 120 });
  });

  it("matches option names case-insensitively", () => {
    expect(parseEstimatorSearch("?remediation=quarterly&release=CONTINUOUS")).toEqual({
      remediation: "Quarterly",
      release: "Continuous",
    });
  });

  it("drops unknown option values", () => {
    expect(parseEstimatorSearch("?remediation=daily&release=yearly")).toEqual({});
  });

  it("clamps counts to the slider bounds", () => {
    expect(parseEstimatorSearch("?images=9999&team=0")).toEqual({ images: 500, team: 5 });
  });

  it("snaps counts to the slider step", () => {
    expect(parseEstimatorSearch("?images=123&team=37")).toEqual({ images: 120, team: 35 });
  });

  it("drops counts that are not finite numbers", () => {
    expect(parseEstimatorSearch("?images=abc&team=")).toEqual({});
    expect(parseEstimatorSearch("?images=NaN&team=Infinity")).toEqual({});
  });

  it("ignores unrelated params", () => {
    expect(parseEstimatorSearch("?utm_source=x&images=40")).toEqual({ images: 40 });
  });
});

describe("buildEstimatorSearch", () => {
  it("serialises every input in a stable order", () => {
    expect(buildEstimatorSearch({ images: 120, team: 25, remediation: "Weekly", release: "Biweekly" })).toBe(
      "?images=120&team=25&remediation=Weekly&release=Biweekly",
    );
  });

  it("round-trips through the parser", () => {
    const input = { images: 380, team: 155, remediation: "Quarterly", release: "Monthly" } as const;
    expect(parseEstimatorSearch(buildEstimatorSearch(input))).toEqual(input);
  });
});

describe("DEFAULT_INPUT", () => {
  it("sits inside a band rather than on its edge", () => {
    // 250 images was the last value of the Large band and 50 engineers the last
    // of the Mid-sized band, which made the first slider step change the tier.
    expect(DEFAULT_INPUT.images).toBe(200);
    expect(DEFAULT_INPUT.team).toBe(40);
  });

  it("round-trips through the parser", () => {
    expect(parseEstimatorSearch(buildEstimatorSearch(DEFAULT_INPUT))).toEqual(DEFAULT_INPUT);
  });
});
