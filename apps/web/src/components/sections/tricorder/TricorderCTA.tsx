"use client";

import Link from "next/link";

import { Reveal } from "@/components/ui/Reveal";
import { VERDICT } from "./tricorder-palette";

/**
 * Tricorder CTA card — rendered inside the Footer's locked CTA slot. The
 * site's white card (CleanSight / Clean Libraries): purple union grid, the
 * #DF9BFF glows, dark text and the solid blue button. The illustration on the
 * right is a small coded verdict ledger — three components, three outcomes —
 * so the card closes on the product's output rather than on a stock object.
 */

const MONO = "var(--font-mono), ui-monospace, Menlo, Consolas, monospace";

const LEDGER = [
  { name: "strutil-core@2.5.0", verdict: "Malicious", color: VERDICT.malicious },
  { name: "openssl@3.3.2", verdict: "Pass", color: VERDICT.pass },
  { name: "yaml-lite@0.9.1", verdict: "Uncertain", color: VERDICT.uncertain },
] as const;

export function TricorderCTA(): React.ReactElement {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-hidden px-8 text-center md:px-12 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-center lg:gap-x-[clamp(32px,4vw,56px)] lg:px-[clamp(40px,5vw,72px)] lg:py-[clamp(24px,3vw,40px)] lg:text-left"
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

      <div className="relative z-10 flex flex-col items-center gap-[18px] lg:items-start">
        <Reveal header style={{ maxWidth: "min(520px, 100%)" }}>
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
        <Reveal header delay={0.15} y={20} className="flex flex-col items-center gap-[18px] lg:items-start">
          <p
            className="text-center font-sans lg:text-left"
            style={{
              color: "rgba(17, 17, 17, 0.8)",
              maxWidth: "520px",
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

      {/* Verdict ledger — desktop only; the slot is too short to stack it. */}
      <Reveal
        header
        delay={0.25}
        y={20}
        aria-hidden
        className="relative z-10 hidden w-full max-w-[380px] justify-self-end lg:block"
      >
        <div
          className="overflow-hidden"
          style={{
            borderRadius: "16px",
            border: "1px solid rgba(17,17,17,0.08)",
            background: "rgba(255,255,255,0.86)",
            boxShadow: "0 24px 50px -30px rgba(19,30,143,0.35), 0 1px 2px rgba(17,24,39,0.05)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div
            className="flex items-center justify-between px-4"
            style={{ height: "34px", borderBottom: "1px solid rgba(17,17,17,0.07)" }}
          >
            <span
              className="font-display"
              style={{ fontSize: "var(--fs-badge)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6b80" }}
            >
              Verdicts
            </span>
            <span style={{ fontFamily: MONO, fontSize: "var(--fs-badge)", color: "#6b6b80" }}>live</span>
          </div>
          <ul className="flex flex-col">
            {LEDGER.map((row, i) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
                style={{ borderTop: i === 0 ? "none" : "1px solid rgba(17,17,17,0.06)" }}
              >
                <span className="truncate" style={{ fontFamily: MONO, fontSize: "var(--fs-caption)", color: "#111111" }}>
                  {row.name}
                </span>
                <span
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 font-display"
                  style={{
                    fontSize: "var(--fs-badge)",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: `color-mix(in srgb, ${row.color} 80%, #111111)`,
                    background: `color-mix(in srgb, ${row.color} 12%, #ffffff)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${row.color} 35%, transparent)`,
                  }}
                >
                  <span aria-hidden className="block h-[6px] w-[6px] rounded-full" style={{ background: row.color }} />
                  {row.verdict}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
