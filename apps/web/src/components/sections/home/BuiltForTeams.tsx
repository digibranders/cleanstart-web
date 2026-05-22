"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Section: "Built for Teams That Can't Afford Uncertainty"
 * Figma Group 2085665059 (108:8437) at y=5104, 1922×1067.
 *
 * Layout (per Figma frames 108:8456 / 108:8480 / 108:8500):
 *   • Active card 798×329, centred, full opacity (z-30)
 *   • Two side cards 638.4×263.2, 56 px gutter to the active card,
 *     extending 132 px off-stage at each end (z-10, blurred + dimmed)
 *   • Nav row (108:8443): two 56×56 circles with #DAB6F3 1px ring,
 *     base lavender tint + plus-lighter top-right + bottom radial glows,
 *     20 px gap.
 *   • No pagination dots in Figma — removed.
 *
 * Interactions:
 *   • prev/next buttons + arrow keys + touch swipe + auto-advance (7 s,
 *     pauses on hover/focus/tab-hidden/reduced motion)
 *   • Subtle floating motion on the active card for life (3 px y-bob)
 *   • Cross-fade + slide animation on every change (direction-aware)
 *   • Side cards lift slightly on hover (preview affordance)
 *   • Reduced motion: no auto-advance, no float, transitions cap at 80 ms
 */

interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  caseStudyHref: string;
}

const TESTIMONIAL_PHOTO = "/images/testimonial-photo.png";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Lucas Zhang",
    role: "CISO, CFO",
    company: "eventus",
    quote:
      "Our proactive threat detection tools have transformed our response time to incidents. We now identify and neutralize threats before they escalate into costly breaches.",
    caseStudyHref: "#case-study-lucas",
  },
  {
    name: "Priya Patel",
    role: "VP of Engineering",
    company: "northwave",
    quote:
      "CleanStart's deterministic builds eliminated entire categories of supply-chain risk for our team. We deploy with confidence — no more unexplained drift between staging and production.",
    caseStudyHref: "#case-study-priya",
  },
  {
    name: "Marcus Bennett",
    role: "Head of Platform",
    company: "vertaglow",
    quote:
      "Hardened, source-built containers are now the default for every service we ship. CleanStart shaved weeks off our compliance audits and gave engineering its time back.",
    caseStudyHref: "#case-study-marcus",
  },
];

const AUTO_ADVANCE_MS = 7000;

type Direction = "next" | "prev";

