"use client";

import { useEffect, useRef, useState } from "react";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { useWatchedVideos } from "@/lib/use-watched-videos";
import { formatPublished, videoCategoryLabel, type Video } from "@/lib/videos-utils";
import { VideoPlayer } from "./VideoPlayer";

interface VideoCardProps {
  video: Video;
  /** Mark the poster as high priority when the card is in the first row. */
  priority?: boolean;
}

const CARD_SIZES = "(min-width: 1280px) 700px, (min-width: 640px) 50vw, 100vw";

/**
 * A grid cell that plays its video in place. Starting the video widens the cell
 * to two columns so the embed is easier to watch; closing it, or starting
 * another video, puts it back.
 */
export function VideoCard({ video, priority = false }: VideoCardProps): React.ReactElement {
  const { watched } = useWatchedVideos();
  const isWatched = watched.has(video.id);
  const [open, setOpen] = useState(false);
  // Changing the key remounts the player, which is how "Close" returns it to the poster.
  const [playerKey, setPlayerKey] = useState(0);
  const cell = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!open) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    cell.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [open]);

  const close = (): void => {
    setOpen(false);
    setPlayerKey((k) => k + 1);
  };

  return (
    <li ref={cell} className={open ? "sm:col-span-2" : undefined} style={{ scrollMarginTop: "calc(var(--cs-header-h) + 84px)" }}>
      <div>
        <div className="relative">
          <VideoPlayer
            key={playerKey}
            video={video}
            sizes={CARD_SIZES}
            priority={priority}
            radius="16px"
            compact
            className="shadow-[0_12px_32px_rgba(40,24,120,0.10)]"
            onPlay={() => setOpen(true)}
            onStop={() => setOpen(false)}
          />
          {!open && isWatched ? (
            <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[rgba(10,8,24,0.82)] px-2.5 py-1 text-[12px] font-medium text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Watched
            </span>
          ) : null}
          {!open && video.durationSeconds !== undefined ? (
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md bg-[rgba(10,8,24,0.82)] px-2 py-[3px] text-[12px] font-medium tabular-nums text-white">
              {formatDurationLabel(video.durationSeconds)}
            </span>
          ) : null}
        </div>

        <div
          className="mt-4 flex items-center justify-between gap-3 font-sans text-[#5B5870]"
          style={{ fontSize: "var(--fs-caption)" }}
        >
          <p className="flex gap-3">
            <span className="font-medium text-[#5B2EE0]">{videoCategoryLabel(video)}</span>
            <time dateTime={video.publishedAt}>{formatPublished(video.publishedAt)}</time>
          </p>
          {open ? (
            <button
              type="button"
              onClick={close}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(18,16,28,0.18)] bg-white px-3 font-sans text-[13px] font-medium text-[#12101C] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] motion-reduce:transition-none"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Close player
            </button>
          ) : null}
        </div>
        <h3
          className="mt-1.5 font-display font-semibold text-[#12101C]"
          style={{ fontSize: "var(--fs-h5)", lineHeight: 1.35, letterSpacing: "-0.01em" }}
        >
          {video.title}
        </h3>
        {video.summary ? (
          <p
            className="mt-2 line-clamp-3 font-sans text-[#5B5870]"
            style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.5 }}
          >
            {video.summary}
          </p>
        ) : null}
      </div>
    </li>
  );
}
