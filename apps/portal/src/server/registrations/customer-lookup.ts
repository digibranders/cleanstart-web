import type { CrmSuggestion } from '@/components/deals/types';
import { lookupCustomer } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';
import { withTimeout } from './hubspot-read';

const LOOKUP_TIMEOUT_MS = 4000;

/** Companies HubSpot knows by name or domain: name and website only. Any failure or timeout means no suggestions. */
export async function crmSuggestions(hs: HubspotApi | null, query: string): Promise<CrmSuggestion[]> {
  if (!hs) return [];
  try {
    const found = await withTimeout(lookupCustomer(hs, query), LOOKUP_TIMEOUT_MS);
    return (found ?? []).map((c) => ({ name: c.name, website: c.domain }));
  } catch (error) {
    log.warn({ err: error }, 'HubSpot customer lookup failed');
    return [];
  }
}
