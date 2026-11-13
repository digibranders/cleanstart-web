// src/server/jobs/hubspot-poll.ts
import { db, pool } from '@/db/client';
import { systemClock } from '@/lib/clock';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { pollDeals } from '@/server/hubspot/poll';
import { log } from '@/server/log';
import { runLocked } from './lock';

export const runHubspotPoll = async (): Promise<void> => {
  const config = readHubspotConfig();
  if (!config) {
    log.warn({ job: 'hubspot-poll' }, 'HubSpot is not configured; poll skipped');
    return;
  }
  const result = await pollDeals({ db, hs: createHubspot(), pipelineId: config.pipelineId, clock: systemClock });
  if (result.applied > 0 || result.unknown > 0) log.info({ job: 'hubspot-poll', ...result }, 'HubSpot changes applied');
};

export const triggerPoll = (): Promise<boolean> => runLocked(pool, 'hubspot-poll', runHubspotPoll);
