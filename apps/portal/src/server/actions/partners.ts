'use server';

import { z } from 'zod';
import type { ChecklistDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildManagerMessage } from '@/server/email/templates';
import { IntegrationError, ValidationError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { getCompany, tickChecklistStep } from '@/server/repo/partners';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const tickSchema = z.object({ step: z.enum(['kickoff', 'playbook']) });
const messageSchema = z.object({
  subject: z.string().trim().min(1, 'Add a subject.').max(200),
  body: z.string().trim().min(1, 'Write a message first.').max(5000),
});

export async function tickChecklistStepAction(raw: unknown): Promise<ActionResult<ChecklistDto>> {
  return runViewerAction({ name: 'partner.tick_checklist', schema: tickSchema }, raw, async (ctx, input): Promise<ChecklistDto> => {
    assertCan(ctx.viewer, 'partner.update_checklist');
    const checklist = await withViewer(ctx.viewer, (tx) => tickChecklistStep(tx, ctx.viewer, { step: input.step }, ctx.clock));
    ctx.revalidate(ROUTES.partner.welcome);
    return checklist;
  });
}

/** From the "Message your partner manager" drawers. Sent in the request (not after commit) so a failure reaches the person. */
export async function sendManagerMessageAction(raw: unknown): Promise<ActionResult<{ managerName: string }>> {
  return runViewerAction({ name: 'partner.message_manager', schema: messageSchema }, raw, async (ctx, input): Promise<{ managerName: string }> => {
    assertCan(ctx.viewer, 'manager.message');
    const company = await withViewer(ctx.viewer, (tx) => getCompany(tx, ctx.viewer, {}));
    if (!company.manager) throw new ValidationError([{ path: '', message: 'Your partner manager has not been assigned yet.' }]);
    const result = await sendEmail(
      buildManagerMessage({
        to: { email: company.manager.email, name: company.manager.name },
        replyTo: { email: ctx.viewer.email, name: ctx.viewer.name },
        managerName: company.manager.name,
        senderName: ctx.viewer.name,
        partnerName: company.name,
        subject: input.subject,
        body: input.body,
      }),
    );
    if (result.status === 'failed') throw new IntegrationError('brevo', result.error);
    return { managerName: company.manager.name };
  });
}
