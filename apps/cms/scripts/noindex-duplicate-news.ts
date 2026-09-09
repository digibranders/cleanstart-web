#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Set `seo.indexable = 'noindex'` on the two duplicate news documents whose
 * `-2` collision-suffix slugs are already 308'd at the edge by
 * `apps/web/next.config.ts`.
 *
 * WHY: the redirect stops the duplicate ranking, but `sitemap.ts` builds from
 * published CMS docs and only drops a doc when `seo.indexable` is a noindex
 * value (`isIndexable`, sitemap.ts:84). So both URLs stayed in sitemap.xml,
 * advertising a URL that immediately redirects. Closes SE Ranking finding #51.
 *
 * The documents stay published on purpose — unpublishing would 404 the slug
 * and defeat the 308 that preserves any external links to it.
 *
 * SAFETY: idempotent (skips a doc already noindex), operates on an explicit
 * two-id allow-list, and refuses to touch a doc whose slug does not end in the
 * `-2` suffix. `--dry-run` previews.
 *
 *   pnpm exec tsx --env-file=.env scripts/noindex-duplicate-news.ts --dry-run
 *   pnpm exec tsx --env-file=.env scripts/noindex-duplicate-news.ts
 *
 * PROD note: `payload.update` re-fires the news afterChange hooks. The
 * publish-transition-gated Teams/IndexNow notifications will not fire on a
 * re-save of an already-published doc; Meilisearch re-sync, a new version row
 * and the web revalidate will. Run in a quiet window.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';

/** Duplicate docs, paired with the canonical slug their path already 308s to. */
const DUPLICATES: { id: number; canonical: string }[] = [
  { id: 10, canonical: 'why-containers-drive-supply-chain-breaches' },
  {
    id: 28,
    canonical:
      'triam-security-rebrands-as-cleanstart-to-reflect-product-led-focus-on-securing-the-software-supply-chain',
  },
];

async function run(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let updated = 0;
  let already = 0;
  let refused = 0;

  for (const { id, canonical } of DUPLICATES) {
    const doc = (await payload.findByID({
      collection: 'news',
      id,
      depth: 0,
      draft: true,
      overrideAccess: true,
    })) as { id: number; slug?: string | null; seo?: { indexable?: string | null } | null };

    // Guard: ids are stable but not self-describing. Only ever touch the `-2`
    // duplicate, never the canonical document it redirects to.
    if (doc.slug !== `${canonical}-2`) {
      refused += 1;
      console.error(`REFUSED ${id} — slug "${doc.slug}" is not "${canonical}-2"`);
      continue;
    }

    if (doc.seo?.indexable === 'noindex') {
      already += 1;
      console.log(`already   ${id} — ${doc.slug}`);
      continue;
    }

    if (!dryRun) {
      await payload.update({
        collection: 'news',
        id,
        data: { seo: { ...(doc.seo ?? {}), indexable: 'noindex' } },
        overrideAccess: true,
      });
    }
    updated += 1;
    console.log(
      `${dryRun ? '[dry-run] ' : ''}noindex   ${id} — ${doc.slug} (was ${doc.seo?.indexable ?? 'unset'})`,
    );
  }

  console.log(
    `\nDone. ${DUPLICATES.length} targeted · ${updated} updated · ${already} already-noindex · ${refused} refused.`,
  );
  process.exit(refused > 0 ? 2 : 0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
