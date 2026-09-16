import Link from "next/link";

import { Container, Section } from "@/components/layout";
import { Reveal, RevealItem, RevealStagger } from "@/components/ui/Reveal";
import { ScaleToFit } from "@/components/ui/ScaleToFit";
import { GlassIcon } from "@/components/sections/_shared/GlassIcon";

/**
 * "One Intelligence Layer. Multiple Security Decisions." — Tricorder as the
 * substrate the three products draw on. A single glowing core at the top fans
 * out through three branches (packets flow downward) into the product cards,
 * each of which names the decision it makes and links to its page. The scene
 * is a fixed 1040px design canvas scaled to fit, like the other coded scenes;
 * below lg the branches become a vertical spine and the cards stack.
 *
 * Last section on the page: the bottom padding reserves the footer CTA's
 * overlap zone (see Footer.tsx layout contract).
 */

interface Product {
  key: string;
  title: string;
  desc: string;
  decision: string;
  href: string;
  accent: string;
  glyph: "cube" | "brackets" | "radar";
}

const PRODUCTS: Product[] = [
  {
    key: "images",
    title: "Clean Images",
    desc: "Verify images before release.",
    decision: "Release-time decisions",
    href: "/cleanstart-images",
    accent: "#5b9bff",
    glyph: "cube",
  },
  {
    key: "libraries",
    title: "Clean Libraries",
    desc: "Trust dependencies before they enter your build.",
    decision: "Build-time decisions",
    href: "/clean-libraries",
    accent: "#2dd4bf",
    glyph: "brackets",
  },
  {
    key: "cleansight",
    title: "CleanSight",
    desc: "Map risk across your container estate.",
    decision: "Fleet-level intelligence",
    href: "/cleansight",
    accent: "#a974ff",
    glyph: "radar",
  },
];

function ProductGlyph({ glyph, size }: { glyph: Product["glyph"]; size: number }): React.ReactElement {
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
  switch (glyph) {
    case "cube":
      return (
        <svg {...common}>
          <path d="M12 2.5 20 7v10l-8 4.5L4 17V7l8-4.5Z" />
          <path d="M4 7l8 4.5L20 7" />
          <path d="M12 11.5v10" />
        </svg>
      );
    case "brackets":
      return (
        <svg {...common}>
          <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
          <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
          <path d="m14 8-4 8" />
        </svg>
      );
    case "radar":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 3v9l6.4 6.4" />
        </svg>
      );
  }
}

/* ---- Scene geometry: 1040×520 design canvas ------------------------------- */
const VB = { w: 1040, h: 576 } as const;
const CORE = { cx: 520, cy: 96, r: 62 } as const;
const CARD = { w: 320, h: 256, y: 312 } as const;
const CARD_X = [0, 360, 720] as const;
const BUS_Y = 250;
const pct = (v: number, total: number): string => `${(v / total) * 100}%`;

function branchPath(i: number): string {
  const cx = (CARD_X[i] ?? 0) + CARD.w / 2;
  const top = CORE.cy + CORE.r + 58; // below the core's two-line caption
  if (cx === CORE.cx) return `M ${CORE.cx} ${top} L ${cx} ${CARD.y}`;
  const dir = cx < CORE.cx ? -1 : 1;
  return `M ${CORE.cx} ${top} L ${CORE.cx} ${BUS_Y - 18} Q ${CORE.cx} ${BUS_Y} ${CORE.cx + dir * 18} ${BUS_Y} L ${cx - dir * 18} ${BUS_Y} Q ${cx} ${BUS_Y} ${cx} ${BUS_Y + 18} L ${cx} ${CARD.y}`;
}

