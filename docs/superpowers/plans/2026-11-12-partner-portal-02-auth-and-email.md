# Partner portal auth and email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the partner portal its sign-in layer and its email module: a Better Auth backed login (email and password, an authenticator app as second step, database sessions, Google and Microsoft behind environment variables) with a scripted spike gate that falls back to Auth.js v5; the permission matrix, guards, proxy redirect, `getViewer()` and the converted Sign in screen; and the portal's own email layout, Brevo transport and all 21 templates with real copy.

**Architecture:** Three layers, each in the folder the contracts name. `src/server/auth/` holds the Better Auth instance (built lazily, on first use, because Better Auth throws at construction without a secret and `next build` has none), the pure `policies.ts` matrix, `getViewer()` and the guards. Better Auth runs on the portal's own `users` table and four `auth_*` tables through the system database pool, so request code never reads them. `src/server/email/` is a table based HTML layout, an `EmailTransport` interface (Brevo, a logging transport for development, a fake for tests) and 21 pure template builders that return `subject` plus `htmlContent`. The existing mock screens (`SignIn`, `Shell`, layouts, `proxy.ts`) keep their markup and copy and swap mock behaviour for the real viewer. Source of truth: `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` (called "the contracts" below), then `docs/partner-portal/BUILD-HANDOFF.md`.

**Tech Stack:** Next.js 16.2.5 (`proxy.ts` on the Node runtime), React 19.2, TypeScript strict, Better Auth 1.7.x with `@better-auth/drizzle-adapter` (bundled in `better-auth`), Drizzle ORM 0.45, Postgres 16, Zod 3, Vitest, Brevo `/v3/smtp/email`, Sentry. Installed by W0-a; this plan adds no dependency.

**Owner and order:** W0-e (Task M0.7), W0-f (Tasks M1.1a to M1.1g), W0-g (Tasks M0.5a to M0.5d), in that order, in the integration worktree on `feat/portal-build`, serial. Every task is committed on `feat/portal-build`.

---

## What was verified before this plan was written

The library facts below were checked against the real packages in a scratch project (Better Auth 1.7.22, Drizzle 0.45.4, Next 16.2.5, Vitest 3.2.4, TypeScript 5.9.3, Biome 1.9.4), not recalled. The code in this plan was compiled and its tests were run there, against PGlite (in process Postgres) with stand-ins for the W0-b test helpers. What that could not cover is listed under "Known unknowns".

