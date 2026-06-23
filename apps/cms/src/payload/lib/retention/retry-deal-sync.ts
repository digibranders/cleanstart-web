import type { BasePayload } from 'payload';

import { createHubspotDeal } from '../deal-registrations/hubspot-deal';
import type { DealRegistrationSubmission } from '../deal-registrations/schema';

type DealRow = {
  id: number;
  partnerName: string;
  partnerRepFirstName: string;
  partnerRepLastName: string;
  partnerRepEmail: string;
  partnerRepPhone?: string | null;
  prospectFirstName: string;
  prospectLastName: string;
  prospectEmail: string;
  prospectPhone?: string | null;
  dealDetails?: string | null;
  hubspotSync?: { status?: string | null; attempts?: number | null } | null;
};

const toSubmission = (row: DealRow): DealRegistrationSubmission => ({
  partnerName: row.partnerName,
  partnerRep: {
    firstName: row.partnerRepFirstName,
    lastName: row.partnerRepLastName,
    email: row.partnerRepEmail,
    ...(row.partnerRepPhone ? { phone: row.partnerRepPhone } : {}),
  },
  prospect: {
    firstName: row.prospectFirstName,
    lastName: row.prospectLastName,
    email: row.prospectEmail,
    ...(row.prospectPhone ? { phone: row.prospectPhone } : {}),
  },
  ...(row.dealDetails ? { dealDetails: row.dealDetails } : {}),
});

export const retryDealSync = async (
  payload: BasePayload,
  cfg: { pipeline: string; stage: string; maxAttempts: number },
): Promise<{ scanned: number; retried: number; synced: number; failed: number }> => {
  const found = await payload.find({
    collection: 'deal-registrations',
    // Retry legit (turnstile-passed) rows whose deal isn't created yet — both transient 'failed' and pre-provisioning 'skipped'. Honeypot rows are turnstilePassed:false and must never create a deal.
    where: {
      and: [
        { turnstilePassed: { equals: true } },
        { 'hubspotSync.status': { in: ['failed', 'skipped'] } },
      ],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  const rows = found.docs as unknown as DealRow[];
  let retried = 0;
  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    const attempts = row.hubspotSync?.attempts ?? 0;
    if (attempts >= cfg.maxAttempts) continue;
    retried += 1;
    const result = await createHubspotDeal(payload, toSubmission(row), {
      pipeline: cfg.pipeline,
      stage: cfg.stage,
    });
    if (result.status === 'synced') synced += 1;
    else if (result.status === 'failed') failed += 1;
    // Only genuine HubSpot failures count toward the attempt cap. A 'skipped'
    // result means the integration isn't provisioned yet (no API call made), so
    // the row must keep retrying cheaply until provisioning lands — see CLAUDE.md task #19.
    const nextAttempts = result.status === 'failed' ? attempts + 1 : attempts;
    await payload.update({
      collection: 'deal-registrations',
      id: row.id,
      data: {
        hubspotSync: {
          status: result.status,
          dealId: result.status === 'synced' ? result.dealId : null,
          error: result.status === 'failed' ? result.error : null,
          attempts: nextAttempts,
          lastAttemptAt: new Date().toISOString(),
        },
      },
      overrideAccess: true,
    });
  }

  return { scanned: rows.length, retried, synced, failed };
};
