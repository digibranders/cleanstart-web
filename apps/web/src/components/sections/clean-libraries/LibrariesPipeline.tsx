import { Container, Section } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { GlassIcon } from "@/components/sections/_shared/GlassIcon";

/**
 * "Libraries Enter Software Through" — the four entry vectors stream into your
 * software. Each vector is a glass-icon card on the left trailing an animated
 * accent beam that converges into a glowing "software" node on the right. Built
 * in SVG/CSS (no raster); the beams flow and the node breathes under motion,
 * both off under prefers-reduced-motion. Below `lg` it stacks vertically.
 */

type GlyphKey = "code" | "ai" | "globe" | "link";

interface Vector {
  key: string;
  label: string;
  glyph: GlyphKey;
  accent: string;
}

const VECTORS: Vector[] = [
  { key: "developers", label: "Developers", glyph: "code", accent: "#7c3aed" },
  { key: "ai", label: "AI Coding Assistants", glyph: "ai", accent: "#2563eb" },
  { key: "registries", label: "Package Registries", glyph: "globe", accent: "#0d9488" },
  { key: "transitive", label: "Transitive Dependencies", glyph: "link", accent: "#ea580c" },
];

function Glyph({ glyph }: { glyph: GlyphKey }): React.ReactElement {
  const c = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (glyph) {
    case "code":
      return (
        <svg {...c}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case "ai":
      return (
        <svg {...c}>
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </svg>
      );
    case "globe":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9.5" />
          <path d="M2.5 12h19" />
          <path d="M12 2.5a14 14 0 0 1 0 19 14 14 0 0 1 0-19Z" />
        </svg>
      );
    case "link":
      return (
        <svg {...c}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

/* ---- Desktop flow scene: 1120×460 design canvas, scaled to fit ---------- */
const VB = { w: 1120, h: 460 } as const;
const CARD = { x: 0, w: 336 } as const;
const CARD_CY = [62, 174, 286, 398] as const;
const NODE = { cx: 985, cy: 230, r: 72 } as const;
const pct = (v: number, total: number): string => `${(v / total) * 100}%`;

function beamPath(cy: number): string {
  return `M ${CARD.x + CARD.w} ${cy} C 660 ${cy}, 705 ${NODE.cy}, ${NODE.cx - NODE.r + 6} ${NODE.cy}`;
}

function VectorCard({ v }: { v: Vector }): React.ReactElement {
  return (
    <div
      className="group flex items-center gap-3.5 rounded-[18px] border bg-white px-4 py-3 transition-transform duration-300 hover:-translate-y-0.5"
      style={{
        width: CARD.w,
        borderColor: `color-mix(in srgb, ${v.accent} 26%, transparent)`,
        boxShadow: `0 10px 26px -14px ${v.accent}, 0 1px 2px rgba(17,24,39,0.06)`,
      }}
    >
      <GlassIcon accent={v.accent} size={46}>
        <Glyph glyph={v.glyph} />
      </GlassIcon>
      <span
        className="font-display text-[#111]"
        style={{ fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}
      >
        {v.label}
      </span>
    </div>
  );
}

/** The glowing "your software" node the vectors converge into (no text). */
function SoftwareNode({ size }: { size: number }): React.ReactElement {
  return (
    <div
      className="cs-lep-node relative flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(120% 120% at 34% 24%, #3b3557 0%, #191630 46%, #0a0816 100%)",
        boxShadow:
          "0 20px 44px -18px rgba(110,64,255,0.7), 0 0 40px rgba(110,64,255,0.28), inset 0 2px 6px rgba(198,190,255,0.28), inset 0 -12px 24px rgba(0,0,0,0.55)",
      }}
    >
      {/* Arrival ripple — pulses out from the node edge as packets land.
          Behind the node body, so it only shows once it clears the edge. */}
      {[0, 1.4].map((d) => (
        <span
          key={d}
          aria-hidden
          className="cs-lep-ripple pointer-events-none absolute inset-0 rounded-full"
          style={{ border: "1.5px solid rgba(150,120,255,0.55)", animationDelay: `${d}s` }}
        />
      ))}
      {/* brand-gradient rim */}
      <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="lep-node-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c9b8ff" />
            <stop offset="55%" stopColor="#7a5af8" />
            <stop offset="100%" stopColor="#2cc1eb" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="47" fill="none" stroke="url(#lep-node-rim)" strokeWidth="1.4" opacity="0.85" />
      </svg>
      {/* glowing core */}
      <span
        aria-hidden
        className="cs-lep-core pointer-events-none absolute rounded-full"
        style={{
          inset: "24%",
          background:
            "radial-gradient(closest-side, rgba(170,140,255,0.85) 0%, rgba(122,90,248,0.25) 60%, rgba(122,90,248,0) 100%)",
        }}
      />
      {/* code glyph — the software */}
      <svg
        aria-hidden
        width={Math.round(size * 0.3)}
        height={Math.round(size * 0.3)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgba(238,234,255,0.95)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="relative"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    </div>
  );
}

/** "Your Application" caption for the convergence node the vectors flow into. */
function NodeLabel(): React.ReactElement {
  return (
    <span
      className="whitespace-nowrap font-display text-[#111]"
      style={{
        fontSize: "var(--fs-h5)",
        fontWeight: 600,
        letterSpacing: "-0.02em",
      }}
    >
      Your Application
    </span>
  );
}

function FlowDesktop(): React.ReactElement {
  return (
    <div
      className="mx-auto hidden lg:block"
      style={
        {
          "--flow-scale": "min(1, calc((min(100vw, 1200px) - 48px) / 1120px))",
          width: "calc(1120px * var(--flow-scale))",
          height: "calc(460px * var(--flow-scale))",
        } as React.CSSProperties
      }
    >
      <div
        className="relative"
        style={{
          width: `${VB.w}px`,
          height: `${VB.h}px`,
          transform: "scale(var(--flow-scale))",
          transformOrigin: "top left",
        }}
      >
        {/* Beams — accent gradient, flowing toward the node. */}
        <svg aria-hidden viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            {VECTORS.map((v) => (
              <linearGradient key={v.key} id={`lep-beam-${v.key}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={v.accent} stopOpacity="0.85" />
                <stop offset="100%" stopColor="#6e40ff" stopOpacity="0.9" />
              </linearGradient>
            ))}
            <filter id="lep-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {VECTORS.map((v, i) => (
            <path
              key={v.key}
              className="cs-lep-beam"
              d={beamPath(CARD_CY[i] ?? NODE.cy)}
              stroke={`url(#lep-beam-${v.key})`}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeDasharray="2 9"
              style={{ animationDelay: `${i * -0.4}s` }}
            />
          ))}
          {/* Glowing packets travelling from each card into the node. */}
          {VECTORS.map((v, i) => (
            <circle
              key={`pk-${v.key}`}
              className="cs-lep-packet"
              r="4.5"
              fill={v.accent}
              filter="url(#lep-glow)"
              style={{
                offsetPath: `path("${beamPath(CARD_CY[i] ?? NODE.cy)}")`,
                animationDelay: `${i * -0.65}s`,
              }}
            />
          ))}
        </svg>

        {/* Soft ambient glow behind the node. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pct(NODE.cx, VB.w),
            top: pct(NODE.cy, VB.h),
            width: 320,
            height: 320,
            background:
              "radial-gradient(closest-side, rgba(110,64,255,0.16) 0%, rgba(110,64,255,0) 70%)",
          }}
        />

        {/* Cards. */}
        {VECTORS.map((v, i) => (
          <div
            key={v.key}
            className="absolute -translate-y-1/2"
            style={{ left: 0, top: pct(CARD_CY[i] ?? 0, VB.h) }}
          >
            <VectorCard v={v} />
          </div>
        ))}

        {/* Convergence node + "Your Application" caption. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: pct(NODE.cx, VB.w), top: pct(NODE.cy, VB.h) }}
        >
          <SoftwareNode size={NODE.r * 2} />
        </div>
        <div
          className="absolute -translate-x-1/2 text-center"
          style={{ left: pct(NODE.cx, VB.w), top: pct(NODE.cy + NODE.r + 24, VB.h) }}
        >
          <NodeLabel />
        </div>
      </div>
    </div>
  );
}

/** Stacked vertical flow for < lg — cards feed a node at the bottom. */
function FlowMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3 lg:hidden">
      {VECTORS.map((v, i) => (
        <div key={v.key} className="flex w-full max-w-[420px] flex-col items-center gap-3">
          <VectorCard v={v} />
          <span
            aria-hidden
            className="cs-lep-beam-v h-6 w-[2.5px] rounded-full"
            style={{
              background: `linear-gradient(180deg, ${v.accent} 0%, rgba(110,64,255,0.6) 100%)`,
              animationDelay: `${i * -0.4}s`,
            }}
          />
        </div>
      ))}
      <div className="flex flex-col items-center gap-3">
        <SoftwareNode size={112} />
        <NodeLabel />
      </div>
    </div>
  );
}

export function LibrariesPipeline(): React.ReactElement {
  return (
    <Section
      padding="lg"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f6f4fc 100%)",
      }}
    >
      {/* Light-section accents — gridlines + a soft brand wash. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/deal-registration/ecosystems-corner-grid.svg"
        alt=""
        className="pointer-events-none absolute right-0 top-0 hidden select-none lg:block"
        style={{ width: "320px", height: "323px" }}
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          left: "calc(-40 / 1920 * 100%)",
          top: "-280px",
          width: "700px",
          height: "700px",
          background:
            "radial-gradient(50% 50% at 50% 50%, #9a51ff 0%, rgba(154,81,255,0) 100%)",
          opacity: 0.06,
        }}
      />
      <Container className="relative">
        <Reveal header>
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              className="font-display text-[#111]"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
              }}
            >
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(102deg, #9a51ff 0%, #2cc1eb 100%)" }}
              >
                Libraries
              </span>{" "}
              Come from Everywhere. Trust Doesn&rsquo;t.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[680px] font-sans text-[#555]"
              style={{
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.5,
                textWrap: "balance",
              }}
            >
              Every application depends on libraries introduced from multiple
              sources.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-10 lg:mt-6">
          <FlowDesktop />
          <FlowMobile />
        </Reveal>
      </Container>
    </Section>
  );
}
