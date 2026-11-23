import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { requireActionViewer } from '@/server/auth/viewer';
import { exportAuditAction, requeueFailedSyncAction, retryFailedOutboxAction } from './audit';

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

describe('retryFailedOutboxAction', () => {
  it('puts failed rows back to pending and writes one audit entry', async () => {
    const staff = await asStaff(db, 'partner_manager');
    signedInAs(staff);
    await db.insert(hubspotOutbox).values([
      { op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'failed', attempts: 6, lastError: 'boom' },
      { op: 'partner.upsert', subjectId: 'b', idempotencyKey: 'b', status: 'done' },
    ]);
    expect(await retryFailedOutboxAction({})).toEqual({ ok: true, data: { retried: 1 } });
    const rows = await db.select().from(hubspotOutbox);
    expect(rows.find((r) => r.subjectId === 'a')).toMatchObject({ status: 'pending', attempts: 0 });
    const audit = await db.select().from(auditLog);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event: 'integration.outbox_retried', target: '1 failed HubSpot sync', actorId: staff.id });
  });

  it('writes no audit entry when nothing failed, so a second click changes nothing', async () => {
    signedInAs(await asStaff(db, 'partner_manager'));
    await db.insert(hubspotOutbox).values({ op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'failed', attempts: 6 });
    expect(await retryFailedOutboxAction({})).toEqual({ ok: true, data: { retried: 1 } });
    expect(await retryFailedOutboxAction({})).toEqual({ ok: true, data: { retried: 0 } });
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });

  it('is forbidden for everyone but a partner manager', async () => {
    signedInAs(await asStaff(db, 'marketing'));
    expect(await retryFailedOutboxAction({})).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('requeueFailedSyncAction', () => {
  it('requeues one failed job, leaves the others, and writes one audit entry', async () => {
    const staff = await asStaff(db, 'partner_manager');
    signedInAs(staff);
    const [a, b] = await db
      .insert(hubspotOutbox)
      .values([
        { op: 'registration.create', subjectId: 'a', idempotencyKey: 'a', status: 'failed', attempts: 5, lastError: 'boom' },
        { op: 'partner.upsert', subjectId: 'b', idempotencyKey: 'b', status: 'failed', attempts: 5, lastError: 'boom' },
      ])
      .returning();
    expect(await requeueFailedSyncAction({ id: a?.id })).toEqual({ ok: true, data: { requeued: true } });
    const rows = await db.select().from(hubspotOutbox);
    expect(rows.find((r) => r.id === a?.id)).toMatchObject({ status: 'pending', attempts: 0, lastError: null });
    expect(rows.find((r) => r.id === b?.id)).toMatchObject({ status: 'failed', attempts: 5 });
    const audit = await db.select().from(auditLog);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event: 'integration.sync_requeued', target: 'registration.create', actorId: staff.id });
  });

  it('answers not found for a job that is no longer failed, and writes nothing', async () => {
    signedInAs(await asStaff(db, 'partner_manager'));
    const [row] = await db.insert(hubspotOutbox).values({ op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'done' }).returning();
    expect(await requeueFailedSyncAction({ id: row?.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });

  it('is forbidden for staff sales and partner users', async () => {
    const id = '0b6f7c1e-2f4a-4c7e-9a55-1d3c8e2f9a10';
    signedInAs(await asStaff(db, 'sales', 'india'));
    expect(await requeueFailedSyncAction({ id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    signedInAs(await asPartner(db));
    expect(await requeueFailedSyncAction({ id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
