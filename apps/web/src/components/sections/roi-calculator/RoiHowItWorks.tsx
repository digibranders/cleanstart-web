import type React from "react";
import { Reveal } from "@/components/ui/Reveal";

/*
 * "Why these numbers move together" — makes the input→output relationship
 * explicit as a cause-and-effect chain, then shows where CleanStart breaks it.
 * Turns an otherwise opaque model into an educational trust signal for a
 * technical audience (CISO / platform / security / CTO). Light section.
 */

interface Link {
  title: string;
  body: string;
  accent: string;
}

const CHAIN: Link[] = [
  { title: "More production images", body: "Every image inherits its base OS packages — and their CVEs.", accent: "#2cc1eb" },
  { title: "Higher runtime complexity", body: "More surfaces to scan, patch, and keep compliant.", accent: "#3960F9" },
  { title: "More vulnerability noise", body: "Scanners surface thousands of findings, most low-signal.", accent: "#471ec0" },
  { title: "Longer patch cycles", body: "Teams rebuild, re-test, and redeploy on every fix.", accent: "#6b2ec9" },
  { title: "Engineering hours lost", body: "Toil that scales with your image and team count.", accent: "#8b1fc3" },
];

export function RoiHowItWorks(): React.ReactElement {
  return (
    <section data-section="RoiHowItWorks" aria-labelledby="roi-how-heading" className="relative" style={{ background: "#ffffff" }}>
      <div className="mx-auto max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        <div className="text-center" style={{ marginBottom: "clamp(36px,4vw,52px)" }}>
          <Reveal header>
            <h2 id="roi-how-heading" style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h2)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.1, color: "#111" }}>
              Why these numbers <span className="cs-text-gradient-impact">move together</span>
            </h2>
          </Reveal>
          <Reveal>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--fs-lead-sm)", color: "#3a3f4c", lineHeight: 1.5, maxWidth: "60ch", margin: "16px auto 0" }}>
              Inherited vulnerabilities compound down a predictable chain. Each input feeds the next — which is exactly where the burden comes from.
            </p>
          </Reveal>
        </div>

        {/* cause → effect chain */}
        <ol className="grid gap-x-4 gap-y-6 lg:grid-cols-5" style={{ listStyle: "none", padding: 0, margin: 0, gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          {CHAIN.map((link, i) => (
            <li key={link.title} className="relative" style={{ background: "#F6F6F6", borderRadius: "var(--radius-cs-card)", padding: "24px 22px", border: "1px solid rgba(17,17,17,0.05)" }}>
              <span aria-hidden style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "9px", background: link.accent, color: "#fff", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 700 }}>{i + 1}</span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-h5)", fontWeight: 600, letterSpacing: "-0.02em", color: "#111", marginTop: "12px", lineHeight: 1.2 }}>{link.title}</h3>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "#5b6070", lineHeight: 1.5, marginTop: "6px", textWrap: "balance" }}>{link.body}</p>
              {i < CHAIN.length - 1 && (
                <span aria-hidden className="hidden lg:flex absolute items-center justify-center" style={{ right: "-14px", top: "44px", width: "22px", height: "22px", color: "rgba(17,17,17,0.28)", fontSize: "16px", zIndex: 1 }}>→</span>
              )}
            </li>
          ))}
        </ol>

        {/* where CleanStart breaks the chain */}
        <div className="relative overflow-hidden" style={{ marginTop: "clamp(28px,3vw,40px)", borderRadius: "var(--radius-cs-card)", padding: "clamp(24px,2.4vw,32px)", background: "linear-gradient(120deg,#0f1330,#1c1a63 60%,#3b1f9e)", boxShadow: "0 10px 30px -14px rgba(30,20,120,0.5)" }}>
          <div aria-hidden className="pointer-events-none absolute" style={{ left: "-40px", top: "-60px", width: "260px", height: "260px", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(44,193,235,0.22), transparent)" }} />
          <div className="relative flex flex-wrap items-center" style={{ gap: "10px 16px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2cc1eb" }}>CleanStart breaks the chain</span>
          </div>
          <p style={{ position: "relative", fontFamily: "var(--font-sans)", fontSize: "var(--fs-body)", color: "rgba(255,255,255,0.82)", lineHeight: 1.55, marginTop: "10px", maxWidth: "70ch" }}>
            Minimal, hardened images inherit far fewer CVEs at the source — so there is less to triage, patch, and re-test all the way downstream. Cut the first link, and every number after it improves.
          </p>
        </div>

        <p style={{ fontFamily: "var(--font-sans)", fontSize: "12.5px", color: "#5b6070", textAlign: "center", marginTop: "24px", lineHeight: 1.55, maxWidth: "74ch", marginInline: "auto" }}>
          The simulator scores your inputs, maps them to a runtime-complexity tier, and reads each outcome from evidence-based ranges. Open <em>“Why this score?”</em> above to see the exact breakdown.
        </p>
      </div>
    </section>
  );
}
