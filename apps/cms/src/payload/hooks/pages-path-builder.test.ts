import { describe, expect, it, vi } from 'vitest';

import { pagesPathBuilderHook } from './pages-path-builder';

type PageRow = {
  id: number;
  slug?: string | null;
  title?: string | null;
  parent?: number | null;
};

const makeReq = (rows: PageRow[]) => {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const findByID = vi.fn(async ({ id }: { id: number }) => byId.get(id) ?? null);
  return { req: { payload: { findByID } }, findByID };
};

const run = async (
  data: Record<string, unknown>,
  rows: PageRow[],
  originalDoc?: Record<string, unknown>,
) => {
  const { req } = makeReq(rows);
  return pagesPathBuilderHook({
    data,
    req,
    originalDoc,
    operation: 'update',
  } as unknown as Parameters<typeof pagesPathBuilderHook>[0]);
};

describe('pagesPathBuilderHook', () => {
  it('produces /<slug> for a root page', async () => {
    const out = (await run(
      { slug: 'about', title: 'About', parent: null },
      [],
    )) as { path: string; breadcrumb: { path: string; label: string }[] };
    expect(out.path).toBe('/about');
    expect(out.breadcrumb).toEqual([{ path: '/about', label: 'About' }]);
  });

  it('walks the parent chain to build a nested path', async () => {
    const out = (await run({ slug: 'crew', title: 'Crew', parent: 2 }, [
      { id: 2, slug: 'team', title: 'Team', parent: 1 },
      { id: 1, slug: 'about', title: 'About', parent: null },
    ])) as { path: string; breadcrumb: { path: string; label: string }[] };
    expect(out.path).toBe('/about/team/crew');
    expect(out.breadcrumb).toEqual([
      { path: '/about', label: 'About' },
      { path: '/about/team', label: 'Team' },
      { path: '/about/team/crew', label: 'Crew' },
    ]);
  });

  it('falls back to slug as label when title is missing', async () => {
    const out = (await run({ slug: 'foo', parent: null }, [])) as {
      breadcrumb: { label: string }[];
    };
    expect(out.breadcrumb[0]?.label).toBe('foo');
  });

  it('returns data unchanged when slug is empty', async () => {
    const result = await run({ slug: '', parent: null }, []);
    expect(result).toEqual({ slug: '', parent: null });
  });

  it('throws on a parent chain cycle (self in chain)', async () => {
    await expect(
      run(
        { slug: 'self', title: 'Self', parent: 5 },
        [{ id: 5, slug: 'a', parent: 99 }],
        { id: 99, slug: 'old' },
      ),
    ).rejects.toThrow(/cycle/);
  });

  it('throws when parent chain exceeds MAX_DEPTH', async () => {
    const rows: PageRow[] = [];
    // Build a chain of 20 ancestors → exceeds MAX_DEPTH=16.
    for (let i = 1; i <= 20; i++) {
      rows.push({ id: i, slug: `p${i}`, parent: i === 20 ? null : i + 1 });
    }
    await expect(
      run({ slug: 'leaf', parent: 1 }, rows),
    ).rejects.toThrow(/exceeds maximum depth/);
  });

  it('handles parent given as object with id', async () => {
    const out = (await run({ slug: 'b', title: 'B', parent: { id: 1 } }, [
      { id: 1, slug: 'a', title: 'A', parent: null },
    ])) as { path: string };
    expect(out.path).toBe('/a/b');
  });
});
