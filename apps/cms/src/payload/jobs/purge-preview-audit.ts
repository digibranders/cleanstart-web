import type { TaskConfig } from 'payload';

import { purgePreviewAudit } from '../lib/retention/purge-preview-audit';

/**
 * Daily previewAudit retention purge — drops rows whose
 * `expiresAt` is older than 90 days. Tied to its queue at 03:30
 * UTC; `payload.config.ts` autoRun drains that queue on the same
 * tick. Gated by PAYLOAD_AUTO_RUN per repo convention.
 */
export const purgePreviewAuditTask: TaskConfig<'purgePreviewAudit'> = {
  slug: 'purgePreviewAudit',
  retries: 0,
  schedule: [{ cron: '30 3 * * *', queue: 'previewAuditPurge' }],
  handler: async ({ req }) => {
    const result = await purgePreviewAudit(
      req.payload as unknown as Parameters<typeof purgePreviewAudit>[0],
    );
    return { output: result };
  },
};
