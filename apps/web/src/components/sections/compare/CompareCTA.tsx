/*
 * Comparison CTA — white card rendered inside the Footer's locked CTA slot.
 * Follows the FipsCTA / CleanSight treatment: decorative purple grid, corner
 * glow ellipses, a violet cube, dark text, solid blue button.
 */

"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { CTA } from "./compare-data";

const HEADLINE = CTA.heading;
const DESCRIPTION = CTA.body;
const BUTTON_LABEL = CTA.button;
const BUTTON_HREF = "/book-a-demo";

export function CompareCTA(): React.ReactElement {
  return (
    <div
      data-section="CompareCTA"
      className="relative h-full w-full overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
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

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none select-none absolute hidden lg:block"
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

      <div
        className="absolute inset-0 hidden items-start md:flex md:flex-col md:gap-y-4 lg:flex-row lg:gap-y-0"
        style={{
          paddingLeft: "clamp(28px, 4vw, 64px)",
          paddingRight: "clamp(28px, 4vw, 64px)",
          paddingTop: "clamp(20px, 3vw, 32px)",
          paddingBottom: "clamp(20px, 3vw, 32px)",
          columnGap: "clamp(32px, 5vw, 72px)",
        }}
      >
        <Reveal
          header
          className="relative w-full min-w-0"
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

        <Reveal
          header
          delay={0.15}
          y={20}
          className="flex w-full min-w-0 flex-col"
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
                "--cs-btn-px": "20px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>{BUTTON_LABEL}</span>
          </Link>
        </Reveal>
      </div>

      <div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden text-center md:hidden"
        style={{ padding: "32px 28px" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          aria-hidden
          src="/images/vulnerability-remediation/cta-cube.webp"
          alt=""
          className="pointer-events-none select-none absolute"
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
            maxWidth: "300px",
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
