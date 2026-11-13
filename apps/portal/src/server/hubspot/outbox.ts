// outbox.ts
import { and, eq, lte, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Db } from '@/db/client';
import { hubspotOutbox } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { OutboxOp } from '@/lib/domain';
import type { Tx } from '@/server/repo/context';
import { nextDelayMs } from './mappers';
import { DependencyPending } from './types';

export type { OutboxOp };

const MAX_ERROR_LENGTH = 500;

export type Handlers = Record<OutboxOp, (subjectId: string, payload: Record<string, unknown>) => Promise<void>>;

/** Contracts G. Safe inside withViewer: hubspot_outbox allows INSERT for every identity. */
export async function enqueue(
  tx: Pick<Db | Tx, 'insert'>,
  input: { op: OutboxOp; subjectId: string; version: string; payload?: Record<string, unknown> },
): Promise<void> {
  // No conflict target: naming one makes Postgres require SELECT on the arbiter column, and a partner transaction has no SELECT policy on this table.
  await tx.insert(hubspotOutbox).values({
    op: input.op,
    subjectId: input.subjectId,
    payload: input.payload ?? {},
    idempotencyKey: `${input.op}:${input.subjectId}:${input.version}`,
  }).onConflictDoNothing();
}

export interface DrainResult { done: number; retried: number; failed: number; waiting: number }

// shortcut: rows stay locked while their HubSpot calls run (batch of 20; the advisory lock skips a tick while a drain is still running); move to
// a claimed status with a lease if a single drain ever needs more than that.
export const drainOutbox = async (deps: {
  db: Db; handlers: Handlers; clock: Clock; batch?: number;
}): Promise<DrainResult> => {
  const result: DrainResult = { done: 0, retried: 0, failed: 0, waiting: 0 };
  await deps.db.transaction(async (tx) => {
    const due = await tx.select().from(hubspotOutbox)
      .where(and(eq(hubspotOutbox.status, 'pending'), lte(hubspotOutbox.nextAttemptAt, deps.clock.now())))
      .orderBy(hubspotOutbox.createdAt).limit(deps.batch ?? 20).for('update', { skipLocked: true });

    for (const row of due) {
      try {
        await deps.handlers[row.op](row.subjectId, row.payload);
        await tx.update(hubspotOutbox).set({ status: 'done', lastError: null, updatedAt: sql`now()` }).where(eq(hubspotOutbox.id, row.id));
        result.done += 1;
      } catch (err) {
        const message = (err instanceof Error ? err.message : String(err)).slice(0, MAX_ERROR_LENGTH);
        if (err instanceof DependencyPending) {
          await tx.update(hubspotOutbox).set({ nextAttemptAt: new Date(deps.clock.now().getTime() + 60_000), lastError: message }).where(eq(hubspotOutbox.id, row.id));
          result.waiting += 1;
          continue;
        }
        const attempts = row.attempts + 1;
        const delay = nextDelayMs(attempts);
        if (delay === null) {
          await tx.update(hubspotOutbox).set({ status: 'failed', attempts, lastError: message }).where(eq(hubspotOutbox.id, row.id));
          Sentry.captureException(err, { tags: { op: row.op }, extra: { subjectId: row.subjectId } });
          result.failed += 1;
        } else {
          await tx.update(hubspotOutbox).set({ attempts, lastError: message, nextAttemptAt: new Date(deps.clock.now().getTime() + delay) }).where(eq(hubspotOutbox.id, row.id));
          result.retried += 1;
        }
      }
    }
  });
  return result;
};
