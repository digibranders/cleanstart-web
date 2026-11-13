'use server';

import { z } from 'zod';
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from '@/lib/domain';
import type { ApplicationDto } from '@/lib/dto';
import type { ApplicationApprovalDto } from '@/lib/apply';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildApplicationApproved, buildApplicationDeclined } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { withViewer } from '@/server/repo/context';
import {
  approveApplication,
  declineApplication,
  getApplication,
  reopenApplication,
} from '@/server/repo/applications';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const idSchema = z.object({ id: z.string().uuid() });
const approveSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  managerId: z.string().uuid().optional(),
});
const declineSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Add a reason the applicant will see.').max(500),
});

export async function approveApplicationAction(raw: unknown): Promise<ActionResult<ApplicationApprovalDto>> {
  return runViewerAction({ name: 'application.approve', schema: approveSchema }, raw, async (ctx, input): Promise<ApplicationApprovalDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.approve');
      const before = await getApplication(tx, ctx.viewer, input.id);
      const result = await approveApplication(
        tx,
        ctx.viewer,
        { id: input.id, category: input.category, region: input.region, ...(input.managerId ? { managerId: input.managerId } : {}) },
        ctx.clock,
      );
      await recordAudit(tx, ctx.viewer, {
        event: 'application.approved',
        target: before.company,
        note: `Created ${result.partner.name} as ${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}. Invite sent to ${before.applicantName}.`,
        partnerId: result.partner.id,
        subject: { type: 'application', id: before.id },
      });
      // '1' for a new partner; a reopened application reuses its partner, so that second sync needs a new key (contracts G).
      await enqueue(tx, {
        op: 'partner.upsert',
        subjectId: result.partner.id,
        version: before.partnerId === null ? '1' : String(ctx.clock.now().getTime()),
      });
      return { before, result };
    });

    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationApproved({
          to: { email: done.before.email, name: done.before.applicantName },
          applicantName: done.before.applicantName,
          company: done.before.company,
          inviteUrl: inviteUrl(done.result.invite.token),
          expiresOn: done.result.invite.invite.expiresAt.slice(0, 10),
          managerName: done.result.partner.managerName,
        }),
      );
    });
    return { application: done.result.application, partner: done.result.partner };
  });
}

export async function declineApplicationAction(raw: unknown): Promise<ActionResult<ApplicationDto>> {
  return runViewerAction({ name: 'application.decline', schema: declineSchema }, raw, async (ctx, input): Promise<ApplicationDto> => {
    const declined = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.decline');
      const result = await declineApplication(tx, ctx.viewer, { id: input.id, reason: input.reason }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'application.declined',
        target: result.company,
        note: input.reason,
        subject: { type: 'application', id: result.id },
      });
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationDeclined({
          to: { email: declined.email, name: declined.applicantName },
          applicantName: declined.applicantName,
          company: declined.company,
          reason: input.reason,
        }),
      );
    });
    return declined;
  });
}

export async function reopenApplicationAction(raw: unknown): Promise<ActionResult<ApplicationDto>> {
  return runViewerAction({ name: 'application.reopen', schema: idSchema }, raw, async (ctx, input): Promise<ApplicationDto> => {
    const reopened = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.reopen');
      const before = await getApplication(tx, ctx.viewer, input.id);
      const result = await reopenApplication(tx, ctx.viewer, { id: input.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'application.reopened',
        target: result.company,
        note: before.status === 'approved' ? 'Approval undone, invite withdrawn' : 'Decline undone',
        ...(result.partnerId ? { partnerId: result.partnerId } : {}),
        subject: { type: 'application', id: result.id },
      });
      if (before.status === 'approved' && result.partnerId) {
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partnerId, version: String(ctx.clock.now().getTime()) });
      }
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    return reopened;
  });
}
