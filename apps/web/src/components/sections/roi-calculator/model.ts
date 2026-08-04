/*
 * CleanStart Operational Impact model — the single source of truth for the
 * ROI calculator's math. Pure, deterministic, dependency-free so it can be unit
 * tested and reasoned about in isolation from the UI.
 *
 * Pipeline: four inputs → 1–4 weights → a blended Operational Burden Score →
 * a Runtime Complexity tier → five interpolated operational outcomes.
 *
 * NAMING IS CLIENT-OWNED TOO. The outcome names surfaced in the UI (Vulnerability
 * Noise Reduction, Patch Cycle Overhead Reduction, Faster Secure Releases,
 * Runtime Footprint Reduction, Engineering Hours Recovered) come from ROI 1.xlsx
 * §RESULTS and its Sheet2 mapping table, which records what each term replaced
 * and why. Rephrasing them de-syncs the site from the sales deck. Note the sheet
 * is internally inconsistent: its tier table header row uses shorter labels
 * ("Vulnerability Reduction", "Engineering Recovery"); §RESULTS and Sheet2 agree
 * with each other, so those win.
 *
 * SCORING IS CLIENT-OWNED. Every band, weight and constant below is transcribed
 * from the client's `ROI 1.xlsx` §"Background Scoring & Logic" and must not be
 * "improved" without their sign-off — the same tables drive their sales
 * collateral, so any divergence makes the site and the deck disagree. An earlier
 * revision replaced the discrete image/team bands with a continuous log curve;
 * it read better on a slider but silently moved 13% of inputs into a different
 * tier than the client's sheet reports. See model.test.ts, which pins the sheet.
 *
 * Interpolation *within* a tier is ours, not theirs: the tier bands share
 * endpoints, so an input sitting deeper into a tier reports proportionally
 * stronger outcomes rather than a flat per-tier constant.
 */

export type RemediationOption = "Quarterly" | "Monthly" | "Weekly";
export type ReleaseOption = "Monthly" | "Biweekly" | "Continuous";
export type TierName = "Low" | "Moderate" | "High" | "Extreme";

export interface RoiInput {
  /** Production container images, 10–500. */
  images: number;
  /** Engineering team size, 5–200. */
  team: number;
  remediation: RemediationOption;
  release: ReleaseOption;
}

interface TierBand {
  vuln: readonly [number, number];
  patch: readonly [number, number];
  release: readonly [number, number];
  footprint: readonly [number, number];
  /** Fraction of an engineer's working year lost to vuln/patch toil. */
  F: number;
}

export interface RoiOutput {
  burden: number;
  tier: TierName;
  /** "Burden Reduction" — share of the score removed, as a percentage. Sheet §2. */
  burdenReduction: number;
  /** 0–1 position of the score across the full 100–360 scale (for the meter). */
  meterProgress: number;
  /** Per-input breakdown of what drives the burden score (for transparency UI). */
  contributions: BurdenContribution[];
  vuln: number;
  patch: number;
  release: number;
  footprint: number;
  hoursPerEngineer: number;
  hoursRecovered: number;
  /** Recovered hours expressed as full-time-engineer equivalents. */
  fteRecovered: number;
  bands: TierBand;
}

export interface BurdenContribution {
  label: string;
  /** Share of the score this input can contribute, as a percentage (40/20/20/20). */
  weightPct: number;
  /** This input's current level. */
  level: number;
  /** Highest level this input can reach — 4 for counts, 3 for the two cadences. */
  maxLevel: number;
  /** Points this input contributes to the burden score. */
  points: number;
}

const INPUT_RANGE = {
  images: { min: 10, max: 500 },
  team: { min: 5, max: 200 },
} as const;

