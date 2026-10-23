"use client";

import Link from "next/link";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { useWatchedVideos } from "@/lib/use-watched-videos";
import {
  formatPublished,
  videoCategoryLabel,
  videoPath,
  type Video,
} from "@/lib/videos-utils";
import { PlayGlyph } from "./PlayGlyph";
import { VideoThumb } from "./VideoThumb";

interface VideoCardProps {
  video: Video;
  /** Mark the poster as high priority when the card is in the first row. */
  priority?: boolean;
}

const CARD_SIZES = "(min-width: 1280px) 384px, (min-width: 768px) 33vw, 100vw";

export function VideoCard({ video, priority = false }: VideoCardProps): React.ReactElement {
  const { watched } = useWatchedVideos();
  const isWatched = watched.has(video.id);

  return (
    <Link
      href={videoPath(video.slug)}
      className="group block rounded-[16px] focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-[#5B2EE0]"
    >
      <div
        className="relative aspect-video overflow-hidden rounded-[16px] bg-[#E9E6F5] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0"
        style={{ boxShadow: "0 1px 0 rgba(18,16,28,0.04), 0 12px 32px rgba(40,24,120,0.10)" }}
      >
        <VideoThumb video={video} sizes={CARD_SIZES} priority={priority} />
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-[rgba(10,8,24,0.22)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
        >
          <span className="flex size-14 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-[10px]">
            <PlayGlyph size={24} />
          </span>
        </span>
        {isWatched ? (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[rgba(10,8,24,0.82)] px-2.5 py-1 text-[12px] font-medium text-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Watched
          </span>
        ) : null}
        {video.durationSeconds !== undefined ? (
          <span className="absolute bottom-2.5 right-2.5 rounded-md bg-[rgba(10,8,24,0.82)] px-2 py-[3px] text-[12px] font-medium tabular-nums text-white">
            {formatDurationLabel(video.durationSeconds)}
          </span>
        ) : null}
      </div>
      <div
        className="mt-4 flex gap-3 font-sans text-[#5B5870]"
        style={{ fontSize: "var(--fs-caption)" }}
      >
        <span className="font-medium text-[#5B2EE0]">{videoCategoryLabel(video)}</span>
        <span>{formatPublished(video.publishedAt)}</span>
      </div>
      <h3
        className="mt-1.5 font-display font-semibold text-[#12101C] transition-colors duration-200 group-hover:text-[#5B2EE0]"
        style={{ fontSize: "var(--fs-h5)", lineHeight: 1.35, letterSpacing: "-0.01em" }}
      >
        {video.title}
      </h3>
    </Link>
  );
}
