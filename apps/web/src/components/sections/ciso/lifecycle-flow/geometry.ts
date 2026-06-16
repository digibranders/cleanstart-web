/**
 * Single source of truth for the CISO "interconnected software ecosystem"
 * diagram.
 *
 * Concept (from the client reference): risk CONVERGES from a few sources, flows
 * THROUGH a dense interconnected ecosystem whose nexus is the Artifact
 * Registry, then DIVERGES into operational impact — all underpinned by a
 * continuous governance layer.
 *
 * Every coordinate lives in the SVG view-box space (`VB.w × VB.h`). The SVG
 * connector/mesh layer draws in that exact space AND the HTML nodes/cards are
 * placed with `pctX`/`pctY` from the same numbers, so everything stays aligned
 * at any width with zero drift. Footprint matches the raster it replaced.
 */

export const VB = { w: 1276, h: 642 } as const;

export type PaletteKey =
  | "red"
  | "violet"
  | "purple"
  | "blue"
  | "cyan"
  | "teal"
  | "hub";

export interface Palette {
  ring: string;
  glow: string;
  icon: string;
}

export const PALETTE: Record<PaletteKey, Palette> = {
  red: { ring: "#FF4D6D", glow: "rgba(255,77,109,0.45)", icon: "#FF6B85" },
  violet: { ring: "#9A5BFF", glow: "rgba(154,91,255,0.45)", icon: "#B58BFF" },
  purple: { ring: "#6C5BFF", glow: "rgba(108,91,255,0.45)", icon: "#9E97FF" },
  blue: { ring: "#3AA0FF", glow: "rgba(58,160,255,0.42)", icon: "#5BB0FF" },
  cyan: { ring: "#2CC1EB", glow: "rgba(44,193,235,0.42)", icon: "#5BD6F2" },
  teal: { ring: "#2DE0A6", glow: "rgba(45,224,166,0.40)", icon: "#3DE6B0" },
  hub: { ring: "#9A7DFF", glow: "rgba(124,108,255,0.55)", icon: "#FFFFFF" },
} as const;

/* --------------------------------- helpers -------------------------------- */

export const pctX = (x: number): string => `${(x / VB.w) * 100}%`;
export const pctY = (y: number): string => `${(y / VB.h) * 100}%`;
export const pctW = (v: number): string => `${(v / VB.w) * 100}%`;
export const pctH = (v: number): string => `${(v / VB.h) * 100}%`;
/** View-box length as a container-query width unit (resolves against the
 *  `containerType: inline-size` canvas — correct even inside flex). */
export const cqw = (v: number): string => `${(v / VB.w) * 100}cqw`;

interface Pt {
  x: number;
  y: number;
}
interface Circle {
  cx: number;
  cy: number;
  r: number;
}

/** Point on `c`'s edge pointing toward centre `t`. */
function edge(c: Circle, t: { cx: number; cy: number }): Pt {
  const dx = t.cx - c.cx;
  const dy = t.cy - c.cy;
  const len = Math.hypot(dx, dy) || 1;
  return { x: c.cx + (dx / len) * c.r, y: c.cy + (dy / len) * c.r };
}

/** Smooth cubic S-curve from `a` to `b` (horizontal handles ⇒ leaves/arrives
 *  level; the vertical travel toward the single merge point gives the arc). */
const sCurve = (a: Pt, b: Pt): string => {
  const d = b.x - a.x;
  return `M ${a.x} ${a.y} C ${a.x + d * 0.5} ${a.y}, ${b.x - d * 0.45} ${b.y}, ${b.x} ${b.y}`;
};

/* --------------------------------- nodes ---------------------------------- */

export interface FlowNodeDef extends Circle {
  pal: PaletteKey;
  label: string;
}

/** Labeled ecosystem nodes (the hub-and-spoke graph at the centre). */
export const NODES = {
  hub: { cx: 642, cy: 244, r: 52, pal: "hub", label: "Artifact Registry" },
  codeRepo: { cx: 512, cy: 118, r: 38, pal: "purple", label: "Code & Repositories" },
  build: { cx: 772, cy: 118, r: 38, pal: "blue", label: "Build Systems" },
  deps: { cx: 470, cy: 296, r: 35, pal: "violet", label: "Dependencies" },
  deploy: { cx: 814, cy: 296, r: 37, pal: "cyan", label: "Deployments" },
  runtime: { cx: 642, cy: 380, r: 34, pal: "violet", label: "Runtime Workloads" },
} satisfies Record<string, FlowNodeDef>;

export type NodeKey = keyof typeof NODES;

export interface Spoke {
  d: string;
  a: Pt;
  b: Pt;
  pal: PaletteKey;
}

/** Hub spokes (satellite edge → hub edge). */
const SPOKE_KEYS: NodeKey[] = ["codeRepo", "build", "deps", "deploy", "runtime"];
export const SPOKES: Spoke[] = SPOKE_KEYS.map((k) => {
  const n = NODES[k];
  const a = edge(n, NODES.hub);
  const b = edge(NODES.hub, n);
  return { d: `M ${a.x} ${a.y} L ${b.x} ${b.y}`, a, b, pal: n.pal };
});

/** Faint ring linking adjacent labeled nodes (the "interconnected" feel). */
const RING_PAIRS: [NodeKey, NodeKey][] = [
  ["codeRepo", "build"],
  ["build", "deploy"],
  ["deploy", "runtime"],
  ["runtime", "deps"],
  ["deps", "codeRepo"],
];
export const RING_LINKS: string[] = RING_PAIRS.map(([a, b]) => {
  const pa = edge(NODES[a], NODES[b]);
  const pb = edge(NODES[b], NODES[a]);
  return `M ${pa.x} ${pa.y} L ${pb.x} ${pb.y}`;
});

