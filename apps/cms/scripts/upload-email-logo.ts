#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Uploads the dark-mode-safe email wordmark used by `lib/email/layout.ts`.
 *
 * The shipped wordmark is a dark mark on a 73% transparent background. That is
 * fine on the white card in light mode, but Outlook and Outlook.com invert the
 * card in dark mode and the mark then sits dark-on-dark and disappears. This
 * composites it onto an opaque white plate with 10 px of padding: invisible
 * against the white card in light mode, and self-backing when a client inverts
 * around it.
 *
 * Writes under the CMS-managed prefix, never `emails/`: those objects are
 * referenced by every signature already sent, and `EmailAssets.ts` throws if a
 * prefix targets them.
 *
 * SAFETY: refuses to overwrite an existing key. `--dry-run` previews.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/upload-email-logo.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/upload-email-logo.ts
 */
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

import { getR2Client } from '../src/payload/lib/r2.ts';

const SOURCE_URL = 'https://cdn.cleanstart.com/emails/social-icons/cleanstart-logo.png';
/** Opaque backing so the mark survives a client inverting the card. */
const PLATE_PADDING = 10;
const KEY = 'web/emails/logo-email.png';

const run = async (): Promise<void> => {
  const dryRun = process.argv.includes('--dry-run');
  const r2 = getR2Client();
  if (!r2) {
    throw new Error('R2 is not configured — check R2_ENDPOINT / R2_BUCKET / R2_ACCESS_KEY_ID.');
  }

  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Source logo fetch failed: ${res.status}`);
  const original = Buffer.from(await res.arrayBuffer());

  const meta0 = await sharp(original).metadata();
  const optimised = await sharp({
    create: {
      width: (meta0.width ?? 220) + PLATE_PADDING * 2,
      height: (meta0.height ?? 46) + PLATE_PADDING * 2,
      channels: 4,
      background: '#ffffff',
    },
  })
    .composite([{ input: original, top: PLATE_PADDING, left: PLATE_PADDING }])
    .png({ palette: true, quality: 90, compressionLevel: 9, effort: 10 })
    .toBuffer();

  const meta = await sharp(optimised).metadata();
  console.log(
    `source ${(original.length / 1024).toFixed(1)} KB -> plated ${(optimised.length / 1024).toFixed(1)} KB ` +
      `(${meta.width}x${meta.height}, opaque background)`,
  );

  try {
    await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: KEY }));
    console.log(`${KEY} already exists — refusing to overwrite. Nothing written.`);
    return;
  } catch {
    // Not found is the expected path; fall through to the upload.
  }

  if (dryRun) {
    console.log(`Dry run. Would write ${KEY}.`);
    return;
  }

  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: KEY,
      Body: optimised,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  console.log(`Wrote ${KEY}.`);
};

void run().then(
  () => process.exit(0),
  (err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  },
);
