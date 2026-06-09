#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Dump a Guides inventory (READ-ONLY) for reporting.
 *
 * Fetches every guide at depth:1 so authors / reviewer / hero image resolve,
 * and writes a flat JSON row per guide with the fields useful for an audit
 * spreadsheet (status, cover presence, word count, reading time, FAQ count,
 * SEO, dates).
 *
 * Run inside the prod cms container:
 *   docker exec -w /app/apps/cms cleanstart-cms-1 pnpm dlx tsx scripts/dump-guides.ts
 * Output: /tmp/guides-inventory.json
 */
import { getPayload } from 'payload';

import payloadConfig from '../src/payload.config.ts';

interface Named { name?: string | null }
interface MediaLite { filename?: string | null; url?: string | null; alt?: string | null }

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const names = (v: unknown): string =>
  Array.isArray(v) ? v.map((a) => str((a as Named)?.name)).filter(Boolean).join(', ') : '';

const run = async (): Promise<void> => {
  const payload = await getPayload({ config: payloadConfig });
  const res = await payload.find({
    collection: 'guides',
    depth: 1,
    limit: 1000,
    pagination: false,
    overrideAccess: true,
    draft: false,
  });

  const rows = res.docs.map((raw) => {
    const g = raw as Record<string, unknown>;
    const hero = g.heroImage as MediaLite | null | undefined;
    const reviewer = g.reviewedBy as Named | null | undefined;
    const seo = (g.seo ?? {}) as Record<string, unknown>;
    const faqs = Array.isArray(g.faqs) ? g.faqs.length : 0;
    return {
      id: g.id as number,
      title: str(g.title),
      slug: str(g.slug),
      status: str(g._status) || 'published',
      authors: names(g.authors),
      reviewedBy: str(reviewer?.name),
      hasCover: hero?.url ? 'Yes' : 'No',
      coverFilename: str(hero?.filename),
      wordCount: typeof g.wordCount === 'number' ? g.wordCount : null,
      readingMinutes: typeof g.readingMinutes === 'number' ? g.readingMinutes : null,
      faqs,
      seoTitle: str(seo.title),
      seoDescription: str(seo.description),
      keywordTarget: str(seo.keywordTarget),
      publishedAt: str(g.displayPublishedAt) || str(g.publishedAt),
      lastReviewedAt: str(g.lastReviewedAt),
      updatedAt: str(g.updatedAt),
    };
  });

  const fs = await import('node:fs');
  fs.writeFileSync('/tmp/guides-inventory.json', `${JSON.stringify(rows, null, 2)}\n`);
  payload.logger.info(`Wrote /tmp/guides-inventory.json (${rows.length} guides).`);
  process.exit(0);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
