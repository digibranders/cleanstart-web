import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { applications, auditLog, invites, notifications, partners } from '@/db/schema';
import { asPartner, asStaff, makeApplication, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken, INVITE_TTL_DAYS } from '@/server/auth/tokens';
import { SYSTEM_ACTORS, publicActor } from '@/server/auth/types';
import { type Tx, withSystem, withViewer } from './context';
import {
  approveApplication,
  countNewApplications,
  createPortalApplication,
  declineApplication,
  findPartnerByDomain,
  getApplication,
  insertWebsiteApplication,
  listApplications,
  listManagerRecipients,
  type NewApplicationRecord,
  reopenApplication,
} from './applications';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Neha Joshi');

const record = (overrides: Partial<NewApplicationRecord> = {}): NewApplicationRecord => ({
  company: 'Tidewater Infosec',
  domain: 'tidewaterinfosec.in',
  applicantName: 'Neha Joshi',
  email: 'neha.joshi@tidewaterinfosec.in',
  role: 'CTO',
  phone: '+91 98200 41377',
  category: 'channel',
  region: 'india',
  reason: 'We resell security tooling.',
  source: 'portal',
  sourceRef: null,
  personalEmail: false,
  existingDomain: false,
  ...overrides,
});

const create = (input: NewApplicationRecord) => withSystem(actor, (tx) => createPortalApplication(tx, actor, input, clock));

beforeEach(async () => {
  await resetDb(db);
});

describe('createPortalApplication', () => {
  it('creates an application with an APP-YYMM-NNNN reference in status new', async () => {
    const { application, merged } = await create(record());
    expect(merged).toBe(false);
    expect(application.reference).toBe('APP-2611-0001');
    expect(application.status).toBe('new');
    expect(application.source).toBe('portal');
    expect(application.submittedAt).toBe('2026-11-12T10:00:00.000Z');
    const second = await create(record({ email: 'other@falconridge.ae', company: 'Falcon Ridge IT', domain: 'falconridge.ae' }));
    expect(second.application.reference).toBe('APP-2611-0002');
  });

  it('merges a second submission from the same email into the open application', async () => {
    const first = await create(record());
    const second = await create(record({ email: 'neha.joshi@tidewaterinfosec.in', company: 'Tidewater Infosec Pvt Ltd', reason: 'Updated reason.' }));
    expect(second.merged).toBe(true);
    expect(second.application.id).toBe(first.application.id);
    expect(second.application.reference).toBe(first.application.reference);
    expect(second.application.company).toBe('Tidewater Infosec Pvt Ltd');
    expect(second.application.reason).toBe('Updated reason.');
    expect(await db.select().from(applications)).toHaveLength(1);
  });

  it('does not merge into a decided application', async () => {
    await makeApplication(db, { email: 'neha.joshi@tidewaterinfosec.in', source: 'portal', status: 'approved' });
    const { merged } = await create(record());
    expect(merged).toBe(false);
    expect(await db.select().from(applications)).toHaveLength(2);
  });
});

describe('findPartnerByDomain', () => {
  it('returns only id and name, ignoring case, and null when no partner owns the domain', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const found = await withSystem(actor, (tx) => findPartnerByDomain(tx, actor, 'KestrelSystems.in'));
    expect(found).toEqual({ id: partner.id, name: 'Kestrel Systems' });
    expect(await withSystem(actor, (tx) => findPartnerByDomain(tx, actor, 'unknown.example'))).toBeNull();
  });
});

describe('listManagerRecipients', () => {
  it('lists active partner managers only', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'active', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'disabled', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'sales', status: 'active', region: 'india' });
    const partner = await makePartner(db, {});
    await makeUser(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin' });
    const recipients = await withSystem(actor, (tx) => listManagerRecipients(tx, actor));
    expect(recipients.map((r) => r.userId)).toEqual([manager.id]);
  });
});

const intake = SYSTEM_ACTORS.intake;
const websiteRecord = (overrides: Partial<NewApplicationRecord> = {}): NewApplicationRecord => ({
  company: 'Falcon Ridge IT',
  domain: 'falconridge.ae',
  applicantName: 'Sameer Al Harthy',
  email: 'sameer@falconridge.ae',
  role: null,
  phone: null,
  category: null,
  region: null,
  reason: 'Value-added distributor.',
  source: 'website',
  sourceRef: 'cms-17',
  personalEmail: false,
  existingDomain: false,
  submittedAt: new Date('2026-10-30T08:15:00Z'),
  ...overrides,
});
const insertWebsite = (input: NewApplicationRecord) =>
  withSystem(intake, (tx) => insertWebsiteApplication(tx, intake, input, clock));

