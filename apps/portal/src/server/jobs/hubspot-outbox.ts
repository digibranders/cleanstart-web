// src/server/jobs/hubspot-outbox.ts
import { db } from '@/db/client';
import { systemClock } from '@/lib/clock';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { buildHandlers } from '@/server/hubspot/handlers';
import { drainOutbox } from '@/server/hubspot/outbox';
import { log } from '@/server/log';

export const runHubspotOutbox = async (): Promise<void> => {
  const config = readHubspotConfig();
  if (!config) {
    log.warn({ job: 'hubspot-outbox' }, 'HubSpot is not configured; outbox left as is');
    return;
  }
  const result = await drainOutbox({
    db,
    handlers: buildHandlers(db, createHubspot(), config.pipelineId, systemClock),
    clock: systemClock,
  });
  if (result.done + result.retried + result.failed + result.waiting > 0) log.info({ job: 'hubspot-outbox', ...result }, 'outbox drained');
};
