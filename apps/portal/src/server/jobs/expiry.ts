// src/server/jobs/expiry.ts
import { and, eq, lt, sql } from 'drizzle-orm';
import { db, type Db } from '@/db/client';
import { registrationEvents, registrations } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { PRODUCT_LABEL } from '@/lib/domain';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { readHubspotConfig } from '@/server/hubspot/client';
import { enqueue } from '@/server/hubspot/outbox';
import { log } from '@/server/log';
import { announceRegistrationChange } from '@/server/registrations/announce';

export const expireRegistrations = async (deps: { db: Db; clock: Clock }): Promise<{ expired: number }> => {
  const today = deps.clock.today();
  const due = await deps.db.select().from(registrations)
    .where(and(eq(registrations.status, 'accepted'), lt(registrations.protectionEnd, today)));
  let expired = 0;
  let failed = 0;
  for (const reg of due) {
    try {
      const done = await deps.db.transaction(async (tx) => {
        // The guard repeats the due test: an extension granted after the list was read must win over the expiry.
        const updated = await tx.update(registrations).set({ status: 'expired', stage: 'Registration expired', closedOn: today, updatedAt: sql`now()` })
          .where(and(eq(registrations.id, reg.id), eq(registrations.status, 'accepted'), lt(registrations.protectionEnd, today)))
          .returning({ id: registrations.id });
        if (updated.length === 0) return false;
        await tx.insert(registrationEvents).values({
          registrationId: reg.id, text: 'Protection ended, registration expired', byLabel: 'Portal', source: 'system',
        });
        await recordAudit(tx, SYSTEM_ACTORS.portal, {
          event: 'registration.expired',
          source: 'system',
          target: `${reg.customerName}, ${PRODUCT_LABEL[reg.product]}`,
          note: `Protection ended on ${reg.protectionEnd ?? today}`,
          partnerId: reg.partnerId,
          subject: { type: 'registration', id: reg.id },
        });
        await enqueue(tx, { op: 'registration.expire', subjectId: reg.id, version: today });
        return true;
      });
      if (!done) continue;
      expired += 1;
    } catch (error) {
      // One bad row must not stop the rest; the id and the error class are logged, never the customer name.
      failed += 1;
      log.error({ job: 'expiry', registrationId: reg.id, error: error instanceof Error ? error.name : 'unknown' }, 'could not expire a registration');
      continue;
    }
    // After commit; the partner hears about it, and a failure here must never undo or stop an expiry.
    await announceRegistrationChange({ db: deps.db }, { registrationId: reg.id, kind: 'expired' })
      .catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
  }
  if (failed > 0) throw new Error(`${failed} registration(s) failed to expire; the others were expired`);
  return { expired };
};

export const runExpiry = async (): Promise<void> => {
  const { expired } = await expireRegistrations({ db, clock: systemClock });
  if (expired === 0) return;
  log.info({ job: 'expiry', expired }, 'registrations expired');
  if (!readHubspotConfig()) log.warn({ job: 'expiry', expired }, 'HubSpot is not configured; registration.expire writes wait in the outbox');
};
