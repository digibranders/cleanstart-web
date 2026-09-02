import type React from "react";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

/*
 * "Why these numbers move together": the input-to-output relationship rendered as
 * a compounding chain (a metro-line on desktop, a vertical timeline on mobile).
 * Each station carries the calculator's own tier colour and a severity meter
 * that grows link-by-link, so the eye *sees* the burden amplify. A "CleanStart
 * cuts here" marker severs the spine after the first link; the dark banner below
 * is the payoff. Server component; motion is CSS-only and reduced-motion aware.
 */

interface ChainLink {
  n: number;
  title: string;
  body: string;
  load: string;
  /** severity-meter fill, 0 to 100 */
  pct: number;
  /** dot gradient stops */
  dot: [string, string];
  /** meter fill (solid colour or gradient) */
  fill: string;
  /** mobile connector gradient: this colour → next */
  seg: [string, string];
}

const C1 = "#2cc1eb";
const C2 = "#3960F9";
const C3 = "#471ec0";
const C4 = "#6b2ec9";
const C5 = "#8b1fc3";

const CHAIN: ChainLink[] = [
  { n: 1, title: "Inherited base-OS packages", body: "Every production image carries its base image's packages, and their CVEs.", load: "Low", pct: 16, dot: ["#43d0f2", C1], fill: C1, seg: [C1, C2] },
  { n: 2, title: "Higher runtime complexity", body: "More surfaces to scan, patch, and keep compliant.", load: "Rising", pct: 36, dot: ["#5678ff", C2], fill: C2, seg: [C2, C3] },
  { n: 3, title: "More vulnerability noise", body: "Scanners surface thousands of findings, most low-signal.", load: "High", pct: 58, dot: ["#5a35d6", C3], fill: C3, seg: [C3, C4] },
  { n: 4, title: "Longer patch cycles", body: "Teams rebuild, re-test, and redeploy on every fix.", load: "Severe", pct: 79, dot: ["#7e3bd8", C4], fill: C4, seg: [C4, C5] },
  { n: 5, title: "Engineering hours lost", body: "Toil that scales with your image and team count.", load: "Peak", pct: 100, dot: ["#a233d6", C5], fill: "linear-gradient(90deg,#8b1fc3,#c026d3)", seg: [C5, C5] },
];

export function ImpactHowItWorks(): React.ReactElement {
  return (
    <section data-section="ImpactHowItWorks" aria-labelledby="impact-how-heading" className="relative" style={{ background: "#ffffff" }}>
      {/* pb = --spacing-section-cta so the Footer's floating CTA card (which
          hangs half above the footer's top edge, per Footer.tsx §layout-contract)
          overlaps this section's own white background instead of colliding with
          the "CleanStart breaks the chain" dark banner at the section's tail. */}
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10 pt-section-md pb-[var(--spacing-section-cta)]">
        <div className="text-center" style={{ marginBottom: "clamp(36px,4vw,52px)" }}>
          <Reveal header>
            <h2 id="impact-how-heading" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#111" }}>
              Why these numbers <span className="cs-text-gradient-impact">move together</span>
            </h2>
          </Reveal>
          <Reveal>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-lead-sm)", color: "#3a3f4c", lineHeight: 1.5, maxWidth: "60ch", margin: "16px auto 0" }}>
              Inherited vulnerabilities compound down a predictable chain. Each link amplifies the next, which is exactly where the burden comes from.
            </p>
          </Reveal>
        </div>

        {/* compounding chain */}
        <Reveal>
          <div className="cs-chain">
            <div className="cs-chain-spine" aria-hidden />
            <ol className="cs-chain-stations" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {CHAIN.map((link) => (
                <li
                  key={link.n}
                  className={`cs-chain-st cs-chain-st${link.n}`}
                  style={{ ["--seg1" as string]: link.seg[0], ["--seg2" as string]: link.seg[1] }}
                >
                  <span className="cs-chain-dot" aria-hidden style={{ background: `linear-gradient(135deg,${link.dot[0]},${link.dot[1]})` }}>
                    {link.n}
                  </span>
                  <div className="cs-chain-card">
                    <h3>{link.title}</h3>
                    <p>{link.body}</p>
                    <div className="cs-chain-meta">
                      <span>Compounding load</span>
                      <b>{link.load}</b>
                    </div>
                    <div className="cs-chain-track">
                      <div className="cs-chain-fill" style={{ width: `${link.pct}%`, background: link.fill }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* cut marker, desktop only, between links 1 and 2 */}
            <div className="cs-chain-cut" aria-hidden>
              <span className="cs-chain-sc">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <line x1="20" y1="4" x2="8.12" y2="15.88" />
                  <line x1="14.47" y1="14.48" x2="20" y2="20" />
                  <line x1="8.12" y1="8.12" x2="12" y2="12" />
                </svg>
              </span>
              <span className="cs-chain-pill">CleanStart cuts here</span>
            </div>
          </div>
        </Reveal>

        {/* where CleanStart breaks the chain */}
        <Reveal>
          <div className="relative overflow-hidden" style={{ marginTop: "clamp(32px,3.5vw,44px)", borderRadius: "var(--radius-cs-card)", padding: "clamp(24px,2.6vw,34px) clamp(24px,3vw,40px)", background: "linear-gradient(120deg,#0f1330,#1c1a63 58%,#3b1f9e)", boxShadow: "0 20px 50px -24px rgba(30,20,120,0.6)", display: "flex", alignItems: "center", gap: "clamp(20px,2vw,28px)", flexWrap: "wrap" }}>
            <div aria-hidden className="pointer-events-none absolute" style={{ left: "-60px", top: "-80px", width: "320px", height: "320px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(44,193,235,0.25), transparent)" }} />
            <div aria-hidden className="pointer-events-none absolute" style={{ right: "-40px", bottom: "-90px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(139,31,195,0.28), transparent)" }} />
            <div aria-hidden className="relative" style={{ flex: "none", width: "56px", height: "56px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(44,193,235,0.14)", border: "1px solid rgba(44,193,235,0.4)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div className="relative" style={{ flex: 1, minWidth: "280px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#2cc1eb" }}>
                CleanStart breaks the chain
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(19px,3vw,23px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#fff", marginTop: "8px", lineHeight: 1.2 }}>
                Cut the first link, and every number after it improves
              </h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "rgba(255,255,255,0.8)", lineHeight: 1.55, marginTop: "8px", maxWidth: "78ch" }}>
                Minimal, hardened images inherit far fewer CVEs at the source, so there is less to triage, patch, and re-test all the way downstream.{" "}
                <Link href="/cleanstart-images" style={{ color: C1, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px", whiteSpace: "nowrap" }}>See how CleanStart images are built</Link>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