- Better Auth runs on the contracts' `users` table plus the four `auth_*` tables through the Drizzle adapter, with a schema map `{ user, session, account, verification, twoFactor }`. Ids come from Postgres with `advanced.database.generateId: false`.
- 1.7 checks the Drizzle schema at start and refuses to run on a mismatch. It found that **`auth_two_factor` needs three more columns**: `verified boolean not null default true`, `failed_verification_count integer not null default 0`, `locked_until timestamptz`. They are now part of the contracts' C.1 and `0000_init` (integration review), so Task M0.7 only checks that they are there.
- Better Auth **throws at construction** when the secret is missing (an unhandled rejection that kills the process). The contracts' `auth` export would therefore break `next build`, which runs with `SKIP_ENV_VALIDATION=1`. `auth` is a lazy proxy over `getAuth()`; `next build` was run with no secrets and passed.
- Custom scrypt hashing (`emailAndPassword.password.hash` and `verify`) works, and a credential row inserted by us with `providerId: 'credential'` signs in.
- The `twoFactor` plugin supports **both** an authenticator app (TOTP, with 10 backup codes) and an email code (`method: 'otp'`). The contracts' decision (authenticator app) is a configuration choice, and the documented fallback (email code) is one `otpOptions.sendOTP` setting, not a rewrite. Backup codes come as `XXXXX-XXXXX` (10 letters and digits plus a hyphen), case sensitive, single use.
- Sign in for a user with the second step on returns `{ twoFactorRedirect: true }` and sets no session; the session is created only by `verifyTOTP`, `verifyBackupCode` or `verifyTwoFactorOTP`.
- Microsoft does not send `email_verified`. With `account.accountLinking.trustedProviders: []` a Microsoft login links to an existing user only when `mapProfileToUser` reports the email verified, which this plan derives from the `xms_edov` claim. Linking also requires the local `users.email_verified` to be true (Better Auth's default `requireLocalEmailVerified`), so `acceptInvite` (P, M1.5) must set it.
- Next 16 `proxy.ts` runs on the Node runtime (`next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`), `getSessionCookie` from `better-auth/cookies` reads the session cookie without a database call, and the proxy can pass the requested path to Server Components in a request header.
- Auth.js v5 (`next-auth@5.0.0-beta.32`, `@auth/core@0.41.2`): the Credentials provider **always** writes a JWT cookie. `@auth/core/lib/actions/callback/index.js` has no database session path for credentials, and `assertConfig` rejects the database strategy when Credentials is the only provider. That is why the fallback (Task M0.7-F) is a JWT cookie plus a revocation row, and why Better Auth is the pick.
- `drizzle-kit generate` accepts the whole contracts schema, including the three extra `auth_two_factor` columns.
- Biome 1.9.4 (`biome lint src`, the portal's lint) rejects an assignment inside an expression. The contracts' `src/db/client.ts` used `const pools = (globalForDb.portalPools ??= createPools());`, which fails lint; the contracts now carry the corrected form.

## File Structure

Paths are relative to `apps/portal` unless they start with `docs/`. Single quotes in new server files follow the contracts; the four mock files this plan edits (`SignIn.tsx`, `shell.tsx`, `routes.ts`, `proxy.ts`) and the files in `src/app` keep the mock's double quotes.

| Path | New or changed | Responsibility | Task |
|---|---|---|---|
| `src/db/test-helpers.ts`, `src/db/fixtures.ts`, `src/db/fixtures.test.ts`, `scripts/seed-dev.ts` | modified | `makeUser({ password })` and the seeded logins (`passwordHash`), which W0-b could not provide before `hashPassword` existed | M0.7 |
| `src/server/auth/passwords.ts` | new, extended in M1.1a | scrypt `hashPassword` and `verifyPassword`; then `checkPassword` and `assertPasswordOk` | M0.7, M1.1a |
| `src/server/auth/auth.ts` | new, replaced in M1.1c | the Better Auth instance, `getAuth()`, lazy `auth`, `buildSocialProviders`; then the sign in gate, rate limits, password rule, last login, reset audit | M0.7, M1.1c |
| `src/server/auth/auth-mail.ts` | new, replaced in M0.5d | the two mails Better Auth sends: log only bridge, then the real sends | M0.7, M0.5d |
| `src/server/auth/viewer.ts` | new, replaced in M1.1d | `loadViewer`, `viewerFromHeaders`, `getViewer`; then `homeFor` and the four guards | M0.7, M1.1d |
| `src/server/auth/test-totp.ts` | new | RFC 6238 code generator for tests | M0.7 |
| `src/server/auth/auth.spike.test.ts` | new | the S1 to S7 decision checklist, kept as a regression test | M0.7 |
| `scripts/auth-spike-gate.ts` | new | runs the checklist and prints `DECISION:` | M0.7 |
| `src/app/api/auth/[...all]/route.ts` | new | Better Auth HTTP handler | M0.7 |
| `src/lib/auth-client.ts` | new | browser side Better Auth client with the two-factor plugin | M0.7 |
| `docs/partner-portal/AUTH-SPIKE.md` | new | spike result and findings | M0.7 |
| `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md` | modified | D3 row records the result | M0.7 |
| `src/lib/password-rules.ts` | new | the password rule, pure and client safe | M1.1a |
| `src/server/auth/passwords.test.ts` | new | 8 rule cases, hash round trip, agreement with the mock field | M1.1a |
| `src/server/auth/tokens.ts`, `tokens.test.ts` | new | invite token, expiry, `inviteState`, numeric code helpers | M1.1a |
| `src/server/auth/policies.ts`, `policies.test.ts` | new | `ACTIONS`, `can`, `assertCan`, the full matrix test | M1.1b |
| `src/server/auth/auth.test.ts` | new | sign in gate, rate limits, password rule, reset audit | M1.1c |
| `src/lib/next-path.ts`, `next-path.test.ts` | new | `safeNext` and `PATH_HEADER` | M1.1d |
| `src/server/auth/sessions.ts`, `sessions.test.ts` | new | list and revoke sessions | M1.1d |
| `src/server/auth/viewer.test.ts` | new | `homeFor` table and guard redirects | M1.1d |
| `src/server/repo/account.ts`, `account.test.ts` | new | `getShell` and its isolation entry | M1.1d |
| `src/proxy.ts`, `src/proxy.test.ts` | modified, new | review gate kept, session redirect, path header | M1.1e |
| `src/lib/routes.ts`, `routes.test.ts` | modified, new | `navFor`, `resetPassword` route, `action` per nav item | M1.1f |
| `src/lib/initials.ts`, `initials.test.ts` | new | avatar initials without the mock data file | M1.1f |
| `src/app/page.tsx`, `src/app/{partner,admin}/{layout,page}.tsx` | modified | guards, shell data, redirects by `homeFor` | M1.1f |
| `src/components/shell/shell.tsx` | modified | the real viewer replaces the personas | M1.1f |
| `src/app/(public)/sign-in/page.tsx`, `src/components/screens/SignIn.tsx` | modified | real sign in, second step, social buttons, reset request | M1.1g |
| `src/server/email/{transport,brevo,send,fake,layout}.ts` and tests | new | transport interface, Brevo, process wide send, fake, layout | M0.5a |
| `src/server/urls.ts`, `urls.test.ts` | new | `absoluteUrl`, `inviteUrl`, `resetPasswordUrl` | M0.5a |
| `src/server/email/templates/shared.ts`, ten builders, `index.ts`, `test-harness.ts`, `onboarding.test.ts` | new | people and account templates | M0.5b |
| `src/server/email/templates/` eleven builders, `deals.test.ts`, `index.test.ts`, `index.ts` replaced | new | deal, extension, document, manager templates | M0.5c |

## Conventions for every task

- **Branch and tree.** Work in the integration worktree `.claude/worktrees/portal-build` on `feat/portal-build`. Paths in `git add` are relative to the worktree root, so they start with `apps/portal/`.
- **Failing test first.** Each task creates its test file, runs it, sees the stated failure, then implements.
- **Gate A.** Each task ends by running Gate A. The three fast commands are inline in each task. The full block, including the build lock and the dash and path checks, is in `docs/partner-portal/BUILD-HANDOFF.md`, section "The loop for every task", item 5; run it as written. At this point in Wave 0, W0-a to W0-d are done, so all four commands can run in every task of this plan.
- **Gate B.** After Gate A, a fresh subagent that did not write the code reviews the diff with the handoff checklist (tenant scoping, `assertCan`, Zod at boundaries, no `any`, typed errors, secrets never logged, dashes, scope). Fix every finding, re-run Gate A, and write the result in the `done` line.
- **Progress log.** First step of each task and last step before the commit message: append one line with a single `printf` to `/Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md`, as in the handoff.
- **Commit.** Stage by explicit path, never `git add -A` or `git add .`. Include this plan file so the task's checkboxes are ticked in the same commit. Message `feat(portal): <task id> <summary>`, no attribution lines.
- **No dashes.** No em-dash or en-dash anywhere: code, comments, copy, commit messages.
- **Test database.** Tests that touch the database use `testDb()`, `resetDb()`, `makePartner`, `makeUser`, `makeRegistration` and `viewerFor` from `src/db/test-helpers.ts` (contracts J.3). `makeUser(db, { password })` inserts a `credential` row in `auth_account` hashed with `hashPassword`.

Gate A fast commands (used in every task):

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
```

Expected: `lint` ends with `Checked N files in Nms. No fixes applied.` and exit 0; `typecheck` prints nothing and exits 0; `test` ends with `Test Files  N passed (N)` and `Tests  N passed (N)`. The full Gate A also runs `pnpm --filter @cleanstart/portal build` (exit 0) and the dash and path checks (the dash grep prints nothing; `git diff --name-only feat/portal-build` lists only this task's files).

---

## Tasks

### Task M0.7: Auth spike and decision gate (W0-e)

The spike is a vitest file with one test per checklist item, a script that runs it and prints a verdict, and a written result. Better Auth is kept only if S1 to S5 and S7 pass. S6 (Google and Microsoft) checks configuration only, because signing in needs dev OAuth apps, so a pass is recorded as `PROVISIONAL (OAuth unverified)`. If the gate fails, do Task M0.7-F: it replaces Task M1.1c and changes only the places it names in the other tasks. Write the failure in `AUTH-SPIKE.md`.

The checklist:

| Item | Pass when |
|---|---|
| S1 | Better Auth initialises against `users` and the `auth_*` tables with no schema mismatch, and the session id it creates is a Postgres generated uuid |
| S2 | A user with a scrypt credential row signs in (upper case email too); a wrong password gets `INVALID_EMAIL_OR_PASSWORD`; the API sign up is refused and creates no user |
| S3 | The second step: TOTP enable, verify, sign in returns `twoFactorRedirect` with no session, a wrong code is refused, a right code creates the session, a backup code works once and not twice |
| S4 | Database sessions and `getViewer`: viewer fields for a partner and a staff user; null with no cookie, for a disabled user, for a suspended company, after the session row is deleted |
| S5 | Password reset: the token reaches the mail bridge, sets the new password, revokes sessions; an unknown address gets the same answer |
| S6 | Google and Microsoft are configured only from env, never create users, and link by verified email only (config checks) |
| S7 | Importing the auth module builds nothing, so `next build` works with no secrets |

**Files:**
- Create: `apps/portal/src/server/auth/passwords.ts`, `apps/portal/src/server/auth/auth.ts`, `apps/portal/src/server/auth/auth-mail.ts`, `apps/portal/src/server/auth/viewer.ts`, `apps/portal/src/server/auth/test-totp.ts`, `apps/portal/src/app/api/auth/[...all]/route.ts`, `apps/portal/src/lib/auth-client.ts`, `apps/portal/scripts/auth-spike-gate.ts`, `docs/partner-portal/AUTH-SPIKE.md`
- Modify: `apps/portal/src/db/test-helpers.ts`, `apps/portal/src/db/fixtures.ts`, `apps/portal/src/db/fixtures.test.ts`, `apps/portal/scripts/seed-dev.ts` (passwords, Step 6b), `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md`
- Test: `apps/portal/src/server/auth/auth.spike.test.ts`

- [ ] **Step 1: Log the start and check the install**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.7 | started | W0 | - | - | auth spike" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
pnpm --filter @cleanstart/portal list better-auth drizzle-orm drizzle-kit vitest zod --depth 0
pnpm --filter @cleanstart/portal exec tsx --version
```

Expected: `better-auth 1.7.x`, `drizzle-orm 0.45.x`, `drizzle-kit 0.31.x`, `vitest`, `zod 3.x` listed, and a `tsx` version printed (the `db:migrate` and `db:seed` scripts already need it). This plan was verified against better-auth 1.7.22. If the minor version is not 1.7, stop and re-run Step 8 and Step 10 before trusting any later step; a different minor may change option names. If `better-auth` is missing, the orchestrator adds it (W0-a owns `package.json`); log `blocked`.

- [ ] **Step 2: Verify the three library facts that change the schema and the build**

Verify: the schema check, the lazy construction and the two-factor columns, using the installed version.

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
grep -n "verified\|failedVerificationCount\|lockedUntil" apps/portal/node_modules/better-auth/dist/plugins/two-factor/schema.mjs
grep -n "default secret\|BETTER_AUTH_SECRET is missing" apps/portal/node_modules/better-auth/dist/context/create-context.mjs
```

Expected: the first prints the three field definitions (`verified`, `failedVerificationCount`, `lockedUntil`); the second prints the `validateSecret` lines that throw. If the first prints fewer fields, the installed version differs from 1.7.22: drop the column that is missing from the schema, as Step 5 describes. If the second prints nothing, the secret check moved; keep the lazy `getAuth()` anyway.

- [ ] **Step 3: Write the spike test (fails first)**

Create `apps/portal/src/server/auth/test-totp.ts`:

```ts
import { createHmac } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** The key bytes behind the base32 `secret` parameter of an otpauth:// URI. */
export const base32Decode = (encoded: string): Buffer => {
  let bits = '';
  for (const char of encoded.replace(/=+$/, '').toUpperCase()) {
    const value = BASE32.indexOf(char);
    if (value < 0) throw new Error(`not base32: ${char}`);
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

/** RFC 6238 code (HMAC-SHA1, 30 second step, 6 digits) for an otpauth:// URI. Tests only. */
export const totpCode = (totpUri: string, at: Date = new Date()): string => {
  const secret = new URL(totpUri).searchParams.get('secret');
  if (!secret) throw new Error('the otpauth URI has no secret');
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(at.getTime() / 1000 / 30)));
  const digest = createHmac('sha1', base32Decode(secret)).update(counter).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0xf;
  const binary =
    (((digest[offset] ?? 0) & 0x7f) << 24) |
    (((digest[offset + 1] ?? 0) & 0xff) << 16) |
    (((digest[offset + 2] ?? 0) & 0xff) << 8) |
    ((digest[offset + 3] ?? 0) & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
};
```

Create `apps/portal/src/server/auth/auth.spike.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authSessions, partners, users } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth, buildSocialProviders } from './auth';
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

  it('S6 Google and Microsoft: configured only from env, never create users, link by verified email only', () => {
    expect(buildSocialProviders({ MICROSOFT_TENANT_ID: 'common' })).toEqual({});
    const google = buildSocialProviders({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret', MICROSOFT_TENANT_ID: 'common' });
    expect(google.google?.disableSignUp).toBe(true);
    expect(google.microsoft).toBeUndefined();
    const microsoft = buildSocialProviders({
      MICROSOFT_CLIENT_ID: 'id',
      MICROSOFT_CLIENT_SECRET: 'secret',
      MICROSOFT_TENANT_ID: 'tenant-1',
    });
    expect(microsoft.microsoft?.disableSignUp).toBe(true);
    expect(microsoft.microsoft?.tenantId).toBe('tenant-1');
    const mapped = microsoft.microsoft?.mapProfileToUser;
    expect(mapped?.({ xms_edov: true } as never)).toEqual({ emailVerified: true });
    expect(mapped?.({} as never)).toEqual({ emailVerified: false });
    expect(auth.options.account?.accountLinking).toMatchObject({ enabled: true, allowDifferentEmails: false });
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
```

- [ ] **Step 4: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/auth.spike.test.ts
```

Expected: FAIL with `Failed to resolve import "./auth"` (the module does not exist yet).

- [ ] **Step 5: Check the three `auth_two_factor` columns (already in the schema and in `0000_init`)**

Better Auth 1.7 refuses to start unless `auth_two_factor` has `verified`, `failed_verification_count` and `locked_until`. They are part of the contracts' C.1 and therefore of `src/db/schema.ts` and `drizzle/0000_init.sql` since W0-b (integration review: there is no `0001` migration). If W0-b formatted the table differently, that is fine; check that the columns are there:

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
grep -nE "verified|failedVerificationCount|lockedUntil" apps/portal/src/db/schema.ts
grep -nE '"verified"|"failed_verification_count"|"locked_until"' apps/portal/drizzle/0000_init.sql
```

Expected: three hits in each file (the `schema.ts` hits for `verified` may include other lines such as `emailVerified`; the three `auth_two_factor` ones are inside `authTwoFactors`). If the installed Better Auth needs a different set (Step 2 printed it), edit `schema.ts`, delete `drizzle/0000_init.sql` and `drizzle/meta`, run `pnpm --filter @cleanstart/portal exec drizzle-kit generate --name init`, put the `CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint` line back at the top, and run `scripts/db-create.sh <name> --recreate` for each of this worktree's databases (the Drizzle migrator re-applies a changed first migration). Wave 0 owns the schema until the `portal-w0` tag and no database holds data yet, so this is allowed (contracts M.1 items 2 and 3). Record the change in the progress log and in the contracts' C.1.

- [ ] **Step 6: Create the password hashing module**

Create `apps/portal/src/server/auth/passwords.ts` (if W0-b created a stub with these two function names, replace it):

```ts
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 16;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEMORY = 64 * 1024 * 1024;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, length: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, { N: n, r, p, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(input: { hash: string; password: string }): Promise<boolean> {
  const parts = input.hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, saltB64, keyB64] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0) || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  try {
    const actual = await derive(input.password, Buffer.from(saltB64, 'base64'), n, r, p, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    // scrypt rejects parameters that are not valid (N must be a power of two): a broken hash never verifies.
    return false;
  }
}
```

- [ ] **Step 6b: Add passwords to the W0-b helpers and the dev seed**

The spike test and every later auth test call `makeUser(db, { password })`, and the manual checks sign in as a seeded user with `DEV_SEED_PASSWORD`. W0-b could not provide either because `hashPassword` did not exist yet (contracts J.3 and J.5); this step adds them. It edits W0-b files, which Wave 0 allows (single owner: this step).

(a) `apps/portal/src/db/test-helpers.ts`. Add `authAccounts` to the `@/db/schema` import list and add `import { hashPassword } from '@/server/auth/passwords';` next to the other `@/server` import. Then apply these two edits. Find:

```ts
  region?: StaffRegion;
  hubspotContactId?: string | null;
}

/**
 * Defaults to a partner user, role 'partner_admin', status 'active', unique email.
```

Replace with:

```ts
  region?: StaffRegion;
  /** Inserts a Better Auth credential account hashed with hashPassword (added by M0.7). */
  password?: string;
  hubspotContactId?: string | null;
}

/**
 * Defaults to a partner user, role 'partner_admin', status 'active', unique email.
```

Find:

```ts
  if (kind === 'staff') await database.insert(staffScopes).values({ userId: user.id, region: input.region ?? 'all' });
  return user;
```

Replace with:

```ts
  if (kind === 'staff') await database.insert(staffScopes).values({ userId: user.id, region: input.region ?? 'all' });
  if (input.password !== undefined) {
    await database
      .insert(authAccounts)
      .values({ userId: user.id, providerId: 'credential', accountId: user.id, password: await hashPassword(input.password) });
  }
  return user;
```

(b) `apps/portal/src/db/fixtures.ts`. Change `import { sql } from 'drizzle-orm';` to `import { eq, sql } from 'drizzle-orm';` and add `authAccounts,` after `auditLog,` in the `@/db/schema` import. Find:

```ts
export interface SeedOptions {
  clock: Clock;
}
```

Replace with:

```ts
export interface SeedOptions {
  clock: Clock;
  /** A scrypt hash from hashPassword. When given, every active seeded user gets a credential login with it. */
  passwordHash?: string;
}
```

Find (the line that starts the row counts at the end of `seedMockData`):

```ts
  const count = async (table: string): Promise<number> =>
```

Replace with (keep the rest of that line as it is, it continues after `=>`):

```ts
  if (opts.passwordHash !== undefined) {
    const active = await db.select({ id: users.id }).from(users).where(eq(users.status, 'active'));
    if (active.length > 0) {
      await db.insert(authAccounts).values(active.map((user) => ({ userId: user.id, providerId: 'credential', accountId: user.id, password: opts.passwordHash })));
    }
  }

  const count = async (table: string): Promise<number> =>
```

Find the last function of the file and replace it:

```ts
export async function seedDevDatabase(db: Db, clock: Clock): Promise<SeedSummary> {
```

with `export async function seedDevDatabase(db: Db, clock: Clock, passwordHash?: string): Promise<SeedSummary> {`, and its last line `  return seedMockData(db, { clock });` with `  return seedMockData(db, { clock, ...(passwordHash === undefined ? {} : { passwordHash }) });`.

(c) Replace `apps/portal/scripts/seed-dev.ts` with:

```ts
import { db, pool } from '@/db/client';
import { DEV_SEED_PASSWORD, seedDevDatabase } from '@/db/fixtures';
import { systemClock } from '@/lib/clock';
import { hashPassword } from '@/server/auth/passwords';

hashPassword(DEV_SEED_PASSWORD)
  .then((passwordHash) => seedDevDatabase(db, systemClock, passwordHash))
  .then((summary) => console.info('seeded the mock data', summary))
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
```

(d) Add a test. In `apps/portal/src/db/fixtures.test.ts` add `import { authAccounts, users } from '@/db/schema';`, `import { eq } from 'drizzle-orm';` and `import { hashPassword } from '@/server/auth/passwords';` to the imports (merge with existing lines for the same modules) and append at the end of the file:

```ts
describe('seedMockData with a password hash', () => {
  it('gives every active user one credential login and the invited users none', async () => {
    await resetDb();
    await seedMockData(testDb(), { clock, passwordHash: await hashPassword('Portal-dev-2026!') });
    const accounts = await testDb().select({ userId: authAccounts.userId, providerId: authAccounts.providerId }).from(authAccounts);
    const active = await testDb().select({ id: users.id }).from(users).where(eq(users.status, 'active'));
    expect(accounts).toHaveLength(active.length);
    expect(new Set(accounts.map((account) => account.providerId))).toEqual(new Set(['credential']));
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/db/fixtures.test.ts`. Expected: PASS, one test more than before (the previous total was 10 in plan 01 Step 21).

- [ ] **Step 7: Create the mail bridge**

Better Auth must call something when it needs to send a reset link, but the email module is built later (Task M0.5). This file is the seam: it only logs, never logs the token, and Task M0.5d replaces both bodies. Create `apps/portal/src/server/auth/auth-mail.ts`:

```ts
import { log } from '@/server/log';

export interface PasswordResetMail {
  to: { email: string; name: string };
  token: string;
  expiresInMinutes: number;
}

export interface PasswordChangedMail {
  to: { email: string; name: string };
  changedAt: Date;
}

/**
 * Wave 0 bridge. Better Auth calls these two functions; the email module arrives in task M0.5, which replaces
 * both bodies with the real sends. Until then they only log, and never log the token.
 */
export async function sendPasswordResetEmail(input: PasswordResetMail): Promise<void> {
  log.info({ expiresInMinutes: input.expiresInMinutes }, 'password reset requested, email module not wired yet');
}

export async function sendPasswordChangedEmail(input: PasswordChangedMail): Promise<void> {
  log.info({ changedAt: input.changedAt.toISOString() }, 'password changed, email module not wired yet');
}
```

- [ ] **Step 8: Create the Better Auth instance**

Create `apps/portal/src/server/auth/auth.ts`. The options that matter: `generateId: false` (Postgres makes ids), the `additionalFields` for the four portal columns, scrypt functions, `disableSignUp: true` (accounts exist only through `acceptInvite`), `disableSignUp: true` on both social providers (a Google or Microsoft identity signs in an existing user, it never creates one), `trustedProviders: []` with `allowDifferentEmails: false` (link only by a provider verified email), `revokeSessionsOnPasswordReset: true`, and the lazy `getAuth()`.

```ts
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
```

- [ ] **Step 9: Create the route handler, the browser client and the viewer**

Create `apps/portal/src/app/api/auth/[...all]/route.ts`:

```ts
import { getAuth } from '@/server/auth/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return getAuth().handler(request);
}

export async function POST(request: Request): Promise<Response> {
  return getAuth().handler(request);
}
```

Create `apps/portal/src/lib/auth-client.ts`:

```ts
import { twoFactorClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/** Browser side Better Auth client. Same origin, so it needs no baseURL. */
export const authClient = createAuthClient({ plugins: [twoFactorClient()] });
```

Create `apps/portal/src/server/auth/viewer.ts`. `loadViewer` reads the user from the database on every call, never from the session payload, so a role change, a removal or a suspension applies on the next request. This first version has only the lookup; Task M1.1d adds the guards.

```ts
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { cache } from 'react';
import { db } from '@/db/client';
import { partners, staffScopes, users } from '@/db/schema';
import { isOneOf, PARTNER_ROLES, STAFF_ROLES } from '@/lib/domain';
import { log } from '@/server/log';
import { getAuth } from './auth';
import type { Viewer } from './types';

/**
 * Builds the viewer for a user id from the database, never from the session payload, so a role change, a removal
 * or a suspension takes effect on the next request. Null for a user who is not active, a suspended partner and
 * any row that breaks the users table invariants.
 */
export async function loadViewer(userId: string): Promise<Viewer | null> {
  const [row] = await db
    .select({
      user: users,
      partnerName: partners.name,
      partnerStatus: partners.status,
      staffRegion: staffScopes.region,
    })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.user.status !== 'active') return null;

  const { user } = row;
  const base = { id: user.id, email: user.email, name: user.name };
  if (user.kind === 'partner') {
    if (!user.partnerId || row.partnerName === null || !isOneOf(PARTNER_ROLES, user.role)) {
      log.error({ userId }, 'partner user row breaks the users table invariants');
      return null;
    }
    if (row.partnerStatus === 'suspended') return null;
    return { ...base, kind: 'partner', role: user.role, partnerId: user.partnerId, partnerName: row.partnerName };
  }
  if (!isOneOf(STAFF_ROLES, user.role) || row.staffRegion === null) {
    log.error({ userId }, 'staff user row has no valid role or staff_scopes row');
    return null;
  }
  return { ...base, kind: 'staff', role: user.role, partnerId: null, partnerName: null, region: row.staffRegion };
}

/** The viewer for the session cookie in `requestHeaders`, or null. Testable without a Next request scope. */
export async function viewerFromHeaders(requestHeaders: Headers): Promise<Viewer | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session ? loadViewer(session.user.id) : null;
}

/** The signed-in viewer for this request, or null. Cached per request, so layouts and pages share one lookup. */
export const getViewer = cache(async (): Promise<Viewer | null> => viewerFromHeaders(await headers()));
```

- [ ] **Step 10: Run the spike and see it pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/auth.spike.test.ts
```

Expected: `Test Files  1 passed (1)`, `Tests  7 passed (7)`. Better Auth prints a few `WARN [Better Auth]: Invalid password` and `User not found` lines to stderr; those are the refusals the tests provoke and are not failures.

- [ ] **Step 11: Create the gate script and run it**

Create `apps/portal/scripts/auth-spike-gate.ts`:

```ts
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * M0.7 decision gate. Runs the S1 to S7 spike tests and prints one line per item and a verdict.
 * Exit 0: keep Better Auth. Exit 1: take the Auth.js v5 fallback (plan task M0.7-F).
 * Run: pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts
 */
const SPIKE_FILE = 'src/server/auth/auth.spike.test.ts';
/** S6 only checks the OAuth configuration. Signing in with Google or Microsoft needs a dev OAuth app. */
const CONFIG_ONLY = 'S6';

interface Assertion {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
}
interface Report {
  testResults: Array<{ assertionResults: Assertion[]; message?: string }>;
}

const vitestEntry = join(dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs');
const outputFile = join(tmpdir(), `auth-spike-${process.pid}.json`);
const run = spawnSync(
  process.execPath,
  [vitestEntry, 'run', SPIKE_FILE, '--reporter=json', `--outputFile=${outputFile}`],
  { stdio: ['ignore', 'ignore', 'inherit'], env: process.env },
);

let report: Report;
try {
  report = JSON.parse(readFileSync(outputFile, 'utf8')) as Report;
} catch {
  console.error(`DECISION: authjs-v5 (the spike did not run, exit code ${run.status ?? 'none'})`);
  process.exit(1);
}

const items = report.testResults.flatMap((file) => file.assertionResults);
let failed = items.length === 0;
for (const item of items) {
  const id = item.title.split(' ')[0] ?? '?';
  const ok = item.status === 'passed';
  if (!ok && id !== CONFIG_ONLY) failed = true;
  console.info(`${ok ? 'pass' : 'FAIL'}  ${item.title}`);
}

if (failed) {
  console.info('DECISION: authjs-v5. Follow task M0.7-F.');
  process.exit(1);
}
console.info('DECISION: better-auth. Result: PROVISIONAL (OAuth unverified). Record it in AUTH-SPIKE.md.');
```

```bash
pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts; echo "exit=$?"
```

Expected output (the checklist order is the test order):

```text
pass  S1 Better Auth runs on the users table and the auth_* tables, ids come from Postgres
pass  S2 email and password: scrypt credentials sign in, wrong passwords and sign up are refused
pass  S3 second step: authenticator app code, then a single use backup code
pass  S4 database sessions and getViewer: kind, role, company, region; revoked, disabled and suspended are null
pass  S5 password reset: the token reaches the mail bridge, sets a new password, revokes sessions
pass  S6 Google and Microsoft: configured only from env, never create users, link by verified email only
pass  S7 importing the auth module builds nothing, so next build works without secrets
DECISION: better-auth. Result: PROVISIONAL (OAuth unverified). Record it in AUTH-SPIKE.md.
exit=0
```

**Decision gate.** `exit=0`: continue with Step 12. Any `FAIL` on S1 to S5 or S7, or `DECISION: authjs-v5`, `exit=1`: do not continue with this task. Run Task M0.7-F, and write the failing item and the error text in `docs/partner-portal/AUTH-SPIKE.md` using the "Failed" text in Step 12.

- [ ] **Step 12: Write the result file**

Create `docs/partner-portal/AUTH-SPIKE.md` (pass case):

```md
# Auth spike (M0.7)

## Result

Decision: **Better Auth 1.7.x** (`better-auth` with its Drizzle adapter). Status: **PROVISIONAL (OAuth unverified)**.

S1 to S5 and S7 pass in `apps/portal/src/server/auth/auth.spike.test.ts`; run the gate with
`pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts`. S6 checks the Google and Microsoft
configuration only. Signing in with either needs a dev OAuth app, which an unattended run cannot create.

## Checklist

| Item | What it proves | Result |
|---|---|---|
| S1 | runs on `users` and `auth_*`; Postgres generates ids | pass |
| S2 | scrypt credentials sign in; wrong password and API sign up refused | pass |
| S3 | authenticator app second step and single use backup codes | pass |
| S4 | database sessions and `getViewer` (revoked, disabled, suspended are null) | pass |
| S5 | password reset through the mail bridge, sessions revoked | pass |
| S6 | Google and Microsoft config: env only, no sign up, link by verified email | pass (config only) |
| S7 | no construction at import, so `next build` needs no secrets | pass |

## What the spike found

1. `auth_two_factor` needs `verified`, `failed_verification_count` and `locked_until` (in the schema and `0000_init` from W0-b on). Better Auth 1.7 refuses to start on a schema mismatch.
2. Better Auth throws when constructed without a secret, so `getAuth()` builds it on first use and `auth` is a lazy proxy.
3. Second step: authenticator app (TOTP) with 10 backup codes, as in the mock. The same plugin also offers an email code (`method: 'otp'`). To switch: pass `otpOptions: { sendOTP }` to `twoFactor()` in `auth.ts`, send the code with a new template, and change the Sign in and Account copy to "Email code". The product owner confirms which; the proposal lists "optional or required" as open.
4. Backup codes are `XXXXX-XXXXX`, letters and digits, case sensitive. The Sign in screen accepts them with or without the hyphen or a space.
5. Enabling the second step returns the otpauth URI and the backup codes before the code is verified; the factor is active only after `verifyTOTP`.
6. Microsoft sends no `email_verified`. `auth.ts` maps it from the `xms_edov` claim. **The Entra app registration must add the optional claims `email` and `xms_edov` (ID token).** Without them a Microsoft sign in cannot link to a user, which fails closed.
7. Linking a social login needs `users.email_verified = true`. `acceptInvite` sets it.
8. Reset links are built by the portal (`/reset-password?token=...`); the page calls `authClient.resetPassword({ newPassword, token })`.

## What a person must do

1. Google: create an OAuth client, authorised redirect URI `<APP_URL>/api/auth/callback/google`; set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
2. Microsoft: create an Entra app registration, redirect URI `<APP_URL>/api/auth/callback/microsoft`, add the optional claims above; set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` and `MICROSOFT_TENANT_ID`.
3. Sign in once with each as a seeded, active partner user whose email matches. Then change the status above to VERIFIED.
```

Failed case (use instead only if the gate failed): the same file with `Decision: **Auth.js v5**`, `Status: FALLBACK TAKEN`, the failing item and its error text under "Result", and the Auth.js facts from the top of this plan under "What the spike found".

- [ ] **Step 13: Record the decision in the master plan**

Edit `docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md`. Find:

```text
Task 0.7 is a one day spike with Auth.js v5 as the fallback. | Costly after Phase 1 |
```

Replace with:

```text
Task 0.7 is a one day spike with Auth.js v5 as the fallback. **Spike result: Better Auth kept, PROVISIONAL (OAuth unverified); second step is an authenticator app with backup codes, see docs/partner-portal/AUTH-SPIKE.md.** | Costly after Phase 1 |
```

(Failed case: `**Spike result: Auth.js v5, Better Auth failed item S<n>, see docs/partner-portal/AUTH-SPIKE.md.**`.)

- [ ] **Step 14: Run Gate A**

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
```

Expected: all exit 0; `test` includes `src/server/auth/auth.spike.test.ts (7 tests)`. Then run the full Gate A block from the handoff (build, dash check, path check). The files in `git diff --name-only feat/portal-build` must be those in this task's Files block.

- [ ] **Step 15: Gate B, commit, log**

Gate B as in Conventions. Then:

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/auth/passwords.ts apps/portal/src/server/auth/auth.ts apps/portal/src/server/auth/auth-mail.ts apps/portal/src/server/auth/viewer.ts apps/portal/src/server/auth/test-totp.ts apps/portal/src/server/auth/auth.spike.test.ts apps/portal/src/app/api/auth apps/portal/src/lib/auth-client.ts apps/portal/scripts/auth-spike-gate.ts apps/portal/src/db/test-helpers.ts apps/portal/src/db/fixtures.ts apps/portal/src/db/fixtures.test.ts apps/portal/scripts/seed-dev.ts docs/partner-portal/AUTH-SPIKE.md docs/superpowers/plans/2026-11-11-partner-portal-master-plan.md docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M0.7 auth spike, Better Auth kept (OAuth unverified)"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.7 | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | Better Auth kept, PROVISIONAL (OAuth unverified)" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.7-F: Auth.js v5 fallback (only if the Task M0.7 gate failed)

Skip this whole task when `DECISION: better-auth` was printed. It replaces the engine behind the same public surface (`getViewer`, the guards, `auth_session`, `auth_two_factor`) so Tasks M1.1a, M1.1b and M1.1d to M1.1g stay as written, except where this task says a file changes. Task M1.1c (Better Auth hooks) is replaced by Step 8 below.

The design follows from the verified Auth.js behaviour: Credentials always yields a JWT cookie, so the portal keeps the JWT as the browser credential and adds a **session row** (`auth_session`) whose id is stored in the JWT as `sid`. `getViewer` accepts a JWT only while its row exists and is unexpired, so revoking a session (delete the row) is immediate. Auth.js runs without an adapter; Google and Microsoft sign in are matched to existing users by a verified email in the `signIn` callback. Password reset, TOTP and backup codes are written in the portal (Better Auth gave them for free).

**Files:**
- Modify: `apps/portal/package.json` (orchestrator), `apps/portal/src/server/auth/auth.ts`, `apps/portal/src/server/auth/viewer.ts`, `apps/portal/src/server/auth/sessions.ts` (when M1.1d is reached), `apps/portal/src/lib/auth-client.ts`, `apps/portal/src/components/screens/SignIn.tsx` (the calls in Task M1.1g), `apps/portal/src/proxy.ts` (cookie name)
- Create: `apps/portal/src/server/auth/totp.ts`, `apps/portal/src/server/auth/second-step.ts`, `apps/portal/src/server/auth/reset.ts`, `apps/portal/src/app/api/auth/[...nextauth]/route.ts` and four small route handlers under `apps/portal/src/app/api/auth/`
- Test: one test file per new module, plus `auth.spike.test.ts` rewritten against Auth.js

- [ ] **Step 1: Swap the packages (orchestrator, blocked rule)**

The handoff forbids a track from editing `package.json`. Log `blocked` with this exact need, and the orchestrator runs:

```bash
pnpm --filter @cleanstart/portal remove better-auth
pnpm --filter @cleanstart/portal add next-auth@5.0.0-beta.32
```

Verify: that the installed core still has no database session for credentials.

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
grep -n "only supported if JWT strategy is enabled" apps/portal/node_modules/next-auth/node_modules/@auth/core/lib/actions/callback/index.js
```

Expected: one line. If `next-auth` hoists `@auth/core` elsewhere, use `find apps/portal/node_modules -path '*@auth/core/lib/actions/callback/index.js'`. If the line is gone, a newer Auth.js supports credential database sessions: read its release notes, and use its database strategy instead of the `sid` row in Step 4, keeping the rest.

- [ ] **Step 2: TOTP and backup codes (test first)**

Create `apps/portal/src/server/auth/totp.test.ts` with these cases, then run it and see it fail on the missing module: `generateTotpSecret()` returns 32 base32 characters; `totpUri({ secret, email })` starts with `otpauth://totp/CleanStart%20Partner%20Portal:` and carries the secret and `issuer`; `verifyTotp({ secret, code, now })` accepts the current code and one step either side, rejects two steps away, rejects a non digit code; `generateBackupCodes()` returns 10 codes of the form `XXXXX-XXXXX`; `verifyBackupCode({ stored, code })` returns the list without the used code, and `null` for an unknown or already used code. The expected codes in the test come from `totpCode` in `test-totp.ts` (Task M0.7), which is an independent RFC 6238 implementation.

Create `apps/portal/src/server/auth/totp.ts`:

```ts
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const ISSUER = 'CleanStart Partner Portal';
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const base32Encode = (bytes: Buffer): string => {
  let bits = '';
  for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += BASE32[Number.parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
};

const base32Decode = (encoded: string): Buffer => {
  let bits = '';
  for (const char of encoded) bits += BASE32.indexOf(char).toString(2).padStart(5, '0');
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
};

const hotp = (key: Buffer, counter: number): string => {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', key).update(buffer).digest();
  const offset = (digest[digest.length - 1] ?? 0) & 0xf;
  const binary = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(binary).padStart(6, '0');
};

export const generateTotpSecret = (): string => base32Encode(randomBytes(20)).slice(0, 32);

export const totpUri = (input: { secret: string; email: string }): string =>
  `otpauth://totp/${encodeURIComponent(ISSUER)}:${encodeURIComponent(input.email)}?secret=${input.secret}&issuer=${encodeURIComponent(ISSUER)}`;

/** Accepts the current code and one step either side, for clock drift. `now` is passed in, so tests need no timers. */
export function verifyTotp(input: { secret: string; code: string; now: Date }): boolean {
  if (!/^\d{6}$/.test(input.code)) return false;
  const counter = Math.floor(input.now.getTime() / 1000 / STEP_SECONDS);
  const key = base32Decode(input.secret);
  return [-1, 0, 1].some((drift) => {
    const expected = Buffer.from(hotp(key, counter + drift));
    const actual = Buffer.from(input.code);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  });
}

export function generateBackupCodes(): string[] {
  return Array.from({ length: 10 }, () => {
    const raw = Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

/** Returns the stored codes without the used one, or null when the code is not in the list. */
export function verifyBackupCode(input: { stored: string[]; code: string }): string[] | null {
  return input.stored.includes(input.code) ? input.stored.filter((code) => code !== input.code) : null;
}
```

Run `pnpm --filter @cleanstart/portal exec vitest run src/server/auth/totp.test.ts`. Expected: all cases pass.

- [ ] **Step 3: Second step token and password reset (tests first)**

`second-step.ts` signs a 10 minute token that proves "this person passed the password step" using `encode` and `decode` from `next-auth/jwt` with the salt `second-step` and `AUTH_SECRET`; `beginSecondStep(userId, now)` returns the token, `completeSecondStep(token, now)` returns the user id or null for a tampered or expired token. `reset.ts` writes a hashed single use token into `auth_verification` (`identifier = 'reset:<userId>'`, `value = hashToken(token)`, `expiresAt` one hour on), `consumeResetToken(token, now)` returns the user id and deletes the row, or null. Write `second-step.test.ts` and `reset.test.ts` first (expired, reused and tampered tokens each give null; a second request for the same user replaces the first), run them to see them fail, then implement with `hashToken`, `generateInviteToken` from `tokens.ts` and `db` from `@/db/client`. Run both test files; expected: pass.

- [ ] **Step 4: The Auth.js instance**

Replace `apps/portal/src/server/auth/auth.ts` with an Auth.js v5 config and no adapter:

```ts
import { and, eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';
import { db } from '@/db/client';
import { authAccounts, authSessions, partners, users } from '@/db/schema';
import { env } from '@/env';
import { systemClock } from '@/lib/clock';
import { generateInviteToken } from './tokens';
import { hashPassword, verifyPassword } from './passwords';
import { completeSecondStep } from './second-step';

const SESSION_SECONDS = 30 * 86_400;

/** A dummy hash, so a missing user costs the same time as a wrong password. */
const DUMMY_HASH = await hashPassword('not-a-real-password-0!');

async function mayHoldSession(email: string): Promise<{ id: string; twoFactorEnabled: boolean } | null> {
  const [row] = await db
    .select({ id: users.id, status: users.status, twoFactorEnabled: users.twoFactorEnabled, partnerStatus: partners.status })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row && row.status === 'active' && row.partnerStatus !== 'suspended' ? row : null;
}

export const { handlers, auth: authJs } = NextAuth({
  secret: env.AUTH_SECRET,
  session: { strategy: 'jwt', maxAge: SESSION_SECONDS },
  pages: { signIn: '/sign-in', error: '/sign-in' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, secondStep: {} },
      authorize: async (raw) => {
        const email = String(raw.email ?? '');
        const user = await mayHoldSession(email);
        const [account] = user
          ? await db
              .select()
              .from(authAccounts)
              .where(and(eq(authAccounts.userId, user.id), eq(authAccounts.providerId, 'credential')))
              .limit(1)
          : [];
        const ok = await verifyPassword({ hash: account?.password ?? DUMMY_HASH, password: String(raw.password ?? '') });
        if (!user || !account || !ok) return null;
        if (user.twoFactorEnabled && (await completeSecondStep(String(raw.secondStep ?? ''), systemClock.now())) !== user.id) return null;
        return { id: user.id };
      },
    }),
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })] : []),
    ...(env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
      ? [MicrosoftEntraID({ clientId: env.MICROSOFT_CLIENT_ID, clientSecret: env.MICROSOFT_CLIENT_SECRET, issuer: `https://login.microsoftonline.com/${env.MICROSOFT_TENANT_ID}/v2.0` })]
      : []),
  ],
  callbacks: {
    // Social sign in only for an existing, active user, matched by a verified email. Never creates a user.
    signIn: async ({ account, profile, user }) => {
      if (account?.provider === 'credentials') return true;
      const verified = profile?.email_verified === true || (profile as { xms_edov?: unknown } | undefined)?.xms_edov === true;
      const match = verified && profile?.email ? await mayHoldSession(profile.email) : null;
      if (!match) return false;
      user.id = match.id;
      return true;
    },
    // On sign in, write the session row and keep its id in the JWT. getViewer checks the row on every request.
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user?.id) {
        const [row] = await db
          .insert(authSessions)
          .values({ userId: user.id, token: generateInviteToken().token, expiresAt: new Date(systemClock.now().getTime() + SESSION_SECONDS * 1000) })
          .returning({ id: authSessions.id });
        token.sid = row?.id;
        token.uid = user.id;
        await db.update(users).set({ lastLoginAt: systemClock.now() }).where(eq(users.id, user.id));
      }
      return token;
    },
  },
});
```

Verify: the exact option names of `next-auth@5.0.0-beta.32` (`NextAuth`, the `jwt` callback `trigger: 'signIn'`, `MicrosoftEntraID` taking an `issuer`) by running `pnpm --filter @cleanstart/portal typecheck` after writing the file; the beta renames options between releases, and a type error here is fixed by reading `node_modules/next-auth/index.d.ts` and `providers/microsoft-entra-id.d.ts`, not by guessing. The `await hashPassword` at module top level needs ESM top level await, which Next 16 supports; if the build rejects it, compute the dummy hash lazily inside `authorize`. Write the Auth.js version of the S1 to S5 and S7 checks in `auth.spike.test.ts` (same titles, same assertions on outcomes, calling the Auth.js handlers with `new Request` for sign in and reading the `authjs.session-token` cookie) and make them pass; the gate script is unchanged. S2's "API sign up refused" is true by construction (Auth.js has no sign up), S3 uses `beginSecondStep`, `verifyTotp` and `verifyBackupCode`.

- [ ] **Step 5: `getViewer` and the guards read the Auth.js cookie**

In `apps/portal/src/server/auth/viewer.ts` replace the body of `viewerFromHeaders` with: decode the cookie from `requestHeaders` using `decode` from `next-auth/jwt` (salt and cookie name `authjs.session-token`, or `__Secure-authjs.session-token` on https), reject when it has no `sid`, load the `auth_session` row by id, reject when the row is missing or expired, then `return loadViewer(row.userId)`. Everything else in the file (`loadViewer`, `getViewer`, `homeFor`, the guards) is unchanged. In `apps/portal/src/proxy.ts` replace `getSessionCookie(request)` with a check for either cookie name. Write the viewer tests first (they already exist from Task M1.1d, S4 in the spike): they must pass unchanged except for how the cookie is produced.

- [ ] **Step 6: The sign in client calls**

Auth.js has no browser client with these methods, so add four small route handlers and call them from `SignIn.tsx` and the reset page with `fetch`: `POST /api/auth/step-one` (verifies email and password, returns `{ secondStep: true, token }` when the user has the second step, otherwise signs in), `POST /api/auth/second-step` (verifies a TOTP or backup code against `auth_two_factor` and then signs in with the token), `POST /api/auth/request-reset` (always answers 200, sends `buildPasswordReset`), `POST /api/auth/reset` (validates the password rule with `assertPasswordOk`, consumes the token, updates the `credential` row, deletes the user's sessions). Each handler gets a test first. Replace `apps/portal/src/lib/auth-client.ts` with a small module exporting `signInWithPassword`, `verifySecondStep`, `requestPasswordReset`, `resetPassword` that call these routes, and change the matching calls in Task M1.1g's `SignIn.tsx` edits (G7, G8, G9 and the `authClient.twoFactor` calls) to use them. Rate limit the four routes with `rateLimit` from `@/server/rate-limit` (10 per 60 seconds per IP and 10 per 600 seconds per email on step one).

- [ ] **Step 7: Run the gate again**

```bash
pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts; echo "exit=$?"
```

Expected: `DECISION: better-auth` is not printed any more; the script's verdict line text is fixed, so read the per item `pass` lines: S1 to S5 and S7 must all print `pass`. If one fails after three attempts, stop and log `blocked`: the plan's last option is Clerk or WorkOS, which the product owner ruled out, so the owner decides.

- [ ] **Step 8: Port the hardening of Task M1.1c**

M1.1c's behaviours must hold on Auth.js. Port each as code plus the test from `auth.test.ts` that pins it: a disabled user, invited user, suspended company and unknown address are all answered like a wrong password (already true: `authorize` returns null in every case); per email limits on step one and request reset; the password rule on `reset` (Step 6); `password_changed_at`, the `account.password_changed` audit entry and the changed notice after a reset (in the `reset` route, using `recordAudit` and `sendPasswordChangedEmail`); `last_login_at` (done in the `jwt` callback). Run `auth.test.ts` adapted to call the route handlers; expected: pass.

- [ ] **Step 9: Gate A, Gate B, commit, log**

Run Gate A. Commit with the paths changed in this task and `docs/partner-portal/AUTH-SPIKE.md`, message `feat(portal): M0.7 Auth.js v5 fallback`, and log `done` with the note `Auth.js v5, Better Auth failed S<n>`. Update the plan file's checkboxes in the same commit.

---

### Task M1.1a: Password rule validator and invite tokens (W0-f)

`checkPassword` is the one place the portal password rule lives (8 or more characters, a letter, a number, a special character; decided 11 Nov 2026). It is pure and client safe in `src/lib/password-rules.ts`; `passwords.ts` re-exports it and adds `assertPasswordOk`. `tokens.ts` is the invite and one-time code helper the P track and the email code fallback use.

**Files:**
- Create: `apps/portal/src/lib/password-rules.ts`, `apps/portal/src/server/auth/tokens.ts`
- Modify: `apps/portal/src/server/auth/passwords.ts`
- Test: `apps/portal/src/server/auth/passwords.test.ts`, `apps/portal/src/server/auth/tokens.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1a | started | W0 | - | - | password rule, tokens" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the tests (they fail first)**

Create `apps/portal/src/server/auth/passwords.test.ts`. The 8 rule cases are the M1.1 table. The "same four tests as the mock field" case reads `components/ui/password-field.tsx` as text, because Vitest runs in Node and that file is a React component; it keeps the server rule and the mock field from drifting apart until M5.4 re-points the field at `checkPassword`.

```ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PASSWORD_LETTER,
  PASSWORD_MIN_LENGTH,
  PASSWORD_NUMBER,
  PASSWORD_SPECIAL,
} from '@/lib/password-rules';
import { ValidationError } from '@/server/errors';
import { assertPasswordOk, checkPassword, hashPassword, verifyPassword } from './passwords';

const LABELS = ['At least 8 characters', 'A letter', 'A number', 'A special character'];

/** [password, length, letter, number, special] */
const CASES: Array<[string, boolean, boolean, boolean, boolean]> = [
  ['', false, false, false, false],
  ['abcdefgh', true, true, false, false],
  ['abcdefg1', true, true, true, false],
  ['abcdef1!', true, true, true, true],
  ['Ab1!', false, true, true, true],
  ['12345678!', true, false, true, true],
  ['Abcdefgh!', true, true, false, true],
  ['Correct horse 9', true, true, true, true],
];

describe('checkPassword', () => {
  it.each(CASES)('%j', (password, length, letter, number, special) => {
    const result = checkPassword(password);
    expect(result.rules.map((rule) => rule.label)).toEqual(LABELS);
    expect(result.rules.map((rule) => rule.met)).toEqual([length, letter, number, special]);
    expect(result.ok).toBe(length && letter && number && special);
  });

  it('uses the same four tests as the mock password field', () => {
    const mock = readFileSync(join(process.cwd(), 'src/components/ui/password-field.tsx'), 'utf8');
    expect(mock).toContain(`value.length >= ${PASSWORD_MIN_LENGTH}`);
    for (const pattern of [PASSWORD_LETTER, PASSWORD_NUMBER, PASSWORD_SPECIAL]) {
      expect(mock).toContain(String(pattern));
    }
    for (const label of LABELS) expect(mock).toContain(label);
  });
});

describe('assertPasswordOk', () => {
  it('accepts a password that meets the rule', () => {
    expect(() => assertPasswordOk('abcdef1!')).not.toThrow();
  });

  it('throws a ValidationError on the password path with the rule message', () => {
    try {
      assertPasswordOk('abcdefgh');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).issues).toEqual([{ path: 'password', message: 'Meet all four password rules.' }]);
    }
  });
});

describe('hashPassword and verifyPassword', () => {
  it('round trips, and a different password or a malformed hash fails', async () => {
    const hash = await hashPassword('Sample#Pass1');
    expect(hash).toMatch(/^scrypt\$16384\$16\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(await verifyPassword({ hash, password: 'Sample#Pass1' })).toBe(true);
    expect(await verifyPassword({ hash, password: 'Sample#Pass2' })).toBe(false);
    expect(await verifyPassword({ hash: 'not-a-hash', password: 'Sample#Pass1' })).toBe(false);
    expect(await verifyPassword({ hash: 'scrypt$0$0$0$AAAA$AAAA', password: 'x' })).toBe(false);
    expect(await verifyPassword({ hash: 'scrypt$3$1$1$AAAA$AAAA', password: 'x' })).toBe(false);
  });

  it('salts every hash', async () => {
    expect(await hashPassword('Sample#Pass1')).not.toBe(await hashPassword('Sample#Pass1'));
  });
});
```

Create `apps/portal/src/server/auth/tokens.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  generateInviteToken,
  generateNumericCode,
  hashCode,
  hashToken,
  INVITE_TTL_DAYS,
  inviteExpiresAt,
  inviteState,
  verifyCode,
} from './tokens';

const NOW = new Date('2026-11-12T10:00:00.000Z');
const HOUR = 3_600_000;

describe('invite tokens', () => {
  it('is 32 random bytes as base64url and stores only the SHA-256 hex digest', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toContain(token);
  });

  it('never repeats', () => {
    expect(generateInviteToken().token).not.toBe(generateInviteToken().token);
  });

  it('a changed token hashes to something else', () => {
    const { token, tokenHash } = generateInviteToken();
    expect(hashToken(`${token}x`)).not.toBe(tokenHash);
  });

  it('expires seven days after it is made', () => {
    expect(INVITE_TTL_DAYS).toBe(7);
    expect(inviteExpiresAt(NOW).toISOString()).toBe('2026-11-19T10:00:00.000Z');
  });
});

describe('inviteState', () => {
  const open = { acceptedAt: null, revokedAt: null, expiresAt: new Date(NOW.getTime() + HOUR) };

  it('ok while open and in date', () => {
    expect(inviteState(open, NOW)).toBe('ok');
  });

  it('expired at the expiry instant and after it', () => {
    expect(inviteState({ ...open, expiresAt: NOW }, NOW)).toBe('expired');
    expect(inviteState({ ...open, expiresAt: new Date(NOW.getTime() - HOUR) }, NOW)).toBe('expired');
  });

  it('used once accepted, even if it was also withdrawn or has expired', () => {
    const closed = { ...open, acceptedAt: NOW, revokedAt: NOW, expiresAt: new Date(NOW.getTime() - HOUR) };
    expect(inviteState(closed, NOW)).toBe('used');
  });

  it('revoked when withdrawn, even after it expires', () => {
    expect(inviteState({ ...open, revokedAt: NOW }, NOW)).toBe('revoked');
    expect(inviteState({ ...open, revokedAt: NOW, expiresAt: new Date(NOW.getTime() - HOUR) }, NOW)).toBe('revoked');
  });
});

describe('numeric codes', () => {
  it('is six digits by default and keeps leading zeros', () => {
    for (let i = 0; i < 200; i += 1) expect(generateNumericCode()).toMatch(/^\d{6}$/);
    expect(generateNumericCode(4)).toMatch(/^\d{4}$/);
  });

  it('verifies with the salt it was hashed with and nothing else', () => {
    const expectedHash = hashCode('042913', 'salt-a');
    expect(verifyCode({ code: '042913', salt: 'salt-a', expectedHash })).toBe(true);
    expect(verifyCode({ code: '042914', salt: 'salt-a', expectedHash })).toBe(false);
    expect(verifyCode({ code: '042913', salt: 'salt-b', expectedHash })).toBe(false);
    expect(verifyCode({ code: '042913', salt: 'salt-a', expectedHash: 'abcd' })).toBe(false);
  });
});
```

- [ ] **Step 3: Run them and see them fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/passwords.test.ts src/server/auth/tokens.test.ts
```

Expected: FAIL. `passwords.test.ts` with `Failed to resolve import "@/lib/password-rules"`, `tokens.test.ts` with `Failed to resolve import "./tokens"`.

- [ ] **Step 4: Implement the rule and the tokens**

Create `apps/portal/src/lib/password-rules.ts`:

```ts
export interface PasswordRuleResult {
  label: string;
  met: boolean;
}

export interface PasswordCheck {
  ok: boolean;
  rules: PasswordRuleResult[];
}

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_LETTER = /[A-Za-z]/;
export const PASSWORD_NUMBER = /\d/;
export const PASSWORD_SPECIAL = /[^A-Za-z0-9]/;
export const PASSWORD_RULES_MESSAGE = 'Meet all four password rules.';

/**
 * Portal password rule, decided 11 Nov 2026: 8 or more characters with a letter, a number and a special character.
 * Pure and client safe. The labels are the mock's, in the mock's order.
 */
export function checkPassword(password: string): PasswordCheck {
  const rules: PasswordRuleResult[] = [
    { label: 'At least 8 characters', met: password.length >= PASSWORD_MIN_LENGTH },
    { label: 'A letter', met: PASSWORD_LETTER.test(password) },
    { label: 'A number', met: PASSWORD_NUMBER.test(password) },
    { label: 'A special character', met: PASSWORD_SPECIAL.test(password) },
  ];
  return { ok: rules.every((rule) => rule.met), rules };
}
```

Replace `apps/portal/src/server/auth/passwords.ts` (adds the rule import, the re-export, a guard that a broken stored hash never verifies, and `assertPasswordOk`):

```ts
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { checkPassword, PASSWORD_RULES_MESSAGE } from '@/lib/password-rules';
import { ValidationError } from '@/server/errors';

export { type PasswordCheck, type PasswordRuleResult, checkPassword } from '@/lib/password-rules';

const N = 16384;
const R = 16;
const P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const MAX_MEMORY = 64 * 1024 * 1024;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number, length: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, length, { N: n, r, p, maxmem: MAX_MEMORY }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, N, R, P, KEY_LENGTH);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(input: { hash: string; password: string }): Promise<boolean> {
  const parts = input.hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, nRaw, rRaw, pRaw, saltB64, keyB64] = parts;
  const n = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0) || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  try {
    const actual = await derive(input.password, Buffer.from(saltB64, 'base64'), n, r, p, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    // scrypt rejects parameters that are not valid (N must be a power of two): a broken hash never verifies.
    return false;
  }
}

