import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { exportAuditAction } from './audit';

vi.mock('@/server/auth/viewer', () => ({ requireActionViewer: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const db = testDb();
const signedInAs = (viewer: Awaited<ReturnType<typeof asStaff>> | Awaited<ReturnType<typeof asPartner>>): void => {
  vi.mocked(requireActionViewer).mockResolvedValue(viewer);
};

beforeEach(() => resetDb(db));

describe('exportAuditAction', () => {
  it('returns the matching rows for a partner manager', async () => {
    signedInAs(await asStaff(db, 'partner_manager'));
    await db.insert(auditLog).values({
      actorLabel: 'Omar Nasser', who: 'staff', kind: 'partners', event: 'partner.created', text: 'Added partner: Acme', target: 'Acme',
    });
    const result = await exportAuditAction({ period: '7d', kind: 'partners', q: 'acme' });
    expect(result.ok && result.data.map((r) => r.target)).toEqual(['Acme']);
  });

  it('refuses staff sales and partner users with a forbidden error', async () => {
    signedInAs(await asStaff(db, 'sales', 'india'));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    signedInAs(await asPartner(db));
    expect(await exportAuditAction({ period: '7d' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('rejects an unknown period or kind with field issues', async () => {
    signedInAs(await asStaff(db));
    const result = await exportAuditAction({ period: '1y', kind: 'everything' });
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
