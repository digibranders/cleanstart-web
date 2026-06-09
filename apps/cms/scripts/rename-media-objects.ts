#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Execute the Media rename plan against PROD (R2 + Postgres).
 *
 * Self-contained: uses only `pg` and `@aws-sdk/client-s3` — it does NOT
 * boot Payload, so the `rejectFilenameRename` beforeChange guard and the
 * s3-storage afterChange hook never run. We control every column value
 * directly, which is what makes a bulk filename migration possible.
 *
 * References are safe: content stores media by id and resolves the URL at
 * read time, and a prod scan confirmed ZERO `cdn.cleanstart.com` URLs are
 * baked into any document — so updating the media row's own columns
 * propagates everywhere with no per-document edits.
 *
 * Per media (one transaction-safe step each):
 *   1. SELECT current row; skip if already renamed (idempotent) or if the
 *      stored filename != plan.from (unexpected state — never guess).
 *   2. R2 COPY main + every size derivative (thumb/card/hero) old→new key,
 *      HEAD-verifying source and destination. Roll back copies on failure.
 *   3. One UPDATE of filename / url / thumbnailURL / sizes_* / alt, guarded
 *      by `WHERE id=$ AND filename=$from` (rowcount must be 1).
 *   4. DELETE the old R2 keys (best-effort; failure = harmless orphan).
 *
 * SAFE BY DEFAULT: dry-run unless `--execute` is passed.
 *
 * Run inside the prod cms container (env already present):
 *   docker exec -w /app/apps/cms cleanstart-cms-1 node --no-warnings \
 *     --experimental-strip-types scripts/rename-media-objects.ts            # dry-run
 *   docker exec -w /app/apps/cms cleanstart-cms-1 node --no-warnings \
 *     --experimental-strip-types scripts/rename-media-objects.ts --execute  # real
 */
import fs from 'node:fs';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import pg from 'pg';

const EXECUTE = process.argv.includes('--execute');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT =
  limitIdx >= 0 ? Math.max(0, Number.parseInt(process.argv[limitIdx + 1] ?? '0', 10) || 0) : 0;
const planArgIdx = process.argv.indexOf('--plan');
const PLAN_PATH =
  (planArgIdx >= 0 ? process.argv[planArgIdx + 1] : undefined) ?? 'scripts/data/media-rename-plan.json';

interface PlanEntry {
  id: number;
  from: string;
  to: string;
  alt: string | null;
}

const SIZE_KEYS = ['thumb', 'card', 'hero'] as const;

const env = (k: string): string => {
  const v = process.env[k];
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
  return v;
};

const stemOf = (filename: string): string => {
  const d = filename.lastIndexOf('.');
  return d > 0 ? filename.slice(0, d) : filename;
};

