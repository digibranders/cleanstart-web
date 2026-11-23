'use server';

import { z } from 'zod';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { lockRegistration } from '@/server/repo/registrations';
import { withdrawRegistration } from '@/server/repo/withdraw';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const withdrawSchema = z.object({ id: z.string().uuid() });

export async function withdrawRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.withdraw', schema: withdrawSchema }, raw, async (ctx, input) => {
    if (ctx.viewer.kind !== 'partner') throw new ForbiddenError('only the registering partner can withdraw a registration');
    const updated = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.resubmit', { partnerId: current.partnerId, ownerUserId: current.registeredById });
      const result = await withdrawRegistration(tx, ctx.viewer, input.id, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.stage_changed',
        target: `${result.customer}, ${PRODUCT_LABEL[result.product]}, from ${result.partnerName}`,
        note: 'Withdrawn by the partner before review.',
        partnerId: result.partnerId,
        subject: { type: 'registration', id: result.id },
      });
      return result;
    });
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(updated.id));
    ctx.revalidate(ROUTES.admin.approvals);
    return updated;
  });
}
