import { describe, expect, it, vi } from 'vitest';
import { runYoutubeSync } from './run-sync';
import { contentHash, toSource } from './plan-sync';
import type { YoutubeClient, YoutubeVideo } from './youtube-client';

const video = (id: string, over: Partial<YoutubeVideo> = {}): YoutubeVideo => ({
  id,
  title: `Title ${id}`,
  description: 'First paragraph.\n\n#SBOM',
  publishedAt: '2026-10-13T14:17:14Z',
  durationSeconds: 101,
  tags: [],
  privacyStatus: 'public',
  embeddable: true,
  liveBroadcastContent: 'none',
  hasMaxres: true,
  ...over,
});

const fakeClient = (
  videos: YoutubeVideo[],
  complete: boolean,
  playlists: Record<string, string[] | Error> = {},
): YoutubeClient => ({
  listUploadIds: vi.fn(async () => ({ ids: videos.map((v) => v.id), complete })),
  getVideos: vi.fn(async () => videos),
  listPlaylistVideoIds: vi.fn(async (playlistId: string) => {
    const list = playlists[playlistId] ?? [];
    if (list instanceof Error) throw list;
    return list;
  }),
});

const fakePayload = (existingDocs: Record<string, unknown>[]) => ({
  find: vi.fn(async ({ collection }: { collection: string; page?: number }) =>
    collection === 'videoTopics'
      ? { docs: [{ id: 1, name: 'SBOM', aliases: [{ value: 'software bill of materials' }] }], hasNextPage: false }
      : { docs: existingDocs, hasNextPage: false },
  ),
  create: vi.fn().mockResolvedValue({ id: 100 }),
  update: vi.fn().mockResolvedValue({ id: 1 }),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
});

