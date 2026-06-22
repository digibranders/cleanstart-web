import type { TaskConfig } from 'payload';

import { purgeConsentLog } from '../lib/retention/purge-consent-log';

/**
 * Daily consentLog retention purge — drops cookie-consent proof rows
 * older than 24 months (GDPR Art. 5(1)(e) storage limitation). The
 * record is append-only audit data with no direct PII (IP/UA are
 * stored only as salted HMAC hashes), so a hard delete is the correct
 * disposal once the consent it evidences has lapsed.
 *
 * `schedule` ties the task to its queue on a 04:00 UTC cron;
 * `payload.config.ts` autoRun drains that queue on the same tick.
 */
export const purgeConsentLogTask: TaskConfig<'purgeConsentLog'> = {
  slug: 'purgeConsentLog',
  retries: 0,
  schedule: [{ cron: '0 4 * * *', queue: 'consentLogPurge' }],
  handler: async ({ req }) => {
    const result = await purgeConsentLog(
      req.payload as unknown as Parameters<typeof purgeConsentLog>[0],
    );
    return { output: result };
  },
};
