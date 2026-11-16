# Auth spike (M0.7)

## Result

Decision: **Better Auth 1.7.22** (`better-auth` with its Drizzle adapter). Status: **PASS**.

Google and Microsoft sign-in were removed by decision of the product owner on 2026-11-16. Sign in is email and password only (with the optional second step), so the spike result is no longer PROVISIONAL for OAuth: there is no OAuth left to verify.

S1 to S5 and S7 pass in `apps/portal/src/server/auth/auth.spike.test.ts`; run the gate with
`pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts`. S6 now asserts that no social provider and no account linking is configured. The gate prints PASS when S1 to S7 all pass.

## Checklist

| Item | What it proves | Result |
|---|---|---|
| S1 | runs on `users` and `auth_*`; Postgres generates ids | pass |
| S2 | scrypt credentials sign in; wrong password and API sign up refused | pass |
| S3 | authenticator app second step and single use backup codes | pass |
| S4 | database sessions and `getViewer` (revoked, disabled, suspended are null) | pass |
| S5 | password reset through the mail bridge, sessions revoked | pass |
| S6 | email and password is the only way in: no social provider, no account linking | pass |
| S7 | no construction at import, so `next build` needs no secrets | pass |

## What the spike found

1. `auth_two_factor` needs `verified`, `failed_verification_count` and `locked_until` (in the schema and `0000_init` from W0-b on). Better Auth 1.7 refuses to start on a schema mismatch.
2. Better Auth throws when constructed without a secret, so `getAuth()` builds it on first use and `auth` is a lazy proxy.
3. Second step: authenticator app (TOTP) with 10 backup codes, as in the mock. The same plugin also offers an email code (`method: 'otp'`). To switch: pass `otpOptions: { sendOTP }` to `twoFactor()` in `auth.ts`, send the code with a new template, and change the Sign in and Account copy to "Email code". The product owner confirms which; the proposal lists "optional or required" as open. The email code path was exercised in a throwaway test against the same tables and passed: enabling with `method: 'otp'` marks the user as two-factor enabled at once, sign in then returns `twoFactorRedirect` with `twoFactorMethods: ['otp']`, `sendTwoFactorOTP` hands the code to `sendOTP`, a wrong code is refused with 401 and the right one creates the session. The throwaway test was not kept, because the contracts choose the authenticator app and `auth.ts` does not configure `sendOTP`.
4. Backup codes are `XXXXX-XXXXX`, letters and digits, case sensitive. The Sign in screen accepts them with or without the hyphen or a space.
5. Enabling the second step with the authenticator app returns the otpauth URI and the backup codes before the code is verified; the factor is active only after `verifyTOTP`.
6. (Historical, removed 2026-11-16.) Microsoft sign in needed the Entra optional claims `email` and `xms_edov`. Social sign in no longer exists.
7. `acceptInvite` still sets `users.email_verified = true`.
8. Reset links are built by the portal (`/reset-password?token=...`); the page calls `authClient.resetPassword({ newPassword, token })`.
9. Session cookie, observed from the HTTP handler: `better-auth.session_token`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000` (30 days). With an `https` base URL the name gains the `__Secure-` prefix and the cookie gains `Secure`; over `http://localhost` it has no `Secure`. Production `APP_URL` must therefore be `https`.
10. Better Auth skips its origin (CSRF) check when it detects a test environment. Outside tests the check is on: a request with a cookie and a foreign `Origin` got 403 when the check was forced on. Do not set `advanced.disableOriginCheck` or `disableCSRFCheck`.
11. (Historical, removed 2026-11-16.) With no provider configured, `/sign-in/social` answered 404. There is no social route now.
12. Password hashing is scrypt through `passwords.ts` (N 16384, r 16, p 1, 64 byte key, 16 byte salt, input normalised NFKC, `timingSafeEqual` on verify). Stored format `scrypt$N$r$p$saltBase64$hashBase64`, so the parameters can be raised later without invalidating old hashes.

## What a person must do

Nothing for sign in. There are no OAuth apps to create and no Google or Microsoft variables to set.
