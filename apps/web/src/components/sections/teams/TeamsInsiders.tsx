"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Working at CleanStart means solving problems that matter. We build systems where security and speed reinforce each other, not compete.",
    name: "Sanket Modi",
    role: "Sr. Manager, Developer Relations",
    avatar: "/images/teams/sanket-modi.png",
  },
  {
    quote:
      "The culture here is built on trust and ownership. Every engineer ships with confidence because we invest in the tooling that lets you be sure.",
    name: "Sanket Modi",
    role: "Sr. Manager, Developer Relations",
    avatar: "/images/teams/sanket-modi.png",
  },
];

function TestimonialCard({ quote, name, role, avatar }: Testimonial) {
  return (
    <div
      className="relative shrink-0 w-[calc(50%-12px)] overflow-hidden rounded-[24px] p-12"
      style={{
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 2px 24px rgba(154,81,255,0.08)",
        minWidth: "min(696px, 100%)",
      }}
    >
      {/* Small decorative close-quote — top right */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute right-12 top-8 font-display font-bold leading-none text-[#250800]/20"
        // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
        style={{ fontSize: "var(--fs-h2)", lineHeight: 1 }}
      >
        &rdquo;
      </span>

      {/* Person row */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative shrink-0 size-[47px] overflow-hidden rounded-full">
          <Image src={avatar} alt={name} fill className="object-cover" sizes="47px" />
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

      {/* Quote text */}
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

export function TeamsInsiders() {
  const trackRef = useRef<HTMLElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  function scroll(dir: "prev" | "next") {
    const track = trackRef.current;
    if (!track) return;
    const step = track.clientWidth / 2 + 16;
    track.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 8);
    setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 8);
  }

  return (
    <section
      className="relative overflow-hidden py-section-md"
      style={{ background: "#f6f6f6" }}
    >
      {/* Decorative corner blobs */}
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
        {/* Section title */}
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

        {/* Open-quote row — standalone decorative quote mark above the
            scrollable track, top-left aligned. Arrows have moved to a
            dedicated centered row below the cards (see further down). */}
        <div className="mb-4">
          <span
            aria-hidden
            className="pointer-events-none select-none font-display font-bold leading-none text-[#111]"
            style={{ fontSize: "var(--fs-display)", lineHeight: 1 }}
          >
            &ldquo;
          </span>
        </div>

        {/* Scrollable track */}
        <section
          ref={trackRef}
          onScroll={onScroll}
          aria-label="Testimonials carousel"
          // biome-ignore lint/a11y/noNoninteractiveTabindex: scrollable region requires keyboard access per WCAG 2.1.1 (axe rule scrollable-region-focusable).
          tabIndex={0}
          className="flex gap-6 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A51FF]/40 focus-visible:ring-offset-2 rounded-[24px]"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </section>

        {/* Prev / Next arrows — centered below the carousel, black bg + white
            icons per the reference design. */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scroll("prev")}
            disabled={!canPrev}
            aria-label="Previous testimonial"
            className="flex size-[48px] items-center justify-center rounded-full bg-[#111] text-white transition-opacity hover:bg-[#222] disabled:opacity-30"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
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
