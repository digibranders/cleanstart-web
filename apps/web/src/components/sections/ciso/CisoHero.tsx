import type React from "react";
import Link from "next/link";

/*
 * Figma node 817:10441 — 1920×823px hero (nav embedded in frame)
 *
 * Background gradient (inline overrides bg-cs-hero):
 *   linear-gradient(180deg, #151021 25.7%, #10123E 31.2%, #131E8F 51%,
 *   #471EC0 68.7%, #471FC3 79.8%, rgba(70,30,191,0.85) 85%,
 *   rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)
 *   First stop at 25.7% keeps the top (nav) area solidly dark.
 *
 * Background texture: hero-bg.svg — full-width overlay, h=568px, top-left
 *
 * Content block: top=158px in Figma (nav ~80px + 78px gap)
 *   → paddingTop ≈ 158px (section starts below fixed nav)
 *
 * H1: 80px Manrope SemiBold, tracking -0.05em (-4px), white, w=749px, lh 1
 * Subtext: 30px Sora Regular, opacity 0.8, tracking -0.04em (-1.2px), lh 1.4
 * Button: "Explore Free Secure Image" — .cs-btn-glass, 20px Manrope Medium
 *
 * Right photo: hero-photo.png, 1440×823px container at left=249px, top=32px
 *   Transform: rotate(180deg) scaleY(-1) = net scaleX(-1) = horizontal mirror
 *   Mask: hero-photo-mask.svg (radial gradient, 1491×855, pos 207px -32px)
 *   Visible on desktop only (lg:block), clipped by section overflow:hidden
 */

export function CisoHero(): React.ReactElement {
  return (
    <section
      data-section="CisoHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{
        minHeight: "751px",
        /* Override first gradient stop to 25.7% per new Figma frame */
        backgroundImage:
          "linear-gradient(180deg, #151021 25.702%, #10123e 31.159%, #131e8f 51.006%, #471ec0 68.711%, #471fc3 79.832%, rgba(70,30,191,0.85) 85.018%, rgba(66,30,188,0.4) 93.72%, rgba(66,30,188,0) 98.921%)",
      }}
    >
      {/* ── Background texture overlay ── */}
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

      {/* ── Person photo — desktop only, right side ──
          Container: left=249px, top=32px, 1440×823px within 1920px frame.
          Transform: rotate(180deg)+scaleY(-1) = net horizontal mirror (scaleX -1).
          Mask: radial gradient SVG fades edges for soft blend. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{ left: "249px", top: "32px", width: "1440px", height: "823px" }}
      >
        <div style={{ transform: "rotate(180deg) scaleY(-1)", width: "1440px", height: "823px" }}>
          <div
            style={{
              position: "relative",
              width: "1440px",
              height: "823px",
              maskImage: "url('/images/ciso/hero-photo-mask.svg')",
              WebkitMaskImage: "url('/images/ciso/hero-photo-mask.svg')",
              maskSize: "1491px 855px",
              WebkitMaskSize: "1491px 855px",
              maskPosition: "207px -32px",
              WebkitMaskPosition: "207px -32px",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/ciso/hero-photo.png"
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </div>

      {/* Bottom fade — blends hero into the section below */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: "160px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 55%, rgba(255,255,255,0.92) 88%, #ffffff 100%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative mx-auto z-[2] w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "158px",
          paddingBottom: "80px",
          minHeight: "751px",
        }}
      >
        {/* ── Left column: text (max 749px per Figma) ── */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "749px" }}
        >
          {/* Figma: 80px Manrope SemiBold, tracking -4px (-0.05em), lh 1 */}
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 4.17vw, 80px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              marginBottom: "32px",
            }}
          >
            Trusted Software Foundations for CISOs
          </h1>

          {/* Figma: 30px Sora Regular, opacity 0.8, tracking -1.2px (-0.04em), lh 1.4 */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.56vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              marginBottom: "32px",
            }}
          >
            Reduce inherited software risk with minimal, hardened, verifiable
            container foundations built for modern enterprise environments.
          </p>

          {/* Figma: 20px Manrope Medium, px=18px, py=9px, border #dab6f3 */}
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
