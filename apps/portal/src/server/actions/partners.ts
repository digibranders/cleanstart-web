'use server';

import { z } from 'zod';
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS, PARTNER_ROLE_LABEL } from '@/lib/domain';
import type { ChecklistDto, CompanyDto, PartnerListRow } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import { sendEmail } from '@/server/email/send';
import { buildManagerMessage, buildTeamInvite } from '@/server/email/templates';
import { IntegrationError, ValidationError } from '@/server/errors';
import { enqueue } from '@/server/hubspot/outbox';
import { withViewer } from '@/server/repo/context';
import {
  createPartner,
  getCompany,
  getPartnerDetail,
  resendPartnerInvites,
  restorePartner,
  setPartnerCategory,
  setPartnerManager,
  suspendPartner,
  tickChecklistStep,
  updateCompanyProfile,
} from '@/server/repo/partners';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const companySchema = z.object({
  partnerId: z.string().uuid().optional(),
  website: z.string().trim().max(200),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  about: z.string().trim().max(1000),
});

const PROFILE_FIELDS = [
  ['website', 'website'],
  ['phone', 'phone'],
  ['address', 'address'],
  ['about', 'what you sell'],
] as const;

const newPartnerSchema = z.object({
  name: z.string().trim().min(1, 'Enter the company name.').max(200),
  website: z.string().trim().max(200),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  adminName: z.string().trim().max(120),
  adminEmail: z.string().trim().max(254),
  sendInvite: z.boolean(),
});
const partnerIdSchema = z.object({ id: z.string().uuid() });
const managerSchema = z.object({ id: z.string().uuid(), managerId: z.string().uuid() });
const categorySchema = z.object({ id: z.string().uuid(), category: z.enum(PARTNER_CATEGORIES) });

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

const joinWords = (words: readonly string[]): string =>
  words.length <= 1 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

export async function updateCompanyProfileAction(raw: unknown): Promise<ActionResult<CompanyDto>> {
  return runViewerAction({ name: 'partner.update_profile', schema: companySchema }, raw, async (ctx, input): Promise<CompanyDto> => {
    const target = input.partnerId ?? (ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : undefined);
    if (!target) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
    assertCan(ctx.viewer, 'partner.update_profile', { partnerId: target });
    const result = await withViewer(ctx.viewer, async (tx) => {
      const before = await getCompany(tx, ctx.viewer, { partnerId: target });
      const saved = await updateCompanyProfile(tx, ctx.viewer, {
        partnerId: target,
        website: input.website || null,
        phone: input.phone || null,
        address: input.address || null,
        about: input.about || null,
      });
      const changed = PROFILE_FIELDS.filter(([key]) => (before[key] ?? '') !== (saved.company[key] ?? ''));
      if (changed.length > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.profile_updated',
          target: saved.company.name,
          note: `Updated ${joinWords(changed.map(([, label]) => label))}`,
          partnerId: target,
          subject: { type: 'partner', id: target },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: target, version: String(Date.parse(saved.updatedAt)) });
      }
      return saved.company;
    });
    ctx.revalidate(ROUTES.partner.company);
    ctx.revalidate(ROUTES.admin.partners);
    return result;
  });
}

const editVersion = (now: Date): string => String(now.getTime());

export async function createPartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.create', schema: newPartnerSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.create');
    const created = await withViewer(ctx.viewer, async (tx) => {
      const result = await createPartner(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'partner.created',
        target: result.partner.name,
        note: `${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}. Partner admin ${input.adminName || input.adminEmail}${result.invite ? '. Invite sent.' : '. Invite not sent yet.'}`,
        partnerId: result.partner.id,
        subject: { type: 'partner', id: result.partner.id },
      });
      await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: '1' });
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    const invite = created.invite;
    if (invite) {
      ctx.afterCommit(async () => {
        await sendEmail(
          buildTeamInvite({
            to: { email: invite.invite.email, ...(input.adminName ? { name: input.adminName } : {}) },
            inviteeName: input.adminName || null,
            inviterName: ctx.viewer.name,
            audience: 'partner',
            companyName: created.partner.name,
            roleLabel: PARTNER_ROLE_LABEL.partner_admin,
            inviteUrl: inviteUrl(invite.token),
            expiresOn: invite.invite.expiresAt.slice(0, 10),
          }),
        );
      });
    }
    return created.partner;
  });
}

