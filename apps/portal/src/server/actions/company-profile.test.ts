import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox, partners } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import { FakeFileStorage } from '@/server/files/fake';
import type { FileStorage } from '@/server/files/storage';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, storage: null as unknown as import('@/server/files/fake').FakeFileStorage }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-portal-client-ip': '198.51.100.1' }), cookies: async () => ({ set: () => undefined, get: () => undefined }) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', async () => {
  const { UnauthenticatedError } = await import('@/server/errors');
  return {
    requireActionViewer: async () => {
      if (!harness.viewer) throw new UnauthenticatedError();
      return harness.viewer;
    },
  };
});
vi.mock('@/server/files/instance', () => ({ getFileStorage: () => harness.storage }));

import { confirmLogoAction, createLogoTicketAction, removeLogoAction, updateCompanyDetailsAction } from './company-profile';

const db = testDb();
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0];
const details = {
  legalName: 'Kestrel Systems Pvt Ltd',
  taxId: '29ABCDE1234F1Z5',
  hqCountry: 'India',
  headcountBand: '51-200',
  billingContactName: 'Meera Rao',
  billingContactEmail: 'Billing@KestrelSystems.in',
  supportContactName: '',
  supportContactEmail: '',
};

beforeEach(async () => {
  await resetDb(db);
  harness.viewer = null;
  const storage = new FakeFileStorage();
  const withPeek: FileStorage = Object.assign(storage, { peek: async (key: string, length: number) => (storage.heads.get(key) ?? []).slice(0, length) });
  harness.storage = withPeek as FakeFileStorage;
});

describe('updateCompanyDetailsAction', () => {
  it('lets a partner admin save, stores the country as a code and the email in lower case, and audits the changed fields', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await updateCompanyDetailsAction(details);
    expect(result).toMatchObject({ ok: true, data: { legalName: 'Kestrel Systems Pvt Ltd', hqCountry: 'IN', headcountBand: '51-200', billingContactEmail: 'billing@kestrelsystems.in', supportContactEmail: null } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'partner.details_updated', note: 'Updated legal name, tax ID, HQ country, headcount, billing contact name, billing contact email' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('writes no audit entry when nothing changed', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await updateCompanyDetailsAction(details);
    await updateCompanyDetailsAction(details);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });

  it('refuses a member who is not the partner admin, and leaves the row alone', async () => {
    const partner = await makePartner(db, {});
    for (const role of ['sales', 'technical'] as const) {
      harness.viewer = await asPartner(db, { partnerId: partner.id, role });
      expect(await updateCompanyDetailsAction(details)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(row?.legalName).toBeNull();
  });

  it('refuses a partner admin who names another company, and a signed out caller', async () => {
    const mine = await makePartner(db, {});
    const theirs = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: mine.id, role: 'partner_admin' });
    expect(await updateCompanyDetailsAction({ ...details, partnerId: theirs.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = null;
    expect(await updateCompanyDetailsAction(details)).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
    const [row] = await db.select().from(partners).where(eq(partners.id, theirs.id));
    expect(row?.legalName).toBeNull();
  });

  it('lets a partner manager edit any company by id, but not staff sales', async () => {
    const partner = await makePartner(db, { name: 'Qamar' });
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await updateCompanyDetailsAction({ ...details, partnerId: partner.id })).toMatchObject({ ok: true, data: { partnerId: partner.id, legalName: 'Kestrel Systems Pvt Ltd' } });
    expect(await db.select().from(auditLog)).toHaveLength(1);
    harness.viewer = await asStaff(db, 'sales', 'india');
    expect(await updateCompanyDetailsAction({ ...details, legalName: 'Other', partnerId: partner.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await updateCompanyDetailsAction(details)).toMatchObject({ ok: false, error: { code: 'validation' } });
  });

  it('returns field issues for bad input', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await updateCompanyDetailsAction({ ...details, billingContactEmail: 'nope', headcountBand: '7' });
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
    const paths = result.ok ? [] : (result.error.issues ?? []).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['billingContactEmail', 'headcountBand']));
  });
});

describe('logo actions', () => {
  const uploadAs = async (partnerId: string | undefined, name = 'logo.png', size = 100) => {
    const ticket = await createLogoTicketAction({ ...(partnerId ? { partnerId } : {}), originalName: name, size });
    if (!ticket.ok) return ticket;
    harness.storage.simulateUpload(ticket.data.key, size, ticket.data.headers['Content-Type'] ?? '', PNG);
    return confirmLogoAction({ ...(partnerId ? { partnerId } : {}), key: ticket.data.key, originalName: name, size });
  };

  it('uploads, replaces (deleting the old object) and removes a logo, auditing each change', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const first = await uploadAs(undefined);
    expect(first).toMatchObject({ ok: true, data: { logoUrl: expect.stringMatching(/^\/api\/partner-logo\//) } });
    const [row1] = await db.select().from(partners).where(eq(partners.id, partner.id));
    const second = await uploadAs(undefined, 'logo2.png');
    expect(second.ok).toBe(true);
    expect(harness.storage.deleted).toEqual([row1?.logoKey]);
    expect(await removeLogoAction({})).toMatchObject({ ok: true, data: { logoUrl: null } });
    expect(harness.storage.deleted).toHaveLength(2);
    const notes = (await db.select().from(auditLog)).map((e) => e.note).sort();
    expect(notes).toEqual(['Added a logo', 'Removed the logo', 'Replaced the logo']);
  });

  it('refuses svg, a file over 1 MB and a non-admin member', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await createLogoTicketAction({ originalName: 'logo.svg', size: 100 })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await createLogoTicketAction({ originalName: 'logo.png', size: 1024 * 1024 + 1 })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await createLogoTicketAction({ originalName: 'logo.png', size: 100 })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await removeLogoAction({})).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('refuses a confirm for a key issued to another company', async () => {
    const mine = await makePartner(db, {});
    const theirs = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: theirs.id, role: 'partner_admin' });
    const ticket = await createLogoTicketAction({ originalName: 'logo.png', size: 100 });
    if (!ticket.ok) throw new Error('ticket failed');
    harness.storage.simulateUpload(ticket.data.key, 100, 'image/png', PNG);
    harness.viewer = await asPartner(db, { partnerId: mine.id, role: 'partner_admin' });
    expect(await confirmLogoAction({ key: ticket.data.key, originalName: 'logo.png', size: 100 })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const [row] = await db.select().from(partners).where(eq(partners.id, mine.id));
    expect(row?.logoKey).toBeNull();
  });

  it('lets staff set a partner logo, and a stored file that is not a PNG is refused', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await uploadAs(partner.id)).toMatchObject({ ok: true, data: { partnerId: partner.id } });
    const ticket = await createLogoTicketAction({ partnerId: partner.id, originalName: 'x.png', size: 50 });
    if (!ticket.ok) throw new Error('ticket failed');
    harness.storage.simulateUpload(ticket.data.key, 50, 'image/png', [0x3c, 0x73, 0x76, 0x67]);
    expect(await confirmLogoAction({ partnerId: partner.id, key: ticket.data.key, originalName: 'x.png', size: 50 })).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });
});
