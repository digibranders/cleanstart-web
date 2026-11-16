import { Layers, ShieldCheck, Zap } from "lucide-react";
import type { CSSProperties } from "react";

import { Reveal } from "@/components/ui/Reveal";

import { GradientTitle, LightSection } from "../dependency-trust/parts";
import { SUMMARY } from "./content";

const ICONS = { complexity: Layers, attack: Zap, verification: ShieldCheck } as const;

const BODY: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--fs-body)",
  fontWeight: 400,
  letterSpacing: "-0.01em",
  lineHeight: 1.6,
  color: "rgba(17,17,17,0.78)",
  textWrap: "pretty",
};

const GRADIENT_TEXT: CSSProperties = {
  background: "linear-gradient(100deg, #B19CFF 0%, #2CC1EB 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  color: "transparent",
};

/**
 * The argument in order. The three pillars are a chain, from the problem to the
 * need, so they hang on one line instead of sitting as equal cards; the closing
 * statement is the conclusion the chain arrives at.
 */
export function Summary(): React.ReactElement {
  return (
    <LightSection dataSection="ReportSummary">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <Reveal header>
              <GradientTitle text={SUMMARY.heading} accent={SUMMARY.accent} align="left" />
            </Reveal>
            <div className="mt-7 flex flex-col gap-5">
              {SUMMARY.paragraphs.map((paragraph, index) => (
                <Reveal key={paragraph} y={22} delay={0.06 + index * 0.08}>
                  <p style={BODY}>{paragraph}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <ol className="relative lg:col-span-7 lg:pt-3">
          <span
            aria-hidden
            className="absolute bottom-8 left-[27px] top-8 w-px"
            style={{ background: "linear-gradient(180deg, rgba(154,81,255,0.55) 0%, rgba(44,193,235,0.55) 100%)" }}
          />
          {SUMMARY.pillars.map((pillar, index) => {
            const Icon = ICONS[pillar.icon];
            return (
              <li key={pillar.title} className="relative">
              <Reveal y={26} delay={index * 0.1} className="flex gap-5 py-4 sm:gap-6">
                <span
                  aria-hidden
                  className="relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white"
                  style={{
                    background: "linear-gradient(145deg, #3960F9 0%, #6A3DF0 60%, #8B3DF0 100%)",
                    boxShadow: "0 14px 28px -12px rgba(71,30,192,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
                  }}
                >
                  <Icon size={24} strokeWidth={1.75} />
                </span>
                <div className="pt-1">
                  <h3
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--fs-h3)",
                      fontWeight: 600,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                      color: "#111",
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="mt-2 max-w-[44ch]" style={{ ...BODY, fontSize: "var(--fs-body)" }}>
                    {pillar.body}
                  </p>
                </div>
              </Reveal>
              </li>
            );
          })}
        </ol>
      </div>

      <Reveal y={30} className="mt-10 lg:mt-12">
        <div
          className="relative overflow-hidden rounded-[40px] text-white"
          style={{
            padding: "clamp(28px, 3.2vw, 48px)",
            background: "linear-gradient(135deg, #151021 0%, #17115C 55%, #2A1A9E 100%)",
            boxShadow: "0 50px 100px -40px rgba(21,16,60,0.6), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            aria-hidden
            src="/images/cleanstart-images/env-union-hex.svg"
            alt=""
            className="pointer-events-none absolute -right-[8%] -top-[40%] hidden w-[520px] max-w-none select-none opacity-40 md:block"
            loading="lazy"
            decoding="async"
          />
          <p
            className="relative max-w-[34ch]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
              textWrap: "balance",
            }}
          >
            {SUMMARY.statement.lead}
            <span style={GRADIENT_TEXT}>{SUMMARY.statement.accent}</span>
          </p>
        </div>
      </Reveal>
    </LightSection>
  );
}
