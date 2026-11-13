import { beforeEach, describe, expect, it } from 'vitest';
import {
  asPartner,
  asStaff,
  makeDocument,
  makePartner,
  makeRegistration,
  makeUser,
  resetDb,
  testDb,
} from '@/db/test-helpers';
import { ROUTES } from '@/lib/routes';
import { withViewer } from './context';
import { searchAll } from './search';

const db = testDb();

interface World {
  a: Awaited<ReturnType<typeof makePartner>>;
  b: Awaited<ReturnType<typeof makePartner>>;
  aAdmin: Awaited<ReturnType<typeof asPartner>>;
  aSales: Awaited<ReturnType<typeof asPartner>>;
  aTech: Awaited<ReturnType<typeof asPartner>>;
  dealA: Awaited<ReturnType<typeof makeRegistration>>;
  dealB: Awaited<ReturnType<typeof makeRegistration>>;
}

/** Partner A (India, channel) and partner B (Middle East, distributor), one deal each, same customer word. */
const seed = async (): Promise<World> => {
  const a = await makePartner(db, { name: 'Kestrel Systems', category: 'channel', region: 'india' });
  const b = await makePartner(db, { name: 'Kestrel Gulf Networks', category: 'distributor', region: 'middle_east' });
  const aAdmin = await asPartner(db, { partnerId: a.id, role: 'partner_admin' });
  const aSales = await asPartner(db, { partnerId: a.id, role: 'sales' });
  const aTech = await asPartner(db, { partnerId: a.id, role: 'technical' });
  const dealA = await makeRegistration(db, { partnerId: a.id, customerName: 'Vardhan Capital', region: 'india', registeredBy: aAdmin.id });
  const dealB = await makeRegistration(db, { partnerId: b.id, customerName: 'Vardhan Holdings', region: 'middle_east' });
  return { a, b, aAdmin, aSales, aTech, dealA, dealB };
};

const search = async (viewer: Awaited<ReturnType<typeof asStaff>> | Awaited<ReturnType<typeof asPartner>>, q: string, limit = 5) =>
  withViewer(viewer, (tx) => searchAll(tx, viewer, { q, limit }));

beforeEach(() => resetDb(db));

describe('searchAll as staff', () => {
  it('finds deals, partners, documents and people, one group after the other', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Kestrel partner playbook' });
    const staff = await asStaff(db, 'partner_manager', 'all');
    await makeUser(db, { partnerId: w.a.id, role: 'sales', name: 'Kestrel Vikram', email: 'vikram@kestrel.example.com' });

    const hits = await search(staff, 'kestrel');
    expect(hits.map((h) => h.group)).toEqual(['partners', 'partners', 'documents', 'people']);
    expect(hits.find((h) => h.label === 'Kestrel Systems')).toMatchObject({
      group: 'partners',
      hint: 'Channel partner, India',
      href: ROUTES.admin.partners,
      icon: 'bld',
    });
    expect(hits.find((h) => h.group === 'people')).toMatchObject({ hint: 'Kestrel Systems, Sales', href: ROUTES.admin.partners });

    const deals = await search(staff, 'vardhan');
    expect(deals.map((h) => h.label).sort()).toEqual(['Vardhan Capital', 'Vardhan Holdings']);
    expect(deals[0]).toMatchObject({ group: 'registrations', href: ROUTES.admin.approvals, icon: 'approve' });
    expect(deals.find((h) => h.label === 'Vardhan Holdings')?.hint).toBe('Kestrel Gulf Networks, pending');
  });

  it('tolerates a typo and matches inside a word', async () => {
    await seed();
    const staff = await asStaff(db);
    expect((await search(staff, 'kestrl')).map((h) => h.label)).toContain('Kestrel Systems');
    expect((await search(staff, 'rdhan cap')).map((h) => h.label)).toContain('Vardhan Capital');
  });

  it('returns nothing for a short query, and treats % and _ as plain characters', async () => {
    await seed();
    const staff = await asStaff(db);
    expect(await search(staff, 'k')).toEqual([]);
    expect(await search(staff, '  ')).toEqual([]);
    expect(await search(staff, '%%')).toEqual([]);
    expect(await search(staff, '__')).toEqual([]);
  });

  it('caps each group at the limit and never above 10', async () => {
    const staff = await asStaff(db);
    for (let i = 0; i < 12; i += 1) await makePartner(db, { name: `Orbit Partner ${i}` });
    expect((await search(staff, 'orbit', 3)).length).toBe(3);
    expect((await search(staff, 'orbit', 99)).length).toBe(10);
  });

  it('hides soft deleted documents and disabled people from staff too', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Retired price list', deletedAt: new Date() });
    await makeUser(db, { partnerId: w.a.id, name: 'Retired Person', status: 'disabled' });
    const staff = await asStaff(db);
    expect(await search(staff, 'retired')).toEqual([]);
  });

  it('limits staff sales to their region and gives marketing documents only', async () => {
    await seed();
    await makeDocument(db, { title: 'Vardhan case study' });
    const india = await asStaff(db, 'sales', 'india');
    const labels = (await search(india, 'vardhan')).map((h) => h.label);
    expect(labels).toContain('Vardhan Capital');
    expect(labels).not.toContain('Vardhan Holdings');
    expect((await search(india, 'gulf')).map((h) => h.label)).toEqual([]);
    const marketing = await asStaff(db, 'marketing', 'all');
    expect((await search(marketing, 'vardhan')).map((h) => h.group)).toEqual(['documents']);
    expect(await search(marketing, 'kestrel')).toEqual([]);
  });
});