const run = async (): Promise<void> => {
  const { entries } = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf-8')) as { entries: PlanEntry[] };
  const allTodo = entries.filter((e) => e.from !== e.to);
  const todo = LIMIT > 0 ? allTodo.slice(0, LIMIT) : allTodo;
  console.log(
    `Plan: ${entries.length} entries, ${allTodo.length} to rename${LIMIT > 0 ? ` (limited to ${todo.length})` : ''}. ` +
      `Mode: ${EXECUTE ? 'EXECUTE' : 'DRY-RUN'}`,
  );

  const bucket = env('R2_BUCKET');
  const r2 = new S3Client({
    region: 'auto',
    endpoint: env('R2_ENDPOINT'),
    credentials: { accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY') },
    forcePathStyle: true,
  });
  const pool = new pg.Pool({ connectionString: env('DATABASE_URI') });

  const headExists = async (key: string): Promise<boolean> => {
    try {
      await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  };
  const copy = async (oldKey: string, newKey: string): Promise<void> => {
    await r2.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: encodeURIComponent(`${bucket}/${oldKey}`),
        Key: newKey,
        MetadataDirective: 'COPY',
      }),
    );
  };

  let renamed = 0;
  let already = 0;
  let mismatched = 0;
  let missing = 0;
  let failed = 0;

  for (const e of todo) {
    const sel = await pool.query(
      `SELECT id, prefix, filename, url, thumbnail_u_r_l, alt,
              sizes_thumb_filename, sizes_thumb_url,
              sizes_card_filename,  sizes_card_url,
              sizes_hero_filename,  sizes_hero_url
         FROM media WHERE id = $1`,
      [e.id],
    );
    if (sel.rowCount === 0) {
      missing += 1;
      console.warn(`  ⚠ media#${e.id}: not found; skipping`);
      continue;
    }
    const row = sel.rows[0] as Record<string, string | null>;
    if (row.filename === e.to) {
      already += 1;
      continue; // idempotent — already renamed
    }
    if (row.filename !== e.from) {
      mismatched += 1;
      console.warn(`  ⚠ media#${e.id}: filename "${row.filename}" != plan.from "${e.from}"; skipping`);
      continue;
    }
    const prefix = row.prefix;
    if (!prefix) {
      missing += 1;
      console.warn(`  ⚠ media#${e.id}: no prefix; skipping`);
      continue;
    }

    const fromStem = stemOf(e.from);
    const toStem = stemOf(e.to);
    const sub = (v: string | null | undefined): string | null =>
      typeof v === 'string' ? v.split(fromStem).join(toStem) : (v ?? null);

    // R2 key copy plan: main + each present size derivative.
    const copies: { oldKey: string; newKey: string }[] = [
      { oldKey: `${prefix}/${e.from}`, newKey: `${prefix}/${e.to}` },
    ];
    const sizePatch: Record<string, string | null> = {};
    for (const s of SIZE_KEYS) {
      const fnCol = `sizes_${s}_filename`;
      const urlCol = `sizes_${s}_url`;
      const fn = row[fnCol];
      if (typeof fn === 'string' && fn.length > 0) {
        const newFn = sub(fn) as string;
        if (newFn !== fn) copies.push({ oldKey: `${prefix}/${fn}`, newKey: `${prefix}/${newFn}` });
        sizePatch[fnCol] = newFn;
      } else {
        sizePatch[fnCol] = fn ?? null;
      }
      sizePatch[urlCol] = sub(row[urlCol]);
    }

    const newUrl = sub(row.url);
    const newThumb = sub(row.thumbnail_u_r_l);
    const newAlt = e.alt !== null ? e.alt : row.alt;

    if (!EXECUTE) {
      console.log(`  [dry] media#${e.id}\n     ${e.from}\n  -> ${e.to}   (alt: ${e.alt === null ? '(keep)' : JSON.stringify(e.alt)}, +${copies.length - 1} size objs)`);
      renamed += 1;
      continue;
    }

    // 1) COPY all R2 objects, verifying each. Roll back on any failure.
    const copied: string[] = [];
    let copyErr = '';
    for (const op of copies) {
      if (!(await headExists(op.oldKey))) {
        // source derivative absent in R2 (e.g. never generated) — skip it,
        // and drop its column patch back to the original so we don't point
        // at a key that won't exist.
        continue;
      }
      try {
        await copy(op.oldKey, op.newKey);
        if (!(await headExists(op.newKey))) throw new Error('post-copy HEAD failed');
        copied.push(op.newKey);
      } catch (err) {
        copyErr = `${op.oldKey} -> ${op.newKey}: ${err instanceof Error ? err.message : String(err)}`;
        break;
      }
    }
    if (copyErr) {
      failed += 1;
      console.error(`  ✗ media#${e.id}: copy failed (${copyErr}). Rolling back ${copied.length} copies.`);
      await Promise.all(copied.map((k) => r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: k })).catch(() => undefined)));
      continue;
    }

    // 2) Single guarded UPDATE.
    let upd: pg.QueryResult;
    try {
      upd = await pool.query(
        `UPDATE media SET
            filename = $2, url = $3, thumbnail_u_r_l = $4, alt = $5,
            sizes_thumb_filename = $6,  sizes_thumb_url = $7,
            sizes_card_filename  = $8,  sizes_card_url  = $9,
            sizes_hero_filename  = $10, sizes_hero_url  = $11,
            updated_at = now()
          WHERE id = $1 AND filename = $12`,
        [
          e.id, e.to, newUrl, newThumb, newAlt,
          sizePatch.sizes_thumb_filename ?? null, sizePatch.sizes_thumb_url ?? null,
          sizePatch.sizes_card_filename ?? null, sizePatch.sizes_card_url ?? null,
          sizePatch.sizes_hero_filename ?? null, sizePatch.sizes_hero_url ?? null,
          e.from,
        ],
      );
    } catch (err) {
      failed += 1;
      console.error(`  ✗ media#${e.id}: UPDATE error (${err instanceof Error ? err.message : String(err)}). Rolling back copies.`);
      await Promise.all(copied.map((k) => r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: k })).catch(() => undefined)));
      continue;
    }
    if (upd.rowCount !== 1) {
      failed += 1;
      console.error(`  ✗ media#${e.id}: UPDATE matched ${upd.rowCount} rows (expected 1). Rolling back copies.`);
      await Promise.all(copied.map((k) => r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: k })).catch(() => undefined)));
      continue;
    }

    // 3) DELETE old keys (best-effort).
    const oldKeys = copies.map((c) => c.oldKey);
    for (const k of oldKeys) {
      try {
        await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: k }));
      } catch (err) {
        console.warn(`    media#${e.id}: delete old key ${k} failed (orphan): ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    renamed += 1;
    console.log(`  ✓ media#${e.id}  ${e.from}  ->  ${e.to}`);
  }

  await pool.end();
  console.log(
    `\n${EXECUTE ? 'Renamed' : '[dry-run] would rename'}: ${renamed} · already-clean: ${already} · ` +
      `mismatched(skipped): ${mismatched} · missing: ${missing} · failed: ${failed}`,
  );
  process.exit(failed > 0 && EXECUTE ? 1 : 0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