/** The Tricorder core: a dark glass orb with the brand rim, the wordmark beneath. */
function TricorderCore(): React.ReactElement {
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
            "0 20px 44px -18px rgba(110,64,255,0.7), 0 0 60px rgba(110,64,255,0.35), inset 0 2px 6px rgba(198,190,255,0.28), inset 0 -12px 24px rgba(0,0,0,0.55)",
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
            <linearGradient id="tri-sub-rim" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c9b8ff" />
              <stop offset="55%" stopColor="#7a5af8" />
              <stop offset="100%" stopColor="#2cc1eb" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="47" fill="none" stroke="url(#tri-sub-rim)" strokeWidth="1.4" opacity="0.85" />
        </svg>
        <span
          aria-hidden
          className="cs-lep-core pointer-events-none absolute rounded-full"
          style={{
            inset: "22%",
            background:
              "radial-gradient(closest-side, rgba(170,140,255,0.9) 0%, rgba(122,90,248,0.25) 60%, rgba(122,90,248,0) 100%)",
          }}
        />
        {/* The Tricorder mark: a lens with a check — the verdict glyph. */}
        <svg
          aria-hidden
          width={Math.round(size * 0.4)}
          height={Math.round(size * 0.4)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(238,234,255,0.95)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="relative"
        >
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5" />
          <path d="m9.2 12 1.9 1.9 3.7-3.9" />
        </svg>
      </div>
      <p
        className="mt-3 whitespace-nowrap text-center font-display text-white"
        style={{ fontSize: "var(--fs-h6)", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}
      >
        Tricorder
      </p>
      <p
        className="whitespace-nowrap text-center font-sans text-white/60"
        style={{ fontSize: "var(--fs-caption)", letterSpacing: "-0.01em" }}
      >
        Software intelligence
      </p>
    </div>
  );
}

function ProductCard({ product }: { product: Product }): React.ReactElement {
  return (
    <Link
      href={product.href}
      className="group flex h-full w-full flex-col justify-between p-6 outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#33BAEC]"
      style={{
        borderRadius: "var(--radius-cs-card)",
        background: "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: `1px solid color-mix(in srgb, ${product.accent} 34%, rgba(255,255,255,0.10))`,
        boxShadow: `0 24px 48px -30px color-mix(in srgb, ${product.accent} 60%, transparent), inset 0 1px 0 rgba(255,255,255,0.08)`,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div>
        <div className="flex items-center justify-between">
          <GlassIcon accent={product.accent} size={48}>
            <ProductGlyph glyph={product.glyph} size={24} />
          </GlassIcon>
          <svg
            className="text-white/40 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-white"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </div>
        <h3
          className="mt-5 font-display text-white"
          style={{ fontSize: "var(--fs-h4)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}
        >
          {product.title}
        </h3>
        <p
          className="mt-2 font-sans text-white/70"
          style={{ fontSize: "var(--fs-body)", lineHeight: 1.5, letterSpacing: "-0.01em" }}
        >
          {product.desc}
        </p>
      </div>
      <p
        className="mt-5 inline-flex items-center gap-2 border-t pt-4 font-display"
        style={{
          borderColor: "rgba(255,255,255,0.10)",
          fontSize: "var(--fs-caption)",
          fontWeight: 600,
          letterSpacing: "0.02em",
          color: `color-mix(in srgb, ${product.accent} 70%, #ffffff)`,
        }}
      >
        <span aria-hidden className="block h-[6px] w-[6px] rounded-full" style={{ background: product.accent, boxShadow: `0 0 10px ${product.accent}` }} />
        {product.decision}
      </p>
    </Link>
  );
}

function SceneDesktop(): React.ReactElement {
  return (
    <ScaleToFit designWidth={VB.w} className="mx-auto hidden max-w-[1040px] lg:block">
      <div className="relative" style={{ width: `${VB.w}px`, height: `${VB.h}px` }}>
        <svg aria-hidden viewBox={`0 0 ${VB.w} ${VB.h}`} className="absolute inset-0 h-full w-full" fill="none">
          <defs>
            {PRODUCTS.map((p) => (
              <linearGradient key={p.key} id={`tri-branch-${p.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b6cff" stopOpacity="0.9" />
                <stop offset="100%" stopColor={p.accent} stopOpacity="0.95" />
              </linearGradient>
            ))}
            <filter id="tri-sub-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {PRODUCTS.map((p, i) => (
            <path
              key={p.key}
              className="cs-lep-beam"
              d={branchPath(i)}
              stroke={`url(#tri-branch-${p.key})`}
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeDasharray="2 9"
              style={{ animationDelay: `${i * -0.4}s` }}
            />
          ))}
          {PRODUCTS.map((p, i) => (
            <circle
              key={`pk-${p.key}`}
              className="cs-lep-packet"
              r="4.5"
              fill={p.accent}
              filter="url(#tri-sub-glow)"
              style={{ offsetPath: `path("${branchPath(i)}")`, animationDelay: `${i * -0.85}s` }}
            />
          ))}
          {/* Landing dots where each branch meets its card. */}
          {PRODUCTS.map((p, i) => (
            <circle key={`dot-${p.key}`} cx={(CARD_X[i] ?? 0) + CARD.w / 2} cy={CARD.y} r="4" fill={p.accent} filter="url(#tri-sub-glow)" />
          ))}
        </svg>

        <div
          aria-hidden
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: pct(CORE.cx, VB.w),
            top: pct(CORE.cy, VB.h),
            width: 420,
            height: 420,
            background: "radial-gradient(closest-side, rgba(110,64,255,0.24) 0%, rgba(110,64,255,0) 70%)",
          }}
        />

        <div className="absolute -translate-x-1/2" style={{ left: pct(CORE.cx, VB.w), top: CORE.cy - CORE.r }}>
          <TricorderCore />
        </div>

        {PRODUCTS.map((p, i) => (
          <div key={p.key} className="absolute" style={{ left: CARD_X[i], top: CARD.y, width: CARD.w, height: CARD.h }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </ScaleToFit>
  );
}

function SceneMobile(): React.ReactElement {
  return (
    <div className="flex flex-col items-center gap-3 lg:hidden">
      <TricorderCore />
      <span aria-hidden className="cs-lep-beam-v h-8 w-[2.5px] rounded-full" style={{ background: "linear-gradient(180deg, #8b6cff, rgba(139,108,255,0.4))" }} />
      <RevealStagger className="grid w-full max-w-[720px] grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4">
        {PRODUCTS.map((p) => (
          <RevealItem key={p.key} className="h-full">
            <ProductCard product={p} />
          </RevealItem>
        ))}
      </RevealStagger>
    </div>
  );
}

export function TricorderSubstrate(): React.ReactElement {
  return (
    <Section
      id="one-intelligence-layer"
      padding="none"
      className="overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #151021 0%, #131e8f 67%, #471ec0 107%)",
        scrollMarginTop: "var(--cs-header-h)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/stats-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          right: "-20px",
          top: "-206px",
          width: "469px",
          height: "488px",
          mixBlendMode: "overlay",
          transform: "rotate(-150deg) scaleY(-1)",
          opacity: 0.9,
        }}
        loading="lazy"
        decoding="async"
      />
      <Container
        className="relative py-section-lg"
        style={{ paddingBottom: "max(var(--spacing-section-cta), 175px)" }}
      >
        <Reveal header>
          <div className="mx-auto max-w-[820px] text-center">
            <h2
              className="font-display text-white"
              style={{ fontSize: "var(--fs-h2)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.08, textWrap: "balance" }}
            >
              One Intelligence Layer. Multiple Security Decisions.
            </h2>
            <p
              className="mx-auto mt-6 max-w-[700px] font-sans text-white/80"
              style={{ fontSize: "var(--fs-lead)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.5, textWrap: "balance" }}
            >
              Tricorder powers CleanStart with a shared intelligence substrate,
              bringing consistent software analysis wherever components enter
              and run.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-12 lg:mt-16">
          <SceneDesktop />
          <SceneMobile />
        </Reveal>
      </Container>
    </Section>
  );
}
