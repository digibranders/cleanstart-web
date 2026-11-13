import { randomBytes } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins/two-factor';
import type { GoogleOptions, MicrosoftOptions } from 'better-auth/social-providers';
import { eq, type SQL } from 'drizzle-orm';
import { db } from '@/db/client';
import { authAccounts, authSessions, authTwoFactors, authVerifications, partners, users } from '@/db/schema';
import { type Env, env } from '@/env';
import { systemClock } from '@/lib/clock';
import { PASSWORD_RULES_MESSAGE } from '@/lib/password-rules';
import { recordAudit } from '@/server/audit/record';
import { RateLimitError } from '@/server/errors';
import { log } from '@/server/log';
import { rateLimit } from '@/server/rate-limit';
import { sendPasswordChangedEmail, sendPasswordResetEmail } from './auth-mail';
import { checkPassword, hashPassword, verifyPassword } from './passwords';
import type { SystemActor } from './types';

const APP_NAME = 'CleanStart Partner Portal';
const DAY_SECONDS = 86_400;
const SESSION_DAYS = 30;
const RESET_TOKEN_SECONDS = 3_600;

/** One message for a wrong password, an unknown address, a disabled user and a suspended company. */
const INVALID_LOGIN = { message: 'Invalid email or password', code: 'INVALID_EMAIL_OR_PASSWORD' } as const;
const SIGN_IN_PER_EMAIL = { limit: 10, windowSeconds: 600 } as const;
const RESET_PER_EMAIL = { limit: 3, windowSeconds: 3_600 } as const;
/** Paths whose body carries a new password: the portal rule is checked before Better Auth sees it. */
const NEW_PASSWORD_PATHS = new Set(['/reset-password', '/change-password']);

/**
 * A refused sign in still pays for one scrypt verify, so its timing matches an active user with a wrong password and
 * does not reveal the account state. The hash comes from a random secret nobody holds, with the real hashPassword
 * parameters, so it can never be a credential.
 */
const REFUSAL_HASH: Promise<string> = hashPassword(randomBytes(32).toString('hex'));

async function spendVerifyTime(password: unknown): Promise<void> {
  await verifyPassword({ hash: await REFUSAL_HASH, password: typeof password === 'string' ? password : '' });
}

/**
 * Whether a user may hold a session: active, and the company is not suspended. Null when there is no such user,
 * so sign in can fall through to Better Auth's own "wrong password" answer.
 */
async function mayHoldSession(match: SQL): Promise<boolean | null> {
  const [row] = await db
    .select({ status: users.status, partnerStatus: partners.status })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .where(match)
    .limit(1);
  if (!row) return null;
  return row.status === 'active' && row.partnerStatus !== 'suspended';
}

/** shortcut: in process fixed window per email, so a restart resets it; per IP limits are Better Auth's own rules below. */
function limitPerEmail(key: string, rule: { limit: number; windowSeconds: number }): void {
  try {
    rateLimit(key, rule);
  } catch (error) {
    if (error instanceof RateLimitError) throw new APIError('TOO_MANY_REQUESTS', { message: error.safeMessage });
    throw error;
  }
}

const emailOf = (body: unknown): string => {
  const value = (body as { email?: unknown } | null)?.email;
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

/** Only the error name: a transport message can carry the address. A failed mail never fails the reset. */
const logMailFailure = (message: string) => (error: unknown) => {
  log.error({ errorName: error instanceof Error ? error.name : 'unknown' }, message);
};

/** The audit actor for a change made from a signed out reset link. */
const resetLinkActor = (name: string): SystemActor => ({
  kind: 'system',
  label: name,
  who: 'partner',
  roleLabel: 'Reset link',
});

type OAuthEnv = Pick<
  Env,
  'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'MICROSOFT_CLIENT_ID' | 'MICROSOFT_CLIENT_SECRET' | 'MICROSOFT_TENANT_ID'
>;

/**
 * A provider exists only when both of its variables are set, so an unconfigured provider has no route and no button.
 * disableSignUp: a Google or Microsoft identity never creates a user, it signs in an existing one (accepted invites only).
 * Microsoft does not send email_verified, so the profile is mapped from xms_edov (the "email domain owner verified"
 * optional claim, which the Entra app registration must add). Without that claim the email is unverified and the
 * account is not linked, which fails closed.
 */
export function buildSocialProviders(source: OAuthEnv): { google?: GoogleOptions; microsoft?: MicrosoftOptions } {
  const providers: { google?: GoogleOptions; microsoft?: MicrosoftOptions } = {};
  if (source.GOOGLE_CLIENT_ID && source.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: source.GOOGLE_CLIENT_ID,
      clientSecret: source.GOOGLE_CLIENT_SECRET,
      prompt: 'select_account',
      disableSignUp: true,
    };
  }
  if (source.MICROSOFT_CLIENT_ID && source.MICROSOFT_CLIENT_SECRET) {
    providers.microsoft = {
      clientId: source.MICROSOFT_CLIENT_ID,
      clientSecret: source.MICROSOFT_CLIENT_SECRET,
      tenantId: source.MICROSOFT_TENANT_ID,
      prompt: 'select_account',
      disableSignUp: true,
      disableProfilePhoto: true,
      mapProfileToUser: (profile) => ({ emailVerified: profile.xms_edov === true }),
    };
  }
  return providers;
}