describe('insertWebsiteApplication', () => {
  it('inserts once per (source, source_ref), keeps the CMS time and reads the reference month from it', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: true });
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: false });
    const rows = await db.select().from(applications);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: 'website',
      sourceRef: 'cms-17',
      status: 'new',
      category: null,
      region: null,
      reference: 'APP-2610-0001',
    });
    expect(rows[0]?.createdAt.toISOString()).toBe('2026-10-30T08:15:00.000Z');
    const audit = await db.select().from(auditLog);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event: 'application.submitted', note: 'Website form', who: 'sync', source: 'system' });
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[manager.id, 'application_new']]);
  });

  it('stores the personal email and existing domain flags as given', async () => {
    await insertWebsite(websiteRecord({ personalEmail: true, existingDomain: true }));
    const [row] = await db.select().from(applications);
    expect(row).toMatchObject({ personalEmail: true, existingDomain: true });
  });

  it('refuses a website entry without a source ref', async () => {
    await expect(insertWebsite(websiteRecord({ sourceRef: null }))).rejects.toMatchObject({ code: 'validation' });
  });

  it('does not collide with a portal application from the same email', async () => {
    await create(record({ email: 'sameer@falconridge.ae' }));
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: true });
    expect(await db.select().from(applications)).toHaveLength(2);
  });
});

const asManager = async () => asStaff(db, 'partner_manager', 'india');
const approve = async (input: Parameters<typeof approveApplication>[2]) => {
  const viewer = await asManager();
  return withViewer(viewer, (tx) => approveApplication(tx, viewer, input, clock));
};

describe('listApplications and friends (staff only)', () => {
  it('lists newest first, filters by status and searches company, domain, applicant and email', async () => {
    const viewer = await asManager();
    const older = await makeApplication(db, { company: 'Old Co', domain: 'old.example', applicantName: 'Olga', email: 'olga@old.example', source: 'portal', createdAt: new Date('2026-11-01T00:00:00Z') });
    const newer = await makeApplication(db, { company: 'New Co', domain: 'new.example', applicantName: 'Nick', email: 'nick@new.example', source: 'portal', createdAt: new Date('2026-11-05T00:00:00Z') });
    await makeApplication(db, { company: 'Done Co', domain: 'done.example', email: 'd@done.example', source: 'portal', status: 'declined' });
    const run = <T>(fn: (tx: Tx) => Promise<T>) => withViewer(viewer, fn);
    expect((await run((tx) => listApplications(tx, viewer, { status: 'new' }))).map((a) => a.id)).toEqual([newer.id, older.id]);
    expect((await run((tx) => listApplications(tx, viewer, { q: 'OLGA' }))).map((a) => a.id)).toEqual([older.id]);
    expect((await run((tx) => listApplications(tx, viewer, { q: 'new.example' }))).map((a) => a.id)).toEqual([newer.id]);
    expect(await run((tx) => countNewApplications(tx, viewer))).toBe(2);
    expect((await run((tx) => getApplication(tx, viewer, older.id))).company).toBe('Old Co');
    await expect(run((tx) => getApplication(tx, viewer, '00000000-0000-0000-0000-000000000001'))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('refuses a partner viewer before touching data', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => listApplications(tx, viewer, {}))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(withViewer(viewer, (tx) => countNewApplications(tx, viewer))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('approveApplication', () => {
  it('creates an onboarding partner routed to the regional manager and a partner admin invite', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const app = await makeApplication(db, { company: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', applicantName: 'Neha Joshi', email: 'neha.joshi@tidewaterinfosec.in', source: 'portal' });
    const result = await approve({ id: app.id, category: 'channel', region: 'india' });
    expect(result.application).toMatchObject({ status: 'approved', category: 'channel', region: 'india', declineReason: null });
    expect(result.partner).toMatchObject({ name: 'Tidewater Infosec', status: 'onboarding', managerId: india.id, managerName: 'Farhan Qureshi', adminName: 'Neha Joshi', users: 1, agreementAcceptedAt: null });
    expect(result.application.partnerId).toBe(result.partner.id);
    expect(result.invite.invite).toMatchObject({ kind: 'partner', role: 'partner_admin', email: 'neha.joshi@tidewaterinfosec.in', state: 'ok' });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite.invite.id));
    expect(row?.tokenHash).toBe(hashToken(result.invite.token));
    expect(row?.expiresAt.getTime()).toBe(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000);
  });

  it('takes the region from the manager when a website entry has none', async () => {
    const me = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    const app = await makeApplication(db, { company: 'Falcon Ridge IT', domain: 'falconridge.ae', email: 'sameer@falconridge.ae', source: 'website', sourceRef: 'cms-1', category: null, region: null });
    const result = await approve({ id: app.id, category: 'distributor', region: 'middle_east' });
    expect(result.partner).toMatchObject({ category: 'distributor', region: 'middle_east', managerId: me.id });
  });

  it('honours an explicit manager and rejects one who is not an active partner manager', async () => {
    const chosen = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const a = await makeApplication(db, { domain: 'a.example', email: 'a@a.example', source: 'portal' });
    const b = await makeApplication(db, { domain: 'b.example', email: 'b@b.example', source: 'portal' });
    expect((await approve({ id: a.id, category: 'channel', region: 'india', managerId: chosen.id })).partner.managerId).toBe(chosen.id);
    await expect(approve({ id: b.id, category: 'channel', region: 'india', managerId: sales.id })).rejects.toMatchObject({ code: 'validation' });
  });

  it('refuses a domain another partner owns and an application that is not open', async () => {
    await makePartner(db, { domain: 'taken.example' });
    const dup = await makeApplication(db, { domain: 'taken.example', email: 'x@taken.example', source: 'portal' });
    await expect(approve({ id: dup.id, category: 'channel', region: 'india' })).rejects.toMatchObject({ reason: 'domain_is_partner' });
    const decided = await makeApplication(db, { domain: 'y.example', email: 'y@y.example', source: 'portal', status: 'declined' });
    await expect(approve({ id: decided.id, category: 'channel', region: 'india' })).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});

describe('declineApplication', () => {
  it('needs a reason and only works on an open application', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'd.example', email: 'd@d.example', source: 'portal' });
    await expect(withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: '   ' }, clock))).rejects.toMatchObject({ code: 'validation' });
    const declined = await withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: ' We already cover this region. ' }, clock));
    expect(declined).toMatchObject({ status: 'declined', declineReason: 'We already cover this region.', decidedAt: '2026-11-12T10:00:00.000Z' });
    await expect(withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: 'again' }, clock))).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});

