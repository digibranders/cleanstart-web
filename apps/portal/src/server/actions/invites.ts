'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { env } from '@/env';
import { PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from '@/lib/domain';
import type { InvitePreviewDto } from '@/lib/dto';
import { type AcceptInviteOutcome, INVITE_IP_RULE } from '@/lib/invites';
import { landingPathFor } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { auth } from '@/server/auth/auth';
import { assertPasswordOk, hashPassword } from '@/server/auth/passwords';
import { type SystemActor, publicActor } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildTeamChangeNotice } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { loadInvitePreview } from '@/server/invite-preview';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { acceptInvite } from '@/server/repo/invites';
import { listPartnerAdminRecipients } from '@/server/repo/partners';
import type { ActionResult } from './result';
import { runPublicAction } from './run';

const previewSchema = z.object({ token: z.string().min(1).max(200) });

const acceptSchema = z
  .object({
    token: z.string().min(1).max(200),
    name: z.string().trim().min(1, 'Enter your name.').max(120),
    password: z.string().min(1).max(200),
    confirmPassword: z.string().max(200),
    acceptAgreement: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords do not match.',
  });

export async function previewInviteAction(raw: unknown): Promise<ActionResult<InvitePreviewDto>> {
  return runPublicAction({ name: 'invite.preview', schema: previewSchema }, raw, async (ctx, input): Promise<InvitePreviewDto> =>
    loadInvitePreview(input.token, ctx.ip, ctx.clock),
  );
}

export async function acceptInviteAction(raw: unknown): Promise<ActionResult<AcceptInviteOutcome>> {
  return runPublicAction({ name: 'invite.accept', schema: acceptSchema }, raw, async (ctx, input): Promise<AcceptInviteOutcome> => {
    if (ctx.ip) rateLimit(`invite:ip:${ctx.ip}`, INVITE_IP_RULE);
    assertPasswordOk(input.password);
    const passwordHash = await hashPassword(input.password);
    const actor = publicActor(input.name);

    const accepted = await withSystem(actor, async (tx) => {
      const result = await acceptInvite(
        tx,
        actor,
        {
          token: input.token,
          name: input.name,
          passwordHash,
          acceptAgreement: input.acceptAgreement,
          agreementVersion: env.PARTNER_AGREEMENT_VERSION,
        },
        ctx.clock,
      );
      const roleLabel = result.kind === 'partner' ? PARTNER_ROLE_LABEL[result.role as keyof typeof PARTNER_ROLE_LABEL] : STAFF_ROLE_LABEL[result.role as keyof typeof STAFF_ROLE_LABEL];
      const who: SystemActor = {
        kind: 'system',
        label: input.name,
        who: result.kind === 'staff' ? 'staff' : 'partner',
        roleLabel: result.partnerName ? `${result.partnerName}, ${roleLabel.toLowerCase()}` : roleLabel,
      };
      await recordAudit(tx, who, {
        event: 'team.invite_accepted',
        target: result.partnerName ? `${input.name}, ${roleLabel.toLowerCase()}, at ${result.partnerName}` : `${input.name}, ${roleLabel.toLowerCase()}, CleanStart team`,
        partnerId: result.partnerId,
        subject: { type: 'user', id: result.userId },
      });
      if (result.agreementAccepted && result.partnerId) {
        await recordAudit(tx, who, {
          event: 'partner.agreement_accepted',
          target: result.partnerName ?? '',
          note: `Version ${env.PARTNER_AGREEMENT_VERSION}`,
          partnerId: result.partnerId,
          subject: { type: 'partner', id: result.partnerId },
        });
      }

      let items: NewNotification[] = [];
      if (result.kind === 'partner' && result.partnerId) {
        await enqueue(tx, { op: 'user.upsert', subjectId: result.userId, version: '1' });
        const admins = await listPartnerAdminRecipients(tx, { partnerId: result.partnerId });
        items = admins
          .filter((admin) => admin.userId !== result.userId)
          .map((admin) => ({
            userId: admin.userId,
            kind: 'team_joined' as const,
            title: `${input.name} joined ${result.partnerName ?? 'your company'}`,
            body: roleLabel,
            link: ROUTES.partner.team,
          }));
        await notifyUsers(tx, items);
      }
      return { result, items };
    });

    ctx.revalidate(ROUTES.partner.team);
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(accepted.items)) {
        await sendEmail(
          buildTeamChangeNotice({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            kind: 'joined',
            personName: input.name,
            companyName: accepted.result.partnerName ?? 'your company',
          }),
        );
      }
    });

    // Sign in on the server so the cookie is set by this response. If it fails the account still exists: sign in by hand.
    let signedIn = false;
    try {
      await auth.api.signInEmail({ body: { email: accepted.result.email, password: input.password }, headers: await headers() });
      signedIn = true;
    } catch (error) {
      log.warn({ err: error }, 'sign in after accepting an invite failed');
    }
    return {
      signedIn,
      redirectTo: signedIn ? landingPathFor(accepted.result.kind, accepted.result.role) : ROUTES.signIn,
    };
  });
}
