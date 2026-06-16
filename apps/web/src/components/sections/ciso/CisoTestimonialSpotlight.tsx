"use client";

import type React from "react";
import Image from "next/image";
import { Section, Container } from "@/components/layout";
import { Reveal } from "@/components/ui/Reveal";
import { HOME_TESTIMONIALS } from "@/components/sections/home/Testimonials";

/*
 * "Customer Validation" — a single-voice premium spotlight for the CISO page.
 *
 * Replaces the reused home testimonial carousel (which rendered the lone CISO
 * quote as a small flat card on a light band). This is a purpose-built dark
 * immersive treatment: an editorial pull-quote on a deep-space band with an
 * ambient aura, a gradient-stroked glass card, a gradient-ringed portrait, and
 * the white IIFL wordmark. The band closes on #151021 so it flows seamlessly
 * into the dark CisoMetrics section directly below.
 */

const CISO_VOICE = HOME_TESTIMONIALS.find((t) => t.role.includes("CISO"));

// The colored IIFL wordmark vanishes on a dark surface; the white wordmark
// (orange mandala + white "IIFL FINANCE") reads cleanly here.
const IIFL_WHITE_LOGO = "/images/testimonials/iifl-finance-white.webp";

export function CisoTestimonialSpotlight(): React.ReactElement | null {
  if (!CISO_VOICE) return null;
  const { name, role, quote, photoSrc, caseStudyHref } = CISO_VOICE;

  return (
    <Section
      padding="none"
      ariaLabel="Customer validation"
      className="overflow-hidden pt-section-sm text-white"
      style={{
        background: "linear-gradient(180deg, #120D1F 0%, #150F23 55%, #151021 100%)",
      }}
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
              fontWeight: 700,
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
    </Section>
  );
}
