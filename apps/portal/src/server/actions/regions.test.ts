import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-portal-client-ip': '198.51.100.1' }), cookies: async () => ({ set: () => undefined, get: () => undefined }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', async () => {
  const { UnauthenticatedError } = await import('@/server/errors');
  return {
    requireActionViewer: async () => {
      if (!harness.viewer) throw new UnauthenticatedError();
      return harness.viewer;
    },
  };
});

import { addRegionAction, moveRegionAction, renameRegionAction, setRegionActiveAction } from './regions';

const db = testDb();
const events = async (): Promise<string[]> => (await db.select().from(auditLog)).map((a) => a.event).sort();

beforeEach(async () => {
  await resetDb(db);
  harness.viewer = await asStaff(db, 'partner_manager', 'all');
});

describe('region actions', () => {
  it('audits add, rename, reorder and deactivate', async () => {
    expect(await addRegionAction({ name: 'Africa' })).toMatchObject({ ok: true, data: { key: 'africa' } });
    expect(await renameRegionAction({ key: 'africa', name: 'Sub-Saharan Africa' })).toMatchObject({ ok: true });
    expect(await moveRegionAction({ key: 'africa', direction: 'up' })).toMatchObject({ ok: true });
    expect(await setRegionActiveAction({ key: 'africa', active: false })).toMatchObject({ ok: true });
    expect(await events()).toEqual(['region.added', 'region.deactivated', 'region.renamed', 'region.reordered']);
  });

  it('writes no audit entry for a move that changes nothing or a rename to the same name', async () => {
    await moveRegionAction({ key: 'india', direction: 'up' });
    await renameRegionAction({ key: 'india', name: 'India' });
    expect(await events()).toEqual([]);
  });

  it('is for partner managers only', async () => {
    for (const viewer of [await asStaff(db, 'sales', 'india'), await asStaff(db, 'marketing', 'all'), await asPartner(db, {})]) {
      harness.viewer = viewer;
      expect(await addRegionAction({ name: 'Africa' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
  });

  it('reports a duplicate name as a field error', async () => {
    expect(await addRegionAction({ name: 'EU' })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
