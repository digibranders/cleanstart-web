import Link from "next/link";
import { HeroReveal } from "@/components/ui/Reveal";
import { HERO_CTA, STANDFIRST, TITLE_PARTS, UI } from "./compare-data";
import { Glow } from "./compare-visuals";

/**
 * Comparison hero: the document's title, its standfirst and the two calls to
 * action, on the site's standard dark hero shell (`bg-cs-hero` mesh plus the
 * shared gridline overlay).
 *
 * No artwork. The band carries type only, so the copy sits centred on the
 * measure the way the site's other text-led heroes do (`PricingHero`).
 *
 * Two calls to action, ranked. The document's own CTA ("Explore CleanStart
 * Images") is the glass primary; the jump link to the capability matrix is the
 * blue secondary, because a visitor arriving on a comparison query wants the
 * table and would otherwise scroll past four sections to reach it.
 * The band ends on its own gradient, with no fade into the section below: the
 * mesh's violet is the page's opening colour and a white wash over it read as
 * the hero draining away.
 */
export function CompareHero(): React.ReactElement {
  return (
    <section
      data-section="CompareHero"
      className="relative overflow-hidden bg-cs-hero"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/for-developers/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute left-0 top-0 hidden w-full select-none md:block"
        style={{ height: "620px", objectFit: "cover", opacity: 0.6 }}
        loading="eager"
        decoding="async"
      />
      <Glow
        color="rgba(169,116,255,0.28)"
        size="min(760px, 52%)"
        right="-6%"
        top="-18%"
      />
      <Glow
        color="rgba(7,110,255,0.22)"
        size="min(560px, 42%)"
        left="-10%"
        bottom="-14%"
      />

      <div
        className="relative z-20 mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{
          paddingTop: "calc(clamp(112px, 10vw, 148px) + var(--cs-header-extra))",
          paddingBottom: "clamp(92px, 10vw, 150px)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <HeroReveal y={50} duration={1} lcp>
            <h1
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-display)",
                fontWeight: "var(--fs-display-weight)",
                letterSpacing: "var(--fs-display-ls)",
                lineHeight: "var(--fs-display-lh)",
                maxWidth: "18ch",
                textWrap: "balance",
              }}
            >
              {TITLE_PARTS.lead}
              <span className="cs-text-gradient-impact">{TITLE_PARTS.accent}</span>
            </h1>
          </HeroReveal>

          <HeroReveal y={30} delay={0.15} duration={0.8}>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "var(--fs-lead)",
                fontWeight: "var(--fs-lead-weight)",
                letterSpacing: "var(--fs-lead-ls)",
                lineHeight: "var(--fs-lead-lh)",
                color: "rgba(255,255,255,0.78)",
                maxWidth: "62ch",
                marginTop: "clamp(20px, 2vw, 28px)",
              }}
            >
              {STANDFIRST}
            </p>

            <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
              {/* Site-standard hero pair: the glass primary the home and Clean
                  Images heroes use, and the solid blue as secondary. */}
              <Link
                href={HERO_CTA.href}
                className="cs-btn-glass"
                style={
                  {
                    "--cs-btn-h": "44px",
                    "--cs-btn-px": "24px",
                    "--cs-btn-fs": "var(--fs-button-lg)",
                  } as React.CSSProperties
                }
              >
                <span>{HERO_CTA.label}</span>
              </Link>

              <Link
                href="#capability-comparison"
                className="cs-btn-blue"
                style={
                  {
                    "--cs-btn-h": "44px",
                    "--cs-btn-px": "24px",
                    "--cs-btn-fs": "var(--fs-button-lg)",
                  } as React.CSSProperties
                }
              >
                <span>{UI.jumpToMatrix}</span>
              </Link>
            </div>
          </HeroReveal>
        </div>
      </div>
    </section>
  );
}
