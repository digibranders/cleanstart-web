import { describe, expect, it } from 'vitest';

import { firstPublishHook } from './first-publish';

const run = (
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown>,
  operation: 'create' | 'update' = 'update',
) =>
  firstPublishHook()({
    data,
    originalDoc,
    operation,
  } as unknown as Parameters<ReturnType<typeof firstPublishHook>>[0]);

describe('firstPublishHook', () => {
  it('stamps publishedAt with now() on first publish (draft → published)', async () => {
    const before = Date.now();
    const out = (await run({ _status: 'published' }, { _status: 'draft' })) as {
      publishedAt: string;
    };
    const stamp = Date.parse(out.publishedAt);
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(Date.now());
  });

  it('does nothing when the doc is saved as draft', async () => {
    const out = await run({ _status: 'draft' }, { _status: 'draft' });
    expect((out as { publishedAt?: string }).publishedAt).toBeUndefined();
  });

  it('preserves an editor-set publishedAt instead of overwriting', async () => {
    const out = (await run(
      { _status: 'published', publishedAt: '2024-01-01T00:00:00.000Z' },
      { _status: 'draft' },
    )) as { publishedAt: string };
    expect(out.publishedAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('preserves the previous publishedAt across re-publish', async () => {
    const out = (await run(
      { _status: 'published' },
      { _status: 'published', publishedAt: '2024-06-01T00:00:00.000Z' },
    )) as { publishedAt?: string };
    expect(out.publishedAt).toBeUndefined();
  });

  it('backfills legacy published rows from createdAt when publishedAt is absent', async () => {
    const out = (await run(
      { _status: 'published' },
      { _status: 'published', createdAt: '2023-04-04T12:00:00.000Z' },
    )) as { publishedAt: string };
    expect(out.publishedAt).toBe('2023-04-04T12:00:00.000Z');
  });

  it('returns data unchanged for non-create/update operations', async () => {
    const out = await run({ _status: 'published' }, { _status: 'draft' }, 'create');
    expect((out as { publishedAt?: string }).publishedAt).toBeDefined();
  });
});
