import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getR2Client } from './r2';
import type { LeadSubmission } from './lead-handlers/types';

/**
 * Active queue (drain candidates) and the dead-letter quarantine prefix
 * for entries the drain task gave up on after MAX_ATTEMPTS retries.
 */
const QUEUE_PREFIX = 'lead-fallback-queue/';
const QUARANTINE_PREFIX = 'lead-fallback-queue/abandoned/';

const dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * In dev / test we fall back to a path next to the source tree so a
 * fresh clone "just works" without env setup. In production this
 * relative path can land inside the Next build output and get wiped
 * on the next deploy, taking parked submissions with it — so we
 * require the operator to pin LEAD_QUEUE_LOCAL_DIR explicitly.
 */
const defaultQueueDir = path.resolve(dirname, '../../../.lead-fallback-queue');
const localQueueDir = (): string => {
  const fromEnv = process.env.LEAD_QUEUE_LOCAL_DIR;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'LEAD_QUEUE_LOCAL_DIR is required in production so the lead-fallback queue path survives deploys. ' +
        'Point it at a persistent volume (e.g. /var/lib/cleanstart/lead-fallback-queue).',
    );
  }
  return defaultQueueDir;
};
const localQuarantineDir = (): string => path.join(localQueueDir(), 'abandoned');

export type QueuedSubmission = {
  /** Stable id (sortable by lex order). Always ends in `.json`. */
  key: string;
  /** Captured at the moment the queue accepted the submission. */
  parkedAt: string;
  /** Submission payload exactly as the LeadHandler chain would have received it. */
  submission: LeadSubmission;
  /** Why the submission ended up in the queue (DB error, R2-only mode, etc.). */
  reason: string;
  /** How many times the drain task has tried to flush this submission. Persisted across retries. */
  attempts: number;
  /** Set while a worker holds the lease. Other workers skip leased entries until expiry. */
  leaseId?: string | undefined;
  /** ISO timestamp of when the current lease expires. */
  leasedUntil?: string | undefined;
};

const newKey = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}.json`;
};

const ensureLocalDir = async (dir: string): Promise<void> => {
  await mkdir(dir, { recursive: true });
};

const localPathFor = (key: string): string => path.join(localQueueDir(), key);
const localQuarantinePathFor = (key: string): string => path.join(localQuarantineDir(), key);

const stringifyEntry = (entry: QueuedSubmission): string => JSON.stringify(entry, null, 2);

const parseEntry = (text: string): QueuedSubmission | null => {
  try {
    const parsed = JSON.parse(text) as QueuedSubmission;
    if (typeof parsed?.key !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Park a submission for later drain.
 *
 * Tries R2 first when configured; falls back to a local on-disk dir
 * when R2 isn't reachable. Local-only mode is fine for dev; production
 * relies on R2 so a droplet failure doesn't lose the queue.
 */
export const parkSubmission = async (
  submission: LeadSubmission,
  reason: string,
  attempts = 0,
): Promise<{ ok: true; key: string; sink: 'r2' | 'local' } | { ok: false; error: string }> => {
  const key = newKey();
  const entry: QueuedSubmission = {
    key,
    parkedAt: new Date().toISOString(),
    submission,
    reason,
    attempts,
  };
  const body = stringifyEntry(entry);

  const r2 = getR2Client();
  if (r2) {
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: `${QUEUE_PREFIX}${key}`,
          Body: body,
          ContentType: 'application/json',
        }),
      );
      return { ok: true, key, sink: 'r2' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      try {
        await ensureLocalDir(localQueueDir());
        await writeFile(localPathFor(key), body, 'utf8');
        return { ok: true, key, sink: 'local' };
      } catch (localError) {
        return {
          ok: false,
          error: `R2 park failed (${message}); local fallback also failed (${
            localError instanceof Error ? localError.message : String(localError)
          })`,
        };
      }
    }
  }

  try {
    await ensureLocalDir(localQueueDir());
    await writeFile(localPathFor(key), body, 'utf8');
    return { ok: true, key, sink: 'local' };
  } catch (error) {
    return {
      ok: false,
      error: `Local park failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

/**
 * Re-PUT an existing entry with a bumped `attempts` counter and updated
 * `reason`. Lease fields are cleared so the next drain run can pick it up.
 *
 * Idempotent — if the key has been concurrently removed (e.g. another
 * drain run finished it), this becomes a no-op rather than re-creating
 * the entry under a different name (which would reset attempts and was
 * the source of the historical "MAX_ATTEMPTS never reached" bug).
 */
