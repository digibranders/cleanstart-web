import Link from "next/link";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { formatPublished, videoPath, type Video } from "@/lib/videos-utils";
import { VideoThumb } from "./VideoThumb";

interface UpNextProps {
  videos: readonly Video[];
  /** Inside the modal, replace the history entry so Close still returns to the library. */
  replace?: boolean;
  /** Lay the items out as a row of cards (modal) instead of a list (sidebar). */
  layout?: "list" | "row";
  headingId: string;
}

export function UpNext({
  videos,
  replace = false,
  layout = "list",
  headingId,
}: UpNextProps): React.ReactElement | null {
  if (videos.length === 0) return null;
  const row = layout === "row";
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="mb-3 font-display font-semibold text-[#12101C]"
        style={{ fontSize: "var(--fs-h5)" }}
      >
        Up next
      </h2>
      <ul className={row ? "grid gap-4 sm:grid-cols-3" : "flex flex-col gap-1"}>
        {videos.map((v) => (
          <li key={v.id}>
            <Link
              href={videoPath(v.slug)}
              replace={replace}
              className={`group rounded-[14px] focus-visible:outline-2 focus-visible:outline-[#5B2EE0] ${
                row ? "block" : "-mx-2 grid grid-cols-[148px_minmax(0,1fr)] items-start gap-3.5 p-2 hover:bg-[#F6F4FC] max-sm:grid-cols-[120px_minmax(0,1fr)]"
              }`}
            >
              <div className="relative aspect-video overflow-hidden rounded-[10px] bg-[#E9E6F5]">
                <VideoThumb video={v} sizes={row ? "(min-width: 640px) 280px, 100vw" : "148px"} />
                {v.durationSeconds !== undefined ? (
                  <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-[rgba(10,8,24,0.82)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                    {formatDurationLabel(v.durationSeconds)}
                  </span>
                ) : null}
              </div>
              <div className={row ? "mt-2.5" : "min-w-0"}>
                <p className="line-clamp-2 font-sans text-[14px] font-medium leading-[1.4] text-[#12101C] transition-colors duration-200 group-hover:text-[#5B2EE0] motion-reduce:transition-none">
                  {v.title}
                </p>
                <p className="mt-1.5 font-sans text-[12px] text-[#5B5870]">
                  {formatPublished(v.publishedAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
