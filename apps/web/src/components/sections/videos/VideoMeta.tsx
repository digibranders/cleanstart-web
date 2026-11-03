import { formatDurationLabel } from "@/lib/clean-libraries-video";
import { formatPublished, videoCategoryLabel, type Video } from "@/lib/videos-utils";

interface VideoMetaProps {
  video: Pick<Video, "format" | "publishedAt" | "durationSeconds">;
  /** Colors for the dark hero; default is for white surfaces. */
  tone?: "light" | "dark";
}

export function VideoMeta({ video, tone = "light" }: VideoMetaProps): React.ReactElement {
  const dark = tone === "dark";
  return (
    <p
      className={`flex flex-wrap gap-x-3 gap-y-1 font-sans ${dark ? "text-white/75" : "text-[#5B5870]"}`}
      style={{ fontSize: "var(--fs-caption)" }}
    >
      <span className={`font-medium ${dark ? "text-[#DAB6F3]" : "text-[#5B2EE0]"}`}>
        {videoCategoryLabel(video)}
      </span>
      <time dateTime={video.publishedAt}>{formatPublished(video.publishedAt)}</time>
      {video.durationSeconds !== undefined ? (
        <span>{formatDurationLabel(video.durationSeconds)}</span>
      ) : null}
    </p>
  );
}
