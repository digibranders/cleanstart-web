import * as Sentry from '@sentry/nextjs';
import { type Clock, systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { IntegrationError } from '@/server/errors';
import { createFileStorage } from '@/server/files/r2';
import type { FileStorage } from '@/server/files/storage';
import { log } from '@/server/log';
import { withSystem } from '@/server/repo/context';
import { purgeExpiredFiles } from '@/server/repo/documents';

export interface PurgeResult {
  /** R2 keys the database step released. */
  purged: number;
  /** Keys whose R2 delete failed. The rows are already gone, so these objects are orphans: delete them by hand. */
  failed: string[];
}

/**
 * Database first (one transaction), R2 after. A failed R2 delete cannot be retried by the next run because the rows
 * are gone, so the key is logged at error level and sent to Sentry.
 */
export async function purgeDocumentFiles(deps: { storage: FileStorage; clock: Clock }): Promise<PurgeResult> {
  const { keys } = await withSystem(SYSTEM_ACTORS.portal, (tx) => purgeExpiredFiles(tx, SYSTEM_ACTORS.portal, deps.clock));
  const failed: string[] = [];
  for (const key of keys) {
    try {
      await deps.storage.delete(key);
    } catch (error) {
      failed.push(key);
      log.error({ err: error, key }, 'document purge: R2 delete failed, delete the object by hand');
      Sentry.captureException(error, { tags: { job: 'document-purge' }, extra: { key } });
    }
  }
  return { purged: keys.length, failed };
}

export const runDocumentPurge = async (): Promise<void> => {
  let storage: FileStorage;
  try {
    storage = createFileStorage();
  } catch (error) {
    if (error instanceof IntegrationError) {
      log.warn({ err: error }, 'document-purge skipped: R2 is not configured');
      return;
    }
    throw error;
  }
  const result = await purgeDocumentFiles({ storage, clock: systemClock });
  log.info({ purged: result.purged, failed: result.failed.length }, 'document-purge done');
};