describe('searchAll as a partner', () => {
  it('shows a partner admin only their own company, and never another partner', async () => {
    const w = await seed();
    await makeUser(db, { partnerId: w.b.id, role: 'sales', name: 'Gulf Colleague' });
    const hits = await search(w.aAdmin, 'vardhan');
    expect(hits).toEqual([
      expect.objectContaining({ group: 'registrations', label: 'Vardhan Capital', href: ROUTES.partner.deal(w.dealA.id), hint: 'CleanStart Images, pending' }),
    ]);
    expect(await search(w.aAdmin, 'gulf')).toEqual([]);
    expect((await search(w.aAdmin, 'kestrel')).filter((h) => h.group === 'partners')).toEqual([]);
  });

  it('lets an admin find their own colleagues and nobody else', async () => {
    const w = await seed();
    const mate = await makeUser(db, { partnerId: w.a.id, role: 'technical', name: 'Meera Colleague', email: 'meera@kestrel.example.com' });
    await makeUser(db, { partnerId: w.b.id, role: 'technical', name: 'Meera Elsewhere' });
    const people = (await search(w.aAdmin, 'meera')).filter((h) => h.group === 'people');
    expect(people).toEqual([expect.objectContaining({ label: mate.name, hint: 'Kestrel Systems, Technical', href: ROUTES.partner.team })]);
    expect(await search(w.aSales, 'meera')).toEqual([]);
  });

  it('shows partner sales only the deals they registered', async () => {
    const w = await seed();
    await makeRegistration(db, { partnerId: w.a.id, customerName: 'Vardhan Mine', registeredBy: w.aSales.id });
    expect((await search(w.aSales, 'vardhan')).map((h) => h.label)).toEqual(['Vardhan Mine']);
  });

  it('gives partner technical documents only', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Vardhan integration guide' });
    expect((await search(w.aTech, 'vardhan')).map((h) => h.group)).toEqual(['documents']);
  });

  it('applies the document audience: all, matching category, named, and not another partner', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Doc for all', audienceKind: 'all' });
    await makeDocument(db, { title: 'Doc for channel', audienceKind: 'categories', audienceCategories: ['channel'] });
    await makeDocument(db, { title: 'Doc for distributors', audienceKind: 'categories', audienceCategories: ['distributor'] });
    await makeDocument(db, { title: 'Doc named for A', audienceKind: 'named', partnerIds: [w.a.id] });
    await makeDocument(db, { title: 'Doc named for B', audienceKind: 'named', partnerIds: [w.b.id] });
    const titles = (await search(w.aAdmin, 'doc')).map((h) => h.label).sort();
    expect(titles).toEqual(['Doc for all', 'Doc for channel', 'Doc named for A']);
  });

  it('points a video document at the play icon', async () => {
    const w = await seed();
    await makeDocument(db, { title: 'Walkthrough video', type: 'video' });
    expect(await search(w.aAdmin, 'walkthrough')).toEqual([expect.objectContaining({ icon: 'play', hint: 'Video' })]);
  });
});