/* ---------------------------- secure enclave (hex) ------------------------ */

/** The hexagonal "secure enclave" that encloses the cluster — echoes the
 *  CleanStart hex mark and the Artifact Registry icon. `rx` = half-width to the
 *  left/right points (= the rail ports), `ry` = half-height to the flat top/
 *  bottom edges. Sized to contain every node + label, clearing the eyebrow row
 *  above and the governance panel below. Drives the purple→cyan rim gradient. */
export const MESH = { cx: 642, cy: 248, rx: 272, ry: 206 } as const;
export const MESH_BBOX = { x1: MESH.cx - MESH.rx, x2: MESH.cx + MESH.rx } as const;

/** Flat-top hexagon vertices (clockwise from top-left). The left/right points
 *  are the rail attachment ports. The high flat-edge ratio keeps the corner
 *  pinch gentle so the wide node labels clear the slanted edges. */
const HEX_W2 = Math.round(MESH.rx * 0.77); // flat top/bottom edge half-width
export const HEX_POINTS: [number, number][] = [
  [MESH.cx - HEX_W2, MESH.cy - MESH.ry],
  [MESH.cx + HEX_W2, MESH.cy - MESH.ry],
  [MESH.cx + MESH.rx, MESH.cy],
  [MESH.cx + HEX_W2, MESH.cy + MESH.ry],
  [MESH.cx - HEX_W2, MESH.cy + MESH.ry],
  [MESH.cx - MESH.rx, MESH.cy],
];

/* ------------------------------- side rails ------------------------------- */

export interface SideItemDef {
  cy: number;
  pal: PaletteKey;
  title: string;
  desc: [string, string];
}

/** Risk-source rows (left rail) — 3 items per the reference. */
export const LEFT_ICON = { cx: 64, r: 31 } as const;
export const LEFT_ITEMS: SideItemDef[] = [
  { cy: 146, pal: "red", title: "Open Source", desc: ["Vulnerabilities and", "license risks"] },
  { cy: 266, pal: "violet", title: "AI-Generated Code", desc: ["Unverified and", "opaque outputs"] },
  { cy: 386, pal: "violet", title: "Third-Party Dependencies", desc: ["Transitive and", "hidden exposure"] },
];

/** Operational-impact cards (right rail) — 3 items per the reference. */
export const CARD = { x: 1000, w: 276, h: 92 } as const;
export const RIGHT_ITEMS: SideItemDef[] = [
  { cy: 146, pal: "cyan", title: "Compliance Drift", desc: ["Policy and regulatory", "non-compliance"] },
  { cy: 266, pal: "cyan", title: "Operational Exposure", desc: ["Misconfigurations", "and weak controls"] },
  { cy: 386, pal: "teal", title: "Vulnerable Workloads", desc: ["Exploitable", "vulnerabilities"] },
];

/* --------------------------- dashed connectors ----------------------------
 * Per the reference, each rail line blends into the ecosystem at its OWN point
 * (clustered around the Dependencies entry / Deployments exit nodes) rather
 * than collapsing to a single merge dot. The labeled nodes already wire into
 * the hub, so risk flows registry-ward and impact radiates out.
 */

/** Both rails meet the graph at ONE point per side — the Dependencies node
 *  (left entry) and the Deployments node (right exit), tucked just inside each
 *  ring. The three lines fan into / out of that single point. */
const LEFT_SOURCE_X = [312, 312, 332];
export const LEFT_SOURCE_DOTS: Pt[] = LEFT_ITEMS.map((item, i) => ({
  x: LEFT_SOURCE_X[i] ?? 332,
  y: item.cy,
}));
export const LEFT_MERGE: Pt = { x: MESH.cx - MESH.rx, y: MESH.cy };
export const RIGHT_BRANCH: Pt = { x: MESH.cx + MESH.rx, y: MESH.cy };
export const LEFT_FANS: string[] = LEFT_SOURCE_DOTS.map((s) => sCurve(s, LEFT_MERGE));

export const RIGHT_TARGET_DOTS: Pt[] = RIGHT_ITEMS.map((item) => ({
  x: CARD.x - 22,
  y: item.cy,
}));
export const RIGHT_FANS: string[] = RIGHT_TARGET_DOTS.map((e) => sCurve(RIGHT_BRANCH, e));

/* ------------------------------ governance -------------------------------- */

export interface GovItemDef {
  cx: number;
  title: string;
  desc: [string, string];
}

/** Bottom "Continuous Governance Layer" panel box. */
export const GOV_PANEL = { x: 60, y: 488, w: 1156, h: 142 } as const;

export const GOV_ITEMS: GovItemDef[] = [
  { cx: 150, title: "Continuous Visibility", desc: ["See everything.", "Continuously."] },
  { cx: 432, title: "Provenance & Integrity", desc: ["Know the origin.", "Trust the path."] },
  { cx: 714, title: "Policy Enforcement", desc: ["Enforce standards.", "Reduce risk."] },
  { cx: 988, title: "Compliance Evidence", desc: ["Generate audit-ready", "proof. Instantly."] },
];

/** Vertical dividers between the four governance items (view-box X). */
export const GOV_DIVIDERS = [294, 576, 852] as const;

export const GOV_TITLE_Y = 522;
export const GOV_ROW_Y = 582;