/** Throws ValidationError with path "password" when the password breaks the rule. */
export function assertPasswordOk(password: string): void {
  if (!checkPassword(password).ok) {
    throw new ValidationError([{ path: 'password', message: PASSWORD_RULES_MESSAGE }], PASSWORD_RULES_MESSAGE);
  }
}
```

Create `apps/portal/src/server/auth/tokens.ts`:

```ts
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import type { InviteState } from '@/lib/dto';

export const INVITE_TTL_DAYS = 7;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;

const DAY_MS = 86_400_000;

/** SHA-256 hex digest. Invite tokens carry 256 bits of randomness, so a fast hash is enough and no salt is needed. */
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/** 32 random bytes, base64url, plus the digest that is stored (invites.token_hash). The clear token is emailed once. */
export function generateInviteToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashToken(token) };
}

export const inviteExpiresAt = (now: Date): Date => new Date(now.getTime() + INVITE_TTL_DAYS * DAY_MS);

/** A used invite stays "used" even if it was also withdrawn; a withdrawn one stays "revoked" after it expires. */
export function inviteState(
  invite: { acceptedAt: Date | null; revokedAt: Date | null; expiresAt: Date },
  now: Date,
): Exclude<InviteState, 'unknown'> {
  if (invite.acceptedAt) return 'used';
  if (invite.revokedAt) return 'revoked';
  return invite.expiresAt.getTime() <= now.getTime() ? 'expired' : 'ok';
}

/** Numeric code from crypto.randomInt, zero padded. For the email one-time code fallback (AUTH-SPIKE.md). */
export function generateNumericCode(digits = 6): string {
  return String(randomInt(0, 10 ** digits)).padStart(digits, '0');
}

export const hashCode = (code: string, salt: string): string =>
  createHash('sha256').update(`${salt}:${code}`).digest('hex');

export function verifyCode(input: { code: string; salt: string; expectedHash: string }): boolean {
  const actual = Buffer.from(hashCode(input.code, input.salt), 'hex');
  const expected = Buffer.from(input.expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
```

- [ ] **Step 5: Run them and see them pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/passwords.test.ts src/server/auth/tokens.test.ts
```

Expected: `Test Files  2 passed (2)`, `Tests  23 passed (23)` (13 in `passwords.test.ts`, 10 in `tokens.test.ts`).

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands from Conventions, then the full Gate A block from the handoff. Expected: all exit 0; the dash grep prints nothing.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/lib/password-rules.ts apps/portal/src/server/auth/passwords.ts apps/portal/src/server/auth/passwords.test.ts apps/portal/src/server/auth/tokens.ts apps/portal/src/server/auth/tokens.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1a password rule validator and invite tokens"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1a | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | checkPassword, assertPasswordOk, tokens" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1b: Policies and the full permission matrix test (W0-f)

`policies.ts` is the contracts' D.2, D.3 and D.4 as one file. The test copies the matrix in D.3 cell for cell, and for every cell asserts the unconditional, own company, own record, own region and self cases, so changing either the table or the rules fails CI until both agree.

**Files:**
- Create: `apps/portal/src/server/auth/policies.ts`
- Test: `apps/portal/src/server/auth/policies.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1b | started | W0 | - | - | policies and matrix test" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the matrix test**

Create `apps/portal/src/server/auth/policies.test.ts`. Every `Action` has a row, every row has six cells in the order partner admin, partner sales, partner technical, staff partner manager, staff sales, staff marketing, and the six cell kinds (`-`, `Y`, `own`, `mine`, `region`, `self`) each get their own assertions.

```ts
import { describe, expect, it } from 'vitest';
import type { StaffRegion } from '@/lib/domain';
import { ForbiddenError } from '@/server/errors';
import { ACTIONS, type Action, allowedActions, assertCan, can } from './policies';
import { type PartnerViewer, type RoleKey, roleKey, type StaffViewer, type Viewer } from './types';

/** Column order of the table in the contracts, section D.3. */
const COLUMNS: readonly RoleKey[] = [
  'partner.partner_admin',
  'partner.sales',
  'partner.technical',
  'staff.partner_manager',
  'staff.sales',
  'staff.marketing',
];

type Cell = '-' | 'Y' | 'own' | 'mine' | 'region' | 'self';

/** PA PS PT SM SS SK, copied cell for cell from the permission matrix in the contracts (D.3). */
const MATRIX: Record<Action, string> = {
  'application.read': '- - - Y - -',
  'application.approve': '- - - Y - -',
  'application.decline': '- - - Y - -',
  'application.reopen': '- - - Y - -',
  'partner.read': 'own own own Y region -',
  'partner.create': '- - - Y - -',
  'partner.update_profile': 'own - - Y - -',
  'partner.change_category': '- - - Y - -',
  'partner.change_manager': '- - - Y - -',
  'partner.suspend': '- - - Y - -',
  'partner.restore': '- - - Y - -',
  'partner.resend_invites': '- - - Y - -',
  'partner.update_checklist': 'own - - - - -',
  'team.read': 'own - - Y - -',
  'team.invite': 'own - - Y - -',
  'team.resend_invite': 'own - - Y - -',
  'team.revoke_invite': 'own - - Y - -',
  'team.change_role': 'own - - Y - -',
  'team.remove': 'own - - Y - -',
  'access_request.decide': 'own - - Y - -',
  'staff.read': '- - - Y - -',
  'staff.invite': '- - - Y - -',
  'staff.resend_invite': '- - - Y - -',
  'staff.change_role': '- - - Y - -',
  'staff.change_region': '- - - Y - -',
  'staff.remove': '- - - Y - -',
  'account.update_profile': 'self self self self self self',
  'account.change_password': 'self self self self self self',
  'account.manage_two_factor': 'self self self self self self',
  'account.manage_sessions': 'self self self self self self',
  'account.update_notifications': 'self self self self self self',
  'registration.create': 'own own - Y - -',
  'registration.read': 'own mine - Y region -',
  'registration.read_queue': '- - - Y Y -',
  'registration.resubmit': 'own mine - - - -',
  'registration.decide': '- - - Y region -',
  'registration.undo_decision': '- - - Y region -',
  'registration.message': 'own mine - Y region -',
  'registration.request_extension': 'own mine - - - -',
  'registration.decide_extension': '- - - Y region -',
  'registration.lookup_customer': 'Y Y - - - -',
  'manager.message': 'Y Y Y - - -',
  'overview.read': 'Y Y - - - -',
  'report.read': '- - - Y Y -',
  'document.read': 'Y Y Y Y Y Y',
  'document.open': 'Y Y Y Y Y Y',
  'document.upload': '- - - Y - Y',
  'document.replace': '- - - Y - Y',
  'document.edit': '- - - Y - Y',
  'document.delete': '- - - Y - Y',
  'document.read_stats': '- - - Y - Y',
  'document.request_material': 'Y Y Y - - -',
  'audit.read': '- - - Y - -',
  'audit.export': '- - - Y - -',
  'search.use': 'Y Y Y Y Y Y',
  'notification.read': 'Y Y Y Y Y Y',
  'integration.read_health': '- - - Y - -',
  'integration.retry_failed': '- - - Y - -',
};

const OWN_PARTNER = 'partner-own';
const OTHER_PARTNER = 'partner-other';

const viewerOf = (key: RoleKey, region: StaffRegion = 'india'): Viewer => {
  const [kind, role] = key.split('.') as ['partner' | 'staff', string];
  const base = { id: `user-${key}`, email: `${role}@example.com`, name: role };
  if (kind === 'partner') {
    return { ...base, kind, role, partnerId: OWN_PARTNER, partnerName: 'Own Partner' } as PartnerViewer;
  }
  return { ...base, kind, role, partnerId: null, partnerName: null, region } as StaffViewer;
};

const cellsOf = (action: Action): Cell[] => MATRIX[action].split(' ') as Cell[];

describe('permission matrix', () => {
  it('has a row for every action and no row for an action that does not exist', () => {
    expect(Object.keys(MATRIX).sort()).toEqual([...ACTIONS].sort());
  });

  it('has one cell per role in every row', () => {
    for (const action of ACTIONS) expect(cellsOf(action), action).toHaveLength(COLUMNS.length);
  });

  describe.each(ACTIONS)('%s', (action) => {
    it.each(COLUMNS.map((key, index) => [key, index] as const))('%s', (key, index) => {
      const cell = cellsOf(action)[index];
      const viewer = viewerOf(key);
      const wideStaff = viewerOf(key, 'all');
      const otherRegionStaff = viewerOf(key, 'middle_east');
      switch (cell) {
        case '-':
          expect(can(viewer, action)).toBe(false);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, region: 'india', ownerUserId: viewer.id, targetUserId: viewer.id })).toBe(false);
          expect(can(wideStaff, action, { region: 'middle_east' })).toBe(false);
          break;
        case 'Y':
          expect(can(viewer, action)).toBe(true);
          if (viewer.kind === 'staff') {
            expect(can(viewer, action, { partnerId: OTHER_PARTNER, region: 'india' })).toBe(true);
            expect(can(viewer, action, { partnerId: OTHER_PARTNER, region: 'middle_east' })).toBe(true);
          } else {
            expect(can(viewer, action, { partnerId: OWN_PARTNER })).toBe(true);
          }
          break;
        case 'own':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER })).toBe(true);
          expect(can(viewer, action, { partnerId: OTHER_PARTNER })).toBe(false);
          expect(can(viewer, action, { partnerId: null })).toBe(false);
          break;
        case 'mine':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: viewer.id })).toBe(true);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: 'someone-else' })).toBe(false);
          expect(can(viewer, action, { partnerId: OTHER_PARTNER, ownerUserId: viewer.id })).toBe(false);
          expect(can(viewer, action, { partnerId: OWN_PARTNER, ownerUserId: null })).toBe(false);
          break;
        case 'region':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { region: 'india' })).toBe(true);
          expect(can(viewer, action, { region: 'middle_east' })).toBe(false);
          expect(can(viewer, action, { region: null })).toBe(false);
          expect(can(wideStaff, action, { region: 'middle_east' })).toBe(true);
          expect(can(otherRegionStaff, action, { region: 'middle_east' })).toBe(true);
          expect(can(otherRegionStaff, action, { region: 'india' })).toBe(false);
          break;
        case 'self':
          expect(can(viewer, action)).toBe(true);
          expect(can(viewer, action, { targetUserId: viewer.id })).toBe(true);
          expect(can(viewer, action, { targetUserId: 'someone-else' })).toBe(false);
          break;
        default:
          throw new Error(`unknown cell "${String(cell)}" for ${action}`);
      }
    });
  });
});

describe('assertCan', () => {
  it('passes when the role may', () => {
    expect(() => assertCan(viewerOf('staff.partner_manager'), 'registration.decide')).not.toThrow();
  });

  it('throws ForbiddenError with the safe message and an internal message that names role and action', () => {
    try {
      assertCan(viewerOf('partner.sales'), 'application.approve');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).httpStatus).toBe(403);
      expect((error as ForbiddenError).safeMessage).toBe('You do not have access to this.');
      expect((error as ForbiddenError).message).toBe('partner.sales may not application.approve');
    }
  });

  it("refuses another company's record to a partner admin", () => {
    expect(() => assertCan(viewerOf('partner.partner_admin'), 'registration.read', { partnerId: OTHER_PARTNER })).toThrow(ForbiddenError);
  });
});

describe('allowedActions', () => {
  it('lists what a role may attempt with no subject', () => {
    expect(allowedActions(viewerOf('partner.technical'))).toEqual([
      'partner.read',
      'account.update_profile',
      'account.change_password',
      'account.manage_two_factor',
      'account.manage_sessions',
      'account.update_notifications',
      'manager.message',
      'document.read',
      'document.open',
      'document.request_material',
      'search.use',
      'notification.read',
    ]);
  });
});

describe('role keys', () => {
  it('names a viewer by kind and role', () => {
    expect(roleKey(viewerOf('staff.marketing'))).toBe('staff.marketing');
  });
});
```

- [ ] **Step 3: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/policies.test.ts
```

Expected: FAIL with `Failed to resolve import "./policies"`.

- [ ] **Step 4: Create `policies.ts`**

Create `apps/portal/src/server/auth/policies.ts` (the contracts' D.2, D.3 and D.4 merged, imports at the top, unchanged rules):

```ts
import type { DealRegion, PartnerRegion } from '@/lib/domain';
import { ForbiddenError } from '@/server/errors';
import type { Viewer } from './types';
import { roleKey } from './types';

export const ACTIONS = [
  // Partner applications (master 1.3, 1.4)
  'application.read',
  'application.approve',
  'application.decline',
  'application.reopen',
  // Partners and companies (master 1.4, 1.7, 4.1)
  'partner.read',
  'partner.create',
  'partner.update_profile',
  'partner.change_category',
  'partner.change_manager',
  'partner.suspend',
  'partner.restore',
  'partner.resend_invites',
  'partner.update_checklist',
  // A partner's own people (master 1.5, 1.6)
  'team.read',
  'team.invite',
  'team.resend_invite',
  'team.revoke_invite',
  'team.change_role',
  'team.remove',
  'access_request.decide',
  // CleanStart staff (master 1.8)
  'staff.read',
  'staff.invite',
  'staff.resend_invite',
  'staff.change_role',
  'staff.change_region',
  'staff.remove',
  // The signed-in person's own account (master 1.7). Always self only.
  'account.update_profile',
  'account.change_password',
  'account.manage_two_factor',
  'account.manage_sessions',
  'account.update_notifications',
  // Deal registrations (master 2.1 to 2.4)
  'registration.create',
  'registration.read',
  'registration.read_queue',
  'registration.resubmit',
  'registration.decide',
  'registration.undo_decision',
  'registration.message',
  'registration.request_extension',
  'registration.decide_extension',
  'registration.lookup_customer',
  'manager.message',
  // Dashboards (master 2.6)
  'overview.read',
  'report.read',
  // Documents (master 3.1, 3.2)
  'document.read',
  'document.open',
  'document.upload',
  'document.replace',
  'document.edit',
  'document.delete',
  'document.read_stats',
  'document.request_material',
  // Cross cutting (master 4.2 to 4.4, HubSpot 4.10)
  'audit.read',
  'audit.export',
  'search.use',
  'notification.read',
  'integration.read_health',
  'integration.retry_failed',
] as const;

export type Action = (typeof ACTIONS)[number];


/**
 * What an action is about. Every field is optional: an omitted field means "not specified" and the check
 * passes on that dimension (list screens pass no subject; the repo then scopes the rows). A present field
 * is checked. null means "specified and unknown", which fails the check.
 */
export interface PolicySubject {
  /** The partner that owns the record. */
  partnerId?: string | null;
  /** Region of the record (a deal's region, or a partner's region). */
  region?: PartnerRegion | DealRegion | null;
  /** The user who created the record (registrations.registered_by). */
  ownerUserId?: string | null;
  /** The user being acted on (account actions must target the viewer; team actions may not target the viewer's own role). */
  targetUserId?: string | null;
}

type Rule = (viewer: Viewer, subject: PolicySubject | undefined) => boolean;

const ownCompany = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'partner' && (s?.partnerId === undefined || s.partnerId === v.partnerId);

const mine = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'partner' && (s?.ownerUserId === undefined || s.ownerUserId === v.id);

const inScope = (v: Viewer, s: PolicySubject | undefined): boolean =>
  v.kind === 'staff' && (s?.region === undefined || v.region === 'all' || s.region === v.region);

const self = (v: Viewer, s: PolicySubject | undefined): boolean =>
  s?.targetUserId === undefined || s.targetUserId === v.id;

const isPartnerManager = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'partner_manager';
const isStaffSales = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'sales';
const isMarketing = (v: Viewer): boolean => v.kind === 'staff' && v.role === 'marketing';
const isPartnerAdmin = (v: Viewer): boolean => v.kind === 'partner' && v.role === 'partner_admin';
const isPartnerSales = (v: Viewer): boolean => v.kind === 'partner' && v.role === 'sales';

/** Partner admin on own company, or a partner manager on any. */
const teamAdmin: Rule = (v, s) => (isPartnerAdmin(v) && ownCompany(v, s)) || isPartnerManager(v);
/** Partner admin or partner sales on their own company. */
const dealUser: Rule = (v, s) => (isPartnerAdmin(v) || isPartnerSales(v)) && ownCompany(v, s);
/** Partner admin on any own deal; partner sales only on deals they registered. */
const ownDeals: Rule = (v, s) =>
  ownCompany(v, s) && (isPartnerAdmin(v) || (isPartnerSales(v) && mine(v, s)));
const staffDeals: Rule = (v, s) => isPartnerManager(v) || (isStaffSales(v) && inScope(v, s));
const anyone: Rule = () => true;
const managerOnly: Rule = (v) => isPartnerManager(v);

const RULES: Record<Action, Rule> = {
  'application.read': managerOnly,
  'application.approve': managerOnly,
  'application.decline': managerOnly,
  'application.reopen': managerOnly,

  'partner.read': (v, s) => ownCompany(v, s) || isPartnerManager(v) || (isStaffSales(v) && inScope(v, s)),
  'partner.create': managerOnly,
  'partner.update_profile': (v, s) => (isPartnerAdmin(v) && ownCompany(v, s)) || isPartnerManager(v),
  'partner.change_category': managerOnly,
  'partner.change_manager': managerOnly,
  'partner.suspend': managerOnly,
  'partner.restore': managerOnly,
  'partner.resend_invites': managerOnly,
  'partner.update_checklist': (v, s) => isPartnerAdmin(v) && ownCompany(v, s),

  'team.read': teamAdmin,
  'team.invite': teamAdmin,
  'team.resend_invite': teamAdmin,
  'team.revoke_invite': teamAdmin,
  'team.change_role': teamAdmin,
  'team.remove': teamAdmin,
  'access_request.decide': teamAdmin,

  'staff.read': managerOnly,
  'staff.invite': managerOnly,
  'staff.resend_invite': managerOnly,
  'staff.change_role': managerOnly,
  'staff.change_region': managerOnly,
  'staff.remove': managerOnly,

  'account.update_profile': self,
  'account.change_password': self,
  'account.manage_two_factor': self,
  'account.manage_sessions': self,
  'account.update_notifications': self,

  'registration.create': (v, s) => dealUser(v, s) || isPartnerManager(v),
  'registration.read': (v, s) => ownDeals(v, s) || isPartnerManager(v) || (isStaffSales(v) && inScope(v, s)),
  'registration.read_queue': (v) => isPartnerManager(v) || isStaffSales(v),
  'registration.resubmit': ownDeals,
  'registration.decide': staffDeals,
  'registration.undo_decision': staffDeals,
  'registration.message': (v, s) => ownDeals(v, s) || staffDeals(v, s),
  'registration.request_extension': ownDeals,
  'registration.decide_extension': staffDeals,
  'registration.lookup_customer': dealUser,
  'manager.message': (v) => v.kind === 'partner',

  'overview.read': (v) => isPartnerAdmin(v) || isPartnerSales(v),
  'report.read': (v) => isPartnerManager(v) || isStaffSales(v),

  'document.read': anyone,
  'document.open': anyone,
  'document.upload': (v) => isPartnerManager(v) || isMarketing(v),
  'document.replace': (v) => isPartnerManager(v) || isMarketing(v),
  'document.edit': (v) => isPartnerManager(v) || isMarketing(v),
  'document.delete': (v) => isPartnerManager(v) || isMarketing(v),
  'document.read_stats': (v) => isPartnerManager(v) || isMarketing(v),
  'document.request_material': (v) => v.kind === 'partner',

  'audit.read': managerOnly,
  'audit.export': managerOnly,
  'search.use': anyone,
  'notification.read': anyone,
  'integration.read_health': managerOnly,
  'integration.retry_failed': managerOnly,
};

/** Pure. Never reads the database. */
export function can(viewer: Viewer, action: Action, subject?: PolicySubject): boolean {
  return RULES[action](viewer, subject);
}

/** Throws ForbiddenError (httpStatus 403, safe message "You do not have access to this.") when can() is false. */
export function assertCan(viewer: Viewer, action: Action, subject?: PolicySubject): void {
  if (!can(viewer, action, subject)) {
    throw new ForbiddenError(`${roleKey(viewer)} may not ${action}`);
  }
}

/** For the permission test: the actions a role may attempt with no subject. */
export const allowedActions = (viewer: Viewer): Action[] => ACTIONS.filter((a) => can(viewer, a));
```

- [ ] **Step 5: Run it and see it pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/policies.test.ts
```

Expected: `Test Files  1 passed (1)`, `Tests  355 passed (355)`.

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/auth/policies.ts apps/portal/src/server/auth/policies.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1b policies and the full permission matrix test"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1b | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | ACTIONS, can, assertCan, 355 cell tests" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1c: Sign in gate, rate limits, password rule and reset audit (W0-f)

Better Auth only knows the user table and the passwords. This task adds the portal rules around it: a disabled user, an invited user, a suspended company and an unknown address are all refused with the same answer as a wrong password; sign in, reset request, second step and reset endpoints are rate limited per IP (Better Auth's own rules) and per email (the portal limiter); the new password is checked against the portal rule before Better Auth sees it; a session is never created for a user who may not hold one, whichever way they sign in; `last_login_at` is set; a reset stamps `password_changed_at`, writes one `account.password_changed` audit entry and sends the changed notice. If Task M0.7-F was taken, skip this task and do Step 8 of that task.

**Files:**
- Modify: `apps/portal/src/server/auth/auth.ts` (replaced)
- Test: `apps/portal/src/server/auth/auth.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1c | started | W0 | - | - | sign in gate, rate limits" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the tests**

Create `apps/portal/src/server/auth/auth.test.ts`. It mocks `./auth-mail` (the module that Task M0.5d completes), so it never sends mail. The per IP test goes through `auth.handler` with a `Request`, because Better Auth's IP limiter only sees HTTP requests, not `auth.api` calls. The second step test also goes over HTTP, the way the browser client calls it.

```ts
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
```

- [ ] **Step 3: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/auth.test.ts
```

Expected: FAIL, `Tests  10 failed | 1 passed (11)`. The one that passes is the second step over HTTP, which the Task M0.7 instance already handles. The 10 failures are the gate, the rate limits, the password rule, the last login time and the reset audit.

- [ ] **Step 4: Replace `auth.ts` with the hardened version**

Replace `apps/portal/src/server/auth/auth.ts`. Compared with the Task M0.7 file it adds `hooks.before` (per email limits, the sign in gate, the password rule), `databaseHooks.session.create` (the last gate, and `last_login_at`), `rateLimit.customRules` (per IP), `onPasswordReset`, and a `sendResetPassword` that skips users who are not active. Two shortcuts are marked in the code: the per email limiter is in process (one container, reset on restart), and a determined attacker can still make one address unable to sign in for ten minutes by spamming it; the per IP rules are the main defence.

```ts
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
          if ((await mayHoldSession(eq(users.email, email))) === false) throw new APIError('UNAUTHORIZED', INVALID_LOGIN);
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
        });
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
        await sendPasswordChangedEmail({ to: { email: user.email, name: user.name }, changedAt });
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
```

- [ ] **Step 5: Run the tests and see them pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/auth.test.ts src/server/auth/auth.spike.test.ts
```

Expected: `Test Files  2 passed (2)`, `Tests  18 passed (18)` (11 and 7).

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/auth/auth.ts apps/portal/src/server/auth/auth.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1c sign in gate, rate limits, password rule, reset audit"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1c | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | gate, limits, password rule, audit" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1d: Sessions, guards, `homeFor` and `getShell` (W0-f)

`sessions.ts` lists and revokes sessions for the Account screen (P, M1.7). `viewer.ts` gains `homeFor` and the four guards (`requireViewer`, `requireKind`, `requireCan`, `requireActionViewer`). `src/lib/next-path.ts` holds `safeNext` (the only way a `?next=` value becomes a redirect target) and the request header name the proxy uses. `getShell` is the minimal `repo/account.ts` the layouts need; P adds the rest of that file in M1.7.

**Files:**
- Create: `apps/portal/src/lib/next-path.ts`, `apps/portal/src/server/auth/sessions.ts`, `apps/portal/src/server/repo/account.ts`
- Modify: `apps/portal/src/server/auth/viewer.ts` (replaced)
- Test: `apps/portal/src/lib/next-path.test.ts`, `apps/portal/src/server/auth/sessions.test.ts`, `apps/portal/src/server/auth/viewer.test.ts`, `apps/portal/src/server/repo/account.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1d | started | W0 | - | - | sessions, guards, getShell" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the four test files**

Create `apps/portal/src/lib/next-path.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { safeNext } from './next-path';

