// scripts/import-partners.ts
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, type Db } from '../src/db/client';
import { partners } from '../src/db/schema';
import { PARTNER_CATEGORIES, PARTNER_REGIONS } from '../src/lib/domain';
import { recordAudit } from '../src/server/audit/record';
import { SYSTEM_ACTORS } from '../src/server/auth/types';
import { enqueue } from '../src/server/hubspot/outbox';

/** The bare host of a pasted website: no scheme, path or leading www., lower case. Partners are matched on it. */
export const normalizeDomain = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/^www\./, '')
    .replace(/\.$/, '');

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** The import writes partners and queues HubSpot syncs, so it must not hit a remote database by accident. */
export const assertLocalDatabase = (url: string | undefined, allowRemote: boolean): void => {
  if (!url) throw new Error('DATABASE_URL is not set');
  if (allowRemote) return;
  if (!LOCAL_HOSTS.has(new URL(url).hostname)) {
    throw new Error('DATABASE_URL is not a local database. Pass --allow-remote only for the approved production import.');
  }
};

const rowSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().min(3).transform(normalizeDomain).pipe(z.string().min(3)),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
});
export const partnerFileSchema = z.array(rowSchema).min(1);
export type PartnerImportRow = z.output<typeof rowSchema>;

export const importPartners = async (
  database: Db, rows: readonly PartnerImportRow[], apply: boolean,
): Promise<{ created: number; skipped: number }> => {
  let created = 0;
  let skipped = 0;
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.domain)) { skipped += 1; continue; }
    seen.add(row.domain);
    const existing = await database.select({ id: partners.id }).from(partners).where(eq(partners.domain, row.domain));
    if (existing.length > 0) { skipped += 1; continue; }
    if (!apply) {
      console.info(`[dry-run] would import ${row.name} (${row.domain})`);
      created += 1;
      continue;
    }
    const inserted = await database.transaction(async (tx) => {
      const [partner] = await tx.insert(partners).values({ ...row, status: 'onboarding' })
        .onConflictDoNothing({ target: partners.domain }).returning({ id: partners.id });
      if (!partner) return false;
      await recordAudit(tx, SYSTEM_ACTORS.portal, {
        event: 'partner.created',
        target: row.name,
        note: 'Imported from the current partner list',
        partnerId: partner.id,
        subject: { type: 'partner', id: partner.id },
      });
      await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: '1' });
      return true;
    });
    if (inserted) created += 1;
    else skipped += 1;
  }
  return { created, skipped };
};

const main = async (): Promise<void> => {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: tsx --env-file=.env scripts/import-partners.ts <partners.json> [--apply] [--allow-remote]');
  const rows = partnerFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const apply = process.argv.includes('--apply');
  assertLocalDatabase(process.env.DATABASE_URL, process.argv.includes('--allow-remote'));
  console.info(apply ? 'APPLY mode' : 'DRY RUN (pass --apply to write)');
  const result = await importPartners(db, rows, apply);
  console.info(`${result.created} ${apply ? 'created' : 'would be created'}, ${result.skipped} already present`);
  await db.$client.end();
};

if (process.argv[1]?.endsWith('import-partners.ts')) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
