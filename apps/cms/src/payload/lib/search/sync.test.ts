import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SearchClient } from './client';
import {
  __clearSyncCachesForTests,
  __setSearchClientForTests,
  dropDocument,
  syncDocument,
} from './sync';

const baseSettings = { baseUrl: 'https://cleanstart.com' };

const makePayload = () => ({
  logger: { warn: vi.fn() },
  findGlobal: vi.fn(async () => baseSettings),
});

const okResult = { ok: true as const, skipped: false as const, status: 202 };

const makeClient = (overrides: Partial<SearchClient> = {}): SearchClient => ({
  enabled: true,
  upsertDocuments: vi.fn(async () => okResult),
  deleteDocument: vi.fn(async () => okResult),
  updateSettings: vi.fn(async () => okResult),
  getStats: vi.fn(async () => null),
  search: vi.fn(async () => null),
  ...overrides,
});

beforeEach(() => {
  __clearSyncCachesForTests();
});

afterEach(() => {
  __setSearchClientForTests(null);
});

describe('syncDocument', () => {
  it('skips collections that are not search-indexed', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await syncDocument(makePayload(), 'leads', { id: 1, title: 'X' });
    expect(result).toEqual({ skipped: true, reason: 'collection-not-indexed' });
    expect(client.upsertDocuments).not.toHaveBeenCalled();
  });

  it('skips when the search client is not configured', async () => {
    const client = makeClient({ enabled: false });
    __setSearchClientForTests(client);
    const result = await syncDocument(makePayload(), 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      _status: 'published',
    });
    expect(result).toEqual({ skipped: true, reason: 'client-not-configured' });
  });

  it('upserts an indexable doc through the client', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await syncDocument(makePayload(), 'blogs', {
      id: 42,
      slug: 'my-post',
      title: 'My Post',
      abstract: 'lede',
      _status: 'published',
      updatedAt: '2026-05-05',
    });
    expect(result).toEqual({ skipped: false });
    expect(client.upsertDocuments).toHaveBeenCalledWith(
      'content',
      expect.arrayContaining([expect.objectContaining({ id: 'blogs_42', collection: 'blogs' })]),
    );
  });

  it('drops a draft doc instead of upserting it (publish→unpublish transition)', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const payload = makePayload();
    const result = await syncDocument(payload, 'blogs', {
      id: 42,
      slug: 'my-post',
      title: 'My Post',
      _status: 'draft',
    });
    expect(result).toEqual({ skipped: false });
    expect(client.upsertDocuments).not.toHaveBeenCalled();
    expect(client.deleteDocument).toHaveBeenCalledWith('content', 'blogs_42');
  });

  it('drops a noindex doc as well', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await syncDocument(makePayload(), 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      _status: 'published',
      seo: { indexable: 'noindex' },
    });
    expect(result).toEqual({ skipped: false });
    expect(client.deleteDocument).toHaveBeenCalled();
  });

  it('logs a warning and returns failed when the upsert errors', async () => {
    const client = makeClient({
      upsertDocuments: vi.fn(async () => ({
        ok: false as const,
        skipped: false as const,
        status: 500,
        error: 'boom',
      })),
    });
    __setSearchClientForTests(client);
    const payload = makePayload();
    const result = await syncDocument(payload, 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      _status: 'published',
    });
    expect(result).toEqual({ skipped: false, reason: 'upsert-failed' });
    expect(payload.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'blogs', status: 500 }),
      'search.upsert failed',
    );
  });

  it('caches the baseUrl across calls', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const payload = makePayload();
    await syncDocument(payload, 'blogs', {
      id: 1,
      slug: 'x',
      title: 'X',
      _status: 'published',
    });
    await syncDocument(payload, 'blogs', {
      id: 2,
      slug: 'y',
      title: 'Y',
      _status: 'published',
    });
    expect(payload.findGlobal).toHaveBeenCalledTimes(1);
  });
});

describe('dropDocument', () => {
  it('skips collections that are not search-indexed', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await dropDocument(makePayload(), 'leads', 1);
    expect(result).toEqual({ skipped: true, reason: 'collection-not-indexed' });
    expect(client.deleteDocument).not.toHaveBeenCalled();
  });

  it('skips when id is missing', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await dropDocument(makePayload(), 'blogs', undefined);
    expect(result).toEqual({ skipped: true, reason: 'no-id' });
  });

  it('skips when the client is not configured', async () => {
    const client = makeClient({ enabled: false });
    __setSearchClientForTests(client);
    const result = await dropDocument(makePayload(), 'blogs', 1);
    expect(result).toEqual({ skipped: true, reason: 'client-not-configured' });
  });

  it('deletes the doc by composite id', async () => {
    const client = makeClient();
    __setSearchClientForTests(client);
    const result = await dropDocument(makePayload(), 'blogs', 42);
    expect(result).toEqual({ skipped: false });
    expect(client.deleteDocument).toHaveBeenCalledWith('content', 'blogs_42');
  });

  it('logs a warning when the delete errors', async () => {
    const client = makeClient({
      deleteDocument: vi.fn(async () => ({
        ok: false as const,
        skipped: false as const,
        status: 500,
        error: 'boom',
      })),
    });
    __setSearchClientForTests(client);
    const payload = makePayload();
    const result = await dropDocument(payload, 'blogs', 1);
    expect(result).toEqual({ skipped: false, reason: 'delete-failed' });
    expect(payload.logger.warn).toHaveBeenCalled();
  });
});
