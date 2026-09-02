import type React from "react";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import {
  ANNUAL_ENG_HOURS,
  BURDEN_SCALE,
  IMAGE_WEIGHT_THRESHOLDS,
  SCORE_WEIGHTS,
  TEAM_WEIGHT_THRESHOLDS,
  TIER_SUMMARY,
  type TierName,
} from "./model";
import { METHOD_HEADING, METHOD_INTRO, METHOD_STEPS } from "./impact-content";

/*
 * "How the estimate works": the scoring pipeline in prose, with every number
 * read from ./model so the description and the calculation cannot disagree.
 * Server component; the only motion is the shared Reveal.
 */

const INK = "#111111";
const SUB = "#3a3f4c";
const MUTED = "#5b6070";

const TIER_COLOR: Record<TierName, string> = {
  Low: "#2cc1eb",
  Moderate: "#3960F9",
  High: "#471ec0",
  Extreme: "#8b1fc3",
};

const STEP_COLORS = ["#2cc1eb", "#3960F9", "#471ec0", "#8b1fc3"] as const;

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function bandList(thresholds: readonly number[], unit: string): string {
  const [a, b, c] = thresholds;
  return `up to ${a}, ${a}+ to ${b}, ${b}+ to ${c}, and above ${c} ${unit}`;
}

export function ImpactMethod(): React.ReactElement {
  const weights = [
    { label: "Production images", value: SCORE_WEIGHTS.image },
    { label: "Engineering team size", value: SCORE_WEIGHTS.eng },
    { label: "Remediation frequency", value: SCORE_WEIGHTS.remediation },
    { label: "Release cadence", value: SCORE_WEIGHTS.release },
  ];

  return (
    <Section padding="md" data-section="ImpactMethod" aria-labelledby="impact-method-heading" style={{ background: "#F6F6F6" }}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <Reveal header>
              <h2 id="impact-method-heading" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: INK }}>
                {METHOD_HEADING}
              </h2>
            </Reveal>
            <Reveal>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", lineHeight: "var(--fs-body-lh)", color: SUB, marginTop: "16px", maxWidth: "46ch" }}>
                {METHOD_INTRO}
              </p>
            </Reveal>

            {/* Weights: the one table readers ask for first. */}
            <Reveal delay={0.05}>
              <div style={{ marginTop: "28px", background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", padding: "20px 22px" }}>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>Weight of each signal</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {weights.map((w, i) => (
                    <li key={w.label} className="flex items-center" style={{ gap: "12px" }}>
                      <span style={{ flex: "0 0 auto", width: "40px", fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: STEP_COLORS[i], fontVariantNumeric: "tabular-nums" }}>{pct(w.value)}</span>
                      <span className="relative" style={{ flex: "1 1 auto", height: "6px", borderRadius: "999px", background: "rgba(17,17,17,0.06)" }}>
                        <span style={{ position: "absolute", inset: "0 auto 0 0", width: pct(w.value), borderRadius: "999px", background: STEP_COLORS[i] }} />
                      </span>
                      <span style={{ flex: "0 0 auto", width: "clamp(120px, 40%, 170px)", fontFamily: "var(--font-sans)", fontSize: "13px", color: SUB }}>{w.label}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", lineHeight: 1.5, color: MUTED, marginTop: "14px" }}>
                  Image bands: {bandList(IMAGE_WEIGHT_THRESHOLDS, "images")}. Team bands: {bandList(TEAM_WEIGHT_THRESHOLDS, "engineers")}.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col" style={{ gap: "14px" }}>
            <Reveal delay={0.1} y={24}>
              <ol className="grid gap-4 sm:grid-cols-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {METHOD_STEPS.map((step, i) => (
                  <li key={step.title} style={{ background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", padding: "22px 22px 20px", boxShadow: "0 1px 3px rgba(17,17,17,0.04)" }}>
                    <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: STEP_COLORS[i], color: "#ffffff", fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700 }}>{i + 1}</span>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3, color: INK, marginTop: "14px" }}>{step.title}</h3>
                    <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", lineHeight: 1.55, color: SUB, marginTop: "8px" }}>{step.body}</p>
                  </li>
                ))}
              </ol>
            </Reveal>

            {/* Tier strip: the score scale and the toil share per tier. */}
            <Reveal delay={0.15} y={24}>
              <div style={{ background: "#ffffff", borderRadius: "var(--radius-cs-card)", border: "1px solid rgba(17,17,17,0.07)", padding: "18px 22px 20px" }}>
                <div className="flex flex-wrap items-baseline justify-between" style={{ gap: "6px 16px" }}>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED }}>Runtime Complexity tiers</p>
                  <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: MUTED, fontVariantNumeric: "tabular-nums" }}>
                    Score scale {BURDEN_SCALE.min} to {BURDEN_SCALE.max}. Working year {ANNUAL_ENG_HOURS.toLocaleString("en-US")} hours.
                  </p>
                </div>
                <div className="flex" style={{ marginTop: "12px", gap: "4px" }} aria-hidden>
                  {TIER_SUMMARY.map((t) => (
                    <span key={t.name} style={{ flex: `${t.max - t.min} 0 0`, height: "8px", borderRadius: "999px", background: TIER_COLOR[t.name] }} />
                  ))}
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-4" style={{ listStyle: "none", padding: 0, margin: "12px 0 0", gap: "10px 12px" }}>
                  {TIER_SUMMARY.map((t) => (
                    <li key={t.name}>
                      <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 700, color: TIER_COLOR[t.name] }}>{t.name}</span>
                      <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "12.5px", color: SUB, fontVariantNumeric: "tabular-nums", marginTop: "2px" }}>{t.min} to {t.max}</span>
                      <span style={{ display: "block", fontFamily: "var(--font-sans)", fontSize: "12px", color: MUTED, marginTop: "2px" }}>{pct(t.hoursShare)} of the year lost to toil</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}
