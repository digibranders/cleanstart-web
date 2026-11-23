import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { staffRegions, staffScopes } from '@/db/schema';
import { Client } from 'pg';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { publicActor } from '@/server/auth/types';
import { fixedClock } from '@/lib/clock';
import { parseStaffDealParams } from '@/lib/staff-deals-dto';
import { pickManagerId } from '@/server/partner-routing';
import { aggregateRegistrationScope } from '@/server/registrations/scope';
import { withSystem, withViewer } from './context';
import { staffDashboard } from './dashboard';
import { acceptInvite } from './invites';
import { listPartners } from './partners';
import { getRangedReport } from './report-metrics';
import { getAdminReports } from './reports';
import { listManagerOptions } from './staff';
import { loadScope, loadScopes, setStaffScope } from '@/server/staff-scope';
import { listStaffDeals } from './staff-deals';
import { listRegionsAdmin } from './regions';

const db = testDb();
const ownerClient = async (): Promise<Client> => {
  const client = new Client({ connectionString: process.env.PORTAL_TEST_OWNER_URL });
  await client.connect();
  return client;
};
const clock = fixedClock('2026-11-06T14:02:00Z');
const RANGE = { preset: '90d', from: '2026-08-09', to: '2026-11-06' } as const;

beforeEach(() => resetDb(db));

const seedBook = async () => {
  const india = await makePartner(db, { name: 'India Co', region: 'india' });
  const gulf = await makePartner(db, { name: 'Gulf Co', region: 'middle_east' });
  const eu = await makePartner(db, { name: 'EU Co', region: 'eu' });
  const us = await makePartner(db, { name: 'US Co', region: 'us' });
  for (const [partner, region] of [[india, 'india'], [gulf, 'middle_east'], [eu, 'eu'], [us, 'us']] as const) {
    await makeRegistration(db, { partnerId: partner.id, region, customerName: `${region}-deal`, registeredOn: '2026-10-05', status: 'won', dealValue: 100 });
  }
  return { india, gulf, eu, us };
};

describe('staff scope storage', () => {
  it('keeps all as a flag with no rows, and a limited person as rows in list order', async () => {
    const user = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    expect(await loadScope(db, user.id)).toBe('all');
    await setStaffScope(db, user.id, ['eu', 'middle_east']);
    expect(await loadScope(db, user.id)).toEqual(['middle_east', 'eu']);
    const [row] = await db.select().from(staffScopes).where(eq(staffScopes.userId, user.id));
    expect(row?.region).toBe('middle_east');
    await setStaffScope(db, user.id, 'all');
    expect(await loadScope(db, user.id)).toBe('all');
    expect(await db.select().from(staffRegions).where(eq(staffRegions.userId, user.id))).toEqual([]);
  });

  it('rejects the same region twice at the database', async () => {
    const user = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(db.insert(staffRegions).values({ userId: user.id, regionKey: 'india' })).rejects.toThrow();
  });

  it('reads a limited person who has no region rows yet as their one stored key', async () => {
    const user = await makeUser(db, { kind: 'staff', role: 'sales', region: 'eu' });
    await db.delete(staffRegions).where(eq(staffRegions.userId, user.id));
    expect((await loadScopes(db, [user.id])).get(user.id)).toEqual(['eu']);
  });

  it('runs the 0009 backfill: one key becomes one row, all stays all, a second run changes nothing', async () => {
    const one = await makeUser(db, { kind: 'staff', role: 'sales', region: 'middle_east' });
    const everyone = await makeUser(db, { kind: 'staff', role: 'marketing', region: 'all' });
    await db.delete(staffRegions);
    // The last two statements of the migration: become the system actor, then backfill. Run twice to prove it is safe to repeat.
    const backfill = readFileSync(join(process.cwd(), 'drizzle/0009_staff_regions.sql'), 'utf8').split('--> statement-breakpoint').slice(-2);
    const owner = await ownerClient();
    try {
      for (let run = 0; run < 2; run += 1) {
        await owner.query('begin');
        for (const statement of backfill) await owner.query(statement);
        await owner.query('commit');
      }
    } finally {
      await owner.end();
    }
    expect((await db.select().from(staffRegions).where(eq(staffRegions.userId, one.id))).map((r) => r.regionKey)).toEqual(['middle_east']);
    expect(await db.select().from(staffRegions).where(eq(staffRegions.userId, everyone.id))).toEqual([]);
    expect(await loadScope(db, everyone.id)).toBe('all');
  });
});

describe('union scope for staff sales', () => {
  it('sees partners, deals and reports for every region they cover and nothing else', async () => {
    await seedBook();
    const sales = await asStaff(db, 'sales', ['india', 'eu']);
    expect((await withViewer(sales, (tx) => listPartners(tx, sales, {}))).map((p) => p.name).sort()).toEqual(['EU Co', 'India Co']);
    const deals = await withViewer(sales, (tx) => listStaffDeals(tx, sales, parseStaffDealParams({ status: 'all' }), clock));
    expect(deals.rows.map((d) => d.region).sort()).toEqual(['eu', 'india']);
    const report = await withViewer(sales, (tx) => getAdminReports(tx, sales, clock));
    expect(report.partners.map((p) => p.name).sort()).toEqual(['EU Co', 'India Co']);
    expect(report.totalRegistered).toBe(2);
    const ranged = await withViewer(sales, (tx) => getRangedReport(tx, sales, RANGE));
    expect(ranged.leaderboard.map((r) => r.name).sort()).toEqual(['EU Co', 'India Co']);
  });
});