describe('safeNext', () => {
  it.each([
    ['/partner/deals', '/partner/deals'],
    ['/partner/deals?status=pending', '/partner/deals?status=pending'],
    ['/admin/approvals#queue', '/admin/approvals'],
    [' /partner/overview', '/partner/overview'],
  ])('keeps %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    '',
    '//evil.example.com',
    '/\\evil.example.com',
    'https://evil.example.com/partner',
    'javascript:alert(1)',
    'partner/deals',
    '/sign-in',
    '/sign-in?next=%2Fpartner',
    '/api/auth/sign-out',
    `/${'a'.repeat(600)}`,
  ])('refuses %j', (input) => {
    expect(safeNext(input)).toBeNull();
  });
});
```

Create `apps/portal/src/server/auth/sessions.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { authSessions } from '@/db/schema';
import { makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { listSessions, revokeAllSessions, revokeSession } from './sessions';

const NOW = fixedClock('2026-11-12T10:00:00Z');
const at = (iso: string): Date => new Date(iso);

const addSession = async (userId: string, token: string, createdAt: string, expiresAt: string) => {
  const [row] = await testDb()
    .insert(authSessions)
    .values({ userId, token, createdAt: at(createdAt), expiresAt: at(expiresAt), userAgent: `agent ${token}`, ipAddress: '203.0.113.7' })
    .returning();
  return row!;
};

beforeEach(async () => {
  await resetDb(testDb());
});

describe('listSessions', () => {
  it('lists unexpired sessions newest first and marks the current one', async () => {
    const user = await makeUser(testDb(), {});
    const older = await addSession(user.id, 'tok-old', '2026-11-01T09:00:00Z', '2026-12-01T09:00:00Z');
    const newer = await addSession(user.id, 'tok-new', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(user.id, 'tok-dead', '2026-10-01T09:00:00Z', '2026-11-01T09:00:00Z');

    const list = await listSessions(user.id, 'tok-new', NOW);
    expect(list.map((s) => s.id)).toEqual([newer.id, older.id]);
    expect(list.map((s) => s.current)).toEqual([true, false]);
    expect(list[0]).toEqual({
      id: newer.id,
      createdAt: '2026-11-10T09:00:00.000Z',
      userAgent: 'agent tok-new',
      ipAddress: '203.0.113.7',
      current: true,
    });
  });

  it('marks nothing current without a token and never lists another user', async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    await addSession(mine.id, 'tok-mine', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(theirs.id, 'tok-theirs', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    const list = await listSessions(mine.id, null, NOW);
    expect(list).toHaveLength(1);
    expect(list[0]?.current).toBe(false);
  });
});

describe('revokeSession', () => {
  it('removes the session', async () => {
    const user = await makeUser(testDb(), {});
    const session = await addSession(user.id, 'tok-a', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await revokeSession(user.id, session.id);
    expect(await testDb().select().from(authSessions)).toHaveLength(0);
  });

  it("refuses another user's session and an unknown id, and changes nothing", async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    const session = await addSession(theirs.id, 'tok-theirs', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await expect(revokeSession(mine.id, session.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(revokeSession(mine.id, '00000000-0000-0000-0000-000000000000')).rejects.toBeInstanceOf(NotFoundError);
    expect(await testDb().select().from(authSessions).where(eq(authSessions.userId, theirs.id))).toHaveLength(1);
  });
});

describe('revokeAllSessions', () => {
  it("signs a user out everywhere and leaves other users' sessions alone", async () => {
    const [mine, theirs] = [await makeUser(testDb(), {}), await makeUser(testDb(), {})];
    await addSession(mine.id, 'tok-1', '2026-11-10T09:00:00Z', '2026-12-10T09:00:00Z');
    await addSession(mine.id, 'tok-2', '2026-11-11T09:00:00Z', '2026-12-11T09:00:00Z');
    await addSession(theirs.id, 'tok-3', '2026-11-11T09:00:00Z', '2026-12-11T09:00:00Z');
    await revokeAllSessions(mine.id);
    expect(await listSessions(mine.id, null, NOW)).toHaveLength(0);
    expect(await listSessions(theirs.id, null, NOW)).toHaveLength(1);
  });
});
```

Create `apps/portal/src/server/auth/viewer.test.ts`. It signs real users in through Better Auth, mocks only `next/headers` (to supply the cookie and the `x-portal-path` header) and `next/navigation` (so `redirect` throws a readable error), and asserts the redirect targets. The `homeFor` table also asserts that each role may open its own home, so a bounce can never loop.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { PATH_HEADER } from '@/lib/next-path';
import { UnauthenticatedError } from '@/server/errors';
import { auth } from './auth';
import { type Action, can } from './policies';
import type { RoleKey, Viewer } from './types';
import { getViewer, homeFor, requireActionViewer, requireCan, requireKind, requireViewer } from './viewer';

const mocks = vi.hoisted(() => ({ requestHeaders: new Headers() }));
vi.mock('next/headers', () => ({ headers: async () => mocks.requestHeaders }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('./auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

const PASSWORD = 'Sample#Pass1';

/** Signs the user in and makes the next request carry that session cookie (and the path the proxy would add). */
const signInAs = async (email: string, path?: string): Promise<void> => {
  const { headers } = await auth.api.signInEmail({ body: { email, password: PASSWORD }, returnHeaders: true });
  const cookie = headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  mocks.requestHeaders = new Headers(path ? { cookie, [PATH_HEADER]: path } : { cookie });
};

const redirectOf = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run();
    return null;
  } catch (error) {
    const match = /^REDIRECT (.+)$/.exec((error as Error).message);
    if (!match) throw error;
    return match[1] ?? null;
  }
};

beforeEach(async () => {
  mocks.requestHeaders = new Headers();
  await resetDb(testDb());
});

describe('homeFor', () => {
  const partner = (role: 'partner_admin' | 'sales' | 'technical'): Viewer => ({
    id: 'u', kind: 'partner', role, partnerId: 'p', partnerName: 'P', email: 'e@x.co', name: 'N',
  });
  const staff = (role: 'partner_manager' | 'sales' | 'marketing'): Viewer => ({
    id: 'u', kind: 'staff', role, partnerId: null, partnerName: null, region: 'india', email: 'e@x.co', name: 'N',
  });

  const HOMES: Array<[RoleKey, Viewer, string, Action]> = [
    ['partner.partner_admin', partner('partner_admin'), '/partner/overview', 'overview.read'],
    ['partner.sales', partner('sales'), '/partner/overview', 'overview.read'],
    ['partner.technical', partner('technical'), '/partner/documents', 'document.read'],
    ['staff.partner_manager', staff('partner_manager'), '/admin/approvals', 'registration.read_queue'],
    ['staff.sales', staff('sales'), '/admin/approvals', 'registration.read_queue'],
    ['staff.marketing', staff('marketing'), '/admin/documents', 'document.upload'],
  ];

  it.each(HOMES)('%s lands on %s and may open it', (_key, viewer, home, action) => {
    expect(homeFor(viewer)).toBe(home);
    expect(can(viewer, action)).toBe(true);
  });
});

describe('guards', () => {
  it('sends a signed out visitor to sign in with the page they asked for', async () => {
    mocks.requestHeaders = new Headers({ [PATH_HEADER]: '/partner/deals?status=pending' });
    expect(await redirectOf(requireViewer)).toBe('/sign-in?next=%2Fpartner%2Fdeals%3Fstatus%3Dpending');
  });

  it('sends a signed out visitor to plain sign in when the path is unknown or unsafe', async () => {
    expect(await redirectOf(requireViewer)).toBe('/sign-in');
    mocks.requestHeaders = new Headers({ [PATH_HEADER]: '//evil.example.com' });
    expect(await redirectOf(requireViewer)).toBe('/sign-in');
  });

  it('sends a stale cookie the same way as no cookie', async () => {
    mocks.requestHeaders = new Headers({ cookie: 'better-auth.session_token=not-a-real-token.signature', [PATH_HEADER]: '/admin/audit' });
    expect(await redirectOf(requireViewer)).toBe('/sign-in?next=%2Fadmin%2Faudit');
  });

  it('sends a partner who opens /admin to /partner/overview, and a technical user to Documents', async () => {
    const partner = await makePartner(testDb(), {});
    const admin = await makeUser(testDb(), { partnerId: partner.id, role: 'partner_admin', password: PASSWORD });
    const technical = await makeUser(testDb(), { partnerId: partner.id, role: 'technical', password: PASSWORD });
    await signInAs(admin.email);
    expect(await redirectOf(() => requireKind('staff'))).toBe('/partner/overview');
    await signInAs(technical.email);
    expect(await redirectOf(() => requireKind('staff'))).toBe('/partner/documents');
  });

  it('sends staff who open /partner to their own home', async () => {
    const manager = await makeUser(testDb(), { kind: 'staff', role: 'partner_manager', password: PASSWORD });
    const marketing = await makeUser(testDb(), { kind: 'staff', role: 'marketing', password: PASSWORD });
    await signInAs(manager.email);
    expect(await redirectOf(() => requireKind('partner'))).toBe('/admin/approvals');
    await signInAs(marketing.email);
    expect(await redirectOf(() => requireKind('partner'))).toBe('/admin/documents');
  });

  it('returns the viewer when the kind matches', async () => {
    const manager = await makeUser(testDb(), { kind: 'staff', role: 'partner_manager', password: PASSWORD });
    await signInAs(manager.email);
    expect((await requireKind('staff')).id).toBe(manager.id);
  });

  it('requireCan lets a role through and bounces one that may not', async () => {
    const partner = await makePartner(testDb(), {});
    const sales = await makeUser(testDb(), { partnerId: partner.id, role: 'sales', password: PASSWORD });
    await signInAs(sales.email);
    expect((await requireCan('registration.create')).id).toBe(sales.id);
    expect(await redirectOf(() => requireCan('team.read'))).toBe('/partner/overview');
    expect(await redirectOf(() => requireCan('registration.read', { partnerId: 'another-company' }))).toBe('/partner/overview');
  });

  it('requireActionViewer throws instead of redirecting', async () => {
    await expect(requireActionViewer()).rejects.toBeInstanceOf(UnauthenticatedError);
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    expect((await requireActionViewer()).id).toBe(user.id);
  });

  it('getViewer reads the request headers', async () => {
    expect(await getViewer()).toBeNull();
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    expect((await getViewer())?.id).toBe(user.id);
  });
});
```

Create `apps/portal/src/server/repo/account.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notifications, users } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { getShell } from './account';

beforeEach(async () => {
  await resetDb(testDb());
});

const shellOf = async (userId: string) => {
  const db = testDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const viewer = await viewerFor(db, user!);
  return withViewer(viewer, (tx) => getShell(tx, viewer));
};

describe('getShell, partner viewer', () => {
  it('names the company, the role and the manager for the Message drawer', async () => {
    const db = testDb();
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { name: 'Qamar Solutions', region: 'middle_east', category: 'channel', managerId: manager.id });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Yasmin Haddad' });

    expect(await shellOf(admin.id)).toEqual({
      viewerId: admin.id,
      viewerName: 'Yasmin Haddad',
      viewerEmail: admin.email,
      kind: 'partner',
      roleLabel: 'Partner admin',
      orgName: 'Qamar Solutions',
      orgSub: 'Channel partner, Middle East',
      manager: { id: manager.id, name: 'Omar Nasser', email: manager.email, team: 'CleanStart Middle East' },
      waitingApprovals: 0,
      unreadNotifications: 0,
    });
  });

  it('has no manager when none is set, when the manager is disabled, and calls an all region manager plain CleanStart', async () => {
    const db = testDb();
    const noManager = await makePartner(db, {});
    const adminA = await makeUser(db, { partnerId: noManager.id });
    expect((await shellOf(adminA.id)).manager).toBeNull();

    const disabled = await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'disabled' });
    const partnerB = await makePartner(db, { managerId: disabled.id });
    const adminB = await makeUser(db, { partnerId: partnerB.id });
    expect((await shellOf(adminB.id)).manager).toBeNull();

    const wide = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    const partnerC = await makePartner(db, { managerId: wide.id });
    const adminC = await makeUser(db, { partnerId: partnerC.id });
    expect((await shellOf(adminC.id)).manager?.team).toBe('CleanStart');
  });

  it('counts only the unread notifications of the viewer', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    const [me, other] = [await makeUser(db, { partnerId: partner.id }), await makeUser(db, { partnerId: partner.id })];
    const row = (userId: string, readAt: Date | null) => ({ userId, kind: 'document_new' as const, title: 'New document', readAt });
    await db.insert(notifications).values([row(me.id, null), row(me.id, null), row(me.id, new Date()), row(other.id, null)]);
    expect((await shellOf(me.id)).unreadNotifications).toBe(2);
  });

  it('shows no waiting approvals to a partner', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    await makeRegistration(db, { partnerId: partner.id, status: 'pending' });
    const admin = await makeUser(db, { partnerId: partner.id });
    expect((await shellOf(admin.id)).waitingApprovals).toBe(0);
  });

  it('refuses a forged company, which is what the isolation entry probes', async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: partner.id });
    const viewer = await viewerFor(db, admin);
    if (viewer.kind !== 'partner') throw new Error('expected a partner viewer');
    await expect(withViewer(viewer, (tx) => getShell(tx, { ...viewer, partnerId: '00000000-0000-0000-0000-000000000000' }))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('getShell, staff viewer', () => {
  const seedQueue = async () => {
    const db = testDb();
    const partner = await makePartner(db, {});
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'middle_east', status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, region: 'india', status: 'accepted' });
  };

  it('counts the pending registrations in the staff scope for the nav badge', async () => {
    await seedQueue();
    const db = testDb();
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const all = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'middle_east' });
    expect((await shellOf(india.id)).waitingApprovals).toBe(2);
    expect((await shellOf(all.id)).waitingApprovals).toBe(3);
    expect((await shellOf(sales.id)).waitingApprovals).toBe(1);
  });

  it('labels the role with the region and names CleanStart as the organisation', async () => {
    const db = testDb();
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const all = await makeUser(db, { kind: 'staff', role: 'marketing', region: 'all' });
    expect(await shellOf(india.id)).toMatchObject({ roleLabel: 'Partner manager, India', orgName: 'CleanStart', orgSub: 'Partnerships', manager: null, kind: 'staff' });
    expect((await shellOf(all.id)).roleLabel).toBe('Marketing');
  });

  it('shows marketing no approvals count', async () => {
    await seedQueue();
    const marketing = await makeUser(testDb(), { kind: 'staff', role: 'marketing', region: 'all' });
    expect((await shellOf(marketing.id)).waitingApprovals).toBe(0);
  });
});
```

- [ ] **Step 3: Run them and see them fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/lib/next-path.test.ts src/server/auth/sessions.test.ts src/server/auth/viewer.test.ts src/server/repo/account.test.ts
```

Expected: FAIL: `Failed to resolve import` for `./next-path`, `./sessions` and `./account`, and `viewer.test.ts` reports `Tests  14 failed | 1 passed (15)` with `TypeError: homeFor is not a function`, `requireCan is not a function` and `requireActionViewer is not a function`.

- [ ] **Step 4: Create `next-path.ts`**

Create `apps/portal/src/lib/next-path.ts`:

```ts
import { ROUTES } from '@/lib/routes';

/** Request header the proxy sets to the requested path and query, so a Server Component can build `?next=`. */
export const PATH_HEADER = 'x-portal-path';

const ORIGIN = 'https://portal.invalid';

/**
 * The same-site path to return to after sign in, or null. Anything that resolves to another origin
 * (`//evil.com`, `/\evil.com`, `https://evil.com`, `javascript:`), the sign in page itself (a loop) and the
 * API are refused. The result is the parsed path and query, never the raw input.
 */
export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 500 || !value.trimStart().startsWith('/')) return null;
  let url: URL;
  try {
    url = new URL(value, ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== ORIGIN) return null;
  if (url.pathname === ROUTES.signIn || url.pathname.startsWith('/api/')) return null;
  return `${url.pathname}${url.search}`;
}
```

- [ ] **Step 5: Create `sessions.ts`**

Create `apps/portal/src/server/auth/sessions.ts` (system database, as the contracts say; the user id is part of every match):

```ts
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import { authSessions } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import type { SessionDto } from '@/lib/dto';
import { NotFoundError } from '@/server/errors';
import { getAuth } from './auth';

/** The token of the session behind `requestHeaders`, to mark the current device in the list. */
export async function currentSessionToken(requestHeaders: Headers): Promise<string | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session?.session.token ?? null;
}

/** The user's unexpired sessions, newest first. `current` marks the session whose token is `currentToken`. */
export async function listSessions(
  userId: string,
  currentToken: string | null,
  clock: Clock = systemClock,
): Promise<SessionDto[]> {
  const rows = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.userId, userId), gt(authSessions.expiresAt, clock.now())))
    .orderBy(desc(authSessions.createdAt));
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    current: currentToken !== null && row.token === currentToken,
  }));
}

/** Signs one session out. The user id is part of the match, so nobody revokes another person's session. */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const removed = await db
    .delete(authSessions)
    .where(and(eq(authSessions.id, sessionId), eq(authSessions.userId, userId)))
    .returning({ id: authSessions.id });
  if (removed.length === 0) throw new NotFoundError('session');
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.delete(authSessions).where(eq(authSessions.userId, userId));
}
```

- [ ] **Step 6: Replace `viewer.ts` with the version that has the guards**

Replace `apps/portal/src/server/auth/viewer.ts`:

```ts
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '@/db/client';
import { partners, staffScopes, users } from '@/db/schema';
import { isOneOf, PARTNER_ROLES, STAFF_ROLES, type UserKind } from '@/lib/domain';
import { PATH_HEADER, safeNext } from '@/lib/next-path';
import { ROUTES } from '@/lib/routes';
import { UnauthenticatedError } from '@/server/errors';
import { log } from '@/server/log';
import { getAuth } from './auth';
import { type Action, can, type PolicySubject } from './policies';
import type { Viewer } from './types';

/**
 * Builds the viewer for a user id from the database, never from the session payload, so a role change, a removal
 * or a suspension takes effect on the next request. Null for a user who is not active, a suspended partner and
 * any row that breaks the users table invariants.
 */
export async function loadViewer(userId: string): Promise<Viewer | null> {
  const [row] = await db
    .select({
      user: users,
      partnerName: partners.name,
      partnerStatus: partners.status,
      staffRegion: staffScopes.region,
    })
    .from(users)
    .leftJoin(partners, eq(partners.id, users.partnerId))
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!row || row.user.status !== 'active') return null;

  const { user } = row;
  const base = { id: user.id, email: user.email, name: user.name };
  if (user.kind === 'partner') {
    if (!user.partnerId || row.partnerName === null || !isOneOf(PARTNER_ROLES, user.role)) {
      log.error({ userId }, 'partner user row breaks the users table invariants');
      return null;
    }
    if (row.partnerStatus === 'suspended') return null;
    return { ...base, kind: 'partner', role: user.role, partnerId: user.partnerId, partnerName: row.partnerName };
  }
  if (!isOneOf(STAFF_ROLES, user.role) || row.staffRegion === null) {
    log.error({ userId }, 'staff user row has no valid role or staff_scopes row');
    return null;
  }
  return { ...base, kind: 'staff', role: user.role, partnerId: null, partnerName: null, region: row.staffRegion };
}

/** The viewer for the session cookie in `requestHeaders`, or null. Testable without a Next request scope. */
export async function viewerFromHeaders(requestHeaders: Headers): Promise<Viewer | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  return session ? loadViewer(session.user.id) : null;
}

/** The signed-in viewer for this request, or null. Cached per request, so layouts and pages share one lookup. */
export const getViewer = cache(async (): Promise<Viewer | null> => viewerFromHeaders(await headers()));

/** Where a viewer lands after sign in and when bounced. Every home is a page that viewer's role may open. */
export function homeFor(viewer: Viewer): string {
  if (viewer.kind === 'partner') return viewer.role === 'technical' ? ROUTES.partner.documents : ROUTES.partner.overview;
  return viewer.role === 'marketing' ? ROUTES.admin.documents : ROUTES.admin.approvals;
}

async function signInUrl(): Promise<string> {
  const next = safeNext((await headers()).get(PATH_HEADER));
  return next ? `${ROUTES.signIn}?next=${encodeURIComponent(next)}` : ROUTES.signIn;
}

/** Pages. No session: redirect to /sign-in?next=<path>. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(await signInUrl());
  return viewer;
}

/** Pages and layouts. The wrong kind of viewer goes to its own home, so a partner on /admin lands on /partner/overview. */
export async function requireKind(kind: UserKind): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.kind !== kind) redirect(homeFor(viewer));
  return viewer;
}

/** Pages. requireViewer plus can(); a viewer who may not is redirected to their home. */
export async function requireCan(action: Action, subject?: PolicySubject): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!can(viewer, action, subject)) redirect(homeFor(viewer));
  return viewer;
}

/** Server actions. Throws UnauthenticatedError instead of redirecting. */
export async function requireActionViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new UnauthenticatedError();
  return viewer;
}
```

- [ ] **Step 7: Create `repo/account.ts` with `getShell` and its isolation entry**

Create `apps/portal/src/server/repo/account.ts`. The isolation probe forges a viewer that claims company B; row level security hides company B's row from a transaction opened as company A, so `getShell` throws `NotFoundError`, which is the `not_found` outcome the central matrix expects. P adds its functions to `exportedFns` and to `isolation` in M1.7.

```ts
import { and, count, eq, isNull } from 'drizzle-orm';
import { notifications, partners, registrations, staffScopes, users } from '@/db/schema';
import type { ShellDto } from '@/lib/dto';
import {
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_ROLE_LABEL,
  STAFF_REGION_LABEL,
  STAFF_ROLE_LABEL,
  type StaffRegion,
} from '@/lib/domain';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** "CleanStart India", "CleanStart Middle East", or plain "CleanStart" for a manager who covers every region. */
const teamLabel = (region: StaffRegion): string => (region === 'all' ? 'CleanStart' : `CleanStart ${STAFF_REGION_LABEL[region]}`);

async function unreadCount(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

/** Pending registrations a staff viewer may decide: the whole queue for "all", otherwise their region. */
async function waitingCount(tx: Tx, viewer: Viewer): Promise<number> {
  if (viewer.kind !== 'staff' || viewer.role === 'marketing') return 0;
  const pending = eq(registrations.status, 'pending');
  const [row] = await tx
    .select({ value: count() })
    .from(registrations)
    .where(viewer.region === 'all' ? pending : and(pending, eq(registrations.region, viewer.region)));
  return row?.value ?? 0;
}

/** Everything the layout needs (M1.1). Counts are cheap aggregates. */
export async function getShell(tx: Tx, viewer: Viewer): Promise<ShellDto> {
  const base = { viewerId: viewer.id, viewerName: viewer.name, viewerEmail: viewer.email, kind: viewer.kind };
  const unreadNotifications = await unreadCount(tx, viewer.id);

  if (viewer.kind === 'staff') {
    const region = viewer.region === 'all' ? '' : `, ${STAFF_REGION_LABEL[viewer.region]}`;
    return {
      ...base,
      roleLabel: `${STAFF_ROLE_LABEL[viewer.role]}${region}`,
      orgName: 'CleanStart',
      orgSub: 'Partnerships',
      manager: null,
      waitingApprovals: await waitingCount(tx, viewer),
      unreadNotifications,
    };
  }

  const [partner] = await tx
    .select({ category: partners.category, region: partners.region, managerId: partners.managerId })
    .from(partners)
    .where(eq(partners.id, viewer.partnerId))
    .limit(1);
  if (!partner) throw new NotFoundError('partner');

  const [manager] = partner.managerId
    ? await tx
        .select({ id: users.id, name: users.name, email: users.email, region: staffScopes.region })
        .from(users)
        .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
        .where(and(eq(users.id, partner.managerId), eq(users.status, 'active')))
        .limit(1)
    : [];

  return {
    ...base,
    roleLabel: PARTNER_ROLE_LABEL[viewer.role],
    orgName: viewer.partnerName,
    orgSub: `${PARTNER_CATEGORY_LABEL[partner.category]}, ${PARTNER_REGION_LABEL[partner.region]}`,
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email, team: teamLabel(manager.region ?? 'all') } : null,
    waitingApprovals: 0,
    unreadNotifications,
  };
}

const exportedFns = { getShell };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  // A viewer forged to claim company B must find no company row, because row level security hides it.
  getShell: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => getShell(tx, { ...viewer, partnerId: ctx.b.partnerId }),
    expect: 'not_found',
  },
});
```

- [ ] **Step 8: Run the four files and the central isolation test**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/lib/next-path.test.ts src/server/auth/sessions.test.ts src/server/auth/viewer.test.ts src/server/repo/account.test.ts
pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts
```

Expected: the first prints `Test Files  4 passed (4)`, `Tests  44 passed (44)` (16, 5, 15 and 8). The second passes and now includes the `account` module: its two cases (`registers every exported function in isolation`, `leaks nothing across tenants`) both pass. If the `getShell` probe does not throw `NotFoundError` (row level security let company B's row through), the policy for `partners` in `src/db/rls.sql` is wrong: report it to the orchestrator as `blocked`, do not weaken the probe.

- [ ] **Step 9: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0.

- [ ] **Step 10: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/lib/next-path.ts apps/portal/src/lib/next-path.test.ts apps/portal/src/server/auth/sessions.ts apps/portal/src/server/auth/sessions.test.ts apps/portal/src/server/auth/viewer.ts apps/portal/src/server/auth/viewer.test.ts apps/portal/src/server/repo/account.ts apps/portal/src/server/repo/account.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1d sessions, guards, homeFor and getShell"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1d | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | requireViewer, requireKind, requireCan, getShell" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1e: `proxy.ts` session redirect, review gate kept (W0-f)

The proxy does two things. A signed out visit to `/partner` or `/admin` is redirected to `/sign-in?next=<path>`; it only checks that a session cookie exists, because the proxy must not hit the database, and the layout guard (`requireKind`) is the real check. And it hands the requested path to Server Components in the `x-portal-path` request header, overwriting whatever the client sent. The shared password gate of the hosted review copy stays first and unchanged in behaviour until M5.4.

**Files:**
- Modify: `apps/portal/src/proxy.ts` (replaced)
- Test: `apps/portal/src/proxy.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1e | started | W0 | - | - | proxy session redirect" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Verify the two proxy facts**

Verify: the installed Next runs `proxy.ts` on the Node runtime and `getSessionCookie` accepts a `Request`.

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
grep -n "Proxy defaults to using the Node.js runtime" apps/portal/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
grep -n "getSessionCookie: (request: Request | Headers" apps/portal/node_modules/better-auth/dist/cookies/index.d.mts
```

Expected: one line each. If the first is missing, check the Next release notes: the proxy may be edge only, in which case `better-auth/cookies` still works (it uses no Node API) but nothing in this file may import the database. If the second is missing, use `request.cookies.get('better-auth.session_token')` and the `__Secure-` variant.

- [ ] **Step 3: Write the test**

Create `apps/portal/src/proxy.test.ts`. It builds real `NextRequest` objects and asserts the redirect target, the cookie names (plain and `__Secure-`), the public paths, that a client supplied path header is overwritten, and the review gate (off without the variable, 401 without or with a wrong password, open with the right one and still redirecting a signed out visit to `/partner`).

```ts
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isProtectedPath, proxy } from "./proxy";

const request = (path: string, headers: Record<string, string> = {}): NextRequest =>
  new NextRequest(`http://localhost:3204${path}`, { headers });

const basic = (password: string): string => `Basic ${btoa(`reviewer:${password}`)}`;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isProtectedPath", () => {
  it.each(["/partner", "/partner/deals", "/partner/deals/abc", "/admin", "/admin/audit"])("protects %s", (path) => {
    expect(isProtectedPath(path)).toBe(true);
  });

  it.each(["/", "/sign-in", "/apply", "/apply/done", "/accept-invite", "/reset-password", "/api/auth/get-session", "/partnership", "/administrator"])(
    "leaves %s public",
    (path) => {
      expect(isProtectedPath(path)).toBe(false);
    },
  );
});

describe("session redirect", () => {
  it("sends a signed out visit to sign in with the page and its query", () => {
    const response = proxy(request("/partner/deals?status=pending"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("next")).toBe("/partner/deals?status=pending");
  });

  it("lets a request with a session cookie through, plain or secure", () => {
    for (const name of ["better-auth.session_token", "__Secure-better-auth.session_token"]) {
      const response = proxy(request("/admin/approvals", { cookie: `${name}=abc.def` }));
      expect(response.status, name).toBe(200);
      expect(response.headers.get("location"), name).toBeNull();
    }
  });

  it("leaves public pages alone without a cookie", () => {
    for (const path of ["/sign-in", "/apply", "/accept-invite?token=x", "/reset-password?token=x", "/api/auth/sign-in/email"]) {
      expect(proxy(request(path)).status, path).toBe(200);
    }
  });

  it("hands the path to Server Components and overwrites a path the client sent", () => {
    const response = proxy(
      request("/partner/overview?tab=1", { cookie: "better-auth.session_token=abc.def", "x-portal-path": "/admin/audit" }),
    );
    expect(response.headers.get("x-middleware-request-x-portal-path")).toBe("/partner/overview?tab=1");
  });
});

describe("review gate", () => {
  it("is off without PORTAL_REVIEW_PASSWORD", () => {
    expect(proxy(request("/sign-in")).status).toBe(200);
  });

  it("answers 401 without the shared password and with a wrong one", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    const none = proxy(request("/sign-in"));
    expect(none.status).toBe(401);
    expect(none.headers.get("www-authenticate")).toContain("Basic");
    expect(proxy(request("/sign-in", { authorization: basic("nope") })).status).toBe(401);
  });

  it("leaves /api/health open while the gate is on, for the container health check", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    expect(proxy(request("/api/health")).status).toBe(200);
  });

  it("opens with the right password and still applies the session redirect", () => {
    vi.stubEnv("PORTAL_REVIEW_PASSWORD", "let-me-in");
    const authorization = basic("let-me-in");
    expect(proxy(request("/sign-in", { authorization })).status).toBe(200);
    expect(proxy(request("/partner/deals", { authorization })).status).toBe(307);
  });
});
```

- [ ] **Step 4: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/proxy.test.ts
```

Expected: FAIL, `Tests  17 failed | 4 passed (21)`: `TypeError: (0 , isProtectedPath) is not a function` for the path cases, and `expected 200 to be 307` for the redirect cases (the mock proxy never redirects).

- [ ] **Step 5: Replace `proxy.ts`**

Replace `apps/portal/src/proxy.ts`:

```ts
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { PATH_HEADER } from "@/lib/next-path";
import { ROUTES } from "@/lib/routes";

/**
 * Optional shared-password gate for the hosted review copy. Active only when
 * PORTAL_REVIEW_PASSWORD is set, so local development stays open. Removed with the mock in M5.4.
 * shortcut: HTTP Basic with one shared password, enough for a made-up-data mock.
 */
function reviewGate(request: NextRequest): NextResponse | null {
  const password = process.env.PORTAL_REVIEW_PASSWORD;
  if (!password) return null;

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    if (decoded.slice(decoded.indexOf(":") + 1) === password) return null;
  }
  return new NextResponse("Password required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CleanStart partner portal review"' },
  });
}

/** The signed in areas. Everything else (sign in, apply, accept invite, reset password, the API) is public. */
export const isProtectedPath = (pathname: string): boolean =>
  /^\/(partner|admin)(\/|$)/.test(pathname);

/**
 * Two jobs. A signed out visit to a signed in area is sent to sign in with the page it asked for. This only looks
 * for the session cookie, it does not read the database: a stale cookie passes here and is caught by the layout
 * guard (requireKind), which is the real check. Then the path is handed to Server Components in a request header,
 * always overwritten so a client cannot choose it.
 */
export function proxy(request: NextRequest): NextResponse {
  // The container health check, the deploy smoke probe and `compose --wait` must not need the review password (plan 06 M0.6).
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();
  const blocked = reviewGate(request);
  if (blocked) return blocked;

  const { pathname, search } = request.nextUrl;
  if (isProtectedPath(pathname) && !getSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.signIn;
    url.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(url);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(PATH_HEADER, `${pathname}${search}`);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|logo-mark.svg).*)"],
};
```

- [ ] **Step 6: Run it and see it pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/proxy.test.ts
```

Expected: `Test Files  1 passed (1)`, `Tests  22 passed (22)` (21 plus the `/api/health` case added at the integration review).

- [ ] **Step 7: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. The build output lists `ƒ Proxy (Middleware)`. Expected: all exit 0.

- [ ] **Step 8: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/proxy.ts apps/portal/src/proxy.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1e proxy session redirect, review gate kept"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1e | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | proxy redirect, x-portal-path" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1f: Routes, layouts and the shell: the real viewer replaces the personas (W0-f)

This is the one place the mock's personas are replaced. `Shell` stops deriving "who is signed in" from the URL and receives a `ShellDto` (from `getShell`) and the nav items the viewer may open (from `navFor`). Everything the persona object carried (`org`, `orgSub`, initials, `user`, `role`, the partner manager the Message drawer writes to) is rebuilt as a local `me` object from the `ShellDto`, so the markup below it does not change. The nav count comes from `shell.waitingApprovals`. The "View as CleanStart staff" review switch is removed and Sign out becomes real. The Ctrl K palette data, the notification list and the Message drawer's toast stay mock until W2-a wires the A and R track components; `personas.ts` and the mock banner stay until M5.4.

Invoke the `design-taste-frontend` skill before editing markup (repo rule for any UI change). This task changes no visual: markup, class names and CSS stay as they are, and the repo's design tokens outrank the skill's house style.

**Files:**
- Modify: `apps/portal/src/lib/routes.ts` (replaced), `apps/portal/src/components/shell/shell.tsx`, `apps/portal/src/app/page.tsx`, `apps/portal/src/app/partner/layout.tsx`, `apps/portal/src/app/partner/page.tsx`, `apps/portal/src/app/admin/layout.tsx`, `apps/portal/src/app/admin/page.tsx`
- Create: `apps/portal/src/lib/initials.ts`
- Test: `apps/portal/src/lib/routes.test.ts`, `apps/portal/src/lib/initials.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1f | started | W0 | - | - | routes, layouts, shell" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the two tests**

