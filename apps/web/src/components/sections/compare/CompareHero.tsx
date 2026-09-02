import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { HERO_CTA, STANDFIRST, TITLE_PARTS, UI } from "./compare-data";
import { CompareFoundationStacks } from "./CompareFoundationStacks";
import { Glow } from "./compare-visuals";

/**
 * Comparison hero: the document's title and standfirst on the left, the
 * foundation-stack diagram on the right.
 *
 * Two calls to action, ranked. The document's own CTA ("Explore CleanStart
 * Images") is the primary; the jump link to the capability matrix is the quiet
 * secondary, because a visitor arriving on a comparison query wants the table
 * and would otherwise scroll past four sections to reach it.
 *
 * The diagram is desktop-only. Stacked under the title on a phone it costs a
 * full screen above the fold and pushes both CTAs out of view.
 */
export function CompareHero(): React.ReactElement {
  return (
    <section
      data-section="CompareHero"
      className="relative overflow-hidden bg-cs-hero"
    >
      <Glow
        color="rgba(169,116,255,0.25)"
        size="min(720px, 50%)"
        right="-5%"
        top="-15%"
      />
      <Glow
        color="rgba(91,155,255,0.2)"
        size="min(600px, 45%)"
        left="-8%"
        bottom="-10%"
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(84px, 7.5vw, 120px) + var(--cs-header-extra))",
          paddingBottom: "clamp(56px, 5vw, 84px)",
        }}
      >
        <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center">
          <div className="flex flex-col items-start">
            <HeroReveal y={50} duration={1} lcp>
              <h1
                className="font-display text-white"
                style={{
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "var(--fs-display-ls)",
                  lineHeight: "var(--fs-display-lh)",
                  maxWidth: "17ch",
                  textWrap: "balance",
                }}
              >
                {TITLE_PARTS.lead}
                <span className="cs-text-gradient-impact">
                  {TITLE_PARTS.accent}
                </span>
                {TITLE_PARTS.tail}
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
                {STANDFIRST}
              </p>

              {/*
                * Stock CTA pair, no per-page variants. `cs-btn-blue` is the
                * dark-hero primary the two most recent heroes use (SaasHero,
                * FinanceHero) at h44 / px24 / fs16, and it matches the blue
                * button in this page's own footer CTA. `cs-btn-ghost` is the
                * site's only secondary, at the PricingHero / LibrariesHero
                * sizing.
                */}
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href={HERO_CTA.href}
                  className="cs-btn-blue"
                  style={
                    {
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "24px",
                      "--cs-btn-fs": "16px",
                    } as React.CSSProperties
                  }
                >
                  <span>{HERO_CTA.label}</span>
                </Link>

                <Link
                  href="#capability-comparison"
                  className="cs-btn-ghost"
                  style={
                    {
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "20px",
                      "--cs-btn-fs": "16px",
                    } as React.CSSProperties
                  }
                >
                  <span>{UI.jumpToMatrix}</span>
                </Link>
              </div>
            </HeroReveal>
          </div>

          <div className="hidden lg:block">
            <HeroReveal y={40} delay={0.28} duration={1}>
              <CompareFoundationStacks />
            </HeroReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
