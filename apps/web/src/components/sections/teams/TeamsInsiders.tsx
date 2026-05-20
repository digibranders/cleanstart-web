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
        style={{ fontSize: "40px", lineHeight: 1 }}
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
            className="font-sans font-semibold text-[#250800]"
            style={{ fontSize: "clamp(0.875rem, 1vw, 1rem)", lineHeight: "1.5" }}
          >
            {name}
          </p>
          <p
            className="font-sans font-normal text-[#250800]/70"
            style={{ fontSize: "clamp(0.75rem, 0.9vw, 0.875rem)", lineHeight: "1.5" }}
          >
            {role}
          </p>
        </div>
      </div>

      {/* Quote text */}
      <p
        className="font-display font-semibold text-[#250800]"
        style={{
          fontSize: "clamp(1rem, 1.5vw, 1.625rem)",
          lineHeight: "1.5",
          letterSpacing: "-0.02em",
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

export function TeamsInsiders() {
  const trackRef = useRef<HTMLDivElement>(null);
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
      className="relative overflow-hidden py-[120px]"
      style={{ background: "#f6f6f6" }}
    >
      {/* Decorative corner blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute hidden xl:block"
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
        className="pointer-events-none absolute hidden xl:block"
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

      <div className="relative mx-auto max-w-[1276px] px-6">
        {/* Section title */}
        <h2
          className="mb-[80px] text-center font-display font-bold text-[#111]"
          style={{
            fontSize: "clamp(2rem, 4vw, 3.875rem)",
            lineHeight: "1.0",
            letterSpacing: "-0.05em",
          }}
        >
          {"CleanStart "}
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(-8.06deg, rgb(44,193,235) 0%, rgb(154,81,255) 64%)",
            }}
          >
            Insiders
          </span>
        </h2>

        {/* Controls row */}
        <div className="mb-8 flex items-center justify-between">
          {/* Large decorative open-quote — CSS unicode, no image asset needed */}
          <span
            aria-hidden
            className="pointer-events-none select-none font-display font-bold leading-none text-[#111]/20"
            // eslint-disable-next-line no-restricted-syntax -- v3 exception: Figma-anchored fontSize inside constrained component. See RESPONSIVE-AUDIT.md §14.3.
            style={{ fontSize: "72px", lineHeight: 1 }}
          >
            &ldquo;
          </span>

          {/* Prev / Next arrows */}
          <div className="flex gap-6">
            <button
              type="button"
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              aria-label="Previous testimonial"
              className="flex size-[48px] items-center justify-center rounded-full border border-[#111]/20 bg-white transition-opacity disabled:opacity-30"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12.5 15L7.5 10L12.5 5"
                  stroke="#111"
                  strokeWidth="1.5"
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
              className="flex size-[48px] items-center justify-center rounded-full border border-[#111]/20 bg-white transition-opacity disabled:opacity-30"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7.5 5L12.5 10L7.5 15"
                  stroke="#111"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex gap-6 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} {...t} />
          ))}
        </div>
      </div>
    </section>
  );
}
