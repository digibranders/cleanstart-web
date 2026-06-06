import Image from "next/image";
import type { CSSProperties } from "react";
import { Container } from "@/components/layout/Container";

const HERO_GRADIENT =
  "linear-gradient(180deg, #0B0820 0%, #131248 38%, #2E1D8E 70%, #5A2EE0 95%, #6E3CFF 100%)";

const GRID_CELL = "71.11px";
const GRID_BORDER = "1px";
// Figma spec is #130F26 against a near-black bg; rendered as low-opacity white
// so the lines read consistently across the gradient's brighter midtones.
const GRID_COLOR = "rgba(255, 255, 255, 0.06)";

/**
 * Bordered grid pattern — matches Figma node 857:18367 spec exactly:
 * 71.11px × 71.11px cells, 1.29px borders in #130F26. Built from two
 * crossed linear-gradients so it tiles at any width without an SVG asset.
 */
const GRID_BG: CSSProperties = {
  backgroundImage: `linear-gradient(to right, ${GRID_COLOR} ${GRID_BORDER}, transparent ${GRID_BORDER}), linear-gradient(to bottom, ${GRID_COLOR} ${GRID_BORDER}, transparent ${GRID_BORDER})`,
  backgroundSize: `${GRID_CELL} ${GRID_CELL}`,
  backgroundPosition: "0 0",
};

/**
 * Title — 72 px max at desktop (per product spec; Figma 190 px is the 1920
 * display tier and reads oversized at 1440). Scales down to 40 px on phones.
 */
const TITLE_STYLE: CSSProperties = {
  fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
  lineHeight: 1.05,
  letterSpacing: "-0.03em",
  color: "rgba(255, 255, 255, 0.35)",
  fontWeight: 600,
};

export interface ErrorHeroProps {
  /** Large display title (e.g. "Page Not Found", "Server Error"). */
  title: string;
  /** Optional reference id rendered below the illustration (Sentry digest). */
  referenceId?: string | undefined;
}

export function ErrorHero({ title, referenceId }: ErrorHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: HERO_GRADIENT }}
    >
      {/* Bordered grid pattern — confined to the top ~498px to match the
          Figma "bg" group (857:18367) that only covers the title region.
          Fades to transparent at the bottom edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          ...GRID_BG,
          height: "clamp(420px, 32vw, 498px)",
          maskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Rotated purple blob — matches Figma "Ellipse 46640":
          974×862, #7A59FF @ 3% opacity, 125px blur, 43deg rotation,
          positioned top-left negative offset. Intentionally very faint —
          adds warmth to the upper-left without competing with the grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "calc(-280.57px / 1920 * 100%)",
          top: "-358px",
          width: "min(974px, 60vw)",
          aspectRatio: "974 / 862",
          background: "#7A59FF",
          opacity: 0.08,
          filter: "blur(125px)",
          transform: "rotate(43deg)",
          borderRadius: "50%",
        }}
      />

      {/* Vertical accent lines — Figma "Line 106 / 107 / 108".
          Each is 142.22px tall, rotated 90deg (so visually vertical).
          Hidden below md so they don't crowd narrow viewports. */}
      <span
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          left: "calc(213.33px / 1920 * 100%)",
          top: "142.22px",
          width: "1px",
          height: "142.22px",
          background: "rgba(255,255,255,0.55)",
          opacity: 0.28,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          left: "calc(426.67px / 1920 * 100%)",
          top: "285.74px",
          width: "1px",
          height: "142.22px",
          background: "rgba(255,255,255,0.55)",
          opacity: 0.28,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute hidden md:block"
        style={{
          left: "calc(142.22px / 1920 * 100%)",
          top: "355.56px",
          width: "1px",
          height: "142.22px",
          background: "rgba(255,255,255,0.55)",
          opacity: 0.18,
        }}
      />

      {/* Soft purple glow behind the illustration — bottom-half ambience. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: "38%",
          width: "min(820px, 80vw)",
          height: "min(820px, 80vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(122,89,255,0.40) 0%, rgba(122,89,255,0) 70%)",
          filter: "blur(60px)",
        }}
      />

      <Container variant="default" className="relative">
        <div className="flex flex-col items-center pt-[clamp(80px,10vw,140px)] pb-[clamp(48px,6vw,96px)] text-center">
          <h1 className="font-display text-balance" style={TITLE_STYLE}>
            {title}
          </h1>

          {/* 3D illustration — Figma node 857:19445 (797×655 at 1920).
              Scales fluidly with the viewport: 260 px on small phones up to
              520 px at desktop, with healthy whitespace above and below. */}
          <div
            className="relative mt-[clamp(32px,4vw,56px)] w-full"
            style={{ maxWidth: "clamp(260px, 42vw, 520px)" }}
          >
            <Image
              src="/images/error/page-not-found-illustration.webp"
              alt=""
              width={1120}
              height={928}
              priority
              sizes="(min-width: 1280px) 520px, (min-width: 640px) 42vw, 80vw"
              className="h-auto w-full select-none"
              draggable={false}
            />
          </div>

          {referenceId ? (
            <p className="mt-6 font-mono text-xs text-white/55">
              trace · <span className="text-white/80">{referenceId}</span>
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
