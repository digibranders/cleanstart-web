#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill: convert flattened inline CTAs in each guide's Lexical `body` into
 * structured `inlineCta` blocks. The Webflow import flattened
 * `<div class="artcileCtaBox"><h3>prompt <a>label</a></h3></div>` to a plain
 * heading + link, so the web detail page rendered them as ordinary headings.
 * This restores them as real CTA cards. Detection + conversion logic (and its
 * tests) live in `src/payload/lib/webflow-import/cta-cards.ts`.
 *
 * Writes via `payload.update` (not the raw db adapter) so the richText field's
 * block validation runs and the `bodyStatsHook` recomputes TOC/word count from
 * the rewritten body (the converted headings drop out of the table-of-contents,
 * which is correct — a CTA card is not a section). The Teams publish webhook
 * and IndexNow hooks are transition-gated, so a re-save of an already-published
 * guide does NOT fire them; the only afterChange effects are a Meilisearch
 * re-sync and a version row per guide. Run in a quiet window, same as the other
 * import backfills.
 *
 * Idempotent: once a heading is converted to a block it is no longer matched,
 * so a re-run is a no-op. Only top-level headings containing a link are touched.
 *
 * By default only clean "prompt? + button" CTAs (the link is the trailing
 * element) are converted. CTAs whose link sits mid-sentence don't split cleanly
 * into heading + button, so they are deferred and reported for manual handling.
 * Pass --include-mid-sentence to convert those too (reworded heading text — give
 * each a glance in the admin afterwards).
 *
 * Flags:
 *   --dry-run               Report what would change without writing.
 *   --include-mid-sentence  Also convert mid-sentence-link CTAs.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/migrate-guide-cta-cards.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/migrate-guide-cta-cards.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { convertBodyCtas } from '../src/payload/lib/webflow-import/cta-cards';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const INCLUDE_MID_SENTENCE = args.has('--include-mid-sentence');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  log(
    `\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}` +
      ` · mid-sentence CTAs: ${INCLUDE_MID_SENTENCE ? 'CONVERT' : 'defer'}\n`,
  );

  const result = await payload.find({
    collection: 'guides',
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });

  let scanned = 0;
  let guidesChanged = 0;
  let cardsConverted = 0;
  let reviewCount = 0;
  let deferredCount = 0;
  let skippedCount = 0;
  let errors = 0;

  for (const doc of result.docs as Record<string, unknown>[]) {
    scanned += 1;
    const id = doc.id;
    const slug = String(doc.slug ?? id);

    const { body, converted, review, deferred, skipped } = convertBodyCtas(doc.body, {
      includeMidSentence: INCLUDE_MID_SENTENCE,
    });

    for (const r of review) log(`    · review wording (mid-sentence link): "${r}"  [${slug}]`);
    for (const d of deferred) log(`    · deferred (mid-sentence link — manual): "${d}"  [${slug}]`);
    for (const s of skipped) log(`    · skipped (no prompt text): "${s}"  [${slug}]`);
    reviewCount += review.length;
    deferredCount += deferred.length;
    skippedCount += skipped.length;

    if (converted === 0) continue;

    if (DRY_RUN) {
      guidesChanged += 1;
      cardsConverted += converted;
      log(`  would convert ${converted} card(s): ${slug}`);
      continue;
    }

    try {
      await payload.update({
        collection: 'guides',
        id: id as string | number,
        data: { body } as Record<string, unknown>,
        overrideAccess: true,
      });
      guidesChanged += 1;
      cardsConverted += converted;
      log(`  converted ${converted} card(s): ${slug}`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! guides#${String(id)} (${slug}): ${message}`);
    }
  }

  log(
    `\nDone. scanned=${scanned} guides-changed=${guidesChanged} ` +
      `cards-converted=${cardsConverted} review=${reviewCount} ` +
      `deferred=${deferredCount} skipped=${skippedCount} errors=${errors}`,
  );
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
