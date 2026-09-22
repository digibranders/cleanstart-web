import type React from "react";
import Link from "next/link";
import { HeroBreadcrumb } from "@/components/sections/_shared/HeroBreadcrumb";
import { DownloadIcon } from "@/components/sections/case-studies/CaseStudyIcons";
import { HeroReveal } from "@/components/ui/Reveal";
import type { CaseStudyOutcome } from "@/lib/case-studies";
import type { CaseStudyQuote } from "./case-study-quote";
import { CaseStudyResultCard } from "./CaseStudyResultCard";

/**
 * Detail hero for a single case study.
 *
 * Bespoke rather than the shared `DetailHero`, which is built for editorial
 * (a centred title over a byline) and has nowhere to put a customer, an
 * industry or a number. A case study is a record, so the hero is asymmetric:
 * the claim on the left, the evidence on the right.
 *
 * It collapses to the centred single-column shape when a study has neither
 * figures nor a quote, which is the shared hero's layout anyway — so the two
 * heroes agree at their weakest and diverge only where there is something to
 * show.
 */

const HERO_GRADIENT =
  "linear-gradient(180deg, #151021 22%, #10123e 36%, #131e8f 64%, #471ec0 84%, #4a21c9 100%)";

export function CaseStudyHero({
  title,
  company,
  industry,
  logoSrc,
  standfirst,
  publishedLabel,
  downloadHref,
  fileMeta,
  outcomes,
  quote,
}: {
  title: string;
  company: string;
  industry: string;
  logoSrc?: string | undefined;
  /** Empty when the result card is carrying the customer's quote instead. */
  standfirst: string;
  publishedLabel: string;
  downloadHref?: string | undefined;
  fileMeta?: string | null;
  outcomes?: readonly CaseStudyOutcome[] | undefined;
  quote?: CaseStudyQuote | undefined;
}): React.ReactElement {
  const card = (
    <CaseStudyResultCard
      company={company}
      industry={industry}
      logoSrc={logoSrc}
      outcomes={outcomes}
      quote={quote}
    />
  );
  const hasCard = card !== null;

  return (
    <section
      data-section="CaseStudyHero"
      className="relative overflow-hidden"
      style={{ background: HERO_GRADIENT }}
      aria-labelledby="case-study-title"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        aria-hidden
        src="/images/case-studies/hero-grid.svg"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-80"
        loading="eager"
        decoding="async"
      />
      {/* Violet bloom behind the card side, so the glass has something to sit on. */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none"
        style={{
          right: "4%",
          top: "18%",
          width: "clamp(320px, 34vw, 540px)",
          aspectRatio: "1",
          borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(154,81,255,0.42), transparent 72%)",
          filter: "blur(40px)",
        }}
      />

      <div
        className="relative z-[2] mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ paddingTop: "calc(72px + var(--cs-header-extra))" }}
      >
        <HeroBreadcrumb
          items={[
            { name: "Home", path: "/" },
            { name: "Case Studies", path: "/case-studies" },
            { name: title },
          ]}
          navClassName="pt-4"
        />

        <div
          className={`grid items-center gap-10 pb-[clamp(56px,7vw,96px)] pt-[clamp(24px,3vw,44px)] lg:gap-16 ${
            hasCard ? "lg:grid-cols-[1.15fr_0.85fr]" : "place-items-center text-center"
          }`}
        >
          <div
            className="flex flex-col gap-6"
            style={{ maxWidth: hasCard ? "640px" : "820px" }}
          >
            <HeroReveal y={40} duration={0.9}>
              <p
                className="font-sans uppercase text-[#9fd8f5]"
                style={{
                  fontSize: "var(--fs-eyebrow)",
                  fontWeight: "var(--fs-eyebrow-weight)",
                  letterSpacing: "var(--fs-eyebrow-ls)",
                }}
              >
                Case study
                {industry ? ` · ${industry}` : ""}
              </p>
            </HeroReveal>

            <HeroReveal y={50} duration={1.0} lcp>
              <h1
                id="case-study-title"
                className="font-display text-white"
                style={{
                  fontSize: "var(--fs-h1)",
                  fontWeight: 600,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.08,
                }}
              >
                {title}
              </h1>
            </HeroReveal>

            {standfirst && (
              <HeroReveal y={30} delay={0.15} duration={0.8}>
                <p
                  className="font-sans"
                  style={{
                    fontSize: "var(--fs-lead)",
                    lineHeight: 1.45,
                    letterSpacing: "-0.02em",
                    color: "rgba(255,255,255,0.78)",
                    maxWidth: "58ch",
                  }}
                >
                  {standfirst}
                </p>
              </HeroReveal>
            )}

            <HeroReveal y={30} delay={0.3} duration={0.8}>
              <div
                className={`flex flex-wrap items-center gap-4 ${hasCard ? "" : "justify-center"}`}
              >
                {downloadHref && (
                  <a
                    href={downloadHref}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cs-btn-glass"
                    style={
                      {
                        "--cs-btn-fs": "16px",
                        "--cs-btn-h": "44px",
                        "--cs-btn-px": "22px",
                      } as React.CSSProperties
                    }
                  >
                    <DownloadIcon size={17} />
                    <span>Download the case study</span>
                  </a>
                )}
                <Link
                  href="/book-a-demo"
                  className="cs-btn-blue"
                  style={
                    {
                      "--cs-btn-fs": "16px",
                      "--cs-btn-h": "44px",
                      "--cs-btn-px": "22px",
                    } as React.CSSProperties
                  }
                >
                  Book a demo
                </Link>
                <span
                  className="font-sans text-white/50"
                  style={{ fontSize: "var(--fs-caption)" }}
                >
                  {[fileMeta, publishedLabel].filter(Boolean).join(" · ")}
                </span>
              </div>
            </HeroReveal>
          </div>

          {hasCard && (
            <HeroReveal y={40} delay={0.2} duration={0.9} className="w-full">
              {card}
            </HeroReveal>
          )}
        </div>
      </div>
    </section>
  );
}
