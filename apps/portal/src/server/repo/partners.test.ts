import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { withSystem, withViewer } from './context';
import { getChecklist, getCompany, listPartnerAdminRecipients, tickChecklistStep, updateCompanyProfile } from './partners';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('getCompany', () => {
  it('returns the company with its manager, agreement and the not-assigned tier', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi', email: 'farhan@cleanstart.com' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel', region: 'india', managerId: manager.id });
    await db.update(partners).set({ website: 'kestrelsystems.in', phone: '+91 80 4718 2290', about: 'Security reseller.', agreementVersion: '1.2', agreementAcceptedAt: new Date('2026-03-12T14:06:00Z') }).where(eq(partners.id, partner.id));
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const company = await withViewer(viewer, (tx) => getCompany(tx, viewer, {}));
    expect(company).toMatchObject({
      partnerId: partner.id,
      name: 'Kestrel Systems',
      domain: 'kestrelsystems.in',
      category: 'channel',
      region: 'india',
      website: 'kestrelsystems.in',
      phone: '+91 80 4718 2290',
      address: null,
      about: 'Security reseller.',
      tier: null,
      agreementVersion: '1.2',
      agreementAcceptedAt: '2026-03-12T14:06:00.000Z',
      manager: { id: manager.id, name: 'Farhan Qureshi', email: 'farhan@cleanstart.com', team: 'CleanStart India' },
    });
  });

  it('has no manager when none is assigned and refuses another partner id', async () => {
    const mine = await makePartner(db, {});
    const other = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: mine.id });
    expect((await withViewer(viewer, (tx) => getCompany(tx, viewer, {}))).manager).toBeNull();
    await expect(withViewer(viewer, (tx) => getCompany(tx, viewer, { partnerId: other.id }))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('lets staff read a company by id, needs the id, and hides other regions from staff sales', async () => {
    const india = await makePartner(db, { region: 'india' });
    const gulf = await makePartner(db, { region: 'middle_east' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    expect((await withViewer(manager, (tx) => getCompany(tx, manager, { partnerId: gulf.id }))).partnerId).toBe(gulf.id);
    await expect(withViewer(manager, (tx) => getCompany(tx, manager, {}))).rejects.toMatchObject({ code: 'validation' });
    const sales = await asStaff(db, 'sales', 'india');
    expect((await withViewer(sales, (tx) => getCompany(tx, sales, { partnerId: india.id }))).partnerId).toBe(india.id);
    await expect(withViewer(sales, (tx) => getCompany(tx, sales, { partnerId: gulf.id }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('welcome checklist', () => {
  it('derives agreement, company, team and deal from data and stores kickoff and playbook', async () => {
    const partner = await makePartner(db, { status: 'onboarding' });
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const stepsOf = (c: Awaited<ReturnType<typeof getChecklist>>) => Object.fromEntries(c.steps.map((s) => [s.step, s.done]));

    let checklist = await withViewer(viewer, (tx) => getChecklist(tx, viewer));
    expect(checklist.steps.map((s) => s.step)).toEqual(['agreement', 'company', 'team', 'kickoff', 'playbook', 'deal']);
    expect(stepsOf(checklist)).toEqual({ agreement: false, company: false, team: false, kickoff: false, playbook: false, deal: false });
    expect(checklist.percent).toBe(0);

    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-11-12T09:00:00Z'), agreementVersion: 'draft-0', website: 'x.example', about: 'We sell.' }).where(eq(partners.id, partner.id));
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'new@example.com', expiresAt: new Date('2026-11-19T00:00:00Z') });
    await makeRegistration(db, { partnerId: partner.id });
    checklist = await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, clock));
    expect(stepsOf(checklist)).toEqual({ agreement: true, company: true, team: true, kickoff: true, playbook: false, deal: true });
    expect(checklist.steps.find((s) => s.step === 'agreement')?.doneAt).toBe('2026-11-12T09:00:00.000Z');
    expect(checklist.percent).toBe(83);
  });

  it('ticks a stored step once and refuses a derived step', async () => {
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'playbook' }, clock));
    const again = await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'playbook' }, fixedClock('2026-11-13T10:00:00Z')));
    expect(again.steps.find((s) => s.step === 'playbook')).toEqual({ step: 'playbook', done: true, doneAt: '2026-11-12T10:00:00.000Z' });
    await expect(withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'agreement' } as unknown as Parameters<typeof tickChecklistStep>[2], clock))).rejects.toMatchObject({ code: 'validation' });
  });

  it('is for partner viewers only', async () => {
    const staff = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(staff, (tx) => getChecklist(tx, staff))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('listPartnerAdminRecipients', () => {
  it('returns the active partner admins of that partner only', async () => {
    const a = await makePartner(db, {});
    const b = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: a.id, role: 'partner_admin', name: 'Aditi', email: 'aditi@a.example' });
    await makeUser(db, { partnerId: a.id, role: 'sales' });
    await makeUser(db, { partnerId: a.id, role: 'partner_admin', status: 'disabled' });
    await makeUser(db, { partnerId: b.id, role: 'partner_admin' });
    const actor = publicActor('x');
    const rows = await withSystem(actor, (tx) => listPartnerAdminRecipients(tx, { partnerId: a.id }));
    expect(rows).toEqual([{ userId: admin.id, email: 'aditi@a.example', name: 'Aditi' }]);
  });
});

describe('updateCompanyProfile', () => {
  it('saves trimmed profile fields, blanks become null, and returns the company with the row time', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await withViewer(admin, (tx) =>
      updateCompanyProfile(tx, admin, { website: ' kestrelsystems.in ', phone: '+91 80 4718 2290', address: '  ', about: 'Security reseller.' }),
    );
    expect(result.company).toMatchObject({ name: 'Kestrel Systems', website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: null, about: 'Security reseller.' });
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(result.updatedAt).toBe(row?.updatedAt.toISOString());
  });

  it('never changes the name, category, region or status', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', category: 'channel', region: 'india', status: 'active' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await withViewer(admin, (tx) => updateCompanyProfile(tx, admin, { website: 'x.example', phone: null, address: null, about: null }));
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(row).toMatchObject({ name: 'Kestrel Systems', category: 'channel', region: 'india', status: 'active' });
  });

  it('is limited to the viewer company for a partner and open to a partner manager by id', async () => {
    const mine = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: mine.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => updateCompanyProfile(tx, admin, { partnerId: other.id, website: 'evil.example', phone: null, address: null, about: null }))).rejects.toMatchObject({ code: 'not_found' });
    const [untouched] = await db.select().from(partners).where(eq(partners.id, other.id));
    expect(untouched?.website).toBeNull();
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => updateCompanyProfile(tx, manager, { partnerId: other.id, website: 'ok.example', phone: null, address: null, about: null }));
    expect(result.company.website).toBe('ok.example');
  });
});
