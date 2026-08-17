import type { TaskConfig } from 'payload';

import { writeCache } from '../lib/integrations/cache';
import { resolveCruxCredentials } from '../lib/integrations/credentials';
import { fetchCrux, resolveCruxOrigin } from '../lib/integrations/kinds/crux';

/**
 * Daily 06:45 UTC — caches origin-level Core Web Vitals (p75 LCP/INP/CLS,
 * both form factors) from the CrUX API. No-op when CRUX_API_KEY is unset.
 * Gated by PAYLOAD_AUTO_RUN.
 */
export const refreshCruxTask: TaskConfig<'refreshCrux'> = {
  slug: 'refreshCrux',
  schedule: [{ cron: '45 6 * * *', queue: 'cruxRefresh' }],
  handler: async ({ req }) => {
    const creds = resolveCruxCredentials();
    if (!creds) {
      // Logged, not silent: an unset key looked identical to a healthy run
      // from the outside, which is how this job went unnoticed for weeks.
      req.payload.logger.warn('refreshCrux skipped — CRUX_API_KEY is not set');
      return { output: { skipped: 'no-api-key' } };
    }
    const origin = resolveCruxOrigin();
    const payload = await fetchCrux(creds, origin, []);
    await writeCache(req.payload, 'ga4DataApi', 'global', 'crux:default', payload);
    req.payload.logger.info(
      { origin, records: payload.records.length },
      'refreshCrux complete',
    );
    return { output: { records: payload.records.length } };
  },
};
