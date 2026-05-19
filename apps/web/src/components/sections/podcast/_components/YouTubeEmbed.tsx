"use client";

import { useEffect, useId, useState } from "react";
import {
  youtubeEmbedUrl,
  youtubeThumbnail,
} from "@/lib/podcast-utils";

const PLAY_EVENT = "cleanstart:youtube-play";

type Props = {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
  className?: string;
  rounded?: string;
};

export function YouTubeEmbed({
  videoId,
  title,
  thumbnailUrl,
  className,
  rounded = "16px",
}: Props): React.ReactElement {
  const instanceId = useId();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== instanceId) {
        setPlaying(false);
      }
    };
    window.addEventListener(PLAY_EVENT, handler);
    return () => window.removeEventListener(PLAY_EVENT, handler);
  }, [playing, instanceId]);

  const startPlaying = () => {
    window.dispatchEvent(
      new CustomEvent(PLAY_EVENT, { detail: { id: instanceId } }),
    );
    setPlaying(true);
  };
  const [thumbSrc, setThumbSrc] = useState(
    thumbnailUrl ?? youtubeThumbnail(videoId, "maxresdefault"),
  );

  return (
    <div
      className={`relative w-full aspect-video bg-black ${className ?? ""}`}
      style={{ borderRadius: rounded, overflow: "hidden" }}
    >
      {playing ? (
        <iframe
          src={youtubeEmbedUrl(videoId, { autoplay: true })}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={startPlaying}
          aria-label={`Play ${title}`}
          className="group absolute inset-0 w-full h-full cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => {
              if (thumbSrc.includes("maxresdefault")) {
                setThumbSrc(youtubeThumbnail(videoId, "hqdefault"));
              }
            }}
          />
          {/* Subtle dark gradient so the play button always reads */}
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.35) 100%)",
            }}
          />
          {/* Play button overlay */}
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "9999px",
              background: "linear-gradient(180deg, #239cff 0%, #005be3 100%)",
              boxShadow:
                "0 10px 30px rgba(0, 91, 227, 0.45), 0 0 0 6px rgba(255,255,255,0.18)",
            }}
          >
            <svg
              width="26"
              height="28"
              viewBox="0 0 26 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <title>Play</title>
              <path
                d="M24.5 12.27c1.33.77 1.33 2.69 0 3.46L4 27.59C2.67 28.36 1 27.4 1 25.87V2.13C1 .6 2.67-.36 4 .41l20.5 11.86Z"
                fill="#ffffff"
              />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
