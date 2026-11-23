'use server';

import { z } from 'zod';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { staffDealHref } from '@/lib/staff-deals-dto';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildExtensionDecision, buildExtensionRequested } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { staffRecipients } from '@/server/registrations/staff-alert';
import { withViewer } from '@/server/repo/context';
import { decideExtension, lockRegistration, requestExtension } from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const requestSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Tell CleanStart why you need more time.').max(1000),
});

const decideSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['grant', 'decline']),
  note: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
});

const targetOf = (r: Pick<RegistrationDetailDto, 'customer' | 'product' | 'partnerName'>): string =>
  `${r.customer}, ${PRODUCT_LABEL[r.product]}, from ${r.partnerName}`;

export async function requestExtensionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.request_extension', schema: requestSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.request_extension', { partnerId: current.partnerId, ownerUserId: current.registeredById });
      const result = await requestExtension(tx, ctx.viewer, input, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.extension_requested',
        target: targetOf(reg),
        note: input.reason,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      const items: NewNotification[] = result.managerUserId
        ? [
            {
              userId: result.managerUserId,
              kind: 'extension_requested',
              title: `${result.partnerName} asked for more time on ${reg.customer}`,
              body: input.reason,
              link: staffDealHref(reg.id),
            },
          ]
        : [];
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = outcome.result.registration;
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(async () => {
      const to = await staffRecipients(outcome.items);
      if (to.length === 0) return;
      await sendEmail(
        buildExtensionRequested({
          to,
          partnerName: outcome.result.partnerName,
          customer: reg.customer,
          productLabel: PRODUCT_LABEL[reg.product],
          reason: input.reason,
          approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
        }),
      );
    });
    return reg;
  });
}

export async function decideExtensionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.decide_extension', schema: decideSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide_extension', { partnerId: current.partnerId, region: current.region });
      const result = await decideExtension(tx, ctx.viewer, { id: current.id, decision: input.decision, note: input.note }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: result.granted ? 'registration.extension_granted' : 'registration.extension_declined',
        target: targetOf(reg),
        note: result.granted
          ? `Protected until ${fmtLong(result.newProtectionEnd ?? '')}.${input.note ? ` ${input.note}` : ''}`
          : (input.note ?? 'Declined.'),
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      if (result.granted && result.newProtectionEnd) {
        await enqueue(tx, { op: 'registration.update_end', subjectId: reg.id, version: result.newProtectionEnd });
      }
      const items = result.recipientUserIds.map(
        (userId): NewNotification => ({
          userId,
          kind: 'extension_decided',
          title: `${reg.customer} extension ${result.granted ? 'granted' : 'declined'}`,
          ...(result.granted
            ? { body: `Protected until ${fmtLong(result.newProtectionEnd ?? '')}` }
            : input.note
              ? { body: input.note }
              : {}),
          link: ROUTES.partner.deal(reg.id),
        }),
      );
      await notifyUsers(tx, items);
      return { result, items };
    });

    const { result } = outcome;
    const reg = result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(outcome.items)) {
        await sendEmail(
          buildExtensionDecision({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            granted: result.granted,
            newEnd: result.newProtectionEnd,
            note: input.note,
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}
