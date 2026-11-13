// poll.ts
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { hubspotOutbox, hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { PRODUCT_LABEL } from '@/lib/domain';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { log } from '@/server/log';
import { announceRegistrationChange, type RegistrationChange } from '@/server/registrations/announce';
import { decideInbound, isoDate } from './mappers';
import type { HsDeal, HubspotApi } from './types';

const CURSOR_KEY = 'deals_cursor';
/** HubSpot search indexing lags by a few seconds, so each poll re-reads a minute of overlap. Applying is idempotent. */
const OVERLAP_MS = 60_000;

export interface PollResult { applied: number; unchanged: number; unknown: number }

/**
 * True when the portal's end date must win over the one HubSpot reports for this registration in this pass: an
 * extension write (`registration.update_end`) is still queued or has failed, so HubSpot holds the old date, or the
 * registration has a granted extension and HubSpot reports an earlier date than ours (search index lag after the write
 * was sent). The portal's extension is never moved backwards by the poll; a later date typed in HubSpot still applies.
 */
const portalEndDateWins = async (
  db: Db,
  reg: { id: string; protectionEnd: string | null; extensionStatus: string },
  incomingEnd: string | null,
): Promise<boolean> => {
  if (reg.extensionStatus === 'granted' && incomingEnd !== null && reg.protectionEnd !== null && incomingEnd < reg.protectionEnd) return true;
  const [queued] = await db.select({ id: hubspotOutbox.id }).from(hubspotOutbox)
    .where(and(
      eq(hubspotOutbox.op, 'registration.update_end'),
      eq(hubspotOutbox.subjectId, reg.id),
      inArray(hubspotOutbox.status, ['pending', 'failed']),
    ))
    .limit(1);
  return queued !== undefined;
};

/** What partners are told after a change commits. An echo of our own expiry (the portal already expired it) says nothing. */
const announcementFor = (
  reg: { id: string; status: string },
  change: { status: string; stage: string; changed: 'stage' | 'protection_end'; protectionEnd: string | null },
): RegistrationChange | null => {
  if (change.status === 'expired') return reg.status === 'expired' ? null : { registrationId: reg.id, kind: 'expired' };
  if (change.changed === 'stage') return { registrationId: reg.id, kind: 'stage_changed', stage: change.stage };
  return change.protectionEnd ? { registrationId: reg.id, kind: 'protection_end_changed', protectionEnd: change.protectionEnd } : null;
};

export const pollDeals = async (deps: {
  db: Db; hs: HubspotApi; pipelineId: string; clock: Clock;
}): Promise<PollResult> => {
  const { db, hs } = deps;
  const state = (await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, CURSOR_KEY)))[0];
  const cursor = (state?.value as { ms?: number } | undefined)?.ms ?? 0;
  const stageIds = await hs.getStageIds(deps.pipelineId);
  const labelById = Object.fromEntries(Object.entries(stageIds).map(([label, id]) => [id, label]));

  const result: PollResult = { applied: 0, unchanged: 0, unknown: 0 };
  let newest = cursor;
  let failed = 0;
  let after: string | null = null;
  do {
    const page = await hs.searchDealsModifiedSince(deps.pipelineId, Math.max(0, cursor - OVERLAP_MS), after);
    for (const deal of page.deals) {
      newest = Math.max(newest, deal.modifiedAt);
      try {
        const reg = (await db.select().from(registrations).where(eq(registrations.hubspotDealId, deal.id)))[0];
        if (!reg) { result.unknown += 1; continue; }
        const seen: HsDeal = await portalEndDateWins(db, reg, isoDate(deal.properties.protection_end_date))
          ? { ...deal, properties: { ...deal.properties, protection_end_date: null } }
          : deal;
        const change = decideInbound(
          { status: reg.status, hubspotStageId: reg.hubspotStageId, protectionEnd: reg.protectionEnd },
          seen, labelById, deps.clock.today(),
        );
        if (!change) { result.unchanged += 1; continue; }
        await db.transaction(async (tx) => {
          await tx.update(registrations).set({
            status: change.status, stage: change.stage, hubspotStageId: change.stageId, hubspotSyncedAt: deps.clock.now(),
            hubspotMissing: false, ...(change.closedOn ? { closedOn: change.closedOn } : {}),
            ...(change.protectionEnd ? { protectionEnd: change.protectionEnd } : {}),
          }).where(eq(registrations.id, reg.id));
          await tx.insert(registrationEvents).values({
            registrationId: reg.id, text: change.eventText, byLabel: 'HubSpot', source: 'crm',
          });
          await recordAudit(tx, SYSTEM_ACTORS.hubspot, {
            event: change.changed === 'stage' ? 'registration.stage_changed' : 'registration.protection_end_changed',
            source: 'crm',
            target: `${reg.customerName}, ${PRODUCT_LABEL[reg.product]}`,
            note: change.eventText,
            partnerId: reg.partnerId,
            subject: { type: 'registration', id: reg.id },
          });
        });
        result.applied += 1;
        const announcement = announcementFor(reg, change);
        if (announcement) {
          await announceRegistrationChange({ db }, announcement).catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
        }
      } catch (error) {
        // One bad deal must not stop the others. The cursor is held below, so this deal is read again next time.
        failed += 1;
        log.error({ job: 'hubspot-poll', dealId: deal.id, error: error instanceof Error ? error.name : 'unknown' }, 'could not apply a deal');
      }
    }
    after = page.next;
  } while (after);

  if (failed > 0) throw new Error(`${failed} deal(s) failed to apply; the others were applied and the cursor was not moved`);

  // Written after every successful run, even when nothing moved: updated_at is the last poll time the health card reports.
  await db.insert(hubspotSyncState).values({ key: CURSOR_KEY, value: { ms: newest } })
    .onConflictDoUpdate({ target: hubspotSyncState.key, set: { value: { ms: newest } } });
  return result;
};

export const reconcileDeals = async (deps: { db: Db; hs: HubspotApi }): Promise<{ checked: number; missing: number }> => {
  const rows = await deps.db.select().from(registrations)
    .where(and(isNotNull(registrations.hubspotDealId), inArray(registrations.status, ['accepted', 'expired'])));
  const ids = rows.map((r) => r.hubspotDealId!).filter(Boolean);
  const found = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    for (const d of await deps.hs.readDeals(ids.slice(i, i + 100))) found.add(d.id);
  }
  let missing = 0;
  for (const r of rows) {
    const gone = !found.has(r.hubspotDealId!);
    if (gone) missing += 1;
    if (gone !== r.hubspotMissing) {
      await deps.db.update(registrations).set({ hubspotMissing: gone }).where(eq(registrations.id, r.id));
    }
  }
  return { checked: rows.length, missing };
};
