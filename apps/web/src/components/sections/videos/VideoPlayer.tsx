"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { youtubeEmbedUrl } from "@/lib/podcast-utils";
import { trackEvent } from "@/lib/analytics/track";
import { useWatchedVideos } from "@/lib/use-watched-videos";
import type { Video } from "@/lib/videos-utils";
import { PlayGlyph } from "./PlayGlyph";
import { VideoThumb } from "./VideoThumb";

// Same event name the podcast player uses, so any two players on a page
// (the hero and a card in the grid, say) never talk over each other.
const PLAY_EVENT = "cleanstart:youtube-play";

interface VideoPlayerProps {
  video: Pick<Video, "id" | "title" | "thumb">;
  sizes: string;
  /** Mark the poster as the page's LCP image. */
  priority?: boolean;
  className?: string;
  radius?: string;
  /** Smaller play button, for cards in a grid. */
  compact?: boolean;
  /** Called when the visitor starts this player. */
  onPlay?: () => void;
  /** Called when another player on the page took over and this one went back to its poster. */
  onStop?: () => void;
}

export function VideoPlayer({
  video,
  sizes,
  priority = false,
  className = "",
  radius = "20px",
  compact = false,
  onPlay,
  onStop,
}: VideoPlayerProps): React.ReactElement {
  const instanceId = useId();
  const [playing, setPlaying] = useState(false);
  const { markWatched } = useWatchedVideos();

  const announceStart = useCallback((): void => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: instanceId } }));
    markWatched(video.id);
    trackEvent("cta_click", { cta: "video_play", video_id: video.id });
  }, [instanceId, markWatched, video.id]);

  useEffect(() => {
    if (!playing) return;
    const stopWhenOtherStarts = (event: Event): void => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id === instanceId) return;
      setPlaying(false);
      onStop?.();
    };
    window.addEventListener(PLAY_EVENT, stopWhenOtherStarts);
    return () => window.removeEventListener(PLAY_EVENT, stopWhenOtherStarts);
  }, [playing, instanceId, onStop]);

  const start = (): void => {
    setPlaying(true);
    announceStart();
    onPlay?.();
  };

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-black ${className}`}
      style={{ borderRadius: radius }}
    >
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(video.id, { autoplay: true })}
          title={video.title}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={start}
          aria-label={`Play ${video.title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          <VideoThumb video={video} sizes={sizes} priority={priority} />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(8,6,20,0) 45%, rgba(8,6,20,0.45) 100%)",
            }}
          />
          <span
            aria-hidden
            className={`absolute left-1/2 top-1/2 flex ${compact ? "size-14" : "size-[76px]"} -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none`}
            style={{
              background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
              boxShadow:
                "0 10px 30px rgba(0, 91, 227, 0.45), 0 0 0 6px rgba(255,255,255,0.18)",
            }}
          >
            <PlayGlyph size={compact ? 22 : 28} />
          </span>
        </button>
      )}
    </div>
  );
}
