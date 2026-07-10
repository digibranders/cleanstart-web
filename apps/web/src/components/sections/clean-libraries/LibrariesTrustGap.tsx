import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { GlassIcon } from "./GlassIcon";

/**
 * "Trust Is Built. Not Assumed." — the glass "Library" cube sits at the centre
 * as the hero object, with four trust attributes (Identity, Provenance,
 * Authenticity, Policy) presented as titled, described cards flanking it (two
 * left, two right on desktop; a stacked grid below the cube on mobile). Thin
 * brand-coloured connectors tie each card back to the cube. Everything is drawn
 * in SVG/CSS (no raster) to match the page's other coded scenes; all motion is
 * disabled under prefers-reduced-motion (see globals.css).
 *
 * The desktop diagram lives on a fixed 1160×430 design canvas scaled uniformly
 * to fit (the same scale-to-fit technique as the Pipeline / Governance scenes),
 * so every coordinate below is exact.
 */

type IconKey = "fingerprint" | "branch" | "shield" | "policy";

interface TrustCard {
  key: string;
  title: string;
  desc: string;
  icon: IconKey;
  accent: string;
  tint: string;
  /** Card centre in the 1160×600 canvas (desktop). */
  cx: number;
  cy: number;
  /** X of the card edge the connector meets (inner edge, facing the cube). */
  anchorX: number;
  /** Point on the cube's side silhouette where this card's connector originates. */
  cubePt: readonly [number, number];
}

const CARD_W = 286;
const CARD_H = 120;

const CARDS: TrustCard[] = [
  {
    key: "identity",
    title: "Identity",
    desc: "Know exactly what you’re using.",
    icon: "fingerprint",
    accent: "#a974ff",
    tint: "rgba(169,116,255,0.14)",
    cx: 205,
    cy: 90,
    anchorX: 348,
    cubePt: [464, 153],
  },
  {
    key: "provenance",
    title: "Provenance",
    desc: "Know where every library came from.",
    icon: "branch",
    accent: "#5b9bff",
    tint: "rgba(91,155,255,0.14)",
    cx: 205,
    cy: 340,
    anchorX: 348,
    cubePt: [464, 245],
  },
  {
    key: "authenticity",
    title: "Authenticity",
    desc: "Know it hasn’t been altered.",
    icon: "shield",
    accent: "#2dd4bf",
    tint: "rgba(45,212,191,0.14)",
    cx: 955,
    cy: 90,
    anchorX: 812,
    cubePt: [696, 153],
  },
  {
    key: "policy",
    title: "Policy",
    desc: "Know it meets your standards.",
    icon: "policy",
    accent: "#f7a35c",
    tint: "rgba(247,163,92,0.14)",
    cx: 955,
    cy: 340,
    anchorX: 812,
    cubePt: [696, 245],
  },
];

/* ---- Isometric cube geometry (drawn on the full 1110×580 space, then cropped
   to the cube region via the viewBox so it can be placed anywhere). ---------- */
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

function lineProps(
  a: readonly [number, number],
  b: readonly [number, number],
): { x1: number; y1: number; x2: number; y2: number } {
  return { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
}

/**
 * The glass "Library" cube: reflective base, glass faces, glowing neon rim, and
 * the in-cube `</> Library` label. The `viewBox` crops to the cube region so it
 * can be sized and placed as a standalone centrepiece; `idPrefix` namespaces the
 * gradient/filter ids so multiple mounted copies (desktop + mobile) never
 * collide.
 */
function LibraryCube({
  viewBox = "335 200 440 330",
  idPrefix = "cube",
}: {
  viewBox?: string;
  idPrefix?: string;
}): React.ReactElement {
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

      {/* Glowing neon top rim + side verticals. */}
      <polyline
        points={`${P(V.Ttop)} ${P(V.Tright)} ${P(V.Tfront)} ${P(V.Tleft)} ${P(V.Ttop)}`}
        stroke="rgba(228,224,255,0.95)"
        strokeWidth="1.75"
        filter={`url(#${gid("glow")})`}
      />
      <line {...lineProps(V.Tleft, V.Bleft)} stroke="rgba(150,138,255,0.85)" strokeWidth="1.4" filter={`url(#${gid("glow")})`} />
      <line {...lineProps(V.Tright, V.Bright)} stroke="rgba(174,162,255,0.9)" strokeWidth="1.4" filter={`url(#${gid("glow")})`} />

      {/* Bright front vertical + bottom edges. */}
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
    </svg>
  );
}

