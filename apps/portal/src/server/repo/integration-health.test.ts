// integration-health.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { integrationHealth, retryFailedOutbox } from './integration-health';

const db = testDb();
beforeEach(() => resetDb(db));

const seedOutbox = async (): Promise<void> => {
  await db.insert(hubspotOutbox).values([
    { op: 'partner.upsert', subjectId: 'a', payload: {}, idempotencyKey: 'a', status: 'pending' },
    { op: 'partner.upsert', subjectId: 'b', payload: {}, idempotencyKey: 'b', status: 'failed', attempts: 6, lastError: 'boom' },
    { op: 'partner.upsert', subjectId: 'c', payload: {}, idempotencyKey: 'c', status: 'failed', attempts: 6, lastError: 'boom' },
    { op: 'partner.upsert', subjectId: 'd', payload: {}, idempotencyKey: 'd', status: 'done' },
  ]);
};

describe('integrationHealth', () => {
  it('reports pending and failed counts and the last poll time', async () => {
    await db.insert(hubspotOutbox).values([
      { op: 'partner.upsert', subjectId: 'a', payload: {}, idempotencyKey: 'a', status: 'pending' },
      { op: 'partner.upsert', subjectId: 'b', payload: {}, idempotencyKey: 'b', status: 'failed', lastError: 'boom' },
    ]);
    await db.insert(hubspotSyncState).values({ key: 'deals_cursor', value: { ms: 1 }, updatedAt: new Date('2026-11-06T10:00:00Z') });
    expect(await integrationHealth(db)).toMatchObject({ pending: 1, failed: 1, lastPollAt: new Date('2026-11-06T10:00:00Z'), lastError: 'boom' });
  });

  it('reads as zeros inside a partner transaction, because row level security hides the outbox', async () => {
    await seedOutbox();
    const partner = await asPartner(db);
    const health = await withViewer(partner, (tx) => integrationHealth(tx));
    expect(health).toEqual({ pending: 0, failed: 0, lastPollAt: null, lastError: null });
  });
});

describe('retryFailedOutbox', () => {
  it('sets failed rows back to pending with attempts 0 for staff and reports how many', async () => {
    await seedOutbox();
    const staff = await asStaff(db, 'partner_manager');
    const count = await withViewer(staff, (tx) => retryFailedOutbox(tx, staff));
    expect(count).toBe(2);
    const rows = await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.idempotencyKey, 'b'));
    expect(rows[0]).toMatchObject({ status: 'pending', attempts: 0, lastError: null });
    expect((await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.status, 'failed')))).toHaveLength(0);
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => retryFailedOutbox(tx, partner))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
