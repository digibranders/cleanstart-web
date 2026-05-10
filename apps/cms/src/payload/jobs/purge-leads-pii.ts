import type { TaskConfig } from 'payload';

import { purgeLeadsPii } from '../lib/retention/purge-leads-pii';

/**
 * Daily leads-PII redaction — nullifies ip, userAgent, and the
 * email/phone keys inside the `fields` JSON on leads older than 365
 * days per arch doc §retention. The row, formId, source, consent
 * metadata, and non-PII answers are preserved.
 */
export const purgeLeadsPiiTask: TaskConfig<'purgeLeadsPii'> = {
  slug: 'purgeLeadsPii',
  retries: 0,
  schedule: [{ cron: '15 3 * * *', queue: 'leadsPiiPurge' }],
  handler: async ({ req }) => {
    const result = await purgeLeadsPii(
      req.payload as unknown as Parameters<typeof purgeLeadsPii>[0],
    );
    return { output: result };
  },
};