/*
 * Client bands, verbatim from ROI 1.xlsx: images 0–25 / 26–100 / 101–250 /
 * 251–500 and team 1–10 / 11–50 / 51–100 / 100+. Stored as the inclusive upper
 * bound of each band except the last, so a value's weight is just how many
 * bounds it has passed, plus one — no sentinel band, no lookup table to keep in
 * step with the weights.
 *
 * The sheet writes the top team band as "100+" while the band below it is
 * "51–100"; the explicit range wins, so 100 scores 3 and 101 first scores 4.
 */
const IMAGE_THRESHOLDS: readonly number[] = [25, 100, 250];
const TEAM_THRESHOLDS: readonly number[] = [10, 50, 100];

const WEIGHTS = { image: 0.4, eng: 0.2, remediation: 0.2, release: 0.2 } as const;

/** Full working year net of PTO/meetings. Tunable; documented on the page. */
const WORK_HOURS_PER_YEAR = 1800;

const REMEDIATION_WEIGHT: Record<RemediationOption, number> = {
  Quarterly: 1,
  Monthly: 2,
  Weekly: 3,
};
const RELEASE_WEIGHT: Record<ReleaseOption, number> = {
  Monthly: 1,
  Biweekly: 2,
  Continuous: 3,
};

interface Tier {
  name: TierName;
  min: number;
  max: number;
  band: TierBand;
}

const TIER_LOW: Tier = { name: "Low", min: 100, max: 120, band: { vuln: [70, 80], patch: [25, 35], release: [1.5, 2], footprint: [40, 55], F: 0.05 } };
const TIER_MODERATE: Tier = { name: "Moderate", min: 120, max: 220, band: { vuln: [80, 88], patch: [40, 55], release: [2, 3], footprint: [55, 70], F: 0.08 } };
const TIER_HIGH: Tier = { name: "High", min: 220, max: 320, band: { vuln: [88, 95], patch: [55, 70], release: [3, 4], footprint: [70, 85], F: 0.12 } };
const TIER_EXTREME: Tier = { name: "Extreme", min: 320, max: 360, band: { vuln: [95, 97], patch: [70, 85], release: [4, 5], footprint: [85, 95], F: 0.18 } };

const TIERS: readonly Tier[] = [TIER_LOW, TIER_MODERATE, TIER_HIGH, TIER_EXTREME];

/*
 * Counts reach 4; the two cadences only offer three settings, so they top out
 * at 3. That asymmetry is what makes the scale 100–360 rather than 100–400.
 */
const MAX_COUNT_LEVEL = 4;
const MAX_CADENCE_LEVEL = 3;

const BURDEN_MIN = 100;
const BURDEN_MAX = 360;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function lerp(lo: number, hi: number, t: number): number {
  return lo + (hi - lo) * t;
}

/**
 * Sheet §"Background Scoring & Logic" item 2, transcribed literally.
 *
 * Two things to know before touching this. Its cut points sit exactly 30 above
 * the tier boundaries (150/250/350 against 120/220/320), which makes this figure
 * disagree with the gauge at four reachable scores — a burden of 140 reads
 * "Moderate" but reports the Low-tier reduction. Kept as written pending the
 * client's confirmation that the offset is deliberate.
 *
 * The sheet's own bands also overlap at 250 and 350, each appearing in two
 * branches. The comparisons below take the sheet's first-match reading, but the
 * distinction is unreachable: every attainable score is a multiple of 20.
 */
function burdenReductionFor(burden: number): number {
  if (burden < 150) return 70;
  if (burden <= 250) return 82;
  if (burden <= 350) return 92;
  return 97;
}

/**
 * Score a count against the client's discrete bands: the 1-based index of the
 * band it falls in. A value above every threshold takes the top weight.
 */
export function bandWeight(value: number, thresholds: readonly number[]): number {
  const i = thresholds.findIndex((t) => value <= t);
  return (i === -1 ? thresholds.length : i) + 1;
}

