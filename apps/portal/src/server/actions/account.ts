'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import type { NotificationCategory } from '@/lib/domain';
import type { IsoTimestamp, ProfileDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { auth } from '@/server/auth/auth';
import { assertPasswordOk } from '@/server/auth/passwords';
import { assertCan } from '@/server/auth/policies';
import { revokeSession } from '@/server/auth/sessions';
import { throwFieldError } from '@/server/auth-errors';
import { ValidationError } from '@/server/errors';
import { sendEmail } from '@/server/email/send';
import { buildPasswordChanged } from '@/server/email/templates';
import { rateLimit } from '@/server/rate-limit';
import { getProfile, recordPasswordChanged, setNotificationPrefs, updateProfile } from '@/server/repo/account';
import { withViewer } from '@/server/repo/context';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(200),
    newPassword: z.string().min(1).max(128, 'Use 128 characters or fewer.'),
    confirmPassword: z.string().max(200),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' });
const passwordOnlySchema = z.object({ password: z.string().min(1, 'Enter your password.').max(200) });
const codeSchema = z.object({
  code: z.string().transform((value) => value.replace(/\s/gu, '')).pipe(z.string().regex(/^\d{6}$/u, 'Enter the 6 digits from your app.')),
});
const PASSWORD_RULE = { limit: 10, windowSeconds: 600 } as const;

const profileSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  title: z.string().trim().max(120),
  phone: z.string().trim().max(40),
});
const prefsSchema = z.object({
  decision: z.boolean(),
  stage: z.boolean(),
  expiry: z.boolean(),
  docs: z.boolean(),
  team: z.boolean(),
}) satisfies z.ZodType<Record<NotificationCategory, boolean>>;
const sessionSchema = z.object({ sessionId: z.string().uuid() });

export async function updateProfileAction(raw: unknown): Promise<ActionResult<ProfileDto>> {
  return runViewerAction({ name: 'account.update_profile', schema: profileSchema }, raw, async (ctx, input): Promise<ProfileDto> => {
    assertCan(ctx.viewer, 'account.update_profile');
    const profile = await withViewer(ctx.viewer, (tx) =>
      updateProfile(tx, ctx.viewer, { name: input.name, title: input.title || null, phone: input.phone || null }),
    );
    ctx.revalidate(ROUTES.partner.account);
    return profile;
  });
}

export async function setNotificationPrefsAction(raw: unknown): Promise<ActionResult<Record<NotificationCategory, boolean>>> {
  return runViewerAction({ name: 'account.update_notifications', schema: prefsSchema }, raw, async (ctx, input): Promise<Record<NotificationCategory, boolean>> => {
    assertCan(ctx.viewer, 'account.update_notifications');
    const saved = await withViewer(ctx.viewer, (tx) => setNotificationPrefs(tx, ctx.viewer, input));
    ctx.revalidate(ROUTES.partner.account);
    return saved;
  });
}

export async function revokeSessionAction(raw: unknown): Promise<ActionResult<{ sessionId: string }>> {
  return runViewerAction({ name: 'account.revoke_session', schema: sessionSchema }, raw, async (ctx, input): Promise<{ sessionId: string }> => {
    assertCan(ctx.viewer, 'account.manage_sessions');
    // Only the viewer's own sessions: revokeSession takes the viewer id as well as the session id.
    await revokeSession(ctx.viewer.id, input.sessionId);
    await withViewer(ctx.viewer, (tx) =>
      recordAudit(tx, ctx.viewer, {
        event: 'account.session_revoked',
        target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
        partnerId: ctx.viewer.partnerId,
        subject: { type: 'user', id: ctx.viewer.id },
      }),
    );
    ctx.revalidate(ROUTES.partner.account);
    return { sessionId: input.sessionId };
  });
}

const spaced = (codes: readonly string[]): string[] => codes.map((code) => code.replace('-', ' '));

export async function changePasswordAction(raw: unknown): Promise<ActionResult<{ changedAt: IsoTimestamp }>> {
  return runViewerAction({ name: 'account.change_password', schema: changePasswordSchema }, raw, async (ctx, input): Promise<{ changedAt: IsoTimestamp }> => {
    assertCan(ctx.viewer, 'account.change_password');
    rateLimit(`password:user:${ctx.viewer.id}`, PASSWORD_RULE);
    try {
      assertPasswordOk(input.newPassword);
    } catch (error) {
      // The rule failure belongs under the new password field, not a generic "password" path.
      if (error instanceof ValidationError) throw new ValidationError(error.issues.map((issue) => ({ ...issue, path: 'newPassword' })), error.safeMessage);
      throw error;
    }
    try {
      await auth.api.changePassword({
        body: { currentPassword: input.currentPassword, newPassword: input.newPassword, revokeOtherSessions: true },
        headers: await headers(),
      });
    } catch (error) {
      throwFieldError(error, 'currentPassword');
    }
    const changedAt = ctx.clock.now();
    await withViewer(ctx.viewer, async (tx) => {
      await recordPasswordChanged(tx, ctx.viewer, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'account.password_changed',
        target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
        note: 'Changed on the Account page',
        partnerId: ctx.viewer.partnerId,
        subject: { type: 'user', id: ctx.viewer.id },
      });
    });
    ctx.afterCommit(async () => {
      await sendEmail(buildPasswordChanged({ to: { email: ctx.viewer.email, name: ctx.viewer.name }, name: ctx.viewer.name, changedAt: changedAt.toISOString() }));
    });
    ctx.revalidate(ROUTES.partner.account);
    return { changedAt: changedAt.toISOString() };
  });
}