export function BuiltForTeams() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = TESTIMONIALS.length;
  const goPrev = useCallback(() => {
    setDirection("prev");
    setActive((i) => (i - 1 + total) % total);
  }, [total]);
  const goNext = useCallback(() => {
    setDirection("next");
    setActive((i) => (i + 1) % total);
  }, [total]);

  // Auto-advance — paused when hovered, focused, tab hidden, or user prefers
  // reduced motion.
  useEffect(() => {
    if (paused) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = window.setInterval(goNext, AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, goNext]);

  useEffect(() => {
    const handler = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartX.current;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
    touchStartX.current = null;
  };

  const prevIndex = (active - 1 + total) % total;
  const nextIndex = (active + 1) % total;

  return (
    <section
      className="relative w-full overflow-hidden text-white"
      aria-labelledby="testimonials-title"
      style={{
        // Figma Frame 2147238429 (108:8061) — vertical gradient (top→bottom).
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
      }}
    >
      <div className="relative z-[2] mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 py-section-md">
        <header className="mx-auto max-w-[867px] text-center">
          <h2
            id="testimonials-title"
            className="font-display"
            style={{
              fontSize: "var(--text-t-display-2)",
              fontWeight: 700,
              lineHeight: "var(--text-t-display-2-lh)",
              letterSpacing: "var(--text-t-display-2-ls)",
            }}
          >
            Built for Teams That Can&rsquo;t Afford{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(101.56deg, #9A51FF 1.76%, #2CC1EB 98.78%)",
              }}
            >
              Uncertainty
            </span>
          </h2>
          <p
            className="mx-auto mt-8 font-normal text-white"
            style={{
              fontSize: "var(--text-t-subhead)",
              lineHeight: "var(--text-t-subhead-lh)",
              letterSpacing: "var(--text-t-subhead-ls)",
              opacity: 0.8,
            }}
          >
            CleanStart replaces unpredictable builds with verified, secure
            images — helping engineering teams cut response times and prevent
            breaches.
          </p>
        </header>

        <section
          ref={carouselRef}
          className="cs-tt-carousel relative mt-16 outline-none sm:mt-20"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Showing testimonial {active + 1} of {total} from{" "}
            {TESTIMONIALS[active]?.name}, {TESTIMONIALS[active]?.role}.
          </div>

          {/* Stacked-deck stage — one active card in front, two background
              peeks behind (more blur + lower opacity so they read as deck
              depth, not separate content). Side cards are clickable to
              jump to that testimonial. */}
          <div className="cs-tt-stage" data-direction={direction}>
            <SidePeek
              testimonial={TESTIMONIALS[prevIndex]!}
              position="left"
              onClick={goPrev}
              key={`l-${prevIndex}`}
            />
            <SidePeek
              testimonial={TESTIMONIALS[nextIndex]!}
              position="right"
              onClick={goNext}
              key={`r-${nextIndex}`}
            />
            <ActiveCard
              testimonial={TESTIMONIALS[active]!}
              key={`c-${active}-${direction}`}
            />
          </div>

          {/* Auto-rotation progress bar — gives users feedback that the
              carousel is rotating, and how long until the next slide. */}
          <div
            aria-hidden
            className="mx-auto mt-8 h-[3px] w-[280px] overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.10)" }}
          >
            <div
              key={`prog-${active}`}
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #33BAEC 0%, #6F8DFF 50%, #B19CFF 100%)",
                animation: paused
                  ? "none"
                  : `cs-tt-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
              }}
            />
          </div>

          {/* Controls row: prev / pagination dots / next */}
          <div className="mt-6 flex items-center justify-center gap-6">
            <NavButton direction="prev" onClick={goPrev} label="Previous testimonial" />
            <div
              role="tablist"
              aria-label="Select testimonial"
              className="flex items-center gap-2"
            >
              {TESTIMONIALS.map((t, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={t.name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Show testimonial from ${t.name}`}
                    onClick={() => {
                      setDirection(i > active ? "next" : "prev");
                      setActive(i);
                    }}
                    className="group block h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? 28 : 10,
                      background: isActive
                        ? "linear-gradient(90deg, #33BAEC 0%, #B19CFF 100%)"
                        : "rgba(255,255,255,0.25)",
                    }}
                  />
                );
              })}
            </div>
            <NavButton direction="next" onClick={goNext} label="Next testimonial" />
          </div>
        </section>
      </div>
    </section>
  );
}