describe('reopenApplication', () => {
  it('undoes a decline', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'r.example', email: 'r@r.example', source: 'portal', status: 'declined', declineReason: 'No' });
    const reopened = await withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock));
    expect(reopened).toMatchObject({ status: 'new', declineReason: null, decidedAt: null });
  });

  it('undoes an approval: revokes the invite, parks the partner as inactive, keeps the link, and a second approval reuses the partner', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const viewer = await asManager();
    const app = await makeApplication(db, { company: 'Reuse Co', domain: 'reuse.example', email: 'a@reuse.example', source: 'portal' });
    const first = await approve({ id: app.id, category: 'channel', region: 'india' });
    const reopened = await withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock));
    expect(reopened).toMatchObject({ status: 'new', partnerId: first.partner.id });
    const [partner] = await db.select().from(partners).where(eq(partners.id, first.partner.id));
    expect(partner?.status).toBe('inactive');
    const [invite] = await db.select().from(invites).where(eq(invites.id, first.invite.invite.id));
    expect(invite?.revokedAt).not.toBeNull();
    const second = await approve({ id: app.id, category: 'distributor', region: 'india' });
    expect(second.partner).toMatchObject({ id: first.partner.id, status: 'onboarding', category: 'distributor' });
    expect(await db.select().from(partners)).toHaveLength(1);
    expect(second.invite.invite.id).not.toBe(first.invite.invite.id);
  });

  it('refuses to undo once the partner has accepted the agreement', async () => {
    const viewer = await asManager();
    const partner = await makePartner(db, { domain: 'signed.example', status: 'onboarding' });
    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-11-10T00:00:00Z'), agreementVersion: 'draft-0' }).where(eq(partners.id, partner.id));
    const app = await makeApplication(db, { domain: 'signed.example', email: 's@signed.example', source: 'portal', status: 'approved', partnerId: partner.id });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock))).rejects.toMatchObject({ reason: 'partner_not_reopenable' });
  });

  it('refuses to undo once a person has a login for the partner, even before the agreement is accepted', async () => {
    const viewer = await asManager();
    const partner = await makePartner(db, { domain: 'people.example', status: 'onboarding' });
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin', status: 'active' });
    const app = await makeApplication(db, { domain: 'people.example', email: 'p@people.example', source: 'portal', status: 'approved', partnerId: partner.id });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock))).rejects.toMatchObject({
      reason: 'partner_not_reopenable',
      safeMessage: 'The partner already has people signed in, so the approval cannot be undone.',
    });
    expect((await db.select().from(partners).where(eq(partners.id, partner.id)))[0]?.status).toBe('onboarding');
  });

  it('refuses to undo once an invite was accepted, and still allows it when only disabled users exist', async () => {
    const viewer = await asManager();
    const accepted = await makePartner(db, { domain: 'accepted.example', status: 'onboarding' });
    await makeInvite(db, { kind: 'partner', partnerId: accepted.id, role: 'partner_admin', email: 'a@accepted.example', acceptedAt: new Date('2026-11-10T00:00:00Z') });
    const first = await makeApplication(db, { domain: 'accepted.example', email: 'a@accepted.example', source: 'portal', status: 'approved', partnerId: accepted.id });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: first.id }, clock))).rejects.toMatchObject({ reason: 'partner_not_reopenable' });
    const quiet = await makePartner(db, { domain: 'quiet.example', status: 'onboarding' });
    await makeUser(db, { partnerId: quiet.id, role: 'partner_admin', status: 'disabled' });
    const second = await makeApplication(db, { domain: 'quiet.example', email: 'q@quiet.example', source: 'portal', status: 'approved', partnerId: quiet.id });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: second.id }, clock))).resolves.toMatchObject({ status: 'new' });
  });

  it('refuses an application that is already open', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'o.example', email: 'o@o.example', source: 'portal' });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock))).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});
