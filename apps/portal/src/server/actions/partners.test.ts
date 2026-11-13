import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { partnerChecklist } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
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

import { sendManagerMessageAction, tickChecklistStepAction } from './partners';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  harness.viewer = null;
});

describe('tickChecklistStepAction', () => {
  it('lets a partner admin tick kickoff and playbook', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await tickChecklistStepAction({ step: 'kickoff' });
    expect(result).toMatchObject({ ok: true });
    expect(await db.select().from(partnerChecklist).where(eq(partnerChecklist.partnerId, partner.id))).toHaveLength(1);
  });

  it('refuses derived steps, other roles and signed out callers', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await tickChecklistStepAction({ step: 'deal' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = null;
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
  });
});

describe('sendManagerMessageAction', () => {
  it('emails the partner manager with the sender as reply-to', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser', email: 'omar@cleanstart.com' });
    const partner = await makePartner(db, { name: 'Qamar Solutions', managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    const result = await sendManagerMessageAction({ subject: 'Kickoff call', body: 'Can we talk on Tuesday?' });
    expect(result).toEqual({ ok: true, data: { managerName: 'Omar Nasser' } });
    const mail = fake.only('omar@cleanstart.com');
    expect(mail.replyTo?.email).toBe(harness.viewer.email);
    expect(mail.subject).toContain('Kickoff call');
    expect(mail.htmlContent).toContain('Can we talk on Tuesday?');
  });

  it('needs a subject, a body and an assigned manager', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await sendManagerMessageAction({ subject: '  ', body: 'x' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: '' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: '', message: 'Your partner manager has not been assigned yet.' }] } });
    expect(fake.sent).toHaveLength(0);
  });

  it('reports a failed send instead of pretending it worked, and is not for staff', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', email: 'm@cleanstart.com' });
    const partner = await makePartner(db, { managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id });
    fake.failNext = 'Brevo down';
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'integration' } });
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
