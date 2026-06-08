import { youtubeThumbnail } from "./podcast-utils";

// Channel ID resolved once from the @CleanStartOfficial channel page
// (`externalId`). Public + stable, so it lives as a const rather than an env var.
export const CLEANSTART_YOUTUBE_CHANNEL_ID = "UC13c-XRmRlkWpp6WMG9SDjw";
export const CLEANSTART_YOUTUBE_HANDLE_URL =
  "https://www.youtube.com/@CleanStartOfficial";

const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CLEANSTART_YOUTUBE_CHANNEL_ID}`;
const FEED_REVALIDATE_SECONDS = 3600;

export type ChannelVideo = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
};

const ENTRY_RE = /<entry>([\s\S]*?)<\/entry>/g;
const VIDEO_ID_RE = /<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/;
const TITLE_RE = /<title>([\s\S]*?)<\/title>/;
const PUBLISHED_RE = /<published>([\s\S]*?)<\/published>/;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .trim();
}

export function parseYouTubeFeed(xml: string, limit: number): ChannelVideo[] {
  if (typeof xml !== "string" || xml.length === 0) return [];
  const videos: ChannelVideo[] = [];
  for (const match of xml.matchAll(ENTRY_RE)) {
    if (videos.length >= limit) break;
    const block = match[1];
    if (block === undefined) continue;
    const videoId = VIDEO_ID_RE.exec(block)?.[1];
    if (!videoId) continue;
    const title = decodeEntities(TITLE_RE.exec(block)?.[1] ?? "");
    const publishedAt = PUBLISHED_RE.exec(block)?.[1]?.trim() ?? "";
    videos.push({
      videoId,
      title,
      publishedAt,
      thumbnailUrl: youtubeThumbnail(videoId, "hqdefault"),
    });
  }
  return videos;
}

export async function getChannelVideos(limit = 6): Promise<ChannelVideo[]> {
  try {
    const res = await fetch(FEED_URL, {
      next: { revalidate: FEED_REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    return parseYouTubeFeed(await res.text(), limit);
  } catch {
    return [];
  }
}
