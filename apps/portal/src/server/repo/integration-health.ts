// integration-health.ts
import { strict as assert } from 'node:assert';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';
import type { IntegrationHealthDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { assertStaff, type Tx } from './context';
import { safeSyncError } from './failed-syncs';
import { defineIsolation } from './isolation.registry';

export async function integrationHealth(db: Pick<Db | Tx, 'select'>): Promise<IntegrationHealthDto> {
  const byStatus = await db.select({ status: hubspotOutbox.status, n: count() }).from(hubspotOutbox).groupBy(hubspotOutbox.status);
  const n = (s: string): number => byStatus.find((r) => r.status === s)?.n ?? 0;
  const failed = (await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.status, 'failed')).orderBy(desc(hubspotOutbox.updatedAt)).limit(1))[0];
  const cursor = (await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, 'deals_cursor')))[0];
  return { pending: n('pending'), failed: n('failed'), lastPollAt: cursor?.updatedAt ?? null, lastError: safeSyncError(failed?.lastError ?? null) };
}

/** Partner manager only (the action checks the role; this guard keeps a partner viewer out before RLS runs). */
export async function retryFailedOutbox(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  const rows = await tx.update(hubspotOutbox)
    .set({ status: 'pending', attempts: 0, nextAttemptAt: sql`now()`, lastError: null })
    .where(eq(hubspotOutbox.status, 'failed'))
    .returning({ id: hubspotOutbox.id });
  return rows.length;
}

const exportedFns = { integrationHealth, retryFailedOutbox };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  integrationHealth: {
    scope: 'rls-only',
    probe: (tx) => integrationHealth(tx),
    check: (result) => assert.deepEqual(result, { pending: 0, failed: 0, lastPollAt: null, lastError: null }),
  },
  retryFailedOutbox: {
    scope: 'staff-only',
    probe: (tx, viewer) => retryFailedOutbox(tx, viewer),
    expect: 'forbidden',
  },
});
