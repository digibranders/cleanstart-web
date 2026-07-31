import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { INTRO_LEAD, OPENING_QUESTIONS, TITLE_SUB, UI_CHROME } from "./compare-data";

/**
 * Comparison hero.
 *
 * The article opens by posing four questions, so those are the hero — set as
 * large quiet type on rules rather than as an illustration or a stat panel.
 * "CleanStart" carries the brand gradient because the rest of the site does it
 * on a page's primary heading; it appears exactly once on this page.
 */
export function CompareHero(): React.ReactElement {
  return (
    <section
      data-section="CompareHero"
      className="relative overflow-hidden bg-cs-hero"
    >
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
              color: "rgba(255,255,255,0.62)",
              maxWidth: "34ch",
              marginTop: "clamp(18px, 1.8vw, 26px)",
            }}
          >
            {TITLE_SUB}
          </p>
        </HeroReveal>

        <div
          className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          style={{ marginTop: "clamp(48px, 5vw, 84px)" }}
        >
          <HeroReveal y={30} delay={0.26} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-body)",
                fontWeight: 400,
                lineHeight: 1.65,
                letterSpacing: "-0.01em",
                color: "rgba(255,255,255,0.72)",
                maxWidth: "44ch",
                textWrap: "pretty",
              }}
            >
              {INTRO_LEAD}
            </p>
            <Link
              href="#capability-matrix"
              className="cs-btn-glass mt-8 inline-flex"
              style={
                {
                  "--cs-btn-px": "24px",
                  "--cs-btn-fs": "16px",
                } as React.CSSProperties
              }
            >
              {UI_CHROME.jumpToMatrix}
            </Link>
          </HeroReveal>

          <HeroReveal y={36} delay={0.34} duration={0.9}>
            <ul className="flex flex-col">
              {OPENING_QUESTIONS.map((question) => (
                <li
                  key={question}
                  className="font-display text-white"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.18)",
                    paddingTop: "clamp(14px, 1.4vw, 20px)",
                    paddingBottom: "clamp(14px, 1.4vw, 20px)",
                    fontSize: "var(--fs-h4)",
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.35,
                  }}
                >
                  {question}
                </li>
              ))}
            </ul>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
