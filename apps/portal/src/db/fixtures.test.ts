import { eq, sql } from 'drizzle-orm';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { authAccounts, users } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { hashPassword } from '@/server/auth/passwords';
import { assertDevSeedAllowed, parseLastSeen, parseMockDate, seedDevDatabase, seedMockData, type SeedSummary } from './fixtures';
import { resetDb, testDb } from './test-helpers';

const clock = fixedClock('2026-11-06T14:02:00Z');

const rows = async (query: string): Promise<Record<string, unknown>[]> => (await testDb().execute(sql.raw(query))).rows;

describe('mock date parsing', () => {
  it('reads dates with and without a year', () => {
    expect(parseMockDate('6 Nov 2026', 2026)).toBe('2026-11-06');
    expect(parseMockDate('29 Oct, 10:12', 2026)).toBe('2026-10-29');
    expect(() => parseMockDate('someday', 2026)).toThrow(/cannot read a date/);
  });

  it('reads last seen strings relative to the clock', () => {
    expect(parseLastSeen('Now', clock).lastLoginAt?.toISOString()).toBe('2026-11-06T14:02:00.000Z');
    expect(parseLastSeen('2 hours ago', clock).lastLoginAt?.toISOString()).toBe('2026-11-06T12:02:00.000Z');
    expect(parseLastSeen('Invited 5 Nov', clock)).toEqual({ lastLoginAt: null, invitedAt: new Date('2026-11-05T09:00:00.000Z') });
    expect(parseLastSeen('2 Nov 2026', clock).lastLoginAt?.toISOString()).toBe('2026-11-02T09:00:00.000Z');
  });
});

describe('seedMockData', () => {
  let summary: SeedSummary;
  beforeAll(async () => {
    await resetDb();
    summary = await seedMockData(testDb(), { clock });
  });

  it('loads the counts the contracts promise', () => {
    expect(summary).toMatchObject({ partners: 21, registrations: 15, applications: 3, documents: 12, auditEntries: 13 });
  });

  it('loads registrations by status exactly as the mock lists them', async () => {
    const byStatus = Object.fromEntries((await rows('select r.status, count(*)::int as n from registrations r group by r.status')).map((r) => [r.status, r.n]));
    expect(byStatus).toEqual({ pending: 4, accepted: 5, rejected: 2, won: 2, lost: 1, expired: 1 });
    const kestrel = await rows("select r.status, count(*)::int as n from registrations r join partners p on p.id = r.partner_id where p.name = 'Kestrel Systems' group by r.status");
    expect(Object.fromEntries(kestrel.map((r) => [r.status, r.n]))).toEqual({ pending: 2, accepted: 3, rejected: 1, won: 2, lost: 1, expired: 1 });
  });

  it('keeps the partner manager routing and the HubSpot ids of accepted deals', async () => {
    const vardhan = await rows("select hubspot_deal_id, hubspot_synced_at, protection_end::text as protection_end, (select name from users where id = manager_id) as manager from registrations where customer_name = 'Vardhan Capital' and product = 'cleansight'");
    expect(vardhan[0]).toMatchObject({ hubspot_deal_id: '48213', protection_end: '2027-01-12', manager: 'Farhan Qureshi' });
    expect(new Date(String(vardhan[0]?.hubspot_synced_at)).toISOString()).toBe('2026-11-06T14:02:00.000Z');
  });

  it('seeds four Kestrel people, one invited, and the open access request', async () => {
    const people = await rows("select u.name, u.status from users u join partners p on p.id = u.partner_id where p.name = 'Kestrel Systems' order by u.name");
    expect(people.map((p) => `${p.name}:${p.status}`)).toEqual(['Aditi Rao:active', 'Karan Malhotra:active', 'Sneha Iyer:active', 'Vikram Sethi:invited']);
    expect(await rows("select email from access_requests where status = 'open'")).toEqual([{ email: 'rohit.desai@kestrelsystems.in' }]);
  });

  it('reproduces document open counts, partner counts and Kestrel own opens', async () => {
    const stats = await rows(`
      select d.title, count(o.id)::int as opens, count(distinct o.partner_id)::int as partner_count,
             count(o.id) filter (where p.name = 'Kestrel Systems')::int as own
      from documents d left join document_opens o on o.document_id = d.id left join partners p on p.id = o.partner_id
      group by d.title order by d.title`);
    const byTitle = Object.fromEntries(stats.map((s) => [s.title, s]));
    expect(byTitle['CleanSight product walkthrough']).toMatchObject({ opens: 38, partner_count: 14, own: 9 });
    expect(byTitle['Partner sales playbook 2026']).toMatchObject({ opens: 112, partner_count: 18, own: 14 });
    expect(byTitle['Gulf region price list']).toMatchObject({ opens: 9, partner_count: 2, own: 0 });
  });

  it('resolves audit ages against the clock and uses the closed event names', async () => {
    const latest = await rows('select event, at, source from audit_log order by at desc limit 1');
    expect(latest[0]).toMatchObject({ event: 'registration.stage_changed', source: 'crm' });
    expect(new Date(String(latest[0]?.at)).toISOString()).toBe('2026-11-06T14:02:00.000Z');
    expect((await rows('select count(*)::int as n from audit_log where event is null'))[0]).toEqual({ n: 0 });
  });

  it('starts application references after the seeded ones', async () => {
    expect(await rows("select nextval('application_reference_seq')::int as n")).toEqual([{ n: 45 }]);
  });
});

