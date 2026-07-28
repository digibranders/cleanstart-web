#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Seeds the CMS-managed email-asset folder on R2 (`web/emails/`).
 *
 * Strictly additive. The legacy `emails/assets/` objects that every already-sent
 * signature points at are never read, written or deleted by this script — the
 * new folder is a parallel home for CMS-managed copies, so the migration can
 * happen by repointing a template rather than by mutating live CDN data.
 *
 * The logo is re-encoded on the way up: the original is 511×458 at 216 KB but
 * renders at 140px wide, so every recipient downloads ~10× more than they need.
 * It is resized to 280px (2× for retina) and palette-quantised, preserving
 * transparency. The five icons are already small and are copied verbatim.
 *
 * SAFETY: refuses to write a key that already exists — re-running is a no-op
 * rather than an overwrite. `--dry-run` previews.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/upload-email-assets.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/upload-email-assets.ts
 */
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

import { getR2Client } from '../src/payload/lib/r2.ts';
import { EMAIL_ASSET_PREFIX } from '../src/payload/collections/EmailAssets.ts';

/** Rendered at width=140 in the signature; 2× for retina. */
const LOGO_TARGET_WIDTH = 280;

const ICONS = ['mail.png', 'phone.png', 'twitter.png', 'linkedin.png', 'youtube.png'] as const;

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const dirArgIndex = process.argv.indexOf('--dir');
  const assetsDir = path.resolve(
    dirArgIndex >= 0
      ? (process.argv[dirArgIndex + 1] ?? '')
      : path.join(import.meta.dirname, '../../../cleanstart-email-signatures/assets'),
  );

  const r2 = getR2Client();
  if (!r2) throw new Error('R2 is not configured — check R2_* vars in .env');

  console.log(`Source:  ${assetsDir}`);
  console.log(`Bucket:  ${r2.bucket}`);
  console.log(`Prefix:  ${EMAIL_ASSET_PREFIX}/`);
  console.log(dryRun ? 'MODE: dry-run (no writes)\n' : 'MODE: write\n');

  if (EMAIL_ASSET_PREFIX.startsWith('emails/')) {
    throw new Error(
      `Refusing to run: prefix "${EMAIL_ASSET_PREFIX}" targets the legacy hand-uploaded assets.`,
    );
  }

  const logoSource = readFileSync(path.join(assetsDir, 'logo.png'));
  const logo = await sharp(logoSource)
    .resize({ width: LOGO_TARGET_WIDTH, withoutEnlargement: true })
    .png({ palette: true, quality: 90, effort: 10, compressionLevel: 9 })
    .toBuffer();

  const saved = (1 - logo.length / logoSource.length) * 100;
  console.log(
    `logo.png  ${logoSource.length} B → ${logo.length} B  (-${saved.toFixed(1)}%)\n`,
  );

  const uploads: { filename: string; body: Buffer }[] = [
    { filename: 'logo.png', body: logo },
    ...ICONS.map((filename) => ({
      filename,
      body: readFileSync(path.join(assetsDir, filename)),
    })),
  ];

  let written = 0;
  let skipped = 0;

  for (const { filename, body } of uploads) {
    const key = `${EMAIL_ASSET_PREFIX}/${filename}`;

    let exists = false;
    try {
      await r2.client.send(new HeadObjectCommand({ Bucket: r2.bucket, Key: key }));
      exists = true;
    } catch {
      exists = false;
    }

    if (exists) {
      console.log(`  SKIP   ${key} — already present, not overwriting`);
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`  WOULD  ${key} (${body.length} B)`);
      continue;
    }

    await r2.client.send(
      new PutObjectCommand({
        Bucket: r2.bucket,
        Key: key,
        Body: body,
        ContentType: 'image/png',
        // Mail clients refetch on every open; a long TTL keeps that cheap.
        // Filenames here are permanent, so a stale cache is never wrong.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    console.log(`  PUT    ${key} (${body.length} B)`);
    written += 1;
  }

  console.log(`\nDone. Wrote ${written}, skipped ${skipped}.`);
  if (!dryRun && written > 0) {
    const base = process.env.R2_PUBLIC_BASE ?? '';
    console.log(`\nPublic URLs:\n  ${base}/${EMAIL_ASSET_PREFIX}/logo.png`);
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
