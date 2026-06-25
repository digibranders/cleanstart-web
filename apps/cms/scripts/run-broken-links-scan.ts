#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot trigger for the nightly `checkBrokenLinks` scan.
 *
 * Boots Payload and invokes the exact same task handler the cron runs,
 * so behaviour is identical: every external link on every published doc
 * is re-checked, actionable rows (broken / network / redirect) are
 * upserted, and any row whose link now resolves OK — or no longer
 * appears in any doc — is deleted. In other words, running this clears
 * out the links that have since been resolved without waiting for the
 * 04:30 UTC cron.
 *
 * Idempotent / re-runnable. No new code paths — pure re-use of the cron.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/run-broken-links-scan.ts
 *
 * In the prod container (env already present):
 *   node --no-warnings --experimental-strip-types scripts/run-broken-links-scan.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { checkBrokenLinksTask } from '../src/payload/jobs/check-broken-links.ts';

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  const before = await payload.count({ collection: 'brokenLinks', overrideAccess: true });
  payload.logger.info(`[broken-links] rows before scan: ${before.totalDocs}`);

  // The handler only reads `req.payload`; the rest of the task args are
  // unused for an on-demand run.
  const result = await checkBrokenLinksTask.handler({
    req: { payload },
  } as Parameters<typeof checkBrokenLinksTask.handler>[0]);

  const after = await payload.count({ collection: 'brokenLinks', overrideAccess: true });
  payload.logger.info(
    `[broken-links] done — ${JSON.stringify(result.output)} · rows after scan: ${after.totalDocs}`,
  );

  process.exit(0);
};

run().catch((err) => {
  console.error('[broken-links] scan failed:', err);
  process.exit(1);
});
