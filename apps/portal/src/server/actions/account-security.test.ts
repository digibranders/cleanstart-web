import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, users } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
const authApi = vi.hoisted(() => ({
  changePassword: vi.fn(),
  enableTwoFactor: vi.fn(),
  verifyTOTP: vi.fn(),
  disableTwoFactor: vi.fn(),
  generateBackupCodes: vi.fn(),
}));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'x-portal-client-ip': harness.ip, cookie: 'session=1' }),
  cookies: async () => ({ set: () => undefined, get: () => undefined }),
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
vi.mock('@/server/auth/auth', () => ({ auth: { api: authApi } }));
vi.mock('@/server/auth/sessions', () => ({ revokeSession: vi.fn(), revokeAllSessions: vi.fn(), listSessions: vi.fn() }));

import {
  changePasswordAction,
  disableTwoFactorAction,
  enableTwoFactorAction,
  regenerateBackupCodesAction,
  verifyTwoFactorAction,
} from './account';

const db = testDb();
let fake: FakeEmailTransport;
const apiError = (code: string): Error => Object.assign(new Error(code), { statusCode: 400, body: { code, message: code } });
const NEW = 'Sup3r-secret!';

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  for (const fn of Object.values(authApi)) fn.mockReset();
  harness.viewer = await asPartner(db, { role: 'sales' });
});

const events = async () => (await db.select().from(auditLog)).map((a) => a.event);

describe('changePasswordAction', () => {
  const form = (overrides: Record<string, unknown> = {}) => ({ currentPassword: 'Old-passw0rd!', newPassword: NEW, confirmPassword: NEW, ...overrides });

  it('changes the password through Better Auth, signs other sessions out, stamps the change, audits it and emails a notice', async () => {
    authApi.changePassword.mockResolvedValueOnce({ token: null });
    const viewer = harness.viewer as Viewer;
    const result = await changePasswordAction(form());
    expect(result).toMatchObject({ ok: true, data: { changedAt: expect.any(String) } });
    expect(authApi.changePassword).toHaveBeenCalledWith(expect.objectContaining({ body: { currentPassword: 'Old-passw0rd!', newPassword: NEW, revokeOtherSessions: true } }));
    const [row] = await db.select().from(users).where(eq(users.id, viewer.id));
    expect(row?.passwordChangedAt).not.toBeNull();
    expect(await events()).toEqual(['account.password_changed']);
    expect(fake.to(viewer.email)).toHaveLength(1);
    expect(JSON.stringify(await db.select().from(auditLog))).not.toContain(NEW);
  });

  it('applies the password rule on the server and checks the confirmation before calling Better Auth', async () => {
    expect(await changePasswordAction(form({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' }))).toMatchObject({
      ok: false,
      error: { code: 'validation', issues: [{ path: 'newPassword', message: 'Meet all four password rules.' }] },
    });
    expect(await changePasswordAction(form({ confirmPassword: 'Different-1!' }))).toMatchObject({ ok: false, error: { issues: [{ path: 'confirmPassword' }] } });
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('caps the new password at 128 characters on the newPassword field, before calling Better Auth', async () => {
    const long = `Aa1!${'x'.repeat(125)}`;
    expect(long).toHaveLength(129);
    expect(await changePasswordAction(form({ newPassword: long, confirmPassword: long }))).toMatchObject({
      ok: false,
      error: { code: 'validation', issues: [{ path: 'newPassword' }] },
    });
    expect(authApi.changePassword).not.toHaveBeenCalled();
  });

  it('reports a wrong current password on its own field and records nothing', async () => {
    authApi.changePassword.mockRejectedValueOnce(apiError('INVALID_PASSWORD'));
    expect(await changePasswordAction(form())).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'currentPassword', message: 'That password is not right.' }] } });
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(fake.sent).toHaveLength(0);
  });

  it('is for a signed in person and rate limits repeated attempts', async () => {
    harness.viewer = null;
    expect(await changePasswordAction(form())).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
    harness.viewer = await asPartner(db, { role: 'technical' });
    authApi.changePassword.mockRejectedValue(apiError('INVALID_PASSWORD'));
    for (let i = 0; i < 10; i += 1) await changePasswordAction(form());
    expect(await changePasswordAction(form())).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });
});

