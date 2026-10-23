"use client";

import Link from "next/link";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { requestAutoplay } from "@/lib/video-autoplay";
import { formatPublished, videoPath, type Video } from "@/lib/videos-utils";
import { VideoThumb } from "./VideoThumb";

interface UpNextProps {
  videos: readonly Video[];
  headingId: string;
}

/** The watch page's right-hand list. Clicking one opens it already playing. */
export function UpNext({ videos, headingId }: UpNextProps): React.ReactElement | null {
  if (videos.length === 0) return null;
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-3 font-display font-semibold text-[#12101C]"
        style={{ fontSize: "var(--fs-h5)" }}
      >
        Up next
      </h2>
      <ul className="flex flex-col gap-1">
        {videos.map((v) => (
          <li key={v.id}>
            <Link
              href={videoPath(v.slug)}
              onClick={() => requestAutoplay(v.id)}
              className="group -mx-2 grid grid-cols-[148px_minmax(0,1fr)] items-start gap-3 rounded-[14px] p-2 transition-colors duration-200 hover:bg-[#F6F4FC] focus-visible:outline-2 focus-visible:outline-[#5B2EE0] motion-reduce:transition-none sm:grid-cols-[168px_minmax(0,1fr)]"
            >
              <div className="relative aspect-video overflow-hidden rounded-[10px] bg-[#E9E6F5]">
                <VideoThumb video={v} sizes="168px" />
                {v.durationSeconds !== undefined ? (
                  <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-[rgba(10,8,24,0.85)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                    {formatDurationLabel(v.durationSeconds)}
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 font-sans text-[14px] font-semibold leading-[1.35] text-[#12101C] transition-colors duration-200 group-hover:text-[#5B2EE0] motion-reduce:transition-none">
                  {v.title}
                </p>
                <p className="mt-1.5 font-sans text-[12px] text-[#5B5870]">CleanStart</p>
                <p className="font-sans text-[12px] text-[#5B5870]">{formatPublished(v.publishedAt)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
