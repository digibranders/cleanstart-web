import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getR2Client } from './r2';
import type { LeadSubmission } from './lead-handlers/types';

const QUEUE_PREFIX = 'lead-fallback-queue/';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_QUEUE_DIR = path.resolve(dirname, '../../../.lead-fallback-queue');

export type QueuedSubmission = {
  /** Stable id (sortable by lex order). */
  key: string;
  /** Captured at the moment the queue accepted the submission. */
  parkedAt: string;
  /** Submission payload exactly as the LeadHandler chain would have received it. */
  submission: LeadSubmission;
  /** Why the submission ended up in the queue (DB error, R2-only mode, etc.). */
  reason: string;
  /** How many times we've tried to drain this submission. */
  attempts: number;
};

const newKey = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}.json`;
};

const ensureLocalDir = async (): Promise<void> => {
  await mkdir(LOCAL_QUEUE_DIR, { recursive: true });
};

const localPathFor = (key: string): string => path.join(LOCAL_QUEUE_DIR, key);

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
): Promise<{ ok: true; key: string; sink: 'r2' | 'local' } | { ok: false; error: string }> => {
  const key = newKey();
  const payload: QueuedSubmission = {
    key,
    parkedAt: new Date().toISOString(),
    submission,
    reason,
    attempts: 0,
  };
  const body = JSON.stringify(payload, null, 2);

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
      // fall through to local
      const message = error instanceof Error ? error.message : String(error);
      try {
        await ensureLocalDir();
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
    await ensureLocalDir();
    await writeFile(localPathFor(key), body, 'utf8');
    return { ok: true, key, sink: 'local' };
  } catch (error) {
    return {
      ok: false,
      error: `Local park failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

/** List queued submissions oldest-first. Reads from R2 when configured, else local. */
export const listQueuedSubmissions = async (limit = 100): Promise<QueuedSubmission[]> => {
  const r2 = getR2Client();
  if (r2) {
    const out = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: QUEUE_PREFIX,
        MaxKeys: limit,
      }),
    );
    const keys = (out.Contents ?? [])
      .map((object) => object.Key)
      .filter((k): k is string => Boolean(k));
    const submissions: QueuedSubmission[] = [];
    for (const fullKey of keys) {
      const body = await r2.client.send(
        new GetObjectCommand({ Bucket: r2.bucket, Key: fullKey }),
      );
      const text = await body.Body?.transformToString();
      if (!text) continue;
      try {
        submissions.push(JSON.parse(text) as QueuedSubmission);
      } catch {
        // skip malformed
      }
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
  }

  try {
    await ensureLocalDir();
    const files = await readdir(LOCAL_QUEUE_DIR);
    const submissions: QueuedSubmission[] = [];
    for (const file of files.slice(0, limit)) {
      const text = await readFile(localPathFor(file), 'utf8');
      try {
        submissions.push(JSON.parse(text) as QueuedSubmission);
      } catch {
        // skip
      }
    }
    return submissions.sort((a, b) => a.parkedAt.localeCompare(b.parkedAt));
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
      return;
    } catch {
      // also try the local copy in case both exist (rare)
    }
  }
  try {
    await unlink(localPathFor(key));
  } catch {
    // already gone — drain probably ran twice on the same key
  }
};
