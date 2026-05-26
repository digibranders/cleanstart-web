import type React from "react";
import Image from "next/image";

/**
 * Built for Modern Development Workflows — Figma node 604:3117
 * Layout: centred heading + flex row (image panel left, 2×2 cards grid right)
 * Blue gradient ball sits absolutely at the centre junction of all 4 cards.
 * Each card has one 62px corner facing the ball; the other three corners are 8px.
 */

/* ─── Card data ─────────────────────────────────────────── */

const CARDS = [
  {
    id: "cicd",
    title: "CI/CD Pipelines",
    desc: "Integrate into existing development workflows.",
    // Bottom-right corner (62px) faces center ball
    borderRadius: "8px 8px 62px 8px",
  },
  {
    id: "devsecops",
    title: "DevSecOps Teams",
    desc: "Reduce remediation overhead and alert fatigue.",
    // Bottom-left corner (62px) faces center ball
    borderRadius: "8px 8px 8px 62px",
  },
  {
    id: "container",
    title: "Container Environments",
    desc: "Improve visibility into inherited dependencies.",
    // Top-right corner (62px) faces center ball
    borderRadius: "8px 62px 8px 8px",
  },
  {
    id: "enterprise",
    title: "Enterprise Security Teams",
    desc: "Focus on actionable risk instead of noise.",
    // Top-left corner (62px) faces center ball
    borderRadius: "62px 8px 8px 8px",
  },
] as const;

/* ─── Shared text styles ────────────────────────────────── */

const CARD_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(20px, 2vw, 28px)",
  fontWeight: 600,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#111111",
};

const CARD_DESC: React.CSSProperties = {
  marginTop: "clamp(6px, 0.625vw, 12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "clamp(15px, 1.4vw, 20px)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.4,
  color: "#333333",
};

/* ─── Component ─────────────────────────────────────────── */

