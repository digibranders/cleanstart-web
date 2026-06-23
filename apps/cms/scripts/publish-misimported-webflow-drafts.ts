#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Publish the content that the Webflow import wrongly demoted to draft.
 *
 * Webflow's API reports `isDraft: true` for the *staged* copy of an item, so a
 * page that was live on the source but had unpublished "changes in draft" came
 * through the export with `isDraft: true` despite a non-null `lastPublished`.
 * The old `webflowStatus` keyed only on `isDraft`, so those live pages were
 * imported as CMS drafts and 404 on the new site. The transform is fixed going
 * forward (apps/cms/src/payload/lib/webflow-import/status.ts); this one-shot
 * repairs the rows already in prod.
 *
 * Scope is the closed set of pages identified as live-in-Webflow-but-imported-
 * as-draft (export `_meta.isDraft === true && lastPublished != null`). A page
 * already published is skipped, so this is idempotent / re-runnable.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/publish-misimported-webflow-drafts.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/publish-misimported-webflow-drafts.ts
 *
 * PROD note: publishing is a genuine first-publish transition, so the publish
 * hooks DO fire per doc — IndexNow ping (desired), Meilisearch sync (desired),
 * web revalidate (desired), one Teams notification per doc, and a version row.
 * Expect up to 4 Teams notifications. Run in a quiet window (optionally unset
 * WEBHOOK_TEAMS_URL for the invocation).
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

/**
 * The pages to repair, keyed by their (draft-enabled) collection slug.
 * Derived from the Webflow export scan: items with
 * `_meta.isDraft === true && _meta.lastPublished != null`.
 * `container-image-signing-...` is in the same source state but already
 * published in prod — listed for completeness; the script skips it as a no-op.
 */
const TARGETS: ReadonlyArray<{ collection: 'blogs' | 'guides'; slug: string }> = [
  { collection: 'blogs', slug: 'software-supply-chain-a-practical-guide-for-security-teams' },
  { collection: 'blogs', slug: 'container-security-101-concepts-threats-and-best-practices' },
  { collection: 'blogs', slug: 'container-image-signing-enhancing-security-in-the-software-supply-chain' },
  { collection: 'guides', slug: 'attack-surface-reduction-vs-vulnerability-management' },
  { collection: 'guides', slug: 'hardened-container-image' },
];

const dryRun = process.argv.includes('--dry-run');

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  let published = 0;
  let alreadyPublished = 0;
  let missing = 0;

  for (const { collection, slug } of TARGETS) {
    // `draft: true` is required to surface a draft-only doc — default `find`
    // on a drafts-enabled collection only returns rows with a published version.
    const res = await payload.find({
      collection,
      where: { slug: { equals: slug } },
      draft: true,
      depth: 0,
      limit: 1,
      pagination: false,
      overrideAccess: true,
    });

    const doc = res.docs[0] as { id: number; _status?: 'draft' | 'published' } | undefined;

    if (!doc) {
      missing += 1;
      payload.logger.warn(`✗ ${collection}/${slug}: NOT FOUND in prod — needs (re)import, cannot publish`);
      continue;
    }

    if (doc._status === 'published') {
      alreadyPublished += 1;
      payload.logger.info(`• ${collection}/${slug} (#${doc.id}): already published — skipped`);
      continue;
    }

    if (dryRun) {
      published += 1;
      payload.logger.info(`[dry-run] ${collection}/${slug} (#${doc.id}): draft → publish`);
      continue;
    }

    await payload.update({
      collection,
      id: doc.id,
      data: { _status: 'published' },
      overrideAccess: true,
    });
    published += 1;
    payload.logger.info(`✓ ${collection}/${slug} (#${doc.id}): published`);
  }

  payload.logger.info(
    `Done${dryRun ? ' (dry-run)' : ''}: ${published} ${dryRun ? 'would publish' : 'published'}, ${alreadyPublished} already-published, ${missing} missing.`,
  );

  if (missing > 0 && !dryRun) {
    payload.logger.warn(
      `${missing} target(s) were not in prod. Re-run the Webflow blog/guide import (now status-corrected) for those slugs, then re-run this script.`,
    );
  }

  process.exit(0);
};

try {
  await run();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
