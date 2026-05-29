import { extractEmail } from './extract-fields';
import type { LeadHandler, LeadSubmission } from './types';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Primary handler — writes the lead row. Detects same-form same-email
 * submissions within 24h and tags them as duplicates so CRM secondaries
 * skip the resync (the original is updated instead). Cheap audit-trail
 * preservation per arch doc §forms.
 */
export const dbPrimaryHandler: LeadHandler = {
  name: 'db-primary',
  kind: 'primary',
  async run(submission: LeadSubmission, ctx) {
    const email = extractEmail(ctx.formFieldDefs, submission.fields);
    let duplicateOf: number | undefined;

    if (email) {
      const since = new Date(Date.now() - ONE_DAY_MS).toISOString();
      const existing = await ctx.payload.find({
        collection: 'leads',
        where: {
          and: [
            { form: { equals: submission.formId } },
            { createdAt: { greater_than: since } },
          ],
        },
        limit: 50,
        depth: 0,
        overrideAccess: true,
      });
      for (const candidate of existing.docs) {
        const candidateFields =
          (candidate as { fields?: Record<string, unknown> }).fields ?? {};
        const candidateEmail = extractEmail(ctx.formFieldDefs, candidateFields);
        if (candidateEmail === email) {
          duplicateOf = (candidate as { id: number }).id;
          break;
        }
      }
    }

    const utm = submission.utm ?? {};
    const created = await ctx.payload.create({
      collection: 'leads',
      data: {
        form: submission.formId,
        formSchemaVersion: submission.formSchemaVersion,
        fields: submission.fields,
        source: submission.source ?? null,
        utm: {
          campaign: utm.campaign ?? null,
          source: utm.source ?? null,
          medium: utm.medium ?? null,
          term: utm.term ?? null,
          content: utm.content ?? null,
        },
        ip: submission.ip ?? null,
        userAgent: submission.userAgent ?? null,
        consentGivenAt: submission.consent?.givenAt ?? null,
        consentSnapshot: submission.consent?.snapshot ?? null,
        privacyPolicyVersion: submission.consent?.policyVersion ?? null,
        consentCategories: (submission.consent?.categories ?? []).map((category) => ({
          category,
        })),
        syncedTo: [],
        duplicateOf: duplicateOf ?? null,
      },
      overrideAccess: true,
    });

    // Carry the duplicate flag back to the orchestrator so secondaries can act on it.
    ctx.duplicateOfLeadId = duplicateOf;
    ctx.leadId = (created as { id: number }).id;

    return {
      handler: 'db-primary',
      status: 'synced',
      externalId: String((created as { id: number }).id),
    };
  },
};
