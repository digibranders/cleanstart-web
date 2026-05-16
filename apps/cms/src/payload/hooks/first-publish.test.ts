import { describe, expect, it } from 'vitest';

import {
  firstPublishBeforeValidateHook,
  firstPublishHook,
} from './first-publish';

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

  it('stamps a custom field name when `field` is provided', async () => {
    const hook = firstPublishHook({ field: 'publicationDate' });
    const out = (await hook({
      data: { _status: 'published' },
      originalDoc: { _status: 'draft' },
      operation: 'update',
    } as unknown as Parameters<typeof hook>[0])) as { publicationDate?: string };
    expect(typeof out.publicationDate).toBe('string');
    expect(Date.parse(out.publicationDate as string)).not.toBeNaN();
  });
});

describe('firstPublishBeforeValidateHook', () => {
  it('stamps the configured field with now() on first publish so required-validation passes', async () => {
    const hook = firstPublishBeforeValidateHook({ field: 'publicationDate' });
    const before = Date.now();
    const out = (await hook({
      data: { _status: 'published' },
      originalDoc: { _status: 'draft' },
      operation: 'update',
    } as unknown as Parameters<typeof hook>[0])) as { publicationDate: string };
    const stamp = Date.parse(out.publicationDate);
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(Date.now());
  });

  it('preserves an editor-set publicationDate', async () => {
    const hook = firstPublishBeforeValidateHook({ field: 'publicationDate' });
    const out = (await hook({
      data: { _status: 'published', publicationDate: '2026-01-15T10:00:00.000Z' },
      originalDoc: { _status: 'draft' },
      operation: 'update',
    } as unknown as Parameters<typeof hook>[0])) as { publicationDate: string };
    expect(out.publicationDate).toBe('2026-01-15T10:00:00.000Z');
  });

  it('leaves drafts alone (no stamp until publish)', async () => {
    const hook = firstPublishBeforeValidateHook({ field: 'publicationDate' });
    const out = (await hook({
      data: { _status: 'draft' },
      originalDoc: { _status: 'draft' },
      operation: 'update',
    } as unknown as Parameters<typeof hook>[0])) as { publicationDate?: string };
    expect(out.publicationDate).toBeUndefined();
  });

  it('handles undefined data (Payload allows it on beforeValidate)', async () => {
    const hook = firstPublishBeforeValidateHook({ field: 'publicationDate' });
    const out = await hook({
      operation: 'update',
    } as unknown as Parameters<typeof hook>[0]);
    expect(out).toEqual({});
  });
});
