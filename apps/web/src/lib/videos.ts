import { VIDEO_CATALOG } from "./videos-catalog";
import { mergeVideos, type Video } from "./videos-utils";
import { getChannelVideos } from "./youtube-feed";

// The RSS feed holds the 15 newest uploads; ask for all of them. It is cached
// for an hour by `getChannelVideos` and returns [] when YouTube is unreachable,
// in which case the catalog alone still renders the whole page.
const FEED_LIMIT = 15;

export async function getVideos(): Promise<Video[]> {
  const feed = await getChannelVideos(FEED_LIMIT);
  return mergeVideos(VIDEO_CATALOG, feed);
}

export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const videos = await getVideos();
  return videos.find((v) => v.slug === slug) ?? null;
}

export {
  VIDEO_FORMATS,
  VIDEO_TOPICS,
  type VideoFormat,
  type VideoTopicId,
} from "./videos-catalog";
