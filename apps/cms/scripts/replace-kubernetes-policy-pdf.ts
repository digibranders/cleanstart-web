#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: swap the PDF on "The Kubernetes Policy Trust Gap".
 *
 * Uploads the new PDF as a fresh media document (a new filename, so the CDN
 * cannot serve the old bytes) and points the resource's `asset` at it. The
 * old media document is left in place. Every other field is untouched and the
 * resource stays published.
 *
 * The publish hook defers its web purge on an unref'd timer that this script
 * outlives by exiting, so the purge is sent here once the update has returned.
 *
 * The file is read from /tmp inside the container; copy it in first.
 *
 * In the prod container (env is in the process, there is no .env):
 *   /app/node_modules/.bin/tsx scripts/replace-kubernetes-policy-pdf.ts --dry-run
 *   /app/node_modules/.bin/tsx scripts/replace-kubernetes-policy-pdf.ts
 */
import { getPayload } from 'payload';

import { revalidateWeb } from '../src/payload/lib/web-revalidate.ts';
import payloadConfig from '../src/payload.config.ts';

const RESOURCE_SLUG = 'the-kubernetes-policy-trust-gap';
const PDF_PATH = '/tmp/kubernetes-policy-trust-gap-v2.pdf';
const PDF_ALT = 'The Kubernetes Policy Trust Gap (whitepaper PDF)';

const DRY_RUN = process.argv.slice(2).includes('--dry-run');

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

  if (DRY_RUN) {
    log(`  would upload ${PDF_PATH} as "${PDF_ALT}" and set it as the asset`);
    return;
  }

  const media = (await payload.create({
    collection: 'media',
    data: { alt: PDF_ALT, folder: 'web/resource' } as Record<string, unknown>,
    filePath: PDF_PATH,
    overrideAccess: true,
  })) as Doc;
  log(`  uploaded media id ${media.id}`);

  await payload.update({
    collection: 'resources',
    id: resource.id,
    data: { asset: media.id, _status: 'published' } as Record<string, unknown>,
    overrideAccess: true,
  });
  log(`  updated  resource ${resource.id}: asset ${resource.asset ?? 'none'} -> ${media.id}`);

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
