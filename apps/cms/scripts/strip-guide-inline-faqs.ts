#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Backfill: remove the duplicated inline "FAQs" section from each guide's
 * Lexical `body`. The Webflow import stored guide FAQs twice — in the
 * structured `faqs` field AND inline in the body rich-text (an "FAQs" heading
 * + Q&A) — so the detail page rendered them as both an accordion and a stray
 * heading/list, and the auto table-of-contents / word count included the FAQ
 * text. This strips the inline copy (the structured `faqs` field is the source
 * of truth); the `bodyStatsHook` then recomputes `tableOfContents`,
 * `readingMinutes`, and `wordCount` from the cleaned body.
 *
 * Writes via `payload.update` (not the raw db adapter) so the relational
 * `tableOfContents` sub-table is handled correctly and the beforeChange stats
 * hook fires. The publish webhooks (Teams) and IndexNow hooks are
 * transition-gated — a re-save of an already-published guide does NOT fire
 * them — so the only afterChange effects are a Meilisearch re-sync (desired,
 * it drops the duplicated FAQ text from the index) and a version row per
 * guide. Run in a quiet window, same as the other import backfills.
 *
 * Safety:
 *   - Only strips guides whose `faqs` field is populated, so the Q&A are never
 *     lost (guides with inline FAQs but no structured field are left alone —
 *     they don't double-render).
 *   - Removes from the first FAQ heading to the end of the body, safe because
 *     no guide has a non-FAQ section after the FAQ heading (verified).
 *   - Also repairs any guide whose stored `tableOfContents` is empty while its
 *     body has headings (recompute), so a half-applied run self-heals.
 *   - Idempotent: a clean guide with a populated TOC is skipped.
 *
 * Flags:
 *   --dry-run   Report what would change without writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/strip-guide-inline-faqs.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/strip-guide-inline-faqs.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { extractFromLexical } from '../src/payload/lib/lexical-extract';
import {
  bodyHasInlineFaqHeading,
  stripInlineFaqSection,
} from '../src/payload/lib/webflow-import/strip-faqs';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });

  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  const result = await payload.find({
    collection: 'guides',
    limit: 1000,
    pagination: false,
    depth: 0,
    overrideAccess: true,
    draft: true,
  });

  let scanned = 0;
  let stripped = 0;
  let repaired = 0;
  let skippedNoFaqs = 0;
  let skippedClean = 0;
  let errors = 0;

  for (const doc of result.docs as Record<string, unknown>[]) {
    scanned += 1;
    const id = doc.id;
    const faqs = doc.faqs;
    const body = doc.body;

    const hasStructuredFaqs = Array.isArray(faqs) && faqs.length > 0;
    const willStrip = hasStructuredFaqs && bodyHasInlineFaqHeading(body);
    const nextBody = willStrip ? stripInlineFaqSection(body) : body;

    // Recompute-needed signal (also self-heals a half-applied run that left
    // the TOC sub-table empty while the body still has headings).
    const headingCount = extractFromLexical(nextBody).headings.length;
    const storedToc = doc.tableOfContents;
    const tocEmpty = !Array.isArray(storedToc) || storedToc.length === 0;
    const needsTocRepair = tocEmpty && headingCount > 0;

    if (!willStrip && !needsTocRepair) {
      if (!hasStructuredFaqs && bodyHasInlineFaqHeading(body)) skippedNoFaqs += 1;
      else skippedClean += 1;
      continue;
    }

    const action = willStrip ? 'strip' : 'repair-toc';
    if (DRY_RUN) {
      if (willStrip) stripped += 1;
      else repaired += 1;
      log(`  would ${action}: ${String(doc.slug ?? id)}`);
      continue;
    }

    try {
      await payload.update({
        collection: 'guides',
        id: id as string | number,
        data: { body: nextBody } as Record<string, unknown>,
        overrideAccess: true,
      });
      if (willStrip) stripped += 1;
      else repaired += 1;
      log(`  ${action}: ${String(doc.slug ?? id)}`);
    } catch (err) {
      errors += 1;
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console -- script output
      console.error(`  ! guides#${String(id)}: ${message}`);
    }
  }

  log(
    `\nDone. scanned=${scanned} stripped=${stripped} repaired-toc=${repaired} ` +
      `skipped(no-faqs)=${skippedNoFaqs} skipped(clean)=${skippedClean} errors=${errors}`,
  );
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
