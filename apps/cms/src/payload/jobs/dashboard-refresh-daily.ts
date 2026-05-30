import type { TaskConfig } from 'payload';

import { refreshAllClarity } from '../lib/integrations/kinds/ms-clarity';
import { refreshAllGsc } from '../lib/integrations/kinds/gsc-search-analytics';

/**
 * Daily dashboard cache refresh — GSC Search Analytics + MS Clarity.
 *
 * Schedule: daily at 06:00 UTC via `dashboardRefreshDaily` queue.
 *
 * Why daily not frequent:
 *  - GSC search-analytics data is bucketed in days; intra-day polling
 *    returns the same numbers and burns quota for nothing.
 *  - Clarity Data Export caps at 10 requests/project/day — daily is
 *    the safe ceiling.
 */
export const dashboardRefreshDailyTask: TaskConfig<'dashboardRefreshDaily'> = {
  slug: 'dashboardRefreshDaily',
  retries: 0,
  schedule: [{ cron: '0 6 * * *', queue: 'dashboardRefreshDaily' }],
  handler: async ({ req }) => {
    const [gsc, clarity] = await Promise.all([
      refreshAllGsc(req.payload),
      refreshAllClarity(req.payload),
    ]);
    req.payload.logger.info(
      { gsc, clarity },
      'Dashboard daily refresh complete',
    );
    return {
      output: {
        gscCached: gsc.cached,
        clarityCached: clarity.cached,
        ok: gsc.ok && clarity.ok,
      },
    };
  },
};
