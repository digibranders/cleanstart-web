import type { TaskConfig } from 'payload';

import { refreshAllCloudflareWa } from '../lib/integrations/kinds/cloudflare-web-analytics';
import { refreshAllGa4 } from '../lib/integrations/kinds/ga4-data-api';

/**
 * Frequent dashboard cache refresh — GA4 + Cloudflare Web Analytics.
 *
 * Schedule: every 15 minutes via `dashboardRefreshFrequent` queue,
 * staggered with the daily refresh and existing crons so two jobs
 * never overlap on a 2-vCPU droplet.
 *
 * Each provider's refresher iterates its enabled DB-backed rows and
 * writes one cache entry per row. Errors are isolated per provider —
 * a GA4 outage never blocks the CF WA refresh.
 */
export const dashboardRefreshFrequentTask: TaskConfig<'dashboardRefreshFrequent'> = {
  slug: 'dashboardRefreshFrequent',
  retries: 0,
  schedule: [{ cron: '*/15 * * * *', queue: 'dashboardRefreshFrequent' }],
  handler: async ({ req }) => {
    const [ga4, cfwa] = await Promise.all([
      refreshAllGa4(req.payload),
      refreshAllCloudflareWa(req.payload),
    ]);
    req.payload.logger.info(
      { ga4, cfwa },
      'Dashboard frequent refresh complete',
    );
    return {
      output: {
        ga4Cached: ga4.cached,
        cfwaCached: cfwa.cached,
        ok: ga4.ok && cfwa.ok,
      },
    };
  },
};
