import { YoutubeApiError, type YoutubeClient, type YoutubeVideo } from './youtube-client';

// Deliberate duplicate of apps/web/src/lib/youtube-feed.ts: the CMS cannot import from apps/web.
const ENTRY = /<entry>([\s\S]*?)<\/entry>/g;
const ID = /<yt:videoId>([A-Za-z0-9_-]{11})<\/yt:videoId>/;
const TITLE = /<title>([\s\S]*?)<\/title>/;
const PUBLISHED = /<published>([\s\S]*?)<\/published>/;
const DESCRIPTION = /<media:description>([\s\S]*?)<\/media:description>/;

// &amp; last, so "&amp;lt;" decodes to "&lt;" and not all the way to "<".
const decode = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .trim();

export interface RssEntry {
  readonly id: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly description: string;
}

export const parseRssFeed = (xml: string): RssEntry[] => {
  const out: RssEntry[] = [];
  for (const match of xml.matchAll(ENTRY)) {
    const block = match[1] ?? '';
    const id = ID.exec(block)?.[1];
    if (!id) continue;
    out.push({
      id,
      title: decode(TITLE.exec(block)?.[1] ?? ''),
      publishedAt: PUBLISHED.exec(block)?.[1]?.trim() ?? '',
      description: decode(DESCRIPTION.exec(block)?.[1] ?? ''),
    });
  }
  return out;
};

interface RssClientOptions {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export const createYoutubeRssClient = ({
  fetchImpl = fetch,
  timeoutMs = 10_000,
}: RssClientOptions = {}): YoutubeClient => {
  let entries: readonly RssEntry[] = [];
  return {
    async listUploadIds(channelId) {
      let res: Response;
      try {
        res = await fetchImpl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw new YoutubeApiError('YouTube RSS feed request failed');
      }
      if (!res.ok) throw new YoutubeApiError(`YouTube RSS feed returned ${res.status}`, res.status);
      entries = parseRssFeed(await res.text());
      // The feed holds only the newest 15, so absence from it proves nothing.
      return { ids: entries.map((e) => e.id), complete: false };
    },

    async getVideos(ids) {
      const wanted = new Set(ids);
      const out: YoutubeVideo[] = [];
      for (const entry of entries.filter((e) => wanted.has(e.id))) {
        const poster = await fetchImpl(`https://i.ytimg.com/vi/${entry.id}/maxresdefault.jpg`, {
          method: 'HEAD',
          signal: AbortSignal.timeout(timeoutMs),
        }).catch(() => null);
        out.push({
          id: entry.id,
          title: entry.title,
          description: entry.description,
          publishedAt: entry.publishedAt,
          durationSeconds: null,
          tags: [],
          // The feed lists public videos only and cannot report embeddability; the draft review covers it.
          privacyStatus: 'public',
          embeddable: true,
          liveBroadcastContent: 'none',
          hasMaxres: poster?.ok === true,
        });
      }
      return out;
    },
  };
};
