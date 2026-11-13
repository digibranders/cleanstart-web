import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, authSessions, users } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from './auth';
import { sendPasswordChangedEmail, sendPasswordResetEmail } from './auth-mail';
import { totpCode } from './test-totp';

vi.mock('./auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

const PASSWORD = 'Sample#Pass1';

type ApiError = { statusCode: number; body: { code?: string; message?: string } };

const errorOf = async (run: () => Promise<unknown>): Promise<ApiError> => {
  try {
    await run();
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the call to fail');
};

const signIn = (email: string, password = PASSWORD) =>
  auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

const cookieHeaders = (headers: Headers): Headers =>
  new Headers({ cookie: headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ') });

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDb(testDb());
});

describe('sign in gate', () => {
  it('answers a disabled user, an invited user, a suspended company and an unknown address exactly like a wrong password', async () => {
    const db = testDb();
    const disabled = await makeUser(db, { password: PASSWORD, status: 'disabled' });
    const invited = await makeUser(db, { password: PASSWORD, status: 'invited' });
    const suspendedPartner = await makePartner(db, { status: 'suspended' });
    const suspended = await makeUser(db, { partnerId: suspendedPartner.id, password: PASSWORD });
    const active = await makeUser(db, { password: PASSWORD });

    const reference = await errorOf(() => signIn(active.email, 'wrong-password-1'));
    for (const email of [disabled.email, invited.email, suspended.email, 'nobody@example.com']) {
      const refused = await errorOf(() => signIn(email));
      expect(refused.statusCode, email).toBe(reference.statusCode);
      expect(refused.body, email).toEqual(reference.body);
    }
    expect(await db.select().from(authSessions)).toHaveLength(0);
  });

  it('refuses a session at the second step when the user was disabled after the password step', async () => {
    const db = testDb();
    const user = await makeUser(db, { password: PASSWORD });
    const first = await signIn(user.email);
    const enable = await auth.api.enableTwoFactor({ body: { password: PASSWORD, method: 'totp' }, headers: cookieHeaders(first.headers) });
    if (enable.method !== 'totp') throw new Error('expected the totp method');
    await auth.api.verifyTOTP({ body: { code: totpCode(enable.totpURI) }, headers: cookieHeaders(first.headers) });
    await db.delete(authSessions).where(eq(authSessions.userId, user.id));

    const challenge = await signIn(user.email);
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, user.id));
    await errorOf(() => auth.api.verifyTOTP({ body: { code: totpCode(enable.totpURI) }, headers: cookieHeaders(challenge.headers) }));
    expect(await db.select().from(authSessions)).toHaveLength(0);
  });

  it('runs the second step over HTTP exactly as the browser client calls it', async () => {
    const db = testDb();
    const user = await makeUser(db, { password: PASSWORD });
    const first = await signIn(user.email);
    const enable = await auth.api.enableTwoFactor({ body: { password: PASSWORD, method: 'totp' }, headers: cookieHeaders(first.headers) });
    if (enable.method !== 'totp') throw new Error('expected the totp method');
    await auth.api.verifyTOTP({ body: { code: totpCode(enable.totpURI) }, headers: cookieHeaders(first.headers) });
    await db.delete(authSessions).where(eq(authSessions.userId, user.id));

    const post = (path: string, body: unknown, cookie = '') =>
      auth.handler(
        new Request(`http://localhost:3004/api/auth${path}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', origin: 'http://localhost:3004', ...(cookie ? { cookie } : {}) },
          body: JSON.stringify(body),
        }),
      );
    const cookieOf = (response: Response): string =>
      response.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');

    const step1 = await post('/sign-in/email', { email: user.email, password: PASSWORD, rememberMe: true });
    expect(step1.status).toBe(200);
    expect(await step1.json()).toMatchObject({ twoFactorRedirect: true });
    expect(await db.select().from(authSessions)).toHaveLength(0);

    const wrong = await post('/two-factor/verify-totp', { code: '000000' }, cookieOf(step1));
    expect(wrong.status).toBe(401);
    const step2 = await post('/two-factor/verify-totp', { code: totpCode(enable.totpURI) }, cookieOf(step1));
    expect(step2.status).toBe(200);
    expect(step2.headers.getSetCookie().some((c) => c.startsWith('better-auth.session_token='))).toBe(true);
    expect(await db.select().from(authSessions)).toHaveLength(1);
  });

  it('records the last sign in time', async () => {
    const db = testDb();
    const user = await makeUser(db, { password: PASSWORD });
    expect(user.lastLoginAt).toBeNull();
    const before = Date.now();
    await signIn(user.email);
    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row?.lastLoginAt?.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});

describe('rate limits', () => {
  it('stops the eleventh sign in for one address inside ten minutes', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect((await errorOf(() => signIn(user.email, 'wrong-password-1'))).statusCode).toBe(401);
    }
    const blocked = await errorOf(() => signIn(user.email));
    expect(blocked.statusCode).toBe(429);
    expect(blocked.body.message).toBe('Too many attempts. Try again in a moment.');
  });

  it('stops the fourth reset request for one address inside an hour', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } });
    }
    const blocked = await errorOf(() => auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } }));
    expect(blocked.statusCode).toBe(429);
  });

  it('applies a per IP rule to requests that arrive over HTTP', async () => {
    const send = () =>
      auth.handler(
        new Request('http://localhost:3004/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.50' },
          body: JSON.stringify({ email: `nobody-${Math.random()}@example.com`, password: 'wrong-password-1' }),
        }),
      );
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 12; attempt += 1) statuses.push((await send()).status);
    expect(statuses.slice(0, 10).every((status) => status === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });
});

describe('password rule on the server', () => {
  it('refuses a weak new password on reset and keeps the token usable', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } });
    await vi.waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1));
    const token = vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0].token ?? '';

    const weak = await errorOf(() => auth.api.resetPassword({ body: { newPassword: 'abcdefgh', token } }));
    expect(weak.statusCode).toBe(400);
    expect(weak.body).toMatchObject({ code: 'PASSWORD_RULES_NOT_MET', message: 'Meet all four password rules.' });

    await auth.api.resetPassword({ body: { newPassword: 'Stronger#Pass2', token } });
    expect((await signIn(user.email, 'Stronger#Pass2')).response.user.id).toBe(user.id);
  });

  it('refuses a weak new password on change', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    const session = await signIn(user.email);
    const weak = await errorOf(() =>
      auth.api.changePassword({
        body: { currentPassword: PASSWORD, newPassword: 'abcdefgh' },
        headers: cookieHeaders(session.headers),
      }),
    );
    expect(weak.statusCode).toBe(400);
    expect(weak.body.code).toBe('PASSWORD_RULES_NOT_MET');
  });
});

describe('password reset', () => {
  it('sends no link to a disabled user', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD, status: 'disabled' });
    await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('stamps the change, writes one audit entry and sends the notice', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    const user = await makeUser(db, { partnerId: partner.id, password: PASSWORD, name: 'Aditi Rao' });
    await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } });
    await vi.waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1));
    const token = vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0].token ?? '';
    await auth.api.resetPassword({ body: { newPassword: 'Stronger#Pass2', token } });

    const [row] = await db.select().from(users).where(eq(users.id, user.id));
    expect(row?.passwordChangedAt).not.toBeNull();
    const entries = await db.select().from(auditLog);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: 'account.password_changed',
      actorLabel: 'Aditi Rao',
      who: 'partner',
      kind: 'people_access',
      partnerId: partner.id,
      subjectType: 'user',
      subjectId: user.id,
    });
    expect(sendPasswordChangedEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendPasswordChangedEmail).mock.calls[0]?.[0].to).toEqual({ email: user.email, name: 'Aditi Rao' });
  });
});