export async function setPartnerManagerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.change_manager', schema: managerSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.change_manager');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerManager(tx, ctx.viewer, input, ctx.clock);
      if (result.previousManagerName !== result.partner.managerName) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.manager_changed',
          target: result.partner.name,
          note: `${result.previousManagerName ?? 'Nobody'} to ${result.partner.managerName ?? 'Nobody'}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: editVersion(ctx.clock.now()) });
      }
      return result.partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.revalidate(ROUTES.partner.company);
    return changed;
  });
}

export async function setPartnerCategoryAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.change_category', schema: categorySchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.change_category');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerCategory(tx, ctx.viewer, input, ctx.clock);
      if (result.previousCategory !== result.partner.category) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.category_changed',
          target: result.partner.name,
          note: `${PARTNER_CATEGORY_LABEL[result.previousCategory]} to ${PARTNER_CATEGORY_LABEL[result.partner.category]}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: editVersion(ctx.clock.now()) });
      }
      return result.partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.revalidate(ROUTES.partner.company);
    return changed;
  });
}

export async function suspendPartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.suspend', schema: partnerIdSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.suspend');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const before = await getPartnerDetail(tx, ctx.viewer, input.id);
      const partner = await suspendPartner(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (before.status !== 'suspended') {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.suspended',
          target: partner.name,
          partnerId: partner.id,
          subject: { type: 'partner', id: partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: editVersion(ctx.clock.now()) });
      }
      return { partner, personIds: before.people.map((p) => p.id), changed: before.status !== 'suspended' };
    });
    ctx.revalidate(ROUTES.admin.partners);
    // auth_session is system-only under RLS, so the sessions go here, after commit. An invite-only row has none.
    if (done.changed) {
      ctx.afterCommit(async () => {
        for (const id of done.personIds) await revokeAllSessions(id);
      });
    }
    return done.partner;
  });
}

export async function restorePartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.restore', schema: partnerIdSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.restore');
    const restored = await withViewer(ctx.viewer, async (tx) => {
      const before = await getPartnerDetail(tx, ctx.viewer, input.id);
      const partner = await restorePartner(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (before.status === 'suspended') {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.restored',
          target: partner.name,
          partnerId: partner.id,
          subject: { type: 'partner', id: partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: editVersion(ctx.clock.now()) });
      }
      return partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    return restored;
  });
}

export async function resendPartnerInvitesAction(raw: unknown): Promise<ActionResult<{ count: number }>> {
  return runViewerAction({ name: 'partner.resend_invites', schema: partnerIdSchema }, raw, async (ctx, input): Promise<{ count: number }> => {
    assertCan(ctx.viewer, 'partner.resend_invites');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const result = await resendPartnerInvites(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (result.invites.length > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'team.invite_resent',
          target: result.partner.name,
          note: `${result.invites.length} ${result.invites.length === 1 ? 'person' : 'people'}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
      }
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      for (const item of done.invites) {
        await sendEmail(
          buildTeamInvite({
            to: { email: item.invite.email, ...(item.inviteeName ? { name: item.inviteeName } : {}) },
            inviteeName: item.inviteeName,
            inviterName: ctx.viewer.name,
            audience: 'partner',
            companyName: done.partner.name,
            roleLabel: PARTNER_ROLE_LABEL[item.invite.role as keyof typeof PARTNER_ROLE_LABEL],
            inviteUrl: inviteUrl(item.token),
            expiresOn: item.invite.expiresAt.slice(0, 10),
          }),
        );
      }
    });
    return { count: done.invites.length };
  });
}
