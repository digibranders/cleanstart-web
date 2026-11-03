"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { formatPublished, videoCategoryLabel, videoHref, type Video } from "@/lib/videos-utils";
import { FormatTag } from "./FormatTag";
import { VideoPlayer } from "./VideoPlayer";
import { VideoThumb } from "./VideoThumb";

interface VideoTheatreProps {
  video: Video;
  /** The videos to offer next, already ranked. */
  queue: readonly Video[];
  /** Changes each time the visitor picks a video, so picking the same one again scrolls back to it. */
  focusKey: number;
  onSelect: (video: Video) => void;
  onClose: () => void;
}

/**
 * The wide player above the grid. It plays the chosen video and lists what to
 * watch next; the grid underneath never moves.
 */
export function VideoTheatre({
  video,
  queue,
  focusKey,
  onSelect,
  onClose,
}: VideoTheatreProps): React.ReactElement {
  const band = useRef<HTMLElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: focusKey is the trigger, not a value read here
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    band.current?.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" });
  }, [video.id, focusKey]);

  return (
    <section
      ref={band}
      aria-label="Video player"
      className="mb-10 rounded-[24px] border border-[rgba(18,16,28,0.1)] bg-[#F7F5FC] p-3 sm:p-5"
      style={{ scrollMarginTop: "calc(var(--cs-header-h) + 84px)" }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_288px] lg:gap-6">
        <div className="min-w-0">
          <VideoPlayer
            key={video.id}
            video={video}
            sizes="(min-width: 1280px) 700px, 100vw"
            radius="16px"
            autoPlay
            onStop={onClose}
            className="shadow-[0_16px_40px_rgba(40,24,120,0.16)]"
          />
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <FormatTag video={video} />
                <time
                  dateTime={video.publishedAt}
                  className="font-sans text-[#5B5870]"
                  style={{ fontSize: "var(--fs-caption)" }}
                >
                  {formatPublished(video.publishedAt)}
                </time>
              </p>
              <h3
                className="mt-2 font-display font-semibold text-[#12101C]"
                style={{ fontSize: "var(--fs-h4)", lineHeight: 1.3, letterSpacing: "-0.01em" }}
              >
                <Link href={videoHref(video)} prefetch={false} className="hover:text-[#5B2EE0]">
                  {video.title}
                </Link>
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(18,16,28,0.18)] bg-white px-4 font-sans text-[14px] font-medium text-[#12101C] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] motion-reduce:transition-none"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Close
            </button>
          </div>
          {video.summary ? (
            <p
              className="mt-2 max-w-[62ch] font-sans text-[#5B5870]"
              style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.55 }}
            >
              {video.summary}
            </p>
          ) : null}
        </div>

        {queue.length > 0 ? (
          <aside aria-label="Up next" className="min-w-0">
            <h4 className="mb-2 px-2 font-sans text-[13px] font-semibold text-[#5B5870]">Up next</h4>
            <ul className="flex flex-col gap-1">
              {queue.map((next) => (
                <li key={next.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(next)}
                    className="flex w-full cursor-pointer items-start gap-3 rounded-[12px] p-2 text-left transition-colors duration-200 hover:bg-white motion-reduce:transition-none"
                  >
                    <span className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded-[8px] bg-black">
                      <VideoThumb video={next} sizes="104px" />
                    </span>
                    <span className="min-w-0">
                      <span
                        className="line-clamp-2 block font-sans font-medium text-[#12101C]"
                        style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.35 }}
                      >
                        {next.title}
                      </span>
                      <span className="mt-1 block font-sans text-[12px] tabular-nums text-[#5B5870]">
                        {videoCategoryLabel(next)}
                        {next.durationSeconds !== undefined
                          ? `, ${formatDurationLabel(next.durationSeconds)}`
                          : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
