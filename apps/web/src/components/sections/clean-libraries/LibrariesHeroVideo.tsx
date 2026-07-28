"use client";

import Image from "next/image";

import { CLEAN_LIBRARIES_VIDEO as VIDEO } from "@/lib/clean-libraries-video";
import { youtubeEmbedUrl } from "@/lib/podcast-utils";

/**
 * The Clean Libraries hero video card — a "verification panel" that opens out of
 * the dependency graph's glass core cube (see LibrariesHeroScene).
 *
 * Geometry: on `md+` the card is absolutely positioned over the scene and fills
 * it exactly, so toggling never changes the hero's height. The two rails are
 * sized (40px + 38px) so that at the 620px column the remaining space is a true
 * 16:9 box — at narrower widths the player letterboxes itself by a few pixels
 * rather than the layout shifting. Below `md` there is no scene, so the card
 * sits in flow and the player carries its own `aspect-video`.
 *
 * Cost: the card's chrome is always mounted (CSS transitions need a stable node
 * to animate from), but the poster only mounts once the CTA signals intent and
 * the iframe only while the card is open — so an untouched hero loads no poster
 * bytes and no YouTube JS, and closing the card stops playback by unmounting the
 * iframe rather than hiding a still-playing one.
 */

interface LibrariesHeroVideoProps {
  open: boolean;
  /** Mount the poster — set on CTA intent so it is decoded before the click. */
  showPoster: boolean;
  onClose: () => void;
  /** Element id the hero's toggle points at via `aria-controls`. */
  id: string;
}

/** The scene's iso-cube glyph at rail scale — ties the frame to the core cube. */
function CubeGlyph(): React.ReactElement {
  return (
    <svg
      viewBox="-22 -2 44 48"
      width="15"
      height="16"
      aria-hidden
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      className="shrink-0"
    >
      <polygon points="0,0 20,10 0,20 -20,10" fill="#ffffff" fillOpacity={0.92} />
      <polygon points="-20,10 0,20 0,44 -20,34" fill="#b98cff" fillOpacity={0.8} />
      <polygon points="20,10 0,20 0,44 20,34" fill="#7c46e6" fillOpacity={0.8} />
      <polyline
        points="-20,10 0,0 20,10"
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.9}
        strokeWidth={1.4}
      />
    </svg>
  );
}

export function LibrariesHeroVideo({
  open,
  showPoster,
  onClose,
  id,
}: LibrariesHeroVideoProps): React.ReactElement {
  return (
    <section
      id={id}
      aria-label={VIDEO.title}
      data-open={open}
      inert={!open}
      className="cs-libvideo-card relative md:absolute md:inset-0 flex w-full flex-col overflow-hidden"
    >
      {/* Identity rail — 40px. */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        <CubeGlyph />
        <span
          className="text-white"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "-0.01em",
            opacity: 0.92,
          }}
        >
          Clean Libraries
        </span>

        <button
          type="button"
          onClick={onClose}
          className="cs-libvideo-close ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 text-white"
          aria-label="Close video and return to the dependency graph"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            aria-hidden
            focusable="false"
          >
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Player — `flex-1` on the stage so the card fills it exactly; `aspect-video`
          below `md` where the card sizes itself. */}
      <div className="relative aspect-video w-full bg-black md:aspect-auto md:min-h-0 md:flex-1">
        {showPoster ? (
          <Image
            src={VIDEO.posterPath}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 768px) 620px, 100vw"
            className="object-cover"
          />
        ) : null}
        {open ? (
          <iframe
            src={youtubeEmbedUrl(VIDEO.videoId, { autoplay: true })}
            title={VIDEO.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}
      </div>

      {/* Caption rail — 38px. Real, indexable text; the hero's subhead is thin. */}
      <div className="hidden h-[38px] shrink-0 items-center border-t border-white/10 px-3 sm:flex">
        <p
          className="truncate text-white"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "13px",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            opacity: 0.66,
            margin: 0,
          }}
        >
          How CleanStart verifies every dependency before it reaches production
        </p>
      </div>
    </section>
  );
}
