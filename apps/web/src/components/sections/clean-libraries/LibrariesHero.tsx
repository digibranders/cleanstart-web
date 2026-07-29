"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { HeroReveal } from "@/components/ui/Reveal";
import { CLEAN_LIBRARIES_VIDEO as VIDEO } from "@/lib/clean-libraries-video";
import { trackEvent } from "@/lib/analytics/track";
import { LibrariesHeroScene } from "./LibrariesHeroScene";
import { LibrariesHeroVideo } from "./LibrariesHeroVideo";

/**
 * Clean Libraries hero — left headline + CTA pair, with the interconnected
 * "dependency graph" constellation on the right (a verified core cube wrapped in
 * a web of library nodes), built entirely in SVG/CSS (no raster).
 *
 * The secondary CTA opens the product video *out of* the graph's core cube: the
 * mesh recedes (`cs-libscene-dim`) and the verification panel scales up from the
 * cube's position, so the illustration becomes the stage rather than being
 * discarded. The panel overlays the scene at `md+` and shares its box, so the
 * hero's height is identical open or closed — no layout shift either way.
 *
 * This is a client component because the CTA (left column) and the panel (right
 * column) share one piece of state; the subtree was already client-hydrated via
 * HeroReveal, so the boundary costs nothing. All motion is disabled under
 * prefers-reduced-motion (see globals.css and LibrariesHeroScene).
 */

const VIDEO_PANEL_ID = "clean-libraries-hero-video";

export function LibrariesHero(): React.ReactElement {
  const [videoOpen, setVideoOpen] = useState(false);
  // Mounts the poster ahead of the click so the panel never opens onto a black
  // box while the player boots. Set on intent (hover/focus), not on load, so an
  // untouched hero still fetches nothing.
  const [posterWarm, setPosterWarm] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const warmPoster = useCallback((): void => setPosterWarm(true), []);

  // Deliberately derived from `videoOpen` rather than a set-state updater: the
  // open path has side effects (analytics), and updaters run twice in Strict Mode.
  const toggleVideo = useCallback((): void => {
    const willOpen = !videoOpen;
    setVideoOpen(willOpen);
    if (!willOpen) return;
    setPosterWarm(true);
    trackEvent("cta_click", {
      cta: "hero_watch_video",
      page: "/clean-libraries",
      video_id: VIDEO.videoId,
    });
  }, [videoOpen]);

  // Closing from the panel's own ✕ would drop focus to <body> once the panel goes
  // inert, so hand it back to the control that owns the disclosure.
  const closeVideo = useCallback((): void => {
    setVideoOpen(false);
    toggleRef.current?.focus();
  }, []);

  return (
    <section
      data-section="LibrariesHero"
      data-video-open={videoOpen}
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(179.996deg, rgb(21,16,33) 25.7%, rgb(16,18,62) 31.16%, rgb(19,30,143) 51%, rgb(71,30,192) 68.71%, rgb(71,31,195) 100%)",
      }}
    >
      {/* Purple wash behind the illustration. Brightens while the video is open
          so the panel sits in a pool of light instead of on a flat field. */}
      <div
        aria-hidden
        className="cs-libhero-wash pointer-events-none select-none absolute hidden md:block"
        style={{
          right: "-120px",
          top: "40px",
          width: "560px",
          height: "560px",
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgba(154,81,255,0.45) 0%, rgba(154,81,255,0) 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div
        className="relative mx-auto max-w-[var(--container-default)] px-6 sm:px-10"
        style={{ zIndex: 2 }}
      >
        <div
          className="flex flex-col md:flex-row items-center md:items-center gap-10 md:gap-8 lg:gap-12"
          style={{
            paddingTop:
              "calc(clamp(96px, 9.5vw, 138px) + var(--cs-header-extra))",
            paddingBottom: "clamp(72px, 8vw, 112px)",
          }}
        >
          {/* Left: heading + description + CTAs */}
          <div className="w-full md:flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6 lg:gap-8 max-w-[560px]">
            <HeroReveal y={50} duration={1.0} lcp>
              <h1
                className="text-white"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.05,
                  textWrap: "balance",
                  margin: 0,
                }}
              >
                Build Trusted Software with Verified Libraries
              </h1>
            </HeroReveal>

            <HeroReveal y={30} delay={0.2} duration={0.8}>
              <p
                className="text-white max-w-[560px]"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-lead)",
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.4,
                  opacity: 0.8,
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                Open source libraries you can trust.
              </p>
            </HeroReveal>

            <HeroReveal y={30} delay={0.35} duration={0.8}>
              <div className="cs-libhero-cta flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <Link
                  href="/book-a-demo"
                  className="cs-btn-glass"
                  style={
                    {
                      "--cs-btn-px": "18px",
                      "--cs-btn-fs": "16px",
                    } as React.CSSProperties
                  }
                >
                  <span>Request a Demo</span>
                </Link>

                <button
                  ref={toggleRef}
                  type="button"
                  onClick={toggleVideo}
                  onPointerEnter={warmPoster}
                  onFocus={warmPoster}
                  aria-expanded={videoOpen}
                  aria-controls={VIDEO_PANEL_ID}
                  aria-label={
                    videoOpen
                      ? "Back to Overview — hide the Clean Libraries product video"
                      : "See It in Action — play the Clean Libraries product video"
                  }
                  className="cs-btn-ghost"
                >
                  <span
                    aria-hidden
                    className="cs-libcta-glyph flex h-5 w-5 shrink-0 items-center justify-center rounded-full lg:h-6 lg:w-6"
                  >
                    {videoOpen ? (
                      <svg width="11" height="11" viewBox="0 0 11 11" aria-hidden>
                        <path
                          d="M1.5 1.5l8 8M9.5 1.5l-8 8"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg width="9" height="11" viewBox="0 0 9 11" aria-hidden>
                        <path
                          d="M8.2 4.63a1 1 0 0 1 0 1.74L1.5 10.2A1 1 0 0 1 0 9.33V1.67A1 1 0 0 1 1.5.8l6.7 3.83Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </span>
                  <span>{videoOpen ? "Back to Overview" : "See It in Action"}</span>
                </button>
              </div>
            </HeroReveal>
          </div>

          {/* Right: the stage. The scene sizes the box (its SVG is `h-auto w-full`,
              so the box is always 900:620) and the video panel overlays it, which
              is what keeps the hero's height constant across the toggle. Below
              `md` the scene is hidden — the cube field needs the horizontal room —
              and the panel sizes itself in flow instead, so the whole column is
              taken out of the layout while closed rather than leaving the
              parent's row gap behind as dead space. */}
          <div
            className={`relative w-full md:flex-1 justify-center md:justify-end ${
              videoOpen ? "flex" : "hidden md:flex"
            }`}
          >
            <div className="relative w-full max-w-[620px]">
              <div
                className={`cs-libhero-float cs-libscene hidden md:block${
                  videoOpen ? " cs-libscene-dim" : ""
                }`}
              >
                <LibrariesHeroScene />
              </div>

              <LibrariesHeroVideo
                id={VIDEO_PANEL_ID}
                open={videoOpen}
                showPoster={posterWarm}
                onClose={closeVideo}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
