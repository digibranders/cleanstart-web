// lookup.ts
import { createHubspot, readHubspotConfig } from './client';
import type { HsDeal, HubspotApi } from './types';

/**
 * The read only client for a request path (contracts H.13c): null when HubSpot is not configured, otherwise the client
 * and the pipeline id. Track R calls this and nothing else of the client; a thrown error from createHubspot() is the
 * caller's "no suggestions".
 */
export const hubspotForRequest = (): { hs: HubspotApi; pipelineId: string } | null => {
  const config = readHubspotConfig();
  return config ? { hs: createHubspot(), pipelineId: config.pipelineId } : null;
};

export const lookupCustomer = async (hs: HubspotApi, query: string): Promise<Array<{ name: string; domain: string | null }>> => {
  if (query.trim().length < 3) return [];
  const found = await hs.searchCompanies(query.trim());
  return found.flatMap((c) => (c.name ? [{ name: c.name, domain: c.domain }] : []));
};

export const conflictingDeals = async (
  hs: HubspotApi,
  input: { customerCompanyId: string; partnerCompanyId: string; pipelineId: string },
): Promise<HsDeal[]> => {
  const open = await hs.listOpenDealsForCompany(input.customerCompanyId, input.pipelineId);
  return open.filter((d) => d.properties.partner_company_id && d.properties.partner_company_id !== input.partnerCompanyId);
};
