// scripts/import-partners.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, partners } from '@/db/schema';
import { assertLocalDatabase, importPartners, normalizeDomain, partnerFileSchema, type PartnerImportRow } from './import-partners';

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

describe('normalizeDomain', () => {
  it('lowercases and strips the scheme, www., path and trailing dot', () => {
    expect(normalizeDomain('  HTTPS://WWW.Kestrel-Systems.IN/about?x=1 ')).toBe('kestrel-systems.in');
    expect(normalizeDomain('kestrelsystems.in.')).toBe('kestrelsystems.in');
    expect(normalizeDomain('www2.example.com')).toBe('www2.example.com');
  });

  it('is applied when the partner file is parsed', () => {
    const rows = partnerFileSchema.parse([{ name: 'Kestrel', domain: 'https://www.KestrelSystems.in/', category: 'channel', region: 'india' }]);
    expect(rows[0]?.domain).toBe('kestrelsystems.in');
  });
});

describe('importPartners duplicates', () => {
  it('counts a repeated domain in the file as skipped, in a dry run and when applying', async () => {
    const twice: readonly PartnerImportRow[] = [...ROWS, { ...ROWS[0]!, name: 'Kestrel Systems (again)' }];
    expect(await importPartners(db, twice, false)).toEqual({ created: 1, skipped: 1 });
    expect(await importPartners(db, twice, true)).toEqual({ created: 1, skipped: 1 });
    expect(await db.select().from(partners)).toHaveLength(1);
  });
});

describe('assertLocalDatabase', () => {
  it('accepts a local database and refuses any other host unless remote is allowed', () => {
    expect(() => assertLocalDatabase('postgresql://u:p@localhost:5432/cleanstart_portal_h', false)).not.toThrow();
    expect(() => assertLocalDatabase('postgresql://u:p@127.0.0.1:5432/x', false)).not.toThrow();
    expect(() => assertLocalDatabase('postgresql://u:p@db.example.com:5432/x', false)).toThrow('--allow-remote');
    expect(() => assertLocalDatabase('postgresql://u:p@db.example.com:5432/x', true)).not.toThrow();
    expect(() => assertLocalDatabase(undefined, false)).toThrow('DATABASE_URL');
  });
});
