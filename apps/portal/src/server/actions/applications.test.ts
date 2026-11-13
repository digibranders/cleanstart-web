import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { applications, auditLog, hubspotOutbox, invites, partners } from '@/db/schema';
import { asPartner, asStaff, makeApplication, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-forwarded-for': harness.ip }),
  cookies: async () => ({
    set: (name: string, value: string) => void harness.cookieJar.set(name, value),
    get: (name: string) => (harness.cookieJar.has(name) ? { value: harness.cookieJar.get(name) } : undefined),
  }),
}));
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
vi.mock('@/server/email/send', async () => {
  const { FakeEmailTransport } = await import('@/server/email/fake');
  const fake = new FakeEmailTransport();
  return { sendEmail: (message: EmailMessage) => fake.send(message), fake };
});

import { approveApplicationAction, declineApplicationAction, reopenApplicationAction } from './applications';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  harness.viewer = await asStaff(db, 'partner_manager', 'india');
});

const open = (overrides: Partial<typeof applications.$inferInsert> = {}) =>
  makeApplication(db, { company: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', applicantName: 'Neha Joshi', email: 'neha.joshi@tidewaterinfosec.in', source: 'portal', ...overrides });

describe('approveApplicationAction', () => {
  it('creates the partner, queues partner.upsert, audits and emails the invite link', async () => {
    const app = await open();
    const result = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.partner).toMatchObject({ name: 'Tidewater Infosec', status: 'onboarding' });
    expect(JSON.stringify(result.data)).not.toContain('token');
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'partner.upsert', subjectId: result.data.partner.id, idempotencyKey: `partner.upsert:${result.data.partner.id}:1`, status: 'pending' });
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['application.approved']);
    const mail = fake.only('neha.joshi@tidewaterinfosec.in');
    const token = /accept-invite\?token=([A-Za-z0-9_-]+)/u.exec(mail.htmlContent)?.[1];
    expect(token).toBeDefined();
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('uses a fresh outbox version when a reopened application is approved again', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const app = await open();
    const first = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    await reopenApplicationAction({ id: app.id });
    const second = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    expect(first.ok && second.ok).toBe(true);
    const keys = (await db.select().from(hubspotOutbox)).map((o) => o.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(await db.select().from(partners)).toHaveLength(1);
  });

  it('is forbidden for a partner viewer and for staff who are not partner managers', async () => {
    const app = await open();
    harness.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asStaff(db, 'sales', 'india');
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect((await db.select().from(applications).where(eq(applications.id, app.id)))[0]?.status).toBe('new');
  });

  it('validates the input and reports a domain conflict with a safe message', async () => {
    expect(await approveApplicationAction({ id: 'nope', category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    await makePartner(db, { domain: 'tidewaterinfosec.in' });
    const app = await open();
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Another partner already uses this domain.' } });
  });
});

describe('declineApplicationAction', () => {
  it('needs a reason, then declines, audits and emails the applicant the reason', async () => {
    const app = await open();
    expect(await declineApplicationAction({ id: app.id, reason: ' ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const result = await declineApplicationAction({ id: app.id, reason: 'We already have a partner in Pune.' });
    expect(result).toMatchObject({ ok: true, data: { status: 'declined', declineReason: 'We already have a partner in Pune.' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['application.declined', 'We already have a partner in Pune.']]);
    expect(fake.only('neha.joshi@tidewaterinfosec.in').htmlContent).toContain('We already have a partner in Pune.');
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });
});

describe('reopenApplicationAction', () => {
  it('undoes a decline and audits it', async () => {
    const app = await open({ status: 'declined', declineReason: 'No' });
    const result = await reopenApplicationAction({ id: app.id });
    expect(result).toMatchObject({ ok: true, data: { status: 'new' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['application.reopened', 'Decline undone']]);
  });

  it('queues a partner.upsert with a fresh version when an approval is undone', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const app = await open();
    await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    const before = (await db.select().from(hubspotOutbox)).length;
    const result = await reopenApplicationAction({ id: app.id });
    expect(result.ok).toBe(true);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(before + 1);
  });

  it('reports partner_not_reopenable as a conflict', async () => {
    const partner = await makePartner(db, { domain: 'live.example', status: 'active' });
    const app = await open({ status: 'approved', partnerId: partner.id, domain: 'live.example' });
    const result = await reopenApplicationAction({ id: app.id });
    expect(result).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });
});