Create `apps/portal/src/lib/routes.test.ts` (the nav per role is the list in the contracts' section L):

```ts
import { describe, expect, it } from "vitest";
import type { PartnerViewer, StaffViewer } from "@/server/auth/types";
import { navFor } from "./routes";

const partner = (role: PartnerViewer["role"]): PartnerViewer => ({
  id: "u1",
  kind: "partner",
  role,
  partnerId: "p1",
  partnerName: "Kestrel Systems",
  email: "aditi@example.com",
  name: "Aditi Rao",
});

const staff = (role: StaffViewer["role"]): StaffViewer => ({
  id: "u2",
  kind: "staff",
  role,
  partnerId: null,
  partnerName: null,
  region: "india",
  email: "farhan@example.com",
  name: "Farhan Qureshi",
});

const labels = (viewer: PartnerViewer | StaffViewer): string[] => navFor(viewer).map((item) => item.label);

describe("navFor", () => {
  it("gives a partner admin every partner item", () => {
    expect(labels(partner("partner_admin"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Team", "Company"]);
  });

  it("gives partner sales everything except Team", () => {
    expect(labels(partner("sales"))).toEqual(["Overview", "Deals", "Register deal", "Documents", "Company"]);
  });

  it("gives a technical partner user Documents and Company only", () => {
    expect(labels(partner("technical"))).toEqual(["Documents", "Company"]);
  });

  it("gives a partner manager every admin item", () => {
    expect(labels(staff("partner_manager"))).toEqual(["Deal approvals", "Partners", "Documents", "Reports", "Team", "Audit log"]);
  });

  it("gives staff sales approvals, partners and reports", () => {
    expect(labels(staff("sales"))).toEqual(["Deal approvals", "Partners", "Reports"]);
  });

  it("gives marketing Documents only", () => {
    expect(labels(staff("marketing"))).toEqual(["Documents"]);
  });

  it("keeps the approvals count key on the approvals item", () => {
    expect(navFor(staff("partner_manager"))[0]?.count).toBe("approvals");
  });
});
```

Create `apps/portal/src/lib/initials.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { initialsOf } from "./initials";

describe("initialsOf", () => {
  it.each([
    ["Aditi Rao", "AR"],
    ["Kestrel Systems", "KS"],
    ["Coralbay Technologies Pvt Ltd", "CT"],
    ["  Farhan   Qureshi ", "FQ"],
    ["CleanStart", "C"],
    ["", ""],
  ])("%j becomes %j", (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});
```

- [ ] **Step 3: Run them and see them fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/lib/routes.test.ts src/lib/initials.test.ts
```

Expected: FAIL: `Tests  7 failed (7)` with `TypeError: (0 , navFor) is not a function` in `routes.test.ts`, and `Failed to resolve import "./initials"` in `initials.test.ts`.

- [ ] **Step 4: Replace `routes.ts` and create `initials.ts`**

Replace `apps/portal/src/lib/routes.ts`. It adds `resetPassword` to `ROUTES`, an `action` on every nav item (the same permission the page checks, so the sidebar and the page cannot disagree), and `navFor(viewer)`:

```ts
import type { IconName } from "@/components/icon-paths";
import { type Action, can } from "@/server/auth/policies";
import type { Viewer } from "@/server/auth/types";

export const ROUTES = {
  signIn: "/sign-in",
  resetPassword: "/reset-password",
  apply: "/apply",
  applyDone: "/apply/done",
  acceptInvite: "/accept-invite",
  partner: {
    welcome: "/partner/welcome",
    overview: "/partner/overview",
    deals: "/partner/deals",
    newDeal: "/partner/deals/new",
    deal: (id: string): string => `/partner/deals/${id}`,
    documents: "/partner/documents",
    team: "/partner/team",
    company: "/partner/company",
    account: "/partner/account",
  },
  admin: {
    approvals: "/admin/approvals",
    partners: "/admin/partners",
    documents: "/admin/documents",
    reports: "/admin/reports",
    team: "/admin/team",
    audit: "/admin/audit",
  },
} as const;

export type PortalKind = "partner" | "admin";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** The permission that shows this item: the same action the page itself checks. */
  action: Action;
  /** Key into the live nav counts, if the item shows a count. */
  count?: "approvals";
}

export const PARTNER_NAV: readonly NavItem[] = [
  { label: "Overview", href: ROUTES.partner.overview, icon: "dash", action: "overview.read" },
  { label: "Deals", href: ROUTES.partner.deals, icon: "deals", action: "registration.read" },
  { label: "Register deal", href: ROUTES.partner.newDeal, icon: "reg", action: "registration.create" },
  { label: "Documents", href: ROUTES.partner.documents, icon: "docs", action: "document.read" },
  { label: "Team", href: ROUTES.partner.team, icon: "team", action: "team.read" },
  { label: "Company", href: ROUTES.partner.company, icon: "bld", action: "partner.read" },
];

export const ADMIN_NAV: readonly NavItem[] = [
  { label: "Deal approvals", href: ROUTES.admin.approvals, icon: "approve", action: "registration.read_queue", count: "approvals" },
  { label: "Partners", href: ROUTES.admin.partners, icon: "bld", action: "partner.read" },
  { label: "Documents", href: ROUTES.admin.documents, icon: "docs", action: "document.upload" },
  { label: "Reports", href: ROUTES.admin.reports, icon: "chart", action: "report.read" },
  { label: "Team", href: ROUTES.admin.team, icon: "team", action: "staff.read" },
  { label: "Audit log", href: ROUTES.admin.audit, icon: "clk", action: "audit.read" },
];

/** The sidebar items this viewer may open, in order. */
export function navFor(viewer: Viewer): NavItem[] {
  const items = viewer.kind === "partner" ? PARTNER_NAV : ADMIN_NAV;
  return items.filter((item) => can(viewer, item.action));
}
```

Create `apps/portal/src/lib/initials.ts` (the same behaviour as the mock's `initialsOf` in `data/partners.ts`, which is deleted in M5.4):

```ts
/** "Kestrel Systems" becomes "KS": the first letter of the first two words, upper case. */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
```

- [ ] **Step 5: Run the tests and see them pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/lib/routes.test.ts src/lib/initials.test.ts
```

Expected: `Test Files  2 passed (2)`, `Tests  13 passed (13)` (7 and 6).

- [ ] **Step 6: Replace the layouts and index pages**

Each layout calls `requireKind` (a partner opening `/admin` lands on their own home, signed out goes to sign in with a return path), loads `getShell` inside `withViewer`, and passes the nav for that viewer. Typecheck stays red until Step 7 (the layouts pass props `Shell` does not accept yet).

Replace `apps/portal/src/app/partner/layout.tsx`:

```tsx
import { Shell } from "@/components/shell/shell";
import { navFor } from "@/lib/routes";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getShell } from "@/server/repo/account";

export default async function PartnerLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const viewer = await requireKind("partner");
  const shell = await withViewer(viewer, (tx) => getShell(tx, viewer));
  return (
    <Shell kind="partner" shell={shell} nav={navFor(viewer)}>
      {children}
    </Shell>
  );
}
```

Replace `apps/portal/src/app/admin/layout.tsx`:

```tsx
import { Shell } from "@/components/shell/shell";
import { navFor } from "@/lib/routes";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getShell } from "@/server/repo/account";

export default async function AdminLayout({ children }: { children: React.ReactNode }): Promise<React.JSX.Element> {
  const viewer = await requireKind("staff");
  const shell = await withViewer(viewer, (tx) => getShell(tx, viewer));
  return (
    <Shell kind="admin" shell={shell} nav={navFor(viewer)}>
      {children}
    </Shell>
  );
}
```

Replace `apps/portal/src/app/partner/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { homeFor, requireKind } from "@/server/auth/viewer";

export default async function PartnerIndex(): Promise<never> {
  redirect(homeFor(await requireKind("partner")));
}
```

Replace `apps/portal/src/app/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { homeFor, requireKind } from "@/server/auth/viewer";

export default async function AdminIndex(): Promise<never> {
  redirect(homeFor(await requireKind("staff")));
}
```

Replace `apps/portal/src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getViewer, homeFor } from "@/server/auth/viewer";

export default async function Home(): Promise<never> {
  const viewer = await getViewer();
  redirect(viewer ? homeFor(viewer) : ROUTES.signIn);
}
```

- [ ] **Step 7: Apply the shell edits**

Apply these edits to `apps/portal/src/components/shell/shell.tsx` in order, S1 to S8. Every Find text must match exactly once (S8 matches 20 times and is replaced everywhere, and must be applied last).

**Edit S1.** Imports: the real viewer replaces the mock slices and personas.

Find:

```tsx
import { useWaitingApprovals } from "@/data/deals";
import { createSlice } from "@/lib/slice";
import { ADMIN_NAV, type NavItem, PARTNER_NAV, type PortalKind, ROUTES } from "@/lib/routes";
```

Replace with:

```tsx
import { authClient } from "@/lib/auth-client";
import type { ShellDto } from "@/lib/dto";
import { initialsOf } from "@/lib/initials";
import { createSlice } from "@/lib/slice";
import { type NavItem, type PortalKind, ROUTES } from "@/lib/routes";
```

**Edit S2.** The persona file is no longer imported (it is deleted in M5.4).

Find:

```tsx
import { KESTREL, type Persona, QAMAR, STAFF } from "./personas";
```

Replace with nothing (delete those lines).

**Edit S3.** Delete personaFor: the viewer, not the URL, decides who is signed in.

Find:

```tsx
function personaFor(kind: PortalKind, pathname: string): Persona {
  if (kind === "admin") return STAFF;
  return pathname.startsWith(ROUTES.partner.welcome) ? QAMAR : KESTREL;
}
```

Replace with nothing (delete those lines).

**Edit S4.** Props and the identity block. `me` has the same fields the persona had, filled from the real viewer.

Find:

```tsx
export function Shell({
  kind,
  children,
}: {
  kind: PortalKind;
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const toast = useToast();
  const persona = personaFor(kind, pathname);
  const nav = kind === "partner" ? PARTNER_NAV : ADMIN_NAV;
  const waiting = useWaitingApprovals();
```

Replace with:

```tsx
export function Shell({
  kind,
  shell,
  nav,
  children,
}: {
  kind: PortalKind;
  /** The signed in viewer, their company and the nav counts, from getShell(). */
  shell: ShellDto;
  /** The sidebar items this viewer may open, from navFor(). */
  nav: readonly NavItem[];
  children: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const toast = useToast();
  const me = {
    org: shell.orgName,
    orgSub: shell.orgSub,
    orgInitials: initialsOf(shell.orgName),
    user: shell.viewerName,
    userInitials: initialsOf(shell.viewerName),
    role: shell.roleLabel,
    manager: shell.manager ? { ...shell.manager, initials: initialsOf(shell.manager.name) } : undefined,
  };
  const waiting = shell.waitingApprovals;
```

**Edit S5.** Message drawer footer: the real sender address.

Find:

```tsx
<span className="hint">Sent from {persona.user.toLowerCase().replace(" ", ".")}@{persona.org.toLowerCase().replace(/\s+/g, "")}.com</span>
```

Replace with:

```tsx
<span className="hint">Sent from {shell.viewerEmail}</span>
```

**Edit S6.** Sign out is real, and the review-mode "View as" switch is gone.

Find:

```tsx
                    <Link
                      href={kind === "partner" ? ROUTES.admin.approvals : ROUTES.partner.overview}
                      role="menuitem"
                      className="li"
                    >
                      <span className="li-ic">
                        <Icon name={kind === "partner" ? "approve" : "deals"} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">{kind === "partner" ? "View as CleanStart staff" : "View as a partner"}</span>
                        <span className="li-s">Review mode, switch role</span>
                      </span>
                    </Link>
                    <Link href={ROUTES.signIn} role="menuitem" className="li">
                      <span className="li-ic">
                        <Icon d={SIGN_OUT} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">Sign out</span>
                      </span>
                    </Link>
```

Replace with:

```tsx
                    <button type="button" role="menuitem" className="li linkbtn" style={{ width: "100%" }} onClick={signOut}>
                      <span className="li-ic">
                        <Icon d={SIGN_OUT} />
                      </span>
                      <span className="li-t">
                        <span className="li-n">Sign out</span>
                      </span>
                    </button>
```

**Edit S7.** The sign out handler, after countFor.

Find:

```tsx
  const countFor = (item: NavItem): string => (item.count === "approvals" && waiting > 0 ? String(waiting) : "");
```

Replace with:

```tsx
  const countFor = (item: NavItem): string => (item.count === "approvals" && waiting > 0 ? String(waiting) : "");

  const signOut = async (): Promise<void> => {
    await authClient.signOut();
    // A full navigation, so no signed in page survives in the client router cache.
    window.location.assign(ROUTES.signIn);
  };
```

**Edit S8.** Every remaining `persona.` becomes `me.` (replace all). Replace all 20 occurrences of the text below with its replacement.

Find:

```tsx
persona.
```

Replace with:

```tsx
me.
```

- [ ] **Step 8: Typecheck and run the whole suite**

```bash
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
```

Expected: typecheck prints nothing and exits 0. `test` passes. `grep -rn "persona" apps/portal/src/components/shell/shell.tsx` prints nothing.

- [ ] **Step 9: Look at it**

Per the Dev Server Policy in `CLAUDE.md`: check what is listening first, reuse a server that belongs to this worktree, never kill a process to free a port.

```bash
lsof -nP -iTCP:3204 -sTCP:LISTEN
pnpm --filter @cleanstart/portal db:seed
pnpm --filter @cleanstart/portal exec next dev --port 3204
```

Sign in is converted in the next task, so for this check create a session without the UI: with the dev server running, sign in over HTTP with a seeded user (`aditi.rao@kestrelsystems.in`, the password is `DEV_SEED_PASSWORD` in `src/db/fixtures.ts`) and copy the `better-auth.session_token` cookie into the Browser pane, or wait and do this check at the end of Task M1.1g. Locked to 1440 by 900, open `/partner/overview` as Aditi (sidebar shows Kestrel Systems, "Channel partner, India", "Partner admin"), then as `farhan.qureshi@cleanstart.com` open `/admin/approvals` (sidebar shows the waiting count, "Partner manager, India"), and `/partner/overview` as Farhan, which must land on `/admin/approvals`. If no browser is available (overnight run), write `not visually checked` in the `done` line.

- [ ] **Step 10: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0; the build route table shows every `/partner/*` and `/admin/*` route as `ƒ` (dynamic).

- [ ] **Step 11: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/lib/routes.ts apps/portal/src/lib/routes.test.ts apps/portal/src/lib/initials.ts apps/portal/src/lib/initials.test.ts apps/portal/src/components/shell/shell.tsx apps/portal/src/app/page.tsx apps/portal/src/app/partner/layout.tsx apps/portal/src/app/partner/page.tsx apps/portal/src/app/admin/layout.tsx apps/portal/src/app/admin/page.tsx docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1f routes, layouts and the shell use the real viewer"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1f | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | navFor, layouts, shell without personas" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M1.1g: Sign in screen conversion (W0-f)

The Sign in screen keeps its markup, class names and copy. What changes is behaviour: the password form calls `authClient.signIn.email` (with "Keep me signed in" as `rememberMe`), a second step view appears only when the server answers `twoFactorRedirect` and verifies with `authClient.twoFactor.verifyTotp` or `verifyBackupCode`, the Google and Microsoft buttons start `authClient.signIn.social` and are shown only for providers that are configured, "Forgot password" calls `authClient.requestPasswordReset` and always answers the same, and a successful sign in does a full navigation to the `?next=` page (checked by `safeNext`) or `/`, which sends each role to its home. The prefilled demo login and the "Demo shortcuts" note are removed because they no longer work. The "Request access" views (`request`, `requested`, `nopartner`) stay mock driven until the P track converts them in M1.6; their imports from `@/data/partners` stay.

There is no component test setup (Vitest runs in Node, no DOM), so this task has no failing component test first. The server behaviour the screen depends on is already pinned: S2 to S5 (spike), the HTTP second step test and the gate tests (Task M1.1c), and the guard tests (Task M1.1d). The screen is checked by hand in Step 6.

Invoke the `design-taste-frontend` skill before editing markup. This task changes no visual.

**Files:**
- Modify: `apps/portal/src/components/screens/SignIn.tsx`, `apps/portal/src/app/(public)/sign-in/page.tsx`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1g | started | W0 | - | - | SignIn conversion" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Replace the sign in page**

The page is a Server Component: a signed in viewer is redirected home, and the client screen learns which social providers are configured (from the same env builder `auth.ts` uses, so the buttons and the routes cannot disagree). Replace `apps/portal/src/app/(public)/sign-in/page.tsx`:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignIn } from "@/components/screens/SignIn";
import { env } from "@/env";
import { buildSocialProviders } from "@/server/auth/auth";
import { getViewer, homeFor } from "@/server/auth/viewer";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await getViewer();
  if (viewer) redirect(homeFor(viewer));
  const configured = buildSocialProviders(env);
  return <SignIn providers={{ google: configured.google !== undefined, microsoft: configured.microsoft !== undefined }} />;
}
```

- [ ] **Step 3: Apply the screen edits**

Apply these edits to `apps/portal/src/components/screens/SignIn.tsx` in order G1 to G13. Each Find text must match exactly once.

**Edit G1.** Imports: the Better Auth client and the return path guard replace the router.

Find:

```tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
```

Replace with:

```tsx
import Link from "next/link";
import { useEffect, useState } from "react";
```

**Edit G2.** Add the two imports after the Icon import (keep the others as they are).

Find:

```tsx
import { PasswordField } from "@/components/ui/password-field";
```

Replace with:

```tsx
import { PasswordField } from "@/components/ui/password-field";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/next-path";
```

**Edit G3.** The demo constants go; the props type and the user facing messages arrive.

Find:

```tsx
const DEMO_EMAIL = "aditi.rao@kestrelsystems.in";
const DEMO_PASSWORD = "sample-password";
const STAFF_DOMAIN = "cleanstart.com";
```

Replace with:

```tsx
const TOO_MANY = "Too many attempts. Try again in a moment.";

/** Which social buttons to show: only providers whose keys are configured on the server. */
interface SocialAvailability {
  google: boolean;
  microsoft: boolean;
}
```

**Edit G4.** Component head: no router, no prefilled demo values, and the error and busy state.

Find:

```tsx
export function SignIn(): React.JSX.Element {
  const router = useRouter();
  const { partners } = partnersSlice.use();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
```

Replace with:

```tsx
export function SignIn({ providers }: { providers: SocialAvailability }): React.JSX.Element {
  const { partners } = partnersSlice.use();
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [socialError, setSocialError] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [resetError, setResetError] = useState("");
```

**Edit G5.** The reset email starts empty.

Find:

```tsx
  const [resetEmail, setResetEmail] = useState(DEMO_EMAIL);
```

Replace with:

```tsx
  const [resetEmail, setResetEmail] = useState("");
```

**Edit G6.** Read ?request=1 as before, and ?error= when a social sign in was refused.

Find:

```tsx
  // The Apply page links here with ?request=1 when an applicant's company is already a partner.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("request") === "1") setView("request");
  }, []);

  const enter = (address: string): void => {
    router.push(emailDomain(address) === STAFF_DOMAIN ? ROUTES.admin.approvals : ROUTES.partner.overview);
  };
```

Replace with:

```tsx
  // The Apply page links here with ?request=1 when an applicant's company is already a partner.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("request") === "1") setView("request");
    if (params.get("error")) setSocialError(true);
  }, []);

  // A full navigation: the session cookie was just set, and "/" sends each role to its own home.
  const enter = (): void => {
    window.location.assign(safeNext(new URLSearchParams(window.location.search).get("next")) ?? "/");
  };

  const signInWith = async (provider: "google" | "microsoft"): Promise<void> => {
    setSocialError(false);
    await authClient.signIn.social({
      provider,
      callbackURL: safeNext(new URLSearchParams(window.location.search).get("next")) ?? "/",
      errorCallbackURL: ROUTES.signIn,
    });
  };
```

**Edit G7.** Password sign in.

Find:

```tsx
  const submitSignin = (event: React.FormEvent): void => {
    event.preventDefault();
    if (emailBad || passwordBad) {
      setSigninTried(true);
      return;
    }
    setCode("");
    setCodeTried(false);
    setBackup(false);
    setView("code");
  };

  const codeRaw = code.replace(/\s/g, "");
  const codeReady = backup ? /^[A-Za-z0-9]{10}$/.test(codeRaw) : /^\d{6}$/.test(codeRaw);
  const verify = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!codeReady) {
      setCodeTried(true);
      return;
    }
    enter(email);
  };
```

Replace with:

```tsx
  const submitSignin = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (emailBad || passwordBad) {
      setSigninTried(true);
      return;
    }
    setBusy(true);
    setSigninError("");
    const { data, error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
      rememberMe: keepSignedIn,
    });
    setBusy(false);
    if (error) {
      setSigninError(error.status === 429 ? TOO_MANY : "That email and password do not match.");
      return;
    }
    if ((data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) {
      setCode("");
      setCodeTried(false);
      setCodeError("");
      setBackup(false);
      setView("code");
      return;
    }
    enter();
  };

  // Backup codes are shown as "XXXXX XXXXX" and stored as "XXXXX-XXXXX"; accept either, with or without the gap.
  const codeRaw = code.replace(/[\s-]/g, "");
  const codeReady = backup ? /^[A-Za-z0-9]{10}$/.test(codeRaw) : /^\d{6}$/.test(codeRaw);
  const verify = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!codeReady) {
      setCodeTried(true);
      return;
    }
    setBusy(true);
    setCodeError("");
    const { error } = backup
      ? await authClient.twoFactor.verifyBackupCode({ code: `${codeRaw.slice(0, 5)}-${codeRaw.slice(5)}` })
      : await authClient.twoFactor.verifyTotp({ code: codeRaw });
    setBusy(false);
    if (error) {
      setCodeError(
        error.status === 429
          ? TOO_MANY
          : backup
            ? "That backup code did not work. Check it and try again."
            : "That code did not work. Check it and try again.",
      );
      return;
    }
    enter();
  };
```

**Edit G8.** Password reset request. The answer is the same whether or not the address has a login.

Find:

```tsx
  const sendReset = (event: React.FormEvent): void => {
    event.preventDefault();
    if (resetBad) {
      setResetTried(true);
      return;
    }
    setView("sent");
  };
```

Replace with:

```tsx
  const sendReset = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (resetBad) {
      setResetTried(true);
      return;
    }
    setBusy(true);
    setResetError("");
    const { error } = await authClient.requestPasswordReset({
      email: resetEmail.trim().toLowerCase(),
      redirectTo: ROUTES.resetPassword,
    });
    setBusy(false);
    if (error) {
      setResetError(error.status === 429 ? TOO_MANY : "We could not send the link. Try again in a moment.");
      return;
    }
    setView("sent");
  };
```

**Edit G9.** Social buttons: shown only for configured providers, and they start the real flow.

Find:

```tsx
            <PublicHeading title="Sign in">Use the work email your partner admin invited.</PublicHeading>
            <div style={{ display: "grid", gap: 8 }} data-tour="signin-sso">
              <button
                type="button"
                className="btn btn-s"
                style={BTN_BIG}
                onClick={() => enter(isValidEmail(email) ? email : DEMO_EMAIL)}
              >
                <Icon d={GOOGLE_D} />
                Continue with Google
              </button>
              <button
                type="button"
                className="btn btn-s"
                style={BTN_BIG}
                onClick={() => enter(isValidEmail(email) ? email : DEMO_EMAIL)}
              >
                <Icon d={MICROSOFT_D} />
                Continue with Microsoft
              </button>
            </div>
            <div
              role="separator"
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#6B687D" }}
            >
              <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
              or with your work email
              <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
            </div>
```

Replace with:

```tsx
            <PublicHeading title="Sign in">Use the work email your partner admin invited.</PublicHeading>
            {socialError ? (
              <span className="err" role="alert">
                That sign-in did not work. Use the email your partner admin invited, or sign in with your password.
              </span>
            ) : null}
            {providers.google || providers.microsoft ? (
              <>
                <div style={{ display: "grid", gap: 8 }} data-tour="signin-sso">
                  {providers.google ? (
                    <button type="button" className="btn btn-s" style={BTN_BIG} onClick={() => void signInWith("google")}>
                      <Icon d={GOOGLE_D} />
                      Continue with Google
                    </button>
                  ) : null}
                  {providers.microsoft ? (
                    <button type="button" className="btn btn-s" style={BTN_BIG} onClick={() => void signInWith("microsoft")}>
                      <Icon d={MICROSOFT_D} />
                      Continue with Microsoft
                    </button>
                  ) : null}
                </div>
                <div
                  role="separator"
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "#6B687D" }}
                >
                  <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
                  or with your work email
                  <span style={{ flex: 1, height: 1, background: "#ECEBF1" }} />
                </div>
              </>
            ) : null}
```

**Edit G10.** Sign in button: busy state and the form level error. The demo shortcuts note goes.

Find:

```tsx
            <button type="submit" className="btn btn-p" style={BTN_BIG}>
              Sign in
            </button>
