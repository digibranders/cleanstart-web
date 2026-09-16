import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";
import { GlassIcon } from "@/components/sections/_shared/GlassIcon";
import { SIGNAL } from "./tricorder-palette";

/**
 * "Software Doesn't Exist in Isolation." — a component is understood through
 * three lenses (history, behavior, relationships). Copy on the left; on the
 * right a coded scene: the three lenses as glass tiles converging on the
 * component, which resolves downward into a verdict. Beams carry travelling
 * packets (the Clean Libraries `cs-lep-*` keyframes) and the whole scene is
 * laid out on a fixed design canvas scaled to fit, like LibrariesPipeline.
 * Dark section.
 */

type LensKey = "history" | "behavior" | "relationships";

interface Lens {
  key: LensKey;
  title: string;
  detail: string;
  accent: string;
  /** Facts shown inside the tile on the scene. */
  facts: readonly [string, string, string];
}

const LENSES: Lens[] = [
  {
    key: "history",
    title: "History",
    detail: "Versions, changes, vulnerabilities.",
    accent: SIGNAL.history,
    facts: ["2.4.1 → 2.5.0", "maintainer changed", "0 CVEs on record"],
  },
  {
    key: "behavior",
    title: "Behavior",
    detail: "Capabilities, purpose, reachability.",
    accent: SIGNAL.behavior,
    facts: ["network · shell", "file system", "reachable at runtime"],
  },
  {
    key: "relationships",
    title: "Relationships",
    detail: "Dependencies, maintainers, infrastructure.",
    accent: SIGNAL.relationships,
    facts: ["41 dependencies", "1 shared host", "2 linked packages"],
  },
];

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

function LensGlyph({ lens, size }: { lens: LensKey; size: number }): React.ReactElement {
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
  switch (lens) {
    case "history":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v5h5" />
          <path d="M12 8v4l3 2" />
        </svg>
      );
    case "behavior":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        </svg>
      );
    case "relationships":
      return (
        <svg {...common}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="6" r="2.5" />
          <circle cx="12" cy="18" r="2.5" />
          <path d="M8 7.5 10.5 16M16 7.5 13.5 16M8.5 6h7" />
        </svg>
      );
  }
}

/* ---- Scene geometry: 560×600 design canvas -------------------------------- */
const VB = { w: 560, h: 600 } as const;
const TILE = { w: 232, h: 132 } as const;
/** Tile top-left corners: two on the left column, one on the right, staggered. */
const TILE_POS: Record<LensKey, { x: number; y: number }> = {
  history: { x: 0, y: 30 },
  behavior: { x: 328, y: 96 },
  relationships: { x: 0, y: 244 },
};
const CORE = { cx: 330, cy: 372, r: 64 } as const;
const VERDICT = { cx: 330, cy: 546 } as const;
const pct = (v: number, total: number): string => `${(v / total) * 100}%`;

