import type React from "react";
import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { CisoHeroVisual } from "./CisoHeroVisual";

/*
 * CISO hero — dark gradient band with a background texture overlay, a custom
 * SVG "Interception Field" visual on the right (desktop), and a left-aligned
 * headline + glass CTA. The visual replaces the old hand-masked stock photo:
 * it dramatises inherited software risk being intercepted and hardened, and —
 * being vector + container-relative — never drifts across viewports.
 */
export function CisoHero(): React.ReactElement {
  return (
    <section
      data-section="CisoHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{
        minHeight: "clamp(480px, 40vw, 652px)",
        backgroundImage:
          "linear-gradient(180deg, #151021 25.702%, #10123e 31.159%, #131e8f 51.006%, #471ec0 68.711%, #471fc3 79.832%, rgba(70,30,191,0.85) 85.018%, rgba(66,30,188,0.4) 93.72%, rgba(66,30,188,0) 98.921%)",
      }}
    >
      {/* Background texture overlay. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/ciso/hero-bg.svg"
        alt=""
        className="absolute left-0 top-0 w-full pointer-events-none select-none"
        style={{ height: "568px", objectFit: "cover" }}
        loading="eager"
        decoding="async"
      />

      <div
        className="relative mx-auto z-[2] flex w-full max-w-[var(--container-default)] flex-col justify-center px-6 sm:px-10"
        style={{
          // Fixed header is 72px tall and overlays the hero. Clearing it at the
          // top and centring the in-flow text column (the visual is absolute)
          // makes the gap above the heading equal the gap below the CTA.
          paddingTop: "calc(72px + var(--cs-header-extra))",
          paddingBottom: "0px",
          minHeight: "clamp(480px, 40vw, 652px)",
        }}
      >
        {/* "Interception Field" visual — DESKTOP ONLY (lg+), right side.
            Lives inside the container so its right edge respects the site gutter
            (right-6 sm:right-10 = the container's px-6 sm:px-10) and the 1440 cap.
            Vector + container-relative, so it scales cleanly at every viewport
            (no hand-tuned mask math). Hidden below lg. */}
        <div
          className="absolute pointer-events-none select-none hidden lg:block right-6 sm:right-10 z-[1]"
          style={{
            top: "54%",
            transform: "translateY(-50%)",
            width: "clamp(420px, 40vw, 600px)",
            aspectRatio: "600 / 478",
          }}
        >
          <CisoHeroVisual />
        </div>

        {/* Text column — centered on mobile, left-aligned md+. */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "749px" }}
        >
          <HeroReveal y={50} duration={1.0}>
            <h1
              className="text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--fs-display)",
                fontWeight: 600,
                letterSpacing: "var(--text-hero-product-ls, -0.04em)",
                lineHeight: "var(--text-hero-lh, 1.05)",
                marginBottom: "clamp(16px, 1.67vw, 32px)",
              }}
            >
              AI Scales Code Velocity. Security Can’t Keep Up.
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.8)",
                marginBottom: "clamp(24px, 1.67vw, 32px)",
              }}
            >
              Reduce inherited software risk while strengthening compliance
              readiness across modern software delivery.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.3} duration={0.8} className="self-center md:self-start">
            <Link
              href="/book-a-demo"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-fs": "clamp(16px, 1.04vw, 20px)",
                  "--cs-btn-h": "38px",
                  "--cs-btn-px": "18px",
                } as React.CSSProperties
              }
            >
              Request a Risk Assessment
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
