import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox, partners, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null }));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ 'x-portal-client-ip': '198.51.100.1' }) }));
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

import { updatePartnerIdentityAction } from './partner-identity';

const db = testDb();
const row = async (id: string) => (await db.select().from(partners).where(eq(partners.id, id)))[0];

beforeEach(async () => {
  await resetDb(db);
  harness.viewer = null;
});

describe('updatePartnerIdentityAction', () => {
  it('lets a partner manager rename, change domain and region, with one audit entry per field and no CRM push', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', region: 'india' });
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    const result = await updatePartnerIdentityAction({ id: partner.id, name: ' Kestrel Systems Pvt Ltd ', domain: 'https://www.Kestrel.example/about', region: 'middle_east' });
    expect(result).toMatchObject({ ok: true, data: { id: partner.id, name: 'Kestrel Systems Pvt Ltd', domain: 'kestrel.example', region: 'middle_east' } });
    expect(await row(partner.id)).toMatchObject({ name: 'Kestrel Systems Pvt Ltd', domain: 'kestrel.example', region: 'middle_east' });
    const entries = await db.select().from(auditLog);
    expect(entries.map((e) => e.event).sort()).toEqual(['partner.domain_changed', 'partner.region_changed', 'partner.renamed']);
    expect(entries.find((e) => e.event === 'partner.renamed')).toMatchObject({ before: 'Kestrel Systems', after: 'Kestrel Systems Pvt Ltd' });
    expect(entries.find((e) => e.event === 'partner.domain_changed')).toMatchObject({ before: 'kestrelsystems.in', after: 'kestrel.example' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('changing the region moves no registration', async () => {
    const partner = await makePartner(db, { region: 'india' });
    const deal = await makeRegistration(db, { partnerId: partner.id });
    const before = (await db.select().from(registrations).where(eq(registrations.id, deal.id)))[0];
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await updatePartnerIdentityAction({ id: partner.id, region: 'elsewhere' })).toMatchObject({ ok: true });
    expect((await db.select().from(registrations).where(eq(registrations.id, deal.id)))[0]).toEqual(before);
  });

  it('writes nothing when nothing changed', async () => {
    const partner = await makePartner(db, { name: 'Same', domain: 'same.example', region: 'india' });
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await updatePartnerIdentityAction({ id: partner.id, name: 'Same', domain: 'same.example', region: 'india' })).toMatchObject({ ok: true });
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });

  it('refuses a domain another partner already uses, and a malformed one, and an empty name', async () => {
    const partner = await makePartner(db, { domain: 'one.example' });
    await makePartner(db, { domain: 'two.example' });
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    expect(await updatePartnerIdentityAction({ id: partner.id, domain: 'Two.Example' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await updatePartnerIdentityAction({ id: partner.id, domain: 'not a domain' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await updatePartnerIdentityAction({ id: partner.id, name: '   ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect((await row(partner.id))?.domain).toBe('one.example');
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });

  it('is for partner managers only: staff sales and partner users are refused and nothing changes', async () => {
    const partner = await makePartner(db, { name: 'Untouched', domain: 'untouched.example' });
    for (const viewer of [await asStaff(db, 'sales', 'all'), await asStaff(db, 'marketing', 'all'), await asPartner(db, { partnerId: partner.id, role: 'partner_admin' })]) {
      harness.viewer = viewer;
      expect(await updatePartnerIdentityAction({ id: partner.id, name: 'Hijacked' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    expect(await row(partner.id)).toMatchObject({ name: 'Untouched', domain: 'untouched.example' });
  });

  it('answers not found for an unknown partner', async () => {
    harness.viewer = await asStaff(db, 'partner_manager', 'all');
    await makeUser(db, { kind: 'staff', role: 'partner_manager' });
    expect(await updatePartnerIdentityAction({ id: '00000000-0000-4000-8000-000000000000', name: 'Ghost' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
