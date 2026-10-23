import { describe, expect, it, vi } from 'vitest';
import { createYoutubeRssClient, parseRssFeed } from './youtube-rss-client';

const FEED = `<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/">
 <entry>
  <yt:videoId>AAAAAAAAAAA</yt:videoId>
  <title>What Is VEX? &amp; why</title>
  <published>2026-10-13T14:17:14+00:00</published>
  <media:group><media:description>First paragraph.

#VEX #SBOM</media:description></media:group>
 </entry>
 <entry><yt:videoId>BBBBBBBBBBB</yt:videoId><title>Second</title><published>2026-10-12T10:58:15+00:00</published></entry>
</feed>`;

const respond = (url: string): Response => {
  if (url.includes('feeds/videos.xml')) return { ok: true, status: 200, text: async () => FEED } as Response;
  // HEAD for the maxres poster: present for A, missing for B.
  const present = url.includes('AAAAAAAAAAA');
  return { ok: present, status: present ? 200 : 404 } as Response;
};

describe('parseRssFeed', () => {
  it('reads id, decoded title, date and the multi-line description', () => {
    const [first, second] = parseRssFeed(FEED);
    expect(first).toMatchObject({ id: 'AAAAAAAAAAA', title: 'What Is VEX? & why', publishedAt: '2026-10-13T14:17:14+00:00' });
    expect(first?.description).toBe('First paragraph.\n\n#VEX #SBOM');
    expect(second?.description).toBe('');
  });

  it('decodes ampersand-escaped entities once, not twice', () => {
    const [entry] = parseRssFeed('<entry><yt:videoId>AAAAAAAAAAA</yt:videoId><title>a &amp;lt; b</title></entry>');
    expect(entry?.title).toBe('a &lt; b');
  });

  it('returns [] for empty or malformed input', () => {
    expect(parseRssFeed('')).toEqual([]);
    expect(parseRssFeed('<feed></feed>')).toEqual([]);
  });
});

describe('createYoutubeRssClient', () => {
  it('never claims a complete listing (the feed only holds the newest 15)', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => respond(String(input)));
    const client = createYoutubeRssClient({ fetchImpl });
    expect((await client.listUploadIds('UCabc')).complete).toBe(false);
  });

  it('returns unknown duration as null, assumes public and embeddable, and checks maxres with HEAD', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => respond(String(input)));
    const client = createYoutubeRssClient({ fetchImpl });
    const { ids } = await client.listUploadIds('UCabc');
    const videos = await client.getVideos(ids);
    expect(videos).toHaveLength(2);
    expect(videos[0]).toMatchObject({
      id: 'AAAAAAAAAAA',
      durationSeconds: null,
      privacyStatus: 'public',
      embeddable: true,
      hasMaxres: true,
      tags: [],
    });
    expect(videos[1]?.hasMaxres).toBe(false);
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('maxresdefault.jpg'),
      expect.objectContaining({ method: 'HEAD' }),
    );
  });

  it('treats a failed HEAD as no maxres instead of failing the run', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes('feeds/videos.xml')) return respond(String(input));
      throw new Error('network down');
    });
    const client = createYoutubeRssClient({ fetchImpl });
    const { ids } = await client.listUploadIds('UCabc');
    expect((await client.getVideos(ids)).every((v) => v.hasMaxres === false)).toBe(true);
  });

  it('throws a typed error when the feed itself is unreachable', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 404, text: async () => '' }) as Response);
    await expect(createYoutubeRssClient({ fetchImpl }).listUploadIds('UCabc')).rejects.toThrow(/feed/i);
  });
});
