"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  CLEAN_LIBRARIES_VIDEO as VIDEO,
  formatDurationLabel,
} from "@/lib/clean-libraries-video";
import { youtubeEmbedUrl } from "@/lib/podcast-utils";

/**
 * The Clean Libraries hero video, opened out of the dependency graph's glass core
 * cube (see LibrariesHeroScene).
 *
 * Deliberately chrome-less: no border, no panel fill, no title or caption rails.
 * The video's own artwork is a violet gradient a few degrees off the hero's, so
 * any frame around it read as a box sitting ON the hero rather than part of it.
 * All that is left is a rounded clip, a soft violet bloom so it sits in the same
 * light as the core cube, and a floating close control.
 *
 * Playback: the iframe mounts with `autoplay=1` the moment the hero CTA is
 * pressed, so one press opens AND plays. But unmuted autoplay is discretionary —
 * browsers grant it on accumulated media engagement, so a first-time visitor is
 * usually refused, and a refused autoplay leaves YouTube painting its own idle
 * chrome (title bar, red button, "Watch on YouTube") — heavier than the frame
 * this component deliberately does without. So the brand poster stays layered
 * ON TOP of the iframe until the player reports it is actually PLAYING, via the
 * IFrame API's postMessage channel. Autoplay succeeds → the poster lifts on its
 * own and nothing is ever seen but the video. Autoplay is refused → the poster
 * simply stays, and its play control drives `playVideo` directly, which counts as
 * a user gesture and plays with sound.
 *
 * Cost: an untouched hero loads no poster bytes and no YouTube JS — the poster
 * mounts on CTA intent (hover/focus) and the iframe only while open. Closing
 * unmounts the iframe, which is what stops playback rather than hiding a still
 * playing one.
 */

const YT_ORIGIN = "https://www.youtube-nocookie.com";
/** YT.PlayerState.PLAYING */
const STATE_PLAYING = 1;

interface LibrariesHeroVideoProps {
  open: boolean;
  /** Mount the poster — set on CTA intent so it is decoded before the click. */
  showPoster: boolean;
  onClose: () => void;
  /** Element id the hero's toggle points at via `aria-controls`. */
  id: string;
}

export function LibrariesHeroVideo({
  open,
  showPoster,
  onClose,
  id,
}: LibrariesHeroVideoProps): React.ReactElement {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  const post = useCallback((message: Record<string, unknown>): void => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify(message),
      YT_ORIGIN,
    );
  }, []);

  // Reopening should show the poster again; closing unmounts the iframe, so the
  // confirmed-playing flag has to reset with it.
  useEffect(() => {
    if (!open) setPlaying(false);
  }, [open]);

  // Subscribe to the player's state events. The handshake has to be repeated
  // until the player answers: there is no load event we can trust for "the
  // widget is listening", and posting before it is ready is silently dropped.
  useEffect(() => {
    if (!open) return;

    const onMessage = (event: MessageEvent): void => {
      if (event.origin !== YT_ORIGIN) return;
      if (typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data) as {
          event?: string;
          info?: unknown;
        };
        const state =
          typeof data.info === "number"
            ? data.info
            : typeof data.info === "object" && data.info !== null
              ? (data.info as { playerState?: unknown }).playerState
              : undefined;
        if (state === STATE_PLAYING) setPlaying(true);
      } catch {
        // Not our JSON — the embed also emits non-JSON chatter.
      }
    };

    window.addEventListener("message", onMessage);
    const handshake = window.setInterval(
      () => post({ event: "listening", id, channel: "widget" }),
      250,
    );
    const stopHandshake = window.setTimeout(
      () => window.clearInterval(handshake),
      8000,
    );

    return () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(handshake);
      window.clearTimeout(stopHandshake);
    };
  }, [open, id, post]);

  // PAUSE (not stop) once the hero has scrolled up behind the header.
  //
  // The video is narrated, so audio continuing from a hero the visitor can no
  // longer see leaves them hunting for a control that is off-screen — and the
  // only way back to it is to scroll up. Pausing keeps the playhead, so scrolling
  // back resumes from where they left off rather than restarting.
  //
  // Deliberately no auto-resume on scroll-back: re-starting narration without a
  // press is precisely the surprise this is meant to prevent. `playing` stays
  // true through a pause — it means "the poster has lifted", not "frames are
  // advancing" — so the observer stays armed if they resume and scroll away again.
  useEffect(() => {
    if (!open || !playing) return;
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
            post({ event: "command", func: "pauseVideo", args: [] });
          }
        }
      },
      // Top inset keeps the sticky header from counting as visible area, so the
      // pause fires as the video slides under the navbar rather than after it.
      { threshold: [0, 0.35, 1], rootMargin: "-80px 0px 0px 0px" },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open, playing, post]);

  const play = useCallback((): void => {
    post({ event: "command", func: "playVideo", args: [] });
    // Optimistic: if the API channel never came up, `playVideo` is a no-op, and
    // lifting the poster at least hands the visitor YouTube's own control rather
    // than trapping them behind a dead one.
    setPlaying(true);
  }, [post]);

  const src = open
    ? `${youtubeEmbedUrl(VIDEO.videoId, { autoplay: true })}&enablejsapi=1${
        typeof window === "undefined"
          ? ""
          : `&origin=${encodeURIComponent(window.location.origin)}`
      }`
    : undefined;

  return (
    <section
      id={id}
      aria-label={VIDEO.title}
      data-open={open}
      inert={!open}
      className="cs-libvideo-card relative flex w-full flex-col justify-center md:absolute md:inset-0"
    >
      <div
        ref={frameRef}
        className="cs-libvideo-frame relative aspect-video w-full overflow-hidden"
      >
        {open && src ? (
          <iframe
            ref={iframeRef}
            src={src}
            title={VIDEO.title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : null}

        {/* Sits ON TOP of the iframe until playback is confirmed, so a refused
            autoplay never exposes YouTube's idle chrome. */}
        {playing ? null : (
          <button
            type="button"
            onClick={play}
            className="cs-libvideo-play group absolute inset-0 z-[3] h-full w-full cursor-pointer"
            aria-label={`Play ${VIDEO.title} (${formatDurationLabel(VIDEO.durationSeconds)})`}
          >
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
            <span
              aria-hidden
              className="cs-libvideo-play-badge absolute left-1/2 top-1/2 flex items-center justify-center rounded-full"
            >
              <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden>
                <path
                  d="M14.8 8.13a1.6 1.6 0 0 1 0 2.74L2.4 18.2A1.6 1.6 0 0 1 0 16.83V2.17A1.6 1.6 0 0 1 2.4.8l12.4 7.33Z"
                  fill="#ffffff"
                />
              </svg>
            </span>
          </button>
        )}

        {/* Floats over the video rather than living in a rail. Its own scrim keeps
            it legible whatever frame is playing underneath. */}
        <button
          type="button"
          onClick={onClose}
          className="cs-libvideo-close absolute right-3 top-3 z-[4] flex h-8 w-8 items-center justify-center rounded-full text-white"
          aria-label="Close video and return to the dependency graph"
        >
          <svg width="11" height="11" viewBox="0 0 10 10" aria-hidden focusable="false">
            <path
              d="M1 1l8 8M9 1l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
