import type { BasePayload } from 'payload';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type CacheEntry, isStale, readCache, TTL_MS, writeCache } from './cache';

const ROW = {
  id: 1,
  env: 'development',
  provider: 'ga4DataApi' as const,
  scope: 'global' as const,
  key: 'sessions',
  capturedAt: '2026-06-08T00:00:00.000Z',
  payload: { sessions: 42 },
};

const envSnapshot = { PAYLOAD_ENV: process.env.PAYLOAD_ENV, NODE_ENV: process.env.NODE_ENV };

beforeEach(() => {
  process.env.PAYLOAD_ENV = 'test'; // maps onto the 'development' slot
});

afterEach(() => {
  process.env.PAYLOAD_ENV = envSnapshot.PAYLOAD_ENV ?? '';
});

describe('readCache', () => {
  it('returns the newest row as a typed CacheEntry', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [ROW] });
    const payload = { find } as unknown as BasePayload;

    const entry = await readCache(payload, 'ga4DataApi', 'global', 'sessions');
    expect(entry).toEqual({
      env: 'development',
      provider: 'ga4DataApi',
      scope: 'global',
      key: 'sessions',
      capturedAt: ROW.capturedAt,
      payload: { sessions: 42 },
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'analyticsCache',
        sort: '-capturedAt',
        limit: 1,
        overrideAccess: true,
      }),
    );
  });

  it('returns null when no row exists', async () => {
    const payload = { find: vi.fn().mockResolvedValue({ docs: [] }) } as unknown as BasePayload;
    expect(await readCache(payload, 'ga4DataApi', 'global', 'sessions')).toBeNull();
  });

  it('swallows query errors and returns null (never throws into a request path)', async () => {
    const payload = { find: vi.fn().mockRejectedValue(new Error('db down')) } as unknown as BasePayload;
    expect(await readCache(payload, 'ga4DataApi', 'global', 'sessions')).toBeNull();
  });
});

describe('writeCache', () => {
  it('inserts a fresh row scoped to the current env', async () => {
    const create = vi.fn().mockResolvedValue({ id: 2 });
    const payload = { create } as unknown as BasePayload;

    await writeCache(payload, 'msClarity', 'document', 'doc-7', { hits: 1 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'analyticsCache',
        data: expect.objectContaining({
          env: 'development',
          provider: 'msClarity',
          scope: 'document',
          key: 'doc-7',
          payload: { hits: 1 },
        }),
        overrideAccess: true,
      }),
    );
  });

  it('never throws even if the create fails (cron-safe)', async () => {
    const payload = { create: vi.fn().mockRejectedValue(new Error('boom')) } as unknown as BasePayload;
    await expect(writeCache(payload, 'msClarity', 'global', 'k', {})).resolves.toBeUndefined();
  });
});

describe('isStale', () => {
  const entry: CacheEntry = {
    env: 'development',
    provider: 'ga4DataApi',
    scope: 'global',
    key: 'k',
    capturedAt: '2026-06-08T00:00:00.000Z',
    payload: {},
  };

  it('is false within the TTL and true beyond it', () => {
    const within = new Date('2026-06-08T00:10:00.000Z'); // 10 min later
    const beyond = new Date('2026-06-08T00:30:00.000Z'); // 30 min later
    expect(isStale(entry, TTL_MS.ga4DataApi, within)).toBe(false);
    expect(isStale(entry, TTL_MS.ga4DataApi, beyond)).toBe(true);
  });

  it('treats an unparseable capturedAt as stale', () => {
    expect(isStale({ ...entry, capturedAt: 'not-a-date' }, TTL_MS.ga4DataApi)).toBe(true);
  });
});
