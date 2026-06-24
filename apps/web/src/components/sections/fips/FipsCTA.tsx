/*
 * FIPS CTA — white card (rendered in the Footer's locked CTA slot) matching the
 * CleanSight CTA background treatment: decorative purple grid, corner glow
 * ellipses, a violet cube, dark text, and a solid blue button.
 */

"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

const HEADLINE = "Ready to Simplify FIPS Compliance?";
const DESCRIPTION = "Deploy validated cryptographic foundations with confidence.";
const BUTTON_LABEL = "Download the FIPS Architecture Guide";
const BUTTON_HREF =
  "/resources/embedding-fips-140-2-compliance-at-the-foundation";

export function FipsCTA(): React.ReactElement {
  return (
    <div
      data-section="FipsCTA"
      className="relative w-full h-full overflow-hidden"
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

      {/* Content row — absolute inset-0 + items-start. */}
      <div
        className="hidden md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0 absolute inset-0 items-start"
        style={{
          paddingLeft: "clamp(28px, 4vw, 64px)",
          paddingRight: "clamp(28px, 4vw, 64px)",
          paddingTop: "clamp(20px, 3vw, 32px)",
          paddingBottom: "clamp(20px, 3vw, 32px)",
          columnGap: "clamp(32px, 5vw, 72px)",
        }}
      >
        {/* Left: headline. */}
        <Reveal
          header
          className="relative min-w-0 w-full"
          style={{ maxWidth: "min(460px, 100%)", zIndex: 2 }}
        >
          <p
            className="font-display"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "#111111",
              textWrap: "balance",
              margin: 0,
            }}
          >
            {HEADLINE}
          </p>
        </Reveal>

        {/* Right: description + CTA button. */}
        <Reveal
          header
          delay={0.15}
          y={20}
          className="flex flex-col min-w-0 w-full"
          style={{
            maxWidth: "420px",
            gap: "clamp(16px, 1.5vw, 24px)",
            zIndex: 2,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              color: "rgba(17, 17, 17, 0.8)",
              margin: 0,
            }}
          >
            {DESCRIPTION}
          </p>

          <Link
            href={BUTTON_HREF}
            className="cs-btn-blue self-start"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "16px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>{BUTTON_LABEL}</span>
          </Link>
        </Reveal>
      </div>

      {/* Mobile layout (< md) — centered column with cube decoration. */}
      <div
        className="md:hidden absolute inset-0 overflow-hidden flex flex-col items-center justify-center text-center"
        style={{ padding: "32px 28px" }}
      >
        {/* Purple cube — bottom-right corner decoration. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/vulnerability-remediation/cta-cube.webp"
          alt=""
          className="absolute pointer-events-none select-none"
          style={{
            right: "-24px",
            bottom: "-24px",
            width: "120px",
            height: "120px",
            objectFit: "contain",
            opacity: 0.85,
            zIndex: 1,
          }}
          loading="lazy"
          decoding="async"
        />

        <p
          className="font-display"
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1.15,
            color: "#111111",
            margin: 0,
            maxWidth: "300px",
            textWrap: "balance",
          }}
        >
          {HEADLINE}
        </p>

        <p
          style={{
            position: "relative",
            zIndex: 2,
            fontFamily: "var(--font-sans)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "rgba(17, 17, 17, 0.8)",
            margin: "12px 0 24px 0",
            maxWidth: "290px",
          }}
        >
          {DESCRIPTION}
        </p>

        <Link
          href={BUTTON_HREF}
          className="cs-btn-blue"
          style={
            {
              position: "relative",
              zIndex: 2,
              "--cs-btn-h": "44px",
              "--cs-btn-px": "20px",
              "--cs-btn-fs": "15px",
            } as React.CSSProperties
          }
        >
          <span>{BUTTON_LABEL}</span>
        </Link>
      </div>
    </div>
  );
}
