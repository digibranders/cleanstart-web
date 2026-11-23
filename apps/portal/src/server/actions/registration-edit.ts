'use server';

import { z } from 'zod';
import { normalizeDomain } from '@/lib/customer';
import { DEAL_CURRENCIES, PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { staffDealHref } from '@/lib/staff-deals-dto';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { notifyUsers } from '@/server/notify';
import { type Tx, withViewer } from '@/server/repo/context';
import {
  addRegistrationContact,
  editRegistration,
  removeRegistrationContact,
  updateRegistrationContact,
} from '@/server/repo/registration-edit';
import { lockRegistration } from '@/server/repo/registrations';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const COUNTRY = /^(?:[A-Za-z]{2}|[A-Za-z][A-Za-z .,'()-]{2,79})$/;

const isRealDate = (v: string): boolean => ISO_DATE.test(v) && new Date(v).toISOString().slice(0, 10) === v;

/** Missing means "leave alone"; a blank box or null means "clear". The create form's rules otherwise. */
const patchText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? undefined : v || null));

const patchNumber = (schema: z.ZodNumber) => schema.nullable().optional();

const fieldsSchema = z.object({
  customer: z.string().trim().min(1, "Enter the customer's company name.").max(200).optional(),
  website: patchText(200).refine((v) => v === undefined || v === null || normalizeDomain(v) !== null, 'Enter a website such as vardhancapital.in.'),
  customerCountry: patchText(80).refine((v) => v === undefined || v === null || COUNTRY.test(v), 'Enter a country code such as IN or a country name.'),
  customerIndustry: patchText(120),
  useCase: patchText(1000),
  competitor: patchText(200),
  seats: patchNumber(z.number().int('Enter a whole number.').min(0, 'Seats cannot be negative.').max(10_000_000, 'That is too many seats.')),
  dealValue: patchNumber(z.number().finite('Enter a number.').min(0, 'The deal value cannot be negative.').max(1e12, 'That deal value is too large.')),
  currency: z.enum(DEAL_CURRENCIES).optional(),
  salesStage: patchText(80),
  expectedClose: patchText(10).refine((v) => v === undefined || v === null || isRealDate(v), 'Enter the date as YYYY-MM-DD.'),
  decisionDate: patchText(10).refine((v) => v === undefined || v === null || isRealDate(v), 'Enter the date as YYYY-MM-DD.'),
  notes: patchText(2000),
});

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter the contact name.').max(120),
  role: patchText(120).transform((v) => v ?? null),
  email: patchText(254)
    .refine((v) => v === undefined || v === null || EMAIL.test(v), 'Enter a valid email.')
    .transform((v) => v ?? null),
  phone: patchText(40).transform((v) => v ?? null),
});

const idSchema = z.string().uuid();

/** Same rule as resubmit: the company's admin, or the sales user who registered the deal. Staff cannot edit a partner's registration. */
async function authorize(
  ctx: { viewer: Viewer },
  tx: Tx,
  id: string,
): Promise<void> {
  if (ctx.viewer.kind !== 'partner') throw new ForbiddenError('only the registering partner can edit a registration');
  const current = await lockRegistration(tx, ctx.viewer, id);
  assertCan(ctx.viewer, 'registration.resubmit', { partnerId: current.partnerId, ownerUserId: current.registeredById });
}

const targetOf = (r: RegistrationDetailDto): string => `${r.customer}, ${PRODUCT_LABEL[r.product]}, from ${r.partnerName}`;

function revalidateDeal(ctx: { revalidate: (path: string) => void }, id: string): void {
  ctx.revalidate(ROUTES.partner.deals);
  ctx.revalidate(ROUTES.partner.deal(id));
  ctx.revalidate(ROUTES.admin.approvals);
}

