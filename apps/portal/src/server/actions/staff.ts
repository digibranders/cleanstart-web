'use server';

import { z } from 'zod';
import { STAFF_ROLE_LABEL, STAFF_ROLES } from '@/lib/domain';
import type { InviteDto, StaffMemberDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import { sendEmail } from '@/server/email/send';
import { buildTeamInvite } from '@/server/email/templates';
import { NotFoundError } from '@/server/errors';
import { notifyUsers } from '@/server/notify';
import { withViewer } from '@/server/repo/context';
import { createInvite, resendInvite } from '@/server/repo/invites';
import { changeStaffRegions, changeStaffRole, listStaff, removeStaff } from '@/server/repo/staff';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';
import { scopeLabel, sameScope, staffScopesSchema } from '@/lib/regions';
import { listRegions } from '@/server/repo/regions';

const inviteSchema = z.object({
  name: z.string().trim().min(1, 'Enter their name.').max(120),
  email: z.string().trim().max(254),
  role: z.enum(STAFF_ROLES),
  regions: staffScopesSchema,
});
const inviteIdSchema = z.object({ inviteId: z.string().uuid() });
const roleSchema = z.object({ userId: z.string().uuid(), role: z.enum(STAFF_ROLES) });
const regionSchema = z.object({ userId: z.string().uuid(), regions: staffScopesSchema });
const removeSchema = z.object({ id: z.string().uuid() });

const staffMail = (args: { invite: InviteDto; token: string; inviteeName: string; inviterName: string }) =>
  buildTeamInvite({
    to: { email: args.invite.email, name: args.inviteeName },
    inviteeName: args.inviteeName,
    inviterName: args.inviterName,
    audience: 'staff',
    companyName: null,
    roleLabel: STAFF_ROLE_LABEL[args.invite.role as keyof typeof STAFF_ROLE_LABEL],
    inviteUrl: inviteUrl(args.token),
    expiresOn: args.invite.expiresAt.slice(0, 10),
  });

export async function inviteStaffAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'staff.invite', schema: inviteSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    assertCan(ctx.viewer, 'staff.invite');
    const created = await withViewer(ctx.viewer, async (tx) => {
      const result = await createInvite(tx, ctx.viewer, { kind: 'staff', email: input.email, role: input.role, regions: input.regions }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.invited',
        target: `${input.name}, ${STAFF_ROLE_LABEL[input.role].toLowerCase()}, ${scopeLabel(input.regions, await listRegions(tx))}`,
        subject: { type: 'invite', id: result.invite.id },
      });
      return result;
    });
    ctx.revalidate(ROUTES.admin.team);
    ctx.afterCommit(async () => {
      await sendEmail(staffMail({ invite: created.invite, token: created.token, inviteeName: input.name, inviterName: ctx.viewer.name }));
    });
    return created.invite;
  });
}

export async function resendStaffInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'staff.resend_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    assertCan(ctx.viewer, 'staff.resend_invite');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const member = (await listStaff(tx, ctx.viewer)).find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      const resent = await resendInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.invite_resent',
        target: `${member.name}, ${STAFF_ROLE_LABEL[member.role].toLowerCase()}, ${scopeLabel(member.regions, await listRegions(tx))}`,
        subject: { type: 'invite', id: resent.invite.id },
      });
      return { resent, member };
    });
    ctx.revalidate(ROUTES.admin.team);
    ctx.afterCommit(async () => {
      await sendEmail(staffMail({ invite: done.resent.invite, token: done.resent.token, inviteeName: done.member.name, inviterName: ctx.viewer.name }));
    });
    return done.resent.invite;
  });
}

export async function changeStaffRoleAction(raw: unknown): Promise<ActionResult<StaffMemberDto>> {
  return runViewerAction({ name: 'staff.change_role', schema: roleSchema }, raw, async (ctx, input): Promise<StaffMemberDto> => {
    assertCan(ctx.viewer, 'staff.change_role');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const before = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('staff member');
      const after = await changeStaffRole(tx, ctx.viewer, { userId: input.userId, role: input.role });
      if (before.role !== after.role) {
        await recordAudit(tx, ctx.viewer, {
          event: 'staff.role_changed',
          target: `${after.name}, CleanStart team`,
          note: `${STAFF_ROLE_LABEL[before.role]} to ${STAFF_ROLE_LABEL[after.role]}.`,
          subject: { type: 'user', id: after.id },
        });
        if (after.id !== ctx.viewer.id) {
          await notifyUsers(tx, [
            {
              userId: after.id,
              kind: 'role_changed',
              title: `Your role is now ${STAFF_ROLE_LABEL[after.role]}`,
              body: `Changed by ${ctx.viewer.name}`,
              link: ROUTES.admin.account,
            },
          ]);
        }
      }
      return after;
    });
    ctx.revalidate(ROUTES.admin.team);
    return changed;
  });
}

export async function changeStaffRegionAction(raw: unknown): Promise<ActionResult<StaffMemberDto>> {
  return runViewerAction({ name: 'staff.change_region', schema: regionSchema }, raw, async (ctx, input): Promise<StaffMemberDto> => {
    assertCan(ctx.viewer, 'staff.change_region');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const before = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('staff member');
      const after = await changeStaffRegions(tx, ctx.viewer, { userId: input.userId, regions: input.regions });
      if (!sameScope(before.regions, after.regions)) {
        const list = await listRegions(tx);
        await recordAudit(tx, ctx.viewer, {
          event: 'staff.region_changed',
          target: `${after.name}, CleanStart team`,
          note: `${scopeLabel(before.regions, list)} to ${scopeLabel(after.regions, list)}.`,
          subject: { type: 'user', id: after.id },
        });
      }
      return after;
    });
    ctx.revalidate(ROUTES.admin.team);
    return changed;
  });
}

export async function removeStaffAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runViewerAction({ name: 'staff.remove', schema: removeSchema }, raw, async (ctx, input): Promise<{ id: string }> => {
    assertCan(ctx.viewer, 'staff.remove');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const member = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.id);
      if (!member) throw new NotFoundError('staff member');
      const removed = await removeStaff(tx, ctx.viewer, { userId: input.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.removed',
        target: `${removed.name}, ${STAFF_ROLE_LABEL[member.role].toLowerCase()}, ${scopeLabel(member.regions, await listRegions(tx))}`,
        subject: { type: 'user', id: removed.userId },
      });
      return { removed, hadLogin: member.inviteId !== member.id };
    });
    ctx.revalidate(ROUTES.admin.team);
    // auth_session is system-only under RLS, so the sessions go here, after commit. An invite-only teammate has none.
    if (done.hadLogin) ctx.afterCommit(async () => revokeAllSessions(done.removed.userId));
    return { id: done.removed.userId };
  });
}
