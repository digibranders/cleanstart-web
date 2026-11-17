import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners, registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  createRegistrations,
  customerSuggestions,
  getRegistration,
  listRegistrations,
  type NewRegistrationsInput,
  resubmitRegistration,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const input = (over: Partial<NewRegistrationsInput> = {}): NewRegistrationsInput => ({
  customer: 'Vardhan Capital',
  website: 'https://www.VardhanCapital.in/about',
  products: ['libraries'],
  region: 'india',
  managerId: null,
  contact: { name: 'Rohan Mehta', role: 'Head of Security', email: 'rohan.mehta@vardhancapital.in', phone: '+91 98204 31786' },
  expectedClose: 'March 2027',
  notes: 'Q1 audit',
  ...over,
});

describe('createRegistrations', () => {
  it('creates one pending registration per product, routed to the manager of the region, and activates an onboarding partner', async () => {
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    await asStaff(db, 'partner_manager', 'middle_east');
    const partner = await makePartner(db, { status: 'onboarding', region: 'india' });
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });

    const created = await withViewer(viewer, (tx) =>
      createRegistrations(tx, viewer, input({ products: ['libraries', 'cleansight'] }), clock),
    );

    expect(created.map((r) => r.product).sort()).toEqual(['cleansight', 'libraries']);
    for (const r of created) {
      expect(r).toMatchObject({
        status: 'pending',
        stage: 'Awaiting review',
        registeredOn: '2026-11-06',
        managerId: gaurav.id,
        registeredByName: viewer.name,
        customer: 'Vardhan Capital',
        website: 'vardhancapital.in',
        partnerId: partner.id,
      });
    }
    expect((await db.select().from(partners).where(eq(partners.id, partner.id)))[0]?.status).toBe('active');
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, created[0]!.id));
    expect(events.map((e) => [e.text, e.byLabel, e.source])).toEqual([['Registered', viewer.name, 'portal']]);
    const contacts = await db.select().from(registrationContacts).where(eq(registrationContacts.registrationId, created[0]!.id));
    expect(contacts.map((c) => [c.name, c.role, c.email])).toEqual([['Rohan Mehta', 'Head of Security', 'rohan.mehta@vardhancapital.in']]);
  });

  it('routes a Middle East deal to the Middle East manager and honours a chosen manager', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const omar = await asStaff(db, 'partner_manager', 'middle_east');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    const [routed] = await withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ region: 'middle_east' }), clock));
    expect(routed?.managerId).toBe(omar.id);
    const gaurav = await asStaff(db, 'partner_manager', 'india');
    const [chosen] = await withViewer(viewer, (tx) =>
      createRegistrations(tx, viewer, input({ customer: 'Gulfway Freight', managerId: gaurav.id }), clock),
    );
    expect(chosen?.managerId).toBe(gaurav.id);
  });

  it('refuses a manager that is not offered to partners', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const marketing = await asStaff(db, 'marketing', 'all');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ managerId: marketing.id }), clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('blocks a second open registration for the same customer and product, whatever the case', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await withViewer(viewer, (tx) => createRegistrations(tx, viewer, input(), clock));
    const again = withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ customer: 'vardhan capital' }), clock));
    await expect(again).rejects.toMatchObject({ reason: 'duplicate_registration' });
    await expect(again).rejects.toBeInstanceOf(ConflictError);
    // another product for the same customer is a different registration
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ products: ['images'] }), clock))).resolves.toHaveLength(1);
  });

  it('does not let a rejected registration block a new one', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await makeRegistration(db, { partnerId: viewer.partnerId, customerName: 'Vardhan Capital', product: 'libraries', status: 'rejected' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input(), clock))).resolves.toHaveLength(1);
  });

  it('refuses to register for another company and to register without a product or a name', async () => {
    const other = await makePartner(db, {});
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ partnerId: other.id }), clock))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ products: [] }), clock))).rejects.toBeInstanceOf(ValidationError);
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ customer: '   ' }), clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('lets a partner manager register on a partner\'s behalf', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, {});
    const [created] = await withViewer(manager, (tx) => createRegistrations(tx, manager, input({ partnerId: partner.id }), clock));
    expect(created).toMatchObject({ partnerId: partner.id, registeredByName: manager.name });
  });
});

