// handlers.registration.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeRegistration } from '@/db/test-helpers';
import { registrations } from '@/db/schema';
import { FakeHubspot } from './fake';
import { buildHandlers } from './handlers';
import { DependencyPending } from './types';

const db = testDb();
beforeEach(() => resetDb(db));
const PIPE = 'pipe-1';

const setup = async () => {
  const hs = new FakeHubspot();
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const h = buildHandlers(db, hs, PIPE);
  await h['partner.upsert'](partner.id, {});
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in',
    product: 'Clean Libraries', region: 'India', status: 'accepted', protectionEnd: '2027-02-02',
    contacts: [{ name: 'Rohan Mehta', email: 'rohan.mehta@vardhancapital.in' }],
  });
  return { hs, h, partner, reg };
};

describe('registration.create', () => {
  it('creates the deal, the customer company and links partner, customer and contact', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    const saved = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!;
    expect(saved.hubspotDealId).toBeTruthy();
    expect(saved.hubspotStageId).toBe(hs.stageIds.Accepted);
    const kinds = hs.associations.map((a) => a.kind).sort();
    expect(kinds).toEqual(['deal-company:customer', 'deal-company:partner', 'deal-contact']);
    const customer = [...hs.companies.values()].find((c) => c.domain === 'vardhancapital.in')!;
    expect(customer.properties.cleanstart_partner).toBeUndefined();
  });

  it('does not create a second deal when it runs twice (a retry after a timeout)', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await db.update(registrations).set({ hubspotDealId: null }).where(eq(registrations.id, reg.id));
    await h['registration.create'](reg.id, {});
    expect(hs.deals.size).toBe(1);
  });

  it('reuses an existing customer company', async () => {
    const { hs, h, reg } = await setup();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Pvt Ltd', domain: 'vardhancapital.in', properties: {} });
    await h['registration.create'](reg.id, {});
    expect([...hs.companies.values()].filter((c) => c.domain === 'vardhancapital.in')).toHaveLength(1);
  });

  it('does nothing for a registration that is no longer accepted', async () => {
    const { hs, h, reg } = await setup();
    await db.update(registrations).set({ status: 'rejected' }).where(eq(registrations.id, reg.id));
    await h['registration.create'](reg.id, {});
    expect(hs.deals.size).toBe(0);
  });

  it('maps the stored codes to HubSpot labels and values', async () => {
    const { hs, h, partner } = await setup();
    const reg = await makeRegistration(db, {
      partnerId: partner.id, customerName: 'Gulfway Freight', product: 'images', region: 'middle_east',
      status: 'accepted', protectionEnd: '2027-02-02',
    });
    await h['registration.create'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.properties).toMatchObject({
      dealname: 'Gulfway Freight | CleanStart Images | Kestrel Systems',
      partner_product: 'cleanstart_images',
      partner_region: 'middle_east',
    });
  });
});

describe('registration.update_end and registration.expire', () => {
  it('waits for the deal to exist', async () => {
    const { h, reg } = await setup();
    await expect(h['registration.update_end'](reg.id, {})).rejects.toBeInstanceOf(DependencyPending);
  });

  it('writes the new protection end', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await db.update(registrations).set({ protectionEnd: '2027-03-04' }).where(eq(registrations.id, reg.id));
    await h['registration.update_end'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.properties.protection_end_date).toBe('2027-03-04');
  });

  it('moves the deal to Registration expired', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await h['registration.expire'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.stageId).toBe(hs.stageIds['Registration expired']);
  });

  it('has nothing to move when an expired registration never reached HubSpot', async () => {
    const { hs, h, reg } = await setup();
    await db.update(registrations).set({ status: 'expired' }).where(eq(registrations.id, reg.id));
    await h['registration.expire'](reg.id, {});
    expect(hs.deals.size).toBe(0);
  });
});
