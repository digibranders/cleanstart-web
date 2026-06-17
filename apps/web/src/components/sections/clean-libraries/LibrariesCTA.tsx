/**
 * Clean Libraries CTA card — rendered inside the Footer's locked CTA slot.
 * Dark blue→purple gradient card with a union grid, glow blobs, a rotated
 * product illustration, and a glass "Request a Demo" button.
 */

"use client";

import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function LibrariesCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden px-8 text-center md:px-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:content-center lg:items-start lg:justify-center lg:gap-x-[clamp(32px,4vw,56px)] lg:p-[clamp(32px,4vw,56px)_clamp(40px,5vw,72px)] lg:text-left"
      style={{
        background:
          "linear-gradient(180deg, #131e8f 0%, #471ec0 111.05%)",
      }}
    >
      {/* Union wireframe grid — center-right, behind content. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/clean-libraries/cta-union.svg"
        alt=""
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "547px",
          top: "-420px",
          width: "1101px",
          height: "1101px",
          opacity: 0.5,
        }}
        loading="lazy"
        decoding="async"
      />

      {/* Rotated product illustration — pinned to the extreme bottom-right corner. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/clean-libraries/cta-illustration.png"
        alt=""
        className="pointer-events-none absolute -bottom-[28px] -right-[18px] hidden h-[180px] w-[180px] -rotate-[15deg] select-none object-contain opacity-90 lg:block"
        loading="lazy"
        decoding="async"
      />

      {/* Top-left glow blob. */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden select-none lg:block"
        style={{
          left: "-139px",
          top: "-168px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#9a51ff",
          opacity: 0.5,
          filter: "blur(120px)",
        }}
      />
      {/* Bottom-right glow blob. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "-120px",
          bottom: "-140px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "#2cc1eb",
          opacity: 0.35,
          filter: "blur(120px)",
        }}
      />

      <Reveal header className="relative z-10" style={{ maxWidth: "min(460px, 100%)" }}>
        <p
          className="font-display text-white"
          style={{
            fontSize: "var(--cta-card-title)",
            fontWeight: 600,
            letterSpacing: "var(--cta-card-title-ls)",
            lineHeight: "var(--cta-card-title-lh)",
            textWrap: "balance",
          }}
        >
          Govern Every Dependency
        </p>
      </Reveal>

      <Reveal
        header
        delay={0.15}
        y={20}
        className="relative z-10 flex flex-col items-center gap-[18px] lg:items-start"
      >
        <p
          className="text-center font-sans text-white lg:text-left"
          style={{
            opacity: 0.8,
            maxWidth: "660px",
            fontSize: "var(--cta-card-desc)",
            fontWeight: 400,
            letterSpacing: "var(--cta-card-desc-ls)",
            lineHeight: "var(--cta-card-desc-lh)",
          }}
        >
          Gain visibility into AI-introduced dependencies, enforce policy
          standards, and maintain control over your software supply chain.
        </p>

        <Link
          href="/book-a-demo"
          className="cs-btn-glass"
          style={
            {
              "--cs-btn-px": "18px",
              "--cs-btn-fs": "16px",
            } as React.CSSProperties
          }
        >
          <span>Request a Demo</span>
          <svg
            className="cs-cta-arrow"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden
          >
            <path
              d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </Reveal>
    </div>
  );
}
