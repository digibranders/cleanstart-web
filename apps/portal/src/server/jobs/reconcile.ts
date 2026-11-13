// src/server/jobs/reconcile.ts
import { db } from '@/db/client';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { reconcileDeals } from '@/server/hubspot/poll';
import { log } from '@/server/log';

export const runReconcile = async (): Promise<void> => {
  if (!readHubspotConfig()) {
    log.warn({ job: 'hubspot-reconcile' }, 'HubSpot is not configured; reconcile skipped');
    return;
  }
  const result = await reconcileDeals({ db, hs: createHubspot() });
  if (result.missing > 0) log.warn({ job: 'hubspot-reconcile', ...result }, 'deals missing in HubSpot');
};