export const incrementAttempts = async (key: string, reason: string): Promise<boolean> => {
  const r2 = getR2Client();
  if (r2) {
    let body: string | undefined;
    try {
      const got = await r2.client.send(
        new GetObjectCommand({ Bucket: r2.bucket, Key: `${QUEUE_PREFIX}${key}` }),
      );
      body = await got.Body?.transformToString();
    } catch {
      return false;
    }
    if (!body) return false;
    const entry = parseEntry(body);
    if (!entry) return false;
    const next: QueuedSubmission = {
      ...entry,
      attempts: entry.attempts + 1,
      reason,
      leaseId: undefined,
      leasedUntil: undefined,
    };
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: `${QUEUE_PREFIX}${key}`,
          Body: stringifyEntry(next),
          ContentType: 'application/json',
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  try {
    const text = await readFile(localPathFor(key), 'utf8');
    const entry = parseEntry(text);
    if (!entry) return false;
    const next: QueuedSubmission = {
      ...entry,
      attempts: entry.attempts + 1,
      reason,
      leaseId: undefined,
      leasedUntil: undefined,
    };
    await writeFile(localPathFor(key), stringifyEntry(next), 'utf8');
    return true;
  } catch {
    return false;
  }
};

/**
 * Move an abandoned entry to the dead-letter prefix for manual review.
 * Used when the drain task has exhausted MAX_ATTEMPTS retries — keeping
 * the row preserves the "no submission lost during outage" guarantee
 * (arch doc §forms) instead of silently deleting it.
 */
export const quarantineSubmission = async (entry: QueuedSubmission): Promise<boolean> => {
  const body = stringifyEntry(entry);
  const r2 = getR2Client();
  if (r2) {
    try {
      await r2.client.send(
        new PutObjectCommand({
          Bucket: r2.bucket,
          Key: `${QUARANTINE_PREFIX}${entry.key}`,
          Body: body,
          ContentType: 'application/json',
        }),
      );
      await r2.client
        .send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: `${QUEUE_PREFIX}${entry.key}` }))
        .catch(() => undefined);
      return true;
    } catch {
      return false;
    }
  }

  try {
    await ensureLocalDir(localQuarantineDir());
    await writeFile(localQuarantinePathFor(entry.key), body, 'utf8');
    await unlink(localPathFor(entry.key)).catch(() => undefined);
    return true;
  } catch {
    return false;
  }
};

/** List quarantined (dead-letter) entries for the future admin review surface. */
export const listQuarantined = async (limit = 100): Promise<QueuedSubmission[]> => {
  const r2 = getR2Client();
  if (r2) {
    const out = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: QUARANTINE_PREFIX,
        MaxKeys: limit,
      }),
    );
    const keys = (out.Contents ?? [])
      .map((object) => object.Key)
      .filter((k): k is string => Boolean(k));
    const submissions: QueuedSubmission[] = [];
    for (const fullKey of keys) {
      const got = await r2.client.send(
        new GetObjectCommand({ Bucket: r2.bucket, Key: fullKey }),
      );
      const text = await got.Body?.transformToString();
      const entry = text ? parseEntry(text) : null;
      if (entry) submissions.push(entry);
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  }

  try {
    await ensureLocalDir(localQuarantineDir());
    const files = await readdir(localQuarantineDir());
    const submissions: QueuedSubmission[] = [];
    for (const file of files.slice(0, limit)) {
      const text = await readFile(localQuarantinePathFor(file), 'utf8');
      const entry = parseEntry(text);
      if (entry) submissions.push(entry);
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  } catch {
    return [];
  }
};

/**
 * Read all queue entries (oldest-first) without claiming them. Mostly
 * useful for tests and for the admin queue-inspection surface; the
 * drain task should use `claimNextBatch` for at-least-once semantics.
 */
export const listQueuedSubmissions = async (limit = 100): Promise<QueuedSubmission[]> => {
  const r2 = getR2Client();
  if (r2) {
    const out = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: QUEUE_PREFIX,
        MaxKeys: limit + 50, // small overshoot to filter out the abandoned/ subprefix
      }),
    );
    const keys = (out.Contents ?? [])
      .map((object) => object.Key)
      .filter((k): k is string => Boolean(k))
      .filter((k) => !k.startsWith(QUARANTINE_PREFIX))
      .slice(0, limit);
    const submissions: QueuedSubmission[] = [];
    for (const fullKey of keys) {
      const got = await r2.client.send(
        new GetObjectCommand({ Bucket: r2.bucket, Key: fullKey }),
      );
      const text = await got.Body?.transformToString();
      const entry = text ? parseEntry(text) : null;
      if (entry) submissions.push(entry);
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  }

  try {
    await ensureLocalDir(localQueueDir());
    const files = await readdir(localQueueDir());
    const submissions: QueuedSubmission[] = [];
    for (const file of files.slice(0, limit)) {
      // Skip the quarantine subdirectory.
      if (file === 'abandoned') continue;
      const fullPath = localPathFor(file);
      try {
        const text = await readFile(fullPath, 'utf8');
        const entry = parseEntry(text);
        if (entry) submissions.push(entry);
      } catch {
        // file disappeared (concurrent claim) or is a directory — skip
      }
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  } catch {
    return [];
  }
};

