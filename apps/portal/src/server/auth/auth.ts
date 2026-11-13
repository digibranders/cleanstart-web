import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor } from 'better-auth/plugins/two-factor';
import type { GoogleOptions, MicrosoftOptions } from 'better-auth/social-providers';
import { db } from '@/db/client';
import { authAccounts, authSessions, authTwoFactors, authVerifications, users } from '@/db/schema';
import { type Env, env } from '@/env';
import { sendPasswordResetEmail } from './auth-mail';
import { hashPassword, verifyPassword } from './passwords';

const APP_NAME = 'CleanStart Partner Portal';
const DAY_SECONDS = 86_400;
const SESSION_DAYS = 30;
const RESET_TOKEN_SECONDS = 3_600;

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
        // Not awaited: a slow send must not tell a caller whether the address exists.
        void sendPasswordResetEmail({
          to: { email: user.email, name: user.name },
          token,
          expiresInMinutes: RESET_TOKEN_SECONDS / 60,
        });
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
