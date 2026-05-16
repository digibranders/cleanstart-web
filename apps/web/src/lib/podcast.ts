import { cache } from "react";

export type PodcastMediaImage = {
  url?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type PodcastEpisode = {
  id: string | number;
  title: string;
  slug: string;
  episodeNumber: number;
  youtubeUrl: string;
  youtubeVideoId?: string | null;
  thumbnailOverride?: PodcastMediaImage | null;
  abstract?: string | null;
  featured?: boolean | null;
  durationSeconds?: number | null;
  publicationDate?: string | null;
};

export type PodcastCtaCard = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export type PodcastPage = {
  heroEyebrow?: string | null;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle?: string | null;
  featuredHeroEpisode: PodcastEpisode | string | number | null;
  latestEpisodesTitle?: string | null;
  latestEpisodesLimit?: number | null;
  featuredSectionTitle?: string | null;
  featuredSectionHighlight?: string | null;
  ctaCards?: PodcastCtaCard[] | null;
};

type PayloadListResponse<T> = {
  docs: T[];
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
  page: number;
  totalPages: number;
};

export type PodcastListResponse = PayloadListResponse<PodcastEpisode>;

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

async function fetchCMS<T>(path: string): Promise<T> {
  const res = await fetch(`${CMS_URL}${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`CMS fetch failed: ${res.status} ${path}`);
  }
  return res.json() as Promise<T>;
}

export const getPodcastPage = cache(async (): Promise<PodcastPage | null> => {
  try {
    return await fetchCMS<PodcastPage>("/api/globals/podcastPage?depth=2");
  } catch {
    return null;
  }
});

export async function getPodcastEpisodes({
  limit = 6,
  page = 1,
}: {
  limit?: number;
  page?: number;
} = {}): Promise<PodcastListResponse> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    depth: "1",
    limit: String(limit),
    page: String(page),
    sort: "-publicationDate",
  });
  return fetchCMS<PodcastListResponse>(
    `/api/podcastEpisodes?${params.toString()}`,
  );
}

export async function getFeaturedPodcastEpisodes(
  limit = 2,
): Promise<PodcastEpisode[]> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[featured][equals]": "true",
    depth: "1",
    limit: String(limit),
    sort: "-publicationDate",
  });
  const data = await fetchCMS<PodcastListResponse>(
    `/api/podcastEpisodes?${params.toString()}`,
  );
  return data.docs;
}

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
  value: PodcastPage["featuredHeroEpisode"],
): value is PodcastEpisode =>
  typeof value === "object" && value !== null && "youtubeUrl" in value;
