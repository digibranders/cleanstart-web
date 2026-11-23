import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { partners } from '@/db/schema';
import { resetDb, seedTwoTenants, testDb } from '@/db/test-helpers';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import type { IsolationContext } from './isolation.registry';
import { getCompany, getPartnerLogoKey, setPartnerLogo, updateCompanyDetails } from './partners';

const db = testDb();
const details = { legalName: 'Acme', taxId: '', hqCountry: 'IN', headcountBand: '1-10', billingContactName: '', billingContactEmail: '', supportContactName: '', supportContactEmail: '' } as const;
let ctx: IsolationContext;

beforeAll(async () => {
  await resetDb(db);
  ctx = await seedTwoTenants(db);
});

describe('company details and RLS', () => {
  it('stores the details and shows them to the company, to nobody else', async () => {
    await withViewer(ctx.a.adminViewer, (tx) => updateCompanyDetails(tx, ctx.a.adminViewer, { details }));
    const own = await withViewer(ctx.a.salesViewer, (tx) => getCompany(tx, ctx.a.salesViewer, {}));
    expect(own).toMatchObject({ legalName: 'Acme', hqCountry: 'IN', headcountBand: '1-10' });
    await expect(withViewer(ctx.b.viewer, (tx) => getCompany(tx, ctx.b.viewer, { partnerId: ctx.a.partnerId }))).rejects.toBeInstanceOf(NotFoundError);
    const other = await withViewer(ctx.b.viewer, (tx) => getCompany(tx, ctx.b.viewer, {}));
    expect(other.legalName).toBeNull();
  });

  it('the database refuses a write across companies even if the repo scope were skipped', async () => {
    const changed = await withViewer(ctx.b.adminViewer, (tx) => tx.update(partners).set({ legalName: 'Hijacked' }).where(eq(partners.id, ctx.a.partnerId)).returning({ id: partners.id }));
    expect(changed).toEqual([]);
    const [row] = await db.select().from(partners).where(eq(partners.id, ctx.a.partnerId));
    expect(row?.legalName).toBe('Acme');
  });

  it('refuses an unknown headcount band at the database', async () => {
    await expect(db.update(partners).set({ headcountBand: '5000' as never }).where(eq(partners.id, ctx.a.partnerId))).rejects.toThrow();
  });

  it('sets, reads and clears a logo key for the owner; another company reads nothing', async () => {
    const { previousKey } = await withViewer(ctx.a.adminViewer, (tx) => setPartnerLogo(tx, ctx.a.adminViewer, { key: `partner-logos/${ctx.a.partnerId}/x.png` }));
    expect(previousKey).toBeNull();
    expect(await withViewer(ctx.a.salesViewer, (tx) => getPartnerLogoKey(tx, ctx.a.salesViewer, ctx.a.partnerId))).toBe(`partner-logos/${ctx.a.partnerId}/x.png`);
    await expect(withViewer(ctx.b.viewer, (tx) => getPartnerLogoKey(tx, ctx.b.viewer, ctx.a.partnerId))).rejects.toBeInstanceOf(NotFoundError);
    expect(await withViewer(ctx.staff, (tx) => getPartnerLogoKey(tx, ctx.staff, ctx.a.partnerId))).toContain('x.png');
    const cleared = await withViewer(ctx.a.adminViewer, (tx) => setPartnerLogo(tx, ctx.a.adminViewer, { key: null }));
    expect(cleared.previousKey).toContain('x.png');
  });
});
