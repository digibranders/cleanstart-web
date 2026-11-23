'use server';

import { z } from 'zod';
import type { CustomerLookupResult } from '@/components/deals/types';
import { normalizeDomain, sameCustomer } from '@/lib/customer';
import { DEAL_CURRENCIES, DEAL_REGIONS, PRODUCT_LABEL, PRODUCTS } from '@/lib/domain';
import type { RegistrationListItem, RegistrationMessageDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildDealMessage } from '@/server/email/templates';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { crmSuggestions } from '@/server/registrations/customer-lookup';
import { readOnlyHubspot } from '@/server/registrations/hubspot-read';
import { sendPartnerReceipt } from '@/server/registrations/partner-receipt';
import { sendSubmissionAlert } from '@/server/registrations/staff-alert';
import { withViewer } from '@/server/repo/context';
import { postMessage } from '@/server/repo/messages';
import {
  createRegistrations,
  customerSuggestions,
  getRegistration,
  lockRegistration,
  resubmitRegistration,
} from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A blank text box is "not set". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A country is the ISO 3166 code (IN, AE) or the name (India). Stored as typed. */
const COUNTRY = /^(?:[A-Za-z]{2}|[A-Za-z][A-Za-z .,'()-]{2,79})$/;

const optionalNumber = (schema: z.ZodNumber) => schema.nullish().transform((value) => value ?? null);

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Enter the contact name.').max(120),
  role: optionalText(120),
  email: optionalText(254).refine((v) => v === null || EMAIL.test(v), 'Enter a valid email.'),
  phone: optionalText(40),
});

const registerSchema = z.object({
  partnerId: z.string().uuid().optional(),
  customer: z.string().trim().min(1, "Enter the customer's company name.").max(200),
  website: optionalText(200).refine((v) => v === null || normalizeDomain(v) !== null, 'Enter a website such as vardhancapital.in.'),
  products: z.array(z.enum(PRODUCTS)).min(1, 'Pick at least one product.'),
  region: z.enum(DEAL_REGIONS),
  managerId: z.string().uuid().nullish().transform((value) => value ?? null),
  contact: contactSchema.nullable().optional(),
  contacts: z
    .array(contactSchema)
    .max(10, 'Add at most 10 contacts.')
    .refine((list) => list.length === 0 || list.some((c) => c.email !== null || c.phone !== null), 'Give an email or phone for at least one contact.')
    .optional(),
  expectedClose: optionalText(60),
  notes: optionalText(2000),
  dealValue: optionalNumber(z.number().finite('Enter a number.').min(0, 'The deal value cannot be negative.').max(1e12, 'That deal value is too large.')),
  currency: z.enum(DEAL_CURRENCIES).optional(),
  customerCountry: optionalText(80).refine((v) => v === null || COUNTRY.test(v), 'Enter a country code such as IN or a country name.'),
  customerIndustry: optionalText(120),
  useCase: optionalText(1000),
  competitor: optionalText(200),
  seats: optionalNumber(z.number().int('Enter a whole number.').min(0, 'Seats cannot be negative.').max(10_000_000, 'That is too many seats.')),
  salesStage: optionalText(80),
  decisionDate: optionalText(10).refine((v) => v === null || (ISO_DATE.test(v) && new Date(v).toISOString().slice(0, 10) === v), 'Enter the date as YYYY-MM-DD.'),
});

export async function registerDealsAction(raw: unknown): Promise<ActionResult<RegistrationListItem[]>> {
  return runViewerAction({ name: 'registration.register', schema: registerSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'registration.create', {
        partnerId: ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : (input.partnerId ?? null),
      });
      const created = await createRegistrations(
        tx,
        ctx.viewer,
        {
          ...(input.partnerId ? { partnerId: input.partnerId } : {}),
          customer: input.customer,
          website: input.website,
          products: input.products,
          region: input.region,
          managerId: input.managerId,
          contact: input.contact ?? null,
          ...(input.contacts ? { contacts: input.contacts } : {}),
          expectedClose: input.expectedClose,
          notes: input.notes,
          dealValue: input.dealValue,
          ...(input.currency ? { currency: input.currency } : {}),
          customerCountry: input.customerCountry,
          customerIndustry: input.customerIndustry,
          useCase: input.useCase,
          competitor: input.competitor,
          seats: input.seats,
          salesStage: input.salesStage,
          decisionDate: input.decisionDate,
        },
        ctx.clock,
      );
      for (const reg of created) {
        await recordAudit(tx, ctx.viewer, {
          event: 'registration.submitted',
          target: `${reg.customer}, ${PRODUCT_LABEL[reg.product]}, from ${reg.partnerName}`,
          note:
            ctx.viewer.kind === 'staff'
              ? `Registered on behalf of ${reg.partnerName} by ${ctx.viewer.name}. Sent for approval.`
              : 'Sent for approval. CleanStart reviews it within 2 business days.',
          partnerId: reg.partnerId,
          subject: { type: 'registration', id: reg.id },
        });
      }
      const first = created[0];
      const items: NewNotification[] =
        first?.managerId
          ? [
              {
                userId: first.managerId,
                kind: 'registration_submitted',
                title: `${first.partnerName} registered ${first.customer}`,
                body: created.map((r) => PRODUCT_LABEL[r.product]).join(', '),
                link: ROUTES.admin.approvals,
              },
            ]
          : [];
      await notifyUsers(tx, items);
      return { created, items };
    });

    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.admin.approvals);
    const first = outcome.created[0];
    if (first) {
      ctx.afterCommit(() =>
        sendSubmissionAlert({
          partnerName: first.partnerName,
          customer: first.customer,
          products: outcome.created.map((r) => r.product),
          region: first.region,
          registeredByName: first.registeredByName,
          resubmitted: false,
          items: outcome.items,
        }),
      );
      if (ctx.viewer.kind === 'partner') {
        ctx.afterCommit(() =>
          sendPartnerReceipt({
            to: { email: ctx.viewer.email, name: ctx.viewer.name },
            customer: first.customer,
            products: outcome.created.map((r) => r.product),
            region: first.region,
          }),
        );
      }
    }
    return outcome.created;
  });
}