/** Attribute glyphs — thin line icons; stroke inherits the accent via currentColor. */
function AttrIcon({ icon, size }: { icon: IconKey; size: number }): React.ReactElement {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
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
          <path d="m9 12 2 2 4-4" />
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
  }
}

/** A trust-attribute card: glass icon + title + description. */
function AttrCard({ card }: { card: TrustCard }): React.ReactElement {
  return (
    <div
      className="flex h-full flex-col justify-center rounded-[18px] border p-5"
      style={{
        borderColor: `color-mix(in srgb, ${card.accent} 26%, transparent)`,
        background: `linear-gradient(155deg, ${card.tint} 0%, rgba(12,10,26,0.62) 62%)`,
        boxShadow:
          "0 14px 34px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-start gap-4">
        <GlassIcon accent={card.accent} size={46}>
          <AttrIcon icon={card.icon} size={22} />
        </GlassIcon>
        <div className="flex flex-col gap-1.5">
          <h3
            className="font-display text-white"
            style={{
              fontSize: "var(--fs-h5)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            {card.title}
          </h3>
          <p
            className="font-sans text-white/65"
            style={{
              fontSize: "var(--fs-body-sm)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              lineHeight: 1.45,
              textWrap: "balance",
            }}
          >
            {card.desc}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Scaled desktop diagram on the fixed 1160×430 canvas. */
function DiagramDesktop(): React.ReactElement {
  return (
    <div
      className="relative mx-auto hidden w-full max-w-[1160px] lg:block"
      style={{ aspectRatio: "1160 / 430", containerType: "inline-size" }}
    >
      <div
        className="absolute left-0 top-0"
        style={
          {
            width: 1160,
            height: 430,
            transformOrigin: "top left",
            transform: "scale(var(--tg-scale))",
            // Divide by a length so the ratio is unitless (scale() rejects a length).
            "--tg-scale": "min(1, 100cqw / 1160px)",
          } as React.CSSProperties
        }
      >
        {/* Cube centrepiece (painted first, behind the connectors). */}
        <Reveal
          y={0}
          duration={0.7}
          className="absolute"
          style={{ left: 360, top: 50, width: 440, height: 330 }}
        >
          <LibraryCube idPrefix="cube" />
        </Reveal>

        {/* Connectors from the cube out to each card. */}
        <svg aria-hidden viewBox="0 0 1160 430" className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            <filter id="tg-conn-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {CARDS.map((card) => {
            const [nx, ny] = card.cubePt;
            return (
              <g key={card.key}>
                <line
                  x1={nx}
                  y1={ny}
                  x2={card.anchorX}
                  y2={card.cy}
                  stroke={card.accent}
                  strokeOpacity="0.5"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  filter="url(#tg-conn-glow)"
                />
                <circle cx={nx} cy={ny} r="4" fill={card.accent} filter="url(#tg-conn-glow)" />
              </g>
            );
          })}
        </svg>

        {/* Attribute cards. */}
        {CARDS.map((card, i) => (
          <Reveal
            key={card.key}
            delay={0.15 + i * 0.1}
            y={24}
            className="absolute"
            style={{
              left: card.cx - CARD_W / 2,
              top: card.cy - CARD_H / 2,
              width: CARD_W,
              height: CARD_H,
            }}
          >
            <AttrCard card={card} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/** Stacked fallback for < lg — cube above a 1/2-col card grid. */
function DiagramMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-10 lg:hidden">
      <div className="relative w-full max-w-[300px]" style={{ aspectRatio: "440 / 330" }}>
        <LibraryCube idPrefix="cubem" />
      </div>
      <RevealStagger className="grid w-full max-w-[440px] grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <RevealItem key={card.key} className="h-full">
            <AttrCard card={card} />
          </RevealItem>
        ))}
      </RevealStagger>
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
              Trust Is Built. Not Assumed.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[640px] font-sans text-white/80"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
                textWrap: "balance",
              }}
            >
              Trust isn’t assumed. It’s established through continuous
              verification.
            </p>
          </div>
        </Reveal>

        <div className="mt-2 lg:mt-4">
          <DiagramDesktop />
          <DiagramMobile />
        </div>
      </Container>
    </Section>
  );
}
