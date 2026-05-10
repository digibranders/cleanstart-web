import { beforeEach, describe, expect, it, vi } from 'vitest';

import { slugChangeRedirectHook } from './slug-change-redirect';

type RedirectRow = {
  id: number;
  from: string;
  to: string;
  status?: string;
  source?: string;
  notes?: string;
};

const makePayload = (initial: RedirectRow[] = []) => {
  const rows = new Map<number, RedirectRow>(initial.map((r) => [r.id, r]));
  let nextId = (initial.at(-1)?.id ?? 0) + 1;

  const find = vi.fn(async ({ where }: { where: Record<string, { equals?: string }> }) => {
    const fromEq = where.from?.equals;
    const toEq = where.to?.equals;
    const docs = [...rows.values()].filter((r) => {
      if (fromEq != null && r.from !== fromEq) return false;
      if (toEq != null && r.to !== toEq) return false;
      return true;
    });
    return { docs };
  });

  const create = vi.fn(async ({ data }: { data: Omit<RedirectRow, 'id'> }) => {
    const row: RedirectRow = { id: nextId++, ...data };
    rows.set(row.id, row);
    return row;
  });

  const update = vi.fn(async ({ id, data }: { id: number; data: Partial<RedirectRow> }) => {
    const existing = rows.get(id);
    if (!existing) throw new Error(`no row ${id}`);
    const merged = { ...existing, ...data };
    rows.set(id, merged);
    return merged;
  });

  const del = vi.fn(async ({ id }: { id: number }) => {
    rows.delete(id);
    return { id };
  });

  return {
    payload: { find, create, update, delete: del },
    rows,
    spies: { find, create, update, delete: del },
  };
};

const runHook = async (
  collection: string,
  previousDoc: Record<string, unknown> | undefined,
  doc: Record<string, unknown>,
  payload: ReturnType<typeof makePayload>['payload'],
) => {
  const hook = slugChangeRedirectHook(collection);
  return hook({
    doc,
    previousDoc,
    req: { payload },
  } as unknown as Parameters<ReturnType<typeof slugChangeRedirectHook>>[0]);
};

describe('slugChangeRedirectHook', () => {
  let mock: ReturnType<typeof makePayload>;

  beforeEach(() => {
    mock = makePayload();
  });

  it('returns doc unchanged when slug did not change', async () => {
    const doc = { slug: 'a', _status: 'published' };
    await runHook('blogs', { slug: 'a', _status: 'published' }, doc, mock.payload);
    expect(mock.spies.create).not.toHaveBeenCalled();
    expect(mock.spies.update).not.toHaveBeenCalled();
  });

  it('does nothing when neither old nor new is published (draft → draft)', async () => {
    await runHook(
      'blogs',
      { slug: 'old', _status: 'draft' },
      { slug: 'new', _status: 'draft' },
      mock.payload,
    );
    expect(mock.spies.create).not.toHaveBeenCalled();
  });

  it('creates a 301 redirect on published slug rename', async () => {
    await runHook(
      'blogs',
      { slug: 'old', _status: 'published' },
      { slug: 'new', _status: 'published' },
      mock.payload,
    );
    expect(mock.spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'redirects',
        data: expect.objectContaining({
          from: '/blogs/old',
          to: '/blogs/new',
          status: '301',
          source: 'slug-change',
        }),
      }),
    );
  });

  it('creates a redirect when transitioning from published → draft (unpublish keeps URL alive)', async () => {
    await runHook(
      'blogs',
      { slug: 'gone', _status: 'published' },
      { slug: 'gone-now', _status: 'draft' },
      mock.payload,
    );
    expect(mock.spies.create).toHaveBeenCalled();
  });

  it('updates an existing redirect row instead of creating a duplicate (idempotent)', async () => {
    mock = makePayload([
      { id: 7, from: '/blogs/old', to: '/blogs/stale', status: '301', source: 'manual' },
    ]);
    await runHook(
      'blogs',
      { slug: 'old', _status: 'published' },
      { slug: 'new', _status: 'published' },
      mock.payload,
    );
    expect(mock.spies.create).not.toHaveBeenCalled();
    expect(mock.spies.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 7,
        data: expect.objectContaining({ to: '/blogs/new', status: '301', source: 'slug-change' }),
      }),
    );
  });

  it('chain-collapses inbound rows pointing at the old URL', async () => {
    mock = makePayload([
      { id: 1, from: '/blogs/very-old', to: '/blogs/old', status: '301', source: 'slug-change' },
      { id: 2, from: '/blogs/also-old', to: '/blogs/old', status: '301', source: 'slug-change' },
    ]);
    await runHook(
      'blogs',
      { slug: 'old', _status: 'published' },
      { slug: 'new', _status: 'published' },
      mock.payload,
    );
    const updateCalls = mock.spies.update.mock.calls.map((c) => c[0]);
    expect(updateCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, data: expect.objectContaining({ to: '/blogs/new' }) }),
        expect.objectContaining({ id: 2, data: expect.objectContaining({ to: '/blogs/new' }) }),
      ]),
    );
  });

  it('deletes an inbound row whose `from` would equal the new `to` (would create self-cycle)', async () => {
    // /blogs/new → /blogs/old already exists. After rename, naive update
    // would write /blogs/new → /blogs/new. The hook deletes it instead.
    mock = makePayload([
      { id: 9, from: '/blogs/new', to: '/blogs/old', status: '301', source: 'manual' },
    ]);
    await runHook(
      'blogs',
      { slug: 'old', _status: 'published' },
      { slug: 'new', _status: 'published' },
      mock.payload,
    );
    expect(mock.spies.delete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9, collection: 'redirects' }),
    );
  });

  it('refuses to act on collections without a route prefix', async () => {
    await runHook(
      'unknownThing',
      { slug: 'old', _status: 'published' },
      { slug: 'new', _status: 'published' },
      mock.payload,
    );
    expect(mock.spies.create).not.toHaveBeenCalled();
    expect(mock.spies.update).not.toHaveBeenCalled();
  });

  it('uses the `path` field for pages, not slug + prefix', async () => {
    await runHook(
      'pages',
      { slug: 'team', path: '/about/team', _status: 'published' },
      { slug: 'crew', path: '/about/crew', _status: 'published' },
      mock.payload,
    );
    expect(mock.spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from: '/about/team', to: '/about/crew' }),
      }),
    );
  });
});
