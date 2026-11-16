import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authSessions, partners, users } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from './auth';
import { sendPasswordResetEmail } from './auth-mail';
import { totpCode } from './test-totp';
import { viewerFromHeaders } from './viewer';

vi.mock('./auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

const PASSWORD = 'Sample#Pass1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const cookieHeaders = (headers: Headers): Headers =>
  new Headers({ cookie: headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ') });

const signIn = (email: string, password = PASSWORD) =>
  auth.api.signInEmail({ body: { email, password }, returnHeaders: true });

const errorOf = async (run: () => Promise<unknown>): Promise<{ statusCode: number; body: { code?: string; message?: string } }> => {
  try {
    await run();
  } catch (error) {
    return error as { statusCode: number; body: { code?: string; message?: string } };
  }
  throw new Error('expected the call to fail');
};

beforeEach(async () => {
  await resetDb(testDb());
});

describe('M0.7 auth spike', () => {
  it('S1 Better Auth runs on the users table and the auth_* tables, ids come from Postgres', async () => {
    await expect(auth.$context).resolves.toBeDefined();
    const user = await makeUser(testDb(), { password: PASSWORD });
    const { headers } = await signIn(user.email);
    expect(headers.getSetCookie().some((cookie) => cookie.startsWith('better-auth.session_token='))).toBe(true);
    const [session] = await testDb().select().from(authSessions).where(eq(authSessions.userId, user.id));
    expect(session?.id).toMatch(UUID);
  });

  it('S2 email and password: scrypt credentials sign in, wrong passwords and sign up are refused', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD, email: 'aditi.rao@example.com' });
    const upper = await signIn('ADITI.RAO@EXAMPLE.COM');
    expect(upper.response.user.id).toBe(user.id);
    const wrong = await errorOf(() => signIn(user.email, 'not-the-password'));
    expect(wrong.statusCode).toBe(401);
    expect(wrong.body.code).toBe('INVALID_EMAIL_OR_PASSWORD');
    const signUp = await errorOf(() =>
      auth.api.signUpEmail({ body: { email: 'new.person@example.com', password: PASSWORD, name: 'New Person' } }),
    );
    expect(signUp.statusCode).toBeGreaterThanOrEqual(400);
    expect(await testDb().select().from(users).where(eq(users.email, 'new.person@example.com'))).toHaveLength(0);
  });

  it('S3 second step: authenticator app code, then a single use backup code', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    const first = await signIn(user.email);
    const enable = await auth.api.enableTwoFactor({
      body: { password: PASSWORD, method: 'totp' },
      headers: cookieHeaders(first.headers),
    });
    if (enable.method !== 'totp') throw new Error('expected the totp method');
    expect(enable.backupCodes).toHaveLength(10);
    expect(enable.backupCodes.every((code) => /^[A-Za-z0-9]{5}-[A-Za-z0-9]{5}$/.test(code))).toBe(true);
    await auth.api.verifyTOTP({ body: { code: totpCode(enable.totpURI) }, headers: cookieHeaders(first.headers) });
    expect((await testDb().select().from(users).where(eq(users.id, user.id)))[0]?.twoFactorEnabled).toBe(true);

    const challenge = await signIn(user.email);
    expect(challenge.response).toMatchObject({ twoFactorRedirect: true });
    expect(await viewerFromHeaders(cookieHeaders(challenge.headers))).toBeNull();
    const wrong = await errorOf(() => auth.api.verifyTOTP({ body: { code: '000000' }, headers: cookieHeaders(challenge.headers) }));
    expect(wrong.statusCode).toBe(401);
    const done = await auth.api.verifyTOTP({
      body: { code: totpCode(enable.totpURI) },
      headers: cookieHeaders(challenge.headers),
      returnHeaders: true,
    });
    expect((await viewerFromHeaders(cookieHeaders(done.headers)))?.id).toBe(user.id);

    const code = enable.backupCodes[0] ?? '';
    const second = await signIn(user.email);
    await auth.api.verifyBackupCode({ body: { code }, headers: cookieHeaders(second.headers) });
    const third = await signIn(user.email);
    const reused = await errorOf(() => auth.api.verifyBackupCode({ body: { code }, headers: cookieHeaders(third.headers) }));
    expect(reused.statusCode).toBe(401);
  });

  it('S4 database sessions and getViewer: kind, role, company, region; revoked, disabled and suspended are null', async () => {
    const db = testDb();
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', password: PASSWORD });
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', password: PASSWORD });

    const partnerSession = await signIn(admin.email);
    expect(await viewerFromHeaders(cookieHeaders(partnerSession.headers))).toEqual({
      id: admin.id,
      kind: 'partner',
      role: 'partner_admin',
      partnerId: partner.id,
      partnerName: 'Kestrel Systems',
      email: admin.email,
      name: admin.name,
    });
    const staffSession = await signIn(manager.email);
    expect(await viewerFromHeaders(cookieHeaders(staffSession.headers))).toMatchObject({
      kind: 'staff',
      role: 'partner_manager',
      partnerId: null,
      region: 'india',
    });

    expect(await viewerFromHeaders(new Headers())).toBeNull();

    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, admin.id));
    expect(await viewerFromHeaders(cookieHeaders(partnerSession.headers))).toBeNull();
    await db.update(users).set({ status: 'active' }).where(eq(users.id, admin.id));
    expect(await viewerFromHeaders(cookieHeaders(partnerSession.headers))).not.toBeNull();

    await db.update(partners).set({ status: 'suspended' }).where(eq(partners.id, partner.id));
    expect(await viewerFromHeaders(cookieHeaders(partnerSession.headers))).toBeNull();

    await db.delete(authSessions).where(eq(authSessions.userId, manager.id));
    expect(await viewerFromHeaders(cookieHeaders(staffSession.headers))).toBeNull();
  });

  it('S5 password reset: the token reaches the mail bridge, sets a new password, revokes sessions', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    const session = await signIn(user.email);
    await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: '/reset-password' } });
    await vi.waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1));
    const call = vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0];
    expect(call?.to.email).toBe(user.email);
    await auth.api.resetPassword({ body: { newPassword: 'New#Pass2!', token: call?.token ?? '' } });
    expect(await viewerFromHeaders(cookieHeaders(session.headers))).toBeNull();
    expect((await signIn(user.email, 'New#Pass2!')).response.user.id).toBe(user.id);
    expect((await errorOf(() => signIn(user.email))).body.code).toBe('INVALID_EMAIL_OR_PASSWORD');
    const unknown = await auth.api.requestPasswordReset({ body: { email: 'nobody@example.com', redirectTo: '/reset-password' } });
    expect(unknown.status).toBe(true);
  });

  it('S6 email and password is the only way in: no social provider and no account linking is configured', () => {
    expect(Object.keys(auth.options)).not.toContain('socialProviders');
    expect(Object.keys(auth.options)).not.toContain('account');
  });

  it('S7 importing the auth module builds nothing, so next build works without secrets', async () => {
    vi.stubEnv('SKIP_ENV_VALIDATION', '1');
    vi.resetModules();
    try {
      await expect(import('./auth')).resolves.toHaveProperty('getAuth');
    } finally {
      vi.unstubAllEnvs();
      vi.resetModules();
    }
  });
});
