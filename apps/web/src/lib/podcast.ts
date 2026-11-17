import { fetchCMS } from "./cms-fetch";
import { resolveVideoId } from "./podcast-utils";
import { bestYoutubeThumbnail } from "./youtube-thumbnail";

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
  /** Server-resolved YouTube thumbnail, set only when no `thumbnailOverride` exists. */
  resolvedThumbnailUrl?: string | undefined;
  abstract?: string | null;
  featured?: boolean | null;
  heroEpisode?: boolean | null;
  durationSeconds?: number | null;
  publicationDate?: string | null;
};

export type PodcastCtaCard = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
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


async function withResolvedThumbnail(episode: PodcastEpisode): Promise<PodcastEpisode> {
  if (episode.thumbnailOverride?.url) return episode;
  const videoId = resolveVideoId(episode);
  if (!videoId) return episode;
  return { ...episode, resolvedThumbnailUrl: await bestYoutubeThumbnail(videoId) };
}

/**
 * The single episode flagged `heroEpisode` in the CMS (the Introduction video).
 * If several are flagged the most recent wins; callers fall back to the newest
 * episode when this returns null.
 */
export async function getHeroEpisode(): Promise<PodcastEpisode | null> {
  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[heroEpisode][equals]": "true",
    depth: "1",
    limit: "1",
    sort: "-publicationDate",
  });
  const data = await fetchCMS<PodcastListResponse>(
    `/api/podcastEpisodes?${params.toString()}`,
  );
  const episode = data.docs[0];
  return episode ? withResolvedThumbnail(episode) : null;
}

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
  const data = await fetchCMS<PodcastListResponse>(
    `/api/podcastEpisodes?${params.toString()}`,
  );
  return { ...data, docs: await Promise.all(data.docs.map(withResolvedThumbnail)) };
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
  return Promise.all(data.docs.map(withResolvedThumbnail));
}

// Client-safe helpers live in `podcast-utils.ts` so client components
// can use them without pulling in `cms-fetch` (which imports `next/headers`).
// Re-exported here for backward compatibility with existing consumers.
export {
  PODCAST_TITLE,
  extractYoutubeId,
  formatEpisodeNumber,
  isHydratedEpisode,
  resolveVideoId,
  youtubeEmbedUrl,
  youtubeThumbnail,
  youtubeWatchUrl,
} from "./podcast-utils";
