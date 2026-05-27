import type React from "react";
import Image from "next/image";

/**
 * CTA card content for the Footer's CTA slot — Figma node 792:3328.
 *
 * Two-column layout at lg+: heading (left) | body copy + glass button (right).
 * Stacks vertically on smaller screens.
 * 3D cube decorative image anchored top-right, bleeds below the card's
 * overflow-hidden boundary (intentional clip).
 */
export function CleanStartImagesCta(): React.ReactElement {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* 3D cube — desktop only; top-right anchor bleeds off the bottom edge */}
      {/* Figma: left=1054px top=167px size=255×258px in ~1309px card, scaled to 1152px */}
      <div
        aria-hidden
        className="absolute pointer-events-none select-none hidden lg:block"
        style={{
          right: "0px",
          top: "147px",
          width: "224px",
          height: "227px",
          transform: "rotate(-0.15deg)",
          opacity: 0.8,
        }}
      >
        <Image
          src="/images/cleanstart-images/cta-cube.png"
          alt=""
          width={255}
          height={258}
          sizes="224px"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="eager"
          decoding="async"
        />
      </div>

      {/* Content — stacked (mobile/sm) → side-by-side (lg+) */}
      <div
        className="relative flex h-full flex-col items-start justify-center gap-5 pt-6 pb-6 sm:pt-4 sm:pb-4 lg:flex-row lg:items-center lg:justify-start lg:gap-[100px] lg:pt-0 lg:pb-0"
        style={{
          paddingLeft: "clamp(32px, 9.4vw, 108px)",
          paddingRight: "clamp(32px, 5.2vw, 60px)",
        }}
      >
        {/* Left: section heading */}
        {/* Figma: width=401px → scaled 354px; Manrope Bold → font-display (Manrope) */}
        <h2
          className="font-display text-white shrink-0"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "var(--cta-card-title-ls)",
            lineHeight: "var(--cta-card-title-lh)",
            maxWidth: "354px",
          }}
        >
          Start with Trusted Foundations
        </h2>

        {/* Right: body copy + glass CTA button */}
        <div className="flex flex-col items-start gap-6">
          <p
            className="font-sans"
            style={{
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              lineHeight: "var(--cta-card-desc-lh)",
              letterSpacing: "var(--cta-card-desc-ls)",
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "440px",
            }}
          >
            Minimal, hardened container images designed for modern
            infrastructure and reduced inherited risk.
          </p>

          <a
            href="https://images.cleanstart.com"
            target="_blank"
            rel="noopener noreferrer"
            className="cs-btn-glass"
          >
            <span>Explore Hardened Images</span>
            <svg
              className="cs-cta-arrow"
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
          </a>
        </div>
      </div>
    </div>
  );
}
