/**
 * Seed for the `legalDocuments` collection — initial production population.
 *
 * Creates each document from scripts/data/legal-seed.ts, converting the HTML
 * body to Lexical via the shared webflow-import helper. Each doc is published
 * and its `effectiveDate` / `displayPublishedAt` stamped from the seed's ISO
 * date.
 *
 * SAFETY: by default a document whose `slug` already exists is **skipped**, so
 * re-running never clobbers content editors have since customized in the admin.
 * Pass `--force` to overwrite existing docs with the seed content (intentional
 * content refresh only). `--dry-run` reports the plan without writing.
 *
 * The `legal_documents` table must already exist — created by the migration
 * (runs via CI on deploy to main). Local dev uses Payload push instead.
 *
 * Run (inside the cms container, env mounted):
 *   pnpm exec tsx --env-file=.env scripts/seed-legal.ts            # create-missing only
 *   pnpm exec tsx --env-file=.env scripts/seed-legal.ts --dry-run  # preview
 *   pnpm exec tsx --env-file=.env scripts/seed-legal.ts --force    # overwrite existing
 *
 * First prod run publishes 8 docs → IndexNow pings the 8 /legal URLs (desired),
 * Meilisearch syncs (desired), and the Teams publish webhook fires once per doc
 * (8 notifications) — run in a quiet window. Idempotent.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical';
import { LEGAL_SEED } from './data/legal-seed.ts';

async function run(): Promise<void> {
  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const doc of LEGAL_SEED) {
    const body = htmlToLexical(doc.html);
    const effectiveISO = new Date(`${doc.effectiveDate}T00:00:00.000Z`).toISOString();

    const existing = await payload.find({
      collection: 'legalDocuments',
      where: { slug: { equals: doc.slug } },
      limit: 1,
      depth: 0,
    });

    const data = {
      title: doc.title,
      slug: doc.slug,
      order: doc.order,
      icon: doc.icon,
      effectiveDate: effectiveISO,
      displayPublishedAt: effectiveISO,
      body,
      _status: 'published' as const,
    };

    if (existing.docs[0]) {
      if (!force) {
        skipped += 1;
        payload.logger.info(`skipped legalDocuments/${doc.slug} (exists; pass --force to overwrite)`);
        continue;
      }
      if (!dryRun) {
        await payload.update({
          collection: 'legalDocuments',
          id: existing.docs[0].id,
          data,
          overrideAccess: true,
        });
      }
      updated += 1;
      payload.logger.info(`${dryRun ? 'would update' : 'updated'} legalDocuments/${doc.slug}`);
    } else {
      if (!dryRun) {
        await payload.create({ collection: 'legalDocuments', data, overrideAccess: true });
      }
      created += 1;
      payload.logger.info(`${dryRun ? 'would create' : 'created'} legalDocuments/${doc.slug}`);
    }
  }

  payload.logger.info(
    `legal seed ${dryRun ? '(dry-run) ' : ''}complete: ${created} created, ${updated} updated, ${skipped} skipped`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
