import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites, partners } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken } from '@/server/auth/tokens';
import { publicActor } from '@/server/auth/types';
import { withSystem, withViewer } from './context';
import {
  createPartner,
  getChecklist,
  getCompany,
  getPartnerDetail,
  listPartnerAdminRecipients,
  listPartners,
  resendPartnerInvites,
  restorePartner,
  setPartnerCategory,
  setPartnerManager,
  suspendPartner,
  tickChecklistStep,
  updateCompanyProfile,
} from './partners';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('getCompany', () => {
  it('returns the company with its manager, agreement and the not-assigned tier', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav', email: 'gaurav@cleanstart.com' });
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
      manager: { id: manager.id, name: 'Gaurav Jadhav', email: 'gaurav@cleanstart.com', team: 'CleanStart India' },
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

const today = new Date().toISOString().slice(0, 10);
const future = new Date('2099-01-01T00:00:00Z');

describe('listPartners', () => {
  it('lists every partner for a partner manager with the real counts and filters', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const a = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', region: 'india', category: 'channel', status: 'active' });
    const b = await makePartner(db, { name: 'Arbor Cyber', domain: 'arborcyber.ae', region: 'middle_east', category: 'channel', status: 'onboarding' });
    await makeUser(db, { partnerId: a.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: a.id, status: 'pending' });
    await makeRegistration(db, { partnerId: a.id, status: 'accepted' });
    await makeRegistration(db, { partnerId: a.id, status: 'won', registeredOn: today, closedOn: today });
    const all = await withViewer(manager, (tx) => listPartners(tx, manager, {}));
    expect(all.map((p) => p.name)).toEqual(['Arbor Cyber', 'Kestrel Systems']);
    expect(all.find((p) => p.id === a.id)).toMatchObject({ users: 1, pending: 1, protectedCount: 1, won: 1 });
    expect((await withViewer(manager, (tx) => listPartners(tx, manager, { status: 'onboarding' }))).map((p) => p.id)).toEqual([b.id]);
    expect((await withViewer(manager, (tx) => listPartners(tx, manager, { q: 'kestrel' }))).map((p) => p.id)).toEqual([a.id]);
  });

  it('shows staff sales only the partners in their region, and refuses partner viewers', async () => {
    await makePartner(db, { region: 'india' });
    const gulf = await makePartner(db, { region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'middle_east');
    expect((await withViewer(sales, (tx) => listPartners(tx, sales, {}))).map((p) => p.id)).toEqual([gulf.id]);
    const partner = await asPartner(db, {});
    await expect(withViewer(partner, (tx) => listPartners(tx, partner, {}))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('getPartnerDetail', () => {
  it('returns profile, people with invited ones, the open invite count and the five newest deals', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    await db.update(partners).set({ website: 'kestrelsystems.in', phone: '+91 80 4718 2290', about: 'Security reseller.' }).where(eq(partners.id, partner.id));
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    for (let n = 1; n <= 6; n += 1) {
      await makeRegistration(db, { partnerId: partner.id, customerName: `Customer ${n}`, product: 'cleansight', registeredOn: `2026-11-0${n}`, status: 'rejected' });
    }
    const detail = await withViewer(manager, (tx) => getPartnerDetail(tx, manager, partner.id));
    expect(detail).toMatchObject({ name: 'Kestrel Systems', website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: null, about: 'Security reseller.', openInvites: 1 });
    expect(detail.people.map((p) => [p.name, p.status, p.role])).toEqual([['Aditi Rao', 'active', 'partner_admin'], ['Vikram Sethi', 'invited', 'sales']]);
    expect(detail.recentDeals.map((d) => d.customer)).toEqual(['Customer 6', 'Customer 5', 'Customer 4', 'Customer 3', 'Customer 2']);
    expect(detail.recentDeals[0]).toMatchObject({ product: 'cleansight', registeredOn: '2026-11-06', status: 'rejected' });
  });

  it('hides a partner outside the region of staff sales and an unknown id', async () => {
    const gulf = await makePartner(db, { region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'india');
    await expect(withViewer(sales, (tx) => getPartnerDetail(tx, sales, gulf.id))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(sales, (tx) => getPartnerDetail(tx, sales, '00000000-0000-0000-0000-000000000001'))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('createPartner', () => {
  const base = { name: 'Dunes Networks', website: 'https://www.dunesnetworks.ae', category: 'channel' as const, region: 'middle_east' as const, adminName: 'Faisal Rahman', adminEmail: 'faisal@dunesnetworks.ae', sendInvite: true };

  it('creates an onboarding partner routed to the regional manager with a partner admin invite', async () => {
    const gulf = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => createPartner(tx, manager, base, clock));
    expect(result.partner).toMatchObject({ name: 'Dunes Networks', domain: 'dunesnetworks.ae', status: 'onboarding', managerId: gulf.id, users: 1, adminName: 'Faisal' });
    expect(result.invite?.invite).toMatchObject({ role: 'partner_admin', email: 'faisal@dunesnetworks.ae', kind: 'partner' });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite?.invite.id ?? ''));
    expect(row?.tokenHash).toBe(hashToken(result.invite?.token ?? ''));
  });

  it('records the admin invite even when it is not sent yet, but returns no token', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => createPartner(tx, manager, { ...base, sendInvite: false }, clock));
    expect(result.invite).toBeNull();
    expect(await db.select().from(invites)).toHaveLength(1);
    expect(result.partner.users).toBe(1);
  });

  it('falls back to the admin email domain, and refuses a taken domain, a login that exists and bad input', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const viaEmail = await withViewer(manager, (tx) => createPartner(tx, manager, { ...base, website: '' }, clock));
    expect(viaEmail.partner.domain).toBe('dunesnetworks.ae');
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: 'Copy' }, clock))).rejects.toMatchObject({ reason: 'domain_is_partner' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: 'Other', website: 'other.example', adminEmail: manager.email }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: '  ', website: 'x.example' }, clock))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, website: 'x.example', adminEmail: 'nope' }, clock))).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('partner mutations', () => {
  it('sets the partner manager and reports the previous one', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const gaurav = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Gaurav Jadhav' });
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { managerId: gaurav.id });
    const result = await withViewer(actor, (tx) => setPartnerManager(tx, actor, { id: partner.id, managerId: omar.id }, clock));
    expect(result).toMatchObject({ partner: { managerId: omar.id, managerName: 'Omar Nasser' }, previousManagerName: 'Gaurav Jadhav' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(withViewer(actor, (tx) => setPartnerManager(tx, actor, { id: partner.id, managerId: sales.id }, clock))).rejects.toMatchObject({ code: 'validation' });
  });

  it('changes the category and reports the previous one', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { category: 'channel' });
    const result = await withViewer(actor, (tx) => setPartnerCategory(tx, actor, { id: partner.id, category: 'distributor' }, clock));
    expect(result).toMatchObject({ partner: { category: 'distributor' }, previousCategory: 'channel' });
  });

  it('suspends and restores, putting the earlier status back, and both are idempotent', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { status: 'onboarding' });
    const suspended = await withViewer(actor, (tx) => suspendPartner(tx, actor, { id: partner.id }, clock));
    expect(suspended).toMatchObject({ status: 'suspended', statusBeforeSuspend: 'onboarding' });
    expect((await withViewer(actor, (tx) => suspendPartner(tx, actor, { id: partner.id }, clock))).statusBeforeSuspend).toBe('onboarding');
    const restored = await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock));
    expect(restored).toMatchObject({ status: 'onboarding', statusBeforeSuspend: null });
    expect((await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock))).status).toBe('onboarding');
  });

  it('restores to active when no earlier status was recorded', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { status: 'suspended' });
    expect((await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock))).status).toBe('active');
  });

  it('is not allowed for partner viewers', async () => {
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => suspendPartner(tx, viewer, { id: partner.id }, clock))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(withViewer(viewer, (tx) => setPartnerCategory(tx, viewer, { id: partner.id, category: 'distributor' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('resendPartnerInvites', () => {
  it('rotates every open invite of the partner and returns the new tokens once', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { name: 'Qamar Solutions' });
    const first = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'yasmin.haddad@qamarsolutions.ae', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid.omar@qamarsolutions.ae', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'done@qamarsolutions.ae', expiresAt: future, acceptedAt: new Date('2026-11-01T00:00:00Z') });
    const result = await withViewer(actor, (tx) => resendPartnerInvites(tx, actor, { id: partner.id }, clock));
    expect(result.partner.name).toBe('Qamar Solutions');
    expect(result.invites.map((i) => [i.invite.email, i.inviteeName]).sort()).toEqual([['yasmin.haddad@qamarsolutions.ae', 'Yasmin Haddad'], ['zaid.omar@qamarsolutions.ae', 'Zaid Omar']]);
    const rotated = result.invites.find((i) => i.invite.id === first.invite.id);
    expect(rotated?.token).not.toBe(first.token);
    expect(rotated?.invite.resentCount).toBe(1);
  });

  it('refuses to email fresh links for a suspended partner and leaves the invites as they were', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { status: 'suspended' });
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 's@s.example', expiresAt: future });
    await expect(withViewer(actor, (tx) => resendPartnerInvites(tx, actor, { id: partner.id }, clock))).rejects.toMatchObject({ reason: 'partner_suspended' });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.tokenHash).toBe(hashToken(token));
    expect(row?.resentCount).toBe(0);
  });

  it('returns nothing when everyone has accepted', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    expect((await withViewer(actor, (tx) => resendPartnerInvites(tx, actor, { id: partner.id }, clock))).invites).toEqual([]);
  });
});
