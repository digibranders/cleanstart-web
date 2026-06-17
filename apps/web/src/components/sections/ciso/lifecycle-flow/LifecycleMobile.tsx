import type React from "react";
import type { CSSProperties } from "react";

import {
  PALETTE,
  NODES,
  LEFT_ITEMS,
  RIGHT_ITEMS,
  GOV_ITEMS,
  type Palette,
} from "./geometry";
import {
  NodeBubble,
  CLUSTER_ICONS,
  LEFT_ICONS,
  RIGHT_ICONS,
  GOV_ICONS,
  type NodeKeyT,
} from "./LifecycleFlow";
import type { IconCmp } from "./icons";

/* --------------------------- portrait coordinate space -------------------- */

const VB = { w: 360, h: 660 } as const;
const pX = (x: number): string => `${(x / VB.w) * 100}%`;
const pY = (y: number): string => `${(y / VB.h) * 100}%`;

const REGISTRY = { x: 180, y: 300, r: 52 } as const;

interface MNode {
  x: number;
  y: number;
  r: number;
}
const RISK_NODES: MNode[] = [
  { x: 60, y: 80, r: 26 },
  { x: 180, y: 80, r: 26 },
  { x: 300, y: 80, r: 26 },
];
const IMPACT_NODES: MNode[] = [
  { x: 60, y: 534, r: 26 },
  { x: 180, y: 534, r: 26 },
  { x: 300, y: 534, r: 26 },
];
/** Ecosystem nodes ringed around the registry (icon-only). */
const RING: { key: NodeKeyT; x: number; y: number; r: number }[] = [
  { key: "codeRepo", x: 112, y: 230, r: 26 },
  { key: "build", x: 248, y: 230, r: 26 },
  { key: "deps", x: 84, y: 312, r: 26 },
  { key: "deploy", x: 276, y: 312, r: 26 },
  { key: "runtime", x: 180, y: 400, r: 26 },
];

interface Pt {
  x: number;
  y: number;
}
/** Point on a circle's edge pointing toward `(tx,ty)`. */
function edgePt(cx: number, cy: number, r: number, tx: number, ty: number): Pt {
  const dx = tx - cx;
  const dy = ty - cy;
  const len = Math.hypot(dx, dy) || 1;
  return { x: cx + (dx / len) * r, y: cy + (dy / len) * r };
}

/** Vertical analogue of the desktop `sCurve` (geometry.ts): identical 0.5/0.45
 *  control ratios, but with VERTICAL tangents so the rail leaves `a` and
 *  arrives at `b` travelling straight down — the curve matches the desktop
 *  exactly, just rotated for this top→bottom flow. */
const sCurveV = (a: Pt, b: Pt): string => {
  const d = b.y - a.y;
  return `M ${a.x} ${a.y} C ${a.x} ${a.y + d * 0.5}, ${b.x} ${b.y - d * 0.45}, ${b.x} ${b.y}`;
};
/** Spokes drawn edge-to-edge (node rim → hub rim) so they never bleed inside
 *  the circles — matching the desktop hub-and-spoke gradient + opacity. */
const SPOKES = RING.map((n) => ({
  key: n.key,
  pal: NODES[n.key].pal,
  a: edgePt(n.x, n.y, n.r, REGISTRY.x, REGISTRY.y),
  b: edgePt(REGISTRY.x, REGISTRY.y, REGISTRY.r, n.x, n.y),
}));

const RISK_COLOR = "#C58BFF";
const IMPACT_COLOR = "#3FD2EE";
const LEFT_DASH = "#B36BFF";
const RIGHT_DASH = "#2CC1EB";

/* --------------------------------- node ----------------------------------- */

function CanvasNode({
  node,
  palette,
  Icon,
  pulse = false,
}: {
  node: MNode;
  palette: Palette;
  Icon: IconCmp;
  pulse?: boolean;
}): React.ReactElement {
  return (
    <div
      className="absolute z-10"
      style={{
        left: pX(node.x),
        top: pY(node.y),
        width: pX(2 * node.r),
        aspectRatio: "1",
        transform: "translate(-50%, -50%)",
      }}
    >
      <NodeBubble palette={palette} Icon={Icon} pulse={pulse} iconScale={0.46} />
    </div>
  );
}

/** Title under a risk / impact node (centred). `width` (view-box units) caps
 *  the text column; a narrower cap forces a title onto two lines. */