```

Replace with:

```tsx
            {signinError ? (
              <span className="err" role="alert">
                {signinError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Sign in
            </button>
```

**Edit G11.** Delete the demo shortcuts note: there is no demo login any more.

Find:

```tsx
            <div className="note note-violet" style={{ flexDirection: "column", gap: 8 }}>
              <b>Demo shortcuts</b>
              <span>
                This is a mock with made-up data. The form is prefilled with Aditi Rao's sample login
                (aditi.rao@kestrelsystems.in, password sample-password). Any email and password work, and the two-step code is any 6 digits (for example 123456). An
                address ending in @cleanstart.com opens the staff side.
              </span>
              <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                <Link href={ROUTES.partner.overview} className="btn btn-s">
                  Open as partner (Kestrel Systems)
                </Link>
                <Link href={ROUTES.admin.approvals} className="btn btn-s">
                  Open as CleanStart staff
                </Link>
              </span>
            </div>
```

Replace with nothing (delete those lines).

**Edit G12.** Code step: the form level error and the busy state.

Find:

```tsx
            <button type="submit" className="btn btn-p" style={BTN_BIG}>
              Verify and sign in
            </button>
```

Replace with:

```tsx
            {codeError ? (
              <span className="err" role="alert">
                {codeError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Verify and sign in
            </button>
```

**Edit G13.** Reset step: the form level error and the busy state.

Find:

```tsx
            <button type="submit" className="btn btn-p" style={BTN_BIG}>
              Send reset link
            </button>
```

Replace with:

```tsx
            {resetError ? (
              <span className="err" role="alert">
                {resetError}
              </span>
            ) : null}
            <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
              Send reset link
            </button>
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal lint
```

Expected: both exit 0. (`useRouter` is gone, `emailDomain`, `findPartnerByDomain`, `isFreeEmail`, `isValidEmail` and `partnersSlice` are still used by the request access views.)

- [ ] **Step 5: Run the whole suite**

```bash
pnpm --filter @cleanstart/portal test
```

Expected: all test files pass.

- [ ] **Step 6: Check it by hand**

Start or reuse the dev server (`lsof -nP -iTCP:3204 -sTCP:LISTEN` first; never kill a process for a port), seed (`pnpm --filter @cleanstart/portal db:seed`), and in the Browser pane at 1440 by 900 open `http://localhost:3204/sign-in`. The password for every seeded login is `DEV_SEED_PASSWORD` in `src/db/fixtures.ts`.

1. The form is empty (no prefilled demo values), no "Demo shortcuts" note, no social buttons (no provider keys in `.env`).
2. `aditi.rao@kestrelsystems.in` with a wrong password: the line "That email and password do not match." appears; the same line appears for an unknown address and for a seeded user whose status you set to `disabled`.
3. The right password for Aditi lands on `/partner/overview`; `karan.malhotra@kestrelsystems.in` (Sales) lands on `/partner/overview`; `sneha.iyer@kestrelsystems.in` (Technical) lands on `/partner/documents`; `farhan.qureshi@cleanstart.com` lands on `/admin/approvals`.
4. Signed out, open `/partner/deals`: you are sent to `/sign-in?next=%2Fpartner%2Fdeals`, and after signing in you land on `/partner/deals` (a technical user bounces on to `/partner/documents`).
5. Open `/sign-in?next=https://evil.example.com`: after signing in you land on your home, not on that host.
6. "Forgot password?" then Send reset link: "Check your email" appears for a known and an unknown address alike, and the dev server log shows `password reset requested` (the mail arrives in Task M0.5d).
7. Sign out in the profile menu returns to `/sign-in`, and `/partner/overview` redirects back to sign in.

The two step view needs a user with the second step on; the screen to turn it on is built by the P track in M1.7, so that view is first exercised end to end by the W2-b E2E. Its server calls are pinned by the HTTP second step test (Task M1.1c). If no browser is available, write `not visually checked` in the `done` line.

- [ ] **Step 7: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0. Gate B must confirm that the edits kept every class name and every piece of copy that was not an error line, the demo note and the demo values.

- [ ] **Step 8: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/components/screens/SignIn.tsx "apps/portal/src/app/(public)/sign-in/page.tsx" docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M1.1g Sign in screen uses real auth"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M1.1g | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | SignIn real, second step, social, reset request" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.5a: Email layout, transport, Brevo, send, fake and URLs (W0-g)

The portal builds its own emails in code and sends `subject` plus `htmlContent` through Brevo, never a Brevo dashboard template (CLAUDE.md, Email): Brevo fills `{{ params.* }}` placeholders without escaping, so visitor input would reach inboxes as live markup. The layout follows the CMS conventions (table layout, inline styles, Arial, a preheader, escaped input, the postal address) and imports nothing from `apps/cms`. The sender name is the constant `PORTAL_SENDER_NAME` in `transport.ts`; no environment variable can change it. Without Brevo keys (development, tests) the transport logs the subject and, outside production, the links in the message, so an invite or reset link can be followed without sending anything.

**Files:**
- Create: `apps/portal/src/server/email/{transport,brevo,send,fake,layout}.ts`, `apps/portal/src/server/urls.ts`
- Test: `apps/portal/src/server/email/{layout,brevo,transport,send,fake}.test.ts`, `apps/portal/src/server/urls.test.ts`, and the snapshot `apps/portal/src/server/email/__snapshots__/layout.test.ts.snap`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5a | started | W0 | - | - | email layout and transport" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Verify the Brevo request shape against the CMS, which already sends in production**

Verify: endpoint, header names, body fields and the success response.

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
grep -n "v3/smtp/email\|'api-key'\|sender\|replyTo\|htmlContent\|messageId" apps/cms/src/payload/lib/email/brevo.ts
```

Expected: the endpoint `https://api.brevo.com/v3/smtp/email`, the `api-key` header, a `sender` object with `email` and `name`, `to`, `replyTo`, `subject`, `htmlContent`, and a `messageId` read from the JSON response. If anything differs, fix `brevo.ts` in Step 5 to match the CMS file (read only, never edit it).

- [ ] **Step 3: Write the tests (they fail first)**

Create `apps/portal/src/server/email/layout.test.ts`. The snapshot test writes `__snapshots__/layout.test.ts.snap` on first run; commit it. The other cases pin the structure that the snapshot would also catch, so a failure says what broke.

```ts
import { describe, expect, it } from 'vitest';
import { escapeHtml, renderEmail } from './layout';

const sample = () =>
  renderEmail({
    preheader: 'Your reference is APP-2611-0042.',
    heading: 'Application received',
    blocks: [
      { type: 'paragraph', text: 'Hello Rohit Desai,' },
      { type: 'facts', rows: [{ label: 'Reference', value: 'APP-2611-0042' }, { label: 'Reason', value: '' }] },
      { type: 'note', text: 'Quote the reference if you write to us.' },
      { type: 'button', label: 'Open the portal', url: 'https://partners.example.com/sign-in?next=%2Fpartner&x=1' },
    ],
    footnote: 'You received this email because you applied.',
  });

describe('escapeHtml', () => {
  it('neutralises markup and quotes', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    );
  });
});

describe('renderEmail', () => {
  it('matches the layout snapshot', () => {
    expect(sample()).toMatchSnapshot();
  });

  it('is a complete light mode document', () => {
    const html = sample();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('name="color-scheme" content="light"');
    expect(html).toContain('<title>Application received</title>');
  });

  it('puts the hidden preheader before the heading', () => {
    const html = sample();
    const at = html.indexOf('Your reference is APP-2611-0042.', html.indexOf('<body'));
    expect(at).toBeGreaterThan(-1);
    expect(at).toBeLessThan(html.indexOf('<h1'));
    expect(html.slice(at - 200, at)).toContain('display:none');
  });

  it('lays out with tables and Arial, never flex or grid', () => {
    const html = sample();
    expect(html).toContain('role="presentation"');
    expect(html).toContain('Arial,Helvetica,sans-serif');
    expect(html).not.toMatch(/display:\s*(flex|grid)/);
  });

  it('names the brand in the logo alt text and carries the postal address', () => {
    const html = sample();
    expect(html).toContain('alt="CleanStart"');
    expect(html).toContain('16192 Coastal Highway');
  });

  it('drops a facts row with no value and renders the others', () => {
    const html = sample();
    expect(html).toContain('Reference');
    expect(html).not.toContain('>Reason<');
  });

  it('makes the button a padded table cell and escapes the ampersand in the link', () => {
    const html = sample();
    expect(html).toContain('class="cs-btn"');
    expect(html).toContain('href="https://partners.example.com/sign-in?next=%2Fpartner&amp;x=1"');
  });

  it('leaves out a button whose URL is not http or https', () => {
    const html = renderEmail({
      preheader: 'p',
      heading: 'h',
      blocks: [
        { type: 'button', label: 'Click', url: 'javascript:alert(1)' },
        { type: 'button', label: 'Also click', url: 'not a url' },
      ],
    });
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('>Click<');
    expect(html).not.toContain('>Also click<');
  });

  it('escapes the heading, preheader, facts, notes and footnote', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const html = renderEmail({
      preheader: evil,
      heading: evil,
      blocks: [
        { type: 'paragraph', text: evil },
        { type: 'facts', rows: [{ label: evil, value: evil }] },
        { type: 'note', text: evil },
      ],
      footnote: evil,
    });
    expect(html).not.toContain('<img src=x');
    expect(html.match(/&lt;img src=x onerror=alert\(1\)&gt;/g)?.length).toBeGreaterThanOrEqual(7);
  });

  it('omits the footnote paragraph when there is none', () => {
    const html = renderEmail({ preheader: 'p', heading: 'h', blocks: [] });
    expect(html).not.toContain('You received this email');
  });
});
```

Create `apps/portal/src/server/email/brevo.test.ts` (the sender name stays `CleanStart Partners` even when `BREVO_SENDER_NAME` is set to something else):

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrevoTransport } from './brevo';
import { PORTAL_SENDER_NAME } from './transport';

const message = {
  to: [{ email: 'person@example.com', name: 'Person' }],
  subject: 'Hello',
  htmlContent: '<p>Hi</p>',
};

const transportWith = (fetchMock: typeof fetch) =>
  createBrevoTransport({ apiKey: 'key-1', senderEmail: 'partners@cleanstart.example', senderName: PORTAL_SENDER_NAME, fetch: fetchMock });

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createBrevoTransport', () => {
  it('posts subject and htmlContent to the Brevo endpoint and returns the message id', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ messageId: '<abc@brevo>' }), { status: 201 }));
    const result = await transportWith(fetchMock).send({ ...message, replyTo: { email: 'aditi@kestrel.example', name: 'Aditi' } });
    expect(result).toEqual({ status: 'sent', messageId: '<abc@brevo>' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'api-key': 'key-1', 'content-type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { email: 'partners@cleanstart.example', name: 'CleanStart Partners' },
      to: [{ email: 'person@example.com', name: 'Person' }],
      replyTo: { email: 'aditi@kestrel.example', name: 'Aditi' },
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
    });
  });

  it('pins the sender name in code, whatever the environment says', async () => {
    vi.stubEnv('BREVO_SENDER_NAME', 'CleanStart Careers');
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }));
    await transportWith(fetchMock).send(message);
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender.name).toBe('CleanStart Partners');
  });

  it('lets one message set its own sender name', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }));
    await transportWith(fetchMock).send({ ...message, senderName: 'CleanStart Partnerships' });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender.name).toBe('CleanStart Partnerships');
  });

  it('has a null message id when Brevo sends none', async () => {
    const result = await transportWith(vi.fn<typeof fetch>(async () => new Response('{}', { status: 201 }))).send(message);
    expect(result).toEqual({ status: 'sent', messageId: null });
  });

  it('returns Brevo error code and message on a 4xx, without throwing', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify({ code: 'unauthorized', message: 'Key not found' }), { status: 401 }),
    );
    expect(await transportWith(fetchMock).send(message)).toEqual({ status: 'failed', error: 'Brevo 401: unauthorized: Key not found' });
  });

  it('flattens and shortens a body that is not JSON', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(`<html>\n${'x'.repeat(500)}\n</html>`, { status: 502 }));
    const result = await transportWith(fetchMock).send(message);
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.error.startsWith('Brevo 502: <html> xxx')).toBe(true);
      expect(result.error.length).toBeLessThanOrEqual(200);
      expect(result.error).not.toContain('\n');
    }
  });

  it('returns a failure for a network error and for a timeout', async () => {
    const network = vi.fn<typeof fetch>(async () => {
      throw new Error('connect ECONNREFUSED');
    });
    expect(await transportWith(network).send(message)).toEqual({ status: 'failed', error: 'network: connect ECONNREFUSED' });
    const timeout = vi.fn<typeof fetch>(async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    });
    expect(await transportWith(timeout).send(message)).toEqual({ status: 'failed', error: 'timeout' });
  });
});
```

Create `apps/portal/src/server/email/transport.test.ts` (the log transport never logs the body, and logs no links in production):

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

const logged = vi.hoisted(() => ({ calls: [] as Array<[Record<string, unknown>, string]> }));
vi.mock('@/server/log', () => ({
  log: {
    debug: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    info: (fields: Record<string, unknown>, message: string) => {
      logged.calls.push([fields, message]);
    },
  },
}));

import { createEmailTransport, PORTAL_SENDER_NAME } from './transport';

const message = {
  to: [{ email: 'person@example.com' }],
  subject: 'Set your password',
  htmlContent: '<p>secret body text</p><a href="https://partners.example.com/accept-invite?token=abc&amp;x=1">Accept</a>',
};

afterEach(() => {
  logged.calls.length = 0;
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('PORTAL_SENDER_NAME', () => {
  it('is fixed', () => {
    expect(PORTAL_SENDER_NAME).toBe('CleanStart Partners');
  });
});

describe('createEmailTransport', () => {
  it('skips, and logs the subject and the links but never the body, when Brevo is not configured', async () => {
    const result = await createEmailTransport({ apiKey: undefined, senderEmail: undefined }).send(message);
    expect(result).toEqual({ status: 'skipped', reason: 'brevo-not-configured' });
    expect(logged.calls).toHaveLength(1);
    const [fields] = logged.calls[0] ?? [{}];
    expect(fields).toEqual({ subject: 'Set your password', recipients: 1, links: ['https://partners.example.com/accept-invite?token=abc&x=1'] });
    expect(JSON.stringify(logged.calls)).not.toContain('secret body text');
  });

  it('does not log links in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    await createEmailTransport({ apiKey: undefined, senderEmail: undefined }).send(message);
    expect(logged.calls[0]?.[0]).toEqual({ subject: 'Set your password', recipients: 1 });
  });

  it('needs both the key and the sender address to use Brevo', async () => {
    const onlyKey = await createEmailTransport({ apiKey: 'key', senderEmail: undefined }).send(message);
    expect(onlyKey.status).toBe('skipped');
  });

  it('sends through Brevo as CleanStart Partners when both are set', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await createEmailTransport({ apiKey: 'key', senderEmail: 'partners@cleanstart.example' }).send(message);
    expect(result).toEqual({ status: 'sent', messageId: 'm1' });
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string);
    expect(body.sender).toEqual({ email: 'partners@cleanstart.example', name: 'CleanStart Partners' });
  });
});
```

Create `apps/portal/src/server/email/send.test.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeEmailTransport } from './fake';
import { sendEmail } from './send';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const message = { to: [{ email: 'person@example.com' }], subject: 'Hello', htmlContent: '<p>private body</p>' };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendEmail', () => {
  it('sends through the transport it is given and reports nothing on success', async () => {
    const transport = new FakeEmailTransport();
    expect(await sendEmail(message, transport)).toEqual({ status: 'sent', messageId: 'fake-1' });
    expect(transport.sent).toEqual([message]);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('returns a failure, reports the subject to Sentry and never the body, and does not throw', async () => {
    const transport = new FakeEmailTransport();
    transport.failNext = 'Brevo 401: unauthorized: Key not found';
    const result = await sendEmail(message, transport);
    expect(result).toEqual({ status: 'failed', error: 'Brevo 401: unauthorized: Key not found' });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error, context] = vi.mocked(Sentry.captureException).mock.calls[0] ?? [];
    expect((error as Error).message).toBe('email failed: Brevo 401: unauthorized: Key not found');
    expect(context).toEqual({ tags: { area: 'email' }, extra: { subject: 'Hello' } });
    expect(JSON.stringify(vi.mocked(Sentry.captureException).mock.calls)).not.toContain('private body');
  });

  it('uses the process wide transport when none is given, which skips when Brevo is not configured', async () => {
    expect((await sendEmail(message)).status).toBe('skipped');
  });
});
```

Create `apps/portal/src/server/email/fake.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FakeEmailTransport } from './fake';

const to = (email: string) => ({ to: [{ email }], subject: `For ${email}`, htmlContent: '<p>x</p>' });

describe('FakeEmailTransport', () => {
  it('records messages in order and finds them by address, ignoring case', async () => {
    const fake = new FakeEmailTransport();
    await fake.send(to('A@example.com'));
    await fake.send(to('b@example.com'));
    expect(fake.sent.map((m) => m.subject)).toEqual(['For A@example.com', 'For b@example.com']);
    expect(fake.to('a@EXAMPLE.com')).toHaveLength(1);
    expect(fake.only('b@example.com').subject).toBe('For b@example.com');
  });

  it('only() throws unless exactly one message went to the address', async () => {
    const fake = new FakeEmailTransport();
    expect(() => fake.only('a@example.com')).toThrow('expected exactly one email to a@example.com, found 0');
    await fake.send(to('a@example.com'));
    await fake.send(to('a@example.com'));
    expect(() => fake.only('a@example.com')).toThrow('found 2');
  });

  it('fails once when failNext is set, then recovers, and clear() resets', async () => {
    const fake = new FakeEmailTransport();
    fake.failNext = 'boom';
    expect(await fake.send(to('a@example.com'))).toEqual({ status: 'failed', error: 'boom' });
    expect(fake.sent).toHaveLength(0);
    expect((await fake.send(to('a@example.com'))).status).toBe('sent');
    fake.clear();
    expect(fake.sent).toEqual([]);
  });
});
```

Create `apps/portal/src/server/urls.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { absoluteUrl, inviteUrl, resetPasswordUrl } from './urls';

describe('urls', () => {
  it('joins APP_URL and a path with one slash', () => {
    expect(absoluteUrl('/partner/deals/1')).toBe('http://localhost:3004/partner/deals/1');
    expect(absoluteUrl('partner/deals/1')).toBe('http://localhost:3004/partner/deals/1');
  });

  it('builds the invite link with the token in the query', () => {
    expect(inviteUrl('abc_DEF-123')).toBe('http://localhost:3004/accept-invite?token=abc_DEF-123');
  });

  it('builds the reset link and encodes a token that needs it', () => {
    expect(resetPasswordUrl('a b&c')).toBe('http://localhost:3004/reset-password?token=a%20b%26c');
  });
});
```

- [ ] **Step 4: Run them and see them fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email src/server/urls.test.ts
```

Expected: FAIL: `Failed to resolve import` for `./layout`, `./brevo`, `./transport`, `./send`, `./fake` and `./urls`.

- [ ] **Step 5: Implement the module**

Create `apps/portal/src/server/email/transport.ts`:

```ts
import { env } from '@/env';
import { log } from '@/server/log';
import { createBrevoTransport } from './brevo';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  htmlContent: string;
  /** Defaults to PORTAL_SENDER_NAME. Pinned in code, never from env (CLAUDE.md, Email). */
  senderName?: string;
}

export type EmailResult =
  | { status: 'sent'; messageId: string | null }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

export interface EmailTransport {
  /** Never throws. A transport failure is returned as { status: 'failed' }. */
  send(message: EmailMessage): Promise<EmailResult>;
}

/**
 * The From name of every portal email. It lives here and not in an environment variable on purpose: the CMS had
 * BREVO_SENDER_NAME rendered onto the droplet from a GitHub variable on every deploy, and it signed demo
 * confirmations "CleanStart Careers" (CLAUDE.md, Email).
 */
export const PORTAL_SENDER_NAME = 'CleanStart Partners';

const HREF = /href="(https?:\/\/[^"]+)"/g;

const linksIn = (html: string): string[] =>
  [...html.matchAll(HREF)].map((match) => (match[1] ?? '').replaceAll('&amp;', '&')).filter((link) => link !== '');

/**
 * What development uses when Brevo is not configured. It logs the subject and, outside production, the links in the
 * message, so an invite or a reset link can be followed without sending anything. It never logs the body.
 */
export function createLogTransport(): EmailTransport {
  return {
    async send(message) {
      log.info(
        {
          subject: message.subject,
          recipients: message.to.length,
          ...(process.env.NODE_ENV === 'production' ? {} : { links: linksIn(message.htmlContent) }),
        },
        'email skipped: Brevo is not configured',
      );
      return { status: 'skipped', reason: 'brevo-not-configured' };
    },
  };
}

export interface EmailTransportConfig {
  apiKey: string | undefined;
  senderEmail: string | undefined;
}

/** Brevo (/v3/smtp/email) when BREVO_API_KEY and BREVO_SENDER_EMAIL are set; otherwise the log transport. */
export function createEmailTransport(
  config: EmailTransportConfig = { apiKey: env.BREVO_API_KEY, senderEmail: env.BREVO_SENDER_EMAIL },
): EmailTransport {
  if (!config.apiKey || !config.senderEmail) return createLogTransport();
  return createBrevoTransport({ apiKey: config.apiKey, senderEmail: config.senderEmail, senderName: PORTAL_SENDER_NAME });
}
```

Create `apps/portal/src/server/email/brevo.ts`:

```ts
import type { EmailMessage, EmailResult, EmailTransport } from './transport';

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10_000;
const MAX_ERROR_LENGTH = 200;

export interface BrevoConfig {
  apiKey: string;
  senderEmail: string;
  /** The From name for a message that does not set its own. The caller passes PORTAL_SENDER_NAME. */
  senderName: string;
  /** For tests. */
  fetch?: typeof fetch;
}

/** Brevo answers errors as { code, message }. Anything else is cut short and flattened to one line. */
async function describeFailure(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  try {
    const parsed = JSON.parse(text) as { code?: unknown; message?: unknown };
    if (typeof parsed.message === 'string') {
      const code = typeof parsed.code === 'string' ? `${parsed.code}: ` : '';
      return `Brevo ${response.status}: ${code}${parsed.message}`.slice(0, MAX_ERROR_LENGTH);
    }
  } catch {
    // not JSON, fall through
  }
  return `Brevo ${response.status}: ${text.replace(/\s+/g, ' ').trim()}`.slice(0, MAX_ERROR_LENGTH);
}

export function createBrevoTransport(config: BrevoConfig): EmailTransport {
  const request = config.fetch ?? fetch;
  return {
    async send(message: EmailMessage): Promise<EmailResult> {
      const body = {
        sender: { email: config.senderEmail, name: message.senderName ?? config.senderName },
        to: message.to,
        ...(message.replyTo ? { replyTo: message.replyTo } : {}),
        subject: message.subject,
        htmlContent: message.htmlContent,
      };
      let response: Response;
      try {
        response = await request(ENDPOINT, {
          method: 'POST',
          headers: { 'api-key': config.apiKey, 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { status: 'failed', error: /timeout|abort/i.test(reason) ? 'timeout' : `network: ${reason}` };
      }
      if (!response.ok) return { status: 'failed', error: await describeFailure(response) };
      const data = (await response.json().catch(() => null)) as { messageId?: unknown } | null;
      return { status: 'sent', messageId: typeof data?.messageId === 'string' ? data.messageId : null };
    },
  };
}
```

Create `apps/portal/src/server/email/send.ts`:

```ts
import * as Sentry from '@sentry/nextjs';
import { log } from '@/server/log';
import { createEmailTransport, type EmailMessage, type EmailResult, type EmailTransport } from './transport';

let shared: EmailTransport | undefined;

/** One transport per process, created on first send so importing this file reads no environment. */
const sharedTransport = (): EmailTransport => {
  shared ??= createEmailTransport();
  return shared;
};

/**
 * Sends through the process wide transport, or the one passed in (tests). Never throws: a failed send is logged and
 * reported to Sentry with the subject, never the body, and returned to the caller.
 */
export async function sendEmail(message: EmailMessage, transport: EmailTransport = sharedTransport()): Promise<EmailResult> {
  const result = await transport.send(message);
  if (result.status === 'failed') {
    log.error({ subject: message.subject, error: result.error }, 'email failed');
    Sentry.captureException(new Error(`email failed: ${result.error}`), {
      tags: { area: 'email' },
      extra: { subject: message.subject },
    });
  }
  return result;
}
```

Create `apps/portal/src/server/email/fake.ts`:

```ts
import type { EmailMessage, EmailResult, EmailTransport } from './transport';

/** In memory transport for tests. No timers, no network. */
export class FakeEmailTransport implements EmailTransport {
  /** Every message sent, in order. */
  sent: EmailMessage[] = [];
  /** Set to make the next send return { status: 'failed', error } once. */
  failNext: string | null = null;

  async send(message: EmailMessage): Promise<EmailResult> {
    if (this.failNext !== null) {
      const error = this.failNext;
      this.failNext = null;
      return { status: 'failed', error };
    }
    this.sent.push(message);
    return { status: 'sent', messageId: `fake-${this.sent.length}` };
  }

  /** Messages whose `to` includes the address (case insensitive). */
  to(email: string): EmailMessage[] {
    const wanted = email.toLowerCase();
    return this.sent.filter((message) => message.to.some((address) => address.email.toLowerCase() === wanted));
  }

  /** The only message sent to the address; throws when there is not exactly one. */
  only(email: string): EmailMessage {
    const matches = this.to(email);
    const [first] = matches;
    if (matches.length !== 1 || !first) throw new Error(`expected exactly one email to ${email}, found ${matches.length}`);
    return first;
  }

  clear(): void {
    this.sent = [];
    this.failNext = null;
  }
}
```

Create `apps/portal/src/server/email/layout.ts`:

```ts
/**
 * The one HTML shell every portal email renders into. Same conventions as the CMS email layout, built here so the
 * portal imports nothing from the CMS: a caller describes content as blocks, this owns presentation.
 *
 *  - Tables, not flex or grid: Outlook on Windows renders through Word, which supports neither.
 *  - Inline styles: Gmail strips <style> in several contexts, so <head> holds only media queries and a dark mode fix.
 *  - A preheader on every email, the grey preview line after the subject. Left unset, clients scrape the logo alt text.
 *  - Buttons are padded table cells, the only construct that renders as a button in every major client.
 *  - Every string is HTML escaped here, once. Builders pass raw text.
 */

const BRAND = {
  blue: '#3960f9',
  heading: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#e2e8f0',
  canvas: '#f1f5f9',
  white: '#ffffff',
} as const;

/** Arial renders the same in Outlook, Gmail and Apple Mail. */
const FONT = 'Arial,Helvetica,sans-serif';
const LOGO_URL = 'https://cdn.cleanstart.com/web/emails/logo-email.png';
const SITE_URL = 'https://www.cleanstart.com';
const COMPANY_ADDRESS = 'CleanStart Inc. · 16192 Coastal Highway, Lewes, Delaware 19958, US';

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Only http and https survive, so a caller can never put a `javascript:` URL in a button. */
const safeUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
};

export type EmailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'button'; label: string; url: string }
  | { type: 'facts'; rows: Array<{ label: string; value: string }> }
  | { type: 'note'; text: string };

const paragraph = (text: string): string =>
  `<p class="cs-text" style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${BRAND.text};">${escapeHtml(text)}</p>`;

const facts = (rows: Array<{ label: string; value: string }>): string => {
  const cells = rows
    .filter((row) => row.value.trim().length > 0)
    .map(
      (row) =>
        `<tr>
          <td style="padding:8px 16px 8px 0;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};white-space:nowrap;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:8px 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${BRAND.text};vertical-align:top;white-space:pre-wrap;">${escapeHtml(row.value)}</td>
        </tr>`,
    )
    .join('');
  if (cells.length === 0) return '';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:0 0 20px;width:100%;">${cells}</table>`;
};

const button = (label: string, url: string): string => {
  const href = safeUrl(url);
  if (!href) return '';
  // Padding sits on the cell, not the anchor: Word based Outlook handles padding on inline elements badly.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px;border-collapse:separate;">
    <tr><td class="cs-btn" align="center" bgcolor="${BRAND.blue}" style="padding:14px 28px;border-radius:8px;mso-padding-alt:14px 28px;">
      <a href="${escapeHtml(href)}" target="_blank" rel="noopener" style="font-family:${FONT};font-size:16px;font-weight:bold;line-height:1;color:${BRAND.white};text-decoration:none;display:block;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
};

const note = (text: string): string =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
    <tr><td bgcolor="${BRAND.canvas}" style="padding:14px 16px;border-radius:8px;font-family:${FONT};font-size:14px;line-height:1.5;color:${BRAND.muted};white-space:pre-wrap;">${escapeHtml(text)}</td></tr>
  </table>`;

const renderBlock = (block: EmailBlock): string => {
  switch (block.type) {
    case 'paragraph':
      return paragraph(block.text);
    case 'button':
      return button(block.label, block.url);
    case 'facts':
      return facts(block.rows);
    case 'note':
      return note(block.text);
  }
};

/** Returns the full HTML document. */
export function renderEmail(input: { preheader: string; heading: string; blocks: EmailBlock[]; footnote?: string }): string {
  const body = input.blocks.map(renderBlock).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(input.heading)}</title>
<style>
  :root { color-scheme: light; supported-color-schemes: light; }
  table, td, div, p, a { font-family: ${FONT} !important; }
  /* Outlook.com and the new Outlook rewrite colours in dark mode. Pin the card, its text and the button back. */
  [data-ogsc] .cs-card, [data-ogsb] .cs-card { background-color: ${BRAND.white} !important; }
  [data-ogsc] .cs-heading { color: ${BRAND.heading} !important; }
  [data-ogsc] .cs-text { color: ${BRAND.text} !important; }
  [data-ogsc] .cs-btn, [data-ogsb] .cs-btn { background-color: ${BRAND.blue} !important; }
  [data-ogsc] .cs-btn a { color: ${BRAND.white} !important; }
  @media only screen and (max-width:620px){
    .cs-wrap{width:100% !important;}
    .cs-pad{padding-left:22px !important;padding-right:22px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${BRAND.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${BRAND.canvas};opacity:0;">${escapeHtml(input.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.canvas};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="cs-wrap cs-card" bgcolor="${BRAND.white}" style="width:600px;max-width:600px;background-color:${BRAND.white};border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
    <tr><td class="cs-pad" style="padding:28px 32px 20px;">
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration:none;">
        <img src="${LOGO_URL}" alt="CleanStart" width="140" style="display:inline-block;width:140px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
      </a>
    </td></tr>
    <tr><td class="cs-pad" style="padding:0 32px 28px;">
      <p style="margin:0 0 10px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.blue};">Partner Portal</p>
      <h1 class="cs-heading" style="margin:0 0 18px;font-family:${FONT};font-size:22px;line-height:1.35;font-weight:700;color:${BRAND.heading};">${escapeHtml(input.heading)}</h1>
      ${body}
    </td></tr>
    <tr><td style="padding:0 32px;">
      <div style="height:1px;background-color:${BRAND.border};line-height:1px;font-size:1px;">&nbsp;</div>
    </td></tr>
    <tr><td align="center" class="cs-pad" style="padding:18px 32px 26px;">
      ${input.footnote ? `<p style="margin:0 0 12px;font-family:${FONT};font-size:12px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(input.footnote)}</p>` : ''}
      <p style="margin:0;font-family:${FONT};font-size:11px;line-height:1.5;color:${BRAND.faint};">${escapeHtml(COMPANY_ADDRESS)}</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}
```

Create `apps/portal/src/server/urls.ts`:

```ts
import { env } from '@/env';
import { ROUTES } from '@/lib/routes';