describe('seedDevDatabase', () => {
  it('seeds an empty database once and refuses a second run', async () => {
    await resetDb();
    expect((await seedDevDatabase(testDb(), clock)).partners).toBe(21);
    await expect(seedDevDatabase(testDb(), clock)).rejects.toThrow(/already has partners/);
    expect((await rows('select count(*)::int as n from partners'))[0]).toEqual({ n: 21 });
  });
});

describe('dev seed guard', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('allows a local, non-production database', () => {
    expect(() => assertDevSeedAllowed({ NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@localhost:5432/d' })).not.toThrow();
    expect(() => assertDevSeedAllowed({ DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/d' })).not.toThrow();
    expect(() => assertDevSeedAllowed({ DATABASE_URL: 'postgresql://u:p@[::1]:5432/d' })).not.toThrow();
  });

  it('refuses production and any non-local host', () => {
    expect(() => assertDevSeedAllowed({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost:5432/d' })).toThrow(/production/);
    expect(() => assertDevSeedAllowed({ DATABASE_URL: 'postgresql://u:p@db.example.com:5432/d' })).toThrow(/not localhost/);
    expect(() => assertDevSeedAllowed({ DATABASE_URL: 'postgresql://u:p@localhost.evil.test:5432/d' })).toThrow(/not localhost/);
    expect(() => assertDevSeedAllowed({})).toThrow(/DATABASE_URL is not set/);
    expect(() => assertDevSeedAllowed({ DATABASE_URL: 'not a url' })).toThrow(/not a valid URL/);
  });

  it('seedDevDatabase refuses before touching the database', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await resetDb();
    await expect(seedDevDatabase(testDb(), clock)).rejects.toThrow(/production/);
    expect((await rows('select count(*)::int as n from partners'))[0]).toEqual({ n: 0 });
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('DATABASE_URL', 'postgresql://u:p@db.example.com:5432/d');
    await expect(seedDevDatabase(testDb(), clock)).rejects.toThrow(/not localhost/);
  });
});

describe('seedMockData with a password hash', () => {
  it('gives every active user one credential login and the invited users none', async () => {
    await resetDb();
    await seedMockData(testDb(), { clock, passwordHash: await hashPassword('Portal-dev-2026!') });
    const accounts = await testDb().select({ userId: authAccounts.userId, providerId: authAccounts.providerId }).from(authAccounts);
    const active = await testDb().select({ id: users.id }).from(users).where(eq(users.status, 'active'));
    expect(accounts).toHaveLength(active.length);
    expect(new Set(accounts.map((account) => account.providerId))).toEqual(new Set(['credential']));
  });
});