/** Curve from a tile's nearest edge midpoint to the core's rim, arriving radially. */
function beamFrom(key: LensKey): string {
  const p = TILE_POS[key];
  const tileLeftOfCore = p.x + TILE.w / 2 < CORE.cx;
  const sx = tileLeftOfCore ? p.x + TILE.w : p.x;
  const sy = p.y + TILE.h / 2;
  const dx = sx - CORE.cx;
  const dy = sy - CORE.cy;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const ex = CORE.cx + ux * (CORE.r + 4);
  const ey = CORE.cy + uy * (CORE.r + 4);
  const c1x = sx + (tileLeftOfCore ? 56 : -56);
  const c2x = ex + ux * 70;
  const c2y = ey + uy * 70;
  return `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}
/** Starts below the core's "Component" caption so the line never crosses the text. */
const TRUNK = `M ${CORE.cx} ${CORE.cy + CORE.r + 40} L ${CORE.cx} ${VERDICT.cy - 26}`;

function LensTile({ lens }: { lens: Lens }): React.ReactElement {
  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{
        width: TILE.w,
        height: TILE.h,
        borderRadius: "18px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: `1px solid color-mix(in srgb, ${lens.accent} 34%, rgba(255,255,255,0.10))`,
        boxShadow: `0 20px 40px -24px color-mix(in srgb, ${lens.accent} 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="flex items-center gap-3">
        <GlassIcon accent={lens.accent} size={36}>
          <LensGlyph lens={lens.key} size={18} />
        </GlassIcon>
        <span
          className="font-display text-white"
          style={{ fontSize: "var(--fs-h6)", fontWeight: 600, letterSpacing: "-0.01em" }}
        >
          {lens.title}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {lens.facts.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2 text-white/60"
            style={{ fontFamily: MONO, fontSize: "var(--fs-badge)", lineHeight: 1.3 }}
          >
            <span aria-hidden className="block h-[4px] w-[4px] shrink-0 rounded-full" style={{ background: lens.accent }} />
            <span className="truncate">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The component under analysis — a dark orb with a brand-gradient rim and the cube glyph. */
function ComponentCore(): React.ReactElement {
  const size = CORE.r * 2;
  return (
    <div className="flex flex-col items-center">
      <div
        className="cs-lep-node relative flex items-center justify-center rounded-full"
        style={{
          width: size,
          height: size,
          background: "radial-gradient(120% 120% at 34% 24%, #3b3557 0%, #191630 46%, #0a0816 100%)",
          boxShadow:
            "0 20px 44px -18px rgba(110,64,255,0.7), 0 0 40px rgba(110,64,255,0.28), inset 0 2px 6px rgba(198,190,255,0.28), inset 0 -12px 24px rgba(0,0,0,0.55)",
        }}
      >
        {[0, 1.4].map((d) => (
          <span
            key={d}
            aria-hidden
            className="cs-lep-ripple pointer-events-none absolute inset-0 rounded-full"
            style={{ border: "1.5px solid rgba(150,120,255,0.55)", animationDelay: `${d}s` }}
          />
        ))}
        <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <defs>
            <linearGradient id="tri-core-rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9b8ff" />
              <stop offset="55%" stopColor="#7a5af8" />
              <stop offset="100%" stopColor="#2cc1eb" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="none" stroke="url(#tri-core-rim)" strokeWidth="1.4" opacity="0.85" />
        </svg>
        <span
          aria-hidden
          className="cs-lep-core pointer-events-none absolute rounded-full"
          style={{
            inset: "24%",
            background:
              "radial-gradient(closest-side, rgba(170,140,255,0.85) 0%, rgba(122,90,248,0.25) 60%, rgba(122,90,248,0) 100%)",
          }}
        />
        <svg
          aria-hidden
          width={Math.round(size * 0.34)}
          height={Math.round(size * 0.34)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(238,234,255,0.95)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative"
        >
          <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
          <path d="M4 7l8 4.5L20 7" />
          <path d="M12 11.5v10" />
        </svg>
      </div>
      <span
        className="mt-3 whitespace-nowrap font-display text-white/85"
        style={{ fontSize: "var(--fs-badge)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
      >
        Component
      </span>
    </div>
  );
}

/** Verdict readout under the core — the three states, with the resolved one lit. */
function VerdictReadout(): React.ReactElement {
  const states = [
    { label: "Malicious", color: "#f43f5e", lit: true },
    { label: "Uncertain", color: "#f7a35c", lit: false },
    { label: "Pass", color: "#2dd4bf", lit: false },
  ];
  return (
    <div
      className="flex items-center gap-1 p-1"
      style={{
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(10,12,32,0.85)",
        boxShadow: "0 18px 40px -20px rgba(0,0,0,0.8)",
      }}
    >
      {states.map((s) => (
        <span
          key={s.label}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display"
          style={{
            fontSize: "var(--fs-badge)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: s.lit ? "#fff" : "rgba(255,255,255,0.45)",
            background: s.lit ? `color-mix(in srgb, ${s.color} 32%, transparent)` : "transparent",
            boxShadow: s.lit ? `inset 0 0 0 1px color-mix(in srgb, ${s.color} 70%, transparent)` : "none",
          }}
        >
          <span
            aria-hidden
            className="block h-[6px] w-[6px] rounded-full"
            style={{ background: s.color, opacity: s.lit ? 1 : 0.45, boxShadow: s.lit ? `0 0 10px ${s.color}` : "none" }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function SceneDesktop(): React.ReactElement {
  return (
    <ScaleToFit designWidth={VB.w} className="mx-auto hidden max-w-[560px] md:block">
      <div className="relative" style={{ width: `${VB.w}px`, height: `${VB.h}px` }}>
        <svg aria-hidden viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            {LENSES.map((l) => (
              <linearGradient key={l.key} id={`tri-beam-${l.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={l.accent} stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8b6cff" stopOpacity="0.9" />
              </linearGradient>
            ))}
            <linearGradient id="tri-trunk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
            </linearGradient>
            <filter id="tri-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {LENSES.map((l, i) => (
            <path
              key={l.key}
              className="cs-lep-beam"
              d={beamFrom(l.key)}
              stroke={`url(#tri-beam-${l.key})`}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeDasharray="2 9"
              style={{ animationDelay: `${i * -0.4}s` }}
            />
          ))}
          <path className="cs-lep-beam" d={TRUNK} stroke="url(#tri-trunk)" strokeWidth="2.25" strokeLinecap="round" strokeDasharray="2 9" />
          {LENSES.map((l, i) => (
            <circle
              key={`pk-${l.key}`}
              className="cs-lep-packet"
              r="4.5"
              fill={l.accent}
              filter="url(#tri-glow)"
              style={{ offsetPath: `path("${beamFrom(l.key)}")`, animationDelay: `${i * -0.85}s` }}
            />
          ))}
          <circle
            className="cs-lep-packet"
            r="4"
            fill="#f43f5e"
            filter="url(#tri-glow)"
            style={{ offsetPath: `path("${TRUNK}")`, animationDelay: "-1.2s" }}
          />
        </svg>

        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pct(CORE.cx, VB.w),
            top: pct(CORE.cy, VB.h),
            width: 340,
            height: 340,
            background: "radial-gradient(closest-side, rgba(110,64,255,0.22) 0%, rgba(110,64,255,0) 70%)",
          }}
        />

        {LENSES.map((l) => (
          <div key={l.key} className="absolute" style={{ left: TILE_POS[l.key].x, top: TILE_POS[l.key].y }}>
            <LensTile lens={l} />
          </div>
        ))}

        <div
          className="absolute -translate-x-1/2"
          style={{ left: pct(CORE.cx, VB.w), top: CORE.cy - CORE.r }}
        >
          <ComponentCore />
        </div>

        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(VERDICT.cx, VB.w), top: pct(VERDICT.cy, VB.h) }}
        >
          <VerdictReadout />
        </div>
      </div>
    </ScaleToFit>
  );
}

/** Below md: tiles stack, feed the core through a vertical beam, and resolve into the verdict. */
function SceneMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3 md:hidden">
      {LENSES.map((l, i) => (
        <div key={l.key} className="flex w-full max-w-[232px] flex-col items-center gap-3">
          <LensTile lens={l} />
          <span
            aria-hidden
            className="cs-lep-beam-v h-6 w-[2.5px] rounded-full"
            style={{
              background: `linear-gradient(180deg, ${l.accent} 0%, rgba(110,64,255,0.6) 100%)`,
              animationDelay: `${i * -0.4}s`,
            }}
          />
        </div>
      ))}
      <ComponentCore />
      <span aria-hidden className="cs-lep-beam-v h-6 w-[2.5px] rounded-full" style={{ background: "linear-gradient(180deg, #8b6cff, #f43f5e)" }} />
      <VerdictReadout />
    </div>
  );
}

export function TricorderContext(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{ background: "linear-gradient(180deg, #151021 0%, #131E8F 68%, #471EC0 100%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute select-none rounded-full"
        style={{
          right: "-160px",
          top: "50%",
          width: "720px",
          height: "720px",
          transform: "translateY(-50%)",
          background: "radial-gradient(closest-side, rgba(110,64,255,0.20) 0%, rgba(110,64,255,0) 70%)",
        }}
      />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <div className="max-w-[520px]">
            <Reveal header>
              <h2
                className="font-display text-white"
                style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}
              >
                Software Doesn&rsquo;t Exist in Isolation.
              </h2>
            </Reveal>
            <Reveal header delay={0.12} y={20}>
              <div
                aria-hidden
                className="mt-6 h-[3px] w-40 rounded-full"
                style={{ background: "linear-gradient(90deg, #2CC1EB 0%, #9A51FF 100%)" }}
              />
            </Reveal>
            <Reveal header delay={0.18} y={20}>
              <p
                className="mt-6 font-sans text-white/80"
                style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
              >
                Understand every component through its history, behavior, and
                relationships.
              </p>
            </Reveal>

            <RevealStagger className="mt-10 flex flex-col">
              {LENSES.map((l, i) => (
                <RevealItem key={l.key}>
                  <div
                    className="flex items-start gap-4 py-5"
                    style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span
                      aria-hidden
                      className="mt-2 block h-[8px] w-[8px] shrink-0 rounded-full"
                      style={{ background: l.accent, boxShadow: `0 0 14px ${l.accent}` }}
                    />
                    <div>
                      <h3
                        className="font-display text-white"
                        style={{ fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}
                      >
                        {l.title}
                      </h3>
                      <p
                        className="mt-1 font-sans text-white/65"
                        style={{ fontSize: "var(--fs-body)", lineHeight: 1.55, letterSpacing: "-0.01em" }}
                      >
                        {l.detail}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealStagger>
          </div>

          <Reveal className="w-full">
            <SceneDesktop />
            <SceneMobile />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
