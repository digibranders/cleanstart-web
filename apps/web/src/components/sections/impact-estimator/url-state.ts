/*
 * The estimator's inputs live in the URL so a result can be shared by link
 * without anything leaving the browser. Parsing is deliberately forgiving on
 * the way in (case, clamping, snapping) and strict on the way out (a stable
 * key order), so a hand-edited or truncated link still lands on a valid state
 * and two identical states always produce byte-identical links.
 */

import {
  INPUT_BOUNDS,
  RELEASE_OPTIONS,
  REMEDIATION_OPTIONS,
  type ReleaseOption,
  type RemediationOption,
  type RoiInput,
} from "./model";

/** Slider steps. Kept beside the parser because snapping depends on them. */
export const INPUT_STEP = { images: 10, team: 5 } as const;

/*
 * Mid-band on both counts. 250 images and 50 engineers were the top values of
 * their bands, so the first nudge of either slider changed the tier, which read
 * as staged.
 */
export const DEFAULT_INPUT: RoiInput = {
  images: 200,
  team: 40,
  remediation: "Monthly",
  release: "Continuous",
};

function readCount(
  raw: string | null,
  bounds: { readonly min: number; readonly max: number },
  step: number,
): number | undefined {
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const clamped = Math.min(bounds.max, Math.max(bounds.min, n));
  return Math.round(clamped / step) * step;
}

function readOption<T extends string>(raw: string | null, options: readonly T[]): T | undefined {
  if (raw === null) return undefined;
  const needle = raw.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === needle);
}

export function parseEstimatorSearch(search: string): Partial<RoiInput> {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const out: Partial<RoiInput> = {};

  const images = readCount(params.get("images"), INPUT_BOUNDS.images, INPUT_STEP.images);
  if (images !== undefined) out.images = images;

  const team = readCount(params.get("team"), INPUT_BOUNDS.team, INPUT_STEP.team);
  if (team !== undefined) out.team = team;

  const remediation = readOption<RemediationOption>(params.get("remediation"), REMEDIATION_OPTIONS);
  if (remediation !== undefined) out.remediation = remediation;

  const release = readOption<ReleaseOption>(params.get("release"), RELEASE_OPTIONS);
  if (release !== undefined) out.release = release;

  return out;
}

export function buildEstimatorSearch(input: RoiInput): string {
  const params = new URLSearchParams();
  params.set("images", String(input.images));
  params.set("team", String(input.team));
  params.set("remediation", input.remediation);
  params.set("release", input.release);
  return `?${params.toString()}`;
}
