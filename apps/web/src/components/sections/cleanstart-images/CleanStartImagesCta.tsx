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
        {/* Figma: width=401px → scaled 354px; Figtree Bold → font-display (Manrope) */}
        <h2
          className="font-display text-white shrink-0"
          style={{
            fontSize: "var(--text-display-sm)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
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
              fontSize: "var(--text-body-lg)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.04em",
              color: "rgba(255, 255, 255, 0.8)",
              maxWidth: "440px",
            }}
          >
            Minimal, hardened container images designed for modern
            infrastructure and reduced inherited risk.
          </p>

          {/* Glass button — Figma: border #dab6f3, bg rgba(255,255,255,0.65), r=8px */}
          <a
            href="https://images.cleanstart.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[8px] border transition-opacity duration-200 hover:opacity-90"
            style={{
              borderColor: "#dab6f3",
              backgroundColor: "rgba(255, 255, 255, 0.65)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              padding: "9px 18px",
            }}
          >
            <span
              className="font-display font-medium whitespace-nowrap"
              style={{
                fontSize: "var(--btn-fs-lg)",
                color: "#111111",
                letterSpacing: "-0.01em",
                lineHeight: 1.4,
              }}
            >
              Explore Hardened Images
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cleanstart-images/cta-arrow.svg"
              alt=""
              aria-hidden
              width={25}
              height={22}
              style={{
                display: "block",
                width: "25px",
                height: "22px",
                flexShrink: 0,
              }}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
