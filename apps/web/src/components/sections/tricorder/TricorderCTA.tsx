"use client";

import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";

/**
 * Tricorder CTA card — rendered inside the Footer's locked CTA slot. The
 * site's white card (CleanSight / Clean Libraries): purple union grid, the
 * #DF9BFF glows, dark text and the solid blue button. Two-column structure
 * (heading left, body and button right), matching DeveloperCTA / VulnCTA so
 * the visual rhythm is consistent with the rest of the site's CTAs.
 */

export function TricorderCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden px-8 text-center md:px-12 lg:flex-row lg:items-start lg:gap-x-[clamp(32px,5vw,100px)] lg:px-[clamp(28px,4vw,64px)] lg:py-[clamp(20px,3vw,32px)] lg:text-left"
      style={{ background: "#ffffff" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/cleansight/cta-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{ left: "547px", top: "-420px", width: "1101px", height: "1101px", opacity: 0.5 }}
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.8,
          filter: "blur(121.5px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "-120px",
          bottom: "-140px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#DF9BFF",
          opacity: 0.7,
          filter: "blur(121.5px)",
        }}
      />

      <Reveal header className="relative z-10 min-w-0 w-full lg:w-auto" style={{ maxWidth: "min(420px, 100%)" }}>
        <p
          className="font-display"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "var(--cta-card-title-ls)",
            lineHeight: "var(--cta-card-title-lh)",
            color: "#111111",
            textWrap: "balance",
          }}
        >
          The Intelligence Behind CleanStart.
        </p>
      </Reveal>

      <Reveal
        header
        delay={0.15}
        y={20}
        className="relative z-10 flex min-w-0 w-full flex-col items-center gap-[18px] lg:w-auto lg:items-start"
        style={{ maxWidth: "min(500px, 100%)" }}
      >
        <p
          className="text-center font-sans lg:text-left"
          style={{
            color: "rgba(17, 17, 17, 0.8)",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "var(--cta-card-desc-ls)",
            lineHeight: "var(--cta-card-desc-lh)",
          }}
        >
          See how Tricorder powers software security across Images, Libraries,
          and CleanSight.
        </p>
        <Link
          href="/contact-us"
          className="cs-btn-blue"
          style={
            {
              "--cs-btn-h": "44px",
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
            } as React.CSSProperties
          }
        >
          <span>Talk to an Expert</span>
        </Link>
      </Reveal>
    </div>
  );
}
