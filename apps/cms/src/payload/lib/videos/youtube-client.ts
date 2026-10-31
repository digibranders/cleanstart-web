import { z } from 'zod';

export class YoutubeApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'YoutubeApiError';
  }
}

const ISO_DURATION = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

export const parseIsoDuration = (iso: string): number => {
  const match = ISO_DURATION.exec(iso);
  if (!match) throw new YoutubeApiError(`Unparseable duration: ${iso}`);
  const [, d = '0', h = '0', m = '0', s = '0'] = match;
  return Number(d) * 86_400 + Number(h) * 3_600 + Number(m) * 60 + Number(s);
};

const Id = z.string().length(11);

const ChannelsResponse = z.object({
  items: z
    .array(z.object({ contentDetails: z.object({ relatedPlaylists: z.object({ uploads: z.string() }) }) }))
    .default([]),
});

const PlaylistItemsResponse = z.object({
  items: z.array(z.object({ contentDetails: z.object({ videoId: Id }) })).default([]),
  nextPageToken: z.string().optional(),
});

const VideosResponse = z.object({
  items: z
    .array(
      z.object({
        id: Id,
        snippet: z.object({
          title: z.string(),
          description: z.string().default(''),
          publishedAt: z.string(),
          tags: z.array(z.string()).default([]),
          liveBroadcastContent: z.enum(['none', 'live', 'upcoming']).default('none'),
          thumbnails: z.record(z.object({ url: z.string() })).default({}),
        }),
        contentDetails: z.object({ duration: z.string() }),
        status: z.object({
          privacyStatus: z.enum(['public', 'unlisted', 'private']),
          embeddable: z.boolean().default(true),
        }),
      }),
    )
    .default([]),
});

export interface YoutubeVideo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly publishedAt: string;
  /** `null` when the source cannot say (the RSS feed carries no duration). */
  readonly durationSeconds: number | null;
  readonly tags: readonly string[];
  readonly privacyStatus: 'public' | 'unlisted' | 'private';
  readonly embeddable: boolean;
  readonly liveBroadcastContent: 'none' | 'live' | 'upcoming';
  readonly hasMaxres: boolean;
}

export interface YoutubeClient {
  /** Must run before `getVideos`: the RSS client reads the whole feed here. */
  listUploadIds(
    channelId: string,
    options?: { maxPages?: number },
  ): Promise<{ ids: string[]; complete: boolean }>;
  getVideos(ids: readonly string[]): Promise<YoutubeVideo[]>;
  /** Ids of the videos in a playlist. Unlike `listUploadIds` it never primes state `getVideos` relies on. */
  listPlaylistVideoIds(playlistId: string): Promise<string[]>;
}

interface ClientOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const BASE = 'https://www.googleapis.com/youtube/v3';
const BATCH = 50;
const DEFAULT_MAX_PAGES = 20;

export const createYoutubeClient = ({
  apiKey,
  fetchImpl = fetch,
  timeoutMs = 10_000,
}: ClientOptions): YoutubeClient => {
  const get = async <T>(
    path: string,
    params: Record<string, string>,
    schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  ): Promise<T> => {
    const url = `${BASE}/${path}?${new URLSearchParams({ ...params, key: apiKey }).toString()}`;
    let res: Response;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      // The URL carries the key, so never forward the underlying error text.
      throw new YoutubeApiError(`YouTube request failed: ${path}`);
    }
    if (!res.ok) throw new YoutubeApiError(`YouTube ${path} returned ${res.status}`, res.status);
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) throw new YoutubeApiError(`YouTube ${path} response did not match the expected shape`);
    return parsed.data;
  };

  const walkPlaylist = async (
    playlistId: string,
    maxPages: number,
  ): Promise<{ ids: string[]; complete: boolean }> => {
    const ids: string[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < maxPages; page += 1) {
      const res = await get(
        'playlistItems',
        { part: 'contentDetails', playlistId, maxResults: String(BATCH), ...(pageToken ? { pageToken } : {}) },
        PlaylistItemsResponse,
      );
      ids.push(...res.items.map((i) => i.contentDetails.videoId));
      pageToken = res.nextPageToken;
      if (!pageToken) return { ids, complete: true };
    }
    return { ids, complete: false };
  };

  return {
    async listUploadIds(channelId, { maxPages = DEFAULT_MAX_PAGES } = {}) {
      const channels = await get('channels', { part: 'contentDetails', id: channelId }, ChannelsResponse);
      const uploads = channels.items[0]?.contentDetails.relatedPlaylists.uploads;
      if (!uploads) throw new YoutubeApiError(`No uploads playlist for channel ${channelId}`);
      return walkPlaylist(uploads, maxPages);
    },

    async listPlaylistVideoIds(playlistId) {
      return (await walkPlaylist(playlistId, DEFAULT_MAX_PAGES)).ids;
    },

    async getVideos(ids) {
      const out: YoutubeVideo[] = [];
      for (let i = 0; i < ids.length; i += BATCH) {
        const res = await get(
          'videos',
          { part: 'snippet,contentDetails,status', id: ids.slice(i, i + BATCH).join(',') },
          VideosResponse,
        );
        for (const v of res.items) {
          out.push({
            id: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            publishedAt: v.snippet.publishedAt,
            durationSeconds: parseIsoDuration(v.contentDetails.duration),
            tags: v.snippet.tags,
            privacyStatus: v.status.privacyStatus,
            embeddable: v.status.embeddable,
            liveBroadcastContent: v.snippet.liveBroadcastContent,
            hasMaxres: 'maxres' in v.snippet.thumbnails,
          });
        }
      }
      return out;
    },
  };
};
