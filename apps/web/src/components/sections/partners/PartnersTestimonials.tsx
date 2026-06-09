"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * "What Our Partners Say" — a light testimonial carousel in the same layout
 * family as the home-page testimonials section, but without a photo. Each
 * slide cross-fades a centred partner endorsement (quote → name → role).
 *
 * Interactions mirror the home carousel: prev/next buttons, clickable
 * pagination, arrow keys, touch swipe, and a 8s auto-advance that pauses on
 * hover/focus, when the tab is hidden, or under prefers-reduced-motion.
 */

interface PartnerQuote {
  name: string;
  role: string;
  quote: string;
}

export const PARTNER_TESTIMONIALS: PartnerQuote[] = [
  {
    name: "Anuj Gupta",
    role: "MD, Hitachi Systems (India)",
    quote:
      "Life is all about new beginnings - a clean slate with new friends. Hitachi Systems India is proud to partner with CleanStart to bring market a revolutionary solution delivering clean, hardened, and compliant container and VM images with zero critical vulnerabilities. CleanStart is a game-changer in software supply chain security, blending compliance, security, and innovation to solve real-world customer challenges. CleanStart is manna from heaven for the software industry.",
  },
  {
    name: "Shaq Khan",
    role: "Founder & CEO, Fortfire (US)",
    quote:
      "In security, clean starts are rare but game-changing when they happen. That's why we're excited to partner with CleanStart. CleanStart™ flips the script with container and VM images that ship zero critical CVEs, fully hardened and compliance-ready. No patching marathons. No day-zero panic. Just secure infrastructure, from the jump. For modern builders, CleanStart isn't just a product — it's peace of mind baked into your pipeline. Fortfire is all-in on helping teams ship faster, safer, and smarter. CleanStart makes that possible.",
  },
  {
    name: "Kimmo Vesajoki",
    role: "CCO, NGIT (Nordic)",
    quote:
      "NGIT is proud to work with CleanStart to the Nordic marketplace. CleanStart is a groundbreaking solution that provides software developers with clean, lean, hardened, and compliant container and VM images free from critical vulnerabilities. Together we are on a mission to transform software supply chain security and help the Nordic software industry stay ahead of the game",
  },
];

const AUTO_ADVANCE_MS = 8000;

export function PartnersTestimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const total = PARTNER_TESTIMONIALS.length;

  const goPrev = useCallback(
    () => setActive((i) => (i - 1 + total) % total),
    [total],
  );
  const goNext = useCallback(() => setActive((i) => (i + 1) % total), [total]);

  // Auto-advance — paused on hover/focus, when the tab is hidden, or under
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
    setPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (startX == null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - startX;
    if (Math.abs(dx) > 40) (dx > 0 ? goPrev : goNext)();
  };

  return (
    <section
      className="relative w-full overflow-hidden"
      aria-labelledby="partners-testimonials-title"
      style={{ background: "#f6f6f6" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          left: "-200px",
          top: "-160px",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(closest-side, rgba(44,193,235,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute hidden lg:block"
        style={{
          right: "-200px",
          bottom: "-200px",
          width: "640px",
          height: "640px",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-[2] mx-auto w-full max-w-[var(--container-default)] px-6 py-section-sm sm:px-10">
        <Reveal header>
          <h2
            id="partners-testimonials-title"
            className="text-center font-display text-[#111]"
            style={{
              fontSize: "var(--fs-h2)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
            }}
          >
            {"What Our "}
            <span className="cs-text-gradient-impact">Partners</span>
            {" Say"}
          </h2>
        </Reveal>

        <section
          className="relative mx-auto mt-10 max-w-[860px] outline-none sm:mt-12"
          aria-roledescription="carousel"
          aria-label="Partner testimonials"
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
            {PARTNER_TESTIMONIALS[active]?.name},{" "}
            {PARTNER_TESTIMONIALS[active]?.role}.
          </div>

          {/* Cross-fade stack: every slide shares one grid cell so the
              container height tracks the tallest quote (no layout jump as the
              active slide changes). Only the active slide is visible. */}
          <div className="grid">
            {PARTNER_TESTIMONIALS.map((t, i) => {
              const isActive = i === active;
              return (
                <figure
                  key={t.name}
                  aria-hidden={!isActive}
                  className="flex flex-col items-center text-center transition-opacity duration-500 ease-out [grid-area:1/1]"
                  style={{
                    opacity: isActive ? 1 : 0,
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <blockquote
                    className="text-[#250800]"
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--fs-lead)",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <figcaption className="mt-8 flex flex-col items-center">
                    <span
                      className="cs-text-gradient-impact"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body)",
                        fontWeight: 600,
                        lineHeight: 1.3,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t.name}
                    </span>
                    <span
                      aria-hidden
                      className="my-2 block size-1.5 rounded-full"
                      style={{ background: "#9A51FF" }}
                    />
                    <span
                      className="text-[#250800]/70"
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: "var(--fs-body-sm)",
                        fontWeight: 400,
                        lineHeight: 1.4,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {t.role}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          {/* Auto-rotation progress bar. */}
          <div
            aria-hidden
            className="mx-auto mt-10 h-[3px] w-[280px] overflow-hidden rounded-full"
            style={{ background: "rgba(0,0,0,0.08)" }}
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

          <div className="mt-6 flex items-center justify-center gap-6">
            <NavButton
              direction="prev"
              onClick={goPrev}
              label="Previous testimonial"
            />
            <div
              role="tablist"
              aria-label="Select testimonial"
              className="flex items-center gap-2"
            >
              {PARTNER_TESTIMONIALS.map((t, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={t.name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Show testimonial from ${t.name}`}
                    onClick={() => setActive(i)}
                    className="block h-2.5 rounded-full transition-all duration-300"
                    style={{
                      width: isActive ? 28 : 10,
                      background: isActive
                        ? "linear-gradient(90deg, #33BAEC 0%, #B19CFF 100%)"
                        : "rgba(0,0,0,0.15)",
                    }}
                  />
                );
              })}
            </div>
            <NavButton
              direction="next"
              onClick={goNext}
              label="Next testimonial"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

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
      // Solid black button — reads cleaner than the glassy lavender treatment
      // on the light section bg. Keeps the home carousel's tactile micro-
      // interaction: springy lift + scale-up on hover, press-in on click
      // (matching `cs-tt-nav`'s transform timing). Glow/outline dropped so the
      // button stays clean black.
      className="flex size-10 items-center justify-center rounded-full bg-[#111] text-white transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:scale-105 hover:shadow-[0_10px_24px_-10px_rgba(17,17,17,0.55)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A51FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f6f6] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100"
    >
      <svg
        width="18"
        height="13"
        viewBox="0 0 20 14"
        fill="none"
        aria-hidden
        style={{ transform: direction === "prev" ? "scaleX(-1)" : undefined }}
      >
        <title>{direction === "prev" ? "Previous" : "Next"}</title>
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
