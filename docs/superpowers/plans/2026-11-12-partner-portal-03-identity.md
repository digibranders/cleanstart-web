# Partner portal identity and onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Track P of the partner portal: applications (portal page and website form entries), application review, invites and first login, team and access requests, account and company screens, CleanStart staff admin, and the partners list and detail. Every screen keeps the mock's markup, classes and copy; seed data and slice setters are replaced by repo functions called from Server Components and server actions.

**Architecture:** Each screen is a Server Component `page.tsx` that guards with `requireCan` or `requireKind`, loads DTOs through `withViewer(viewer, tx => repoFn(tx, viewer, ...))` and hands serialisable props plus the server `today` to the existing client component. Each place the mock called a slice setter becomes a server action built on `runViewerAction` or `runPublicAction`: Zod parse, `assertCan` against the loaded record, repo write, `recordAudit`, `enqueue` (outbox) where the contracts say so, `notifyUsers`, then email and `revalidatePath` after commit. Public flows (apply, accept invite, request access, website intake) run through `withSystem` with the repo scope `public`. Invite tokens are 32 random bytes stored only as SHA-256, valid 7 days, single use. This plan implements `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` (called "the contracts") exactly: same names, signatures, DTOs, columns and paths.

**Tech Stack:** Next.js 16.2.5 (App Router, server actions), React 19, TypeScript strict, Drizzle ORM on Postgres 16 with row level security, Zod 3, Better Auth (through `@/server/auth/*`), `@cleanstart/forms` (business email and E.164 rules), Cloudflare Turnstile, Vitest 2 against a real Postgres, Biome.

---

## Conventions used by every task

- Paths are relative to `apps/portal` unless they start with `docs/`. Work in the track worktree `.claude/worktrees/portal-p` (branch `feat/portal-p`, database `cleanstart_portal_p`, test database `cleanstart_portal_p_test`, dev port 3224). Run every command from the worktree root. Test command shape: `pnpm --filter @cleanstart/portal exec vitest run <path>`.
- Style: server code uses single quotes (as the contracts do). Edits to existing mock components keep that file's double quotes and 2 space indent. No `any`, explicit return types on exported functions, typed errors from `@/server/errors`, no em-dashes or en-dashes anywhere (commas, colons, "to").
- Tests use the contracts' helpers from `@/db/test-helpers` (`testDb`, `resetDb`, `makePartner`, `makeUser`, `makeApplication`, `makeInvite`, `makeAccessRequest`, `makeRegistration`, `viewerFor`, `asStaff`, `asPartner`) and `FakeEmailTransport` from `@/server/email/fake`. Every repo module ends with an `isolation` export (contracts F.6); the central test `src/server/repo/isolation.test.ts` fails when an exported function is missing from it, so every task that adds a repo function replaces the module's `isolation` block with the full block shown in that task.
- Action tests mock the Next runtime and the email transport with the same block (copied into each action test file, it cannot be shared because `vi.mock` is hoisted per file): `next/headers` (ip and cookie jar), `next/cache`, `@sentry/nextjs`, `@/server/auth/viewer` and `@/server/email/send` (delegating to one `FakeEmailTransport`). Each action test file uses a fresh `ip` per test so the in-process rate limiter never leaks between tests.
- Action files start with `'use server'` and export only `async function ...Action`. Types and constants live in `src/lib` (contracts M.1 item 9).
- Commit with `git add <exact paths>` then `git commit -m "feat(portal): <id> <summary>"`. Never `git add -A`. Never `--no-verify`. No attribution lines.

**Gate A** (every task ends with it; copy of the handoff block):

```bash
pnpm --filter @cleanstart/portal lint
pnpm --filter @cleanstart/portal typecheck
pnpm --filter @cleanstart/portal test
until mkdir /tmp/portal-build.lock 2>/dev/null; do sleep 15; done
pnpm --filter @cleanstart/portal build; BUILD_STATUS=$?
rmdir /tmp/portal-build.lock
[ "$BUILD_STATUS" -eq 0 ]
git diff feat/portal-build -- . | grep '^+' | grep -nE $'\xe2\x80\x94|\xe2\x80\x93' && exit 1
git diff --name-only feat/portal-build
```

Expected: lint and typecheck exit 0 with no diagnostics; `test` ends with `Test Files  N passed (N)` and no failures, including the isolation matrix; `build` ends with the Next route table and exit 0; the dash check prints nothing (it is the handoff's check for the em-dash and en-dash characters, written with their byte escapes so this plan file contains neither character); the last command lists only paths from the task's Files block.

**Prerequisites (verify once at the start of the track).** Wave 0 is merged (`git merge feat/portal-build` into `feat/portal-p`, tag `portal-w0` reachable). These files must exist; the check prints nothing when all do:

```bash
for f in src/db/schema.ts src/db/test-helpers.ts src/lib/domain.ts src/lib/dto.ts src/lib/clock.ts src/lib/dates.ts \
  src/server/errors.ts src/server/repo/context.ts src/server/repo/isolation.registry.ts src/server/repo/isolation.test.ts \
  src/server/audit/record.ts src/server/notify.ts src/server/actions/run.ts src/server/actions/result.ts \
  src/server/auth/types.ts src/server/auth/policies.ts src/server/auth/viewer.ts src/server/auth/tokens.ts \
  src/server/auth/passwords.ts src/server/auth/sessions.ts src/server/auth/auth.ts src/server/email/send.ts \
  src/server/email/fake.ts src/server/email/templates/index.ts src/server/urls.ts src/server/rate-limit.ts \
  src/server/jobs/intake.ts src/server/repo/account.ts; do test -f "$f" || echo "MISSING $f"; done
```

`src/server/hubspot/outbox.ts` (task H4.4, track H) provides `enqueue`. The steps that call it are marked "Requires H4.4". If `test -f src/server/hubspot/outbox.ts` fails when you reach one, append a `blocked` line to the progress log naming H4.4, skip only that step and its test, finish the rest of the task, and the orchestrator completes the step after H4.4 merges.

---

## Scope boundaries and ownership notes

- **SignIn.tsx is plan 02's.** This plan touches `SignIn.tsx` only in task M1.6, and only the three "request access" views, because contracts K.1 gives P that region and `requestAccessAction` lives in `actions/invites.ts`. The two Account security cards, the password and two-step actions and the `/reset-password` page are built here in Task M1.7b: the brief for this plan names `PasswordCard.tsx` and `TwoStepCard.tsx` as plan 02's, but contracts K.1 and K.2 give them to this track, H.20 lists their actions under P, and plan 02's own change requests (its items 5 and 7) hand the reset page and the second-step account actions to "P, M1.7", while plan 02 builds none of them (see "Contract change requests", item 1). Task M1.7b is separable if the orchestrator decides otherwise.
- **Shared files are never edited.** `shell.tsx`, `routes.ts`, `portal.css`, `components/ui/**`, `db/schema.ts`, `env.ts` and `package.json` stay as they are. Anything needed there is a "Contract change request".
- **Mock scaffolding that this plan leaves for M5.4:** `src/data/*.ts`, `src/lib/slice.ts`, `data-tour` attributes. After a screen is converted nothing under `src/components/**` owned by this plan imports from `@/data/*` or `@/lib/slice` (each task ends with a grep that proves it).

## File Structure

Files created or modified by this plan (paths relative to `apps/portal`). "T" is the task that first creates or changes the file.

| Path | Purpose | T |
|---|---|---|
| `src/lib/people.ts`, `src/lib/people.test.ts` | Client-safe helpers: email and domain rules, initials, label lookups, last-seen labels, user agent text, post-invite landing path | M1.3 |
| `src/lib/apply.ts` | `ApplyOutcome` and field limits for the apply form | M1.3 |
| `src/server/people.ts`, `src/server/people.test.ts` | Server helpers: `likePattern`, `alertAddresses`, `iso` | M1.3 |
| `src/server/turnstile.ts` (+ test) | Cloudflare siteverify check | M1.3 |
| `src/server/apply-receipt.ts` (+ test) | Signed cookie carrying the apply receipt to `/apply/done` | M1.3 |
| `src/server/repo/applications.ts` (+ test) | Applications repo, built up across M1.3, M1.3b, M1.4 | M1.3 |
| `src/server/actions/apply.ts` (+ test) | `submitApplicationAction` | M1.3 |
| `src/components/partners/turnstile-widget.tsx` | Explicit Turnstile render | M1.3 |
| `src/components/screens/Apply.tsx`, `ApplyDone.tsx`, `src/app/(public)/apply/page.tsx`, `apply/done/page.tsx` | Converted screens | M1.3 |
| `src/server/intake/website-applications.ts` (+ test), `src/server/intake/stub-cms.ts`, `src/server/jobs/intake.ts` (+ test), `scripts/stub-cms.ts`, `scripts/run-intake.ts` | Website form intake against a stub CMS | M1.3b |
| `src/server/invite-core.ts` (+ test) | Shared invite issuing and token rotation | M1.4 |
| `src/server/partner-routing.ts`, `src/server/partner-rows.ts` (+ tests) | Manager routing, partner insert, partner list rows with counts | M1.4 |
| `src/server/actions/applications.ts` (+ test) | Approve, decline, reopen | M1.4 |
| `src/components/partners/applications-table.tsx`, `badges.tsx`, `src/components/screens/AdminPartners.tsx` (Applications tab), `src/app/admin/partners/page.tsx` | Converted in part | M1.4 |
| `src/server/repo/invites.ts` (+ test) | Invite preview and accept (M1.5), create, resend, revoke, list (M1.6) | M1.5 |
| `src/server/repo/partners.ts` (+ test) | Checklist and company (M1.5), company profile (M1.7), list and detail and mutations (M4.1) | M1.5 |
| `src/server/actions/invites.ts` (+ test) | `previewInviteAction`, `acceptInviteAction` (M1.5), `requestAccessAction` (M1.6) | M1.5 |
| `src/server/actions/partners.ts` (+ test) | `tickChecklistStepAction`, `sendManagerMessageAction` (M1.5), `updateCompanyProfileAction` (M1.7), partner mutations (M4.1) | M1.5 |
| `scripts/dev-invite-link.ts` | Dev helper that prints a fresh invite link for manual checks | M1.5 |
| `src/components/screens/AcceptInvite.tsx`, `PartnerWelcome.tsx`, `src/components/partners/message-drawer.tsx`, `src/app/(public)/accept-invite/page.tsx`, `src/app/partner/welcome/page.tsx` | Converted screens | M1.5 |
| `src/server/repo/team.ts` (+ test), `src/server/actions/team.ts` (+ test) | Team and access requests | M1.6 |
| `src/components/screens/Team.tsx`, `src/components/people/InviteCard.tsx`, `AccessRequests.tsx`, `RequestAccessForm.tsx`, `src/components/screens/SignIn.tsx` (request views only), `src/app/partner/team/page.tsx` | Converted screens | M1.6 |
| `src/server/repo/account.ts` (+ test), `src/server/actions/account.ts` (+ test) | Profile, notification prefs, sessions | M1.7 |
| `src/components/screens/Account.tsx`, `Company.tsx`, `src/components/people/SessionsCard.tsx`, `src/app/partner/account/page.tsx`, `src/app/partner/company/page.tsx` | Converted screens | M1.7 |
| `src/server/auth-errors.ts` (+ test), `src/server/actions/account-security.test.ts` | Better Auth error mapper; tests for the password and two-step actions (the actions are appended to `actions/account.ts`) | M1.7b |
| `src/components/people/PasswordCard.tsx`, `TwoStepCard.tsx`, `src/components/screens/ResetPassword.tsx`, `src/app/(public)/reset-password/page.tsx` | Account security cards and the reset page | M1.7b |
| `src/server/repo/staff.ts` (+ test), `src/server/actions/staff.ts` (+ test) | Staff admin | M1.8 |
| `src/components/screens/AdminTeam.tsx`, `src/components/people/StaffInviteDrawer.tsx`, `src/app/admin/team/page.tsx` | Converted screens | M1.8 |
| `src/components/partners/partners-table.tsx`, `partner-detail.tsx`, `partner-dialogs.tsx`, `add-partner-drawer.tsx`, `src/components/screens/AdminPartners.tsx` (Partners tab), `src/app/admin/partners/page.tsx` | Partners list and detail | M4.1 |

---

### Task M1.3: Portal application page

Implements master task 1.3. Rules: company email required (free-mail rejected with the server's full corpus), a domain that already belongs to a partner returns the "ask your partner admin" outcome without creating anything, Turnstile and a per-IP and per-email rate limit, applicant and staff emails, `source = 'portal'`, a second submission from the same email merges into the open application.

**Files:**
- Create: `src/lib/people.ts`, `src/lib/people.test.ts`, `src/lib/apply.ts`
- Create: `src/server/people.ts`, `src/server/people.test.ts`
- Create: `src/server/turnstile.ts`, `src/server/turnstile.test.ts`
- Create: `src/server/apply-receipt.ts`, `src/server/apply-receipt.test.ts`
- Create: `src/server/repo/applications.ts`, `src/server/repo/applications.test.ts`
- Create: `src/server/actions/apply.ts`, `src/server/actions/apply.test.ts`
- Create: `src/components/partners/turnstile-widget.tsx`
- Modify: `src/components/screens/Apply.tsx`, `src/components/screens/ApplyDone.tsx`, `src/app/(public)/apply/page.tsx`, `src/app/(public)/apply/done/page.tsx`

- [ ] **Step 1: Write the failing test for the client-safe helpers**

Create `src/lib/people.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  codeFromLabel,
  describeUserAgent,
  emailDomain,
  formatAgreement,
  initialsOf,
  invitedLabel,
  isFreeEmail,
  isPlausibleDomain,
  isValidEmail,
  landingPathFor,
  lastSeenLabel,
  nameFromEmail,
  normaliseDomain,
  rowKey,
} from './people';

describe('email and domain helpers', () => {
  it('validates the shape of an email without rejecting free mail', () => {
    expect(isValidEmail('neha@tidewaterinfosec.in')).toBe(true);
    expect(isValidEmail(' neha@gmail.com ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('returns the lower case domain of a valid email and an empty string otherwise', () => {
    expect(emailDomain('Neha@TidewaterInfosec.IN')).toBe('tidewaterinfosec.in');
    expect(emailDomain('nope')).toBe('');
  });

  it('detects free mail with the curated client list', () => {
    expect(isFreeEmail('a@gmail.com')).toBe(true);
    expect(isFreeEmail('a@kestrelsystems.in')).toBe(false);
    expect(isFreeEmail('broken')).toBe(false);
  });

  it('normalises a website to a bare domain', () => {
    expect(normaliseDomain('https://www.Example.com/path?x=1')).toBe('example.com');
    expect(normaliseDomain('example.com:8080')).toBe('example.com');
    expect(normaliseDomain('  ')).toBe('');
  });

  it('accepts real domains and rejects junk', () => {
    expect(isPlausibleDomain('kestrelsystems.in')).toBe(true);
    expect(isPlausibleDomain('localhost')).toBe(false);
    expect(isPlausibleDomain('a b.com')).toBe(false);
  });
});

describe('display helpers', () => {
  it('builds initials, names and row keys', () => {
    expect(initialsOf('Aditi Rao')).toBe('AR');
    expect(initialsOf('  madonna ')).toBe('M');
    expect(nameFromEmail('meera.pillai@kestrelsystems.in')).toBe('Meera Pillai');
    expect(rowKey('meera.pillai@kestrelsystems.in')).toBe('meerapillai');
  });

  it('maps a display label back to its code', () => {
    const labels = { sales: 'Sales', technical: 'Technical' } as const;
    expect(codeFromLabel(labels, 'Technical')).toBe('technical');
    expect(codeFromLabel(labels, 'Nope')).toBeUndefined();
  });

  it('describes a user agent', () => {
    expect(describeUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36')).toBe('Chrome on macOS');
    expect(describeUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1')).toBe('Safari on iOS');
    expect(describeUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/125.0 Chrome/125.0 Safari/537.36')).toBe('Edge on Windows');
    expect(describeUserAgent(null)).toBe('Unknown device');
  });

  it('labels last activity relative to the server date', () => {
    expect(lastSeenLabel(null, '2026-11-12')).toBe('Never');
    expect(lastSeenLabel('2026-11-12T08:00:00.000Z', '2026-11-12')).toBe('Today');
    expect(lastSeenLabel('2026-11-11T23:00:00.000Z', '2026-11-12')).toBe('Yesterday');
    expect(lastSeenLabel('2026-11-02T08:00:00.000Z', '2026-11-12')).toBe('2 Nov');
    expect(invitedLabel('2026-11-05T09:00:00.000Z')).toBe('Invited 5 Nov');
    expect(invitedLabel(null)).toBe('Invite pending');
  });

  it('formats the agreement line', () => {
    expect(formatAgreement('1.2', '2026-03-12T14:06:00.000Z')).toBe('v1.2, accepted 12 Mar 2026');
    expect(formatAgreement('draft-0', '2026-03-12T14:06:00.000Z')).toBe('draft-0, accepted 12 Mar 2026');
    expect(formatAgreement(null, null)).toBe('Not accepted yet');
  });

  it('picks the page a person lands on after accepting an invite', () => {
    expect(landingPathFor('partner', 'partner_admin')).toBe('/partner/welcome');
    expect(landingPathFor('partner', 'sales')).toBe('/partner/overview');
    expect(landingPathFor('partner', 'technical')).toBe('/partner/documents');
    expect(landingPathFor('staff', 'partner_manager')).toBe('/admin/approvals');
    expect(landingPathFor('staff', 'marketing')).toBe('/admin/documents');
  });
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/people.test.ts`
Expected: FAIL, `Error: Failed to resolve import "./people" from "src/lib/people.test.ts"`.

- [ ] **Step 3: Implement the helpers**

Create `src/lib/people.ts`:

```ts
import { COMMON_FREE_EMAIL_DOMAINS, validateBusinessEmail } from '@cleanstart/forms';
import { fmtLong, fmtShort, addDays } from '@/lib/dates';
import type { PartnerRole, StaffRole, UserKind } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';

const NO_FREE_DOMAINS: ReadonlySet<string> = new Set();
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/u;

/** Shape check only. Free mail is allowed here; callers add the business rule themselves. */
export const isValidEmail = (value: string): boolean =>
  validateBusinessEmail(value, { freeDomains: NO_FREE_DOMAINS, requireBusiness: false }).ok;

/** Lower case domain of a valid email, or an empty string. */
export const emailDomain = (value: string): string => {
  const result = validateBusinessEmail(value, { freeDomains: NO_FREE_DOMAINS, requireBusiness: false });
  return result.ok ? result.domain : '';
};

/** Client side free mail check (curated list). The server uses the full corpus from '@cleanstart/forms/server'. */
export const isFreeEmail = (value: string): boolean => {
  const result = validateBusinessEmail(value, { freeDomains: COMMON_FREE_EMAIL_DOMAINS });
  return !result.ok && result.reason === 'free-mail';
};

/** "https://www.Example.com/path" becomes "example.com". */
export const normaliseDomain = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//u, '')
    .replace(/^www\./u, '')
    .split(/[/?#:]/u)[0] ?? '';

export const isPlausibleDomain = (value: string): boolean => DOMAIN_RE.test(value);

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** "meera.pillai@x.in" becomes "Meera Pillai". */
export const nameFromEmail = (email: string): string =>
  (email.split('@')[0] ?? '')
    .split('.')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const rowKey = (email: string): string => (email.split('@')[0] ?? '').replace(/[^a-z0-9]/giu, '');

/** Reverse lookup of a display label map: the code whose label is `label`. */
export const codeFromLabel = <T extends string>(labels: Record<T, string>, label: string): T | undefined =>
  (Object.keys(labels) as T[]).find((code) => labels[code] === label);

export const describeUserAgent = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown device';
  const browser = /Edg\//u.test(userAgent)
    ? 'Edge'
    : /OPR\//u.test(userAgent)
      ? 'Opera'
      : /Firefox\//u.test(userAgent)
        ? 'Firefox'
        : /Chrome\//u.test(userAgent)
          ? 'Chrome'
          : /Safari\//u.test(userAgent)
            ? 'Safari'
            : 'Browser';
  const os = /Windows/u.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad/u.test(userAgent)
      ? 'iOS'
      : /Android/u.test(userAgent)
        ? 'Android'
        : /Mac OS X/u.test(userAgent)
          ? 'macOS'
          : /Linux/u.test(userAgent)
            ? 'Linux'
            : null;
  return os ? `${browser} on ${os}` : browser;
};

/** "Today", "Yesterday" or "2 Nov". `today` comes from the server so hydration is stable. */
export const lastSeenLabel = (iso: string | null, today: string): string => {
  if (!iso) return 'Never';
  const date = iso.slice(0, 10);
  if (date === today) return 'Today';
  if (date === addDays(today, -1)) return 'Yesterday';
  return fmtShort(date);
};

export const invitedLabel = (iso: string | null): string => (iso ? `Invited ${fmtShort(iso.slice(0, 10))}` : 'Invite pending');

/** "v1.2, accepted 12 Mar 2026". A version that does not start with a digit (the placeholder "draft-0") is shown as is. */
export const formatAgreement = (version: string | null, acceptedAt: string | null): string => {
  if (!acceptedAt) return 'Not accepted yet';
  const label = version && /^\d/u.test(version) ? `v${version}` : (version ?? 'Agreement');
  return `${label}, accepted ${fmtLong(acceptedAt.slice(0, 10))}`;
};

/** Where a person lands right after accepting an invite and signing in. */
export const landingPathFor = (kind: UserKind, role: PartnerRole | StaffRole): string => {
  if (kind === 'partner') {
    if (role === 'partner_admin') return ROUTES.partner.welcome;
    return role === 'technical' ? ROUTES.partner.documents : ROUTES.partner.overview;
  }
  return role === 'marketing' ? ROUTES.admin.documents : ROUTES.admin.approvals;
};
```

- [ ] **Step 4: Run the helper tests and see them pass**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/people.test.ts`
Expected: PASS, `Test Files  1 passed (1)`.

- [ ] **Step 5: Create the apply types**

Create `src/lib/apply.ts`:

```ts
import type { PartnerCategory, PartnerRegion } from '@/lib/domain';

/** What the apply action tells the form. 'existing_partner' means nothing was created. */
export type ApplyOutcome =
  | { outcome: 'submitted'; reference: string }
  | { outcome: 'existing_partner'; partnerName: string };

export interface ApplyFormValues {
  company: string;
  website: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  region: PartnerRegion;
  reason: string;
  /** Cloudflare Turnstile response token, null until the widget has produced one. */
  turnstileToken: string | null;
}

/** 5 applications per IP and 3 per email address in 10 minutes. */
export const APPLY_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
export const APPLY_EMAIL_RULE = { limit: 3, windowSeconds: 600 } as const;
```

- [ ] **Step 6: Write the failing test for the server helpers**

Create `src/server/people.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { alertAddresses, iso, likePattern } from './people';

describe('server people helpers', () => {
  it('escapes LIKE wildcards in a search term', () => {
    expect(likePattern(' 100%_sure ')).toBe('%100\\%\\_sure%');
  });

  it('merges manager addresses with the fallback and removes duplicates', () => {
    const managers = [
      { userId: 'u1', email: 'a@cleanstart.com', name: 'A' },
      { userId: 'u2', email: 'b@cleanstart.com', name: 'B' },
    ];
    expect(alertAddresses(managers, 'partners@cleanstart.com').map((a) => a.email)).toEqual([
      'a@cleanstart.com',
      'b@cleanstart.com',
      'partners@cleanstart.com',
    ]);
    expect(alertAddresses(managers, 'A@cleanstart.com').map((a) => a.email)).toEqual(['a@cleanstart.com', 'b@cleanstart.com']);
    expect(alertAddresses([], undefined)).toEqual([]);
  });

  it('formats dates as ISO strings and keeps null', () => {
    expect(iso(new Date('2026-11-06T14:02:00Z'))).toBe('2026-11-06T14:02:00.000Z');
    expect(iso(null)).toBeNull();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/people.test.ts`
Expected: FAIL, `Failed to resolve import "./people"`.

- [ ] **Step 7: Implement the server helpers**

Create `src/server/people.ts`:

```ts
import type { EmailAddress } from '@/server/email/transport';

export interface AddressSource {
  userId: string;
  email: string;
  name: string;
}

/** `%term%` with LIKE wildcards escaped, for ilike searches. */
export const likePattern = (query: string): string => `%${query.trim().replace(/[\\%_]/gu, '\\$&')}%`;

export const iso = (value: Date | null): string | null => (value ? value.toISOString() : null);

/**
 * Staff alert recipients: every person given plus the shared PARTNERS_NOTIFY_EMAIL when it is set, without duplicates.
 * Contracts H.15: staff recipients come from the action; the env address is the fallback and an extra copy.
 */
export const alertAddresses = (people: readonly AddressSource[], notifyEmail: string | undefined): EmailAddress[] => {
  const seen = new Set<string>();
  const out: EmailAddress[] = [];
  const add = (email: string, name?: string): void => {
    const key = email.trim().toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(name ? { email: key, name } : { email: key });
  };
  for (const person of people) add(person.email, person.name);
  if (notifyEmail) add(notifyEmail);
  return out;
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/people.test.ts`
Expected: PASS.

- [ ] **Step 8: Write the failing Turnstile test**

Create `src/server/turnstile.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/env';
import { IntegrationError, ValidationError } from '@/server/errors';
import { verifyTurnstile } from './turnstile';

const respond = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

afterEach(() => vi.unstubAllGlobals());

describe('verifyTurnstile', () => {
  it('passes when Cloudflare says success and sends secret, token and ip as a form', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => respond({ success: true }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyTurnstile({ token: 'tok-1', ip: '203.0.113.9' })).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const form = init?.body as URLSearchParams;
    expect(form.get('secret')).toBe(env.TURNSTILE_SECRET_KEY);
    expect(form.get('response')).toBe('tok-1');
    expect(form.get('remoteip')).toBe('203.0.113.9');
  });

  it('throws a validation error on the turnstile path when the check fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respond({ success: false, 'error-codes': ['timeout-or-duplicate'] })));
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toMatchObject({
      issues: [{ path: 'turnstile' }],
    });
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a missing token without calling Cloudflare', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(verifyTurnstile({ token: null, ip: null })).rejects.toBeInstanceOf(ValidationError);
    await expect(verifyTurnstile({ token: '   ', ip: null })).rejects.toBeInstanceOf(ValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws an integration error when Cloudflare is unreachable or answers with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network down'); }));
    await expect(verifyTurnstile({ token: 'tok', ip: null })).rejects.toMatchObject({ service: 'turnstile' });
    vi.stubGlobal('fetch', vi.fn(async () => respond({}, 503)));
    const error = await verifyTurnstile({ token: 'tok', ip: null }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(IntegrationError);
    expect((error as IntegrationError).upstreamStatus).toBe(503);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/turnstile.test.ts`
Expected: FAIL, `Failed to resolve import "./turnstile"`.

- [ ] **Step 9: Implement Turnstile**

Create `src/server/turnstile.ts` (the signature is contracts H.18):

```ts
import { z } from 'zod';
import { env } from '@/env';
import { IntegrationError, ValidationError } from '@/server/errors';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 8000;

const siteverifySchema = z.object({ success: z.boolean() });

/**
 * Cloudflare Turnstile server side check. Throws ValidationError (path "turnstile") when the visitor failed or sent no
 * token, IntegrationError('turnstile') when Cloudflare cannot be reached. Dev and test use Cloudflare's always-pass keys
 * (env.ts), so no real challenge is needed locally.
 */
export async function verifyTurnstile(input: { token: string | null; ip: string | null }): Promise<void> {
  const token = input.token?.trim();
  if (!token) throw new ValidationError([{ path: 'turnstile', message: 'Confirm you are not a robot.' }]);

  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (input.ip) form.set('remoteip', input.ip);

  let success: boolean;
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new IntegrationError('turnstile', `siteverify answered ${response.status}`, { status: response.status });
    success = siteverifySchema.parse(await response.json()).success;
  } catch (error) {
    if (error instanceof IntegrationError) throw error;
    throw new IntegrationError('turnstile', 'siteverify request failed', { cause: error });
  }
  if (!success) throw new ValidationError([{ path: 'turnstile', message: 'The robot check failed. Try again.' }]);
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/turnstile.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 10: Write the failing receipt test**

Create `src/server/apply-receipt.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { type ApplyReceipt, APPLY_RECEIPT_TTL_SECONDS, signApplyReceipt, verifyApplyReceipt } from './apply-receipt';

const receipt: ApplyReceipt = {
  reference: 'APP-2611-0045',
  company: 'Tidewater Infosec',
  firstName: 'Neha',
  email: 'neha.joshi@tidewaterinfosec.in',
  category: 'channel',
  region: 'india',
  submittedOn: '2026-11-12',
};
const now = new Date('2026-11-12T10:00:00Z');

describe('apply receipt cookie', () => {
  it('round trips a signed receipt', () => {
    expect(verifyApplyReceipt(signApplyReceipt(receipt, now), now)).toEqual(receipt);
  });

  it('rejects a tampered payload and a tampered signature', () => {
    const [payload = '', mac = ''] = signApplyReceipt(receipt, now).split('.');
    const forged = Buffer.from(JSON.stringify({ ...receipt, reference: 'APP-2611-0001', exp: now.getTime() + 60_000 })).toString('base64url');
    expect(verifyApplyReceipt(`${forged}.${mac}`, now)).toBeNull();
    expect(verifyApplyReceipt(`${payload}.${mac.slice(0, -2)}xx`, now)).toBeNull();
    expect(verifyApplyReceipt('garbage', now)).toBeNull();
    expect(verifyApplyReceipt('', now)).toBeNull();
  });

  it('expires after the ttl', () => {
    const value = signApplyReceipt(receipt, now);
    const later = new Date(now.getTime() + (APPLY_RECEIPT_TTL_SECONDS + 1) * 1000);
    expect(verifyApplyReceipt(value, later)).toBeNull();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/apply-receipt.test.ts`
Expected: FAIL, `Failed to resolve import "./apply-receipt"`.

- [ ] **Step 11: Implement the receipt**

Create `src/server/apply-receipt.ts`:

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { env } from '@/env';
import { PARTNER_CATEGORIES, PARTNER_REGIONS } from '@/lib/domain';

/** Cookie set by submitApplicationAction and read by /apply/done (decision 16: not the query string, not the database). */
export const APPLY_RECEIPT_COOKIE = 'portal_apply_receipt';
export const APPLY_RECEIPT_TTL_SECONDS = 3600;

const receiptSchema = z.object({
  reference: z.string().min(1),
  company: z.string().min(1),
  firstName: z.string(),
  email: z.string(),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  submittedOn: z.string().length(10),
});
export type ApplyReceipt = z.infer<typeof receiptSchema>;

const payloadSchema = receiptSchema.extend({ exp: z.number() });

const mac = (payload: string): string =>
  createHmac('sha256', `apply-receipt.v1:${env.AUTH_SECRET}`).update(payload).digest('base64url');

/** base64url(json).base64url(hmac). Not encrypted: the person reads their own application back. */
export function signApplyReceipt(receipt: ApplyReceipt, now: Date): string {
  const payload = Buffer.from(JSON.stringify({ ...receipt, exp: now.getTime() + APPLY_RECEIPT_TTL_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${mac(payload)}`;
}

/** Null for anything that is not a fresh, correctly signed receipt. */
export function verifyApplyReceipt(value: string, now: Date): ApplyReceipt | null {
  const dot = value.indexOf('.');
  if (dot < 1) return null;
  const payload = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(mac(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const parsed = payloadSchema.safeParse(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')));
    if (!parsed.success || parsed.data.exp <= now.getTime()) return null;
    const { exp: _exp, ...receipt } = parsed.data;
    return receipt;
  } catch {
    return null;
  }
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/apply-receipt.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 12: Write the failing repo test for M1.3**

Create `src/server/repo/applications.test.ts` (later tasks append to it):

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { applications } from '@/db/schema';
import { makeApplication, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { withSystem } from './context';
import { createPortalApplication, findPartnerByDomain, listManagerRecipients, type NewApplicationRecord } from './applications';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Neha Joshi');

const record = (overrides: Partial<NewApplicationRecord> = {}): NewApplicationRecord => ({
  company: 'Tidewater Infosec',
  domain: 'tidewaterinfosec.in',
  applicantName: 'Neha Joshi',
  email: 'neha.joshi@tidewaterinfosec.in',
  role: 'CTO',
  phone: '+91 98200 41377',
  category: 'channel',
  region: 'india',
  reason: 'We resell security tooling.',
  source: 'portal',
  sourceRef: null,
  personalEmail: false,
  existingDomain: false,
  ...overrides,
});

const create = (input: NewApplicationRecord) => withSystem(actor, (tx) => createPortalApplication(tx, actor, input, clock));

beforeEach(async () => {
  await resetDb(db);
});

describe('createPortalApplication', () => {
  it('creates an application with an APP-YYMM-NNNN reference in status new', async () => {
    const { application, merged } = await create(record());
    expect(merged).toBe(false);
    expect(application.reference).toBe('APP-2611-0001');
    expect(application.status).toBe('new');
    expect(application.source).toBe('portal');
    expect(application.submittedAt).toBe('2026-11-12T10:00:00.000Z');
    const second = await create(record({ email: 'other@falconridge.ae', company: 'Falcon Ridge IT', domain: 'falconridge.ae' }));
    expect(second.application.reference).toBe('APP-2611-0002');
  });

  it('merges a second submission from the same email into the open application', async () => {
    const first = await create(record());
    const second = await create(record({ email: 'neha.joshi@tidewaterinfosec.in', company: 'Tidewater Infosec Pvt Ltd', reason: 'Updated reason.' }));
    expect(second.merged).toBe(true);
    expect(second.application.id).toBe(first.application.id);
    expect(second.application.reference).toBe(first.application.reference);
    expect(second.application.company).toBe('Tidewater Infosec Pvt Ltd');
    expect(second.application.reason).toBe('Updated reason.');
    expect(await db.select().from(applications)).toHaveLength(1);
  });

  it('does not merge into a decided application', async () => {
    await makeApplication(db, { email: 'neha.joshi@tidewaterinfosec.in', source: 'portal', status: 'approved' });
    const { merged } = await create(record());
    expect(merged).toBe(false);
    expect(await db.select().from(applications)).toHaveLength(2);
  });
});

describe('findPartnerByDomain', () => {
  it('returns only id and name, ignoring case, and null when no partner owns the domain', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const found = await withSystem(actor, (tx) => findPartnerByDomain(tx, actor, 'KestrelSystems.in'));
    expect(found).toEqual({ id: partner.id, name: 'Kestrel Systems' });
    expect(await withSystem(actor, (tx) => findPartnerByDomain(tx, actor, 'unknown.example'))).toBeNull();
  });
});

describe('listManagerRecipients', () => {
  it('lists active partner managers only', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'active', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', status: 'disabled', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'sales', status: 'active', region: 'india' });
    const partner = await makePartner(db, {});
    await makeUser(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin' });
    const recipients = await withSystem(actor, (tx) => listManagerRecipients(tx, actor));
    expect(recipients.map((r) => r.userId)).toEqual([manager.id]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts`
Expected: FAIL, `Failed to resolve import "./applications"`.

- [ ] **Step 13: Implement the M1.3 part of the applications repo**

Create `src/server/repo/applications.ts`. Types are exported exactly as contracts H.1; the file grows in M1.3b and M1.4.

```ts
import { and, eq, sql } from 'drizzle-orm';
import { applications, partners, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { ApplicationSource, PartnerCategory, PartnerRegion } from '@/lib/domain';
import type { ApplicationDto } from '@/lib/dto';
import type { SystemActor } from '@/server/auth/types';
import { ConflictError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface NewApplicationRecord {
  company: string;
  domain: string;
  applicantName: string;
  email: string;
  role: string | null;
  phone: string | null;
  category: PartnerCategory | null;
  region: PartnerRegion | null;
  reason: string | null;
  source: ApplicationSource;
  sourceRef: string | null;
  personalEmail: boolean;
  existingDomain: boolean;
  /** Website entries carry the CMS createdAt so the queue shows the real submission time; portal entries omit it. */
  submittedAt?: Date;
}

/** An active partner manager, for in-app notifications and alert emails. */
export interface ManagerRecipient {
  userId: string;
  email: string;
  name: string;
}

type ApplicationRow = typeof applications.$inferSelect;

const toDto = (row: ApplicationRow): ApplicationDto => ({
  id: row.id,
  reference: row.reference,
  company: row.company,
  domain: row.domain,
  applicantName: row.applicantName,
  email: row.email,
  role: row.role,
  phone: row.phone,
  category: row.category,
  region: row.region,
  reason: row.reason,
  submittedAt: row.createdAt.toISOString(),
  status: row.status,
  source: row.source,
  personalEmail: row.personalEmail,
  existingDomain: row.existingDomain,
  declineReason: row.declineReason,
  decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  partnerId: row.partnerId,
});

/** APP-YYMM-NNNN. The yymm part is the month of submission (`at`). */
const nextReference = async (tx: Tx, at: Date): Promise<string> => {
  const yymm = `${String(at.getUTCFullYear()).slice(2)}${String(at.getUTCMonth() + 1).padStart(2, '0')}`;
  const result = await tx.execute(sql`select nextval('application_reference_seq') as n`);
  const row: unknown = result.rows[0];
  const raw = typeof row === 'object' && row !== null && 'n' in row ? (row as { n: unknown }).n : undefined;
  const n = Number(raw);
  if (!Number.isInteger(n)) throw new Error('application_reference_seq returned no number');
  return `APP-${yymm}-${String(n).padStart(4, '0')}`;
};

const managersOf = async (tx: Tx): Promise<ManagerRecipient[]> =>
  tx
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(users.createdAt);

/**
 * Public (M1.3). Merges into the applicant's open portal application for the same email instead of adding a second.
 * `input.email` must already be lower case (the action normalises it).
 */
export async function createPortalApplication(
  tx: Tx,
  _actor: SystemActor,
  input: NewApplicationRecord,
  clock: Clock,
): Promise<{ application: ApplicationDto; merged: boolean }> {
  const fields = {
    company: input.company,
    domain: input.domain,
    applicantName: input.applicantName,
    role: input.role,
    phone: input.phone,
    category: input.category,
    region: input.region,
    reason: input.reason,
    personalEmail: input.personalEmail,
    existingDomain: input.existingDomain,
  };

  const merge = async (): Promise<ApplicationDto | null> => {
    const [open] = await tx
      .select()
      .from(applications)
      .where(and(eq(applications.source, 'portal'), eq(applications.status, 'new'), sql`lower(${applications.email}) = ${input.email}`))
      .limit(1)
      .for('update');
    if (!open) return null;
    // The queue sorts by createdAt, so a refreshed application surfaces again, as the mock does.
    const [updated] = await tx.update(applications).set({ ...fields, createdAt: clock.now() }).where(eq(applications.id, open.id)).returning();
    return updated ? toDto(updated) : null;
  };

  // The partial unique index (one open portal application per email) can lose a race; the second pass then merges.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const merged = await merge();
    if (merged) return { application: merged, merged: true };
    const [created] = await tx
      .insert(applications)
      .values({
        reference: await nextReference(tx, clock.now()),
        ...fields,
        email: input.email,
        source: 'portal',
        sourceRef: null,
        createdAt: clock.now(),
      })
      .onConflictDoNothing()
      .returning();
    if (created) return { application: toDto(created), merged: false };
  }
  throw new ConflictError('already_applied', 'You already have an application in review.');
}

/** Public (M1.3, M1.3b). The partner whose domain matches, or null. Never returns anything but id and name. */
export async function findPartnerByDomain(
  tx: Tx,
  _actor: SystemActor,
  domain: string,
): Promise<{ id: string; name: string } | null> {
  const [row] = await tx
    .select({ id: partners.id, name: partners.name })
    .from(partners)
    .where(eq(partners.domain, domain.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** Public. Active partner managers; used by the apply action and the website intake for notifications and alerts. */
export async function listManagerRecipients(tx: Tx, _actor: SystemActor): Promise<ManagerRecipient[]> {
  return managersOf(tx);
}

export const isolation = defineIsolation<'createPortalApplication' | 'findPartnerByDomain' | 'listManagerRecipients'>({
  createPortalApplication: { scope: 'public', reason: 'Public apply flow. Takes a SystemActor; covered by applications.test.ts and actions/apply.test.ts.' },
  findPartnerByDomain: { scope: 'public', reason: 'Public apply flow and website intake. Returns only id and name; covered by applications.test.ts.' },
  listManagerRecipients: { scope: 'public', reason: 'Public flows notify the active partner managers. Takes a SystemActor; covered by applications.test.ts.' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 14: Write the failing action test**

Create `src/server/actions/apply.test.ts`. The mock block at the top is the standard block described under Conventions.

```ts
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { applications, auditLog, notifications } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';
import { ValidationError } from '@/server/errors';
import { APPLY_RECEIPT_COOKIE, verifyApplyReceipt } from '@/server/apply-receipt';
import { verifyTurnstile } from '@/server/turnstile';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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
  fake.clear();
  harness.cookieJar.clear();
  harness.ip = `198.51.100.${(ipCounter += 1)}`;
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
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/apply.test.ts`
Expected: FAIL, `Failed to resolve import "./apply"`.

- [ ] **Step 15: Implement the apply action**

Create `src/server/actions/apply.ts`:

```ts
'use server';

import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { env } from '@/env';
import { type ApplyOutcome, APPLY_EMAIL_RULE, APPLY_IP_RULE } from '@/lib/apply';
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from '@/lib/domain';
import { emailDomain, isPlausibleDomain, normaliseDomain } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { APPLY_RECEIPT_COOKIE, APPLY_RECEIPT_TTL_SECONDS, signApplyReceipt } from '@/server/apply-receipt';
import { recordAudit } from '@/server/audit/record';
import { publicActor } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildApplicationReceived, buildApplicationStaffAlert } from '@/server/email/templates';
import { ValidationError } from '@/server/errors';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers } from '@/server/notify';
import { alertAddresses } from '@/server/people';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { createPortalApplication, findPartnerByDomain, listManagerRecipients } from '@/server/repo/applications';
import { verifyTurnstile } from '@/server/turnstile';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runPublicAction } from './run';

const text = (max: number) => z.string().trim().max(max);

const applySchema = z.object({
  company: text(200).min(1, 'Enter your company name.'),
  website: text(200),
  name: text(120).min(1, 'Enter your name.'),
  title: text(120),
  email: z.string().trim().max(254),
  phone: text(40),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  reason: text(2000).min(1, 'Tell us who you sell to and what you sell today.'),
  turnstileToken: z.string().max(2048).nullable(),
});

/** The server rule uses the full free-mail corpus; the form already used the curated list for instant feedback. */
const workEmail = (value: string): string => {
  const checked = validateBusinessEmail(value, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
  if (checked.ok) return checked.email;
  throw new ValidationError([
    {
      path: 'email',
      message: checked.reason === 'free-mail' ? 'Use your company email, not a personal address.' : 'Enter a valid work email.',
    },
  ]);
};

export async function submitApplicationAction(raw: unknown): Promise<ActionResult<ApplyOutcome>> {
  return runPublicAction({ name: 'application.submit', schema: applySchema }, raw, async (ctx, input): Promise<ApplyOutcome> => {
    const email = workEmail(input.email);
    if (ctx.ip) rateLimit(`apply:ip:${ctx.ip}`, APPLY_IP_RULE);
    rateLimit(`apply:email:${email}`, APPLY_EMAIL_RULE);
    await verifyTurnstile({ token: input.turnstileToken, ip: ctx.ip });

    const emailHost = emailDomain(email);
    const site = normaliseDomain(input.website);
    const domain = isPlausibleDomain(site) ? site : emailHost;
    const actor = publicActor(input.name);

    const saved = await withSystem(actor, async (tx) => {
      const existing = await findPartnerByDomain(tx, actor, emailHost);
      if (existing) return { kind: 'existing' as const, partnerName: existing.name };

      const { application, merged } = await createPortalApplication(
        tx,
        actor,
        {
          company: input.company,
          domain,
          applicantName: input.name,
          email,
          role: input.title || null,
          phone: input.phone || null,
          category: input.category,
          region: input.region,
          reason: input.reason,
          source: 'portal',
          sourceRef: null,
          personalEmail: false,
          existingDomain: false,
        },
        ctx.clock,
      );
      await recordAudit(tx, actor, {
        event: 'application.submitted',
        target: application.company,
        note: `${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}${merged ? '. Updated an open application.' : ''}`,
        subject: { type: 'application', id: application.id },
      });
      const managers = await listManagerRecipients(tx, actor);
      const items: NewNotification[] = managers.map((manager) => ({
        userId: manager.userId,
        kind: 'application_new',
        title: `New application from ${application.company}`,
        body: `${application.applicantName}, ${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}`,
        link: `${ROUTES.admin.partners}?tab=applications`,
      }));
      await notifyUsers(tx, items);
      return { kind: 'created' as const, application, managers };
    });

    if (saved.kind === 'existing') return { outcome: 'existing_partner', partnerName: saved.partnerName };

    const { application, managers } = saved;
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationReceived({
          to: { email, name: input.name },
          applicantName: input.name,
          company: application.company,
          reference: application.reference,
        }),
      );
      const to = alertAddresses(managers, env.PARTNERS_NOTIFY_EMAIL);
      if (to.length === 0) {
        log.warn({ reference: application.reference }, 'no staff recipient for a new application');
        return;
      }
      await sendEmail(
        buildApplicationStaffAlert({
          to,
          reference: application.reference,
          company: application.company,
          domain: application.domain,
          applicantName: application.applicantName,
          applicantEmail: application.email,
          categoryLabel: PARTNER_CATEGORY_LABEL[input.category],
          regionLabel: PARTNER_REGION_LABEL[input.region],
          source: 'portal',
          personalEmail: false,
          existingDomain: false,
          reason: application.reason,
          reviewUrl: absoluteUrl(`${ROUTES.admin.partners}?tab=applications`),
        }),
      );
    });
    ctx.revalidate(ROUTES.admin.partners);

    (await cookies()).set(
      APPLY_RECEIPT_COOKIE,
      signApplyReceipt(
        {
          reference: application.reference,
          company: application.company,
          firstName: input.name.split(' ')[0] ?? input.name,
          email,
          category: input.category,
          region: input.region,
          submittedOn: ctx.clock.today(),
        },
        ctx.clock.now(),
      ),
      { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/apply', maxAge: APPLY_RECEIPT_TTL_SECONDS },
    );
    return { outcome: 'submitted', reference: application.reference };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/apply.test.ts`
Expected: PASS, 8 tests. If the receipt cookie assertion fails because `next/headers` was not mocked, check that the `vi.mock('next/headers', ...)` block is the first statement after the imports.

- [ ] **Step 16: Create the Turnstile widget component**

Create `src/components/partners/turnstile-widget.tsx`. Verified against Cloudflare's explicit rendering docs: script `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`, `turnstile.render(container, { sitekey, callback })`, `turnstile.reset(id)`, `turnstile.remove(id)`.

```tsx
"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string | null) => void;
  /** Increase to reset the widget after a failed submit (a token can be used once). */
  resetKey: number;
}

export function TurnstileWidget({ siteKey, onToken, resetKey }: TurnstileWidgetProps): React.JSX.Element | null {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const mount = useCallback((): void => {
    const api = window.turnstile;
    if (!api || !box.current || widgetId.current !== null || !siteKey) return;
    widgetId.current = api.render(box.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(null),
      "error-callback": () => onToken(null),
    });
  }, [siteKey, onToken]);

  // The script may already be on the page after a client side navigation.
  useEffect(() => {
    mount();
  }, [mount]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current !== null) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  useEffect(
    () => () => {
      if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
      widgetId.current = null;
    },
    [],
  );

  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mount} />
      <div ref={box} />
    </>
  );
}
```

- [ ] **Step 17: Convert `Apply.tsx`**

Apply each of these region edits to `src/components/screens/Apply.tsx`.

Edit 1, imports and constants. Before:

```tsx
import { NumberedSteps, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { Seg } from "@/components/partners/seg";
import { useToast } from "@/components/ui/toast";
import {
  CATEGORIES,
  emailDomain,
  findPartnerByDomain,
  isFreeEmail,
  isValidEmail,
  normaliseDomain,
  type PartnerCategory,
  type PartnerRegion,
  partnersSlice,
  submitApplication,
} from "@/data/partners";
import { ROUTES } from "@/lib/routes";

const REGIONS: readonly PartnerRegion[] = ["India", "Middle East", "Elsewhere"];
```

After:

```tsx
import { NumberedSteps, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { Seg } from "@/components/partners/seg";
import { TurnstileWidget } from "@/components/partners/turnstile-widget";
import { useToast } from "@/components/ui/toast";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from "@/lib/domain";
import { codeFromLabel, emailDomain, isFreeEmail, isValidEmail, normaliseDomain } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { submitApplicationAction } from "@/server/actions/apply";
import { issuesToErrors } from "@/server/actions/result";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((code) => PARTNER_CATEGORY_LABEL[code]);
const REGIONS: readonly string[] = PARTNER_REGIONS.map((code) => PARTNER_REGION_LABEL[code]);
```

Edit 2, the fields type and the sample. Before:

```tsx
interface Fields {
  company: string;
  site: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  category: PartnerCategory;
  region: PartnerRegion;
  how: string;
}

// Sample applicant from the board, so a reviewer can submit without typing.
// Re-applying with this email refreshes the open Tidewater Infosec application instead of adding a second one.
const SAMPLE: Fields = {
  company: "Tidewater Infosec",
  site: "tidewaterinfosec.in",
  name: "Neha Joshi",
  title: "CTO",
  email: "neha.joshi@tidewaterinfosec.in",
  phone: "+91 98200 41377",
  category: "Channel partner",
  region: "India",
  how: "We resell security tooling to mid-size banks and NBFCs in Pune and Mumbai, and customers are asking for hardened base images. Team of 18, 6 in pre-sales.",
};
```

After:

```tsx
interface Fields {
  company: string;
  site: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  /** Display label of the selected option; converted to a code when the form is sent. */
  category: string;
  region: string;
  how: string;
}

const EMPTY: Fields = {
  company: "",
  site: "",
  name: "",
  title: "",
  email: "",
  phone: "",
  category: PARTNER_CATEGORY_LABEL.channel,
  region: PARTNER_REGION_LABEL.india,
  how: "",
};
```

Edit 3, the component head through `submit`. Before:

```tsx
export function Apply(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const { partners } = partnersSlice.use();
  const [f, setF] = useState<Fields>(SAMPLE);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]): void => setF((prev) => ({ ...prev, [key]: value }));

  const emailValid = isValidEmail(f.email);
  const domain = emailDomain(f.email);
  const free = isFreeEmail(f.email);
  const existing = findPartnerByDomain(partners, domain);
  const siteDomain = normaliseDomain(f.site);

  const companyErr = tried && !f.company.trim();
  const nameErr = tried && !f.name.trim();
  const emailErr = (tried && (!emailValid || free)) || (emailValid && free);
  const howErr = tried && !f.how.trim();
  const domainMismatch = emailValid && !free && !existing && siteDomain !== "" && siteDomain !== domain;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    setTried(true);
    if (!f.company.trim() || !f.name.trim() || !emailValid || free || !f.how.trim()) return;
    if (existing) {
      toast(`${existing.name} is already a partner. Request access instead.`);
      router.push(`${ROUTES.signIn}?request=1`);
      return;
    }
    submitApplication({
      company: f.company,
      website: f.site,
      applicant: f.name,
      role: f.title,
      email: f.email,
      phone: f.phone,
      category: f.category,
      region: f.region,
      reason: f.how,
    });
    router.push(ROUTES.applyDone);
  };
```

After:

```tsx
export function Apply({ turnstileSiteKey }: { turnstileSiteKey: string }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<Fields>(EMPTY);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const set = <K extends keyof Fields>(key: K, value: Fields[K]): void => setF((prev) => ({ ...prev, [key]: value }));

  const emailValid = isValidEmail(f.email);
  const domain = emailDomain(f.email);
  const free = isFreeEmail(f.email);
  const siteDomain = normaliseDomain(f.site);

  const companyErr = tried && !f.company.trim();
  const nameErr = tried && !f.name.trim();
  const emailErr = (tried && (!emailValid || free)) || (emailValid && free) || serverErrors.email !== undefined;
  const howErr = tried && !f.how.trim();
  const domainMismatch = emailValid && !free && siteDomain !== "" && siteDomain !== domain;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setFormError(null);
    if (!f.company.trim() || !f.name.trim() || !emailValid || free || !f.how.trim()) return;
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, f.category);
    const region = codeFromLabel(PARTNER_REGION_LABEL, f.region);
    if (!category || !region) return;
    setBusy(true);
    const result = await submitApplicationAction({
      company: f.company,
      website: f.site,
      name: f.name,
      title: f.title,
      email: f.email,
      phone: f.phone,
      category,
      region,
      reason: f.how,
      turnstileToken: token,
    });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      setToken(null);
      setResetKey((n) => n + 1);
      return;
    }
    setServerErrors({});
    if (result.data.outcome === "existing_partner") {
      toast(`${result.data.partnerName} is already a partner. Request access instead.`);
      router.push(`${ROUTES.signIn}?request=1`);
      return;
    }
    router.push(ROUTES.applyDone);
  };
```

Edit 4, the form `onSubmit` handler is already `onSubmit={submit}`; no change. Remove the live existing-partner note. Before:

```tsx
        {existing ? (
          <div className="note note-violet" role="status">
            <span>
              <b>{existing.name} is already a CleanStart partner.</b> You do not need to apply.{" "}
              <Link href={`${ROUTES.signIn}?request=1`} style={{ fontWeight: 600 }}>
                Request access
              </Link>{" "}
              and {existing.admin}, their partner admin, can let you in.
            </span>
          </div>
        ) : null}
        {domainMismatch ? (
```

After (the partner lookup now happens only on submit, so the form never reveals which domains are partners while typing):

```tsx
        {domainMismatch ? (
```

Edit 5, error text for the email field uses the server message when present. Before:

```tsx
            {emailErr ? (
              <ErrorText id="ap-email-msg">
                {free ? "Use your company email, not a personal address." : "Enter a valid work email."}
              </ErrorText>
            ) : (
```

After:

```tsx
            {emailErr ? (
              <ErrorText id="ap-email-msg">
                {serverErrors.email ??
                  (free ? "Use your company email, not a personal address." : "Enter a valid work email.")}
              </ErrorText>
            ) : (
```

Edit 6, the segmented controls use labels and the new option list. Before:

```tsx
            <Seg options={CATEGORIES} value={f.category} onChange={(v) => set("category", v)} labelledBy="ap-cat" />
```

After:

```tsx
            <Seg options={CATEGORY_OPTIONS} value={f.category} onChange={(v) => set("category", v)} labelledBy="ap-cat" />
```

(`REGIONS` Seg line is unchanged: `<Seg options={REGIONS} value={f.region} onChange={(v) => set("region", v)} labelledBy="ap-reg" />`.)

Edit 7, Turnstile, the form-level error and the busy button. Before:

```tsx
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5, padding: "0 16px" }}>
            Submit application
          </button>
          <span className="hint">Takes about 3 minutes.</span>
        </div>
```

After:

```tsx
        <TurnstileWidget siteKey={turnstileSiteKey} onToken={setToken} resetKey={resetKey} />
        {serverErrors.turnstile || formError ? (
          <span className="err" role="alert">
            {serverErrors.turnstile ?? formError}
          </span>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="submit"
            className="btn btn-p"
            style={{ height: 38, fontSize: 13.5, padding: "0 16px" }}
            disabled={busy}
          >
            Submit application
          </button>
          <span className="hint">Takes about 3 minutes.</span>
        </div>
```

- [ ] **Step 18: Write the Apply page and the receipt-driven ApplyDone**

Replace `src/app/(public)/apply/page.tsx` in full (the site key comes from the server `env`, which supplies Cloudflare's always-pass key outside production; a client component must not import `@/env`):

```tsx
import type { Metadata } from "next";
import { Apply } from "@/components/screens/Apply";
import { env } from "@/env";

export const metadata: Metadata = { title: "Apply to become a partner" };

export default function Page(): React.JSX.Element {
  return <Apply turnstileSiteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />;
}
```

Replace `src/app/(public)/apply/done/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ApplyDone } from "@/components/screens/ApplyDone";
import { systemClock } from "@/lib/clock";
import { ROUTES } from "@/lib/routes";
import { APPLY_RECEIPT_COOKIE, verifyApplyReceipt } from "@/server/apply-receipt";

export const metadata: Metadata = { title: "Application received" };

export default async function Page(): Promise<React.JSX.Element> {
  const value = (await cookies()).get(APPLY_RECEIPT_COOKIE)?.value ?? "";
  const receipt = verifyApplyReceipt(value, systemClock.now());
  if (!receipt) redirect(ROUTES.apply);
  return <ApplyDone receipt={receipt} />;
}
```

Edit `src/components/screens/ApplyDone.tsx`. Before (imports and component head):

```tsx
import { BulletList, CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { partnersSlice } from "@/data/partners";
```

After:

```tsx
import { BulletList, CHECK_D, PublicHeading, PublicSplit, StatusIcon } from "@/components/partners/public-frame";
import { fmtLong } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL } from "@/lib/domain";
import type { ApplyReceipt } from "@/server/apply-receipt";
```

(Importing a type from a server module is erased at compile time, so no server code reaches the client.)

Before:

```tsx
export function ApplyDone(): React.JSX.Element {
  const { applications, lastApplicationId } = partnersSlice.use();
  // Opening the page directly shows the sample application from the board.
  const app =
    applications.find((a) => a.id === lastApplicationId) ?? applications.find((a) => a.id === "a1") ?? applications[0];
  if (!app) return <></>;

  const firstName = app.applicant.split(" ")[0] ?? app.applicant;
  const steps: { title: string; text: string; state: StepState }[] = [
    { title: "Application received", text: app.submitted, state: "done" },
```

After:

```tsx
export function ApplyDone({ receipt }: { receipt: ApplyReceipt }): React.JSX.Element {
  const firstName = receipt.firstName;
  const steps: { title: string; text: string; state: StepState }[] = [
    { title: "Application received", text: fmtLong(receipt.submittedOn), state: "done" },
```

Before:

```tsx
          Thanks, {firstName}. {app.company}'s application is with the CleanStart partner team.
          {app.email ? ` We sent a copy to ${app.email}.` : ""}
```

After:

```tsx
          Thanks, {firstName}. {receipt.company}'s application is with the CleanStart partner team.
          {receipt.email ? ` We sent a copy to ${receipt.email}.` : ""}
```

Before:

```tsx
          <dt>Reference</dt>
          <dd className="tnum">{app.reference}</dd>
          <dt>Company</dt>
          <dd>{app.company}</dd>
          <dt>Category</dt>
          <dd>{app.category}</dd>
          <dt>Region</dt>
          <dd>{app.region}</dd>
```

After:

```tsx
          <dt>Reference</dt>
          <dd className="tnum">{receipt.reference}</dd>
          <dt>Company</dt>
          <dd>{receipt.company}</dd>
          <dt>Category</dt>
          <dd>{PARTNER_CATEGORY_LABEL[receipt.category]}</dd>
          <dt>Region</dt>
          <dd>{PARTNER_REGION_LABEL[receipt.region]}</dd>
```

- [ ] **Step 19: Prove no slice import is left in the converted screens**

Run: `grep -n "@/data/\|@/lib/slice" src/components/screens/Apply.tsx src/components/screens/ApplyDone.tsx`
Expected: no output.

- [ ] **Step 20: Gate A**

Run the Gate A block from "Conventions". Expected as stated there. The last command must list only: `src/lib/apply.ts`, `src/lib/people.ts`, `src/lib/people.test.ts`, `src/server/people.ts`, `src/server/people.test.ts`, `src/server/turnstile.ts`, `src/server/turnstile.test.ts`, `src/server/apply-receipt.ts`, `src/server/apply-receipt.test.ts`, `src/server/repo/applications.ts`, `src/server/repo/applications.test.ts`, `src/server/actions/apply.ts`, `src/server/actions/apply.test.ts`, `src/components/partners/turnstile-widget.tsx`, `src/components/screens/Apply.tsx`, `src/components/screens/ApplyDone.tsx`, `src/app/(public)/apply/page.tsx`, `src/app/(public)/apply/done/page.tsx` (paths under `apps/portal/`).

- [ ] **Step 21: Manual check (dev server on port 3224 with seed-dev data, `APP_URL=http://localhost:3224`)**

1. `/apply` shows an empty form (no sample values), the Turnstile test widget under the privacy line, and "Submit application" enabled.
2. Type `neha@gmail.com` as the work email: the red "Use your company email, not a personal address." appears at once. Replace with `neha.joshi@tidewaterinfosec.in`, website `tidewaterinfosec.in`, name `Neha Joshi`, a reason; submit. You land on `/apply/done` showing "Thanks, Neha", reference `APP-<yymm>-0045` (the seed leaves the sequence past 44), category "Channel partner", region "India".
3. Reload `/apply/done`: still shown (cookie lives 1 hour). Open it in a private window: it redirects to `/apply`.
4. Submit `/apply` again with `aditi@kestrelsystems.in` (Kestrel's domain): a toast says Kestrel Systems is already a partner and you land on `/sign-in?request=1`; no new row exists (`select count(*) from applications` stays at 4).
5. Submit the Tidewater form a second time with a different reason: still 4 rows, the reason updated.
6. Submit six times quickly from one browser with different emails: the sixth shows "Too many attempts. Try again in a moment."

- [ ] **Step 22: Commit**

```bash
git add apps/portal/src/lib/apply.ts apps/portal/src/lib/people.ts apps/portal/src/lib/people.test.ts \
  apps/portal/src/server/people.ts apps/portal/src/server/people.test.ts \
  apps/portal/src/server/turnstile.ts apps/portal/src/server/turnstile.test.ts \
  apps/portal/src/server/apply-receipt.ts apps/portal/src/server/apply-receipt.test.ts \
  apps/portal/src/server/repo/applications.ts apps/portal/src/server/repo/applications.test.ts \
  apps/portal/src/server/actions/apply.ts apps/portal/src/server/actions/apply.test.ts \
  apps/portal/src/components/partners/turnstile-widget.tsx \
  apps/portal/src/components/screens/Apply.tsx apps/portal/src/components/screens/ApplyDone.tsx \
  "apps/portal/src/app/(public)/apply/page.tsx" "apps/portal/src/app/(public)/apply/done/page.tsx" \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.3 portal application page"
```

---
### Task M1.3b: Website form entries imported into the portal

Implements master task 1.3b against a local stub CMS server (no CMS service user exists overnight). The website's Become a Partner form keeps posting to the CMS `partner-applications` collection; every 5 minutes the portal reads new rows over REST with `Authorization: users API-Key <key>` and never writes to the CMS. Verified against `apps/cms/src/payload/collections/PartnerApplications.ts` (fields `firstName`, `lastName`, `email`, `phone`, `company`, `website`, `partnerReason`, `honeypot`, `turnstilePassed`, `piiRedactedAt`, `createdAt`; `read` is admin or editor) and Payload's `find` response (`docs`, `totalDocs`, `limit`, `totalPages`, `page`, `hasNextPage`, ...). The CMS API key header format is `${collection.slug} API-Key ${key}` (`apps/cms/node_modules/payload/dist/auth/strategies/apiKey.js`, and `apps/web/src/lib/cms-fetch.ts`).

**Files:**
- Create: `src/server/intake/website-applications.ts`, `src/server/intake/website-applications.test.ts`, `src/server/intake/stub-cms.ts`
- Create: `scripts/stub-cms.ts`, `scripts/run-intake.ts`
- Modify: `src/server/jobs/intake.ts` (replace the W0-c stub body), create `src/server/jobs/intake.test.ts`
- Modify: `src/server/repo/applications.ts`, `src/server/repo/applications.test.ts`

- [ ] **Step 1: Write the failing repo tests for `insertWebsiteApplication`**

Append to `src/server/repo/applications.test.ts`. Add `insertWebsiteApplication` to the existing import from `./applications`, and add `auditLog, notifications` to the import from `@/db/schema`. Then append:

```ts
const intake = SYSTEM_ACTORS.intake;
const websiteRecord = (overrides: Partial<NewApplicationRecord> = {}): NewApplicationRecord => ({
  company: 'Falcon Ridge IT',
  domain: 'falconridge.ae',
  applicantName: 'Sameer Al Harthy',
  email: 'sameer@falconridge.ae',
  role: null,
  phone: null,
  category: null,
  region: null,
  reason: 'Value-added distributor.',
  source: 'website',
  sourceRef: 'cms-17',
  personalEmail: false,
  existingDomain: false,
  submittedAt: new Date('2026-10-30T08:15:00Z'),
  ...overrides,
});
const insertWebsite = (input: NewApplicationRecord) =>
  withSystem(intake, (tx) => insertWebsiteApplication(tx, intake, input, clock));

describe('insertWebsiteApplication', () => {
  it('inserts once per (source, source_ref), keeps the CMS time and reads the reference month from it', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: true });
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: false });
    const rows = await db.select().from(applications);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: 'website',
      sourceRef: 'cms-17',
      status: 'new',
      category: null,
      region: null,
      reference: 'APP-2610-0001',
    });
    expect(rows[0]?.createdAt.toISOString()).toBe('2026-10-30T08:15:00.000Z');
    const audit = await db.select().from(auditLog);
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ event: 'application.submitted', note: 'Website form', who: 'sync', source: 'system' });
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[manager.id, 'application_new']]);
  });

  it('stores the personal email and existing domain flags as given', async () => {
    await insertWebsite(websiteRecord({ personalEmail: true, existingDomain: true }));
    const [row] = await db.select().from(applications);
    expect(row).toMatchObject({ personalEmail: true, existingDomain: true });
  });

  it('refuses a website entry without a source ref', async () => {
    await expect(insertWebsite(websiteRecord({ sourceRef: null }))).rejects.toMatchObject({ code: 'validation' });
  });

  it('does not collide with a portal application from the same email', async () => {
    await create(record({ email: 'sameer@falconridge.ae' }));
    expect(await insertWebsite(websiteRecord())).toEqual({ inserted: true });
    expect(await db.select().from(applications)).toHaveLength(2);
  });
});
```

Also add `import { SYSTEM_ACTORS, publicActor } from '@/server/auth/types';` replacing the existing `publicActor` import line. Run:

`pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts`
Expected: FAIL, `insertWebsiteApplication is not a function` (or a TypeScript import error).

- [ ] **Step 2: Implement `insertWebsiteApplication`**

In `src/server/repo/applications.ts` extend the imports:

```ts
import { recordAudit } from '@/server/audit/record';
import { ConflictError, ValidationError } from '@/server/errors';
import { notifyUsers } from '@/server/notify';
import { ROUTES } from '@/lib/routes';
```

(replace the existing `import { ConflictError } from '@/server/errors';` line with the combined one above.) Add after `listManagerRecipients`:

```ts
/**
 * Public (M1.3b). Idempotent on (source, source_ref): returns false when the row already existed. Writes the audit entry
 * and the in-app notification to the partner managers itself because the job that calls it has no action layer.
 * The CMS sends its own emails for website entries, so none are sent here.
 */
export async function insertWebsiteApplication(
  tx: Tx,
  actor: SystemActor,
  input: NewApplicationRecord,
  clock: Clock,
): Promise<{ inserted: boolean }> {
  if (input.sourceRef === null) {
    throw new ValidationError([{ path: 'sourceRef', message: 'A website application needs the CMS id.' }]);
  }
  const [known] = await tx
    .select({ id: applications.id })
    .from(applications)
    .where(and(eq(applications.source, 'website'), eq(applications.sourceRef, input.sourceRef)))
    .limit(1);
  if (known) return { inserted: false };

  const submittedAt = input.submittedAt ?? clock.now();
  const [created] = await tx
    .insert(applications)
    .values({
      reference: await nextReference(tx, submittedAt),
      company: input.company,
      domain: input.domain,
      applicantName: input.applicantName,
      email: input.email,
      role: input.role,
      phone: input.phone,
      category: input.category,
      region: input.region,
      reason: input.reason,
      source: 'website',
      sourceRef: input.sourceRef,
      personalEmail: input.personalEmail,
      existingDomain: input.existingDomain,
      createdAt: submittedAt,
    })
    .onConflictDoNothing({ target: [applications.source, applications.sourceRef] })
    .returning({ id: applications.id });
  if (!created) return { inserted: false };

  await recordAudit(tx, actor, {
    event: 'application.submitted',
    target: input.company,
    note: 'Website form',
    subject: { type: 'application', id: created.id },
  });
  const managers = await managersOf(tx);
  await notifyUsers(
    tx,
    managers.map((manager) => ({
      userId: manager.userId,
      kind: 'application_new' as const,
      title: `New application from ${input.company}`,
      body: `Website form, ${input.applicantName}`,
      link: `${ROUTES.admin.partners}?tab=applications`,
    })),
  );
  return { inserted: true };
}
```

Replace the `isolation` export with:

```ts
export const isolation = defineIsolation<
  'createPortalApplication' | 'findPartnerByDomain' | 'listManagerRecipients' | 'insertWebsiteApplication'
>({
  createPortalApplication: { scope: 'public', reason: 'Public apply flow. Takes a SystemActor; covered by applications.test.ts and actions/apply.test.ts.' },
  findPartnerByDomain: { scope: 'public', reason: 'Public apply flow and website intake. Returns only id and name; covered by applications.test.ts.' },
  listManagerRecipients: { scope: 'public', reason: 'Public flows notify the active partner managers. Takes a SystemActor; covered by applications.test.ts.' },
  insertWebsiteApplication: { scope: 'public', reason: 'Website intake job, system actor only; covered by applications.test.ts and website-applications.test.ts.' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 3: Write the stub CMS server**

Create `src/server/intake/stub-cms.ts`. It mimics Payload's REST `find` for one collection: the `users API-Key` auth header, `sort`, `limit`, `page`, `depth` and `where[createdAt][greater_than|greater_than_equal]` query parameters, and the paginated response shape. It is a test and local development helper, never imported by application code.

```ts
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

export interface StubCmsRow {
  id: string | number;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company: string;
  website?: string | null;
  partnerReason?: string | null;
  honeypot?: string | null;
  turnstilePassed?: boolean | null;
  piiRedactedAt?: string | null;
}

export interface StubCmsOptions {
  apiKey?: string;
  /** Listen on a fixed port (scripts); default is a free port. */
  port?: number;
  /** Force a smaller page than the client asked for, to test pagination without hundreds of rows. */
  pageSize?: number;
}

export interface StubCms {
  url: string;
  apiKey: string;
  /** Mutate to add or change what the stub serves. */
  rows: StubCmsRow[];
  requests: Array<{ pathname: string; search: string; authorization: string | undefined }>;
  /** Make one page answer with an error status. */
  failPage: { page: number; status: number } | null;
  close(): Promise<void>;
}

const send = (res: ServerResponse, status: number, body: unknown): void => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

const handle = (stub: StubCms, options: StubCmsOptions, req: IncomingMessage, res: ServerResponse): void => {
  const url = new URL(req.url ?? '/', 'http://stub.local');
  stub.requests.push({ pathname: url.pathname, search: url.search, authorization: req.headers.authorization });
  if (req.method !== 'GET' || url.pathname !== '/api/partner-applications') {
    send(res, 404, { message: 'Not Found' });
    return;
  }
  if (req.headers.authorization !== `users API-Key ${stub.apiKey}`) {
    send(res, 403, { errors: [{ message: 'You are not allowed to perform this action.' }] });
    return;
  }
  const params = url.searchParams;
  const limit = Math.max(1, Number(params.get('limit') ?? 10));
  const pageSize = options.pageSize ?? limit;
  const page = Math.max(1, Number(params.get('page') ?? 1));
  if (stub.failPage?.page === page) {
    send(res, stub.failPage.status, { errors: [{ message: 'Stub failure' }] });
    return;
  }
  const after = params.get('where[createdAt][greater_than]');
  const atOrAfter = params.get('where[createdAt][greater_than_equal]');
  const matching = stub.rows
    .filter((row) => (after === null || Date.parse(row.createdAt) > Date.parse(after)))
    .filter((row) => (atOrAfter === null || Date.parse(row.createdAt) >= Date.parse(atOrAfter)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  if (params.get('sort') === '-createdAt') matching.reverse();
  const totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  send(res, 200, {
    docs: matching.slice((page - 1) * pageSize, page * pageSize),
    totalDocs: matching.length,
    limit: pageSize,
    totalPages,
    page,
    pagingCounter: (page - 1) * pageSize + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  });
};

export async function startStubCms(rows: StubCmsRow[], options: StubCmsOptions = {}): Promise<StubCms> {
  const stub: StubCms = {
    url: '',
    apiKey: options.apiKey ?? 'stub-key',
    rows,
    requests: [],
    failPage: null,
    close: async () => undefined,
  };
  const server = createServer((req, res) => handle(stub, options, req, res));
  await new Promise<void>((resolve) => server.listen(options.port ?? 0, '127.0.0.1', resolve));
  stub.url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  stub.close = () => new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  return stub;
}
```

- [ ] **Step 4: Write the failing intake tests**

Create `src/server/intake/website-applications.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applications, auditLog, hubspotSyncState } from '@/db/schema';
import { makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import {
  type CmsPartnerApplication,
  createCmsClient,
  createHttpCmsClient,
  importWebsiteApplications,
  mapCmsApplication,
} from './website-applications';
import { type StubCms, type StubCmsRow, startStubCms } from './stub-cms';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
let stub: StubCms;

const row = (n: number, overrides: Partial<StubCmsRow> = {}): StubCmsRow => ({
  id: `cms-${n}`,
  createdAt: `2026-11-0${n}T09:00:00.000Z`,
  firstName: 'Neha',
  lastName: `Joshi${n}`,
  email: `neha${n}@tidewaterinfosec.in`,
  phone: '+91 98200 41377',
  company: `Tidewater ${n}`,
  website: 'https://www.tidewaterinfosec.in/about',
  partnerReason: 'We resell security tooling.',
  honeypot: null,
  turnstilePassed: true,
  piiRedactedAt: null,
  ...overrides,
});
const run = () =>
  importWebsiteApplications({ db, cms: createHttpCmsClient({ baseUrl: stub.url, apiKey: stub.apiKey }), clock });
const cursorRow = () => db.select().from(hubspotSyncState);

beforeEach(async () => {
  await resetDb(db);
});
afterEach(async () => {
  await stub?.close();
});

describe('importWebsiteApplications', () => {
  it('imports a row once even when the job runs twice', async () => {
    stub = await startStubCms([row(1)]);
    const first = await run();
    expect(first).toMatchObject({ fetched: 1, imported: 1, cursor: '2026-11-01T09:00:00.000Z' });
    const second = await run();
    expect(second).toMatchObject({ fetched: 1, imported: 0, skipped: { duplicate: 1 } });
    expect(await db.select().from(applications)).toHaveLength(1);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });

  it('skips honeypot, redacted and failed-Turnstile rows but still moves the cursor past them', async () => {
    stub = await startStubCms([
      row(1, { honeypot: 'bot' }),
      row(2, { piiRedactedAt: '2026-11-03T00:00:00.000Z' }),
      row(3, { turnstilePassed: false }),
      row(4),
    ]);
    const result = await run();
    expect(result).toMatchObject({
      fetched: 4,
      imported: 1,
      skipped: { honeypot: 1, redacted: 1, turnstile: 1, duplicate: 0 },
      cursor: '2026-11-04T09:00:00.000Z',
    });
    expect((await db.select().from(applications)).map((a) => a.sourceRef)).toEqual(['cms-4']);
  });

  it('imports a personal address with the badge instead of rejecting it', async () => {
    stub = await startStubCms([row(1, { email: 'neha@gmail.com' })]);
    await run();
    const [saved] = await db.select().from(applications);
    expect(saved).toMatchObject({ personalEmail: true, existingDomain: false, email: 'neha@gmail.com' });
  });

  it('marks an application whose domain already belongs to a partner', async () => {
    await makePartner(db, { name: 'Tidewater Infosec', domain: 'tidewaterinfosec.in' });
    stub = await startStubCms([row(1)]);
    await run();
    const [saved] = await db.select().from(applications);
    expect(saved).toMatchObject({ existingDomain: true, personalEmail: false });
  });

  it('does not advance the cursor when the CMS fails part way, and the next run finishes the job', async () => {
    stub = await startStubCms([row(1), row(2), row(3)], { pageSize: 1 });
    stub.failPage = { page: 2, status: 500 };
    await expect(run()).rejects.toMatchObject({ service: 'cms', upstreamStatus: 500 });
    expect(await cursorRow()).toHaveLength(0);
    expect(await db.select().from(applications)).toHaveLength(1);
    stub.failPage = null;
    const result = await run();
    expect(result).toMatchObject({ imported: 2, skipped: { duplicate: 1 }, cursor: '2026-11-03T09:00:00.000Z' });
    expect(await db.select().from(applications)).toHaveLength(3);
  });

  it('asks only for rows at or after the stored cursor, ascending, with the API key', async () => {
    stub = await startStubCms([row(1)]);
    await run();
    stub.rows.push(row(2));
    const result = await run();
    expect(result).toMatchObject({ imported: 1, skipped: { duplicate: 1 }, cursor: '2026-11-02T09:00:00.000Z' });
    const request = stub.requests.at(-1);
    expect(request?.authorization).toBe('users API-Key stub-key');
    const params = new URLSearchParams(request?.search);
    expect(params.get('where[createdAt][greater_than_equal]')).toBe('2026-11-01T09:00:00.000Z');
    expect(params.get('sort')).toBe('createdAt');
    expect(params.get('depth')).toBe('0');
    expect(params.get('limit')).toBe('100');
  });
});

describe('CMS client', () => {
  it('throws an integration error carrying the upstream status', async () => {
    stub = await startStubCms([row(1)]);
    const client = createHttpCmsClient({ baseUrl: stub.url, apiKey: 'wrong-key' });
    await expect(client.listPartnerApplications({ since: null, page: 1, limit: 10 })).rejects.toMatchObject({
      service: 'cms',
      upstreamStatus: 403,
    });
  });

  it('is null when no API key is configured', () => {
    expect(createCmsClient({ apiKey: undefined, baseUrl: 'http://cms.local' })).toBeNull();
    expect(createCmsClient({ apiKey: 'k', baseUrl: 'http://cms.local' })).not.toBeNull();
  });
});

describe('mapCmsApplication', () => {
  const base: CmsPartnerApplication = {
    id: '17',
    createdAt: '2026-10-30T08:15:00.000Z',
    firstName: 'Sameer',
    lastName: 'Al Harthy',
    email: 'Sameer@FalconRidge.ae',
    phone: ' +968 9123 4567 ',
    company: ' Falcon Ridge IT ',
    website: 'https://www.falconridge.ae/en',
    partnerReason: ' Distributor. ',
  };

  it('maps names, domain, phone and reason', () => {
    expect(mapCmsApplication(base, new Set())).toEqual({
      company: 'Falcon Ridge IT',
      domain: 'falconridge.ae',
      applicantName: 'Sameer Al Harthy',
      email: 'sameer@falconridge.ae',
      role: null,
      phone: '+968 9123 4567',
      category: null,
      region: null,
      reason: 'Distributor.',
      source: 'website',
      sourceRef: '17',
      personalEmail: false,
      existingDomain: false,
      submittedAt: new Date('2026-10-30T08:15:00.000Z'),
    });
  });

  it('falls back to the email domain when the website is missing or not a domain', () => {
    expect(mapCmsApplication({ ...base, website: null }, new Set()).domain).toBe('falconridge.ae');
    expect(mapCmsApplication({ ...base, website: 'asdf' }, new Set()).domain).toBe('falconridge.ae');
  });

  it('flags an existing partner by website or email domain', () => {
    expect(mapCmsApplication(base, new Set(['falconridge.ae'])).existingDomain).toBe(true);
    expect(mapCmsApplication({ ...base, website: 'https://other.com' }, new Set(['falconridge.ae'])).existingDomain).toBe(true);
    expect(mapCmsApplication(base, new Set(['elsewhere.com'])).existingDomain).toBe(false);
  });

  it('flags a personal address from the full free-mail corpus', () => {
    expect(mapCmsApplication({ ...base, email: 'sameer@tutanota.com' }, new Set()).personalEmail).toBe(true);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/intake/website-applications.test.ts`
Expected: FAIL, `Failed to resolve import "./website-applications"`.

- [ ] **Step 5: Implement the intake module**

Create `src/server/intake/website-applications.ts` (the exports and shapes are contracts H.16; `createCmsClient` gains an optional config argument so tests need not mutate the environment, and the client asks for `greater_than_equal` so two rows with the same timestamp cannot be missed, the unique index absorbing the repeat):

```ts
import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { hubspotSyncState, partners } from '@/db/schema';
import { env } from '@/env';
import type { Clock } from '@/lib/clock';
import { emailDomain, isPlausibleDomain, normaliseDomain } from '@/lib/people';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { IntegrationError } from '@/server/errors';
import { insertWebsiteApplication, type NewApplicationRecord } from '@/server/repo/applications';
import { withSystem } from '@/server/repo/context';

/** The CMS REST shape of a partner-applications document (apps/cms/src/payload/collections/PartnerApplications.ts). */
export const cmsPartnerApplicationSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  createdAt: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string().nullish(),
  company: z.string(),
  website: z.string().nullish(),
  partnerReason: z.string().nullish(),
  honeypot: z.string().nullish(),
  turnstilePassed: z.boolean().nullish(),
  piiRedactedAt: z.string().nullish(),
});
export type CmsPartnerApplication = z.infer<typeof cmsPartnerApplicationSchema>;

export interface CmsPage {
  docs: CmsPartnerApplication[];
  hasNextPage: boolean;
}

export interface CmsClient {
  /** createdAt at or after `since` (null for the first run), ascending, one page at a time. Throws IntegrationError('cms'). */
  listPartnerApplications(input: { since: string | null; page: number; limit: number }): Promise<CmsPage>;
}

const CURSOR_KEY = 'website_applications_cursor';
const PAGE_LIMIT = 100;
const MAX_PAGES = 50;
const CMS_TIMEOUT_MS = 15_000;

const pageSchema = z.object({ docs: z.array(cmsPartnerApplicationSchema), hasNextPage: z.boolean() });
const cursorSchema = z.object({ createdAt: z.string() });

export interface HttpCmsClientOptions {
  baseUrl: string;
  apiKey: string;
}

export function createHttpCmsClient(options: HttpCmsClientOptions): CmsClient {
  const base = options.baseUrl.replace(/\/$/u, '');
  return {
    async listPartnerApplications({ since, page, limit }) {
      const params = new URLSearchParams({ sort: 'createdAt', limit: String(limit), page: String(page), depth: '0' });
      if (since) params.set('where[createdAt][greater_than_equal]', since);
      let response: Response;
      try {
        response = await fetch(`${base}/api/partner-applications?${params.toString()}`, {
          headers: { Authorization: `users API-Key ${options.apiKey}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(CMS_TIMEOUT_MS),
        });
      } catch (error) {
        throw new IntegrationError('cms', 'partner-applications request failed', { cause: error });
      }
      if (!response.ok) {
        throw new IntegrationError('cms', `partner-applications answered ${response.status}`, { status: response.status });
      }
      let parsed: z.SafeParseReturnType<unknown, CmsPage>;
      try {
        parsed = pageSchema.safeParse(await response.json());
      } catch (error) {
        throw new IntegrationError('cms', 'partner-applications answered with invalid JSON', { cause: error });
      }
      // A row that does not match the schema stops the run on purpose: skipping it silently would lose an applicant.
      if (!parsed.success) throw new IntegrationError('cms', 'partner-applications answered with an unexpected shape');
      return parsed.data;
    },
  };
}

/** Null when CMS_INTAKE_API_KEY is unset (local development): the job then does nothing. */
export function createCmsClient(
  config: { apiKey: string | undefined; baseUrl: string } = { apiKey: env.CMS_INTAKE_API_KEY, baseUrl: env.CMS_API_URL },
): CmsClient | null {
  return config.apiKey ? createHttpCmsClient({ baseUrl: config.baseUrl, apiKey: config.apiKey }) : null;
}

export interface IntakeResult {
  fetched: number;
  imported: number;
  skipped: { honeypot: number; redacted: number; turnstile: number; duplicate: number };
  cursor: string | null;
}

/**
 * Maps one CMS row to a NewApplicationRecord (source 'website', sourceRef = CMS id): applicant name from first and last
 * name, domain from the website field falling back to the email domain, personalEmail from the full free-mail list,
 * existingDomain from `partnerDomains`, category and region null.
 */
export function mapCmsApplication(row: CmsPartnerApplication, partnerDomains: ReadonlySet<string>): NewApplicationRecord {
  const checked = validateBusinessEmail(row.email, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
  const email = checked.ok ? checked.email : row.email.trim().toLowerCase();
  const fromEmail = emailDomain(email);
  const site = normaliseDomain(row.website ?? '');
  const domain = isPlausibleDomain(site) ? site : fromEmail;
  return {
    company: row.company.trim(),
    domain,
    applicantName: `${row.firstName} ${row.lastName}`.trim(),
    email,
    role: null,
    phone: row.phone?.trim() || null,
    category: null,
    region: null,
    reason: row.partnerReason?.trim() || null,
    source: 'website',
    sourceRef: row.id,
    personalEmail: !checked.ok && checked.reason === 'free-mail',
    existingDomain: partnerDomains.has(domain) || (fromEmail !== '' && partnerDomains.has(fromEmail)),
    submittedAt: new Date(row.createdAt),
  };
}

/**
 * Reads pages from the cursor in hubspot_sync_state key 'website_applications_cursor' ({ createdAt: string }),
 * skips honeypot, turnstilePassed === false and piiRedactedAt rows, inserts through insertWebsiteApplication
 * (idempotent), and advances the cursor only after the whole run succeeds. Uses the system db.
 */
export async function importWebsiteApplications(deps: { db: Db; cms: CmsClient; clock: Clock }): Promise<IntakeResult> {
  const { db, cms, clock } = deps;
  const [stored] = await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, CURSOR_KEY)).limit(1);
  const parsedCursor = stored ? cursorSchema.safeParse(stored.value) : null;
  const since = parsedCursor?.success ? parsedCursor.data.createdAt : null;
  const partnerDomains = new Set((await db.select({ domain: partners.domain }).from(partners)).map((p) => p.domain));

  const result: IntakeResult = {
    fetched: 0,
    imported: 0,
    skipped: { honeypot: 0, redacted: 0, turnstile: 0, duplicate: 0 },
    cursor: since,
  };
  let newest = since;

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await cms.listPartnerApplications({ since, page, limit: PAGE_LIMIT });
    for (const row of batch.docs) {
      result.fetched += 1;
      if (newest === null || Date.parse(row.createdAt) > Date.parse(newest)) newest = row.createdAt;
      if (row.piiRedactedAt) {
        result.skipped.redacted += 1;
        continue;
      }
      if (row.honeypot) {
        result.skipped.honeypot += 1;
        continue;
      }
      if (row.turnstilePassed === false) {
        result.skipped.turnstile += 1;
        continue;
      }
      const record = mapCmsApplication(row, partnerDomains);
      const { inserted } = await withSystem(SYSTEM_ACTORS.intake, (tx) =>
        insertWebsiteApplication(tx, SYSTEM_ACTORS.intake, record, clock),
      );
      if (inserted) result.imported += 1;
      else result.skipped.duplicate += 1;
    }
    if (!batch.hasNextPage) break;
  }

  if (newest !== null && newest !== since) {
    await db
      .insert(hubspotSyncState)
      .values({ key: CURSOR_KEY, value: { createdAt: newest } })
      .onConflictDoUpdate({ target: hubspotSyncState.key, set: { value: { createdAt: newest } } });
    result.cursor = newest;
  }
  return result;
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/intake/website-applications.test.ts`
Expected: PASS, 11 tests. If `z.SafeParseReturnType` is not exported by the installed Zod 3 minor, replace the `let parsed` line with `let parsed: ReturnType<typeof pageSchema.safeParse>;`.

- [ ] **Step 6: Write the failing job test**

Create `src/server/jobs/intake.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { applications, hubspotSyncState } from '@/db/schema';
import { resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { createHttpCmsClient } from '@/server/intake/website-applications';
import { startStubCms } from '@/server/intake/stub-cms';
import { runIntakeWith } from './intake';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('website-intake job', () => {
  it('does nothing when CMS_INTAKE_API_KEY is unset (no client)', async () => {
    await expect(runIntakeWith({ db, cms: null, clock })).resolves.toBeUndefined();
    expect(await db.select().from(applications)).toHaveLength(0);
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });

  it('imports through the client it is given', async () => {
    const stub = await startStubCms([
      { id: 1, createdAt: '2026-11-01T09:00:00.000Z', firstName: 'A', lastName: 'B', email: 'a@acme-sec.com', company: 'Acme Sec' },
    ]);
    try {
      await runIntakeWith({ db, cms: createHttpCmsClient({ baseUrl: stub.url, apiKey: stub.apiKey }), clock });
      expect(await db.select().from(applications)).toHaveLength(1);
    } finally {
      await stub.close();
    }
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/intake.test.ts`
Expected: FAIL, `runIntakeWith` is not exported by `./intake`.

- [ ] **Step 7: Replace the job stub body**

Replace `src/server/jobs/intake.ts` entirely (W0-c created it as `export const runIntake = async (): Promise<void> => {}`; the export name and signature stay):

```ts
import { type Db, db } from '@/db/client';
import { type Clock, systemClock } from '@/lib/clock';
import { type CmsClient, createCmsClient, importWebsiteApplications } from '@/server/intake/website-applications';
import { log } from '@/server/log';

/** The job body with its dependencies explicit, so tests can pass a client or none. */
export const runIntakeWith = async (deps: { db: Db; cms: CmsClient | null; clock: Clock }): Promise<void> => {
  if (!deps.cms) {
    log.debug({}, 'website intake skipped: CMS_INTAKE_API_KEY is not set');
    return;
  }
  const result = await importWebsiteApplications({ db: deps.db, cms: deps.cms, clock: deps.clock });
  log.info(result, 'website intake finished');
};

export const runIntake = async (): Promise<void> => runIntakeWith({ db, cms: createCmsClient(), clock: systemClock });
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/intake.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 8: Add the two local development scripts**

Create `scripts/stub-cms.ts` (a stub CMS on a fixed port so `.env` stays stable):

```ts
import { startStubCms } from '../src/server/intake/stub-cms';

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

const stub = await startStubCms(
  [
    { id: 9001, createdAt: hoursAgo(30), firstName: 'Sameer', lastName: 'Al Harthy', email: 'sameer@falconridge.ae', phone: '+968 9123 4567', company: 'Falcon Ridge IT', website: 'https://www.falconridge.ae', partnerReason: 'Value-added distributor across Oman and the UAE.' },
    { id: 9002, createdAt: hoursAgo(5), firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@gmail.com', company: 'Nair Security Consulting', website: null, partnerReason: 'Independent consultant looking to resell.' },
    { id: 9003, createdAt: hoursAgo(1), firstName: 'Bot', lastName: 'Spam', email: 'bot@spam.example', company: 'Spam Inc', honeypot: 'filled' },
  ],
  { apiKey: 'stub-key', port: 3290 },
);
console.log(`Stub CMS listening at ${stub.url}`);
console.log('In apps/portal/.env set CMS_API_URL=http://127.0.0.1:3290 and CMS_INTAKE_API_KEY=stub-key, then run:');
console.log('  pnpm --filter @cleanstart/portal exec tsx --env-file=.env scripts/run-intake.ts');
```

Create `scripts/run-intake.ts`:

```ts
import { runIntake } from '../src/server/jobs/intake';

await runIntake();
process.exit(0);
```

- [ ] **Step 9: Gate A**

Run the Gate A block (Conventions). The last command must list only: `src/server/repo/applications.ts`, `src/server/repo/applications.test.ts`, `src/server/intake/website-applications.ts`, `src/server/intake/website-applications.test.ts`, `src/server/intake/stub-cms.ts`, `src/server/jobs/intake.ts`, `src/server/jobs/intake.test.ts`, `scripts/stub-cms.ts`, `scripts/run-intake.ts` (under `apps/portal/`).

- [ ] **Step 10: Manual check (dev database with seed-dev data)**

1. Terminal A: `pnpm --filter @cleanstart/portal exec tsx scripts/stub-cms.ts`. Expected: `Stub CMS listening at http://127.0.0.1:3290`.
2. Put `CMS_API_URL=http://127.0.0.1:3290` and `CMS_INTAKE_API_KEY=stub-key` in `apps/portal/.env`. Terminal B: `pnpm --filter @cleanstart/portal exec tsx --env-file=.env scripts/run-intake.ts`. Expected log line: `website intake finished` with `fetched: 3, imported: 2, skipped: { honeypot: 1, ... }` and a cursor.
3. `psql cleanstart_portal_p -c "select reference, company, source, personal_email, existing_domain, category, region from applications order by created_at"`. Expected: Falcon Ridge IT and Nair Security Consulting with `source = website`, the second with `personal_email = t`, both with null category and region, references `APP-<yymm>-0045` and `0046`.
4. Run step 2 again. Expected: `imported: 0`, `duplicate: 1`, no new rows. Remove the two `.env` lines afterwards (they are never committed).

- [ ] **Step 11: Commit**

```bash
git add apps/portal/src/server/repo/applications.ts apps/portal/src/server/repo/applications.test.ts \
  apps/portal/src/server/intake/website-applications.ts apps/portal/src/server/intake/website-applications.test.ts \
  apps/portal/src/server/intake/stub-cms.ts apps/portal/src/server/jobs/intake.ts apps/portal/src/server/jobs/intake.test.ts \
  apps/portal/scripts/stub-cms.ts apps/portal/scripts/run-intake.ts \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.3b website form entries imported into the portal"
```

---

### Task M1.4: Application review (admin)

Implements master task 1.4. Approve creates the partner (status `onboarding`, manager routed by region), the partner admin invite and the outbox op `partner.upsert`; decline needs a reason and emails the applicant; reopen is the undo. Website entries and portal entries share one queue and show a "Website form" or "Portal form" chip. Website entries have no category or region, so approving one opens an inline panel where the manager sets them.

Interim state: after this task the Applications tab is real while the Partners tab still reads the mock slice. Task M4.1 converts the Partners tab. Approving here creates a real partner that the mock Partners tab does not list until M4.1; this is expected.

**Files:**
- Create: `src/server/invite-core.ts`, `src/server/invite-core.test.ts`
- Create: `src/server/partner-routing.ts`, `src/server/partner-routing.test.ts`
- Create: `src/server/partner-rows.ts`, `src/server/partner-rows.test.ts`
- Modify: `src/server/repo/applications.ts`, `src/server/repo/applications.test.ts`
- Modify: `src/lib/apply.ts`
- Create: `src/server/actions/applications.ts`, `src/server/actions/applications.test.ts`
- Modify: `src/components/partners/badges.tsx`, `src/components/partners/applications-table.tsx`, `src/components/screens/AdminPartners.tsx`, `src/app/admin/partners/page.tsx`

- [ ] **Step 1: Write the failing invite-core test**

Create `src/server/invite-core.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites } from '@/db/schema';
import { makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken, INVITE_TTL_DAYS } from '@/server/auth/tokens';
import { withSystem } from '@/server/repo/context';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { issueInvite, rotateInviteToken, toInviteDto } from './invite-core';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = SYSTEM_ACTORS.portal;
const issue = (input: Parameters<typeof issueInvite>[1]) => withSystem(actor, (tx) => issueInvite(tx, input, clock));

beforeEach(async () => {
  await resetDb(db);
});

describe('issueInvite', () => {
  it('stores only the SHA-256 of a 32 byte token and expires in 7 days', async () => {
    const partner = await makePartner(db, {});
    const { invite, token } = await issue({ kind: 'partner', partnerId: partner.id, email: ' New.Person@Example.com ', role: 'sales', staffRegion: null, invitedBy: null });
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.tokenHash).toBe(hashToken(token));
    expect(row?.tokenHash).not.toContain(token);
    expect(row?.email).toBe('new.person@example.com');
    expect(row?.expiresAt.toISOString()).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    expect(invite).toMatchObject({ state: 'ok', resentCount: 0, role: 'sales', kind: 'partner' });
  });

  it('revokes an earlier open invite for the same email and company', async () => {
    const partner = await makePartner(db, {});
    const first = await issue({ kind: 'partner', partnerId: partner.id, email: 'a@example.com', role: 'sales', staffRegion: null, invitedBy: null });
    const second = await issue({ kind: 'partner', partnerId: partner.id, email: 'a@example.com', role: 'technical', staffRegion: null, invitedBy: null });
    const [old] = await db.select().from(invites).where(eq(invites.id, first.invite.id));
    expect(old?.revokedAt).not.toBeNull();
    expect(second.invite.role).toBe('technical');
  });

  it('refuses an email that already has an active login but allows a removed person', async () => {
    const partner = await makePartner(db, {});
    await makeUser(db, { partnerId: partner.id, email: 'taken@example.com', status: 'active' });
    await expect(issue({ kind: 'partner', partnerId: partner.id, email: 'taken@example.com', role: 'sales', staffRegion: null, invitedBy: null })).rejects.toMatchObject({ reason: 'already_has_login' });
    await makeUser(db, { partnerId: partner.id, email: 'gone@example.com', status: 'disabled' });
    await expect(issue({ kind: 'partner', partnerId: partner.id, email: 'gone@example.com', role: 'sales', staffRegion: null, invitedBy: null })).resolves.toMatchObject({ invite: { state: 'ok' } });
  });

  it('issues a staff invite with a region and no partner', async () => {
    const { invite } = await issue({ kind: 'staff', partnerId: null, email: 'staff@cleanstart.com', role: 'sales', staffRegion: 'india', invitedBy: null });
    expect(invite).toMatchObject({ kind: 'staff', partnerId: null, staffRegion: 'india' });
  });
});

describe('rotateInviteToken', () => {
  it('replaces the token, extends the expiry and counts the resend', async () => {
    const partner = await makePartner(db, {});
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'r@example.com', expiresAt: new Date('2026-11-13T00:00:00Z') });
    const rotated = await withSystem(actor, (tx) => rotateInviteToken(tx, invite.id, clock));
    expect(rotated?.token).not.toBe(token);
    expect(rotated?.invite.resentCount).toBe(1);
    expect(rotated?.invite.expiresAt).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.tokenHash).toBe(hashToken(rotated?.token ?? ''));
    expect(row?.tokenHash).not.toBe(hashToken(token));
  });

  it('returns null for an accepted or revoked invite', async () => {
    const partner = await makePartner(db, {});
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'x@example.com', revokedAt: new Date('2026-11-01T00:00:00Z'), expiresAt: new Date('2026-11-20T00:00:00Z') });
    expect(await withSystem(actor, (tx) => rotateInviteToken(tx, invite.id, clock))).toBeNull();
  });
});

describe('toInviteDto', () => {
  it('reports expired, used and revoked states', async () => {
    const partner = await makePartner(db, {});
    const make = async (extra: Partial<typeof invites.$inferInsert>) => (await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random()}@example.com`, expiresAt: new Date('2026-11-20T00:00:00Z'), ...extra })).invite;
    const now = clock.now();
    expect(toInviteDto(await make({ expiresAt: new Date('2026-11-01T00:00:00Z') }), now).state).toBe('expired');
    expect(toInviteDto(await make({ acceptedAt: new Date('2026-11-05T00:00:00Z') }), now).state).toBe('used');
    expect(toInviteDto(await make({ revokedAt: new Date('2026-11-05T00:00:00Z') }), now).state).toBe('revoked');
    expect(toInviteDto(await make({}), now).state).toBe('ok');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/invite-core.test.ts`
Expected: FAIL, `Failed to resolve import "./invite-core"`.

- [ ] **Step 2: Implement `invite-core.ts`**

Create `src/server/invite-core.ts` (not under `repo/`, so it needs no isolation entry; it is called only by repo functions that already run in a viewer or system transaction):

```ts
import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import { invites, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { PartnerRole, StaffRegion, StaffRole, UserKind } from '@/lib/domain';
import type { CreatedInviteDto, InviteDto } from '@/lib/dto';
import { generateInviteToken, inviteExpiresAt, inviteState } from '@/server/auth/tokens';
import { ConflictError } from '@/server/errors';
import type { Tx } from '@/server/repo/context';

export type InviteRow = typeof invites.$inferSelect;

export const toInviteDto = (row: InviteRow, now: Date): InviteDto => ({
  id: row.id,
  email: row.email,
  kind: row.kind,
  role: row.role as PartnerRole | StaffRole,
  partnerId: row.partnerId,
  staffRegion: row.staffRegion,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
  resentCount: row.resentCount,
  state: inviteState(row, now),
});

export interface IssueInviteInput {
  kind: UserKind;
  partnerId: string | null;
  email: string;
  role: string;
  staffRegion: StaffRegion | null;
  invitedBy: string | null;
}

/**
 * Creates an invite and returns the clear token once. Replaces an earlier open invite for the same email, kind and
 * company (the old one is revoked first). Throws ConflictError('already_has_login') when an active or invited user has
 * the email; a removed (disabled) person may be invited again.
 */
export async function issueInvite(tx: Tx, input: IssueInviteInput, clock: Clock): Promise<CreatedInviteDto> {
  const email = input.email.trim().toLowerCase();
  const [login] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.status, 'disabled')))
    .limit(1);
  if (login) throw new ConflictError('already_has_login', 'This person already has a login.');

  const sameTarget = input.partnerId === null ? isNull(invites.partnerId) : eq(invites.partnerId, input.partnerId);
  await tx
    .update(invites)
    .set({ revokedAt: clock.now() })
    .where(and(eq(invites.email, email), eq(invites.kind, input.kind), sameTarget, isNull(invites.acceptedAt), isNull(invites.revokedAt)));

  const { token, tokenHash } = generateInviteToken();
  const [row] = await tx
    .insert(invites)
    .values({
      email,
      kind: input.kind,
      partnerId: input.partnerId,
      role: input.role,
      staffRegion: input.staffRegion,
      tokenHash,
      expiresAt: inviteExpiresAt(clock.now()),
      invitedBy: input.invitedBy,
    })
    .returning();
  if (!row) throw new Error('invite insert returned no row');
  return { invite: toInviteDto(row, clock.now()), token };
}

/**
 * Replaces the token of an open invite, extends the expiry from now and counts the resend. Null when the invite is
 * missing, accepted or revoked (the caller decides which error to raise).
 */
export async function rotateInviteToken(tx: Tx, inviteId: string, clock: Clock): Promise<CreatedInviteDto | null> {
  const { token, tokenHash } = generateInviteToken();
  const [row] = await tx
    .update(invites)
    .set({ tokenHash, expiresAt: inviteExpiresAt(clock.now()), resentCount: sql`${invites.resentCount} + 1` })
    .where(and(eq(invites.id, inviteId), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .returning();
  return row ? { invite: toInviteDto(row, clock.now()), token } : null;
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/invite-core.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 3: Write the failing routing test**

Create `src/server/partner-routing.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { type Tx, withSystem } from '@/server/repo/context';
import { assertActiveManager, insertOnboardingPartner, pickManagerId } from './partner-routing';

const db = testDb();
const run = <T>(fn: (tx: Tx) => Promise<T>) => withSystem(SYSTEM_ACTORS.portal, fn);

beforeEach(async () => {
  await resetDb(db);
});

describe('pickManagerId', () => {
  it('prefers the manager whose scope is the region, then a manager for all regions, then any active manager', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const me = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', status: 'disabled' });
    expect(await run((tx) => pickManagerId(tx, 'india'))).toBe(india.id);
    expect(await run((tx) => pickManagerId(tx, 'middle_east'))).toBe(me.id);
    // 'elsewhere' has no exact scope: falls to the oldest active manager
    expect(await run((tx) => pickManagerId(tx, 'elsewhere'))).toBe(india.id);
  });

  it('uses a manager that covers all regions before the oldest one', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const all = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'all' });
    expect(await run((tx) => pickManagerId(tx, 'elsewhere'))).toBe(all.id);
  });

  it('is null when there is no active partner manager', async () => {
    await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    expect(await run((tx) => pickManagerId(tx, 'india'))).toBeNull();
  });
});

describe('assertActiveManager', () => {
  it('accepts an active partner manager and rejects anyone else', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(run((tx) => assertActiveManager(tx, manager.id))).resolves.toBeUndefined();
    await expect(run((tx) => assertActiveManager(tx, sales.id))).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('insertOnboardingPartner', () => {
  it('creates an onboarding partner and refuses a domain another partner owns', async () => {
    const created = await run((tx) => insertOnboardingPartner(tx, { name: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', category: 'channel', region: 'india', managerId: null }));
    expect(created).toMatchObject({ status: 'onboarding', agreementAcceptedAt: null, domain: 'tidewaterinfosec.in' });
    await makePartner(db, { domain: 'kestrelsystems.in' });
    await expect(run((tx) => insertOnboardingPartner(tx, { name: 'Other', domain: 'kestrelsystems.in', category: 'channel', region: 'india', managerId: null }))).rejects.toMatchObject({ reason: 'domain_is_partner' });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-routing.test.ts`
Expected: FAIL, `Failed to resolve import "./partner-routing"`.

- [ ] **Step 4: Implement partner routing**

Create `src/server/partner-routing.ts`:

```ts
import { and, asc, eq, sql } from 'drizzle-orm';
import { partners, staffScopes, users } from '@/db/schema';
import type { PartnerCategory, PartnerRegion } from '@/lib/domain';
import { ConflictError, ValidationError } from '@/server/errors';
import type { Tx } from '@/server/repo/context';

export type PartnerRow = typeof partners.$inferSelect;

/**
 * The active partner manager a new partner is routed to: the one whose staff scope is `region`, then one whose scope
 * is 'all', then the oldest active partner manager. Null when there is none.
 */
export async function pickManagerId(tx: Tx, region: PartnerRegion): Promise<string | null> {
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(
      sql`case when ${staffScopes.region} = ${region} then 0 when ${staffScopes.region} = 'all' then 1 else 2 end`,
      asc(users.createdAt),
    )
    .limit(1);
  return row?.id ?? null;
}

/** Throws ValidationError (path "managerId") unless the user is an active partner manager. */
export async function assertActiveManager(tx: Tx, managerId: string): Promise<void> {
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, managerId), eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .limit(1);
  if (!row) throw new ValidationError([{ path: 'managerId', message: 'Choose an active partner manager.' }]);
}

export interface NewOnboardingPartner {
  name: string;
  domain: string;
  category: PartnerCategory;
  region: PartnerRegion;
  managerId: string | null;
}

/** Inserts a partner in status 'onboarding'. Throws ConflictError('domain_is_partner') when the domain is taken. */
export async function insertOnboardingPartner(tx: Tx, input: NewOnboardingPartner): Promise<PartnerRow> {
  const [created] = await tx
    .insert(partners)
    .values({
      name: input.name,
      domain: input.domain,
      category: input.category,
      region: input.region,
      managerId: input.managerId,
      status: 'onboarding',
    })
    .onConflictDoNothing({ target: partners.domain })
    .returning();
  if (!created) throw new ConflictError('domain_is_partner', 'Another partner already uses this domain.');
  return created;
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-routing.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Write the failing partner rows test**

Create `src/server/partner-rows.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { users } from '@/db/schema';
import { makeApplication, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem } from '@/server/repo/context';
import { partnerListRows } from './partner-rows';

const db = testDb();
const rows = (filter: Parameters<typeof partnerListRows>[1]) => withSystem(SYSTEM_ACTORS.portal, (tx) => partnerListRows(tx, filter));
const today = systemClock.today();

beforeEach(async () => {
  await resetDb(db);
});

describe('partnerListRows', () => {
  it('counts people with a login or an open invite, registration figures and the manager', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', name: 'Farhan Qureshi', region: 'india' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', managerId: manager.id, hubspotCompanyId: '91822044' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
    await makeUser(db, { partnerId: partner.id, role: 'sales' });
    await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    await db.update(users).set({ lastLoginAt: new Date('2026-11-10T09:00:00Z') }).where(eq(users.id, admin.id));
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'sneha@kestrelsystems.in', expiresAt: new Date('2027-01-01T00:00:00Z') });
    await makeRegistration(db, { partnerId: partner.id, status: 'pending' });
    await makeRegistration(db, { partnerId: partner.id, status: 'accepted' });
    await makeRegistration(db, { partnerId: partner.id, status: 'won', registeredOn: today, closedOn: today });
    await makeRegistration(db, { partnerId: partner.id, status: 'won', registeredOn: '2019-01-01', closedOn: '2019-03-01' });
    const [row] = await rows({});
    expect(row).toMatchObject({
      name: 'Kestrel Systems',
      users: 3,
      pending: 1,
      protectedCount: 1,
      won: 1,
      adminName: 'Aditi Rao',
      managerName: 'Farhan Qureshi',
      managerId: manager.id,
      hubspotCompanyId: '91822044',
      lastActiveAt: '2026-11-10T09:00:00.000Z',
      agreementVersion: null,
    });
  });

  it('names the admin from the approved application, then from the invite email, when nobody has signed in yet', async () => {
    const withApplication = await makePartner(db, { name: 'Alpha', domain: 'alpha.example', status: 'onboarding' });
    await makeInvite(db, { kind: 'partner', partnerId: withApplication.id, role: 'partner_admin', email: 'neha@alpha.example', expiresAt: new Date('2027-01-01T00:00:00Z') });
    await makeApplication(db, { partnerId: withApplication.id, status: 'approved', applicantName: 'Neha Joshi', email: 'neha@alpha.example', source: 'portal' });
    const bare = await makePartner(db, { name: 'Beta', domain: 'beta.example', status: 'onboarding' });
    await makeInvite(db, { kind: 'partner', partnerId: bare.id, role: 'partner_admin', email: 'omar.siddiqui@beta.example', expiresAt: new Date('2027-01-01T00:00:00Z') });
    const found = await rows({});
    expect(found.find((r) => r.name === 'Alpha')).toMatchObject({ adminName: 'Neha Joshi', users: 1 });
    expect(found.find((r) => r.name === 'Beta')).toMatchObject({ adminName: 'Omar Siddiqui', users: 1 });
  });

  it('filters by search, status, category, region and ids, sorted by name', async () => {
    const a = await makePartner(db, { name: 'Zeta Cyber', domain: 'zeta.example', category: 'distributor', region: 'middle_east', status: 'active' });
    const b = await makePartner(db, { name: 'Alpha Secure', domain: 'alpha.example', category: 'channel', region: 'india', status: 'onboarding' });
    expect((await rows({})).map((r) => r.name)).toEqual(['Alpha Secure', 'Zeta Cyber']);
    expect((await rows({ q: 'zeta' })).map((r) => r.id)).toEqual([a.id]);
    expect((await rows({ q: 'alpha.example' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ status: 'onboarding' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ category: 'distributor' })).map((r) => r.id)).toEqual([a.id]);
    expect((await rows({ region: 'india' })).map((r) => r.id)).toEqual([b.id]);
    expect((await rows({ ids: [a.id] })).map((r) => r.id)).toEqual([a.id]);
    expect(await rows({ ids: [] })).toEqual([]);
    expect((await rows({ scopeRegion: 'middle_east' })).map((r) => r.id)).toEqual([a.id]);
    expect(await rows({ scopeRegion: 'all' })).toHaveLength(2);
  });

  it('treats LIKE wildcards in the search term literally', async () => {
    await makePartner(db, { name: '100% Secure', domain: 'pct.example' });
    await makePartner(db, { name: 'Other', domain: 'other.example' });
    expect((await rows({ q: '%' })).map((r) => r.name)).toEqual(['100% Secure']);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-rows.test.ts`
Expected: FAIL, `Failed to resolve import "./partner-rows"`.

- [ ] **Step 6: Implement the partner rows builder**

Create `src/server/partner-rows.ts`:

```ts
import { and, asc, eq, ilike, inArray, isNull, ne, or, sql, type SQL } from 'drizzle-orm';
import { applications, invites, partners, registrations, users } from '@/db/schema';
import type { PartnerCategory, PartnerRegion, PartnerStatus, StaffRegion } from '@/lib/domain';
import type { PartnerListRow } from '@/lib/dto';
import { nameFromEmail } from '@/lib/people';
import { iso, likePattern } from '@/server/people';
import type { Tx } from '@/server/repo/context';

export interface PartnerRowFilter {
  ids?: readonly string[];
  q?: string;
  status?: PartnerStatus;
  category?: PartnerCategory;
  region?: PartnerRegion;
  /** Staff sales see only partners in their region. 'all' or undefined means no limit. */
  scopeRegion?: StaffRegion;
}

const group = <T>(items: readonly T[], key: (item: T) => string | null): Map<string, T[]> => {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (k === null) continue;
    out.set(k, [...(out.get(k) ?? []), item]);
  }
  return out;
};

/**
 * The rows behind the Partners table and the detail card: one query per concern, merged here, so the counts match what
 * a person sees on the Team and Deals screens. Staff only data (applications) is read, so call it from staff paths.
 */
export async function partnerListRows(tx: Tx, filter: PartnerRowFilter): Promise<PartnerListRow[]> {
  const conditions: SQL[] = [];
  if (filter.ids) {
    if (filter.ids.length === 0) return [];
    conditions.push(inArray(partners.id, [...filter.ids]));
  }
  if (filter.q?.trim()) {
    const like = likePattern(filter.q);
    const match = or(ilike(partners.name, like), ilike(partners.domain, like));
    if (match) conditions.push(match);
  }
  if (filter.status) conditions.push(eq(partners.status, filter.status));
  if (filter.category) conditions.push(eq(partners.category, filter.category));
  if (filter.region) conditions.push(eq(partners.region, filter.region));
  if (filter.scopeRegion && filter.scopeRegion !== 'all') conditions.push(eq(partners.region, filter.scopeRegion));

  const rows = await tx
    .select()
    .from(partners)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(partners.name));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const people = await tx
    .select({
      partnerId: users.partnerId,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(and(inArray(users.partnerId, ids), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const openInvites = await tx
    .select({ partnerId: invites.partnerId, email: invites.email, role: invites.role })
    .from(invites)
    .where(and(inArray(invites.partnerId, ids), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const approved = await tx
    .select({ partnerId: applications.partnerId, applicantName: applications.applicantName, email: applications.email })
    .from(applications)
    .where(and(inArray(applications.partnerId, ids), eq(applications.status, 'approved')));
  const counts = await tx
    .select({
      partnerId: registrations.partnerId,
      pending: sql<number>`count(*) filter (where ${registrations.status} = 'pending')::int`,
      protectedCount: sql<number>`count(*) filter (where ${registrations.status} = 'accepted')::int`,
      won: sql<number>`count(*) filter (where ${registrations.status} = 'won' and coalesce(${registrations.closedOn}, ${registrations.registeredOn}) >= date_trunc('year', now())::date)::int`,
    })
    .from(registrations)
    .where(inArray(registrations.partnerId, ids))
    .groupBy(registrations.partnerId);
  const managerIds = [...new Set(rows.map((r) => r.managerId).filter((id): id is string => id !== null))];
  const managers =
    managerIds.length === 0 ? [] : await tx.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, managerIds));

  const peopleBy = group(people, (p) => p.partnerId);
  const invitesBy = group(openInvites, (i) => i.partnerId);
  const approvedBy = group(approved, (a) => a.partnerId);
  const countsBy = new Map(counts.map((c) => [c.partnerId, c]));
  const managerName = new Map(managers.map((m) => [m.id, m.name]));

  return rows.map((p): PartnerListRow => {
    const here = peopleBy.get(p.id) ?? [];
    const inviteOnly = (invitesBy.get(p.id) ?? []).filter((i) => !here.some((u) => u.email === i.email));
    const active = here.filter((u) => u.status === 'active');
    const lastLogin = active.reduce<Date | null>((best, u) => (u.lastLoginAt && (!best || u.lastLoginAt > best) ? u.lastLoginAt : best), null);
    const adminUser = here.find((u) => u.role === 'partner_admin' && u.status === 'active') ?? here.find((u) => u.role === 'partner_admin');
    const adminInvite = inviteOnly.find((i) => i.role === 'partner_admin');
    const adminApplication = adminInvite
      ? (approvedBy.get(p.id) ?? []).find((a) => a.email === adminInvite.email)
      : undefined;
    const figures = countsBy.get(p.id);
    return {
      id: p.id,
      name: p.name,
      domain: p.domain,
      category: p.category,
      region: p.region,
      status: p.status,
      statusBeforeSuspend: p.statusBeforeSuspend,
      users: here.length + inviteOnly.length,
      pending: figures?.pending ?? 0,
      protectedCount: figures?.protectedCount ?? 0,
      won: figures?.won ?? 0,
      lastActiveAt: iso(lastLogin),
      since: p.createdAt.toISOString().slice(0, 10),
      agreementVersion: p.agreementVersion,
      agreementAcceptedAt: iso(p.agreementAcceptedAt),
      adminName: adminUser?.name ?? adminApplication?.applicantName ?? (adminInvite ? nameFromEmail(adminInvite.email) : null),
      managerId: p.managerId,
      managerName: p.managerId ? (managerName.get(p.managerId) ?? null) : null,
      hubspotCompanyId: p.hubspotCompanyId,
    };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-rows.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Write the failing repo tests for review**

Append to `src/server/repo/applications.test.ts`. Extend the imports: from `@/db/schema` add `invites, partners`; from `@/db/test-helpers` add `asPartner, asStaff`; from `./applications` add `approveApplication, countNewApplications, declineApplication, getApplication, listApplications, reopenApplication`; add `import { eq } from 'drizzle-orm';`, `import { hashToken, INVITE_TTL_DAYS } from '@/server/auth/tokens';` and replace the existing `import { withSystem } from './context';` with `import { type Tx, withSystem, withViewer } from './context';`. Then append:

```ts
const asManager = async () => asStaff(db, 'partner_manager', 'india');
const approve = async (input: Parameters<typeof approveApplication>[2]) => {
  const viewer = await asManager();
  return withViewer(viewer, (tx) => approveApplication(tx, viewer, input, clock));
};

describe('listApplications and friends (staff only)', () => {
  it('lists newest first, filters by status and searches company, domain, applicant and email', async () => {
    const viewer = await asManager();
    const older = await makeApplication(db, { company: 'Old Co', domain: 'old.example', applicantName: 'Olga', email: 'olga@old.example', source: 'portal', createdAt: new Date('2026-11-01T00:00:00Z') });
    const newer = await makeApplication(db, { company: 'New Co', domain: 'new.example', applicantName: 'Nick', email: 'nick@new.example', source: 'portal', createdAt: new Date('2026-11-05T00:00:00Z') });
    await makeApplication(db, { company: 'Done Co', domain: 'done.example', email: 'd@done.example', source: 'portal', status: 'declined' });
    const run = <T>(fn: (tx: Tx) => Promise<T>) => withViewer(viewer, fn);
    expect((await run((tx) => listApplications(tx, viewer, { status: 'new' }))).map((a) => a.id)).toEqual([newer.id, older.id]);
    expect((await run((tx) => listApplications(tx, viewer, { q: 'OLGA' }))).map((a) => a.id)).toEqual([older.id]);
    expect((await run((tx) => listApplications(tx, viewer, { q: 'new.example' }))).map((a) => a.id)).toEqual([newer.id]);
    expect(await run((tx) => countNewApplications(tx, viewer))).toBe(2);
    expect((await run((tx) => getApplication(tx, viewer, older.id))).company).toBe('Old Co');
    await expect(run((tx) => getApplication(tx, viewer, '00000000-0000-0000-0000-000000000001'))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('refuses a partner viewer before touching data', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => listApplications(tx, viewer, {}))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(withViewer(viewer, (tx) => countNewApplications(tx, viewer))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('approveApplication', () => {
  it('creates an onboarding partner routed to the regional manager and a partner admin invite', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const app = await makeApplication(db, { company: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', applicantName: 'Neha Joshi', email: 'neha.joshi@tidewaterinfosec.in', source: 'portal' });
    const result = await approve({ id: app.id, category: 'channel', region: 'india' });
    expect(result.application).toMatchObject({ status: 'approved', category: 'channel', region: 'india', declineReason: null });
    expect(result.partner).toMatchObject({ name: 'Tidewater Infosec', status: 'onboarding', managerId: india.id, managerName: 'Farhan Qureshi', adminName: 'Neha Joshi', users: 1, agreementAcceptedAt: null });
    expect(result.application.partnerId).toBe(result.partner.id);
    expect(result.invite.invite).toMatchObject({ kind: 'partner', role: 'partner_admin', email: 'neha.joshi@tidewaterinfosec.in', state: 'ok' });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite.invite.id));
    expect(row?.tokenHash).toBe(hashToken(result.invite.token));
    expect(row?.expiresAt.getTime()).toBe(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000);
  });

  it('takes the region from the manager when a website entry has none', async () => {
    const me = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    const app = await makeApplication(db, { company: 'Falcon Ridge IT', domain: 'falconridge.ae', email: 'sameer@falconridge.ae', source: 'website', sourceRef: 'cms-1', category: null, region: null });
    const result = await approve({ id: app.id, category: 'distributor', region: 'middle_east' });
    expect(result.partner).toMatchObject({ category: 'distributor', region: 'middle_east', managerId: me.id });
  });

  it('honours an explicit manager and rejects one who is not an active partner manager', async () => {
    const chosen = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const a = await makeApplication(db, { domain: 'a.example', email: 'a@a.example', source: 'portal' });
    const b = await makeApplication(db, { domain: 'b.example', email: 'b@b.example', source: 'portal' });
    expect((await approve({ id: a.id, category: 'channel', region: 'india', managerId: chosen.id })).partner.managerId).toBe(chosen.id);
    await expect(approve({ id: b.id, category: 'channel', region: 'india', managerId: sales.id })).rejects.toMatchObject({ code: 'validation' });
  });

  it('refuses a domain another partner owns and an application that is not open', async () => {
    await makePartner(db, { domain: 'taken.example' });
    const dup = await makeApplication(db, { domain: 'taken.example', email: 'x@taken.example', source: 'portal' });
    await expect(approve({ id: dup.id, category: 'channel', region: 'india' })).rejects.toMatchObject({ reason: 'domain_is_partner' });
    const decided = await makeApplication(db, { domain: 'y.example', email: 'y@y.example', source: 'portal', status: 'declined' });
    await expect(approve({ id: decided.id, category: 'channel', region: 'india' })).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});

describe('declineApplication', () => {
  it('needs a reason and only works on an open application', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'd.example', email: 'd@d.example', source: 'portal' });
    await expect(withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: '   ' }, clock))).rejects.toMatchObject({ code: 'validation' });
    const declined = await withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: ' We already cover this region. ' }, clock));
    expect(declined).toMatchObject({ status: 'declined', declineReason: 'We already cover this region.', decidedAt: '2026-11-12T10:00:00.000Z' });
    await expect(withViewer(viewer, (tx) => declineApplication(tx, viewer, { id: app.id, reason: 'again' }, clock))).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});

describe('reopenApplication', () => {
  it('undoes a decline', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'r.example', email: 'r@r.example', source: 'portal', status: 'declined', declineReason: 'No' });
    const reopened = await withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock));
    expect(reopened).toMatchObject({ status: 'new', declineReason: null, decidedAt: null });
  });

  it('undoes an approval: revokes the invite, parks the partner as inactive, keeps the link, and a second approval reuses the partner', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const viewer = await asManager();
    const app = await makeApplication(db, { company: 'Reuse Co', domain: 'reuse.example', email: 'a@reuse.example', source: 'portal' });
    const first = await approve({ id: app.id, category: 'channel', region: 'india' });
    const reopened = await withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock));
    expect(reopened).toMatchObject({ status: 'new', partnerId: first.partner.id });
    const [partner] = await db.select().from(partners).where(eq(partners.id, first.partner.id));
    expect(partner?.status).toBe('inactive');
    const [invite] = await db.select().from(invites).where(eq(invites.id, first.invite.invite.id));
    expect(invite?.revokedAt).not.toBeNull();
    const second = await approve({ id: app.id, category: 'distributor', region: 'india' });
    expect(second.partner).toMatchObject({ id: first.partner.id, status: 'onboarding', category: 'distributor' });
    expect(await db.select().from(partners)).toHaveLength(1);
    expect(second.invite.invite.id).not.toBe(first.invite.invite.id);
  });

  it('refuses to undo once the partner has accepted the agreement', async () => {
    const viewer = await asManager();
    const partner = await makePartner(db, { domain: 'signed.example', status: 'onboarding' });
    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-11-10T00:00:00Z'), agreementVersion: 'draft-0' }).where(eq(partners.id, partner.id));
    const app = await makeApplication(db, { domain: 'signed.example', email: 's@signed.example', source: 'portal', status: 'approved', partnerId: partner.id });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock))).rejects.toMatchObject({ reason: 'partner_not_reopenable' });
  });

  it('refuses an application that is already open', async () => {
    const viewer = await asManager();
    const app = await makeApplication(db, { domain: 'o.example', email: 'o@o.example', source: 'portal' });
    await expect(withViewer(viewer, (tx) => reopenApplication(tx, viewer, { id: app.id }, clock))).rejects.toMatchObject({ reason: 'application_not_open' });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts`
Expected: FAIL, the new imports are not exported by `./applications`.

- [ ] **Step 8: Implement the review functions**

In `src/server/repo/applications.ts` replace the import block at the top with:

```ts
import { and, desc, eq, ilike, isNull, or, sql, type SQL } from 'drizzle-orm';
import { applications, invites, partners, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { ApplicationSource, ApplicationStatus, PartnerCategory, PartnerRegion } from '@/lib/domain';
import type { ApplicationDto, CreatedInviteDto, PartnerListRow } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite } from '@/server/invite-core';
import { notifyUsers } from '@/server/notify';
import { assertActiveManager, insertOnboardingPartner, type PartnerRow, pickManagerId } from '@/server/partner-routing';
import { partnerListRows } from '@/server/partner-rows';
import { likePattern } from '@/server/people';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
```

Add after `insertWebsiteApplication`:

```ts
export interface ApproveApplicationInput {
  id: string;
  category: PartnerCategory;
  region: PartnerRegion;
  /** Defaults to the active partner manager whose staff scope covers `region`, then the first active partner manager. */
  managerId?: string | null;
}

export interface ApproveApplicationResult {
  application: ApplicationDto;
  partner: PartnerListRow;
  /** The invite to the applicant as partner admin. Email it, then discard the token. */
  invite: CreatedInviteDto;
}

const loadForUpdate = async (tx: Tx, id: string): Promise<ApplicationRow> => {
  const [row] = await tx.select().from(applications).where(eq(applications.id, id)).limit(1).for('update');
  if (!row) throw new NotFoundError('application');
  return row;
};

const notOpen = (): ConflictError => new ConflictError('application_not_open', 'This application has already been decided.');

/** Staff (M1.4). Newest first. `q` matches company, domain, applicant and email. */
export async function listApplications(
  tx: Tx,
  viewer: Viewer,
  input: { status?: ApplicationStatus; q?: string },
): Promise<ApplicationDto[]> {
  assertStaff(viewer);
  const conditions: SQL[] = [];
  if (input.status) conditions.push(eq(applications.status, input.status));
  if (input.q?.trim()) {
    const like = likePattern(input.q);
    const match = or(
      ilike(applications.company, like),
      ilike(applications.domain, like),
      ilike(applications.applicantName, like),
      ilike(applications.email, like),
    );
    if (match) conditions.push(match);
  }
  const rows = await tx
    .select()
    .from(applications)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(applications.createdAt));
  return rows.map(toDto);
}

/** Staff (M1.4). Throws NotFoundError. */
export async function getApplication(tx: Tx, viewer: Viewer, id: string): Promise<ApplicationDto> {
  assertStaff(viewer);
  const [row] = await tx.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!row) throw new NotFoundError('application');
  return toDto(row);
}

/** Staff (M1.4). Number of applications with status 'new', for the Partners tab badge. */
export async function countNewApplications(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(applications)
    .where(eq(applications.status, 'new'));
  return row?.n ?? 0;
}

/**
 * Staff (M1.4). Creates the partner (status 'onboarding', manager routed) and the partner_admin invite, or reuses the
 * partner a reopened application kept. Throws ConflictError('application_not_open') unless status is 'new' and
 * ConflictError('domain_is_partner') when another partner already owns the domain. The action enqueues partner.upsert.
 */
export async function approveApplication(
  tx: Tx,
  viewer: Viewer,
  input: ApproveApplicationInput,
  clock: Clock,
): Promise<ApproveApplicationResult> {
  assertStaff(viewer);
  const row = await loadForUpdate(tx, input.id);
  if (row.status !== 'new') throw notOpen();

  let managerId = input.managerId ?? null;
  if (managerId) await assertActiveManager(tx, managerId);
  else managerId = await pickManagerId(tx, input.region);

  let partner: PartnerRow;
  if (row.partnerId) {
    // A reopened application kept its partner (inactive); approving again brings it back.
    const [reused] = await tx
      .update(partners)
      .set({ status: 'onboarding', statusBeforeSuspend: null, category: input.category, region: input.region, managerId })
      .where(eq(partners.id, row.partnerId))
      .returning();
    if (!reused) throw new NotFoundError('partner');
    partner = reused;
  } else {
    partner = await insertOnboardingPartner(tx, {
      name: row.company,
      domain: row.domain,
      category: input.category,
      region: input.region,
      managerId,
    });
  }

  const invite = await issueInvite(
    tx,
    { kind: 'partner', partnerId: partner.id, email: row.email, role: 'partner_admin', staffRegion: null, invitedBy: viewer.id },
    clock,
  );
  const [decided] = await tx
    .update(applications)
    .set({
      status: 'approved',
      decidedBy: viewer.id,
      decidedAt: clock.now(),
      declineReason: null,
      partnerId: partner.id,
      category: input.category,
      region: input.region,
    })
    .where(eq(applications.id, row.id))
    .returning();
  const [listRow] = await partnerListRows(tx, { ids: [partner.id] });
  if (!decided || !listRow) throw new Error('approval wrote no row');
  return { application: toDto(decided), partner: listRow, invite };
}

/** Staff (M1.4). Needs a reason. Throws ConflictError('application_not_open'). */
export async function declineApplication(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<ApplicationDto> {
  assertStaff(viewer);
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Add a reason the applicant will see.' }]);
  const row = await loadForUpdate(tx, input.id);
  if (row.status !== 'new') throw notOpen();
  const [declined] = await tx
    .update(applications)
    .set({ status: 'declined', decidedBy: viewer.id, decidedAt: clock.now(), declineReason: reason })
    .where(eq(applications.id, row.id))
    .returning();
  if (!declined) throw new Error('decline wrote no row');
  return toDto(declined);
}

/**
 * Staff (M1.4). Undo. Revokes the open invite and marks the created partner 'inactive' (never deletes it), only while
 * the partner is still 'onboarding' and has not accepted the agreement; otherwise ConflictError('partner_not_reopenable').
 * The application returns to 'new' and keeps `partnerId` so a second approval reuses the partner.
 */
export async function reopenApplication(
  tx: Tx,
  viewer: Viewer,
  input: { id: string },
  clock: Clock,
): Promise<ApplicationDto> {
  assertStaff(viewer);
  const row = await loadForUpdate(tx, input.id);
  if (row.status === 'new') throw new ConflictError('application_not_open', 'This application is already open.');
  if (row.status === 'approved' && row.partnerId) {
    const [partner] = await tx.select().from(partners).where(eq(partners.id, row.partnerId)).limit(1).for('update');
    if (!partner || partner.status !== 'onboarding' || partner.agreementAcceptedAt !== null) {
      throw new ConflictError('partner_not_reopenable', 'The partner has already signed in, so the approval cannot be undone.');
    }
    await tx
      .update(invites)
      .set({ revokedAt: clock.now() })
      .where(and(eq(invites.partnerId, partner.id), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
    await tx.update(partners).set({ status: 'inactive', statusBeforeSuspend: null }).where(eq(partners.id, partner.id));
  }
  const [reopened] = await tx
    .update(applications)
    .set({ status: 'new', decidedBy: null, decidedAt: null, declineReason: null })
    .where(eq(applications.id, row.id))
    .returning();
  if (!reopened) throw new Error('reopen wrote no row');
  return toDto(reopened);
}
```

Delete the now-unused `managersOf` duplicate? It is still used by `listManagerRecipients` and `insertWebsiteApplication`; keep it. Replace the `isolation` export with:

```ts
export const isolation = defineIsolation<
  | 'createPortalApplication'
  | 'findPartnerByDomain'
  | 'listManagerRecipients'
  | 'insertWebsiteApplication'
  | 'listApplications'
  | 'getApplication'
  | 'countNewApplications'
  | 'approveApplication'
  | 'declineApplication'
  | 'reopenApplication'
>({
  createPortalApplication: { scope: 'public', reason: 'Public apply flow. Takes a SystemActor; covered by applications.test.ts and actions/apply.test.ts.' },
  findPartnerByDomain: { scope: 'public', reason: 'Public apply flow and website intake. Returns only id and name; covered by applications.test.ts.' },
  listManagerRecipients: { scope: 'public', reason: 'Public flows notify the active partner managers. Takes a SystemActor; covered by applications.test.ts.' },
  insertWebsiteApplication: { scope: 'public', reason: 'Website intake job, system actor only; covered by applications.test.ts and website-applications.test.ts.' },
  listApplications: { scope: 'staff-only', probe: (tx, viewer) => listApplications(tx, viewer, {}), expect: 'forbidden' },
  getApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => getApplication(tx, viewer, ctx.applicationId), expect: 'forbidden' },
  countNewApplications: { scope: 'staff-only', probe: (tx, viewer) => countNewApplications(tx, viewer), expect: 'forbidden' },
  approveApplication: {
    scope: 'staff-only',
    probe: (tx, viewer, ctx) => approveApplication(tx, viewer, { id: ctx.applicationId, category: 'channel', region: 'india' }, systemClock),
    expect: 'forbidden',
  },
  declineApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => declineApplication(tx, viewer, { id: ctx.applicationId, reason: 'x' }, systemClock), expect: 'forbidden' },
  reopenApplication: { scope: 'staff-only', probe: (tx, viewer, ctx) => reopenApplication(tx, viewer, { id: ctx.applicationId }, systemClock), expect: 'forbidden' },
});
```

Add `import { systemClock } from '@/lib/clock';` to the import block (next to the existing `import type { Clock } from '@/lib/clock';`, which stays). The probes run as a partner viewer, so `assertStaff` throws before any write.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/applications.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (applications: 22 tests; the isolation test passes for `applications` because every export is registered).

- [ ] **Step 9: Add the shared result type**

In `src/lib/apply.ts` add `import type { ApplicationDto, PartnerListRow } from '@/lib/dto';` under the existing import, then append:

```ts
/** What approve returns to the client. The invite token never leaves the server. */
export interface ApplicationApprovalDto {
  application: ApplicationDto;
  partner: PartnerListRow;
}
```

- [ ] **Step 10: Write the failing action tests**

Create `src/server/actions/applications.test.ts`. Requires H4.4 (`enqueue`) for the outbox assertions.

```ts
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { applications, auditLog, hubspotOutbox, invites, partners } from '@/db/schema';
import { asPartner, asStaff, makeApplication, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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

import { approveApplicationAction, declineApplicationAction, reopenApplicationAction } from './applications';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  harness.viewer = await asStaff(db, 'partner_manager', 'india');
});

const open = (overrides: Partial<typeof applications.$inferInsert> = {}) =>
  makeApplication(db, { company: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', applicantName: 'Neha Joshi', email: 'neha.joshi@tidewaterinfosec.in', source: 'portal', ...overrides });

describe('approveApplicationAction', () => {
  it('creates the partner, queues partner.upsert, audits and emails the invite link', async () => {
    const app = await open();
    const result = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.partner).toMatchObject({ name: 'Tidewater Infosec', status: 'onboarding' });
    expect(JSON.stringify(result.data)).not.toContain('token');
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'partner.upsert', subjectId: result.data.partner.id, idempotencyKey: `partner.upsert:${result.data.partner.id}:1`, status: 'pending' });
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['application.approved']);
    const mail = fake.only('neha.joshi@tidewaterinfosec.in');
    const token = /accept-invite\?token=([A-Za-z0-9_-]+)/u.exec(mail.htmlContent)?.[1];
    expect(token).toBeDefined();
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('uses a fresh outbox version when a reopened application is approved again', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const app = await open();
    const first = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    await reopenApplicationAction({ id: app.id });
    const second = await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' });
    expect(first.ok && second.ok).toBe(true);
    const keys = (await db.select().from(hubspotOutbox)).map((o) => o.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(await db.select().from(partners)).toHaveLength(1);
  });

  it('is forbidden for a partner viewer and for staff who are not partner managers', async () => {
    const app = await open();
    harness.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asStaff(db, 'sales', 'india');
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect((await db.select().from(applications).where(eq(applications.id, app.id)))[0]?.status).toBe('new');
  });

  it('validates the input and reports a domain conflict with a safe message', async () => {
    expect(await approveApplicationAction({ id: 'nope', category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    await makePartner(db, { domain: 'tidewaterinfosec.in' });
    const app = await open();
    expect(await approveApplicationAction({ id: app.id, category: 'channel', region: 'india' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Another partner already uses this domain.' } });
  });
});

describe('declineApplicationAction', () => {
  it('needs a reason, then declines, audits and emails the applicant the reason', async () => {
    const app = await open();
    expect(await declineApplicationAction({ id: app.id, reason: ' ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const result = await declineApplicationAction({ id: app.id, reason: 'We already have a partner in Pune.' });
    expect(result).toMatchObject({ ok: true, data: { status: 'declined', declineReason: 'We already have a partner in Pune.' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['application.declined', 'We already have a partner in Pune.']]);
    expect(fake.only('neha.joshi@tidewaterinfosec.in').htmlContent).toContain('We already have a partner in Pune.');
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });
});

describe('reopenApplicationAction', () => {
  it('undoes a decline and audits it', async () => {
    const app = await open({ status: 'declined', declineReason: 'No' });
    const result = await reopenApplicationAction({ id: app.id });
    expect(result).toMatchObject({ ok: true, data: { status: 'new' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['application.reopened', 'Decline undone']]);
  });

  it('reports partner_not_reopenable as a conflict', async () => {
    const partner = await makePartner(db, { domain: 'live.example', status: 'active' });
    const app = await open({ status: 'approved', partnerId: partner.id, domain: 'live.example' });
    const result = await reopenApplicationAction({ id: app.id });
    expect(result).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });
});
```

Run:

`pnpm --filter @cleanstart/portal exec vitest run src/server/actions/applications.test.ts`
Expected: FAIL, `Failed to resolve import "./applications"`.

- [ ] **Step 11: Implement the actions**

Create `src/server/actions/applications.ts`. Requires H4.4 (`@/server/hubspot/outbox`).

```ts
'use server';

import { z } from 'zod';
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_REGIONS } from '@/lib/domain';
import type { ApplicationDto } from '@/lib/dto';
import type { ApplicationApprovalDto } from '@/lib/apply';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildApplicationApproved, buildApplicationDeclined } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { withViewer } from '@/server/repo/context';
import {
  approveApplication,
  declineApplication,
  getApplication,
  reopenApplication,
} from '@/server/repo/applications';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const idSchema = z.object({ id: z.string().uuid() });
const approveSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  managerId: z.string().uuid().optional(),
});
const declineSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Add a reason the applicant will see.').max(500),
});

export async function approveApplicationAction(raw: unknown): Promise<ActionResult<ApplicationApprovalDto>> {
  return runViewerAction({ name: 'application.approve', schema: approveSchema }, raw, async (ctx, input): Promise<ApplicationApprovalDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.approve');
      const before = await getApplication(tx, ctx.viewer, input.id);
      const result = await approveApplication(
        tx,
        ctx.viewer,
        { id: input.id, category: input.category, region: input.region, ...(input.managerId ? { managerId: input.managerId } : {}) },
        ctx.clock,
      );
      await recordAudit(tx, ctx.viewer, {
        event: 'application.approved',
        target: before.company,
        note: `Created ${result.partner.name} as ${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}. Invite sent to ${before.applicantName}.`,
        partnerId: result.partner.id,
        subject: { type: 'application', id: before.id },
      });
      // '1' for a new partner; a reopened application reuses its partner, so that second sync needs a new key (contracts G).
      await enqueue(tx, {
        op: 'partner.upsert',
        subjectId: result.partner.id,
        version: before.partnerId === null ? '1' : String(ctx.clock.now().getTime()),
      });
      return { before, result };
    });

    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationApproved({
          to: { email: done.before.email, name: done.before.applicantName },
          applicantName: done.before.applicantName,
          company: done.before.company,
          inviteUrl: inviteUrl(done.result.invite.token),
          expiresOn: done.result.invite.invite.expiresAt.slice(0, 10),
          managerName: done.result.partner.managerName,
        }),
      );
    });
    return { application: done.result.application, partner: done.result.partner };
  });
}

export async function declineApplicationAction(raw: unknown): Promise<ActionResult<ApplicationDto>> {
  return runViewerAction({ name: 'application.decline', schema: declineSchema }, raw, async (ctx, input): Promise<ApplicationDto> => {
    const declined = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.decline');
      const result = await declineApplication(tx, ctx.viewer, { id: input.id, reason: input.reason }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'application.declined',
        target: result.company,
        note: input.reason,
        subject: { type: 'application', id: result.id },
      });
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      await sendEmail(
        buildApplicationDeclined({
          to: { email: declined.email, name: declined.applicantName },
          applicantName: declined.applicantName,
          company: declined.company,
          reason: input.reason,
        }),
      );
    });
    return declined;
  });
}

export async function reopenApplicationAction(raw: unknown): Promise<ActionResult<ApplicationDto>> {
  return runViewerAction({ name: 'application.reopen', schema: idSchema }, raw, async (ctx, input): Promise<ApplicationDto> => {
    const reopened = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'application.reopen');
      const before = await getApplication(tx, ctx.viewer, input.id);
      const result = await reopenApplication(tx, ctx.viewer, { id: input.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'application.reopened',
        target: result.company,
        note: before.status === 'approved' ? 'Approval undone, invite withdrawn' : 'Decline undone',
        ...(result.partnerId ? { partnerId: result.partnerId } : {}),
        subject: { type: 'application', id: result.id },
      });
      if (before.status === 'approved' && result.partnerId) {
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partnerId, version: String(ctx.clock.now().getTime()) });
      }
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    return reopened;
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/applications.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 12: Add code-based badge wrappers**

In `src/components/partners/badges.tsx` add this line to the import block at the top:

```tsx
import { PARTNER_CATEGORY_LABEL, PARTNER_STATUS_LABEL, type PartnerCategory as PartnerCategoryCode, type PartnerStatus as PartnerStatusCode } from "@/lib/domain";
```

then append at the end of the file (keeping the label based components, which Company, the detail card and the table still use until M1.7 and M4.1):

```tsx
/** Same badges, fed with the stored codes instead of the mock's display strings. */
export function PartnerCategoryBadge({ category }: { category: PartnerCategoryCode }): React.JSX.Element {
  return <CategoryBadge category={PARTNER_CATEGORY_LABEL[category]} />;
}

export function PartnerStatusBadge({ status }: { status: PartnerStatusCode }): React.JSX.Element {
  return <StatusBadge status={PARTNER_STATUS_LABEL[status]} />;
}
```

The label strings of `PARTNER_CATEGORY_LABEL` ("Distributor", "Channel partner", "System integrator") and `PARTNER_STATUS_LABEL` ("Active", "Onboarding", "Inactive", "Suspended") equal the mock's unions, so they type-check against `PartnerCategory` and `PartnerStatus` from `@/data/partners`.

- [ ] **Step 13: Replace `applications-table.tsx`**

Replace `src/components/partners/applications-table.tsx` in full. Changes from the mock: DTO input, `fmtLong` for the date, a "Website form" or "Portal form" chip plus "Personal email" and "Domain already a partner" badges, the Approve button opens a category and region panel when the application has none, and the actions are only shown to a viewer who may decide.

```tsx
"use client";

import { Fragment, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { fmtLong } from "@/lib/dates";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
  type PartnerCategory,
  type PartnerRegion,
} from "@/lib/domain";
import type { ApplicationDto } from "@/lib/dto";
import { codeFromLabel } from "@/lib/people";
import { PartnerCategoryBadge } from "./badges";
import { Seg } from "./seg";

const DEFAULT_REASON = "We already have a partner covering this region and segment.";
const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);
const REGION_OPTIONS: readonly string[] = PARTNER_REGIONS.map((r) => PARTNER_REGION_LABEL[r]);

interface ApplicationsTableProps {
  applications: readonly ApplicationDto[];
  waiting: number;
  /** Only partner managers decide; other staff see the queue read-only. */
  canDecide: boolean;
  onApprove: (application: ApplicationDto, choice: { category: PartnerCategory; region: PartnerRegion }) => void;
  onDecline: (application: ApplicationDto, reason: string) => void;
  onUndo: (application: ApplicationDto) => void;
}

/** Icon row action, same markup as ActButton but able to carry a tour anchor. */
function RowAction({
  label,
  tip,
  tone,
  icon,
  onClick,
  tour,
}: {
  label: string;
  tip: string;
  tone: "ok" | "no";
  icon: "check" | "x";
  onClick: () => void;
  tour?: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className={`act act-${tone}`}
      aria-label={label}
      data-tip={tip}
      data-tour={tour}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );
}

export function ApplicationsTable({
  applications,
  waiting,
  canDecide,
  onApprove,
  onDecline,
  onUndo,
}: ApplicationsTableProps): React.JSX.Element {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [reasonTried, setReasonTried] = useState(false);
  const [categoryLabel, setCategoryLabel] = useState<string>(PARTNER_CATEGORY_LABEL.channel);
  const [regionLabel, setRegionLabel] = useState<string>(PARTNER_REGION_LABEL.india);
  const firstOpenId = applications.find((a) => a.status === "new")?.id;

  const startReject = (id: string): void => {
    setApprovingId(null);
    setRejectingId(id);
    setReason(DEFAULT_REASON);
    setReasonTried(false);
  };

  const startApprove = (application: ApplicationDto): void => {
    // A portal application already carries a category and region; a website entry needs the manager to set them.
    if (application.category && application.region) {
      onApprove(application, { category: application.category, region: application.region });
      return;
    }
    setRejectingId(null);
    setApprovingId(application.id);
    setCategoryLabel(application.category ? PARTNER_CATEGORY_LABEL[application.category] : PARTNER_CATEGORY_LABEL.channel);
    setRegionLabel(application.region ? PARTNER_REGION_LABEL[application.region] : PARTNER_REGION_LABEL.india);
  };

  const confirmApprove = (application: ApplicationDto): void => {
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, categoryLabel);
    const region = codeFromLabel(PARTNER_REGION_LABEL, regionLabel);
    if (!category || !region) return;
    setApprovingId(null);
    onApprove(application, { category, region });
  };

  const confirmReject = (application: ApplicationDto): void => {
    if (!reason.trim()) {
      setReasonTried(true);
      return;
    }
    setRejectingId(null);
    onDecline(application, reason);
  };

  return (
    <>
      <div className="toolbar">
        <span className="card-meta">
          From the Become a Partner form on cleanstart.com/partners and from /apply. New submissions first.
        </span>
        <span className="card-meta tnum">{waiting} waiting</span>
      </div>
      <div style={{ overflowX: "auto" }} data-tour="applications-list">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Company</th>
              <th scope="col">Applicant</th>
              <th scope="col">Wants to be</th>
              <th scope="col">Region</th>
              <th scope="col">Submitted</th>
              <th scope="col" className="r">
                Decision
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => {
              const rejecting = rejectingId === a.id && a.status === "new";
              const approving = approvingId === a.id && a.status === "new";
              return (
                <Fragment key={a.id}>
                  <tr>
                    <td>
                      <span className="li-t">
                        <span style={{ fontWeight: 600 }}>{a.company}</span>
                        <span className="li-s">{a.domain}</span>
                        <span style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                          <Badge tone="neutral">{a.source === "website" ? "Website form" : "Portal form"}</Badge>
                          {a.personalEmail ? <Badge tone="pending">Personal email</Badge> : null}
                          {a.existingDomain ? <Badge tone="violet">Domain already a partner</Badge> : null}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="li-t">
                        <span>{a.applicantName}</span>
                        <span className="li-s">{a.role ?? a.email}</span>
                      </span>
                    </td>
                    <td>{a.category ? <PartnerCategoryBadge category={a.category} /> : <span className="t-muted">Not set</span>}</td>
                    <td className="t-sec">{a.region ? PARTNER_REGION_LABEL[a.region] : <span className="t-muted">Not set</span>}</td>
                    <td className="tnum t-sec">{fmtLong(a.submittedAt)}</td>
                    <td className="r">
                      {a.status === "new" && !rejecting && !approving && canDecide ? (
                        <span className="acts">
                          <RowAction
                            label={`Reject ${a.company}`}
                            tip="Reject with a reason"
                            tone="no"
                            icon="x"
                            onClick={() => startReject(a.id)}
                          />
                          <RowAction
                            label={`Approve ${a.company}`}
                            tip="Approve and send the invite"
                            tone="ok"
                            icon="check"
                            onClick={() => startApprove(a)}
                            {...(a.id === firstOpenId ? { tour: "application-approve" } : {})}
                          />
                        </span>
                      ) : null}
                      {a.status === "new" && rejecting ? <Badge tone="neutral">Add a reason below</Badge> : null}
                      {a.status === "new" && approving ? <Badge tone="neutral">Choose below</Badge> : null}
                      {a.status !== "new" ? (
                        <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          {a.status === "approved" ? (
                            <Badge tone="accepted">Approved, invite sent</Badge>
                          ) : (
                            <Badge tone="rejected">Rejected, emailed</Badge>
                          )}
                          {canDecide ? (
                            <button
                              type="button"
                              className="btn btn-g"
                              onClick={() => onUndo(a)}
                              style={{ height: 24, padding: "0 6px", fontSize: 12 }}
                            >
                              Undo
                            </button>
                          ) : null}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                      <div className="note note-violet">
                        <span>
                          <b>Why they want to partner:</b> {a.reason ?? "Not given."}
                          {a.declineReason ? (
                            <>
                              <br />
                              <b>Reason sent:</b> {a.declineReason}
                            </>
                          ) : null}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {approving ? (
                    <tr>
                      <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                            padding: "8px 10px",
                            borderRadius: 7,
                            background: "#FCFCFD",
                            border: "1px solid #F0EFF4",
                          }}
                        >
                          <div className="fg">
                            <span id={`aa-cat-${a.id}`} className="lbl">
                              Partner type
                            </span>
                            <Seg options={CATEGORY_OPTIONS} value={categoryLabel} onChange={setCategoryLabel} labelledBy={`aa-cat-${a.id}`} />
                          </div>
                          <div className="fg">
                            <span id={`aa-reg-${a.id}`} className="lbl">
                              Region
                            </span>
                            <Seg options={REGION_OPTIONS} value={regionLabel} onChange={setRegionLabel} labelledBy={`aa-reg-${a.id}`} />
                          </div>
                          <button type="button" className="btn btn-s" onClick={() => setApprovingId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-p" onClick={() => confirmApprove(a)}>
                            Approve and send invite
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  {rejecting ? (
                    <tr>
                      <td colSpan={6} style={{ paddingTop: 0, whiteSpace: "normal" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-end",
                            flexWrap: "wrap",
                            padding: "8px 10px",
                            borderRadius: 7,
                            background: "#FCFCFD",
                            border: "1px solid #F0EFF4",
                          }}
                        >
                          <div className="fg" style={{ flex: "1 1 360px" }}>
                            <label htmlFor={`ar-${a.id}`} className="lbl">
                              Reason the applicant will see
                            </label>
                            <input
                              id={`ar-${a.id}`}
                              className={`field${reasonTried && !reason.trim() ? " field-err" : ""}`}
                              type="text"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              aria-invalid={reasonTried && !reason.trim() ? true : undefined}
                              aria-describedby={`ar-${a.id}-err`}
                            />
                            {reasonTried && !reason.trim() ? (
                              <span className="err" id={`ar-${a.id}-err`}>
                                Add a reason the applicant will see.
                              </span>
                            ) : null}
                          </div>
                          <button type="button" className="btn btn-s" onClick={() => setRejectingId(null)}>
                            Cancel
                          </button>
                          <button type="button" className="btn btn-dd" onClick={() => confirmReject(a)}>
                            Reject and email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {applications.length === 0 ? <div className="empty">No applications yet.</div> : null}
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid #F0EFF4" }}>
        <span className="hint">
          Approving creates the partner company, makes the applicant its partner admin, and emails them an invite to
          set a password and accept the partner agreement.
        </span>
      </div>
    </>
  );
}
```

- [ ] **Step 14: Convert the Applications tab in `AdminPartners.tsx`**

Edit `src/components/screens/AdminPartners.tsx`.

Edit 1, imports. Before:

```tsx
import {
  addPartner,
  approveApplication,
  declineApplication,
  type NewPartnerInput,
  partnersSlice,
  reopenApplication,
  resendInvites,
  setPartnerCategory,
  setPartnerManager,
  setPartnerSuspended,
  UNLISTED_ACTIVE_PARTNERS,
} from "@/data/partners";

type Tab = "Partners" | "Applications";

export function AdminPartners(): React.JSX.Element {
  const toast = useToast();
  const { partners, applications } = partnersSlice.use();
```

After:

```tsx
import {
  addPartner,
  type NewPartnerInput,
  partnersSlice,
  resendInvites,
  setPartnerCategory,
  setPartnerManager,
  setPartnerSuspended,
  UNLISTED_ACTIVE_PARTNERS,
} from "@/data/partners";
import type { ApplicationDto } from "@/lib/dto";
import type { ActionResult } from "@/server/actions/result";
import {
  approveApplicationAction,
  declineApplicationAction,
  reopenApplicationAction,
} from "@/server/actions/applications";

type Tab = "Partners" | "Applications";

interface AdminPartnersProps {
  applications: ApplicationDto[];
  /** Applications with status new, from countNewApplications. */
  waiting: number;
  /** Partner managers decide on applications; other staff see the list. */
  canDecide: boolean;
}

export function AdminPartners({ applications, waiting, canDecide }: AdminPartnersProps): React.JSX.Element {
  const toast = useToast();
  const { partners } = partnersSlice.use();
```

Edit 2, remove the derived count. Before:

```tsx
  const inactive = partners.filter((p) => p.status === "Inactive").length;
  const waiting = applications.filter((a) => a.status === "New").length;
```

After:

```tsx
  const inactive = partners.filter((p) => p.status === "Inactive").length;

  const report = async (result: Promise<ActionResult<unknown>>, success: string): Promise<void> => {
    const done = await result;
    toast(done.ok ? success : done.error.message);
  };
```

Edit 3, the table usage. Before:

```tsx
            <ApplicationsTable
              applications={applications}
              waiting={waiting}
              onApprove={(a) => {
                approveApplication(a.id);
                toast(`Approved ${a.company}. Invite sent to ${a.applicant}`);
              }}
              onDecline={(a, reason) => {
                declineApplication(a.id, reason);
                toast(`Rejected ${a.company}. ${a.applicant} has been emailed`);
              }}
              onUndo={(a) => {
                reopenApplication(a.id);
                toast(`${a.company} is back in the queue`);
              }}
            />
```

After:

```tsx
            <ApplicationsTable
              applications={applications}
              waiting={waiting}
              canDecide={canDecide}
              onApprove={(a, choice) =>
                void report(
                  approveApplicationAction({ id: a.id, category: choice.category, region: choice.region }),
                  `Approved ${a.company}. Invite sent to ${a.applicantName}`,
                )
              }
              onDecline={(a, reason) =>
                void report(
                  declineApplicationAction({ id: a.id, reason }),
                  `Rejected ${a.company}. ${a.applicantName} has been emailed`,
                )
              }
              onUndo={(a) => void report(reopenApplicationAction({ id: a.id }), `${a.company} is back in the queue`)}
            />
```

- [ ] **Step 15: Load the applications in the page**

Replace `src/app/admin/partners/page.tsx` in full. At this stage it passes the Applications tab data; M4.1 extends it with the partner list.

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPartners } from "@/components/screens/AdminPartners";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { countNewApplications, listApplications } from "@/server/repo/applications";

export const metadata: Metadata = { title: "Partners" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.read");
  const canDecide = can(viewer, "application.approve");
  const data = canDecide
    ? await withViewer(viewer, async (tx) => ({
        applications: await listApplications(tx, viewer, {}),
        waiting: await countNewApplications(tx, viewer),
      }))
    : { applications: [], waiting: 0 };
  return (
    <Suspense fallback={null}>
      <AdminPartners applications={data.applications} waiting={data.waiting} canDecide={canDecide} />
    </Suspense>
  );
}
```

- [ ] **Step 16: Prove the Applications tab has no slice left**

Run: `grep -n "approveApplication\|declineApplication\|reopenApplication\|\.applications" src/components/screens/AdminPartners.tsx src/components/partners/applications-table.tsx`
Expected: only the three `...ApplicationAction` imports and calls and the `applications` prop; no import from `@/data/partners` of those functions.

- [ ] **Step 17: Gate A**

Run the Gate A block. The last command must list only the files in this task's Files block plus `src/server/repo/applications.test.ts`.

- [ ] **Step 18: Manual check (signed in as `farhan.qureshi@cleanstart.com`, the seed password from `DEV_SEED_PASSWORD`, route `/admin/partners?tab=applications`)**

1. Applications tab shows the 3 seed applications (Tidewater, Falcon Ridge, Lattice Cloud) plus any from M1.3 and M1.3b, each with a "Portal form" or "Website form" chip; the website rows show "Not set" under category and region and the Nair row shows "Personal email".
2. Approve "Lattice Cloud Services" (a portal row): toast "Approved Lattice Cloud Services. Invite sent to Ritu Menon". The row shows "Approved, invite sent" and Undo. `psql ... -c "select op, subject_id, idempotency_key from hubspot_outbox"` has a `partner.upsert` row with key ending `:1`; `select event, note from audit_log order by at desc limit 1` shows `application.approved`.
3. Click Undo: row back in the queue; `select status from partners where name = 'Lattice Cloud Services'` is `inactive`; the invite is revoked. Approve again: same partner id, status `onboarding`.
4. Approve the "Falcon Ridge IT" website row: an inline panel appears with partner type and region; choose Distributor and Middle East, then "Approve and send invite". The partner is routed to Omar Nasser.
5. Reject "Nair Security Consulting" with the default reason: toast, row shows "Rejected, emailed", the dev email log line shows an email was built for the applicant.
6. Sign in as `rahul.menon@cleanstart.com` (staff sales): the tab loads but the Approve and Reject buttons are absent.

- [ ] **Step 19: Commit**

```bash
git add apps/portal/src/server/invite-core.ts apps/portal/src/server/invite-core.test.ts \
  apps/portal/src/server/partner-routing.ts apps/portal/src/server/partner-routing.test.ts \
  apps/portal/src/server/partner-rows.ts apps/portal/src/server/partner-rows.test.ts \
  apps/portal/src/server/repo/applications.ts apps/portal/src/server/repo/applications.test.ts \
  apps/portal/src/lib/apply.ts \
  apps/portal/src/server/actions/applications.ts apps/portal/src/server/actions/applications.test.ts \
  apps/portal/src/components/partners/badges.tsx apps/portal/src/components/partners/applications-table.tsx \
  apps/portal/src/components/screens/AdminPartners.tsx apps/portal/src/app/admin/partners/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.4 application review in admin"
```

---
### Task M1.5: Invites and first login

Implements master task 1.5. A token is 32 random bytes, stored only as SHA-256, valid 7 days, single use. Accepting sets the password (the rule is enforced on the server), records the agreement version and time for a new partner's first admin, creates the user and signs them in. Expired, reused, withdrawn and tampered tokens each fail with a distinct message. `PartnerWelcome` (the first screen after accepting) and the partner manager message drawer are converted here because they share this flow.

**Files:**
- Modify: `src/lib/people.ts`, `src/lib/people.test.ts`
- Create: `src/lib/invites.ts`
- Create: `src/server/partner-scope.ts`
- Create: `src/server/repo/invites.ts`, `src/server/repo/invites.test.ts`
- Create: `src/server/repo/partners.ts`, `src/server/repo/partners.test.ts`
- Create: `src/server/invite-preview.ts`, `src/server/invite-preview.test.ts`
- Create: `src/server/actions/invites.ts`, `src/server/actions/invites.test.ts`
- Create: `src/server/actions/partners.ts`, `src/server/actions/partners.test.ts`
- Create: `scripts/dev-invite-link.ts`
- Modify: `src/components/screens/AcceptInvite.tsx`, `src/components/screens/PartnerWelcome.tsx`, `src/components/partners/message-drawer.tsx`, `src/app/(public)/accept-invite/page.tsx`, `src/app/partner/welcome/page.tsx`

- [ ] **Step 1: Verify the Better Auth server sign-in API (fallback documented)**

The accept action signs the new user in on the server so they land on the welcome page without a second form. Verify the installed Better Auth exposes `auth.api.signInEmail` and the Next cookie plugin:

```bash
grep -n "signInEmail" apps/portal/node_modules/better-auth/dist/api/routes/sign-in.d.mts | head -2
grep -n "nextCookies" apps/portal/node_modules/better-auth/dist/integrations/next-js.d.mts | head -2
grep -n "nextCookies" apps/portal/src/server/auth/auth.ts
```

Expected: each command prints at least one line. If the third prints nothing, the W0-f auth instance lacks the `nextCookies` plugin, so cookies set inside a server action would not persist: do not edit `auth.ts` (not this plan's file); write a `blocked` line naming `src/server/auth/auth.ts` (add `nextCookies()` last in `plugins`) and carry on: the action below already degrades to `signedIn: false` and sends the person to `/sign-in`, which is the documented fallback.

- [ ] **Step 2: Add the staff team label helper**

Append to `src/lib/people.test.ts` (inside a new `describe`) and `src/lib/people.ts`:

```ts
// people.test.ts
import { staffTeamLabel } from './people';

describe('staffTeamLabel', () => {
  it('names the CleanStart team for a region', () => {
    expect(staffTeamLabel('india')).toBe('CleanStart India');
    expect(staffTeamLabel('middle_east')).toBe('CleanStart Middle East');
    expect(staffTeamLabel('all')).toBe('CleanStart');
    expect(staffTeamLabel(null)).toBe('CleanStart');
  });
});
```

```ts
// people.ts (add the type to the existing domain import: StaffRegion)
/** "CleanStart India", "CleanStart Middle East", or plain "CleanStart" for every region or an unknown one. */
export const staffTeamLabel = (region: StaffRegion | null): string =>
  region === 'india' ? 'CleanStart India' : region === 'middle_east' ? 'CleanStart Middle East' : 'CleanStart';
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/people.test.ts`
Expected: PASS.

- [ ] **Step 3: Create the shared invite types**

Create `src/lib/invites.ts`:

```ts
/** What acceptInviteAction tells the form. redirectTo is where to go next; signedIn false means sign in first. */
export interface AcceptInviteOutcome {
  signedIn: boolean;
  redirectTo: string;
}

/** 20 invite lookups or accepts per IP in 10 minutes. */
export const INVITE_IP_RULE = { limit: 20, windowSeconds: 600 } as const;
```

- [ ] **Step 4: Write the failing repo tests for preview and accept**

Create `src/server/repo/invites.test.ts` (M1.6 appends to it):

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import { makeApplication, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { withSystem } from './context';
import { type AcceptInviteInput, acceptInvite, previewInvite } from './invites';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Invitee');
const future = new Date('2026-11-19T10:00:00Z');

const preview = (token: string) => withSystem(actor, (tx) => previewInvite(tx, actor, token, clock));
const accept = (token: string, overrides: Partial<AcceptInviteInput> = {}) =>
  withSystem(actor, (tx) =>
    acceptInvite(tx, actor, { token, name: 'Yasmin Haddad', passwordHash: 'scrypt$test$hash', acceptAgreement: true, agreementVersion: 'draft-0', ...overrides }, clock),
  );
const tamper = (token: string): string => `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;

beforeEach(async () => {
  await resetDb(db);
});

const firstAdmin = async (email = 'yasmin.haddad@qamarsolutions.ae') => {
  const partner = await makePartner(db, { name: 'Qamar Solutions', domain: 'qamarsolutions.ae', status: 'onboarding' });
  const made = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email, expiresAt: future });
  return { partner, ...made };
};

describe('previewInvite', () => {
  it('describes a valid invite for a new partner admin, including the agreement need and a suggested name', async () => {
    const { partner, token } = await firstAdmin();
    await makeApplication(db, { partnerId: partner.id, status: 'approved', applicantName: 'Yasmin Haddad', email: 'yasmin.haddad@qamarsolutions.ae', source: 'portal' });
    expect(await preview(token)).toEqual({
      state: 'ok',
      email: 'yasmin.haddad@qamarsolutions.ae',
      kind: 'partner',
      role: 'partner_admin',
      partnerName: 'Qamar Solutions',
      name: 'Yasmin Haddad',
      needsAgreement: true,
    });
  });

  it('does not ask a second admin of an active partner to accept the agreement again', async () => {
    const partner = await makePartner(db, { status: 'active' });
    await db.update(partners).set({ agreementVersion: '1.2', agreementAcceptedAt: new Date('2026-03-12T00:00:00Z') }).where(eq(partners.id, partner.id));
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'second@example.com', expiresAt: future });
    expect(await preview(token)).toMatchObject({ state: 'ok', needsAgreement: false, agreementVersion: '1.2' });
  });

  it('gives each failure its own state: unknown (tampered), expired, used and revoked', async () => {
    const partner = await makePartner(db, {});
    const make = (extra: Partial<typeof invites.$inferInsert>) =>
      makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random().toString(36).slice(2)}@example.com`, expiresAt: future, ...extra });
    const ok = await make({});
    expect(await preview(tamper(ok.token))).toEqual({ state: 'unknown' });
    expect(await preview('')).toEqual({ state: 'unknown' });
    expect(await preview('x'.repeat(500))).toEqual({ state: 'unknown' });
    expect(await preview((await make({ expiresAt: new Date('2026-11-01T00:00:00Z') })).token)).toEqual({ state: 'expired' });
    expect(await preview((await make({ acceptedAt: new Date('2026-11-05T00:00:00Z') })).token)).toEqual({ state: 'used' });
    expect(await preview((await make({ revokedAt: new Date('2026-11-05T00:00:00Z') })).token)).toEqual({ state: 'revoked' });
  });
});

describe('acceptInvite', () => {
  it('creates the active user, the credential account and stamps the agreement for a first admin', async () => {
    const { partner, invite, token } = await firstAdmin();
    const result = await accept(token);
    expect(result).toMatchObject({ email: 'yasmin.haddad@qamarsolutions.ae', kind: 'partner', role: 'partner_admin', partnerId: partner.id, partnerName: 'Qamar Solutions', agreementAccepted: true });
    const [user] = await db.select().from(users).where(eq(users.id, result.userId));
    expect(user).toMatchObject({ name: 'Yasmin Haddad', status: 'active', emailVerified: true, kind: 'partner', partnerId: partner.id, role: 'partner_admin' });
    expect(user?.passwordChangedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, result.userId));
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ providerId: 'credential', accountId: result.userId, password: 'scrypt$test$hash' });
    const [stamped] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(stamped).toMatchObject({ agreementVersion: 'draft-0' });
    expect(stamped?.agreementAcceptedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const [used] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(used?.acceptedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    expect(used?.userId).toBe(result.userId);
  });

  it('is single use: the second attempt fails as used, also when two arrive at once', async () => {
    const { token } = await firstAdmin();
    await accept(token);
    await expect(accept(token)).rejects.toMatchObject({ reason: 'invite_used' });
  });

  it('lets exactly one of two simultaneous accepts win', async () => {
    const { token } = await firstAdmin();
    const results = await Promise.allSettled([accept(token), accept(token)]);
    expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    const lost = results.find((r) => r.status === 'rejected');
    expect(lost && lost.status === 'rejected' && (lost.reason as { reason?: string }).reason).toBe('invite_used');
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it('fails with a distinct reason for tampered, expired and withdrawn tokens and consumes nothing', async () => {
    const partner = await makePartner(db, {});
    const make = (extra: Partial<typeof invites.$inferInsert>) =>
      makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: `${Math.random().toString(36).slice(2)}@example.com`, expiresAt: future, ...extra });
    const good = await make({});
    await expect(accept(tamper(good.token))).rejects.toMatchObject({ reason: 'invite_unknown' });
    await expect(accept((await make({ expiresAt: new Date('2026-11-01T00:00:00Z') })).token)).rejects.toMatchObject({ reason: 'invite_expired' });
    await expect(accept((await make({ revokedAt: new Date('2026-11-05T00:00:00Z') })).token)).rejects.toMatchObject({ reason: 'invite_revoked' });
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('refuses a first admin who does not accept the agreement, without consuming the invite', async () => {
    const { invite, token } = await firstAdmin();
    await expect(accept(token, { acceptAgreement: false })).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'acceptAgreement' }] });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.acceptedAt).toBeNull();
    expect(await db.select().from(users)).toHaveLength(0);
  });

  it('refuses an empty name', async () => {
    const { token } = await firstAdmin();
    await expect(accept(token, { name: '   ' })).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'name' }] });
  });

  it('refuses an email that already has an active login and leaves the invite open', async () => {
    const { partner, invite, token } = await firstAdmin();
    await makeUser(db, { partnerId: partner.id, email: 'yasmin.haddad@qamarsolutions.ae', status: 'active' });
    await expect(accept(token)).rejects.toMatchObject({ reason: 'already_has_login' });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.acceptedAt).toBeNull();
  });

  it('gives a removed person their account back with the new password and no two-step secret', async () => {
    const partner = await makePartner(db, { status: 'active' });
    const gone = await makeUser(db, { partnerId: partner.id, email: 'back@example.com', status: 'disabled', role: 'sales', password: 'OldPassw0rd!' });
    await db.insert(authTwoFactors).values({ secret: 's', backupCodes: 'b', userId: gone.id });
    await db.update(users).set({ removedAt: new Date('2026-10-01T00:00:00Z'), twoFactorEnabled: true }).where(eq(users.id, gone.id));
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'back@example.com', expiresAt: future });
    const result = await accept(token, { name: 'Back Again' });
    expect(result.userId).toBe(gone.id);
    const [user] = await db.select().from(users).where(eq(users.id, gone.id));
    expect(user).toMatchObject({ status: 'active', removedAt: null, role: 'technical', name: 'Back Again', twoFactorEnabled: false });
    const accounts = await db.select().from(authAccounts).where(eq(authAccounts.userId, gone.id));
    expect(accounts.map((a) => a.password)).toEqual(['scrypt$test$hash']);
    expect(await db.select().from(authTwoFactors).where(eq(authTwoFactors.userId, gone.id))).toHaveLength(0);
  });

  it('creates the staff scope for a staff invite and no agreement is stamped', async () => {
    const { token } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'middle_east', email: 'sara@cleanstart.com', expiresAt: future });
    const result = await accept(token, { name: 'Sara Al Mansoori' });
    expect(result).toMatchObject({ kind: 'staff', role: 'sales', partnerId: null, partnerName: null, agreementAccepted: false });
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, result.userId));
    expect(scope?.region).toBe('middle_east');
  });
});
```

Run:

`pnpm --filter @cleanstart/portal exec vitest run src/server/repo/invites.test.ts`
Expected: FAIL, `Failed to resolve import "./invites"`.

- [ ] **Step 5: Implement preview and accept**

Create `src/server/repo/invites.ts` (M1.6 adds the other four functions):

```ts
import { and, eq } from 'drizzle-orm';
import { applications, authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { PartnerRole, StaffRole, UserKind } from '@/lib/domain';
import type { InvitePreviewDto, InviteState } from '@/lib/dto';
import type { SystemActor } from '@/server/auth/types';
import { hashToken, inviteState } from '@/server/auth/tokens';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

export interface AcceptInviteInput {
  token: string;
  name: string;
  /** Produced by hashPassword() in the action, after assertPasswordOk. The repo never sees the clear password. */
  passwordHash: string;
  /** Required true when the preview says needsAgreement. */
  acceptAgreement: boolean;
  agreementVersion: string;
}

export interface AcceptInviteResult {
  userId: string;
  email: string;
  kind: UserKind;
  role: PartnerRole | StaffRole;
  partnerId: string | null;
  partnerName: string | null;
  agreementAccepted: boolean;
}

/** A real token is 43 characters; anything much longer is junk and never reaches the hash lookup. */
const MAX_TOKEN_LENGTH = 200;

const stateError = (state: Exclude<InviteState, 'ok'>): ConflictError => {
  switch (state) {
    case 'expired':
      return new ConflictError('invite_expired', 'This invite has expired. Ask for a new one.');
    case 'used':
      return new ConflictError('invite_used', 'This invite was already used. Sign in instead.');
    case 'revoked':
      return new ConflictError('invite_revoked', 'This invite was withdrawn. Ask for a new one.');
    case 'unknown':
      return new ConflictError('invite_unknown', 'This invite link is not valid.');
  }
};

/** A partner's first admin on an onboarding partner that has not signed the agreement yet. */
const needsAgreementFor = (
  invite: { kind: UserKind; role: string },
  partner: { status: string; agreementAcceptedAt: Date | null } | undefined,
): boolean =>
  invite.kind === 'partner' && invite.role === 'partner_admin' && partner?.status === 'onboarding' && partner.agreementAcceptedAt === null;

/** Public (M1.5). State only, never throws for a bad token: distinct states for expired, used, revoked and unknown (tampered). */
export async function previewInvite(tx: Tx, _actor: SystemActor, token: string, clock: Clock): Promise<InvitePreviewDto> {
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return { state: 'unknown' };
  const [invite] = await tx.select().from(invites).where(eq(invites.tokenHash, hashToken(token))).limit(1);
  if (!invite) return { state: 'unknown' };
  const state = inviteState(invite, clock.now());
  if (state !== 'ok') return { state };

  const [partner] = invite.partnerId ? await tx.select().from(partners).where(eq(partners.id, invite.partnerId)).limit(1) : [];
  const [application] = invite.partnerId
    ? await tx
        .select({ name: applications.applicantName })
        .from(applications)
        .where(and(eq(applications.partnerId, invite.partnerId), eq(applications.email, invite.email), eq(applications.status, 'approved')))
        .limit(1)
    : [];
  return {
    state: 'ok',
    email: invite.email,
    kind: invite.kind,
    role: invite.role as PartnerRole | StaffRole,
    partnerName: partner?.name ?? null,
    name: application?.name ?? null,
    needsAgreement: needsAgreementFor(invite, partner),
    ...(partner?.agreementVersion ? { agreementVersion: partner.agreementVersion } : {}),
  };
}

/**
 * Public (M1.5). One transaction: marks the invite accepted (single use), creates the users row (status 'active'),
 * the Better Auth credential account with `passwordHash`, the staff_scopes row for a staff invite, stamps the partner
 * agreement for a partner admin of an onboarding partner, and returns what the action needs to enqueue user.upsert,
 * audit and notify. Throws ConflictError('invite_expired' | 'invite_used' | 'invite_revoked' | 'invite_unknown'),
 * ConflictError('already_has_login') and ValidationError when the agreement is required and not accepted.
 * The invite row is locked first, so two simultaneous accepts serialise and the second sees it as used.
 */
export async function acceptInvite(tx: Tx, _actor: SystemActor, input: AcceptInviteInput, clock: Clock): Promise<AcceptInviteResult> {
  if (input.token.length === 0 || input.token.length > MAX_TOKEN_LENGTH) throw stateError('unknown');
  const [invite] = await tx.select().from(invites).where(eq(invites.tokenHash, hashToken(input.token))).limit(1).for('update');
  if (!invite) throw stateError('unknown');
  const state = inviteState(invite, clock.now());
  if (state !== 'ok') throw stateError(state);

  const [partner] = invite.partnerId
    ? await tx.select().from(partners).where(eq(partners.id, invite.partnerId)).limit(1).for('update')
    : [];
  if (invite.kind === 'partner' && !partner) throw new NotFoundError('partner');

  const needsAgreement = needsAgreementFor(invite, partner);
  const name = input.name.trim();
  const issues = [
    ...(name ? [] : [{ path: 'name', message: 'Enter your name.' }]),
    ...(needsAgreement && !input.acceptAgreement ? [{ path: 'acceptAgreement', message: 'Accept the agreement to continue.' }] : []),
  ];
  if (issues.length > 0) throw new ValidationError(issues);

  const now = clock.now();
  const [existing] = await tx.select().from(users).where(eq(users.email, invite.email)).limit(1).for('update');
  let userId: string;
  if (existing) {
    if (existing.status !== 'disabled') {
      throw new ConflictError('already_has_login', 'This email already has a portal login. Sign in instead.');
    }
    // A removed person invited again gets the same account back, with a new password and no old two-step secret.
    await tx
      .update(users)
      .set({
        name,
        kind: invite.kind,
        partnerId: invite.partnerId,
        role: invite.role,
        status: 'active',
        emailVerified: true,
        removedAt: null,
        invitedAt: invite.createdAt,
        passwordChangedAt: now,
        twoFactorEnabled: false,
      })
      .where(eq(users.id, existing.id));
    await tx.delete(authAccounts).where(and(eq(authAccounts.userId, existing.id), eq(authAccounts.providerId, 'credential')));
    await tx.delete(authTwoFactors).where(eq(authTwoFactors.userId, existing.id));
    userId = existing.id;
  } else {
    const [created] = await tx
      .insert(users)
      .values({
        email: invite.email,
        name,
        emailVerified: true,
        kind: invite.kind,
        partnerId: invite.partnerId,
        role: invite.role,
        status: 'active',
        invitedAt: invite.createdAt,
        passwordChangedAt: now,
      })
      .onConflictDoNothing({ target: users.email })
      .returning({ id: users.id });
    if (!created) throw new ConflictError('already_has_login', 'This email already has a portal login. Sign in instead.');
    userId = created.id;
  }

  await tx.insert(authAccounts).values({ accountId: userId, providerId: 'credential', userId, password: input.passwordHash });
  if (invite.kind === 'staff' && invite.staffRegion) {
    await tx
      .insert(staffScopes)
      .values({ userId, region: invite.staffRegion })
      .onConflictDoUpdate({ target: staffScopes.userId, set: { region: invite.staffRegion } });
  }
  if (needsAgreement && partner) {
    await tx.update(partners).set({ agreementVersion: input.agreementVersion, agreementAcceptedAt: now }).where(eq(partners.id, partner.id));
  }
  await tx.update(invites).set({ acceptedAt: now, userId }).where(eq(invites.id, invite.id));

  return {
    userId,
    email: invite.email,
    kind: invite.kind,
    role: invite.role as PartnerRole | StaffRole,
    partnerId: invite.partnerId,
    partnerName: partner?.name ?? null,
    agreementAccepted: needsAgreement,
  };
}

export const isolation = defineIsolation<'previewInvite' | 'acceptInvite'>({
  previewInvite: { scope: 'public', reason: 'Public invite page. Takes a SystemActor; covered by invites.test.ts.' },
  acceptInvite: { scope: 'public', reason: 'Public invite flow. Takes a SystemActor; covered by invites.test.ts and actions/invites.test.ts.' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/invites.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Write the failing partner repo tests (company and checklist)**

Create `src/server/repo/partners.test.ts` (M1.7 and M4.1 append to it):

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { withSystem, withViewer } from './context';
import { getChecklist, getCompany, listPartnerAdminRecipients, tickChecklistStep } from './partners';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('getCompany', () => {
  it('returns the company with its manager, agreement and the not-assigned tier', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi', email: 'farhan@cleanstart.com' });
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel', region: 'india', managerId: manager.id });
    await db.update(partners).set({ website: 'kestrelsystems.in', phone: '+91 80 4718 2290', about: 'Security reseller.', agreementVersion: '1.2', agreementAcceptedAt: new Date('2026-03-12T14:06:00Z') }).where(eq(partners.id, partner.id));
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const company = await withViewer(viewer, (tx) => getCompany(tx, viewer, {}));
    expect(company).toMatchObject({
      partnerId: partner.id,
      name: 'Kestrel Systems',
      domain: 'kestrelsystems.in',
      category: 'channel',
      region: 'india',
      website: 'kestrelsystems.in',
      phone: '+91 80 4718 2290',
      address: null,
      about: 'Security reseller.',
      tier: null,
      agreementVersion: '1.2',
      agreementAcceptedAt: '2026-03-12T14:06:00.000Z',
      manager: { id: manager.id, name: 'Farhan Qureshi', email: 'farhan@cleanstart.com', team: 'CleanStart India' },
    });
  });

  it('has no manager when none is assigned and refuses another partner id', async () => {
    const mine = await makePartner(db, {});
    const other = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: mine.id });
    expect((await withViewer(viewer, (tx) => getCompany(tx, viewer, {}))).manager).toBeNull();
    await expect(withViewer(viewer, (tx) => getCompany(tx, viewer, { partnerId: other.id }))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('lets staff read a company by id, needs the id, and hides other regions from staff sales', async () => {
    const india = await makePartner(db, { region: 'india' });
    const gulf = await makePartner(db, { region: 'middle_east' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    expect((await withViewer(manager, (tx) => getCompany(tx, manager, { partnerId: gulf.id }))).partnerId).toBe(gulf.id);
    await expect(withViewer(manager, (tx) => getCompany(tx, manager, {}))).rejects.toMatchObject({ code: 'validation' });
    const sales = await asStaff(db, 'sales', 'india');
    expect((await withViewer(sales, (tx) => getCompany(tx, sales, { partnerId: india.id }))).partnerId).toBe(india.id);
    await expect(withViewer(sales, (tx) => getCompany(tx, sales, { partnerId: gulf.id }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('welcome checklist', () => {
  it('derives agreement, company, team and deal from data and stores kickoff and playbook', async () => {
    const partner = await makePartner(db, { status: 'onboarding' });
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const stepsOf = (c: Awaited<ReturnType<typeof getChecklist>>) => Object.fromEntries(c.steps.map((s) => [s.step, s.done]));

    let checklist = await withViewer(viewer, (tx) => getChecklist(tx, viewer));
    expect(checklist.steps.map((s) => s.step)).toEqual(['agreement', 'company', 'team', 'kickoff', 'playbook', 'deal']);
    expect(stepsOf(checklist)).toEqual({ agreement: false, company: false, team: false, kickoff: false, playbook: false, deal: false });
    expect(checklist.percent).toBe(0);

    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-11-12T09:00:00Z'), agreementVersion: 'draft-0', website: 'x.example', about: 'We sell.' }).where(eq(partners.id, partner.id));
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'new@example.com', expiresAt: new Date('2026-11-19T00:00:00Z') });
    await makeRegistration(db, { partnerId: partner.id });
    checklist = await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, clock));
    expect(stepsOf(checklist)).toEqual({ agreement: true, company: true, team: true, kickoff: true, playbook: false, deal: true });
    expect(checklist.steps.find((s) => s.step === 'agreement')?.doneAt).toBe('2026-11-12T09:00:00.000Z');
    expect(checklist.percent).toBe(83);
  });

  it('ticks a stored step once and refuses a derived step', async () => {
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'playbook' }, clock));
    const again = await withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'playbook' }, fixedClock('2026-11-13T10:00:00Z')));
    expect(again.steps.find((s) => s.step === 'playbook')).toEqual({ step: 'playbook', done: true, doneAt: '2026-11-12T10:00:00.000Z' });
    await expect(withViewer(viewer, (tx) => tickChecklistStep(tx, viewer, { step: 'agreement' } as unknown as Parameters<typeof tickChecklistStep>[2], clock))).rejects.toMatchObject({ code: 'validation' });
  });

  it('is for partner viewers only', async () => {
    const staff = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(staff, (tx) => getChecklist(tx, staff))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('listPartnerAdminRecipients', () => {
  it('returns the active partner admins of that partner only', async () => {
    const a = await makePartner(db, {});
    const b = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: a.id, role: 'partner_admin', name: 'Aditi', email: 'aditi@a.example' });
    await makeUser(db, { partnerId: a.id, role: 'sales' });
    await makeUser(db, { partnerId: a.id, role: 'partner_admin', status: 'disabled' });
    await makeUser(db, { partnerId: b.id, role: 'partner_admin' });
    const actor = publicActor('x');
    const rows = await withSystem(actor, (tx) => listPartnerAdminRecipients(tx, { partnerId: a.id }));
    expect(rows).toEqual([{ userId: admin.id, email: 'aditi@a.example', name: 'Aditi' }]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts`
Expected: FAIL, `Failed to resolve import "./partners"`.

- [ ] **Step 7: Implement the partner scope helper and the M1.5 partner repo functions**

Create `src/server/partner-scope.ts`:

```ts
import { NotFoundError, ValidationError } from '@/server/errors';
import type { Viewer } from '@/server/auth/types';

/**
 * Which partner a repo call is about. A partner viewer always means their own company; naming another one is a
 * NotFoundError so ids cannot be probed. Staff must name the partner.
 */
export const resolvePartnerScope = (viewer: Viewer, requested: string | undefined): string => {
  if (viewer.kind === 'partner') {
    if (requested !== undefined && requested !== viewer.partnerId) throw new NotFoundError('partner');
    return viewer.partnerId;
  }
  if (!requested) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
  return requested;
};
```

Create `src/server/repo/partners.ts` (M1.7 and M4.1 add functions):

```ts
import { and, eq, isNull, ne } from 'drizzle-orm';
import { invites, partnerChecklist, partners, registrations, staffScopes, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { CHECKLIST_STEPS, type ChecklistStep } from '@/lib/domain';
import type { ChecklistDto, CompanyDto } from '@/lib/dto';
import { staffTeamLabel } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { iso } from '@/server/people';
import { resolvePartnerScope } from '@/server/partner-scope';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';

type PartnerRow = typeof partners.$inferSelect;

const toCompany = async (tx: Tx, p: PartnerRow): Promise<CompanyDto> => {
  const [manager] = p.managerId
    ? await tx
        .select({ id: users.id, name: users.name, email: users.email, region: staffScopes.region })
        .from(users)
        .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
        .where(eq(users.id, p.managerId))
        .limit(1)
    : [];
  return {
    partnerId: p.id,
    name: p.name,
    domain: p.domain,
    category: p.category,
    region: p.region,
    status: p.status,
    website: p.website,
    phone: p.phone,
    address: p.address,
    about: p.about,
    tier: null,
    since: p.createdAt.toISOString().slice(0, 10),
    manager: manager ? { id: manager.id, name: manager.name, email: manager.email, team: staffTeamLabel(manager.region) } : null,
    agreementVersion: p.agreementVersion,
    agreementAcceptedAt: iso(p.agreementAcceptedAt),
  };
};

/** Partner viewers: their own company. Staff: pass partnerId. Staff sales only see partners in their region. (M1.5, M1.7) */
export async function getCompany(tx: Tx, viewer: Viewer, input: { partnerId?: string }): Promise<CompanyDto> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [partner] = await tx.select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');
  if (viewer.kind === 'staff' && viewer.role === 'sales' && viewer.region !== 'all' && partner.region !== viewer.region) {
    throw new NotFoundError('partner');
  }
  return toCompany(tx, partner);
}

/** The welcome checklist of the viewer's partner (M1.5). Partner viewers only. */
export async function getChecklist(tx: Tx, viewer: Viewer): Promise<ChecklistDto> {
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  const [partner] = await tx.select().from(partners).where(eq(partners.id, viewer.partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');

  const members = await tx
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.partnerId, partner.id), ne(users.status, 'disabled')));
  const open = await tx
    .select({ email: invites.email })
    .from(invites)
    .where(and(eq(invites.partnerId, partner.id), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)));
  const people = new Set([...members.map((m) => m.email), ...open.map((i) => i.email)]);
  const [anyDeal] = await tx.select({ id: registrations.id }).from(registrations).where(eq(registrations.partnerId, partner.id)).limit(1);
  const stored = await tx.select().from(partnerChecklist).where(eq(partnerChecklist.partnerId, partner.id));

  const derived: Record<ChecklistStep, { done: boolean; doneAt: string | null } | undefined> = {
    agreement: { done: partner.agreementAcceptedAt !== null, doneAt: iso(partner.agreementAcceptedAt) },
    company: { done: Boolean(partner.website?.trim() && partner.about?.trim()), doneAt: null },
    team: { done: people.size >= 2, doneAt: null },
    kickoff: undefined,
    playbook: undefined,
    deal: { done: anyDeal !== undefined, doneAt: null },
  };
  const steps = CHECKLIST_STEPS.map((step) => {
    const computed = derived[step];
    if (computed) return { step, ...computed };
    const row = stored.find((s) => s.step === step);
    return { step, done: row !== undefined, doneAt: row ? row.doneAt.toISOString() : null };
  });
  const doneCount = steps.filter((s) => s.done).length;
  return { steps, percent: Math.round((doneCount / steps.length) * 100) };
}

/** Ticks 'kickoff' or 'playbook' (the only stored steps). Idempotent: the first tick time is kept. */
export async function tickChecklistStep(
  tx: Tx,
  viewer: Viewer,
  input: { step: Extract<ChecklistStep, 'kickoff' | 'playbook'> },
  clock: Clock,
): Promise<ChecklistDto> {
  if (viewer.kind !== 'partner') throw new ForbiddenError('partner only');
  if (input.step !== 'kickoff' && input.step !== 'playbook') {
    throw new ValidationError([{ path: 'step', message: 'Only the kickoff and playbook steps can be ticked.' }]);
  }
  await tx
    .insert(partnerChecklist)
    .values({ partnerId: viewer.partnerId, step: input.step, doneAt: clock.now(), doneBy: viewer.id })
    .onConflictDoNothing();
  return getChecklist(tx, viewer);
}

/**
 * Active partner admins of a partner, for notifications and emails about team changes. Not part of the contracts'
 * H.6 list: an addition of this plan, used by the accept-invite and team actions. RLS scopes it for partner viewers.
 */
export async function listPartnerAdminRecipients(
  tx: Tx,
  input: { partnerId: string },
): Promise<Array<{ userId: string; email: string; name: string }>> {
  return tx
    .select({ userId: users.id, email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.partnerId, input.partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active')))
    .orderBy(users.createdAt);
}

export const isolation = defineIsolation<'getCompany' | 'getChecklist' | 'tickChecklistStep' | 'listPartnerAdminRecipients'>({
  getCompany: { scope: 'tenant', probe: (tx, viewer, ctx) => getCompany(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  getChecklist: { scope: 'tenant', probe: (tx, viewer) => getChecklist(tx, viewer), expect: 'unchanged' },
  tickChecklistStep: {
    scope: 'tenant',
    probe: (tx, viewer) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, systemClock),
    expect: 'unchanged',
  },
  listPartnerAdminRecipients: { scope: 'tenant', probe: (tx, _viewer, ctx) => listPartnerAdminRecipients(tx, { partnerId: ctx.b.partnerId }), expect: 'empty' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (partners: 7 tests; isolation passes for `invites` and `partners`).

- [ ] **Step 8: Write the failing invite preview helper test**

The page and `previewInviteAction` share one loader that rate limits, reads the invite and adds the configured agreement version.

Create `src/server/invite-preview.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/env';
import { fixedClock } from '@/lib/clock';
import { makeInvite, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { RateLimitError } from '@/server/errors';
import { loadInvitePreview } from './invite-preview';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
let n = 0;
const ip = (): string => `203.0.113.${(n += 1)}`;

beforeEach(async () => {
  await resetDb(db);
});

describe('loadInvitePreview', () => {
  it('adds the configured agreement version when the agreement is needed', async () => {
    const partner = await makePartner(db, { status: 'onboarding' });
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'a@x.example', expiresAt: new Date('2026-11-19T00:00:00Z') });
    expect(await loadInvitePreview(token, ip(), clock)).toMatchObject({ state: 'ok', needsAgreement: true, agreementVersion: env.PARTNER_AGREEMENT_VERSION });
  });

  it('answers unknown for a bad token and rate limits one IP', async () => {
    const same = ip();
    for (let i = 0; i < 20; i += 1) expect(await loadInvitePreview('nope', same, clock)).toEqual({ state: 'unknown' });
    await expect(loadInvitePreview('nope', same, clock)).rejects.toBeInstanceOf(RateLimitError);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/invite-preview.test.ts`
Expected: FAIL, `Failed to resolve import "./invite-preview"`.

- [ ] **Step 9: Implement the preview loader**

Create `src/server/invite-preview.ts`:

```ts
import { env } from '@/env';
import type { Clock } from '@/lib/clock';
import { INVITE_IP_RULE } from '@/lib/invites';
import type { InvitePreviewDto } from '@/lib/dto';
import { publicActor } from '@/server/auth/types';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { previewInvite } from '@/server/repo/invites';

/** Used by the /accept-invite page and previewInviteAction. Throws RateLimitError after 20 lookups per IP in 10 minutes. */
export async function loadInvitePreview(token: string, ip: string | null, clock: Clock): Promise<InvitePreviewDto> {
  if (ip) rateLimit(`invite:ip:${ip}`, INVITE_IP_RULE);
  const actor = publicActor('Invitee');
  const preview = await withSystem(actor, (tx) => previewInvite(tx, actor, token, clock));
  // The agreement version in force is configuration (placeholder 'draft-0' until legal supplies the text).
  return preview.state === 'ok' && preview.needsAgreement ? { ...preview, agreementVersion: env.PARTNER_AGREEMENT_VERSION } : preview;
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/invite-preview.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 10: Write the failing action tests for invites**

Create `src/server/actions/invites.test.ts` (M1.6 appends the `requestAccessAction` tests). Requires H4.4 for the outbox assertion.

```ts
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
  harness.ip = `198.51.100.${(ipCounter += 1)}`;
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
    const make = (extra: Partial<typeof invites.$inferInsert>) =>
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
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/invites.test.ts`
Expected: FAIL, `Failed to resolve import "./invites"`.

- [ ] **Step 11: Implement the invite actions**

Create `src/server/actions/invites.ts` (M1.6 adds `requestAccessAction`). Requires H4.4 for `enqueue`.

```ts
'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { env } from '@/env';
import { PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from '@/lib/domain';
import type { InvitePreviewDto } from '@/lib/dto';
import { type AcceptInviteOutcome, INVITE_IP_RULE } from '@/lib/invites';
import { landingPathFor } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { auth } from '@/server/auth/auth';
import { assertPasswordOk, hashPassword } from '@/server/auth/passwords';
import { type SystemActor, publicActor } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildTeamChangeNotice } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { loadInvitePreview } from '@/server/invite-preview';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { withSystem } from '@/server/repo/context';
import { acceptInvite } from '@/server/repo/invites';
import { listPartnerAdminRecipients } from '@/server/repo/partners';
import type { ActionResult } from './result';
import { runPublicAction } from './run';

const previewSchema = z.object({ token: z.string().min(1).max(200) });

const acceptSchema = z
  .object({
    token: z.string().min(1).max(200),
    name: z.string().trim().min(1, 'Enter your name.').max(120),
    password: z.string().min(1).max(200),
    confirmPassword: z.string().max(200),
    acceptAgreement: z.boolean(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The passwords do not match.',
  });

export async function previewInviteAction(raw: unknown): Promise<ActionResult<InvitePreviewDto>> {
  return runPublicAction({ name: 'invite.preview', schema: previewSchema }, raw, async (ctx, input): Promise<InvitePreviewDto> =>
    loadInvitePreview(input.token, ctx.ip, ctx.clock),
  );
}

export async function acceptInviteAction(raw: unknown): Promise<ActionResult<AcceptInviteOutcome>> {
  return runPublicAction({ name: 'invite.accept', schema: acceptSchema }, raw, async (ctx, input): Promise<AcceptInviteOutcome> => {
    if (ctx.ip) rateLimit(`invite:ip:${ctx.ip}`, INVITE_IP_RULE);
    assertPasswordOk(input.password);
    const passwordHash = await hashPassword(input.password);
    const actor = publicActor(input.name);

    const accepted = await withSystem(actor, async (tx) => {
      const result = await acceptInvite(
        tx,
        actor,
        {
          token: input.token,
          name: input.name,
          passwordHash,
          acceptAgreement: input.acceptAgreement,
          agreementVersion: env.PARTNER_AGREEMENT_VERSION,
        },
        ctx.clock,
      );
      const roleLabel = result.kind === 'partner' ? PARTNER_ROLE_LABEL[result.role as keyof typeof PARTNER_ROLE_LABEL] : STAFF_ROLE_LABEL[result.role as keyof typeof STAFF_ROLE_LABEL];
      const who: SystemActor = {
        kind: 'system',
        label: input.name,
        who: result.kind === 'staff' ? 'staff' : 'partner',
        roleLabel: result.partnerName ? `${result.partnerName}, ${roleLabel.toLowerCase()}` : roleLabel,
      };
      await recordAudit(tx, who, {
        event: 'team.invite_accepted',
        target: result.partnerName ? `${input.name}, ${roleLabel.toLowerCase()}, at ${result.partnerName}` : `${input.name}, ${roleLabel.toLowerCase()}, CleanStart team`,
        partnerId: result.partnerId,
        subject: { type: 'user', id: result.userId },
      });
      if (result.agreementAccepted && result.partnerId) {
        await recordAudit(tx, who, {
          event: 'partner.agreement_accepted',
          target: result.partnerName ?? '',
          note: `Version ${env.PARTNER_AGREEMENT_VERSION}`,
          partnerId: result.partnerId,
          subject: { type: 'partner', id: result.partnerId },
        });
      }

      let items: NewNotification[] = [];
      if (result.kind === 'partner' && result.partnerId) {
        await enqueue(tx, { op: 'user.upsert', subjectId: result.userId, version: '1' });
        const admins = await listPartnerAdminRecipients(tx, { partnerId: result.partnerId });
        items = admins
          .filter((admin) => admin.userId !== result.userId)
          .map((admin) => ({
            userId: admin.userId,
            kind: 'team_joined' as const,
            title: `${input.name} joined ${result.partnerName ?? 'your company'}`,
            body: roleLabel,
            link: ROUTES.partner.team,
          }));
        await notifyUsers(tx, items);
      }
      return { result, items };
    });

    ctx.revalidate(ROUTES.partner.team);
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(accepted.items)) {
        await sendEmail(
          buildTeamChangeNotice({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            kind: 'joined',
            personName: input.name,
            companyName: accepted.result.partnerName ?? 'your company',
          }),
        );
      }
    });

    // Sign in on the server so the cookie is set by this response. If it fails the account still exists: sign in by hand.
    let signedIn = false;
    try {
      await auth.api.signInEmail({ body: { email: accepted.result.email, password: input.password }, headers: await headers() });
      signedIn = true;
    } catch (error) {
      log.warn({ err: error }, 'sign in after accepting an invite failed');
    }
    return {
      signedIn,
      redirectTo: signedIn ? landingPathFor(accepted.result.kind, accepted.result.role) : ROUTES.signIn,
    };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/invites.test.ts`
Expected: PASS, 9 tests. If the `redirectTo` assertion for the second-admin test fails with `/partner/welcome`, check that `landingPathFor('partner', 'sales')` returns the overview path.

- [ ] **Step 12: Write the failing partner action tests (checklist and manager message)**

Create `src/server/actions/partners.test.ts` (M1.7 and M4.1 append to it):

```ts
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { partnerChecklist } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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

import { sendManagerMessageAction, tickChecklistStepAction } from './partners';

const db = testDb();
let fake: FakeEmailTransport;

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  harness.viewer = null;
});

describe('tickChecklistStepAction', () => {
  it('lets a partner admin tick kickoff and playbook', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await tickChecklistStepAction({ step: 'kickoff' });
    expect(result).toMatchObject({ ok: true });
    expect(await db.select().from(partnerChecklist).where(eq(partnerChecklist.partnerId, partner.id))).toHaveLength(1);
  });

  it('refuses derived steps, other roles and signed out callers', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await tickChecklistStepAction({ step: 'deal' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = null;
    expect(await tickChecklistStepAction({ step: 'kickoff' })).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
  });
});

describe('sendManagerMessageAction', () => {
  it('emails the partner manager with the sender as reply-to', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser', email: 'omar@cleanstart.com' });
    const partner = await makePartner(db, { name: 'Qamar Solutions', managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    const result = await sendManagerMessageAction({ subject: 'Kickoff call', body: 'Can we talk on Tuesday?' });
    expect(result).toEqual({ ok: true, data: { managerName: 'Omar Nasser' } });
    const mail = fake.only('omar@cleanstart.com');
    expect(mail.replyTo?.email).toBe(harness.viewer.email);
    expect(mail.subject).toContain('Kickoff call');
    expect(mail.htmlContent).toContain('Can we talk on Tuesday?');
  });

  it('needs a subject, a body and an assigned manager', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await sendManagerMessageAction({ subject: '  ', body: 'x' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: '' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'validation', message: 'Your partner manager has not been assigned yet.' } });
    expect(fake.sent).toHaveLength(0);
  });

  it('reports a failed send instead of pretending it worked, and is not for staff', async () => {
    const manager = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', email: 'm@cleanstart.com' });
    const partner = await makePartner(db, { managerId: manager.id });
    harness.viewer = await asPartner(db, { partnerId: partner.id });
    fake.failNext = 'Brevo down';
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'integration' } });
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await sendManagerMessageAction({ subject: 'Hi', body: 'Hello' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: FAIL, `Failed to resolve import "./partners"`.

- [ ] **Step 13: Implement the partner actions (checklist and manager message)**

Create `src/server/actions/partners.ts`:

```ts
'use server';

import { z } from 'zod';
import type { ChecklistDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildManagerMessage } from '@/server/email/templates';
import { IntegrationError, ValidationError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { getCompany, tickChecklistStep } from '@/server/repo/partners';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const tickSchema = z.object({ step: z.enum(['kickoff', 'playbook']) });
const messageSchema = z.object({
  subject: z.string().trim().min(1, 'Add a subject.').max(200),
  body: z.string().trim().min(1, 'Write a message first.').max(5000),
});

export async function tickChecklistStepAction(raw: unknown): Promise<ActionResult<ChecklistDto>> {
  return runViewerAction({ name: 'partner.tick_checklist', schema: tickSchema }, raw, async (ctx, input): Promise<ChecklistDto> => {
    assertCan(ctx.viewer, 'partner.update_checklist');
    const checklist = await withViewer(ctx.viewer, (tx) => tickChecklistStep(tx, ctx.viewer, { step: input.step }, ctx.clock));
    ctx.revalidate(ROUTES.partner.welcome);
    return checklist;
  });
}

/** From the "Message your partner manager" drawers. Sent in the request (not after commit) so a failure reaches the person. */
export async function sendManagerMessageAction(raw: unknown): Promise<ActionResult<{ managerName: string }>> {
  return runViewerAction({ name: 'partner.message_manager', schema: messageSchema }, raw, async (ctx, input): Promise<{ managerName: string }> => {
    assertCan(ctx.viewer, 'manager.message');
    const company = await withViewer(ctx.viewer, (tx) => getCompany(tx, ctx.viewer, {}));
    if (!company.manager) throw new ValidationError([{ path: '', message: 'Your partner manager has not been assigned yet.' }]);
    const result = await sendEmail(
      buildManagerMessage({
        to: { email: company.manager.email, name: company.manager.name },
        replyTo: { email: ctx.viewer.email, name: ctx.viewer.name },
        managerName: company.manager.name,
        senderName: ctx.viewer.name,
        partnerName: company.name,
        subject: input.subject,
        body: input.body,
      }),
    );
    if (result.status === 'failed') throw new IntegrationError('brevo', result.error);
    return { managerName: company.manager.name };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 14: Add the dev helper that prints a fresh invite link**

Create `scripts/dev-invite-link.ts`. Local development only: the dev email transport logs and skips, so the invite link is otherwise never visible. It rotates the token of the open invite for an email (the previous link stops working) and prints the URL.

```ts
import { and, desc, eq, isNull } from 'drizzle-orm';
import { invites } from '../src/db/schema';
import { systemClock } from '../src/lib/clock';
import { SYSTEM_ACTORS } from '../src/server/auth/types';
import { rotateInviteToken } from '../src/server/invite-core';
import { withSystem } from '../src/server/repo/context';
import { inviteUrl } from '../src/server/urls';

if (process.env.NODE_ENV === 'production') throw new Error('dev-invite-link is for local development only');
const email = process.argv[2]?.trim().toLowerCase();
if (!email) throw new Error('Usage: tsx --env-file=.env scripts/dev-invite-link.ts <email>');

const url = await withSystem(SYSTEM_ACTORS.portal, async (tx) => {
  const [open] = await tx
    .select({ id: invites.id })
    .from(invites)
    .where(and(eq(invites.email, email), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(desc(invites.createdAt))
    .limit(1);
  if (!open) return null;
  const rotated = await rotateInviteToken(tx, open.id, systemClock);
  return rotated ? inviteUrl(rotated.token) : null;
});

console.log(url ?? `No open invite for ${email}. Approve an application or add a partner first.`);
process.exit(0);
```

- [ ] **Step 15: Convert `AcceptInvite.tsx`**

Edit `src/components/screens/AcceptInvite.tsx`.

Edit 1, imports and constants. Before:

```tsx
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { acceptPartnerAgreement, QAMAR_ID } from "@/data/partners";
import { ROUTES } from "@/lib/routes";

const INVITE_EMAIL = "yasmin.haddad@qamarsolutions.ae";
const AGREEMENT_TEXT =
  "The agreement text from CleanStart legal goes here. The portal stores the version you accept and when you accepted it.";

const STEPS = [
  { title: "Set your password and accept the agreement", text: "You are doing this now." },
  { title: "Add your company details", text: "Address, website and what you sell." },
  { title: "Invite your colleagues", text: "Sales and technical people get their own login." },
  { title: "Kickoff call with Omar Nasser", text: "Your CleanStart partner manager, Middle East." },
] as const;
```

After:

```tsx
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from "@/lib/domain";
import type { InvitePreviewDto, InviteState } from "@/lib/dto";
import { nameFromEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { acceptInviteAction } from "@/server/actions/invites";
import { issuesToErrors } from "@/server/actions/result";

const AGREEMENT_TEXT =
  "The agreement text from CleanStart legal goes here. The portal stores the version you accept and when you accepted it.";

const ADMIN_STEPS = [
  { title: "Set your password and accept the agreement", text: "You are doing this now." },
  { title: "Add your company details", text: "Address, website and what you sell." },
  { title: "Invite your colleagues", text: "Sales and technical people get their own login." },
  { title: "Kickoff call with your partner manager", text: "Your CleanStart partner manager will be in touch." },
] as const;

const OTHER_STEPS = [
  { title: "Set your password", text: "You are doing this now." },
  { title: "Sign in", text: "You are signed in as soon as you finish here." },
] as const;

const PROBLEMS: Record<Exclude<InviteState, "ok">, { title: string; text: string }> = {
  expired: {
    title: "This invite has expired",
    text: "Invites are valid for 7 days. Ask your partner admin or CleanStart partner manager to send a new one.",
  },
  used: {
    title: "This invite was already used",
    text: "The account is set up. Sign in with the password you chose, or use Forgot password on the sign-in page.",
  },
  revoked: {
    title: "This invite was withdrawn",
    text: "The person who invited you cancelled it. Ask them to send a new one.",
  },
  unknown: {
    title: "This invite link is not valid",
    text: "Check that you copied the whole link from the email. If it still fails, ask for a new invite.",
  },
};
```

Edit 2, the head of the component and `submit`. Before:

```tsx
export function AcceptInvite(): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("Yasmin Haddad");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);

  const weak = passwordRules(pw).some((rule) => !rule.met);
  const mismatch = !weak && pw !== pw2;
  const nameBad = !name.trim();
  const pwErr = tried && weak;
  const pw2Err = tried && mismatch;
  const agreeErr = tried && !agreed;

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (weak || mismatch || !agreed || nameBad) {
      setTried(true);
      return;
    }
    const trimmed = name.trim();
    acceptPartnerAgreement(QAMAR_ID, trimmed);
    toast(`You are set up, ${trimmed.split(" ")[0] ?? trimmed}. Agreement version 1.2 accepted.`);
    router.push(ROUTES.partner.welcome);
  };

  return (
    <PublicSplit
      label="Accept invite"
      tag="Partner Portal"
      footerLeft="Invited by Omar Nasser, CleanStart"
      asideLabel="What happens next"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Your first week as a CleanStart partner
          </h2>
          <NumberedSteps items={STEPS} current={0} />
        </div>
      }
    >
```

After:

```tsx
/** The page shown when the link cannot be used: one message per reason, so nobody has to guess. */
function InviteProblem({ state }: { state: Exclude<InviteState, "ok"> }): React.JSX.Element {
  const problem = PROBLEMS[state];
  return (
    <PublicSplit
      label="Accept invite"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="About the portal"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            The CleanStart Partner Portal
          </h2>
          <NumberedSteps items={ADMIN_STEPS} />
        </div>
      }
    >
      <div role="status" style={{ width: "100%", maxWidth: 400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <PublicHeading title={problem.title}>{problem.text}</PublicHeading>
        <a href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
          Go to sign in
        </a>
      </div>
    </PublicSplit>
  );
}

export function AcceptInvite({ token, preview }: { token: string; preview: InvitePreviewDto }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(preview.name ?? nameFromEmail(preview.email ?? ""));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tried, setTried] = useState(false);
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (preview.state !== "ok") return <InviteProblem state={preview.state} />;

  const needsAgreement = preview.needsAgreement === true;
  const email = preview.email ?? "";
  const partnerName = preview.partnerName ?? "CleanStart";
  const version = preview.agreementVersion ?? "";
  const roleLabel =
    preview.kind === "staff"
      ? STAFF_ROLE_LABEL[preview.role as keyof typeof STAFF_ROLE_LABEL]
      : PARTNER_ROLE_LABEL[preview.role as keyof typeof PARTNER_ROLE_LABEL];

  const weak = passwordRules(pw).some((rule) => !rule.met);
  const mismatch = !weak && pw !== pw2;
  const nameBad = !name.trim();
  const pwErr = tried && weak;
  const pw2Err = tried && mismatch;
  const agreeErr = tried && needsAgreement && !agreed;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (weak || mismatch || (needsAgreement && !agreed) || nameBad) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await acceptInviteAction({ token, name, password: pw, confirmPassword: pw2, acceptAgreement: agreed });
    setBusy(false);
    if (!result.ok) {
      const inline = issuesToErrors(result.error);
      setFormError(inline.password ?? inline.name ?? inline.acceptAgreement ?? result.error.message);
      return;
    }
    const first = name.trim().split(" ")[0] ?? name.trim();
    toast(
      result.data.signedIn
        ? `You are set up, ${first}.${needsAgreement ? ` Agreement version ${version} accepted.` : ""}`
        : `You are set up, ${first}. Sign in with your new password.`,
    );
    router.push(result.data.redirectTo);
  };

  return (
    <PublicSplit
      label="Accept invite"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="What happens next"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            {needsAgreement ? "Your first week as a CleanStart partner" : "You are almost in"}
          </h2>
          <NumberedSteps items={needsAgreement ? ADMIN_STEPS : OTHER_STEPS} current={0} />
        </div>
      }
    >
```

Edit 3, the heading, the read-only email, the agreement block and the checkbox label. Before:

```tsx
        <PublicHeading title="Set up your account">
          Qamar Solutions is now a CleanStart partner. You will be its partner admin.
        </PublicHeading>
```

After:

```tsx
        <PublicHeading title="Set up your account">
          {needsAgreement
            ? `${partnerName} is now a CleanStart partner. You will be its partner admin.`
            : preview.kind === "staff"
              ? `You have been invited to the CleanStart partner admin as ${roleLabel.toLowerCase()}.`
              : `You have been invited to join ${partnerName} as ${roleLabel.toLowerCase()}.`}
        </PublicHeading>
```

Before:

```tsx
            value={INVITE_EMAIL}
```

After:

```tsx
            value={email}
```

The agreement block renders only when the agreement is needed. Before:

```tsx
        <div className="fg">
          <span className="lbl">Partner agreement</span>
```

After:

```tsx
        {needsAgreement ? (
        <div className="fg">
          <span className="lbl">Partner agreement</span>
```

and the matching end. Before:

```tsx
          {agreeErr ? (
            <span className="err" id="agree-err">
              Accept the agreement to continue.
            </span>
          ) : null}
        </div>
        <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }}>
          Accept and continue
        </button>
```

After:

```tsx
          {agreeErr ? (
            <span className="err" id="agree-err">
              Accept the agreement to continue.
            </span>
          ) : null}
        </div>
        ) : null}
        {formError ? (
          <span className="err" role="alert">
            {formError}
          </span>
        ) : null}
        <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }} disabled={busy}>
          Accept and continue
        </button>
```

Inside the agreement block replace the version and company strings. Before:

```tsx
                <span className="li-s">Version 1.2</span>
```

After:

```tsx
                <span className="li-s">Version {version}</span>
```

Before:

```tsx
            I accept the partner agreement on behalf of Qamar Solutions.
```

After:

```tsx
            I accept the partner agreement on behalf of {partnerName}.
```

Edit 4, the dialog mounts only when the agreement is needed and shows the configured version. Before:

```tsx
      <Dialog
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        title="CleanStart partner agreement"
        subtitle="Version 1.2"
```

After:

```tsx
      {needsAgreement ? (
      <Dialog
        open={agreementOpen}
        onClose={() => setAgreementOpen(false)}
        title="CleanStart partner agreement"
        subtitle={`Version ${version}`}
```

Before:

```tsx
      </Dialog>
    </PublicSplit>
```

After:

```tsx
      </Dialog>
      ) : null}
    </PublicSplit>
```

Copy changes versus the mock, for the product owner: the footer reads "CleanStart Partner Portal" (the inviter's name is not stored on the invite), the kickoff step says "your partner manager" without a name, and non-admin and staff invites show a shorter list. The agreement text stays the placeholder.

- [ ] **Step 16: Write the accept-invite page**

Replace `src/app/(public)/accept-invite/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { AcceptInvite } from "@/components/screens/AcceptInvite";
import { systemClock } from "@/lib/clock";
import type { InvitePreviewDto } from "@/lib/dto";
import { loadInvitePreview } from "@/server/invite-preview";

export const metadata: Metadata = { title: "Set up your account" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token: raw } = await searchParams;
  const token = typeof raw === "string" ? raw : "";
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded ? (forwarded.split(",")[0]?.trim() ?? null) : null;
  const preview: InvitePreviewDto = token ? await loadInvitePreview(token, ip, systemClock) : { state: "unknown" };
  return <AcceptInvite token={token} preview={preview} />;
}
```

- [ ] **Step 17: Convert `message-drawer.tsx`**

Edit `src/components/partners/message-drawer.tsx`.

Edit 1, imports and state. Before:

```tsx
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { initialsOf } from "@/data/partners";
```

After:

```tsx
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { initialsOf } from "@/lib/people";
import { sendManagerMessageAction } from "@/server/actions/partners";
```

Before:

```tsx
  const [subjectText, setSubjectText] = useState(subject);
  const invalid = tried && !body.trim();

  const close = (): void => {
    setBody("");
    setTried(false);
    onClose();
  };

  const send = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    toast(`Message sent to ${manager}`);
    close();
  };
```

After:

```tsx
  const [subjectText, setSubjectText] = useState(subject);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const invalid = tried && !body.trim();

  const close = (): void => {
    setBody("");
    setTried(false);
    setError(null);
    onClose();
  };

  const send = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await sendManagerMessageAction({ subject: subjectText, body });
    setBusy(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    toast(`Message sent to ${result.data.managerName}`);
    close();
  };
```

Edit 2, the send button and the error line. Before:

```tsx
          <button type="submit" className="btn btn-p">
            <Icon name="send" />
            Send
          </button>
```

After:

```tsx
          <button type="submit" className="btn btn-p" disabled={busy}>
            <Icon name="send" />
            Send
          </button>
```

Before:

```tsx
        {invalid ? (
          <span id="co-msg-err" className="err">
            Write a message first.
          </span>
        ) : null}
```

After:

```tsx
        {invalid ? (
          <span id="co-msg-err" className="err">
            Write a message first.
          </span>
        ) : null}
        {error ? (
          <span className="err" role="alert">
            {error}
          </span>
        ) : null}
```

- [ ] **Step 18: Convert `PartnerWelcome.tsx`**

Edit `src/components/screens/PartnerWelcome.tsx`.

Edit 1, imports. Before:

```tsx
import Link from "next/link";
import { useState } from "react";
import { welcomeSlice } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
import { QAMAR } from "../shell/personas";
```

After:

```tsx
import Link from "next/link";
import { useState } from "react";
import { MessageDrawer } from "@/components/partners/message-drawer";
import { fmtShort } from "@/lib/dates";
import type { ChecklistDto, CompanyDto } from "@/lib/dto";
import { formatAgreement } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { tickChecklistStepAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
```

Edit 2, the steps become a function of the company. Delete the whole `const STEPS: readonly Step[] = [` array (from that line through its closing `];`, which sits just above `const STARTERS`) and insert in its place:

```tsx
const buildSteps = (company: CompanyDto): readonly Step[] => [
  {
    key: "agreement",
    title: "Accept the partner agreement",
    text: company.agreementAcceptedAt ? `${formatAgreement(company.agreementVersion, company.agreementAcceptedAt)}.` : "Not accepted yet.",
    target: null,
    action: "",
    icon: "file",
  },
  {
    key: "company",
    title: "Add your company details",
    text: "Address, website and what you sell. Your partner manager reads this first.",
    target: ROUTES.partner.company,
    action: "Add details",
    icon: "bld",
  },
  {
    key: "team",
    title: "Invite your colleagues",
    text: "Give your sales and technical people their own login.",
    target: ROUTES.partner.team,
    action: "Invite",
    icon: "team",
  },
  {
    key: "kickoff",
    title: "Book your kickoff call",
    text: company.manager
      ? `A 30-minute call with ${company.manager.name}, your partner manager.`
      : "A 30-minute call with your partner manager.",
    target: "message",
    action: "Book a call",
    icon: "clk",
  },
  {
    key: "playbook",
    title: "Read the partner sales playbook",
    text: "Ideal customers, discovery and how deal registration works.",
    target: ROUTES.partner.documents,
    action: "Open",
    icon: "docs",
  },
  {
    key: "deal",
    title: "Register your first deal",
    text: `${company.name} shows as onboarding until this is done.`,
    target: ROUTES.partner.newDeal,
    action: "Register",
    icon: "reg",
  },
];
```

Edit 3, the component head. Before:

```tsx
export function PartnerWelcome(): React.JSX.Element {
  const done = welcomeSlice.use();
  const [messaging, setMessaging] = useState(false);
  const doneCount = STEPS.filter((s) => done[s.key]).length;
  const percent = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Welcome, Yasmin</h1>
          <span className="h1-sub">Qamar Solutions joined the CleanStart partner program on 27 Oct.</span>
        </div>
```

After:

```tsx
interface PartnerWelcomeProps {
  firstName: string;
  company: CompanyDto;
  checklist: ChecklistDto;
  viewerEmail: string;
}

export function PartnerWelcome({ firstName, company, checklist, viewerEmail }: PartnerWelcomeProps): React.JSX.Element {
  const STEPS = buildSteps(company);
  const done: Record<string, boolean> = Object.fromEntries(checklist.steps.map((s) => [s.step, s.done]));
  const [messaging, setMessaging] = useState(false);
  const doneCount = STEPS.filter((s) => done[s.key]).length;
  const percent = checklist.percent;
  const tick = (step: "kickoff" | "playbook"): void => void tickChecklistStepAction({ step });

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Welcome, {firstName}</h1>
          <span className="h1-sub">
            {company.name} joined the CleanStart partner program on {fmtShort(company.since)}.
          </span>
        </div>
```

Edit 4, the two step action controls. Before:

```tsx
              {!isDone && step.target && step.target !== "message" ? (
                <Link href={step.target} className="btn btn-s" style={ACTION_STYLE}>
                  {step.action}
                </Link>
              ) : null}
              {!isDone && step.target === "message" ? (
                <button
                  type="button"
                  className="btn btn-s"
                  style={ACTION_STYLE}
                  onClick={() => {
                    setMessaging(true);
                    welcomeSlice.set((prev) => ({ ...prev, [step.key]: true }));
                  }}
                >
```

After:

```tsx
              {!isDone && step.target && step.target !== "message" ? (
                <Link
                  href={step.target}
                  className="btn btn-s"
                  style={ACTION_STYLE}
                  onClick={step.key === "playbook" ? () => tick("playbook") : undefined}
                >
                  {step.action}
                </Link>
              ) : null}
              {!isDone && step.target === "message" ? (
                <button
                  type="button"
                  className="btn btn-s"
                  style={ACTION_STYLE}
                  onClick={() => {
                    setMessaging(true);
                    tick("kickoff");
                  }}
                >
```

Edit 5, the "Your deals" and "Your team" cards follow the checklist instead of always showing the empty state. Before:

```tsx
            <span style={{ fontSize: 14, fontWeight: 700 }}>No deals yet</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E", maxWidth: "46ch" }}>
              Register a customer you are working with. Once CleanStart accepts it, nobody else can claim it for 90
              days.
            </span>
            <Link href={ROUTES.partner.newDeal} className="btn btn-p" style={{ marginTop: 4 }}>
              Register your first deal
            </Link>
```

After:

```tsx
            <span style={{ fontSize: 14, fontWeight: 700 }}>{done.deal ? "You have registered deals" : "No deals yet"}</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E", maxWidth: "46ch" }}>
              {done.deal
                ? "Follow their status and messages from CleanStart on the Deals page."
                : "Register a customer you are working with. Once CleanStart accepts it, nobody else can claim it for 90 days."}
            </span>
            <Link href={done.deal ? ROUTES.partner.deals : ROUTES.partner.newDeal} className="btn btn-p" style={{ marginTop: 4 }}>
              {done.deal ? "Open your deals" : "Register your first deal"}
            </Link>
```

Before:

```tsx
            <span className="card-meta">1 person</span>
```

After:

```tsx
            <span className="card-meta">{done.team ? "Colleagues invited" : "1 person"}</span>
```

Before:

```tsx
            <span style={{ fontSize: 14, fontWeight: 700 }}>Only you so far</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
              Sales and technical colleagues get their own login. Their deals stay with Qamar Solutions if they leave.
            </span>
            <Link href={ROUTES.partner.team} className="btn btn-s" style={{ marginTop: 4 }}>
              Invite colleagues
            </Link>
```

After:

```tsx
            <span style={{ fontSize: 14, fontWeight: 700 }}>{done.team ? "Your colleagues are set up" : "Only you so far"}</span>
            <span style={{ fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
              Sales and technical colleagues get their own login. Their deals stay with {company.name} if they leave.
            </span>
            <Link href={ROUTES.partner.team} className="btn btn-s" style={{ marginTop: 4 }}>
              {done.team ? "Manage the team" : "Invite colleagues"}
            </Link>
```

Edit 6, the drawer. Before:

```tsx
      {messaging ? (
        <ManagerMessageDrawer
          persona={QAMAR}
          initialSubject="Kickoff call for Qamar Solutions"
          onClose={() => setMessaging(false)}
        />
      ) : null}
```

After:

```tsx
      {messaging && company.manager ? (
        <MessageDrawer
          open
          onClose={() => setMessaging(false)}
          manager={company.manager.name}
          team={company.manager.team.replace("CleanStart ", "")}
          subject={`Kickoff call for ${company.name}`}
          from={viewerEmail}
        />
      ) : null}
```

The "Start here" starter documents block stays static (the document library is track D's data); it links to the Documents page.

- [ ] **Step 19: Write the welcome page**

Replace `src/app/partner/welcome/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { PartnerWelcome } from "@/components/screens/PartnerWelcome";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getChecklist, getCompany } from "@/server/repo/partners";

export const metadata: Metadata = { title: "Welcome" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.update_checklist");
  const data = await withViewer(viewer, async (tx) => ({
    company: await getCompany(tx, viewer, {}),
    checklist: await getChecklist(tx, viewer),
  }));
  return (
    <PartnerWelcome
      firstName={viewer.name.split(" ")[0] ?? viewer.name}
      company={data.company}
      checklist={data.checklist}
      viewerEmail={viewer.email}
    />
  );
}
```

- [ ] **Step 20: Prove no slice import is left**

Run: `grep -n "@/data/\|@/lib/slice\|personas\|welcomeSlice" src/components/screens/AcceptInvite.tsx src/components/screens/PartnerWelcome.tsx src/components/partners/message-drawer.tsx`
Expected: no output.

- [ ] **Step 21: Gate A**

Run the Gate A block. The last command must list only the files in this task's Files block, plus `src/server/partner-scope.ts`.

- [ ] **Step 22: Manual check (seed-dev data, dev server on 3224)**

1. Get a link: `pnpm --filter @cleanstart/portal exec tsx --env-file=.env scripts/dev-invite-link.ts yasmin.haddad@qamarsolutions.ae` (Qamar Solutions is the seed partner with an unaccepted admin invite; if it prints "No open invite", approve an application in M1.4 and use that applicant's email). Expected: a URL `http://localhost:3224/accept-invite?token=...`.
2. Open it signed out: "Set up your account", "Qamar Solutions is now a CleanStart partner. You will be its partner admin.", the email field read-only, the name pre-filled, the agreement block with "Version draft-0".
3. Submit `short` as the password: inline error, nothing created. Use a strong password, tick the agreement, submit: toast "You are set up, Yasmin. Agreement version draft-0 accepted." and you land on `/partner/welcome` signed in.
4. Welcome shows "Welcome, Yasmin", "Qamar Solutions joined the CleanStart partner program on <today>", "1 of 6 done" with the agreement line "draft-0, accepted <today>". Click "Book a call": the drawer opens with "Message Omar Nasser" and the checklist ticks (reload to confirm it persists). Send a message: toast "Message sent to Omar Nasser"; the dev log shows the email subject.
5. Reopen the same invite URL: "This invite was already used". Change the last character of the token: "This invite link is not valid". Generate a link for an invite and edit `expires_at` to the past in psql: "This invite has expired".
6. `select op, subject_id from hubspot_outbox where op = 'user.upsert'` has Yasmin's user id; `select event from audit_log order by at desc limit 2` shows `partner.agreement_accepted` and `team.invite_accepted`.

- [ ] **Step 23: Commit**

```bash
git add apps/portal/src/lib/people.ts apps/portal/src/lib/people.test.ts apps/portal/src/lib/invites.ts \
  apps/portal/src/server/partner-scope.ts \
  apps/portal/src/server/repo/invites.ts apps/portal/src/server/repo/invites.test.ts \
  apps/portal/src/server/repo/partners.ts apps/portal/src/server/repo/partners.test.ts \
  apps/portal/src/server/invite-preview.ts apps/portal/src/server/invite-preview.test.ts \
  apps/portal/src/server/actions/invites.ts apps/portal/src/server/actions/invites.test.ts \
  apps/portal/src/server/actions/partners.ts apps/portal/src/server/actions/partners.test.ts \
  apps/portal/scripts/dev-invite-link.ts \
  apps/portal/src/components/screens/AcceptInvite.tsx apps/portal/src/components/screens/PartnerWelcome.tsx \
  apps/portal/src/components/partners/message-drawer.tsx \
  "apps/portal/src/app/(public)/accept-invite/page.tsx" apps/portal/src/app/partner/welcome/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.5 invites and first login"
```

---
### Task M1.6: Team and access requests

Implements master task 1.6. A partner admin invites colleagues, changes roles and removes people; the last partner admin of a company can never be removed or demoted; nobody removes themselves; removed people keep their deals with the company. "Request access" on the sign-in page routes by email domain to that partner's admins and always shows the same confirmation, so nobody can discover which companies are partners. Contracts K.1 gives this plan the "Request access" views of `SignIn.tsx`; that is the only edit here to a plan 02 file.

Where the contracts say the repo deletes Better Auth sessions (`removeMember`), this plan does it in the action after commit instead, because `auth_session` is system-only under row level security and a partner viewer's transaction cannot delete from it (see "Contract change requests", item 3). Access is cut at once either way: `getViewer()` returns null for a disabled user.

**Files:**
- Create: `src/server/partner-people.ts`, `src/server/partner-people.test.ts`
- Create: `src/server/repo/team.ts`, `src/server/repo/team.test.ts`
- Modify: `src/server/repo/invites.ts`, `src/server/repo/invites.test.ts`
- Create: `src/server/actions/team.ts`, `src/server/actions/team.test.ts`
- Modify: `src/server/actions/invites.ts`, `src/server/actions/invites.test.ts`
- Modify: `src/components/screens/Team.tsx`, `src/components/people/InviteCard.tsx`, `src/components/people/AccessRequests.tsx`, `src/components/screens/SignIn.tsx` (request views only), `src/app/partner/team/page.tsx`
- Create: `src/components/people/RequestAccessForm.tsx`

- [ ] **Step 1: Write the failing test for the shared people loader**

Create `src/server/partner-people.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem } from '@/server/repo/context';
import { loadPartnerPeople } from './partner-people';

const db = testDb();
const future = new Date('2099-01-01T00:00:00Z');
const load = (partnerId: string) => withSystem(SYSTEM_ACTORS.portal, (tx) => loadPartnerPeople(tx, partnerId));

beforeEach(async () => {
  await resetDb(db);
});

describe('loadPartnerPeople', () => {
  it('lists active people first, then people who only have an open invite, and leaves out removed people', async () => {
    const partner = await makePartner(db, {});
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao', email: 'aditi.rao@k.example' });
    await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled', email: 'gone@k.example' });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@k.example', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'technical', email: 'revoked@k.example', expiresAt: future, revokedAt: new Date('2026-11-01T00:00:00Z') });
    const people = await load(partner.id);
    expect(people.map((p) => [p.name, p.status, p.role])).toEqual([
      ['Aditi Rao', 'active', 'partner_admin'],
      ['Vikram Sethi', 'invited', 'sales'],
    ]);
    expect(people[0]).toMatchObject({ id: admin.id, userId: admin.id, inviteId: null });
    expect(people[1]).toMatchObject({ id: invite.id, userId: null, inviteId: invite.id });
  });

  it('attaches the open invite to a user row that is still in status invited', async () => {
    const partner = await makePartner(db, {});
    const user = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'invited', name: 'Zaid Omar', email: 'zaid@k.example' });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid@k.example', expiresAt: future });
    const people = await load(partner.id);
    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ id: user.id, userId: user.id, inviteId: invite.id, status: 'invited' });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-people.test.ts`
Expected: FAIL, `Failed to resolve import "./partner-people"`.

- [ ] **Step 2: Implement the people loader**

Create `src/server/partner-people.ts`:

```ts
import { and, asc, eq, isNull, ne } from 'drizzle-orm';
import { invites, users } from '@/db/schema';
import type { PartnerRole } from '@/lib/domain';
import { nameFromEmail } from '@/lib/people';
import type { Tx } from '@/server/repo/context';

/**
 * One person of a partner company as the Team screen and the partner detail see them: a user with a login, or someone
 * who only has an open invite (no users row yet). For an invite-only row `id` is the invite id and `userId` is null.
 */
export interface PersonRow {
  id: string;
  userId: string | null;
  inviteId: string | null;
  name: string;
  email: string;
  role: PartnerRole;
  status: 'active' | 'invited';
  lastLoginAt: Date | null;
  invitedAt: Date | null;
}

/** Active people first (oldest account first), then invited ones. Removed (disabled) people are left out. */
export async function loadPartnerPeople(tx: Tx, partnerId: string): Promise<PersonRow[]> {
  const members = await tx
    .select()
    .from(users)
    .where(and(eq(users.partnerId, partnerId), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.partnerId, partnerId), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));

  const rows: PersonRow[] = members.map((u) => ({
    id: u.id,
    userId: u.id,
    inviteId: open.find((i) => i.email === u.email)?.id ?? null,
    name: u.name,
    email: u.email,
    role: u.role as PartnerRole,
    status: u.status === 'active' ? 'active' : 'invited',
    lastLoginAt: u.lastLoginAt,
    invitedAt: u.invitedAt,
  }));
  for (const invite of open) {
    if (members.some((u) => u.email === invite.email)) continue;
    rows.push({
      id: invite.id,
      userId: null,
      inviteId: invite.id,
      name: nameFromEmail(invite.email),
      email: invite.email,
      role: invite.role as PartnerRole,
      status: 'invited',
      lastLoginAt: null,
      invitedAt: invite.createdAt,
    });
  }
  return [...rows.filter((r) => r.status === 'active'), ...rows.filter((r) => r.status === 'invited')];
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/partner-people.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 3: Write the failing repo tests for team and access requests**

Create `src/server/repo/team.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessRequests, invites, registrations, users } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { hashToken } from '@/server/auth/tokens';
import { publicActor } from '@/server/auth/types';
import { type Tx, withSystem, withViewer } from './context';
import { changeMemberRole, createAccessRequest, decideAccessRequest, getTeam, removeMember } from './team';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const actor = publicActor('Rohit Desai');
const future = new Date('2099-01-01T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  return { partner, admin };
};
const as = <T>(viewer: Parameters<typeof withViewer>[0], fn: (tx: Tx) => Promise<T>) => withViewer(viewer, fn);

describe('getTeam', () => {
  it('lists people, invited colleagues, deal counts and open requests for the viewer', async () => {
    const { partner, admin } = await company();
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    await makeRegistration(db, { partnerId: partner.id, registeredBy: sales.id });
    await makeRegistration(db, { partnerId: partner.id, registeredBy: sales.id });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai', note: 'I lead the Mumbai sales team.' });
    await makeAccessRequest(db, { partnerId: partner.id, email: 'old@kestrelsystems.in', name: 'Old', status: 'declined' });
    const team = await as(admin, (tx) => getTeam(tx, admin, {}));
    expect(team).toMatchObject({ partnerId: partner.id, partnerName: 'Kestrel Systems' });
    expect(team.members.map((m) => [m.name, m.status, m.isYou, m.deals])).toEqual([
      [admin.name, 'active', true, 0],
      ['Karan Malhotra', 'active', false, 2],
      ['Vikram Sethi', 'invited', false, 0],
    ]);
    expect(team.members[2]?.inviteId).toBe(team.members[2]?.id);
    expect(team.requests).toEqual([
      expect.objectContaining({ name: 'Rohit Desai', email: 'rohit@kestrelsystems.in', note: 'I lead the Mumbai sales team.', role: 'sales', status: 'open' }),
    ]);
  });

  it('refuses another partner id for a partner viewer and needs one for staff', async () => {
    const { admin } = await company();
    const other = await makePartner(db, {});
    await expect(as(admin, (tx) => getTeam(tx, admin, { partnerId: other.id }))).rejects.toMatchObject({ code: 'not_found' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(as(manager, (tx) => getTeam(tx, manager, {}))).rejects.toMatchObject({ code: 'validation' });
    expect((await as(manager, (tx) => getTeam(tx, manager, { partnerId: other.id }))).partnerId).toBe(other.id);
  });
});

describe('changeMemberRole', () => {
  it('changes a role and returns the member', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const changed = await as(admin, (tx) => changeMemberRole(tx, admin, { userId: member.id, role: 'technical' }));
    expect(changed).toMatchObject({ id: member.id, role: 'technical' });
  });

  it('never demotes the last partner admin, but can once another admin exists', async () => {
    const { partner, admin } = await company();
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: admin.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'last_admin' });
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: admin.id, role: 'sales' }))).resolves.toMatchObject({ role: 'sales' });
  });

  it('cannot reach a person at another company', async () => {
    const { admin } = await company();
    const otherPartner = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: otherPartner.id, role: 'sales' });
    await expect(as(admin, (tx) => changeMemberRole(tx, admin, { userId: stranger.id, role: 'technical' }))).rejects.toMatchObject({ code: 'not_found' });
    const [row] = await db.select().from(users).where(eq(users.id, stranger.id));
    expect(row?.role).toBe('sales');
  });
});

describe('removeMember', () => {
  it('disables the person, stamps removed_at and leaves their deals with the company', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan', email: 'karan@k.example' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: member.id });
    const removed = await as(admin, (tx) => removeMember(tx, admin, { userId: member.id }, clock));
    expect(removed).toEqual({ userId: member.id, name: 'Karan', email: 'karan@k.example', role: 'sales', partnerId: partner.id });
    const [row] = await db.select().from(users).where(eq(users.id, member.id));
    expect(row?.status).toBe('disabled');
    expect(row?.removedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
    const [kept] = await db.select().from(registrations).where(eq(registrations.id, deal.id));
    expect(kept?.partnerId).toBe(partner.id);
    expect(kept?.registeredBy).toBe(member.id);
  });

  it('refuses removing yourself and a person at another company', async () => {
    const { admin } = await company();
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: admin.id }, clock))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const other = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: other.id, role: 'sales' });
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: stranger.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('removes an admin while another remains, and refuses to remove the last admin even for a partner manager', async () => {
    const { partner, admin } = await company();
    const second = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(as(admin, (tx) => removeMember(tx, admin, { userId: second.id }, clock))).resolves.toMatchObject({ userId: second.id });
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(as(manager, (tx) => removeMember(tx, manager, { userId: admin.id }, clock))).rejects.toMatchObject({ reason: 'last_admin' });
  });
});

describe('createAccessRequest', () => {
  const ask = (email: string, name = 'Rohit Desai', note: string | null = 'Hello') =>
    withSystem(actor, (tx) => createAccessRequest(tx, actor, { email, name, note }, clock));

  it('matches the email domain to a partner, creates one open request and returns the active admins', async () => {
    const { partner, admin } = await company();
    const result = await ask('Rohit.Desai@KestrelSystems.in');
    expect(result).toMatchObject({ matched: true, partnerId: partner.id, partnerName: 'Kestrel Systems', adminRecipients: [{ userId: admin.id, email: admin.email, name: admin.name }] });
    const rows = await db.select().from(accessRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ email: 'rohit.desai@kestrelsystems.in', status: 'open', requestedRole: 'sales', note: 'Hello' });
  });

  it('asking twice keeps one open request and does not notify the admins again', async () => {
    await company();
    await ask('rohit@kestrelsystems.in', 'Rohit', 'first');
    const again = await ask('rohit@kestrelsystems.in', 'Rohit D', 'second');
    expect(again).toMatchObject({ matched: true, adminRecipients: [] });
    const rows = await db.select().from(accessRequests);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ name: 'Rohit D', note: 'second' });
  });

  it('creates nothing for an unknown domain, a suspended partner or an email that already has a login', async () => {
    const { partner } = await company();
    await makePartner(db, { domain: 'suspended.example', status: 'suspended' });
    expect(await ask('someone@unknown.example')).toEqual({ matched: false, partnerId: null, partnerName: null, requestId: null, adminRecipients: [] });
    expect((await ask('someone@suspended.example')).matched).toBe(false);
    await makeUser(db, { partnerId: partner.id, email: 'has.login@kestrelsystems.in' });
    expect((await ask('has.login@kestrelsystems.in')).matched).toBe(false);
    expect(await db.select().from(accessRequests)).toHaveLength(0);
  });
});

describe('decideAccessRequest', () => {
  it('approving creates an invite for the chosen role and returns the token once', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'technical' }, clock));
    expect(result.request).toMatchObject({ id: request.id, status: 'approved', role: 'sales' });
    expect(result.invite?.invite).toMatchObject({ email: 'rohit@kestrelsystems.in', role: 'technical', kind: 'partner', partnerId: partner.id });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite?.invite.id ?? ''));
    expect(row?.tokenHash).toBe(hashToken(result.invite?.token ?? ''));
    const [saved] = await db.select().from(accessRequests).where(eq(accessRequests.id, request.id));
    expect(saved).toMatchObject({ status: 'approved', decidedBy: admin.id });
  });

  it('declining only closes the request', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock));
    expect(result).toMatchObject({ request: { status: 'declined' }, invite: null });
    expect(await db.select().from(invites)).toHaveLength(0);
  });

  it('is single use, never grants partner admin, and cannot touch another company', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'partner_admin' as unknown as 'sales' }, clock))).rejects.toMatchObject({ code: 'validation' });
    await as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock));
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'decline' }, clock))).rejects.toMatchObject({ reason: 'already_decided' });
    const other = await makePartner(db, {});
    const foreign = await makeAccessRequest(db, { partnerId: other.id, email: 'x@other.example', name: 'X' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: foreign.id, decision: 'decline' }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });

  it('refuses to approve when the person has meanwhile got a login', async () => {
    const { partner, admin } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    await makeUser(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in' });
    await expect(as(admin, (tx) => decideAccessRequest(tx, admin, { id: request.id, decision: 'approve', role: 'sales' }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/team.test.ts`
Expected: FAIL, `Failed to resolve import "./team"`.

- [ ] **Step 4: Implement the team repo**

Create `src/server/repo/team.ts`:

```ts
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { accessRequests, partners, registrations, users } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { ACCESS_REQUEST_ROLES, type AccessRequestRole, type PartnerRole } from '@/lib/domain';
import type { AccessRequestDto, CreatedInviteDto, TeamDto, TeamMemberDto } from '@/lib/dto';
import { emailDomain } from '@/lib/people';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError, ValidationError } from '@/server/errors';
import { issueInvite } from '@/server/invite-core';
import { loadPartnerPeople } from '@/server/partner-people';
import { resolvePartnerScope } from '@/server/partner-scope';
import { iso } from '@/server/people';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listPartnerAdminRecipients } from './partners';

type AccessRequestRow = typeof accessRequests.$inferSelect;

const toRequestDto = (row: AccessRequestRow): AccessRequestDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  requestedAt: row.createdAt.toISOString(),
  note: row.note,
  role: row.requestedRole,
  status: row.status,
});

/** Partner admin: own company. Partner manager: pass partnerId. */
export async function getTeam(tx: Tx, viewer: Viewer, input: { partnerId?: string }): Promise<TeamDto> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [partner] = await tx.select({ id: partners.id, name: partners.name }).from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');

  const people = await loadPartnerPeople(tx, partner.id);
  const dealRows = await tx
    .select({ userId: registrations.registeredBy, n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.partnerId, partner.id))
    .groupBy(registrations.registeredBy);
  const deals = new Map(dealRows.map((r) => [r.userId, r.n]));
  const requests = await tx
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.partnerId, partner.id), eq(accessRequests.status, 'open')))
    .orderBy(asc(accessRequests.createdAt));

  return {
    partnerId: partner.id,
    partnerName: partner.name,
    members: people.map(
      (p): TeamMemberDto => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role,
        status: p.status,
        lastActiveAt: iso(p.lastLoginAt),
        invitedAt: iso(p.invitedAt),
        deals: p.userId ? (deals.get(p.userId) ?? 0) : 0,
        isYou: p.userId !== null && p.userId === viewer.id,
        inviteId: p.inviteId,
      }),
    ),
    requests: requests.map(toRequestDto),
  };
}

/** The person a team action is about: a partner user in the viewer's company (any company for staff). Locks the row. */
const loadMember = async (tx: Tx, viewer: Viewer, userId: string) => {
  const [row] = await tx
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, userId),
        eq(users.kind, 'partner'),
        ne(users.status, 'disabled'),
        viewer.kind === 'partner' ? eq(users.partnerId, viewer.partnerId) : undefined,
      ),
    )
    .limit(1)
    .for('update');
  if (!row || !row.partnerId) throw new NotFoundError('user');
  return { ...row, partnerId: row.partnerId };
};

/** Throws ConflictError('last_admin') unless another active partner admin stays behind. */
const assertAnotherAdmin = async (tx: Tx, partnerId: string, leavingId: string): Promise<void> => {
  const [other] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.partnerId, partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active'), ne(users.id, leavingId)))
    .limit(1)
    .for('update');
  if (!other) throw new ConflictError('last_admin', 'Every company needs at least one partner admin.');
};

/** Throws ConflictError('last_admin') when it would leave the company with no partner admin. */
export async function changeMemberRole(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string; role: PartnerRole },
): Promise<TeamMemberDto> {
  const target = await loadMember(tx, viewer, input.userId);
  if (target.role !== input.role) {
    if (target.role === 'partner_admin') await assertAnotherAdmin(tx, target.partnerId, target.id);
    await tx.update(users).set({ role: input.role }).where(eq(users.id, target.id));
  }
  const team = await getTeam(tx, viewer, viewer.kind === 'staff' ? { partnerId: target.partnerId } : {});
  const member = team.members.find((m) => m.id === target.id);
  if (!member) throw new NotFoundError('user');
  return member;
}

/**
 * Sets status 'disabled' and removed_at. Their registrations stay with the company. Throws ConflictError('cannot_remove_self')
 * and ConflictError('last_admin'). Deleting the person's Better Auth sessions is the action's job after commit
 * (auth_session is system-only under RLS).
 */
export async function removeMember(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string },
  clock: Clock,
): Promise<{ userId: string; name: string; email: string; role: PartnerRole; partnerId: string }> {
  const target = await loadMember(tx, viewer, input.userId);
  if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot remove yourself.');
  if (target.role === 'partner_admin') await assertAnotherAdmin(tx, target.partnerId, target.id);
  await tx.update(users).set({ status: 'disabled', removedAt: clock.now() }).where(eq(users.id, target.id));
  return { userId: target.id, name: target.name, email: target.email, role: target.role as PartnerRole, partnerId: target.partnerId };
}

/**
 * Public (M1.6). Matches the email domain to a partner. Always resolves; `matched` tells the action whether to
 * notify. The UI shows the same confirmation either way. Creates an access_requests row (deduplicated by the open
 * partial index) only when matched and the email has no login.
 */
export async function createAccessRequest(
  tx: Tx,
  _actor: SystemActor,
  input: { email: string; name: string; note: string | null },
  _clock: Clock,
): Promise<{
  matched: boolean;
  partnerId: string | null;
  partnerName: string | null;
  requestId: string | null;
  adminRecipients: Array<{ userId: string; email: string; name: string }>;
}> {
  const none = { matched: false, partnerId: null, partnerName: null, requestId: null, adminRecipients: [] };
  const email = input.email.trim().toLowerCase();
  const domain = emailDomain(email);
  if (!domain) return none;
  const [partner] = await tx.select().from(partners).where(eq(partners.domain, domain)).limit(1);
  if (!partner || (partner.status !== 'active' && partner.status !== 'onboarding')) return none;
  const [login] = await tx.select({ id: users.id }).from(users).where(and(eq(users.email, email), ne(users.status, 'disabled'))).limit(1);
  if (login) return none;

  const name = input.name.trim();
  const note = input.note?.trim() || null;
  const [open] = await tx
    .select()
    .from(accessRequests)
    .where(and(eq(accessRequests.partnerId, partner.id), eq(accessRequests.email, email), eq(accessRequests.status, 'open')))
    .limit(1)
    .for('update');
  if (open) {
    await tx.update(accessRequests).set({ name, note }).where(eq(accessRequests.id, open.id));
    return { matched: true, partnerId: partner.id, partnerName: partner.name, requestId: open.id, adminRecipients: [] };
  }
  const [created] = await tx
    .insert(accessRequests)
    .values({ partnerId: partner.id, email, name, note })
    .onConflictDoNothing()
    .returning({ id: accessRequests.id });
  return {
    matched: true,
    partnerId: partner.id,
    partnerName: partner.name,
    requestId: created?.id ?? null,
    adminRecipients: created ? await listPartnerAdminRecipients(tx, { partnerId: partner.id }) : [],
  };
}

/**
 * Partner admin of that company, or partner manager. 'approve' creates a partner invite with `role` (sales or
 * technical) and returns it for emailing; 'decline' only closes the request.
 */
export async function decideAccessRequest(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; decision: 'approve'; role: AccessRequestRole } | { id: string; decision: 'decline' },
  clock: Clock,
): Promise<{ request: AccessRequestDto; invite: CreatedInviteDto | null }> {
  if (input.decision === 'approve' && !(ACCESS_REQUEST_ROLES as readonly string[]).includes(input.role)) {
    throw new ValidationError([{ path: 'role', message: 'Choose sales or technical.' }]);
  }
  const [row] = await tx.select().from(accessRequests).where(eq(accessRequests.id, input.id)).limit(1).for('update');
  if (!row) throw new NotFoundError('access request');
  if (viewer.kind === 'partner' && row.partnerId !== viewer.partnerId) throw new NotFoundError('access request');
  if (row.status !== 'open') throw new ConflictError('already_decided', 'This request was already handled.');

  const invite =
    input.decision === 'approve'
      ? await issueInvite(tx, { kind: 'partner', partnerId: row.partnerId, email: row.email, role: input.role, staffRegion: null, invitedBy: viewer.id }, clock)
      : null;
  const [decided] = await tx
    .update(accessRequests)
    .set({ status: input.decision === 'approve' ? 'approved' : 'declined', decidedBy: viewer.id, decidedAt: clock.now() })
    .where(eq(accessRequests.id, row.id))
    .returning();
  if (!decided) throw new Error('access request update returned no row');
  return { request: toRequestDto(decided), invite };
}

export const isolation = defineIsolation<'getTeam' | 'changeMemberRole' | 'removeMember' | 'createAccessRequest' | 'decideAccessRequest'>({
  getTeam: { scope: 'tenant', probe: (tx, viewer, ctx) => getTeam(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  changeMemberRole: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => changeMemberRole(tx, viewer, { userId: ctx.b.userId, role: 'sales' }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  removeMember: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => removeMember(tx, viewer, { userId: ctx.b.userId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'users', id: ctx.b.userId }],
  },
  createAccessRequest: { scope: 'public', reason: 'Public request-access flow. Takes a SystemActor; covered by team.test.ts and actions/invites.test.ts.' },
  decideAccessRequest: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => decideAccessRequest(tx, viewer, { id: ctx.b.accessRequestId, decision: 'decline' }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'access_requests', id: ctx.b.accessRequestId }],
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/team.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (team: 16 tests; isolation passes for `team`).

- [ ] **Step 5: Write the failing repo tests for invite management**

Append to `src/server/repo/invites.test.ts`. Extend the imports: add `asPartner, asStaff` to the `@/db/test-helpers` import, `hashToken` and `INVITE_TTL_DAYS` from `@/server/auth/tokens`, `withViewer` to the `./context` import, and `createInvite, listOpenInvites, resendInvite, revokeInvite` to the `./invites` import. Then append:

```ts
describe('createInvite', () => {
  it('lets a partner admin invite into their own company and returns the token once', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const created = await withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: ' Meera.Pillai@Kestrel.example ', role: 'sales' }, clock));
    expect(created.invite).toMatchObject({ email: 'meera.pillai@kestrel.example', role: 'sales', kind: 'partner', partnerId: partner.id, state: 'ok' });
    const [row] = await db.select().from(invites).where(eq(invites.id, created.invite.id));
    expect(row?.tokenHash).toBe(hashToken(created.token));
    expect(row?.invitedBy).toBe(admin.id);
    expect(row?.expiresAt.getTime()).toBe(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000);
  });

  it('refuses another company for a partner viewer, a bad email, and a person who already has a login', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: other.id, email: 'a@b.example', role: 'sales' }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: 'nope', role: 'sales' }, clock))).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'email' }] });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'partner', partnerId: partner.id, email: admin.email, role: 'sales' }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
  });

  it('lets a partner manager invite anywhere and create staff invites; partner viewers cannot', async () => {
    const partner = await makePartner(db, {});
    const manager = await asStaff(db, 'partner_manager', 'india');
    const forPartner = await withViewer(manager, (tx) => createInvite(tx, manager, { kind: 'partner', partnerId: partner.id, email: 'x@p.example', role: 'technical' }, clock));
    expect(forPartner.invite.partnerId).toBe(partner.id);
    const staff = await withViewer(manager, (tx) => createInvite(tx, manager, { kind: 'staff', email: 'kunal@cleanstart.com', role: 'sales', region: 'india' }, clock));
    expect(staff.invite).toMatchObject({ kind: 'staff', partnerId: null, staffRegion: 'india', role: 'sales' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => createInvite(tx, admin, { kind: 'staff', email: 'y@cleanstart.com', role: 'sales', region: 'india' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('resendInvite and revokeInvite', () => {
  it('resending replaces the token, extends the expiry and counts it; the old link stops working', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'v@p.example', expiresAt: new Date('2026-11-13T00:00:00Z') });
    const resent = await withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: invite.id }, clock));
    expect(resent.invite).toMatchObject({ id: invite.id, resentCount: 1, state: 'ok' });
    expect(resent.invite.expiresAt).toBe(new Date(clock.now().getTime() + INVITE_TTL_DAYS * 86_400_000).toISOString());
    expect(resent.token).not.toBe(token);
    expect(await preview(token)).toEqual({ state: 'unknown' });
    expect(await preview(resent.token)).toMatchObject({ state: 'ok' });
  });

  it('refuses to resend or revoke an accepted or withdrawn invite, or one at another company', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const used = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'u@p.example', expiresAt: future, acceptedAt: new Date('2026-11-05T00:00:00Z') });
    const revoked = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'r@p.example', expiresAt: future, revokedAt: new Date('2026-11-05T00:00:00Z') });
    const foreign = await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'f@o.example', expiresAt: future });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: used.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_used' });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: revoked.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_revoked' });
    await expect(withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: used.invite.id }, clock))).rejects.toMatchObject({ reason: 'invite_used' });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: foreign.invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: foreign.invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    const [untouched] = await db.select().from(invites).where(eq(invites.id, foreign.invite.id));
    expect(untouched?.revokedAt).toBeNull();
  });

  it('revoking withdraws the invite so its link reports as withdrawn', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'w@p.example', expiresAt: future });
    const dto = await withViewer(admin, (tx) => revokeInvite(tx, admin, { inviteId: invite.id }, clock));
    expect(dto.state).toBe('revoked');
    expect(await preview(token)).toEqual({ state: 'revoked' });
  });

  it('only a partner manager touches staff invites', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    await expect(withViewer(admin, (tx) => resendInvite(tx, admin, { inviteId: invite.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    expect((await withViewer(manager, (tx) => resendInvite(tx, manager, { inviteId: invite.id }, clock))).invite.resentCount).toBe(1);
  });
});

describe('listOpenInvites', () => {
  it('lists the open invites of the viewer company, newest first, including expired ones', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const first = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'a@p.example', expiresAt: future, createdAt: new Date('2026-11-01T00:00:00Z') });
    const second = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'b@p.example', expiresAt: new Date('2026-11-02T00:00:00Z'), createdAt: new Date('2026-11-02T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'c@p.example', expiresAt: future, acceptedAt: new Date('2026-11-03T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'd@o.example', expiresAt: future });
    const list = await withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'partner' }, clock));
    expect(list.map((i) => [i.id, i.state])).toEqual([[second.invite.id, 'expired'], [first.invite.id, 'ok']]);
    await expect(withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'partner', partnerId: other.id }, clock))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(admin, (tx) => listOpenInvites(tx, admin, { kind: 'staff' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('lists staff invites for a partner manager', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    const list = await withViewer(manager, (tx) => listOpenInvites(tx, manager, { kind: 'staff' }, clock));
    expect(list.map((i) => i.id)).toEqual([invite.id]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/invites.test.ts`
Expected: FAIL, `createInvite` is not exported by `./invites`.

- [ ] **Step 6: Implement invite management**

In `src/server/repo/invites.ts` extend the imports:

```ts
import { and, desc, eq, isNull } from 'drizzle-orm';
import { applications, authAccounts, authTwoFactors, invites, partners, staffScopes, users } from '@/db/schema';
import type { StaffRegion } from '@/lib/domain';
import type { CreatedInviteDto, InviteDto, InvitePreviewDto, InviteState } from '@/lib/dto';
import { isValidEmail } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { issueInvite, rotateInviteToken, toInviteDto } from '@/server/invite-core';
import { assertStaff, type Tx } from './context';
```

(merging with the existing imports, replacing `import type { Tx } from './context';`). Add before the `isolation` export:

```ts
export type NewInviteInput =
  | { kind: 'partner'; partnerId: string; email: string; role: PartnerRole }
  | { kind: 'staff'; email: string; role: StaffRole; region: StaffRegion };

/** Partner admin on own company, partner manager on any, partner manager for staff invites (M1.6, M1.8). */
export async function createInvite(tx: Tx, viewer: Viewer, input: NewInviteInput, clock: Clock): Promise<CreatedInviteDto> {
  if (!isValidEmail(input.email)) throw new ValidationError([{ path: 'email', message: 'Enter a valid work email.' }]);
  if (input.kind === 'staff') {
    assertStaff(viewer);
    return issueInvite(tx, { kind: 'staff', partnerId: null, email: input.email, role: input.role, staffRegion: input.region, invitedBy: viewer.id }, clock);
  }
  if (viewer.kind === 'partner' && input.partnerId !== viewer.partnerId) throw new NotFoundError('partner');
  const [partner] = await tx.select({ id: partners.id }).from(partners).where(eq(partners.id, input.partnerId)).limit(1);
  if (!partner) throw new NotFoundError('partner');
  return issueInvite(tx, { kind: 'partner', partnerId: partner.id, email: input.email, role: input.role, staffRegion: null, invitedBy: viewer.id }, clock);
}

const loadOpenForUpdate = async (tx: Tx, viewer: Viewer, inviteId: string) => {
  const [row] = await tx.select().from(invites).where(eq(invites.id, inviteId)).limit(1).for('update');
  // Another company's invite (and any staff invite, for a partner viewer) is invisible: same answer as a missing id.
  if (!row || (viewer.kind === 'partner' && row.partnerId !== viewer.partnerId)) throw new NotFoundError('invite');
  if (row.kind === 'staff') assertStaff(viewer);
  if (row.acceptedAt) throw new ConflictError('invite_used', 'This invite was already accepted.');
  if (row.revokedAt) throw new ConflictError('invite_revoked', 'This invite was withdrawn.');
  return row;
};

/** Rotates the token, extends the expiry by INVITE_TTL_DAYS from now, increments resentCount (M1.6, M1.8). Only for open invites. */
export async function resendInvite(tx: Tx, viewer: Viewer, input: { inviteId: string }, clock: Clock): Promise<CreatedInviteDto> {
  const row = await loadOpenForUpdate(tx, viewer, input.inviteId);
  const rotated = await rotateInviteToken(tx, row.id, clock);
  if (!rotated) throw new ConflictError('invite_used', 'This invite is no longer open.');
  return rotated;
}

/** Sets revoked_at (M1.6, M1.8). */
export async function revokeInvite(tx: Tx, viewer: Viewer, input: { inviteId: string }, clock: Clock): Promise<InviteDto> {
  const row = await loadOpenForUpdate(tx, viewer, input.inviteId);
  const [revoked] = await tx.update(invites).set({ revokedAt: clock.now() }).where(eq(invites.id, row.id)).returning();
  if (!revoked) throw new Error('invite revoke returned no row');
  return toInviteDto(revoked, clock.now());
}

/** Open invites of one partner (partner viewers: their own), or all staff invites when kind is 'staff' (M1.6, M1.8). Expired ones are included, flagged by state. */
export async function listOpenInvites(
  tx: Tx,
  viewer: Viewer,
  input: { kind: UserKind; partnerId?: string },
  clock: Clock,
): Promise<InviteDto[]> {
  if (input.kind === 'staff') assertStaff(viewer);
  else if (viewer.kind === 'partner' && input.partnerId !== undefined && input.partnerId !== viewer.partnerId) {
    throw new NotFoundError('partner');
  }
  const partnerId = viewer.kind === 'partner' ? viewer.partnerId : input.partnerId;
  const rows = await tx
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.kind, input.kind),
        isNull(invites.acceptedAt),
        isNull(invites.revokedAt),
        input.kind === 'partner' && partnerId ? eq(invites.partnerId, partnerId) : undefined,
      ),
    )
    .orderBy(desc(invites.createdAt));
  return rows.map((row) => toInviteDto(row, clock.now()));
}
```

Replace the `isolation` export with:

```ts
export const isolation = defineIsolation<
  'previewInvite' | 'acceptInvite' | 'createInvite' | 'resendInvite' | 'revokeInvite' | 'listOpenInvites'
>({
  previewInvite: { scope: 'public', reason: 'Public invite page. Takes a SystemActor; covered by invites.test.ts.' },
  acceptInvite: { scope: 'public', reason: 'Public invite flow. Takes a SystemActor; covered by invites.test.ts and actions/invites.test.ts.' },
  createInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => createInvite(tx, viewer, { kind: 'partner', partnerId: ctx.b.partnerId, email: 'probe@example.com', role: 'sales' }, systemClock),
    expect: 'not_found',
  },
  resendInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => resendInvite(tx, viewer, { inviteId: ctx.b.inviteId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'invites', id: ctx.b.inviteId }],
  },
  revokeInvite: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => revokeInvite(tx, viewer, { inviteId: ctx.b.inviteId }, systemClock),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'invites', id: ctx.b.inviteId }],
  },
  listOpenInvites: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => listOpenInvites(tx, viewer, { kind: 'partner', partnerId: ctx.b.partnerId }, systemClock),
    expect: 'not_found',
  },
});
```

Add `import { type Clock, systemClock } from '@/lib/clock';` replacing `import type { Clock } from '@/lib/clock';`.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/invites.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (invites: 22 tests).

- [ ] **Step 7: Write the failing tests for the team actions**

Create `src/server/actions/team.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessRequests, auditLog, invites, notifications, users } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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
vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));

import { revokeAllSessions } from '@/server/auth/sessions';
import {
  changeMemberRoleAction,
  decideAccessRequestAction,
  inviteMemberAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from './team';

const db = testDb();
let fake: FakeEmailTransport;
const future = new Date('2099-01-01T00:00:00Z');

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  vi.mocked(revokeAllSessions).mockClear();
});

const company = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
  harness.viewer = admin;
  return { partner, admin };
};
const events = async () => (await db.select().from(auditLog)).map((a) => a.event).sort();

describe('inviteMemberAction', () => {
  it('invites a colleague: invite row, audit, link by email, no token in the result', async () => {
    const { partner, admin } = await company();
    const result = await inviteMemberAction({ email: 'Meera.Pillai@kestrelsystems.in', role: 'sales' });
    expect(result).toMatchObject({ ok: true, data: { email: 'meera.pillai@kestrelsystems.in', role: 'sales', partnerId: partner.id } });
    expect(JSON.stringify(result)).not.toContain('token');
    expect(await events()).toEqual(['team.invited']);
    const mail = fake.only('meera.pillai@kestrelsystems.in');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=[A-Za-z0-9_-]{43}/u);
    expect(mail.htmlContent).toContain(admin.name);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('reports an existing login, a bad email, and is forbidden for sales and technical users', async () => {
    const { partner, admin } = await company();
    expect(await inviteMemberAction({ email: admin.email, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'This person already has a login.' } });
    expect(await inviteMemberAction({ email: 'nope', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await inviteMemberAction({ email: 'a@kestrelsystems.in', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await inviteMemberAction({ email: 'a@kestrelsystems.in', role: 'sales' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(fake.sent).toHaveLength(0);
  });

  it('never lets a partner admin invite into another company; a partner manager may', async () => {
    await company();
    const other = await makePartner(db, { name: 'Other' });
    expect(await inviteMemberAction({ email: 'x@other.example', role: 'sales', partnerId: other.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await inviteMemberAction({ email: 'x@other.example', role: 'sales', partnerId: other.id })).toMatchObject({ ok: true, data: { partnerId: other.id } });
  });
});

describe('resendInviteAction and revokeInviteAction', () => {
  it('resends with a new link, audits, and withdraws', async () => {
    const { partner } = await company();
    const { invite, token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    const resent = await resendInviteAction({ inviteId: invite.id });
    expect(resent).toMatchObject({ ok: true, data: { id: invite.id, resentCount: 1 } });
    const mail = fake.only('vikram.sethi@kestrelsystems.in');
    expect(mail.htmlContent).not.toContain(token);
    const withdrawn = await revokeInviteAction({ inviteId: invite.id });
    expect(withdrawn).toMatchObject({ ok: true, data: { state: 'revoked' } });
    expect(await events()).toEqual(['team.invite_resent', 'team.invite_revoked']);
  });

  it('cannot touch an invite of another company', async () => {
    await company();
    const other = await makePartner(db, {});
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: other.id, role: 'sales', email: 'f@o.example', expiresAt: future });
    expect(await resendInviteAction({ inviteId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await revokeInviteAction({ inviteId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('changeMemberRoleAction', () => {
  it('changes a role with an audit note and refuses to demote the last admin', async () => {
    const { partner, admin } = await company();
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    expect(await changeMemberRoleAction({ userId: member.id, role: 'technical' })).toMatchObject({ ok: true, data: { role: 'technical' } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'team.role_changed', note: 'Sales to Technical.' });
    expect(entry?.target).toBe('Karan Malhotra, at Kestrel Systems');
    expect(await changeMemberRoleAction({ userId: admin.id, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Every company needs at least one partner admin.' } });
  });

  it('is not allowed across companies and not for non-admins', async () => {
    const { partner } = await company();
    const other = await makePartner(db, {});
    const stranger = await makeUser(db, { partnerId: other.id, role: 'sales' });
    expect(await changeMemberRoleAction({ userId: stranger.id, role: 'technical' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await changeMemberRoleAction({ userId: member.id, role: 'technical' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('removeMemberAction', () => {
  it('disables the person, signs them out, tells the other admins and keeps their deals', async () => {
    const { partner, admin } = await company();
    const second = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'second@kestrelsystems.in' });
    const member = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
    const deal = await makeRegistration(db, { partnerId: partner.id, registeredBy: member.id });
    expect(await removeMemberAction({ userId: member.id })).toMatchObject({ ok: true });
    const [row] = await db.select().from(users).where(eq(users.id, member.id));
    expect(row?.status).toBe('disabled');
    expect(revokeAllSessions).toHaveBeenCalledWith(member.id);
    expect(await events()).toEqual(['team.removed']);
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[second.id, 'team_removed']]);
    expect(fake.to('second@kestrelsystems.in')).toHaveLength(1);
    expect(fake.to(admin.email)).toHaveLength(0);
    expect(deal.partnerId).toBe(partner.id);
  });

  it('cannot remove yourself or the last admin, and cannot reach an invite-only row', async () => {
    const { partner, admin } = await company();
    expect(await removeMemberAction({ userId: admin.id })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot remove yourself.' } });
    const { invite } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'p@kestrelsystems.in', expiresAt: future });
    expect(await removeMemberAction({ userId: invite.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(revokeAllSessions).not.toHaveBeenCalled();
  });
});

describe('decideAccessRequestAction', () => {
  it('approving emails the requester an invite for the chosen role and audits it', async () => {
    const { partner } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    const result = await decideAccessRequestAction({ id: request.id, decision: 'approve', role: 'technical' });
    expect(result).toMatchObject({ ok: true, data: { id: request.id, status: 'approved' } });
    expect(fake.only('rohit@kestrelsystems.in').htmlContent).toMatch(/accept-invite\?token=/u);
    expect(await events()).toEqual(['team.access_request_approved']);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('declining emails the requester and never grants partner admin', async () => {
    const { partner } = await company();
    const request = await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit@kestrelsystems.in', name: 'Rohit Desai' });
    expect(await decideAccessRequestAction({ id: request.id, decision: 'approve', role: 'partner_admin' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await decideAccessRequestAction({ id: request.id, decision: 'decline' })).toMatchObject({ ok: true, data: { status: 'declined' } });
    expect(fake.to('rohit@kestrelsystems.in')).toHaveLength(1);
    expect(await events()).toEqual(['team.access_request_declined']);
    expect((await db.select().from(accessRequests))[0]?.status).toBe('declined');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/team.test.ts`
Expected: FAIL, `Failed to resolve import "./team"`.

- [ ] **Step 8: Implement the team actions**

Create `src/server/actions/team.ts`:

```ts
'use server';

import { z } from 'zod';
import { ACCESS_REQUEST_ROLES, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from '@/lib/domain';
import type { AccessRequestDto, InviteDto, TeamMemberDto } from '@/lib/dto';
import { nameFromEmail } from '@/lib/people';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import type { Viewer } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildAccessRequestDeclined, buildTeamChangeNotice, buildTeamInvite } from '@/server/email/templates';
import type { EmailMessage } from '@/server/email/transport';
import { NotFoundError, ValidationError } from '@/server/errors';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { type Tx, withViewer } from '@/server/repo/context';
import { createInvite, resendInvite, revokeInvite } from '@/server/repo/invites';
import { getCompany, listPartnerAdminRecipients } from '@/server/repo/partners';
import { changeMemberRole, decideAccessRequest, getTeam, removeMember } from '@/server/repo/team';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const partnerId = z.string().uuid().optional();
const inviteSchema = z.object({ email: z.string().trim().max(254), role: z.enum(PARTNER_ROLES), partnerId });
const inviteIdSchema = z.object({ inviteId: z.string().uuid(), partnerId });
const roleSchema = z.object({ userId: z.string().uuid(), role: z.enum(PARTNER_ROLES), partnerId });
const removeSchema = z.object({ userId: z.string().uuid(), partnerId });
const decideSchema = z.discriminatedUnion('decision', [
  z.object({ id: z.string().uuid(), partnerId, decision: z.literal('approve'), role: z.enum(ACCESS_REQUEST_ROLES) }),
  z.object({ id: z.string().uuid(), partnerId, decision: z.literal('decline') }),
]);

const lower = (role: PartnerRole): string => PARTNER_ROLE_LABEL[role].toLowerCase();

/** The company the action is about: the viewer's own, or the partner a manager named. */
const loadTeam = (tx: Tx, viewer: Viewer, requested: string | undefined) => getTeam(tx, viewer, requested ? { partnerId: requested } : {});

const inviteMail = (args: {
  invite: InviteDto;
  token: string;
  inviteeName: string | null;
  inviterName: string;
  companyName: string;
}): EmailMessage =>
  buildTeamInvite({
    to: { email: args.invite.email, ...(args.inviteeName ? { name: args.inviteeName } : {}) },
    inviteeName: args.inviteeName,
    inviterName: args.inviterName,
    audience: 'partner',
    companyName: args.companyName,
    roleLabel: PARTNER_ROLE_LABEL[args.invite.role as PartnerRole],
    inviteUrl: inviteUrl(args.token),
    expiresOn: args.invite.expiresAt.slice(0, 10),
  });

export async function inviteMemberAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.invite', schema: inviteSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const target = input.partnerId ?? (ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : undefined);
    if (!target) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
    assertCan(ctx.viewer, 'team.invite', { partnerId: target });
    const done = await withViewer(ctx.viewer, async (tx) => {
      const company = await getCompany(tx, ctx.viewer, { partnerId: target });
      const created = await createInvite(tx, ctx.viewer, { kind: 'partner', partnerId: target, email: input.email, role: input.role }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invited',
        target: `${nameFromEmail(created.invite.email)}, ${lower(input.role)}, at ${company.name}`,
        partnerId: target,
        subject: { type: 'invite', id: created.invite.id },
      });
      return { created, companyName: company.name };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(inviteMail({ invite: done.created.invite, token: done.created.token, inviteeName: null, inviterName: ctx.viewer.name, companyName: done.companyName }));
    });
    return done.created.invite;
  });
}

export async function resendInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.resend_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const member = team.members.find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      assertCan(ctx.viewer, 'team.resend_invite', { partnerId: team.partnerId });
      const resent = await resendInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invite_resent',
        target: `${member.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'invite', id: resent.invite.id },
      });
      return { resent, member, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      await sendEmail(inviteMail({ invite: done.resent.invite, token: done.resent.token, inviteeName: done.member.name, inviterName: ctx.viewer.name, companyName: done.companyName }));
    });
    return done.resent.invite;
  });
}

export async function revokeInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'team.revoke_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    const revoked = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const member = team.members.find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      assertCan(ctx.viewer, 'team.revoke_invite', { partnerId: team.partnerId });
      const dto = await revokeInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.invite_revoked',
        target: `${member.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'invite', id: dto.id },
      });
      return dto;
    });
    ctx.revalidate(ROUTES.partner.team);
    return revoked;
  });
}

export async function changeMemberRoleAction(raw: unknown): Promise<ActionResult<TeamMemberDto>> {
  return runViewerAction({ name: 'team.change_role', schema: roleSchema }, raw, async (ctx, input): Promise<TeamMemberDto> => {
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const before = team.members.find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.change_role', { partnerId: team.partnerId });
      const after = await changeMemberRole(tx, ctx.viewer, { userId: input.userId, role: input.role });
      if (before.role !== after.role) {
        await recordAudit(tx, ctx.viewer, {
          event: 'team.role_changed',
          target: `${after.name}, at ${team.partnerName}`,
          note: `${PARTNER_ROLE_LABEL[before.role]} to ${PARTNER_ROLE_LABEL[after.role]}.`,
          partnerId: team.partnerId,
          subject: { type: 'user', id: after.id },
        });
      }
      return after;
    });
    ctx.revalidate(ROUTES.partner.team);
    return changed;
  });
}

export async function removeMemberAction(raw: unknown): Promise<ActionResult<{ userId: string }>> {
  return runViewerAction({ name: 'team.remove', schema: removeSchema }, raw, async (ctx, input): Promise<{ userId: string }> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      // An invite-only row has no user to remove; it is withdrawn through revokeInviteAction.
      const member = team.members.find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!member) throw new NotFoundError('user');
      assertCan(ctx.viewer, 'team.remove', { partnerId: team.partnerId });
      const removed = await removeMember(tx, ctx.viewer, { userId: member.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'team.removed',
        target: `${removed.name}, ${lower(removed.role)}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: removed.userId },
      });
      const admins = await listPartnerAdminRecipients(tx, { partnerId: team.partnerId });
      const items: NewNotification[] = admins
        .filter((admin) => admin.userId !== removed.userId && admin.userId !== ctx.viewer.id)
        .map((admin) => ({
          userId: admin.userId,
          kind: 'team_removed' as const,
          title: `${removed.name} was removed from ${team.partnerName}`,
          body: PARTNER_ROLE_LABEL[removed.role],
          link: ROUTES.partner.team,
        }));
      await notifyUsers(tx, items);
      return { removed, items, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      // auth_session is system-only under RLS, so the sessions go here, after commit (contracts F.3, B.6).
      await revokeAllSessions(done.removed.userId);
      for (const to of await resolveEmailRecipients(done.items)) {
        await sendEmail(
          buildTeamChangeNotice({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            kind: 'removed',
            personName: done.removed.name,
            companyName: done.companyName,
          }),
        );
      }
    });
    return { userId: done.removed.userId };
  });
}

export async function decideAccessRequestAction(raw: unknown): Promise<ActionResult<AccessRequestDto>> {
  return runViewerAction({ name: 'team.decide_access_request', schema: decideSchema }, raw, async (ctx, input): Promise<AccessRequestDto> => {
    const done = await withViewer(ctx.viewer, async (tx) => {
      const team = await loadTeam(tx, ctx.viewer, input.partnerId);
      const request = team.requests.find((r) => r.id === input.id);
      if (!request) throw new NotFoundError('access request');
      assertCan(ctx.viewer, 'access_request.decide', { partnerId: team.partnerId });
      const result = await decideAccessRequest(
        tx,
        ctx.viewer,
        input.decision === 'approve' ? { id: input.id, decision: 'approve', role: input.role } : { id: input.id, decision: 'decline' },
        ctx.clock,
      );
      await recordAudit(tx, ctx.viewer, {
        event: input.decision === 'approve' ? 'team.access_request_approved' : 'team.access_request_declined',
        target:
          input.decision === 'approve'
            ? `${request.name}, ${lower(input.role)}, at ${team.partnerName}`
            : `${request.name}, at ${team.partnerName}`,
        partnerId: team.partnerId,
        subject: { type: 'user', id: request.id },
      });
      return { result, request, companyName: team.partnerName };
    });
    ctx.revalidate(ROUTES.partner.team);
    ctx.afterCommit(async () => {
      if (done.result.invite) {
        await sendEmail(
          inviteMail({
            invite: done.result.invite.invite,
            token: done.result.invite.token,
            inviteeName: done.request.name,
            inviterName: ctx.viewer.name,
            companyName: done.companyName,
          }),
        );
        return;
      }
      await sendEmail(
        buildAccessRequestDeclined({
          to: { email: done.request.email, name: done.request.name },
          requesterName: done.request.name,
          companyName: done.companyName,
        }),
      );
    });
    return done.result.request;
  });
}
```

The `subject` of the access request audit uses type `'user'` because the audit subject union has no `'access_request'` type; the id is the request id (see "Contract change requests", item 8).

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/team.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 9: Write the failing tests for `requestAccessAction`**

Append to `src/server/actions/invites.test.ts`. Add `accessRequests` to the `@/db/schema` import and `makeUser` is already imported; extend the actions import to `import { acceptInviteAction, previewInviteAction, requestAccessAction } from './invites';`. Then append:

```ts
describe('requestAccessAction', () => {
  const ask = (overrides: Record<string, unknown> = {}) =>
    requestAccessAction({ name: 'Rohit Desai', email: 'rohit.desai@kestrelsystems.in', note: 'I lead the Mumbai sales team.', ...overrides });
  const kestrel = async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi.rao@kestrelsystems.in', name: 'Aditi Rao' });
    return { partner, admin };
  };

  it('answers exactly the same whether or not the domain is a partner, and the same for a person who already has a login', async () => {
    const { partner } = await kestrel();
    await makeUser(db, { partnerId: partner.id, email: 'has.login@kestrelsystems.in' });
    const matched = await ask();
    const unknown = await ask({ email: 'someone@not-a-partner.example' });
    const hasLogin = await ask({ email: 'has.login@kestrelsystems.in' });
    expect(matched).toEqual({ ok: true, data: { confirmation: 'sent' } });
    expect(unknown).toEqual(matched);
    expect(hasLogin).toEqual(matched);
  });

  it('for a matching domain: one open request, a notification and an email to the partner admin, an audit entry', async () => {
    const { admin } = await kestrel();
    await ask();
    expect(await db.select().from(accessRequests)).toHaveLength(1);
    expect((await db.select().from(notifications)).map((n) => [n.userId, n.kind])).toEqual([[admin.id, 'access_requested']]);
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['team.access_requested']);
    await vi.waitFor(() => expect(fake.to('aditi.rao@kestrelsystems.in')).toHaveLength(1));
    expect(fake.to('aditi.rao@kestrelsystems.in')[0]?.htmlContent).toContain('Rohit Desai');
  });

  it('for any other domain: nothing is stored and nobody is emailed', async () => {
    await kestrel();
    await ask({ email: 'someone@not-a-partner.example' });
    expect(await db.select().from(accessRequests)).toHaveLength(0);
    expect(await db.select().from(notifications)).toHaveLength(0);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fake.sent).toHaveLength(0);
  });

  it('asking twice keeps one open request and sends the admin one email', async () => {
    await kestrel();
    await ask();
    await ask({ note: 'second try' });
    expect(await db.select().from(accessRequests)).toHaveLength(1);
    await vi.waitFor(() => expect(fake.to('aditi.rao@kestrelsystems.in')).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fake.to('aditi.rao@kestrelsystems.in')).toHaveLength(1);
  });

  it('rejects free-mail addresses, needs a name, and rate limits by IP and by email', async () => {
    await kestrel();
    expect(await ask({ email: 'rohit@gmail.com' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'email' }] } });
    expect(await ask({ name: ' ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    for (let i = 0; i < 3; i += 1) await ask({ email: 'same@kestrelsystems.in' });
    expect(await ask({ email: 'same@kestrelsystems.in' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
    const fresh = `203.0.113.${(ipCounter += 1)}`;
    harness.ip = fresh;
    for (let i = 0; i < 5; i += 1) await ask({ email: `p${i}@kestrelsystems.in` });
    expect(await ask({ email: 'p9@kestrelsystems.in' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/invites.test.ts`
Expected: FAIL, `requestAccessAction` is not a function.

- [ ] **Step 10: Implement `requestAccessAction`**

In `src/server/actions/invites.ts` extend the imports:

```ts
import { validateBusinessEmail } from '@cleanstart/forms';
import { FREE_EMAIL_DOMAINS } from '@cleanstart/forms/server';
import { buildAccessRequest, buildTeamChangeNotice } from '@/server/email/templates';
import { ValidationError } from '@/server/errors';
import { createAccessRequest } from '@/server/repo/team';
import { absoluteUrl } from '@/server/urls';
```

(merging with the existing imports; `buildTeamChangeNotice` is already imported). Add the schema and rules near the top:

```ts
const requestSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(120),
  email: z.string().trim().max(254),
  note: z.string().trim().max(500).optional(),
});
const REQUEST_IP_RULE = { limit: 5, windowSeconds: 600 } as const;
const REQUEST_EMAIL_RULE = { limit: 3, windowSeconds: 3600 } as const;
```

Append the action:

```ts
/**
 * "Request access" on the sign-in page. The answer is the same whether or not the domain is a partner, whether or not
 * the person already has a login, and whether or not a request was created, so it cannot be used to discover accounts.
 * The admin email is sent without being awaited, so the response time does not depend on the match either.
 */
export async function requestAccessAction(raw: unknown): Promise<ActionResult<{ confirmation: 'sent' }>> {
  return runPublicAction({ name: 'access.request', schema: requestSchema }, raw, async (ctx, input): Promise<{ confirmation: 'sent' }> => {
    const checked = validateBusinessEmail(input.email, { freeDomains: FREE_EMAIL_DOMAINS, requireBusiness: true });
    if (!checked.ok) {
      throw new ValidationError([
        { path: 'email', message: checked.reason === 'free-mail' ? 'Use your company email, not a personal address.' : 'Enter a valid work email.' },
      ]);
    }
    if (ctx.ip) rateLimit(`access:ip:${ctx.ip}`, REQUEST_IP_RULE);
    rateLimit(`access:email:${checked.email}`, REQUEST_EMAIL_RULE);

    const actor = publicActor(input.name);
    const found = await withSystem(actor, async (tx) => {
      const result = await createAccessRequest(tx, actor, { email: checked.email, name: input.name, note: input.note ?? null }, ctx.clock);
      let items: NewNotification[] = [];
      if (result.matched && result.partnerId && result.requestId) {
        await recordAudit(tx, actor, {
          event: 'team.access_requested',
          target: `${input.name}, at ${result.partnerName ?? ''}`,
          partnerId: result.partnerId,
          subject: { type: 'user', id: result.requestId },
        });
        items = result.adminRecipients.map((admin) => ({
          userId: admin.userId,
          kind: 'access_requested' as const,
          title: `${input.name} asked for access`,
          body: checked.email,
          link: ROUTES.partner.team,
        }));
        await notifyUsers(tx, items);
      }
      return { result, items };
    });

    if (found.items.length > 0) {
      ctx.afterCommit(async () => {
        void (async () => {
          const to = (await resolveEmailRecipients(found.items)).map((r) => ({ email: r.email, name: r.name }));
          if (to.length === 0) return;
          await sendEmail(
            buildAccessRequest({
              to,
              requesterName: input.name,
              requesterEmail: checked.email,
              note: input.note ?? null,
              companyName: found.result.partnerName ?? '',
              reviewUrl: absoluteUrl(ROUTES.partner.team),
            }),
          );
        })();
      });
    }
    return { confirmation: 'sent' };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/invites.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 11: Convert `InviteCard.tsx`**

Replace `src/components/people/InviteCard.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import { isValidEmail } from "@/lib/people";
import { inviteMemberAction } from "@/server/actions/team";
import { issuesToErrors } from "@/server/actions/result";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));

export function InviteCard({ existingEmails }: { existingEmails: readonly string[] }): React.JSX.Element {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PartnerRole>("sales");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();
  const valid = isValidEmail(address);
  const duplicate = existingEmails.includes(address);
  const showError = (tried && (!valid || duplicate)) || serverError !== null;

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError(null);
    if (!valid || duplicate) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await inviteMemberAction({ email: address, role });
    setBusy(false);
    if (!result.ok) {
      setServerError(issuesToErrors(result.error).email ?? result.error.message);
      return;
    }
    setEmail("");
    setTried(false);
    toast(`Invite sent to ${address}`);
  };

  return (
    <form onSubmit={submit} noValidate aria-labelledby="inv" className="card clip">
      <div className="card-h">
        <h2 id="inv" className="card-t">
          Invite a colleague
        </h2>
      </div>
      <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div className="fg">
          <label htmlFor="ie" className="lbl">
            Work email
          </label>
          <input
            id="ie"
            className={`field${showError ? " field-err" : ""}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={showError}
            aria-describedby={showError ? "ie-err" : undefined}
          />
          {showError ? (
            <span className="err" id="ie-err">
              {serverError ?? (duplicate ? "This person already has a login." : "Enter a valid work email.")}
            </span>
          ) : null}
        </div>
        <div className="fg">
          <label htmlFor="ir" className="lbl">
            Role
          </label>
          <Dropdown
            id="ir"
            variant="field"
            value={role}
            options={ROLE_OPTIONS}
            onChange={(v) => {
              if (isOneOf(PARTNER_ROLES, v)) setRole(v);
            }}
          />
        </div>
        <button type="submit" className="btn btn-p" style={{ alignSelf: "flex-start" }} data-tour="team-invite" disabled={busy}>
          <Icon name="userplus" />
          Send invite
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 12: Convert `AccessRequests.tsx`**

Replace `src/components/people/AccessRequests.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { fmtShort } from "@/lib/dates";
import { ACCESS_REQUEST_ROLES, type AccessRequestRole, PARTNER_ROLE_LABEL } from "@/lib/domain";
import type { AccessRequestDto } from "@/lib/dto";
import { codeFromLabel, emailDomain, initialsOf } from "@/lib/people";
import { decideAccessRequestAction } from "@/server/actions/team";
import { RowAction } from "./RowAction";
import { Seg } from "./Seg";

const REQUEST_ROLES: readonly string[] = ACCESS_REQUEST_ROLES.map((role) => PARTNER_ROLE_LABEL[role]);

export function AccessRequests({
  requests,
  today,
}: {
  requests: AccessRequestDto[];
  today: string;
}): React.JSX.Element | null {
  const toast = useToast();
  // The role the admin picked per request; until then the role the person asked for.
  const [picked, setPicked] = useState<Record<string, AccessRequestRole>>({});
  if (requests.length === 0) return null;

  const roleOf = (rq: AccessRequestDto): AccessRequestRole => picked[rq.id] ?? rq.role;

  const approve = async (rq: AccessRequestDto): Promise<void> => {
    const result = await decideAccessRequestAction({ id: rq.id, decision: "approve", role: roleOf(rq) });
    toast(result.ok ? `${rq.name} can now set a password and sign in` : result.error.message);
  };

  const decline = async (rq: AccessRequestDto): Promise<void> => {
    const result = await decideAccessRequestAction({ id: rq.id, decision: "decline" });
    toast(result.ok ? `Request declined. ${rq.name} gets an email.` : result.error.message);
  };

  const asked = (rq: AccessRequestDto): string =>
    rq.requestedAt.slice(0, 10) === today ? "Asked today" : `Asked ${fmtShort(rq.requestedAt.slice(0, 10))}`;

  return (
    <section
      aria-labelledby="reqs"
      className="card clip"
      style={{ borderColor: "#E3DDFA" }}
      data-tour="team-requests"
    >
      <div className="card-h" style={{ background: "#FAF8FF" }}>
        <h2 id="reqs" className="card-t">
          Access requests
        </h2>
        <span className="card-meta">
          People at {emailDomain(requests[0]?.email ?? "")} who asked for a login
        </span>
      </div>
      {requests.map((rq) => (
        <div
          key={rq.id}
          className="li"
          style={{ padding: "10px 12px", alignItems: "flex-start", flexWrap: "wrap", gap: "10px 12px" }}
        >
          <span className="av av-1 av-r">{initialsOf(rq.name)}</span>
          <span className="li-t" style={{ flex: "1 1 260px" }}>
            <span className="li-n" style={{ fontSize: 13 }}>
              {rq.name} <span className="t-muted" style={{ fontWeight: 500 }}>{rq.email}</span>
            </span>
            <span className="li-s" style={{ whiteSpace: "normal" }}>
              {asked(rq)}.{rq.note ? ` "${rq.note}"` : ""}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <Seg
              options={REQUEST_ROLES}
              value={PARTNER_ROLE_LABEL[roleOf(rq)]}
              onChange={(label) => {
                const code = codeFromLabel(PARTNER_ROLE_LABEL, label);
                if (code === "sales" || code === "technical") setPicked((prev) => ({ ...prev, [rq.id]: code }));
              }}
              ariaLabel={`Role for ${rq.name}`}
              compact
            />
            <span className="acts">
              <RowAction label={`Decline ${rq.name}`} tip="Decline" icon="x" tone="no" onClick={() => void decline(rq)} />
              <RowAction
                label={`Approve ${rq.name}`}
                tip="Approve and send a login link"
                icon="check"
                tone="ok"
                onClick={() => void approve(rq)}
              />
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 13: Convert `Team.tsx`**

Replace `src/components/screens/Team.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { AccessRequests } from "@/components/people/AccessRequests";
import { InviteCard } from "@/components/people/InviteCard";
import { RowAction } from "@/components/people/RowAction";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { isOneOf, PARTNER_ROLE_LABEL, PARTNER_ROLES, type PartnerRole } from "@/lib/domain";
import type { TeamDto, TeamMemberDto } from "@/lib/dto";
import { initialsOf, invitedLabel, lastSeenLabel, rowKey } from "@/lib/people";
import type { ActionResult } from "@/server/actions/result";
import {
  changeMemberRoleAction,
  removeMemberAction,
  resendInviteAction,
  revokeInviteAction,
} from "@/server/actions/team";

const ROLE_ORDER: readonly PartnerRole[] = ["sales", "technical", "partner_admin"];
const ROLE_OPTIONS: readonly DropdownOption[] = ROLE_ORDER.map((value) => ({ value, label: PARTNER_ROLE_LABEL[value] }));
const ROLE_TONE: Record<PartnerRole, BadgeTone> = {
  partner_admin: "violet",
  sales: "blue",
  technical: "cyan",
};
const AVATARS = ["av-1", "av-2", "av-3", "av-4"] as const;

const PERMISSIONS: ReadonlyArray<readonly [string, boolean, boolean, boolean]> = [
  ["Register and track deals", true, true, false],
  ["Open documents", true, true, true],
  ["Invite or remove people", true, false, false],
  ["Edit company profile", true, false, false],
];

function Perm({ yes }: { yes: boolean }): React.JSX.Element {
  return <td className={`r ${yes ? "t-green" : "t-muted"}`}>{yes ? "Yes" : "No"}</td>;
}

export function Team({ team, today }: { team: TeamDto; today: string }): React.JSX.Element {
  const toast = useToast();
  const { members, requests } = team;
  const [confirming, setConfirming] = useState<string | null>(null);

  // A failed action shows its safe message (for example "Every company needs at least one partner admin.").
  const report = async (pending: Promise<ActionResult<unknown>>, success?: string): Promise<void> => {
    const result = await pending;
    if (!result.ok) toast(result.error.message);
    else if (success) toast(success);
  };

  const changeRole = (member: TeamMemberDto, role: PartnerRole): void =>
    void report(changeMemberRoleAction({ userId: member.id, role }));

  // Someone who only has an invite has no account to remove: removing them withdraws the invite.
  const isInviteOnly = (member: TeamMemberDto): boolean => member.inviteId !== null && member.inviteId === member.id;

  const remove = (member: TeamMemberDto): void => {
    setConfirming(null);
    void report(
      isInviteOnly(member) && member.inviteId
        ? revokeInviteAction({ inviteId: member.inviteId })
        : removeMemberAction({ userId: member.id }),
    );
  };

  const resend = (member: TeamMemberDto): void => {
    if (!member.inviteId) return;
    void report(resendInviteAction({ inviteId: member.inviteId }), `Invite resent to ${member.email}`);
  };

  const lastActive = (m: TeamMemberDto): string =>
    m.isYou ? "Now" : m.status === "invited" ? invitedLabel(m.invitedAt) : lastSeenLabel(m.lastActiveAt, today);

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Team</h1>
          <span className="h1-sub">
            Everyone at {team.partnerName} with a login. Deals stay with the company when someone leaves.
          </span>
        </div>
      </div>

      <AccessRequests requests={requests} today={today} />

      <div className="row">
        <section
          aria-labelledby="people"
          className="card clip"
          style={{ flex: "1 1 620px", minWidth: 0 }}
          data-tour="team-members"
        >
          <div className="card-h">
            <h2 id="people" className="card-t">
              People
            </h2>
            <span className="card-meta tnum">
              {members.length} people, {members.filter((m) => m.status !== "active").length} invited
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last active</th>
                  <th scope="col" className="r">
                    Deals
                  </th>
                  <th scope="col" className="r">
                    <span className="sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => (
                  <tr key={m.id}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className={`av av-r ${m.isYou ? "av-me" : (AVATARS[i % AVATARS.length] ?? "av-1")}`}>
                          {initialsOf(m.name)}
                        </span>
                        <span className="li-t">
                          <span className="li-n" style={{ fontSize: 13 }}>
                            {m.name}
                            {m.isYou ? (
                              <span className="t-muted" style={{ fontWeight: 500 }}>
                                {" "}
                                (you)
                              </span>
                            ) : null}
                          </span>
                          <span className="li-s">{m.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      {m.isYou || m.status === "invited" ? (
                        <Badge tone={ROLE_TONE[m.role]}>{PARTNER_ROLE_LABEL[m.role]}</Badge>
                      ) : (
                        <Dropdown
                          variant="rsel"
                          id={`role-${rowKey(m.email)}`}
                          ariaLabel={`Role for ${m.name}`}
                          value={m.role}
                          options={ROLE_OPTIONS}
                          onChange={(v) => {
                            if (isOneOf(PARTNER_ROLES, v) && v !== m.role) changeRole(m, v);
                          }}
                        />
                      )}
                    </td>
                    <td>
                      <Badge tone={m.status === "active" ? "accepted" : "pending"}>
                        {m.status === "active" ? "Active" : "Invited"}
                      </Badge>
                    </td>
                    <td className="t-sec">{lastActive(m)}</td>
                    <td className="tnum r">{m.deals}</td>
                    <td className="r">
                      {m.isYou ? null : confirming === m.id ? (
                        <span className="confirm">
                          <button
                            type="button"
                            className="btn btn-dd"
                            onClick={() => remove(m)}
                            aria-label={`Confirm: remove access for ${m.name}`}
                            style={{ height: 24, padding: "0 8px", fontSize: 12 }}
                          >
                            Remove access
                          </button>
                          <button
                            type="button"
                            className="ibtn"
                            onClick={() => setConfirming(null)}
                            aria-label={`Keep ${m.name}`}
                            title="Cancel"
                            style={{ width: 24, height: 24 }}
                          >
                            <Icon name="x" />
                          </button>
                        </span>
                      ) : (
                        <span className="acts">
                          {m.status === "invited" ? (
                            <RowAction
                              label={`Resend invite to ${m.name}`}
                              tip="Resend invite"
                              icon="send"
                              onClick={() => resend(m)}
                            />
                          ) : null}
                          <RowAction
                            label={`Remove ${m.name}`}
                            tip="Remove access"
                            icon="trash"
                            tone="no"
                            onClick={() => setConfirming(m.id)}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside style={{ flex: "0 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 12 }}>
          <InviteCard existingEmails={members.map((m) => m.email)} />
          <section aria-labelledby="roles" className="card clip">
            <div className="card-h">
              <h2 id="roles" className="card-t">
                What each role can do
              </h2>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col" className="r">
                    Admin
                  </th>
                  <th scope="col" className="r">
                    Sales
                  </th>
                  <th scope="col" className="r">
                    Tech
                  </th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(([action, admin, sales, tech]) => (
                  <tr key={action}>
                    <td style={{ whiteSpace: "normal" }}>{action}</td>
                    <Perm yes={admin} />
                    <Perm yes={sales} />
                    <Perm yes={tech} />
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </aside>
      </div>
    </div>
  );
}
```

Behaviour differences from the mock, for the product owner: someone who has only been invited shows their role as a badge (the role is fixed on the invite; withdraw and re-invite to change it), and the sample email in "Invite a colleague" is gone.

- [ ] **Step 14: Write the team page**

Replace `src/app/partner/team/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { Team } from "@/components/screens/Team";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getTeam } from "@/server/repo/team";

export const metadata: Metadata = { title: "Team" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("team.read");
  const team = await withViewer(viewer, (tx) => getTeam(tx, viewer, {}));
  return <Team team={team} today={systemClock.today()} />;
}
```

- [ ] **Step 15: Create the request-access form and wire it into `SignIn.tsx`**

Create `src/components/people/RequestAccessForm.tsx`. It replaces the mock's three views ("request", "requested", "nopartner") with two: the form, and one confirmation that reads the same for every address.

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { CHECK_D, PublicHeading, StatusIcon } from "@/components/partners/public-frame";
import { isFreeEmail, isValidEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { requestAccessAction } from "@/server/actions/invites";
import { issuesToErrors } from "@/server/actions/result";

const FORM_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: 360,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};
const BTN_BIG: React.CSSProperties = { height: 38, fontSize: 13.5 };

export function RequestAccessForm({ onBack }: { onBack: () => void }): React.JSX.Element {
  const [rq, setRq] = useState({ name: "", email: "", note: "" });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const emailFree = isFreeEmail(rq.email);
  const emailBad = !isValidEmail(rq.email) || emailFree;
  const nameBad = !rq.name.trim();

  const send = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (nameBad || emailBad) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await requestAccessAction({ name: rq.name, email: rq.email, note: rq.note });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div role="status" style={FORM_STYLE}>
        <StatusIcon d={CHECK_D} tone="green" />
        <PublicHeading title="Request sent">
          If your company is a CleanStart partner, its partner admin has been told and will review your request. You
          get an email with a link to set your password once they approve.
        </PublicHeading>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
          Not a partner company yet?{" "}
          <Link href={ROUTES.apply} style={{ fontWeight: 600 }}>
            Apply to become a partner
          </Link>
          .
        </p>
        <button type="button" className="btn btn-s" onClick={onBack} style={{ alignSelf: "flex-start" }}>
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} noValidate style={FORM_STYLE}>
      <PublicHeading title="Request access">
        For people at a company that is already a CleanStart partner. Your partner admin approves the request.
      </PublicHeading>
      <div className="fg">
        <label htmlFor="rq-name" className="lbl">
          Full name
        </label>
        <input
          id="rq-name"
          className={`field${tried && nameBad ? " field-err" : ""}`}
          type="text"
          autoComplete="name"
          value={rq.name}
          onChange={(e) => setRq({ ...rq, name: e.target.value })}
          aria-invalid={tried && nameBad ? true : undefined}
          aria-describedby="rq-name-err"
        />
        {tried && nameBad ? (
          <span className="err" id="rq-name-err">
            Enter your name.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="rq-email" className="lbl">
          Work email
        </label>
        <input
          id="rq-email"
          className={`field${(tried && emailBad) || serverErrors.email ? " field-err" : ""}`}
          type="email"
          autoComplete="email"
          value={rq.email}
          onChange={(e) => setRq({ ...rq, email: e.target.value })}
          aria-invalid={(tried && emailBad) || serverErrors.email ? true : undefined}
          aria-describedby="rq-email-err"
        />
        {(tried && emailBad) || serverErrors.email ? (
          <span className="err" id="rq-email-err">
            {serverErrors.email ??
              (emailFree ? "Use your company email, not a personal address." : "Enter a valid work email.")}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="rq-note" className="lbl">
          Note to your partner admin <span className="hint">(optional)</span>
        </label>
        <textarea
          id="rq-note"
          className="field"
          rows={2}
          value={rq.note}
          onChange={(e) => setRq({ ...rq, note: e.target.value })}
        />
      </div>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
      <button type="submit" className="btn btn-p" style={BTN_BIG} disabled={busy}>
        Send request
      </button>
      <button type="button" className="btn btn-g" onClick={onBack} style={{ alignSelf: "flex-start" }}>
        Back to sign in
      </button>
    </form>
  );
}
```

Now edit `src/components/screens/SignIn.tsx`, the request views only. Open the file as plan 02 left it. If any quoted text below no longer matches, apply the same three changes to the equivalent code. Do not touch the sign-in, code, forgot or sent views.

Edit 1, the type, imports and request state. Before:

```tsx
import { PasswordField } from "@/components/ui/password-field";
import {
  emailDomain,
  findPartnerByDomain,
  isFreeEmail,
  isValidEmail,
  partnersSlice,
} from "@/data/partners";
import { ROUTES } from "@/lib/routes";

type View = "signin" | "code" | "request" | "requested" | "nopartner" | "forgot" | "sent";
```

After (if plan 02 left other uses of `emailDomain` or `isValidEmail`, keep a trimmed import from `@/lib/people` instead of deleting it):

```tsx
import { RequestAccessForm } from "@/components/people/RequestAccessForm";
import { PasswordField } from "@/components/ui/password-field";
import { emailDomain, isValidEmail } from "@/lib/people";
import { ROUTES } from "@/lib/routes";

type View = "signin" | "code" | "request" | "forgot" | "sent";
```

Before:

```tsx
  const router = useRouter();
  const { partners } = partnersSlice.use();
  const [view, setView] = useState<View>("signin");
```

After:

```tsx
  const router = useRouter();
  const [view, setView] = useState<View>("signin");
```

Before:

```tsx
  const [rq, setRq] = useState({ name: "", email: "", note: "" });
  const [rqTried, setRqTried] = useState(false);
```

After: delete both lines.

Edit 2, the request handlers. Before:

```tsx
  const rqEmailFree = isFreeEmail(rq.email);
  const rqEmailBad = !isValidEmail(rq.email) || rqEmailFree;
  const rqNameBad = !rq.name.trim();
  const rqPartner = findPartnerByDomain(partners, emailDomain(rq.email));
  const sendRequest = (event: React.FormEvent): void => {
    event.preventDefault();
    if (rqNameBad || rqEmailBad) {
      setRqTried(true);
      return;
    }
    setView(rqPartner ? "requested" : "nopartner");
  };
```

After: delete the whole block. Before:

```tsx
  const showRequest = (): void => {
    setRqTried(false);
    setView("request");
  };
```

After:

```tsx
  const showRequest = (): void => setView("request");
```

Edit 3, the three views. Delete the three JSX blocks that start with `{view === "request" ? (`, `{view === "requested" ? (` and `{view === "nopartner" ? (` (each ends with `) : null}`) and put this in their place:

```tsx
        {view === "request" ? <RequestAccessForm onBack={backToSignin} /> : null}
```

End state check: `grep -n "partnersSlice\|findPartnerByDomain\|rqPartner\|requested\|nopartner" src/components/screens/SignIn.tsx` prints nothing.

- [ ] **Step 16: Prove no slice import is left**

Run: `grep -n "@/data/\|@/lib/slice\|teamSlice" src/components/screens/Team.tsx src/components/people/InviteCard.tsx src/components/people/AccessRequests.tsx src/components/people/RequestAccessForm.tsx src/components/screens/SignIn.tsx`
Expected: no output.

- [ ] **Step 17: Gate A**

Run the Gate A block. The last command must list only this task's Files block plus `src/components/people/RequestAccessForm.tsx`.

- [ ] **Step 18: Manual check (signed in as `aditi.rao@kestrelsystems.in`, seed password, route `/partner/team`)**

1. The page shows "Team", "Everyone at Kestrel Systems with a login...", the access request from Rohit Desai ("Asked today", his note), and four people: Aditi (you), Karan, Sneha, and Vikram Sethi as Invited with a Resend and a Remove button.
2. Change Karan to Technical in the dropdown: it sticks on reload. Try to change Aditi: she is a badge, not a dropdown. Make Karan "Partner admin", then remove Aditi... you cannot remove yourself (no button). Sign in as Karan, demote the only other admin: the toast reads "Every company needs at least one partner admin." when it would leave none.
3. Invite `meera.pillai@kestrelsystems.in` as Sales in the card: toast "Invite sent to meera.pillai@kestrelsystems.in", a new Invited row appears. Invite an existing address: "This person already has a login."
4. Resend Vikram's invite: toast. Remove Vikram: confirm, the row disappears (the invite is withdrawn). Remove Sneha: confirm, the row disappears; `select status from users where name = 'Sneha Iyer'` is `disabled` and her deals still list Kestrel.
5. Approve Rohit's request as Technical: toast "Rohit Desai can now set a password and sign in"; the request card disappears and Rohit shows as Invited. Check `psql ... -c "select event from audit_log order by at desc limit 5"`.
6. Signed out, open `/sign-in?request=1`: submit `someone@gmail.com` (inline free-mail error), then `someone@not-a-partner.example` and `rohit.desai@kestrelsystems.in`: both land on the identical "Request sent" panel. `select count(*) from access_requests where status = 'open'` rose by at most one.

- [ ] **Step 19: Commit**

```bash
git add apps/portal/src/server/partner-people.ts apps/portal/src/server/partner-people.test.ts \
  apps/portal/src/server/repo/team.ts apps/portal/src/server/repo/team.test.ts \
  apps/portal/src/server/repo/invites.ts apps/portal/src/server/repo/invites.test.ts \
  apps/portal/src/server/actions/team.ts apps/portal/src/server/actions/team.test.ts \
  apps/portal/src/server/actions/invites.ts apps/portal/src/server/actions/invites.test.ts \
  apps/portal/src/components/screens/Team.tsx apps/portal/src/components/people/InviteCard.tsx \
  apps/portal/src/components/people/AccessRequests.tsx apps/portal/src/components/people/RequestAccessForm.tsx \
  apps/portal/src/components/screens/SignIn.tsx apps/portal/src/app/partner/team/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.6 team and access requests"
```

---
### Task M1.7: Account and company screens

Implements master task 1.7. Profile, notification preferences, active sessions with sign-out, and the company profile (edited by the partner admin only). The password card and the two-step card on the Account screen are converted in the next task (M1.7b), so in this task `Account` keeps rendering them as they are, still on the mock slice; this task adds the sessions card the master plan asks for (the mock has no sessions list).

`getShell` in `repo/account.ts` already exists (task M1.1, W0-f). This task adds four functions to that file and appends to its `isolation` block; it does not touch `getShell` or its isolation entry.

**Files:**
- Modify: `src/server/repo/account.ts` (add functions), create `src/server/repo/account.test.ts` if W0-f did not create one (otherwise append)
- Modify: `src/server/repo/partners.ts`, `src/server/repo/partners.test.ts`
- Create or modify: `src/server/actions/account.ts`; create `src/server/actions/account-profile.test.ts`
- Modify: `src/server/actions/partners.ts`, `src/server/actions/partners.test.ts`
- Create: `src/components/people/SessionsCard.tsx`
- Modify: `src/components/screens/Account.tsx`, `src/components/screens/Company.tsx`, `src/app/partner/account/page.tsx`, `src/app/partner/company/page.tsx`

- [ ] **Step 1: Verify the files this task extends, and the session API**

```bash
grep -n "export async function getShell" src/server/repo/account.ts
grep -n "export declare function listSessions\|export async function listSessions\|export async function revokeSession" src/server/auth/sessions.ts
test -f src/server/actions/account.ts && echo "account actions file exists (plan 02): append to it" || echo "account actions file missing: create it"
grep -n "getSession" apps/portal/node_modules/better-auth/dist/api/routes/session.d.mts | head -1
```

Expected: the first prints the `getShell` line (if not, M1.1 is not merged: write `blocked`, stop this task); the second prints `listSessions` and `revokeSession`; the third tells you whether Step 7 creates or appends; the fourth prints the `getSession` endpoint line. Better Auth's server API `auth.api.getSession({ headers })` returns `{ session, user } | null`, with `session.token`; the Account page uses it to mark the current session.

- [ ] **Step 2: Write the failing repo tests for profile and preferences**

Create `src/server/repo/account.test.ts` (if W0-f already created it, append the `describe` blocks and merge the imports):

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, users } from '@/db/schema';
import { asPartner, asStaff, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { withViewer } from './context';
import { getProfile, recordPasswordChanged, setNotificationPrefs, updateProfile } from './account';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('getProfile', () => {
  it('returns the signed-in person with default notification switches', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile).toMatchObject({
      id: viewer.id,
      name: viewer.name,
      email: viewer.email,
      kind: 'partner',
      role: 'partner_admin',
      partnerName: viewer.partnerName,
      twoFactorEnabled: false,
      passwordChangedAt: null,
      notifications: { decision: true, stage: true, expiry: true, docs: false, team: true },
    });
  });

  it('reads staff profiles with no company', async () => {
    const viewer = await asStaff(db, 'partner_manager', 'india');
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile).toMatchObject({ kind: 'staff', role: 'partner_manager', partnerName: null });
  });

  it('shows stored switches over the defaults and never another person\'s', async () => {
    const mine = await asPartner(db, { role: 'sales' });
    const theirs = await asPartner(db, { partnerId: mine.partnerId, role: 'sales' });
    await withViewer(theirs, (tx) => setNotificationPrefs(tx, theirs, { decision: false, stage: false, expiry: false, docs: true, team: false }));
    const profile = await withViewer(mine, (tx) => getProfile(tx, mine));
    expect(profile.notifications).toEqual({ decision: true, stage: true, expiry: true, docs: false, team: true });
  });
});

describe('updateProfile', () => {
  it('saves a trimmed name, title and phone and clears blanks to null', async () => {
    const viewer = await asPartner(db, {});
    const saved = await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: '  Aditi Rao ', title: ' Head of Alliances ', phone: null }));
    expect(saved).toMatchObject({ name: 'Aditi Rao', title: 'Head of Alliances', phone: null });
    const cleared = await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: 'Aditi Rao', title: '   ', phone: '+91 98450 22617' }));
    expect(cleared).toMatchObject({ title: null, phone: '+91 98450 22617' });
  });

  it('needs a name and changes only the viewer\'s own row', async () => {
    const viewer = await asPartner(db, {});
    const colleague = await makeUser(db, { partnerId: viewer.partnerId, role: 'sales', name: 'Karan Malhotra' });
    await expect(withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: '  ', title: null, phone: null }))).rejects.toMatchObject({ code: 'validation', issues: [{ path: 'name' }] });
    await withViewer(viewer, (tx) => updateProfile(tx, viewer, { name: 'New Name', title: null, phone: null }));
    const [other] = await db.select().from(users).where(eq(users.id, colleague.id));
    expect(other?.name).toBe('Karan Malhotra');
  });
});

describe('setNotificationPrefs', () => {
  it('stores one row per category and overwrites on the next call', async () => {
    const viewer = await asPartner(db, {});
    const first = await withViewer(viewer, (tx) => setNotificationPrefs(tx, viewer, { decision: false, stage: true, expiry: true, docs: true, team: false }));
    expect(first).toEqual({ decision: false, stage: true, expiry: true, docs: true, team: false });
    await withViewer(viewer, (tx) => setNotificationPrefs(tx, viewer, { decision: true, stage: true, expiry: true, docs: true, team: false }));
    const rows = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id));
    expect(rows).toHaveLength(5);
    expect(Object.fromEntries(rows.map((r) => [r.category, r.email]))).toEqual({ decision: true, stage: true, expiry: true, docs: true, team: false });
  });
});

describe('recordPasswordChanged', () => {
  it('stamps password_changed_at for the viewer', async () => {
    const viewer = await asPartner(db, {});
    await withViewer(viewer, (tx) => recordPasswordChanged(tx, viewer, clock));
    const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
    expect(profile.passwordChangedAt).toBe('2026-11-12T10:00:00.000Z');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/account.test.ts`
Expected: FAIL, `getProfile` is not exported by `./account`.

- [ ] **Step 3: Implement the four functions**

In `src/server/repo/account.ts` add to the imports (merge with the existing lines; add the line when the name is not imported yet):

```ts
import { eq, sql } from 'drizzle-orm';
import { notificationPrefs, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { NOTIFICATION_CATEGORIES, type NotificationCategory, type PartnerRole, type StaffRole } from '@/lib/domain';
import type { ProfileDto } from '@/lib/dto';
import { NotFoundError, ValidationError } from '@/server/errors';
import { iso } from '@/server/people';
import { NOTIFICATION_PREF_DEFAULTS } from '@/server/notify';
```

Add below `getShell` (leave `getShell` as it is):

```ts
export async function getProfile(tx: Tx, viewer: Viewer): Promise<ProfileDto> {
  const [user] = await tx.select().from(users).where(eq(users.id, viewer.id)).limit(1);
  if (!user) throw new NotFoundError('user');
  const stored = await tx.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id));
  const notifications: Record<NotificationCategory, boolean> = { ...NOTIFICATION_PREF_DEFAULTS };
  for (const pref of stored) notifications[pref.category] = pref.email;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    title: user.title,
    phone: user.phone,
    kind: user.kind,
    role: user.role as PartnerRole | StaffRole,
    partnerName: viewer.partnerName,
    twoFactorEnabled: user.twoFactorEnabled,
    passwordChangedAt: iso(user.passwordChangedAt),
    notifications,
  };
}

export async function updateProfile(
  tx: Tx,
  viewer: Viewer,
  input: { name: string; title: string | null; phone: string | null },
): Promise<ProfileDto> {
  const name = input.name.trim();
  if (!name) throw new ValidationError([{ path: 'name', message: 'Enter your name.' }]);
  await tx
    .update(users)
    .set({ name, title: input.title?.trim() || null, phone: input.phone?.trim() || null })
    .where(eq(users.id, viewer.id));
  return getProfile(tx, viewer);
}

/** Stores one notification_prefs row per category. */
export async function setNotificationPrefs(
  tx: Tx,
  viewer: Viewer,
  input: Record<NotificationCategory, boolean>,
): Promise<Record<NotificationCategory, boolean>> {
  await tx
    .insert(notificationPrefs)
    .values(NOTIFICATION_CATEGORIES.map((category) => ({ userId: viewer.id, category, email: input[category] })))
    .onConflictDoUpdate({ target: [notificationPrefs.userId, notificationPrefs.category], set: { email: sql`excluded.email` } });
  return { ...input };
}

/** Called by the change-password action after Better Auth has stored the new hash. Sets users.password_changed_at. */
export async function recordPasswordChanged(tx: Tx, viewer: Viewer, clock: Clock): Promise<void> {
  await tx.update(users).set({ passwordChangedAt: clock.now() }).where(eq(users.id, viewer.id));
}
```

Add these four entries to the existing `defineIsolation<...>({ ... })` call, and add `'getProfile' | 'updateProfile' | 'setNotificationPrefs' | 'recordPasswordChanged'` to its generic union (keep the `getShell` entry exactly as it is). They all act only on `viewer.id`, so the matrix probe calls them as partner A and expects no change and no leak; a test above proves they never touch a colleague's row:

```ts
  getProfile: { scope: 'tenant', probe: (tx, viewer) => getProfile(tx, viewer), expect: 'unchanged' },
  updateProfile: { scope: 'tenant', probe: (tx, viewer) => updateProfile(tx, viewer, { name: viewer.name, title: null, phone: null }), expect: 'unchanged' },
  setNotificationPrefs: {
    scope: 'tenant',
    probe: (tx, viewer) => setNotificationPrefs(tx, viewer, { decision: true, stage: true, expiry: true, docs: false, team: true }),
    expect: 'unchanged',
  },
  recordPasswordChanged: { scope: 'tenant', probe: (tx, viewer) => recordPasswordChanged(tx, viewer, systemClock), expect: 'unchanged' },
```

(`systemClock` from `@/lib/clock`; import it next to the `Clock` type.)

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/account.test.ts src/server/repo/isolation.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing repo tests for the company profile**

Append to `src/server/repo/partners.test.ts`. Add `updateCompanyProfile` to the `./partners` import:

```ts
describe('updateCompanyProfile', () => {
  it('saves trimmed profile fields, blanks become null, and returns the company with the row time', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await withViewer(admin, (tx) =>
      updateCompanyProfile(tx, admin, { website: ' kestrelsystems.in ', phone: '+91 80 4718 2290', address: '  ', about: 'Security reseller.' }),
    );
    expect(result.company).toMatchObject({ name: 'Kestrel Systems', website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: null, about: 'Security reseller.' });
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(result.updatedAt).toBe(row?.updatedAt.toISOString());
  });

  it('never changes the name, category, region or status', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems', category: 'channel', region: 'india', status: 'active' });
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await withViewer(admin, (tx) => updateCompanyProfile(tx, admin, { website: 'x.example', phone: null, address: null, about: null }));
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    expect(row).toMatchObject({ name: 'Kestrel Systems', category: 'channel', region: 'india', status: 'active' });
  });

  it('is limited to the viewer company for a partner and open to a partner manager by id', async () => {
    const mine = await makePartner(db, {});
    const other = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: mine.id, role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => updateCompanyProfile(tx, admin, { partnerId: other.id, website: 'evil.example', phone: null, address: null, about: null }))).rejects.toMatchObject({ code: 'not_found' });
    const [untouched] = await db.select().from(partners).where(eq(partners.id, other.id));
    expect(untouched?.website).toBeNull();
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => updateCompanyProfile(tx, manager, { partnerId: other.id, website: 'ok.example', phone: null, address: null, about: null }));
    expect(result.company.website).toBe('ok.example');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts`
Expected: FAIL, `updateCompanyProfile` is not exported.

- [ ] **Step 5: Implement `updateCompanyProfile`**

In `src/server/repo/partners.ts` add `IsoTimestamp` to the dto import (`import type { ChecklistDto, CompanyDto, IsoTimestamp } from '@/lib/dto';`) and add after `getCompany`:

```ts
const blank = (value: string | null): string | null => value?.trim() || null;

/** Partner admin on own company, partner manager on any. Returns the row after the update; its updatedAt is the outbox version. (M1.7) */
export async function updateCompanyProfile(
  tx: Tx,
  viewer: Viewer,
  input: { partnerId?: string; website: string | null; phone: string | null; address: string | null; about: string | null },
): Promise<{ company: CompanyDto; updatedAt: IsoTimestamp }> {
  const partnerId = resolvePartnerScope(viewer, input.partnerId);
  const [row] = await tx
    .update(partners)
    .set({ website: blank(input.website), phone: blank(input.phone), address: blank(input.address), about: blank(input.about) })
    .where(eq(partners.id, partnerId))
    .returning();
  if (!row) throw new NotFoundError('partner');
  return { company: await toCompany(tx, row), updatedAt: row.updatedAt.toISOString() };
}
```

Replace the `isolation` block with (adds the new function):

```ts
export const isolation = defineIsolation<
  'getCompany' | 'getChecklist' | 'tickChecklistStep' | 'listPartnerAdminRecipients' | 'updateCompanyProfile'
>({
  getCompany: { scope: 'tenant', probe: (tx, viewer, ctx) => getCompany(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  getChecklist: { scope: 'tenant', probe: (tx, viewer) => getChecklist(tx, viewer), expect: 'unchanged' },
  tickChecklistStep: { scope: 'tenant', probe: (tx, viewer) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, systemClock), expect: 'unchanged' },
  listPartnerAdminRecipients: { scope: 'tenant', probe: (tx, _viewer, ctx) => listPartnerAdminRecipients(tx, { partnerId: ctx.b.partnerId }), expect: 'empty' },
  updateCompanyProfile: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => updateCompanyProfile(tx, viewer, { partnerId: ctx.b.partnerId, website: 'probe.example', phone: null, address: null, about: null }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'partners', id: ctx.b.partnerId }],
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (partners: 10 tests).

- [ ] **Step 6: Write the failing tests for the profile, notification and session actions**

Create `src/server/actions/account-profile.test.ts` (named apart from any test plan 02 adds for the password and two-step actions in `account.test.ts`):

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, notificationPrefs, users } from '@/db/schema';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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
vi.mock('@/server/auth/sessions', () => ({
  revokeSession: vi.fn(async () => undefined),
  revokeAllSessions: vi.fn(async () => undefined),
  listSessions: vi.fn(async () => []),
}));

import { revokeSession } from '@/server/auth/sessions';
import { revokeSessionAction, setNotificationPrefsAction, updateProfileAction } from './account';

const db = testDb();
const SESSION_ID = '4f0c2c1e-8a5e-4a52-9f8e-6f3b6a0c7d11';

beforeEach(async () => {
  await resetDb(db);
  harness.viewer = null;
  vi.mocked(revokeSession).mockClear();
});

describe('updateProfileAction', () => {
  it('saves the profile for any role, partner or staff', async () => {
    for (const viewer of [await asPartner(db, { role: 'technical' }), await asStaff(db, 'marketing', 'all')]) {
      harness.viewer = viewer;
      const result = await updateProfileAction({ name: ' New Name ', title: 'Head', phone: '' });
      expect(result).toMatchObject({ ok: true, data: { name: 'New Name', title: 'Head', phone: null } });
      const [row] = await db.select().from(users).where(eq(users.id, viewer.id));
      expect(row?.name).toBe('New Name');
    }
  });

  it('needs a name and a signed-in person', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await updateProfileAction({ name: '  ', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'name' }] } });
    harness.viewer = null;
    expect(await updateProfileAction({ name: 'x', title: '', phone: '' })).toMatchObject({ ok: false, error: { code: 'unauthenticated' } });
  });
});

describe('setNotificationPrefsAction', () => {
  it('stores the five switches', async () => {
    const viewer = await asPartner(db, {});
    harness.viewer = viewer;
    const next = { decision: false, stage: true, expiry: false, docs: true, team: true };
    expect(await setNotificationPrefsAction(next)).toEqual({ ok: true, data: next });
    expect(await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, viewer.id))).toHaveLength(5);
  });

  it('rejects a missing switch', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await setNotificationPrefsAction({ decision: true })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('revokeSessionAction', () => {
  it('signs out one of the viewer\'s own sessions and audits it', async () => {
    const viewer = await asPartner(db, {});
    harness.viewer = viewer;
    expect(await revokeSessionAction({ sessionId: SESSION_ID })).toEqual({ ok: true, data: { sessionId: SESSION_ID } });
    expect(revokeSession).toHaveBeenCalledWith(viewer.id, SESSION_ID);
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['account.session_revoked']);
  });

  it('rejects a malformed session id before touching anything', async () => {
    harness.viewer = await asPartner(db, {});
    expect(await revokeSessionAction({ sessionId: 'nope' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(revokeSession).not.toHaveBeenCalled();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/account-profile.test.ts`
Expected: FAIL (`./account` is missing or does not export these actions).

- [ ] **Step 7: Implement the account actions**

If `src/server/actions/account.ts` does not exist (Step 1), create it with the header and the three actions below. If plan 02 created it, keep its content and only merge the new imports into its import block and append the three functions at the end.

```ts
'use server';

import { z } from 'zod';
import type { NotificationCategory } from '@/lib/domain';
import type { ProfileDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeSession } from '@/server/auth/sessions';
import { setNotificationPrefs, updateProfile } from '@/server/repo/account';
import { withViewer } from '@/server/repo/context';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

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
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/account-profile.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 8: Write the failing tests for the company profile action**

Append to `src/server/actions/partners.test.ts`. Extend the imports: from `@/db/schema` add `auditLog, hubspotOutbox, partners`; from `@/db/test-helpers` nothing new; add `updateCompanyProfileAction` to the `./partners` import. Then append:

```ts
describe('updateCompanyProfileAction', () => {
  const fields = { website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: '4th floor, Prestige Tech Park', about: 'Security reseller.' };

  it('lets a partner admin save, audits what changed and queues a partner.upsert keyed by the row time', async () => {
    const partner = await makePartner(db, { name: 'Kestrel Systems' });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await updateCompanyProfileAction(fields);
    expect(result).toMatchObject({ ok: true, data: { website: 'kestrelsystems.in', about: 'Security reseller.' } });
    const [entry] = await db.select().from(auditLog);
    expect(entry).toMatchObject({ event: 'partner.profile_updated', note: 'Updated website, phone, address and what you sell' });
    const [row] = await db.select().from(partners).where(eq(partners.id, partner.id));
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]?.idempotencyKey).toBe(`partner.upsert:${partner.id}:${row?.updatedAt.getTime()}`);
  });

  it('does nothing when nothing changed: no audit entry, no outbox row', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await updateCompanyProfileAction(fields);
    const queued = (await db.select().from(hubspotOutbox)).length;
    const again = await updateCompanyProfileAction(fields);
    expect(again.ok).toBe(true);
    expect(await db.select().from(auditLog)).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(queued);
  });

  it('is forbidden for partner sales and technical users and for another company', async () => {
    const partner = await makePartner(db, {});
    const other = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect(await updateCompanyProfileAction(fields)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await updateCompanyProfileAction(fields)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await updateCompanyProfileAction({ ...fields, partnerId: other.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });

  it('lets a partner manager edit any company by id', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asStaff(db, 'partner_manager', 'india');
    expect(await updateCompanyProfileAction({ ...fields, partnerId: partner.id })).toMatchObject({ ok: true, data: { partnerId: partner.id } });
  });

  it('limits field lengths', async () => {
    const partner = await makePartner(db, {});
    harness.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await updateCompanyProfileAction({ ...fields, about: 'x'.repeat(1001) })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: FAIL, `updateCompanyProfileAction` is not a function.

- [ ] **Step 9: Implement `updateCompanyProfileAction`**

In `src/server/actions/partners.ts` extend the imports:

```ts
import type { ChecklistDto, CompanyDto } from '@/lib/dto';
import { recordAudit } from '@/server/audit/record';
import { enqueue } from '@/server/hubspot/outbox';
import { getCompany, tickChecklistStep, updateCompanyProfile } from '@/server/repo/partners';
```

(merging with the existing `ChecklistDto` and `getCompany, tickChecklistStep` imports). Add near the top:

```ts
const companySchema = z.object({
  partnerId: z.string().uuid().optional(),
  website: z.string().trim().max(200),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(300),
  about: z.string().trim().max(1000),
});

const PROFILE_FIELDS = [
  ['website', 'website'],
  ['phone', 'phone'],
  ['address', 'address'],
  ['about', 'what you sell'],
] as const;
```

Append:

```ts
const joinWords = (words: readonly string[]): string =>
  words.length <= 1 ? (words[0] ?? '') : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;

export async function updateCompanyProfileAction(raw: unknown): Promise<ActionResult<CompanyDto>> {
  return runViewerAction({ name: 'partner.update_profile', schema: companySchema }, raw, async (ctx, input): Promise<CompanyDto> => {
    const target = input.partnerId ?? (ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : undefined);
    if (!target) throw new ValidationError([{ path: 'partnerId', message: 'Choose a partner.' }]);
    assertCan(ctx.viewer, 'partner.update_profile', { partnerId: target });
    const result = await withViewer(ctx.viewer, async (tx) => {
      const before = await getCompany(tx, ctx.viewer, { partnerId: target });
      const saved = await updateCompanyProfile(tx, ctx.viewer, {
        partnerId: target,
        website: input.website || null,
        phone: input.phone || null,
        address: input.address || null,
        about: input.about || null,
      });
      const changed = PROFILE_FIELDS.filter(([key]) => (before[key] ?? '') !== (saved.company[key] ?? ''));
      if (changed.length > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.profile_updated',
          target: saved.company.name,
          note: `Updated ${joinWords(changed.map(([, label]) => label))}`,
          partnerId: target,
          subject: { type: 'partner', id: target },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: target, version: String(Date.parse(saved.updatedAt)) });
      }
      return saved.company;
    });
    ctx.revalidate(ROUTES.partner.company);
    ctx.revalidate(ROUTES.admin.partners);
    return result;
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 10: Create the sessions card**

Create `src/components/people/SessionsCard.tsx`. It uses classes the Account screen already uses (`card`, `card-h`, `li`, `badge`); the mock had no sessions list, so this card is new markup in the existing style:

```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fmtTimestamp } from "@/lib/dates";
import type { SessionDto } from "@/lib/dto";
import { describeUserAgent } from "@/lib/people";
import { revokeSessionAction } from "@/server/actions/account";

export function SessionsCard({ sessions, today }: { sessions: SessionDto[]; today: string }): React.JSX.Element {
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const signOut = async (session: SessionDto): Promise<void> => {
    setBusy(session.id);
    const result = await revokeSessionAction({ sessionId: session.id });
    setBusy(null);
    toast(result.ok ? "Signed out of that device" : result.error.message);
  };

  return (
    <section aria-labelledby="sess" className="card clip" data-tour="account-sessions">
      <div className="card-h">
        <h2 id="sess" className="card-t">
          Where you are signed in
        </h2>
        <span className="card-meta tnum">
          {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
        </span>
      </div>
      {sessions.map((s) => (
        <div key={s.id} className="li">
          <span className="li-t">
            <span className="li-n">{describeUserAgent(s.userAgent)}</span>
            <span className="li-s">
              {s.ipAddress ?? "Unknown address"}, signed in {fmtTimestamp(s.createdAt, today)}
            </span>
          </span>
          {s.current ? (
            <span style={{ marginLeft: "auto" }}>
              <Badge tone="accepted">This device</Badge>
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-s"
              style={{ marginLeft: "auto", height: 26, padding: "0 8px", fontSize: 12 }}
              disabled={busy === s.id}
              onClick={() => void signOut(s)}
            >
              Sign out
            </button>
          )}
        </div>
      ))}
      {sessions.length === 0 ? <div className="empty">No active sessions.</div> : null}
    </section>
  );
}
```

- [ ] **Step 11: Convert `Account.tsx`**

Edit `src/components/screens/Account.tsx`.

Edit 1, imports and notification list. Before:

```tsx
import { useState } from "react";
import { PasswordCard } from "@/components/people/PasswordCard";
import { TwoStepCard } from "@/components/people/TwoStepCard";
import { accountSlice, type NotificationPrefs } from "@/data/team";

interface ProfileDraft {
  name: string;
  title: string;
  phone: string;
}

const NOTIFICATIONS: ReadonlyArray<readonly [keyof NotificationPrefs, string, string]> = [
```

After:

```tsx
import { useState } from "react";
import { PasswordCard } from "@/components/people/PasswordCard";
import { SessionsCard } from "@/components/people/SessionsCard";
import { TwoStepCard } from "@/components/people/TwoStepCard";
import { useToast } from "@/components/ui/toast";
import { type NotificationCategory, PARTNER_ROLE_LABEL, STAFF_ROLE_LABEL } from "@/lib/domain";
import type { ProfileDto, SessionDto } from "@/lib/dto";
import { setNotificationPrefsAction, updateProfileAction } from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";

interface ProfileDraft {
  name: string;
  title: string;
  phone: string;
}

interface AccountProps {
  profile: ProfileDto;
  sessions: SessionDto[];
  /** Server date, so "Today" labels are stable across hydration. */
  today: string;
}

const NOTIFICATIONS: ReadonlyArray<readonly [NotificationCategory, string, string]> = [
```

Edit 2, the component head. Before:

```tsx
export function Account(): React.JSX.Element {
  const saved = accountSlice.use();
  // Edits live here until saved, as overrides, so a reload that restores the slice never shows stale text.
  const [draft, setDraft] = useState<Partial<ProfileDraft>>({});
  const value: ProfileDraft = {
    name: draft.name ?? saved.name,
    title: draft.title ?? saved.title,
    phone: draft.phone ?? saved.phone,
  };
  const dirty = value.name !== saved.name || value.title !== saved.title || value.phone !== saved.phone;

  const saveProfile = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    accountSlice.set((prev) => ({ ...prev, ...value }));
    setDraft({});
  };
```

After:

```tsx
export function Account({ profile, sessions, today }: AccountProps): React.JSX.Element {
  const toast = useToast();
  const [saved, setSaved] = useState<ProfileDraft>({
    name: profile.name,
    title: profile.title ?? "",
    phone: profile.phone ?? "",
  });
  const [notify, setNotify] = useState<Record<NotificationCategory, boolean>>(profile.notifications);
  const [nameError, setNameError] = useState<string | null>(null);
  // Edits live here until saved, as overrides.
  const [draft, setDraft] = useState<Partial<ProfileDraft>>({});
  const value: ProfileDraft = {
    name: draft.name ?? saved.name,
    title: draft.title ?? saved.title,
    phone: draft.phone ?? saved.phone,
  };
  const dirty = value.name !== saved.name || value.title !== saved.title || value.phone !== saved.phone;
  const roleLabel =
    profile.kind === "staff"
      ? STAFF_ROLE_LABEL[profile.role as keyof typeof STAFF_ROLE_LABEL]
      : PARTNER_ROLE_LABEL[profile.role as keyof typeof PARTNER_ROLE_LABEL];

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setNameError(null);
    const result = await updateProfileAction(value);
    if (!result.ok) {
      setNameError(issuesToErrors(result.error).name ?? result.error.message);
      return;
    }
    setSaved({ name: result.data.name, title: result.data.title ?? "", phone: result.data.phone ?? "" });
    setDraft({});
  };

  // Saved as you change them: the switch flips at once and flips back with a message if the save fails.
  const toggle = async (key: NotificationCategory, checked: boolean): Promise<void> => {
    const previous = notify;
    setNotify({ ...notify, [key]: checked });
    const result = await setNotificationPrefsAction({ ...notify, [key]: checked });
    if (!result.ok) {
      setNotify(previous);
      toast(result.error.message);
    }
  };
```

Edit 3, the name error. Before:

```tsx
                  value={value.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
```

After:

```tsx
                  value={value.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  aria-invalid={nameError ? true : undefined}
                />
                {nameError ? <span className="err">{nameError}</span> : null}
              </div>
```

Edit 4, the email and the role line. Before:

```tsx
                  aditi.rao@kestrelsystems.in
```

After:

```tsx
                  {profile.email}
```

Before:

```tsx
                Role: <b style={{ color: "#2A2838" }}>Partner admin</b>. Another partner admin can change it on
                the Team page.
```

After:

```tsx
                Role: <b style={{ color: "#2A2838" }}>{roleLabel}</b>. Another partner admin can change it on
                the Team page.
```

Edit 5, the cards. Before:

```tsx
          <PasswordCard />
          <TwoStepCard />
```

After (the two cards keep their mock form until Task M1.7b converts them and gives them props):

```tsx
          <PasswordCard />
          <TwoStepCard />
          <SessionsCard sessions={sessions} today={today} />
```

Edit 6, the notification checkboxes. Before:

```tsx
                checked={saved.notify[key]}
                onChange={(e) =>
                  accountSlice.set((prev) => ({ ...prev, notify: { ...prev.notify, [key]: e.target.checked } }))
                }
```

After:

```tsx
                checked={notify[key]}
                onChange={(e) => void toggle(key, e.target.checked)}
```

- [ ] **Step 12: Write the account page**

Replace `src/app/partner/account/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Account } from "@/components/screens/Account";
import { systemClock } from "@/lib/clock";
import { auth } from "@/server/auth/auth";
import { listSessions } from "@/server/auth/sessions";
import { requireCan } from "@/server/auth/viewer";
import { getProfile } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";

export const metadata: Metadata = { title: "Your account" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("account.update_profile");
  const profile = await withViewer(viewer, (tx) => getProfile(tx, viewer));
  const session = await auth.api.getSession({ headers: await headers() });
  const sessions = await listSessions(viewer.id, session?.session.token ?? null);
  return <Account profile={profile} sessions={sessions} today={systemClock.today()} />;
}
```

- [ ] **Step 13: Replace `Company.tsx`**

Replace `src/components/screens/Company.tsx` in full. Changes from the mock: DTO input, the company name is read-only (the contract's `updateCompanyProfile` does not take a name; the partner manager changes it), people who are not partner admins see the form read-only, the agreement card reads the stored version and time, "Accepted by" is gone (the DTO has no such field, request in "Contract change requests", item 2), and "Download PDF" explains that the PDF is not available yet (no download route exists, item 10).

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { MessageDrawer } from "@/components/partners/message-drawer";
import { PartnerCategoryBadge, PartnerStatusBadge } from "@/components/partners/badges";
import { Avatar, Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { fmtLong } from "@/lib/dates";
import { PARTNER_REGION_LABEL } from "@/lib/domain";
import type { CompanyDto } from "@/lib/dto";
import { initialsOf } from "@/lib/people";
import { updateCompanyProfileAction } from "@/server/actions/partners";

interface ProfileFields {
  website: string;
  phone: string;
  address: string;
  about: string;
}

const fieldsOf = (company: CompanyDto): ProfileFields => ({
  website: company.website ?? "",
  phone: company.phone ?? "",
  address: company.address ?? "",
  about: company.about ?? "",
});

const SAME = (a: ProfileFields, b: ProfileFields): boolean =>
  a.website === b.website && a.phone === b.phone && a.address === b.address && a.about === b.about;

interface CompanyProps {
  company: CompanyDto;
  /** Partner admins edit the profile; other roles read it. */
  canEdit: boolean;
  viewerEmail: string;
}

export function Company({ company, canEdit, viewerEmail }: CompanyProps): React.JSX.Element {
  const toast = useToast();
  const saved = fieldsOf(company);
  // null until the admin types: the form then shows the saved profile without copying it into state.
  const [draft, setDraft] = useState<ProfileFields | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = draft ?? saved;
  const dirty = draft !== null && !SAME(draft, saved);
  const edit = (key: keyof ProfileFields) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void =>
    setDraft({ ...form, [key]: event.target.value });

  const save = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!dirty) {
      setDraft(null);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await updateCompanyProfileAction(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setDraft(null);
    toast("Company profile saved");
  };

  const manager = company.manager;
  const teamName = manager ? manager.team.replace(/^CleanStart\s*/, "") : "";
  const signed = company.agreementAcceptedAt !== null;

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Company</h1>
          <span className="h1-sub">How CleanStart sees {company.name}. Partner admins can edit the profile.</span>
        </div>
      </div>

      <div className="row">
        <form
          onSubmit={save}
          noValidate
          aria-labelledby="prof"
          className="card clip"
          style={{ flex: "1 1 620px", minWidth: 0 }}
        >
          <div className="card-h">
            <h2 id="prof" className="card-t">
              Company profile
            </h2>
            {dirty ? (
              <span className="card-meta t-amber">Unsaved changes</span>
            ) : (
              <span className="card-meta">All changes saved</span>
            )}
          </div>
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="grid3">
              <div className="fg">
                <label htmlFor="cn" className="lbl">
                  Company name
                </label>
                <input id="cn" className="field" type="text" value={company.name} readOnly aria-describedby="cn-hint" />
                <span id="cn-hint" className="hint">
                  Ask your partner manager to change the name.
                </span>
              </div>
              <div className="fg">
                <label htmlFor="cw" className="lbl">
                  Website
                </label>
                <input
                  id="cw"
                  className="field"
                  type="text"
                  value={form.website}
                  onChange={edit("website")}
                  readOnly={!canEdit}
                />
              </div>
              <div className="fg">
                <label htmlFor="cp" className="lbl">
                  Main phone
                </label>
                <input
                  id="cp"
                  className="field"
                  type="tel"
                  value={form.phone}
                  onChange={edit("phone")}
                  readOnly={!canEdit}
                />
              </div>
            </div>
            <div className="fg">
              <label htmlFor="ca" className="lbl">
                Address
              </label>
              <input
                id="ca"
                className="field"
                type="text"
                value={form.address}
                onChange={edit("address")}
                readOnly={!canEdit}
              />
            </div>
            <div className="fg">
              <label htmlFor="cb" className="lbl">
                What you sell
              </label>
              <textarea
                id="cb"
                className="field"
                rows={3}
                value={form.about}
                onChange={edit("about")}
                readOnly={!canEdit}
                aria-describedby="cb-hint"
              />
              <span id="cb-hint" className="hint">
                Shown to your CleanStart partner manager.
              </span>
            </div>
            {error ? (
              <span className="err" role="alert">
                {error}
              </span>
            ) : null}
          </div>
          <hr className="hr" />
          <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="sec-h" style={{ margin: 0 }}>
              <h3 className="sec-t">Set by CleanStart</h3>
              <span className="sec-s">Ask your partner manager to change these</span>
            </div>
            <dl className="dl">
              <dt>Partner category</dt>
              <dd>
                <PartnerCategoryBadge category={company.category} />
              </dd>
              <dt>Region</dt>
              <dd>{PARTNER_REGION_LABEL[company.region]}</dd>
              <dt>Partner since</dt>
              <dd>{fmtLong(company.since)}</dd>
              <dt>Status</dt>
              <dd>
                <PartnerStatusBadge status={company.status} />
              </dd>
            </dl>
          </div>
          {canEdit ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 6,
                padding: "10px 12px",
                borderTop: "1px solid #F0EFF4",
                background: "#FCFCFD",
              }}
            >
              {dirty ? (
                <button
                  type="button"
                  className="btn btn-g"
                  onClick={() => {
                    setDraft(null);
                    setError(null);
                  }}
                >
                  Discard
                </button>
              ) : null}
              <button type="submit" className="btn btn-p" disabled={saving}>
                Save changes
              </button>
            </div>
          ) : null}
        </form>

        <aside
          aria-label="Agreement and contacts"
          style={{ flex: "0 1 360px", minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}
        >
          <section aria-labelledby="agr" className="card clip">
            <div className="card-h">
              <h2 id="agr" className="card-t">
                Partner agreement
              </h2>
              <Badge tone={signed ? "accepted" : "pending"}>{signed ? "Signed" : "Not signed"}</Badge>
            </div>
            <div className="card-b" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <dl className="dl" style={{ gridTemplateColumns: "96px minmax(0, 1fr)" }}>
                <dt>Version</dt>
                <dd>{company.agreementVersion ?? "Not accepted yet"}</dd>
                <dt>Accepted</dt>
                <dd>
                  {company.agreementAcceptedAt
                    ? `${fmtLong(company.agreementAcceptedAt.slice(0, 10))}, ${company.agreementAcceptedAt.slice(11, 16)}`
                    : "Not accepted yet"}
                </dd>
              </dl>
              <button
                type="button"
                className="btn btn-s"
                style={{ alignSelf: "flex-start" }}
                onClick={() => toast("The agreement PDF is not in the portal yet. Ask your partner manager for a copy.")}
              >
                <Icon name="dl" />
                Download PDF
              </button>
              <span className="hint">
                When CleanStart publishes a new version, you will be asked to accept it here.
              </span>
            </div>
          </section>

          <section aria-labelledby="pm" className="card clip">
            <div className="card-h">
              <h2 id="pm" className="card-t">
                Your partner manager
              </h2>
            </div>
            {manager ? (
              <div className="li" style={{ borderBottom: 0 }}>
                <Avatar initials={initialsOf(manager.name)} />
                <span className="li-t">
                  <span className="li-n">{manager.name}</span>
                  <span className="li-s">CleanStart{teamName ? `, ${teamName}` : ""}</span>
                </span>
                <button
                  type="button"
                  className="btn btn-s"
                  style={{ marginLeft: "auto", height: 26, padding: "0 8px", fontSize: 12 }}
                  onClick={() => setMessageOpen(true)}
                >
                  Message
                </button>
              </div>
            ) : (
              <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>
                CleanStart has not assigned a partner manager yet.
              </p>
            )}
          </section>

          <section aria-labelledby="tier" className="card clip" data-tour="company-tier">
            <div className="card-h">
              <h2 id="tier" className="card-t">
                Tier
              </h2>
              <Badge tone="neutral">Not assigned</Badge>
            </div>
            <div className="card-b">
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: "#5E5B6E" }}>
                CleanStart has not launched partner tiers yet.{" "}
                {manager ? manager.name.split(" ")[0] : "Your partner manager"} will share the tier rules with you
                before they start.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {messageOpen && manager ? (
        <MessageDrawer
          open
          onClose={() => setMessageOpen(false)}
          manager={manager.name}
          team={teamName || "CleanStart"}
          subject={`${company.name} company profile`}
          from={viewerEmail}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 14: Write the company page**

Replace `src/app/partner/company/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { Company } from "@/components/screens/Company";
import { can } from "@/server/auth/policies";
import { requireKind } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getCompany } from "@/server/repo/partners";

export const metadata: Metadata = { title: "Company" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireKind("partner");
  const company = await withViewer(viewer, (tx) => getCompany(tx, viewer, {}));
  const canEdit = can(viewer, "partner.update_profile", { partnerId: company.partnerId });
  return <Company company={company} canEdit={canEdit} viewerEmail={viewer.email} />;
}
```

- [ ] **Step 15: Prove no slice import is left**

Run: `grep -n "@/data/\|@/lib/slice\|accountSlice\|partnersSlice" src/components/screens/Account.tsx src/components/screens/Company.tsx src/components/people/SessionsCard.tsx`
Expected: no output.

- [ ] **Step 16: Gate A**

Run the Gate A block. The last command must list only this task's Files block.

- [ ] **Step 17: Manual check (seed-dev data)**

1. Signed in as `aditi.rao@kestrelsystems.in`, `/partner/account`: Profile shows her name, `aditi.rao@kestrelsystems.in`, title "Head of Alliances", role "Partner admin". Change the title and Save profile: "All changes saved" returns; reload keeps it. Clear the name: the error "Enter your name." shows and nothing is saved.
2. Toggle "New documents" on and reload: it stays on. `select category, email from notification_prefs` shows one row per category after the first toggle.
3. The sessions card shows the current browser as "This device". Sign in from a private window, reload `/partner/account` in the first window: a second session appears with a "Sign out" button; click it: the toast says "Signed out of that device" and the private window is signed out on its next request.
4. `/partner/company` as Aditi: form editable. Change the address, Save changes: toast "Company profile saved"; `select op, idempotency_key from hubspot_outbox where op = 'partner.upsert'` shows a new row keyed by the update time; `select event, note from audit_log order by at desc limit 1` shows `partner.profile_updated` and "Updated address". Save again with no change: no new audit row.
5. Sign in as Karan Malhotra (sales) and open `/partner/company`: the fields are read-only and there is no Save button. Click "Download PDF": the toast says the PDF is not in the portal yet.
6. "Message" next to the partner manager opens the drawer addressed to Farhan Qureshi.

- [ ] **Step 18: Commit**

```bash
git add apps/portal/src/server/repo/account.ts apps/portal/src/server/repo/account.test.ts \
  apps/portal/src/server/repo/partners.ts apps/portal/src/server/repo/partners.test.ts \
  apps/portal/src/server/actions/account.ts apps/portal/src/server/actions/account-profile.test.ts \
  apps/portal/src/server/actions/partners.ts apps/portal/src/server/actions/partners.test.ts \
  apps/portal/src/components/people/SessionsCard.tsx \
  apps/portal/src/components/screens/Account.tsx apps/portal/src/components/screens/Company.tsx \
  apps/portal/src/app/partner/account/page.tsx apps/portal/src/app/partner/company/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.7 account and company screens"
```

---
### Task M1.7b: Password change, two-step sign-in and the reset-password page

Completes the Account screen of master task 1.7 ("password change (rule enforced)") and the password reset landing page. Ownership note for the orchestrator: the brief for this plan names `PasswordCard.tsx` and `TwoStepCard.tsx` as plan 02's, but contracts K.1 gives both files, `Account.tsx` and `src/app/(public)/reset-password/page.tsx` (K.2) to this track, H.20 lists `changePasswordAction`, `enableTwoFactorAction` and `disableTwoFactorAction` under `actions/account.ts` (P), and plan 02's "Contract change requests" items 5 and 7 hand the reset page and the second-step account actions to "P, M1.7". Plan 02 builds none of them. This task therefore builds them so the Account screen does not stay half mock. It is a separate task so the orchestrator can drop it if plan 02 takes these files after all; nothing else in this plan depends on it.

What it does: `changePasswordAction` (Better Auth `changePassword`, then the portal's own `password_changed_at`, audit entry and notice email), `enableTwoFactorAction`, `verifyTwoFactorAction`, `disableTwoFactorAction` and `regenerateBackupCodesAction` (Better Auth's TOTP plugin; the mock's "Backup codes" button becomes "make new backup codes", because the library can show the codes only once), the converted cards, and the `/reset-password` page that calls Better Auth's `resetPassword` through the client plan 02 provides. Two actions are additions to H.20 (`verifyTwoFactorAction`, `regenerateBackupCodesAction`, CCR item 1).

**Files:**
- Create: `src/server/auth-errors.ts`, `src/server/auth-errors.test.ts`
- Modify: `src/server/actions/account.ts` (append five actions)
- Create: `src/server/actions/account-security.test.ts`
- Modify: `src/components/people/PasswordCard.tsx`, `src/components/screens/Account.tsx` (two lines)
- Replace: `src/components/people/TwoStepCard.tsx`
- Create: `src/components/screens/ResetPassword.tsx`, `src/app/(public)/reset-password/page.tsx`

- [ ] **Step 1: Verify the Better Auth endpoints, the client and what `auth.ts` already does**

```bash
D=apps/portal/node_modules/better-auth/dist
grep -n "export declare const changePassword" $D/api/routes/update-user.d.mts | head -1
grep -n "enableTwoFactor:\|disableTwoFactor:\|generateBackupCodes:\|verifyTOTP:" $D/plugins/two-factor/index.d.mts | head -4
test -f apps/portal/src/lib/auth-client.ts && grep -n "export const authClient" apps/portal/src/lib/auth-client.ts
grep -n "change-password\|onPasswordChange\|account.password_changed" apps/portal/src/server/auth/auth.ts apps/portal/src/server/auth/auth-mail.ts
```

Expected: the first two commands print the endpoint declarations; the third prints the `authClient` export (plan 02, K.2); the fourth shows where `account.password_changed` is written. If it is written for the reset flow only (plan 02's `onPasswordReset`), continue as written. If `auth.ts` also records the change for `/change-password`, delete the `recordPasswordChanged`, `recordAudit` and `sendEmail` calls from `changePasswordAction` below (keep the Better Auth call) and the matching assertions in its test, so a change is never audited or mailed twice.

- [ ] **Step 2: Write the failing test for the Better Auth error mapper**

Create `src/server/auth-errors.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/server/errors';
import { authErrorCode, throwFieldError } from './auth-errors';

const apiError = (code: string): Error => Object.assign(new Error(code), { statusCode: 400, body: { code, message: code } });

describe('authErrorCode', () => {
  it('reads body.code of a Better Auth error and nothing else', () => {
    expect(authErrorCode(apiError('INVALID_PASSWORD'))).toBe('INVALID_PASSWORD');
    expect(authErrorCode(new Error('plain'))).toBeNull();
    expect(authErrorCode(null)).toBeNull();
    expect(authErrorCode({ body: { code: 7 } })).toBeNull();
  });
});

describe('throwFieldError', () => {
  const catches = (error: unknown): ValidationError => {
    try {
      throwFieldError(error, 'currentPassword');
    } catch (thrown) {
      if (thrown instanceof ValidationError) return thrown;
    }
    throw new Error('expected a ValidationError');
  };

  it('maps a wrong password to the password field the caller names', () => {
    expect(catches(apiError('INVALID_PASSWORD')).issues).toEqual([{ path: 'currentPassword', message: 'That password is not right.' }]);
  });

  it('maps the portal password rule, a wrong code and a lockout', () => {
    expect(catches(apiError('PASSWORD_RULES_NOT_MET')).issues).toEqual([{ path: 'password', message: 'Meet all four password rules.' }]);
    expect(catches(apiError('INVALID_CODE')).issues).toEqual([{ path: 'code', message: 'That code is not right. Check the 6 digits and try again.' }]);
    expect(catches(apiError('ACCOUNT_TEMPORARILY_LOCKED')).issues[0]?.path).toBe('code');
  });

  it('maps already-on and not-on to a form level message', () => {
    expect(catches(apiError('TOTP_ALREADY_ENABLED')).issues).toEqual([{ path: '', message: 'Two-step sign-in is already on.' }]);
    expect(catches(apiError('TWO_FACTOR_NOT_ENABLED')).issues).toEqual([{ path: '', message: 'Two-step sign-in is not on.' }]);
  });

  it('rethrows anything it does not know', () => {
    const unknown = apiError('SOMETHING_ELSE');
    expect(() => throwFieldError(unknown, 'password')).toThrow(unknown);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/auth-errors.test.ts`
Expected: FAIL, `Failed to resolve import "./auth-errors"`.

- [ ] **Step 3: Implement the error mapper**

Create `src/server/auth-errors.ts`:

```ts
import { ValidationError } from '@/server/errors';

/** Better Auth's APIError carries `body.code`. Null for anything else. */
export const authErrorCode = (error: unknown): string | null => {
  if (typeof error !== 'object' || error === null || !('body' in error)) return null;
  const body = (error as { body?: unknown }).body;
  if (typeof body !== 'object' || body === null || !('code' in body)) return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
};

/**
 * Turns the Better Auth failures a signed-in person can cause into field errors the forms already show.
 * `passwordPath` is the field a wrong password belongs to. Anything else is rethrown (it is an outage or a bug).
 */
export function throwFieldError(error: unknown, passwordPath: string): never {
  switch (authErrorCode(error)) {
    case 'INVALID_PASSWORD':
      throw new ValidationError([{ path: passwordPath, message: 'That password is not right.' }]);
    case 'PASSWORD_RULES_NOT_MET':
      throw new ValidationError([{ path: 'password', message: 'Meet all four password rules.' }]);
    case 'INVALID_CODE':
      throw new ValidationError([{ path: 'code', message: 'That code is not right. Check the 6 digits and try again.' }]);
    case 'ACCOUNT_TEMPORARILY_LOCKED':
    case 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE':
      throw new ValidationError([{ path: 'code', message: 'Too many wrong codes. Wait a few minutes and try again.' }]);
    case 'TOTP_ALREADY_ENABLED':
      throw new ValidationError([{ path: '', message: 'Two-step sign-in is already on.' }]);
    case 'TWO_FACTOR_NOT_ENABLED':
      throw new ValidationError([{ path: '', message: 'Two-step sign-in is not on.' }]);
    default:
      throw error;
  }
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/auth-errors.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 4: Write the failing tests for the five security actions**

Create `src/server/actions/account-security.test.ts`. The Better Auth API is mocked here: plan 02 tests the real library behaviour; this file pins what the portal sends, stores, audits and mails.

```ts
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
  headers: async () => new Headers({ 'x-forwarded-for': harness.ip, cookie: 'session=1' }),
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
      error: { code: 'validation', issues: [{ path: 'password', message: 'Meet all four password rules.' }] },
    });
    expect(await changePasswordAction(form({ confirmPassword: 'Different-1!' }))).toMatchObject({ ok: false, error: { issues: [{ path: 'confirmPassword' }] } });
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
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/account-security.test.ts`
Expected: FAIL, `changePasswordAction` is not exported by `./account`.

- [ ] **Step 5: Append the five actions**

In `src/server/actions/account.ts` merge these imports into the import block (merge with the names already imported there):

```ts
import { headers } from 'next/headers';
import type { IsoTimestamp } from '@/lib/dto';
import { auth } from '@/server/auth/auth';
import { assertPasswordOk } from '@/server/auth/passwords';
import { throwFieldError } from '@/server/auth-errors';
import { sendEmail } from '@/server/email/send';
import { buildPasswordChanged } from '@/server/email/templates';
import { rateLimit } from '@/server/rate-limit';
import { recordPasswordChanged, setNotificationPrefs, updateProfile } from '@/server/repo/account';
```

Add the schemas next to the others:

```ts
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.').max(200),
    newPassword: z.string().min(1).max(200),
    confirmPassword: z.string().max(200),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'The passwords do not match.' });
const passwordOnlySchema = z.object({ password: z.string().min(1, 'Enter your password.').max(200) });
const codeSchema = z.object({
  code: z.string().transform((value) => value.replace(/\s/gu, '')).pipe(z.string().regex(/^\d{6}$/u, 'Enter the 6 digits from your app.')),
});
const PASSWORD_RULE = { limit: 10, windowSeconds: 600 } as const;
```

Append the actions. Better Auth shows backup codes as `XXXXX-XXXXX`; the mock and the card show `XXXXX XXXXX`, and sign-in accepts both (plan 02):

```ts
const spaced = (codes: readonly string[]): string[] => codes.map((code) => code.replace('-', ' '));

export async function changePasswordAction(raw: unknown): Promise<ActionResult<{ changedAt: IsoTimestamp }>> {
  return runViewerAction({ name: 'account.change_password', schema: changePasswordSchema }, raw, async (ctx, input): Promise<{ changedAt: IsoTimestamp }> => {
    assertCan(ctx.viewer, 'account.change_password');
    rateLimit(`password:user:${ctx.viewer.id}`, PASSWORD_RULE);
    assertPasswordOk(input.newPassword);
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
    let enrolment;
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
    try {
      await auth.api.verifyTOTP({ body: { code: input.code }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    await withViewer(ctx.viewer, (tx) =>
      recordAudit(tx, ctx.viewer, {
        event: 'account.two_factor_enabled',
        target: `${ctx.viewer.name}, ${ctx.viewer.email}`,
        partnerId: ctx.viewer.partnerId,
        subject: { type: 'user', id: ctx.viewer.id },
      }),
    );
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
    let fresh;
    try {
      fresh = await auth.api.generateBackupCodes({ body: { password: input.password }, headers: await headers() });
    } catch (error) {
      throwFieldError(error, 'password');
    }
    return { backupCodes: spaced(fresh.backupCodes) };
  });
}
```

Add `'account.manage_two_factor'` is already in the Action union (D.2) and the matrix gives it to every role as `self`. `let enrolment;` and `let fresh;` take their types from the assignment inside the `try`; if the installed TypeScript reports "implicitly any", write `let enrolment: Awaited<ReturnType<typeof auth.api.enableTwoFactor>>;` and `let fresh: Awaited<ReturnType<typeof auth.api.generateBackupCodes>>;`.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/account-security.test.ts src/server/actions/account-profile.test.ts`
Expected: PASS (account-security: 9 tests, account-profile: 7 tests).

- [ ] **Step 6: Convert `PasswordCard.tsx`**

Edit `src/components/people/PasswordCard.tsx`.

Edit 1, imports. Before:

```tsx
import { useState } from "react";
import { Icon } from "@/components/icon";
import { PasswordField, passwordRules } from "@/components/ui/password-field";
```

After:

```tsx
import { useState } from "react";
import { Icon } from "@/components/icon";
import { PasswordField, passwordRules } from "@/components/ui/password-field";
import { fmtLong } from "@/lib/dates";
import { changePasswordAction } from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";
```

Edit 2, the head and `submit`. Before:

```tsx
export function PasswordCard(): React.JSX.Element {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
```

After:

```tsx
export function PasswordCard({ passwordChangedAt }: { passwordChangedAt: string | null }): React.JSX.Element {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [tried, setTried] = useState(false);
  const [done, setDone] = useState(false);
  const [changedAt, setChangedAt] = useState<string | null>(passwordChangedAt);
  const [busy, setBusy] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
```

Before:

```tsx
  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (missingCurrent || weak || mismatch) {
      setTried(true);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setTried(false);
    setDone(true);
  };
```

After:

```tsx
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);
    if (missingCurrent || weak || mismatch) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await changePasswordAction({ currentPassword: current, newPassword: next, confirmPassword: confirm });
    setBusy(false);
    if (!result.ok) {
      setServerErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setServerErrors({});
    setChangedAt(result.data.changedAt);
    setCurrent("");
    setNext("");
    setConfirm("");
    setTried(false);
    setDone(true);
  };
```

Edit 3, the header text. Before:

```tsx
        <span className="card-meta">Last changed 12 Mar 2026</span>
```

After:

```tsx
        <span className="card-meta">
          {changedAt ? `Last changed ${fmtLong(changedAt.slice(0, 10))}` : "Not changed yet"}
        </span>
```

Edit 4, the current password error and the button. Before:

```tsx
          {...(tried && missingCurrent ? { error: "Enter your current password." } : {})}
```

After:

```tsx
          {...(tried && missingCurrent
            ? { error: "Enter your current password." }
            : serverErrors.currentPassword
              ? { error: serverErrors.currentPassword }
              : {})}
```

Before:

```tsx
        <button type="submit" className="btn btn-s">
          Update password
        </button>
```

After:

```tsx
        {formError ? (
          <span className="err" role="alert" style={{ marginRight: "auto" }}>
            {formError}
          </span>
        ) : null}
        <button type="submit" className="btn btn-s" disabled={busy}>
          Update password
        </button>
```

- [ ] **Step 7: Replace `TwoStepCard.tsx`**

Replace `src/components/people/TwoStepCard.tsx` in full. Changes from the mock: the card reads the real state; turning on, turning off and making new backup codes first ask for the password (Better Auth requires it), the setup key and link come from the server (no QR library is installed, so the QR box holds an "Open in your authenticator app" link until one is added, CCR item 16), the verify step calls the server, and "Backup codes" makes a fresh set instead of re-reading old ones.

```tsx
"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/overlay";
import { PasswordField } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import {
  disableTwoFactorAction,
  enableTwoFactorAction,
  regenerateBackupCodesAction,
  verifyTwoFactorAction,
} from "@/server/actions/account";
import { issuesToErrors } from "@/server/actions/result";

const SHIELD =
  "M208,42H48A14,14,0,0,0,34,56v56c0,51.94,25.12,83.4,46.2,100.64,22.73,18.6,45.27,24.89,46.22,25.15a6,6,0,0,0,3.16,0c.95-.26,23.49-6.55,46.22-25.15C196.88,195.4,222,163.94,222,112V56A14,14,0,0,0,208,42Zm2,70c0,37.76-13.94,68.39-41.44,91.06A131.17,131.17,0,0,1,128,225.72a130.94,130.94,0,0,1-40.56-22.66C59.94,180.39,46,149.76,46,112V56a2,2,0,0,1,2-2H208a2,2,0,0,1,2,2ZM172.24,99.76a6,6,0,0,1,0,8.48l-56,56a6,6,0,0,1-8.48,0l-24-24a6,6,0,0,1,8.48-8.48L112,151.51l51.76-51.75A6,6,0,0,1,172.24,99.76Z";

type Step = "password" | "scan" | "codes" | null;
type Purpose = "enable" | "disable" | "regenerate";

const PURPOSE_COPY: Record<Purpose, { title: string; subtitle: string; submit: string }> = {
  enable: {
    title: "Turn on two-step sign-in",
    subtitle: "Confirm it is you with your password first.",
    submit: "Continue",
  },
  disable: {
    title: "Turn off two-step sign-in",
    subtitle: "Confirm it is you with your password.",
    submit: "Turn off two-step",
  },
  regenerate: {
    title: "Make new backup codes",
    subtitle: "Your old codes stop working. Confirm it is you with your password.",
    submit: "Make new codes",
  },
};

function downloadCodes(codes: readonly string[]): void {
  const blob = new Blob([`${codes.join("\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cleanstart-backup-codes.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function TwoStepCard({ enabled }: { enabled: boolean }): React.JSX.Element {
  const toast = useToast();
  const [on, setOn] = useState(enabled);
  const [step, setStep] = useState<Step>(null);
  const [purpose, setPurpose] = useState<Purpose>("enable");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setup, setSetup] = useState<{ setupKey: string; uri: string } | null>(null);
  const [codes, setCodes] = useState<readonly string[]>([]);

  const codeInvalid = tried && !/^\d{6}$/.test(code.replace(/\s/g, ""));
  // Stable: the overlay re-focuses its first field whenever onClose changes.
  const close = useCallback((): void => setStep(null), []);

  const ask = (next: Purpose): void => {
    setPurpose(next);
    setPassword("");
    setError(null);
    setTried(false);
    setStep("password");
  };

  const submitPassword = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!password) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    if (purpose === "enable") {
      const result = await enableTwoFactorAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setSetup({ setupKey: result.data.setupKey, uri: result.data.uri });
      setCodes(result.data.backupCodes);
      setCode("");
      setStep("scan");
    } else if (purpose === "disable") {
      const result = await disableTwoFactorAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setOn(false);
      setStep(null);
      toast("Two-step sign-in is off");
    } else {
      const result = await regenerateBackupCodesAction({ password });
      setBusy(false);
      if (!result.ok) return setError(issuesToErrors(result.error).password ?? result.error.message);
      setCodes(result.data.backupCodes);
      setStep("codes");
    }
    setPassword("");
  };

  const verify = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code.replace(/\s/g, ""))) {
      setTried(true);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await verifyTwoFactorAction({ code });
    setBusy(false);
    if (!result.ok) {
      setError(issuesToErrors(result.error).code ?? result.error.message);
      return;
    }
    setOn(true);
    setStep("codes");
    toast("Two-step sign-in is on");
  };

  return (
    <>
      <section aria-labelledby="tfa" className="card clip" data-tour="account-2fa">
        <div className="card-h">
          <h2 id="tfa" className="card-t">
            Two-step sign-in
          </h2>
          <Badge tone={on ? "accepted" : "neutral"}>{on ? "On" : "Off"}</Badge>
        </div>
        <div className="li" style={{ borderBottom: 0, alignItems: "flex-start" }}>
          <span className="li-ic">
            <Icon d={SHIELD} />
          </span>
          <span className="li-t">
            <span className="li-n">Authenticator app</span>
            <span className="li-s" style={{ whiteSpace: "normal" }}>
              {on
                ? "You enter a code from your phone after your password."
                : "Add a code from your phone after your password, so a leaked password alone cannot open your account."}
            </span>
          </span>
          {!on ? (
            <button type="button" className="btn btn-s" style={{ marginLeft: "auto" }} onClick={() => ask("enable")}>
              Turn on
            </button>
          ) : (
            <span className="acts" style={{ marginLeft: "auto" }}>
              <button type="button" className="btn btn-s" onClick={() => ask("regenerate")}>
                New backup codes
              </button>
              <button type="button" className="btn btn-d" onClick={() => ask("disable")}>
                Turn off
              </button>
            </span>
          )}
        </div>
      </section>

      <Dialog
        open={step === "password"}
        onClose={close}
        title={PURPOSE_COPY[purpose].title}
        subtitle={PURPOSE_COPY[purpose].subtitle}
        onSubmit={submitPassword}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={close}>
              Cancel
            </button>
            <button type="submit" className={purpose === "disable" ? "btn btn-dd" : "btn btn-p"} disabled={busy}>
              {PURPOSE_COPY[purpose].submit}
            </button>
          </>
        }
      >
        <PasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          {...(tried && !password ? { error: "Enter your password." } : error ? { error } : {})}
        />
      </Dialog>

      <Dialog
        open={step === "scan"}
        onClose={close}
        title="Turn on two-step sign-in"
        subtitle="Step 1 of 2"
        onSubmit={verify}
        footer={
          <>
            <button type="button" className="btn btn-s" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-p" disabled={busy}>
              Verify
            </button>
          </>
        }
      >
        <div style={{ display: "grid", gridTemplateColumns: "132px minmax(0, 1fr)", gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 8,
              border: "1px dashed #D9D5E6",
              background: "#FCFCFD",
              display: "grid",
              placeItems: "center",
              fontSize: 11.5,
              color: "#6B687D",
              textAlign: "center",
              padding: 10,
            }}
          >
            {setup ? (
              <a href={setup.uri} style={{ fontWeight: 600 }}>
                Open in your authenticator app
              </a>
            ) : null}
          </div>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.6, color: "#2A2838" }}>
            <li>Open an authenticator app, such as Google Authenticator or Microsoft Authenticator.</li>
            <li>Open the link on your phone, or type the key below.</li>
            <li>Enter the 6-digit code it shows.</li>
          </ol>
        </div>
        <div className="fg">
          <span className="lbl">Setup key</span>
          <span
            className="field tnum"
            style={{ display: "flex", alignItems: "center", background: "#FAFAFB", letterSpacing: "0.08em" }}
          >
            {setup?.setupKey}
          </span>
        </div>
        <div className="fg">
          <label htmlFor="tfa-code" className="lbl">
            6-digit code
          </label>
          <input
            id="tfa-code"
            className={`field${codeInvalid || error ? " field-err" : ""}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={codeInvalid || error ? true : undefined}
            aria-describedby={codeInvalid || error ? "tfa-err" : undefined}
            style={{ letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums" }}
          />
          {codeInvalid || error ? (
            <span className="err" id="tfa-err">
              {codeInvalid ? "Enter the 6 digits from your app." : error}
            </span>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={step === "codes"}
        onClose={close}
        title="Save your backup codes"
        subtitle={purpose === "enable" ? "Step 2 of 2" : "Shown once"}
        footer={
          <>
            <button
              type="button"
              className="btn btn-s"
              onClick={() => {
                downloadCodes(codes);
                toast("Downloading cleanstart-backup-codes.txt");
              }}
            >
              Download codes
            </button>
            <button type="button" className="btn btn-p" onClick={close}>
              Done
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#4A4858" }}>
          Each code works once if you lose your phone. Keep them somewhere safe, away from this device. You will not
          see them again.
        </p>
        <ul
          style={{
            margin: 0,
            padding: 12,
            listStyle: "none",
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "6px 16px",
            borderRadius: 8,
            background: "#FAFAFB",
            border: "1px solid #ECEBF1",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
            letterSpacing: "0.04em",
          }}
        >
          {codes.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
```

- [ ] **Step 8: Give the two cards their props in `Account.tsx`**

Edit `src/components/screens/Account.tsx`. Before (the state after Task M1.7):

```tsx
          <PasswordCard />
          <TwoStepCard />
          <SessionsCard sessions={sessions} today={today} />
```

After:

```tsx
          <PasswordCard passwordChangedAt={profile.passwordChangedAt} />
          <TwoStepCard enabled={profile.twoFactorEnabled} />
          <SessionsCard sessions={sessions} today={today} />
```

- [ ] **Step 9: Create the reset-password screen and page**

Better Auth sends the reset link to `/reset-password?token=...` (plan 02, `resetPasswordUrl`) and serves the endpoint; this page asks for the new password and calls the client method plan 02 exposes in `src/lib/auth-client.ts` (Step 1 checked it exists).

Create `src/components/screens/ResetPassword.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BulletList, PublicHeading, PublicSplit } from "@/components/partners/public-frame";
import { PasswordField, PasswordRules, passwordRules } from "@/components/ui/password-field";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { ROUTES } from "@/lib/routes";

const RULES = passwordRules("").map((rule) => rule.label);

export function ResetPassword({ token }: { token: string }): React.JSX.Element {
  const router = useRouter();
  const toast = useToast();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weak = passwordRules(pw).some((rule) => !rule.met);
  const mismatch = !weak && pw !== pw2;

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    if (weak || mismatch) {
      setTried(true);
      return;
    }
    setBusy(true);
    const { error: failure } = await authClient.resetPassword({ newPassword: pw, token });
    setBusy(false);
    if (failure) {
      setError(
        failure.code === "PASSWORD_RULES_NOT_MET"
          ? "Meet all four password rules."
          : "This reset link is invalid or has expired. Request a new one on the sign-in page.",
      );
      return;
    }
    toast("Password updated. Sign in with your new password.");
    router.push(ROUTES.signIn);
  };

  return (
    <PublicSplit
      label="Reset password"
      tag="Partner Portal"
      footerLeft="CleanStart Partner Portal"
      asideLabel="Password rules"
      aside={
        <div style={{ maxWidth: 420, alignSelf: "center", display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
            Choose a strong password
          </h2>
          <BulletList items={RULES} />
        </div>
      }
    >
      {token ? (
        <form
          onSubmit={submit}
          noValidate
          style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}
        >
          <PublicHeading title="Set a new password">
            You will be signed out everywhere else and can sign in with the new password.
          </PublicHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PasswordField
              label="New password"
              value={pw}
              onChange={setPw}
              {...(tried && weak ? { error: "Choose a password that meets every rule below." } : {})}
            />
            <div role="group" aria-label="Password rules">
              <PasswordRules value={pw} />
            </div>
          </div>
          <PasswordField
            label="Confirm new password"
            value={pw2}
            onChange={setPw2}
            {...(tried && mismatch ? { error: "The passwords do not match." } : {})}
          />
          {error ? (
            <span className="err" role="alert">
              {error}
            </span>
          ) : null}
          <button type="submit" className="btn btn-p" style={{ height: 38, fontSize: 13.5 }} disabled={busy}>
            Update password
          </button>
        </form>
      ) : (
        <div role="status" style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <PublicHeading title="This reset link is not valid">
            Check that you copied the whole link from the email, or request a new one on the sign-in page.
          </PublicHeading>
          <Link href={ROUTES.signIn} className="btn btn-s" style={{ alignSelf: "flex-start" }}>
            Go to sign in
          </Link>
        </div>
      )}
    </PublicSplit>
  );
}
```

Create `src/app/(public)/reset-password/page.tsx`:

```tsx
import type { Metadata } from "next";
import { ResetPassword } from "@/components/screens/ResetPassword";

export const metadata: Metadata = { title: "Reset your password" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { token } = await searchParams;
  return <ResetPassword token={typeof token === "string" ? token : ""} />;
}
```

`PasswordRules` and `passwordRules` are exported by `components/ui/password-field.tsx` (the mock's AcceptInvite imports them from there); `passwordRules("")` returns the four rules with their labels.

- [ ] **Step 10: Prove the cards no longer read the mock data**

Run: `grep -n "@/data/\|@/lib/slice\|accountSlice" src/components/people/PasswordCard.tsx src/components/people/TwoStepCard.tsx src/components/screens/Account.tsx src/components/screens/ResetPassword.tsx`
Expected: no output.

- [ ] **Step 11: Gate A**

Run the Gate A block. The last command must list only this task's Files block.

- [ ] **Step 12: Manual check (seed-dev data, signed in as `aditi.rao@kestrelsystems.in`, route `/partner/account`)**

1. Password card: "Last changed" shows the date of the seed (or "Not changed yet"). Enter a wrong current password and a strong new one: "That password is not right." under the current password field, nothing changed. Enter the right one: "Password updated.", the header shows today's date, `select event from audit_log order by at desc limit 1` is `account.password_changed`, the dev log shows a "password changed" email built for Aditi, and other browsers are signed out.
2. Two-step card: "Turn on", enter the password: the setup dialog shows a setup key in groups of four and an "Open in your authenticator app" link. Type a wrong 6-digit code: the dialog shows "That code is not right. Check the 6 digits and try again." Add the key to an authenticator app (or compute the code with `scripts` from plan 02's `test-totp.ts`), enter the code: toast "Two-step sign-in is on" and the ten backup codes appear once, with a Download button. The badge reads "On"; sign out and in again: the sign-in screen asks for the code.
3. "New backup codes": password, then a new set appears; an old code no longer works at sign in. "Turn off": password, the badge reads "Off"; `audit_log` has `account.two_factor_enabled` and `account.two_factor_disabled`.
4. Forgot password: on `/sign-in` request a reset for Aditi (dev log has no body, so run `select value from auth_verification order by created_at desc limit 1` to read the token, or use plan 02's helper), open `/reset-password?token=<token>`: the page shows "Set a new password"; a weak password shows the rule error; a strong one toasts and returns to sign in. Open `/reset-password` with no token: "This reset link is not valid".

- [ ] **Step 13: Commit**

```bash
git add apps/portal/src/server/auth-errors.ts apps/portal/src/server/auth-errors.test.ts \
  apps/portal/src/server/actions/account.ts apps/portal/src/server/actions/account-security.test.ts \
  apps/portal/src/components/people/PasswordCard.tsx apps/portal/src/components/people/TwoStepCard.tsx \
  apps/portal/src/components/screens/Account.tsx apps/portal/src/components/screens/ResetPassword.tsx \
  "apps/portal/src/app/(public)/reset-password/page.tsx" \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.7b password change, two-step sign-in and reset-password page"
```

---

### Task M1.8: Staff admin

Implements master task 1.8. Only partner managers add, change or remove CleanStart teammates (contracts decision 8); staff can only be created through a staff invite, never from the partner side. Roles and regions are changed in place; the last active partner manager can never be removed or demoted; nobody removes or demotes themselves. `listManagerOptions` (the active partner managers a deal can be routed to, readable by partners) is added here because it lives in `repo/staff.ts`. Partner manager reassignment of a partner's manager is part of task M4.1 (`setPartnerManager`).

**Files:**
- Create: `src/server/repo/staff.ts`, `src/server/repo/staff.test.ts`
- Create: `src/server/actions/staff.ts`, `src/server/actions/staff.test.ts`
- Modify: `src/components/screens/AdminTeam.tsx`, `src/components/people/StaffInviteDrawer.tsx`, `src/app/admin/team/page.tsx`

- [ ] **Step 1: Write the failing repo tests**

Create `src/server/repo/staff.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { invites, staffScopes, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { withViewer } from './context';
import { changeStaffRegion, changeStaffRole, listManagerOptions, listStaff, removeStaff } from './staff';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
const future = new Date('2099-01-01T00:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('listStaff', () => {
  it('lists people with their region, the partners a manager manages, and invited teammates', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    await makePartner(db, { name: 'Saffron Secure', managerId: farhan.id });
    await makePartner(db, { name: 'Kestrel Systems', managerId: farhan.id });
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    await makeUser(db, { kind: 'staff', role: 'sales', status: 'disabled', region: 'india' });
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    const list = await withViewer(farhan, (tx) => listStaff(tx, farhan));
    expect(list.map((p) => [p.name, p.role, p.region, p.status, p.isYou])).toEqual([
      [farhan.name, 'partner_manager', 'india', 'active', true],
      ['Rahul Menon', 'sales', 'india', 'active', false],
      ['Kunal Shah', 'sales', 'india', 'invited', false],
    ]);
    expect(list[0]?.partners).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(list[1]).toMatchObject({ id: rahul.id, partners: [], inviteId: null });
    expect(list[2]).toMatchObject({ id: invite.id, inviteId: invite.id, lastActiveAt: null });
  });

  it('is for staff only', async () => {
    const viewer = await asPartner(db, {});
    await expect(withViewer(viewer, (tx) => listStaff(tx, viewer))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('listManagerOptions', () => {
  it('offers the active partner managers with their team, to partners and staff alike', async () => {
    const india = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const gulf = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', status: 'disabled' });
    const partner = await asPartner(db, { role: 'sales' });
    const options = await withViewer(partner, (tx) => listManagerOptions(tx, partner));
    expect(options).toEqual([
      { id: india.id, name: 'Farhan Qureshi', region: 'india', team: 'CleanStart India' },
      { id: gulf.id, name: 'Omar Nasser', region: 'middle_east', team: 'CleanStart Middle East' },
    ]);
  });
});

describe('changeStaffRole', () => {
  it('changes a teammate\'s role and returns them', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const changed = await withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: rahul.id, role: 'marketing' }));
    expect(changed).toMatchObject({ id: rahul.id, role: 'marketing' });
  });

  it('cannot change your own role, and a partner cannot call it', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: manager.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const lone = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const partner = await asPartner(db, {});
    await expect(withViewer(partner, (tx) => changeStaffRole(tx, partner, { userId: lone.id, role: 'sales' }))).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('refuses to demote the last active partner manager', async () => {
    const sole = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const actor = await asStaff(db, 'sales', 'india');
    await expect(withViewer(actor, (tx) => changeStaffRole(tx, actor, { userId: sole.id, role: 'sales' }))).rejects.toMatchObject({ reason: 'last_partner_manager' });
  });

  it('does not find a person who is only invited', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'k@cleanstart.com', expiresAt: future });
    await expect(withViewer(manager, (tx) => changeStaffRole(tx, manager, { userId: invite.id, role: 'marketing' }))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('changeStaffRegion', () => {
  it('changes the scope row', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    const changed = await withViewer(manager, (tx) => changeStaffRegion(tx, manager, { userId: rahul.id, region: 'middle_east' }));
    expect(changed.region).toBe('middle_east');
    const [scope] = await db.select().from(staffScopes).where(eq(staffScopes.userId, rahul.id));
    expect(scope?.region).toBe('middle_east');
  });
});

describe('removeStaff', () => {
  it('disables a teammate and stamps removed_at', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    const removed = await withViewer(manager, (tx) => removeStaff(tx, manager, { userId: rahul.id }, clock));
    expect(removed).toEqual({ userId: rahul.id, name: 'Rahul Menon', email: 'rahul@cleanstart.com' });
    const [row] = await db.select().from(users).where(eq(users.id, rahul.id));
    expect(row?.status).toBe('disabled');
    expect(row?.removedAt?.toISOString()).toBe('2026-11-12T10:00:00.000Z');
  });

  it('withdraws the invite when the person has not accepted yet', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    const removed = await withViewer(manager, (tx) => removeStaff(tx, manager, { userId: invite.id }, clock));
    expect(removed).toEqual({ userId: invite.id, name: 'Kunal Shah', email: 'kunal.shah@cleanstart.com' });
    const [row] = await db.select().from(invites).where(eq(invites.id, invite.id));
    expect(row?.revokedAt).not.toBeNull();
  });

  it('refuses removing yourself, the last partner manager, and an unknown id', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    await expect(withViewer(manager, (tx) => removeStaff(tx, manager, { userId: manager.id }, clock))).rejects.toMatchObject({ reason: 'cannot_remove_self' });
    const helper = await asStaff(db, 'sales', 'india');
    await expect(withViewer(helper, (tx) => removeStaff(tx, helper, { userId: manager.id }, clock))).rejects.toMatchObject({ reason: 'last_partner_manager' });
    await expect(withViewer(helper, (tx) => removeStaff(tx, helper, { userId: '00000000-0000-0000-0000-000000000001' }, clock))).rejects.toMatchObject({ code: 'not_found' });
  });
});
```

The repo guards who may call by staff kind only; the action checks the role, so a staff sales viewer reaching `removeStaff` directly is not a path the app has, and the test uses one only to act on the partner manager.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/staff.test.ts`
Expected: FAIL, `Failed to resolve import "./staff"`.

- [ ] **Step 2: Implement the staff repo**

Create `src/server/repo/staff.ts`:

```ts
import { and, asc, eq, inArray, isNull, ne } from 'drizzle-orm';
import { invites, partners, staffScopes, users } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { systemClock } from '@/lib/clock';
import type { StaffRegion, StaffRole } from '@/lib/domain';
import type { ManagerOptionDto, StaffMemberDto } from '@/lib/dto';
import { nameFromEmail, staffTeamLabel } from '@/lib/people';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, NotFoundError } from '@/server/errors';
import { iso } from '@/server/people';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

/** People of the CleanStart team: users with a login plus teammates who only have an open invite (id is then the invite id). */
export async function listStaff(tx: Tx, viewer: Viewer): Promise<StaffMemberDto[]> {
  assertStaff(viewer);
  const rows = await tx
    .select({ user: users, region: staffScopes.region })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), ne(users.status, 'disabled')))
    .orderBy(asc(users.createdAt));
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.kind, 'staff'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const managerIds = rows.filter((r) => r.user.role === 'partner_manager').map((r) => r.user.id);
  const managed =
    managerIds.length === 0
      ? []
      : await tx.select({ managerId: partners.managerId, name: partners.name }).from(partners).where(inArray(partners.managerId, managerIds)).orderBy(asc(partners.name));

  const members: StaffMemberDto[] = rows.map(({ user, region }) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as StaffRole,
    region: region ?? 'all',
    partners: managed.filter((m) => m.managerId === user.id).map((m) => m.name),
    status: user.status === 'active' ? 'active' : 'invited',
    lastActiveAt: iso(user.lastLoginAt),
    inviteId: open.find((i) => i.email === user.email)?.id ?? null,
    isYou: user.id === viewer.id,
  }));
  for (const invite of open) {
    if (rows.some((r) => r.user.email === invite.email)) continue;
    members.push({
      id: invite.id,
      name: nameFromEmail(invite.email),
      email: invite.email,
      role: invite.role as StaffRole,
      region: invite.staffRegion ?? 'all',
      partners: [],
      status: 'invited',
      lastActiveAt: null,
      inviteId: invite.id,
      isYou: false,
    });
  }
  return [...members.filter((m) => m.status === 'active'), ...members.filter((m) => m.status === 'invited')];
}

/** The active partner managers a registration can be routed to, with their regions. Readable by partners (C.3). */
export async function listManagerOptions(tx: Tx, _viewer: Viewer): Promise<ManagerOptionDto[]> {
  const rows = await tx
    .select({ id: users.id, name: users.name, region: staffScopes.region })
    .from(users)
    .leftJoin(staffScopes, eq(staffScopes.userId, users.id))
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active')))
    .orderBy(asc(users.createdAt));
  return rows.map((r) => ({ id: r.id, name: r.name, region: r.region ?? 'all', team: staffTeamLabel(r.region) }));
}

const loadTarget = async (tx: Tx, userId: string) => {
  const [row] = await tx
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.kind, 'staff'), ne(users.status, 'disabled')))
    .limit(1)
    .for('update');
  return row ?? null;
};

/** Throws ConflictError('last_partner_manager') unless another active partner manager stays behind. */
const assertAnotherManager = async (tx: Tx, leavingId: string): Promise<void> => {
  const [other] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.kind, 'staff'), eq(users.role, 'partner_manager'), eq(users.status, 'active'), ne(users.id, leavingId)))
    .limit(1)
    .for('update');
  if (!other) throw new ConflictError('last_partner_manager', 'CleanStart needs at least one partner manager.');
};

const memberAfter = async (tx: Tx, viewer: Viewer, id: string): Promise<StaffMemberDto> => {
  const member = (await listStaff(tx, viewer)).find((m) => m.id === id);
  if (!member) throw new NotFoundError('staff member');
  return member;
};

/** Throws ConflictError('last_partner_manager') and ConflictError('cannot_remove_self'). */
export async function changeStaffRole(tx: Tx, viewer: Viewer, input: { userId: string; role: StaffRole }): Promise<StaffMemberDto> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (!target) throw new NotFoundError('staff member');
  if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot change your own access.');
  if (target.role !== input.role) {
    if (target.role === 'partner_manager') await assertAnotherManager(tx, target.id);
    await tx.update(users).set({ role: input.role }).where(eq(users.id, target.id));
  }
  return memberAfter(tx, viewer, target.id);
}

export async function changeStaffRegion(tx: Tx, viewer: Viewer, input: { userId: string; region: StaffRegion }): Promise<StaffMemberDto> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (!target) throw new NotFoundError('staff member');
  await tx
    .insert(staffScopes)
    .values({ userId: target.id, region: input.region })
    .onConflictDoUpdate({ target: staffScopes.userId, set: { region: input.region } });
  return memberAfter(tx, viewer, target.id);
}

/**
 * Disables a teammate, or withdraws the invite when the id is a teammate who has not accepted yet. Throws
 * ConflictError('last_partner_manager') and ConflictError('cannot_remove_self'). Deleting the person's Better Auth
 * sessions is the action's job after commit (auth_session is system-only under RLS).
 */
export async function removeStaff(
  tx: Tx,
  viewer: Viewer,
  input: { userId: string },
  clock: Clock,
): Promise<{ userId: string; name: string; email: string }> {
  assertStaff(viewer);
  const target = await loadTarget(tx, input.userId);
  if (target) {
    if (target.id === viewer.id) throw new ConflictError('cannot_remove_self', 'You cannot remove yourself.');
    if (target.role === 'partner_manager') await assertAnotherManager(tx, target.id);
    await tx.update(users).set({ status: 'disabled', removedAt: clock.now() }).where(eq(users.id, target.id));
    return { userId: target.id, name: target.name, email: target.email };
  }
  const [invite] = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.id, input.userId), eq(invites.kind, 'staff'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .limit(1)
    .for('update');
  if (!invite) throw new NotFoundError('staff member');
  await tx.update(invites).set({ revokedAt: clock.now() }).where(eq(invites.id, invite.id));
  return { userId: invite.id, name: nameFromEmail(invite.email), email: invite.email };
}

export const isolation = defineIsolation<'listStaff' | 'listManagerOptions' | 'changeStaffRole' | 'changeStaffRegion' | 'removeStaff'>({
  listStaff: { scope: 'staff-only', probe: (tx, viewer) => listStaff(tx, viewer), expect: 'forbidden' },
  listManagerOptions: { scope: 'tenant', probe: (tx, viewer) => listManagerOptions(tx, viewer), expect: 'unchanged' },
  changeStaffRole: { scope: 'staff-only', probe: (tx, viewer, ctx) => changeStaffRole(tx, viewer, { userId: ctx.staffUserId, role: 'sales' }), expect: 'forbidden' },
  changeStaffRegion: { scope: 'staff-only', probe: (tx, viewer, ctx) => changeStaffRegion(tx, viewer, { userId: ctx.staffUserId, region: 'all' }), expect: 'forbidden' },
  removeStaff: { scope: 'staff-only', probe: (tx, viewer, ctx) => removeStaff(tx, viewer, { userId: ctx.staffUserId }, systemClock), expect: 'forbidden' },
});
```

Merge the two `@/lib/clock` imports into `import { type Clock, systemClock } from '@/lib/clock';`.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/staff.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (staff: 11 tests; isolation passes for `staff`).

- [ ] **Step 3: Write the failing action tests**

Create `src/server/actions/staff.test.ts`:

```ts
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { auditLog, invites, users } from '@/db/schema';
import { asPartner, asStaff, makeInvite, makeUser, resetDb, testDb } from '@/db/test-helpers';
import type { Viewer } from '@/server/auth/types';
import type { FakeEmailTransport } from '@/server/email/fake';
import type { EmailMessage } from '@/server/email/transport';

const harness = vi.hoisted(() => ({ viewer: null as Viewer | null, ip: '198.51.100.1', cookieJar: new Map<string, string>() }));
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
vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));

import { revokeAllSessions } from '@/server/auth/sessions';
import {
  changeStaffRegionAction,
  changeStaffRoleAction,
  inviteStaffAction,
  removeStaffAction,
  resendStaffInviteAction,
} from './staff';

const db = testDb();
let fake: FakeEmailTransport;
const future = new Date('2099-01-01T00:00:00Z');

beforeAll(async () => {
  fake = ((await import('@/server/email/send')) as unknown as { fake: FakeEmailTransport }).fake;
});

beforeEach(async () => {
  await resetDb(db);
  fake.clear();
  vi.mocked(revokeAllSessions).mockClear();
  harness.viewer = await asStaff(db, 'partner_manager', 'india');
});

const events = async () => (await db.select().from(auditLog)).map((a) => a.event).sort();

describe('inviteStaffAction', () => {
  it('invites a teammate: staff invite row, audit and an email with a link', async () => {
    const result = await inviteStaffAction({ name: 'Kunal Shah', email: 'Kunal.Shah@cleanstart.com', role: 'sales', region: 'india' });
    expect(result).toMatchObject({ ok: true, data: { email: 'kunal.shah@cleanstart.com', kind: 'staff', role: 'sales', staffRegion: 'india' } });
    expect(JSON.stringify(result)).not.toContain('token');
    expect(await events()).toEqual(['staff.invited']);
    expect((await db.select().from(auditLog))[0]?.target).toBe('Kunal Shah, sales, India');
    const mail = fake.only('kunal.shah@cleanstart.com');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=[A-Za-z0-9_-]{43}/u);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('is only for partner managers: staff sales, marketing and partner viewers are refused', async () => {
    for (const viewer of [await asStaff(db, 'sales', 'india'), await asStaff(db, 'marketing', 'all'), await asPartner(db, { role: 'partner_admin' })]) {
      harness.viewer = viewer;
      expect(await inviteStaffAction({ name: 'X', email: 'x@cleanstart.com', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    }
    expect(await db.select().from(invites)).toHaveLength(0);
    expect(fake.sent).toHaveLength(0);
  });

  it('reports an existing login and validates the input', async () => {
    const teammate = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', email: 'rahul@cleanstart.com' });
    expect(await inviteStaffAction({ name: 'Rahul', email: teammate.email, role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await inviteStaffAction({ name: '  ', email: 'a@cleanstart.com', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await inviteStaffAction({ name: 'A', email: 'nope', role: 'sales', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    expect(await inviteStaffAction({ name: 'A', email: 'a@cleanstart.com', role: 'partner_admin', region: 'india' })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});

describe('resendStaffInviteAction', () => {
  it('sends a new link and audits it', async () => {
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    expect(await resendStaffInviteAction({ inviteId: invite.id })).toMatchObject({ ok: true, data: { id: invite.id, resentCount: 1 } });
    expect(fake.only('kunal.shah@cleanstart.com').htmlContent).toMatch(/accept-invite\?token=/u);
    expect(await events()).toEqual(['staff.invite_resent']);
  });
});

describe('changeStaffRoleAction and changeStaffRegionAction', () => {
  it('changes a role and a region with audit notes', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon' });
    expect(await changeStaffRoleAction({ userId: rahul.id, role: 'marketing' })).toMatchObject({ ok: true, data: { role: 'marketing' } });
    expect(await changeStaffRegionAction({ userId: rahul.id, region: 'middle_east' })).toMatchObject({ ok: true, data: { region: 'middle_east' } });
    const notes = Object.fromEntries((await db.select().from(auditLog)).map((e) => [e.event, e.note]));
    expect(notes).toEqual({ 'staff.role_changed': 'Sales to Marketing.', 'staff.region_changed': 'India to Middle East.' });
  });

  it('refuses to change your own role', async () => {
    const me = harness.viewer as Viewer;
    expect(await changeStaffRoleAction({ userId: me.id, role: 'sales' })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot change your own access.' } });
  });

  it('is only for partner managers', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    harness.viewer = await asStaff(db, 'marketing', 'all');
    expect(await changeStaffRoleAction({ userId: rahul.id, role: 'marketing' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    expect(await changeStaffRegionAction({ userId: rahul.id, region: 'all' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});

describe('removeStaffAction', () => {
  it('removes a teammate, signs them out and audits it', async () => {
    const rahul = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india', name: 'Rahul Menon' });
    expect(await removeStaffAction({ id: rahul.id })).toMatchObject({ ok: true });
    expect(revokeAllSessions).toHaveBeenCalledWith(rahul.id);
    expect(await events()).toEqual(['staff.removed']);
    const [row] = await db.select().from(users).where(eq(users.id, rahul.id));
    expect(row?.status).toBe('disabled');
  });

  it('withdraws an unaccepted invite without touching sessions, and refuses removing yourself', async () => {
    const { invite } = await makeInvite(db, { kind: 'staff', partnerId: null, role: 'sales', staffRegion: 'india', email: 'kunal.shah@cleanstart.com', expiresAt: future });
    expect(await removeStaffAction({ id: invite.id })).toMatchObject({ ok: true });
    expect(revokeAllSessions).not.toHaveBeenCalled();
    expect(await removeStaffAction({ id: (harness.viewer as Viewer).id })).toMatchObject({ ok: false, error: { code: 'conflict', message: 'You cannot remove yourself.' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/staff.test.ts`
Expected: FAIL, `Failed to resolve import "./staff"`.

- [ ] **Step 4: Implement the staff actions**

Create `src/server/actions/staff.ts`:

```ts
'use server';

import { z } from 'zod';
import { STAFF_REGION_LABEL, STAFF_REGIONS, STAFF_ROLE_LABEL, STAFF_ROLES } from '@/lib/domain';
import type { InviteDto, StaffMemberDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { revokeAllSessions } from '@/server/auth/sessions';
import { sendEmail } from '@/server/email/send';
import { buildTeamInvite } from '@/server/email/templates';
import { NotFoundError } from '@/server/errors';
import { withViewer } from '@/server/repo/context';
import { createInvite, resendInvite } from '@/server/repo/invites';
import { changeStaffRegion, changeStaffRole, listStaff, removeStaff } from '@/server/repo/staff';
import { inviteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const inviteSchema = z.object({
  name: z.string().trim().min(1, 'Enter their name.').max(120),
  email: z.string().trim().max(254),
  role: z.enum(STAFF_ROLES),
  region: z.enum(STAFF_REGIONS),
});
const inviteIdSchema = z.object({ inviteId: z.string().uuid() });
const roleSchema = z.object({ userId: z.string().uuid(), role: z.enum(STAFF_ROLES) });
const regionSchema = z.object({ userId: z.string().uuid(), region: z.enum(STAFF_REGIONS) });
const removeSchema = z.object({ id: z.string().uuid() });

const staffMail = (args: { invite: InviteDto; token: string; inviteeName: string; inviterName: string }) =>
  buildTeamInvite({
    to: { email: args.invite.email, name: args.inviteeName },
    inviteeName: args.inviteeName,
    inviterName: args.inviterName,
    audience: 'staff',
    companyName: null,
    roleLabel: STAFF_ROLE_LABEL[args.invite.role as keyof typeof STAFF_ROLE_LABEL],
    inviteUrl: inviteUrl(args.token),
    expiresOn: args.invite.expiresAt.slice(0, 10),
  });

export async function inviteStaffAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'staff.invite', schema: inviteSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    assertCan(ctx.viewer, 'staff.invite');
    const created = await withViewer(ctx.viewer, async (tx) => {
      const result = await createInvite(tx, ctx.viewer, { kind: 'staff', email: input.email, role: input.role, region: input.region }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.invited',
        target: `${input.name}, ${STAFF_ROLE_LABEL[input.role].toLowerCase()}, ${STAFF_REGION_LABEL[input.region]}`,
        subject: { type: 'invite', id: result.invite.id },
      });
      return result;
    });
    ctx.revalidate(ROUTES.admin.team);
    ctx.afterCommit(async () => {
      await sendEmail(staffMail({ invite: created.invite, token: created.token, inviteeName: input.name, inviterName: ctx.viewer.name }));
    });
    return created.invite;
  });
}

export async function resendStaffInviteAction(raw: unknown): Promise<ActionResult<InviteDto>> {
  return runViewerAction({ name: 'staff.resend_invite', schema: inviteIdSchema }, raw, async (ctx, input): Promise<InviteDto> => {
    assertCan(ctx.viewer, 'staff.resend_invite');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const member = (await listStaff(tx, ctx.viewer)).find((m) => m.inviteId === input.inviteId);
      if (!member) throw new NotFoundError('invite');
      const resent = await resendInvite(tx, ctx.viewer, { inviteId: input.inviteId }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.invite_resent',
        target: `${member.name}, ${STAFF_ROLE_LABEL[member.role].toLowerCase()}, ${STAFF_REGION_LABEL[member.region]}`,
        subject: { type: 'invite', id: resent.invite.id },
      });
      return { resent, member };
    });
    ctx.revalidate(ROUTES.admin.team);
    ctx.afterCommit(async () => {
      await sendEmail(staffMail({ invite: done.resent.invite, token: done.resent.token, inviteeName: done.member.name, inviterName: ctx.viewer.name }));
    });
    return done.resent.invite;
  });
}

export async function changeStaffRoleAction(raw: unknown): Promise<ActionResult<StaffMemberDto>> {
  return runViewerAction({ name: 'staff.change_role', schema: roleSchema }, raw, async (ctx, input): Promise<StaffMemberDto> => {
    assertCan(ctx.viewer, 'staff.change_role');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const before = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('staff member');
      const after = await changeStaffRole(tx, ctx.viewer, { userId: input.userId, role: input.role });
      if (before.role !== after.role) {
        await recordAudit(tx, ctx.viewer, {
          event: 'staff.role_changed',
          target: `${after.name}, CleanStart team`,
          note: `${STAFF_ROLE_LABEL[before.role]} to ${STAFF_ROLE_LABEL[after.role]}.`,
          subject: { type: 'user', id: after.id },
        });
      }
      return after;
    });
    ctx.revalidate(ROUTES.admin.team);
    return changed;
  });
}

export async function changeStaffRegionAction(raw: unknown): Promise<ActionResult<StaffMemberDto>> {
  return runViewerAction({ name: 'staff.change_region', schema: regionSchema }, raw, async (ctx, input): Promise<StaffMemberDto> => {
    assertCan(ctx.viewer, 'staff.change_region');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const before = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.userId && m.inviteId !== m.id);
      if (!before) throw new NotFoundError('staff member');
      const after = await changeStaffRegion(tx, ctx.viewer, { userId: input.userId, region: input.region });
      if (before.region !== after.region) {
        await recordAudit(tx, ctx.viewer, {
          event: 'staff.region_changed',
          target: `${after.name}, CleanStart team`,
          note: `${STAFF_REGION_LABEL[before.region]} to ${STAFF_REGION_LABEL[after.region]}.`,
          subject: { type: 'user', id: after.id },
        });
      }
      return after;
    });
    ctx.revalidate(ROUTES.admin.team);
    return changed;
  });
}

export async function removeStaffAction(raw: unknown): Promise<ActionResult<{ id: string }>> {
  return runViewerAction({ name: 'staff.remove', schema: removeSchema }, raw, async (ctx, input): Promise<{ id: string }> => {
    assertCan(ctx.viewer, 'staff.remove');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const member = (await listStaff(tx, ctx.viewer)).find((m) => m.id === input.id);
      if (!member) throw new NotFoundError('staff member');
      const removed = await removeStaff(tx, ctx.viewer, { userId: input.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'staff.removed',
        target: `${removed.name}, ${STAFF_ROLE_LABEL[member.role].toLowerCase()}, ${STAFF_REGION_LABEL[member.region]}`,
        subject: { type: 'user', id: removed.userId },
      });
      return { removed, hadLogin: member.inviteId !== member.id };
    });
    ctx.revalidate(ROUTES.admin.team);
    // auth_session is system-only under RLS, so the sessions go here, after commit. An invite-only teammate has none.
    if (done.hadLogin) ctx.afterCommit(async () => revokeAllSessions(done.removed.userId));
    return { id: done.removed.userId };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/staff.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Replace `StaffInviteDrawer.tsx`**

Replace `src/components/people/StaffInviteDrawer.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import {
  STAFF_REGION_LABEL,
  STAFF_REGIONS,
  STAFF_ROLE_LABEL,
  STAFF_ROLES,
  type StaffRegion,
  type StaffRole,
} from "@/lib/domain";
import { codeFromLabel, isValidEmail } from "@/lib/people";
import { inviteStaffAction } from "@/server/actions/staff";
import { issuesToErrors } from "@/server/actions/result";
import { Seg } from "./Seg";

const ROLES: readonly string[] = STAFF_ROLES.map((r) => STAFF_ROLE_LABEL[r]);
const REGIONS: readonly string[] = STAFF_REGIONS.map((r) => STAFF_REGION_LABEL[r]);
const ROLE_HINT: Record<StaffRole, string> = {
  partner_manager: "Approves deals and applications, and manages partners.",
  sales: "Sees and approves deals in their own region.",
  marketing: "Publishes documents for partners.",
};

export function StaffInviteDrawer({
  open,
  onClose,
  existingEmails,
}: {
  open: boolean;
  onClose: () => void;
  existingEmails: readonly string[];
}): React.JSX.Element | null {
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleLabel, setRoleLabel] = useState<string>(STAFF_ROLE_LABEL.sales);
  const [regionLabel, setRegionLabel] = useState<string>(STAFF_REGION_LABEL.india);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();
  const emailOk = isValidEmail(address);
  const duplicate = existingEmails.includes(address);
  const nameErr = tried && name.trim() === "";
  const emailErr = (tried && (!emailOk || duplicate)) || serverError !== null;
  const role: StaffRole = codeFromLabel(STAFF_ROLE_LABEL, roleLabel) ?? "sales";
  const region: StaffRegion = codeFromLabel(STAFF_REGION_LABEL, regionLabel) ?? "india";

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setServerError(null);
    if (name.trim() === "" || !emailOk || duplicate) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await inviteStaffAction({ name, email: address, role, region });
    setBusy(false);
    if (!result.ok) {
      setServerError(issuesToErrors(result.error).email ?? result.error.message);
      return;
    }
    setName("");
    setEmail("");
    setRoleLabel(STAFF_ROLE_LABEL.sales);
    setRegionLabel(STAFF_REGION_LABEL.india);
    setTried(false);
    onClose();
    toast(`Invite sent to ${address}`);
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Invite a teammate"
      subtitle="They get an email to set a password for the CleanStart admin."
      onSubmit={submit}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Send invite
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="inv-name" className="lbl">
          Full name
        </label>
        <input
          id="inv-name"
          className={`field${nameErr ? " field-err" : ""}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameErr}
          aria-describedby={nameErr ? "inv-name-err" : undefined}
        />
        {nameErr ? (
          <span className="err" id="inv-name-err">
            Enter their name.
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="inv-email" className="lbl">
          Work email
        </label>
        <input
          id="inv-email"
          className={`field${emailErr ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr}
          aria-describedby={emailErr ? "inv-email-err" : undefined}
        />
        {emailErr ? (
          <span className="err" id="inv-email-err">
            {serverError ?? (duplicate ? "This person is already on the team." : "Enter a valid work email.")}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <span id="inv-role" className="lbl">
          Role
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={ROLES} value={roleLabel} onChange={setRoleLabel} labelledBy="inv-role" />
        </div>
        <span className="hint">{ROLE_HINT[role]}</span>
      </div>
      <div className="fg">
        <span id="inv-reg" className="lbl">
          Region
        </span>
        <div style={{ alignSelf: "flex-start" }}>
          <Seg options={REGIONS} value={regionLabel} onChange={setRegionLabel} labelledBy="inv-reg" />
        </div>
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 6: Replace `AdminTeam.tsx`**

Replace `src/components/screens/AdminTeam.tsx` in full. Changes from the mock: DTO input; roles through a dropdown of `{ value, label }` options; a teammate who has only been invited shows a badge for the role and "Invite pending" for last active (the DTO carries no invite date, "Contract change requests" item 2); removing an invited teammate withdraws the invite.

```tsx
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Icon } from "@/components/icon";
import { RowAction } from "@/components/people/RowAction";
import { StaffInviteDrawer } from "@/components/people/StaffInviteDrawer";
import { Badge } from "@/components/ui/badge";
import { Dropdown, type DropdownOption } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { isOneOf, STAFF_REGION_LABEL, STAFF_ROLE_LABEL, STAFF_ROLES, type StaffRole } from "@/lib/domain";
import type { StaffMemberDto } from "@/lib/dto";
import { initialsOf, lastSeenLabel, rowKey } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import type { ActionResult } from "@/server/actions/result";
import { changeStaffRoleAction, removeStaffAction } from "@/server/actions/staff";

const ROLE_OPTIONS: readonly DropdownOption[] = STAFF_ROLES.map((value) => ({ value, label: STAFF_ROLE_LABEL[value] }));

// [action, partner manager, sales, marketing]
const PERMISSIONS: ReadonlyArray<readonly [string, string, string, string]> = [
  ["Approve or reject a deal", "Yes", "Own region", "No"],
  ["See deals", "All partners", "Own region", "No"],
  ["Register a deal for a partner", "Yes", "No", "No"],
  ["Approve applications and set tier", "Yes", "No", "No"],
  ["Invite or remove partner users", "Any partner", "No", "No"],
  ["Publish documents", "Yes", "No", "Yes"],
  ["Download documents", "Yes", "Yes", "Yes"],
];

function roleToast(name: string, role: StaffRole): string {
  const phrase = role === "sales" ? "in sales" : role === "marketing" ? "in marketing" : "a partner manager";
  return `${name} is now ${phrase}`;
}

export function AdminTeam({ people, today }: { people: StaffMemberDto[]; today: string }): React.JSX.Element {
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [warnFor, setWarnFor] = useState<string | null>(null);
  const closeInvite = useCallback((): void => setInviteOpen(false), []);

  const report = async (pending: Promise<ActionResult<unknown>>): Promise<boolean> => {
    const result = await pending;
    if (!result.ok) toast(result.error.message);
    return result.ok;
  };

  const changeRole = async (person: StaffMemberDto, role: StaffRole): Promise<void> => {
    if (!(await report(changeStaffRoleAction({ userId: person.id, role })))) return;
    setWarnFor(person.partners.length > 0 && role !== "partner_manager" ? person.id : null);
    toast(roleToast(person.name, role));
  };

  const remove = async (person: StaffMemberDto): Promise<void> => {
    setConfirming(null);
    if (await report(removeStaffAction({ id: person.id }))) toast(`Removed access for ${person.name}`);
  };

  const lastActive = (p: StaffMemberDto): string =>
    p.isYou ? "Now" : p.status === "invited" ? "Invite pending" : lastSeenLabel(p.lastActiveAt, today);

  const warned = people.find((p) => p.id === warnFor && p.role !== "partner_manager");

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">CleanStart team</h1>
          <span className="h1-sub">
            People at CleanStart who use this admin. A role decides what each person can see and do.
          </span>
        </div>
        <button type="button" className="btn btn-p" onClick={() => setInviteOpen(true)} data-tour="staff-add">
          <Icon name="userplus" />
          Invite teammate
        </button>
      </div>

      <section aria-labelledby="ppl" className="card clip" data-tour="staff-table">
        <div className="card-h">
          <h2 id="ppl" className="card-t">
            People
          </h2>
          <span className="card-meta tnum">
            {people.length} people, {people.filter((p) => p.status === "invited").length} invited
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
                <th scope="col">Region</th>
                <th scope="col">Partners managed</th>
                <th scope="col">Last active</th>
                <th scope="col">Status</th>
                <th scope="col" className="r">
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="av av-1 av-r">{initialsOf(p.name)}</span>
                      <span className="li-t">
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {p.name}
                          {p.isYou ? (
                            <>
                              {" "}
                              <span className="t-muted" style={{ fontWeight: 500 }}>
                                (you)
                              </span>
                            </>
                          ) : null}
                        </span>
                        <span className="li-s">{p.email}</span>
                      </span>
                    </span>
                  </td>
                  <td>
                    {p.isYou || p.status === "invited" ? (
                      <Badge tone="neutral">{STAFF_ROLE_LABEL[p.role]}</Badge>
                    ) : (
                      <Dropdown
                        variant="rsel"
                        id={`trole-${rowKey(p.email)}`}
                        ariaLabel={`Role for ${p.name}`}
                        value={p.role}
                        options={ROLE_OPTIONS}
                        onChange={(v) => {
                          if (isOneOf(STAFF_ROLES, v) && v !== p.role) void changeRole(p, v);
                        }}
                      />
                    )}
                  </td>
                  <td className="t-sec">{STAFF_REGION_LABEL[p.region]}</td>
                  <td className="t-sec" title={p.partners.join(", ")}>
                    {p.partners.length ? `${p.partners.length} partners` : "None"}
                  </td>
                  <td className="t-sec">{lastActive(p)}</td>
                  <td>
                    <Badge tone={p.status === "active" ? "accepted" : "pending"}>
                      {p.status === "active" ? "Active" : "Invited"}
                    </Badge>
                  </td>
                  <td className="r">
                    {p.isYou ? null : confirming === p.id ? (
                      <span className="acts">
                        <button
                          type="button"
                          className="btn btn-dd"
                          onClick={() => void remove(p)}
                          style={{ height: 26, padding: "0 8px", fontSize: 12 }}
                        >
                          Remove access
                        </button>
                        <button
                          type="button"
                          className="act"
                          onClick={() => setConfirming(null)}
                          aria-label={`Keep ${p.name}`}
                          data-tip="Cancel"
                        >
                          <Icon name="x" />
                        </button>
                      </span>
                    ) : (
                      <RowAction
                        label={`Remove access for ${p.name}`}
                        tip="Remove access"
                        icon="trash"
                        tone="no"
                        onClick={() => setConfirming(p.id)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {warned ? (
          <div className="card-b" style={{ borderTop: "1px solid #F0EFF4" }}>
            <div className="note note-amber" role="status">
              <Icon name="warn" />
              <span>
                {warned.name} still manages {warned.partners.length} partners in {STAFF_REGION_LABEL[warned.region]}.
                Those partners need a new partner manager.{" "}
                <Link href={ROUTES.admin.partners} style={{ fontWeight: 600 }}>
                  Reassign on Partners
                </Link>
              </span>
            </div>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="perm" className="card clip">
        <div className="card-h">
          <h2 id="perm" className="card-t">
            What each role can do
          </h2>
          <span className="card-meta">Partner accounts never reach this admin or the website CMS</span>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Partner manager</th>
              <th scope="col">Sales</th>
              <th scope="col">Marketing</th>
            </tr>
          </thead>
          <tbody>
            {PERMISSIONS.map(([action, ...cells]) => (
              <tr key={action}>
                <td>{action}</td>
                {cells.map((cell, i) => (
                  <td key={`${action}-${i}`} className={cell === "No" ? "t-muted" : "t-green"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <StaffInviteDrawer open={inviteOpen} onClose={closeInvite} existingEmails={people.map((p) => p.email)} />
    </div>
  );
}
```

- [ ] **Step 7: Write the staff page**

Replace `src/app/admin/team/page.tsx` in full:

```tsx
import type { Metadata } from "next";
import { AdminTeam } from "@/components/screens/AdminTeam";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listStaff } from "@/server/repo/staff";

export const metadata: Metadata = { title: "CleanStart team" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("staff.read");
  const people = await withViewer(viewer, (tx) => listStaff(tx, viewer));
  return <AdminTeam people={people} today={systemClock.today()} />;
}
```

The list already contains invited teammates, so the page does not call `listOpenInvites` as the route map lists ("Contract change requests", item 14).

- [ ] **Step 8: Prove no slice import is left**

Run: `grep -n "@/data/\|@/lib/slice\|staffSlice" src/components/screens/AdminTeam.tsx src/components/people/StaffInviteDrawer.tsx`
Expected: no output.

- [ ] **Step 9: Gate A**

Run the Gate A block. The last command must list only this task's Files block.

- [ ] **Step 10: Manual check (seed-dev data, signed in as `farhan.qureshi@cleanstart.com`, route `/admin/team`)**

1. Six people: Farhan (you), Omar Nasser, Rahul Menon, Sara Al Mansoori, Ishita Bose, and Kunal Shah as Invited ("Invite pending", a role badge). Farhan and Omar show "5 partners" each.
2. Change Rahul to Marketing: toast "Rahul Menon is now in marketing". Change Omar to Sales: toast, and the amber note "Omar Nasser still manages 5 partners in Middle East. Those partners need a new partner manager." appears with the "Reassign on Partners" link.
3. Try to demote Farhan: he is a badge, not a dropdown. Sign in as Omar's replacement scenario is not needed: with Farhan the only partner manager left (after step 2), demoting is impossible from the UI because you cannot change yourself, and calling the action for someone else when they are the last manager returns "CleanStart needs at least one partner manager."
4. Invite a teammate: "Invite teammate", name `Test Person`, email `test.person@cleanstart.com`, Sales, India: toast "Invite sent to test.person@cleanstart.com", a new Invited row. `select event, target from audit_log order by at desc limit 1` shows `staff.invited` and "Test Person, sales, India". Invite the same address again: "This person already has a login." (or "This person is already on the team." from the form before sending).
5. Remove Kunal (invited): confirm, the row disappears and the invite is withdrawn. Remove Ishita: the row disappears; `select status from users where name = 'Ishita Bose'` is `disabled`.
6. Sign in as `rahul.menon@cleanstart.com` (now Marketing): opening `/admin/team` redirects to the Documents home page (no `staff.read`).

- [ ] **Step 11: Commit**

```bash
git add apps/portal/src/server/repo/staff.ts apps/portal/src/server/repo/staff.test.ts \
  apps/portal/src/server/actions/staff.ts apps/portal/src/server/actions/staff.test.ts \
  apps/portal/src/components/screens/AdminTeam.tsx apps/portal/src/components/people/StaffInviteDrawer.tsx \
  apps/portal/src/app/admin/team/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M1.8 staff admin"
```

---

### Task M4.1: Partners list and detail

Implements master task 4.1. The Partners tab becomes real: the list with real counts (the mock's "11 other active partners" are now real rows, so the totals are computed), the detail card for the selected partner, Add partner, change category, change partner manager, suspend, restore, resend invites. Partner managers mutate; staff sales read the partners in their region. After this task `AdminPartners.tsx` no longer reads the mock slice. Reassigning a partner's manager is `setPartnerManager`; no email template exists for it, so the dialog no longer promises an email ("Contract change requests", item 9).

**Files:**
- Modify: `src/server/repo/partners.ts`, `src/server/repo/partners.test.ts`
- Modify: `src/server/actions/partners.ts`, `src/server/actions/partners.test.ts`
- Modify: `src/components/partners/badges.tsx`, `partners-table.tsx`, `partner-detail.tsx`, `partner-dialogs.tsx`, `add-partner-drawer.tsx`
- Modify: `src/components/screens/AdminPartners.tsx`, `src/app/admin/partners/page.tsx`

- [ ] **Step 1: Write the failing repo tests for list and detail**

Append to `src/server/repo/partners.test.ts`. Extend the imports: add `createPartner, getPartnerDetail, listPartners, resendPartnerInvites, restorePartner, setPartnerCategory, setPartnerManager, suspendPartner` to the `./partners` import, `invites` to the `@/db/schema` import, `hashToken` from `@/server/auth/tokens`,.

```ts
const today = new Date().toISOString().slice(0, 10);
const future = new Date('2099-01-01T00:00:00Z');

describe('listPartners', () => {
  it('lists every partner for a partner manager with the real counts and filters', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const a = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', region: 'india', category: 'channel', status: 'active' });
    const b = await makePartner(db, { name: 'Arbor Cyber', domain: 'arborcyber.ae', region: 'middle_east', category: 'integrator', status: 'onboarding' });
    await makeUser(db, { partnerId: a.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: a.id, status: 'pending' });
    await makeRegistration(db, { partnerId: a.id, status: 'accepted' });
    await makeRegistration(db, { partnerId: a.id, status: 'won', registeredOn: today, closedOn: today });
    const all = await withViewer(manager, (tx) => listPartners(tx, manager, {}));
    expect(all.map((p) => p.name)).toEqual(['Arbor Cyber', 'Kestrel Systems']);
    expect(all.find((p) => p.id === a.id)).toMatchObject({ users: 1, pending: 1, protectedCount: 1, won: 1 });
    expect((await withViewer(manager, (tx) => listPartners(tx, manager, { status: 'onboarding' }))).map((p) => p.id)).toEqual([b.id]);
    expect((await withViewer(manager, (tx) => listPartners(tx, manager, { q: 'kestrel' }))).map((p) => p.id)).toEqual([a.id]);
  });

  it('shows staff sales only the partners in their region, and refuses partner viewers', async () => {
    await makePartner(db, { region: 'india' });
    const gulf = await makePartner(db, { region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'middle_east');
    expect((await withViewer(sales, (tx) => listPartners(tx, sales, {}))).map((p) => p.id)).toEqual([gulf.id]);
    const partner = await asPartner(db, {});
    await expect(withViewer(partner, (tx) => listPartners(tx, partner, {}))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('getPartnerDetail', () => {
  it('returns profile, people with invited ones, the open invite count and the five newest deals', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    await db.update(partners).set({ website: 'kestrelsystems.in', phone: '+91 80 4718 2290', about: 'Security reseller.' }).where(eq(partners.id, partner.id));
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'vikram.sethi@kestrelsystems.in', expiresAt: future });
    for (let n = 1; n <= 6; n += 1) {
      await makeRegistration(db, { partnerId: partner.id, customerName: `Customer ${n}`, product: 'cleansight', registeredOn: `2026-11-0${n}`, status: 'rejected' });
    }
    const detail = await withViewer(manager, (tx) => getPartnerDetail(tx, manager, partner.id));
    expect(detail).toMatchObject({ name: 'Kestrel Systems', website: 'kestrelsystems.in', phone: '+91 80 4718 2290', address: null, about: 'Security reseller.', openInvites: 1 });
    expect(detail.people.map((p) => [p.name, p.status, p.role])).toEqual([['Aditi Rao', 'active', 'partner_admin'], ['Vikram Sethi', 'invited', 'sales']]);
    expect(detail.recentDeals.map((d) => d.customer)).toEqual(['Customer 6', 'Customer 5', 'Customer 4', 'Customer 3', 'Customer 2']);
    expect(detail.recentDeals[0]).toMatchObject({ product: 'cleansight', registeredOn: '2026-11-06', status: 'rejected' });
  });

  it('hides a partner outside the region of staff sales and an unknown id', async () => {
    const gulf = await makePartner(db, { region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'india');
    await expect(withViewer(sales, (tx) => getPartnerDetail(tx, sales, gulf.id))).rejects.toMatchObject({ code: 'not_found' });
    await expect(withViewer(sales, (tx) => getPartnerDetail(tx, sales, '00000000-0000-0000-0000-000000000001'))).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('createPartner', () => {
  const base = { name: 'Dunes Networks', website: 'https://www.dunesnetworks.ae', category: 'channel' as const, region: 'middle_east' as const, adminName: 'Faisal Rahman', adminEmail: 'faisal@dunesnetworks.ae', sendInvite: true };

  it('creates an onboarding partner routed to the regional manager with a partner admin invite', async () => {
    const gulf = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => createPartner(tx, manager, base, clock));
    expect(result.partner).toMatchObject({ name: 'Dunes Networks', domain: 'dunesnetworks.ae', status: 'onboarding', managerId: gulf.id, users: 1, adminName: 'Faisal' });
    expect(result.invite?.invite).toMatchObject({ role: 'partner_admin', email: 'faisal@dunesnetworks.ae', kind: 'partner' });
    const [row] = await db.select().from(invites).where(eq(invites.id, result.invite?.invite.id ?? ''));
    expect(row?.tokenHash).toBe(hashToken(result.invite?.token ?? ''));
  });

  it('records the admin invite even when it is not sent yet, but returns no token', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const result = await withViewer(manager, (tx) => createPartner(tx, manager, { ...base, sendInvite: false }, clock));
    expect(result.invite).toBeNull();
    expect(await db.select().from(invites)).toHaveLength(1);
    expect(result.partner.users).toBe(1);
  });

  it('falls back to the admin email domain, and refuses a taken domain, a login that exists and bad input', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const viaEmail = await withViewer(manager, (tx) => createPartner(tx, manager, { ...base, website: '' }, clock));
    expect(viaEmail.partner.domain).toBe('dunesnetworks.ae');
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: 'Copy' }, clock))).rejects.toMatchObject({ reason: 'domain_is_partner' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: 'Other', website: 'other.example', adminEmail: manager.email }, clock))).rejects.toMatchObject({ reason: 'already_has_login' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, name: '  ', website: 'x.example' }, clock))).rejects.toMatchObject({ code: 'validation' });
    await expect(withViewer(manager, (tx) => createPartner(tx, manager, { ...base, website: 'x.example', adminEmail: 'nope' }, clock))).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('partner mutations', () => {
  it('sets the partner manager and reports the previous one', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const farhan = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { managerId: farhan.id });
    const result = await withViewer(actor, (tx) => setPartnerManager(tx, actor, { id: partner.id, managerId: omar.id }, clock));
    expect(result).toMatchObject({ partner: { managerId: omar.id, managerName: 'Omar Nasser' }, previousManagerName: 'Farhan Qureshi' });
    const sales = await makeUser(db, { kind: 'staff', role: 'sales', region: 'india' });
    await expect(withViewer(actor, (tx) => setPartnerManager(tx, actor, { id: partner.id, managerId: sales.id }, clock))).rejects.toMatchObject({ code: 'validation' });
  });

  it('changes the category and reports the previous one', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { category: 'channel' });
    const result = await withViewer(actor, (tx) => setPartnerCategory(tx, actor, { id: partner.id, category: 'distributor' }, clock));
    expect(result).toMatchObject({ partner: { category: 'distributor' }, previousCategory: 'channel' });
  });

  it('suspends and restores, putting the earlier status back, and both are idempotent', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { status: 'onboarding' });
    const suspended = await withViewer(actor, (tx) => suspendPartner(tx, actor, { id: partner.id }, clock));
    expect(suspended).toMatchObject({ status: 'suspended', statusBeforeSuspend: 'onboarding' });
    expect((await withViewer(actor, (tx) => suspendPartner(tx, actor, { id: partner.id }, clock))).statusBeforeSuspend).toBe('onboarding');
    const restored = await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock));
    expect(restored).toMatchObject({ status: 'onboarding', statusBeforeSuspend: null });
    expect((await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock))).status).toBe('onboarding');
  });

  it('restores to active when no earlier status was recorded', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { status: 'suspended' });
    expect((await withViewer(actor, (tx) => restorePartner(tx, actor, { id: partner.id }, clock))).status).toBe('active');
  });

  it('is not allowed for partner viewers', async () => {
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => suspendPartner(tx, viewer, { id: partner.id }, clock))).rejects.toMatchObject({ code: 'forbidden' });
    await expect(withViewer(viewer, (tx) => setPartnerCategory(tx, viewer, { id: partner.id, category: 'distributor' }, clock))).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('resendPartnerInvites', () => {
  it('rotates every open invite of the partner and returns the new tokens once', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, { name: 'Qamar Solutions' });
    const first = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'yasmin.haddad@qamarsolutions.ae', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid.omar@qamarsolutions.ae', expiresAt: future });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'done@qamarsolutions.ae', expiresAt: future, acceptedAt: new Date('2026-11-01T00:00:00Z') });
    const result = await withViewer(actor, (tx) => resendPartnerInvites(tx, actor, { id: partner.id }, clock));
    expect(result.partner.name).toBe('Qamar Solutions');
    expect(result.invites.map((i) => [i.invite.email, i.inviteeName]).sort()).toEqual([['yasmin.haddad@qamarsolutions.ae', 'Yasmin Haddad'], ['zaid.omar@qamarsolutions.ae', 'Zaid Omar']]);
    const rotated = result.invites.find((i) => i.invite.id === first.invite.id);
    expect(rotated?.token).not.toBe(first.token);
    expect(rotated?.invite.resentCount).toBe(1);
  });

  it('returns nothing when everyone has accepted', async () => {
    const actor = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    expect((await withViewer(actor, (tx) => resendPartnerInvites(tx, actor, { id: partner.id }, clock))).invites).toEqual([]);
  });
});
```

The admin is only an invite until they accept, so `adminName` is derived from the email (`faisal@dunesnetworks.ae` gives "Faisal"). Run:

`pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts`
Expected: FAIL, the new functions are not exported by `./partners`.

- [ ] **Step 2: Implement the list, detail and mutation functions**

In `src/server/repo/partners.ts` extend the imports:

```ts
import { and, asc, desc, eq, isNull, ne } from 'drizzle-orm';
import { invites, partnerChecklist, partners, registrations, staffScopes, users } from '@/db/schema';
import type {
  PartnerCategory, PartnerRegion, PartnerStatus, StaffRegion,
} from '@/lib/domain';
import type { ChecklistDto, CompanyDto, CreatedInviteDto, IsoTimestamp, PartnerDetailDto, PartnerListRow } from '@/lib/dto';
import { emailDomain, isPlausibleDomain, isValidEmail, nameFromEmail, normaliseDomain, staffTeamLabel } from '@/lib/people';
import { issueInvite, rotateInviteToken } from '@/server/invite-core';
import { loadPartnerPeople } from '@/server/partner-people';
import { assertActiveManager, insertOnboardingPartner, pickManagerId } from '@/server/partner-routing';
import { partnerListRows } from '@/server/partner-rows';
import { assertStaff, type Tx } from './context';
```

(merging with the existing imports; keep what is already imported). Add the interfaces and functions below the existing ones:

```ts
export interface ListPartnersInput {
  q?: string;
  status?: PartnerStatus;
  category?: PartnerCategory;
  region?: PartnerRegion;
}

export interface NewPartnerInput {
  name: string;
  website: string;
  category: PartnerCategory;
  region: PartnerRegion;
  adminName: string;
  adminEmail: string;
  sendInvite: boolean;
}

/** Staff sales only see partners in their own region; partner managers see all. */
const regionScope = (viewer: Viewer): StaffRegion | undefined =>
  viewer.kind === 'staff' && viewer.role === 'sales' ? viewer.region : undefined;

const rowFor = async (tx: Tx, id: string): Promise<PartnerListRow> => {
  const [row] = await partnerListRows(tx, { ids: [id] });
  if (!row) throw new NotFoundError('partner');
  return row;
};

const lockPartner = async (tx: Tx, id: string) => {
  const [row] = await tx.select().from(partners).where(eq(partners.id, id)).limit(1).for('update');
  if (!row) throw new NotFoundError('partner');
  return row;
};

/** Staff. Staff sales: only partners in their region. */
export async function listPartners(tx: Tx, viewer: Viewer, input: ListPartnersInput): Promise<PartnerListRow[]> {
  assertStaff(viewer);
  const scope = regionScope(viewer);
  return partnerListRows(tx, {
    ...(input.q ? { q: input.q } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.region ? { region: input.region } : {}),
    ...(scope ? { scopeRegion: scope } : {}),
  });
}

export async function getPartnerDetail(tx: Tx, viewer: Viewer, id: string): Promise<PartnerDetailDto> {
  assertStaff(viewer);
  const scope = regionScope(viewer);
  const [row] = await partnerListRows(tx, { ids: [id], ...(scope ? { scopeRegion: scope } : {}) });
  const [partner] = await tx.select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!row || !partner) throw new NotFoundError('partner');
  const people = await loadPartnerPeople(tx, partner.id);
  const deals = await tx
    .select({ id: registrations.id, customer: registrations.customerName, product: registrations.product, registeredOn: registrations.registeredOn, status: registrations.status })
    .from(registrations)
    .where(eq(registrations.partnerId, partner.id))
    .orderBy(desc(registrations.registeredOn), desc(registrations.createdAt))
    .limit(5);
  return {
    ...row,
    website: partner.website,
    phone: partner.phone,
    address: partner.address,
    about: partner.about,
    people: people.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: p.status,
      lastActiveAt: iso(p.lastLoginAt),
      invitedAt: iso(p.invitedAt),
    })),
    openInvites: people.filter((p) => p.status === 'invited').length,
    recentDeals: deals.map((d) => ({ registrationId: d.id, customer: d.customer, product: d.product, registeredOn: d.registeredOn, status: d.status })),
  };
}

/**
 * Partner manager (M4.1, "Add partner"). Creates the partner (status 'onboarding', manager routed by region) and the
 * partner_admin invite. Throws ConflictError('domain_is_partner') and ConflictError('already_has_login'). The invite
 * row is always created so the admin's email is recorded; `invite` (with its one time token) is returned only when
 * sendInvite is true, otherwise Resend invites sends it later.
 */
export async function createPartner(
  tx: Tx,
  viewer: Viewer,
  input: NewPartnerInput,
  clock: Clock,
): Promise<{ partner: PartnerListRow; invite: CreatedInviteDto | null }> {
  assertStaff(viewer);
  const issues = [
    ...(input.name.trim() ? [] : [{ path: 'name', message: 'Enter the company name.' }]),
    ...(isValidEmail(input.adminEmail) ? [] : [{ path: 'adminEmail', message: 'Enter a valid work email.' }]),
  ];
  const site = normaliseDomain(input.website);
  const domain = isPlausibleDomain(site) ? site : emailDomain(input.adminEmail);
  if (!isPlausibleDomain(domain)) issues.push({ path: 'website', message: 'Enter the company website.' });
  if (issues.length > 0) throw new ValidationError(issues);

  const managerId = await pickManagerId(tx, input.region);
  const partner = await insertOnboardingPartner(tx, {
    name: input.name.trim(),
    domain,
    category: input.category,
    region: input.region,
    managerId,
  });
  const invite = await issueInvite(
    tx,
    { kind: 'partner', partnerId: partner.id, email: input.adminEmail, role: 'partner_admin', staffRegion: null, invitedBy: viewer.id },
    clock,
  );
  return { partner: await rowFor(tx, partner.id), invite: input.sendInvite ? invite : null };
}

export async function setPartnerManager(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; managerId: string },
  _clock: Clock,
): Promise<{ partner: PartnerListRow; previousManagerName: string | null }> {
  assertStaff(viewer);
  await assertActiveManager(tx, input.managerId);
  const current = await lockPartner(tx, input.id);
  const before = await rowFor(tx, current.id);
  if (current.managerId !== input.managerId) {
    await tx.update(partners).set({ managerId: input.managerId }).where(eq(partners.id, current.id));
  }
  return { partner: await rowFor(tx, current.id), previousManagerName: before.managerName };
}

export async function setPartnerCategory(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; category: PartnerCategory },
  _clock: Clock,
): Promise<{ partner: PartnerListRow; previousCategory: PartnerCategory }> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.category !== input.category) {
    await tx.update(partners).set({ category: input.category }).where(eq(partners.id, current.id));
  }
  return { partner: await rowFor(tx, current.id), previousCategory: current.category };
}

/**
 * Sets status 'suspended' and status_before_suspend (M4.1). Idempotent. The people lose access at once because
 * getViewer() returns null for a suspended partner; deleting their Better Auth sessions is the action's job after
 * commit (auth_session is system-only under RLS).
 */
export async function suspendPartner(tx: Tx, viewer: Viewer, input: { id: string }, _clock: Clock): Promise<PartnerListRow> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.status !== 'suspended') {
    await tx.update(partners).set({ status: 'suspended', statusBeforeSuspend: current.status }).where(eq(partners.id, current.id));
  }
  return rowFor(tx, current.id);
}

/** Puts status_before_suspend back (default 'active'). Idempotent. */
export async function restorePartner(tx: Tx, viewer: Viewer, input: { id: string }, _clock: Clock): Promise<PartnerListRow> {
  assertStaff(viewer);
  const current = await lockPartner(tx, input.id);
  if (current.status === 'suspended') {
    await tx.update(partners).set({ status: current.statusBeforeSuspend ?? 'active', statusBeforeSuspend: null }).where(eq(partners.id, current.id));
  }
  return rowFor(tx, current.id);
}

/** Partner manager. Returns the invites it re-sent (token included, once) so the action can email them. */
export async function resendPartnerInvites(
  tx: Tx,
  viewer: Viewer,
  input: { id: string },
  clock: Clock,
): Promise<{ partner: PartnerListRow; invites: Array<CreatedInviteDto & { inviteeName: string | null }> }> {
  assertStaff(viewer);
  const partner = await lockPartner(tx, input.id);
  const open = await tx
    .select()
    .from(invites)
    .where(and(eq(invites.partnerId, partner.id), eq(invites.kind, 'partner'), isNull(invites.acceptedAt), isNull(invites.revokedAt)))
    .orderBy(asc(invites.createdAt));
  const resent: Array<CreatedInviteDto & { inviteeName: string | null }> = [];
  for (const invite of open) {
    const rotated = await rotateInviteToken(tx, invite.id, clock);
    if (!rotated) continue;
    const [known] = await tx.select({ name: users.name }).from(users).where(eq(users.email, invite.email)).limit(1);
    resent.push({ ...rotated, inviteeName: known?.name ?? nameFromEmail(invite.email) });
  }
  return { partner: await rowFor(tx, partner.id), invites: resent };
}
```

Add `ValidationError` to the `@/server/errors` import (it already imports `ForbiddenError, NotFoundError, ValidationError`). Replace the `isolation` block with:

```ts
export const isolation = defineIsolation<
  | 'getCompany' | 'getChecklist' | 'tickChecklistStep' | 'listPartnerAdminRecipients' | 'updateCompanyProfile'
  | 'listPartners' | 'getPartnerDetail' | 'createPartner' | 'setPartnerManager' | 'setPartnerCategory'
  | 'suspendPartner' | 'restorePartner' | 'resendPartnerInvites'
>({
  getCompany: { scope: 'tenant', probe: (tx, viewer, ctx) => getCompany(tx, viewer, { partnerId: ctx.b.partnerId }), expect: 'not_found' },
  getChecklist: { scope: 'tenant', probe: (tx, viewer) => getChecklist(tx, viewer), expect: 'unchanged' },
  tickChecklistStep: { scope: 'tenant', probe: (tx, viewer) => tickChecklistStep(tx, viewer, { step: 'kickoff' }, systemClock), expect: 'unchanged' },
  listPartnerAdminRecipients: { scope: 'tenant', probe: (tx, _viewer, ctx) => listPartnerAdminRecipients(tx, { partnerId: ctx.b.partnerId }), expect: 'empty' },
  updateCompanyProfile: {
    scope: 'tenant',
    probe: (tx, viewer, ctx) => updateCompanyProfile(tx, viewer, { partnerId: ctx.b.partnerId, website: 'probe.example', phone: null, address: null, about: null }),
    expect: 'not_found',
    untouched: (ctx) => [{ table: 'partners', id: ctx.b.partnerId }],
  },
  listPartners: { scope: 'staff-only', probe: (tx, viewer) => listPartners(tx, viewer, {}), expect: 'forbidden' },
  getPartnerDetail: { scope: 'staff-only', probe: (tx, viewer, ctx) => getPartnerDetail(tx, viewer, ctx.b.partnerId), expect: 'forbidden' },
  createPartner: {
    scope: 'staff-only',
    probe: (tx, viewer) => createPartner(tx, viewer, { name: 'Probe', website: 'probe.example', category: 'channel', region: 'india', adminName: 'P', adminEmail: 'p@probe.example', sendInvite: false }, systemClock),
    expect: 'forbidden',
  },
  setPartnerManager: { scope: 'staff-only', probe: (tx, viewer, ctx) => setPartnerManager(tx, viewer, { id: ctx.b.partnerId, managerId: ctx.staffUserId }, systemClock), expect: 'forbidden' },
  setPartnerCategory: { scope: 'staff-only', probe: (tx, viewer, ctx) => setPartnerCategory(tx, viewer, { id: ctx.b.partnerId, category: 'distributor' }, systemClock), expect: 'forbidden' },
  suspendPartner: { scope: 'staff-only', probe: (tx, viewer, ctx) => suspendPartner(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
  restorePartner: { scope: 'staff-only', probe: (tx, viewer, ctx) => restorePartner(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
  resendPartnerInvites: { scope: 'staff-only', probe: (tx, viewer, ctx) => resendPartnerInvites(tx, viewer, { id: ctx.b.partnerId }, systemClock), expect: 'forbidden' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/partners.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (partners: 25 tests; isolation passes).

- [ ] **Step 3: Write the failing action tests**

Append to `src/server/actions/partners.test.ts`. Extend the imports: from `@/db/schema` add `invites`; from `@/db/test-helpers` add `makeInvite`; add `revokeAllSessions` mocking by adding this line next to the other `vi.mock` calls (it is hoisted): `vi.mock('@/server/auth/sessions', () => ({ revokeAllSessions: vi.fn(async () => undefined) }));` and `import { revokeAllSessions } from '@/server/auth/sessions';` after them; add `createPartnerAction, resendPartnerInvitesAction, restorePartnerAction, setPartnerCategoryAction, setPartnerManagerAction, suspendPartnerAction` to the `./partners` import. In `beforeEach` add `vi.mocked(revokeAllSessions).mockClear();`.

```ts
describe('partner management actions', () => {
  const manager = () => asStaff(db, 'partner_manager', 'india');
  const newPartner = { name: 'Dunes Networks', website: 'dunesnetworks.ae', category: 'channel', region: 'middle_east', adminName: 'Faisal Rahman', adminEmail: 'faisal@dunesnetworks.ae', sendInvite: true };

  it('adds a partner: audit, partner.upsert version 1, and an invite email addressed to the admin', async () => {
    harness.viewer = await manager();
    const result = await createPartnerAction(newPartner);
    expect(result).toMatchObject({ ok: true, data: { name: 'Dunes Networks', status: 'onboarding', users: 1 } });
    expect(JSON.stringify(result)).not.toContain('token');
    const created = result.ok ? result.data : null;
    expect((await db.select().from(auditLog)).map((a) => a.event)).toEqual(['partner.created']);
    expect((await db.select().from(hubspotOutbox))[0]).toMatchObject({ op: 'partner.upsert', subjectId: created?.id, idempotencyKey: `partner.upsert:${created?.id}:1` });
    const mail = fake.only('faisal@dunesnetworks.ae');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=/u);
  });

  it('adds a partner without sending the invite', async () => {
    harness.viewer = await manager();
    expect(await createPartnerAction({ ...newPartner, sendInvite: false })).toMatchObject({ ok: true });
    expect(fake.sent).toHaveLength(0);
    expect(await db.select().from(invites)).toHaveLength(1);
  });

  it('is for partner managers only and reports a domain conflict', async () => {
    harness.viewer = await asStaff(db, 'sales', 'india');
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await asPartner(db, { role: 'partner_admin' });
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    harness.viewer = await manager();
    await makePartner(db, { domain: 'dunesnetworks.ae' });
    expect(await createPartnerAction(newPartner)).toMatchObject({ ok: false, error: { code: 'conflict', message: 'Another partner already uses this domain.' } });
  });

  it('changes manager and category with audit notes and a fresh outbox key each time', async () => {
    harness.viewer = await manager();
    const farhan = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india', name: 'Farhan Qureshi' });
    const omar = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'middle_east', name: 'Omar Nasser' });
    const partner = await makePartner(db, { name: 'Arbor Cyber', managerId: farhan.id, category: 'integrator' });
    expect(await setPartnerManagerAction({ id: partner.id, managerId: omar.id })).toMatchObject({ ok: true, data: { managerName: 'Omar Nasser' } });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await setPartnerCategoryAction({ id: partner.id, category: 'distributor' })).toMatchObject({ ok: true, data: { category: 'distributor' } });
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note]).sort()).toEqual([
      ['partner.category_changed', 'System integrator to Distributor'],
      ['partner.manager_changed', 'Farhan Qureshi to Omar Nasser'],
    ]);
    const keys = (await db.select().from(hubspotOutbox)).map((o) => o.idempotencyKey);
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  it('does not audit or queue anything when nothing changes', async () => {
    harness.viewer = await manager();
    const farhan = await makeUser(db, { kind: 'staff', role: 'partner_manager', region: 'india' });
    const partner = await makePartner(db, { managerId: farhan.id, category: 'channel' });
    await setPartnerManagerAction({ id: partner.id, managerId: farhan.id });
    await setPartnerCategoryAction({ id: partner.id, category: 'channel' });
    expect(await db.select().from(auditLog)).toHaveLength(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('suspends: audit, outbox, and every person of the partner is signed out; restore audits too', async () => {
    harness.viewer = await manager();
    const partner = await makePartner(db, { name: 'Ironleaf', status: 'active' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    expect(await suspendPartnerAction({ id: partner.id })).toMatchObject({ ok: true, data: { status: 'suspended' } });
    expect(vi.mocked(revokeAllSessions).mock.calls.map((c) => c[0]).sort()).toEqual([admin.id, sales.id].sort());
    await suspendPartnerAction({ id: partner.id });
    expect(await restorePartnerAction({ id: partner.id })).toMatchObject({ ok: true, data: { status: 'active' } });
    expect((await db.select().from(auditLog)).map((a) => a.event).sort()).toEqual(['partner.restored', 'partner.suspended']);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(2);
  });

  it('resends every open invite, emails each, audits once, and says when nobody is left', async () => {
    harness.viewer = await manager();
    const partner = await makePartner(db, { name: 'Qamar Solutions' });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'yasmin.haddad@qamarsolutions.ae', expiresAt: new Date('2099-01-01T00:00:00Z') });
    await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'sales', email: 'zaid.omar@qamarsolutions.ae', expiresAt: new Date('2099-01-01T00:00:00Z') });
    expect(await resendPartnerInvitesAction({ id: partner.id })).toEqual({ ok: true, data: { count: 2 } });
    expect(fake.to('yasmin.haddad@qamarsolutions.ae')).toHaveLength(1);
    expect(fake.to('zaid.omar@qamarsolutions.ae')).toHaveLength(1);
    expect((await db.select().from(auditLog)).map((a) => [a.event, a.note])).toEqual([['team.invite_resent', '2 people']]);
    const empty = await makePartner(db, {});
    expect(await resendPartnerInvitesAction({ id: empty.id })).toEqual({ ok: true, data: { count: 0 } });
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: FAIL, `createPartnerAction` is not a function.

- [ ] **Step 4: Implement the partner management actions**

In `src/server/actions/partners.ts` extend the imports:

```ts
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
  PARTNER_ROLE_LABEL,
} from '@/lib/domain';
import type { ChecklistDto, CompanyDto, PartnerListRow } from '@/lib/dto';
import { revokeAllSessions } from '@/server/auth/sessions';
import { buildManagerMessage, buildTeamInvite } from '@/server/email/templates';
import {
  createPartner,
  getCompany,
  getPartnerDetail,
  resendPartnerInvites,
  restorePartner,
  setPartnerCategory,
  setPartnerManager,
  suspendPartner,
  tickChecklistStep,
  updateCompanyProfile,
} from '@/server/repo/partners';
import { inviteUrl } from '@/server/urls';
```

(merging with the existing imports). Add the schemas near the top:

```ts
const newPartnerSchema = z.object({
  name: z.string().trim().min(1, 'Enter the company name.').max(200),
  website: z.string().trim().max(200),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
  adminName: z.string().trim().max(120),
  adminEmail: z.string().trim().max(254),
  sendInvite: z.boolean(),
});
const partnerIdSchema = z.object({ id: z.string().uuid() });
const managerSchema = z.object({ id: z.string().uuid(), managerId: z.string().uuid() });
const categorySchema = z.object({ id: z.string().uuid(), category: z.enum(PARTNER_CATEGORIES) });
```

Append the actions. `PartnerListRow` has no `updatedAt`, so the outbox version for edits is the action time in milliseconds (a new key per edit; "Contract change requests", item 6):

```ts
const editVersion = (now: Date): string => String(now.getTime());

export async function createPartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.create', schema: newPartnerSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.create');
    const created = await withViewer(ctx.viewer, async (tx) => {
      const result = await createPartner(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'partner.created',
        target: result.partner.name,
        note: `${PARTNER_CATEGORY_LABEL[input.category]}, ${PARTNER_REGION_LABEL[input.region]}. Partner admin ${input.adminName || input.adminEmail}${result.invite ? '. Invite sent.' : '. Invite not sent yet.'}`,
        partnerId: result.partner.id,
        subject: { type: 'partner', id: result.partner.id },
      });
      await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: '1' });
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    const invite = created.invite;
    if (invite) {
      ctx.afterCommit(async () => {
        await sendEmail(
          buildTeamInvite({
            to: { email: invite.invite.email, ...(input.adminName ? { name: input.adminName } : {}) },
            inviteeName: input.adminName || null,
            inviterName: ctx.viewer.name,
            audience: 'partner',
            companyName: created.partner.name,
            roleLabel: PARTNER_ROLE_LABEL.partner_admin,
            inviteUrl: inviteUrl(invite.token),
            expiresOn: invite.invite.expiresAt.slice(0, 10),
          }),
        );
      });
    }
    return created.partner;
  });
}

export async function setPartnerManagerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.change_manager', schema: managerSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.change_manager');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerManager(tx, ctx.viewer, input, ctx.clock);
      if (result.previousManagerName !== result.partner.managerName) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.manager_changed',
          target: result.partner.name,
          note: `${result.previousManagerName ?? 'Nobody'} to ${result.partner.managerName ?? 'Nobody'}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: editVersion(ctx.clock.now()) });
      }
      return result.partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.revalidate(ROUTES.partner.company);
    return changed;
  });
}

export async function setPartnerCategoryAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.change_category', schema: categorySchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.change_category');
    const changed = await withViewer(ctx.viewer, async (tx) => {
      const result = await setPartnerCategory(tx, ctx.viewer, input, ctx.clock);
      if (result.previousCategory !== result.partner.category) {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.category_changed',
          target: result.partner.name,
          note: `${PARTNER_CATEGORY_LABEL[result.previousCategory]} to ${PARTNER_CATEGORY_LABEL[result.partner.category]}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: result.partner.id, version: editVersion(ctx.clock.now()) });
      }
      return result.partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.revalidate(ROUTES.partner.company);
    return changed;
  });
}

export async function suspendPartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.suspend', schema: partnerIdSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.suspend');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const before = await getPartnerDetail(tx, ctx.viewer, input.id);
      const partner = await suspendPartner(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (before.status !== 'suspended') {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.suspended',
          target: partner.name,
          partnerId: partner.id,
          subject: { type: 'partner', id: partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: editVersion(ctx.clock.now()) });
      }
      return { partner, personIds: before.people.map((p) => p.id), changed: before.status !== 'suspended' };
    });
    ctx.revalidate(ROUTES.admin.partners);
    // auth_session is system-only under RLS, so the sessions go here, after commit. An invite-only row has none.
    if (done.changed) {
      ctx.afterCommit(async () => {
        for (const id of done.personIds) await revokeAllSessions(id);
      });
    }
    return done.partner;
  });
}

export async function restorePartnerAction(raw: unknown): Promise<ActionResult<PartnerListRow>> {
  return runViewerAction({ name: 'partner.restore', schema: partnerIdSchema }, raw, async (ctx, input): Promise<PartnerListRow> => {
    assertCan(ctx.viewer, 'partner.restore');
    const restored = await withViewer(ctx.viewer, async (tx) => {
      const before = await getPartnerDetail(tx, ctx.viewer, input.id);
      const partner = await restorePartner(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (before.status === 'suspended') {
        await recordAudit(tx, ctx.viewer, {
          event: 'partner.restored',
          target: partner.name,
          partnerId: partner.id,
          subject: { type: 'partner', id: partner.id },
        });
        await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: editVersion(ctx.clock.now()) });
      }
      return partner;
    });
    ctx.revalidate(ROUTES.admin.partners);
    return restored;
  });
}

export async function resendPartnerInvitesAction(raw: unknown): Promise<ActionResult<{ count: number }>> {
  return runViewerAction({ name: 'partner.resend_invites', schema: partnerIdSchema }, raw, async (ctx, input): Promise<{ count: number }> => {
    assertCan(ctx.viewer, 'partner.resend_invites');
    const done = await withViewer(ctx.viewer, async (tx) => {
      const result = await resendPartnerInvites(tx, ctx.viewer, { id: input.id }, ctx.clock);
      if (result.invites.length > 0) {
        await recordAudit(tx, ctx.viewer, {
          event: 'team.invite_resent',
          target: result.partner.name,
          note: `${result.invites.length} ${result.invites.length === 1 ? 'person' : 'people'}`,
          partnerId: result.partner.id,
          subject: { type: 'partner', id: result.partner.id },
        });
      }
      return result;
    });
    ctx.revalidate(ROUTES.admin.partners);
    ctx.afterCommit(async () => {
      for (const item of done.invites) {
        await sendEmail(
          buildTeamInvite({
            to: { email: item.invite.email, ...(item.inviteeName ? { name: item.inviteeName } : {}) },
            inviteeName: item.inviteeName,
            inviterName: ctx.viewer.name,
            audience: 'partner',
            companyName: done.partner.name,
            roleLabel: PARTNER_ROLE_LABEL[item.invite.role as keyof typeof PARTNER_ROLE_LABEL],
            inviteUrl: inviteUrl(item.token),
            expiresOn: item.invite.expiresAt.slice(0, 10),
          }),
        );
      }
    });
    return { count: done.invites.length };
  });
}
```

The templates import is one line: `import { buildManagerMessage, buildTeamInvite } from '@/server/email/templates';` (`buildManagerMessage` was already imported for `sendManagerMessageAction`).

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/partners.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Replace `badges.tsx`**

Replace `src/components/partners/badges.tsx` in full. All four components now take the stored codes (the label lookups moved in; the M1.4 wrapper names stay, and `CategoryBadge` and `StatusBadge` are gone because nothing uses them after this task):

```tsx
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icon-paths";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import {
  PARTNER_CATEGORY_LABEL,
  PARTNER_STATUS_LABEL,
  type PartnerCategory,
  type PartnerStatus,
  type Product,
  REGISTRATION_STATUS_LABEL,
  type RegistrationStatus,
} from "@/lib/domain";

const CATEGORY_TONE: Record<PartnerCategory, BadgeTone> = {
  distributor: "violet",
  channel: "blue",
  integrator: "cyan",
};

const STATUS_TONE: Record<PartnerStatus, BadgeTone> = {
  active: "accepted",
  onboarding: "pending",
  inactive: "expired",
  suspended: "rejected",
};

const DEAL_TONE: Record<RegistrationStatus, BadgeTone> = {
  pending: "pending",
  accepted: "accepted",
  won: "won",
  lost: "lost",
  rejected: "rejected",
  expired: "expired",
};

const PRODUCT_MARK: Record<Product, { cls: string; icon: IconName }> = {
  images: { cls: "pm-img", icon: "img" },
  libraries: { cls: "pm-lib", icon: "lib" },
  cleansight: { cls: "pm-sight", icon: "sight" },
};

export function PartnerCategoryBadge({ category }: { category: PartnerCategory }): React.JSX.Element {
  return <Badge tone={CATEGORY_TONE[category]}>{PARTNER_CATEGORY_LABEL[category]}</Badge>;
}

export function PartnerStatusBadge({ status }: { status: PartnerStatus }): React.JSX.Element {
  return <Badge tone={STATUS_TONE[status]}>{PARTNER_STATUS_LABEL[status]}</Badge>;
}

export function DealStatusBadge({ status }: { status: RegistrationStatus }): React.JSX.Element {
  return <Badge tone={DEAL_TONE[status]}>{REGISTRATION_STATUS_LABEL[status]}</Badge>;
}

export function ProductMark({ product }: { product: Product }): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  return (
    <span className={`pm ${mark.cls}`}>
      <Icon name={mark.icon} />
    </span>
  );
}
```

- [ ] **Step 6: Replace `partners-table.tsx`**

Replace `src/components/partners/partners-table.tsx` in full:

```tsx
"use client";

import { Avatar } from "@/components/ui/badge";
import { Dropdown } from "@/components/ui/dropdown";
import { PARTNER_REGION_LABEL, type PartnerCategory } from "@/lib/domain";
import type { PartnerListRow } from "@/lib/dto";
import { initialsOf, lastSeenLabel } from "@/lib/people";
import { PartnerCategoryBadge, PartnerStatusBadge } from "./badges";
import { Seg } from "./seg";

export const CATEGORY_FILTERS = ["All", "Distributors", "Channel", "SIs"] as const;
export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];
export const REGION_FILTERS = ["All regions", "India", "Middle East"] as const;
export const STATUS_FILTERS = ["Any status", "Active", "Onboarding", "Inactive", "Suspended"] as const;

export const CATEGORY_FOR_FILTER: Record<CategoryFilter, PartnerCategory | null> = {
  All: null,
  Distributors: "distributor",
  Channel: "channel",
  SIs: "integrator",
};

interface PartnersTableProps {
  partners: readonly PartnerListRow[];
  total: number;
  selectedId: string;
  today: string;
  category: CategoryFilter;
  region: string;
  status: string;
  onCategory: (value: CategoryFilter) => void;
  onRegion: (value: string) => void;
  onStatus: (value: string) => void;
  onSelect: (id: string) => void;
}

export function PartnersTable({
  partners,
  total,
  selectedId,
  today,
  category,
  region,
  status,
  onCategory,
  onRegion,
  onStatus,
  onSelect,
}: PartnersTableProps): React.JSX.Element {
  return (
    <>
      <div className="toolbar">
        <div className="filters">
          <Seg options={CATEGORY_FILTERS} value={category} onChange={onCategory} ariaLabel="Category" compact />
          <Dropdown value={region} options={REGION_FILTERS} onChange={onRegion} ariaLabel="Region" />
          <Dropdown value={status} options={STATUS_FILTERS} onChange={onStatus} ariaLabel="Status" />
        </div>
        <span className="card-meta tnum">
          Showing {partners.length} of {total}
        </span>
      </div>
      <div style={{ overflowX: "auto" }} data-tour="partners-table">
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">Partner</th>
              <th scope="col">Category</th>
              <th scope="col">Region</th>
              <th scope="col">Status</th>
              <th scope="col" className="r">
                Pending
              </th>
              <th scope="col" className="r">
                Protected
              </th>
              <th scope="col" className="r">
                Won YTD
              </th>
              <th scope="col" className="r">
                Last active
              </th>
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => (
              <tr key={p.id} style={p.id === selectedId ? { background: "#F7F5FE" } : undefined}>
                <td>
                  <button
                    type="button"
                    className="cust"
                    onClick={() => onSelect(p.id)}
                    aria-pressed={p.id === selectedId}
                    style={{ background: "none", border: 0, padding: 0, font: "inherit", cursor: "pointer" }}
                  >
                    <Avatar initials={initialsOf(p.name)} />
                    <span className="li-t" style={{ textAlign: "left" }}>
                      <span className="li-n" style={{ fontSize: 13 }}>
                        {p.name}
                      </span>
                      <span className="li-s">{p.domain}</span>
                    </span>
                  </button>
                </td>
                <td>
                  <PartnerCategoryBadge category={p.category} />
                </td>
                <td className="t-sec">{PARTNER_REGION_LABEL[p.region]}</td>
                <td>
                  <PartnerStatusBadge status={p.status} />
                </td>
                <td className="tnum r">{p.pending}</td>
                <td className="tnum r">{p.protectedCount}</td>
                <td className="tnum r">{p.won}</td>
                <td className="tnum r t-sec">{lastSeenLabel(p.lastActiveAt, today)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {partners.length === 0 ? <div className="empty">No partners match these filters.</div> : null}
      </div>
    </>
  );
}
```

- [ ] **Step 7: Replace `partner-detail.tsx`**

Replace `src/components/partners/partner-detail.tsx` in full:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/badge";
import { fmtShort, fmtLong } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_ROLE_LABEL, PRODUCT_LABEL } from "@/lib/domain";
import type { PartnerDetailDto } from "@/lib/dto";
import { formatAgreement, initialsOf, invitedLabel, lastSeenLabel } from "@/lib/people";
import { ROUTES } from "@/lib/routes";
import { DealStatusBadge, PartnerStatusBadge, ProductMark } from "./badges";

interface PartnerDetailProps {
  partner: PartnerDetailDto;
  today: string;
  /** Partner managers change things; staff sales only read. */
  canManage: boolean;
  onChangeManager: () => void;
  onChangeCategory: () => void;
  onResendInvites: () => void;
  onSuspend: () => void;
  onRestore: () => void;
}

const SMALL_BTN: React.CSSProperties = { height: 26, padding: "0 8px", fontSize: 12 };

export function PartnerDetail({
  partner: p,
  today,
  canManage,
  onChangeManager,
  onChangeCategory,
  onResendInvites,
  onSuspend,
  onRestore,
}: PartnerDetailProps): React.JSX.Element {
  const [confirming, setConfirming] = useState(false);
  const suspended = p.status === "suspended";

  return (
    <aside
      aria-label="Selected partner"
      style={{
        flex: "1 1 100%",
        minWidth: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 12,
        alignItems: "start",
      }}
    >
      <section className="card clip">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12 }}>
          <span className="av av-1" style={{ width: 36, height: 36, borderRadius: 9, fontSize: 13 }}>
            {initialsOf(p.name)}
          </span>
          <span className="li-t">
            <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
            <span className="li-s">{p.domain}</span>
          </span>
          <PartnerStatusBadge status={p.status} />
        </div>
        <hr className="hr" />
        <dl className="dl card-b" style={{ gridTemplateColumns: "110px minmax(0, 1fr)" }}>
          <dt>Category</dt>
          <dd>{PARTNER_CATEGORY_LABEL[p.category]}</dd>
          <dt>Region</dt>
          <dd>{PARTNER_REGION_LABEL[p.region]}</dd>
          <dt>Partner since</dt>
          <dd>{fmtLong(p.since)}</dd>
          <dt>Agreement</dt>
          <dd>{formatAgreement(p.agreementVersion, p.agreementAcceptedAt)}</dd>
          <dt>Partner manager</dt>
          <dd style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {p.managerName ?? "Not assigned"}
            {canManage ? (
              <button type="button" className="btn btn-t" onClick={onChangeManager} style={{ height: 22, padding: "0 6px" }}>
                Change
              </button>
            ) : null}
          </dd>
          <dt>Partner admin</dt>
          <dd>{p.adminName ?? "Not invited yet"}</dd>
          <dt>HubSpot company</dt>
          <dd className="tnum">{p.hubspotCompanyId ?? "Not created yet"}</dd>
        </dl>
        <div className="kpis" style={{ borderTop: "1px solid #F0EFF4", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
          {(
            [
              ["Users", p.users],
              ["Pending", p.pending],
              ["Protected", p.protectedCount],
              ["Won", p.won],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="kpi" style={{ padding: "8px 10px" }}>
              <span className="kpi-l">{label}</span>
              <span className="kpi-v" style={{ fontSize: 16 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
        {canManage ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              padding: "10px 12px",
              borderTop: "1px solid #F0EFF4",
              background: "#FCFCFD",
            }}
          >
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onChangeCategory}>
              Change category
            </button>
            <button type="button" className="btn btn-s" style={SMALL_BTN} onClick={onResendInvites}>
              Resend invites
            </button>
            {!suspended && !confirming ? (
              <button
                type="button"
                className="btn btn-d"
                style={{ ...SMALL_BTN, marginLeft: "auto" }}
                onClick={() => setConfirming(true)}
              >
                Suspend
              </button>
            ) : null}
            {!suspended && confirming ? (
              <div style={{ flexBasis: "100%", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                <span className="confirm" style={{ flex: "1 1 100%" }}>
                  Suspend {p.name}? Its {p.users} {p.users === 1 ? "user loses" : "users lose"} access at once. Deals
                  stay in HubSpot.
                </span>
                <button
                  type="button"
                  className="btn btn-dd"
                  style={SMALL_BTN}
                  onClick={() => {
                    setConfirming(false);
                    onSuspend();
                  }}
                >
                  Suspend access
                </button>
                <button type="button" className="btn btn-g" style={{ ...SMALL_BTN, padding: "0 6px" }} onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            ) : null}
            {suspended ? (
              <button type="button" className="btn btn-s" style={{ ...SMALL_BTN, marginLeft: "auto" }} onClick={onRestore}>
                Restore access
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby="sel-people" className="card clip">
        <div className="card-h">
          <h2 id="sel-people" className="card-t">
            People
          </h2>
          <span className="card-meta tnum">{p.users}</span>
        </div>
        {p.people.map((u) => (
          <div key={u.id} className="li">
            <Avatar initials={initialsOf(u.name)} round />
            <span className="li-t">
              <span className="li-n">{u.name}</span>
              <span className="li-s">{PARTNER_ROLE_LABEL[u.role]}</span>
            </span>
            <span className="li-s">
              {u.status === "invited" ? invitedLabel(u.invitedAt) : lastSeenLabel(u.lastActiveAt, today)}
            </span>
          </div>
        ))}
        {p.people.length === 0 ? (
          <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>Nobody has been invited yet.</p>
        ) : null}
      </section>

      <section aria-labelledby="sel-deals" className="card clip">
        <div className="card-h">
          <h2 id="sel-deals" className="card-t">
            Recent deals
          </h2>
          <Link href={ROUTES.admin.approvals} className="link-sm">
            Queue
          </Link>
        </div>
        {p.recentDeals.map((d) => (
          <div key={d.registrationId} className="li">
            <ProductMark product={d.product} />
            <span className="li-t">
              <span className="li-n">{d.customer}</span>
              <span className="li-s">
                {PRODUCT_LABEL[d.product]}, {fmtShort(d.registeredOn)}
              </span>
            </span>
            <DealStatusBadge status={d.status} />
          </div>
        ))}
        {p.recentDeals.length === 0 ? (
          <p style={{ margin: 0, padding: 12, fontSize: 12.5, color: "#6B687D" }}>No deals registered yet.</p>
        ) : null}
      </section>
    </aside>
  );
}
```

- [ ] **Step 8: Replace `partner-dialogs.tsx`**

Replace `src/components/partners/partner-dialogs.tsx` in full. The manager dialog lists the active partner managers from the server (names as the options); its hint no longer promises an email:

```tsx
"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/overlay";
import { PARTNER_CATEGORIES, PARTNER_CATEGORY_LABEL, type PartnerCategory } from "@/lib/domain";
import type { ManagerOptionDto } from "@/lib/dto";
import { codeFromLabel } from "@/lib/people";
import { Seg } from "./seg";

interface DialogProps {
  partner: { name: string };
  onClose: () => void;
}

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);

/** Both dialogs are mounted only while open, so each opening starts from the partner's current value. */
export function CategoryDialog({
  partner,
  current,
  onClose,
  onSave,
}: DialogProps & { current: PartnerCategory; onSave: (value: PartnerCategory) => void }): React.JSX.Element {
  const [label, setLabel] = useState<string>(PARTNER_CATEGORY_LABEL[current]);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Change category"
      subtitle={`${partner.name}. The category decides which documents its people can open.`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              const code = codeFromLabel(PARTNER_CATEGORY_LABEL, label);
              if (code) onSave(code);
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="cat-l" className="lbl">
          Category
        </span>
        <Seg options={CATEGORY_OPTIONS} value={label} onChange={setLabel} labelledBy="cat-l" />
      </div>
    </Dialog>
  );
}

export function ManagerDialog({
  partner,
  currentId,
  managers,
  onClose,
  onSave,
}: DialogProps & { currentId: string | null; managers: readonly ManagerOptionDto[]; onSave: (managerId: string) => void }): React.JSX.Element {
  const names = managers.map((m) => m.name);
  const [name, setName] = useState<string>(managers.find((m) => m.id === currentId)?.name ?? names[0] ?? "");
  return (
    <Dialog
      open
      onClose={onClose}
      title="Change partner manager"
      subtitle={`${partner.name}. The new manager gets its deal approvals and messages.`}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-p"
            onClick={() => {
              const chosen = managers.find((m) => m.name === name);
              if (chosen) onSave(chosen.id);
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="fg">
        <span id="pm-l" className="lbl">
          Partner manager
        </span>
        <Seg options={names} value={name} onChange={setName} labelledBy="pm-l" />
        <span className="hint">The partner's deal approvals and messages move to the new manager.</span>
      </div>
    </Dialog>
  );
}
```

- [ ] **Step 9: Replace `add-partner-drawer.tsx`**

Replace `src/components/partners/add-partner-drawer.tsx` in full. The drawer now waits for the server: `onAdd` returns an error message to show in the form, or null on success.

```tsx
"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/overlay";
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  type PartnerCategory,
  type PartnerRegion,
} from "@/lib/domain";
import type { PartnerListRow } from "@/lib/dto";
import { codeFromLabel, emailDomain, isValidEmail, normaliseDomain } from "@/lib/people";
import { Seg } from "./seg";

const CATEGORY_OPTIONS: readonly string[] = PARTNER_CATEGORIES.map((c) => PARTNER_CATEGORY_LABEL[c]);
const REGIONS: readonly string[] = [PARTNER_REGION_LABEL.india, PARTNER_REGION_LABEL.middle_east];

export interface NewPartnerValues {
  name: string;
  website: string;
  category: PartnerCategory;
  region: PartnerRegion;
  adminName: string;
  adminEmail: string;
  sendInvite: boolean;
}

interface AddPartnerDrawerProps {
  partners: readonly PartnerListRow[];
  onClose: () => void;
  /** Resolves to an error message to show in the form, or null when the partner was added. */
  onAdd: (input: NewPartnerValues) => Promise<string | null>;
}

/** Mounted only while open, so every opening starts from a blank form. */
export function AddPartnerDrawer({ partners, onClose, onAdd }: AddPartnerDrawerProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [categoryLabel, setCategoryLabel] = useState<string>(PARTNER_CATEGORY_LABEL.channel);
  const [regionLabel, setRegionLabel] = useState<string>(PARTNER_REGION_LABEL.india);
  const [admin, setAdmin] = useState("");
  const [email, setEmail] = useState("");
  const [sendInvite, setSendInvite] = useState(true);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const domain = normaliseDomain(website) || emailDomain(email);
  const taken = domain ? partners.find((p) => p.domain === domain) : undefined;
  const nameErr = tried
    ? name.trim()
      ? taken
        ? `${taken.name} already uses ${domain}.`
        : ""
      : "Enter the company name."
    : "";
  const emailErr = tried && !isValidEmail(email) ? "Enter a valid work email." : "";

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setTried(true);
    setServerError(null);
    const category = codeFromLabel(PARTNER_CATEGORY_LABEL, categoryLabel);
    const region = codeFromLabel(PARTNER_REGION_LABEL, regionLabel);
    if (!name.trim() || !isValidEmail(email) || taken || !category || !region) return;
    setBusy(true);
    const error = await onAdd({ name, website, category, region, adminName: admin, adminEmail: email, sendInvite });
    setBusy(false);
    if (error) setServerError(error);
  };

  return (
    <Drawer
      open
      onClose={onClose}
      onSubmit={submit}
      title="Add a partner"
      subtitle="The partner admin gets an email to set a password and accept the partner agreement."
      footer={
        <>
          <label style={{ display: "flex", alignItems: "center", gap: 6, marginRight: "auto", fontSize: 12.5 }}>
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              style={{ width: 14, height: 14, margin: 0, accentColor: "#4B23C8" }}
            />
            Email the invite now
          </label>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            {sendInvite ? "Add and send invite" : "Add partner"}
          </button>
        </>
      }
    >
      <div className="fg">
        <label htmlFor="np-company" className="lbl">
          Company name
        </label>
        <input
          id="np-company"
          className={`field${nameErr ? " field-err" : ""}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={nameErr ? true : undefined}
          aria-describedby="np-company-err"
        />
        {nameErr ? (
          <span className="err" id="np-company-err">
            {nameErr}
          </span>
        ) : null}
      </div>
      <div className="fg">
        <label htmlFor="np-domain" className="lbl">
          Website
        </label>
        <input id="np-domain" className="field" type="text" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <div className="fg">
        <span id="np-cat" className="lbl">
          Category
        </span>
        <Seg options={CATEGORY_OPTIONS} value={categoryLabel} onChange={setCategoryLabel} labelledBy="np-cat" />
      </div>
      <div className="fg">
        <span id="np-reg" className="lbl">
          Region
        </span>
        <Seg options={REGIONS} value={regionLabel} onChange={setRegionLabel} labelledBy="np-reg" />
      </div>
      <hr className="hr" />
      <div className="fg">
        <label htmlFor="np-admin" className="lbl">
          Partner admin name
        </label>
        <input id="np-admin" className="field" type="text" value={admin} onChange={(e) => setAdmin(e.target.value)} />
      </div>
      <div className="fg">
        <label htmlFor="np-email" className="lbl">
          Partner admin work email
        </label>
        <input
          id="np-email"
          className={`field${emailErr ? " field-err" : ""}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={emailErr ? true : undefined}
          aria-describedby="np-email-err"
        />
        {emailErr ? (
          <span className="err" id="np-email-err">
            {emailErr}
          </span>
        ) : null}
      </div>
      {serverError ? (
        <span className="err" role="alert">
          {serverError}
        </span>
      ) : null}
    </Drawer>
  );
}
```

- [ ] **Step 10: Replace `AdminPartners.tsx`**

Replace `src/components/screens/AdminPartners.tsx` in full (this supersedes the M1.4 version). Differences from the mock: the data arrives as props; selecting a partner navigates to `?selected=<id>` so the server loads that partner's detail; the totals come from the loaded rows (the "11 other active partners" are real rows now); the two KPIs the DTOs cannot supply (partner users active this month, deals this quarter) become "partners signed in this month" and "protected deals" (contract change request item 2); staff who are not partner managers see the list read-only without Applications and Add partner.

```tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icon";
import { AddPartnerDrawer, type NewPartnerValues } from "@/components/partners/add-partner-drawer";
import { ApplicationsTable } from "@/components/partners/applications-table";
import { downloadCsv } from "@/components/partners/csv";
import { PartnerDetail } from "@/components/partners/partner-detail";
import { CategoryDialog, ManagerDialog } from "@/components/partners/partner-dialogs";
import { CATEGORY_FOR_FILTER, type CategoryFilter, PartnersTable } from "@/components/partners/partners-table";
import { useToast } from "@/components/ui/toast";
import { daysBetween } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PARTNER_STATUS_LABEL } from "@/lib/domain";
import type { ApplicationDto, ManagerOptionDto, PartnerDetailDto, PartnerListRow } from "@/lib/dto";
import { codeFromLabel, lastSeenLabel } from "@/lib/people";
import {
  approveApplicationAction,
  declineApplicationAction,
  reopenApplicationAction,
} from "@/server/actions/applications";
import {
  createPartnerAction,
  resendPartnerInvitesAction,
  restorePartnerAction,
  setPartnerCategoryAction,
  setPartnerManagerAction,
  suspendPartnerAction,
} from "@/server/actions/partners";
import type { ActionResult } from "@/server/actions/result";

type Tab = "Partners" | "Applications";

interface AdminPartnersProps {
  partners: PartnerListRow[];
  /** The selected partner, loaded by the page. Null when there are no partners. */
  detail: PartnerDetailDto | null;
  managers: ManagerOptionDto[];
  applications: ApplicationDto[];
  /** Applications with status new, from countNewApplications. */
  waiting: number;
  /** Partner managers change partners and decide on applications; other staff read the list. */
  canManage: boolean;
  today: string;
}

export function AdminPartners({
  partners,
  detail,
  managers,
  applications,
  waiting,
  canManage,
  today,
}: AdminPartnersProps): React.JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("Partners");
  const requestedTab = searchParams.get("tab");
  useEffect(() => {
    if (requestedTab === "applications" && canManage) setTab("Applications");
  }, [requestedTab, canManage]);
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [region, setRegion] = useState("All regions");
  const [status, setStatus] = useState("Any status");
  const [dialog, setDialog] = useState<"add" | "category" | "manager" | null>(null);

  const wantedCategory = CATEGORY_FOR_FILTER[category];
  const wantedRegion = region === "All regions" ? null : codeFromLabel(PARTNER_REGION_LABEL, region);
  const wantedStatus = status === "Any status" ? null : codeFromLabel(PARTNER_STATUS_LABEL, status);
  const shown = partners.filter(
    (p) =>
      (!wantedCategory || p.category === wantedCategory) &&
      (!wantedRegion || p.region === wantedRegion) &&
      (!wantedStatus || p.status === wantedStatus),
  );

  const total = partners.length;
  const active = partners.filter((p) => p.status === "active").length;
  const onboarding = partners.filter((p) => p.status === "onboarding").length;
  const inactive = partners.filter((p) => p.status === "inactive").length;
  const partnerUsers = partners.reduce((sum, p) => sum + p.users, 0);
  const signedInThisMonth = partners.filter(
    (p) => p.lastActiveAt !== null && daysBetween(p.lastActiveAt.slice(0, 10), today) <= 30,
  ).length;
  const protectedDeals = partners.reduce((sum, p) => sum + p.protectedCount, 0);
  const protectingPartners = partners.filter((p) => p.protectedCount > 0).length;

  const select = (id: string): void => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const report = async (pending: Promise<ActionResult<unknown>>, success: string): Promise<boolean> => {
    const result = await pending;
    toast(result.ok ? success : result.error.message);
    return result.ok;
  };

  const exportCsv = (): void => {
    downloadCsv(
      "partners.csv",
      [
        "Partner",
        "Domain",
        "Category",
        "Region",
        "Status",
        "Pending",
        "Protected",
        "Won YTD",
        "Last active",
        "Partner manager",
      ],
      shown.map((p) => [
        p.name,
        p.domain,
        PARTNER_CATEGORY_LABEL[p.category],
        PARTNER_REGION_LABEL[p.region],
        PARTNER_STATUS_LABEL[p.status],
        p.pending,
        p.protectedCount,
        p.won,
        lastSeenLabel(p.lastActiveAt, today),
        p.managerName ?? "",
      ]),
    );
    toast(`Exported ${shown.length} ${shown.length === 1 ? "partner" : "partners"} to CSV`);
  };

  const onAdd = async (input: NewPartnerValues): Promise<string | null> => {
    const result = await createPartnerAction(input);
    if (!result.ok) return result.error.message;
    setDialog(null);
    setTab("Partners");
    setCategory("All");
    setRegion("All regions");
    setStatus("Any status");
    select(result.data.id);
    toast(input.sendInvite ? `Invite sent to ${input.adminEmail.trim()}` : `${result.data.name} added, invite not sent yet`);
    return null;
  };

  const tabs: readonly (readonly [Tab, number])[] = canManage
    ? [
        ["Partners", total],
        ["Applications", waiting],
      ]
    : [["Partners", total]];

  return (
    <div className="wrap">
      <div className="head">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h1 className="h1">Partners</h1>
          <span className="h1-sub">Approving an application creates the account and invites the applicant.</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn btn-s" onClick={exportCsv}>
            <Icon name="dl" />
            Export
          </button>
          {canManage ? (
            <button type="button" className="btn btn-p" onClick={() => setDialog("add")}>
              <Icon name="userplus" />
              Add partner
            </button>
          ) : null}
        </div>
      </div>

      <section aria-label="Partner summary" className="card kpis">
        <div className="kpi">
          <span className="kpi-l">Active partners</span>
          <span className="kpi-v">{active}</span>
          <span className="kpi-f">
            {onboarding} onboarding, {inactive} inactive
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Applications</span>
          <span className="kpi-v t-amber">{waiting}</span>
          <span className="kpi-f">Waiting for a decision</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Partner users</span>
          <span className="kpi-v">{partnerUsers}</span>
          <span className="kpi-f">{signedInThisMonth} partners signed in this month</span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Protected deals</span>
          <span className="kpi-v">{protectedDeals}</span>
          <span className="kpi-f">From {protectingPartners} partners</span>
        </div>
      </section>

      <div className="row">
        <section aria-label="Partners and applications" className="card clip" style={{ flex: "1 1 100%", minWidth: 0 }}>
          <div className="tabs" role="group" aria-label="View" style={{ padding: "0 8px" }} data-tour="partners-tabs">
            {tabs.map(([label, count]) => (
              <button
                key={label}
                type="button"
                className={`tab${tab === label ? " tab-on" : ""}`}
                aria-pressed={tab === label}
                onClick={() => setTab(label)}
              >
                {label}
                <span className="cnt">{count}</span>
              </button>
            ))}
          </div>

          {tab === "Partners" ? (
            <PartnersTable
              partners={shown}
              total={total}
              selectedId={detail?.id ?? ""}
              today={today}
              category={category}
              region={region}
              status={status}
              onCategory={setCategory}
              onRegion={setRegion}
              onStatus={setStatus}
              onSelect={select}
            />
          ) : (
            <ApplicationsTable
              applications={applications}
              waiting={waiting}
              canDecide={canManage}
              onApprove={(a, choice) =>
                void report(
                  approveApplicationAction({ id: a.id, category: choice.category, region: choice.region }),
                  `Approved ${a.company}. Invite sent to ${a.applicantName}`,
                )
              }
              onDecline={(a, reason) =>
                void report(
                  declineApplicationAction({ id: a.id, reason }),
                  `Rejected ${a.company}. ${a.applicantName} has been emailed`,
                )
              }
              onUndo={(a) => void report(reopenApplicationAction({ id: a.id }), `${a.company} is back in the queue`)}
            />
          )}
        </section>

        {tab === "Partners" && detail ? (
          <PartnerDetail
            key={detail.id}
            partner={detail}
            today={today}
            canManage={canManage}
            onChangeManager={() => setDialog("manager")}
            onChangeCategory={() => setDialog("category")}
            onResendInvites={() => {
              void (async () => {
                const result = await resendPartnerInvitesAction({ id: detail.id });
                if (!result.ok) {
                  toast(result.error.message);
                  return;
                }
                const count = result.data.count;
                toast(
                  count > 0
                    ? `Invites resent to ${count} ${count === 1 ? "person" : "people"} at ${detail.name}`
                    : `Everyone at ${detail.name} has accepted their invite`,
                );
              })();
            }}
            onSuspend={() => void report(suspendPartnerAction({ id: detail.id }), `${detail.name} is suspended`)}
            onRestore={() => void report(restorePartnerAction({ id: detail.id }), `Access restored for ${detail.name}`)}
          />
        ) : null}
      </div>

      {dialog === "add" ? <AddPartnerDrawer partners={partners} onClose={() => setDialog(null)} onAdd={onAdd} /> : null}
      {dialog === "category" && detail ? (
        <CategoryDialog
          partner={detail}
          current={detail.category}
          onClose={() => setDialog(null)}
          onSave={(value) => {
            setDialog(null);
            void report(
              setPartnerCategoryAction({ id: detail.id, category: value }),
              `${detail.name} is now listed as ${PARTNER_CATEGORY_LABEL[value].toLowerCase()}`,
            );
          }}
        />
      ) : null}
      {dialog === "manager" && detail ? (
        <ManagerDialog
          partner={detail}
          currentId={detail.managerId}
          managers={managers}
          onClose={() => setDialog(null)}
          onSave={(managerId) => {
            setDialog(null);
            const name = managers.find((m) => m.id === managerId)?.name ?? "The new manager";
            void report(setPartnerManagerAction({ id: detail.id, managerId }), `${name} now manages ${detail.name}`);
          }}
        />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 11: Write the final partners page**

Replace `src/app/admin/partners/page.tsx` in full (supersedes the M1.4 version):

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPartners } from "@/components/screens/AdminPartners";
import { systemClock } from "@/lib/clock";
import { can } from "@/server/auth/policies";
import { requireCan } from "@/server/auth/viewer";
import { countNewApplications, listApplications } from "@/server/repo/applications";
import { withViewer } from "@/server/repo/context";
import { getPartnerDetail, listPartners } from "@/server/repo/partners";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Partners" };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const viewer = await requireCan("partner.read");
  const { selected } = await searchParams;
  const canManage = can(viewer, "partner.create");
  const data = await withViewer(viewer, async (tx) => {
    const partners = await listPartners(tx, viewer, {});
    const managers = await listManagerOptions(tx, viewer);
    const wanted =
      (typeof selected === "string" ? partners.find((p) => p.id === selected)?.id : undefined) ?? partners[0]?.id ?? null;
    const detail = wanted ? await getPartnerDetail(tx, viewer, wanted) : null;
    const applications = canManage ? await listApplications(tx, viewer, {}) : [];
    const waiting = canManage ? await countNewApplications(tx, viewer) : 0;
    return { partners, managers, detail, applications, waiting };
  });
  return (
    <Suspense fallback={null}>
      <AdminPartners
        partners={data.partners}
        detail={data.detail}
        managers={data.managers}
        applications={data.applications}
        waiting={data.waiting}
        canManage={canManage}
        today={systemClock.today()}
      />
    </Suspense>
  );
}
```

Behaviour difference from the mock, for the product owner: when a filter hides the selected partner, its detail stays on screen (the mock jumped to the first row); selecting a row loads that partner's detail from the server.

- [ ] **Step 12: Prove nothing in this plan's components reads the mock data any more**

Run:

```bash
grep -rn "@/data/\|@/lib/slice" src/components/partners src/components/people src/components/screens/{Apply,ApplyDone,AcceptInvite,PartnerWelcome,Team,Account,Company,AdminTeam,AdminPartners}.tsx
```

Expected: no output. (`SignIn.tsx` belongs to plan 02 and is checked there, apart from the request views, which Task M1.6 already verified. `PasswordCard.tsx` and `TwoStepCard.tsx` still import `@/data/team` until plan 02 converts them.)

- [ ] **Step 13: Gate A**

Run the Gate A block. The last command must list only this task's Files block.

- [ ] **Step 14: Manual check (seed-dev data, signed in as `farhan.qureshi@cleanstart.com`, route `/admin/partners`)**

1. Four KPI tiles: "Active partners" 19 (21 partners with 2 onboarding is 17 active plus the 11 seeded fillers; read the number off the data: it equals `select count(*) from partners where status = 'active'`), "Applications" 3, "Partner users" (the sum of users), "Protected deals". The tab counts read "Partners 21" and "Applications 3".
2. The table lists 21 partners sorted by name with the real pending, protected, won and last-active values; Kestrel Systems shows 2 pending, 3 protected, 2 won. The first partner alphabetically is selected; click Kestrel: the URL gains `?selected=<id>` and the detail card shows Kestrel's agreement "v1.2, accepted 12 Mar 2026", partner manager Farhan Qureshi, admin Aditi Rao, HubSpot company 91822044, its four people (Vikram "Invited 5 Nov") and its three recent deals.
3. "Change category" to Distributor: toast "Kestrel Systems is now listed as distributor"; reload keeps it; `select event, note from audit_log order by at desc limit 1` shows `partner.category_changed` with "Channel partner to Distributor".
4. "Change" next to Partner manager: choose Omar Nasser, Save: toast "Omar Nasser now manages Kestrel Systems"; the detail updates.
5. "Resend invites" on Qamar Solutions: toast "Invites resent to 2 people at Qamar Solutions". On Saffron Secure (everyone accepted): "Everyone at Saffron Secure has accepted their invite".
6. Suspend Ironleaf Consulting: confirm, status badge becomes Suspended and the button becomes "Restore access"; sign in as one of its users in a private window: sign-in fails with the generic message. Restore: status returns to Inactive (what it was before).
7. "Add partner": name `Dunes Test`, website `dunestest.ae`, Channel partner, Middle East, admin `Test Admin`, `test.admin@dunestest.ae`, send invite on: toast "Invite sent to test.admin@dunestest.ae", the new partner is selected with status Onboarding, manager Omar Nasser. Adding the same website again shows "Another partner already uses this domain." in the drawer.
8. Sign in as `rahul.menon@cleanstart.com` (staff sales, India): only India partners are listed, there is no Applications tab, no Add partner button and the detail card has no action buttons.

- [ ] **Step 15: Commit**

```bash
git add apps/portal/src/server/repo/partners.ts apps/portal/src/server/repo/partners.test.ts \
  apps/portal/src/server/actions/partners.ts apps/portal/src/server/actions/partners.test.ts \
  apps/portal/src/components/partners/badges.tsx apps/portal/src/components/partners/partners-table.tsx \
  apps/portal/src/components/partners/partner-detail.tsx apps/portal/src/components/partners/partner-dialogs.tsx \
  apps/portal/src/components/partners/add-partner-drawer.tsx \
  apps/portal/src/components/screens/AdminPartners.tsx apps/portal/src/app/admin/partners/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-03-identity.md
git commit -m "feat(portal): M4.1 partners list and detail"
```

---

## Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Accept | M1.7b builds `PasswordCard`, `TwoStepCard`, the reset page and the account security actions; plan 02 builds none. Contracts K.1, K.2, H.20 and the handoff agree. |
| 2 | Reject | Each needs a column or an aggregate with no source; the plan already degrades the screen. Recorded in contracts H.0 notes. No `invitee_name` column (scope). |
| 3 | Accept | Sessions are revoked by the action after commit; contracts B.6, H.3, H.5, H.6 amended. |
| 4 | Accept | Registered in contracts H.1 (`listManagerRecipients`) and H.6 (`listPartnerAdminRecipients`); files in K.2. |
| 5 | Accept | Contracts H.6 `createPartner` text. |
| 6 | Accept | Contracts G, `partner.upsert` row. |
| 7 | Accept | Contracts H.16: `greater_than_equal`, duplicates absorbed by the unique index. |
| 8 | Accept | Contracts F.4: `access_request` added to the subject types. |
| 9 | Reject | No template or notification kind exists; scope. M4.1 removes the promise from the hint. |
| 10 | Reject | Legal has not supplied the PDF; the button says so. Follow-up for track D when it exists. |
| 11 | Accept | Contracts I: the site key is passed to `Apply.tsx` as a prop. |
| 12 | Accept | Contracts H.0 notes (invite only rows). |
| 13 | Accept | Contracts L. |
| 14 | Accept | Contracts H.0 notes. |
| 15 | Accept | Contracts H.0 notes. |
| 16 | Reject | `qrcode` is not in the dependency list and the key plus link works; contracts M.3 item 33. Add later if the pilot asks. |

Each item is something this plan needed that the contracts do not define, or a place where the contracts and the code cannot both be followed. Nothing below is redefined in this plan; where a workaround is used it is named.

1. **Plan 02 interface (ownership gap).** (a) The brief for this plan names `components/people/PasswordCard.tsx` and `TwoStepCard.tsx` as plan 02's. Contracts K.1 gives both, `Account.tsx` and `src/app/(public)/reset-password/page.tsx` (K.2) to P, H.20 lists `changePasswordAction`, `enableTwoFactorAction` and `disableTwoFactorAction` under P's `actions/account.ts`, and plan 02's change requests 5 and 7 say "the P track's `/reset-password` page" and "P, M1.7 account actions use Better Auth for the second step"; plan 02 builds none of these files. Task M1.7b therefore builds them. If the orchestrator wants plan 02 to own them, drop M1.7b; nothing else in this plan depends on it, and the Account screen then keeps the mock cards. (b) Two actions beyond H.20: `verifyTwoFactorAction` (turns the factor on after the first code, audits `account.two_factor_enabled`) and `regenerateBackupCodesAction` (Better Auth shows backup codes only when it makes them, so the mock's "Backup codes" button makes a new set). `requestPasswordResetAction` and `resetPasswordAction` are not built: plan 02's change request 5 replaces them with Better Auth's own endpoints, which the reset page and the Sign in screen call through plan 02's `authClient`. (c) `actions/account.ts` may already exist when this track reaches M1.7 (plan 02 might add to it); M1.7 and M1.7b create it or append to it. (d) `SignIn.tsx` is plan 02's file; M1.6 edits only its three "request access" views (K.1 says so) and gives a verbatim fallback if plan 02 moved the code. Plan 02 must leave those views alone and keep the `?request=1` handling (its Task M1.1g leaves them in place).
2. **DTO additions.** `CompanyDto.agreementAcceptedByName: string | null` (the mock's Company screen shows "Accepted by"; the row is dropped in M1.7 until it exists). `StaffMemberDto.invitedAt: IsoTimestamp | null` (the mock shows "Invited 5 Nov"; M1.8 shows "Invite pending"). `PartnerListRow` aggregates for the two mock KPIs the DTOs cannot supply, `usersActiveThisMonth` and `dealsThisQuarter` (M4.1 shows "partners signed in this month" and "protected deals" instead). An `invites.invitee_name` column (and `InvitePreviewDto.name` filled from it) would let the accept page greet a staff or colleague invitee by the name the inviter typed; today the name is derived from the email, or from the approved application for a partner's first admin.
3. **Session deletion.** The contracts have `removeMember`, `suspendPartner` and `removeStaff` delete the person's Better Auth sessions inside the repo transaction (H.3, H.5, H.6, B.6). `auth_session` is system-only under row level security (C.3), so a partner or staff viewer transaction deletes nothing. This plan deletes them in the action after commit with `revokeAllSessions(userId)` from `src/server/auth/sessions.ts` (for `suspendPartner`, for every person the detail lists). Access is cut immediately either way because `getViewer()` returns null for a disabled user or a suspended partner. Amend the three signature comments.
4. **Additions inside P's own modules** (no other area calls them; each is registered in its module's `isolation` block): `listManagerRecipients(tx, actor)` in `repo/applications.ts`; `listPartnerAdminRecipients(tx, { partnerId })` in `repo/partners.ts`; `createCmsClient(config?)` takes an optional `{ apiKey, baseUrl }` (a call with no argument behaves as in H.16) and `createHttpCmsClient`, `startStubCms` for tests; shared non-repo modules `src/server/{invite-core,partner-routing,partner-rows,partner-people,partner-scope,invite-preview,people,turnstile,apply-receipt}.ts` and client-safe `src/lib/{people,apply,invites}.ts`; `scripts/{stub-cms,run-intake,dev-invite-link}.ts`.
5. **`createPartner` and the invite row.** H.6 says the partner admin invite is created "when sendInvite". The admin's email and name are stored nowhere else, so the invite row is always created, and `invite` (with its token) is returned only when `sendInvite` is true; "Resend invites" sends the unsent one later. A partner added without an invite therefore counts one person and shows the admin name derived from the email.
6. **`partner.upsert` version for edits.** G says `String(updatedAt.getTime())` of the partner row after an edit. `PartnerListRow` has no `updatedAt`, so category, manager, status and re-approval edits use `String(clock.now().getTime())`, still a fresh key per edit. Profile edits use the real row time because `updateCompanyProfile` returns it.
7. **CMS intake cursor operator.** H.16 says "createdAt greater than `since`". The client asks for `greater_than_equal`, so two rows with the same timestamp cannot be missed; the unique `(source, source_ref)` index absorbs the repeated boundary row (counted as `skipped.duplicate`).
8. **Audit subject type.** `AuditEntryInput.subject.type` (F.4) has no `'access_request'`. The access request audit entries use `'user'` with the request id; add `'access_request'` to the union.
9. **Manager change notification.** The Change partner manager dialog in the mock says the partner admin is told by email. There is no template for it in H.15 and no notification kind. M4.1 removes the promise from the hint. Add a `buildManagerChanged` template and a notification kind if the product owner wants the email.
10. **Agreement PDF.** `PARTNER_AGREEMENT_KEY` is in the environment but no route serves the file. The Company screen's "Download PDF" button tells the partner the PDF is not in the portal yet. Add a signed download route (track D owns `src/server/files/`) when legal supplies the PDF.
11. **Turnstile site key.** I says the client reads `process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` in `Apply.tsx`. M1.3 passes `env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` from the server page as a prop, because only the server `env` carries Cloudflare's always-pass key outside production, and a client component must not import `@/env`. Same variable, different path.
12. **Invite-only rows.** The Team, partner detail and staff lists show a person who has only been invited as a row whose `id` is the invite id (`inviteId` equals `id`, `userId` is absent from the DTO). `removeStaff` accepts such an id and withdraws the invite. `getTeam` members with an invite and a users row in status `invited` keep their user id. Document this in H.0 so R and A do not assume every `TeamMemberDto.id` is a user id.
13. **Route map.** L says `/partner/team` and `/admin/team` load `listOpenInvites`. `getTeam` and `listStaff` already include invited people, so the pages do not call it. `/admin/partners` loads the selected partner's detail through a `?selected=<id>` search parameter.
14. **Preview agreement version.** `previewInvite` fills `agreementVersion` only from the partner row; `loadInvitePreview` (server) overrides it with `PARTNER_AGREEMENT_VERSION` when the agreement is needed, since a new partner has none stored yet.
15. **Won YTD.** `PartnerListRow.won` is deals won this calendar year (`closed_on`, else `registered_on`), computed against the database date, to match the "Won YTD" column header.
16. **QR code for two-step enrolment.** The mock shows "QR code from the server". No QR library is in the dependency list (W0-a), so the setup dialog offers the key and an "Open in your authenticator app" link. Add `qrcode` (or `qrcode-generator`) to `package.json` and render `totpURI` to remove the limit on desktop sign-ins.

## Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Library and environment behaviour this plan could not verify offline, each with the step that checks it and the fallback.

1. **Better Auth server sign-in after accept.** `auth.api.signInEmail({ body, headers })` exists in the installed typings (`better-auth` 1.7.x, checked in `dist/api/routes/sign-in.d.mts`) and `nextCookies` exists in `better-auth/next-js`; that the cookie persists when the call runs inside a server action depends on W0-f configuring `nextCookies()`. Verify: M1.5 step 1. Fallback: the action already returns `signedIn: false` and the person signs in by hand.
2. **Better Auth `auth.api.getSession({ headers })`** returns `{ session: { token }, user }` (typings checked). Used by the Account page to mark the current session. Fallback: pass `null` and no session is flagged "This device".
3. **Turnstile explicit rendering and siteverify.** Checked against Cloudflare's published documentation (script `...api.js?render=explicit`, `turnstile.render/reset/remove`, `siteverify` accepts form or JSON with `secret`, `response`, `remoteip`). Real keys and a real challenge cannot run overnight; tests stub `fetch`, development uses the always-pass keys. Verify the production keys by hand before launch.
4. **Payload REST query.** `GET /api/partner-applications?sort=createdAt&limit&page&depth=0&where[createdAt][greater_than_equal]=...` with `Authorization: users API-Key <key>` and the paginated response with `hasNextPage` are written from Payload 3's documented behaviour, the installed API key strategy (`apps/cms/node_modules/payload/dist/auth/strategies/apiKey.js`), the web app's own header (`apps/web/src/lib/cms-fetch.ts`) and the collection source. Verify against a real CMS when the service user exists (M1.3b manual check with real values). Fallback: `greater_than` with a cursor one second earlier.
5. **Drizzle query forms.** Checked in the 0.44 typings: `select().for('update')`, `onConflictDoNothing`, `onConflictDoUpdate`, `inArray`, `ilike`, `isNull`, `exists`. Used unverified at runtime: `onConflictDoNothing({ target })` against a unique index rather than a constraint (`applications_source_ref_key`, `users_email_key`, `partners_domain_key`; Postgres infers the index), a nested `select({ user: users, region: staffScopes.region })`, `sql\`excluded.email\`` in `onConflictDoUpdate`. Verify with the first test that runs each. Fallback: `.onConflictDoNothing()` without a target, and two queries instead of the nested select.
6. **Row level security with `FOR UPDATE` and `RETURNING`.** The repo takes `FOR UPDATE` locks as partner admins on `users`, `invites` and `access_requests` rows (the UPDATE policies cover them) and relies on `RETURNING` only on rows the same identity can read. Contracts unknown 17 covers the base case. Fallback: lock with `pg_advisory_xact_lock(hashtext(id))`.
7. **Test helper defaults.** `makeInvite`, `makeApplication`, `makeAccessRequest`, `makeRegistration`, `asStaff` and `asPartner` are used with explicit values for every column a test asserts; their default values for unspecified columns (W0-b) are assumed to satisfy the constraints.
8. **`rateLimit` semantics.** Tests assume `limit` calls are allowed per window and the next throws `RateLimitError`. Verify against `src/server/rate-limit.ts`.
9. **`exactOptionalPropertyTypes`.** The mock's code (conditional `{...(x ? { a } : {})}` spreads) suggests it is on; every optional property in this plan is built that way. Harmless if it is off.
10. **Email template internals.** Tests assert that the invite builders put the invite URL (`/accept-invite?token=`), the inviter's name (`buildTeamInvite`), the decline reason (`buildApplicationDeclined`) and the requester's name (`buildAccessRequest`) in the HTML, as the input types in H.15 imply. If W0-g renders one of them differently, adjust the assertion, not the builder call.
11. **Better Auth two-step calls.** `auth.api.enableTwoFactor` (returns `{ method: 'totp', totpURI, backupCodes }`), `verifyTOTP`, `disableTwoFactor`, `generateBackupCodes` and `changePassword` (with `revokeOtherSessions`) exist in the installed typings (checked). That `verifyTOTP` completes an enrolment on the signed-in session alone, and that the error codes in `src/server/auth-errors.ts` are the ones the library raises (`INVALID_PASSWORD`, `INVALID_CODE`, `TOTP_ALREADY_ENABLED`, `TWO_FACTOR_NOT_ENABLED`, `ACCOUNT_TEMPORARILY_LOCKED`; `PASSWORD_RULES_NOT_MET` is the portal's, plan 02) is read from the library source, not run. Plan 02's checklist exercises the real flow; M1.7b step 12 is the manual proof. Fallback: map by message text, or call the library from the client with `authClient` and have the action only audit.
12. **`outbox.ts` availability.** `enqueue` comes from H4.4. See the Prerequisites note: the steps that need it are isolated so a missing H4.4 blocks only them.

## Self-review

**Master tasks to plan tasks.** M1.3 is Task M1.3 (portal application page, ApplyDone, Turnstile, receipt cookie, rate limits, emails). M1.3b is Task M1.3b (intake module, stub CMS, job, two scripts). M1.4 is Task M1.4 (approve, decline, reopen, Applications tab with the source chips and the category and region panel for website entries). M1.5 is Task M1.5 (preview and accept, welcome checklist, manager message, dev link script). M1.6 is Task M1.6 (team repo and screen, access requests, request-access form). M1.7 is Task M1.7 (profile, notification switches, sessions card, company profile) and Task M1.7b (password change, two-step sign-in, backup codes, the reset-password page). M1.8 is Task M1.8 (staff repo and screen, staff invites). M4.1 is Task M4.1 (partners list and detail, Add partner, category, manager, suspend, restore, resend invites). Every function in contracts H.1 to H.6 and H.16 has a task: applications (9 of 9), invites (6 of 6), team (5 of 5), account (4 new of 5; `getShell` is M1.1's), staff (5 of 5), partners (12 of 12), intake (`cmsPartnerApplicationSchema`, `CmsClient`, `createCmsClient`, `mapCmsApplication`, `importWebsiteApplications`). Every action in H.20 that belongs to P has a task, except `requestPasswordResetAction` and `resetPasswordAction`, which plan 02's change request 5 replaces with Better Auth's own endpoints (CCR item 1).

**Security rules.** Invite tokens: `generateInviteToken` (32 random bytes), only the SHA-256 is stored, `INVITE_TTL_DAYS` is 7, single use is enforced by a row lock (`FOR UPDATE`) and tested with two simultaneous accepts; expired, used, withdrawn and tampered tokens return four different messages (M1.5 repo and action tests). The last partner admin cannot be removed or demoted and nobody removes themselves (M1.6); the last partner manager is protected the same way (M1.8). "Request access" returns the same result for a matching domain, an unknown domain and an existing login, with the admin email sent without being awaited (M1.6 test). Every public action rate limits through `rateLimit` (apply per IP and email, invite per IP, request access per IP and email). The clear password never reaches the repo, the audit log or a result (M1.5 test). The accept action and the apply action never return a token to the client (tests assert it).

**Placeholder scan.** The file was searched for markers of undecided or deferred work, for references that stand in for code instead of giving it, for vague handling instructions, for "write tests" steps without tests, and for the em-dash and en-dash characters: none found. Every code step carries complete code, every run step names its command and expected output, and every type, function or file used is defined by the contracts or by an earlier or same task in this plan (the names this plan adds are listed in CCR item 4).

**Name consistency with the contracts.** Tables and columns, DTOs (`ApplicationDto`, `InvitePreviewDto`, `CreatedInviteDto`, `TeamDto`, `TeamMemberDto`, `AccessRequestDto`, `StaffMemberDto`, `ManagerOptionDto`, `PartnerListRow`, `PartnerDetailDto`, `CompanyDto`, `ChecklistDto`, `ProfileDto`, `SessionDto`), enums and label maps from `src/lib/domain.ts`, errors (`ConflictError` reasons `application_not_open`, `domain_is_partner`, `partner_not_reopenable`, `invite_expired`, `invite_used`, `invite_revoked`, `invite_unknown`, `already_has_login`, `last_admin`, `cannot_remove_self`, `last_partner_manager`, `already_applied`, `already_decided`), audit events (`application.submitted`, `application.approved`, `application.declined`, `application.reopened`, `partner.created`, `partner.manager_changed`, `partner.category_changed`, `partner.suspended`, `partner.restored`, `partner.agreement_accepted`, `partner.profile_updated`, `team.*`, `staff.*`, `account.session_revoked`), outbox ops `partner.upsert` and `user.upsert` with the versions from G (CCR item 6 notes the one deviation), helper names (`makePartner`, `makeUser`, `makeApplication`, `makeInvite`, `makeAccessRequest`, `makeRegistration`, `asStaff`, `asPartner`, `FakeEmailTransport`), and the file paths from K.2 all match the contracts. The only names this plan adds are listed in CCR item 4.
