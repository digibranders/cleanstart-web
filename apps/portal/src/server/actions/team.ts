'use server';

import { z } from 'zod';
import { ACCESS_REQUEST_ROLES, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from '@/lib/domain';
import type { AccessRequestDto, InviteDto, TeamMemberDto } from '@/lib/dto';
import { nameFromEmail } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import type { Viewer } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildAccessRequestDeclined, buildTeamChangeNotice, buildTeamInvite } from '@/server/email/templates';
import type { EmailMessage } from '@/server/email/transport';
import { NotFoundError, ValidationError } from '@/server/errors';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { type Tx, withViewer } from '@/server/repo/context';
import { createInvite, resendInvite, revokeInvite } from '@/server/repo/invites';
import { getCompany, listPartnerAdminRecipients } from '@/server/repo/partners';
import { changeMemberRole, decideAccessRequest, getTeam, removeMember } from '@/server/repo/team';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const partnerId = z.string().uuid().optional();
const inviteSchema = z.object({ email: z.string().trim().max(254), role: z.enum(PARTNER_ROLES), partnerId });
const inviteIdSchema = z.object({ inviteId: z.string().uuid(), partnerId });
const roleSchema = z.object({ userId: z.string().uuid(), role: z.enum(PARTNER_ROLES), partnerId });
const removeSchema = z.object({ userId: z.string().uuid(), partnerId });
const decideSchema = z.discriminatedUnion('decision', [
  z.object({ id: z.string().uuid(), partnerId, decision: z.literal('approve'), role: z.enum(ACCESS_REQUEST_ROLES) }),
  z.object({ id: z.string().uuid(), partnerId, decision: z.literal('decline') }),
]);

const lower = (role: PartnerRole): string => PARTNER_ROLE_LABEL[role].toLowerCase();

/** The company the action is about: the viewer's own, or the partner a manager named. */
const loadTeam = (tx: Tx, viewer: Viewer, requested: string | undefined) => getTeam(tx, viewer, requested ? { partnerId: requested } : {});

const inviteMail = (args: {
  invite: InviteDto;
  token: string;
  inviteeName: string | null;
  inviterName: string;
  companyName: string;
}): EmailMessage =>
  buildTeamInvite({
    to: { email: args.invite.email, ...(args.inviteeName ? { name: args.inviteeName } : {}) },
    inviteeName: args.inviteeName,
    inviterName: args.inviterName,
    audience: 'partner',
    companyName: args.companyName,
    roleLabel: PARTNER_ROLE_LABEL[args.invite.role as PartnerRole],
    inviteUrl: inviteUrl(args.token),
    expiresOn: args.invite.expiresAt.slice(0, 10),
  });

export async function inviteMemberAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.invite', schema: inviteSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const target = input.partnerId ?? (ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : undefined);
    if (!target) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
    assertCan(ctx.viewer, 'team.invite', { partnerId: target });
    const done = await withViewer(ctx.viewer, async (tx) => {
      const company = await getCompany(tx, ctx.viewer, { partnerId: target });
      const created = await createInvite(tx, ctx.viewer, { kind: 'partner', partnerId: target, email: input.email, role: input.role }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invited',
        target: `${nameFromEmail(created.invite.email)}, ${lower(input.role)}, at ${company.name}`,
        partnerId: target,
        subject: { type: 'invite', id: created.invite.id },
      });
      return { created, companyName: company.name };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(inviteMail({ invite: done.created.invite, token: done.created.token, inviteeName: null, inviterName: ctx.viewer.name, companyName: done.companyName }));
    });
    return done.created.invite;
  });
}

export async function resendInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.resend_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const member = team.members.find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      assertCan(ctx.viewer, 'team.resend_invite', { partnerId: team.partnerId });
      const resent = await resendInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invite_resent',
        target: `${member.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'invite', id: resent.invite.id },
      });
      return { resent, member, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(inviteMail({ invite: done.resent.invite, token: done.resent.token, inviteeName: done.member.name, inviterName: ctx.viewer.name, companyName: done.companyName }));
    });
    return done.resent.invite;
  });
}

export async function revokeInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.revoke_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const revoked = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const member = team.members.find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      assertCan(ctx.viewer, 'team.revoke_invite', { partnerId: team.partnerId });
      const dto = await revokeInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invite_revoked',
        target: `${member.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'invite', id: dto.id },
      });
      return dto;
    });
    ctx.revalidate(ROUTES.partner.team);
    return revoked;
  });
}