/** APP_URL joined with an app relative path, with exactly one slash between them. */
export function absoluteUrl(path: string): string {
  return `${env.APP_URL.replace(/\/+$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export function inviteUrl(token: string): string {
  return absoluteUrl(`${ROUTES.acceptInvite}?token=${encodeURIComponent(token)}`);
}

export function resetPasswordUrl(token: string): string {
  return absoluteUrl(`${ROUTES.resetPassword}?token=${encodeURIComponent(token)}`);
}
```

- [ ] **Step 6: Run them and see them pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email src/server/urls.test.ts
```

Expected: `Test Files  6 passed (6)`, `Tests  32 passed (32)` (layout 11, brevo 7, transport 5, send 3, fake 3, urls 3), and `Snapshots  1 written`. Run the same command again: `Snapshots  1 passed`.

- [ ] **Step 7: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0.

- [ ] **Step 8: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/email apps/portal/src/server/urls.ts apps/portal/src/server/urls.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M0.5a email layout, transport, Brevo, send, fake and urls"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5a | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | EmailTransport, Brevo, renderEmail, sendEmail" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.5b: Templates for applications, invites, access and account (W0-g)

Ten of the 21 builders. Each is pure and returns an `EmailMessage`. The test harness is shared with Task M0.5c: for every template it (1) feeds each free text field a marker `<b>field</b>` and asserts every one comes out escaped, (2) feeds `<script>alert(1)</script>` and asserts no `<script` survives, (3) feeds a field with a CRLF and `Bcc:` and asserts the subject has no line break, (4) asserts the agreed subject, recipients, reply-to and copy, and (5) asserts no en-dash, em-dash or exclamation mark in the copy. The copy was written to be plain and specific; the placeholders in a sentence are the visitor's own words and are escaped like any other field.

**Files:**
- Create: `apps/portal/src/server/email/templates/shared.ts`, `application-received.ts`, `application-staff-alert.ts`, `application-approved.ts`, `application-declined.ts`, `team-invite.ts`, `access-request.ts`, `access-request-declined.ts`, `team-change-notice.ts`, `password-changed.ts`, `password-reset.ts`, `index.ts` (all under `apps/portal/src/server/email/templates/`)
- Test: `apps/portal/src/server/email/templates/test-harness.ts`, `apps/portal/src/server/email/templates/onboarding.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5b | started | W0 | - | - | onboarding templates" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the harness and the tests (they fail first)**

Create `apps/portal/src/server/email/templates/test-harness.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { EmailMessage } from '../transport';

/** Gives a builder either the real sample text or a marker `<b>field</b>` that must come out escaped. */
export type Field = (name: string, real: string) => string;

export interface TemplateCase {
  name: string;
  build: (f: Field) => EmailMessage;
  /** Expected subject when the builder gets the real sample text. */
  subject: string;
  /** Plain text that must appear in the body (after HTML escaping of the sample text). */
  contains: string[];
  /** Expected recipients. */
  to: string[];
  replyTo?: string;
}

const textNodes = (html: string): string => html.replace(/<style>[\s\S]*?<\/style>/, '');

/** The checks every template passes: escaping of each field, no header injection, agreed copy, clean punctuation. */
export function describeTemplates(cases: TemplateCase[]): void {
  describe.each(cases)('$name', (testCase) => {
    it('escapes every free text field a visitor can fill in', () => {
      const used: string[] = [];
      const message = testCase.build((name) => {
        used.push(name);
        return `<b>${name}</b>`;
      });
      expect(used.length).toBeGreaterThan(0);
      expect(message.htmlContent).not.toContain('<b>');
      for (const name of new Set(used)) {
        expect(message.htmlContent, `field ${name}`).toContain(`&lt;b&gt;${name}&lt;/b&gt;`);
      }
    });

    it('escapes a name that carries a script tag', () => {
      const message = testCase.build(() => '<script>alert(1)</script>');
      expect(message.htmlContent).not.toMatch(/<script/i);
      expect(message.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    it('keeps a line break out of the subject', () => {
      const message = testCase.build((name) => `${name}\r\nBcc: attacker@example.com`);
      expect(message.subject).not.toMatch(/[\r\n]/);
    });

    it('has the agreed subject, recipients and copy', () => {
      const message = testCase.build((_name, real) => real);
      expect(message.subject).toBe(testCase.subject);
      expect(message.to.map((address) => address.email)).toEqual(testCase.to);
      expect(message.replyTo?.email).toBe(testCase.replyTo);
      for (const text of testCase.contains) expect(message.htmlContent).toContain(text);
    });

    it('has no dashes and no exclamation marks in the copy', () => {
      const message = testCase.build((_name, real) => real);
      expect(`${message.subject}${message.htmlContent}`).not.toMatch(/[\u2013\u2014]/);
      expect(message.subject).not.toContain('!');
      expect(textNodes(message.htmlContent)).not.toMatch(/>[^<]*!/);
    });
  });
}
```

Create `apps/portal/src/server/email/templates/onboarding.test.ts` (12 cases for 10 builders: the invite and the team change notice each have two variants):

```ts
import { describeTemplates, type TemplateCase } from './test-harness';
import {
  buildAccessRequest,
  buildAccessRequestDeclined,
  buildApplicationApproved,
  buildApplicationDeclined,
  buildApplicationReceived,
  buildApplicationStaffAlert,
  buildPasswordChanged,
  buildPasswordReset,
  buildTeamChangeNotice,
  buildTeamInvite,
} from './index';

const PERSON = { email: 'person@example.com', name: 'Person' };
const STAFF = [{ email: 'farhan@cleanstart.example' }, { email: 'omar@cleanstart.example' }];

const CASES: TemplateCase[] = [
  {
    name: 'buildApplicationReceived',
    build: (f) =>
      buildApplicationReceived({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        reference: f('reference', 'APP-2611-0042'),
      }),
    subject: 'We received your partner application',
    contains: ['Application received', 'Hello Rohit Desai,', 'APP-2611-0042', 'Lattice Cloud Services', 'Quote the reference'],
    to: ['person@example.com'],
  },
  {
    name: 'buildApplicationStaffAlert',
    build: (f) =>
      buildApplicationStaffAlert({
        to: STAFF,
        reference: f('reference', 'APP-2611-0042'),
        company: f('company', 'Lattice Cloud Services'),
        domain: f('domain', 'lattice.example'),
        applicantName: f('applicantName', 'Rohit Desai'),
        applicantEmail: f('applicantEmail', 'rohit@lattice.example'),
        categoryLabel: f('categoryLabel', 'Channel partner'),
        regionLabel: f('regionLabel', 'India'),
        source: 'website',
        personalEmail: true,
        existingDomain: true,
        reason: f('reason', 'We resell to banks'),
        reviewUrl: 'https://partners.example.com/admin/partners',
      }),
    subject: 'New partner application: Lattice Cloud Services',
    contains: [
      'New partner application',
      'Website form',
      'personal email address',
      'already belongs to an existing partner',
      'We resell to banks',
      'href="https://partners.example.com/admin/partners"',
      'Review the application',
    ],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildApplicationApproved',
    build: (f) =>
      buildApplicationApproved({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
        managerName: f('managerName', 'Farhan Qureshi'),
      }),
    subject: 'Your CleanStart partner application is approved',
    contains: [
      'You are approved',
      'Lattice Cloud Services is now a CleanStart partner',
      'Your CleanStart partner manager is Farhan Qureshi.',
      'href="https://partners.example.com/accept-invite?token=abc"',
      'expires on 19 Nov 2026',
    ],
    to: ['person@example.com'],
  },
  {
    name: 'buildApplicationDeclined',
    build: (f) =>
      buildApplicationDeclined({
        to: PERSON,
        applicantName: f('applicantName', 'Rohit Desai'),
        company: f('company', 'Lattice Cloud Services'),
        reason: f('reason', 'We do not cover your region yet'),
      }),
    subject: 'Your CleanStart partner application',
    contains: ['Application update', 'We do not cover your region yet', 'apply again'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamInvite (partner)',
    build: (f) =>
      buildTeamInvite({
        to: PERSON,
        inviteeName: f('inviteeName', 'Vikram Sethi'),
        inviterName: f('inviterName', 'Aditi Rao'),
        audience: 'partner',
        companyName: f('companyName', 'Kestrel Systems'),
        roleLabel: f('roleLabel', 'Sales'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
      }),
    subject: 'Aditi Rao invited you to the CleanStart Partner Portal',
    contains: ['You are invited', 'Hello Vikram Sethi,', 'join Kestrel Systems', 'as Sales', 'Accept the invite', 'expires on 19 Nov 2026'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamInvite (staff)',
    build: (f) =>
      buildTeamInvite({
        to: PERSON,
        inviteeName: null,
        inviterName: f('inviterName', 'Farhan Qureshi'),
        audience: 'staff',
        companyName: null,
        roleLabel: f('roleLabel', 'Marketing'),
        inviteUrl: 'https://partners.example.com/accept-invite?token=abc',
        expiresOn: '2026-11-19',
      }),
    subject: 'Farhan Qureshi invited you to the CleanStart Partner Portal',
    contains: ['Hello,', 'as Marketing', 'You will use it to work with CleanStart'],
    to: ['person@example.com'],
  },
  {
    name: 'buildAccessRequest',
    build: (f) =>
      buildAccessRequest({
        to: [{ email: 'aditi@kestrel.example' }],
        requesterName: f('requesterName', 'Rohit Desai'),
        requesterEmail: f('requesterEmail', 'rohit@kestrel.example'),
        note: f('note', 'I joined the sales team in October'),
        companyName: f('companyName', 'Kestrel Systems'),
        reviewUrl: 'https://partners.example.com/partner/team',
      }),
    subject: 'Rohit Desai asked for access to the CleanStart Partner Portal',
    contains: ['Access request', 'rohit@kestrel.example', 'I joined the sales team in October', 'Review the request'],
    to: ['aditi@kestrel.example'],
  },
  {
    name: 'buildAccessRequestDeclined',
    build: (f) =>
      buildAccessRequestDeclined({
        to: PERSON,
        requesterName: f('requesterName', 'Rohit Desai'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Your CleanStart Partner Portal access request',
    contains: ['Access request declined', 'The partner admin at Kestrel Systems did not approve'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamChangeNotice (joined)',
    build: (f) =>
      buildTeamChangeNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        kind: 'joined',
        personName: f('personName', 'Vikram Sethi'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Vikram Sethi joined Kestrel Systems on the Partner Portal',
    contains: ['New team member', 'accepted the invite'],
    to: ['person@example.com'],
  },
  {
    name: 'buildTeamChangeNotice (removed)',
    build: (f) =>
      buildTeamChangeNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        kind: 'removed',
        personName: f('personName', 'Vikram Sethi'),
        companyName: f('companyName', 'Kestrel Systems'),
      }),
    subject: 'Vikram Sethi was removed from Kestrel Systems on the Partner Portal',
    contains: ['Team member removed', 'Their registrations stay with the company.'],
    to: ['person@example.com'],
  },
  {
    name: 'buildPasswordChanged',
    build: (f) => buildPasswordChanged({ to: PERSON, name: f('name', 'Aditi Rao'), changedAt: '2026-11-12T14:02:00.000Z' }),
    subject: 'Your CleanStart Partner Portal password was changed',
    contains: ['Password changed', 'was changed on 12 Nov 2026, 14:02 UTC', 'Forgot password'],
    to: ['person@example.com'],
  },
  {
    name: 'buildPasswordReset',
    build: (f) =>
      buildPasswordReset({
        to: PERSON,
        name: f('name', 'Aditi Rao'),
        resetUrl: 'https://partners.example.com/reset-password?token=abc',
        expiresInMinutes: 60,
      }),
    subject: 'Reset your CleanStart Partner Portal password',
    contains: ['Reset your password', 'href="https://partners.example.com/reset-password?token=abc"', 'expires in 60 minutes', 'Set a new password'],
    to: ['person@example.com'],
  },
];

describeTemplates(CASES);
```

- [ ] **Step 3: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email/templates/onboarding.test.ts
```

Expected: FAIL with `Failed to resolve import "./index"`.

- [ ] **Step 4: Implement the shared helpers and the ten builders**

Create `apps/portal/src/server/email/templates/shared.ts` (subject and heading text is collapsed to one line, an empty optional field reads "Not given", and the footnotes are the only boilerplate):

```ts
import type { EmailAddress } from '../transport';

/** Collapses every run of whitespace, so visitor text cannot add a line break to a subject. */
export const oneLine = (text: string): string => text.replace(/\s+/g, ' ').trim();

export const asList = (to: EmailAddress | EmailAddress[]): EmailAddress[] => (Array.isArray(to) ? to : [to]);

export const hello = (name: string | null): string => (name && oneLine(name) !== '' ? `Hello ${oneLine(name)},` : 'Hello,');

/** "Not given" for an empty optional field, so a facts row never shows a blank. */
export const orNotGiven = (value: string | null): string => (value && value.trim() !== '' ? value : 'Not given');

export const truncate = (text: string, max: number): string => {
  const flat = oneLine(text);
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}...`;
};

export const FOOTNOTES = {
  applicant: 'You received this email because you applied to the CleanStart partner program.',
  invitee: 'You received this email because someone invited you to the CleanStart Partner Portal.',
  partnerUser: 'You received this email because of activity on the CleanStart Partner Portal.',
  partnerAdmin: 'You received this email because you are a partner admin on the CleanStart Partner Portal.',
  staff: 'You received this email because you handle partner requests at CleanStart.',
  account: 'You received this email because it concerns your CleanStart Partner Portal login.',
} as const;
```

Create `apps/portal/src/server/email/templates/application-received.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** To the applicant right after /apply, and for website entries never (the CMS sends its own). */
export interface ApplicationReceivedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reference: string;
}

export function buildApplicationReceived(input: ApplicationReceivedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `We have your application for ${input.company} to join the CleanStart partner program. A partner manager will review it and email you at this address with the decision.`,
    },
    {
      type: 'facts',
      rows: [
        { label: 'Reference', value: input.reference },
        { label: 'Company', value: input.company },
      ],
    },
    { type: 'note', text: 'Quote the reference if you write to us about this application.' },
  ];
  return {
    to: asList(input.to),
    subject: 'We received your partner application',
    htmlContent: renderEmail({
      preheader: `Your reference is ${oneLine(input.reference)}. A partner manager will review the application.`,
      heading: 'Application received',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/application-staff-alert.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine, orNotGiven } from './shared';

/** To the active partner managers (and PARTNERS_NOTIFY_EMAIL when set) for each portal application. */
export interface ApplicationStaffAlertInput {
  to: EmailAddress[];
  reference: string;
  company: string;
  domain: string;
  applicantName: string;
  applicantEmail: string;
  categoryLabel: string | null;
  regionLabel: string | null;
  source: 'portal' | 'website';
  personalEmail: boolean;
  existingDomain: boolean;
  reason: string | null;
  reviewUrl: string;
}

export function buildApplicationStaffAlert(input: ApplicationStaffAlertInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: `${input.applicantName} from ${input.company} applied to become a partner.` },
    {
      type: 'facts',
      rows: [
        { label: 'Reference', value: input.reference },
        { label: 'Company', value: input.company },
        { label: 'Domain', value: input.domain },
        { label: 'Applicant', value: `${input.applicantName}, ${input.applicantEmail}` },
        { label: 'Category', value: orNotGiven(input.categoryLabel) },
        { label: 'Region', value: orNotGiven(input.regionLabel) },
        { label: 'Source', value: input.source === 'website' ? 'Website form' : 'Portal form' },
        { label: 'Reason', value: orNotGiven(input.reason) },
      ],
    },
  ];
  if (input.personalEmail) {
    blocks.push({ type: 'note', text: 'The applicant used a personal email address, not a company address.' });
  }
  if (input.existingDomain) {
    blocks.push({ type: 'note', text: 'This domain already belongs to an existing partner.' });
  }
  blocks.push({ type: 'button', label: 'Review the application', url: input.reviewUrl });
  return {
    to: input.to,
    subject: oneLine(`New partner application: ${input.company}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.applicantName} applied for ${input.company}. Review it in the portal.`),
      heading: 'New partner application',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/application-approved.ts`:

