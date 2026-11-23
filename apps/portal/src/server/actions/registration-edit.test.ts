import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));

import { auditLog, hubspotOutbox, notifications, registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import {
  addRegistrationContactAction,
  editRegistrationAction,
  removeRegistrationContactAction,
  updateRegistrationContactAction,
} from './registration-edit';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  session.viewer = null;
});

const contactsOf = (id: string) => db.select().from(registrationContacts).where(eq(registrationContacts.registrationId, id));
const rowOf = async (id: string) => (await db.select().from(registrations).where(eq(registrations.id, id)))[0];

async function pending(over: { managerId?: string; registeredBy?: string; partnerId?: string; customerName?: string; product?: 'images' | 'libraries' | 'cleansight' } = {}) {
  const partner = over.partnerId ? { id: over.partnerId } : await makePartner(db, {});
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id,
    status: 'pending',
    registeredBy: over.registeredBy ?? admin.id,
    ...(over.managerId ? { managerId: over.managerId } : {}),
    ...(over.customerName ? { customerName: over.customerName } : {}),
    ...(over.product ? { product: over.product } : {}),
    contacts: [{ name: 'Rohan Mehta', email: 'rohan@vardhan.in' }],
  });
  return { partner, admin, reg };
}

describe('editRegistrationAction', () => {
  it('changes only what was sent, audits before and after, notifies the manager and writes a history line', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { admin, reg } = await pending({ managerId: manager.id });
    session.viewer = admin;
    const result = await editRegistrationAction({ id: reg.id, fields: { customer: 'Vardhan Capital Ltd', seats: 120, notes: '  Budget approved ', competitor: '' } });
    expect(result.ok).toBe(true);
    const row = await rowOf(reg.id);
    expect(row).toMatchObject({ customerName: 'Vardhan Capital Ltd', seats: 120, notes: 'Budget approved', status: 'pending' });
    expect(row?.useCase).toBe(reg.useCase);
    const [entry] = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.edited'));
    expect(entry?.before).toContain('Customer: ');
    expect(entry?.after).toContain('Customer: Vardhan Capital Ltd');
    expect(entry?.after).toContain('Seats: 120');
    expect(await db.select().from(notifications).where(eq(notifications.userId, manager.id))).toHaveLength(1);
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, reg.id));
    expect(events.some((e) => e.text.startsWith('Edited by the partner: customer'))).toBe(true);
  });

  it('writes nothing when no value really changes', async () => {
    const { admin, reg } = await pending();
    session.viewer = admin;
    const result = await editRegistrationAction({ id: reg.id, fields: { customer: reg.customerName } });
    expect(result.ok).toBe(true);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.edited'))).toHaveLength(0);
  });

  it('sends nothing to the CRM for a pending edit', async () => {
    const { admin, reg } = await pending();
    session.viewer = admin;
    await editRegistrationAction({ id: reg.id, fields: { notes: 'x' } });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('refuses once the registration is accepted, with the manager hint', async () => {
    const { admin, partner } = await pending();
    const accepted = await makeRegistration(db, { partnerId: partner.id, status: 'accepted', registeredBy: admin.id });
    session.viewer = admin;
    const result = await editRegistrationAction({ id: accepted.id, fields: { notes: 'x' } });
    expect(result).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(!result.ok && result.error.message).toContain('partner manager');
    expect((await rowOf(accepted.id))?.notes).toBe(accepted.notes);
  });

  it('refuses a rename that clashes with another open registration of the same product, case insensitively', async () => {
    const { admin, partner } = await pending({ customerName: 'Alpha Bank', product: 'images' });
    const other = await makeRegistration(db, { partnerId: partner.id, status: 'pending', registeredBy: admin.id, customerName: 'Beta Bank', product: 'images' });
    session.viewer = admin;
    expect(await editRegistrationAction({ id: other.id, fields: { customer: 'ALPHA BANK' } })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect((await rowOf(other.id))?.customerName).toBe('Beta Bank');
  });

  it('allows a rename onto a customer that only has a different product, or a closed registration', async () => {
    const { admin, partner } = await pending({ customerName: 'Alpha Bank', product: 'libraries' });
    await makeRegistration(db, { partnerId: partner.id, status: 'lost', registeredBy: admin.id, customerName: 'Gamma Bank', product: 'images' });
    const other = await makeRegistration(db, { partnerId: partner.id, status: 'pending', registeredBy: admin.id, customerName: 'Beta Bank', product: 'images' });
    session.viewer = admin;
    expect((await editRegistrationAction({ id: other.id, fields: { customer: 'Alpha Bank' } })).ok).toBe(true);
    expect((await editRegistrationAction({ id: other.id, fields: { customer: 'Gamma Bank' } })).ok).toBe(true);
  });

  it('is limited to the company, and a sales user to their own deals; staff cannot edit', async () => {
    const { partner, admin, reg } = await pending();
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    session.viewer = sales;
    expect(await editRegistrationAction({ id: reg.id, fields: { notes: 'x' } })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    const mine = await makeRegistration(db, { partnerId: partner.id, registeredBy: sales.id });
    expect((await editRegistrationAction({ id: mine.id, fields: { notes: 'mine' } })).ok).toBe(true);
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await editRegistrationAction({ id: reg.id, fields: { notes: 'x' } })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    session.viewer = await asStaff(db, 'partner_manager');
    expect(await editRegistrationAction({ id: reg.id, fields: { notes: 'x' } })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await editRegistrationAction({ id: mine.id, fields: { notes: 'x' } })).toMatchObject({ ok: false });
    expect(admin.partnerId).toBe(partner.id);
  });

  it('validates like the create form', async () => {
    const { admin, reg } = await pending();
    session.viewer = admin;
    for (const fields of [{ customer: ' ' }, { website: 'not a site' }, { seats: -1 }, { dealValue: 1e13 }, { decisionDate: '2026-02-31' }, { currency: 'XXX' }]) {
      expect(await editRegistrationAction({ id: reg.id, fields }), JSON.stringify(fields)).toMatchObject({ ok: false, error: { code: 'validation' } });
    }
  });
});

describe('contact actions', () => {
  it('adds a contact behind the primary one and audits it', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { admin, reg } = await pending({ managerId: manager.id });
    session.viewer = admin;
    const result = await addRegistrationContactAction({ id: reg.id, contact: { name: 'Priya Shetty', role: 'CISO', email: 'priya@vardhan.in', phone: '' } });
    expect(result.ok && result.data.contacts.map((c) => c.name)).toEqual(['Rohan Mehta', 'Priya Shetty']);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.edited'))).toHaveLength(1);
    expect(await db.select().from(notifications).where(eq(notifications.userId, manager.id))).toHaveLength(1);
  });

  it('updates and removes a contact, and refuses to leave the registration without an email or phone', async () => {
    const { admin, reg } = await pending();
    session.viewer = admin;
    const [only] = await contactsOf(reg.id);
    const noReach = { name: 'Rohan', role: null, email: '', phone: '' };
    expect(await updateRegistrationContactAction({ id: reg.id, contactId: only!.id, contact: noReach })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await removeRegistrationContactAction({ id: reg.id, contactId: only!.id })).toMatchObject({ ok: false, error: { code: 'validation' } });

    const added = await addRegistrationContactAction({ id: reg.id, contact: { name: 'Name Only', role: null, email: '', phone: '' } });
    expect(added.ok).toBe(true);
    const nameOnly = (await contactsOf(reg.id)).find((c) => c.name === 'Name Only')!;
    expect((await updateRegistrationContactAction({ id: reg.id, contactId: nameOnly.id, contact: { name: 'Name Only', role: 'CTO', email: '', phone: '+91 98765 43210' } })).ok).toBe(true);
    expect((await removeRegistrationContactAction({ id: reg.id, contactId: only!.id })).ok).toBe(true);
    expect(await removeRegistrationContactAction({ id: reg.id, contactId: nameOnly.id })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await contactsOf(reg.id)).toHaveLength(1);
  });

  it('refuses after acceptance, for a contact of another registration, and for another company', async () => {
    const { admin, partner, reg } = await pending();
    const accepted = await makeRegistration(db, { partnerId: partner.id, status: 'accepted', registeredBy: admin.id, contacts: [{ name: 'A', email: 'a@x.in' }] });
    const [acceptedContact] = await contactsOf(accepted.id);
    session.viewer = admin;
    expect(await removeRegistrationContactAction({ id: accepted.id, contactId: acceptedContact!.id })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await addRegistrationContactAction({ id: accepted.id, contact: { name: 'B', role: null, email: 'b@x.in', phone: null } })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await removeRegistrationContactAction({ id: reg.id, contactId: acceptedContact!.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await addRegistrationContactAction({ id: reg.id, contact: { name: 'B', role: null, email: 'b@x.in', phone: null } })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
