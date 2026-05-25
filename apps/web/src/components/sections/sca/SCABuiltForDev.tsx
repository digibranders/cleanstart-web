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

        {/* ── Content row: image panel + cards grid ── */}
        <div
          style={{
            marginTop: "clamp(40px, 4.17vw, 60px)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "32px",
          }}
        >
          {/* Left — circuit-board image panel */}
          <div
            className="flex-shrink-0"
            style={{
              width: "clamp(260px, 40.1%, 512px)",
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

          {/* Right — 2×2 card grid with centred ball */}
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
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

            {/* Blue gradient ball — centred at the junction of all 4 cards */}
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
      </div>
    </section>
  );
}
