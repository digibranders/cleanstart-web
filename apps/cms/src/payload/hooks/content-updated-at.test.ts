import { describe, expect, it } from 'vitest';

import { SKIP_CONTENT_TIMESTAMP, contentUpdatedAtHook } from './content-updated-at';

type HookArgs = Parameters<ReturnType<typeof contentUpdatedAtHook>>[0];

const STAMP = '2026-01-15T10:00:00.000Z';

const run = (
  data: Record<string, unknown>,
  originalDoc?: Record<string, unknown>,
  operation: 'create' | 'update' = 'update',
  context: Record<string, unknown> = {},
): Record<string, unknown> =>
  contentUpdatedAtHook()({
    data,
    originalDoc,
    operation,
    req: { context },
  } as unknown as HookArgs) as Record<string, unknown>;

const body = (text: string): Record<string, unknown> => ({
  root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
});

describe('contentUpdatedAtHook', () => {
  it('stamps now() when the body changes', () => {
    const before = Date.now();
    const out = run(
      { body: body('new') },
      { body: body('old'), contentUpdatedAt: STAMP },
    );
    expect(Date.parse(out.contentUpdatedAt as string)).toBeGreaterThanOrEqual(before);
  });

  it('stamps when the title changes', () => {
    const out = run({ title: 'B' }, { title: 'A', contentUpdatedAt: STAMP });
    expect(out.contentUpdatedAt).not.toBe(STAMP);
  });

  it('keeps the stored value when only untracked fields change', () => {
    const out = run(
      { seo: { description: 'rewritten' } },
      { seo: { description: 'old' }, body: body('same'), contentUpdatedAt: STAMP },
    );
    expect(out.contentUpdatedAt).toBe(STAMP);
  });

  it('treats a re-sent identical body as unchanged, whatever the key order', () => {
    const stored = { root: { children: [], type: 'root' } };
    const resent = { root: { type: 'root', children: [] } };
    const out = run({ body: resent }, { body: stored, contentUpdatedAt: STAMP });
    expect(out.contentUpdatedAt).toBe(STAMP);
  });

  it('does not let a stale form value overwrite the stored stamp', () => {
    const out = run(
      { body: body('same'), contentUpdatedAt: null },
      { body: body('same'), contentUpdatedAt: STAMP },
    );
    expect(out.contentUpdatedAt).toBe(STAMP);
  });

  it('leaves the stamp alone for a flagged system write, even if the body changes', () => {
    const out = run(
      { body: body('normalized') },
      { body: body('old'), contentUpdatedAt: STAMP },
      'update',
      { [SKIP_CONTENT_TIMESTAMP]: true },
    );
    expect(out.contentUpdatedAt).toBe(STAMP);
  });

  it('stamps on create when the doc carries content', () => {
    const out = run({ title: 'New', body: body('hello') }, undefined, 'create');
    expect(typeof out.contentUpdatedAt).toBe('string');
  });

  it('does not stamp a flagged create, so imports stay unstamped', () => {
    const out = run({ title: 'Imported' }, undefined, 'create', {
      [SKIP_CONTENT_TIMESTAMP]: true,
    });
    expect(out.contentUpdatedAt ?? null).toBeNull();
  });
});