```ts
import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** To the applicant on approval; carries the invite link that makes them partner admin. */
export interface ApplicationApprovedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  inviteUrl: string;
  expiresOn: IsoDate;
  managerName: string | null;
}

export function buildApplicationApproved(input: ApplicationApprovedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `${input.company} is now a CleanStart partner. You are the first partner admin for the account: you invite your team, register deals and open the sales material in the portal.`,
    },
  ];
  if (input.managerName) {
    blocks.push({ type: 'paragraph', text: `Your CleanStart partner manager is ${input.managerName}.` });
  }
  blocks.push(
    { type: 'button', label: 'Set your password', url: input.inviteUrl },
    {
      type: 'note',
      text: `This link works once and expires on ${fmtLong(input.expiresOn)}. If it has expired, ask your partner manager for a new invite.`,
    },
  );
  return {
    to: asList(input.to),
    subject: 'Your CleanStart partner application is approved',
    htmlContent: renderEmail({
      preheader: oneLine(`Set your password to open the Partner Portal for ${input.company}.`),
      heading: 'You are approved',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/application-declined.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface ApplicationDeclinedInput {
  to: EmailAddress;
  applicantName: string;
  company: string;
  reason: string;
}

export function buildApplicationDeclined(input: ApplicationDeclinedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.applicantName) },
    {
      type: 'paragraph',
      text: `Thank you for applying on behalf of ${input.company}. We are not able to approve the application at this time.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'paragraph', text: 'You are welcome to apply again if your circumstances change.' },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart partner application',
    htmlContent: renderEmail({
      preheader: oneLine(`The decision on your application for ${input.company}.`),
      heading: 'Application update',
      blocks,
      footnote: FOOTNOTES.applicant,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/team-invite.ts`:

```ts
import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** Colleague invite (audience 'partner') and CleanStart teammate invite (audience 'staff'). Also sent for Add partner and approved access requests. */
export interface TeamInviteInput {
  to: EmailAddress;
  inviteeName: string | null;
  inviterName: string;
  audience: 'partner' | 'staff';
  companyName: string | null;
  roleLabel: string;
  inviteUrl: string;
  expiresOn: IsoDate;
}

export function buildTeamInvite(input: TeamInviteInput): EmailMessage {
  const joinsCompany = input.audience === 'partner' && input.companyName;
  const intro = joinsCompany
    ? `${input.inviterName} invited you to join ${input.companyName} on the CleanStart Partner Portal as ${input.roleLabel}. The portal is where you register deals, follow their approval and open sales material.`
    : `${input.inviterName} invited you to the CleanStart Partner Portal as ${input.roleLabel}. You will use it to work with CleanStart's partners.`;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.inviteeName) },
    { type: 'paragraph', text: intro },
    { type: 'button', label: 'Accept the invite', url: input.inviteUrl },
    { type: 'note', text: `This invite works once and expires on ${fmtLong(input.expiresOn)}.` },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.inviterName} invited you to the CleanStart Partner Portal`),
    htmlContent: renderEmail({
      preheader: joinsCompany
        ? oneLine(`Join ${input.companyName} on the Partner Portal as ${input.roleLabel}.`)
        : oneLine(`Set up your login as ${input.roleLabel}.`),
      heading: 'You are invited',
      blocks,
      footnote: FOOTNOTES.invitee,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/access-request.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the partner admins when someone asks for access from the sign-in page. */
export interface AccessRequestInput {
  to: EmailAddress[];
  requesterName: string;
  requesterEmail: string;
  note: string | null;
  companyName: string;
  reviewUrl: string;
}

export function buildAccessRequest(input: AccessRequestInput): EmailMessage {
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.requesterName} (${input.requesterEmail}) asked for a login to the CleanStart Partner Portal for ${input.companyName}.`,
    },
  ];
  if (input.note && input.note.trim() !== '') blocks.push({ type: 'facts', rows: [{ label: 'Note', value: input.note }] });
  blocks.push(
    { type: 'paragraph', text: 'Approve the request only if you know this person.' },
    { type: 'button', label: 'Review the request', url: input.reviewUrl },
  );
  return {
    to: input.to,
    subject: oneLine(`${input.requesterName} asked for access to the CleanStart Partner Portal`),
    htmlContent: renderEmail({
      preheader: oneLine(`Approve or decline the request for ${input.companyName}.`),
      heading: 'Access request',
      blocks,
      footnote: FOOTNOTES.partnerAdmin,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/access-request-declined.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface AccessRequestDeclinedInput {
  to: EmailAddress;
  requesterName: string;
  companyName: string;
}

export function buildAccessRequestDeclined(input: AccessRequestDeclinedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.requesterName) },
    {
      type: 'paragraph',
      text: `The partner admin at ${input.companyName} did not approve your request for a Partner Portal login.`,
    },
    { type: 'paragraph', text: 'If you think this is a mistake, speak to your partner admin directly.' },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart Partner Portal access request',
    htmlContent: renderEmail({
      preheader: oneLine(`The partner admin at ${input.companyName} did not approve it.`),
      heading: 'Access request declined',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/team-change-notice.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface TeamChangeNoticeInput {
  to: EmailAddress;
  recipientName: string;
  kind: 'joined' | 'removed';
  personName: string;
  companyName: string;
}

export function buildTeamChangeNotice(input: TeamChangeNoticeInput): EmailMessage {
  const joined = input.kind === 'joined';
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: joined
        ? `${input.personName} accepted the invite and now has a Partner Portal login for ${input.companyName}.`
        : `${input.personName} no longer has access to the Partner Portal for ${input.companyName}. Their registrations stay with the company.`,
    },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(
      joined
        ? `${input.personName} joined ${input.companyName} on the Partner Portal`
        : `${input.personName} was removed from ${input.companyName} on the Partner Portal`,
    ),
    htmlContent: renderEmail({
      preheader: oneLine(joined ? `${input.personName} has a login now.` : `${input.personName} cannot sign in any more.`),
      heading: joined ? 'New team member' : 'Team member removed',
      blocks,
      footnote: FOOTNOTES.partnerAdmin,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/password-changed.ts`:

```ts
import { fmtLong } from '@/lib/dates';
import type { IsoTimestamp } from '@/lib/dto';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello } from './shared';

export interface PasswordChangedInput {
  to: EmailAddress;
  name: string;
  changedAt: IsoTimestamp;
}

export function buildPasswordChanged(input: PasswordChangedInput): EmailMessage {
  const when = `${fmtLong(input.changedAt.slice(0, 10))}, ${input.changedAt.slice(11, 16)} UTC`;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    { type: 'paragraph', text: `The password for your Partner Portal login was changed on ${when}.` },
    {
      type: 'paragraph',
      text: 'If you made the change, you do not need to do anything. If you did not, use Forgot password on the sign-in page to set a new one, and tell your partner manager.',
    },
  ];
  return {
    to: asList(input.to),
    subject: 'Your CleanStart Partner Portal password was changed',
    htmlContent: renderEmail({
      preheader: 'If this was not you, reset it now.',
      heading: 'Password changed',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/password-reset.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello } from './shared';

export interface PasswordResetInput {
  to: EmailAddress;
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export function buildPasswordReset(input: PasswordResetInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.name) },
    { type: 'paragraph', text: 'We got a request to reset the password for your Partner Portal login.' },
    { type: 'button', label: 'Set a new password', url: input.resetUrl },
    {
      type: 'note',
      text: `The link expires in ${input.expiresInMinutes} minutes and works once. If you did not ask for this, ignore this email and your password stays as it is.`,
    },
  ];
  return {
    to: asList(input.to),
    subject: 'Reset your CleanStart Partner Portal password',
    htmlContent: renderEmail({
      preheader: `The link works for ${input.expiresInMinutes} minutes.`,
      heading: 'Reset your password',
      blocks,
      footnote: FOOTNOTES.account,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/index.ts` (the ten builders so far; Task M0.5c replaces it with all 21):

```ts
export * from './access-request';
export * from './access-request-declined';
export * from './application-approved';
export * from './application-declined';
export * from './application-received';
export * from './application-staff-alert';
export * from './password-changed';
export * from './password-reset';
export * from './team-change-notice';
export * from './team-invite';
```

- [ ] **Step 5: Run it and see it pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email/templates/onboarding.test.ts
```

Expected: `Test Files  1 passed (1)`, `Tests  60 passed (60)` (12 cases, 5 checks each).

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0. Gate B reads the copy once more for filler words and exclamation marks.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/email/templates docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M0.5b application, invite, access and account templates"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5b | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | 10 templates" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.5c: Templates for deals, extensions, documents and manager messages (W0-g)

The other eleven builders, and the full `index.ts`. Same harness as Task M0.5b.

**Files:**
- Create: `apps/portal/src/server/email/templates/{deal-accepted,deal-rejected,deal-submitted-staff-alert,deal-message,deal-stage-changed,extension-requested,extension-decision,protection-expiry-reminder,document-material-request,new-document-notice,manager-message}.ts`
- Modify: `apps/portal/src/server/email/templates/index.ts` (replaced)
- Test: `apps/portal/src/server/email/templates/deals.test.ts`, `apps/portal/src/server/email/templates/index.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5c | started | W0 | - | - | deal templates" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the tests (they fail first)**

Create `apps/portal/src/server/email/templates/deals.test.ts` (13 cases for 11 builders: the staff alert and the extension decision each have two variants):

```ts
import { describeTemplates, type TemplateCase } from './test-harness';
import {
  buildDealAccepted,
  buildDealMessage,
  buildDealRejected,
  buildDealStageChanged,
  buildDealSubmittedStaffAlert,
  buildDocumentMaterialRequest,
  buildExtensionDecision,
  buildExtensionRequested,
  buildManagerMessage,
  buildNewDocumentNotice,
  buildProtectionExpiryReminder,
} from './index';

const PERSON = { email: 'person@example.com', name: 'Person' };
const STAFF = [{ email: 'farhan@cleanstart.example' }, { email: 'omar@cleanstart.example' }];

const CASES: TemplateCase[] = [
  {
    name: 'buildDealAccepted',
    build: (f) =>
      buildDealAccepted({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Vardhan Capital'),
        productLabel: f('productLabel', 'CleanSight'),
        partnerName: f('partnerName', 'Kestrel Systems'),
        protectionEnd: '2027-02-02',
        dealUrl: 'https://partners.example.com/partner/deals/1',
      }),
    subject: 'Vardhan Capital was accepted',
    contains: ['Deal registration accepted', 'Protected until', '2 Feb 2027', 'Kestrel Systems', 'Open the deal'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealRejected',
    build: (f) =>
      buildDealRejected({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Saffron Retail Group'),
        productLabel: f('productLabel', 'CleanStart Images'),
        reason: f('reason', 'Another partner holds this customer'),
        dealUrl: 'https://partners.example.com/partner/deals/2',
      }),
    subject: 'Saffron Retail Group was not accepted',
    contains: ['Deal registration not accepted', 'Another partner holds this customer', 'resubmit the registration'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealSubmittedStaffAlert (new)',
    build: (f) =>
      buildDealSubmittedStaffAlert({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Gulfway Freight'),
        productLabel: f('productLabel', 'CleanStart Images'),
        regionLabel: f('regionLabel', 'Middle East'),
        registeredByName: f('registeredByName', 'Aditi Rao'),
        resubmitted: false,
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'New registration: Gulfway Freight from Kestrel Systems',
    contains: ['New deal registration', 'Aditi Rao at Kestrel Systems registered a deal', 'Middle East', 'Open the approvals queue'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildDealSubmittedStaffAlert (resubmitted)',
    build: (f) =>
      buildDealSubmittedStaffAlert({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Gulfway Freight'),
        productLabel: f('productLabel', 'CleanStart Images'),
        regionLabel: f('regionLabel', 'Middle East'),
        registeredByName: f('registeredByName', 'Aditi Rao'),
        resubmitted: true,
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'Resubmitted: Gulfway Freight from Kestrel Systems',
    contains: ['Registration resubmitted', 'resubmitted a deal'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildDealMessage',
    build: (f) =>
      buildDealMessage({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        authorName: f('authorName', 'Farhan Qureshi'),
        authorOrg: f('authorOrg', 'CleanStart'),
        customer: f('customer', 'Tejas Health Network'),
        excerpt: f('excerpt', 'Can you confirm the contact at the hospital group?'),
        dealUrl: 'https://partners.example.com/partner/deals/3',
      }),
    subject: 'New message about Tejas Health Network',
    contains: ['New message on a deal', 'Farhan Qureshi (CleanStart) wrote on the Tejas Health Network deal', 'Can you confirm the contact', 'Open the conversation'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDealStageChanged',
    build: (f) =>
      buildDealStageChanged({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Vardhan Capital'),
        productLabel: f('productLabel', 'CleanSight'),
        stage: f('stage', 'Proposal sent'),
        dealUrl: 'https://partners.example.com/partner/deals/1',
      }),
    subject: 'Vardhan Capital moved to Proposal sent',
    contains: ['Deal stage update', 'is now at Proposal sent', 'The stage comes from CleanStart'],
    to: ['person@example.com'],
  },
  {
    name: 'buildExtensionRequested',
    build: (f) =>
      buildExtensionRequested({
        to: STAFF,
        partnerName: f('partnerName', 'Kestrel Systems'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        reason: f('reason', 'The customer moved the pilot to January'),
        approvalsUrl: 'https://partners.example.com/admin/approvals',
      }),
    subject: 'Extension requested: Al Noor Logistics from Kestrel Systems',
    contains: ['Protection extension requested', 'The customer moved the pilot to January', 'Review the request'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
  },
  {
    name: 'buildExtensionDecision (granted)',
    build: (f) =>
      buildExtensionDecision({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        granted: true,
        newEnd: '2027-03-04',
        note: f('note', 'One extension only'),
        dealUrl: 'https://partners.example.com/partner/deals/4',
      }),
    subject: 'Protection extended for Al Noor Logistics',
    contains: ['Extension granted', 'New protection end', '4 Mar 2027', 'One extension only'],
    to: ['person@example.com'],
  },
  {
    name: 'buildExtensionDecision (declined)',
    build: (f) =>
      buildExtensionDecision({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Al Noor Logistics'),
        productLabel: f('productLabel', 'Clean Libraries'),
        granted: false,
        newEnd: null,
        note: f('note', 'The deal has not moved'),
        dealUrl: 'https://partners.example.com/partner/deals/4',
      }),
    subject: 'Extension not granted for Al Noor Logistics',
    contains: ['Extension declined', 'Protection ends on the original date.', 'The deal has not moved'],
    to: ['person@example.com'],
  },
  {
    name: 'buildProtectionExpiryReminder',
    build: (f) =>
      buildProtectionExpiryReminder({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        customer: f('customer', 'Indus Paytech'),
        productLabel: f('productLabel', 'CleanStart Images'),
        daysLeft: 14,
        protectionEnd: '2026-11-26',
        dealUrl: 'https://partners.example.com/partner/deals/5',
      }),
    subject: 'Indus Paytech: protection ends in 14 days',
    contains: ['Protection ending soon', 'ends on 26 Nov 2026, in 14 days', 'request an extension'],
    to: ['person@example.com'],
  },
  {
    name: 'buildDocumentMaterialRequest',
    build: (f) =>
      buildDocumentMaterialRequest({
        to: STAFF,
        replyTo: { email: 'aditi@kestrel.example', name: 'Aditi Rao' },
        partnerName: f('partnerName', 'Kestrel Systems'),
        requesterName: f('requesterName', 'Aditi Rao'),
        request: f('request', 'A one page comparison with the incumbent scanner'),
        productLabel: f('productLabel', 'CleanSight'),
      }),
    subject: 'Material request from Kestrel Systems',
    contains: ['Material request', 'A one page comparison with the incumbent scanner', 'Reply to this email to answer Aditi Rao directly.'],
    to: ['farhan@cleanstart.example', 'omar@cleanstart.example'],
    replyTo: 'aditi@kestrel.example',
  },
  {
    name: 'buildNewDocumentNotice',
    build: (f) =>
      buildNewDocumentNotice({
        to: PERSON,
        recipientName: f('recipientName', 'Aditi Rao'),
        title: f('title', 'CleanSight product walkthrough'),
        typeLabel: f('typeLabel', 'Video'),
        productLabel: f('productLabel', 'CleanSight'),
        libraryUrl: 'https://partners.example.com/partner/documents',
      }),
    subject: 'New in the document library: CleanSight product walkthrough',
    contains: ['New document', 'Video', 'Open the library'],
    to: ['person@example.com'],
  },
  {
    name: 'buildManagerMessage',
    build: (f) =>
      buildManagerMessage({
        to: { email: 'farhan@cleanstart.example', name: 'Farhan Qureshi' },
        replyTo: { email: 'aditi@kestrel.example', name: 'Aditi Rao' },
        managerName: f('managerName', 'Farhan Qureshi'),
        senderName: f('senderName', 'Aditi Rao'),
        partnerName: f('partnerName', 'Kestrel Systems'),
        subject: f('subject', 'Question about the portal'),
        body: f('body', 'How do I add a second contact to a deal?'),
      }),
    subject: 'Kestrel Systems: Question about the portal',
    contains: ['Message from Aditi Rao', 'How do I add a second contact to a deal?', 'Reply to this email to answer Aditi Rao.'],
    to: ['farhan@cleanstart.example'],
    replyTo: 'aditi@kestrel.example',
  },
];

describeTemplates(CASES);
```

Create `apps/portal/src/server/email/templates/index.test.ts` (the 21 exports the contracts list in H.15):

```ts
import { describe, expect, it } from 'vitest';
import * as templates from './index';

describe('template index', () => {
  it('exports all 21 builders', () => {
    const builders = Object.keys(templates).filter((key) => key.startsWith('build'));
    expect(builders.sort()).toEqual(
      [
        'buildAccessRequest',
        'buildAccessRequestDeclined',
        'buildApplicationApproved',
        'buildApplicationDeclined',
        'buildApplicationReceived',
        'buildApplicationStaffAlert',
        'buildDealAccepted',
        'buildDealMessage',
        'buildDealRejected',
        'buildDealStageChanged',
        'buildDealSubmittedStaffAlert',
        'buildDocumentMaterialRequest',
        'buildExtensionDecision',
        'buildExtensionRequested',
        'buildManagerMessage',
        'buildNewDocumentNotice',
        'buildPasswordChanged',
        'buildPasswordReset',
        'buildProtectionExpiryReminder',
        'buildTeamChangeNotice',
        'buildTeamInvite',
      ].sort(),
    );
  });
});
```

- [ ] **Step 3: Run them and see them fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email/templates/deals.test.ts src/server/email/templates/index.test.ts
```

Expected: FAIL: the deal builders are not exported by `./index` (`TypeError: (0 , buildDealAccepted) is not a function`), and `index.test.ts` reports 10 of the 21 names.

- [ ] **Step 4: Implement the eleven builders and the full index**

Create `apps/portal/src/server/email/templates/deal-accepted.ts`:

```ts
import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealAcceptedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  partnerName: string;
  protectionEnd: IsoDate;
  dealUrl: string;
}

export function buildDealAccepted(input: DealAcceptedInput): EmailMessage {
  const until = fmtLong(input.protectionEnd);
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `CleanStart accepted the registration for ${input.customer}.` },
    {
      type: 'facts',
      rows: [
        { label: 'Customer', value: input.customer },
        { label: 'Product', value: input.productLabel },
        { label: 'Registered by', value: input.partnerName },
        { label: 'Protected until', value: until },
      ],
    },
    {
      type: 'paragraph',
      text: 'While protection runs, CleanStart does not accept another partner registration for the same customer and product.',
    },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} was accepted`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.productLabel} is protected until ${until}.`),
      heading: 'Deal registration accepted',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/deal-rejected.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealRejectedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  reason: string;
  dealUrl: string;
}

export function buildDealRejected(input: DealRejectedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `CleanStart did not accept the ${input.productLabel} registration for ${input.customer}.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'paragraph', text: 'You can correct the details and resubmit the registration from the deal page.' },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} was not accepted`),
    htmlContent: renderEmail({
      preheader: 'See the reason and how to resubmit.',
      heading: 'Deal registration not accepted',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/deal-submitted-staff-alert.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the deal's partner manager (staff) when a partner registers or resubmits. */
export interface DealSubmittedStaffAlertInput {
  to: EmailAddress[];
  partnerName: string;
  customer: string;
  productLabel: string;
  regionLabel: string;
  registeredByName: string;
  resubmitted: boolean;
  approvalsUrl: string;
}

export function buildDealSubmittedStaffAlert(input: DealSubmittedStaffAlertInput): EmailMessage {
  const verb = input.resubmitted ? 'resubmitted' : 'registered';
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.registeredByName} at ${input.partnerName} ${verb} a deal and it is waiting for review.`,
    },
    {
      type: 'facts',
      rows: [
        { label: 'Partner', value: input.partnerName },
        { label: 'Customer', value: input.customer },
        { label: 'Product', value: input.productLabel },
        { label: 'Region', value: input.regionLabel },
      ],
    },
    { type: 'button', label: 'Open the approvals queue', url: input.approvalsUrl },
  ];
  return {
    to: input.to,
    subject: oneLine(`${input.resubmitted ? 'Resubmitted' : 'New registration'}: ${input.customer} from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.registeredByName} ${verb} ${input.customer} for ${input.productLabel} in ${input.regionLabel}.`),
      heading: input.resubmitted ? 'Registration resubmitted' : 'New deal registration',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/deal-message.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine, truncate } from './shared';

export interface DealMessageInput {
  to: EmailAddress;
  recipientName: string;
  authorName: string;
  authorOrg: string;
  customer: string;
  excerpt: string;
  dealUrl: string;
}

export function buildDealMessage(input: DealMessageInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `${input.authorName} (${input.authorOrg}) wrote on the ${input.customer} deal:` },
    { type: 'note', text: input.excerpt },
    { type: 'button', label: 'Open the conversation', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`New message about ${input.customer}`),
    htmlContent: renderEmail({
      preheader: truncate(`${input.authorName} wrote: ${input.excerpt}`, 100),
      heading: 'New message on a deal',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/deal-stage-changed.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface DealStageChangedInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  stage: string;
  dealUrl: string;
}

export function buildDealStageChanged(input: DealStageChangedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: `The ${input.productLabel} deal for ${input.customer} is now at ${input.stage}.` },
    { type: 'paragraph', text: "The stage comes from CleanStart's CRM." },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer} moved to ${input.stage}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.productLabel} deal stage update from CleanStart.`),
      heading: 'Deal stage update',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/extension-requested.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** To the deal's partner manager (staff). */
export interface ExtensionRequestedInput {
  to: EmailAddress[];
  partnerName: string;
  customer: string;
  productLabel: string;
  reason: string;
  approvalsUrl: string;
}

export function buildExtensionRequested(input: ExtensionRequestedInput): EmailMessage {
  const blocks: EmailBlock[] = [
    {
      type: 'paragraph',
      text: `${input.partnerName} asked to extend protection on the ${input.productLabel} deal for ${input.customer}.`,
    },
    { type: 'facts', rows: [{ label: 'Reason', value: input.reason }] },
    { type: 'button', label: 'Review the request', url: input.approvalsUrl },
  ];
  return {
    to: input.to,
    subject: oneLine(`Extension requested: ${input.customer} from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.partnerName} asked for more protection time.`),
      heading: 'Protection extension requested',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/extension-decision.ts`:

```ts
import type { IsoDate } from '@/lib/dto';
import { fmtLong } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface ExtensionDecisionInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  granted: boolean;
  newEnd: IsoDate | null;
  note: string | null;
  dealUrl: string;
}

export function buildExtensionDecision(input: ExtensionDecisionInput): EmailMessage {
  const newEnd = input.granted && input.newEnd ? fmtLong(input.newEnd) : null;
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: input.granted
        ? `CleanStart extended protection on the ${input.productLabel} deal for ${input.customer}.`
        : `CleanStart declined the extension request for the ${input.productLabel} deal for ${input.customer}. Protection ends on the original date.`,
    },
  ];
  const rows: Array<{ label: string; value: string }> = [];
  if (newEnd) rows.push({ label: 'New protection end', value: newEnd });
  if (input.note && input.note.trim() !== '') rows.push({ label: 'Note from CleanStart', value: input.note });
  if (rows.length > 0) blocks.push({ type: 'facts', rows });
  blocks.push({ type: 'button', label: 'Open the deal', url: input.dealUrl });
  return {
    to: asList(input.to),
    subject: oneLine(input.granted ? `Protection extended for ${input.customer}` : `Extension not granted for ${input.customer}`),
    htmlContent: renderEmail({
      preheader: newEnd ? `The new protection end is ${newEnd}.` : 'Protection ends on the original date.',
      heading: input.granted ? 'Extension granted' : 'Extension declined',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/protection-expiry-reminder.ts`:

```ts
import type { IsoDate } from '@/lib/dto';
import { fmtLong, plural } from '@/lib/dates';
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** `daysLeft` is 14 or 3 (EXPIRY_REMINDER_DAYS). */
export interface ProtectionExpiryReminderInput {
  to: EmailAddress;
  recipientName: string;
  customer: string;
  productLabel: string;
  daysLeft: number;
  protectionEnd: IsoDate;
  dealUrl: string;
}

export function buildProtectionExpiryReminder(input: ProtectionExpiryReminderInput): EmailMessage {
  const end = fmtLong(input.protectionEnd);
  const left = plural(input.daysLeft, 'day');
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    {
      type: 'paragraph',
      text: `Protection on the ${input.productLabel} deal for ${input.customer} ends on ${end}, in ${left}.`,
    },
    { type: 'paragraph', text: 'If you need more time, request an extension from the deal page.' },
    { type: 'button', label: 'Open the deal', url: input.dealUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`${input.customer}: protection ends in ${left}`),
    htmlContent: renderEmail({
      preheader: oneLine(`Protection on the ${input.productLabel} deal ends on ${end}.`),
      heading: 'Protection ending soon',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/document-material-request.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { FOOTNOTES, oneLine } from './shared';

/** From the "Request material" dialog. To the partner manager and marketing recipients; replyTo is the requester. */
export interface DocumentMaterialRequestInput {
  to: EmailAddress[];
  replyTo: EmailAddress;
  partnerName: string;
  requesterName: string;
  request: string;
  productLabel: string;
}

export function buildDocumentMaterialRequest(input: DocumentMaterialRequestInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: `${input.requesterName} at ${input.partnerName} asked for sales material.` },
    {
      type: 'facts',
      rows: [
        { label: 'Partner', value: input.partnerName },
        { label: 'From', value: `${input.requesterName}, ${input.replyTo.email}` },
        { label: 'Product', value: input.productLabel },
        { label: 'Request', value: input.request },
      ],
    },
    { type: 'paragraph', text: `Reply to this email to answer ${input.requesterName} directly.` },
  ];
  return {
    to: input.to,
    replyTo: input.replyTo,
    subject: oneLine(`Material request from ${input.partnerName}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.requesterName} asked for material on ${input.productLabel}.`),
      heading: 'Material request',
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/new-document-notice.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

export interface NewDocumentNoticeInput {
  to: EmailAddress;
  recipientName: string;
  title: string;
  typeLabel: string;
  productLabel: string;
  libraryUrl: string;
}

export function buildNewDocumentNotice(input: NewDocumentNoticeInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.recipientName) },
    { type: 'paragraph', text: 'CleanStart added a document to the library.' },
    {
      type: 'facts',
      rows: [
        { label: 'Title', value: input.title },
        { label: 'Type', value: input.typeLabel },
        { label: 'Product', value: input.productLabel },
      ],
    },
    { type: 'button', label: 'Open the library', url: input.libraryUrl },
  ];
  return {
    to: asList(input.to),
    subject: oneLine(`New in the document library: ${input.title}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.typeLabel} for ${input.productLabel}.`),
      heading: 'New document',
      blocks,
      footnote: FOOTNOTES.partnerUser,
    }),
  };
}
```

Create `apps/portal/src/server/email/templates/manager-message.ts`:

```ts
import { type EmailBlock, renderEmail } from '../layout';
import type { EmailAddress, EmailMessage } from '../transport';
import { asList, FOOTNOTES, hello, oneLine } from './shared';

/** From the "Message your partner manager" drawers. */
export interface ManagerMessageInput {
  to: EmailAddress;
  replyTo: EmailAddress;
  managerName: string;
  senderName: string;
  partnerName: string;
  subject: string;
  body: string;
}

export function buildManagerMessage(input: ManagerMessageInput): EmailMessage {
  const blocks: EmailBlock[] = [
    { type: 'paragraph', text: hello(input.managerName) },
    { type: 'paragraph', text: `${input.senderName} at ${input.partnerName} wrote from the Partner Portal:` },
    { type: 'facts', rows: [{ label: 'Subject', value: input.subject }] },
    { type: 'note', text: input.body },
    { type: 'paragraph', text: `Reply to this email to answer ${input.senderName}.` },
  ];
  return {
    to: asList(input.to),
    replyTo: input.replyTo,
    subject: oneLine(`${input.partnerName}: ${input.subject}`),
    htmlContent: renderEmail({
      preheader: oneLine(`${input.senderName} at ${input.partnerName} sent you a message from the portal.`),
      heading: `Message from ${oneLine(input.senderName)}`,
      blocks,
      footnote: FOOTNOTES.staff,
    }),
  };
}
```

Replace `apps/portal/src/server/email/templates/index.ts`:

```ts
export * from './application-received';
export * from './application-staff-alert';
export * from './application-approved';
export * from './application-declined';
export * from './team-invite';
export * from './access-request';
export * from './access-request-declined';
export * from './deal-accepted';
export * from './deal-rejected';
export * from './deal-submitted-staff-alert';
export * from './deal-message';
export * from './deal-stage-changed';
export * from './extension-requested';
export * from './extension-decision';
export * from './protection-expiry-reminder';
export * from './document-material-request';
export * from './new-document-notice';
export * from './manager-message';
export * from './team-change-notice';
export * from './password-changed';
export * from './password-reset';
```

- [ ] **Step 5: Run the whole email folder and see it pass**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/email
```

Expected: `Test Files  8 passed (8)`, `Tests  155 passed (155)` (29 from Task M0.5a, then 60 in `onboarding.test.ts`, 65 in `deals.test.ts` and 1 in `index.test.ts`).

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/email/templates docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M0.5c deal, extension, document and manager templates"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5c | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | 21 templates" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

### Task M0.5d: Wire the password mails into Better Auth (W0-g)

Task M0.7 left `auth-mail.ts` as a bridge that only logs. This replaces both bodies with the real sends. The second argument (a transport) exists for tests. After this task `Forgot password` on the Sign in screen sends a real email through Brevo when the keys are set, and in development logs the reset link.

**Files:**
- Modify: `apps/portal/src/server/auth/auth-mail.ts` (replaced)
- Test: `apps/portal/src/server/auth/auth-mail.test.ts`

- [ ] **Step 1: Log the start**

```bash
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5d | started | W0 | - | - | wire auth mail" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

- [ ] **Step 2: Write the test (it fails first)**

Create `apps/portal/src/server/auth/auth-mail.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { FakeEmailTransport } from '@/server/email/fake';
import { sendPasswordChangedEmail, sendPasswordResetEmail } from './auth-mail';

describe('sendPasswordResetEmail', () => {
  it('emails the reset link with the token and the lifetime', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordResetEmail(
      { to: { email: 'aditi@kestrel.example', name: 'Aditi Rao' }, token: 'tok_123', expiresInMinutes: 60 },
      transport,
    );
    const mail = transport.only('aditi@kestrel.example');
    expect(mail.subject).toBe('Reset your CleanStart Partner Portal password');
    expect(mail.htmlContent).toContain('href="http://localhost:3004/reset-password?token=tok_123"');
    expect(mail.htmlContent).toContain('Hello Aditi Rao,');
    expect(mail.htmlContent).toContain('expires in 60 minutes');
  });

  it('escapes a name that carries markup', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordResetEmail({ to: { email: 'x@example.com', name: '<script>alert(1)</script>' }, token: 't', expiresInMinutes: 60 }, transport);
    expect(transport.only('x@example.com').htmlContent).not.toContain('<script>');
  });
});

describe('sendPasswordChangedEmail', () => {
  it('emails the notice with the change time in UTC', async () => {
    const transport = new FakeEmailTransport();
    await sendPasswordChangedEmail(
      { to: { email: 'aditi@kestrel.example', name: 'Aditi Rao' }, changedAt: new Date('2026-11-12T14:02:00Z') },
      transport,
    );
    const mail = transport.only('aditi@kestrel.example');
    expect(mail.subject).toBe('Your CleanStart Partner Portal password was changed');
    expect(mail.htmlContent).toContain('12 Nov 2026, 14:02 UTC');
  });
});
```

- [ ] **Step 3: Run it and see it fail**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth/auth-mail.test.ts
```

Expected: FAIL, `Tests  3 failed (3)`: `expected exactly one email to aditi@kestrel.example, found 0` (the bridge sends nothing).

- [ ] **Step 4: Replace the bridge**

Replace `apps/portal/src/server/auth/auth-mail.ts`:

```ts
import { sendEmail } from '@/server/email/send';
import { buildPasswordChanged, buildPasswordReset } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { resetPasswordUrl } from '@/server/urls';

export interface PasswordResetMail {
  to: { email: string; name: string };
  token: string;
  expiresInMinutes: number;
}

export interface PasswordChangedMail {
  to: { email: string; name: string };
  changedAt: Date;
}

/** What Better Auth calls when someone asks to reset a password. The second argument is for tests. */
export async function sendPasswordResetEmail(input: PasswordResetMail, transport?: EmailTransport): Promise<void> {
  await sendEmail(
    buildPasswordReset({
      to: input.to,
      name: input.to.name,
      resetUrl: resetPasswordUrl(input.token),
      expiresInMinutes: input.expiresInMinutes,
    }),
    transport,
  );
}

/** What Better Auth calls after a password was reset with an emailed link. */
export async function sendPasswordChangedEmail(input: PasswordChangedMail, transport?: EmailTransport): Promise<void> {
  await sendEmail(
    buildPasswordChanged({ to: input.to, name: input.to.name, changedAt: input.changedAt.toISOString() }),
    transport,
  );
}
```

- [ ] **Step 5: Run it and the auth tests**

```bash
pnpm --filter @cleanstart/portal exec vitest run src/server/auth
```

Expected: every file under `src/server/auth` passes. `auth-mail.test.ts` reports `Tests  3 passed (3)`. The other auth tests still mock `./auth-mail`, so they never send.

- [ ] **Step 6: Run Gate A, then Gate B**

Run the three fast commands, then the full Gate A block. Expected: all exit 0. This is also the end of Wave 0 for this plan: confirm `pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts` still prints the seven `pass` lines.

- [ ] **Step 7: Commit and log**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/.claude/worktrees/portal-build
git add apps/portal/src/server/auth/auth-mail.ts apps/portal/src/server/auth/auth-mail.test.ts docs/superpowers/plans/2026-11-12-partner-portal-02-auth-and-email.md
git commit -m "feat(portal): M0.5d password reset and changed emails through the email module"
printf '%s\n' "$(date '+%Y-%m-%d %H:%M') IST | M0.5d | done | W0 | $(git rev-parse --short HEAD) | A ok, B ok | auth mail wired" >> /Users/a12345/Desktop/AI/cleanstart/cleanstart-website/docs/partner-portal/PROGRESS.md
```

---

## Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Each is checked by the task named, as a first step or at the first run; the fallback is stated.

1. **Better Auth version drift.** The code was run against 1.7.22. Task M0.7 Step 1 compares the installed version and Step 2 greps the two facts that matter. A different 1.7.x is expected to work; a different minor means re-running the whole checklist before relying on any option name. Fallback: pin the installed version in the orchestrator's `package.json` edit to 1.7.22.
2. **Google and Microsoft sign in end to end.** Not provable without dev OAuth apps. Only the configuration is tested (S6). The result stays `PROVISIONAL (OAuth unverified)` until a person runs the three steps in `AUTH-SPIKE.md`. In particular the Entra app registration must add the optional claims `email` and `xms_edov`; if Microsoft does not send `xms_edov`, a Microsoft login fails closed (no link, no session), which is safe but must be noticed. Fallback: Google only, or Auth.js (Task M0.7-F).
3. **Real Postgres with row level security versus the scratch run.** Every test in this plan was run against PGlite with stand-in helpers, which has no `portal_app` role and no row level security. The tests that depend on RLS (the `getShell` isolation probe, `getShell` reading the manager and `staff_scopes` as a partner) are first run for real in Task M1.1d Steps 8 and 9. Fallback if the probe or the manager lookup fails: the `partners_select`, `users_select` or `staff_scopes_select` policy in `src/db/rls.sql` differs from the contracts; report `blocked`, do not weaken the test.
4. **`hashPassword` before the auth module exists.** Resolved at the integration review: W0-b ships `makeUser` without `password`, and Task M0.7 Step 6b adds the option (and the seeded logins) after Step 6 creates `passwords.ts`, with a test.
5. **The per IP limit key behind Caddy and Cloudflare.** Better Auth reads `x-forwarded-for` by default. Any client can send that header unless the proxy replaces it. The per email limits do not depend on it. The IP header trust setting (`advanced.ipAddress.ipAddressHeaders`) is a Task M5.1 (security pass) decision, with the Caddy and Cloudflare configuration in front of it.
6. **`proxy.test.ts` reads a Next internal header.** The path header assertion reads `x-middleware-request-x-portal-path`, which is how `NextResponse.next({ request: { headers } })` carries request headers. If a Next upgrade renames it, change the assertion to read `x-middleware-override-headers`; the behaviour (Server Components see the header) is covered by the guard tests that mock `next/headers`.
7. **The Sign in screen's client code is not unit tested.** No DOM test setup exists. The server calls it makes are pinned (S2 to S5, the HTTP second step test, the gate tests), and Task M1.1g Step 6 is a manual check. The two step view is exercised end to end only once the P track builds the screen that turns the second step on (M1.7); the W2-b E2E must cover it.
8. **Shell search, notifications and the Message drawer remain mock.** By the contracts (K.1) they are wired in W2-a from the A and R track components. Until then a signed in user sees mock names in Ctrl K and the bell. This leaks nothing (the data is static), but it is visible.
9. **Auth.js fallback code is unrun.** Task M0.7-F contains code that was not compiled, because the gate passed. Its Step 4 says how to verify it against the installed beta (`typecheck`, read the `.d.ts`). Auth.js v5 is still a beta (`5.0.0-beta.32`), which is a reason to prefer Better Auth beyond the session behaviour.

## Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Modify | Accepted, but folded into `0000_init`: the three columns are in contracts C.1 and `schema.ts` from W0-b, there is no `0001` migration. Step 5 now only checks them; the file table and the verified-facts text were updated. |
| 2 | Accept | Contracts H.18. |
| 3 | Accept | Contracts H.18 and K.2. |
| 4 | Accept | Contracts H.18. |
| 5 | Accept | No reset server actions. Removed from contracts H.20 and L; plan 06's rate limit coverage test no longer lists them. |
| 6 | Accept | Plan 03 M1.5 already sets `email_verified` and inserts the credential account (checked in its tests). |
| 7 | Accept | Built by plan 03 M1.7b; contracts H.20 lists `verifyTwoFactorAction` and `regenerateBackupCodesAction`. |
| 8 | Accept | Contracts K.2. |
| 9 | Accept | Duplicate of plan 01 item 10; fixed in contracts C.2. |
| 10 | Accept | Contracts H.4 already states it; P adds the other functions in M1.7. |
| 11 | Accept | Contracts H.18. |

Nothing below is redefined in this plan. Each item is a change the orchestrator folds into the contracts file.

1. **C.1 `authTwoFactors`: three more columns** (`verified boolean not null default true`, `failed_verification_count integer not null default 0`, `locked_until timestamptz`). Better Auth 1.7 refuses to start without them. Delivered by Task M0.7 as `drizzle/0001_auth_two_factor.sql` under the Wave 0 schema exception (M.1 items 2 and 3); the contracts' C.1 and any later regenerated `0000` should include them.
2. **H.18 `auth.ts` exports `getAuth()` as well as `auth`.** `auth` is a lazy proxy, because Better Auth throws at construction without a secret and `next build` runs with `SKIP_ENV_VALIDATION=1`. Callers use either; route handlers use `getAuth().handler`.
3. **H.18 `viewer.ts` also exports `loadViewer(userId)` and `viewerFromHeaders(headers)`** (the testable parts of `getViewer`). `PATH_HEADER` and `safeNext` live in the new client safe file `src/lib/next-path.ts` (K.2 addition), because `proxy.ts` must not import the database.
4. **H.18 `sessions.ts`**: `listSessions(userId, currentToken, clock?)` takes an optional `Clock`, and a helper `currentSessionToken(requestHeaders)` is added, so the Account screen can mark the current session.
5. **L and H.20: `requestPasswordResetAction` and `resetPasswordAction` are not needed.** Better Auth serves both (`/request-password-reset`, `/reset-password`) with per IP and per email rate limits, an answer that does not reveal whether the address exists, a one hour single use token, session revocation and the password rule check. The Sign in screen calls `authClient.requestPasswordReset`. The P track's `/reset-password` page calls `authClient.resetPassword({ newPassword, token })` and shows the message when `error.code === 'PASSWORD_RULES_NOT_MET'`. The reset email, the changed notice, `password_changed_at` and the `account.password_changed` audit entry are done in `auth.ts` and `auth-mail.ts`. If the orchestrator wants server actions kept, P wraps `getAuth().api` and nothing here changes.
6. **P, M1.5 `acceptInvite` must set `users.email_verified = true`** and insert the `credential` account (`provider_id 'credential'`, `account_id` the user id, `password` from `hashPassword`) after `assertPasswordOk`. Better Auth only links a Google or Microsoft login to a user whose email is verified locally.
7. **P, M1.7 account actions use Better Auth for the second step.** `auth.api.enableTwoFactor({ body: { password, method: 'totp' }, headers })` returns the otpauth URI and the backup codes before the code is verified; the factor is active after `verifyTOTP`. The client method for the scan step is `authClient.twoFactor.enable`, whose result must be narrowed with `data.method === 'totp'` before reading `totpURI` or `backupCodes`. Backup codes are `XXXXX-XXXXX` (mixed case, case sensitive); the mock shows `XXXXX XXXXX`, so the Account screen shows them with a hyphen or replaces it with a space when displaying. The Sign in screen already accepts both.
8. **K.2 new shared files**: `src/lib/auth-client.ts`, `src/lib/initials.ts`, `src/lib/next-path.ts`, `src/lib/password-rules.ts` (already listed), `src/server/auth/test-totp.ts` (test helper, also usable by P's Account tests), `src/server/auth/auth-mail.ts`, `scripts/auth-spike-gate.ts`.
9. **W0-b, C.2 `src/db/client.ts` fails `biome lint`.** `const pools = (globalForDb.portalPools ??= createPools());` is `lint/suspicious/noAssignInExpressions` under the repo's Biome 1.9.4. Write it as `globalForDb.portalPools ??= createPools(); const pools = globalForDb.portalPools;`. The same rule would flag any test helper that writes `(counter += 1)` in an expression.
10. **H.4 `repo/account.ts`**: `getShell` ships in M1.1d with `isolation` entry `getShell: { scope: 'tenant', probe: forged viewer, expect: 'not_found' }`. P adds the other functions to `exportedFns` and `isolation` in the same file in M1.7. The shell staff `waitingApprovals` counts pending registrations in the viewer's staff scope (all regions for `all`), and is 0 for marketing.
11. **E, a user facing message.** `PASSWORD_RULES_NOT_MET` is the Better Auth error code used for a weak new password (`message: 'Meet all four password rules.'`, the same text as `assertPasswordOk`).

## Self-review

**Master task coverage.**

| Master task | Plan task |
|---|---|
| M0.7 auth spike, decision gate, result recorded in the Decisions table | Task M0.7 (checklist S1 to S7, gate script, `AUTH-SPIKE.md`, D3 row), Task M0.7-F (the exact fallback tasks) |
| M1.1 sessions, guards, `getViewer`, `requireViewer`, `requireKind`, password rule validator, `policies.ts` with the full matrix tests, `proxy.ts` redirect keeping the review gate, Sign in conversion | M1.1a (password rule, tokens), M1.1b (policies and the matrix), M1.1c (sign in gate and hardening), M1.1d (sessions, guards, `homeFor`, `getShell`), M1.1e (proxy), M1.1f (layouts, routes, shell: personas replaced once), M1.1g (Sign in) |
| M0.5 portal email module (layout, brevo, `EmailTransport`, every template in the contracts, escaping tests, fixed sender name) | M0.5a (layout, transport, Brevo, send, fake, urls, sender name test), M0.5b and M0.5c (21 templates with real copy, escaping tests per template), M0.5d (the two Better Auth mails) |

**Contracts items implemented as written:** `Viewer` shape and `homeFor`; `Action` union, matrix and `can`, `assertCan`, `allowedActions` (D.2 to D.4, unchanged rules); `getViewer`, `requireViewer`, `requireKind`, `requireCan`, `requireActionViewer`, `homeFor` (H.18); `checkPassword`, `assertPasswordOk`, `hashPassword`, `verifyPassword` (H.18); `INVITE_TTL_DAYS`, `OTP_TTL_MINUTES`, `OTP_MAX_ATTEMPTS`, `generateInviteToken`, `hashToken`, `inviteExpiresAt`, `inviteState`, `generateNumericCode`, `hashCode`, `verifyCode` (H.18); `listSessions`, `revokeSession`, `revokeAllSessions` (H.18); `EmailAddress`, `EmailMessage`, `EmailResult`, `EmailTransport`, `PORTAL_SENDER_NAME`, `createEmailTransport`, `sendEmail`, `EmailBlock`, `renderEmail` (with `footnote`), `FakeEmailTransport` (H.15, J.4); `absoluteUrl`, `inviteUrl`, `resetPasswordUrl`; all 21 builders with the input interfaces of H.15 and the exact function names.

**Placeholder scan.** The plan contains no placeholder markers, no step that points at another step instead of giving its content, and no step that says what to test without giving the test. Every code step has the full file or an edit with the exact Find and Replace text; the one conditional task (M0.7-F) has code and says which parts are unverified and how to verify them. The edits to `shell.tsx` and `SignIn.tsx` were applied to a copy of the mock and compiled, so each Find text matches once.

**Name consistency with the contracts.** File paths, function names, signatures, column names (`email_verified`, `password_changed_at`, `last_login_at`, `status`, the four `auth_*` tables), audit event `account.password_changed`, `ShellDto`, `SessionDto`, `InviteState`, the routes in section L and the nav per role all match the contracts. Differences are the ones listed under "Contract change requests"; none is used by another area plan before the orchestrator folds it in, except items 5 to 7, which the P track reads from this plan.

**Order check.** Task M0.7 needs only W0-a to W0-d outputs (`env`, `db/client`, `schema`, `errors`, `rate-limit`, `log`, `audit/record`, test helpers). Task M1.1c needs `rate-limit.ts`, `audit/record.ts`, `lib/clock.ts` (W0-c, W0-d, W0-b). Task M1.1d needs `repo/context.ts` and `repo/isolation.registry.ts` (W0-d) and the DTOs in `lib/dto.ts` (W0-b). Task M0.5a needs `env.ts`, `log.ts` (W0-c), `lib/routes.ts` with `ROUTES.resetPassword` (added in M1.1f, which comes first) and `@sentry/nextjs` (W0-a). Task M0.5d needs M0.5a to M0.5c and M0.7.
