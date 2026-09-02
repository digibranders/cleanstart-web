import { describe, expect, it } from "vitest";
import {
  ANNUAL_ENG_HOURS,
  BURDEN_SCALE,
  bandWeight,
  computeImpact,
  IMAGE_WEIGHT_THRESHOLDS,
  RELEASE_OPTIONS,
  REMEDIATION_OPTIONS,
  TEAM_WEIGHT_THRESHOLDS,
  type ReleaseOption,
  type RemediationOption,
  type RoiInput,
} from "./model";

/*
 * These tests transcribe the client's `ROI 1.xlsx` and exist to stop the model
 * drifting away from it again. A failure here is not necessarily a bug in the
 * code; it means the code and the client's sheet now disagree, which is a
 * question for the client before it is a fix for us.
 */

const base: RoiInput = { images: 250, team: 50, remediation: "Monthly", release: "Continuous" };
const at = (over: Partial<RoiInput>): ReturnType<typeof computeImpact> => computeImpact({ ...base, ...over });

describe("input weight bands (sheet §Background Scoring & Logic)", () => {
  it.each([
    [10, 1],
    [25, 1],
    [26, 2],
    [100, 2],
    [101, 3],
    [250, 3],
    [251, 4],
    [500, 4],
  ])("images %i scores %i", (images, weight) => {
    expect(bandWeight(images, IMAGE_WEIGHT_THRESHOLDS)).toBe(weight);
  });

  it.each([
    [5, 1],
    [10, 1],
    [11, 2],
    [50, 2],
    [51, 3],
    // The sheet writes "51 to 100" and "100+"; the explicit range wins at 100.
    [100, 3],
    [101, 4],
    [200, 4],
  ])("team %i scores %i", (team, weight) => {
    expect(bandWeight(team, TEAM_WEIGHT_THRESHOLDS)).toBe(weight);
  });

  it("exposes the crossing points the UI draws as ticks", () => {
    expect(IMAGE_WEIGHT_THRESHOLDS).toEqual([25, 100, 250]);
    expect(TEAM_WEIGHT_THRESHOLDS).toEqual([10, 50, 100]);
  });

  it("scores cadences in the order the sheet lists them", () => {
    // Ascending burden, straight from the sheet's weight tables. Deliberately
    // NOT the *_OPTIONS constants, which carry the UI's display order.
    const remediationByBurden: readonly RemediationOption[] = ["Quarterly", "Monthly", "Weekly"];
    const releaseByBurden: readonly ReleaseOption[] = ["Monthly", "Biweekly", "Continuous"];
    // Each cadence step is worth one level at 20% weight, so 20 points.
    for (const [lower, higher] of pairs(remediationByBurden.map((r) => at({ remediation: r }).burden))) {
      expect(higher - lower).toBeCloseTo(20);
    }
    for (const [lower, higher] of pairs(releaseByBurden.map((r) => at({ release: r }).burden))) {
      expect(higher - lower).toBeCloseTo(20);
    }
  });

  it("offers remediation most-frequent-first in the UI", () => {
    expect(REMEDIATION_OPTIONS).toEqual(["Quarterly", "Monthly", "Weekly"]);
    expect(RELEASE_OPTIONS).toEqual(["Monthly", "Biweekly", "Continuous"]);
  });
});

describe("burden score", () => {
  it("is (img×0.4 + eng×0.2 + rem×0.2 + rel×0.2) × 100", () => {
    // 250 img → 3, 50 eng → 2, Monthly → 2, Continuous → 3
    expect(at({}).burden).toBeCloseTo((3 * 0.4 + 2 * 0.2 + 2 * 0.2 + 3 * 0.2) * 100);
  });

  it("bottoms out at 100 and tops out at 360", () => {
    const low = at({ images: 10, team: 5, remediation: "Quarterly", release: "Monthly" });
    const high = at({ images: 500, team: 200, remediation: "Weekly", release: "Continuous" });
    expect(low.burden).toBeCloseTo(BURDEN_SCALE.min);
    expect(high.burden).toBeCloseTo(BURDEN_SCALE.max);
    expect(low.meterProgress).toBe(0);
    expect(high.meterProgress).toBe(1);
  });

  it("weights images at double every other input", () => {
    const { contributions } = at({});
    expect(contributions.map((c) => c.weightPct)).toEqual([40, 20, 20, 20]);
    expect(contributions.reduce((sum, c) => sum + c.points, 0)).toBeCloseTo(at({}).burden);
  });

  it("reports a reachable ceiling per input so the breakdown bars can fill", () => {
    const maxed = at({ images: 500, team: 200, remediation: "Weekly", release: "Continuous" });
    for (const c of maxed.contributions) expect(c.level).toBe(c.maxLevel);
  });
});

