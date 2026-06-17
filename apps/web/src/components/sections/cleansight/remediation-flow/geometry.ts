/**
 * Single source of truth for the remediation-flow diagram geometry.
 *
 * Every node center is expressed in the SVG view-box coordinate space
 * (`VB.w × VB.h`). The desktop layout draws connectors in that exact view-box
 * AND positions the HTML nodes/card with `pctX`/`pctY` derived from the same
 * numbers — so the SVG lines and the HTML nodes share one coordinate system
 * and stay aligned at every width with zero drift.
 */

export const VB = { w: 1276, h: 405 } as const;

/** Node radius in view-box units (diameter 100). */
export const NODE_R = 50;

export type StageKey = "vuln" | "comp" | "images" | "envs" | "impact";

export interface StagePalette {
  /** Ring / border colour. */
  ring: string;
  /** Outer halo colour (rgba). */
  glow: string;
  /** Icon stroke colour. */
  icon: string;
  /** Uppercase label gradient. */
  label: string;
}

export const PALETTE: Record<StageKey, StagePalette> = {
  vuln: {
    ring: "#FF4D6D",
    glow: "rgba(255, 77, 109, 0.45)",
    icon: "#FF6B85",
    label: "linear-gradient(90deg, #FF5C72 0%, #FF9A6B 100%)",
  },
  comp: {
    ring: "#6C5BFF",
    glow: "rgba(108, 91, 255, 0.45)",
    icon: "#8AA0FF",
    label: "linear-gradient(90deg, #9A8DFF 0%, #5B8DFF 100%)",
  },
  images: {
    ring: "#2DE0A6",
    glow: "rgba(45, 224, 166, 0.40)",
    icon: "#3DE6B0",
    label: "linear-gradient(90deg, #2DE0A6 0%, #2CC1EB 100%)",
  },
  envs: {
    ring: "#3AA0FF",
    glow: "rgba(58, 160, 255, 0.40)",
    icon: "#5BB0FF",
    label: "linear-gradient(90deg, #5BA8FF 0%, #3A86FF 100%)",
  },
  impact: {
    ring: "#2CC1EB",
    glow: "rgba(44, 193, 235, 0.40)",
    icon: "#2DE0A6",
    label: "linear-gradient(90deg, #2CC1EB 0%, #9A51FF 100%)",
  },
} as const;

/** Node centres in view-box units. */
export const NODES = {
  vuln: { cx: 150, cy: 200 },
  comp: { cx: 410, cy: 200 },
  imgTop: { cx: 662, cy: 138 },
  imgBot: { cx: 662, cy: 262 },
  envTop: { cx: 910, cy: 138 },
  envBot: { cx: 910, cy: 262 },
} as const;

/** Impact card box in view-box units. */
export const CARD = { x: 1058, y: 56, w: 218, h: 300 } as const;

/** Point where the two environment curves merge before the arrow. */
const MERGE = { x: 1010, y: 200 } as const;

/** Convert a view-box X/Y to a percentage string for HTML positioning. */
export const pctX = (x: number): string => `${(x / VB.w) * 100}%`;
export const pctY = (y: number): string => `${(y / VB.h) * 100}%`;
/** Convert a view-box length to a percentage of the canvas width (for cqw-free sizing). */
export const pctW = (v: number): string => `${(v / VB.w) * 100}%`;

const R = NODE_R;

/**
 * Connector path strings, all derived from `NODES` so the lines always meet the
 * node edges. Cubic controls pull horizontally for clean S-curves.
 */
export const PATHS = {
  /** Vulnerability → Affected Component (straight). */
  vulnComp: `M ${NODES.vuln.cx + R} ${NODES.vuln.cy} H ${NODES.comp.cx - R}`,

  /** Affected Component → top image (branch up). */
  compImgTop: `M ${NODES.comp.cx + R} ${NODES.comp.cy} C ${NODES.comp.cx + R + 90} ${NODES.comp.cy}, ${NODES.imgTop.cx - R - 90} ${NODES.imgTop.cy}, ${NODES.imgTop.cx - R} ${NODES.imgTop.cy}`,
  /** Affected Component → bottom image (branch down). */
  compImgBot: `M ${NODES.comp.cx + R} ${NODES.comp.cy} C ${NODES.comp.cx + R + 90} ${NODES.comp.cy}, ${NODES.imgBot.cx - R - 90} ${NODES.imgBot.cy}, ${NODES.imgBot.cx - R} ${NODES.imgBot.cy}`,

  /** Top image → top environment (dashed). */
  imgEnvTop: `M ${NODES.imgTop.cx + R} ${NODES.imgTop.cy} H ${NODES.envTop.cx - R}`,
  /** Bottom image → bottom environment (dashed). */
  imgEnvBot: `M ${NODES.imgBot.cx + R} ${NODES.imgBot.cy} H ${NODES.envBot.cx - R}`,

  /** Top environment → merge point. */
  envMergeTop: `M ${NODES.envTop.cx + R} ${NODES.envTop.cy} C ${NODES.envTop.cx + R + 45} ${NODES.envTop.cy}, ${MERGE.x} ${MERGE.y - 35}, ${MERGE.x} ${MERGE.y}`,
  /** Bottom environment → merge point. */
  envMergeBot: `M ${NODES.envBot.cx + R} ${NODES.envBot.cy} C ${NODES.envBot.cx + R + 45} ${NODES.envBot.cy}, ${MERGE.x} ${MERGE.y + 35}, ${MERGE.x} ${MERGE.y}`,
  /** Merge point → card (the arrow shaft). */
  arrow: `M ${MERGE.x} ${MERGE.y} H ${CARD.x - 12}`,
} as const;

/** Arrowhead tip just before the card. */
export const ARROW_HEAD = {
  tipX: CARD.x - 2,
  y: MERGE.y,
  size: 7,
} as const;

/** Dashed-segment endpoint dots. */
export const DASH_DOTS = [
  { x: NODES.imgTop.cx + R, y: NODES.imgTop.cy, key: "images" as StageKey },
  { x: NODES.imgBot.cx + R, y: NODES.imgBot.cy, key: "images" as StageKey },
  { x: NODES.envTop.cx - R, y: NODES.envTop.cy, key: "envs" as StageKey },
  { x: NODES.envBot.cx - R, y: NODES.envBot.cy, key: "envs" as StageKey },
] as const;