function createAuth() {
  return betterAuth({
    appName: APP_NAME,
    baseURL: env.APP_URL,
    secret: env.AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: users,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
        twoFactor: authTwoFactors,
      },
    }),
    // Postgres generates every id (gen_random_uuid), as for every other table.
    advanced: { database: { generateId: false } },
    user: {
      additionalFields: {
        kind: { type: 'string', required: true, input: false },
        role: { type: 'string', required: true, input: false },
        partnerId: { type: 'string', required: false, input: false },
        status: { type: 'string', required: true, input: false },
      },
    },
    session: { expiresIn: SESSION_DAYS * DAY_SECONDS, updateAge: DAY_SECONDS },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 10 },
        '/two-factor/verify-totp': { window: 60, max: 10 },
        '/two-factor/verify-backup-code': { window: 60, max: 10 },
        '/request-password-reset': { window: 60, max: 5 },
        '/reset-password': { window: 60, max: 10 },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path === '/sign-in/email') {
          const email = emailOf(ctx.body);
          limitPerEmail(`signin:email:${email}`, SIGN_IN_PER_EMAIL);
          if ((await mayHoldSession(eq(users.email, email))) === false) {
            await spendVerifyTime((ctx.body as { password?: unknown } | null)?.password);
            throw new APIError('UNAUTHORIZED', INVALID_LOGIN);
          }
        }
        if (ctx.path === '/request-password-reset') limitPerEmail(`reset:email:${emailOf(ctx.body)}`, RESET_PER_EMAIL);
        if (NEW_PASSWORD_PATHS.has(ctx.path)) {
          const candidate = (ctx.body as { newPassword?: unknown } | null)?.newPassword;
          if (typeof candidate === 'string' && !checkPassword(candidate).ok) {
            throw new APIError('BAD_REQUEST', { message: PASSWORD_RULES_MESSAGE, code: 'PASSWORD_RULES_NOT_MET' });
          }
        }
      }),
    },
    databaseHooks: {
      session: {
        create: {
          // The last gate for every way of signing in, social and second step included.
          before: async (session) => ((await mayHoldSession(eq(users.id, session.userId))) === true ? undefined : false),
          after: async (session) => {
            await db.update(users).set({ lastLoginAt: systemClock.now() }).where(eq(users.id, session.userId));
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      // Accounts are created only by acceptInvite, which inserts the credential account itself.
      disableSignUp: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      password: { hash: hashPassword, verify: verifyPassword },
      resetPasswordTokenExpiresIn: RESET_TOKEN_SECONDS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, token }) => {
        // Invited and disabled users get no reset link. Not awaited: a slow send must not tell a caller whether the address exists.
        if ((user as { status?: string }).status !== 'active') return;
        void sendPasswordResetEmail({
          to: { email: user.email, name: user.name },
          token,
          expiresInMinutes: RESET_TOKEN_SECONDS / 60,
        }).catch(logMailFailure('password reset email failed'));
      },
      onPasswordReset: async ({ user }) => {
        const changedAt = systemClock.now();
        await db.update(users).set({ passwordChangedAt: changedAt }).where(eq(users.id, user.id));
        await recordAudit(db, resetLinkActor(user.name), {
          event: 'account.password_changed',
          target: user.email,
          note: 'Reset with an emailed link',
          partnerId: (user as { partnerId?: string | null }).partnerId ?? null,
          subject: { type: 'user', id: user.id },
        });
        await sendPasswordChangedEmail({ to: { email: user.email, name: user.name }, changedAt }).catch(
          logMailFailure('password changed notice failed'),
        );
      },
    },
    socialProviders: buildSocialProviders(env),
    // Link a social login to an existing user only when the provider vouches for the email.
    account: { accountLinking: { enabled: true, trustedProviders: [], allowDifferentEmails: false } },
    plugins: [twoFactor({ issuer: APP_NAME }), nextCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let instance: Auth | undefined;

/**
 * Better Auth throws on a missing secret the moment it is constructed, and `next build` runs with
 * SKIP_ENV_VALIDATION=1 and no secrets. So the instance is built on first use, never at import.
 */
export const getAuth = (): Auth => {
  instance ??= createAuth();
  return instance;
};

/** The same instance as getAuth(), for call sites that read better as `auth.api.x`. */
export const auth: Auth = new Proxy({} as Auth, {
  get: (_target, property) => Reflect.get(getAuth(), property),
});
