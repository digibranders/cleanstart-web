/**
 * Tricorder page palette — one place for the signal and verdict colours so the
 * hero console, the context scene, the pipeline and the substrate all agree.
 * Signal accents follow the site's per-card accent set (Clean Libraries uses
 * the same blue / teal / purple / amber quartet); verdict colours are the
 * three states the product returns.
 */
export const SIGNAL = {
  history: "#5b9bff",
  behavior: "#2dd4bf",
  relationships: "#a974ff",
  intel: "#f7a35c",
} as const;

export const VERDICT = {
  malicious: "#f43f5e",
  uncertain: "#f7a35c",
  pass: "#2dd4bf",
} as const;

export const INK = "#111111";
export const INK_MUTED = "#555555";
