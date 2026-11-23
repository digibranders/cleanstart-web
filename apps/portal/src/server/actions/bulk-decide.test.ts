import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
});
const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));

import { auditLog, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { BULK_DECIDE_MAX } from '@/lib/deal-rules';
import { FakeEmailTransport } from '@/server/email/fake';
import { bulkDecideAction } from './bulk-decide';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
});

const statusOf = async (id: string) => (await db.select().from(registrations).where(eq(registrations.id, id)))[0]?.status;

async function queue() {
  const manager = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const registrant = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const mk = (customerName: string, over: Partial<Parameters<typeof makeRegistration>[1]> = {}) =>
    makeRegistration(db, { partnerId: partner.id, registeredBy: registrant.id, managerId: manager.id, customerName, ...over });
  return { manager, partner, mk };
}

describe('bulkDecideAction', () => {
  it('accepts every waiting registration, each with its own audit entry', async () => {
    const { manager, mk } = await queue();
    const [a, b] = [await mk('Alpha Bank'), await mk('Beta Bank')];
    session.viewer = manager;
    const result = await bulkDecideAction({ decision: 'accept', ids: [a.id, b.id] });
    expect(result).toMatchObject({ ok: true, data: { items: [{ id: a.id, status: 'done' }, { id: b.id, status: 'done' }] } });
    expect(await statusOf(a.id)).toBe('accepted');
    expect(await statusOf(b.id)).toBe('accepted');
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.accepted'))).toHaveLength(2);
  });

  it('one failure does not stop the rest: a decided row fails, a conflict is skipped, the others are accepted', async () => {
    const { manager, mk } = await queue();
    const other = await makePartner(db, { name: 'Dunes Networks' });
    const ok = await mk('Alpha Bank');
    const decided = await mk('Beta Bank', { status: 'accepted' });
    const rival = await mk('Gamma Bank', { product: 'cleansight' });
    await makeRegistration(db, { partnerId: other.id, customerName: 'Gamma Bank', product: 'cleansight', managerId: manager.id });
    const last = await mk('Delta Bank');
    session.viewer = manager;
    const result = await bulkDecideAction({ decision: 'accept', ids: [ok.id, decided.id, rival.id, last.id] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((i) => [i.id, i.status])).toEqual([
      [ok.id, 'done'],
      [decided.id, 'failed'],
      [rival.id, 'skipped'],
      [last.id, 'done'],
    ]);
    expect(result.data.items[1]?.message).toBeTruthy();
    expect(result.data.items[2]?.message).toContain('Dunes Networks');
    expect(await statusOf(rival.id)).toBe('pending');
    expect(await statusOf(last.id)).toBe('accepted');
  });

  it('rejects with one reason, emails each partner and needs the reason', async () => {
    const { manager, mk } = await queue();
    const [a, b] = [await mk('Alpha Bank'), await mk('Beta Bank')];
    session.viewer = manager;
    expect(await bulkDecideAction({ decision: 'reject', ids: [a.id] })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await statusOf(a.id)).toBe('pending');
    const result = await bulkDecideAction({ decision: 'reject', ids: [a.id, b.id], reason: 'Outside the program' });
    expect(result.ok).toBe(true);
    expect(await statusOf(b.id)).toBe('rejected');
    const entries = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.rejected'));
    expect(entries).toHaveLength(2);
    expect(entries[0]?.note).toContain('Outside the program');
  });

  it(`takes at most ${BULK_DECIDE_MAX} ids and at least one`, async () => {
    const { manager } = await queue();
    session.viewer = manager;
    const ids = Array.from({ length: BULK_DECIDE_MAX + 1 }, () => crypto.randomUUID());
    expect(await bulkDecideAction({ decision: 'accept', ids })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await bulkDecideAction({ decision: 'accept', ids: [] })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });

  it('staff sales decide only inside their region; a partner is forbidden', async () => {
    const { manager, partner, mk } = await queue();
    const here = await mk('Alpha Bank', { region: 'india' });
    const there = await mk('Beta Bank', { region: 'middle_east' });
    session.viewer = await asStaff(db, 'sales', 'india');
    const result = await bulkDecideAction({ decision: 'accept', ids: [here.id, there.id] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.items.map((i) => i.status)).toEqual(['done', 'failed']);
    expect(await statusOf(there.id)).toBe('pending');
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await bulkDecideAction({ decision: 'accept', ids: [there.id] })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(manager.id).toBeTruthy();
  });
});
