import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";

/**
 * "The Trust Gap" — a glass library cube sits at the centre with five trust
 * attributes orbiting it. Each attribute (Identity, Provenance, Security,
 * Policy, Trust) carries its own ghosted glyph in an *unverified* state: a
 * dashed ring plus an amber "pending" pip. This is the first half of an
 * Unverified → Verified arc — the next section resolves the same attributes
 * into solid, established icons. Built entirely in SVG/CSS (no raster) to
 * match the page's other coded scenes.
 *
 * The diagram lives on a fixed 1110×580 design canvas that is scaled uniformly
 * to fit (the same `--tg-scale` technique as the Pipeline orb), so every
 * coordinate below is exact. Below `lg` it falls back to a stacked cube +
 * orb grid. The heading is centred above the diagram, matching the other
 * sections on the page.
 */

type NodeKey = "identity" | "provenance" | "security" | "policy" | "trust";
type IconKey = "fingerprint" | "branch" | "shield" | "policy" | "seal";

interface TrustNode {
  key: NodeKey;
  label: string;
  /** Attribute glyph shown inside the orb (in its "unverified" state). */
  icon: IconKey;
  /** Orb centre in the 1110×580 canvas. */
  ox: number;
  oy: number;
  /** Label centre in the 1110×580 canvas. */
  lx: number;
  ly: number;
  /** Where the connector meets the cube surface. */
  attach: readonly [number, number];
}

const ORB_R = 54;

/**
 * Caution accent for the "pending / unverified" pip. Kept here as the single
 * source; promote to a shared design token if a caution state is introduced on
 * other pages (amber = pending, green = verified, purple = brand).
 */
const AMBER_PIP =
  "radial-gradient(closest-side, #ffd27a 0%, #f5a623 62%, #d98a12 100%)";

// Positions are symmetric about the canvas centre (x = 555) so the cube and
// orb cluster sit dead-centre under the heading.
// Every label sits a uniform 80px above its orb centre (a comfortable gap
// above the orb; all-above reads consistently and avoids the Identity → cube
// connector that an all-below layout would cross).
const NODES: TrustNode[] = [
  { key: "identity", label: "Identity", icon: "fingerprint", ox: 555, oy: 108, lx: 555, ly: 28, attach: [555, 268] },
  { key: "provenance", label: "Provenance", icon: "branch", ox: 274, oy: 288, lx: 274, ly: 208, attach: [462, 328] },
  { key: "security", label: "Security", icon: "shield", ox: 836, oy: 288, lx: 836, ly: 208, attach: [648, 328] },
  { key: "policy", label: "Policy", icon: "policy", ox: 318, oy: 486, lx: 318, ly: 406, attach: [495, 434] },
  { key: "trust", label: "Trust", icon: "seal", ox: 792, oy: 486, lx: 792, ly: 406, attach: [615, 434] },
];

/* ---- Isometric cube geometry (1110×580 canvas) ------------------------- */
const CUBE_CX = 555;
const W = 116; // top-rhombus half-width
const Q = 56; // top-rhombus half-height (iso squash)
const E = 120; // vertical edge length
const TOP_Y = 230; // back-top vertex y

const V = {
  Ttop: [CUBE_CX, TOP_Y],
  Tright: [CUBE_CX + W, TOP_Y + Q],
  Tfront: [CUBE_CX, TOP_Y + 2 * Q],
  Tleft: [CUBE_CX - W, TOP_Y + Q],
  Bright: [CUBE_CX + W, TOP_Y + Q + E],
  Bfront: [CUBE_CX, TOP_Y + 2 * Q + E],
  Bleft: [CUBE_CX - W, TOP_Y + Q + E],
} as const;
const P = (p: readonly [number, number]): string => `${p[0]},${p[1]}`;

interface Connector {
  d: string;
  dot: readonly [number, number];
}

function connectorFor(n: TrustNode): Connector {
  const [ax, ay] = n.attach;
  const dx = n.ox - ax;
  const dy = n.oy - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ex = n.ox - (dx / len) * (ORB_R + 8);
  const ey = n.oy - (dy / len) * (ORB_R + 8);
  return { d: `M ${ax} ${ay} L ${ex.toFixed(1)} ${ey.toFixed(1)}`, dot: n.attach };
}

/**
 * The canvas SVG: reflective base, glass cube, dotted connectors + dots. All
 * geometry is in the 1110×580 space; `viewBox` lets the mobile layout crop to
 * the cube region, and `withConnectors` drops the radiating lines there.
 */
