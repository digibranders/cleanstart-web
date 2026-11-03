"use client";

import Link from "next/link";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { videoHref, type Video } from "@/lib/videos-utils";
import { PlayGlyph } from "./PlayGlyph";
import { VideoThumb } from "./VideoThumb";

interface QuickStartsProps {
  videos: readonly Video[];
  onPlay: (video: Video) => void;
}

/** The shortest explainers, one click from playing. Sits above the grid on the unfiltered view. */
export function QuickStarts({ videos, onPlay }: QuickStartsProps): React.ReactElement {
  return (
    <section aria-labelledby="quick-starts-title" className="mb-12">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3">
        <h2
          id="quick-starts-title"
          className="font-display font-semibold text-[#12101C]"
          style={{ fontSize: "var(--fs-h5)", letterSpacing: "-0.01em" }}
        >
          Quick starts
        </h2>
        <p className="font-sans text-[#5B5870]" style={{ fontSize: "var(--fs-caption)" }}>
          Explainers under two minutes
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {videos.map((video) => (
          <li key={video.id} className="min-w-0">
            <button
              type="button"
              onClick={() => onPlay(video)}
              aria-label={`Play ${video.title}`}
              className="group block w-full cursor-pointer text-left"
            >
              <span className="relative block aspect-video overflow-hidden rounded-[12px] bg-black">
                <VideoThumb video={video} sizes="(min-width: 1280px) 220px, 45vw" />
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/45 bg-white/20 text-white backdrop-blur-[10px] transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
                >
                  <PlayGlyph size={16} />
                </span>
                {video.durationSeconds !== undefined ? (
                  <span className="absolute bottom-2 right-2 rounded-md bg-[rgba(10,8,24,0.84)] px-2 py-[2px] text-[12px] font-medium tabular-nums text-white">
                    {formatDurationLabel(video.durationSeconds)}
                  </span>
                ) : null}
              </span>
            </button>
            <Link
              href={videoHref(video)}
              prefetch={false}
              className="mt-2.5 line-clamp-2 block font-sans font-medium text-[#12101C] hover:text-[#5B2EE0]"
              style={{ fontSize: "var(--fs-body-sm)", lineHeight: 1.35 }}
            >
              {video.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
