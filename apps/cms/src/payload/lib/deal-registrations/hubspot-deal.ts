import { Client } from '@hubspot/api-client';
import type { BasePayload } from 'payload';

import { type HubspotCredentials, resolveHubspotCredentials } from '../integrations/credentials';
import { buildDealProperties } from './deal-name';
import type { DealRegistrationSubmission } from './schema';

export type DealSyncResult =
  | { status: 'synced'; dealId: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

interface IntegrationRowLite {
  id: string | number;
  kind: string;
  enabled: boolean;
  source: 'db' | 'env' | null;
  hubspotConfig?: {
    writeMode?: 'contactOnly' | 'contactAndLead' | null;
    fieldMapping?: Array<{
      submissionField?: string | null;
      hubspotProperty?: string | null;
    }> | null;
    defaultLifecycleStage?: string | null;
    defaultLeadStatus?: string | null;
  } | null;
}

const findActiveRow = async (
  payload: BasePayload,
): Promise<{ creds: HubspotCredentials } | null> => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { equals: 'hubspotCrm' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const row = result.docs[0] as unknown as IntegrationRowLite | undefined;
    if (!row) return null;
    const creds = resolveHubspotCredentials(row);
    if (!creds) return null;
    return { creds };
  } catch {
    return null;
  }
};

export const createHubspotDeal = async (
  payload: BasePayload,
  sub: DealRegistrationSubmission,
  cfg: { pipeline: string; stage: string },
): Promise<DealSyncResult> => {
  const found = await findActiveRow(payload);
  if (!found) return { status: 'skipped', reason: 'no-active-hubspot-integration' };

  const client = new Client({ accessToken: found.creds.accessToken, numberOfApiCallRetries: 3 });

  try {
    const upsertResp = await client.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/contacts/batch/upsert',
      body: {
        inputs: [
          {
            idProperty: 'email',
            id: sub.prospect.email,
            properties: {
              email: sub.prospect.email,
              firstname: sub.prospect.firstName,
              lastname: sub.prospect.lastName,
              ...(sub.prospect.phone ? { phone: sub.prospect.phone } : {}),
            },
          },
          {
            idProperty: 'email',
            id: sub.partnerRep.email,
            properties: {
              email: sub.partnerRep.email,
              firstname: sub.partnerRep.firstName,
              lastname: sub.partnerRep.lastName,
              ...(sub.partnerRep.phone ? { phone: sub.partnerRep.phone } : {}),
            },
          },
        ],
      },
    });
    const upserted = (await upsertResp.json()) as { results?: Array<{ id: string }> };
    const contactIds = (upserted.results ?? []).map((r) => r.id).filter(Boolean);

    const dealResp = await client.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/deals',
      body: { properties: buildDealProperties(sub, cfg) },
    });
    const deal = (await dealResp.json()) as { id: string };

    for (const contactId of contactIds) {
      try {
        await client.apiRequest({
          method: 'PUT',
          path: `/crm/v4/objects/deals/${deal.id}/associations/default/contacts/${contactId}`,
        });
      } catch (err) {
        payload.logger?.warn?.(
          { dealId: deal.id, contactId, err: err instanceof Error ? err.message : String(err) },
          'deal-registration: contact association failed (non-fatal)',
        );
      }
    }

    return { status: 'synced', dealId: deal.id };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
};