export async function changeMemberRoleAction(raw: unknown): Promise<ActionResult<TeamMemberDto>> {
  return runViewerAction({ name: 'team.change_role', schema: roleSchema }, raw, async (ctx, input): Promise<TeamMemberDto> => {
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const before = team.members.find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.change_role', { partnerId: team.partnerId });
      const after = await changeMemberRole(tx, ctx.viewer, { userId: input.userId, role: input.role });
      if (before.role !== after.role) {
        await recordAudit(tx, ctx.viewer, {
          event: 'team.role_changed',
          target: `${after.name}, at ${team.partnerName}`,
          note: `${PARTNER_ROLE_LABEL[before.role]} to ${PARTNER_ROLE_LABEL[after.role]}.`,
          partnerId: team.partnerId,
          subject: { type: 'user', id: after.id },
        });
      }
      return after;
    });
    ctx.revalidate(ROUTES.partner.team);
    return changed;
  });
}

export async function removeMemberAction(raw: unknown): Promise<ActionResult<{ userId: string }>> {
  return runViewerAction({ name: 'team.remove', schema: removeSchema }, raw, async (ctx, input): Promise<{ userId: string }> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      // An invite-only row has no user to remove; it is withdrawn through revokeInviteAction.
      const member = team.members.find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!member) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.remove', { partnerId: team.partnerId });
      const removed = await removeMember(tx, ctx.viewer, { userId: member.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.removed',
        target: `${removed.name}, ${lower(removed.role)}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: removed.userId },
      });
      const admins = await listPartnerAdminRecipients(tx, { partnerId: team.partnerId });
      const items: NewNotification[] = admins
        .filter((admin) => admin.userId !== removed.userId && admin.userId !== ctx.viewer.id)
        .map((admin) => ({
          userId: admin.userId,
          kind: 'team_removed' as const,
          title: `${removed.name} was removed from ${team.partnerName}`,
          body: PARTNER_ROLE_LABEL[removed.role],
          link: ROUTES.partner.team,
        }));
      await notifyUsers(tx, items);
      return { removed, items, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      // auth_session is system-only under RLS, so the sessions go here, after commit (contracts F.3, B.6).
      await revokeAllSessions(done.removed.userId);
      for (const to of await resolveEmailRecipients(done.items)) {
        await sendEmail(
          buildTeamChangeNotice({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            kind: 'removed',
            personName: done.removed.name,
            companyName: done.companyName,
          }),
        );
      }
    });
    return { userId: done.removed.userId };
  });
}

export async function decideAccessRequestAction(raw: unknown): Promise<ActionResult<AccessRequestDto>> {
  return runViewerAction({ name: 'team.decide_access_request', schema: decideSchema }, raw, async (ctx, input): Promise<AccessRequestDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const request = team.requests.find((r) => r.id === input.id);
      if (!request) throw new NotFoundError('access request');
      assertCan(ctx.viewer, 'access_request.decide', { partnerId: team.partnerId });
      const result = await decideAccessRequest(
        tx,
        ctx.viewer,
        input.decision === 'approve' ? { id: input.id, decision: 'approve', role: input.role } : { id: input.id, decision: 'decline' },
        ctx.clock,
      );
      await recordAudit(tx, ctx.viewer, {
        event: input.decision === 'approve' ? 'team.access_request_approved' : 'team.access_request_declined',
        target:
          input.decision === 'approve'
            ? `${request.name}, ${lower(input.role)}, at ${team.partnerName}`
            : `${request.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: request.id },
      });
      return { result, request, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      if (done.result.invite) {
        await sendEmail(
          inviteMail({
            invite: done.result.invite.invite,
            token: done.result.invite.token,
            inviteeName: done.request.name,
            inviterName: ctx.viewer.name,
            companyName: done.companyName,
          }),
        );
        return;
      }
      await sendEmail(
        buildAccessRequestDeclined({
          to: { email: done.request.email, name: done.request.name },
          requesterName: done.request.name,
          companyName: done.companyName,
        }),
      );
    });
    return done.result.request;
  });
}
