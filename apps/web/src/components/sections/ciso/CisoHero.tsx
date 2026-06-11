import type React from "react";
import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";

/*
 * CISO hero — dark gradient band with a background texture overlay, a masked
 * person photo on the right (desktop) / behind the content (mobile), and a
 * left-aligned headline + glass CTA.
 */
export function CisoHero(): React.ReactElement {
  return (
    <section
      data-section="CisoHero"
      className="relative overflow-hidden bg-cs-hero"
      style={{
        minHeight: "751px",
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

      {/* Person photo — DESKTOP ONLY (lg+), right side. Mirrored horizontally;
          a radial-gradient SVG mask fades the edges for a soft blend. */}
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
              src="/images/ciso/hero-photo.webp"
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

      {/* Person photo — MOBILE ONLY (< lg). Mirrored; the section's
          overflow:hidden clips it to the viewport, and a blue gradient overlay
          fades it into the background. */}
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
            src="/images/ciso/hero-photo.webp"
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
          {/* Blue gradient overlay — fades the photo into the section background. */}
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

      {/* Bottom fade — blends the hero into the white section below. */}
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
          paddingTop: "calc(clamp(112px, 8.23vw, 158px) + var(--cs-header-extra))",
          paddingBottom: "80px",
          minHeight: "751px",
        }}
      >
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
