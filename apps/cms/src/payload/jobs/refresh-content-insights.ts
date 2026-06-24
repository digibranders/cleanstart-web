import type { TaskConfig } from 'payload';

import { fetchContentSnapshot } from '../lib/content-insights/fetch-snapshot';
import { writeCache } from '../lib/integrations/cache';

/**
 * Daily 06:30 UTC (just after the 06:00 GSC daily refresh) — rebuilds the
 * content-insights per-document snapshot blob that the `/admin/content-insights`
 * page reads. Gated by PAYLOAD_AUTO_RUN. The analyticsCache daily-prune cron
 * already covers the row.
 */
export const refreshContentInsightsTask: TaskConfig<'refreshContentInsights'> = {
  slug: 'refreshContentInsights',
  schedule: [{ cron: '30 6 * * *', queue: 'contentInsightsRefresh' }],
  handler: async ({ req }) => {
    const snap = await fetchContentSnapshot(req.payload);
    await writeCache(req.payload, 'ga4DataApi', 'global', 'content:snapshot', snap);
    return { output: { docs: snap.docs.length } };
  },
};
