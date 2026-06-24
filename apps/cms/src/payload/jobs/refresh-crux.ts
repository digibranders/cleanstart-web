import type { TaskConfig } from 'payload';

import { writeCache } from '../lib/integrations/cache';
import { resolveCruxCredentials } from '../lib/integrations/credentials';
import { fetchCrux } from '../lib/integrations/kinds/crux';
import { resolveSiteUrl } from '../lib/site-url';

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
    if (!creds) return { output: { skipped: 'no-api-key' } };
    const payload = await fetchCrux(creds, resolveSiteUrl(), []);
    await writeCache(req.payload, 'ga4DataApi', 'global', 'crux:default', payload);
    return { output: { records: payload.records.length } };
  },
};
