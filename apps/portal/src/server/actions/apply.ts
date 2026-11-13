'use server';

import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { env } from '@/env';
import { type ApplyOutcome, APPLY_EMAIL_RULE, APPLY_IP_RULE } from '@/lib/apply';
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from '@/lib/domain';
import { emailDomain, isPlausibleDomain, normaliseDomain } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { APPLY_RECEIPT_COOKIE, APPLY_RECEIPT_TTL_SECONDS, signApplyReceipt } from '@/server/apply-receipt';
import { recordAudit } from '@/server/audit/record';
import { publicActor } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildApplicationReceived, buildApplicationStaffAlert } from '@/server/email/templates';
import { ValidationError } from '@/server/errors';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers } from '@/server/notify';
import { alertAddresses } from '@/server/people';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { createPortalApplication, findPartnerByDomain, listManagerRecipients } from '@/server/repo/applications';
import { verifyTurnstile } from '@/server/turnstile';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runPublicAction } from './run';

const text = (max: number) => z.string().trim().max(max);

const applySchema = z.object({
  company: text(200).min(1, 'Enter your company name.'),
  website: text(200),
  name: text(120).min(1, 'Enter your name.'),
  title: text(120),
  email: z.string().trim().max(254),
  phone: text(40),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  reason: text(2000).min(1, 'Tell us who you sell to and what you sell today.'),
  turnstileToken: z.string().max(2048).nullable(),
});

/** The server rule uses the full free-mail corpus; the form already used the curated list for instant feedback. */
const workEmail = (value: string): string => {
  const checked = validateBusinessEmail(value, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
  if (checked.ok) return checked.email;
  throw new ValidationError([
    {
      path: 'email',
      message: checked.reason === 'free-mail' ? 'Use your company email, not a personal address.' : 'Enter a valid work email.',
    },
  ]);
};

export async function submitApplicationAction(raw: unknown): Promise<ActionResult<ApplyOutcome>> {
  return runPublicAction({ name: 'application.submit', schema: applySchema }, raw, async (ctx, input): Promise<ApplyOutcome> => {
    const email = workEmail(input.email);
    if (ctx.ip) rateLimit(`apply:ip:${ctx.ip}`, APPLY_IP_RULE);
    rateLimit(`apply:email:${email}`, APPLY_EMAIL_RULE);
    await verifyTurnstile({ token: input.turnstileToken, ip: ctx.ip });

    const emailHost = emailDomain(email);
    const site = normaliseDomain(input.website);
    const domain = isPlausibleDomain(site) ? site : emailHost;
    const actor = publicActor(input.name);

    const saved = await withSystem(actor, async (tx) => {
      const existing = await findPartnerByDomain(tx, actor, emailHost);
      if (existing) return { kind: 'existing' as const, partnerName: existing.name };

      const { application, merged } = await createPortalApplication(
        tx,
        actor,
        {
          company: input.company,
          domain,
          applicantName: input.name,
          email,
          role: input.title || null,
          phone: input.phone || null,
          category: input.category,
          region: input.region,
          reason: input.reason,
          source: 'portal',
          sourceRef: null,
          personalEmail: false,
          existingDomain: false,
        },
        ctx.clock,
      );
      await recordAudit(tx, actor, {
        event: 'application.submitted',
        target: application.company,
        note: `${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}${merged ? '. Updated an open application.' : ''}`,
        subject: { type: 'application', id: application.id },
      });
      const managers = await listManagerRecipients(tx, actor);
      const items: NewNotification[] = managers.map((manager) => ({
        userId: manager.userId,
        kind: 'application_new',
        title: `New application from ${application.company}`,
        body: `${application.applicantName}, ${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}`,
        link: `${ROUTES.admin.partners}?tab=applications`,
      }));
      await notifyUsers(tx, items);
      return { kind: 'created' as const, application, managers };
    });

    if (saved.kind === 'existing') return { outcome: 'existing_partner', partnerName: saved.partnerName };

    const { application, managers } = saved;
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationReceived({
          to: { email, name: input.name },
          applicantName: input.name,
          company: application.company,
          reference: application.reference,
        }),
      );
      const to = alertAddresses(managers, env.PARTNERS_NOTIFY_EMAIL);
      if (to.length === 0) {
        log.warn({ reference: application.reference }, 'no staff recipient for a new application');
        return;
      }
      await sendEmail(
        buildApplicationStaffAlert({
          to,
          reference: application.reference,
          company: application.company,
          domain: application.domain,
          applicantName: application.applicantName,
          applicantEmail: application.email,
          categoryLabel: PARTNER_CATEGORY_LABEL[input.category],
          regionLabel: PARTNER_REGION_LABEL[input.region],
          source: 'portal',
          personalEmail: false,
          existingDomain: false,
          reason: application.reason,
          reviewUrl: absoluteUrl(`${ROUTES.admin.partners}?tab=applications`),
        }),
      );
    });
    ctx.revalidate(ROUTES.admin.partners);

    (await cookies()).set(
      APPLY_RECEIPT_COOKIE,
      signApplyReceipt(
        {
          reference: application.reference,
          company: application.company,
          firstName: input.name.split(' ')[0] ?? input.name,
          email,
          category: input.category,
          region: input.region,
          submittedOn: ctx.clock.today(),
        },
        ctx.clock.now(),
      ),
      { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/apply', maxAge: APPLY_RECEIPT_TTL_SECONDS },
    );
    return { outcome: 'submitted', reference: application.reference };
  });
}
