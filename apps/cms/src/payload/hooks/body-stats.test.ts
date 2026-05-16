import { describe, expect, it, vi } from 'vitest';

import { bodyStatsHook, TOC_DEPTH_LEVELS } from './body-stats';

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

  it('tocLevels (static) filters to specified heading levels only', async () => {
    const hook = bodyStatsHook({ tocLevels: [2] });
    const out = (await callHook(hook, {
      body: lexical([heading('h2', 'Section'), heading('h3', 'Sub'), heading('h4', 'Detail')]),
    })) as Record<string, unknown>;
    expect(out.tableOfContents).toEqual([{ level: 2, text: 'Section', anchor: 'section' }]);
  });

  it('tocLevelsField reads depth from the document field', async () => {
    const hook = bodyStatsHook({ tocLevelsField: 'tocDepth' });
    const body = lexical([heading('h2', 'Section'), heading('h3', 'Sub'), heading('h4', 'Detail')]);

    const h2Only = (await callHook(hook, { body, tocDepth: 'h2' })) as Record<string, unknown>;
    expect(h2Only.tableOfContents).toEqual([{ level: 2, text: 'Section', anchor: 'section' }]);

    const h2h3 = (await callHook(hook, { body, tocDepth: 'h2_h3' })) as Record<string, unknown>;
    expect(h2h3.tableOfContents).toEqual([
      { level: 2, text: 'Section', anchor: 'section' },
      { level: 3, text: 'Sub', anchor: 'sub' },
    ]);

    const h2h3h4 = (await callHook(hook, { body, tocDepth: 'h2_h3_h4' })) as Record<
      string,
      unknown
    >;
    expect(h2h3h4.tableOfContents).toEqual([
      { level: 2, text: 'Section', anchor: 'section' },
      { level: 3, text: 'Sub', anchor: 'sub' },
      { level: 4, text: 'Detail', anchor: 'detail' },
    ]);
  });

  it('falls back to the shallowest heading level when the configured depth excludes every heading', async () => {
    const hook = bodyStatsHook({ tocLevelsField: 'tocDepth' });
    const body = lexical([heading('h3', 'Alpha'), heading('h3', 'Beta'), heading('h4', 'Gamma')]);
    const out = (await callHook(hook, { body, tocDepth: 'h2' })) as Record<string, unknown>;
    expect(out.tableOfContents).toEqual([
      { level: 3, text: 'Alpha', anchor: 'alpha' },
      { level: 3, text: 'Beta', anchor: 'beta' },
    ]);
  });

  it('does not fall back when the body has no headings at all', async () => {
    const hook = bodyStatsHook({ tocLevelsField: 'tocDepth' });
    const out = (await callHook(hook, {
      body: lexical([paragraph('just prose')]),
      tocDepth: 'h2',
    })) as Record<string, unknown>;
    expect(out.tableOfContents).toEqual([]);
  });

  it('tocLevelsField falls back to H2-only when the field value is absent', async () => {
    const hook = bodyStatsHook({ tocLevelsField: 'tocDepth' });
    const out = (await callHook(hook, {
      body: lexical([heading('h2', 'A'), heading('h3', 'B')]),
    })) as Record<string, unknown>;
    expect(out.tableOfContents).toEqual([{ level: 2, text: 'A', anchor: 'a' }]);
  });

  it('TOC_DEPTH_LEVELS covers all select option values', () => {
    expect(TOC_DEPTH_LEVELS).toMatchObject({
      h2: [2],
      h2_h3: [2, 3],
      h2_h3_h4: [2, 3, 4],
    });
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
