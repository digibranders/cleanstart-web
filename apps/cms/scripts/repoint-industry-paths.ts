#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * One-shot: repoint the CMS rows that key on the two renamed /industries paths.
 *
 * Both routes were renamed on 2026-09-04; their 301s ship in `next.config.ts`,
 * so the new URLs do not exist in production until that deploy lands. That
 * ordering splits this into two stages, because two of the three rows would
 * break live URLs if moved early:
 *
 *   --stage=safe    pageRegistry 43. It is stale already: it still holds
 *                   /industries/saas-container-security, an intermediate slug
 *                   the page left on 2026-09-02, so the live SaaS page has had
 *                   no WebPage node in its JSON-LD graph since. Pointing it at
 *                   the new path is neutral today and correct after deploy.
 *
 *   --stage=deploy  pageRegistry 42 and redirects 41. Both are correct against
 *                   the URLs production serves right now. Moving them early
 *                   would drop the finance page's WebPage node and, worse,
 *                   point the live /financial-services 301 at a 404.
 *
 * Idempotent: a row already holding the target value is skipped. Every write is
 * guarded on the row's expected current value, so a surprise row is reported
 * and left alone rather than overwritten. `--dry-run` reads and reports only.
 */
import { getPayload } from 'payload';
import payloadConfig from '../src/payload.config.ts';

const DRY_RUN = process.argv.includes('--dry-run');
const STAGE = process.argv.find((a) => a.startsWith('--stage='))?.split('=')[1];

interface Move {
  readonly stage: 'safe' | 'deploy';
  readonly collection: 'pageRegistry' | 'redirects';
  readonly id: number;
  readonly field: 'path' | 'to';
  readonly expect: string;
  readonly next: string;
}

const MOVES: readonly Move[] = [
  { stage: 'safe', collection: 'pageRegistry', id: 43, field: 'path', expect: '/industries/saas-container-security', next: '/industries/software-applications' },
  { stage: 'deploy', collection: 'pageRegistry', id: 42, field: 'path', expect: '/industries/financial-services-container-security', next: '/industries/financial-services' },
  { stage: 'deploy', collection: 'redirects', id: 41, field: 'to', expect: '/industries/financial-services-container-security', next: '/industries/financial-services' },
];

const run = async (): Promise<void> => {
  if (STAGE !== 'safe' && STAGE !== 'deploy') {
    console.error('pass --stage=safe or --stage=deploy');
    process.exit(1);
  }
  const payload = await getPayload({ config: payloadConfig });
  console.log(`=== stage=${STAGE} ${DRY_RUN ? '(DRY RUN, no writes)' : '(APPLYING)'} ===`);

  for (const move of MOVES.filter((m) => m.stage === STAGE)) {
    const doc = await payload.findByID({ collection: move.collection, id: move.id, depth: 0 }).catch(() => null);
    if (!doc) {
      console.log(`${move.collection} id=${move.id}: NOT FOUND, skipped`);
      continue;
    }
    const current = String((doc as Record<string, unknown>)[move.field] ?? '');
    if (current === move.next) {
      console.log(`${move.collection} id=${move.id}: already "${move.next}", skipped`);
      continue;
    }
    if (current !== move.expect) {
      console.log(`${move.collection} id=${move.id}: expected "${move.expect}" but found "${current}" — LEFT ALONE, review manually`);
      continue;
    }
    console.log(`${move.collection} id=${move.id}: ${move.field} "${current}" -> "${move.next}"`);
    if (!DRY_RUN) {
      await payload.update({ collection: move.collection, id: move.id, data: { [move.field]: move.next } });
      const after = await payload.findByID({ collection: move.collection, id: move.id, depth: 0 });
      console.log(`  written, now "${String((after as Record<string, unknown>)[move.field])}"`);
    }
  }
  console.log('done');
  process.exit(0);
};

void run();
