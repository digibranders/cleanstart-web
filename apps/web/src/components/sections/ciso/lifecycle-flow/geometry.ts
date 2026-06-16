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

/** Smooth cubic arc from `a` to `b`, bowed perpendicular by `bow` px (both
 *  control points offset ⇒ a soft, even curve, not a peaked hump). For a
 *  left-to-right line, positive `bow` lifts the curve up, negative drops it. */
const bowCurve = (a: Pt, b: Pt, bow: number): string => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = dy / len; // perpendicular x (+bow ⇒ up for L→R)
  const py = -dx / len; // perpendicular y
  const c1x = a.x + dx * 0.3 + px * bow;
  const c1y = a.y + dy * 0.3 + py * bow;
  const c2x = a.x + dx * 0.7 + px * bow;
  const c2y = a.y + dy * 0.7 + py * bow;
  return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
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
  runtime: { cx: 642, cy: 392, r: 34, pal: "violet", label: "Runtime Workloads" },
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

/* ------------------------------ ecosystem mesh ---------------------------- */

export interface MeshDot {
  x: number;
  y: number;
  r: number;
  o: number;
}
export interface MeshEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  o: number;
}

/** Deterministic PRNG (mulberry32) so SSR and client generate the identical
 *  mesh — a runtime `Math.random()` would cause a hydration mismatch. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Centre + radii of the ecosystem cloud. Deliberately WIDER than the labeled
 *  node cluster (which spans ~x435–851) so the constellation spreads beyond the
 *  registry graph, per the reference. Also drives the orbit rings + gradient. */
export const MESH = { cx: 642, cy: 250, rx: 280, ry: 185 } as const;
/** Horizontal span for the purple→cyan gradient. */
export const MESH_BBOX = { x1: MESH.cx - MESH.rx, x2: MESH.cx + MESH.rx } as const;

/** Rail attachment points: peripheral MESH nodes (not the labeled graph nodes),
 *  on the cloud's left/right edge at the rail heights. Positioned clear of the
 *  node text labels — top ports above/outside "Code & Repositories" /
 *  "Build Systems"; bottom ports below "Dependencies" / "Deployments". They're
 *  woven into the web, so the rails connect to the constellation, not a node. */
export const LEFT_PORTS: Pt[] = [
  { x: 424, y: 152 },
  { x: 424, y: 262 },
  { x: 446, y: 376 },
];
export const RIGHT_PORTS: Pt[] = [
  { x: 860, y: 152 },
  { x: 860, y: 262 },
  { x: 838, y: 376 },
];

function buildMesh(): { dots: MeshDot[]; edges: MeshEdge[] } {
  const rand = mulberry32(0x5eed_1337);
  const anchors = (Object.keys(NODES) as NodeKey[]).map((k) => ({
    x: NODES[k].cx,
    y: NODES[k].cy,
    r: NODES[k].r,
  }));
  const ports = [...LEFT_PORTS, ...RIGHT_PORTS];

  const dots: MeshDot[] = [];
  // Graph = labeled anchors + rail ports + scattered particles. Anchors and
  // ports get edges (so the web ties them in) but are NOT drawn as mesh dots —
  // anchors render as the labeled nodes, ports as rail-coloured connectors.
  const graph: Pt[] = [...anchors.map((a) => ({ x: a.x, y: a.y })), ...ports];

  let guard = 0;
  while (dots.length < 62 && guard < 7000) {
    guard += 1;
    const theta = rand() * Math.PI * 2;
    const rad = rand() ** 0.9; // near-even fill, slight centre bias
    const x = MESH.cx + Math.cos(theta) * MESH.rx * rad;
    const y = MESH.cy + Math.sin(theta) * MESH.ry * rad;
    // keep clear of the labeled icons, the ports, and other dots
    if (anchors.some((a) => Math.hypot(a.x - x, a.y - y) < a.r + 12)) continue;
    if (ports.some((p) => Math.hypot(p.x - x, p.y - y) < 15)) continue;
    if (dots.some((d) => Math.hypot(d.x - x, d.y - y) < 16)) continue;
    dots.push({ x, y, r: 1.2 + rand() * 1.9, o: 0.42 + rand() * 0.42 });
    graph.push({ x, y });
  }

  // Edges: connect each graph node to its 2 nearest neighbours within maxD.
  const maxD = 108;
  const seen = new Set<string>();
  const edges: MeshEdge[] = [];
  for (let i = 0; i < graph.length; i += 1) {
    const a = graph[i];
    if (!a) continue;
    const near = graph
      .map((b, j) => ({
        j,
        d: j === i || !b ? Number.POSITIVE_INFINITY : Math.hypot(b.x - a.x, b.y - a.y),
      }))
      .filter((o) => o.d <= maxD)
      .sort((p, q) => p.d - q.d)
      .slice(0, 2);
    for (const { j, d } of near) {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const b = graph[j];
      if (!b) continue;
      edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, o: 0.3 * (1 - d / (maxD * 1.5)) + 0.07 });
    }
  }
  return { dots, edges };
}

export const MESH_DATA = buildMesh();

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

/** Each risk line runs from its source to its own LEFT_PORT on the cloud's
 *  edge; each impact line runs from its RIGHT_PORT out to its card. The rails
 *  thus connect to the constellation, and the web carries the signal inward. */
const LEFT_SOURCE_X = [312, 312, 332];
export const LEFT_SOURCE_DOTS: Pt[] = LEFT_ITEMS.map((item, i) => ({
  x: LEFT_SOURCE_X[i] ?? 332,
  y: item.cy,
}));
/** Risk rails CONVERGE into the cloud (top curves down, bottom curves up);
 *  impact rails DIVERGE out to the cards (top up, bottom down) — a flow-through
 *  "≻ … ≺" read. Magnitudes keep every curve clear of the node text labels. */
const LEFT_BOW = [-30, -16, 26];
const RIGHT_BOW = [30, 16, -26];
export const LEFT_FANS: string[] = LEFT_SOURCE_DOTS.map((s, i) =>
  bowCurve(s, LEFT_PORTS[i] ?? s, LEFT_BOW[i] ?? 0),
);

export const RIGHT_TARGET_DOTS: Pt[] = RIGHT_ITEMS.map((item) => ({
  x: CARD.x - 22,
  y: item.cy,
}));
export const RIGHT_FANS: string[] = RIGHT_TARGET_DOTS.map((e, i) =>
  bowCurve(RIGHT_PORTS[i] ?? e, e, RIGHT_BOW[i] ?? 0),
);

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
