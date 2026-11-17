import { youtubeThumbnail } from "./podcast-utils";

const THUMB_CHECK_TIMEOUT_MS = 4000;
const ONE_DAY_SECONDS = 86400;

/**
 * Pick the best thumbnail YouTube actually has for a video. `maxresdefault`
 * (1280x720) only exists for some videos; for the rest the CDN answers 404, and
 * a crawler reading the server-rendered `<img src>` sees a broken image.
 * Falls back to `hqdefault`, which always exists. When the check itself fails
 * (timeout, network) the maxres URL is kept so the client-side placeholder
 * detection in `YouTubeEmbed` still covers the gap.
 */
export async function bestYoutubeThumbnail(videoId: string): Promise<string> {
  const maxres = youtubeThumbnail(videoId, "maxresdefault");
  try {
    const res = await fetch(maxres, {
      method: "HEAD",
      next: { revalidate: ONE_DAY_SECONDS },
      signal: AbortSignal.timeout(THUMB_CHECK_TIMEOUT_MS),
    });
    return res.status === 404 ? youtubeThumbnail(videoId, "hqdefault") : maxres;
  } catch {
    return maxres;
  }
}
