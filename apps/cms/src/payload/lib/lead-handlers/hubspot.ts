import { Client } from '@hubspot/api-client';
import type { BasePayload } from 'payload';

import { resolveHubspotCredentials, type HubspotCredentials } from '../integrations/credentials';
import { extractEmail, extractName } from './extract-fields';
import type { LeadHandler, LeadHandlerResult, LeadSubmission } from './types';

/**
 * HubSpot CRM lead handler — Phase J3.
 *
 * Auth: HubSpot **Private App** access token from
 *   `HUBSPOT_PRIVATE_APP_TOKEN` env var. The token is set once via
 *   Coolify; the per-row admin UI carries only optional mapping +
 *   default-property overrides.
 *
 * Write path: `POST /crm/v3/objects/contacts/batch/upsert` with
 *   `idProperty=email` so the same email updates rather than creates
 *   a duplicate. Defaults `lifecyclestage=lead`, `hs_lead_status=NEW`
 *   unless the row overrides via `hubspotConfig.defaultLifecycleStage`
 *   / `defaultLeadStatus`.
 */

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
): Promise<{ row: IntegrationRowLite; creds: HubspotCredentials } | null> => {
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
    return { row, creds };
  } catch {
    return null;
  }
};

const mapProperties = (
  submission: LeadSubmission,
  creds: HubspotCredentials,
  email: string,
  fullName: string | null,
): Record<string, string> => {
  const properties: Record<string, string> = { email };
  if (fullName) {
    const [first, ...rest] = fullName.split(' ');
    if (first) properties.firstname = first;
    if (rest.length > 0) properties.lastname = rest.join(' ');
  }
  for (const [submissionKey, hubspotProp] of Object.entries(creds.fieldMapping)) {
    const v = submission.fields[submissionKey];
    if (typeof v === 'string' && v.length > 0) properties[hubspotProp] = v;
  }
  return {
    ...creds.defaultProperties,
    ...properties,
  };
};

const isRateLimitDaily = (err: unknown): boolean => {
  const message = err instanceof Error ? err.message : String(err);
  return /DAILY/i.test(message);
};

/**
 * Permanently delete a HubSpot contact by email — GDPR Art. 17.
 * Returns true if the call returned 2xx.
 */
export const hubspotGdprDeleteByEmail = async (
  payload: BasePayload,
  email: string,
): Promise<boolean> => {
  const found = await findActiveRow(payload);
  if (!found) return false;
  const client = new Client({
    accessToken: found.creds.accessToken,
    numberOfApiCallRetries: 3,
  });
  try {
    await client.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/contacts/gdpr-delete',
      body: { idProperty: 'email', objectId: email },
    });
    return true;
  } catch {
    return false;
  }
};

export const hubspotHandler: LeadHandler = {
  name: 'hubspot',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx): Promise<LeadHandlerResult> {
    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'hubspot', status: 'skipped', reason: 'duplicate-submission' };
    }

    const found = await findActiveRow(ctx.payload);
    if (!found) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-active-row-or-token' };
    }

    const email = extractEmail(ctx.formFieldDefs, submission.fields);
    if (!email) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-email' };
    }
    const fullName = extractName(ctx.formFieldDefs, submission.fields);
    const properties = mapProperties(submission, found.creds, email, fullName);

    const client = new Client({
      accessToken: found.creds.accessToken,
      numberOfApiCallRetries: 3,
    });

    try {
      const upsertResp = (await client.apiRequest({
        method: 'POST',
        path: '/crm/v3/objects/contacts/batch/upsert',
        body: {
          inputs: [{ idProperty: 'email', id: email, properties }],
        },
      })) as { json?: () => Promise<{ results?: Array<{ id?: string }> }> };
      let externalId: string | undefined;
      try {
        const json = await upsertResp.json?.();
        externalId = json?.results?.[0]?.id;
      } catch {
        // Response body not JSON or already consumed — fine.
      }
      return {
        handler: 'hubspot',
        status: 'synced',
        ...(externalId ? { externalId } : {}),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        handler: 'hubspot',
        status: 'failed',
        error: isRateLimitDaily(err) ? `daily-rate-limit: ${message}` : message,
      };
    }
  },
};