describe('two-step sign-in actions', () => {
  const URI = 'otpauth://totp/CleanStart%20Partners:a%40b.example?secret=KQ4D7M2XP9TB3WNA&issuer=CleanStart%20Partners';

  it('enable returns the setup key, the link and the backup codes in the mock\'s display format, and needs the password', async () => {
    authApi.enableTwoFactor.mockResolvedValueOnce({ method: 'totp', totpURI: URI, backupCodes: ['7KQ2M-9XT4B', 'P3VN8-RJ6WA'] });
    const result = await enableTwoFactorAction({ password: 'Old-passw0rd!' });
    expect(result).toEqual({ ok: true, data: { setupKey: 'KQ4D 7M2X P9TB 3WNA', uri: URI, backupCodes: ['7KQ2M 9XT4B', 'P3VN8 RJ6WA'] } });
    expect(authApi.enableTwoFactor).toHaveBeenCalledWith(expect.objectContaining({ body: { password: 'Old-passw0rd!', method: 'totp' } }));
    expect(await enableTwoFactorAction({ password: '' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    authApi.enableTwoFactor.mockRejectedValueOnce(apiError('INVALID_PASSWORD'));
    expect(await enableTwoFactorAction({ password: 'nope' })).toMatchObject({ ok: false, error: { issues: [{ path: 'password' }] } });
    authApi.enableTwoFactor.mockRejectedValueOnce(apiError('TOTP_ALREADY_ENABLED'));
    expect(await enableTwoFactorAction({ password: 'x' })).toMatchObject({ ok: false, error: { issues: [{ path: '', message: 'Two-step sign-in is already on.' }] } });
  });

  it('verify turns it on and audits it; a wrong code is a field error and audits nothing', async () => {
    authApi.verifyTOTP.mockResolvedValueOnce({ token: 't' });
    expect(await verifyTwoFactorAction({ code: '123 456' })).toEqual({ ok: true, data: { enabled: true } });
    expect(authApi.verifyTOTP).toHaveBeenCalledWith(expect.objectContaining({ body: { code: '123456' } }));
    expect(await events()).toEqual(['account.two_factor_enabled']);
    authApi.verifyTOTP.mockRejectedValueOnce(apiError('INVALID_CODE'));
    expect(await verifyTwoFactorAction({ code: '000000' })).toMatchObject({ ok: false, error: { issues: [{ path: 'code' }] } });
    expect(await verifyTwoFactorAction({ code: 'abc' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await events()).toEqual(['account.two_factor_enabled']);
  });

  it('verify does not audit again when two-step was already on', async () => {
    const viewer = harness.viewer as Viewer;
    await db.update(users).set({ twoFactorEnabled: true }).where(eq(users.id, viewer.id));
    authApi.verifyTOTP.mockResolvedValueOnce({ token: 't' });
    expect(await verifyTwoFactorAction({ code: '123456' })).toEqual({ ok: true, data: { enabled: true } });
    expect(await events()).toEqual([]);
  });

  it('disable needs the password and audits it', async () => {
    authApi.disableTwoFactor.mockResolvedValueOnce({ status: true });
    expect(await disableTwoFactorAction({ password: 'Old-passw0rd!' })).toEqual({ ok: true, data: { enabled: false } });
    expect(await events()).toEqual(['account.two_factor_disabled']);
    authApi.disableTwoFactor.mockRejectedValueOnce(apiError('INVALID_PASSWORD'));
    expect(await disableTwoFactorAction({ password: 'nope' })).toMatchObject({ ok: false, error: { issues: [{ path: 'password' }] } });
    expect(await events()).toEqual(['account.two_factor_disabled']);
  });

  it('regenerate returns ten fresh codes with a space in the middle', async () => {
    authApi.generateBackupCodes.mockResolvedValueOnce({ status: true, backupCodes: ['AAAAA-BBBBB', 'CCCCC-DDDDD'] });
    expect(await regenerateBackupCodesAction({ password: 'Old-passw0rd!' })).toEqual({ ok: true, data: { backupCodes: ['AAAAA BBBBB', 'CCCCC DDDDD'] } });
  });
});
