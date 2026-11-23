import { beforeEach, describe, expect, it } from 'vitest';
import { hubspotOutbox } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { ForbiddenError, NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { listFailedSyncs, requeueFailedSync, safeSyncError } from './failed-syncs';

const db = testDb();
beforeEach(() => resetDb(db));

describe('safeSyncError', () => {
  it('trims to 200 characters, masks bearer tokens and passes null through', () => {
    expect(safeSyncError(null)).toBeNull();
    expect(safeSyncError('x'.repeat(500))).toHaveLength(200);
    expect(safeSyncError('401 with header Bearer abc.def-123 rejected')).toBe('401 with header Bearer [hidden] rejected');
    expect(safeSyncError('call failed with pat-na1-0123456789abcdef')).not.toContain('0123456789');
  });
});

describe('listFailedSyncs', () => {
  it('lists only failed jobs, newest first, with the record named and the error trimmed', async () => {
    const staff = await asStaff(db);
    const partner = await makePartner(db, { name: 'Pearl Gulf Bank' });
    await db.insert(hubspotOutbox).values([
      {
        op: 'partner.upsert',
        subjectId: partner.id,
        idempotencyKey: 'a',
        status: 'failed',
        attempts: 5,
        lastError: 'e'.repeat(400),
        payload: { secret: 'do not show' },
        updatedAt: new Date('2026-11-01T10:00:00Z'),
      },
      { op: 'registration.expire', subjectId: 'not-a-uuid', idempotencyKey: 'b', status: 'failed', attempts: 5, updatedAt: new Date('2026-11-02T10:00:00Z') },
      { op: 'user.upsert', subjectId: 'c', idempotencyKey: 'c', status: 'pending' },
      { op: 'user.upsert', subjectId: 'd', idempotencyKey: 'd', status: 'done' },
    ]);
    const rows = await withViewer(staff, (tx) => listFailedSyncs(tx, staff));
    expect(rows.map((r) => r.target)).toEqual(['not-a-uuid', 'Pearl Gulf Bank']);
    expect(rows[1]?.lastError).toHaveLength(200);
    expect(rows[1]?.attempts).toBe(5);
    expect(JSON.stringify(rows)).not.toContain('do not show');
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => listFailedSyncs(tx, partner))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('requeueFailedSync', () => {
  it('sets one failed job back to pending and clears its error', async () => {
    const staff = await asStaff(db);
    const [row] = await db
      .insert(hubspotOutbox)
      .values({ op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'failed', attempts: 5, lastError: 'boom' })
      .returning();
    const op = await withViewer(staff, (tx) => requeueFailedSync(tx, staff, row?.id ?? ''));
    expect(op).toBe('partner.upsert');
    const [after] = await db.select().from(hubspotOutbox);
    expect(after).toMatchObject({ status: 'pending', attempts: 0, lastError: null });
  });

  it('throws NotFoundError for a job that is not failed or does not exist', async () => {
    const staff = await asStaff(db);
    const [row] = await db.insert(hubspotOutbox).values({ op: 'partner.upsert', subjectId: 'a', idempotencyKey: 'a', status: 'pending' }).returning();
    await expect(withViewer(staff, (tx) => requeueFailedSync(tx, staff, row?.id ?? ''))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staff, (tx) => requeueFailedSync(tx, staff, '0b6f7c1e-2f4a-4c7e-9a55-1d3c8e2f9a10'))).rejects.toBeInstanceOf(NotFoundError);
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(
      withViewer(partner, (tx) => requeueFailedSync(tx, partner, '0b6f7c1e-2f4a-4c7e-9a55-1d3c8e2f9a10')),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
