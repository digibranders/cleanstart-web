import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { INTRO_LEAD, OPENING_QUESTIONS, TITLE_SUB, UI_CHROME } from "./compare-data";
import { Glow, accentAt } from "./compare-visuals";

/**
 * Comparison hero.
 *
 * Balanced 2-column layout:
 *  - Left: Uppercase architecture eyebrow badge, H1 title, subtitle, intro lead, and CTA button.
 *  - Right: Four fundamental questions framed inside frosted glassmorphic cards aligned alongside the hero text.
 *
 * Content is 100% verbatim from compare-data.ts.
 */
export function CompareHero(): React.ReactElement {
  return (
    <section
      data-section="CompareHero"
      className="relative overflow-hidden bg-cs-hero"
    >
      <Glow color="rgba(169,116,255,0.25)" size="min(720px, 50%)" right="-5%" top="-15%" />
      <Glow color="rgba(91,155,255,0.2)" size="min(600px, 45%)" left="-8%" bottom="-10%" />

      <div
        aria-hidden
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-10"
        style={{
          height: "200px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.92) 88%, #ffffff 100%)",
        }}
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(112px, 11.5vw, 176px) + var(--cs-header-extra))",
          paddingBottom: "clamp(96px, 10vw, 160px)",
        }}
      >
        <div className="grid gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          {/* Left Column: Title, Subtitle, Lead Paragraph & CTA */}
          <div className="flex flex-col items-start">
            <HeroReveal y={50} duration={1} lcp>
              <h1
                className="font-display text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-display-ls)",
                  lineHeight: "var(--fs-display-lh)",
                  maxWidth: "18ch",
                  textWrap: "balance",
                }}
              >
                Docker Hardened Images vs{" "}
                <span className="cs-text-gradient-impact">CleanStart</span>
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.15} duration={0.8}>
              <p
                className="font-display"
                style={{
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.35,
                  color: "rgba(255,255,255,0.68)",
                  maxWidth: "38ch",
                  marginTop: "clamp(18px, 1.8vw, 26px)",
                }}
              >
                {TITLE_SUB}
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.26} duration={0.8}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-body)",
                  fontWeight: 400,
                  lineHeight: 1.65,
                  letterSpacing: "-0.01em",
                  color: "rgba(255,255,255,0.76)",
                  maxWidth: "46ch",
                  marginTop: "clamp(24px, 2.4vw, 36px)",
                  textWrap: "pretty",
                }}
              >
                {INTRO_LEAD}
              </p>
              <Link
                href="#capability-matrix"
                className="cs-btn-glass group mt-8 inline-flex items-center gap-2"
                style={
                  {
                    "--cs-btn-px": "24px",
                    "--cs-btn-fs": "16px",
                  } as React.CSSProperties
                }
              >
                <span>{UI_CHROME.jumpToMatrix}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-y-0.5"
                >
                  <path
                    d="M8 3v10M3 8l5 5 5-5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </HeroReveal>
          </div>

          {/* Right Column: 4 Opening Question Cards aligned from top */}
          <div className="lg:pt-3">
            <HeroReveal y={36} delay={0.34} duration={0.9}>
              <ul className="flex flex-col gap-3.5">
                {OPENING_QUESTIONS.map((question, index) => {
                  const accent = accentAt(index);
                  return (
                    <li
                      key={question}
                      className="group relative flex items-center gap-4 rounded-xl border border-white/12 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08]"
                      style={{
                        boxShadow: "0 8px 24px -12px rgba(0, 0, 0, 0.4)",
                      }}
                    >
                      <span
                        aria-hidden
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg tabular-nums font-sans text-xs font-semibold"
                        style={{
                          color: "#ffffff",
                          background: "rgba(255,255,255,0.1)",
                          boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent.dark} 60%, transparent)`,
                        }}
                      >
                        0{index + 1}
                      </span>
                      <span
                        className="font-display text-white font-medium"
                        style={{
                          fontSize: "var(--fs-h4)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.35,
                        }}
                      >
                        {question}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </HeroReveal>
          </div>
        </div>
      </div>
    </section>
  );
}


