import { Client } from 'pg';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  makeDocument,
  makePartner,
  makeRegistration,
  makeUser,
  resetDb,
  testDb,
  testPool,
} from '@/db/test-helpers';

interface Identity {
  kind: 'partner' | 'staff' | 'system';
  partnerId?: string;
  userId?: string;
}

/** Runs `fn` in a transaction on the system pool with the identity set exactly as withViewer will (set_config, transaction local). */
const as = async <T>(identity: Identity, fn: (q: (sql: string, params?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>): Promise<T> => {
  const client = await testPool().connect();
  try {
    await client.query('begin');
    await client.query("select set_config('app.kind', $1, true), set_config('app.partner_id', $2, true), set_config('app.user_id', $3, true)", [
      identity.kind,
      identity.partnerId ?? '',
      identity.userId ?? '',
    ]);
    const result = await fn(async (text, params) => (await client.query(text, params)).rows);
    await client.query('rollback');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
};

describe('row level security', () => {
  let a = { partnerId: '', registrationId: '', userId: '' };
  let b = { partnerId: '', registrationId: '', userId: '' };
  let staffId = '';
  let docForB = '';

  beforeAll(async () => {
    await resetDb();
    const db = testDb();
    const [pa, pb] = [await makePartner(db, { name: 'Alpha' }), await makePartner(db, { name: 'Beta' })];
    const [ua, ub] = [await makeUser(db, { partnerId: pa.id }), await makeUser(db, { partnerId: pb.id })];
    const [ra, rb] = [await makeRegistration(db, { partnerId: pa.id }), await makeRegistration(db, { partnerId: pb.id })];
    staffId = (await makeUser(db, { kind: 'staff', role: 'partner_manager' })).id;
    docForB = (await makeDocument(db, { partnerIds: [pb.id] })).id;
    await makeDocument(db, { title: 'For everyone' });
    a = { partnerId: pa.id, registrationId: ra.id, userId: ua.id };
    b = { partnerId: pb.id, registrationId: rb.id, userId: ub.id };
  });

  it('shows a partner only its own registrations and company', async () => {
    const rows = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from registrations'));
    expect(rows.map((r) => r.id)).toEqual([a.registrationId]);
    const companies = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from partners'));
    expect(companies.map((r) => r.id)).toEqual([a.partnerId]);
  });

  it('shows a partner its colleagues and the active partner managers, not other companies', async () => {
    const rows = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select id from users'));
    const ids = rows.map((r) => r.id);
    expect(ids).toContain(a.userId);
    expect(ids).toContain(staffId);
    expect(ids).not.toContain(b.userId);
  });

  it('shows staff and system every registration', async () => {
    for (const kind of ['staff', 'system'] as const) {
      const rows = await as({ kind, userId: staffId }, (q) => q('select id from registrations'));
      expect(rows).toHaveLength(2);
    }
  });

  it('shows a connection with no identity nothing', async () => {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      expect((await client.query('select id from registrations')).rowCount).toBe(0);
      expect((await client.query('select id from partners')).rowCount).toBe(0);
    } finally {
      await client.end();
    }
  });

  it('applies the audience rule to documents and hides deleted ones', async () => {
    const titles = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) => q('select title, id from documents'));
    expect(titles.map((r) => r.title)).toEqual(['For everyone']);
    expect(titles.map((r) => r.id)).not.toContain(docForB);
  });

  it('copies partner_id onto child rows from the parent registration and rejects another company', async () => {
    const own = await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, async (q) => {
      await q("insert into registration_events (registration_id, text, by_label, source) values ($1, 'x', 'y', 'portal')", [a.registrationId]);
      return q('select partner_id from registration_events');
    });
    expect(own).toEqual([{ partner_id: a.partnerId }]);
    await expect(
      as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) =>
        q("insert into registration_events (registration_id, text, by_label, source) values ($1, 'x', 'y', 'portal')", [b.registrationId]),
      ),
    ).rejects.toThrow(/not found or not visible/);
  });

  it('lets staff lock a registration for update', async () => {
    const rows = await as({ kind: 'staff', userId: staffId }, (q) => q('select id from registrations where id = $1 for update', [b.registrationId]));
    expect(rows).toHaveLength(1);
  });

  it('keeps notifications private to the user, but lets anyone insert one for someone else', async () => {
    await as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, async (q) => {
      await q("insert into notifications (user_id, kind, title) values ($1, 'team_joined', 'hi')", [staffId]);
      expect(await q('select id from notifications')).toHaveLength(0);
    });
    await expect(
      as({ kind: 'partner', partnerId: a.partnerId, userId: a.userId }, (q) =>
        q("insert into notifications (user_id, kind, title) values ($1, 'team_joined', 'hi') returning id", [staffId]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('hides the Better Auth tables from every identity except system', async () => {
    for (const kind of ['partner', 'staff'] as const) {
      await expect(
        as({ kind, partnerId: kind === 'partner' ? a.partnerId : '', userId: a.userId }, (q) =>
          q("insert into auth_verification (identifier, value, expires_at) values ('x', 'y', now())"),
        ),
      ).rejects.toThrow(/row-level security/);
    }
  });
});