describe('runYoutubeSync', () => {
  it('lists the uploads before it asks for their details (the RSS client depends on it)', async () => {
    const client = fakeClient([video('AAAAAAAAAAA')], false);
    await runYoutubeSync({ payload: fakePayload([]), client, channelId: 'UCabc', autoPublish: false });
    const list = vi.mocked(client.listUploadIds).mock.invocationCallOrder[0] ?? 0;
    const get = vi.mocked(client.getVideos).mock.invocationCallOrder[0] ?? 0;
    expect(list).toBeGreaterThan(0);
    expect(list).toBeLessThan(get);
    expect(client.listUploadIds).toHaveBeenCalledWith('UCabc');
  });

  it('creates new videos with topics suggested from the loaded taxonomy', async () => {
    const payload = fakePayload([]);
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([video('AAAAAAAAAAA')], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result).toMatchObject({ created: 1, updated: 0, markedMissing: 0, failed: 0 });
    expect((payload.create.mock.calls[0]?.[0] as { data: { topics: number[] } }).data.topics).toEqual([1]);
  });

  it('leaves an unchanged video alone and reads the stored duration and hash from the document', async () => {
    const v = video('AAAAAAAAAAA');
    const stored = {
      id: 9,
      externalId: 'AAAAAAAAAAA',
      syncState: 'synced',
      _status: 'published',
      source: { contentHash: contentHash(toSource(v)), durationSeconds: 101 },
    };
    const payload = fakePayload([stored]);
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([v], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result).toMatchObject({ created: 0, updated: 0, unchanged: 1 });
    expect(payload.update).not.toHaveBeenCalled();
  });

  it('flags a vanished video as missing only when the listing was complete (API mode)', async () => {
    const stored = { id: 9, externalId: 'GONEGONEGON', syncState: 'synced', _status: 'published', source: {} };
    const api = await runYoutubeSync({
      payload: fakePayload([stored]),
      client: fakeClient([], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(api.markedMissing).toBe(1);
    const rss = await runYoutubeSync({
      payload: fakePayload([stored]),
      client: fakeClient([], false),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(rss.markedMissing).toBe(0);
  });

  it('reads every page of existing videos', async () => {
    const doc = (id: number, externalId: string) => ({ id, externalId, syncState: 'synced', _status: 'published', source: {} });
    const payload = fakePayload([]);
    payload.find.mockImplementation(async ({ collection, page }: { collection: string; page?: number }) => {
      if (collection === 'videoTopics') return { docs: [], hasNextPage: false };
      return page === 1
        ? { docs: [doc(1, 'AAAAAAAAAAA')], hasNextPage: true }
        : { docs: [doc(2, 'BBBBBBBBBBB')], hasNextPage: false };
    });
    const result = await runYoutubeSync({
      payload,
      client: fakeClient([], true),
      channelId: 'UCabc',
      autoPublish: false,
    });
    expect(result.markedMissing).toBe(2);
  });
  describe('category suggestions from playlists', () => {
    const playlists = { explainer: 'PLexplainer0001', demo: 'PLdemo000000001' };
    const run = (client: YoutubeClient, payload = fakePayload([])) =>
      runYoutubeSync({ payload, client, channelId: 'UCabc', autoPublish: false, playlists }).then((result) => ({
        result,
        payload,
      }));
    const created = (payload: ReturnType<typeof fakePayload>, n = 0): Record<string, unknown> =>
      (payload.create.mock.calls[n]?.[0] as { data: Record<string, unknown> }).data;

    it('suggests the category of the playlist a new video is in, and keeps it a needs-review draft', async () => {
      const client = fakeClient([video('AAAAAAAAAAA'), video('BBBBBBBBBBB'), video('CCCCCCCCCCC')], true, {
        PLexplainer0001: ['AAAAAAAAAAA'],
        PLdemo000000001: ['BBBBBBBBBBB'],
      });
      const { payload } = await run(client);
      expect(created(payload, 0)).toMatchObject({ format: 'explainer', syncState: 'needs-review', _status: 'draft' });
      expect(created(payload, 1)).toMatchObject({ format: 'demo', syncState: 'needs-review', _status: 'draft' });
      expect(created(payload, 2)).not.toHaveProperty('format');
    });

    it('gives no suggestion to a video that is in both playlists', async () => {
      const client = fakeClient([video('AAAAAAAAAAA')], true, {
        PLexplainer0001: ['AAAAAAAAAAA'],
        PLdemo000000001: ['AAAAAAAAAAA'],
      });
      const { payload } = await run(client);
      expect(created(payload)).not.toHaveProperty('format');
    });

    it('survives a failing playlist read: warns, keeps the other list, still creates the video', async () => {
      const client = fakeClient([video('AAAAAAAAAAA'), video('BBBBBBBBBBB')], true, {
        PLexplainer0001: new Error('quota'),
        PLdemo000000001: ['BBBBBBBBBBB'],
      });
      const { result, payload } = await run(client);
      expect(result).toMatchObject({ created: 2, failed: 0 });
      expect(created(payload, 0)).not.toHaveProperty('format');
      expect(created(payload, 1)).toMatchObject({ format: 'demo' });
      expect(payload.logger.warn).toHaveBeenCalledTimes(1);
    });

    it('never reads a playlist that is not configured', async () => {
      const client = fakeClient([video('AAAAAAAAAAA')], true);
      await runYoutubeSync({ payload: fakePayload([]), client, channelId: 'UCabc', autoPublish: false });
      expect(client.listPlaylistVideoIds).not.toHaveBeenCalled();
    });

    it('does not touch the category of a video that already exists', async () => {
      const v = video('AAAAAAAAAAA', { description: 'edited upstream' });
      const stored = { id: 9, externalId: 'AAAAAAAAAAA', syncState: 'synced', _status: 'published', source: { contentHash: 'old' } };
      const payload = fakePayload([stored]);
      const client = fakeClient([v], true, { PLexplainer0001: ['AAAAAAAAAAA'] });
      await run(client, payload);
      expect(payload.update).toHaveBeenCalledTimes(1);
      expect((payload.update.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data).not.toHaveProperty('format');
    });
  });

  it('never erases a known duration when a later run (RSS) cannot report one', async () => {
    const rssView = video('AAAAAAAAAAA', { durationSeconds: null, description: 'edited upstream' });
    const stored = {
      id: 9,
      externalId: 'AAAAAAAAAAA',
      syncState: 'synced',
      _status: 'published',
      source: { contentHash: 'old', durationSeconds: 101 },
    };
    const payload = fakePayload([stored]);
    await runYoutubeSync({ payload, client: fakeClient([rssView], false), channelId: 'UCabc', autoPublish: false });
    const data = (payload.update.mock.calls[0]?.[0] as { data: { source: { durationSeconds: number | null } } }).data;
    expect(data.source.durationSeconds).toBe(101);
  });
});
