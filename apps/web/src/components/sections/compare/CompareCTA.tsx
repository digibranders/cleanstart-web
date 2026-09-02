/*
 * Closing CTA — the white card that paints inside the Footer's locked CTA slot.
 *
 * Geometry (overlap, radius, clipping) belongs to `Footer.tsx`; this file only
 * fills the slot, following the FipsCTA / CleanSight treatment: purple corner
 * bloom, the shared union plate, a violet cube, dark type, solid blue button.
 *
 * The headline is an `<h2>` rather than a styled `<p>`. The source document
 * sets "Build With Verified Container Images" as a heading, and dropping it to
 * a paragraph because the card sits in the footer would lose the last section
 * of the outline SEO wrote.
 *
 * One DOM across all breakpoints. The phone layout is the same elements
 * centred, not a second copy: a duplicated headline would put the page's
 * closing H2 in the markup twice.
 */

"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { CTA } from "./compare-data";

function Bloom({
  className,
  style,
}: {
  className?: string;
  style: React.CSSProperties;
}): React.ReactElement {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
      style={{
        borderRadius: "50%",
        background: "#DF9BFF",
        opacity: 0.8,
        ...style,
      }}
    />
  );
}

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
        className="pointer-events-none absolute hidden select-none lg:block"
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

      <Bloom
        className="lg:hidden"
        style={{
          left: "-158px",
          top: "-134px",
          width: "223.44px",
          height: "223.44px",
          filter: "blur(53px)",
        }}
      />
      <Bloom
        className="hidden lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          filter: "blur(121.5px)",
          zIndex: 2,
        }}
      />
      <Bloom
        className="lg:hidden"
        style={{
          right: "-145px",
          bottom: "-141px",
          width: "223.44px",
          height: "223.44px",
          filter: "blur(53px)",
        }}
      />
      <Bloom
        className="hidden lg:block"
        style={{
          left: "1159px",
          top: "244px",
          width: "511px",
          height: "511px",
          filter: "blur(121.5px)",
          zIndex: 1,
        }}
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/vulnerability-remediation/cta-cube.webp"
        alt=""
        className="pointer-events-none absolute bottom-[-24px] right-[-24px] z-[3] size-[120px] select-none object-contain opacity-85 lg:bottom-[-40px] lg:left-[-40px] lg:right-auto lg:size-[220px] lg:opacity-50"
        loading="lazy"
        decoding="async"
      />

      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-y-4 px-7 py-8 text-center md:items-start md:justify-start md:px-[clamp(28px,4vw,64px)] md:py-[clamp(20px,3vw,32px)] md:text-left lg:flex-row lg:gap-x-[clamp(32px,5vw,72px)] lg:gap-y-0"
      >
        <Reveal
          header
          className="relative z-[2] w-full min-w-0 max-w-[300px] md:max-w-[min(460px,100%)]"
        >
          <h2
            className="font-display"
            style={{
              fontSize: "var(--cta-card-title)",
              fontWeight: 600,
              letterSpacing: "var(--cta-card-title-ls)",
              lineHeight: "var(--cta-card-title-lh)",
              color: "#111111",
              textWrap: "balance",
              margin: 0,
            }}
          >
            {CTA.heading}
          </h2>
        </Reveal>

        <Reveal
          header
          delay={0.15}
          y={20}
          className="relative z-[2] flex w-full min-w-0 max-w-[300px] flex-col items-center gap-4 md:max-w-[440px] md:items-start lg:gap-[clamp(16px,1.5vw,24px)]"
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--cta-card-desc)",
              fontWeight: 400,
              letterSpacing: "var(--cta-card-desc-ls)",
              lineHeight: "var(--cta-card-desc-lh)",
              color: "rgba(17, 17, 17, 0.8)",
              margin: 0,
            }}
          >
            {CTA.body}
          </p>

          <Link
            href={CTA.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cs-btn-blue"
            style={
              {
                "--cs-btn-h": "44px",
                "--cs-btn-px": "20px",
                "--cs-btn-fs": "16px",
              } as React.CSSProperties
            }
          >
            <span>{CTA.button}</span>
          </Link>
        </Reveal>
      </div>
    </div>
  );
}
