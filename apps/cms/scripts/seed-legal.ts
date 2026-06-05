/**
 * One-shot, idempotent seed for the `legalDocuments` collection.
 *
 * Creates each document from scripts/data/legal-seed.ts, converting the HTML
 * body to Lexical via the shared webflow-import helper. A document whose `slug`
 * already exists is updated in place (no duplicates). Each doc is published and
 * its `effectiveDate` / `displayPublishedAt` stamped from the seed's ISO date.
 *
 * Run (DB reachable; local dev uses Payload push to create the table):
 *   pnpm exec tsx --env-file=.env scripts/seed-legal.ts
 *   # or inside the cms container: pnpm exec payload run scripts/seed-legal.ts
 *
 * Idempotent / re-runnable.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.ts';
import { htmlToLexical } from '../src/payload/lib/webflow-import/html-to-lexical';
import { LEGAL_SEED } from './data/legal-seed.ts';

async function run(): Promise<void> {
  const payload = await getPayload({ config });

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
      await payload.update({
        collection: 'legalDocuments',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      });
      payload.logger.info(`updated legalDocuments/${doc.slug}`);
    } else {
      await payload.create({ collection: 'legalDocuments', data, overrideAccess: true });
      payload.logger.info(`created legalDocuments/${doc.slug}`);
    }
  }

  payload.logger.info(`legal seed complete: ${LEGAL_SEED.length} docs`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
