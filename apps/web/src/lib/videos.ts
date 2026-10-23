import { VIDEO_CATALOG, VIDEO_TOPICS } from "./videos-catalog";
import { getCmsVideoBySlug, getCmsVideos } from "./videos-cms";
import { mergeVideos, type Video } from "./videos-utils";
import { getChannelVideos } from "./youtube-feed";

// Where /videos reads from. "cms" reads the Payload `videos` collection; anything
// else keeps the code catalog plus the YouTube RSS feed. Flipping this one env var
// (and redeploying) is the cutover and the rollback.
const usesCms = (): boolean => process.env.VIDEOS_SOURCE === "cms";

// The RSS feed holds the 15 newest uploads; ask for all of them. It is cached
// for an hour by `getChannelVideos` and returns [] when YouTube is unreachable,
// in which case the catalog alone still renders the whole page.
const FEED_LIMIT = 15;

export async function getVideos(): Promise<Video[]> {
  if (usesCms()) return getCmsVideos();
  const feed = await getChannelVideos(FEED_LIMIT);
  return mergeVideos(VIDEO_CATALOG, feed);
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const videos = await getVideos();
  return videos.find((v) => v.slug === slug) ?? null;
}

/**
 * One video for a detail page. A draft (editor preview) must see unpublished
 * documents, which the published list does not carry, so only that case makes a
 * separate CMS read.
 */
export async function getVideoDetail(
  slug: string,
  { draft = false }: { draft?: boolean } = {},
): Promise<Video | null> {
  if (draft && usesCms()) return getCmsVideoBySlug(slug, { draft: true });
  return getVideoBySlug(slug);
}

/** Slugs the topic dropdown lists first. The CMS has no such order: topics follow their counts. */
export function videoTopicOrder(): readonly string[] {
  return usesCms() ? [] : VIDEO_TOPICS.map((t) => t.id);
}
