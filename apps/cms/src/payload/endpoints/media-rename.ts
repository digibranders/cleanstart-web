import {
  CopyObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import type { Endpoint } from 'payload';
import { z } from 'zod';

import { hasAnyRole } from '../access/typed-user';
import { getR2Client } from '../lib/r2';
import { slugify } from '../lib/slugify';
import { revalidateWeb } from '../lib/web-revalidate';

const json = (data: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const MAX_STEM_LEN = 96;

const Body = z.object({
  /** New filename stem WITHOUT extension. Extension is preserved from the existing file. */
  filename: z.string().min(1).max(MAX_STEM_LEN),
});

interface MediaSize {
  filename?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
  filesize?: number | null;
  url?: string | null;
}

interface MediaDoc {
  id: number | string;
  filename?: string | null;
  prefix?: string | null;
  mimeType?: string | null;
  sizes?: Record<string, MediaSize> | null;
}

const splitFilename = (
  filename: string,
): { stem: string; ext: string } => {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) return { stem: trimmed, ext: '' };
  return { stem: trimmed.slice(0, dot), ext: trimmed.slice(dot) };
};

/**
 * Replace the size-name suffix on a derivative filename. Payload size
 * derivatives are named `<stem>-<width>x<height>.<ext>` (or similar).
 * We never re-derive the suffix from scratch — we keep whatever Payload
 * originally chose and only swap the leading stem.
 */
const renameDerivative = (
  derivativeFilename: string,
  oldStem: string,
  newStem: string,
): string => {
  if (derivativeFilename.startsWith(`${oldStem}-`)) {
    return `${newStem}${derivativeFilename.slice(oldStem.length)}`;
  }
  // Defensive: if the derivative doesn't share the parent stem, leave it
  // alone — copying it under a fabricated name would create orphans.
  return derivativeFilename;
};

interface CopyPlan {
  oldKey: string;
  newKey: string;
}

const planCopies = (
  prefix: string,
  oldFilename: string,
  newFilename: string,
  sizes: Record<string, MediaSize> | null | undefined,
): { plan: CopyPlan[]; sizeRenames: Record<string, string> } => {
  const { stem: oldStem } = splitFilename(oldFilename);
  const { stem: newStem } = splitFilename(newFilename);
  const plan: CopyPlan[] = [
    {
      oldKey: `${prefix}/${oldFilename}`,
      newKey: `${prefix}/${newFilename}`,
    },
  ];
  const sizeRenames: Record<string, string> = {};
  if (sizes) {
    for (const [sizeName, size] of Object.entries(sizes)) {
      const sizeFilename = size?.filename;
      if (typeof sizeFilename !== 'string' || sizeFilename.length === 0) continue;
      const next = renameDerivative(sizeFilename, oldStem, newStem);
      if (next === sizeFilename) continue;
      sizeRenames[sizeName] = next;
      plan.push({
        oldKey: `${prefix}/${sizeFilename}`,
        newKey: `${prefix}/${next}`,
      });
    }
  }
  return { plan, sizeRenames };
};

/**
 * POST /api/media/:id/rename
 *
 * Atomic-ish rename for a Media doc. Sequence:
 *   1. Validate caller (admin/editor) and the requested stem.
 *   2. Load the current doc and confirm filename + prefix + sizes.
 *   3. Pre-flight: ensure newFilename isn't already taken in DB.
 *   4. COPY every R2 object (main + size derivatives) to the new key.
 *      Bail out on the first failure — partial copies leave orphans
 *      but no broken consumers (old keys still serve until step 6).
 *   5. UPDATE the Media doc with new filename + sizes filenames.
 *      `media.url` regenerates via `generateFileURL`. Tag the update
 *      with `req.context.skipCloudStorage = true` so the cloud-storage
 *      afterChange doesn't trigger its delete-old/upload-new path
 *      (req.file is undefined here, but defence in depth).
 *   6. DELETE the old R2 keys. Best-effort: a delete failure leaves
 *      a benign orphan but does not break the new URLs.
 *
 * References to media in content are stored by Media `id` and resolved
 * to the latest `url` via Payload's `populate` at fetch time, so blog
 * bodies / author cards / hero refs auto-pick up the new URL on the
 * next render. No find-and-replace in content is required.
 */
export const mediaRenameEndpoint: Endpoint = {
  path: '/media/:id/rename',
  method: 'post',
  handler: async (req) => {
    if (!hasAnyRole(req.user, ['admin', 'editor'])) {
      return json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const id = (req.routeParams as { id?: string } | undefined)?.id;
    if (!id) {
      return json({ ok: false, error: 'missing_id' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = req.json ? await req.json() : null;
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400 });
    }
    const parsed = Body.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          ok: false,
          error: 'invalid_body',
          issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        { status: 400 },
      );
    }

    // Normalise the incoming stem: slugify so editors can't smuggle in
    // `../` traversal, whitespace, or characters that would break the
    // URL. The caller sent a stem only — we reattach the existing ext.
    const newStem = slugify(parsed.data.filename);
    if (newStem.length === 0) {
      return json({ ok: false, error: 'invalid_filename' }, { status: 400 });
    }

    // Load current doc.
    const doc = (await req.payload
      .findByID({
        collection: 'media',
        id: id as never,
        depth: 0,
        overrideAccess: true,
      })
      .catch(() => null)) as MediaDoc | null;
    if (!doc || typeof doc.filename !== 'string' || doc.filename.length === 0) {
      return json({ ok: false, error: 'not_found' }, { status: 404 });
    }
    if (typeof doc.prefix !== 'string' || doc.prefix.length === 0) {
      return json({ ok: false, error: 'missing_prefix' }, { status: 409 });
    }

    const { ext } = splitFilename(doc.filename);
    const newFilename = `${newStem}${ext}`;
    if (newFilename === doc.filename) {
      return json({ ok: true, noop: true, filename: doc.filename });
    }

    // Refuse if another doc already owns the target filename. Unique
    // filenames per prefix are the contract Payload's storage plugin
    // assumes — colliding here would clobber an unrelated doc's R2
    // object on the next overwrite-with-same-name upload.
    const collision = await req.payload.find({
      collection: 'media',
      where: { filename: { equals: newFilename } },
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: true,
    });
    if (collision.docs.length > 0 && (collision.docs[0] as MediaDoc).id !== doc.id) {
      return json(
        { ok: false, error: 'filename_taken', filename: newFilename },
        { status: 409 },
      );
    }

    // R2 client. Bail if unavailable so we don't half-commit (DB
    // updated but objects not moved).
    const r2 = getR2Client();
    if (!r2) {
      return json({ ok: false, error: 'storage_unavailable' }, { status: 503 });
    }

    const { plan, sizeRenames } = planCopies(doc.prefix, doc.filename, newFilename, doc.sizes);

    // Step 4: COPY every key to its new name. Stop on first error.
    const copiedKeys: CopyPlan[] = [];
    for (const op of plan) {
      try {
        // Skip if source missing — happens when an earlier rename
        // already moved a derivative or the size never made it to R2.
        try {
          await r2.client.send(
            new HeadObjectCommand({ Bucket: r2.bucket, Key: op.oldKey }),
          );
        } catch {
          req.payload.logger.warn(
            `[media-rename] source missing in R2, skipping: ${op.oldKey}`,
          );
          continue;
        }
        await r2.client.send(
          new CopyObjectCommand({
            Bucket: r2.bucket,
            // CopySource must be `bucket/key`, URL-encoded.
            CopySource: encodeURIComponent(`${r2.bucket}/${op.oldKey}`),
            Key: op.newKey,
            MetadataDirective: 'COPY',
          }),
        );
        copiedKeys.push(op);
      } catch (err) {
        // Roll back: delete any keys we copied so we don't leave a
        // mixed state at both old and new paths.
        req.payload.logger.error(
          `[media-rename] copy failed for ${op.oldKey} → ${op.newKey}: ${
            err instanceof Error ? err.message : String(err)
          }. Rolling back.`,
        );
        await Promise.all(
          copiedKeys.map((c) =>
            r2.client
              .send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: c.newKey }))
              .catch(() => undefined),
          ),
        );
        return json(
          { ok: false, error: 'copy_failed', detail: op.oldKey },
          { status: 502 },
        );
      }
    }

    // Step 5: update DB. Build the sizes patch from the rename map.
    const sizesPatch: Record<string, MediaSize> = {};
    if (doc.sizes) {
      for (const [sizeName, size] of Object.entries(doc.sizes)) {
        if (!size) continue;
        const renamed = sizeRenames[sizeName];
        sizesPatch[sizeName] = renamed ? { ...size, filename: renamed } : size;
      }
    }

    try {
      if (!req.context) req.context = {};
      (req.context as { skipCloudStorage?: boolean }).skipCloudStorage = true;
      await req.payload.update({
        collection: 'media',
        id: doc.id as never,
        data: {
          filename: newFilename,
          ...(Object.keys(sizesPatch).length > 0 ? { sizes: sizesPatch } : {}),
        },
        depth: 0,
        overrideAccess: true,
        // Carry the skip flag through to nested hooks.
        req,
      });
    } catch (err) {
      // DB failed → roll back the copied R2 objects so storage doesn't
      // diverge from DB. Old keys remain serving.
      req.payload.logger.error(
        `[media-rename] DB update failed: ${
          err instanceof Error ? err.message : String(err)
        }. Rolling back R2 copies.`,
      );
      await Promise.all(
        copiedKeys.map((c) =>
          r2.client
            .send(new DeleteObjectCommand({ Bucket: r2.bucket, Key: c.newKey }))
            .catch(() => undefined),
        ),
      );
      return json({ ok: false, error: 'db_update_failed' }, { status: 500 });
    } finally {
      (req.context as { skipCloudStorage?: boolean | undefined }).skipCloudStorage = undefined;
    }

    // Best-effort cross-process cache flush BEFORE the delete window.
    // Order matters: triggering ISR refresh first lets apps/web pages
    // pick up the new URL while the old keys still serve. If revalidate
    // is unconfigured or fails, the ISR TTL (~60s) still bounds the
    // staleness window.
    await revalidateWeb(req.payload, { tags: ['media'] });

    // Step 6: delete old keys. Best-effort; failures here are orphans,
    // not broken consumers, so we log and continue.
    for (const op of copiedKeys) {
      try {
        await r2.client.send(
          new DeleteObjectCommand({ Bucket: r2.bucket, Key: op.oldKey }),
        );
      } catch (err) {
        req.payload.logger.warn(
          `[media-rename] delete of old key ${op.oldKey} failed (orphan): ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return json({
      ok: true,
      filename: newFilename,
      oldFilename: doc.filename,
      copied: copiedKeys.map((c) => ({ from: c.oldKey, to: c.newKey })),
    });
  },
};

/** Exported for unit tests. */
export const __internals = {
  splitFilename,
  renameDerivative,
  planCopies,
};