describe('Reports and Overview for partner managers', () => {
  it('limits a partner manager to the partners in their regions', async () => {
    await seedBook();
    const omar = await asStaff(db, 'partner_manager', ['middle_east', 'eu']);
    const report = await withViewer(omar, (tx) => getAdminReports(tx, omar, clock));
    expect(report.partners.map((p) => p.name).sort()).toEqual(['EU Co', 'Gulf Co']);
    expect(report.totalPartners).toBe(2);
    expect(report.totalRegistered).toBe(2);
    expect(report.products.reduce((n, p) => n + p.registered, 0)).toBe(2);
    const ranged = await withViewer(omar, (tx) => getRangedReport(tx, omar, RANGE));
    expect(ranged.leaderboard.map((r) => r.name).sort()).toEqual(['EU Co', 'Gulf Co']);
  });

  it('counts a manager\'s partners by the partner region, not the region a deal was registered in', async () => {
    const { india } = await seedBook();
    await makeRegistration(db, { partnerId: india.id, region: 'middle_east', customerName: 'cross-region', registeredOn: '2026-10-06', status: 'won', dealValue: 5 });
    const omar = await asStaff(db, 'partner_manager', ['middle_east', 'eu']);
    const report = await withViewer(omar, (tx) => getAdminReports(tx, omar, clock));
    expect(report.partners.map((p) => p.name)).not.toContain('India Co');
    expect(report.totalRegistered).toBe(2);
    const priya = await asStaff(db, 'partner_manager', ['india']);
    const indiaReport = await withViewer(priya, (tx) => getAdminReports(tx, priya, clock));
    expect(indiaReport.totalRegistered).toBe(2);
    const ranged = await withViewer(priya, (tx) => getRangedReport(tx, priya, RANGE));
    expect(ranged.leaderboard.map((r) => [r.name, r.deals])).toEqual([['India Co', 2]]);
  });

  it('lets a manager with all regions see everything, in Reports and the Overview', async () => {
    await seedBook();
    const all = await asStaff(db, 'partner_manager', 'all');
    expect((await withViewer(all, (tx) => getAdminReports(tx, all, clock))).totalPartners).toBe(4);
    expect(aggregateRegistrationScope(all)).toBeUndefined();
    const dashboard = await withViewer(all, (tx) => staffDashboard(tx, all, { period: '90d' }, clock));
    expect(dashboard.partnerHealth.active + dashboard.partnerHealth.onboarding + dashboard.partnerHealth.inactive).toBe(4);
  });

  it('limits the Overview of a partner manager the same way', async () => {
    await seedBook();
    const omar = await asStaff(db, 'partner_manager', ['middle_east', 'eu']);
    const dashboard = await withViewer(omar, (tx) => staffDashboard(tx, omar, { period: '90d' }, clock));
    const { active, onboarding, inactive } = dashboard.partnerHealth;
    expect(active + onboarding + inactive).toBe(2);
    expect(Object.values(dashboard.kpis.statusCounts).reduce((n, c) => n + c, 0)).toBe(2);
  });

  it('keeps the Deals list of a partner manager whole, as before', async () => {
    await seedBook();
    const omar = await asStaff(db, 'partner_manager', ['middle_east']);
    expect((await withViewer(omar, (tx) => listStaffDeals(tx, omar, parseStaffDealParams({ status: 'all' }), clock))).rows).toHaveLength(4);
  });
});

describe('routing for a manager who covers several regions', () => {
  it('routes a new partner to a manager covering its region, before an all regions manager', async () => {
    const everyone = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all', name: 'Priya' });
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: ['middle_east', 'eu'], name: 'Omar' });
    expect(await withViewer(await viewerFor(db, omar), (tx) => pickManagerId(tx, 'eu'))).toBe(omar.id);
    expect(await withViewer(await viewerFor(db, omar), (tx) => pickManagerId(tx, 'middle_east'))).toBe(omar.id);
    expect(await withViewer(await viewerFor(db, omar), (tx) => pickManagerId(tx, 'us'))).toBe(everyone.id);
  });

  it('lists the regions of each manager to partners registering a deal', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: ['middle_east', 'eu'], name: 'Omar' });
    const partner = await asPartner(db, { role: 'sales' });
    const options = await withViewer(partner, (tx) => listManagerOptions(tx, partner));
    expect(options).toEqual([expect.objectContaining({ name: 'Omar', regions: ['middle_east', 'eu'], team: 'CleanStart Middle East and EU' })]);
  });

  it('shows a manager under every region they cover on the regions screen', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'all');
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: ['middle_east', 'eu'], name: 'Omar' });
    const list = await withViewer(viewer, (tx) => listRegionsAdmin(tx, viewer));
    const names = (key: string): string[] => (list.find((r) => r.key === key)?.managers ?? []).map((m) => m.name);
    expect(names('eu')).toContain('Omar');
    expect(names('middle_east')).toContain('Omar');
    expect(names('india')).not.toContain('Omar');
    expect(list.find((r) => r.key === 'eu')?.staffCount).toBe(1);
  });
});

describe('a staff invite with several regions', () => {
  it('stores the scope on acceptance as rows', async () => {
    const { invite, token } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'partner_manager', staffRegion: 'middle_east,eu', email: 'new.manager@cleanstart.com' });
    const actor = publicActor('Invitee');
    const accepted = await withSystem(actor, (tx) => acceptInvite(tx, actor, { token, name: 'New Manager', passwordHash: 'scrypt$test$hash', acceptAgreement: false, agreementVersion: 'draft-0' }, clock));
    expect(invite.staffRegion).toBe('middle_east,eu');
    expect(await loadScope(db, accepted.userId)).toEqual(['middle_east', 'eu']);
  });
});