// =============================================================================
// Active (centre) card — 798×329, full opacity, dominant
// =============================================================================
function ActiveCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="cs-tt-card cs-tt-card--active" data-pos="center">
      <div className="cs-tt-card__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TESTIMONIAL_PHOTO}
          alt={`${testimonial.name}, ${testimonial.role}`}
          width={160}
          height={160}
          decoding="async"
          loading="eager"
          style={{ aspectRatio: "1 / 1" }}
        />
      </div>

      <div className="cs-tt-card__body">
        <div className="cs-tt-card__head">
          <div>
            <div className="cs-tt-card__name">{testimonial.name}</div>
            <div className="cs-tt-card__role">{testimonial.role}</div>
          </div>
          <CompanyMark company={testimonial.company} />
        </div>

        {/* Decorative open quote mark — anchors the quote as the hero element */}
        <svg
          className="cs-tt-card__quote-mark"
          width="42"
          height="32"
          viewBox="0 0 42 32"
          fill="none"
          aria-hidden
        >
          <path
            d="M0 32V19.2C0 13.013 1.067 8.4 3.2 5.36 5.413 2.24 9.067.453 14.16 0v6.96c-2.747.587-4.667 1.787-5.76 3.6-1.013 1.733-1.547 4.027-1.6 6.88h6.96V32H0Zm27.04 0V19.2c0-6.187 1.067-10.8 3.2-13.84C32.453 2.24 36.107.453 41.2 0v6.96c-2.747.587-4.667 1.787-5.76 3.6-1.013 1.733-1.547 4.027-1.6 6.88h6.96V32H27.04Z"
            fill="url(#cs-tt-quote-grad)"
            opacity="0.85"
          />
          <defs>
            <linearGradient id="cs-tt-quote-grad" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#33BAEC" />
              <stop offset="1" stopColor="#B19CFF" />
            </linearGradient>
          </defs>
        </svg>

        <p className="cs-tt-card__quote">{testimonial.quote}</p>

        <a href={testimonial.caseStudyHref} className="cs-tt-card__cta">
          <span>Read Case study</span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
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
      </div>
    </article>
  );
}

// =============================================================================
// Side peek — full-content card (photo + meta + quote + CTA) sitting BEHIND
// the active card. Scaled down + dimmed/blurred so it reads as "stacked
// behind", but the content is fully recognisable as a different testimonial.
// Clickable to jump to that testimonial.
// =============================================================================
function SidePeek({
  testimonial,
  position,
  onClick,
}: {
  testimonial: Testimonial;
  position: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Show testimonial from ${testimonial.name}`}
      className="cs-tt-peek"
      data-pos={position}
      tabIndex={-1}
    >
      <span className="cs-tt-peek__photo" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TESTIMONIAL_PHOTO}
          alt=""
          width={120}
          height={120}
          decoding="async"
          loading="eager"
          style={{ aspectRatio: "1 / 1" }}
        />
      </span>
      <span className="cs-tt-peek__body" aria-hidden>
        <span className="cs-tt-peek__head">
          <span>
            <span className="cs-tt-peek__name">{testimonial.name}</span>
            <span className="cs-tt-peek__role">{testimonial.role}</span>
          </span>
          <CompanyMark company={testimonial.company} small />
        </span>
        <span className="cs-tt-peek__quote">{testimonial.quote}</span>
        <span className="cs-tt-peek__cta">
          <span>Read Case study</span>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path
              d="M4 10h12m0 0l-4-4m4 4l-4 4"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </button>
  );
}

// =============================================================================
// Nav button — 56×56 circle. Re-creates Figma node 108:8444 / 108:8448 with the
// 1.002 px lavender ring + plus-lighter top-right and bottom radial glows.
// =============================================================================
function NavButton({
  direction,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="cs-tt-nav"
      data-direction={direction}
    >
      <span className="cs-tt-nav__glow cs-tt-nav__glow--tr" aria-hidden />
      <span className="cs-tt-nav__glow cs-tt-nav__glow--bottom" aria-hidden />
      <svg
        width="20"
        height="14"
        viewBox="0 0 20 14"
        fill="none"
        aria-hidden
        className="cs-tt-nav__arrow"
      >
        <path
          d="M1 7h17m0 0l-5-5m5 5l-5 5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// =============================================================================
// Company mark — placeholder wordmark (eventus/northwave/vertaglow PNGs not
// in the project). Uses a tiny gradient orb + the name to keep visual rhythm.
// =============================================================================
function CompanyMark({
  company,
  small = false,
}: {
  company: string;
  small?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans text-white/85 ${small ? "text-body-xs" : "text-body-sm"}`}
      style={{
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{
          width: small ? 8 : 10,
          height: small ? 8 : 10,
          background:
            "radial-gradient(circle at 30% 30%, #B19CFF 0%, #6F8DFF 60%, #33BAEC 100%)",
        }}
      />
      {company}
      <span aria-hidden className="text-white/45">
        ™
      </span>
    </span>
  );
}
