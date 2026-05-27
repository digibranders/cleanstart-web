"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  HOME_TESTIMONIALS,
  type Testimonial,
} from "@/components/sections/home/BuiltForTeams";

/**
 * Light-card "CleanStart Insiders" testimonial layout (the design used on
 * the /teams page), but populated with the home-page testimonial data
 * (`HOME_TESTIMONIALS`). Used on /community and /partners.
 */

function TestimonialCard({ name, role, photoSrc, quote }: Testimonial) {
  return (
    <div
      className="relative shrink-0 w-[calc(50%-12px)] overflow-hidden rounded-[24px] p-12"
      style={{
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 2px 24px rgba(154,81,255,0.08)",
        minWidth: "min(696px, 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none select-none absolute right-12 top-8 font-display font-bold leading-none text-[#250800]/20"
        // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
        style={{ fontSize: "var(--fs-h2)", lineHeight: 1 }}
      >
        &rdquo;
      </span>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative shrink-0 size-[47px] overflow-hidden rounded-full bg-[#eee]">
          {photoSrc ? (
            <Image
              src={photoSrc}
              alt={name}
              fill
              className="object-cover"
              sizes="47px"
            />
          ) : null}
        </div>
        <div>
          <p
            className="text-[#250800]"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 500,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
            }}
          >
            {name}
          </p>
          <p
            className="text-[#250800]/70"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--fs-body)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
            }}
          >
            {role}
          </p>
        </div>
      </div>

      <p
        className="text-[#250800]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--fs-body)",
          fontWeight: 500,
          lineHeight: 1.4,
          letterSpacing: "-0.02em",
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

export interface HomeTestimonialsInsidersProps {
  /** Add bottom padding so the prev/next arrows clear an overlapping Footer CTA card. */
  reserveFooterCtaSpace?: boolean;
}

export function HomeTestimonialsInsiders({
  reserveFooterCtaSpace = false,
}: HomeTestimonialsInsidersProps = {}) {
  const trackRef = useRef<HTMLElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  function scroll(dir: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild as HTMLElement | null;
    // Step by one full card (card width + flex gap) so the next card lands
    // flush at the track's left edge instead of showing partially.
    const gap = 24;
    const step = first ? first.offsetWidth + gap : track.clientWidth;
    const max = track.scrollWidth - track.clientWidth;
    const target = Math.max(
      0,
      Math.min(max, track.scrollLeft + (dir === "next" ? step : -step)),
    );
    track.scrollTo({ left: target });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 8);
    setCanNext(
      track.scrollLeft < track.scrollWidth - track.clientWidth - 8,
    );
  }

  return (
    <section
      className={`relative overflow-hidden pt-section-md ${reserveFooterCtaSpace ? "pb-[var(--spacing-section-cta)]" : "pb-section-md"}`}
      style={{ background: "#f6f6f6" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-270px",
          top: "-183px",
          width: "701px",
          height: "680px",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-270px",
          top: "-238px",
          width: "701px",
          height: "680px",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10">
        <h2
          className="mb-2 lg:mb-[80px] text-center font-display text-[#111]"
          style={{
            fontSize: "var(--fs-h2)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
          }}
        >
          {"CleanStart "}
          <span className="cs-text-gradient-impact">Insiders</span>
        </h2>

        <div className="mb-4">
          <span
            aria-hidden
            className="pointer-events-none select-none font-display font-bold leading-none text-[#111]"
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            style={{ fontSize: "var(--fs-display)", lineHeight: 1 }}
          >
            &ldquo;
          </span>
        </div>

        <section
          ref={trackRef}
          onScroll={onScroll}
          aria-label="Testimonials carousel"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region requires keyboard access per WCAG 2.1.1.
          tabIndex={0}
          className="flex gap-6 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A51FF]/40 focus-visible:ring-offset-2 rounded-[24px]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {HOME_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </section>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Previous testimonial"
            className="flex size-[48px] items-center justify-center rounded-full bg-[#111] text-white transition-opacity hover:bg-[#222] disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <title>Previous</title>
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="#fff"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("next")}
            disabled={!canNext}
            aria-label="Next testimonial"
            className="flex size-[48px] items-center justify-center rounded-full bg-[#111] text-white transition-opacity hover:bg-[#222] disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <title>Next</title>
              <path
                d="M7.5 5L12.5 10L7.5 15"
                stroke="#fff"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
