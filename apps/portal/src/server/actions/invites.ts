'use server';

import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
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
import { buildAccessRequest, buildAccessRequestCopy, buildInviteAgainRequest, buildTeamChangeNotice } from '@/server/email/templates';
import { hashToken } from '@/server/auth/tokens';
import { ValidationError } from '@/server/errors';
import { enqueue } from '@/server/hubspot/outbox';
import { loadInvitePreview } from '@/server/invite-preview';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { UNKNOWN_IP_BUCKET } from '@/server/security/client-ip';
import { withSystem } from '@/server/repo/context';
import { acceptInvite, findInviteAgainRecipients } from '@/server/repo/invites';
import { listPartnerAdminRecipients } from '@/server/repo/partners';
import { createAccessRequest } from '@/server/repo/team';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runPublicAction } from './run';

const requestSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  email: z.string().trim().max(254),
  note: z.string().trim().max(500).optional(),
});
const REQUEST_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
const REQUEST_EMAIL_RULE = { limit: 3, windowSeconds: 3600 } as const;
/** Applies to every domain, partner or not, and whatever the IP: varying the local part must not flood a partner's admins. */
const REQUEST_DOMAIN_RULE = { limit: 10, windowSeconds: 3600 } as const;

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
    rateLimit(`invite:ip:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, INVITE_IP_RULE);
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

/**
 * "Request access" on the sign-in page. The answer is the same whether or not the domain is a partner, whether or not
 * the person already has a login, and whether or not a request was created, so it cannot be used to discover accounts.
 * The admin email is sent without being awaited, so the response time does not depend on the match either.
 */
export async function requestAccessAction(raw: unknown): Promise<ActionResult<{ confirmation: 'sent' }>> {
  return runPublicAction({ name: 'access.request', schema: requestSchema }, raw, async (ctx, input): Promise<{ confirmation: 'sent' }> => {
    const checked = validateBusinessEmail(input.email, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
    if (!checked.ok) {
      throw new ValidationError([
        { path: 'email', message: checked.reason === 'free-mail' ? 'Use your company email, not a personal address.' : 'Enter a valid work email.' },
      ]);
    }
    rateLimit(`access:ip:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, REQUEST_IP_RULE);
    rateLimit(`access:email:${checked.email}`, REQUEST_EMAIL_RULE);
    rateLimit(`access:domain:${checked.domain}`, REQUEST_DOMAIN_RULE);

    const actor = publicActor(input.name);
    const found = await withSystem(actor, async (tx) => {
      const result = await createAccessRequest(tx, actor, { email: checked.email, name: input.name, note: input.note ?? null }, ctx.clock);
      let items: NewNotification[] = [];
      if (result.matched && result.partnerId && result.requestId) {
        await recordAudit(tx, actor, {
          event: 'team.access_requested',
          target: `${input.name}, at ${result.partnerName ?? ''}`,
          partnerId: result.partnerId,
          subject: { type: 'access_request', id: result.requestId },
        });
        items = result.adminRecipients.map((admin) => ({
          userId: admin.userId,
          kind: 'access_requested' as const,
          title: `${input.name} asked for access`,
          body: checked.email,
          link: ROUTES.partner.team,
        }));
        await notifyUsers(tx, items);
      }
      return { result, items };
    });

    ctx.afterCommit(async () => {
      void sendEmail(buildAccessRequestCopy({ to: { email: checked.email, name: input.name }, requesterName: input.name, note: input.note ?? null })).catch((error: unknown) => {
        log.warn({ err: error }, 'access request copy failed');
      });
    });
    if (found.items.length > 0) {
      ctx.afterCommit(async () => {
        void (async () => {
          const to = (await resolveEmailRecipients(found.items)).map((r) => ({ email: r.email, name: r.name }));
          if (to.length === 0) return;
          await sendEmail(
            buildAccessRequest({
              to,
              requesterName: input.name,
              requesterEmail: checked.email,
              note: input.note ?? null,
              companyName: found.result.partnerName ?? '',
              reviewUrl: absoluteUrl(ROUTES.partner.team),
            }),
          );
        })();
      });
    }
    return { confirmation: 'sent' };
  });
}

const newInviteSchema = z.object({ token: z.string().min(1).max(200) });
const NEW_INVITE_IP_RULE = { limit: 5, windowSeconds: 3600 } as const;
/** One request per dead link per day: the inviter is told once, however often the page is pressed. */
const NEW_INVITE_TOKEN_RULE = { limit: 1, windowSeconds: 86_400 } as const;

/**
 * "Send me a new invite" on an expired, used or withdrawn invite page. The answer is the same for a known token, an
 * unknown one and a live one, and the inviter is told without being awaited, so nothing reveals which tokens exist.
 */
export async function requestNewInviteAction(raw: unknown): Promise<ActionResult<{ confirmation: 'sent' }>> {
  return runPublicAction({ name: 'invite.request_new', schema: newInviteSchema }, raw, async (ctx, input): Promise<{ confirmation: 'sent' }> => {
    rateLimit(`invite-again:ip:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, NEW_INVITE_IP_RULE);
    const actor = publicActor('Invitee');
    const tokenKey = `invite-again:token:${hashToken(input.token)}`;
    try {
      rateLimit(tokenKey, NEW_INVITE_TOKEN_RULE);
    } catch {
      // A repeat press for the same link is answered like the first and tells nobody again.
      return { confirmation: 'sent' };
    }
    const found = await withSystem(actor, async (tx) => {
      const request = await findInviteAgainRecipients(tx, actor, input.token, ctx.clock);
      if (!request) return null;
      const roleLabel = request.kind === 'staff' ? STAFF_ROLE_LABEL[request.role as keyof typeof STAFF_ROLE_LABEL] : PARTNER_ROLE_LABEL[request.role as keyof typeof PARTNER_ROLE_LABEL];
      const link = request.kind === 'staff' ? ROUTES.admin.team : ROUTES.partner.team;
      const items: NewNotification[] = request.recipients.map((recipient) => ({
        userId: recipient.userId,
        kind: 'access_requested' as const,
        title: `${request.inviteEmail} asked for a new invite`,
        body: roleLabel,
        link,
      }));
      await notifyUsers(tx, items);
      return { request, roleLabel, link, items };
    });
    if (found && found.items.length > 0) {
      ctx.afterCommit(async () => {
        void (async () => {
          const to = (await resolveEmailRecipients(found.items)).map((r) => ({ email: r.email, name: r.name }));
          if (to.length === 0) return;
          await sendEmail(
            buildInviteAgainRequest({
              to,
              inviteeEmail: found.request.inviteEmail,
              roleLabel: found.roleLabel,
              companyName: found.request.partnerName,
              reviewUrl: absoluteUrl(found.link),
            }),
          );
        })().catch((error: unknown) => log.warn({ err: error }, 'new invite request email failed'));
      });
    }
    return { confirmation: 'sent' };
  });
}
