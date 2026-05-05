import { companyFromEmailDomain } from './enrichment';
import type { LeadHandler, LeadSubmission } from './types';

const findEmail = (fields: Record<string, unknown>): string | null => {
  for (const value of Object.values(fields)) {
    if (typeof value === 'string' && value.includes('@')) return value;
  }
  return null;
};

/**
 * Free at-launch enrichment handler — derives company name from the
 * work-email domain and writes it back to `leads.enriched`. Always
 * registered (no env gate); silently skipped when no email field is
 * present or the email is free-mail / disposable.
 *
 * Result lands at:
 *   leads.enriched['company-from-domain'] = { domain, company }
 *
 * which marketers can use as a column in the lead-list view + CSV export.
 */
export const companyFromDomainHandler: LeadHandler = {
  name: 'company-from-domain',
  kind: 'secondary',
  async run(submission: LeadSubmission, ctx) {
    if (ctx.leadId == null) {
      return {
        handler: 'company-from-domain',
        status: 'skipped',
        reason: 'no-lead-id',
      };
    }

    const email = findEmail(submission.fields);
    const enrichment = companyFromEmailDomain(email);
    if (!enrichment) {
      return {
        handler: 'company-from-domain',
        status: 'skipped',
        reason: email ? 'free-mail-or-generic' : 'no-email-field',
      };
    }

    const existing = (await ctx.payload.findByID({
      collection: 'leads',
      id: ctx.leadId,
      depth: 0,
      overrideAccess: true,
    })) as { enriched?: Record<string, unknown> | null } | null;

    const merged: Record<string, unknown> = {
      ...(existing?.enriched ?? {}),
      'company-from-domain': enrichment,
    };

    await ctx.payload.update({
      collection: 'leads',
      id: ctx.leadId,
      data: { enriched: merged },
      overrideAccess: true,
    });

    return {
      handler: 'company-from-domain',
      status: 'synced',
      externalId: enrichment.company,
    };
  },
};
