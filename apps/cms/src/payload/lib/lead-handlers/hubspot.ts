import { Client } from '@hubspot/api-client';
import type { BasePayload } from 'payload';

import { resolveHubspotCredentials, type HubspotCredentials } from '../integrations/credentials';
import type { LeadHandler, LeadHandlerResult, LeadSubmission } from './types';

/**
 * HubSpot lead handler.
 *
 * Submit path: each lead is relayed to the matching HubSpot form via the
 * Forms Submissions API —
 *   `POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`
 * The form GUID lives on the Payload `forms` row (`hubspotFormGuid`); the
 * portal id comes from `HUBSPOT_PORTAL_ID`. Field `name`s in `submission.fields`
 * are HubSpot field internal names by design, so no mapping layer is needed.
 * HubSpot's form-submit flow creates/updates the contact and fires the form's
 * own follow-up + notification emails.
 *
 * Erasure path: `hubspotGdprDeleteByEmail` still uses the CRM contacts API with
 * the Private App token (resolved from the integration row).
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
    const portalId = process.env.HUBSPOT_PORTAL_ID;
    if (!portalId) {
      return { handler: 'hubspot', status: 'skipped', reason: 'env-not-configured' };
    }

    const form = (await ctx.payload.findByID({
      collection: 'forms',
      id: submission.formId,
      depth: 0,
      overrideAccess: true,
    })) as { hubspotFormGuid?: string | null; hubspotSubscriptionTypeId?: string | null } | null;
    const guid = form?.hubspotFormGuid?.trim();
    if (!guid) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-hubspot-form-guid' };
    }
    const rawSubscriptionTypeId = form?.hubspotSubscriptionTypeId?.trim();
    const subscriptionTypeId = rawSubscriptionTypeId ? Number(rawSubscriptionTypeId) : Number.NaN;

    // Field names in submission.fields are HubSpot internal names by design.
    const fields = Object.entries(submission.fields)
      .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([name, v]) => ({ name, value: String(v) }));
    if (fields.length === 0) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-fields' };
    }

    const body: Record<string, unknown> = {
      fields,
      context: { pageUri: submission.source ?? '' },
    };
    if (submission.consent) {
      const consent: Record<string, unknown> = {
        consentToProcess: true,
        text: submission.consent.snapshot,
      };
      if (Number.isFinite(subscriptionTypeId)) {
        consent.communications = [
          { value: true, subscriptionTypeId, text: submission.consent.snapshot },
        ];
      }
      body.legalConsentOptions = { consent };
    }

    try {
      const resp = await fetch(
        `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${guid}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        return {
          handler: 'hubspot',
          status: 'failed',
          error: `HubSpot ${resp.status}: ${detail.slice(0, 200)}`,
        };
      }
      return { handler: 'hubspot', status: 'synced' };
    } catch (err) {
      return {
        handler: 'hubspot',
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
