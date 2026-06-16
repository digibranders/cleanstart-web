"use client";

import type React from "react";
import { Fragment } from "react";
import Image from "next/image";
import { Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { HOME_TESTIMONIALS } from "@/components/sections/home/Testimonials";

/*
 * "Customer Validation" + "Outcomes That Matter" — the CISO page's proof block,
 * merged into one component. A single wrapper paints ONE continuous dark
 * gradient (#120D1F → #151021 → #131E8F → #471EC0) spanning both semantic
 * <section>s, so there is no seam where two separately-scaled gradients meet.
 * The inner sections are transparent; the wrapper's gradient also fills the
 * outcomes section's `paddingBottom: var(--spacing-section-cta)` card-overlap
 * reservation (this is the last block before <Footer cta>).
 */

// One gradient for the whole block. Stops are tuned so the deep #151021 sits
// around the testimonial card, ramping to brand violet through the stats/CTA
// zone at the bottom where the Footer card overlaps.
const BLOCK_BACKGROUND =
  "linear-gradient(180deg, #120D1F 0%, #151021 50%, #131E8F 82%, #471EC0 100%)";

const CISO_VOICE = HOME_TESTIMONIALS.find((t) => t.role.includes("CISO"));

// The colored IIFL wordmark vanishes on a dark surface; the white wordmark
// (orange mandala + white "IIFL FINANCE") reads cleanly here.
const IIFL_WHITE_LOGO = "/images/testimonials/iifl-finance-white.webp";

interface Stat {
  value: string;
  label: string;
}

const STATS: Stat[] = [
  { value: "88,000+", label: "CVEs remediated" },
  { value: "~90%", label: "Average CVE reduction" },
  { value: "352,000+", label: "Engineering hours saved" },
  { value: "10M+", label: "Packages from verified source" },
  { value: "100%", label: "Deterministic builds" },
];

export function CisoValidationOutcomes(): React.ReactElement {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ background: BLOCK_BACKGROUND }}
    >
      {CISO_VOICE && <ValidationSpotlight />}
      <OutcomesBand />
    </div>
  );
}

