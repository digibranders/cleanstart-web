"use client";

import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { useWatchedVideos } from "@/lib/use-watched-videos";
import { formatPublished, type Video } from "@/lib/videos-utils";
import { FormatTag } from "./FormatTag";
import { PlayGlyph } from "./PlayGlyph";
import { VideoThumb } from "./VideoThumb";

interface VideoCardProps {
  video: Video;
  /** This video is the one in the theatre player. */
  playing: boolean;
  onPlay: (video: Video) => void;
  onTopic: (slug: string) => void;
}

const CARD_SIZES = "(min-width: 1280px) 360px, (min-width: 640px) 45vw, 100vw";
const MAX_CHIPS = 2;

const BADGE =
  "pointer-events-none absolute rounded-md bg-[rgba(10,8,24,0.84)] px-2 py-[3px] text-[13px] font-medium text-white";

/**
 * A grid cell. The poster opens the video in the theatre player above the
 * grid, so the cell never changes size.
 */
export function VideoCard({ video, playing, onPlay, onTopic }: VideoCardProps): React.ReactElement {
  const { watched } = useWatchedVideos();
  const isWatched = watched.has(video.id);

  return (
    <li className="min-w-0">
      <div
        className={`relative aspect-video overflow-hidden rounded-[16px] bg-black shadow-[0_12px_32px_rgba(40,24,120,0.10)] ring-2 transition-shadow duration-200 motion-reduce:transition-none ${
          playing ? "ring-[#5B2EE0]" : "ring-transparent"
        }`}
      >
        <button
          type="button"
          onClick={() => onPlay(video)}
          aria-label={`Play ${video.title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          <VideoThumb video={video} sizes={CARD_SIZES} />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(8,6,20,0) 45%, rgba(8,6,20,0.45) 100%)" }}
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-[10px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none"
          >
            <PlayGlyph size={20} />
          </span>
        </button>
        {playing ? (
          <span className={`${BADGE} left-2.5 top-2.5 bg-[#5B2EE0]`}>Now playing</span>
        ) : isWatched ? (
          <span className={`${BADGE} left-2.5 top-2.5 inline-flex items-center gap-1`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Watched
          </span>
        ) : null}
        {video.durationSeconds !== undefined ? (
          <span className={`${BADGE} bottom-2.5 right-2.5 tabular-nums`}>
            {formatDurationLabel(video.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <FormatTag video={video} />
        <time
          dateTime={video.publishedAt}
          className="font-sans text-[#5B5870]"
          style={{ fontSize: "var(--fs-caption)" }}
        >
          {formatPublished(video.publishedAt)}
        </time>
      </div>
      <h3
        className="mt-2 font-display font-semibold text-[#12101C]"
        style={{ fontSize: "var(--fs-h5)", lineHeight: 1.35, letterSpacing: "-0.01em" }}
      >
        {video.title}
      </h3>
      {video.summary ? (
        <p
          className="mt-2 line-clamp-2 font-sans text-[#5B5870]"
          style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.5 }}
        >
          {video.summary}
        </p>
      ) : null}
      {video.topics.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {video.topics.slice(0, MAX_CHIPS).map((topic) => (
            <li key={topic.slug}>
              <button
                type="button"
                onClick={() => onTopic(topic.slug)}
                className="inline-flex h-7 cursor-pointer items-center rounded-full border border-[rgba(18,16,28,0.14)] px-2.5 font-sans text-[12px] font-medium text-[#3D3A4F] transition-colors duration-200 hover:border-[#5B2EE0] hover:text-[#5B2EE0] motion-reduce:transition-none"
              >
                {topic.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
