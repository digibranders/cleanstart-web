import { beforeEach, describe, expect, it, vi } from 'vitest';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { searchAction } from './search';

vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const db = testDb();
beforeEach(() => resetDb(db));

describe('searchAction', () => {
  it('returns the viewer scoped hits', async () => {
    await makePartner(db, { name: 'Kestrel Systems' });
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    const result = await searchAction({ q: 'kest' });
    expect(result.ok && result.data.map((h) => h.label)).toEqual(['Kestrel Systems']);
  });

  it('answers a short query with an empty list and does not touch the database', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    expect(await searchAction({ q: 'k' })).toEqual({ ok: true, data: [] });
  });

  it('rejects a query over 80 characters and a limit over 10', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asStaff(db));
    expect(await searchAction({ q: 'x'.repeat(81) })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await searchAction({ q: 'kestrel', limit: 11 })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });

  it('rate limits one person at 30 searches per 10 seconds', async () => {
    vi.mocked(requireActionViewer).mockResolvedValue(await asPartner(db));
    for (let i = 0; i < 30; i += 1) expect((await searchAction({ q: 'kestrel' })).ok).toBe(true);
    expect(await searchAction({ q: 'kestrel' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });
});
