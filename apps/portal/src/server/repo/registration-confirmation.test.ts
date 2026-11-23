import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { getConfirmationSource } from './registration-confirmation';

const db = testDb();
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const other = await makePartner(db, { name: 'Dunes Networks' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const colleague = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const accepted = await makeRegistration(db, { partnerId: partner.id, status: 'accepted', registeredBy: sales.id, region: 'india' });
  const pending = await makeRegistration(db, { partnerId: partner.id, status: 'pending', registeredBy: sales.id, region: 'india' });
  return { partner, other, sales, colleague, accepted, pending };
};

const open = (viewer: Viewer, id: string) =>
  withViewer(viewer, (tx) => getConfirmationSource(tx, viewer, id));

describe('getConfirmationSource', () => {
  it('serves an accepted registration to the company admin and audits the partner download', async () => {
    const { partner, accepted } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const deal = await open(viewer, accepted.id);
    expect(deal.id).toBe(accepted.id);
    const rows = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.confirmation_downloaded'));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ partnerId: partner.id, subjectId: accepted.id, who: 'partner' });
  });

  it('shows a sales user only their own deals', async () => {
    const { sales, colleague, accepted } = await setup();
    const own = await viewerFor(db, sales);
    await expect(open(own, accepted.id)).resolves.toMatchObject({ id: accepted.id });
    const other = await viewerFor(db, colleague);
    await expect(open(other, accepted.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('answers not found for another company, and refuses a registration that is not accepted', async () => {
    const { partner, other, accepted, pending } = await setup();
    const stranger = await asPartner(db, { partnerId: other.id, role: 'partner_admin' });
    await expect(open(stranger, accepted.id)).rejects.toBeInstanceOf(NotFoundError);
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(open(admin, pending.id)).rejects.toBeInstanceOf(ConflictError);
    await expect(open(admin, 'not-a-uuid')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('serves staff in scope without an audit entry and hides other regions', async () => {
    const { accepted } = await setup();
    const inRegion = await asStaff(db, 'sales', 'india');
    await expect(open(inRegion, accepted.id)).resolves.toMatchObject({ id: accepted.id });
    const elsewhere = await asStaff(db, 'sales', 'middle_east');
    await expect(open(elsewhere, accepted.id)).rejects.toBeInstanceOf(NotFoundError);
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.confirmation_downloaded'))).toHaveLength(0);
  });
});
