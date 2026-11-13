import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  applications,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrationReminders,
  registrations,
} from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ConflictError } from '@/server/errors';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';

/** Declined applications and rejected registrations are kept this long, then removed (the CMS purge jobs use 365 too). */
export const RETENTION_DAYS = 365;
const DAY_MS = 86_400_000;
/** Rows go in batches, one short transaction each, so one run never holds a long lock. */
const BATCH_SIZE = 500;

export interface RetentionResult {
  applications: number;
  registrations: number;
}

interface BatchSteps {
  /** Selects the due ids with FOR UPDATE: a row a concurrent transaction just changed is re-checked against the WHERE and drops out. */
  lock: () => Promise<string[]>;
  removeChildren: (ids: string[]) => Promise<void>;
  /** Deletes the parents (re-checking their status) and returns the ids it really deleted. */
  removeParents: (ids: string[]) => Promise<string[]>;
}

/**
 * One batch, to run inside one transaction. Throws when a parent that was locked was not deleted, so the caller's
 * transaction rolls back the children with it; the next daily run retries.
 */
export async function purgeBatch(steps: BatchSteps): Promise<number> {
  const ids = await steps.lock();
  if (ids.length === 0) return 0;
  await steps.removeChildren(ids);
  const deleted = await steps.removeParents(ids);
  if (deleted.length !== ids.length) {
    throw new ConflictError('retention_batch_mismatch', `locked ${ids.length} rows but deleted ${deleted.length}; batch rolled back`);
  }
  return deleted.length;
}

/**
 * Removes what the applicant or the partner no longer has a reason for us to keep: applications declined and
 * registrations rejected more than RETENTION_DAYS ago, with the contacts, messages, timeline and reminders that hang
 * off a registration. The age counts from the decision (decided_at), falling back to the last update.
 *
 * Never touched: accepted, won, lost, expired and pending registrations, approved and new applications, documents
 * and their old files (document-purge owns those), access requests (portal_app has no DELETE grant on them), and the
 * audit log, which is append only for everyone (contracts B.6).
 *
 * Idempotent: a second run finds nothing due. The clock is an argument so tests pin the cutoff.
 */
export async function purgeExpiredRecords(deps: { clock: Clock; batchSize?: number }): Promise<RetentionResult> {
  const cutoff = new Date(deps.clock.now().getTime() - RETENTION_DAYS * DAY_MS);
  const batchSize = deps.batchSize ?? BATCH_SIZE;
  const result: RetentionResult = { applications: 0, registrations: 0 };

  for (;;) {
    const removed = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
      purgeBatch({
        lock: async () =>
          (
            await tx
              .select({ id: applications.id })
              .from(applications)
              .where(and(eq(applications.status, 'declined'), sql`coalesce(${applications.decidedAt}, ${applications.updatedAt}) < ${cutoff}`))
              .limit(batchSize)
              .for('update')
          ).map((a) => a.id),
        removeChildren: async () => {},
        removeParents: async (ids) =>
          (await tx.delete(applications).where(and(inArray(applications.id, ids), eq(applications.status, 'declined'))).returning({ id: applications.id })).map((a) => a.id),
      }),
    );
    result.applications += removed;
    if (removed < batchSize) break;
  }

  for (;;) {
    // Children first: the foreign keys have no cascade.
    const removed = await withSystem(SYSTEM_ACTORS.portal, (tx) =>
      purgeBatch({
        lock: async () =>
          (
            await tx
              .select({ id: registrations.id })
              .from(registrations)
              .where(and(eq(registrations.status, 'rejected'), sql`coalesce(${registrations.decidedAt}, ${registrations.updatedAt}) < ${cutoff}`))
              .limit(batchSize)
              .for('update')
          ).map((r) => r.id),
        removeChildren: async (ids) => {
          await tx.delete(registrationReminders).where(inArray(registrationReminders.registrationId, ids));
          await tx.delete(registrationContacts).where(inArray(registrationContacts.registrationId, ids));
          await tx.delete(registrationMessages).where(inArray(registrationMessages.registrationId, ids));
          await tx.delete(registrationEvents).where(inArray(registrationEvents.registrationId, ids));
        },
        removeParents: async (ids) =>
          (await tx.delete(registrations).where(and(inArray(registrations.id, ids), eq(registrations.status, 'rejected'))).returning({ id: registrations.id })).map((r) => r.id),
      }),
    );
    result.registrations += removed;
    if (removed < batchSize) break;
  }
  return result;
}

/** The scheduled job (src/server/jobs/index.ts, daily 03:40 UTC, one run at a time through the advisory lock). Counts only; no names reach the log. */
export const runRetention = async (): Promise<void> => {
  const result = await purgeExpiredRecords({ clock: systemClock });
  log.info({ job: 'retention', ...result }, 'retention purge finished');
};
