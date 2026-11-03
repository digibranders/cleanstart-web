import type React from "react";

import { VideoPlayer } from "@/components/sections/videos/VideoPlayer";
import { formatDurationLabel } from "@/lib/clean-libraries-video";
import type { ArticleVideoData } from "@/lib/lexical-videos";

/**
 * A library video inside an article, from a `videoEmbed` Lexical block. The
 * poster shows first and YouTube loads only on click, so the article pays
 * nothing for it until a reader plays it. The caption and figure spacing come
 * from the `.article-body` rules, the same as an inline image.
 */
export function ArticleVideo({
  video,
  caption,
}: {
  video: ArticleVideoData;
  caption?: string | undefined;
}): React.ReactElement {
  return (
    <figure className="article-figure">
      <VideoPlayer video={video} sizes="(min-width: 1024px) 680px, 100vw" radius="8px" compact />
      <figcaption>
        {caption?.trim() || video.title}
        {video.durationSeconds !== undefined ? (
          <span className="whitespace-nowrap tabular-nums"> ({formatDurationLabel(video.durationSeconds)})</span>
        ) : null}
      </figcaption>
      <noscript>
        <a href={`https://www.youtube.com/watch?v=${video.id}`}>Watch {video.title} on YouTube</a>
      </noscript>
    </figure>
  );
}
