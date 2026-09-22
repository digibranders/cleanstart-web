import type React from "react";
import Link from "next/link";
import { HeroBreadcrumb } from "@/components/sections/_shared/HeroBreadcrumb";
import { BrandMarquee } from "@/components/sections/home/BrandMarquee";
import { HeroReveal } from "@/components/ui/Reveal";
import { CaseStudiesHeroVisual } from "./CaseStudiesHeroVisual";

/**
 * Listing hero for /case-studies.
 *
 * Built on the product-hero layout (text column left, vector visual right) with
 * the customer marquee docked at the base, the way the home hero resolves. One
 * dark act: the promise, the two ways to act on it, and who already did.
 *
 * Logos are knocked out to white rather than shown in their own colours. A
 * light band would read them better — colour is what makes a logo
 * recognisable — but eight unrelated brand palettes on top of a violet-to-cyan
 * gradient is noise at exactly the point the eye needs somewhere to land.
 * /community makes the opposite call on a short, light page, and both are
 * right for their surface.
 *
 * The visual is centred on the upper zone rather than the whole section:
 * centring it on the section would drop it straight through the marquee.
 */

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 25.7%, #10123e 37.8%, #131e8f 66.9%, #471ec0 79.7%, #471fc3 92.2%, rgba(70,30,191,0.85) 97.9%, rgba(66,30,188,0.4) 107.7%, rgba(66,30,188,0) 113.5%)";

/** Upper zone only. The marquee adds its own height below this. */
const STAGE_MIN_HEIGHT = "clamp(400px, 32vw, 470px)";

export function CaseStudiesHero(): React.ReactElement {
  return (
    <section
      data-section="CaseStudiesHero"
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="case-studies-hero-title"
    >
      {/* Decorative grid + glow lines baked from Figma (full-bleed). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/case-studies/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
        loading="eager"
        decoding="async"
      />

      <div
        className="relative z-[2] mx-auto flex w-full max-w-[var(--container-default)] flex-col px-6 sm:px-10"
        style={{ paddingTop: "calc(72px + var(--cs-header-extra))" }}
      >
        <HeroBreadcrumb
          items={[
            { name: "Home", path: "/" },
            { name: "Case Studies" },
          ]}
          navClassName="pt-4"
        />

        {/* Upper zone: headline and visual share this box. */}
        <div
          className="relative flex items-center"
          style={{ minHeight: STAGE_MIN_HEIGHT }}
        >
          {/* Anchored to the container's right gutter so it respects the 1440
              cap instead of drifting to the viewport edge on ultra-wide. */}
          {/* Not aria-hidden: the SVG carries role="img" and a description of
              what the chart shows, which a hidden wrapper would suppress. */}
          <div
            className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 select-none lg:block"
            style={{
              width: "clamp(430px, 42vw, 620px)",
              aspectRatio: "640 / 500",
            }}
          >
            <CaseStudiesHeroVisual />
          </div>

          <div
            className="relative flex flex-col"
            style={{ maxWidth: "660px", gap: "clamp(20px, 2vw, 28px)" }}
          >
            <HeroReveal y={50} duration={1.0} lcp>
              <h1
                id="case-studies-hero-title"
                className="font-display text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.06,
                }}
              >
                Case studies with{" "}
                <span className="cs-text-shine">the numbers</span> behind them
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.15} duration={0.8}>
              <p
                className="font-sans"
                style={{
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  lineHeight: 1.45,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.8)",
                  maxWidth: "580px",
                }}
              >
                See how security and platform teams standardized their container
                foundations, cut inherited vulnerability risk, and kept shipping.
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.3} duration={0.8}>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="#customer-stories"
                  className="cs-btn-glass"
                  style={
                    {
                      "--cs-btn-fs": "clamp(16px, 1.04vw, 18px)",
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "22px",
                    } as React.CSSProperties
                  }
                >
                  Explore customer stories
                </Link>
                <Link
                  href="/book-a-demo"
                  className="cs-btn-blue"
                  style={
                    {
                      "--cs-btn-fs": "clamp(16px, 1.04vw, 18px)",
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "22px",
                    } as React.CSSProperties
                  }
                >
                  Book a demo
                </Link>
              </div>
            </HeroReveal>
          </div>
        </div>

        {/* Customer marquee, docked at the base: same component, treatment and
            spacing shape as the home hero, with no rule above it — the home
            hero doesn't have one and the band needs no help separating from a
            gradient. */}
        <div className="relative pb-[clamp(40px,5vw,72px)] pt-[clamp(44px,5vw,72px)]">
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