/**
 * Atomically claim a batch of queue entries for processing by a single
 * drain worker. Returns entries with `leaseId` + `leasedUntil` set.
 *
 * Implementation detail:
 * - R2 (S3-compatible): use `If-Match` ETag on the lease-write so two
 *   concurrent claims race-safely; the loser sees 412 and skips.
 * - Local-fs: use `fs.rename` (atomic on POSIX) onto a `.locked-<workerId>`
 *   sidecar; the loser sees ENOENT on the source and skips.
 */
export const claimNextBatch = async (
  workerId: string,
  ttlMs: number,
  limit = 100,
): Promise<QueuedSubmission[]> => {
  const now = Date.now();
  const leasedUntilIso = new Date(now + ttlMs).toISOString();

  const r2 = getR2Client();
  if (r2) {
    const out = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: QUEUE_PREFIX,
        MaxKeys: limit + 50,
      }),
    );
    const candidates = (out.Contents ?? [])
      .filter((object) => object.Key && !object.Key.startsWith(QUARANTINE_PREFIX))
      .slice(0, limit);
    const claimed: QueuedSubmission[] = [];
    for (const object of candidates) {
      if (!object.Key || !object.ETag) continue;
      try {
        const got = await r2.client.send(
          new GetObjectCommand({ Bucket: r2.bucket, Key: object.Key }),
        );
        const text = await got.Body?.transformToString();
        if (!text) continue;
        const entry = parseEntry(text);
        if (!entry) continue;
        if (entry.leasedUntil && Date.parse(entry.leasedUntil) > now) continue;
        const next: QueuedSubmission = {
          ...entry,
          leaseId: workerId,
          leasedUntil: leasedUntilIso,
        };
        await r2.client.send(
          new PutObjectCommand({
            Bucket: r2.bucket,
            Key: object.Key,
            Body: stringifyEntry(next),
            ContentType: 'application/json',
            // S3 If-Match prevents two workers from both writing the same lease.
            // Casting because the AWS SDK type for IfMatch on PutObject is recent.
            IfMatch: object.ETag,
          } as ConstructorParameters<typeof PutObjectCommand>[0]),
        );
        claimed.push(next);
      } catch {
        // 412 (lost the race) or transient error — leave for next claim.
      }
    }
    return claimed.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  }

  try {
    await ensureLocalDir(localQueueDir());
    const files = await readdir(localQueueDir());
    const claimed: QueuedSubmission[] = [];
    for (const file of files) {
      if (claimed.length >= limit) break;
      if (file === 'abandoned' || !file.endsWith('.json')) continue;
      const sourcePath = localPathFor(file);
      const lockedPath = `${sourcePath}.locked-${workerId}`;
      try {
        // fs.rename is atomic on POSIX — the loser of the race gets ENOENT.
        await rename(sourcePath, lockedPath);
      } catch {
        continue;
      }
      try {
        const text = await readFile(lockedPath, 'utf8');
        const entry = parseEntry(text);
        if (!entry) {
          // malformed — leave the locked sidecar for manual cleanup
          continue;
        }
        if (entry.leasedUntil && Date.parse(entry.leasedUntil) > now) {
          // lease still valid (shouldn't happen on local-fs since we renamed,
          // but defensive). Roll back.
          await rename(lockedPath, sourcePath).catch(() => undefined);
          continue;
        }
        const next: QueuedSubmission = {
          ...entry,
          leaseId: workerId,
          leasedUntil: leasedUntilIso,
        };
        await writeFile(lockedPath, stringifyEntry(next), 'utf8');
        // Restore the canonical name with the lease persisted in-place.
        await rename(lockedPath, sourcePath);
        claimed.push(next);
      } catch {
        // best-effort recovery — try to put the file back
        await rename(lockedPath, sourcePath).catch(() => undefined);
      }
    }
    return claimed.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  } catch {
    return [];
  }
};

export const removeQueuedSubmission = async (key: string): Promise<void> => {
  const r2 = getR2Client();
  if (r2) {
    try {
      await r2.client.send(
        new DeleteObjectCommand({ Bucket: r2.bucket, Key: `${QUEUE_PREFIX}${key}` }),
      );
    } catch {
      // fall through to local cleanup
    }
  }
  try {
    await unlink(localPathFor(key));
  } catch {
    // already gone — drain probably ran twice on the same key
  }
};

/** Test-only — wipes both queue and quarantine local dirs. */
export const __resetLocalQueue = async (): Promise<void> => {
  try {
    const files = await readdir(localQueueDir());
    for (const file of files) {
      if (file === 'abandoned') continue;
      await unlink(localPathFor(file)).catch(() => undefined);
    }
  } catch {
    // dir doesn't exist yet
  }
  try {
    const files = await readdir(localQuarantineDir());
    for (const file of files) {
      await unlink(localQuarantinePathFor(file)).catch(() => undefined);
    }
  } catch {
    // dir doesn't exist yet
  }
};