describe("runtime complexity tiers", () => {
  it.each([
    [100, "Low"],
    [120, "Low"],
    [140, "Moderate"],
    [220, "Moderate"],
    [240, "High"],
    [320, "High"],
    [340, "Extreme"],
    [360, "Extreme"],
  ])("score %i is %s", (burden, tier) => {
    // Every reachable score is a multiple of 20, so the sheet's 120/220/320
    // cut points land exactly on a boundary rather than between two scores.
    const found = allInputs().find((i) => Math.round(computeImpact(i).burden) === burden);
    expect(found, `no input produces a burden of ${burden}`).toBeDefined();
    expect(computeImpact(found as RoiInput).tier).toBe(tier);
  });

  it("never lands between tiers", () => {
    for (const input of allInputs()) expect(computeImpact(input).tier).toBeTruthy();
  });
});

describe("burden reduction (sheet §Background Scoring & Logic item 2)", () => {
  it.each([
    [100, 70],
    [120, 70],
    [140, 70],
    [160, 82],
    [220, 82],
    [240, 82],
    [260, 92],
    [320, 92],
    [340, 92],
    [360, 97],
  ])("score %i reduces burden by %i%%", (burden, pct) => {
    const input = allInputs().find((i) => computeImpact(i).burden === burden);
    expect(input, `no input produces a burden of ${burden}`).toBeDefined();
    expect(computeImpact(input as RoiInput).burdenReduction).toBe(pct);
  });

  it("only ever reports the four values the sheet lists", () => {
    const seen = new Set(allInputs().map((i) => computeImpact(i).burdenReduction));
    expect([...seen].sort((a, b) => a - b)).toEqual([70, 82, 92, 97]);
  });

  it("never decreases as burden rises", () => {
    const scored = allInputs()
      .map((i) => computeImpact(i))
      .sort((a, b) => a.burden - b.burden);
    for (const [lower, higher] of pairs(scored)) {
      expect(higher.burdenReduction).toBeGreaterThanOrEqual(lower.burdenReduction);
    }
  });

  it("never lands on the sheet's overlapping band edges", () => {
    // 250 and 350 appear in two branches each; the reading only matters if a
    // score can reach them, and none can. If this fails, the tie-break in
    // burdenReductionFor() has become load-bearing and needs client sign-off.
    const reachable = new Set(allInputs().map((i) => computeImpact(i).burden));
    expect(reachable.has(250)).toBe(false);
    expect(reachable.has(350)).toBe(false);
  });

  it("is offset from the tier boundaries, as the sheet specifies", () => {
    // Documents a known disagreement rather than asserting it is correct: the
    // sheet's cut points sit 30 above the tier cuts, so these scores report a
    // reduction from the band below their tier. Pending client confirmation.
    const at140 = allInputs().find((i) => computeImpact(i).burden === 140);
    const out = computeImpact(at140 as RoiInput);
    expect(out.tier).toBe("Moderate");
    expect(out.burdenReduction).toBe(70);
  });
});

