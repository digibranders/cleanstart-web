import { describe, expect, it, vi } from 'vitest';

import { bodyStatsHook } from './body-stats';

const lexical = (children: unknown[]) => ({
  root: { type: 'root', children },
});
const heading = (tag: string, text: string) => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text }],
});
const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

const callHook = async (hook: ReturnType<typeof bodyStatsHook>, data: unknown) => {
  // bodyStatsHook is a CollectionBeforeChangeHook; we only need the `data`
  // arg — the rest is unused by the implementation.
  return hook({
    data,
    req: {} as never,
    operation: 'create',
    collection: { slug: 'blogs' } as never,
    context: {} as never,
  } as never);
};

describe('bodyStatsHook', () => {
  it('writes only the configured fields', async () => {
    const hook = bodyStatsHook({ fields: { wordCount: 'wordCount' } });
    const out = (await callHook(hook, {
      body: lexical([paragraph('one two three')]),
    })) as Record<string, unknown>;
    expect(out.wordCount).toBe(3);
    expect(out.readingMinutes).toBeUndefined();
    expect(out.tableOfContents).toBeUndefined();
  });

  it('writes all three derived fields by default', async () => {
    const hook = bodyStatsHook();
    const out = (await callHook(hook, {
      body: lexical([heading('h2', 'Intro'), paragraph('hello world')]),
    })) as Record<string, unknown>;
    expect(out.wordCount).toBe(3); // "Intro" + "hello" + "world"
    expect(out.readingMinutes).toBe(1);
    expect(out.tableOfContents).toEqual([
      { level: 2, text: 'Intro', anchor: 'intro' },
    ]);
  });

  it('is idempotent — running twice yields the same result', async () => {
    const hook = bodyStatsHook();
    const data = {
      body: lexical([heading('h2', 'A'), paragraph('one two')]),
    };
    const first = await callHook(hook, data);
    const second = await callHook(hook, first);
    expect(first).toEqual(second);
  });

  it('returns data unchanged when there is no body to read', async () => {
    const hook = bodyStatsHook();
    const out = (await callHook(hook, { title: 'no body' })) as Record<string, unknown>;
    expect(out.title).toBe('no body');
    expect(out.wordCount).toBe(0);
  });

  it('honours a custom `source` field name', async () => {
    const hook = bodyStatsHook({
      source: 'longBody',
      fields: { wordCount: 'wc' },
    });
    const out = (await callHook(hook, {
      longBody: lexical([paragraph('a b c d e')]),
    })) as Record<string, unknown>;
    expect(out.wc).toBe(5);
  });
});

// Suppress noisy "no body" log if the hook adds one in the future.
vi.fn();
