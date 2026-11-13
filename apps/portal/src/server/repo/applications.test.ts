import { beforeEach, describe, expect, it } from 'vitest';
import { applications } from '@/db/schema';
import { makeApplication, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { withSystem } from './context';
import { createPortalApplication, findPartnerByDomain, listManagerRecipients, type NewApplicationRecord } from './applications';

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
