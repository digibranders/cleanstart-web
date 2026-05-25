import type React from "react";
import Link from "next/link";

/*
 * Figma node 817:10441 — 1920×823px hero (desktop)
 * Figma node 891:287  — 360×729px  hero (mobile, node 856:1043)
 *
 * Background gradient (inline overrides bg-cs-hero):
 *   linear-gradient(180deg, #151021 25.7%, #10123E 31.2%, #131E8F 51%,
 *   #471EC0 68.7%, #471FC3 79.8%, rgba(70,30,191,0.85) 85%,
 *   rgba(66,30,188,0.4) 93.7%, rgba(66,30,188,0) 98.9%)
 *
 * ── DESKTOP ──────────────────────────────────────────────────────────────────
 * Background texture: hero-bg.svg — full-width overlay, h=568px, top-left
 * Content block: paddingTop=158px (nav ~80px + 78px gap)
 * H1: 80px Manrope SemiBold, tracking -0.05em, white, w=749px, lh 1
 * Subtext: 30px Sora Regular, opacity 0.8, tracking -0.04em, lh 1.4
 * Button: "Explore Free Secure Image" — .cs-btn-glass, 20px Manrope Medium, self-start (left)
 * Right photo: hero-photo.png container left=249px top=32px 1440×823px
 *   transform: rotate(180deg) scaleY(-1) = scaleX(-1) (horizontal mirror)
 *   mask: hero-photo-mask.svg (radial gradient 1491×855, pos 207px -32px)
 *
 * ── MOBILE (< lg) ────────────────────────────────────────────────────────────
 * Content paddingTop: 136px, content centered (items-center text-center)
 * H1: 32px Manrope SemiBold, centered, white
 * Subtext: 16px Sora Regular, opacity 0.8, tracking -0.04em, centered
 * Button: 16px Manrope Medium, centered (self-center)
 * Photo: absolute top=423px, 809×462px centered, scaleX(-1),
 *   gradient overlay: linear-gradient(180deg, #281fa3 0%, rgba(40,31,163,0) 51.511%)
 */

export function CisoHero(): React.ReactElement {
  return (
    <section
      data-section="CisoHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{
        minHeight: "751px",
        /* Override first gradient stop to 25.7% per Figma frame */
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

      {/* ── Person photo — DESKTOP ONLY (lg+), right side ──
          Container: left=249px, top=32px, 1440×823px within 1920px frame.
          Transform: rotate(180deg)+scaleY(-1) = scaleX(-1) (horizontal mirror).
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

      {/* ── Person photo — MOBILE ONLY (< lg) ──
          Figma 856:1043: 809×462px centered, top=423px, scaleX(-1) flip.
          Section overflow:hidden clips the 809px width to the viewport.
          Blue gradient overlay fades from #281fa3 at top to transparent at 51.5%. */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none lg:hidden"
        style={{
          left: 0,
          right: 0,
          top: "423px",
          height: "462px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "809px",
            height: "462px",
            transform: "translateX(-50%) scaleX(-1)",
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
              objectPosition: "center top",
            }}
            loading="eager"
            decoding="async"
          />
          {/* Blue gradient overlay — fades photo into section background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, #281fa3 0%, rgba(40,31,163,0) 51.511%)",
            }}
          />
        </div>
      </div>

      {/* Bottom fade — blends hero into the white section below */}
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
          /* Mobile: 136px (Figma 856:1043); Desktop: 158px (Figma 817:10441) */
          paddingTop: "clamp(136px, 8.23vw, 158px)",
          paddingBottom: "80px",
          minHeight: "751px",
        }}
      >
        {/* ── Text column — centered on mobile, left-aligned md+ ── */}
        <div
          className="relative flex flex-col items-center text-center md:items-start md:text-left"
          style={{ maxWidth: "749px" }}
        >
          {/* Mobile: 32px; Desktop: 80px Manrope SemiBold, tracking -0.05em, lh 1 */}
          <h1
            className="text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4.17vw, 80px)",
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              /* Mobile gap-[16px] per Figma; Desktop 32px */
              marginBottom: "clamp(16px, 1.67vw, 32px)",
            }}
          >
            Trusted Software Foundations for CISOs
          </h1>

          {/* Mobile: 16px; Desktop: 30px Sora Regular, opacity 0.8, tracking -0.04em, lh 1.4 */}
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(16px, 1.56vw, 30px)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.8)",
              /* Mobile gap-[24px] per Figma; Desktop 32px */
              marginBottom: "clamp(24px, 1.67vw, 32px)",
            }}
          >
            Reduce inherited software risk with minimal, hardened, verifiable
            container foundations built for modern enterprise environments.
          </p>

          {/* Mobile: 16px Manrope Medium, self-center (centered); Desktop: 20px, self-start (left) */}
          <Link
            href="/cleanstart-images"
            className="cs-btn-glass self-center md:self-start"
            style={
              {
                "--cs-btn-fs": "clamp(16px, 1.04vw, 20px)",
                "--cs-btn-h": "38px",
                "--cs-btn-px": "18px",
              } as React.CSSProperties
            }
          >
            Explore Free Secure Image
          </Link>
        </div>
      </div>
    </section>
  );
}