function DiagramSvg({
  viewBox = "0 0 1110 580",
  withConnectors = true,
  idPrefix = "d",
}: {
  viewBox?: string;
  withConnectors?: boolean;
  idPrefix?: string;
}): React.ReactElement {
  // Namespaced ids so the desktop and mobile copies (both mounted, one hidden)
  // never collide on gradient/filter ids.
  const gid = (name: string): string => `tg-${idPrefix}-${name}`;
  return (
    <svg
      aria-hidden
      viewBox={viewBox}
      className="absolute inset-0 h-full w-full select-none"
      fill="none"
    >
      <defs>
        <linearGradient id={gid("cube-top")} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="rgba(46,44,86,0.92)" />
          <stop offset="100%" stopColor="rgba(24,22,52,0.85)" />
        </linearGradient>
        <linearGradient id={gid("cube-left")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(19,17,42,0.94)" />
          <stop offset="100%" stopColor="rgba(10,9,24,0.92)" />
        </linearGradient>
        <linearGradient id={gid("cube-right")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(29,26,60,0.93)" />
          <stop offset="100%" stopColor="rgba(15,13,34,0.9)" />
        </linearGradient>
        <radialGradient id={gid("core")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(170,140,255,0.62)" />
          <stop offset="48%" stopColor="rgba(122,92,245,0.24)" />
          <stop offset="100%" stopColor="rgba(122,92,245,0)" />
        </radialGradient>
        <linearGradient id={gid("top-sheen")} x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id={gid("base")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(122,90,248,0.32)" />
          <stop offset="60%" stopColor="rgba(122,90,248,0.10)" />
          <stop offset="100%" stopColor="rgba(122,90,248,0)" />
        </radialGradient>
        <radialGradient id={gid("foot")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(196,206,255,0.9)" />
          <stop offset="45%" stopColor="rgba(120,110,255,0.35)" />
          <stop offset="100%" stopColor="rgba(120,110,255,0)" />
        </radialGradient>
        <filter id={gid("glow")} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Reflective base: soft glow pool + concentric rings the cube sits on. */}
      <ellipse cx={CUBE_CX} cy="472" rx="215" ry="46" fill={`url(#${gid("base")})`} />
      {[
        { rx: 118, ry: 24 },
        { rx: 168, ry: 34 },
        { rx: 215, ry: 44 },
      ].map((r) => (
        <ellipse
          key={r.rx}
          cx={CUBE_CX}
          cy="472"
          rx={r.rx}
          ry={r.ry}
          fill="none"
          stroke="rgba(150,130,255,0.16)"
          strokeWidth="1"
        />
      ))}
      {/* Sonar ripple emanating from the cube base (two rings, half a cycle
          apart, so the pulse feels continuous). Desktop only. */}
      {withConnectors &&
        [0, 2].map((d) => (
          <ellipse
            key={d}
            className="cs-tg-ripple"
            cx={CUBE_CX}
            cy="472"
            rx="150"
            ry="30"
            fill="none"
            stroke="rgba(150,130,255,0.45)"
            strokeWidth="1.2"
            style={{ animationDelay: `${d}s` }}
          />
        ))}

      {/* Inner core glow — energy sealed inside the glass (softly breathes). */}
      <ellipse
        className="cs-tg-core"
        cx={CUBE_CX}
        cy="380"
        rx="104"
        ry="96"
        fill={`url(#${gid("core")})`}
      />

      {/* Glass cube — faces back-to-front. */}
      <polygon points={`${P(V.Tleft)} ${P(V.Tfront)} ${P(V.Bfront)} ${P(V.Bleft)}`} fill={`url(#${gid("cube-left")})`} />
      <polygon points={`${P(V.Tright)} ${P(V.Tfront)} ${P(V.Bfront)} ${P(V.Bright)}`} fill={`url(#${gid("cube-right")})`} />
      <polygon points={`${P(V.Ttop)} ${P(V.Tright)} ${P(V.Tfront)} ${P(V.Tleft)}`} fill={`url(#${gid("cube-top")})`} />
      {/* Subtle sheen on the top face — light catches the back-left. */}
      <polygon
        points={`${P(V.Ttop)} ${P(V.Tleft)} ${P(V.Tfront)}`}
        fill={`url(#${gid("top-sheen")})`}
        opacity="0.26"
      />

      {/* Glowing neon top rim + side verticals (the wireframe reads bright
          against the near-solid dark faces). */}
      <polyline
        points={`${P(V.Ttop)} ${P(V.Tright)} ${P(V.Tfront)} ${P(V.Tleft)} ${P(V.Ttop)}`}
        stroke="rgba(228,224,255,0.95)"
        strokeWidth="1.75"
        filter={`url(#${gid("glow")})`}
      />
      <line
        {...lineProps(V.Tleft, V.Bleft)}
        stroke="rgba(150,138,255,0.85)"
        strokeWidth="1.4"
        filter={`url(#${gid("glow")})`}
      />
      <line
        {...lineProps(V.Tright, V.Bright)}
        stroke="rgba(174,162,255,0.9)"
        strokeWidth="1.4"
        filter={`url(#${gid("glow")})`}
      />

      {/* Bright front vertical + bottom edges (light catches the near corner). */}
      <line {...lineProps(V.Tfront, V.Bfront)} stroke="rgba(226,228,255,0.95)" strokeWidth="1.75" filter={`url(#${gid("glow")})`} />
      <polyline
        points={`${P(V.Bleft)} ${P(V.Bfront)} ${P(V.Bright)}`}
        stroke="rgba(206,222,255,0.92)"
        strokeWidth="1.6"
        filter={`url(#${gid("glow")})`}
      />
      {/* Bright glow where the front-bottom corner meets the base. */}
      <ellipse cx={V.Bfront[0]} cy={V.Bfront[1]} rx="88" ry="30" fill={`url(#${gid("foot")})`} />

      {/* In-cube label. */}
      <text
        x={CUBE_CX}
        y="372"
        textAnchor="middle"
        className="font-mono"
        fill="rgba(242,238,255,0.98)"
        style={{ fontSize: "30px", letterSpacing: "2px" }}
        filter={`url(#${gid("glow")})`}
      >
        {"</>"}
      </text>
      <text
        x={CUBE_CX}
        y="400"
        textAnchor="middle"
        className="font-display"
        fill="rgba(228,224,255,0.95)"
        style={{ fontSize: "21px", fontWeight: 600, letterSpacing: "1px" }}
      >
        Library
      </text>

      {/* Dotted connectors + glowing attach dots (drawn above the cube). */}
      {withConnectors &&
        NODES.map((n) => {
          const c = connectorFor(n);
          return (
            <g key={n.key}>
              <path
                className="cs-tg-flow"
                d={c.d}
                stroke="rgba(150,124,255,0.55)"
                strokeWidth="1.5"
                strokeDasharray="1 7"
                strokeLinecap="round"
              />
              <circle cx={c.dot[0]} cy={c.dot[1]} r="3.6" fill="#c3b4ff" filter={`url(#${gid("glow")})`} />
            </g>
          );
        })}
    </svg>
  );
}

function lineProps(
  a: readonly [number, number],
  b: readonly [number, number],
): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

/** Attribute glyphs — one per trust attribute, drawn as thin line icons that
 *  inherit the orb's ghosted colour via currentColor. */
function AttrIcon({ icon, size }: { icon: IconKey; size: number }): React.ReactElement {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (icon) {
    case "fingerprint":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="1.3" />
          <path d="M8.6 12a3.4 3.4 0 0 1 6.8 0" />
          <path d="M6 12a6 6 0 0 1 12 0" />
          <path d="M3.6 12a8.4 8.4 0 0 1 16.8 0" />
        </svg>
      );
    case "branch":
      return (
        <svg {...common}>
          <line x1="6" y1="4" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z" />
        </svg>
      );
    case "policy":
      return (
        <svg {...common}>
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
          <path d="M14 2v5h5" />
          <line x1="8.5" y1="13" x2="15" y2="13" />
          <line x1="8.5" y1="17" x2="13" y2="17" />
        </svg>
      );
    case "seal":
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="5" />
          <path d="M8.6 12.6 7 22l5-2.8 5 2.8-1.6-9.4" />
        </svg>
      );
  }
}

/**
 * An "unverified" attribute orb: a glossy dark sphere carrying the attribute's
 * own glyph (ghosted), enclosed by a dashed ring and flagged with a small amber
 * "pending" pip — the visual language of *not yet established*. In the next
 * section these same attributes resolve into solid, verified icons.
 */
function TrustOrb({
  node,
  size = 108,
  delay = 0,
}: {
  node: TrustNode;
  size?: number;
  /** Per-orb animation offset (seconds) so the amber pips pulse out of phase. */
  delay?: number;
}): React.ReactElement {
  const pip = Math.max(11, Math.round(size * 0.16));
  return (
    <div
      className="cs-tg-orb relative rounded-full"
      style={{
        width: size,
        height: size,
        animationDelay: `${-delay * 2.1}s`,
        background:
          "radial-gradient(122% 122% at 34% 24%, #3c3557 0%, #191630 46%, #090714 100%)",
        boxShadow:
          "0 16px 34px rgba(0,0,0,0.5), 0 0 22px rgba(122,90,248,0.16), inset 0 2px 5px rgba(198,190,255,0.24), inset 0 -10px 20px rgba(0,0,0,0.55)",
      }}
    >
      {/* top-left specular highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          top: "11%",
          left: "17%",
          width: "44%",
          height: "34%",
          background:
            "radial-gradient(closest-side, rgba(232,227,255,0.5) 0%, rgba(232,227,255,0) 70%)",
          filter: "blur(3px)",
        }}
      />
      {/* dashed "unverified" ring */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="50"
          cy="50"
          r="46.5"
          fill="none"
          stroke="rgba(178,160,255,0.6)"
          strokeWidth="1.4"
          strokeDasharray="3 4.5"
          strokeLinecap="round"
        />
      </svg>
      {/* ghosted attribute glyph */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: "rgba(214,206,255,0.62)" }}
      >
        <AttrIcon icon={node.icon} size={Math.round(size * 0.42)} />
      </div>
      {/* amber "pending / unverified" pip on the shoulder, with a radar-style
          ping halo so it reads as a live status beacon rather than a dot */}
      <span
        aria-hidden
        className="cs-tg-pip-ping absolute rounded-full"
        style={{
          top: "13%",
          right: "13%",
          width: pip,
          height: pip,
          animationDelay: `${delay}s`,
          border: "1.5px solid rgba(245,166,35,0.8)",
        }}
      />
      <span
        aria-hidden
        className="cs-tg-pip absolute rounded-full"
        style={{
          top: "13%",
          right: "13%",
          width: pip,
          height: pip,
          animationDelay: `${delay}s`,
          background: AMBER_PIP,
          boxShadow:
            "0 0 10px rgba(245,166,35,0.75), inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
}

function NodeLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span
      className="whitespace-nowrap font-sans text-white/85"
      style={{ fontSize: "var(--fs-h5)", fontWeight: 500, letterSpacing: "-0.01em" }}
    >
      {children}
    </span>
  );
}

const pct = (v: number, total: number): string => `${(v / total) * 100}%`;

/** Scaled desktop diagram on the fixed 1110×580 canvas. */
function DiagramDesktop(): React.ReactElement {
  return (
    <div
      className="mx-auto hidden lg:block"
      style={
        {
          "--tg-scale": "min(1, calc((min(100vw, 1200px) - 48px) / 1110px))",
          width: "calc(1110px * var(--tg-scale))",
          height: "calc(580px * var(--tg-scale))",
        } as React.CSSProperties
      }
    >
      <div
        className="relative"
        style={{
          width: "1110px",
          height: "580px",
          transform: "scale(var(--tg-scale))",
          transformOrigin: "top left",
        }}
      >
        <DiagramSvg />
        {NODES.map((n, i) => (
          <div
            key={`orb-${n.key}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(n.ox, 1110), top: pct(n.oy, 580) }}
          >
            <TrustOrb node={n} delay={i * -1.1} />
          </div>
        ))}
        {NODES.map((n) => (
          <div
            key={`lbl-${n.key}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pct(n.lx, 1110), top: pct(n.ly, 580) }}
          >
            <NodeLabel>{n.label}</NodeLabel>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked fallback for < lg — cube above a 2/3-col orb grid. */
function DiagramMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-12 lg:hidden">
      {/* Reuse the shared canvas, cropped to the cube region (no connectors). */}
      <div className="relative w-full max-w-[300px]" style={{ aspectRatio: "320 / 295" }}>
        <DiagramSvg viewBox="395 205 320 295" withConnectors={false} idPrefix="m" />
      </div>
      <div className="grid w-full max-w-[420px] grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3">
        {NODES.map((n, i) => (
          <div key={n.key} className="flex flex-col items-center gap-4">
            <TrustOrb node={n} size={84} delay={i * -1.1} />
            <NodeLabel>{n.label}</NodeLabel>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibrariesTrustGap(): React.ReactElement {
  return (
    <Section
      padding="md"
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 68%, #471EC0 100%)",
      }}
    >
      {/* Ambient purple glow behind the diagram. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 select-none rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,64,255,0.18) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[720px] text-center">
            <h2
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              The Trust Gap
            </h2>
            <p
              className="mx-auto mt-6 max-w-[720px] font-sans text-white/80"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
              }}
            >
              Every library carries trust attributes that should be established
              before it becomes part of your software.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-4 lg:mt-6">
          <DiagramDesktop />
          <DiagramMobile />
          {/* Legend — makes the amber pip's "pending" meaning explicit. */}
          <p
            className="mt-8 flex items-center justify-center gap-2.5 font-sans text-white/55"
            style={{
              fontSize: "var(--fs-caption)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            <span
              aria-hidden
              className="inline-block size-2.5 shrink-0 rounded-full"
              style={{
                background: AMBER_PIP,
                boxShadow: "0 0 8px rgba(245,166,35,0.6)",
              }}
            />
            Unverified — trust attributes not yet established
          </p>
        </Reveal>
      </Container>
    </Section>
  );
}
