"use client";

import type React from "react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";

/**
 * "Chosen by Engineering Leaders" testimonial carousel.
 *
 * Interactions: prev/next buttons, arrow keys, touch swipe, drag-to-rotate,
 * and auto-advance (7s, pauses on hover/focus/tab-hidden/reduced motion).
 * Under reduced motion: no auto-advance, no float, transitions cap at 80ms.
 */

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  /** Optional logo asset (same files served from BrandMarquee). When
   *  provided, `CompanyMark` renders the wordmark image instead of the
   *  text-only orb placeholder. */
  logoSrc?: string;
  /** Optional headshot. Falls back to the shared placeholder when omitted. */
  photoSrc?: string;
  quote: string;
  caseStudyHref?: string;
}

const TESTIMONIAL_PHOTO = "/images/testimonial-photo.webp";

export const HOME_TESTIMONIALS: Testimonial[] = [
  {
    name: "Mathan Babu K",
    role: "CTSO & DPO, Vodafone Idea",
    company: "Vodafone Idea",
    logoSrc: "/images/trusted/10-vi.webp",
    photoSrc: "/images/testimonials/mathan-babu-k.webp",
    quote:
      "Containers and microservices now sit at the heart of modern application delivery and the broader supply chain ecosystem. CleanStart's shift-left security approach couldn't have arrived at a more critical time.",
  },
  {
    name: "Shanker Ramrakhiani",
    role: "CISO & Head of BCP, IIFL Finance",
    company: "IIFL Finance",
    logoSrc: "/images/trusted/03-iifl-finance.webp",
    photoSrc: "/images/testimonials/shanker-ramrakhiani.webp",
    quote:
      "CleanStart helped us standardize our container foundations without slowing development. Tasks that previously required significant manual effort are now eliminated, deployments are faster, and our security team has greater confidence in the images we use.",
    caseStudyHref: "https://cdn.cleanstart.com/case-studies/iifl-case-study.pdf",
  },
  {
    name: "Mr. Moinul Khan",
    role: "CEO, Aurascape",
    company: "Aurascape",
    logoSrc: "/images/trusted/08-aurascape.webp",
    photoSrc: "/images/testimonials/moinul-khan.webp",
    quote:
      "Standardizing on verified container foundations gave us confidence in the base of every service we deploy and allowed us to shift security much earlier in the build process.",
    caseStudyHref: "https://cdn.cleanstart.com/case-studies/aurascape-case-study.pdf",
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

export interface TestimonialsProps {
  /** Override the testimonial list. Defaults to the home-page testimonials. */
  testimonials?: Testimonial[];
  /** Optional override for the section heading (JSX). */
  heading?: React.ReactNode;
  /** Optional override for the supporting description copy. */
  description?: React.ReactNode;
  /** Hide the heading + description header row entirely. */
  hideHeader?: boolean;
  /**
   * Extend the section's bottom padding so the carousel's prev/next arrows
   * stay clear of an overlapping Footer CTA card on the next sibling. Set on
   * pages whose `<Footer>` receives a `cta` prop (e.g. /community).
   */
  reserveFooterCtaSpace?: boolean;
}

export function Testimonials({
  testimonials,
  heading,
  description,
  hideHeader = false,
  reserveFooterCtaSpace = false,
}: TestimonialsProps = {}) {
  const TESTIMONIALS = testimonials ?? HOME_TESTIMONIALS;
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<Direction>("next");
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Drag-to-rotate state. Any card (active OR peek) can be grabbed on
  // desktop; the carousel scrubs the same circular motion it uses for
  // auto-advance. `dir` is locked at pointerdown for peeks (left peek =>
  // prev, right peek => next) and on first movement >4 px for the active
  // card (rightward => prev, leftward => next). `dx` is signed in the
  // dir's direction (always positive for a peek-toward-centre drag, and
  // matching the swipe direction for active).
  const [dragInfo, setDragInfo] = useState<
    { dir: "prev" | "next"; dx: number } | null
  >(null);

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

  // Instagram-Reels-style hold-to-pause: pressing and holding pauses
  // auto-advance for as long as the finger is down; releasing resumes.
  // A horizontal drag > 40 px still navigates prev/next on release.
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
  const onTouchCancel = () => {
    touchStartX.current = null;
    setPaused(false);
  };

  // Drag-to-rotate.
  //
  // Design notes:
  // • We use *window*-level pointermove / pointerup listeners (not native
  //   listeners on the card) so a fast drag that overshoots the card's
  //   bounds never loses a frame.
  // • The pointer is captured on pointerdown so subsequent clicks still
  //   route to the article — we use that capture path to suppress the
  //   trailing click event that would otherwise re-fire goPrev/goNext.
  // • A 4 px dead-zone keeps incidental jitter from launching a drag, and
  //   active-card direction stays unlocked until the user actually moves —
  //   so dragging right then back through zero re-locks to "next".
  //
  // Commit at ~50% of the peek distance. The CSS peek distance is
  // clamp(280px, 28vw, 380px); 140 sits at the lower bound's halfway.
  const DRAG_COMMIT_PX = 140;
  // dragRef holds the *live* drag state (mutated on every move) so the
  // window listeners don't see stale React closures. dragInfo (state) is
  // what the DOM reads via data-* + CSS variables.
  const dragRef = useRef<{
    startX: number;
    originPos: -1 | 0 | 1;
    pointerId: number;
    dir: "prev" | "next" | null;
    hasMoved: boolean;
  } | null>(null);
  // Set to true on a drag that moved past the dead-zone; the next click
  // event is then swallowed so peek onClick doesn't double-fire goPrev/Next.
  const suppressNextClickRef = useRef(false);

  const onCardDragStart = useCallback(
    (
      originPos: -1 | 0 | 1,
      startClientX: number,
      target: HTMLElement,
      pointerId: number,
    ) => {
      // Always capture so the trailing click still routes here (we can
      // then swallow it via suppressNextClickRef).
      try {
        target.setPointerCapture(pointerId);
      } catch {
        // throws if the pointer is no longer active — safe to ignore.
      }
      dragRef.current = {
        startX: startClientX,
        originPos,
        pointerId,
        // Peeks lock direction at down; active waits for first 4 px move.
        dir: originPos === -1 ? "prev" : originPos === 1 ? "next" : null,
        hasMoved: false,
      };
      setPaused(true);
      if (dragRef.current.dir) setDragInfo({ dir: dragRef.current.dir, dx: 0 });

      const onMove = (e: PointerEvent) => {
        const ref = dragRef.current;
        if (!ref || e.pointerId !== ref.pointerId) return;
        const raw = e.clientX - ref.startX;
        // Active card: lock direction only once the user clears the dead
        // zone; below the dead zone keep dir null so the next sustained
        // direction wins.
        if (ref.originPos === 0) {
          if (Math.abs(raw) < 4) {
            // In the dead zone — no visual update, also reset dir so the
            // user can effectively pick a new direction by passing through.
            if (ref.dir) {
              ref.dir = null;
              setDragInfo(null);
            }
            return;
          }
          const newDir: "prev" | "next" = raw > 0 ? "prev" : "next";
          if (ref.dir !== newDir) ref.dir = newDir;
        }
        ref.hasMoved = Math.abs(raw) >= 4;
        const dir = ref.dir;
        if (!dir) return;
        const dx = dir === "prev" ? Math.max(0, raw) : Math.min(0, raw);
        setDragInfo({ dir, dx });
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onUp = (e: PointerEvent) => {
        const ref = dragRef.current;
        if (!ref || e.pointerId !== ref.pointerId) return;
        cleanup();
        const raw = e.clientX - ref.startX;
        const dir = ref.dir;
        const hasMoved = ref.hasMoved;
        dragRef.current = null;
        setDragInfo(null);
        setPaused(false);
        if (hasMoved) suppressNextClickRef.current = true;
        if (dir && hasMoved && Math.abs(raw) >= DRAG_COMMIT_PX) {
          if (dir === "prev") goPrev();
          else goNext();
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [goPrev, goNext],
  );

  // Wraps a card's onClick so a click that fires immediately after a
  // committed drag is swallowed (prevents goPrev/Next from running twice).
  const wrapClick = useCallback((cb: (() => void) | undefined) => {
    if (!cb) return undefined;
    return () => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false;
        return;
      }
      cb();
    };
  }, []);


  return (
    <section
      className="relative w-full overflow-hidden text-white"
      aria-labelledby="testimonials-title"
      style={{
        background:
          "linear-gradient(180deg, #151021 0%, #131E8F 62.5%, #471EC0 100%)",
      }}
    >
      <div
        className={`relative z-[2] mx-auto w-full max-w-[var(--container-default)] px-6 sm:px-10 ${reserveFooterCtaSpace ? "pt-section-sm pb-[var(--spacing-section-cta)]" : "py-section-sm"}`}
      >
        {!hideHeader && (
        <header className="flex flex-col items-start gap-6 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-12">
          <Reveal header className="justify-self-start" style={{ maxWidth: "560px" }}>
            <h2
              id="testimonials-title"
              className="font-display text-white"
              style={{
                fontSize: "var(--fs-h2)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
              }}
            >
              {heading ?? (
                <>
                  Chosen by{" "}
                  <span className="cs-text-gradient-impact">
                    Industry Leaders
                  </span>
                </>
              )}
            </h2>
          </Reveal>
          {description && (
            <>
              <div
                aria-hidden
                className="hidden h-[90px] w-px shrink-0 justify-self-center md:block"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.35) 47.2%, rgba(255,255,255,0) 100%)",
                }}
              />
              <Reveal
                header
                delay={0.15}
                y={20}
                className="md:justify-self-end"
                style={{ maxWidth: "604px" }}
              >
                <p
                  className="text-white md:text-right"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--fs-lead)",
                    fontWeight: 400,
                    lineHeight: 1.4,
                    letterSpacing: "-0.02em",
                    opacity: 0.8,
                  }}
                >
                  {description}
                </p>
              </Reveal>
            </>
          )}
        </header>
        )}

        <section
          ref={carouselRef}
          className="cs-tt-carousel relative mt-10 outline-none sm:mt-12"
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
          onKeyDown={onKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            Showing testimonial {active + 1} of {total} from{" "}
            {TESTIMONIALS[active]?.name}, {TESTIMONIALS[active]?.role}.
          </div>

          {/* Each testimonial keeps a stable React element across renders
              (keyed by name); its position (data-pos: -1 | 0 | 1) drives CSS
              transitions on transform, size, opacity, and inner font sizes so
              a card moving between a peek slot and centre visibly travels and
              grows. The card that wraps around the stage (only possible with
              N=3) is marked data-wrap and fades through 0 to mask its teleport. */}
          <div
            className="cs-tt-stage"
            data-direction={direction}
            data-dragging={dragInfo ? dragInfo.dir : undefined}
            style={
              dragInfo
                ? ({
                    ["--cs-tt-drag-dx" as never]: `${dragInfo.dx}px`,
                  } as React.CSSProperties)
                : undefined
            }
          >
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
                  onClick={wrapClick(
                    pos === -1 ? goPrev : pos === 1 ? goNext : undefined,
                  )}
                  onCardDragStart={onCardDragStart}
                />
              );
            })}
          </div>

          {/* Auto-rotation progress bar — shows how long until the next slide. */}
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

