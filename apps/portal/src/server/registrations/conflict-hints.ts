import type { HubspotHintDto } from '@/components/deals/types';
import { conflictingDeals } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';
import { withTimeout } from './hubspot-read';

const HINT_TIMEOUT_MS = 6000;

export interface ConflictInput {
  registrationId: string;
  customerName: string;
  customerDomain: string | null;
  /** The registering partner's HubSpot company, or null when it is not synced yet. */
  partnerHubspotCompanyId: string | null;
}

/**
 * Staff only. For each waiting registration: does another partner hold an open deal on the same HubSpot customer?
 * Read only, one lookup per row, one overall time limit. Failure, timeout or an unset token mean fewer hints, never an error.
 */
export async function hubspotConflictHints(
  hs: HubspotApi | null,
  pipelineId: string | null,
  inputs: readonly ConflictInput[],
): Promise<Record<string, HubspotHintDto>> {
  const hints: Record<string, HubspotHintDto> = {};
  if (!hs || !pipelineId) return hints;
  let stop = false;
  const work = (async (): Promise<void> => {
    for (const input of inputs) {
      if (stop) return;
      const company = await hs.findCompany({ domain: input.customerDomain, name: input.customerName });
      if (!company) continue;
      const open = await conflictingDeals(hs, {
        customerCompanyId: company.id,
        partnerCompanyId: input.partnerHubspotCompanyId ?? '',
        pipelineId,
      });
      if (open.length === 0) continue;
      hints[input.registrationId] = {
        registrationId: input.registrationId,
        holder: open[0]?.properties.partner_name ?? null,
        openDeals: open.length,
      };
    }
  })();
  try {
    if ((await withTimeout(work, HINT_TIMEOUT_MS)) === null) stop = true;
  } catch (error) {
    log.warn({ err: error }, 'HubSpot conflict hints failed');
  }
  return { ...hints };
}
