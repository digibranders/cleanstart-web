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
  /** Optional logo asset (same files served from TrustedByMarquee). When
   *  provided, `CompanyMark` renders the wordmark image instead of the
   *  text-only orb placeholder. */
  logoSrc?: string;
  quote: string;
  caseStudyHref: string;
}

const TESTIMONIAL_PHOTO = "/images/testimonial-photo.png";

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mathan Babu K",
    role: "CTSO & DPO, Vodafone Idea",
    company: "Vodafone Idea",
    logoSrc: "/images/trusted/10-vi.png",
    quote:
      "Containers and microservices now sit at the heart of modern application delivery and the broader supply chain ecosystem. CleanStart's shift-left security approach couldn't have arrived at a more critical time.",
    caseStudyHref: "#case-study-mathan",
  },
  // Placeholder slot — replace with real testimonial #2 when copy lands.
  {
    name: "Priya Patel",
    role: "VP of Engineering",
    company: "northwave",
    quote:
      "CleanStart's deterministic builds eliminated entire categories of supply-chain risk for our team. We deploy with confidence — no more unexplained drift between staging and production.",
    caseStudyHref: "#case-study-priya",
  },
  // Placeholder slot — replace with real testimonial #3 when copy lands.
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

/**
 * Signed offset from `active` for a circular index. Returns -1, 0, or +1 for
 * a 3-item carousel; values outside ±half-total wrap to the closest side so
 * adjacent cards always render on the nearer flank.
 */
function offsetFor(i: number, active: number, total: number) {
  let off = i - active;
  const half = total / 2;
  if (off > half) off -= total;
  if (off < -half) off += total;
  return off;
}

const TRANSITION_MS = 640;

export function BuiltForTeams() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const total = TESTIMONIALS.length;
  const goPrev = useCallback(() => {
    setDirection("prev");
    setActive((i) => (i - 1 + total) % total);
    setTransitioning(true);
  }, [total]);
  const goNext = useCallback(() => {
    setDirection("next");
    setActive((i) => (i + 1) % total);
    setTransitioning(true);
  }, [total]);

  // Clear the transitioning flag after the morph completes so the wrapping
  // card (which fades through 0 to mask its teleport) stops being marked.
  useEffect(() => {
    if (!transitioning) return;
    const t = window.setTimeout(() => setTransitioning(false), TRANSITION_MS + 80);
    return () => window.clearTimeout(t);
  }, [transitioning]);

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
        <header className="flex flex-col items-start gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <h2
            id="testimonials-title"
            className="justify-self-start font-display text-white"
            style={{
              maxWidth: "560px",
              fontSize: "clamp(32px, 4vw, 56px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            Built for Teams That Can&rsquo;t Afford{" "}
            <span className="cs-text-gradient-impact">Uncertainty</span>
          </h2>
          <div
            aria-hidden
            className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 47.2%, rgba(255,255,255,0) 100%)",
            }}
          />
          <p
            className="text-white md:justify-self-end md:text-right"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(18px, 1.7vw, 24px)",
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: "-0.02em",
              maxWidth: "604px",
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

          {/* Shared-element morph stage — every testimonial keeps a stable
              React element across renders (keyed by name), and its position
              (data-pos: -1 | 0 | 1) drives CSS transitions on transform,
              size, opacity, and inner font sizes. The card moving from a
              peek slot to centre visibly travels and grows. The one card
              that wraps around the stage (only possible with N=3) is marked
              data-wrap during the transition and fades through 0 to mask
              its teleport. */}
          <div className="cs-tt-stage" data-direction={direction}>
            {TESTIMONIALS.map((t, i) => {
              const pos = offsetFor(i, active, total);
              if (Math.abs(pos) > 1) return null;
              const isWrap =
                transitioning &&
                ((direction === "next" && pos === 1) ||
                  (direction === "prev" && pos === -1));
              return (
                <MorphCard
                  key={t.name}
                  testimonial={t}
                  pos={pos}
                  wrap={isWrap}
                  onClick={pos === -1 ? goPrev : pos === 1 ? goNext : undefined}
                />
              );
            })}
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
// Shared-element morph card — used for every visible testimonial. The same
// DOM element is reused across renders (keyed by name in the parent), and
// data-pos drives the size + position transitions so cards visibly travel
// between peek and centre slots.
// =============================================================================
function MorphCard({
  testimonial,
  pos,
  wrap,
  onClick,
}: {
  testimonial: Testimonial;
  pos: number;
  wrap: boolean;
  onClick: (() => void) | undefined;
}) {
  const isActive = pos === 0;
  return (
    <article
      className="cs-tt-card cs-tt-morph"
      data-pos={pos}
      data-wrap={wrap ? "true" : undefined}
      role={isActive ? undefined : "button"}
      aria-label={
        isActive ? undefined : `Show testimonial from ${testimonial.name}`
      }
      aria-current={isActive ? "true" : undefined}
      tabIndex={isActive ? undefined : -1}
      onClick={onClick}
      onKeyDown={
        isActive || !onClick
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
      }
    >
      <div className="cs-tt-card__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={TESTIMONIAL_PHOTO}
          alt={isActive ? `${testimonial.name}, ${testimonial.role}` : ""}
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
          <CompanyMark
            company={testimonial.company}
            logoSrc={testimonial.logoSrc}
          />
        </div>

        <p className="cs-tt-card__quote">
          &ldquo;{testimonial.quote}&rdquo;
        </p>

        <a
          href={testimonial.caseStudyHref}
          className="cs-tt-card__cta"
          tabIndex={isActive ? undefined : -1}
          onClick={
            isActive
              ? undefined
              : (e) => {
                  e.preventDefault();
                  onClick?.();
                }
          }
        >
          <span>Read Case study</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
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
// Company mark — renders the real wordmark image when `logoSrc` is supplied
// (uses the same grayscale-on-dark treatment as TrustedByMarquee so the logo
// reads as a subtle attribution rather than a competing brand badge). Falls
// back to the gradient-orb + text placeholder for testimonials that don't
// have a logo file yet.
// =============================================================================
function CompanyMark({
  company,
  logoSrc,
  small = false,
}: {
  company: string;
  // Accept explicit `undefined` so callers can forward the optional
  // `testimonial.logoSrc` field directly under `exactOptionalPropertyTypes`.
  logoSrc?: string | undefined;
  small?: boolean;
}) {
  if (logoSrc) {
    const h = small ? 18 : 24;
    const maxW = small ? 80 : 110;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt={company}
        height={h}
        style={{
          height: h,
          maxWidth: maxW,
          width: "auto",
          objectFit: "contain",
          opacity: 0.9,
          filter: "grayscale(1) brightness(2) contrast(1.1)",
        }}
        loading="lazy"
        decoding="async"
      />
    );
  }
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
