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

const rowSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().min(3).transform((value) => value.toLowerCase()),
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
  for (const row of rows) {
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
  if (!file) throw new Error('Usage: tsx --env-file=.env scripts/import-partners.ts <partners.json> [--apply]');
  const rows = partnerFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const apply = process.argv.includes('--apply');
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
