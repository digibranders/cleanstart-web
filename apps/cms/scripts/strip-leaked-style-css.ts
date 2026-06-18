#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: remove leaked `<style>` stylesheet paragraphs from content bodies.
 *
 * The Webflow import's HTML→Lexical converter used to harvest the text of an
 * embedded `<style>` block as a body paragraph, so raw CSS rules (e.g.
 * `.what-is-mythos-box { padding: 20px; ... }`) rendered as visible body text.
 * The converter now drops `<style>`/`<script>` (`html-to-lexical.ts` DROP_TAGS),
 * but docs imported before that fix still carry the leaked paragraph. This
 * strips them. Detection/strip logic + tests:
 * `src/payload/lib/webflow-import/strip-style-css.ts`.
 *
 * Writes via `payload.update` so the beforeChange stats hook recomputes
 * `tableOfContents`/`readingMinutes`/`wordCount` from the cleaned body. The
 * Teams (`webhooks-publish`) and IndexNow hooks are publish-transition-gated —
 * a re-save of an already-published doc does NOT fire them — so the only
 * afterChange effects are a Meilisearch re-sync (desired), a web revalidate
 * (desired — drops the CSS from the live page), and a version row per doc.
 * Run in a quiet window, same as the other import backfills.
 *
 * Idempotent: a clean doc is skipped (no write). Conservative detector — only a
 * paragraph that is itself a stylesheet is removed (see the lib for the rule).
 *
 * Flags:
 *   --dry-run   Report what would change without writing.
 *
 * Run from apps/cms with the env file loaded:
 *   pnpm exec tsx --env-file=.env scripts/strip-leaked-style-css.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/strip-leaked-style-css.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';
import { stripLeakedStyleCss } from '../src/payload/lib/webflow-import/strip-style-css';

const COLLECTIONS = ['blogs', 'guides', 'news', 'resources', 'knowledgeBase'] as const;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');

const log = (msg: string): void => {
  // eslint-disable-next-line no-console -- script output
  console.log(msg);
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  log(`\nMode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'WRITE via payload.update'}\n`);

  let scanned = 0;
  let cleaned = 0;
  let errors = 0;

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection,
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
      draft: true,
    });

    for (const doc of result.docs as Record<string, unknown>[]) {
      scanned += 1;
      const { body: nextBody, removed } = stripLeakedStyleCss(doc.body);
      if (removed === 0) continue;

      const label = `${collection}/${String(doc.slug ?? doc.id)} (-${removed} css para)`;
      if (DRY_RUN) {
        cleaned += 1;
        log(`  would clean: ${label}`);
        continue;
      }

      try {
        await payload.update({
          collection,
          id: doc.id as string | number,
          data: { body: nextBody } as Record<string, unknown>,
          overrideAccess: true,
        });
        cleaned += 1;
        log(`  cleaned: ${label}`);
      } catch (err) {
        errors += 1;
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console -- script output
        console.error(`  ! ${collection}#${String(doc.id)}: ${message}`);
      }
    }
  }

  log(`\nDone. scanned=${scanned} cleaned=${cleaned} errors=${errors}`);
  process.exit(errors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
