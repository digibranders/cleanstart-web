import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { SbomReportWindow } from "./SbomReportWindow";

export function SbomHero(): React.ReactElement {
  return (
    <section
      data-section="SbomHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: "clamp(480px, 40vw, 652px)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/sbom/hero-rays.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden md:block"
        style={{
          left: "31.4%",
          top: 0,
          width: "38%",
          height: "auto",
          mixBlendMode: "screen",
          opacity: 0.6,
        }}
        loading="eager"
        decoding="async"
      />

      {/* Blends the hero gradient into the white section below. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "180px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.85) 85%, #ffffff 100%)",
        }}
      />

      <div
        className="relative mx-auto z-[2] flex w-full max-w-[var(--container-default)] flex-col justify-center px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(112px, 8vw, 128px) + var(--cs-header-extra))",
          paddingBottom: "clamp(40px, 5vw, 80px)",
          minHeight: "clamp(480px, 40vw, 652px)",
        }}
      >
        {/* Decorative grid — shares the report window's positioning box (same
            right anchor / vertical centre / clamp width) and is centred on it,
            so the grid tracks the window at every breakpoint. Kept outside the
            blurred window wrapper so it stays crisp. */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden lg:block right-6 sm:right-10 z-0"
          style={{ top: "54%", transform: "translateY(-50%)", width: "clamp(400px, 34vw, 480px)" }}
        >
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: "730px", maxWidth: "none", aspectRatio: "730 / 708" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/newsroom/hero-grid.svg"
              alt=""
              loading="eager"
              decoding="async"
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Sample SPDX SBOM report — DESKTOP ONLY (lg+), right side. Slightly
            blurred so it reads as a soft backdrop behind the headline; decorative
            (the window itself is aria-hidden). Container-relative so its right
            edge respects the gutter and the 1440 cap. */}
        <div
          aria-hidden
          className="absolute pointer-events-none select-none hidden lg:block right-6 sm:right-10 z-[1]"
          style={{
            top: "54%",
            transform: "translateY(-50%)",
            width: "clamp(440px, 37vw, 520px)",
            filter: "blur(1px)",
          }}
        >
          {/* animate wrapper: opacity entrance + float. Kept separate from the
              positioning div so translateY(-50%) is never overwritten. */}
          <div className="cs-sbom-window-animate">
            <SbomReportWindow />
          </div>
        </div>

        {/* Text column — centered on mobile, left-aligned md+. */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "623px" }}
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
                marginBottom: "clamp(16px, 2.5vw, 32px)",
                textTransform: "capitalize",
              }}
            >
              Continuously Verifiable SBOMs
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.2} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: 400,
                letterSpacing: "-0.02em",
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.80)",
                marginBottom: "clamp(24px, 2.5vw, 32px)",
              }}
            >
              Software transparency and provenance visibility designed for modern software supply
              chains.
            </p>
          </HeroReveal>

          <HeroReveal y={30} delay={0.35} duration={0.8} className="self-center md:self-start">
            <Link
              href="/book-a-demo"
              className="cs-btn-glass"
              style={
                {
                  "--cs-btn-px": "18px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              Watch How SBOM Works
              <svg
                className="cs-cta-arrow"
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
