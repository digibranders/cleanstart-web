// failed-syncs.ts
import { and, desc, eq, inArray } from 'drizzle-orm';
import { hubspotOutbox, partners, registrations, users } from '@/db/schema';
import type { OutboxOp } from '@/lib/domain';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface FailedSyncDto {
  id: string;
  op: OutboxOp;
  /** The record the job was about, by name where it can be found, otherwise the stored id. */
  target: string;
  attempts: number;
  /** At most 200 characters, with bearer tokens and keys masked. Never the job payload. */
  lastError: string | null;
  /** When the job last changed, which for a failed job is when it gave up. */
  at: Date;
}

const LIST_LIMIT = 100;
const ERROR_MAX = 200;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Trims an upstream error for display and masks anything that looks like a credential. */
export function safeSyncError(raw: string | null): string | null {
  if (!raw) return null;
  const masked = raw
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [hidden]')
    .replace(/\b(pat|sk|key|token)[-_][A-Za-z0-9-_]{8,}/gi, '[hidden]');
  return masked.length > ERROR_MAX ? `${masked.slice(0, ERROR_MAX - 1)}…` : masked;
}

/** Partner manager only. Failed HubSpot sync jobs, most recent first, capped at 100. */
export async function listFailedSyncs(tx: Tx, viewer: Viewer): Promise<FailedSyncDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select()
    .from(hubspotOutbox)
    .where(eq(hubspotOutbox.status, 'failed'))
    .orderBy(desc(hubspotOutbox.updatedAt))
    .limit(LIST_LIMIT);

  const idsFor = (prefix: string): string[] =>
    rows.filter((r) => r.op.startsWith(prefix) && UUID.test(r.subjectId)).map((r) => r.subjectId);
  const partnerIds = idsFor('partner.');
  const userIds = idsFor('user.');
  const registrationIds = idsFor('registration.');
  const names = new Map<string, string>();
  if (partnerIds.length) {
    const found = await tx.select({ id: partners.id, name: partners.name }).from(partners).where(inArray(partners.id, partnerIds));
    for (const p of found) names.set(p.id, p.name);
  }
  if (userIds.length) {
    const found = await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
    for (const u of found) names.set(u.id, u.name);
  }
  if (registrationIds.length) {
    const found = await tx
      .select({ id: registrations.id, reference: registrations.reference, customer: registrations.customerName })
      .from(registrations)
      .where(inArray(registrations.id, registrationIds));
    for (const r of found) names.set(r.id, `${r.customer} (${r.reference})`);
  }

  return rows.map((r) => ({
    id: r.id,
    op: r.op,
    target: names.get(r.subjectId) ?? r.subjectId,
    attempts: r.attempts,
    lastError: safeSyncError(r.lastError),
    at: r.updatedAt,
  }));
}

/** Partner manager only. Puts one failed job back in the queue. Throws NotFoundError if it is not failed, so a second click changes nothing. */
export async function requeueFailedSync(tx: Tx, viewer: Viewer, id: string): Promise<OutboxOp> {
  assertStaff(viewer);
  const [row] = await tx
    .update(hubspotOutbox)
    .set({ status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null })
    .where(and(eq(hubspotOutbox.id, id), eq(hubspotOutbox.status, 'failed')))
    .returning({ op: hubspotOutbox.op });
  if (!row) throw new NotFoundError('failed sync');
  return row.op;
}

const exportedFns = { listFailedSyncs, requeueFailedSync, safeSyncError };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  listFailedSyncs: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => listFailedSyncs(tx, viewer),
  },
  requeueFailedSync: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer) => requeueFailedSync(tx, viewer, '00000000-0000-4000-8000-000000000000'),
  },
  safeSyncError: { scope: 'exempt', reason: 'A pure string helper that does no data access.' },
});
