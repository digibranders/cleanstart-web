import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { TITLE_SUB, UI_CHROME } from "./compare-data";
import { CompareHeroArtifact } from "./CompareHeroArtifact";
import { Glow } from "./compare-visuals";

/**
 * Comparison hero: title, standfirst and jump link against the illustrated
 * artifact the page goes on to interrogate.
 *
 * The four opening questions deliberately do NOT live here. `INTRO_LEAD` ends
 * on a colon and the questions complete that sentence, so they travel together
 * into `CompareQuestions` rather than being split across a column boundary.
 *
 * Ends flat — no fade band into the section below. Height is tuned to sit in
 * the same range as the other page heroes (/pricing ~549px, /fips ~667px at
 * 1720w) rather than towering over them.
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
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(84px, 7.5vw, 120px) + var(--cs-header-extra))",
          paddingBottom: "clamp(56px, 5vw, 84px)",
        }}
      >
        <div className="grid gap-x-12 gap-y-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
          {/* Left: title, standfirst, jump link */}
          <div className="flex flex-col items-start">
            <HeroReveal y={50} duration={1} lcp>
              <h1
                className="font-display text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-display-ls)",
                  lineHeight: "var(--fs-display-lh)",
                  maxWidth: "16ch",
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
                  maxWidth: "34ch",
                  marginTop: "clamp(18px, 1.8vw, 26px)",
                }}
              >
                {TITLE_SUB}
              </p>

              <Link
                href="#capability-matrix"
                className="cs-btn-glass group mt-10 inline-flex items-center gap-2"
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

          {/*
            * Right: the artifact. Desktop only — stacked under the title on a
            * phone it costs a screenful above the fold and pushes the CTA out
            * of view without adding meaning.
            */}
          <div className="hidden lg:block">
            <HeroReveal y={40} delay={0.28} duration={1}>
              <CompareHeroArtifact />
            </HeroReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
