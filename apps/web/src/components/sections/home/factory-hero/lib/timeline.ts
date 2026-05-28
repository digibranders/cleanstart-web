/**
 * 10-second loop beat map for an artifact cube.
 * See docs/superpowers/specs/2026-05-28-home-hero-animation-design.md § 4.1.
 *
 * Single source of truth for cube motion + state. Change this file to change
 * the loop — no other file references the beat windows.
 */

export const LOOP_SECONDS = 10;

/** Travel range in scene units. Cube enters from -1.0, exits at +1.0. */
const X_START = -1.0;
const X_END = 1.0;

export type CubeStage =
  | 'spawning' // 0.0–0.8s   approaching CH1
  | 'ch1' // 0.8–2.2s   intake dwell
  | 'transit-12' // 2.2–2.3s   leaving CH1, entering CH2
  | 'ch2' // 2.3–3.9s   AI logic dwell
  | 'transit-23' // 3.9–4.0s
  | 'ch3-enter' // 4.0–4.4s
  | 'ch3-cleancompile' // 4.4–5.9s  the transformation window
  | 'ch3-exit' // 5.9–6.2s
  | 'transit-34' // 6.2–6.5s
  | 'ch4' // 6.5–8.0s   attest dwell
  | 'exiting'; // 8.0–10.0s  glide out

export type CubeMaterial = 'dirty' | 'transforming' | 'clean';

export interface CubePhase {
  stage: CubeStage;
  /** 0..1 progress through the current stage. */
  dwell: number;
  /** Scene-units X position at this time. Linear interpolation across the loop. */
  x: number;
  material: CubeMaterial;
}

interface Window {
  stage: CubeStage;
  start: number;
  end: number;
  material: CubeMaterial;
}

const FINAL_WINDOW: Window = {
  stage: 'exiting',
  start: 8.0,
  end: 10.0,
  material: 'clean',
};

const WINDOWS: Window[] = [
  { stage: 'spawning', start: 0.0, end: 0.8, material: 'dirty' },
  { stage: 'ch1', start: 0.8, end: 2.2, material: 'dirty' },
  { stage: 'transit-12', start: 2.2, end: 2.3, material: 'dirty' },
  { stage: 'ch2', start: 2.3, end: 3.9, material: 'dirty' },
  { stage: 'transit-23', start: 3.9, end: 4.0, material: 'dirty' },
  { stage: 'ch3-enter', start: 4.0, end: 4.4, material: 'dirty' },
  { stage: 'ch3-cleancompile', start: 4.4, end: 5.9, material: 'transforming' },
  { stage: 'ch3-exit', start: 5.9, end: 6.2, material: 'clean' },
  { stage: 'transit-34', start: 6.2, end: 6.5, material: 'clean' },
  { stage: 'ch4', start: 6.5, end: 8.0, material: 'clean' },
  FINAL_WINDOW,
];

/**
 * @param time absolute time in seconds (any positive value; will be modulo-wrapped to the 10s loop)
 * @param offset cube's phase offset (e.g. 5.0 for the second cube)
 */
export function getCubePhase(time: number, offset = 0): CubePhase {
  const t = (((time - offset) % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
  const window = WINDOWS.find((w) => t >= w.start && t < w.end) ?? FINAL_WINDOW;
  const dwell = (t - window.start) / (window.end - window.start);
  const x = X_START + (X_END - X_START) * (t / LOOP_SECONDS);
  return { stage: window.stage, dwell, x, material: window.material };
}