/** Starts two-step enrolment. The factor is not on until verifyTwoFactorAction accepts a code from the app. */
export async function enableTwoFactorAction(raw: unknown): Promise<ActionResult<{ setupKey: string; uri: string; backupCodes: string[] }>> {
  return runViewerAction({ name: 'account.enable_two_factor', schema: passwordOnlySchema }, raw, async (ctx, input): Promise<{ setupKey: string; uri: string; backupCodes: string[] }> => {
    assertCan(ctx.viewer, 'account.manage_two_factor');
    rateLimit(`2fa:user:${ctx.viewer.id}`, PASSWORD_RULE);
    let enrolment: Awaited<ReturnType<typeof auth.api.enableTwoFactor>>;
    try {
      enrolment = await auth.api.enableTwoFactor({ body: { password: input.password, method: 'totp' }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    if (enrolment.method !== 'totp') throw new Error('Better Auth returned a non authenticator enrolment');
    const secret = new URL(enrolment.totpURI).searchParams.get('secret') ?? '';
    return { setupKey: secret.replace(/(.{4})/gu, '$1 ').trim(), uri: enrolment.totpURI, backupCodes: spaced(enrolment.backupCodes) };
  });
}

export async function verifyTwoFactorAction(raw: unknown): Promise<ActionResult<{ enabled: true }>> {
  return runViewerAction({ name: 'account.verify_two_factor', schema: codeSchema }, raw, async (ctx, input): Promise<{ enabled: true }> => {
    assertCan(ctx.viewer, 'account.manage_two_factor');
    rateLimit(`2fa:user:${ctx.viewer.id}`, PASSWORD_RULE);
    const wasEnabled = (await withViewer(ctx.viewer, (tx) => getProfile(tx, ctx.viewer))).twoFactorEnabled;
    try {
      await auth.api.verifyTOTP({ body: { code: input.code }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    if (!wasEnabled) {
      await withViewer(ctx.viewer, (tx) =>
        recordAudit(tx, ctx.viewer, {
          event: 'account.two_factor_enabled',
          target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
          partnerId: ctx.viewer.partnerId,
          subject: { type: 'user', id: ctx.viewer.id },
        }),
      );
    }
    ctx.revalidate(ROUTES.partner.account);
    return { enabled: true };
  });
}

export async function disableTwoFactorAction(raw: unknown): Promise<ActionResult<{ enabled: false }>> {
  return runViewerAction({ name: 'account.disable_two_factor', schema: passwordOnlySchema }, raw, async (ctx, input): Promise<{ enabled: false }> => {
    assertCan(ctx.viewer, 'account.manage_two_factor');
    rateLimit(`2fa:user:${ctx.viewer.id}`, PASSWORD_RULE);
    try {
      await auth.api.disableTwoFactor({ body: { password: input.password }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    await withViewer(ctx.viewer, (tx) =>
      recordAudit(tx, ctx.viewer, {
        event: 'account.two_factor_disabled',
        target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
        partnerId: ctx.viewer.partnerId,
        subject: { type: 'user', id: ctx.viewer.id },
      }),
    );
    ctx.revalidate(ROUTES.partner.account);
    return { enabled: false };
  });
}

/** Better Auth shows backup codes only when it makes them, so "Backup codes" makes a fresh set (the old ones stop working). */
export async function regenerateBackupCodesAction(raw: unknown): Promise<ActionResult<{ backupCodes: string[] }>> {
  return runViewerAction({ name: 'account.regenerate_backup_codes', schema: passwordOnlySchema }, raw, async (ctx, input): Promise<{ backupCodes: string[] }> => {
    assertCan(ctx.viewer, 'account.manage_two_factor');
    rateLimit(`2fa:user:${ctx.viewer.id}`, PASSWORD_RULE);
    let fresh: Awaited<ReturnType<typeof auth.api.generateBackupCodes>>;
    try {
      fresh = await auth.api.generateBackupCodes({ body: { password: input.password }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    return { backupCodes: spaced(fresh.backupCodes) };
  });
}