describe("outcome bands (sheet §Runtime Complexity table)", () => {
  const EXPECTED = {
    Low: { vuln: [70, 80], patch: [25, 35], release: [1.5, 2], footprint: [40, 55], F: 0.05 },
    Moderate: { vuln: [80, 88], patch: [40, 55], release: [2, 3], footprint: [55, 70], F: 0.08 },
    High: { vuln: [88, 95], patch: [55, 70], release: [3, 4], footprint: [70, 85], F: 0.12 },
    Extreme: { vuln: [95, 97], patch: [70, 85], release: [4, 5], footprint: [85, 95], F: 0.18 },
  } as const;

  it("keeps every outcome inside its tier's published range", () => {
    for (const input of allInputs()) {
      const out = computeImpact(input);
      const band = EXPECTED[out.tier];
      expect(out.vuln).toBeGreaterThanOrEqual(band.vuln[0]);
      expect(out.vuln).toBeLessThanOrEqual(band.vuln[1]);
      expect(out.patch).toBeGreaterThanOrEqual(band.patch[0]);
      expect(out.patch).toBeLessThanOrEqual(band.patch[1]);
      expect(out.release).toBeGreaterThanOrEqual(band.release[0]);
      expect(out.release).toBeLessThanOrEqual(band.release[1]);
      expect(out.footprint).toBeGreaterThanOrEqual(band.footprint[0]);
      expect(out.footprint).toBeLessThanOrEqual(band.footprint[1]);
      expect(out.bands.F).toBe(band.F);
    }
  });

  it("reports the band endpoints at the edges of a tier", () => {
    const bottom = at({ images: 10, team: 5, remediation: "Quarterly", release: "Monthly" });
    expect(bottom.tier).toBe("Low");
    expect(bottom.vuln).toBeCloseTo(70);
    expect(bottom.footprint).toBeCloseTo(40);

    const top = at({ images: 500, team: 200, remediation: "Weekly", release: "Continuous" });
    expect(top.tier).toBe("Extreme");
    expect(top.vuln).toBeCloseTo(97);
    expect(top.footprint).toBeCloseTo(95);
  });

  it("worsens every outcome as burden rises", () => {
    const scored = allInputs()
      .map((i) => computeImpact(i))
      .sort((a, b) => a.burden - b.burden);
    for (const [lower, higher] of pairs(scored)) {
      expect(higher.vuln).toBeGreaterThanOrEqual(lower.vuln);
      expect(higher.patch).toBeGreaterThanOrEqual(lower.patch);
      expect(higher.release).toBeGreaterThanOrEqual(lower.release);
      expect(higher.footprint).toBeGreaterThanOrEqual(lower.footprint);
    }
  });
});

describe("engineering hours recovered", () => {
  /*
   * NOTE: the client's sheet leaves the formula for this output blank; only the
   * per-tier "time lost" fraction (F) is given. The derivation below is ours and
   * is pending their confirmation, so these tests pin the behaviour we ship
   * rather than a client-stated rule.
   */
  it("derives from the working year, the tier's F, and the vulnerability reduction", () => {
    const out = at({});
    const raw = ANNUAL_ENG_HOURS * out.bands.F * (out.vuln / 100);
    expect(out.hoursPerEngineer).toBe(Math.round(raw / 5) * 5);
  });

  it("keeps the three displayed figures arithmetically consistent", () => {
    for (const input of allInputs()) {
      const out = computeImpact(input);
      // Rounded to the nearest 5 *before* multiplying, so the card's
      // "X hrs/engineer × N engineers" reads as exactly the headline total.
      expect(out.hoursPerEngineer % 5).toBe(0);
      expect(out.hoursRecovered).toBe(out.hoursPerEngineer * input.team);
      expect(out.fteRecovered).toBeCloseTo(out.hoursRecovered / ANNUAL_ENG_HOURS);
    }
  });

  it("scales linearly with team size", () => {
    const small = at({ team: 60 });
    const large = at({ team: 120 });
    expect(large.tier).toBe(small.tier);
    expect(large.hoursRecovered).toBe(small.hoursRecovered * 2);
  });
});

/** Consecutive overlapping pairs, so ordering assertions need no indexing. */
function pairs<T>(items: readonly T[]): Array<[T, T]> {
  const out: Array<[T, T]> = [];
  let previous: T | undefined;
  for (const item of items) {
    if (previous !== undefined) out.push([previous, item]);
    previous = item;
  }
  return out;
}

/** Every reachable input combination, sampled on the slider steps the UI uses. */
function allInputs(): RoiInput[] {
  const out: RoiInput[] = [];
  for (let images = 10; images <= 500; images += 10) {
    for (let team = 5; team <= 200; team += 5) {
      for (const remediation of REMEDIATION_OPTIONS as readonly RemediationOption[]) {
        for (const release of RELEASE_OPTIONS as readonly ReleaseOption[]) {
          out.push({ images, team, remediation, release });
        }
      }
    }
  }
  return out;
}
