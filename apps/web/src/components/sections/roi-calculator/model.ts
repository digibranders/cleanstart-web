/*
 * CleanStart Operational Impact model — the single source of truth for the
 * ROI calculator's math. Pure, deterministic, dependency-free so it can be unit
 * tested and reasoned about in isolation from the UI.
 *
 * Pipeline: four inputs → continuous 1–4 weights → a blended Burden Score →
 * a Runtime Complexity tier → five interpolated operational outcomes.
 *
 * "v2 continuous" scoring: image and team counts are normalised on a LOG scale
 * (going 10→50 images hurts more than 450→490), so every slider movement nudges
 * the score smoothly — no stepped, integer-bucket jumps. The tier bands share
 * endpoints, so interpolating within a tier stays continuous across boundaries.
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
  /** This input's current 1–4 level. */
  level: number;
  /** Points this input contributes to the burden score. */
  points: number;
}

const INPUT_RANGE = {
  images: { min: 10, max: 500 },
  team: { min: 5, max: 200 },
} as const;

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

const BURDEN_MIN = 100;
const BURDEN_MAX = 360;

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function lerp(lo: number, hi: number, t: number): number {
  return lo + (hi - lo) * t;
}

/** Log-normalise a count within [min, max] to a continuous 1–4 weight. */
function logWeight(value: number, min: number, max: number): number {
  const v = Math.max(min, Math.min(max, value));
  const norm = (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
  return 1 + 3 * clamp01(norm);
}

export function computeImpact(input: RoiInput): RoiOutput {
  const imgW = logWeight(input.images, INPUT_RANGE.images.min, INPUT_RANGE.images.max);
  const engW = logWeight(input.team, INPUT_RANGE.team.min, INPUT_RANGE.team.max);
  const remW = REMEDIATION_WEIGHT[input.remediation];
  const relW = RELEASE_WEIGHT[input.release];

  const burden =
    (imgW * WEIGHTS.image + engW * WEIGHTS.eng + remW * WEIGHTS.remediation + relW * WEIGHTS.release) * 100;

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
    { label: "Production images", weightPct: WEIGHTS.image * 100, level: imgW, points: imgW * WEIGHTS.image * 100 },
    { label: "Team size", weightPct: WEIGHTS.eng * 100, level: engW, points: engW * WEIGHTS.eng * 100 },
    { label: "Remediation", weightPct: WEIGHTS.remediation * 100, level: remW, points: remW * WEIGHTS.remediation * 100 },
    { label: "Release cadence", weightPct: WEIGHTS.release * 100, level: relW, points: relW * WEIGHTS.release * 100 },
  ];

  return {
    burden,
    tier: tier.name,
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
export const BURDEN_SCALE = { min: BURDEN_MIN, max: BURDEN_MAX } as const;
export const ANNUAL_ENG_HOURS = WORK_HOURS_PER_YEAR;
