import { describe, expect, it, vi } from 'vitest';

import {
  type RedirectsPayload,
  planBulkRedirectImport,
} from './bulk-import';

const fakePayload = (
  byFrom: Record<string, { id: string | number; source?: string }>,
): RedirectsPayload => ({
  find: vi.fn(async ({ where }) => {
    const key = where.from.equals;
    const match = byFrom[key];
    return { docs: match ? [{ id: match.id, from: key, source: match.source }] : [] };
  }) as unknown as RedirectsPayload['find'],
});

describe('planBulkRedirectImport', () => {
  it('plans a create for a brand-new row with default 301 status', async () => {
    const plan = await planBulkRedirectImport({
      rows: [{ from: '/old', to: '/new' }],
      payload: fakePayload({}),
    });
    expect(plan.create).toEqual([
      { from: '/old', to: '/new', status: '301', sourceIndex: 0 },
    ]);
    expect(plan.update).toEqual([]);
    expect(plan.errors).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });

  it('plans an update when an existing manual row matches the `from`', async () => {
    const plan = await planBulkRedirectImport({
      rows: [{ from: '/old', to: '/even-newer', status: '302', notes: 'rerouted' }],
      payload: fakePayload({ '/old': { id: 99, source: 'manual' } }),
    });
    expect(plan.update).toEqual([
      {
        id: 99,
        row: {
          from: '/old',
          to: '/even-newer',
          status: '302',
          notes: 'rerouted',
          sourceIndex: 0,
        },
      },
    ]);
    expect(plan.create).toEqual([]);
  });

  it('skips system-managed rows (slug-change) without erroring', async () => {
    const plan = await planBulkRedirectImport({
      rows: [{ from: '/legacy', to: '/whatever' }],
      payload: fakePayload({ '/legacy': { id: 1, source: 'slug-change' } }),
    });
    expect(plan.skipped).toEqual([
      expect.objectContaining({ index: 0, reason: expect.stringContaining('system-managed') }),
    ]);
    expect(plan.create).toEqual([]);
    expect(plan.update).toEqual([]);
  });

  it('accepts 410 rows with empty `to`', async () => {
    const plan = await planBulkRedirectImport({
      rows: [{ from: '/gone', to: '', status: '410' }],
      payload: fakePayload({}),
    });
    expect(plan.create).toEqual([
      { from: '/gone', to: '', status: '410', sourceIndex: 0 },
    ]);
    expect(plan.errors).toEqual([]);
  });

  it('reports duplicate `from` rows as skipped, with the last occurrence acted on', async () => {
    const plan = await planBulkRedirectImport({
      rows: [
        { from: '/old', to: '/v1' },
        { from: '/keep', to: '/keep-target' },
        { from: '/old', to: '/v2' },
      ],
      payload: fakePayload({}),
    });
    expect(plan.create.map((r) => r.from)).toEqual(['/keep', '/old']);
    const oldRow = plan.create.find((r) => r.from === '/old');
    expect(oldRow?.to).toBe('/v2');
    expect(oldRow?.sourceIndex).toBe(2);
    expect(plan.skipped).toEqual([
      expect.objectContaining({ index: 0, reason: expect.stringContaining('Duplicate') }),
    ]);
  });

  it('rejects rows with missing or malformed fields', async () => {
    const plan = await planBulkRedirectImport({
      rows: [
        { from: '', to: '/x' }, // empty from
        { from: 'no-leading-slash', to: '/x' }, // bad path shape
        { from: '/a', to: '' }, // empty to (and not 410)
        { from: '/loop', to: '/loop' }, // self-loop
        { from: '/ok', to: '/x', status: '999' }, // bad status
      ],
      payload: fakePayload({}),
    });
    expect(plan.errors).toHaveLength(5);
    expect(plan.create).toEqual([]);
  });

  it('processes a mixed batch independently per row', async () => {
    const plan = await planBulkRedirectImport({
      rows: [
        { from: '/a', to: '/b' }, // create
        { from: '/c', to: '/d' }, // update existing
        { from: '/e', to: '/f' }, // skipped (slug-change)
        { from: '', to: '/x' }, // error
      ],
      payload: fakePayload({
        '/c': { id: 12, source: 'manual' },
        '/e': { id: 13, source: 'slug-change' },
      }),
    });
    expect(plan.create.map((r) => r.from)).toEqual(['/a']);
    expect(plan.update.map((u) => u.id)).toEqual([12]);
    expect(plan.skipped.map((s) => s.index)).toEqual([2]);
    expect(plan.errors.map((e) => e.index)).toEqual([3]);
  });
});