function ValidationSpotlight(): React.ReactElement | null {
  if (!CISO_VOICE) return null;
  const { name, role, quote, photoSrc, caseStudyHref } = CISO_VOICE;

  return (
    <section
      aria-label="Customer validation"
      className="relative w-full overflow-hidden pt-section-sm text-white"
    >
      {/* Ambient aura — cyan→violet radial glow behind the card. Pure CSS,
          screen-blended so it lifts the deep band without a hard edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[760px] w-[1100px] max-w-[120%] -translate-x-1/2 -translate-y-1/2 select-none"
        style={{
          background:
            "radial-gradient(48% 50% at 50% 42%, rgba(79,30,192,0.55) 0%, rgba(19,30,143,0.32) 42%, rgba(51,186,236,0.10) 68%, rgba(0,0,0,0) 100%)",
          mixBlendMode: "screen",
          filter: "blur(8px)",
        }}
      />

      <Container className="relative z-[2]">
        <Reveal header className="mx-auto" style={{ maxWidth: "640px" }}>
          <h2
            className="text-center font-display"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Customer{" "}
            <span className="cs-text-gradient-impact">Validation</span>
          </h2>
        </Reveal>

        <Reveal y={28} delay={0.12} className="mx-auto mt-10 sm:mt-12" style={{ maxWidth: "980px" }}>
          {/* Gradient-stroked glass card. The ::before hairline is painted via
              the mask-composite trick (see globals .cs-grad-border). */}
          <figure
            className="cs-grad-border relative overflow-hidden rounded-[28px] px-7 py-9 sm:px-12 sm:py-12"
            style={{
              background:
                "linear-gradient(155deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 48%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow:
                "0 40px 90px -30px rgba(8,4,24,0.85), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            {/* Oversized editorial quote glyph — decorative anchor. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-2 left-5 select-none font-display sm:left-9"
              style={{
                fontSize: "clamp(72px, 9vw, 124px)",
                lineHeight: 1,
                fontWeight: 700,
                background:
                  "linear-gradient(135deg, #33BAEC 0%, #6F8DFF 50%, #B19CFF 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                opacity: 0.22,
              }}
            >
              &ldquo;
            </span>

            <blockquote
              className="relative mt-5 font-display sm:mt-7"
              style={{
                fontSize: "var(--fs-h3)",
                fontWeight: 600,
                lineHeight: 1.42,
                letterSpacing: "-0.02em",
                color: "rgba(255,255,255,0.96)",
                textWrap: "balance",
              }}
            >
              {quote}
            </blockquote>

            {/* Hairline divider above the attribution row. */}
            <div
              aria-hidden
              className="mt-8 h-px w-full sm:mt-10"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)",
              }}
            />

            <figcaption className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                {/* Portrait with gradient ring. */}
                <span
                  aria-hidden
                  className="inline-flex shrink-0 rounded-full p-[2px]"
                  style={{
                    background:
                      "linear-gradient(135deg, #33BAEC 0%, #6F8DFF 50%, #B19CFF 100%)",
                  }}
                >
                  <span className="block overflow-hidden rounded-full bg-[#151021]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoSrc ?? "/images/testimonial-photo.webp"}
                      alt={`${name}, ${role}`}
                      width={64}
                      height={64}
                      decoding="async"
                      loading="lazy"
                      className="h-16 w-16 object-cover"
                      style={{ aspectRatio: "1 / 1" }}
                    />
                  </span>
                </span>

                <div className="not-italic">
                  <div
                    className="font-display text-white"
                    style={{
                      fontSize: "var(--fs-h4)",
                      fontWeight: 600,
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {name}
                  </div>
                  <div
                    className="font-sans"
                    style={{
                      fontSize: "var(--fs-body-sm)",
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.62)",
                    }}
                  >
                    {role}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-5 sm:items-end">
                <Image
                  src={IIFL_WHITE_LOGO}
                  alt="IIFL Finance"
                  width={132}
                  height={26}
                  sizes="132px"
                  className="h-[26px] w-auto max-w-[140px] object-contain"
                />
                {caseStudyHref && (
                  <a
                    href={caseStudyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 font-sans transition-colors"
                    style={{
                      fontSize: "var(--fs-button)",
                      fontWeight: 500,
                      color: "rgba(255,255,255,0.92)",
                    }}
                  >
                    <span className="cs-text-gradient-impact">Read Case study</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden
                      className="text-[#6F8DFF] transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path
                        d="M4 10h12m0 0l-4-4m4 4l-4 4"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </figcaption>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}

function OutcomesBand(): React.ReactElement {
  return (
    <section
      aria-label="Outcomes that matter"
      data-section="CisoOutcomes"
      className="relative overflow-hidden text-white"
      style={{
        paddingTop: "clamp(64px, 6.25vw, 120px)",
        paddingBottom: "var(--spacing-section-cta)",
      }}
    >
      <Container>
        <Reveal header>
          <h2
            className="mx-auto text-center font-display text-white"
            style={{
              maxWidth: "654px",
              fontSize: "var(--fs-h2)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "clamp(48px, 6vw, 84px)",
            }}
          >
            <span className="cs-text-gradient-impact">Outcomes</span> That Matter
          </h2>
        </Reveal>

        {/* Desktop — inline figures separated by vertical dividers. */}
        <div className="hidden lg:flex lg:items-start lg:justify-between lg:gap-6">
          {STATS.map((stat, i) => (
            <Fragment key={stat.value}>
              <StatBlock stat={stat} />
              {i < STATS.length - 1 && <VerticalDivider />}
            </Fragment>
          ))}
        </div>

        {/* Mobile / tablet — centered vertical stack. */}
        <div className="flex flex-col items-center gap-6 lg:hidden">
          {STATS.map((stat, i) => (
            <Fragment key={stat.value}>
              <StatBlock stat={stat} mobile />
              {i < STATS.length - 1 && <HorizontalDivider />}
            </Fragment>
          ))}
        </div>
      </Container>
    </section>
  );
}

function StatBlock({ stat, mobile = false }: { stat: Stat; mobile?: boolean }): React.ReactElement {
  return (
    <div className={`flex shrink-0 flex-col ${mobile ? "items-center text-center" : ""}`}>
      <div
        className="font-display text-white"
        style={{
          whiteSpace: "nowrap",
          fontSize: mobile ? "var(--fs-h3)" : "32px",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.04em",
        }}
      >
        {stat.value}
      </div>
      <div
        className="mt-5 max-w-[180px] text-white"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: mobile ? "var(--fs-lead)" : "20px",
          fontWeight: 400,
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {stat.label}
      </div>
    </div>
  );
}

function VerticalDivider(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="h-[109px] w-px shrink-0 self-stretch"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 49.3%, rgba(153,153,153,0) 99.2%)",
      }}
    />
  );
}

function HorizontalDivider(): React.ReactElement {
  return (
    <div
      aria-hidden
      className="h-px w-[147px] shrink-0"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0) 0%, #FFFFFF 49.32%, rgba(153,153,153,0) 99.18%)",
      }}
    />
  );
}
