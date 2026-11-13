import { hubspotForRequest } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';

/** The read only HubSpot client for a request (H's `hubspotForRequest`, contracts H.13c), or null when HubSpot is not configured. Never throws. */
export function readOnlyHubspot(): HubspotApi | null {
  try {
    return hubspotForRequest()?.hs ?? null;
  } catch (error) {
    log.warn({ err: error }, 'HubSpot is not available for a read only lookup');
    return null;
  }
}

/** Resolves to null when `work` takes longer than `ms`. A request must never wait on HubSpot. */
export async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}
