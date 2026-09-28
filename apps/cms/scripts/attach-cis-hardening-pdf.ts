#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: restore the PDF on "CIS Hardening as an Architectural Property".
 *
 * The Webflow import never attached it. It was the only one of 205 Webflow
 * files that failed to upload, because the file on Webflow's CDN is a 3.6 MB
 * PDF followed by 6.6 MB of zero padding, which strict readers reject. The
 * copy read here has the padding stripped (9 pages, intact).
 *
 * Uploads the PDF to web/resource and sets it as the resource's asset, then
 * republishes. Every other field is left as it is. Skips the upload if the
 * media already exists, and does nothing if the asset is already set.
 *
 * The publish hook defers its web purge until after the write commits, on an
 * unref'd timer, and this script exits before that timer fires. So the purge
 * is sent here directly, once the update has returned and committed.
 *
 * The file is read from /tmp inside the container; copy it in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/attach-cis-hardening-pdf.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/attach-cis-hardening-pdf.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const RESOURCE_SLUG = 'cis-hardening-as-an-architectural-property';
const PDF_PATH = '/tmp/cis-hardening-as-an-architectural-property.pdf';
const PDF_ALT = 'CIS Hardening as an Architectural Property (architecture insight PDF)';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

interface Doc {
  id: number | string;
  _status?: string;
  asset?: number | string | null;
}

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE'}\n`);

  const found = await payload.find({
    collection: 'resources',
    where: { slug: { equals: RESOURCE_SLUG } },
    limit: 1,
    depth: 0,
    draft: true,
    overrideAccess: true,
  });
  const resource = found.docs[0] as Doc | undefined;
  if (!resource) throw new Error(`Resource ${RESOURCE_SLUG} not found`);
  log(`  resource ${RESOURCE_SLUG} (id ${resource.id}, ${resource._status}, asset ${resource.asset ?? 'none'})`);
  if (resource.asset != null) {
    log('  skip     asset already set');
    return;
  }

  const existing = await payload.find({
    collection: 'media',
    where: { alt: { equals: PDF_ALT } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  let media = existing.docs[0] as Doc | undefined;
  if (media) {
    log(`  skip     media "${PDF_ALT}" (id ${media.id})`);
  } else if (DRY_RUN) {
    log(`  would upload ${PDF_PATH} as "${PDF_ALT}"`);
  } else {
    media = (await payload.create({
      collection: 'media',
      data: { alt: PDF_ALT, folder: 'web/resource' } as Record<string, unknown>,
      filePath: PDF_PATH,
      overrideAccess: true,
    })) as Doc;
    log(`  uploaded media "${PDF_ALT}" (id ${media.id})`);
  }

  if (DRY_RUN) {
    log(`  would set asset on resource ${resource.id} and republish`);
    return;
  }
  if (!media) throw new Error('Media upload did not return a document');

  await payload.update({
    collection: 'resources',
    id: resource.id,
    data: { asset: media.id, _status: 'published' } as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  updated  resource ${resource.id}: asset ${media.id}, published`);

  const purge = await revalidateWeb(payload, {
    paths: [`/resources/${RESOURCE_SLUG}`, '/resource-center'],
  });
  log(`  purge    web cache: ${purge.ok ? 'ok' : `failed (${purge.status ?? purge.error ?? 'disabled'})`}`);
};

run()
  .then(() => process.exit(0))
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console -- script output
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