export function computeImpact(input: RoiInput): RoiOutput {
  const imgW = bandWeight(input.images, IMAGE_THRESHOLDS);
  const engW = bandWeight(input.team, TEAM_THRESHOLDS);
  const remW = REMEDIATION_WEIGHT[input.remediation];
  const relW = RELEASE_WEIGHT[input.release];

  /*
   * Rounded because the weights are non-terminating in binary: the Low/Moderate
   * boundary computes as 120.00000000000001, which would fail a `<= 120` tier
   * test and report the wrong tier. Every reachable score sits exactly on one of
   * the client's cut points, so this is load-bearing, not cosmetic.
   */
  const burden =
    Math.round(
      (imgW * WEIGHTS.image + engW * WEIGHTS.eng + remW * WEIGHTS.remediation + relW * WEIGHTS.release) * 100 * 1e6,
    ) / 1e6;

  const tier = TIERS.find((t) => burden <= t.max) ?? TIER_EXTREME;
  const t = clamp01((burden - tier.min) / (tier.max - tier.min));
  const band = tier.band;

  const vuln = lerp(band.vuln[0], band.vuln[1], t);
  const patch = lerp(band.patch[0], band.patch[1], t);
  const release = lerp(band.release[0], band.release[1], t);
  const footprint = lerp(band.footprint[0], band.footprint[1], t);

  // Round per-engineer to the nearest 5 so total = perEngineer × team stays
  // internally consistent (no "196 × 50 ≠ 9,800" display drift).
  const hoursPerEngineer = Math.round((WORK_HOURS_PER_YEAR * band.F * (vuln / 100)) / 5) * 5;
  const hoursRecovered = hoursPerEngineer * input.team;
  const fteRecovered = hoursRecovered / WORK_HOURS_PER_YEAR;

  const contributions: BurdenContribution[] = [
    { label: "Number of Production Images", weightPct: WEIGHTS.image * 100, level: imgW, maxLevel: MAX_COUNT_LEVEL, points: imgW * WEIGHTS.image * 100 },
    { label: "Engineering Team Size", weightPct: WEIGHTS.eng * 100, level: engW, maxLevel: MAX_COUNT_LEVEL, points: engW * WEIGHTS.eng * 100 },
    { label: "Remediation Frequency", weightPct: WEIGHTS.remediation * 100, level: remW, maxLevel: MAX_CADENCE_LEVEL, points: remW * WEIGHTS.remediation * 100 },
    { label: "Release Cadence", weightPct: WEIGHTS.release * 100, level: relW, maxLevel: MAX_CADENCE_LEVEL, points: relW * WEIGHTS.release * 100 },
  ];

  return {
    burden,
    tier: tier.name,
    burdenReduction: burdenReductionFor(burden),
    meterProgress: clamp01((burden - BURDEN_MIN) / (BURDEN_MAX - BURDEN_MIN)),
    contributions,
    vuln,
    patch,
    release,
    footprint,
    hoursPerEngineer,
    hoursRecovered,
    fteRecovered,
    bands: band,
  };
}

export const REMEDIATION_OPTIONS: readonly RemediationOption[] = ["Quarterly", "Monthly", "Weekly"];
export const RELEASE_OPTIONS: readonly ReleaseOption[] = ["Monthly", "Biweekly", "Continuous"];
export const TIER_NAMES: readonly TierName[] = ["Low", "Moderate", "High", "Extreme"];
export const INPUT_BOUNDS = INPUT_RANGE;
/* Exported so the sliders can tick the exact counts at which the score steps. */
export const IMAGE_WEIGHT_THRESHOLDS = IMAGE_THRESHOLDS;
export const TEAM_WEIGHT_THRESHOLDS = TEAM_THRESHOLDS;
export const COUNT_LEVELS = MAX_COUNT_LEVEL;
export const BURDEN_SCALE = { min: BURDEN_MIN, max: BURDEN_MAX } as const;
export const ANNUAL_ENG_HOURS = WORK_HOURS_PER_YEAR;
