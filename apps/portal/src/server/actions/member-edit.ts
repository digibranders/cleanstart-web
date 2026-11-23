'use server';

import { z } from 'zod';
import { PARTNER_ROLE_LABEL, type PartnerRole } from '@/lib/domain';
import { INVITE_IP_RULE } from '@/lib/invites';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import { EMAIL_CHANGE_TTL_HOURS } from '@/server/auth/tokens';
import type { SystemActor } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildEmailChangeConfirm, buildEmailChangedNotice, buildTeamInvite } from '@/server/email/templates';
import { NotFoundError } from '@/server/errors';
import { rateLimit } from '@/server/rate-limit';
import { type Tx, withSystem, withViewer } from '@/server/repo/context';
import {
  confirmEmailChange,
  reactivateMember,
  requestEmailChange,
  updateMemberDetails,
} from '@/server/repo/member-edit';
import { getTeam } from '@/server/repo/team';
import { UNKNOWN_IP_BUCKET } from '@/server/security/client-ip';
import { confirmEmailUrl, inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runPublicAction, runViewerAction } from './run';

const partnerId = z.string().uuid().optional();
const detailsSchema = z.object({
  userId: z.string().uuid(),
  partnerId,
  name: z.string().trim().min(1, 'Enter their name.').max(120),
  title: z.string().trim().max(120),
  phone: z.string().trim().max(40),
});
const emailSchema = z.object({ userId: z.string().uuid(), partnerId, email: z.string().trim().max(254) });
const reactivateSchema = z.object({ userId: z.string().uuid(), partnerId });
const tokenSchema = z.object({ token: z.string().min(1).max(200) });

/** A partner admin may ask for 10 email changes an hour: each one sends mail to an address they chose. */
const EMAIL_CHANGE_RULE = { limit: 10, windowSeconds: 3600 } as const;

const loadTeam = (tx: Tx, viewer: Parameters<typeof getTeam>[1], requested: string | undefined) =>
  getTeam(tx, viewer, requested ? { partnerId: requested } : {});

const show = (value: string | null): string => value ?? 'none';

export async function updateMemberDetailsAction(raw: unknown): Promise<ActionResult<{ userId: string; changed: boolean }>> {
  return runViewerAction({ name: 'team.edit_member', schema: detailsSchema }, raw, async (ctx, input): Promise<{ userId: string; changed: boolean }> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      if (!team.members.some((m) => m.id === input.userId && m.inviteId !== m.id)) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.edit_member', { partnerId: team.partnerId });
      const result = await updateMemberDetails(tx, ctx.viewer, input);
      if (result.changed) {
        await recordAudit(tx, ctx.viewer, {
          event: 'team.member_updated',
          target: `${result.after.name}, at ${team.partnerName}`,
          before: `${result.before.name}, ${show(result.before.title)}, ${show(result.before.phone)}`,
          after: `${result.after.name}, ${show(result.after.title)}, ${show(result.after.phone)}`,
          partnerId: team.partnerId,
          subject: { type: 'user', id: result.userId },
        });
      }
      return result;
    });
    ctx.revalidate(ROUTES.partner.team);
    return { userId: done.userId, changed: done.changed };
  });
}

export async function requestMemberEmailChangeAction(raw: unknown): Promise<ActionResult<{ userId: string; newEmail: string }>> {
  return runViewerAction({ name: 'team.request_email_change', schema: emailSchema }, raw, async (ctx, input): Promise<{ userId: string; newEmail: string }> => {
    rateLimit(`email-change:user:${ctx.viewer.id}`, EMAIL_CHANGE_RULE);
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      if (!team.members.some((m) => m.id === input.userId && m.inviteId !== m.id)) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.edit_member', { partnerId: team.partnerId });
      const requested = await requestEmailChange(tx, ctx.viewer, { userId: input.userId, email: input.email }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.email_change_requested',
        target: `${requested.name}, at ${team.partnerName}`,
        note: `A confirmation link went to ${requested.newEmail}.`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: requested.userId },
      });
      return { requested, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildEmailChangeConfirm({
          to: { email: done.requested.newEmail, name: done.requested.name },
          name: done.requested.name,
          adminName: ctx.viewer.name,
          companyName: done.companyName,
          confirmUrl: confirmEmailUrl(done.requested.token),
          validHours: EMAIL_CHANGE_TTL_HOURS,
        }),
      );
    });
    return { userId: done.requested.userId, newEmail: done.requested.newEmail };
  });
}

const emailChangeActor = (label: string): SystemActor => ({ kind: 'system', label, who: 'partner', roleLabel: 'Email confirmation' });

export async function confirmEmailChangeAction(raw: unknown): Promise<ActionResult<{ newEmail: string }>> {
  return runPublicAction({ name: 'email_change.confirm', schema: tokenSchema }, raw, async (ctx, input): Promise<{ newEmail: string }> => {
    rateLimit(`email-change:ip:${ctx.ip ?? UNKNOWN_IP_BUCKET}`, INVITE_IP_RULE);
    const placeholder = emailChangeActor('Someone confirming an email');
    const done = await withSystem(placeholder, async (tx) => {
      const changed = await confirmEmailChange(tx, placeholder, input.token, ctx.clock);
      await recordAudit(tx, emailChangeActor(changed.name), {
        event: 'user.email_changed',
        target: `${changed.name}, at ${changed.partnerName}`,
        before: changed.oldEmail,
        after: changed.newEmail,
        partnerId: changed.partnerId,
        subject: { type: 'user', id: changed.userId },
      });
      return { changed, companyName: changed.partnerName };
    });
    ctx.afterCommit(async () => {
      // auth_session is system-only under RLS, so the sessions go here, after commit.
      await revokeAllSessions(done.changed.userId);
      await sendEmail(
        buildEmailChangedNotice({
          to: { email: done.changed.oldEmail, name: done.changed.name },
          name: done.changed.name,
          newEmail: done.changed.newEmail,
          companyName: done.companyName,
        }),
      );
    });
    return { newEmail: done.changed.newEmail };
  });
}

export async function reactivateMemberAction(raw: unknown): Promise<ActionResult<{ userId: string }>> {
  return runViewerAction({ name: 'team.reactivate', schema: reactivateSchema }, raw, async (ctx, input): Promise<{ userId: string }> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      if (!team.removed.some((m) => m.id === input.userId)) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.reactivate', { partnerId: team.partnerId });
      const result = await reactivateMember(tx, ctx.viewer, { userId: input.userId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.reactivated',
        target: `${result.name}, ${PARTNER_ROLE_LABEL[result.created.invite.role as PartnerRole].toLowerCase()}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: result.userId },
      });
      return { result, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildTeamInvite({
          to: { email: done.result.email, name: done.result.name },
          inviteeName: done.result.name,
          inviterName: ctx.viewer.name,
          audience: 'partner',
          companyName: done.companyName,
          roleLabel: PARTNER_ROLE_LABEL[done.result.created.invite.role as PartnerRole],
          inviteUrl: inviteUrl(done.result.created.token),
          expiresOn: done.result.created.invite.expiresAt.slice(0, 10),
        }),
      );
    });
    return { userId: done.result.userId };
  });
}
