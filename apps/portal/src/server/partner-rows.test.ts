import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { users } from '@/db/schema';
import { makeApplication, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem } from '@/server/repo/context';
import { partnerListRows } from './partner-rows';

const db = testDb();
const rows = (filter: Parameters<typeof partnerListRows>[1]) => withSystem(SYSTEM_ACTORS.portal, (tx) => partnerListRows(tx, filter));
const today = systemClock.today();

beforeEach(async () => {
  await resetDb(db);
});

describe('partnerListRows', () => {
  it('counts people with a login or an open invite, registration figures and the manager', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', name: 'Farhan Qureshi', region: 'india' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', managerId: manager.id, hubspotCompanyId: '91822044' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
    await makeUser(db, { partnerId: partner.id, role: 'sales' });
    await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    await db.update(users).set({ lastLoginAt: new Date('2026-11-10T09:00:00Z') }).where(eq(users.id, admin.id));
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'sneha@kestrelsystems.in', expiresAt: new Date('2027-01-01T00:00:00Z') });
    await makeRegistration(db, { partnerId: partner.id, status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, status: 'accepted' });
    await makeRegistration(db, { partnerId: partner.id, status: 'won', registeredOn: today, closedOn: today });
    await makeRegistration(db, { partnerId: partner.id, status: 'won', registeredOn: '2019-01-01', closedOn: '2019-03-01' });
    const [row] = await rows({});
    expect(row).toMatchObject({
      name: 'Kestrel Systems',
      users: 3,
      pending: 1,
      protectedCount: 1,
      won: 1,
      adminName: 'Aditi Rao',
      managerName: 'Farhan Qureshi',
      managerId: manager.id,
      hubspotCompanyId: '91822044',
      lastActiveAt: '2026-11-10T09:00:00.000Z',
      agreementVersion: null,
    });
  });

  it('names the admin from the approved application, then from the invite email, when nobody has signed in yet', async () => {
    const withApplication = await makePartner(db, { name: 'Alpha', domain: 'alpha.example', status: 'onboarding' });
    await makeInvite(db, { kind: 'partner', partnerId: withApplication.id, role: 'partner_admin', email: 'neha@alpha.example', expiresAt: new Date('2027-01-01T00:00:00Z') });
    await makeApplication(db, { partnerId: withApplication.id, status: 'approved', applicantName: 'Neha Joshi', email: 'neha@alpha.example', source: 'portal' });
    const bare = await makePartner(db, { name: 'Beta', domain: 'beta.example', status: 'onboarding' });
    await makeInvite(db, { kind: 'partner', partnerId: bare.id, role: 'partner_admin', email: 'omar.siddiqui@beta.example', expiresAt: new Date('2027-01-01T00:00:00Z') });
    const found = await rows({});
    expect(found.find((r) => r.name === 'Alpha')).toMatchObject({ adminName: 'Neha Joshi', users: 1 });
    expect(found.find((r) => r.name === 'Beta')).toMatchObject({ adminName: 'Omar Siddiqui', users: 1 });
  });

  it('filters by search, status, category, region and ids, sorted by name', async () => {
    const a = await makePartner(db, { name: 'Zeta Cyber', domain: 'zeta.example', category: 'distributor', region: 'middle_east', status: 'active' });
    const b = await makePartner(db, { name: 'Alpha Secure', domain: 'alpha.example', category: 'channel', region: 'india', status: 'onboarding' });
    expect((await rows({})).map((r) => r.name)).toEqual(['Alpha Secure', 'Zeta Cyber']);
    expect((await rows({ q: 'zeta' })).map((r) => r.id)).toEqual([a.id]);
    expect((await rows({ q: 'alpha.example' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ status: 'onboarding' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ category: 'distributor' })).map((r) => r.id)).toEqual([a.id]);
    expect((await rows({ region: 'india' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ ids: [a.id] })).map((r) => r.id)).toEqual([a.id]);
    expect(await rows({ ids: [] })).toEqual([]);
    expect((await rows({ scopeRegion: 'middle_east' })).map((r) => r.id)).toEqual([a.id]);
    expect(await rows({ scopeRegion: 'all' })).toHaveLength(2);
  });

  it('treats LIKE wildcards in the search term literally', async () => {
    await makePartner(db, { name: '100% Secure', domain: 'pct.example' });
    await makePartner(db, { name: 'Other', domain: 'other.example' });
    expect((await rows({ q: '%' })).map((r) => r.name)).toEqual(['100% Secure']);
  });
});
