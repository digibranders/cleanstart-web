'use server';

import { z } from 'zod';
import type { HubspotHintDto } from '@/components/deals/types';
import { env } from '@/env';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildDealAccepted, buildDealRejected } from '@/server/email/templates';
import { readHubspotConfig } from '@/server/hubspot/client';
import { enqueue } from '@/server/hubspot/outbox';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { hubspotConflictHints } from '@/server/registrations/conflict-hints';
import { readOnlyHubspot } from '@/server/registrations/hubspot-read';
import { withViewer } from '@/server/repo/context';
import {
  acceptRegistration,
  conflictInputs,
  lockRegistration,
  rejectRegistration,
  undoDecision,
} from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const idSchema = z.object({ id: z.string().uuid() });
const rejectSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Add a reason the partner will see.').max(500),
});

const targetOf = (r: Pick<RegistrationDetailDto, 'customer' | 'product' | 'partnerName'>): string =>
  `${r.customer}, ${PRODUCT_LABEL[r.product]}, from ${r.partnerName}`;

export async function acceptRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.accept', schema: idSchema }, raw, async (ctx, input) => {
    const decision = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide', { partnerId: current.partnerId, region: current.region });
      const result = await acceptRegistration(tx, ctx.viewer, { id: current.id }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.accepted',
        target: targetOf(reg),
        note: `Protected until ${fmtLong(reg.protectionEnd ?? '')}. HubSpot deal queued.`,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      await enqueue(tx, { op: 'registration.create', subjectId: reg.id, version: String(Date.parse(result.decidedAt)) });
      const items: NewNotification[] = result.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_accepted',
        title: `${reg.customer} was accepted`,
        body: `${PRODUCT_LABEL[reg.product]}, protected until ${fmtLong(reg.protectionEnd ?? '')}`,
        link: ROUTES.partner.deal(reg.id),
      }));
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = decision.result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(decision.items)) {
        await sendEmail(
          buildDealAccepted({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            partnerName: decision.result.partnerName,
            protectionEnd: reg.protectionEnd ?? '',
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}

export async function rejectRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.reject', schema: rejectSchema }, raw, async (ctx, input) => {
    const decision = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide', { partnerId: current.partnerId, region: current.region });
      const result = await rejectRegistration(tx, ctx.viewer, { id: current.id, reason: input.reason }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.rejected',
        target: targetOf(reg),
        note: `Reason sent to the partner: ${reg.rejectionReason ?? input.reason}`,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      const items: NewNotification[] = result.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_rejected',
        title: `${reg.customer} was not accepted`,
        body: reg.rejectionReason ?? input.reason,
        link: ROUTES.partner.deal(reg.id),
      }));
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = decision.result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(decision.items)) {
        await sendEmail(
          buildDealRejected({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            reason: reg.rejectionReason ?? input.reason,
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}

export async function undoDecisionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.undo', schema: idSchema }, raw, async (ctx, input) => {
    const reg = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.undo_decision', { partnerId: current.partnerId, region: current.region });
      const undone = await undoDecision(tx, ctx.viewer, { id: current.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.decision_undone',
        target: targetOf(undone),
        note: 'The registration is back in the approvals queue.',
        partnerId: undone.partnerId,
        subject: { type: 'registration', id: undone.id },
      });
      return undone;
    });
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    return reg;
  });
}

const hintsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

/** Read only HubSpot check for the waiting rows, fetched by the approvals screen after it renders. Never blocks a decision. */
export async function hubspotConflictHintsAction(raw: unknown): Promise<ActionResult<Record<string, HubspotHintDto>>> {
  return runViewerAction({ name: 'registration.conflict_hints', schema: hintsSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'registration.read_queue');
    rateLimit(`hints:user:${ctx.viewer.id}`, { limit: 6, windowSeconds: 60 });
    const inputs = await withViewer(ctx.viewer, (tx) => conflictInputs(tx, ctx.viewer, { registrationIds: input.ids }));
    return hubspotConflictHints(readOnlyHubspot(), readHubspotConfig()?.pipelineId ?? env.HUBSPOT_PARTNER_PIPELINE_ID ?? null, inputs);
  });
}
