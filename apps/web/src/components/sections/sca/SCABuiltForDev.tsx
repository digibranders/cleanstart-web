import type React from "react";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";

const CARDS = [
  {
    id: "cicd",
    title: "CI/CD Pipelines",
    desc: "Integrate into existing development workflows.",
    // 62px corner faces the centre ball
    borderRadius: "8px 8px 62px 8px",
  },
  {
    id: "devsecops",
    title: "DevSecOps Teams",
    desc: "Reduce remediation overhead and alert fatigue.",
    // 62px corner faces the centre ball
    borderRadius: "8px 8px 8px 62px",
  },
  {
    id: "container",
    title: "Container Environments",
    desc: "Improve visibility into inherited dependencies.",
    // 62px corner faces the centre ball
    borderRadius: "8px 62px 8px 8px",
  },
  {
    id: "enterprise",
    title: "Enterprise Security Teams",
    desc: "Focus on actionable risk instead of noise.",
    // 62px corner faces the centre ball
    borderRadius: "62px 8px 8px 8px",
  },
] as const;

const CARD_TITLE: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "var(--fs-h3)",
  fontWeight: 600,
  letterSpacing: "-0.04em",
  lineHeight: 1.1,
  color: "#111111",
};

const CARD_DESC: React.CSSProperties = {
  marginTop: "clamp(6px, 0.625vw, 12px)",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  lineHeight: 1.4,
  color: "#333333",
};

export function SCABuiltForDev(): React.ReactElement {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#f7f7f7", paddingTop: "120px", paddingBottom: "var(--spacing-section-cta)" }}
    >
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
        <Reveal header>
          <h2
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111111",
            }}
          >
            Built for Modern Development{" "}
            <span className="block cs-text-gradient-impact">Workflows</span>
          </h2>
        </Reveal>

        <div
          className="flex flex-col lg:flex-row lg:items-center"
          style={{
            marginTop: "clamp(40px, 4.17vw, 60px)",
            gap: "32px",
          }}
        >
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
              src="/images/sca/workflows-hero.webp"
              alt="CleanStart integrated into modern development workflows"
              fill
              sizes="(min-width: 1280px) 712px, (min-width: 768px) 60vw, 100vw"
              className="object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>

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

        {/* Curved-card-cradle pattern: cards 2 and 3 have concave curves that
            cradle the central ball, positioned with negative margins so it
            overlaps both cards by 20px each. Reuses the generic SBOM SVG curve
            assets. */}
        <div
          className="lg:hidden flex flex-col items-center"
          style={{ marginTop: "clamp(32px,6vw,48px)", width: "100%" }}
        >
          <div
            className="flex flex-col items-center"
            style={{ width: "min(328px, 100%)", gap: "16px" }}
          >
            <MobileBuiltForDevCard
              title="CI/CD Pipelines"
              body="Integrate into existing development workflows."
              bgSvg="/images/sbom/mobile-builtfor-card-a.svg"
              height={122}
            />

            {/* 145px tall to fit the longer 2-line body comfortably. */}
            <MobileBuiltForDevCard
              title="DevSecOps Teams"
              body="Reduce remediation overhead and alert fatigue."
              bgSvg="/images/sbom/mobile-builtfor-card-c.svg"
              height={145}
            />

            {/* Ball overlaps the cards above and below by 20px each. With
                gap:16px the net negative margin for a 20px overlap is 36px. */}
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

            <MobileBuiltForDevCard
              title="Container Environments"
              body="Improve visibility into inherited dependencies."
              bgSvg="/images/sbom/mobile-builtfor-card-b.svg"
              height={145}
            />

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

/**
 * Renders the SVG as a full-bleed background with content centred on top. The
 * fixed 328px width matches the SBOM card geometry so the shared curve assets
 * line up with the central ball overlap.
 */
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bgSvg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        loading="lazy"
      />
      {/* Capped at 260px so content never touches the SVG's curved edges. */}
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
