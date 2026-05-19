import { cache } from "react";

import { fetchCMS } from "./cms-fetch";

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

// Client-safe helpers live in `podcast-utils.ts` so client components
// can use them without pulling in `cms-fetch` (which imports `next/headers`).
// Re-exported here for backward compatibility with existing consumers.
export {
  extractYoutubeId,
  formatEpisodeNumber,
  isHydratedEpisode,
  resolveVideoId,
  youtubeEmbedUrl,
  youtubeThumbnail,
  youtubeWatchUrl,
} from "./podcast-utils";
