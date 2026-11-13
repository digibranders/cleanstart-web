'use server';

import { z } from 'zod';
import type { CustomerLookupResult } from '@/components/deals/types';
import { normalizeDomain, sameCustomer } from '@/lib/customer';
import { DEAL_REGIONS, PRODUCT_LABEL, PRODUCTS } from '@/lib/domain';
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

const registerSchema = z.object({
  partnerId: z.string().uuid().optional(),
  customer: z.string().trim().min(1, "Enter the customer's company name.").max(200),
  website: optionalText(200).refine((v) => v === null || normalizeDomain(v) !== null, 'Enter a website such as vardhancapital.in.'),
  products: z.array(z.enum(PRODUCTS)).min(1, 'Pick at least one product.'),
  region: z.enum(DEAL_REGIONS),
  managerId: z.string().uuid().nullish().transform((value) => value ?? null),
  contact: z
    .object({
      name: z.string().trim().min(1, 'Enter the contact name.').max(120),
      role: optionalText(120),
      email: optionalText(254).refine((v) => v === null || EMAIL.test(v), 'Enter a valid email.'),
      phone: optionalText(40),
    })
    .nullable(),
  expectedClose: optionalText(60),
  notes: optionalText(2000),
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
          contact: input.contact,
          expectedClose: input.expectedClose,
          notes: input.notes,
        },
        ctx.clock,
      );
      for (const reg of created) {
        await recordAudit(tx, ctx.viewer, {
          event: 'registration.submitted',
          target: `${reg.customer}, ${PRODUCT_LABEL[reg.product]}, from ${reg.partnerName}`,
          note: 'Sent for approval. CleanStart reviews it within 2 business days.',
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
