'use server';

import { z } from 'zod';
import type { ChecklistDto, CompanyDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildManagerMessage } from '@/server/email/templates';
import { IntegrationError, ValidationError } from '@/server/errors';
import { enqueue } from '@/server/hubspot/outbox';
import { withViewer } from '@/server/repo/context';
import { getCompany, tickChecklistStep, updateCompanyProfile } from '@/server/repo/partners';
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
