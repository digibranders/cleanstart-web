// outbox.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { withViewer } from '@/server/repo/context';
import { drainOutbox, enqueue, type Handlers } from './outbox';
import { DependencyPending, HubspotError } from './types';

const db = testDb();
beforeEach(() => resetDb(db));

// New rows are due from the database's now(), so the fixed clock sits after any real date the tests can run on.
const clock = fixedClock('2099-01-01T10:00:00Z');
const NOW = clock.now();
const row = async (): Promise<typeof hubspotOutbox.$inferSelect> =>
  (await db.select().from(hubspotOutbox))[0]!;

describe('enqueue', () => {
  it('ignores a duplicate with the same idempotency key', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });

  it('builds the key from the op, the subject and the version', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793959320000' });
    expect((await row()).idempotencyKey).toBe('registration.create:r1:1793959320000');
  });

  it('treats a second decision time as a new operation (accept, undo, accept again)', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793959320000' });
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793962920000' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(2);
  });

  it('can be called inside a viewer transaction, where the handle is a transaction', async () => {
    const viewer = await asPartner(db);
    await withViewer(viewer, (tx) => enqueue(tx, { op: 'partner.upsert', subjectId: viewer.partnerId, version: '1' }));
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('enqueue from two viewers', () => {
  it('stores one row and raises no error when two partner viewers insert the same key', async () => {
    const [a, b] = [await asPartner(db), await asPartner(db)];
    const input = { op: 'partner.upsert' as const, subjectId: 'shared-subject', version: '1' };
    await withViewer(a, (tx) => enqueue(tx, input));
    await expect(withViewer(b, (tx) => enqueue(tx, input))).resolves.toBeUndefined();
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('drainOutbox', () => {
  it('marks a successful operation done', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers: Handlers = { 'partner.upsert': vi.fn().mockResolvedValue(undefined) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out).toEqual({ done: 1, retried: 0, failed: 0, waiting: 0 });
    expect((await row()).status).toBe('done');
  });

  it('retries with backoff and records the error', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new HubspotError(500, 'x', 'boom')) } as unknown as Handlers;
    await drainOutbox({ db, handlers, clock });
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 1, lastError: 'boom' });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('truncates a long error to 500 characters on retry, wait and failure', async () => {
    const long = 'x'.repeat(2000);
    const pending = async (err: Error, attempts: number): Promise<typeof hubspotOutbox.$inferSelect> => {
      await resetDb(db);
      await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
      await db.update(hubspotOutbox).set({ attempts });
      const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(err) } as unknown as Handlers;
      await drainOutbox({ db, handlers, clock });
      return row();
    };
    expect((await pending(new Error(long), 0)).lastError).toHaveLength(500);
    expect((await pending(new DependencyPending(long), 0)).lastError).toHaveLength(500);
    const failed = await pending(new Error(long), 5);
    expect(failed.status).toBe('failed');
    expect(failed.lastError).toHaveLength(500);
  });

  it('marks the operation failed after the fifth attempt', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ attempts: 5 }).where(eq(hubspotOutbox.op, 'partner.upsert'));
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new Error('still broken')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out.failed).toBe(1);
    expect((await row()).status).toBe('failed');
  });

  it('reschedules a dependency wait without counting an attempt', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    const handlers = { 'registration.create': vi.fn().mockRejectedValue(new DependencyPending('partner not synced')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out.waiting).toBe(1);
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 0 });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('skips rows that are not due yet', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ nextAttemptAt: new Date(NOW.getTime() + 1000) });
    const handler = vi.fn();
    const out = await drainOutbox({ db, handlers: { 'partner.upsert': handler } as unknown as Handlers, clock });
    expect(handler).not.toHaveBeenCalled();
    expect(out).toEqual({ done: 0, retried: 0, failed: 0, waiting: 0 });
  });

  it('lets two concurrent drains handle each row once (FOR UPDATE SKIP LOCKED)', async () => {
    for (const id of ['a', 'b', 'c', 'd']) await enqueue(db, { op: 'partner.upsert', subjectId: id, version: '1' });
    const handler = vi.fn(async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    const handlers = { 'partner.upsert': handler } as unknown as Handlers;
    const [first, second] = await Promise.all([drainOutbox({ db, handlers, clock }), drainOutbox({ db, handlers, clock })]);
    expect(first.done + second.done).toBe(4);
    expect(handler).toHaveBeenCalledTimes(4);
  });
});
