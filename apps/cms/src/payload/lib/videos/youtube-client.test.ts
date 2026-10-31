import { describe, expect, it, vi } from 'vitest';
import { YoutubeApiError, createYoutubeClient, parseIsoDuration } from './youtube-client';

const json = (body: unknown, status = 200): Response =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

describe('parseIsoDuration', () => {
  it.each([
    ['PT1M41S', 101],
    ['PT59S', 59],
    ['PT27M46S', 1666],
    ['PT1H2M3S', 3723],
    ['PT0S', 0],
    ['P1DT1H', 90000],
  ])('%s -> %i seconds', (iso, seconds) => {
    expect(parseIsoDuration(iso)).toBe(seconds);
  });

  it('rejects garbage', () => {
    expect(() => parseIsoDuration('1:41')).toThrow(YoutubeApiError);
  });
});

describe('createYoutubeClient', () => {
  it('walks the uploads playlist and reports whether it saw everything', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUabc' } } }] }))
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'BBBBBBBBBBB' } }] }));
    const client = createYoutubeClient({ apiKey: 'k', fetchImpl });
    expect(await client.listUploadIds('UCabc')).toEqual({ ids: ['AAAAAAAAAAA', 'BBBBBBBBBBB'], complete: true });
  });

  it('marks the listing incomplete when it hits the page cap', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUabc' } } }] }))
      .mockResolvedValue(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'more' }));
    const client = createYoutubeClient({ apiKey: 'k', fetchImpl });
    const result = await client.listUploadIds('UCabc', { maxPages: 2 });
    expect(result.complete).toBe(false);
  });

  it('lists a playlist page by page without resolving a channel first', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'p2' }))
      .mockResolvedValueOnce(json({ items: [{ contentDetails: { videoId: 'BBBBBBBBBBB' } }] }));
    const client = createYoutubeClient({ apiKey: 'k', fetchImpl });
    expect(await client.listPlaylistVideoIds('PLexplainer0001')).toEqual(['AAAAAAAAAAA', 'BBBBBBBBBBB']);
    const first = new URL(String(fetchImpl.mock.calls[0]?.[0]));
    const second = new URL(String(fetchImpl.mock.calls[1]?.[0]));
    expect(first.pathname).toBe('/youtube/v3/playlistItems');
    expect(Object.fromEntries(first.searchParams)).toMatchObject({
      part: 'contentDetails',
      playlistId: 'PLexplainer0001',
      maxResults: '50',
    });
    expect(second.searchParams.get('pageToken')).toBe('p2');
  });

  it('stops paging a playlist at the page cap instead of looping forever', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(json({ items: [{ contentDetails: { videoId: 'AAAAAAAAAAA' } }], nextPageToken: 'more' }));
    const ids = await createYoutubeClient({ apiKey: 'k', fetchImpl }).listPlaylistVideoIds('PLexplainer0001');
    expect(fetchImpl).toHaveBeenCalledTimes(20);
    expect(ids).toHaveLength(20);
  });

  it('rejects a playlist response that does not match the expected shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ items: [{ contentDetails: { videoId: 'short' } }] }));
    await expect(createYoutubeClient({ apiKey: 'k', fetchImpl }).listPlaylistVideoIds('PLx0000000001')).rejects.toThrow(
      /expected shape/,
    );
  });

  it('surfaces a missing playlist (404) as a typed error without the key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ error: {} }, 404));
    const error = await createYoutubeClient({ apiKey: 'secret-key', fetchImpl })
      .listPlaylistVideoIds('PLx0000000001')
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YoutubeApiError);
    expect((error as YoutubeApiError).status).toBe(404);
    expect((error as YoutubeApiError).message).not.toContain('secret-key');
  });

  it('maps a video, reading maxres from the thumbnails', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      json({
        items: [
          {
            id: 'AAAAAAAAAAA',
            snippet: {
              title: 'T',
              description: 'D',
              publishedAt: '2026-10-13T14:17:14Z',
              tags: ['sbom'],
              liveBroadcastContent: 'none',
              thumbnails: { default: { url: 'u' }, maxres: { url: 'https://i.ytimg.com/vi/AAAAAAAAAAA/maxresdefault.jpg' } },
            },
            contentDetails: { duration: 'PT1M41S' },
            status: { privacyStatus: 'public', embeddable: true },
          },
        ],
      }),
    );
    const [video] = await createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(['AAAAAAAAAAA']);
    expect(video).toMatchObject({ id: 'AAAAAAAAAAA', durationSeconds: 101, hasMaxres: true, tags: ['sbom'] });
  });

  it('throws a typed error that never contains the API key', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ error: { message: 'quota' } }, 403));
    const client = createYoutubeClient({ apiKey: 'SECRET-KEY', fetchImpl });
    const error = await client.getVideos(['AAAAAAAAAAA']).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YoutubeApiError);
    expect((error as Error).message).not.toContain('SECRET-KEY');
  });

  it('hides the key when the request itself fails', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('connect failed for https://x?key=SECRET-KEY'));
    const error = await createYoutubeClient({ apiKey: 'SECRET-KEY', fetchImpl })
      .getVideos(['AAAAAAAAAAA'])
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(YoutubeApiError);
    expect((error as Error).message).not.toContain('SECRET-KEY');
  });

  it('rejects a response that does not match the schema', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ items: [{ id: 'short' }] }));
    await expect(createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(['AAAAAAAAAAA'])).rejects.toBeInstanceOf(
      YoutubeApiError,
    );
  });

  it('batches video ids in groups of 50', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ items: [] }));
    const ids = Array.from({ length: 120 }, (_, i) => String(i).padStart(11, 'x'));
    await createYoutubeClient({ apiKey: 'k', fetchImpl }).getVideos(ids);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });
});
