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
  for (const reg of due) {
    await deps.db.transaction(async (tx) => {
      await tx.update(registrations).set({ status: 'expired', stage: 'Registration expired', closedOn: today, updatedAt: sql`now()` })
        .where(eq(registrations.id, reg.id));
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
    });
    // After commit; the partner hears about it, and a failure here must never undo or stop an expiry.
    await announceRegistrationChange({ db: deps.db }, { registrationId: reg.id, kind: 'expired' })
      .catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
  }
  return { expired: due.length };
};

export const runExpiry = async (): Promise<void> => {
  const { expired } = await expireRegistrations({ db, clock: systemClock });
  if (expired === 0) return;
  log.info({ job: 'expiry', expired }, 'registrations expired');
  if (!readHubspotConfig()) log.warn({ job: 'expiry', expired }, 'HubSpot is not configured; registration.expire writes wait in the outbox');
};
