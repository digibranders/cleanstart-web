#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-time backfill: converts `faqs[].answer` from a bare JSON string
 * (the intermediate state left by migration 20260821_120000_faq_answer_
 * richtext.ts's `to_jsonb(answer)` cast) into a real Lexical richText
 * document, so the admin editor and the web `RenderLexical` component
 * both see valid content instead of an unparseable string.
 *
 * Splits on blank lines into paragraphs (mirrors the old plain-text
 * renderers' `.split("\n")` behavior) — converted answers render
 * identically to how they looked before this migration.
 *
 * Idempotent: skips any row whose `answer` is already a real Lexical
 * doc (has a `root.children` array) rather than a bare string.
 *
 * Usage:
 *   DRY_RUN=1 pnpm exec tsx scripts/backfill-faq-answer-lexical.ts
 *   pnpm exec tsx scripts/backfill-faq-answer-lexical.ts
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

const COLLECTIONS = ['blogs', 'guides', 'knowledgeBase'] as const;
const DRY_RUN = process.env.DRY_RUN === '1';

type FaqRow = { id?: string; question?: string; answer?: unknown };

const isBareString = (value: unknown): value is string => typeof value === 'string';

const isAlreadyLexical = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as { root?: { children?: unknown } }).root?.children);

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
});

const paragraphNode = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: null,
  format: '',
  indent: 0,
  version: 1,
});

const stringToLexical = (raw: string) => {
  const paragraphs = raw.split('\n').filter((line) => line.trim().length > 0);
  return {
    root: {
      type: 'root',
      children:
        paragraphs.length > 0 ? paragraphs.map(paragraphNode) : [paragraphNode(raw.trim())],
      direction: null,
      format: '',
      indent: 0,
      version: 1,
    },
  };
};

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  let totalConverted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const collection of COLLECTIONS) {
    const result = await payload.find({
      collection,
      limit: 1000,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    });

    for (const doc of result.docs) {
      const typed = doc as { id: string | number; faqs?: FaqRow[] | null };
      const faqs = typed.faqs;
      if (!Array.isArray(faqs) || faqs.length === 0) continue;

      let touched = false;
      const nextFaqs = faqs.map((row) => {
        if (!isBareString(row.answer)) {
          if (!isAlreadyLexical(row.answer)) {
            // eslint-disable-next-line no-console -- script output
            console.warn(
              `  ? ${collection}#${String(typed.id)}: unexpected answer shape, left untouched`,
            );
          }
          return row;
        }
        touched = true;
        return { ...row, answer: stringToLexical(row.answer) };
      });

      if (!touched) {
        totalSkipped += 1;
        continue;
      }

      // eslint-disable-next-line no-console -- script output
      console.log(`  ${DRY_RUN ? '[dry run] would convert' : 'converting'} ${collection}#${String(typed.id)} (${nextFaqs.filter((r) => r !== faqs.find((f) => f === r)).length} of ${nextFaqs.length} rows)`);

      if (DRY_RUN) {
        totalConverted += 1;
        continue;
      }

      try {
        await payload.update({
          collection,
          id: typed.id,
          data: { faqs: nextFaqs } as Record<string, unknown>,
          overrideAccess: true,
        });
        totalConverted += 1;
      } catch (err) {
        totalErrors += 1;
        const message = err instanceof Error ? err.message : String(err);
        // eslint-disable-next-line no-console -- script output
        console.error(`  ! ${collection}#${String(typed.id)}: ${message}`);
      }
    }
  }

  // eslint-disable-next-line no-console -- script output
  console.log(
    `\nDone. Converted ${totalConverted} docs. Skipped (already Lexical / no FAQs) ${totalSkipped}. Errors: ${totalErrors}.`,
  );
  process.exit(totalErrors > 0 ? 1 : 0);
};

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack ?? err.message : String(err);
  // eslint-disable-next-line no-console -- script output
  console.error(message);
  process.exit(1);
});
