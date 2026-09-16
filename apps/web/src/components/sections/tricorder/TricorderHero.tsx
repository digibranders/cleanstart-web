import Link from "next/link";

import { HeroReveal } from "@/components/ui/Reveal";
import { TricorderHeroConsole } from "./TricorderHeroConsole";

/**
 * Tricorder hero — the site's product-hero shell (CleanSight / Clean Libraries):
 * the dark navy→purple gradient, left-aligned copy with a glass primary and a
 * ghost secondary, and the artifact on the right. The artifact is the scan
 * console (TricorderHeroConsole), drawn in code like the Clean Libraries
 * constellation rather than rendered.
 */
export function TricorderHero(): React.ReactElement {
  return (
    <section
      data-section="TricorderHero"
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 100%)",
      }}
    >
      {/* Gridline overlay — the shared hero decoration. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: "620px", objectFit: "cover", opacity: 0.55 }}
        loading="eager"
        decoding="async"
      />

      {/* Purple wash behind the console. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none md:block"
        style={{
          right: "-140px",
          top: "20px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.42) 0%, rgba(154,81,255,0) 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Cyan counter-glow, low left, so the copy column isn't sitting on flat navy. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "-220px",
          bottom: "-260px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.22) 0%, rgba(44,193,235,0) 70%)",
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ zIndex: 2 }}
      >
        <div
          className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16"
          style={{
            paddingTop: "calc(clamp(104px, 9.5vw, 138px) + var(--cs-header-extra))",
            paddingBottom: "clamp(72px, 8vw, 112px)",
          }}
        >
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <HeroReveal y={30} duration={0.8}>
              <p
                className="inline-flex items-center gap-2.5 font-display"
                style={{
                  fontSize: "var(--fs-eyebrow)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-eyebrow-ls)",
                  textTransform: "uppercase",
                  color: "#7fd9f5",
                  marginBottom: "clamp(16px, 1.6vw, 22px)",
                }}
              >
                <span
                  aria-hidden
                  className="block h-[6px] w-[6px] rounded-full"
                  style={{ background: "#2cc1eb", boxShadow: "0 0 12px #2cc1eb" }}
                />
                Tricorder by CleanStart
              </p>
            </HeroReveal>

            <HeroReveal y={50} duration={1.0} lcp>
              <h1
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  textWrap: "balance",
                  maxWidth: "600px",
                }}
              >
                The Intelligence Layer for Software Trust
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="mt-6 max-w-[520px] text-white"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.8,
                  textWrap: "balance",
                }}
              >
                Understand Every Software Dependency Before Trusting It.
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.35} duration={0.8}>
              {/* "Talk to an Expert" is the only call to action the copy doc
                  specifies, so it is the only one the page carries. */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/contact-us"
                  className="cs-btn-glass"
                  style={
                    {
                      "--cs-btn-px": "20px",
                      "--cs-btn-fs": "16px",
                    } as React.CSSProperties
                  }
                >
                  <span>Talk to an Expert</span>
                </Link>
              </div>
            </HeroReveal>
          </div>

          <HeroReveal y={40} delay={0.24} duration={1.0} className="w-full">
            <TricorderHeroConsole />
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