describe('listRegistrations and getRegistration', () => {
  it('scopes by role: admin sees the company, sales only own deals, technical nothing, staff sales their region', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const technical = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    const mine = await makeRegistration(db, { partnerId: partner.id, customerName: 'Mine', registeredBy: sales.id, region: 'india' });
    const colleagues = await makeRegistration(db, { partnerId: partner.id, customerName: 'Colleague', registeredBy: admin.id, region: 'middle_east' });
    const elsewhere = await makeRegistration(db, { customerName: 'Another company', region: 'india' });

    const asAdmin = await withViewer(admin, (tx) => listRegistrations(tx, admin, {}));
    expect(asAdmin.map((r) => r.id).sort()).toEqual([mine.id, colleagues.id].sort());
    const asSales = await withViewer(sales, (tx) => listRegistrations(tx, sales, {}));
    expect(asSales.map((r) => r.id)).toEqual([mine.id]);
    await expect(withViewer(technical, (tx) => listRegistrations(tx, technical, {}))).rejects.toBeInstanceOf(ForbiddenError);
    const staffIndia = await asStaff(db, 'sales', 'india');
    const seenByStaff = await withViewer(staffIndia, (tx) => listRegistrations(tx, staffIndia, {}));
    expect(seenByStaff.map((r) => r.id).sort()).toEqual([mine.id, elsewhere.id].sort());
    const manager = await asStaff(db, 'partner_manager', 'all');
    expect(await withViewer(manager, (tx) => listRegistrations(tx, manager, {}))).toHaveLength(3);
  });

  it('filters by status, product and customer and returns newest first', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Alpha Bank', product: 'images', status: 'accepted' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Beta Bank', product: 'libraries', status: 'pending' });
    const accepted = await withViewer(admin, (tx) => listRegistrations(tx, admin, { status: ['accepted'] }));
    expect(accepted.map((r) => r.customer)).toEqual(['Alpha Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, { product: 'libraries' }))).map((r) => r.customer)).toEqual(['Beta Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, { q: 'alpha' }))).map((r) => r.customer)).toEqual(['Alpha Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, {}))).map((r) => r.customer)).toEqual(['Beta Bank', 'Alpha Bank']);
  });

  it('does not let a partner filter by another partner', async () => {
    const admin = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => listRegistrations(tx, admin, { partnerId: admin.partnerId }))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('answers not found for another company, for a colleague\'s deal seen by sales and for a malformed id', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const theirs = await makeRegistration(db, { partnerId: partner.id, registeredBy: admin.id });
    const foreign = await makeRegistration(db, {});
    await expect(withViewer(sales, (tx) => getRegistration(tx, sales, theirs.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => getRegistration(tx, admin, foreign.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => getRegistration(tx, admin, 'not-a-uuid'))).rejects.toBeInstanceOf(NotFoundError);
    const found = await withViewer(admin, (tx) => getRegistration(tx, admin, theirs.id));
    expect(found.id).toBe(theirs.id);
  });

  it('puts the newest contact first and the oldest message first', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await makeRegistration(db, { partnerId: partner.id, contacts: [{ name: 'First Contact', email: 'first@example.com' }] });
    await db.insert(registrationContacts).values({ registrationId: reg.id, name: 'Second Contact', email: 'second@example.com', createdAt: new Date(Date.now() + 5000) });
    const detail = await withViewer(admin, (tx) => getRegistration(tx, admin, reg.id));
    expect(detail.contacts.map((c) => c.name)).toEqual(['Second Contact', 'First Contact']);
  });
});

describe('resubmitRegistration', () => {
  it('moves a rejected registration back to review with the new contact', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    const detail = await withViewer(admin, (tx) =>
      resubmitRegistration(tx, admin, { id: reg.id, contact: { name: 'Priya Shetty', role: 'CISO', email: 'priya@example.com' }, note: 'Added the budget owner' }, clock),
    );
    expect(detail).toMatchObject({ status: 'pending', stage: 'Awaiting review', resubmittedOn: '2026-11-06', rejectionReason: null, decidedOn: null, decidedByLabel: null });
    expect(detail.contacts[0]).toMatchObject({ name: 'Priya Shetty', role: 'CISO', email: 'priya@example.com' });
    expect(detail.history[0]).toMatchObject({ text: 'Resubmitted: Added the budget owner', byLabel: admin.name, source: 'portal' });
  });

  it('uses the default text without a note and refuses a registration that is not rejected', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: 'A' });
    const pending = await makeRegistration(db, { partnerId: partner.id, status: 'pending', customerName: 'B' });
    const contact = { name: 'X', role: null, email: 'x@example.com' };
    const done = await withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: rejected.id, contact, note: null }, clock));
    expect(done.history[0]?.text).toBe('Resubmitted with a new contact');
    await expect(withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: pending.id, contact, note: null }, clock))).rejects.toMatchObject({ reason: 'not_rejected' });
  });

  it('is blocked when an open registration for the same customer and product exists', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: 'Same Co', product: 'images' });
    await makeRegistration(db, { partnerId: partner.id, status: 'pending', customerName: 'same co', product: 'images' });
    const contact = { name: 'X', role: null, email: 'x@example.com' };
    await expect(withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: rejected.id, contact, note: null }, clock))).rejects.toMatchObject({ reason: 'duplicate_registration' });
    expect((await db.select().from(registrations).where(eq(registrations.id, rejected.id)))[0]?.status).toBe('rejected');
  });
});

describe('customerSuggestions', () => {
  it('returns the company\'s own customers, oldest registration first, and nothing of another company', async () => {
    const partner = await makePartner(db, {});
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in', product: 'cleansight', status: 'accepted', registeredOn: '2026-10-14' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', product: 'libraries', status: 'pending', registeredOn: '2026-11-04' });
    await makeRegistration(db, { customerName: 'Vardhan Capital Rival' });
    const found = await withViewer(sales, (tx) => customerSuggestions(tx, sales, { q: 'vardhan' }));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ name: 'Vardhan Capital', website: 'vardhancapital.in' });
    expect(found[0]?.registrations.map((r) => r.product)).toEqual(['cleansight', 'libraries']);
  });

  it('is for partner users only', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(manager, (tx) => customerSuggestions(tx, manager, { q: 'x' }))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
