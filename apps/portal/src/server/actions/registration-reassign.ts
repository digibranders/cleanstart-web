'use server';

import { z } from 'zod';
import { DEAL_REGIONS, PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { staffDealHref } from '@/lib/staff-deals-dto';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { notifyUsers } from '@/server/notify';
import { withViewer } from '@/server/repo/context';
import { reassignRegistration, routingLabel } from '@/server/repo/registration-reassign';
import { lockRegistration } from '@/server/repo/registrations';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const reassignSchema = z.object({
  id: z.string().uuid(),
  managerId: z.string().uuid('Pick a partner manager.'),
  region: z.enum(DEAL_REGIONS),
});

/** Partner manager only, and only while the registration is waiting. */
export async function reassignRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.reassign', schema: reassignSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.reassign', { partnerId: current.partnerId, region: current.region });
      const result = await reassignRegistration(tx, ctx.viewer, input, ctx.clock);
      if (!result.changed) return result;
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.reassigned',
        target: `${reg.customer}, ${PRODUCT_LABEL[reg.product]}, from ${reg.partnerName}`,
        note: 'Manager and region changed while the registration was waiting.',
        before: routingLabel(result.before),
        after: routingLabel(result.after),
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      if (result.after.managerId && result.after.managerId !== result.before.managerId && result.after.managerId !== ctx.viewer.id) {
        await notifyUsers(tx, [
          {
            userId: result.after.managerId,
            kind: 'registration_submitted',
            title: `${reg.customer} was assigned to you`,
            body: `${reg.partnerName}, ${PRODUCT_LABEL[reg.product]}. Reassigned by ${ctx.viewer.name}.`,
            link: staffDealHref(reg.id),
          },
        ]);
      }
      return result;
    });
    const reg = outcome.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(staffDealHref(reg.id));
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    return reg;
  });
}
