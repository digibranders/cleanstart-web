import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, hubspotOutbox, invites, notifications, partners, staffScopes, users } from '@/db/schema';
import { makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>(), signInFails: false }));
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
vi.mock('@/server/auth/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(async () => {
        if (harness.signInFails) throw new Error('sign in unavailable');
        return { token: 't' };
      }),
    },
  },
}));

import { auth } from '@/server/auth/auth';
import { acceptInviteAction, previewInviteAction } from './invites';

const db = testDb();
let fake: FakeEmailTransport;
let ipCounter = 0;
const future = new Date('2099-01-01T00:00:00Z');
const STRONG = 'Sup3r-secret!';

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  harness.cookieJar.clear();
  harness.signInFails = false;
  ipCounter += 1;
  harness.ip = `198.51.100.${ipCounter}`;
  vi.mocked(auth.api.signInEmail).mockClear();
});

const form = (token: string, overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  token,
  name: 'Yasmin Haddad',
  password: STRONG,
  confirmPassword: STRONG,
  acceptAgreement: true,
  ...overrides,
});

const firstAdmin = async () => {
  const partner = await makePartner(db, { name: 'Qamar Solutions', domain: 'qamarsolutions.ae', status: 'onboarding' });
  const made = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'yasmin.haddad@qamarsolutions.ae', expiresAt: future });
  return { partner, ...made };
};

describe('acceptInviteAction', () => {
  it('creates the user, stamps the agreement, queues user.upsert, audits both changes and signs the person in', async () => {
    const { partner, token } = await firstAdmin();
    const result = await acceptInviteAction(form(token));
    expect(result).toEqual({ ok: true, data: { signedIn: true, redirectTo: '/partner/welcome' } });
    expect(auth.api.signInEmail).toHaveBeenCalledWith(expect.objectContaining({ body: { email: 'yasmin.haddad@qamarsolutions.ae', password: STRONG } }));
    const [user] = await db.select().from(users).where(eq(users.email, 'yasmin.haddad@qamarsolutions.ae'));
    expect(user).toMatchObject({ status: 'active', role: 'partner_admin' });
    const [stamped] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(stamped?.agreementAcceptedAt).not.toBeNull();
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'user.upsert', subjectId: user?.id, idempotencyKey: `user.upsert:${user?.id}:1` });
    expect((await db.select().from(auditLog)).map((a) => a.event).sort()).toEqual(['partner.agreement_accepted', 'team.invite_accepted']);
  });

  it('never stores or logs the clear password', async () => {
    const { token } = await firstAdmin();
    await acceptInviteAction(form(token));
    const rows = await db.select().from(users);
    expect(JSON.stringify(rows)).not.toContain(STRONG);
    expect(JSON.stringify(await db.select().from(auditLog))).not.toContain(STRONG);
  });

  it('enforces the password rule on the server and leaves the invite open', async () => {
    const { invite, token } = await firstAdmin();
    expect(await acceptInviteAction(form(token, { password: 'short', confirmPassword: 'short' }))).toMatchObject({
      ok: false,
      error: { code: 'validation', issues: [{ path: 'password', message: 'Meet all four password rules.' }] },
    });
    expect(await acceptInviteAction(form(token, { confirmPassword: 'Different-1!' }))).toMatchObject({
      ok: false,
      error: { issues: [{ path: 'confirmPassword', message: 'The passwords do not match.' }] },
    });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.acceptedAt).toBeNull();
  });

  it('answers a used, tampered, expired and withdrawn token with four different messages', async () => {
    const { token } = await firstAdmin();
    expect((await acceptInviteAction(form(token))).ok).toBe(true);
    const partner = await makePartner(db, {});
    const make = (extra: { expiresAt?: Date; acceptedAt?: Date; revokedAt?: Date }) =>
      makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random().toString(36).slice(2)}@example.com`, expiresAt: future, ...extra });
    const messages = await Promise.all([
      acceptInviteAction(form(token)),
      acceptInviteAction(form(`${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`)),
      make({ expiresAt: new Date('2020-01-01T00:00:00Z') }).then((m) => acceptInviteAction(form(m.token))),
      make({ revokedAt: new Date('2026-01-01T00:00:00Z') }).then((m) => acceptInviteAction(form(m.token))),
    ]);
    const texts = messages.map((m) => (m.ok ? 'ok' : m.error.message));
    expect(new Set(texts).size).toBe(4);
    expect(texts).toEqual([
      'This invite was already used. Sign in instead.',
      'This invite link is not valid.',
      'This invite has expired. Ask for a new one.',
      'This invite was withdrawn. Ask for a new one.',
    ]);
  });

  it('succeeds without a session when the server sign-in fails and sends the person to the sign-in page', async () => {
    const { token } = await firstAdmin();
    harness.signInFails = true;
    expect(await acceptInviteAction(form(token))).toEqual({ ok: true, data: { signedIn: false, redirectTo: '/sign-in' } });
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it('tells the other partner admins and emails those who want it when a colleague joins', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', status: 'active' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example', name: 'Aditi Rao' });
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram@kestrel.example', expiresAt: future });
    const result = await acceptInviteAction(form(token, { name: 'Vikram Sethi' }));
    expect(result).toEqual({ ok: true, data: { signedIn: true, redirectTo: '/partner/overview' } });
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[admin.id, 'team_joined']]);
    expect(fake.to('aditi@kestrel.example')).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });

  it('accepts a staff invite without HubSpot or a company', async () => {
    const { token } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'marketing', staffRegion: 'all', email: 'ishita@cleanstart.com', expiresAt: future });
    expect(await acceptInviteAction(form(token, { name: 'Ishita Bose', acceptAgreement: false }))).toEqual({ ok: true, data: { signedIn: true, redirectTo: '/admin/documents' } });
    expect(await db.select().from(staffScopes)).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('rate limits by IP', async () => {
    for (let i = 0; i < 20; i += 1) await acceptInviteAction(form('nope'));
    expect(await acceptInviteAction(form('nope'))).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });
});

describe('previewInviteAction', () => {
  it('returns the preview with the agreement version', async () => {
    const { token } = await firstAdmin();
    expect(await previewInviteAction({ token })).toMatchObject({ ok: true, data: { state: 'ok', needsAgreement: true } });
    expect(await previewInviteAction({ token: 'nope' })).toEqual({ ok: true, data: { state: 'unknown' } });
  });
});
