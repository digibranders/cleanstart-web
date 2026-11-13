import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { applications, auditLog, notifications } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';
import { ValidationError } from '@/server/errors';
import { APPLY_RECEIPT_COOKIE, verifyApplyReceipt } from '@/server/apply-receipt';
import { resetRateLimits } from '@/server/rate-limit';
import { verifyTurnstile } from '@/server/turnstile';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-portal-client-ip': harness.ip }),
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
vi.mock('@/server/turnstile', () => ({ verifyTurnstile: vi.fn(async () => undefined) }));

import { submitApplicationAction } from './apply';

const db = testDb();
let fake: FakeEmailTransport;
let ipCounter = 0;

const form = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  company: 'Tidewater Infosec',
  website: 'tidewaterinfosec.in',
  name: 'Neha Joshi',
  title: 'CTO',
  email: 'neha.joshi@tidewaterinfosec.in',
  phone: '+91 98200 41377',
  category: 'channel',
  region: 'india',
  reason: 'We resell security tooling to mid-size banks.',
  turnstileToken: 'token',
  ...overrides,
});

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  resetRateLimits();
  fake.clear();
  harness.cookieJar.clear();
  ipCounter += 1;
  harness.ip = `198.51.100.${ipCounter}`;
  vi.mocked(verifyTurnstile).mockClear();
});

describe('submitApplicationAction', () => {
  it('creates a portal application, audits it, notifies managers and emails everyone', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', email: 'farhan@cleanstart.com' });
    const result = await submitApplicationAction(form());
    expect(result).toMatchObject({ ok: true, data: { outcome: 'submitted', reference: expect.stringMatching(/^APP-\d{4}-0001$/u) } });
    const [row] = await db.select().from(applications);
    expect(row).toMatchObject({ source: 'portal', status: 'new', personalEmail: false, domain: 'tidewaterinfosec.in', category: 'channel', region: 'india' });
    const audit = await db.select().from(auditLog);
    expect(audit.map((a) => a.event)).toEqual(['application.submitted']);
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[manager.id, 'application_new']]);
    expect(fake.to('neha.joshi@tidewaterinfosec.in')).toHaveLength(1);
    expect(fake.to('farhan@cleanstart.com')).toHaveLength(1);
    const receipt = verifyApplyReceipt(harness.cookieJar.get(APPLY_RECEIPT_COOKIE) ?? '', new Date());
    expect(receipt).toMatchObject({ company: 'Tidewater Infosec', firstName: 'Neha', category: 'channel', region: 'india' });
  });

  it('rejects a free-mail address on the email field and creates nothing', async () => {
    const result = await submitApplicationAction(form({ email: 'neha@gmail.com' }));
    expect(result).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'email', message: 'Use your company email, not a personal address.' }] } });
    expect(await db.select().from(applications)).toHaveLength(0);
  });

  it('uses the email domain when the website is not a domain', async () => {
    await submitApplicationAction(form({ website: 'asdf' }));
    const [row] = await db.select().from(applications);
    expect(row?.domain).toBe('tidewaterinfosec.in');
  });

  it('returns the existing-partner outcome and creates nothing when the email domain belongs to a partner', async () => {
    await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const result = await submitApplicationAction(form({ email: 'new.person@kestrelsystems.in', company: 'Kestrel Systems' }));
    expect(result).toEqual({ ok: true, data: { outcome: 'existing_partner', partnerName: 'Kestrel Systems' } });
    expect(await db.select().from(applications)).toHaveLength(0);
    expect(fake.sent).toHaveLength(0);
    expect(harness.cookieJar.size).toBe(0);
  });

  it('merges a duplicate pending application for the same email', async () => {
    await submitApplicationAction(form());
    const second = await submitApplicationAction(form({ reason: 'Second version of the reason.' }));
    expect(second.ok).toBe(true);
    const rows = await db.select().from(applications);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.reason).toBe('Second version of the reason.');
  });

  it('rate limits the sixth submission from one IP', async () => {
    for (let n = 1; n <= 5; n += 1) {
      const result = await submitApplicationAction(form({ email: `person${n}@tidewaterinfosec.in` }));
      expect(result.ok).toBe(true);
    }
    const sixth = await submitApplicationAction(form({ email: 'person6@tidewaterinfosec.in' }));
    expect(sixth).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
    expect(await db.select().from(applications)).toHaveLength(5);
  });

  it('still limits submissions when the client address is unknown, all in one shared bucket', async () => {
    harness.ip = '';
    for (let n = 1; n <= 5; n += 1) {
      expect((await submitApplicationAction(form({ email: `noip${n}@tidewaterinfosec.in` }))).ok).toBe(true);
    }
    expect(await submitApplicationAction(form({ email: 'noip6@tidewaterinfosec.in' }))).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });

  it('stops when the Turnstile check fails', async () => {
    vi.mocked(verifyTurnstile).mockRejectedValueOnce(new ValidationError([{ path: 'turnstile', message: 'The robot check failed. Try again.' }]));
    const result = await submitApplicationAction(form());
    expect(result).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'turnstile' }] } });
    expect(await db.select().from(applications)).toHaveLength(0);
  });

  it('validates the other fields', async () => {
    const result = await submitApplicationAction(form({ company: '  ', name: '', reason: '' }));
    expect(result).toMatchObject({ ok: false, error: { code: 'validation' } });
    const paths = result.ok ? [] : (result.error.issues ?? []).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['company', 'name', 'reason']));
  });
});
