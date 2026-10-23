"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { youtubeEmbedUrl } from "@/lib/podcast-utils";
import { trackEvent } from "@/lib/analytics/track";
import { consumeAutoplay } from "@/lib/video-autoplay";
import { useWatchedVideos } from "@/lib/use-watched-videos";
import type { Video } from "@/lib/videos-utils";
import { PlayGlyph } from "./PlayGlyph";
import { VideoThumb } from "./VideoThumb";

// Same event name the podcast player uses, so any two players on a page
// (the hero and a modal, say) never talk over each other.
const PLAY_EVENT = "cleanstart:youtube-play";

interface VideoPlayerProps {
  video: Pick<Video, "id" | "title" | "thumb">;
  sizes: string;
  /** Mark the poster as the page's LCP image. */
  priority?: boolean;
  className?: string;
  radius?: string;
  /**
   * Start playing when this page was opened by clicking a video link (see
   * `lib/video-autoplay`). A direct visit or refresh still shows the poster.
   */
  startWhenOpenedFromClick?: boolean;
}

export function VideoPlayer({
  video,
  sizes,
  priority = false,
  className = "",
  radius = "20px",
  startWhenOpenedFromClick = false,
}: VideoPlayerProps): React.ReactElement {
  const instanceId = useId();
  const [playing, setPlaying] = useState(false);
  const { markWatched } = useWatchedVideos();
  const checked = useRef(false);

  const announceStart = useCallback((): void => {
    window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: { id: instanceId } }));
    markWatched(video.id);
    trackEvent("cta_click", { cta: "video_play", video_id: video.id });
  }, [instanceId, markWatched, video.id]);

  // The flag lives in sessionStorage, which the server render cannot see, so the
  // decision happens after mount rather than in the initial state.
  useEffect(() => {
    if (!startWhenOpenedFromClick || checked.current) return;
    checked.current = true;
    if (consumeAutoplay(video.id)) {
      setPlaying(true);
      announceStart();
    }
  }, [startWhenOpenedFromClick, video.id, announceStart]);

  useEffect(() => {
    if (!playing) return;
    const stopWhenOtherStarts = (event: Event): void => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== instanceId) setPlaying(false);
    };
    window.addEventListener(PLAY_EVENT, stopWhenOtherStarts);
    return () => window.removeEventListener(PLAY_EVENT, stopWhenOtherStarts);
  }, [playing, instanceId]);

  const start = (): void => {
    setPlaying(true);
    announceStart();
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
            className="absolute left-1/2 top-1/2 flex size-[76px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none"
            style={{
              background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
              boxShadow:
                "0 10px 30px rgba(0, 91, 227, 0.45), 0 0 0 6px rgba(255,255,255,0.18)",
            }}
          >
            <PlayGlyph size={28} />
          </span>
        </button>
      )}
    </div>
  );
}
