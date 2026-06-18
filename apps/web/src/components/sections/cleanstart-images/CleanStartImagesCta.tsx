import type React from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/**
 * CTA card content for the Footer's CTA slot.
 *
 * White card styled to match the CleanSight CTA: decorative radial-faded grid,
 * purple corner glow ellipses, a bottom-left cube, dark text, and a solid blue
 * button. Two-column layout at lg+: heading (left) | body copy + button (right);
 * stacks vertically on smaller screens.
 */
export function CleanStartImagesCta(): React.ReactElement {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Decorative radial-faded purple grid. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "547px",
          top: "-220px",
          width: "1101px",
          height: "1101px",
          opacity: 0.5,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Ellipse glow — top-left. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          left: "-158px",
          top: "-134px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 2,
        }}
      />

      {/* Ellipse glow — bottom-right. */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          right: "-145px",
          bottom: "-141px",
          width: "223.44px",
          height: "223.44px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(53px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none select-none absolute hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
          zIndex: 1,
        }}
      />

      {/* Decorative pink/violet cube — bottom-left corner of the card. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          left: "-40px",
          bottom: "-40px",
          width: "220px",
          height: "220px",
          objectFit: "contain",
          opacity: 0.5,
          zIndex: 3,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Mobile cube — extreme bottom-right corner, just the tip visible. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none select-none absolute lg:hidden"
        style={{
          right: "-40px",
          bottom: "-40px",
          width: "140px",
          height: "140px",
          objectFit: "contain",
          opacity: 0.6,
        }}
        loading="lazy"
        decoding="async"
      />

      <div
        className="relative flex h-full flex-col items-start justify-center gap-5 pt-6 pb-6 sm:pt-4 sm:pb-4 lg:flex-row lg:items-center lg:justify-start lg:gap-[100px] lg:pt-0 lg:pb-0"
        style={{
          paddingLeft: "clamp(32px, 9.4vw, 108px)",
          paddingRight: "clamp(32px, 5.2vw, 60px)",
        }}
      >
        <Reveal header className="relative shrink-0" style={{ zIndex: 2 }}>
          <h2
            className="font-display"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "var(--cta-card-title-ls)",
              lineHeight: "var(--cta-card-title-lh)",
              color: "#111111",
              textWrap: "balance",
              maxWidth: "354px",
            }}
          >
            From Public Images to Trusted Foundations
          </h2>
        </Reveal>

        <Reveal
          header
          delay={0.15}
          y={20}
          className="relative flex flex-col items-start gap-6"
          style={{ zIndex: 2 }}
        >
          <p
            className="font-sans"
            style={{
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              lineHeight: "var(--cta-card-desc-lh)",
              letterSpacing: "var(--cta-card-desc-ls)",
              color: "rgba(17, 17, 17, 0.8)",
              maxWidth: "440px",
            }}
          >
            Minimal, hardened container images designed for modern
            infrastructure and reduced inherited risk.
          </p>

          <Link
            href="/resources/enterprise-grade-hardened-container-images"
            className="cs-btn-blue self-start"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "16px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>Explore Hardened Images</span>
            <svg
              className="cs-cta-arrow ml-2"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden
            >
              <path
                d="M3 9h11m0 0l-4-4m4 4l-4 4"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
