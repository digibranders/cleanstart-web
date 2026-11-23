'use server';

import { z } from 'zod';
import type { PartnerListRow } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { updatePartnerIdentity } from '@/server/repo/partner-identity';
import { getPartnerDetail } from '@/server/repo/partners';
import type { ActionResult } from './result';
import { runViewerAction } from './run';
import { regionName, regionKeySchema } from '@/lib/regions';

const identitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Enter the company name.').max(200).optional(),
  domain: z.string().trim().min(1, 'Enter the company domain.').max(253).optional(),
  region: regionKeySchema.optional(),
});

/**
 * Rename, change the sign-in domain, change the region. Each changed field is audited with before and after.
 * Deliberately not pushed to the CRM: the HubSpot company keeps its own name and domain, and a region change moves no registration.
 */
export async function updatePartnerIdentityAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.update_identity', schema: identitySchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.update_identity');
    const detail = await withViewer(ctx.viewer, async (tx) => {
      const change = await updatePartnerIdentity(tx, ctx.viewer, input);
      const subject = { type: 'partner', id: change.partnerId } as const;
      const target = change.after.name;
      if (change.before.name !== change.after.name) {
        await recordAudit(tx, ctx.viewer, { event: 'partner.renamed', target, before: change.before.name, after: change.after.name, partnerId: change.partnerId, subject });
      }
      if (change.before.domain !== change.after.domain) {
        await recordAudit(tx, ctx.viewer, { event: 'partner.domain_changed', target, before: change.before.domain, after: change.after.domain, partnerId: change.partnerId, subject });
      }
      if (change.before.region !== change.after.region) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.region_changed',
          target,
          before: regionName(change.before.region),
          after: regionName(change.after.region),
          note: 'Existing registrations keep their region.',
          partnerId: change.partnerId,
          subject,
        });
      }
      return getPartnerDetail(tx, ctx.viewer, change.partnerId);
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.revalidate(ROUTES.partner.company);
    return detail;
  });
}