export async function editRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  const schema = z.object({ id: idSchema, fields: fieldsSchema });
  return runViewerAction({ name: 'registration.edit', schema }, raw, async (ctx, input) => {
    const result = await withViewer(ctx.viewer, async (tx) => {
      await authorize(ctx, tx, input.id);
      const outcome = await editRegistration(tx, ctx.viewer, { id: input.id, patch: input.fields }, ctx.clock);
      if (outcome.changes.length === 0) return outcome;
      const reg = outcome.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.edited',
        target: targetOf(reg),
        note: `Changed ${outcome.changes.map((c) => c.label.toLowerCase()).join(', ')} before review.`,
        before: outcome.changes.map((c) => `${c.label}: ${c.before}`).join('; '),
        after: outcome.changes.map((c) => `${c.label}: ${c.after}`).join('; '),
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      if (reg.managerId) {
        await notifyUsers(tx, [
          {
            userId: reg.managerId,
            kind: 'registration_resubmitted',
            title: `${reg.partnerName} edited ${reg.customer}`,
            body: `${PRODUCT_LABEL[reg.product]}: ${outcome.changes.map((c) => c.label.toLowerCase()).join(', ')}`,
            link: staffDealHref(reg.id),
          },
        ]);
      }
      return outcome;
    });
    revalidateDeal(ctx, result.registration.id);
    return result.registration;
  });
}

/** One audit entry and one manager alert for a contact change; the registration is already pending, so nothing reaches the CRM. */
async function contactChanged(
  ctx: { viewer: Viewer },
  tx: Tx,
  reg: RegistrationDetailDto,
  note: string,
): Promise<void> {
  await recordAudit(tx, ctx.viewer, {
    event: 'registration.edited',
    target: targetOf(reg),
    note,
    partnerId: reg.partnerId,
    subject: { type: 'registration', id: reg.id },
  });
  if (reg.managerId) {
    await notifyUsers(tx, [
      {
        userId: reg.managerId,
        kind: 'registration_resubmitted',
        title: `${reg.partnerName} changed the contacts on ${reg.customer}`,
        body: `${PRODUCT_LABEL[reg.product]}. ${note}`,
        link: staffDealHref(reg.id),
      },
    ]);
  }
}

export async function addRegistrationContactAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  const schema = z.object({ id: idSchema, contact: contactSchema });
  return runViewerAction({ name: 'registration.contact_add', schema }, raw, async (ctx, input) => {
    const reg = await withViewer(ctx.viewer, async (tx) => {
      await authorize(ctx, tx, input.id);
      const updated = await addRegistrationContact(tx, ctx.viewer, input, ctx.clock);
      await contactChanged(ctx, tx, updated, `Contact ${input.contact.name} added.`);
      return updated;
    });
    revalidateDeal(ctx, reg.id);
    return reg;
  });
}

export async function updateRegistrationContactAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  const schema = z.object({ id: idSchema, contactId: idSchema, contact: contactSchema });
  return runViewerAction({ name: 'registration.contact_update', schema }, raw, async (ctx, input) => {
    const reg = await withViewer(ctx.viewer, async (tx) => {
      await authorize(ctx, tx, input.id);
      const before = (await lockRegistration(tx, ctx.viewer, input.id)).contacts.find((c) => c.id === input.contactId);
      const updated = await updateRegistrationContact(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.edited',
        target: targetOf(updated),
        note: `Contact ${input.contact.name} updated.`,
        ...(before ? { before: [before.name, before.role, before.email, before.phone].filter(Boolean).join(', ') } : {}),
        after: [input.contact.name, input.contact.role, input.contact.email, input.contact.phone].filter(Boolean).join(', '),
        partnerId: updated.partnerId,
        subject: { type: 'registration', id: updated.id },
      });
      return updated;
    });
    revalidateDeal(ctx, reg.id);
    return reg;
  });
}

export async function removeRegistrationContactAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  const schema = z.object({ id: idSchema, contactId: idSchema });
  return runViewerAction({ name: 'registration.contact_remove', schema }, raw, async (ctx, input) => {
    const reg = await withViewer(ctx.viewer, async (tx) => {
      await authorize(ctx, tx, input.id);
      const gone = (await lockRegistration(tx, ctx.viewer, input.id)).contacts.find((c) => c.id === input.contactId);
      const updated = await removeRegistrationContact(tx, ctx.viewer, input, ctx.clock);
      await contactChanged(ctx, tx, updated, `Contact ${gone?.name ?? 'entry'} removed.`);
      return updated;
    });
    revalidateDeal(ctx, reg.id);
    return reg;
  });
}
