import type React from "react";
import Link from "next/link";
import { CisoHeroAnimation } from "./CisoHeroAnimation";

/*
 * Figma node 583:2039 — 1920×682 px hero (nav embedded inside frame)
 *
 * Background: .bg-cs-hero .bg-cs-grid (dark navy gradient + grid overlay)
 * Content block: top=203px from section top (Figma includes nav; our nav is
 *   fixed and separate, so paddingTop=203px places H1 at the correct depth)
 * H1: 80px Manrope SemiBold, tracking -0.05em (-4px), white, w=840px
 * Subtext: 30px Sora Regular, opacity 0.8, tracking -0.04em (-1.2px), lh 1.4
 * Button: "Explore Free Secure Image" — .cs-btn-glass, 20px Manrope Medium
 *
 * Right decoration: Lottie animation (native 498×416 viewBox), autoplay loop
 *   Figma static decoration: left=1183px, top=179px, 306×394px → center y=376px
 *   Lottie 498×416 center-aligned to same y: top = 376 − 208 = 168px
 *   Left: decoration center at 1183+153=1336px (1920px frame) → container %:
 *     container left = (1920−1276)/2 = 322px; decoration center = 1336−322=1014px
 *     lottie center (1014−249=765px) / 1276 = 59.95% ≈ left: 60%
 *
 * CisoHeroAnimation is "use client" — Next.js handles the client boundary.
 */

export function CisoHero(): React.ReactElement {
  return (
    <section
      data-section="CisoHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{ minHeight: "682px" }}
    >
      {/* Bottom fade — blends hero into the white Risks section below */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "160px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)",
        }}
      />

      <div
        className="relative mx-auto z-[2] w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "203px",
          paddingBottom: "0",
          minHeight: "682px",
        }}
      >
        {/* ── Right: Lottie animation (desktop only) ──
            top=168px centers the 416px-tall animation at the same y-center
            as the 394px Figma decoration (center y=376px from section top). */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute hidden md:block"
          style={{
            left: "60%",
            top: "168px",
            width: "498px",
            height: "416px",
          }}
        >
          <CisoHeroAnimation />
        </div>

        {/* ── Left column: text ── */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "840px" }}
        >
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 4.45vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginBottom: "32px",
            }}
          >
            Trusted Software Foundations for CISOs
          </h1>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              maxWidth: "620px",
              marginBottom: "32px",
            }}
          >
            Reduce inherited software risk with minimal, hardened, verifiable
            container foundations built for modern enterprise environments.
          </p>

          {/* Mobile: compact Lottie (half native size) */}
          <div
            aria-hidden
            className="md:hidden mb-8"
            style={{ width: "249px", height: "208px" }}
          >
            <CisoHeroAnimation />
          </div>

          {/* Figma: 20px Manrope Medium, px=18px, py=9px → h≈38px */}
          <Link
            href="/cleanstart-images"
            className="cs-btn-glass self-start"
            style={{
              ["--cs-btn-fs" as string]: "20px",
              ["--cs-btn-h" as string]: "38px",
              ["--cs-btn-px" as string]: "18px",
            }}
          >
            Explore Free Secure Image
          </Link>
        </div>
      </div>
    </section>
  );
}
