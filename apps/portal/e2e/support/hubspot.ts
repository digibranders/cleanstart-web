// Must be first: sets the database and the fakes before any src/ module reads the environment.
import './env';
import { fixedClock, systemClock } from '@/lib/clock';
import { FakeHubspot } from '@/server/hubspot/fake';
import { buildHandlers } from '@/server/hubspot/handlers';
import { drainOutbox } from '@/server/hubspot/outbox';
import { type PollResult, pollDeals } from '@/server/hubspot/poll';
import { db } from './db';
import { E2E } from './env';

/** The one in-memory HubSpot of the run. The app process never talks to it: the test process plays the scheduler. */
export const hubspot = new FakeHubspot();

/**
 * Runs the outbox drain the way the scheduled job would, until it has nothing due. A handler that waits for a
 * related record reschedules itself a minute out, so later passes use a clock that is two minutes ahead.
 */
export async function drainOutboxNow(): Promise<void> {
  const handlers = buildHandlers(db(), hubspot, E2E.pipelineId);
  for (let pass = 0; pass < 4; pass += 1) {
    const clock = pass === 0 ? systemClock : fixedClock(new Date(Date.now() + pass * 120_000).toISOString());
    const result = await drainOutbox({ db: db(), handlers, clock });
    if (result.done + result.retried + result.failed + result.waiting === 0) return;
  }
}

/** One inbound poll, as the five minute job would run it. */
export function pollNow(): Promise<PollResult> {
  return pollDeals({ db: db(), hs: hubspot, pipelineId: E2E.pipelineId, clock: systemClock });
}
