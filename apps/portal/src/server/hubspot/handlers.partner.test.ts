// handlers.partner.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeUser } from '@/db/test-helpers';
import { partners, users } from '@/db/schema';
import { FakeHubspot } from './fake';
import { buildHandlers } from './handlers';
import { DependencyPending } from './types';

const db = testDb();
beforeEach(() => resetDb(db));

describe('partner.upsert', () => {
  it('creates a partner company, flags it and stores the HubSpot id', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel' });
    await buildHandlers(db, hs, 'pipe-1')['partner.upsert'](p.id, {});
    const saved = (await db.select().from(partners).where(eq(partners.id, p.id)))[0]!;
    expect(saved.hubspotCompanyId).toBeTruthy();
    expect(hs.companies.get(saved.hubspotCompanyId!)?.properties).toMatchObject({
      cleanstart_partner: 'true', partner_category: 'channel_partner', partner_portal_id: p.id,
    });
  });

  it('updates the existing company on a second run instead of creating another', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const h = buildHandlers(db, hs, 'pipe-1');
    await h['partner.upsert'](p.id, {});
    await h['partner.upsert'](p.id, {});
    expect(hs.companies.size).toBe(1);
  });
});

describe('user.upsert', () => {
  it('waits when the partner company is not in HubSpot yet', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, {});
    const u = await makeUser(db, { partnerId: p.id, email: 'aditi.rao@kestrelsystems.in' });
    await expect(buildHandlers(db, hs, 'pipe-1')['user.upsert'](u.id, {})).rejects.toBeInstanceOf(DependencyPending);
  });

  it('creates the contact and links it to the partner company', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, {});
    const h = buildHandlers(db, hs, 'pipe-1');
    await h['partner.upsert'](p.id, {});
    const u = await makeUser(db, { partnerId: p.id, email: 'aditi.rao@kestrelsystems.in', name: 'Aditi Rao' });
    await h['user.upsert'](u.id, {});
    const saved = (await db.select().from(users).where(eq(users.id, u.id)))[0]!;
    expect(saved.hubspotContactId).toBeTruthy();
    expect(hs.associations).toContainEqual({ from: saved.hubspotContactId, to: expect.any(String), kind: 'contact-company' });
  });
});
