// scripts/import-partners.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, partners } from '@/db/schema';
import { importPartners, type PartnerImportRow } from './import-partners';

const db = testDb();
beforeEach(() => resetDb(db));

const ROWS: readonly PartnerImportRow[] = [
  { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel', region: 'india' },
];

describe('importPartners', () => {
  it('writes nothing on a dry run', async () => {
    expect(await importPartners(db, ROWS, false)).toEqual({ created: 1, skipped: 0 });
    expect(await db.select().from(partners)).toHaveLength(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('creates an onboarding partner, one audit entry and one partner.upsert', async () => {
    expect(await importPartners(db, ROWS, true)).toEqual({ created: 1, skipped: 0 });
    const saved = (await db.select().from(partners))[0]!;
    expect(saved).toMatchObject({ name: 'Kestrel Systems', domain: 'kestrelsystems.in', status: 'onboarding' });
    expect((await db.select().from(hubspotOutbox)).map((r) => r.idempotencyKey)).toEqual([`partner.upsert:${saved.id}:1`]);
    expect((await db.select().from(auditLog).where(eq(auditLog.subjectId, saved.id))).map((e) => e.event)).toEqual(['partner.created']);
  });

  it('skips a domain that is already a partner, so a second run changes nothing', async () => {
    await importPartners(db, ROWS, true);
    expect(await importPartners(db, ROWS, true)).toEqual({ created: 0, skipped: 1 });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});