// Reused for every visible testimonial: the same DOM element persists across
// renders (keyed by name in the parent), and data-pos drives the size +
// position transitions so cards visibly travel between peek and centre slots.
function MorphCard({
  testimonial,
  pos,
  wrap,
  onClick,
  onCardDragStart,
}: {
  testimonial: Testimonial;
  pos: number;
  wrap: boolean;
  onClick: (() => void) | undefined;
  onCardDragStart: (
    originPos: -1 | 0 | 1,
    startClientX: number,
    target: HTMLElement,
    pointerId: number,
  ) => void;
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
      onPointerDown={(e) => {
        // Desktop-only: peeks only exist at ≥ 1024 px, and the touch-swipe
        // handler on the carousel section already covers mobile / tablet.
        // Bail for non-mouse pointers and below the desktop breakpoint so
        // we don't fight the touch handlers (or, on touchscreen laptops,
        // hijack a finger that the user meant to scroll the page with).
        if (e.pointerType !== "mouse") return;
        if (window.innerWidth < 1024) return;
        if (e.button !== 0) return;
        // Don't hijack interactive descendants (CTA link, future buttons).
        if ((e.target as HTMLElement).closest("a, button")) return;
        e.preventDefault();
        onCardDragStart(
          pos as -1 | 0 | 1,
          e.clientX,
          e.currentTarget as HTMLElement,
          e.pointerId,
        );
      }}
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
          src={testimonial.photoSrc ?? TESTIMONIAL_PHOTO}
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

        {testimonial.caseStudyHref && isActive ? (
          <a
            href={testimonial.caseStudyHref}
            className="cs-tt-card__cta"
            target="_blank"
            rel="noopener noreferrer"
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
        ) : (
          // Empty spacer preserves the body's three-child layout
          // (head / quote / cta) so the quote stays vertically positioned
          // identically across cards regardless of CTA presence.
          // Peek cards (!isActive) intentionally omit the <a> to avoid
          // nesting an interactive link inside the role="button" article
          // (axe-core nested-interactive violation; the whole card is
          // clickable to activate it).
          <span aria-hidden className="cs-tt-card__cta-spacer" />
        )}
      </div>
    </article>
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

// Renders the real wordmark image when `logoSrc` is supplied; falls back to
// the gradient-orb + text placeholder for testimonials without a logo file.
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
      <Image
        src={logoSrc}
        alt={company}
        width={maxW}
        height={h}
        sizes="110px"
        style={{
          height: h,
          maxWidth: maxW,
          width: "auto",
          objectFit: "contain",
          opacity: 1,
        }}
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
