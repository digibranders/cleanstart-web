// Client-safe podcast helpers extracted from `lib/podcast.ts` so
// client components (e.g. YouTubeEmbed) don't transitively pull
// `next/headers` via the draft-mode-aware `cms-fetch`.

import type { PodcastEpisode } from "./podcast";

// Hero title / brand name for the /podcast page. Lives here (client-safe) so the
// hero section, page metadata, and JSON-LD all read one source.
export const PODCAST_TITLE = "Leadership Exchange";

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const YT_PATTERNS: RegExp[] = [
  /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/,
];

export const extractYoutubeId = (
  raw: string | null | undefined,
): string | null => {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (value.length === 0) return null;
  if (YT_ID_RE.test(value)) return value;
  for (const re of YT_PATTERNS) {
    const match = re.exec(value);
    if (match?.[1]) return match[1];
  }
  return null;
};

export const youtubeThumbnail = (
  videoId: string,
  quality:
    | "default"
    | "mqdefault"
    | "hqdefault"
    | "sddefault"
    | "maxresdefault" = "maxresdefault",
): string => `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;

export const youtubeWatchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const youtubeEmbedUrl = (
  videoId: string,
  { autoplay = true }: { autoplay?: boolean } = {},
): string => {
  const qs = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${qs.toString()}`;
};

export const formatEpisodeNumber = (n: number): string => `Episode ${n}`;

export const resolveVideoId = (
  episode: Pick<PodcastEpisode, "youtubeUrl" | "youtubeVideoId">,
): string | null => episode.youtubeVideoId ?? extractYoutubeId(episode.youtubeUrl);

export const isHydratedEpisode = (
  value: PodcastEpisode | string | number | null | undefined,
): value is PodcastEpisode =>
  typeof value === "object" && value !== null && "youtubeUrl" in value;
