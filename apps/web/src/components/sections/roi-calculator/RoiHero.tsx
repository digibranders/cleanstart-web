import type React from "react";
import { HeroReveal } from "@/components/ui/Reveal";

/*
 * ROI calculator hero — LIGHT band. A soft brand-gradient wash plus a faint
 * grid motif sit on white, keeping the premium look without the site's usual
 * dark hero. Eyebrow + headline (gradient accent word) + lead. Above the fold,
 * so it uses HeroReveal rather than FadeUp.
 */
export function RoiHero(): React.ReactElement {
  return (
    <section
      data-section="RoiHero"
      className="relative overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Soft brand-gradient wash, top-centre. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute"
        style={{
          top: "-260px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(1100px, 120%)",
          height: "620px",
          background:
            "radial-gradient(closest-side, rgba(70,30,192,0.12), rgba(57,96,249,0.08) 45%, rgba(44,193,235,0.05) 70%, rgba(255,255,255,0) 100%)",
          filter: "blur(20px)",
        }}
      />
      {/* Faint grid motif. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,17,17,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(17,17,17,0.035) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(closest-side at 50% 30%, #000 40%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(closest-side at 50% 30%, #000 40%, transparent 85%)",
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10 flex flex-col items-center text-center"
        style={{
          paddingTop: "calc(72px + var(--cs-header-extra) + clamp(40px, 5vw, 72px))",
          paddingBottom: "clamp(32px, 4vw, 56px)",
        }}
      >
        <HeroReveal y={50} duration={1.0} lcp>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-display)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#111111",
            }}
          >
            <span style={{ display: "block" }}>See what hardened runtimes</span>
            <span style={{ display: "block" }} className="cs-text-gradient-impact">actually change</span>
          </h1>
        </HeroReveal>

        <HeroReveal y={30} delay={0.2} duration={0.8}>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-lead)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.5,
              color: "rgba(17,17,17,0.66)",
              maxWidth: "60ch",
              marginTop: "20px",
            }}
          >
            Describe your setup and see what minimal, trusted container images
            change — fewer vulnerabilities, faster releases, hours won back.
          </p>
        </HeroReveal>
      </div>
    </section>
  );
}