const resubmitSchema = z.object({
  id: z.string().uuid(),
  contact: z.object({
    name: z.string().trim().min(1, 'Enter the contact name.').max(120),
    role: optionalText(120),
    email: z.string().trim().regex(EMAIL, 'Enter a valid work email.'),
  }),
  note: optionalText(500),
});

export async function resubmitRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationListItem>> {
  return runViewerAction({ name: 'registration.resubmit', schema: resubmitSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.resubmit', { partnerId: current.partnerId, ownerUserId: current.registeredById });
      const updated = await resubmitRegistration(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.resubmitted',
        target: `${updated.customer}, ${PRODUCT_LABEL[updated.product]}, from ${updated.partnerName}`,
        note: `New contact ${input.contact.name} added.`,
        partnerId: updated.partnerId,
        subject: { type: 'registration', id: updated.id },
      });
      const items: NewNotification[] = updated.managerId
        ? [
            {
              userId: updated.managerId,
              kind: 'registration_resubmitted',
              title: `${updated.partnerName} resubmitted ${updated.customer}`,
              body: PRODUCT_LABEL[updated.product],
              link: ROUTES.admin.approvals,
            },
          ]
        : [];
      await notifyUsers(tx, items);
      return { updated, items };
    });
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(outcome.updated.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(() =>
      sendSubmissionAlert({
        partnerName: outcome.updated.partnerName,
        customer: outcome.updated.customer,
        products: [outcome.updated.product],
        region: outcome.updated.region,
        registeredByName: outcome.updated.registeredByName,
        resubmitted: true,
        items: outcome.items,
      }),
    );
    return outcome.updated;
  });
}

const lookupSchema = z.object({ q: z.string().trim().min(2).max(100) });

export async function lookupCustomerAction(raw: unknown): Promise<ActionResult<CustomerLookupResult>> {
  return runViewerAction({ name: 'registration.lookup_customer', schema: lookupSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'registration.lookup_customer');
    rateLimit(`lookup:user:${ctx.viewer.id}`, { limit: 10, windowSeconds: 60 });
    const own = await withViewer(ctx.viewer, (tx) => customerSuggestions(tx, ctx.viewer, { q: input.q }));
    const crm = await crmSuggestions(readOnlyHubspot(), input.q);
    return { own, crm: crm.filter((c) => !own.some((o) => sameCustomer(o.name, c.name))) };
  });
}

const postMessageSchema = z.object({
  registrationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Write a message first.').max(4000),
});

const EXCERPT_CHARS = 280;

export async function postMessageAction(raw: unknown): Promise<ActionResult<RegistrationMessageDto>> {
  return runViewerAction({ name: 'registration.post_message', schema: postMessageSchema }, raw, async (ctx, input) => {
    rateLimit(`message:user:${ctx.viewer.id}`, { limit: 30, windowSeconds: 600 });
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await getRegistration(tx, ctx.viewer, input.registrationId);
      assertCan(ctx.viewer, 'registration.message', {
        partnerId: current.partnerId,
        region: current.region,
        ownerUserId: current.registeredById,
      });
      const posted = await postMessage(tx, ctx.viewer, input, ctx.clock);
      const toPartner = ctx.viewer.kind === 'staff';
      const items: NewNotification[] = posted.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_message',
        title: `${posted.message.authorName} wrote about ${posted.registration.customer}`,
        body: posted.message.body.slice(0, EXCERPT_CHARS),
        link: toPartner ? ROUTES.partner.deal(posted.registration.id) : ROUTES.admin.approvals,
      }));
      await notifyUsers(tx, items);
      return { posted, items, toPartner };
    });

    ctx.revalidate(ROUTES.partner.deal(outcome.posted.registration.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(outcome.items)) {
        await sendEmail(
          buildDealMessage({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            authorName: outcome.posted.message.authorName,
            authorOrg: outcome.posted.message.authorOrg,
            customer: outcome.posted.registration.customer,
            excerpt: outcome.posted.message.body.slice(0, EXCERPT_CHARS),
            dealUrl: absoluteUrl(outcome.toPartner ? ROUTES.partner.deal(outcome.posted.registration.id) : ROUTES.admin.approvals),
          }),
        );
      }
    });
    return outcome.posted.message;
  });
}