function NodeLabel({
  node,
  width = 116,
  children,
}: {
  node: MNode;
  width?: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="absolute z-10 -translate-x-1/2 text-center text-white"
      style={{
        left: pX(node.x),
        top: pY(node.y + node.r + 8),
        width: pX(width),
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "3.4cqw",
        lineHeight: 1.16,
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </span>
  );
}

function Eyebrow({
  x,
  y,
  color,
  children,
}: {
  x: number;
  y: number;
  color: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <span
      className="absolute z-10 whitespace-nowrap uppercase"
      style={{
        left: pX(x),
        top: pY(y),
        transform: "translate(-50%, -50%)",
        color,
        fontFamily: "var(--font-sans)",
        fontWeight: 700,
        fontSize: "3.7cqw",
        letterSpacing: "0.14em",
        textShadow: `0 0 14px ${color}55`,
      }}
    >
      {children}
    </span>
  );
}

/* --------------------------------- canvas --------------------------------- */

/** Single merge point above the hub (risk rails converge here) and branch
 *  point below it (impact rails diverge from here) — mirrors the desktop
 *  LEFT_MERGE / RIGHT_BRANCH single-point fans. */
const CONV_MERGE: Pt = { x: REGISTRY.x, y: 248 };
const DIV_BRANCH: Pt = { x: REGISTRY.x, y: 428 };
const RAIL_TOP_Y = 150; // rail start, just below the risk titles
const RAIL_BOTTOM_Y = 508; // rail end, at the impact node tops

const CONVERGE = RISK_NODES.map((n) => sCurveV({ x: n.x, y: RAIL_TOP_Y }, CONV_MERGE));
const DIVERGE = IMPACT_NODES.map((n) => sCurveV(DIV_BRANCH, { x: n.x, y: RAIL_BOTTOM_Y }));

function PortraitCanvas(): React.ReactElement {
  const canvasStyle: CSSProperties = {
    maxWidth: "420px",
    aspectRatio: `${VB.w} / ${VB.h}`,
    containerType: "inline-size",
  };
  return (
    <div className="relative mx-auto w-full" style={canvasStyle}>
      <style>{
        "@keyframes cisoMobFlow{from{stroke-dashoffset:0}to{stroke-dashoffset:-33}}" +
        ".cisom-flow{animation:cisoMobFlow 2.6s linear infinite}" +
        "@media (prefers-reduced-motion:reduce){.cisom-flow{animation:none}}"
      }</style>

      <svg
        aria-hidden
        viewBox={`0 0 ${VB.w} ${VB.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 z-0 h-full w-full"
      >
        <defs>
          <radialGradient id="mobCore" cx="50%" cy="42%" r="50%">
            <stop offset="0" stopColor="rgba(168,156,255,0.42)" />
            <stop offset="60%" stopColor="rgba(140,128,240,0.1)" />
            <stop offset="100%" stopColor="rgba(140,128,240,0)" />
          </radialGradient>
          <filter id="mobGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {SPOKES.map((s, i) => (
            <linearGradient
              key={s.key}
              id={`mobSpoke${i}`}
              gradientUnits="userSpaceOnUse"
              x1={s.a.x}
              y1={s.a.y}
              x2={s.b.x}
              y2={s.b.y}
            >
              <stop offset="0" stopColor={PALETTE[s.pal].ring} />
              <stop offset="1" stopColor={PALETTE.hub.ring} />
            </linearGradient>
          ))}
        </defs>

        {/* nucleus glow */}
        <ellipse cx={REGISTRY.x} cy={REGISTRY.y} rx={138} ry={138} fill="url(#mobCore)" />

        {/* ecosystem spokes — edge-to-edge, node→hub gradient (matches desktop) */}
        <g fill="none" strokeWidth={2} strokeLinecap="round" filter="url(#mobGlow)">
          {SPOKES.map((s, i) => (
            <path key={s.key} d={`M ${s.a.x} ${s.a.y} L ${s.b.x} ${s.b.y}`} stroke={`url(#mobSpoke${i})`} />
          ))}
        </g>

        {/* converging risk current */}
        <g fill="none" strokeWidth={2.2} strokeLinecap="round" filter="url(#mobGlow)">
          {CONVERGE.map((d, i) => (
            <path key={`c${i}`} d={d} stroke={LEFT_DASH} strokeDasharray="2 9" className="cisom-flow" />
          ))}
        </g>
        {/* diverging impact current */}
        <g fill="none" strokeWidth={2.2} strokeLinecap="round" filter="url(#mobGlow)">
          {DIVERGE.map((d, i) => (
            <path key={`d${i}`} d={d} stroke={RIGHT_DASH} strokeDasharray="2 9" className="cisom-flow" />
          ))}
        </g>
      </svg>

      {/* eyebrows: risk above its nodes, impact below its nodes/titles. */}
      <Eyebrow x={180} y={22} color={RISK_COLOR}>
        Risk Sources
      </Eyebrow>
      <Eyebrow x={180} y={638} color={IMPACT_COLOR}>
        Operational Impact
      </Eyebrow>

      {/* risk nodes + titles */}
      {RISK_NODES.map((node, i) => {
        const item = LEFT_ITEMS[i];
        const Icon = LEFT_ICONS[i];
        if (!item || !Icon) return null;
        return (
          <div key={item.title}>
            <CanvasNode node={node} palette={PALETTE[item.pal]} Icon={Icon} />
            <NodeLabel node={node}>{item.title}</NodeLabel>
          </div>
        );
      })}

      {/* ecosystem: registry hero + icon ring */}
      <CanvasNode
        node={{ x: REGISTRY.x, y: REGISTRY.y, r: REGISTRY.r }}
        palette={PALETTE.hub}
        Icon={CLUSTER_ICONS.hub}
        pulse
      />
      {RING.map((n) => (
        <CanvasNode
          key={n.key}
          node={{ x: n.x, y: n.y, r: n.r }}
          palette={PALETTE[NODES[n.key].pal]}
          Icon={CLUSTER_ICONS[n.key]}
        />
      ))}

      {/* impact nodes + titles */}
      {IMPACT_NODES.map((node, i) => {
        const item = RIGHT_ITEMS[i];
        const Icon = RIGHT_ICONS[i];
        if (!item || !Icon) return null;
        return (
          <div key={item.title}>
            <CanvasNode node={node} palette={PALETTE[item.pal]} Icon={Icon} />
            {/* Narrow cap so all three impact titles sit on two lines. */}
            <NodeLabel node={node} width={88}>
              {item.title}
            </NodeLabel>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- governance ------------------------------- */

const GOV_TITLE: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "var(--fs-h5)",
  letterSpacing: "0.1em",
};

function GovernancePanel(): React.ReactElement {
  return (
    <div
      className="mt-7"
      style={{
        border: "1px solid rgba(124,108,255,0.3)",
        background: "linear-gradient(180deg, rgba(30,26,72,0.42) 0%, rgba(14,16,52,0.42) 100%)",
        borderRadius: "18px",
        padding: "22px 18px",
      }}
    >
      <p className="text-center uppercase text-white" style={{ ...GOV_TITLE, marginBottom: "20px" }}>
        Continuous Governance Layer
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {GOV_ITEMS.map((g, i) => {
          const Icon = GOV_ICONS[i];
          if (!Icon) return null;
          return (
            <div key={g.title} className="flex items-center gap-3">
              <div style={{ width: 42, height: 42, flexShrink: 0 }}>
                <NodeBubble palette={PALETTE.purple} Icon={Icon} iconScale={0.46} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-white"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "var(--fs-body-sm)",
                    lineHeight: 1.2,
                  }}
                >
                  {g.title}
                </p>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-caption)",
                    lineHeight: 1.3,
                    color: "rgba(255,255,255,0.6)",
                    marginTop: "1px",
                  }}
                >
                  {g.desc[0]} {g.desc[1]}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Phone (< md) layout: a portrait re-flow of the lifecycle diagram. Risk
 * sources flow down into the Artifact Registry (ringed by the ecosystem
 * nodes), then out to operational impact, with a governance panel below.
 * Kept as a real connected diagram rather than a flat list.
 */
export function LifecycleMobile(): React.ReactElement {
  // Aggregate label so screen readers get the full picture from the SVG diagram.
  const label = `Software risk lifecycle. Risk sources (${LEFT_ITEMS.map((i) => i.title).join(", ")}) flow into the Artifact Registry and its ecosystem (${RING.map((n) => NODES[n.key].label).join(", ")}), surfacing as operational impact (${RIGHT_ITEMS.map((i) => i.title).join(", ")}), underpinned by a continuous governance layer.`;
  return (
    <div className="mx-auto w-full max-w-[440px]">
      <div role="img" aria-label={label}>
        <PortraitCanvas />
      </div>
      <GovernancePanel />
    </div>
  );
}
