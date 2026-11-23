'use server';

import { z } from 'zod';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildTwoStepResetNotice } from '@/server/email/templates';
import { withSystem, withViewer } from '@/server/repo/context';
import { clearTwoStepSecrets, resetPartnerUserTwoStep } from '@/server/repo/staff-user-security';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const resetSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().trim().min(1, 'Give a reason for the reset.').max(500),
});

/**
 * A partner manager resets a PARTNER user's two-step sign-in after a lost device. The flag, the audit entry (with the
 * typed reason) and the notice commit together; the authenticator, the backup codes and the sessions go after commit
 * because auth_session and auth_two_factor are system-only under RLS (contracts F.3).
 */
export async function resetUserTwoStepAction(raw: unknown): Promise<ActionResult<{ userId: string }>> {
  return runViewerAction({ name: 'user.reset_two_step', schema: resetSchema }, raw, async (ctx, input): Promise<{ userId: string }> => {
    assertCan(ctx.viewer, 'user.reset_two_step');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const reset = await resetPartnerUserTwoStep(tx, ctx.viewer, { userId: input.userId });
      await recordAudit(tx, ctx.viewer, {
        event: 'user.two_step_reset',
        target: `${reset.name}, at ${reset.partnerName}`,
        note: input.reason,
        partnerId: reset.partnerId,
        subject: { type: 'user', id: reset.userId },
      });
      return reset;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      await withSystem(SYSTEM_ACTORS.portal, (tx) => clearTwoStepSecrets(tx, SYSTEM_ACTORS.portal, done.userId));
      await revokeAllSessions(done.userId);
      await sendEmail(
        buildTwoStepResetNotice({
          to: { email: done.email, name: done.name },
          name: done.name,
          companyName: done.partnerName,
          resetBy: ctx.viewer.name,
          reason: input.reason,
        }),
      );
    });
    return { userId: done.userId };
  });
}