export function SCABuiltForDev(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f7f7f7", paddingTop: "120px", paddingBottom: "var(--spacing-section-cta)" }}
    >
      {/* Decorative purple glow — left edge */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "50%",
          left: "-180px",
          transform: "translateY(-50%)",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(154,81,255,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Decorative purple glow — right edge */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          top: "50%",
          right: "-180px",
          transform: "translateY(-50%)",
          width: "360px",
          height: "360px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(154,81,255,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative mx-auto" style={{ maxWidth: "1276px", padding: "0 24px" }}>
        {/* ── Heading ── */}
        <h2
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "#111111",
          }}
        >
          Built for Modern Development{" "}
          <span className="block cs-text-gradient-impact">Workflows</span>
        </h2>

        {/* ── Content row: image panel + cards grid.
            Mobile: column layout — image full-width on top, cards stack 1-col
            below, central blue ball moves to between cards 2 and 3 via order.
            Desktop (lg+): original 2-col row with image left, 2×2 cards right,
            ball absolute-centered at the grid intersection. */}
        <div
          className="flex flex-col lg:flex-row lg:items-center"
          style={{
            marginTop: "clamp(40px, 4.17vw, 60px)",
            gap: "32px",
          }}
        >
          {/* Left — circuit-board image panel. Mobile: full-width. lg+: ~40% */}
          <div
            className="w-full lg:w-[clamp(260px,40.1%,512px)] lg:flex-shrink-0"
            style={{
              aspectRatio: "512 / 384",
              borderRadius: "20px",
              border: "1.5px solid #076eff",
              overflow: "hidden",
              position: "relative",
              background: "rgba(44,193,235,0.4)",
            }}
          >
            <Image
              src="/images/sca/workflows-hero.png"
              alt="CleanStart integrated into modern development workflows"
              fill
              sizes="(min-width: 1280px) 712px, (min-width: 768px) 60vw, 100vw"
              className="object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Right — DESKTOP cards grid (lg+ only). 2×2 layout with the blue
              ball absolute-centered at the grid intersection. Each card uses
              its per-card 62px-on-one-corner borderRadius so the curve faces
              the central ball. */}
          <div
            className="hidden lg:grid lg:grid-cols-2 lg:flex-1"
            style={{
              position: "relative",
              gridTemplateRows:
                "clamp(100px, 9.375vw, 180px) clamp(100px, 9.375vw, 180px)",
              columnGap: "clamp(12px, 1.2vw, 23px)",
              rowGap: "clamp(14px, 1.35vw, 26px)",
            }}
          >
            {CARDS.map(({ id, title, desc, borderRadius }) => (
              <div
                key={id}
                style={{
                  borderRadius,
                  background: "#ffffff",
                  boxShadow: "0px 2px 16px rgba(0,0,0,0.07)",
                  padding:
                    "clamp(16px, 1.46vw, 28px) clamp(16px, 1.46vw, 28px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <p style={CARD_TITLE}>{title}</p>
                <p style={CARD_DESC}>{desc}</p>
              </div>
            ))}

            {/* Blue gradient ball — absolute-centered at the 2×2 junction */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                boxShadow: "0px 4.629px 10.903px rgba(28,60,142,0.33)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sca/workflows-ball-icon.svg"
                alt=""
                style={{ width: "34px", height: "40px", display: "block" }}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>

        {/* ── MOBILE cards (sub-lg only) ──
            Curved-card-cradle pattern matching SbomAdvantage: 4 stacked cards
            with SVG backgrounds where cards 2 and 3 have concave curves that
            "cradle" the central ball (positioned with negative margins so it
            overlaps both cards by 20px each). Reuses the existing SBOM SVG
            assets (the curve shapes are generic, not SBOM-specific). */}
        <div
          className="lg:hidden flex flex-col items-center"
          style={{ marginTop: "clamp(32px,6vw,48px)", width: "100%" }}
        >
          <div
            className="flex flex-col items-center"
            style={{ width: "min(328px, 100%)", gap: "16px" }}
          >
            {/* CI/CD Pipelines — plain border (card-a), 122px */}
            <MobileBuiltForDevCard
              title="CI/CD Pipelines"
              body="Integrate into existing development workflows."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={122}
            />

            {/* DevSecOps Teams — curve at bottom (card-c) facing the ball below.
                145px tall to fit the longer 2-line body comfortably. */}
            <MobileBuiltForDevCard
              title="DevSecOps Teams"
              body="Reduce remediation overhead and alert fatigue."
              bgSvg="/images/sbom/mobile-builtfor-card-c.svg"
              height={145}
            />

            {/* Central ball — overlaps DevSecOps (above) and Container (below)
                by 20px each. With gap:16px the net negative margin needed for
                a 20px overlap on each side is 16 + 20 = 36px. */}
            <div
              aria-hidden
              className="flex items-center justify-center self-center shrink-0"
              style={{
                position: "relative",
                zIndex: 2,
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
                boxShadow:
                  "0px 3.6px 8.48px 0px rgba(28,60,142,0.33), inset 0px -0.136px 0.17px 0px rgba(0,44,179,0.5), inset 0px 0.068px 0.339px 0px rgba(255,255,255,0.81)",
                marginTop: "-36px",
                marginBottom: "-36px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sca/workflows-ball-icon.svg"
                alt=""
                aria-hidden
                style={{ width: "26.62px", height: "30.91px" }}
                loading="lazy"
              />
            </div>

            {/* Container Environments — curve at top (card-b) facing the ball above */}
            <MobileBuiltForDevCard
              title="Container Environments"
              body="Improve visibility into inherited dependencies."
              bgSvg="/images/sbom/mobile-builtfor-card-b.svg"
              height={145}
            />

            {/* Enterprise Security Teams — plain border (card-a), 122px */}
            <MobileBuiltForDevCard
              title="Enterprise Security Teams"
              body="Focus on actionable risk instead of noise."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={122}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Mobile card with SVG-curve background ─────────────────
 * Mirrors SbomAdvantage's MobileBuiltForCard pattern. The SVG is rendered as
 * a full-bleed background image; content sits centered on top of it. Fixed
 * 328px width matches the SBOM card geometry so the same curve assets line
 * up correctly with the central ball overlap. */
function MobileBuiltForDevCard({
  title,
  body,
  bgSvg,
  height,
}: {
  title: string;
  body: string;
  bgSvg: string;
  height: number;
}): React.ReactElement {
  return (
    <div
      className="relative flex flex-col items-center justify-center text-center"
      style={{ width: "328px", height: `${height}px`, maxWidth: "100%" }}
    >
      {/* Background SVG frame (curve + border) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSvg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />
      {/* Content — capped at 260px so it never touches the SVG's curved edges */}
      <div
        className="relative flex flex-col items-center gap-[10px] text-center"
        style={{ width: "260px" }}
      >
        <p style={CARD_TITLE}>{title}</p>
        <p style={{ ...CARD_DESC, marginTop: 0 }}>{body}</p>
      </div>
    </div>
  );
}
