# Partner portal registrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track R of the partner portal build. Deal registration, the conversation thread, approvals with undo and conflict hints, protection extensions and expiry reminders, and the partner and admin dashboards run on real data in `apps/portal`, for the six mock screens `Deals`, `DealDetail`, `RegisterDeal`, `AdminApprovals`, `PartnerOverview` and `AdminReports`, plus the notifications popover content (M4.4).

**Architecture:** Every page is a Server Component that loads DTOs through `withViewer(viewer, tx => repo.fn(tx, viewer, ...))` and hands them, with the server `today`, to the existing client screen. The screens keep their markup, classes and copy; slice setters become server actions built on `runViewerAction` (the pattern in contracts F.8). All writes are one transaction: lock the row, `assertCan` against the record, repo write, `recordAudit`, `enqueue` (outbox) and `notifyUsers`; emails and `revalidatePath` run after commit. The only HubSpot calls in a request are read only: the customer lookup (`lookupCustomer`) and the approval conflict hint (`conflictingDeals`), both behind a timeout and both degrading to "no suggestions" when HubSpot is down. Deal rules (90 days, 2 business day target, 14 and 3 day reminders, one 30 day extension, 10 minute undo) come only from `src/lib/deal-rules.ts`.

**Tech Stack:** Next.js 16.2.5, React 19, TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), Drizzle on Postgres 16 with RLS, Zod 3, Vitest 2 against a real Postgres (`FakeEmailTransport`, `FakeHubspot`), Biome.

**Source documents (read before starting):** `docs/superpowers/plans/2026-11-12-partner-portal-00-contracts.md` (single source for schema, DTOs, errors, conventions; this plan implements it exactly and names its sections as "contracts X"), `docs/partner-portal/BUILD-HANDOFF.md` (loop, gates, allowed paths, stop rules), the master plan tasks 2.1 to 2.4, 2.6 and 4.4, and HubSpot plan tasks 4.4, 4.6, 4.7 and 4.8 (what is enqueued, what lookup returns, what the poll does to status). `CLAUDE.md` rules apply: no em-dashes or en-dashes anywhere, no `any`, typed errors, no comments unless the why is non obvious.

---

## Prerequisites and ownership

Track R starts M2.1 when H4.2 and H4.7 (customer lookup, `hubspotForRequest`) are merged and P has merged M1.5 (`sendManagerMessageAction`) and M1.8 (`listManagerOptions`); H4.4 (`enqueue`) must be merged before M2.2 and M2.4, and D's M3.2 (`listNewDocuments`) before M2.6 (BUILD-HANDOFF, task dependencies). The table lists every cross-track export this plan calls, by the contract name. If one is missing when a task needs it, append a `blocked` line to the progress log naming it and continue with a task that does not need it.

| Needed by | Export | Owner | Contracts |
|---|---|---|---|
| all | `withViewer`, `Tx`, `assertStaff`, `recordAudit`, `notifyUsers`, `resolveEmailRecipients`, `runViewerAction`, `ActionResult`, `defineIsolation`, `assertCan`, `requireCan`, `requireKind`, `systemClock`, `fixedClock`, `rateLimit`, `sendEmail`, every `build*` email template, `absoluteUrl` | W0 | F, D, H.15 |
| all | test helpers `makePartner`, `makeUser`, `makeRegistration`, `makeSyncedDeal`, `makeDocument`, `asStaff`, `asPartner`, `viewerFor`, `seedTwoTenants`, `resetDb`, `testDb`, `FakeEmailTransport` | W0 | J |
| M2.1 step "Register action" | `listManagerOptions` (`repo/staff.ts`, P M1.8) | P | H.5 |
| M2.1 lookup, M2.2 hints | `HubspotApi`, `StageLabel`, `FakeHubspot` (H4.2), `lookupCustomer`, `conflictingDeals`, `hubspotForRequest` (H4.7 `src/server/hubspot/lookup.ts`, contracts H.13c) | H | H.13c, HubSpot plan |
| M2.3 | the W0-c stub `src/server/registrations/announce.ts` that M2.3 replaces; H4.8 calls it | W0 | H.17 |
| M2.2, M2.4 | `enqueue` (H4.4) | H | G |
| M2.1, M2.3 | `getShell` (W0-f), `sendManagerMessageAction` (P M1.7) | W0, P | H.4, H.20 |
| M2.6 | `listNewDocuments` (`repo/documents.ts`, D M3.2) | D | H.11 |
| M2.2 undo | the RLS DELETE change in Contract change request 2 | ORCH | C.3 |

Files that two tracks touch, and who owns what: `src/server/jobs/expiry.ts` is H4.8 (it expires `accepted` registrations whose `protection_end` passed and enqueues `registration.expire`); this plan does not write it. R owns `src/server/jobs/expiry-reminders.ts` and the extension action (contracts section M, inconsistency 6). Where this plan needs the expiry job to behave in a certain way it adds a test to R's own files that exercises the real `expireRegistrations` as a black box, never an edit to it.

## Conventions used by every task

- Repo functions follow contracts F.3 (`tx`, `viewer`, `input`, `clock`). A repo module never imports `next/*`, `@/db/client` or sends email. Each ends with `export const isolation = defineIsolation<...>({...})`; every exported function is listed (the isolation test fails otherwise). A task that adds an exported function replaces the whole `isolation` block with the block printed in that task.
- Server action files start with `'use server'` and export only `async function ...Action(raw: unknown)`. Zod schemas, mappers and helpers live in non action files.
- Tests: repo tests run against the worker database with `resetDb` in `beforeEach`; viewers come from `asPartner` and `asStaff`; every clock is `fixedClock('2026-11-06T14:02:00Z')`. Action tests mock four things at the top of the file and nothing else of the app:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));
```

  and `beforeEach` creates `mail.transport = new FakeEmailTransport()`. Each action test file below repeats this block.
- New copy and new markup are listed explicitly as "Copy changes" or "Additions"; everything not listed stays byte for byte.
- Commits stage explicit paths and use `feat(portal): <id> <summary>`; no attribution lines.
- Gate A (every task, run in `apps/portal`, record the result in the progress log):

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

  Expected: lint, typecheck and test exit 0; build exits 0; the dash grep (it matches the UTF-8 bytes of an em-dash and an en-dash, so this file never contains either character) prints nothing; the last command lists only paths from the task's Files block.

## File structure

New files (Create) and the mock files converted (Modify), by owner R. Paths are relative to `apps/portal`.

```
src/lib/customer.ts                          sameCustomer, normalizeDomain (pure, client safe)            M2.1
src/lib/report-view.ts                       filterPartnerRows, partnersToCsv, option lists (pure)        M2.6
src/lib/notification-view.ts                 notificationIcon, notificationWhen (pure)                    M4.4
src/components/deals/types.ts                ManagerContact, CrmSuggestion, CustomerLookupResult, HubspotHintDto   M2.1
src/components/deals/dates.ts                thin re-export of @/lib/dates and @/lib/deal-rules          M2.1
src/components/deals/derive.ts               pure derived values, clock injected, tested                   M2.1, M2.2
src/components/deals/derive.test.ts                                                                         M2.1, M2.2
src/components/deals/parts.tsx               DTO based badges, marks, protection cell                      M2.1
src/components/deals/RejectedDealDrawer.tsx  resubmit through the action                                    M2.1
src/components/deals/ManagerMessageDrawer.tsx real manager, real sender                                    M2.1
src/components/reports/{partner-ui.ts,FollowUpList.tsx,ProductBreakdown.tsx}                                M2.6
src/components/shell/notifications-popover.tsx                                                              M4.4
src/components/screens/{Deals,RegisterDeal}.tsx                                                             M2.1
src/components/screens/DealDetail.tsx                                                                       M2.3, M2.4
src/components/screens/AdminApprovals.tsx                                                                   M2.2, M2.4
src/components/screens/{PartnerOverview,AdminReports}.tsx                                                   M2.6
src/app/partner/deals/page.tsx, deals/new/page.tsx, deals/[id]/page.tsx                                     M2.1, M2.3
src/app/admin/approvals/page.tsx                                                                            M2.2, M2.4
src/app/partner/overview/page.tsx, src/app/admin/reports/page.tsx                                           M2.6
src/server/registrations/scope.ts            registrationScope, assertUuid                                  M2.1
src/server/registrations/mappers.ts          row selects, DTO mappers, detail loader, checks                M2.1, M2.2
src/server/registrations/recipients.ts       who is told about a deal                                       M2.2
src/server/registrations/pg-errors.ts        isUniqueViolation                                              M2.1
src/server/registrations/hubspot-read.ts     readOnlyHubspot, withTimeout                                   M2.1
src/server/registrations/customer-lookup.ts  crmSuggestions                                                 M2.1
src/server/registrations/conflict-hints.ts   hubspotConflictHints                                           M2.2
src/server/registrations/staff-alert.ts      email to the deal's manager                                    M2.1
src/server/registrations/announce.ts         announceRegistrationChange (called by H4.8, CR 4)              M2.3
src/server/repo/registrations.ts             H.7 plus conflictInputs                                        M2.1, M2.2, M2.4
src/server/repo/messages.ts                  H.8                                                            M2.3
src/server/repo/notifications.ts             H.9                                                            M2.3
src/server/repo/overview.ts, reports.ts      H.10                                                           M2.6
src/server/actions/registrations.ts          registerDealsAction, resubmitRegistrationAction, lookupCustomerAction (M2.1), postMessageAction (M2.3)
src/server/actions/decisions.ts              accept, reject, undo, hubspotConflictHintsAction               M2.2
src/server/actions/extension.ts              requestExtensionAction, decideExtensionAction                  M2.4
src/server/actions/notifications.ts          markAllNotificationsReadAction, markNotificationReadAction     M2.3
src/server/jobs/expiry-reminders.ts          the reminder job body                                          M2.4
```

Test files sit beside the module under test. Files marked "beyond the module map" (everything in `src/server/registrations/`, `src/lib/customer.ts`, `src/lib/notification-view.ts`, `src/components/deals/types.ts`) are new R owned files that no contract lists; they are listed again in "Contract change requests" so the orchestrator can add them to section K.

---
## Tasks

### Task M2.1: Registrations repo, register form, customer lookup, Deals list

**Gate A:** the Gate A block in "Conventions", plus `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts` green with every function below registered.

**Files:**
- Create: `src/lib/customer.ts`, `src/lib/customer.test.ts`
- Create: `src/components/deals/types.ts`, `src/components/deals/derive.test.ts`
- Create: `src/server/registrations/{scope,pg-errors,mappers,hubspot-read,customer-lookup,staff-alert}.ts`
- Create: `src/server/registrations/{pg-errors,hubspot-read,customer-lookup}.test.ts`
- Create: `src/server/repo/registrations.ts`, `src/server/repo/registrations.create.test.ts`
- Create: `src/server/actions/registrations.ts`, `src/server/actions/registrations.test.ts`
- Modify (rewrite): `src/components/deals/{dates.ts,derive.ts,parts.tsx}`
- Modify (edits printed below): `src/components/deals/{RejectedDealDrawer.tsx,ManagerMessageDrawer.tsx}`, `src/components/screens/{Deals,RegisterDeal}.tsx`, `src/app/partner/deals/page.tsx`, `src/app/partner/deals/new/page.tsx`
- Test: the files above, plus `src/server/repo/isolation.test.ts` (existing, unchanged)

Rules this task implements: one registration per product and customer (hard block while pending or accepted, contracts M.3 item 24); a new registration is `pending` with stage `Awaiting review`, routed to a manager from `listManagerOptions`; an `onboarding` partner becomes `active` on its first registration; partner sales see only their own deals, partner admin the company's, technical nothing; the customer lookup returns the company's own customers plus, from HubSpot, only name and website, rate limited 10 per 60 seconds per user.

- [ ] **Step 1: Verify the library behaviours this task relies on**

Create the scratch test `apps/portal/src/server/registrations/verify.scratch.test.ts`, run it, read the output, then delete the file (it is never committed).

```ts
import { eq, getTableColumns } from 'drizzle-orm';
import { expect, it } from 'vitest';
import { partners, registrations } from '@/db/schema';
import { makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';

it('scratch: drizzle error shape, getTableColumns select and FOR UPDATE after LIMIT', async () => {
  const db = testDb();
  await resetDb(db);
  const partner = await makePartner(db, {});
  await makeRegistration(db, { partnerId: partner.id, customerName: 'Dup Co', product: 'images', status: 'pending' });
  let caught: unknown;
  try {
    await makeRegistration(db, { partnerId: partner.id, customerName: 'dup co', product: 'images', status: 'pending' });
  } catch (error) {
    caught = error;
  }
  const direct = (caught as { code?: string; constraint?: string }).code;
  const wrapped = (caught as { cause?: { code?: string; constraint?: string } }).cause?.code;
  console.log('VERIFY direct code:', direct, 'wrapped code:', wrapped, 'constraint:', (caught as { cause?: { constraint?: string } }).cause?.constraint);
  expect(direct === '23505' || wrapped === '23505').toBe(true);

  const rows = await db
    .select({ ...getTableColumns(registrations), partnerName: partners.name })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .limit(1);
  expect(rows[0]?.partnerName).toBe(partner.name);
  await db.transaction(async (tx) => {
    const locked = await tx.select({ id: registrations.id }).from(registrations).where(eq(registrations.partnerId, partner.id)).limit(1).for('update');
    expect(locked).toHaveLength(1);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations/verify.scratch.test.ts`
Expected: PASS and one `VERIFY` line. If `direct` is `23505` the driver error is thrown as is; if only `wrapped` is `23505` Drizzle wraps it. `isUniqueViolation` in step 5 reads both, so either result is fine. If the select with `getTableColumns` or `.limit(1).for('update')` fails to type check or run, stop: write a `blocked` line, because `mappers.ts` and `lockRegistration` depend on both. Then `rm apps/portal/src/server/registrations/verify.scratch.test.ts`.

- [ ] **Step 2: Write the failing tests for the pure customer helpers**

```ts
// src/lib/customer.test.ts
import { describe, expect, it } from 'vitest';
import { normalizeDomain, sameCustomer } from './customer';

describe('sameCustomer', () => {
  it('ignores case and surrounding spaces', () => {
    expect(sameCustomer('Vardhan Capital', '  vardhan capital ')).toBe(true);
    expect(sameCustomer('Vardhan Capital', 'Vardhan Capital Ltd')).toBe(false);
  });
});

describe('normalizeDomain', () => {
  it('reduces a pasted address to a bare lower case domain', () => {
    expect(normalizeDomain('https://www.VardhanCapital.in/about?x=1')).toBe('vardhancapital.in');
    expect(normalizeDomain('vardhancapital.in')).toBe('vardhancapital.in');
    expect(normalizeDomain('  www.tejashealth.in:8080  ')).toBe('tejashealth.in');
  });

  it('returns null for empty input and for text that is not a domain', () => {
    expect(normalizeDomain(null)).toBeNull();
    expect(normalizeDomain('   ')).toBeNull();
    expect(normalizeDomain('Vardhan')).toBeNull();
    expect(normalizeDomain('rohan@vardhancapital.in')).toBeNull();
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/customer.test.ts`
Expected: FAIL, "Cannot find module './customer'".

- [ ] **Step 3: Implement `src/lib/customer.ts`**

```ts
/** Same rule as the registrations_open_unique index: trimmed and case insensitive. */
export const sameCustomer = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

const DOMAIN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

/** "https://www.Vardhancapital.in/about" becomes "vardhancapital.in". Null when no usable domain is left. */
export const normalizeDomain = (input: string | null | undefined): string | null => {
  if (!input) return null;
  let value = input.trim().toLowerCase();
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  value = value.split(/[/?#]/)[0] ?? '';
  value = value.replace(/^www\./, '').replace(/:\d+$/, '').replace(/\.$/, '');
  return DOMAIN.test(value) ? value : null;
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/customer.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 4: Write the failing tests for the derived values**

The mock's `derive.ts` and `dates.ts` read a global `TODAY`. Every function now takes `today` from the caller. This file holds every test for the file; M2.2 appends the checks tests to it.

```ts
// src/components/deals/derive.test.ts
import { describe, expect, it } from 'vitest';
import { PROTECTION_DAYS } from './dates';
import { acceptedOn, isOverTarget, managerFor, protectionView, reviewSince, stageTrack, waitDays } from './derive';

const base = {
  registeredOn: '2026-11-02',
  resubmittedOn: null,
  status: 'pending' as const,
  stage: 'Awaiting review',
  protectionEnd: null,
  closedOn: null,
};

describe('protection arithmetic', () => {
  it('counts the acceptance day: protection ends 89 days after it', () => {
    expect(PROTECTION_DAYS).toBe(90);
    expect(acceptedOn({ protectionEnd: '2027-02-02' })).toBe('2026-11-05');
    expect(acceptedOn({ protectionEnd: null })).toBeNull();
  });
});

describe('review target', () => {
  it('counts business days since the first submission', () => {
    expect(waitDays(base, '2026-11-06')).toBe(4);
    expect(waitDays({ ...base, registeredOn: '2026-11-06' }, '2026-11-09')).toBe(1);
  });

  it('is over the 2 business day target only on the third business day', () => {
    expect(isOverTarget(base, '2026-11-04')).toBe(false);
    expect(isOverTarget(base, '2026-11-05')).toBe(true);
  });

  it('restarts from the resubmission date and ignores decided registrations', () => {
    expect(reviewSince({ ...base, resubmittedOn: '2026-11-05' })).toBe('2026-11-05');
    expect(isOverTarget({ ...base, resubmittedOn: '2026-11-05' }, '2026-11-06')).toBe(false);
    expect(isOverTarget({ ...base, status: 'accepted' as const }, '2026-11-30')).toBe(false);
  });
});

describe('protectionView', () => {
  it('describes a waiting registration, flagging the target only in the deals list', () => {
    expect(protectionView({ ...base, registeredOn: '2026-11-06' }, 'deals', '2026-11-06')).toEqual({ until: 'Sent today', left: '', cls: 't-muted' });
    expect(protectionView(base, 'deals', '2026-11-06')).toEqual({ until: 'Waiting 4 days', left: 'over 2-day target', cls: 't-amber' });
    expect(protectionView(base, 'overview', '2026-11-06')).toEqual({ until: 'Waiting 4 days', left: '', cls: 't-amber' });
    expect(protectionView({ ...base, resubmittedOn: '2026-11-06' }, 'deals', '2026-11-06')).toEqual({ until: 'Resent today', left: '', cls: 't-muted' });
  });

  it('shows days left for protected deals and turns amber at 14 days', () => {
    const accepted = { ...base, status: 'accepted' as const, stage: 'Discovery' };
    expect(protectionView({ ...accepted, protectionEnd: '2027-01-12' }, 'deals', '2026-11-06')).toEqual({ until: '12 Jan 2027', left: '67d', cls: 't-ink' });
    expect(protectionView({ ...accepted, protectionEnd: '2026-11-20' }, 'deals', '2026-11-06')).toEqual({ until: '20 Nov 2026', left: '14d', cls: 't-amber' });
  });

  it('describes closed, expired and rejected registrations', () => {
    expect(protectionView({ ...base, status: 'won' as const, closedOn: '2026-09-19' }, 'deals', '2026-11-06').until).toBe('Closed 19 Sep');
    expect(protectionView({ ...base, status: 'expired' as const, closedOn: '2026-07-30' }, 'deals', '2026-11-06').until).toBe('Ended 30 Jul');
    expect(protectionView({ ...base, status: 'rejected' as const }, 'deals', '2026-11-06').until).toBe('Not protected');
  });
});

describe('stageTrack', () => {
  it('starts at Registered for a pending registration', () => {
    expect(stageTrack(base)?.map((s) => [s.label, s.state])).toEqual([
      ['Registered', 'now'], ['Accepted', 'todo'], ['Technical evaluation', 'todo'], ['Proposal sent', 'todo'], ['Closed', 'todo'],
    ]);
  });

  it('adds Discovery only when the deal is in it, and closes a won deal', () => {
    const discovery = stageTrack({ status: 'accepted', stage: 'Discovery' });
    expect(discovery?.map((s) => s.label)).toContain('Discovery');
    expect(discovery?.find((s) => s.state === 'now')?.label).toBe('Discovery');
    const won = stageTrack({ status: 'won', stage: 'Closed won' });
    expect(won?.at(-1)).toEqual({ label: 'Closed won', state: 'done' });
  });

  it('has no track for rejected or expired registrations', () => {
    expect(stageTrack({ status: 'rejected', stage: 'Not accepted' })).toBeNull();
    expect(stageTrack({ status: 'expired', stage: 'Registration expired' })).toBeNull();
  });
});

describe('managerFor', () => {
  const managers = [
    { id: 'm-in', name: 'Farhan Qureshi', region: 'india' as const, team: 'CleanStart India' },
    { id: 'm-me', name: 'Omar Nasser', region: 'middle_east' as const, team: 'CleanStart Middle East' },
  ];
  it('picks the manager of the deal region, else the first, else nothing', () => {
    expect(managerFor(managers, 'middle_east')).toBe('m-me');
    expect(managerFor([managers[0]!], 'middle_east')).toBe('m-in');
    expect(managerFor([], 'india')).toBe('');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/derive.test.ts`
Expected: FAIL, the new exports (`managerFor`, `isOverTarget`) and the `today` parameters do not exist yet.

- [ ] **Step 5: Rewrite `src/components/deals/dates.ts` and `derive.ts`, add `types.ts`**

`dates.ts` becomes a re-export (the mock's `TODAY`, `NOW_TIME` and the local helpers are deleted; `daysLeft` now takes `today`):

```ts
export { addDays, daysBetween, daysLeft, fmtLong, fmtShort, plural } from "@/lib/dates";
export { PROTECTION_DAYS } from "@/lib/deal-rules";
```

`types.ts`:

```ts
import type { CustomerSuggestionDto } from "@/lib/dto";

/** The deal's partner manager as the message drawers need it. */
export interface ManagerContact {
  name: string;
  team: string;
}

/** A company HubSpot knows. Never carries deals, owners or another partner's data. */
export interface CrmSuggestion {
  name: string;
  website: string | null;
}

export interface CustomerLookupResult {
  own: CustomerSuggestionDto[];
  crm: CrmSuggestion[];
}

/** Staff only: another partner holds an open HubSpot deal for the customer. */
export interface HubspotHintDto {
  registrationId: string;
  holder: string | null;
  openDeals: number;
}
```

`derive.ts` (complete new file; markup helpers unchanged, every date rule from `deal-rules`):

```ts
import type { Product as ChipProduct, BadgeTone } from "../ui/badge";
import { sameCustomer } from "@/lib/customer";
import { acceptedOnFor, EXPIRING_SOON_DAYS, isOverSla, REVIEW_SLA_BUSINESS_DAYS, waitingBusinessDays } from "@/lib/deal-rules";
import type { DealRegion, Product, RegistrationStatus } from "@/lib/domain";
import type { ManagerOptionDto, RegistrationListItem } from "@/lib/dto";
import { daysLeft, fmtLong, fmtShort, plural } from "./dates";

export { sameCustomer };

/** CleanStart reviews a registration within this many business days. */
export const OVER_TARGET_DAYS = REVIEW_SLA_BUSINESS_DAYS;

/** ProductChip and the badge file speak in display labels; the data speaks in codes. */
export const CHIP_PRODUCT: Record<Product, ChipProduct> = {
  images: "CleanStart Images",
  libraries: "Clean Libraries",
  cleansight: "CleanSight",
};

export const firstWord = (name: string): string => name.split(" ")[0] ?? name;

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

/** A stable avatar tint class per name. */
export function avOf(name: string): string {
  let sum = 0;
  for (const char of name) sum += char.charCodeAt(0);
  return `av-${(sum % 4) + 1}`;
}

/** Badge tones are named after the status codes. */
export const statusTone = (status: RegistrationStatus): BadgeTone => status;

type Reviewable = Pick<RegistrationListItem, "registeredOn" | "resubmittedOn">;

/** ISO date the current review started: the first submission, or the latest resubmission. */
export const reviewSince = (deal: Reviewable): string => deal.resubmittedOn ?? deal.registeredOn;

/** Business days waited, so a Friday registration is one day old on Monday. */
export const waitDays = (deal: Reviewable, today: string): number => waitingBusinessDays(reviewSince(deal), today);

export const isOverTarget = (deal: Reviewable & Pick<RegistrationListItem, "status">, today: string): boolean =>
  deal.status === "pending" && isOverSla(reviewSince(deal), today);

/** The day protection started: the last day minus 89, because the acceptance day counts. */
export const acceptedOn = (deal: Pick<RegistrationListItem, "protectionEnd">): string | null =>
  deal.protectionEnd ? acceptedOnFor(deal.protectionEnd) : null;

export interface ProtectionView {
  until: string;
  left: string;
  cls: string;
}

type ProtectionInput = Reviewable &
  Pick<RegistrationListItem, "status" | "protectionEnd" | "closedOn">;

/** The "Protection" cell: waiting time, protected-until date, or the closing date, depending on status. */
export function protectionView(deal: ProtectionInput, mode: "deals" | "overview", today: string): ProtectionView {
  switch (deal.status) {
    case "pending": {
      if (deal.resubmittedOn === today) return { until: "Resent today", left: "", cls: "t-muted" };
      const days = waitDays(deal, today);
      const late = isOverTarget(deal, today);
      return {
        until: days === 0 ? "Sent today" : `Waiting ${plural(days, "day")}`,
        left: mode === "deals" && late ? `over ${OVER_TARGET_DAYS}-day target` : "",
        cls: late ? "t-amber" : "t-muted",
      };
    }
    case "accepted": {
      const end = deal.protectionEnd;
      if (!end) return { until: "", left: "", cls: "t-ink" };
      const days = daysLeft(end, today);
      return { until: fmtLong(end), left: `${days}d`, cls: days <= EXPIRING_SOON_DAYS ? "t-amber" : "t-ink" };
    }
    case "won":
    case "lost":
      return { until: `Closed ${fmtShort(deal.closedOn ?? deal.registeredOn)}`, left: "", cls: "t-muted" };
    case "expired":
      return { until: `Ended ${fmtShort(deal.closedOn ?? deal.registeredOn)}`, left: "", cls: "t-muted" };
    case "rejected":
      return { until: "Not protected", left: "", cls: "t-muted" };
  }
}

const FLOW = ["Registered", "Accepted", "Discovery", "Technical evaluation", "Proposal sent", "Closed"] as const;

export interface StageStep {
  label: string;
  state: "done" | "now" | "todo";
}

/** The stage tracker. Null when the deal never reached or has left the pipeline (rejected, expired). */
export function stageTrack(deal: Pick<RegistrationListItem, "status" | "stage">): StageStep[] | null {
  if (deal.status === "rejected" || deal.status === "expired") return null;
  const steps = FLOW.filter((step) => step !== "Discovery" || deal.stage === "Discovery");
  const last = steps.length - 1;
  let current: number;
  if (deal.status === "pending") current = 0;
  else if (deal.status === "won") current = steps.length;
  else if (deal.status === "lost") current = last;
  else current = Math.max(0, steps.indexOf(deal.stage as (typeof FLOW)[number]));
  return steps.map((step, index) => ({
    label: index === last && deal.status === "won" ? "Closed won" : index === last && deal.status === "lost" ? "Closed lost" : step,
    state: index < current ? "done" : index === current ? "now" : "todo",
  }));
}

/** The manager the Register form preselects: the one covering the deal region, else the first. */
export function managerFor(managers: readonly ManagerOptionDto[], region: DealRegion): string {
  return (managers.find((m) => m.region === region) ?? managers.find((m) => m.region === "all") ?? managers[0])?.id ?? "";
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/derive.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 6: Rewrite `src/components/deals/parts.tsx`**

The three helpers read DTOs and codes; `ProtectionCell` needs the server `today`.

```tsx
import { PRODUCT_LABEL, type Product, REGISTRATION_STATUS_LABEL, type RegistrationStatus } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { ICONS, type IconName } from "../icon-paths";
import { Badge } from "../ui/badge";
import { avOf, initialsOf, protectionView, statusTone } from "./derive";

export const PLUS_PATH =
  "M222,128a6,6,0,0,1-6,6H134v82a6,6,0,0,1-12,0V134H40a6,6,0,0,1,0-12h82V40a6,6,0,0,1,12,0v82h82A6,6,0,0,1,222,128Z";

export function StatusBadge({ status }: { status: RegistrationStatus }): React.JSX.Element {
  return <Badge tone={statusTone(status)}>{REGISTRATION_STATUS_LABEL[status]}</Badge>;
}

export function CustomerMark({ name }: { name: string }): React.JSX.Element {
  return <span className={`av ${avOf(name)}`}>{initialsOf(name)}</span>;
}

export function ProtectionCell({
  deal,
  mode,
  today,
}: {
  deal: Pick<RegistrationListItem, "status" | "registeredOn" | "resubmittedOn" | "protectionEnd" | "closedOn">;
  mode: "deals" | "overview";
  today: string;
}): React.JSX.Element {
  const view = protectionView(deal, mode, today);
  return (
    <td className="tnum r">
      <span className={view.cls}>{view.until}</span> <span className="t-muted">{view.left}</span>
    </td>
  );
}

const PRODUCT_MARK: Record<Product, { cls: string; icon: IconName }> = {
  images: { cls: "pm-img", icon: "img" },
  libraries: { cls: "pm-lib", icon: "lib" },
  cleansight: { cls: "pm-sight", icon: "sight" },
};

/** The small coloured product tile on its own, for rows that print the product name themselves. */
export function ProductMark({
  product,
  size,
  large,
}: {
  product: Product;
  size?: number;
  large?: boolean;
}): React.JSX.Element {
  const mark = PRODUCT_MARK[product];
  const box = size ? { width: size, height: size, borderRadius: 4 } : undefined;
  return (
    <span className={`pm${large ? " pm-lg" : ""} ${mark.cls}`} style={box} title={PRODUCT_LABEL[product]}>
      <svg
        className="ic"
        viewBox="0 0 256 256"
        aria-hidden="true"
        style={size ? { width: Math.round(size * 0.65), height: Math.round(size * 0.65) } : undefined}
      >
        <path d={ICONS[mark.icon]} />
      </svg>
    </span>
  );
}
```

(The only addition to `ProductMark` is the `title` attribute, which gives the tile an accessible name now that callers pass a code instead of a label.)

- [ ] **Step 7: Write the failing tests for the helper modules**

```ts
// src/server/registrations/pg-errors.test.ts
import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './pg-errors';

describe('isUniqueViolation', () => {
  it('reads a driver error thrown as is', () => {
    expect(isUniqueViolation({ code: '23505', constraint: 'registrations_open_unique' }, 'registrations_open_unique')).toBe(true);
  });
  it('reads the cause of a Drizzle wrapped error', () => {
    expect(isUniqueViolation({ message: 'Failed query', cause: { code: '23505', constraint: 'registrations_open_unique' } })).toBe(true);
  });
  it('does not match another constraint, another code or a non error', () => {
    expect(isUniqueViolation({ code: '23505', constraint: 'other' }, 'registrations_open_unique')).toBe(false);
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation('boom')).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
```

```ts
// src/server/registrations/hubspot-read.test.ts
import { describe, expect, it } from 'vitest';
import { withTimeout } from './hubspot-read';

describe('withTimeout', () => {
  it('returns the value when the promise is quick', async () => {
    expect(await withTimeout(Promise.resolve(7), 50)).toBe(7);
  });
  it('returns null when the promise is slower than the limit, so a request never waits on HubSpot', async () => {
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 200));
    expect(await withTimeout(slow, 10)).toBeNull();
  });
  it('passes a rejection through', async () => {
    await expect(withTimeout(Promise.reject(new Error('429')), 50)).rejects.toThrow('429');
  });
});
```

```ts
// src/server/registrations/customer-lookup.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from '@/server/hubspot/fake';
import { crmSuggestions } from './customer-lookup';

describe('crmSuggestions', () => {
  it('returns name and website only', async () => {
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Holdings', domain: 'vardhancapital.in', properties: { secret: 'x' } });
    expect(await crmSuggestions(hs, 'vardhan')).toEqual([{ name: 'Vardhan Capital Holdings', website: 'vardhancapital.in' }]);
  });
  it('returns nothing for a short query, when HubSpot is not configured and when it fails', async () => {
    const hs = new FakeHubspot();
    expect(await crmSuggestions(hs, 'va')).toEqual([]);
    expect(await crmSuggestions(null, 'vardhan')).toEqual([]);
    const broken = new FakeHubspot();
    broken.searchCompanies = () => Promise.reject(new Error('503'));
    expect(await crmSuggestions(broken, 'vardhan')).toEqual([]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations`
Expected: FAIL, "Cannot find module" for the three modules.

- [ ] **Step 8: Implement the helper modules**

```ts
// src/server/registrations/pg-errors.ts
interface PgErrorShape {
  code?: string;
  constraint?: string;
  cause?: unknown;
}

const read = (value: unknown): PgErrorShape | null => (typeof value === 'object' && value !== null ? (value as PgErrorShape) : null);

/** Drizzle wraps the driver error as `cause`; older versions throw it as is. Both are read. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  let current = read(error);
  for (let depth = 0; current && depth < 3; depth += 1) {
    if (current.code === '23505' && (constraint === undefined || current.constraint === constraint)) return true;
    current = read(current.cause);
  }
  return false;
}
```

```ts
// src/server/registrations/scope.ts
import { and, eq, type SQL } from 'drizzle-orm';
import { registrations } from '@/db/schema';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError, NotFoundError } from '@/server/errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A malformed id is "not found", never a database error that would tell a prober something. */
export function assertUuid(value: string, resource: string): void {
  if (!UUID.test(value)) throw new NotFoundError(resource);
}

/**
 * The registrations a viewer may read, as a SQL condition (undefined means every row). Partner admin: the company.
 * Partner sales: only deals they registered. Staff sales: their region. Partner manager: all. Everyone else: none.
 * RLS is the cross company backstop; this is the role layer on top of it.
 */
export function registrationScope(viewer: Viewer): SQL | undefined {
  if (viewer.kind === 'partner') {
    if (viewer.role === 'partner_admin') return eq(registrations.partnerId, viewer.partnerId);
    if (viewer.role === 'sales') return and(eq(registrations.partnerId, viewer.partnerId), eq(registrations.registeredBy, viewer.id));
    throw new ForbiddenError(`${viewer.role} has no deal access`);
  }
  if (viewer.role === 'partner_manager') return undefined;
  if (viewer.role === 'sales') return viewer.region === 'all' ? undefined : eq(registrations.region, viewer.region);
  throw new ForbiddenError('marketing has no deal access');
}
```

```ts
// src/server/registrations/mappers.ts
import { asc, desc, eq, getTableColumns, inArray } from 'drizzle-orm';
import {
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
  users,
} from '@/db/schema';
import type { PartnerCategory } from '@/lib/domain';
import type { RegistrationDetailDto, RegistrationListItem } from '@/lib/dto';
import type { Tx } from '@/server/repo/context';

export type RegistrationRow = typeof registrations.$inferSelect;
type ContactRow = typeof registrationContacts.$inferSelect;
type MessageRow = typeof registrationMessages.$inferSelect;
type EventRow = typeof registrationEvents.$inferSelect;

/** A registration with the joined names every list item needs. */
export interface ListRow extends RegistrationRow {
  partnerName: string;
  partnerCategory: PartnerCategory;
  managerName: string | null;
}

/** The one select every read goes through. The manager join is a left join, and RLS may hide a removed manager. */
export const selectRows = (tx: Tx) =>
  tx
    .select({
      ...getTableColumns(registrations),
      partnerName: partners.name,
      partnerCategory: partners.category,
      managerName: users.name,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .leftJoin(users, eq(users.id, registrations.managerId));

export const toListItem = (row: ListRow): RegistrationListItem => ({
  id: row.id,
  customer: row.customerName,
  website: row.customerDomain,
  partnerId: row.partnerId,
  partnerName: row.partnerName,
  partnerCategory: row.partnerCategory,
  product: row.product,
  region: row.region,
  managerId: row.managerId,
  managerName: row.managerName,
  registeredById: row.registeredBy,
  registeredByName: row.registeredByName,
  registeredOn: row.registeredOn,
  registeredAt: row.createdAt.toISOString(),
  resubmittedOn: row.resubmittedOn,
  status: row.status,
  stage: row.stage,
  protectionEnd: row.protectionEnd,
  closedOn: row.closedOn,
  decidedOn: row.decidedAt ? row.decidedAt.toISOString().slice(0, 10) : null,
  decidedByLabel: row.decidedByLabel,
  rejectionReason: row.rejectionReason,
  crmRef: row.hubspotDealId ? `HS-${row.hubspotDealId}` : null,
  crmSyncedAt: row.hubspotSyncedAt ? row.hubspotSyncedAt.toISOString() : null,
  extensionStatus: row.extensionStatus,
});

const toDetail = (
  row: ListRow,
  parts: { contacts: ContactRow[]; messages: MessageRow[]; events: EventRow[] },
): RegistrationDetailDto => ({
  ...toListItem(row),
  expectedClose: row.expectedClose,
  notes: row.notes,
  extensionRequestedAt: row.extensionRequestedAt ? row.extensionRequestedAt.toISOString() : null,
  extensionReason: row.extensionReason,
  extensionGrantedAt: row.extensionGrantedAt ? row.extensionGrantedAt.toISOString() : null,
  extensionDays: row.extensionDays,
  hubspotMissing: row.hubspotMissing,
  decidedAt: row.decidedAt ? row.decidedAt.toISOString() : null,
  contacts: parts.contacts.map((c) => ({ id: c.id, name: c.name, role: c.role, email: c.email, phone: c.phone })),
  thread: parts.messages.map((m) => ({
    id: m.id,
    authorId: m.authorId,
    authorName: m.authorName,
    authorOrg: m.authorOrg,
    side: m.side,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    auto: m.auto,
  })),
  history: parts.events.map((e) => ({
    id: e.id,
    at: e.at.toISOString(),
    text: e.text,
    byLabel: e.byLabel,
    source: e.source,
    auto: e.auto,
  })),
});

const group = <T extends { registrationId: string }>(items: readonly T[]): Map<string, T[]> => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.registrationId);
    if (list) list.push(item);
    else map.set(item.registrationId, [item]);
  }
  return map;
};

/** Contacts (newest first, so the contact added on a resubmission leads), thread (oldest first) and history (newest first). */
export async function loadDetails(tx: Tx, rows: readonly ListRow[]): Promise<RegistrationDetailDto[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const contacts = await tx
    .select()
    .from(registrationContacts)
    .where(inArray(registrationContacts.registrationId, ids))
    .orderBy(desc(registrationContacts.createdAt), desc(registrationContacts.id));
  const messages = await tx
    .select()
    .from(registrationMessages)
    .where(inArray(registrationMessages.registrationId, ids))
    .orderBy(asc(registrationMessages.createdAt), asc(registrationMessages.id));
  const events = await tx
    .select()
    .from(registrationEvents)
    .where(inArray(registrationEvents.registrationId, ids))
    .orderBy(desc(registrationEvents.at), desc(registrationEvents.id));
  const byContact = group(contacts);
  const byMessage = group(messages);
  const byEvent = group(events);
  return rows.map((row) =>
    toDetail(row, {
      contacts: byContact.get(row.id) ?? [],
      messages: byMessage.get(row.id) ?? [],
      events: byEvent.get(row.id) ?? [],
    }),
  );
}
```

```ts
// src/server/registrations/hubspot-read.ts
import { hubspotForRequest } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';

/** The read only HubSpot client for a request (H's `hubspotForRequest`, contracts H.13c), or null when HubSpot is not configured. Never throws. */
export function readOnlyHubspot(): HubspotApi | null {
  try {
    return hubspotForRequest()?.hs ?? null;
  } catch (error) {
    log.warn({ err: error }, 'HubSpot is not available for a read only lookup');
    return null;
  }
}

/** Resolves to null when `work` takes longer than `ms`. A request must never wait on HubSpot. */
export async function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}
```

```ts
// src/server/registrations/customer-lookup.ts
import type { CrmSuggestion } from '@/components/deals/types';
import { lookupCustomer } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';
import { withTimeout } from './hubspot-read';

const LOOKUP_TIMEOUT_MS = 4000;

/** Companies HubSpot knows by name or domain: name and website only. Any failure or timeout means no suggestions. */
export async function crmSuggestions(hs: HubspotApi | null, query: string): Promise<CrmSuggestion[]> {
  if (!hs) return [];
  try {
    const found = await withTimeout(lookupCustomer(hs, query), LOOKUP_TIMEOUT_MS);
    return (found ?? []).map((c) => ({ name: c.name, website: c.domain }));
  } catch (error) {
    log.warn({ err: error }, 'HubSpot customer lookup failed');
    return [];
  }
}
```

```ts
// src/server/registrations/staff-alert.ts
import { env } from '@/env';
import { type DealRegion, PARTNER_REGION_LABEL, PRODUCT_LABEL, type Product } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildDealSubmittedStaffAlert } from '@/server/email/templates';
import type { EmailAddress } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, resolveEmailRecipients } from '@/server/notify';
import { absoluteUrl } from '@/server/urls';

export interface SubmissionAlert {
  partnerName: string;
  customer: string;
  products: Product[];
  region: DealRegion;
  registeredByName: string;
  resubmitted: boolean;
  /** The in-app notifications written for the deal's manager; their users get the email. */
  items: readonly NewNotification[];
}

/** After commit. Emails the deal's manager, or PARTNERS_NOTIFY_EMAIL when the deal has no manager. */
export async function sendSubmissionAlert(alert: SubmissionAlert): Promise<void> {
  const recipients = await resolveEmailRecipients(alert.items);
  const to: EmailAddress[] = recipients.map((r) => ({ email: r.email, name: r.name }));
  if (to.length === 0 && env.PARTNERS_NOTIFY_EMAIL) to.push({ email: env.PARTNERS_NOTIFY_EMAIL });
  if (to.length === 0) {
    log.warn({ customer: alert.customer }, 'no staff recipient for a registration alert');
    return;
  }
  await sendEmail(
    buildDealSubmittedStaffAlert({
      to,
      partnerName: alert.partnerName,
      customer: alert.customer,
      productLabel: alert.products.map((p) => PRODUCT_LABEL[p]).join(', '),
      regionLabel: PARTNER_REGION_LABEL[alert.region],
      registeredByName: alert.registeredByName,
      resubmitted: alert.resubmitted,
      approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
    }),
  );
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations`
Expected: PASS, 8 tests (3 in pg-errors, 3 in hubspot-read, 2 in customer-lookup).

- [ ] **Step 9: Write the failing repo tests**

```ts
// src/server/repo/registrations.create.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners, registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  createRegistrations,
  customerSuggestions,
  getRegistration,
  listRegistrations,
  type NewRegistrationsInput,
  resubmitRegistration,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const input = (over: Partial<NewRegistrationsInput> = {}): NewRegistrationsInput => ({
  customer: 'Vardhan Capital',
  website: 'https://www.VardhanCapital.in/about',
  products: ['libraries'],
  region: 'india',
  managerId: null,
  contact: { name: 'Rohan Mehta', role: 'Head of Security', email: 'rohan.mehta@vardhancapital.in', phone: '+91 98204 31786' },
  expectedClose: 'March 2027',
  notes: 'Q1 audit',
  ...over,
});

describe('createRegistrations', () => {
  it('creates one pending registration per product, routed to the manager of the region, and activates an onboarding partner', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    await asStaff(db, 'partner_manager', 'middle_east');
    const partner = await makePartner(db, { status: 'onboarding', region: 'india' });
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });

    const created = await withViewer(viewer, (tx) =>
      createRegistrations(tx, viewer, input({ products: ['libraries', 'cleansight'] }), clock),
    );

    expect(created.map((r) => r.product).sort()).toEqual(['cleansight', 'libraries']);
    for (const r of created) {
      expect(r).toMatchObject({
        status: 'pending',
        stage: 'Awaiting review',
        registeredOn: '2026-11-06',
        managerId: farhan.id,
        registeredByName: viewer.name,
        customer: 'Vardhan Capital',
        website: 'vardhancapital.in',
        partnerId: partner.id,
      });
    }
    expect((await db.select().from(partners).where(eq(partners.id, partner.id)))[0]?.status).toBe('active');
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, created[0]!.id));
    expect(events.map((e) => [e.text, e.byLabel, e.source])).toEqual([['Registered', viewer.name, 'portal']]);
    const contacts = await db.select().from(registrationContacts).where(eq(registrationContacts.registrationId, created[0]!.id));
    expect(contacts.map((c) => [c.name, c.role, c.email])).toEqual([['Rohan Mehta', 'Head of Security', 'rohan.mehta@vardhancapital.in']]);
  });

  it('routes a Middle East deal to the Middle East manager and honours a chosen manager', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const omar = await asStaff(db, 'partner_manager', 'middle_east');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    const [routed] = await withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ region: 'middle_east' }), clock));
    expect(routed?.managerId).toBe(omar.id);
    const farhan = await asStaff(db, 'partner_manager', 'india');
    const [chosen] = await withViewer(viewer, (tx) =>
      createRegistrations(tx, viewer, input({ customer: 'Gulfway Freight', managerId: farhan.id }), clock),
    );
    expect(chosen?.managerId).toBe(farhan.id);
  });

  it('refuses a manager that is not offered to partners', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const marketing = await asStaff(db, 'marketing', 'all');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ managerId: marketing.id }), clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('blocks a second open registration for the same customer and product, whatever the case', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await withViewer(viewer, (tx) => createRegistrations(tx, viewer, input(), clock));
    const again = withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ customer: 'vardhan capital' }), clock));
    await expect(again).rejects.toMatchObject({ reason: 'duplicate_registration' });
    await expect(again).rejects.toBeInstanceOf(ConflictError);
    // another product for the same customer is a different registration
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ products: ['images'] }), clock))).resolves.toHaveLength(1);
  });

  it('does not let a rejected registration block a new one', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await makeRegistration(db, { partnerId: viewer.partnerId, customerName: 'Vardhan Capital', product: 'libraries', status: 'rejected' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input(), clock))).resolves.toHaveLength(1);
  });

  it('refuses to register for another company and to register without a product or a name', async () => {
    const other = await makePartner(db, {});
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ partnerId: other.id }), clock))).rejects.toBeInstanceOf(ForbiddenError);
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ products: [] }), clock))).rejects.toBeInstanceOf(ValidationError);
    await expect(withViewer(viewer, (tx) => createRegistrations(tx, viewer, input({ customer: '   ' }), clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('lets a partner manager register on a partner\'s behalf', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, {});
    const [created] = await withViewer(manager, (tx) => createRegistrations(tx, manager, input({ partnerId: partner.id }), clock));
    expect(created).toMatchObject({ partnerId: partner.id, registeredByName: manager.name });
  });
});

describe('listRegistrations and getRegistration', () => {
  it('scopes by role: admin sees the company, sales only own deals, technical nothing, staff sales their region', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const technical = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    const mine = await makeRegistration(db, { partnerId: partner.id, customerName: 'Mine', registeredBy: sales.id, region: 'india' });
    const colleagues = await makeRegistration(db, { partnerId: partner.id, customerName: 'Colleague', registeredBy: admin.id, region: 'middle_east' });
    const elsewhere = await makeRegistration(db, { customerName: 'Another company', region: 'india' });

    const asAdmin = await withViewer(admin, (tx) => listRegistrations(tx, admin, {}));
    expect(asAdmin.map((r) => r.id).sort()).toEqual([mine.id, colleagues.id].sort());
    const asSales = await withViewer(sales, (tx) => listRegistrations(tx, sales, {}));
    expect(asSales.map((r) => r.id)).toEqual([mine.id]);
    await expect(withViewer(technical, (tx) => listRegistrations(tx, technical, {}))).rejects.toBeInstanceOf(ForbiddenError);
    const staffIndia = await asStaff(db, 'sales', 'india');
    const seenByStaff = await withViewer(staffIndia, (tx) => listRegistrations(tx, staffIndia, {}));
    expect(seenByStaff.map((r) => r.id).sort()).toEqual([mine.id, elsewhere.id].sort());
    const manager = await asStaff(db, 'partner_manager', 'all');
    expect(await withViewer(manager, (tx) => listRegistrations(tx, manager, {}))).toHaveLength(3);
  });

  it('filters by status, product and customer and returns newest first', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Alpha Bank', product: 'images', status: 'accepted' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Beta Bank', product: 'libraries', status: 'pending' });
    const accepted = await withViewer(admin, (tx) => listRegistrations(tx, admin, { status: ['accepted'] }));
    expect(accepted.map((r) => r.customer)).toEqual(['Alpha Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, { product: 'libraries' }))).map((r) => r.customer)).toEqual(['Beta Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, { q: 'alpha' }))).map((r) => r.customer)).toEqual(['Alpha Bank']);
    expect((await withViewer(admin, (tx) => listRegistrations(tx, admin, {}))).map((r) => r.customer)).toEqual(['Beta Bank', 'Alpha Bank']);
  });

  it('does not let a partner filter by another partner', async () => {
    const admin = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(admin, (tx) => listRegistrations(tx, admin, { partnerId: admin.partnerId }))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('answers not found for another company, for a colleague\'s deal seen by sales and for a malformed id', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const theirs = await makeRegistration(db, { partnerId: partner.id, registeredBy: admin.id });
    const foreign = await makeRegistration(db, {});
    await expect(withViewer(sales, (tx) => getRegistration(tx, sales, theirs.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => getRegistration(tx, admin, foreign.id))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => getRegistration(tx, admin, 'not-a-uuid'))).rejects.toBeInstanceOf(NotFoundError);
    const found = await withViewer(admin, (tx) => getRegistration(tx, admin, theirs.id));
    expect(found.id).toBe(theirs.id);
  });

  it('puts the newest contact first and the oldest message first', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await makeRegistration(db, { partnerId: partner.id, contacts: [{ name: 'First Contact', email: 'first@example.com' }] });
    await db.insert(registrationContacts).values({ registrationId: reg.id, name: 'Second Contact', email: 'second@example.com', createdAt: new Date(Date.now() + 5000) });
    const detail = await withViewer(admin, (tx) => getRegistration(tx, admin, reg.id));
    expect(detail.contacts.map((c) => c.name)).toEqual(['Second Contact', 'First Contact']);
  });
});

describe('resubmitRegistration', () => {
  it('moves a rejected registration back to review with the new contact', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await makeRegistration(db, { partnerId: partner.id, status: 'rejected' });
    const detail = await withViewer(admin, (tx) =>
      resubmitRegistration(tx, admin, { id: reg.id, contact: { name: 'Priya Shetty', role: 'CISO', email: 'priya@example.com' }, note: 'Added the budget owner' }, clock),
    );
    expect(detail).toMatchObject({ status: 'pending', stage: 'Awaiting review', resubmittedOn: '2026-11-06', rejectionReason: null, decidedOn: null, decidedByLabel: null });
    expect(detail.contacts[0]).toMatchObject({ name: 'Priya Shetty', role: 'CISO', email: 'priya@example.com' });
    expect(detail.history[0]).toMatchObject({ text: 'Resubmitted: Added the budget owner', byLabel: admin.name, source: 'portal' });
  });

  it('uses the default text without a note and refuses a registration that is not rejected', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: 'A' });
    const pending = await makeRegistration(db, { partnerId: partner.id, status: 'pending', customerName: 'B' });
    const contact = { name: 'X', role: null, email: 'x@example.com' };
    const done = await withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: rejected.id, contact, note: null }, clock));
    expect(done.history[0]?.text).toBe('Resubmitted with a new contact');
    await expect(withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: pending.id, contact, note: null }, clock))).rejects.toMatchObject({ reason: 'not_rejected' });
  });

  it('is blocked when an open registration for the same customer and product exists', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const rejected = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', customerName: 'Same Co', product: 'images' });
    await makeRegistration(db, { partnerId: partner.id, status: 'pending', customerName: 'same co', product: 'images' });
    const contact = { name: 'X', role: null, email: 'x@example.com' };
    await expect(withViewer(admin, (tx) => resubmitRegistration(tx, admin, { id: rejected.id, contact, note: null }, clock))).rejects.toMatchObject({ reason: 'duplicate_registration' });
    expect((await db.select().from(registrations).where(eq(registrations.id, rejected.id)))[0]?.status).toBe('rejected');
  });
});

describe('customerSuggestions', () => {
  it('returns the company\'s own customers, oldest registration first, and nothing of another company', async () => {
    const partner = await makePartner(db, {});
    const sales = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in', product: 'cleansight', status: 'accepted', registeredOn: '2026-10-14' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', product: 'libraries', status: 'pending', registeredOn: '2026-11-04' });
    await makeRegistration(db, { customerName: 'Vardhan Capital Rival' });
    const found = await withViewer(sales, (tx) => customerSuggestions(tx, sales, { q: 'vardhan' }));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ name: 'Vardhan Capital', website: 'vardhancapital.in' });
    expect(found[0]?.registrations.map((r) => r.product)).toEqual(['cleansight', 'libraries']);
  });

  it('is for partner users only', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(manager, (tx) => customerSuggestions(tx, manager, { q: 'x' }))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.create.test.ts`
Expected: FAIL, "Cannot find module './registrations'".

- [ ] **Step 10: Implement `src/server/repo/registrations.ts` (M2.1 part)**

```ts
// src/server/repo/registrations.ts
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { partners, registrationContacts, registrationEvents, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { normalizeDomain } from '@/lib/customer';
import {
  type DealRegion,
  PRODUCT_LABEL,
  type Product,
  type RegistrationStatus,
  STAGE_AWAITING_REVIEW,
} from '@/lib/domain';
import type { CustomerSuggestionDto, RegistrationDetailDto, RegistrationListItem } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { isUniqueViolation } from '@/server/registrations/pg-errors';
import { loadDetails, selectRows, toListItem } from '@/server/registrations/mappers';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listManagerOptions } from './staff';

export interface ListRegistrationsInput {
  status?: RegistrationStatus[];
  product?: Product;
  region?: DealRegion;
  managerId?: string;
  /** Staff only. */
  partnerId?: string;
  /** Matches customer and, for staff, partner name. */
  q?: string;
  limit?: number;
}

export interface NewRegistrationsInput {
  /** Staff only (register on a partner's behalf). Partner viewers always use their own company. */
  partnerId?: string;
  customer: string;
  website: string | null;
  products: Product[];
  region: DealRegion;
  /** Must be one of listManagerOptions(). Defaults to the manager whose scope covers `region`. */
  managerId?: string | null;
  contact: { name: string; role: string | null; email: string | null; phone: string | null } | null;
  expectedClose: string | null;
  notes: string | null;
}

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 1000;
const OPEN_STATUSES: RegistrationStatus[] = ['pending', 'accepted'];
const SUGGESTION_LIMIT = 8;

const escapeLike = (text: string): string => text.replace(/[\\%_]/g, (c) => `\\${c}`);
const clampLimit = (limit: number | undefined): number => Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

/**
 * Role scoping lives here: partner admin sees the company, partner sales only registered_by = viewer, staff sales
 * only their region, partner technical and marketing get ForbiddenError. Newest first by registeredAt.
 */
export async function listRegistrations(tx: Tx, viewer: Viewer, input: ListRegistrationsInput): Promise<RegistrationListItem[]> {
  const scope = registrationScope(viewer);
  if (input.partnerId !== undefined && viewer.kind !== 'staff') throw new ForbiddenError('the partner filter is staff only');
  const filters: Array<SQL | undefined> = [scope];
  if (input.status && input.status.length > 0) filters.push(inArray(registrations.status, input.status));
  if (input.product) filters.push(eq(registrations.product, input.product));
  if (input.region) filters.push(eq(registrations.region, input.region));
  if (input.managerId) filters.push(eq(registrations.managerId, input.managerId));
  if (input.partnerId) filters.push(eq(registrations.partnerId, input.partnerId));
  const q = input.q?.trim();
  if (q) {
    const like = `%${escapeLike(q)}%`;
    filters.push(viewer.kind === 'staff' ? or(ilike(registrations.customerName, like), ilike(partners.name, like)) : ilike(registrations.customerName, like));
  }
  const rows = await selectRows(tx)
    .where(and(...filters))
    .orderBy(desc(registrations.createdAt), desc(registrations.id))
    .limit(clampLimit(input.limit));
  return rows.map(toListItem);
}

/** Throws NotFoundError for another company's id and for a sales user's colleague's deal. */
export async function getRegistration(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  assertUuid(id, 'registration');
  const rows = await selectRows(tx).where(and(eq(registrations.id, id), registrationScope(viewer))).limit(1);
  const row = rows[0];
  if (!row) throw new NotFoundError('registration');
  const [detail] = await loadDetails(tx, [row]);
  if (!detail) throw new NotFoundError('registration');
  return detail;
}

/** Like getRegistration but SELECT ... FOR UPDATE on the registration row. For use before a state change. */
export async function lockRegistration(tx: Tx, viewer: Viewer, id: string): Promise<RegistrationDetailDto> {
  assertUuid(id, 'registration');
  const locked = await tx
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.id, id), registrationScope(viewer)))
    .limit(1)
    .for('update');
  if (!locked[0]) throw new NotFoundError('registration');
  return getRegistration(tx, viewer, id);
}

async function resolvePartnerId(viewer: Viewer, requested: string | undefined): Promise<string> {
  if (viewer.kind === 'partner') {
    if (requested !== undefined && requested !== viewer.partnerId) throw new ForbiddenError('partners register for their own company only');
    return viewer.partnerId;
  }
  if (!requested) throw new ValidationError([{ path: 'partnerId', message: 'Pick the partner.' }]);
  return requested;
}

/** The chosen manager if offered, else the partner's own manager when they cover the region, else the one covering the region. */
async function resolveManager(
  tx: Tx,
  viewer: Viewer,
  requested: string | null | undefined,
  region: DealRegion,
  partnerManagerId: string | null,
): Promise<string | null> {
  const options = await listManagerOptions(tx, viewer);
  if (requested) {
    if (!options.some((o) => o.id === requested)) {
      throw new ValidationError([{ path: 'managerId', message: 'Pick one of the listed account managers.' }]);
    }
    return requested;
  }
  const covering = options.filter((o) => o.region === region || o.region === 'all');
  const chosen =
    covering.find((o) => o.id === partnerManagerId) ??
    covering.find((o) => o.region === region) ??
    covering[0] ??
    options.find((o) => o.id === partnerManagerId) ??
    options[0];
  return chosen?.id ?? null;
}

const sameNameSql = (name: string): SQL => sql`lower(${registrations.customerName}) = ${name.toLowerCase()}`;

/**
 * One registration per product, status 'pending', stage 'Awaiting review', routing from the partner and region,
 * first event "Registered". Moves an 'onboarding' partner to 'active'. A unique violation on
 * (partner, lower(customer), product) while pending or accepted throws ConflictError('duplicate_registration').
 * Returns the created rows; the action audits (registration.submitted, one per product) and notifies the manager.
 */
export async function createRegistrations(
  tx: Tx,
  viewer: Viewer,
  input: NewRegistrationsInput,
  clock: Clock,
): Promise<RegistrationListItem[]> {
  const customer = input.customer.trim();
  if (!customer) throw new ValidationError([{ path: 'customer', message: "Enter the customer's company name." }]);
  const products = [...new Set(input.products)];
  if (products.length === 0) throw new ValidationError([{ path: 'products', message: 'Pick at least one product.' }]);

  const partnerId = await resolvePartnerId(viewer, input.partnerId);
  const [partner] = await tx
    .select({ id: partners.id, managerId: partners.managerId })
    .from(partners)
    .where(eq(partners.id, partnerId))
    .limit(1);
  if (!partner) throw new NotFoundError('partner');
  const managerId = await resolveManager(tx, viewer, input.managerId, input.region, partner.managerId);

  const taken = await tx
    .select({ product: registrations.product })
    .from(registrations)
    .where(
      and(
        eq(registrations.partnerId, partnerId),
        sameNameSql(customer),
        inArray(registrations.status, OPEN_STATUSES),
        inArray(registrations.product, products),
      ),
    );
  if (taken.length > 0) {
    throw new ConflictError(
      'duplicate_registration',
      `You already have an open registration for ${customer}: ${taken.map((t) => PRODUCT_LABEL[t.product]).join(', ')}.`,
    );
  }

  const now = clock.now();
  const created = products.map((product) => ({ id: randomUUID(), product }));
  try {
    await tx.insert(registrations).values(
      created.map(({ id, product }) => ({
        id,
        partnerId,
        registeredBy: viewer.id,
        registeredByName: viewer.name,
        customerName: customer,
        customerDomain: normalizeDomain(input.website),
        product,
        region: input.region,
        managerId,
        expectedClose: input.expectedClose,
        notes: input.notes,
        status: 'pending' as const,
        stage: STAGE_AWAITING_REVIEW,
        registeredOn: clock.today(),
        createdAt: now,
      })),
    );
  } catch (error) {
    if (isUniqueViolation(error, 'registrations_open_unique')) {
      throw new ConflictError('duplicate_registration', `You already have an open registration for ${customer}.`);
    }
    throw error;
  }

  if (input.contact) {
    const { name, role, email, phone } = input.contact;
    await tx.insert(registrationContacts).values(created.map(({ id }) => ({ registrationId: id, name, role, email, phone })));
  }
  await tx.insert(registrationEvents).values(
    created.map(({ id }) => ({ registrationId: id, at: now, text: 'Registered', byLabel: viewer.name, source: 'portal' as const })),
  );
  await tx.update(partners).set({ status: 'active' }).where(and(eq(partners.id, partnerId), eq(partners.status, 'onboarding')));

  const rows = await selectRows(tx)
    .where(inArray(registrations.id, created.map((c) => c.id)))
    .orderBy(asc(registrations.product));
  return rows.map(toListItem);
}

/** Rejected only. Adds the contact, sets status 'pending', stage 'Awaiting review', resubmittedOn today, clears the rejection. */
export async function resubmitRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; contact: { name: string; role: string | null; email: string }; note: string | null },
  clock: Clock,
): Promise<RegistrationDetailDto> {
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'rejected') {
    throw new ConflictError('not_rejected', 'Only a registration that was not accepted can be resubmitted.');
  }
  try {
    await tx
      .update(registrations)
      .set({
        status: 'pending',
        stage: STAGE_AWAITING_REVIEW,
        resubmittedOn: clock.today(),
        decidedBy: null,
        decidedByLabel: null,
        decidedAt: null,
        rejectionReason: null,
      })
      .where(and(eq(registrations.id, current.id), eq(registrations.status, 'rejected')));
  } catch (error) {
    if (isUniqueViolation(error, 'registrations_open_unique')) {
      throw new ConflictError('duplicate_registration', `You already have an open registration for ${current.customer}.`);
    }
    throw error;
  }
  const note = input.note?.trim();
  await tx.insert(registrationContacts).values({
    registrationId: current.id,
    name: input.contact.name,
    role: input.contact.role,
    email: input.contact.email,
    createdAt: clock.now(),
  });
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: clock.now(),
    text: note ? `Resubmitted: ${note}` : 'Resubmitted with a new contact',
    byLabel: viewer.name,
    source: 'portal',
  });
  return getRegistration(tx, viewer, current.id);
}

/** The customers this company already registered, for the form's lookup. Partner viewers only; never another company's data. */
export async function customerSuggestions(tx: Tx, viewer: Viewer, input: { q: string }): Promise<CustomerSuggestionDto[]> {
  if (viewer.kind !== 'partner' || viewer.role === 'technical') throw new ForbiddenError('customer lookup is for partner sales and admin');
  const q = input.q.trim();
  const like = `%${escapeLike(q)}%`;
  const rows = await tx
    .select({
      id: registrations.id,
      name: registrations.customerName,
      website: registrations.customerDomain,
      product: registrations.product,
      status: registrations.status,
      protectionEnd: registrations.protectionEnd,
    })
    .from(registrations)
    .where(and(eq(registrations.partnerId, viewer.partnerId), q ? or(ilike(registrations.customerName, like), ilike(registrations.customerDomain, like)) : undefined))
    .orderBy(asc(registrations.createdAt), asc(registrations.id));
  const byName = new Map<string, CustomerSuggestionDto>();
  for (const row of rows) {
    const key = row.name.toLowerCase();
    const entry = byName.get(key) ?? { name: row.name, website: null, registrations: [] };
    entry.website = entry.website ?? row.website;
    entry.registrations.push({ id: row.id, product: row.product, status: row.status, protectionEnd: row.protectionEnd });
    byName.set(key, entry);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name)).slice(0, SUGGESTION_LIMIT);
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<
  'listRegistrations' | 'getRegistration' | 'lockRegistration' | 'createRegistrations' | 'resubmitRegistration' | 'customerSuggestions'
>({
  listRegistrations: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await listRegistrations(tx, viewer, { limit: 1000 })).filter((r) => r.partnerId !== viewer.partnerId),
  },
  getRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getRegistration(tx, viewer, ctx.b.registrationId) },
  lockRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => lockRegistration(tx, viewer, ctx.b.registrationId) },
  createRegistrations: {
    scope: 'tenant',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) =>
      createRegistrations(
        tx,
        viewer,
        { partnerId: ctx.b.partnerId, customer: 'Isolation Probe', website: null, products: ['images'], region: 'india', contact: null, expectedClose: null, notes: null },
        probeClock,
      ),
  },
  resubmitRegistration: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) =>
      resubmitRegistration(tx, viewer, { id: ctx.b.registrationId, contact: { name: 'Probe', role: null, email: 'probe@example.com' }, note: null }, probeClock),
  },
  customerSuggestions: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await customerSuggestions(tx, viewer, { q: '' })).flatMap((s) => s.registrations).filter((r) => r.id === ctx.b.registrationId),
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.create.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 11: Run the isolation matrix**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts`
Expected: PASS, and the `registrations` file appears in the output with both of its tests green. Failure "registrations.ts must export `isolation`" or a key mismatch means a function is exported but not registered (or the reverse).

- [ ] **Step 12: Write the failing action tests**

```ts
// src/server/actions/registrations.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
const crm = vi.hoisted(() => ({ hs: null as import('@/server/hubspot/types').HubspotApi | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));
vi.mock('@/server/hubspot/client', () => ({
  createHubspot: () => {
    if (!crm.hs) throw new Error('HUBSPOT_PORTAL_TOKEN is not set');
    return crm.hs;
  },
}));

import { auditLog, notifications, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { FakeHubspot } from '@/server/hubspot/fake';
import { lookupCustomerAction, registerDealsAction, resubmitRegistrationAction } from './registrations';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  crm.hs = null;
  session.viewer = null;
});

const form = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  customer: 'Vardhan Capital',
  website: 'vardhancapital.in',
  products: ['libraries', 'cleansight'],
  region: 'india',
  managerId: null,
  contact: { name: 'Rohan Mehta', role: null, email: 'rohan.mehta@vardhancapital.in', phone: null },
  expectedClose: '',
  notes: '',
  ...over,
});

describe('registerDealsAction', () => {
  it('creates the registrations, audits each, tells the manager in the app and by one email', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    const result = await registerDealsAction(form());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(2);
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.submitted'));
    expect(audit).toHaveLength(2);
    expect(audit[0]).toMatchObject({ kind: 'deal_decisions', who: 'partner', subjectType: 'registration' });
    const notes = await db.select().from(notifications).where(eq(notifications.userId, manager.id));
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ kind: 'registration_submitted', link: '/admin/approvals' });
    const mails = mail.transport!.to(manager.email);
    expect(mails).toHaveLength(1);
    expect(mails[0]?.htmlContent).toContain('Vardhan Capital');
  });

  it('returns validation issues with field paths', async () => {
    await asStaff(db, 'partner_manager', 'india');
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    const result = await registerDealsAction(form({ customer: '', website: 'not a domain', contact: { name: 'X', role: null, email: 'bad', phone: null } }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('validation');
    expect(result.error.issues?.map((i) => i.path).sort()).toEqual(['contact.email', 'customer', 'website']);
  });

  it('is forbidden for the technical role and reports a duplicate as a conflict', async () => {
    await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await registerDealsAction(form())).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    expect((await registerDealsAction(form({ products: ['libraries'] }))).ok).toBe(true);
    expect(await registerDealsAction(form({ products: ['libraries'] }))).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await db.select().from(registrations)).toHaveLength(1);
  });

  it('still registers when no manager exists and no fallback address is configured, and sends no email', async () => {
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    const result = await registerDealsAction(form({ products: ['images'] }));
    expect(result.ok).toBe(true);
    expect(mail.transport!.sent).toHaveLength(0);
  });
});

describe('resubmitRegistrationAction', () => {
  it('puts a rejected registration back in the queue and alerts the manager', async () => {
    const manager = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = viewer;
    const reg = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', managerId: manager.id });
    const result = await resubmitRegistrationAction({ id: reg.id, contact: { name: 'Priya Shetty', role: null, email: 'priya@example.com' }, note: 'Added the budget owner' });
    expect(result.ok).toBe(true);
    expect((await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]?.status).toBe('pending');
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.resubmitted')))).toHaveLength(1);
    expect(mail.transport!.to(manager.email)).toHaveLength(1);
  });

  it('refuses a colleague\'s deal for a sales user and another company\'s deal', async () => {
    const partner = await makePartner(db, {});
    const admin = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const theirs = await makeRegistration(db, { partnerId: partner.id, status: 'rejected', registeredBy: admin.id });
    const foreign = await makeRegistration(db, { status: 'rejected' });
    const payload = { contact: { name: 'X', role: null, email: 'x@example.com' }, note: null };
    expect(await resubmitRegistrationAction({ id: theirs.id, ...payload })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await resubmitRegistrationAction({ id: foreign.id, ...payload })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('lookupCustomerAction', () => {
  it('returns the company\'s own customers and HubSpot name and website only', async () => {
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in' });
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Holdings', domain: 'holdings.vardhancapital.in', properties: { owner: 'secret' } });
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: 'vardhancapital.in', properties: {} });
    crm.hs = hs;
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.own.map((o) => o.name)).toEqual(['Vardhan Capital']);
    expect(result.data.crm).toEqual([{ name: 'Vardhan Capital Holdings', website: 'holdings.vardhancapital.in' }]);
  });

  it('gives a user of another company the same shape and none of the first company\'s data', async () => {
    const first = await makePartner(db, {});
    await makeRegistration(db, { partnerId: first.id, customerName: 'Vardhan Capital' });
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    crm.hs = new FakeHubspot();
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result).toEqual({ ok: true, data: { own: [], crm: [] } });
  });

  it('keeps working from the portal data when HubSpot is not configured', async () => {
    const partner = await makePartner(db, {});
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital' });
    const result = await lookupCustomerAction({ q: 'vardhan' });
    expect(result.ok && result.data.own).toHaveLength(1);
    expect(result.ok && result.data.crm).toEqual([]);
  });

  it('allows 10 lookups a minute per user and refuses the 11th', async () => {
    session.viewer = await asPartner(db, { role: 'partner_admin' });
    for (let i = 0; i < 10; i += 1) expect((await lookupCustomerAction({ q: 'abc' })).ok).toBe(true);
    expect(await lookupCustomerAction({ q: 'abc' })).toMatchObject({ ok: false, error: { code: 'rate_limited' } });
  });

  it('is not for the technical role', async () => {
    session.viewer = await asPartner(db, { role: 'technical' });
    expect(await lookupCustomerAction({ q: 'abc' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/registrations.test.ts`
Expected: FAIL, "Cannot find module './registrations'".

- [ ] **Step 13: Implement `src/server/actions/registrations.ts`**

```ts
// src/server/actions/registrations.ts
'use server';

import { z } from 'zod';
import type { CustomerLookupResult } from '@/components/deals/types';
import { normalizeDomain, sameCustomer } from '@/lib/customer';
import { DEAL_REGIONS, PRODUCT_LABEL, PRODUCTS } from '@/lib/domain';
import type { RegistrationListItem } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { type NewNotification, notifyUsers } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { crmSuggestions } from '@/server/registrations/customer-lookup';
import { readOnlyHubspot } from '@/server/registrations/hubspot-read';
import { sendSubmissionAlert } from '@/server/registrations/staff-alert';
import { withViewer } from '@/server/repo/context';
import {
  createRegistrations,
  customerSuggestions,
  lockRegistration,
  resubmitRegistration,
} from '@/server/repo/registrations';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** A blank text box is "not set". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

const registerSchema = z.object({
  partnerId: z.string().uuid().optional(),
  customer: z.string().trim().min(1, "Enter the customer's company name.").max(200),
  website: optionalText(200).refine((v) => v === null || normalizeDomain(v) !== null, 'Enter a website such as vardhancapital.in.'),
  products: z.array(z.enum(PRODUCTS)).min(1, 'Pick at least one product.'),
  region: z.enum(DEAL_REGIONS),
  managerId: z.string().uuid().nullish().transform((value) => value ?? null),
  contact: z
    .object({
      name: z.string().trim().min(1, 'Enter the contact name.').max(120),
      role: optionalText(120),
      email: optionalText(254).refine((v) => v === null || EMAIL.test(v), 'Enter a valid email.'),
      phone: optionalText(40),
    })
    .nullable(),
  expectedClose: optionalText(60),
  notes: optionalText(2000),
});

export async function registerDealsAction(raw: unknown): Promise<ActionResult<RegistrationListItem[]>> {
  return runViewerAction({ name: 'registration.register', schema: registerSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      assertCan(ctx.viewer, 'registration.create', {
        partnerId: ctx.viewer.kind === 'partner' ? ctx.viewer.partnerId : (input.partnerId ?? null),
      });
      const created = await createRegistrations(
        tx,
        ctx.viewer,
        {
          ...(input.partnerId ? { partnerId: input.partnerId } : {}),
          customer: input.customer,
          website: input.website,
          products: input.products,
          region: input.region,
          managerId: input.managerId,
          contact: input.contact,
          expectedClose: input.expectedClose,
          notes: input.notes,
        },
        ctx.clock,
      );
      for (const reg of created) {
        await recordAudit(tx, ctx.viewer, {
          event: 'registration.submitted',
          target: `${reg.customer}, ${PRODUCT_LABEL[reg.product]}, from ${reg.partnerName}`,
          note: 'Sent for approval. CleanStart reviews it within 2 business days.',
          partnerId: reg.partnerId,
          subject: { type: 'registration', id: reg.id },
        });
      }
      const first = created[0];
      const items: NewNotification[] =
        first?.managerId
          ? [
              {
                userId: first.managerId,
                kind: 'registration_submitted',
                title: `${first.partnerName} registered ${first.customer}`,
                body: created.map((r) => PRODUCT_LABEL[r.product]).join(', '),
                link: ROUTES.admin.approvals,
              },
            ]
          : [];
      await notifyUsers(tx, items);
      return { created, items };
    });

    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.admin.approvals);
    const first = outcome.created[0];
    if (first) {
      ctx.afterCommit(() =>
        sendSubmissionAlert({
          partnerName: first.partnerName,
          customer: first.customer,
          products: outcome.created.map((r) => r.product),
          region: first.region,
          registeredByName: first.registeredByName,
          resubmitted: false,
          items: outcome.items,
        }),
      );
    }
    return outcome.created;
  });
}

const resubmitSchema = z.object({
  id: z.string().uuid(),
  contact: z.object({
    name: z.string().trim().min(1, 'Enter the contact name.').max(120),
    role: optionalText(120),
    email: z.string().trim().regex(EMAIL, 'Enter a valid work email.'),
  }),
  note: optionalText(500),
});

export async function resubmitRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationListItem>> {
  return runViewerAction({ name: 'registration.resubmit', schema: resubmitSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.resubmit', { partnerId: current.partnerId, ownerUserId: current.registeredById });
      const updated = await resubmitRegistration(tx, ctx.viewer, input, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.resubmitted',
        target: `${updated.customer}, ${PRODUCT_LABEL[updated.product]}, from ${updated.partnerName}`,
        note: `New contact ${input.contact.name} added.`,
        partnerId: updated.partnerId,
        subject: { type: 'registration', id: updated.id },
      });
      const items: NewNotification[] = updated.managerId
        ? [
            {
              userId: updated.managerId,
              kind: 'registration_resubmitted',
              title: `${updated.partnerName} resubmitted ${updated.customer}`,
              body: PRODUCT_LABEL[updated.product],
              link: ROUTES.admin.approvals,
            },
          ]
        : [];
      await notifyUsers(tx, items);
      return { updated, items };
    });
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(outcome.updated.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(() =>
      sendSubmissionAlert({
        partnerName: outcome.updated.partnerName,
        customer: outcome.updated.customer,
        products: [outcome.updated.product],
        region: outcome.updated.region,
        registeredByName: outcome.updated.registeredByName,
        resubmitted: true,
        items: outcome.items,
      }),
    );
    return outcome.updated;
  });
}

const lookupSchema = z.object({ q: z.string().trim().min(2).max(100) });

export async function lookupCustomerAction(raw: unknown): Promise<ActionResult<CustomerLookupResult>> {
  return runViewerAction({ name: 'registration.lookup_customer', schema: lookupSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'registration.lookup_customer');
    rateLimit(`lookup:user:${ctx.viewer.id}`, { limit: 10, windowSeconds: 60 });
    const own = await withViewer(ctx.viewer, (tx) => customerSuggestions(tx, ctx.viewer, { q: input.q }));
    const crm = await crmSuggestions(readOnlyHubspot(), input.q);
    return { own, crm: crm.filter((c) => !own.some((o) => sameCustomer(o.name, c.name))) };
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/registrations.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 14: Convert the pages**

`src/app/partner/deals/page.tsx` (complete file):

```tsx
import type { Metadata } from "next";
import { Deals } from "@/components/screens/Deals";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { getShell } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read");
  const { deals, shell } = await withViewer(viewer, async (tx) => ({
    deals: await listRegistrations(tx, viewer, { limit: 1000 }),
    shell: await getShell(tx, viewer),
  }));
  return (
    <Deals
      deals={deals}
      today={systemClock.today()}
      partnerManager={shell.manager ? { name: shell.manager.name, team: shell.manager.team } : null}
      senderEmail={shell.viewerEmail}
    />
  );
}
```

`src/app/partner/deals/new/page.tsx` (complete file):

```tsx
import type { Metadata } from "next";
import { RegisterDeal } from "@/components/screens/RegisterDeal";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listRegistrations } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Register a deal" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.create");
  const { mine, managers } = await withViewer(viewer, async (tx) => ({
    mine: await listRegistrations(tx, viewer, { limit: 1000 }),
    managers: await listManagerOptions(tx, viewer),
  }));
  return <RegisterDeal mine={mine} managers={managers} partnerName={viewer.partnerName ?? ""} today={systemClock.today()} />;
}
```

- [ ] **Step 15: Edit `ManagerMessageDrawer.tsx`**

Edit 1, imports. Before:

```tsx
import { useState } from "react";
import { Icon } from "../icon";
import type { Persona } from "../shell/personas";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
```

After:

```tsx
import { useState } from "react";
import { sendManagerMessageAction } from "@/server/actions/partners";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { initialsOf } from "./derive";
import type { ManagerContact } from "./types";
```

Edit 2, props and head of the component. Before:

```tsx
export function ManagerMessageDrawer({
  persona,
  initialSubject,
  onClose,
}: {
  persona: Persona;
  initialSubject: string;
  onClose: () => void;
}): React.JSX.Element | null {
  const toast = useToast();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const manager = persona.manager;
  if (!manager) return null;
  const invalid = tried && !body.trim();

  const send = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    toast(`Message sent to ${manager.name}`);
    onClose();
  };
```

After:

```tsx
export function ManagerMessageDrawer({
  manager,
  senderEmail,
  initialSubject,
  onClose,
}: {
  manager: ManagerContact;
  senderEmail: string;
  initialSubject: string;
  onClose: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const invalid = tried && !body.trim();

  const send = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!body.trim()) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await sendManagerMessageAction({ subject, body });
    setBusy(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    toast(`Message sent to ${manager.name}`);
    onClose();
  };
```

Edit 3, the drawer lead and footer. Before:

```tsx
      lead={<span className="av av-2">{manager.initials}</span>}
```
After:
```tsx
      lead={<span className="av av-2">{initialsOf(manager.name)}</span>}
```

Before:
```tsx
          <span className="hint">
            Sent from {persona.user.toLowerCase().replace(" ", ".")}@{persona.org.toLowerCase().replace(/\s+/g, "")}.com
          </span>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p">
            <Icon name="send" />
            Send
          </button>
```
After:
```tsx
          <span className="hint">Sent from {senderEmail}</span>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            <Icon name="send" />
            Send
          </button>
```

The subtitle line `subtitle={\`Your CleanStart partner manager, ${manager.team.replace("CleanStart ", "")}. Replies come to your email.\`}` and the title `Message ${manager.name}` are unchanged.

- [ ] **Step 16: Edit `RejectedDealDrawer.tsx`**

Edit 1, imports. Before:

```tsx
import { useState } from "react";
import { type Deal, resubmitDeal } from "@/data/deals";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { fmtShort } from "./dates";
```

After:

```tsx
import { useState } from "react";
import { PRODUCT_LABEL } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { resubmitRegistrationAction } from "@/server/actions/registrations";
import { Icon } from "../icon";
import { Drawer } from "../ui/overlay";
import { useToast } from "../ui/toast";
import { fmtShort } from "./dates";
import { firstWord } from "./derive";
```

Edit 2, props through `decided`. Before:

```tsx
  deal: Deal;
  onClose: () => void;
  onMessage: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const nameErr = tried && !name.trim();
  const emailErr = tried && !EMAIL.test(email.trim());

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!name.trim() || !EMAIL.test(email.trim())) {
      setTried(true);
      return;
    }
    resubmitDeal(deal.id, { name, title, email, note });
    toast("Resubmitted. CleanStart will review it again.");
    onClose();
  };

  const decided = deal.decidedOn ? ` Not accepted on ${fmtShort(deal.decidedOn)} by ${deal.decidedBy ?? "CleanStart"}.` : "";
```

After:

```tsx
  deal: RegistrationListItem;
  onClose: () => void;
  onMessage: () => void;
}): React.JSX.Element {
  const toast = useToast();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameErr = tried && !name.trim();
  const emailErr = tried && !EMAIL.test(email.trim());

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!name.trim() || !EMAIL.test(email.trim())) {
      setTried(true);
      return;
    }
    setBusy(true);
    const result = await resubmitRegistrationAction({
      id: deal.id,
      contact: { name, role: title, email },
      note,
    });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    toast("Resubmitted. CleanStart will review it again.");
    onClose();
  };

  const decided = deal.decidedOn
    ? ` Not accepted on ${fmtShort(deal.decidedOn)} by ${deal.decidedByLabel ?? "CleanStart"}.`
    : "";
```

Edit 3, subtitle and footer. Before: `subtitle={\`${deal.product}.${decided}\`}` After: `subtitle={\`${PRODUCT_LABEL[deal.product]}.${decided}\`}`.

Before:
```tsx
          <button type="button" className="btn btn-g" onClick={onMessage} style={{ marginRight: "auto" }}>
            Message Farhan
          </button>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p">
            Resubmit
          </button>
```
After:
```tsx
          <button type="button" className="btn btn-g" onClick={onMessage} style={{ marginRight: "auto" }}>
            Message {firstWord(deal.managerName ?? "your partner manager")}
          </button>
          <button type="button" className="btn btn-s" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-p" disabled={busy}>
            Resubmit
          </button>
```

Edit 4, the server error below the note field. Before:

```tsx
        <textarea id="rs-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Drawer>
```
After:
```tsx
        <textarea id="rs-note" className="field" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {formError ? (
        <span className="err" role="alert">
          {formError}
        </span>
      ) : null}
    </Drawer>
```

- [ ] **Step 17: Edit `Deals.tsx`**

Edit 1, imports. Before:

```tsx
import Link from "next/link";
import { useMemo, useState } from "react";
import { type Deal, type DealStatus, useDeals } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { downloadCsv } from "../deals/csv";
import { fmtShort } from "../deals/dates";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { protectionView } from "../deals/derive";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import { Icon } from "../icon";
import { KESTREL } from "../shell/personas";
import { ProductChip } from "../ui/badge";
```

After:

```tsx
import Link from "next/link";
import { useState } from "react";
import { PARTNER_REGION_LABEL, PRODUCT_LABEL, REGISTRATION_STATUS_LABEL } from "@/lib/domain";
import type { RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { downloadCsv } from "../deals/csv";
import { fmtShort } from "../deals/dates";
import { CHIP_PRODUCT, protectionView } from "../deals/derive";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import type { ManagerContact } from "../deals/types";
import { Icon } from "../icon";
import { ProductChip } from "../ui/badge";
```

(The `Dropdown` and `useToast` import lines below it stay.)

Edit 2, constants and the head of the component. Before:

```tsx
const MANAGER_OPTIONS = [ANY_MANAGER, "Farhan Qureshi", "Omar Nasser"];

function protectionText(deal: Deal): string {
  const view = protectionView(deal, "deals");
  return `${view.until} ${view.left}`.trim();
}

export function Deals(): React.JSX.Element {
  const toast = useToast();
  const all = useDeals();
  const deals = useMemo(() => all.filter((d) => d.partner === KESTREL.org), [all]);
```

After:

```tsx
function protectionText(deal: RegistrationListItem, today: string): string {
  const view = protectionView(deal, "deals", today);
  return `${view.until} ${view.left}`.trim();
}

interface DealsProps {
  deals: RegistrationListItem[];
  today: string;
  partnerManager: ManagerContact | null;
  senderEmail: string;
}

export function Deals({ deals, today, partnerManager, senderEmail }: DealsProps): React.JSX.Element {
  const toast = useToast();
  const managerOptions = [ANY_MANAGER, ...new Set(deals.flatMap((d) => (d.managerName ? [d.managerName] : [])))];
```

Edit 3, filtering. Before:

```tsx
      (tab === "All" || d.status === tab) &&
      (!needle || d.customer.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || d.product === product) &&
      (region === ALL_REGIONS || d.region === region) &&
      (manager === ANY_MANAGER || d.manager === manager),
```
After:
```tsx
      (tab === "All" || REGISTRATION_STATUS_LABEL[d.status] === tab) &&
      (!needle || d.customer.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[d.product] === product) &&
      (region === ALL_REGIONS || PARTNER_REGION_LABEL[d.region] === region) &&
      (manager === ANY_MANAGER || d.managerName === manager),
```

Before:
```tsx
    label === "All" ? deals.length : deals.filter((d) => d.status === (label as DealStatus)).length;
  const rejected = deals.find((d) => d.id === rejectedId && d.status === "Rejected");
```
After:
```tsx
    label === "All" ? deals.length : deals.filter((d) => REGISTRATION_STATUS_LABEL[d.status] === label).length;
  const rejected = deals.find((d) => d.id === rejectedId && d.status === "rejected");
```

Edit 4, the CSV rows. Before:

```tsx
      ...rows.map((d) => [
        d.customer,
        d.product,
        d.status,
        d.stage,
        d.manager,
        d.registeredBy ?? "",
        fmtShort(d.registered),
        protectionText(d),
      ]),
```
After:
```tsx
      ...rows.map((d) => [
        d.customer,
        PRODUCT_LABEL[d.product],
        REGISTRATION_STATUS_LABEL[d.status],
        d.stage,
        d.managerName ?? "",
        d.registeredByName,
        fmtShort(d.registeredOn),
        protectionText(d, today),
      ]),
```

Edit 5, the manager filter. Before: `options={MANAGER_OPTIONS}` After: `options={managerOptions}`.

Edit 6, the table row. Before:

```tsx
                    {d.status === "Rejected" ? (
```
After:
```tsx
                    {d.status === "rejected" ? (
```

Before:
```tsx
                    <ProductChip product={d.product} />
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="t-sec">{d.stage}</td>
                  <td className="t-sec">{d.manager}</td>
                  <td className="t-sec">{d.registeredBy}</td>
                  <td className="tnum r t-sec">{fmtShort(d.registered)}</td>
                  <ProtectionCell deal={d} mode="deals" />
```
After:
```tsx
                    <ProductChip product={CHIP_PRODUCT[d.product]} />
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="t-sec">{d.stage}</td>
                  <td className="t-sec">{d.managerName}</td>
                  <td className="t-sec">{d.registeredByName}</td>
                  <td className="tnum r t-sec">{fmtShort(d.registeredOn)}</td>
                  <ProtectionCell deal={d} mode="deals" today={today} />
```

Edit 7, the drawers. Before:

```tsx
            setMessageSubject(`${rejected.customer}, ${rejected.product}`);
```
After:
```tsx
            setMessageSubject(`${rejected.customer}, ${PRODUCT_LABEL[rejected.product]}`);
```

Before:
```tsx
      {messageSubject !== null ? (
        <ManagerMessageDrawer
          key={messageSubject}
          persona={KESTREL}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
```
After:
```tsx
      {messageSubject !== null && partnerManager ? (
        <ManagerMessageDrawer
          key={messageSubject}
          manager={partnerManager}
          senderEmail={senderEmail}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
```

Nothing else in the file changes: tabs, toolbar, empty state, `data-tour` attributes and classes stay.

- [ ] **Step 18: Edit `RegisterDeal.tsx`, part A (everything except the remote suggestions)**

Edit 1, imports. Before:

```tsx
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type Deal,
  type ManagerName,
  PRODUCTS,
  type ProductName,
  type Region,
  registerDeals,
  useDeals,
} from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { fmtLong, fmtShort } from "../deals/dates";
import { protectionView, reviewSince, sameCustomer } from "../deals/derive";
import { ProductMark, StatusBadge } from "../deals/parts";
import { Icon } from "../icon";
import { KESTREL } from "../shell/personas";
import { Dropdown } from "../ui/dropdown";
```

After:

```tsx
import Link from "next/link";
import { useMemo, useState } from "react";
import { DEAL_REGIONS, type DealRegion, PARTNER_REGION_LABEL, PRODUCT_LABEL, PRODUCTS, type Product } from "@/lib/domain";
import type { ManagerOptionDto, RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { registerDealsAction } from "@/server/actions/registrations";
import { issuesToErrors } from "@/server/actions/result";
import { fmtLong, fmtShort } from "../deals/dates";
import { managerFor, protectionView, reviewSince, sameCustomer } from "../deals/derive";
import { ProductMark, StatusBadge } from "../deals/parts";
import { Icon } from "../icon";
import { Dropdown } from "../ui/dropdown";
```

Edit 2, from `PRODUCT_DESC` to `dealMeta`. Before:

```tsx
const PRODUCT_DESC: Record<ProductName, string> = {
  "CleanStart Images": "Zero-CVE hardened images",
  "Clean Libraries": "Verified dependencies",
  CleanSight: "Vulnerability detection",
};
const REGIONS: readonly Region[] = ["India", "Middle East"];
const MANAGERS: readonly ManagerName[] = ["Farhan Qureshi", "Omar Nasser"];

interface FormState {
  customer: string;
  site: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  picked: ProductName[];
  region: Region;
  manager: ManagerName;
  close: string;
  details: string;
}

const PREFILLED: FormState = {
  customer: "Vardhan Capital",
  site: "vardhancapital.in",
  contactName: "Rohan Mehta",
  contactEmail: "rohan.mehta@vardhancapital.in",
  contactPhone: "+91 98204 31786",
  picked: ["CleanSight"],
  region: "India",
  manager: "Farhan Qureshi",
  close: "March 2027",
  details: "Security team wants vulnerability detection across the payments cluster ahead of the Q1 audit.",
};

const BLANK: FormState = {
  customer: "",
  site: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  picked: [],
  region: "India",
  manager: "Farhan Qureshi",
  close: "",
  details: "",
};

interface Submitted {
  customer: string;
  products: ProductName[];
}

function dealMeta(deal: Deal): string {
  if (deal.status === "Accepted" && deal.protectionEnd) return `Protected until ${fmtLong(deal.protectionEnd)}`;
  if (deal.status === "Pending") return `Sent ${fmtShort(reviewSince(deal))}`;
  return protectionView(deal, "overview").until;
}
```

After:

```tsx
const PRODUCT_DESC: Record<Product, string> = {
  images: "Zero-CVE hardened images",
  libraries: "Verified dependencies",
  cleansight: "Vulnerability detection",
};

interface FormState {
  customer: string;
  site: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  picked: Product[];
  region: DealRegion;
  managerId: string;
  close: string;
  details: string;
}

const BLANK: FormState = {
  customer: "",
  site: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  picked: [],
  region: "india",
  managerId: "",
  close: "",
  details: "",
};

interface Submitted {
  customer: string;
  products: Product[];
}

function dealMeta(deal: RegistrationListItem, today: string): string {
  if (deal.status === "accepted" && deal.protectionEnd) return `Protected until ${fmtLong(deal.protectionEnd)}`;
  if (deal.status === "pending") return `Sent ${fmtShort(reviewSince(deal))}`;
  return protectionView(deal, "overview", today).until;
}
```

The form now starts blank (the mock started prefilled with demo values for the walkthrough).

Edit 3, the component head through `submit`. Before:

```tsx
export function RegisterDeal(): React.JSX.Element {
  const toast = useToast();
  const all = useDeals();
  const mine = useMemo(() => all.filter((d) => d.partner === KESTREL.org), [all]);
  const [form, setForm] = useState<FormState>(PREFILLED);
  const [tried, setTried] = useState(false);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const patch = (change: Partial<FormState>): void => setForm((prev) => ({ ...prev, ...change }));
  const customer = form.customer.trim();
  const needle = customer.toLowerCase();

  const known = useMemo(() => {
    const byName = new Map<string, { name: string; site: string; deals: Deal[] }>();
    for (const d of mine) {
      const key = d.customer.toLowerCase();
      const entry = byName.get(key) ?? { name: d.customer, site: "", deals: [] };
      entry.site = entry.site || d.website || "";
      entry.deals.push(d);
      byName.set(key, entry);
    }
    return [...byName.values()];
  }, [mine]);

  const exact = known.find((c) => c.name.toLowerCase() === needle);
  const exactDeals = exact ? [...exact.deals].sort((a, b) => a.registered.localeCompare(b.registered)) : [];
  const suggestions =
    needle.length >= 2 && !exact
      ? known.filter((c) => `${c.name} ${c.site}`.toLowerCase().includes(needle)).slice(0, 5)
      : [];

  const held = form.picked.flatMap((product) => {
    const deal = mine.find((d) => sameCustomer(d.customer, customer) && d.product === product && d.status === "Accepted");
    return deal?.protectionEnd ? [{ deal, end: deal.protectionEnd }] : [];
  });

  const customerErr = tried && !customer;
  const productErr = tried && form.picked.length === 0;

  const togglePicked = (product: ProductName): void =>
    patch({ picked: form.picked.includes(product) ? form.picked.filter((p) => p !== product) : [...form.picked, product] });

  const submit = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!customer || form.picked.length === 0) {
      setTried(true);
      return;
    }
    const created = registerDeals({
      customer,
      website: form.site,
      products: form.picked,
      region: form.region,
      manager: form.manager,
      contactName: form.contactName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      notes: form.details,
    });
    setSubmitted({ customer, products: created.map((d) => d.product) });
    setTried(false);
    toast(created.length > 1 ? `${created.length} registrations sent for approval` : "Submitted for approval");
  };
```

After:

```tsx
interface RegisterDealProps {
  mine: RegistrationListItem[];
  managers: ManagerOptionDto[];
  partnerName: string;
  today: string;
}

export function RegisterDeal({ mine, managers, partnerName, today }: RegisterDealProps): React.JSX.Element {
  const toast = useToast();
  const [form, setForm] = useState<FormState>({ ...BLANK, managerId: managerFor(managers, "india") });
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  const patch = (change: Partial<FormState>): void => setForm((prev) => ({ ...prev, ...change }));
  const customer = form.customer.trim();
  const needle = customer.toLowerCase();

  const known = useMemo(() => {
    const byName = new Map<string, { name: string; site: string; count: number }>();
    for (const d of mine) {
      const key = d.customer.toLowerCase();
      const entry = byName.get(key) ?? { name: d.customer, site: "", count: 0 };
      entry.site = entry.site || d.website || "";
      entry.count += 1;
      byName.set(key, entry);
    }
    return [...byName.values()];
  }, [mine]);

  const exact = known.find((c) => c.name.toLowerCase() === needle);
  const exactDeals = mine
    .filter((d) => sameCustomer(d.customer, customer))
    .sort((a, b) => a.registeredOn.localeCompare(b.registeredOn));
  const suggestions =
    needle.length >= 2 && !exact
      ? known.filter((c) => `${c.name} ${c.site}`.toLowerCase().includes(needle)).slice(0, 5)
      : [];

  const held = form.picked.flatMap((product) => {
    const deal = mine.find(
      (d) => sameCustomer(d.customer, customer) && d.product === product && (d.status === "accepted" || d.status === "pending"),
    );
    return deal ? [{ deal }] : [];
  });

  const customerErr = tried && !customer;
  const productErr = tried && form.picked.length === 0;

  const togglePicked = (product: Product): void =>
    patch({ picked: form.picked.includes(product) ? form.picked.filter((p) => p !== product) : [...form.picked, product] });

  const submit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!customer || form.picked.length === 0) {
      setTried(true);
      return;
    }
    if (held.length > 0) {
      setFormError("Take the products you already registered for this customer out of your picks to continue.");
      return;
    }
    setBusy(true);
    const result = await registerDealsAction({
      customer,
      website: form.site,
      products: form.picked,
      region: form.region,
      managerId: form.managerId || null,
      contact: form.contactName.trim()
        ? { name: form.contactName, role: null, email: form.contactEmail, phone: form.contactPhone }
        : null,
      expectedClose: form.close,
      notes: form.details,
    });
    setBusy(false);
    if (!result.ok) {
      setErrors(issuesToErrors(result.error));
      setFormError(result.error.issues?.length ? null : result.error.message);
      return;
    }
    setErrors({});
    setFormError(null);
    setSubmitted({ customer, products: result.data.map((d) => d.product) });
    setTried(false);
    toast(result.data.length > 1 ? `${result.data.length} registrations sent for approval` : "Submitted for approval");
  };
```

Edit 4, the success card. Before: `{submitted.customer}: {submitted.products.join(", ")}.{" "}` After: `{submitted.customer}: {submitted.products.map((p) => PRODUCT_LABEL[p]).join(", ")}.{" "}`.

Edit 5, the suggestions list entry. Before: `{c.site}, {c.deals.length} {c.deals.length === 1 ? "deal" : "deals"} with you` After: `{c.site}, {c.count} {c.count === 1 ? "deal" : "deals"} with you`.

Edit 6, the website field. Before:

```tsx
                      <input
                        id="site"
                        className="field"
                        type="text"
                        value={form.site}
                        onChange={(e) => patch({ site: e.target.value })}
                      />
```
After:
```tsx
                      <input
                        id="site"
                        className={`field${errors.website ? " field-err" : ""}`}
                        type="text"
                        value={form.site}
                        onChange={(e) => patch({ site: e.target.value })}
                        aria-invalid={errors.website ? true : undefined}
                        aria-describedby={errors.website ? "site-err" : undefined}
                      />
                      {errors.website ? (
                        <span className="err" id="site-err">
                          {errors.website}
                        </span>
                      ) : null}
```

Edit 7, the contact email field. Before:

```tsx
                      <input
                        id="cemail"
                        className="field"
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                      />
```
After:
```tsx
                      <input
                        id="cemail"
                        className={`field${errors["contact.email"] ? " field-err" : ""}`}
                        type="email"
                        value={form.contactEmail}
                        onChange={(e) => patch({ contactEmail: e.target.value })}
                        aria-invalid={errors["contact.email"] ? true : undefined}
                        aria-describedby={errors["contact.email"] ? "cemail-err" : undefined}
                      />
                      {errors["contact.email"] ? (
                        <span className="err" id="cemail-err">
                          {errors["contact.email"]}
                        </span>
                      ) : null}
```

Edit 8, the product tiles. Before:

```tsx
                            <ProductMark product={product} large />
                            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{product}</span>
```
After:
```tsx
                            <ProductMark product={product} large />
                            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{PRODUCT_LABEL[product]}</span>
```

Edit 9, the "already registered" notes. Before:

```tsx
                  {held.map(({ deal, end }) => (
                    <div className="note note-amber" role="status" key={deal.id}>
                      <Icon name="warn" />
                      <span>
                        <b>Already registered.</b> Your company holds an accepted {deal.product} deal at {deal.customer},
                        protected until {fmtLong(end)}. You can still submit; CleanStart will see both.
                      </span>
                    </div>
                  ))}
```
After:
```tsx
                  {held.map(({ deal }) => (
                    <div className="note note-amber" role="status" key={deal.id}>
                      <Icon name="warn" />
                      <span>
                        <b>Already registered.</b>{" "}
                        {deal.status === "accepted" && deal.protectionEnd
                          ? `Your company holds an accepted ${PRODUCT_LABEL[deal.product]} deal at ${deal.customer}, protected until ${fmtLong(deal.protectionEnd)}.`
                          : `Your company already has ${PRODUCT_LABEL[deal.product]} at ${deal.customer} waiting for review.`}{" "}
                        Take it out of your picks to continue.
                      </span>
                    </div>
                  ))}
```

Copy change, deliberate: the mock said "You can still submit; CleanStart will see both." That is no longer true. The contracts (M.3 item 24) make a second open registration for the same customer and product a hard block, so the sentence now says what happens. The pending variant is new because the block covers pending registrations too.

Edit 10, region and manager. Before:

```tsx
                        {REGIONS.map((region) => (
                          <button
                            type="button"
                            key={region}
                            className={`seg-b${form.region === region ? " seg-on" : ""}`}
                            aria-pressed={form.region === region}
                            onClick={() => patch({ region })}
                          >
                            {region}
                          </button>
                        ))}
```
After:
```tsx
                        {DEAL_REGIONS.map((region) => (
                          <button
                            type="button"
                            key={region}
                            className={`seg-b${form.region === region ? " seg-on" : ""}`}
                            aria-pressed={form.region === region}
                            onClick={() => patch({ region, managerId: managerFor(managers, region) })}
                          >
                            {PARTNER_REGION_LABEL[region]}
                          </button>
                        ))}
```

Before:
```tsx
                      <Dropdown
                        id="am"
                        variant="field"
                        value={form.manager}
                        options={MANAGERS}
                        onChange={(manager) => patch({ manager: manager as ManagerName })}
                      />
```
After:
```tsx
                      <Dropdown
                        id="am"
                        variant="field"
                        value={form.managerId}
                        options={managers.map((m) => ({ value: m.id, label: m.name }))}
                        onChange={(managerId) => patch({ managerId })}
                      />
```

Edit 11, the form level error and the submit button. Before:

```tsx
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderTop: "1px solid #F0EFF4",
```
After (insert before this `div`, keep the `div` as is):
```tsx
              {formError ? (
                <div className="note note-amber" role="alert" style={{ margin: "0 14px 10px" }}>
                  <Icon name="warn" />
                  <span>{formError}</span>
                </div>
              ) : null}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderTop: "1px solid #F0EFF4",
```

Before: `<button type="submit" className="btn btn-p" data-tour="reg-submit">` After: `<button type="submit" className="btn btn-p" data-tour="reg-submit" disabled={busy}>`.

Edit 12, the sidebar. Before:

```tsx
                <span className="card-meta">{exact.deals.length}</span>
              </div>
              {exactDeals.map((d) => (
                <div className="li" key={d.id}>
                  <ProductMark product={d.product} />
                  <span className="li-t">
                    <span className="li-n">{d.product}</span>
                    <span className="li-s">{dealMeta(d)}</span>
```
After:
```tsx
                <span className="card-meta">{exactDeals.length}</span>
              </div>
              {exactDeals.map((d) => (
                <div className="li" key={d.id}>
                  <ProductMark product={d.product} />
                  <span className="li-t">
                    <span className="li-n">{PRODUCT_LABEL[d.product]}</span>
                    <span className="li-s">{dealMeta(d, today)}</span>
```

Before: `Kestrel Systems has no registrations at {customer || "this customer"} yet. CleanStart still checks other` After: `{partnerName} has no registrations at {customer || "this customer"} yet. CleanStart still checks other`.

- [ ] **Step 19: Edit `RegisterDeal.tsx`, part B (remote suggestions; needs `lookupCustomerAction`, written in step 13)**

Edit 13, imports. Change `import { useMemo, useState } from "react";` to `import { useEffect, useMemo, useState } from "react";`; change `import { registerDealsAction } from "@/server/actions/registrations";` to `import { lookupCustomerAction, registerDealsAction } from "@/server/actions/registrations";`; add `import type { CustomerLookupResult } from "../deals/types";` below the `../deals/parts` import.

Edit 14, state and merge. At module level, directly after the `BLANK` constant, add `const EMPTY_OWN: CustomerSuggestionDto[] = [];` (a stable empty array keeps the `known` memo from recomputing on every render) and change the dto import line from edit 1 to `import type { CustomerSuggestionDto, ManagerOptionDto, RegistrationListItem } from "@/lib/dto";`. In the component, directly after `const [submitted, setSubmitted] = useState<Submitted | null>(null);` add:

```tsx
  const [remote, setRemote] = useState<{ q: string; data: CustomerLookupResult } | null>(null);
```

Replace the `known` memo with one that also takes the remote own suggestions (colleagues' customers a sales user cannot list). Before: `  }, [mine]);` (the end of the `known` memo) and the loop above it. After, the whole memo:

```tsx
  const remoteOwn = remote?.q === customer ? remote.data.own : EMPTY_OWN;
  const known = useMemo(() => {
    const byName = new Map<string, { name: string; site: string; count: number }>();
    for (const d of mine) {
      const key = d.customer.toLowerCase();
      const entry = byName.get(key) ?? { name: d.customer, site: "", count: 0 };
      entry.site = entry.site || d.website || "";
      entry.count += 1;
      byName.set(key, entry);
    }
    for (const s of remoteOwn) {
      const key = s.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, { name: s.name, site: s.website ?? "", count: s.registrations.length });
    }
    return [...byName.values()];
  }, [mine, remoteOwn]);
```

Add after the `held` block:

```tsx
  const crmSuggestions =
    remote?.q === customer && !exact
      ? remote.data.crm.filter((c) => !known.some((k) => k.name.toLowerCase() === c.name.toLowerCase())).slice(0, 5)
      : [];

  useEffect(() => {
    if (customer.length < 3) {
      setRemote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await lookupCustomerAction({ q: customer });
      if (!cancelled && result.ok) setRemote({ q: customer, data: result.data });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customer]);
```

Edit 15, the suggestions box. Before:

```tsx
                      {suggestions.length > 0 ? (
                        <div className="sugg" id="cust-sugg" role="listbox" aria-label="Your existing customers">
                          <div className="sugg-h">Your customers</div>
```
After:
```tsx
                      {suggestions.length > 0 || crmSuggestions.length > 0 ? (
                        <div className="sugg" id="cust-sugg" role="listbox" aria-label="Your existing customers">
                          {suggestions.length > 0 ? <div className="sugg-h">Your customers</div> : null}
```

and, directly before the closing `</div>` of that `.sugg` box (after the `suggestions.map(...)` block), add:

```tsx
                          {crmSuggestions.length > 0 ? <div className="sugg-h">Known to CleanStart</div> : null}
                          {crmSuggestions.map((c) => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={false}
                              className="dd-opt"
                              key={c.name}
                              onClick={() => patch({ customer: c.name, site: c.website ?? "" })}
                              style={{ height: "auto", padding: "6px 8px" }}
                            >
                              <span className="li-t">
                                <span className="li-n">{c.name}</span>
                                <span className="li-s">{c.website ?? "No website on record"}</span>
                              </span>
                            </button>
                          ))}
```

The `held` block in edit 3 already reads company wide registrations only through `mine`; to warn a sales user about a colleague's registration too, extend it: in edit 3's `held` replace the `mine.find(...)` source with `[...mine, ...remoteOwnRegistrations]` where `remoteOwnRegistrations` is not defined. Leave `held` on `mine`: a sales user who submits a duplicate of a colleague's registration gets the server's `duplicate_registration` message in the form level note instead. (Recorded as a known limit.)

- [ ] **Step 20: Gate A and the manual check**

Run the Gate A block from "Conventions". Expected: all green; the changed paths are the ones in the Files block.

Manual check with `pnpm --filter @cleanstart/portal db:seed` data, dev server on the track's port (never kill a process to free a port), signed in as the seeded Kestrel partner admin (Aditi Rao; email and `DEV_SEED_PASSWORD` are in `src/db/fixtures.ts`). HubSpot env variables stay unset, which is the "HubSpot down" case.
- `/partner/deals`: tabs read All 10, Pending 2, Accepted 3, Rejected 1, Expired 1, Won 2, Lost 1. The Vardhan Capital CleanSight row reads "12 Jan 2027 67d" when the dev date is 6 Nov 2026 (the number changes with the real date; the format and the amber at 14 days are what to check). Filter by product and by manager; "Clear filters" resets; Export CSV downloads a file with a Product column of labels such as "CleanStart Images".
- Click the Saffron Retail Group row (the one rejected deal): the drawer shows the reason; leave the name empty and press Resubmit: inline errors; fill a contact and resubmit: toast, drawer closes, the Pending tab count is 3, the row reads "Resent today".
- Click "Message Farhan" in a drawer or open a deal: the message drawer shows the real manager and "Sent from <your email>"; sending toasts (the delivery is P's action).
- `/partner/deals/new`: the form is blank. Type "Vard": suggestions list Vardhan Capital with "2 deals with you". Pick it, pick CleanSight: an amber "Already registered" note names the protected until date. Pick Clean Libraries: the pending variant. Submit is refused client side until they are removed. Register "Test Customer Ltd" with CleanStart Images and CleanSight, region India: success card says "2 registrations sent for approval"; `/partner/deals` lists both, and signed in as Farhan, `/admin/approvals` lists them (the approvals screen is converted in M2.2, so until then check the rows in the database with `select customer_name, product, status from registrations order by created_at desc limit 3`). Register the same customer and product again: an amber form level note, nothing is created.
- Sign in as a Kestrel sales user: `/partner/deals` shows only their own registrations.

- [ ] **Step 21: Commit**

```bash
git add apps/portal/src/lib/customer.ts apps/portal/src/lib/customer.test.ts \
  apps/portal/src/components/deals apps/portal/src/server/registrations apps/portal/src/server/repo/registrations.ts \
  apps/portal/src/server/repo/registrations.create.test.ts apps/portal/src/server/actions/registrations.ts \
  apps/portal/src/server/actions/registrations.test.ts apps/portal/src/components/screens/Deals.tsx \
  apps/portal/src/components/screens/RegisterDeal.tsx apps/portal/src/app/partner/deals/page.tsx \
  apps/portal/src/app/partner/deals/new/page.tsx docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M2.1 registrations repo, register form with customer lookup, deals list"
```

Append to the progress log with one `printf` (BUILD-HANDOFF), then tell the orchestrator the task is ready to merge.

---
### Task M2.3: Conversation thread, notifications, stage change announcements, Deal detail

**Gate A:** the Gate A block in "Conventions", plus `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts` green with the new functions registered.

**Files:**
- Create: `src/server/registrations/recipients.ts`, `src/server/registrations/{recipients,announce}.test.ts`
- Replace (W0-c created it as a stub that exports `RegistrationChange` and an empty `announceRegistrationChange`): `src/server/registrations/announce.ts`
- Create: `src/server/repo/messages.ts`, `src/server/repo/messages.test.ts`
- Create: `src/server/repo/notifications.ts`, `src/server/repo/notifications.test.ts`
- Create: `src/server/actions/notifications.ts`, `src/server/actions/notifications.test.ts`, `src/server/actions/registrations.messages.test.ts`
- Modify: `src/server/registrations/mappers.ts` (adds `toMessageDto`), `src/server/actions/registrations.ts` (adds `postMessageAction`)
- Modify (edits printed below): `src/components/screens/DealDetail.tsx`
- Modify (rewrite): `src/app/partner/deals/[id]/page.tsx`
- Test: the files above

Rules this task implements: every message and every status change creates an in-app notification, and an email where the recipient's Account switch allows it (`resolveEmailRecipients`); a message from staff goes to the person who registered the deal and the partner admins, a message from a partner goes to the deal's manager; a decision or a HubSpot stage change goes to the person who registered the deal, or the partner admins when that person has left; the author never notifies themselves; messages are not audited (a message is not a state change; the mock does not audit them either).

- [ ] **Step 1: Write the failing tests for recipients and announcements**

```ts
// src/server/registrations/recipients.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { decisionRecipients, threadRecipients } from './recipients';

const db = testDb();
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, {});
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  return { partner, admin, sales };
};

describe('decisionRecipients', () => {
  it('is the person who registered the deal', async () => {
    const { partner, sales } = await setup();
    const ids = await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: sales.id }));
    expect(ids).toEqual([sales.id]);
  });

  it('falls back to the active partner admins when that person is gone or unknown', async () => {
    const { partner, admin, sales } = await setup();
    const gone = await makeUser(db, { partnerId: partner.id, role: 'sales', status: 'disabled' });
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin', status: 'disabled' });
    expect(await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: gone.id }))).toEqual([admin.id]);
    expect(await db.transaction((tx) => decisionRecipients(tx, { partnerId: partner.id, registeredById: null }))).toEqual([admin.id]);
    expect(sales.id).not.toBe(admin.id);
  });
});

describe('threadRecipients', () => {
  it('is the registrant and the partner admins, once each', async () => {
    const { partner, admin, sales } = await setup();
    const both = await db.transaction((tx) => threadRecipients(tx, { partnerId: partner.id, registeredById: sales.id }));
    expect([...both].sort()).toEqual([admin.id, sales.id].sort());
    const adminRegistered = await db.transaction((tx) => threadRecipients(tx, { partnerId: partner.id, registeredById: admin.id }));
    expect(adminRegistered).toEqual([admin.id]);
  });
});
```

```ts
// src/server/registrations/announce.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { announceRegistrationChange } from './announce';

const db = testDb();
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, {});
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', registeredBy: sales.id,
  });
  return { partner, sales, reg };
};

describe('announceRegistrationChange', () => {
  it('tells the person who registered the deal in the app and by email when a stage changes', async () => {
    const { sales, reg } = await setup();
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'stage_changed', stage: 'Proposal sent' });
    const rows = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: 'registration_stage', title: 'Vardhan Capital moved to Proposal sent', link: `/partner/deals/${reg.id}` });
    const mail = transport.only('karan@kestrel.example');
    expect(mail.htmlContent).toContain('Proposal sent');
  });

  it('keeps the in-app notification but sends no email when the user switched the category off', async () => {
    const { sales, reg } = await setup();
    await db.insert(notificationPrefs).values({ userId: sales.id, category: 'stage', email: false });
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'stage_changed', stage: 'Discovery' });
    expect(await db.select().from(notifications).where(eq(notifications.userId, sales.id))).toHaveLength(1);
    expect(transport.sent).toHaveLength(0);
  });

  it('writes a changed protection end in the app only, and an expiry in the app and by email', async () => {
    const { sales, reg } = await setup();
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'protection_end_changed', protectionEnd: '2027-03-01' });
    expect(transport.sent).toHaveLength(0);
    await announceRegistrationChange({ db, transport }, { registrationId: reg.id, kind: 'expired' });
    const rows = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(rows.map((r) => [r.kind, r.title]).sort()).toEqual([
      ['registration_expired', 'Vardhan Capital protection ended'],
      ['registration_stage', 'Vardhan Capital protection now ends 1 Mar 2027'],
    ]);
    expect(transport.to('karan@kestrel.example')).toHaveLength(1);
  });

  it('does nothing for an unknown registration', async () => {
    const transport = new FakeEmailTransport();
    await announceRegistrationChange({ db, transport }, { registrationId: '00000000-0000-0000-0000-000000000001', kind: 'expired' });
    expect(await db.select().from(notifications)).toHaveLength(0);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations/recipients.test.ts src/server/registrations/announce.test.ts`
Expected: FAIL, "Cannot find module './recipients'".

- [ ] **Step 2: Implement `recipients.ts` and `announce.ts`**

`announce.ts` already exists (contracts H.17, W0-c stub): the HubSpot poll and the expiry job (H4.8) call `announceRegistrationChange({ db }, change)` after each committed change and compile against the stub. Replace the whole file with the code below; the exported type and the call shape do not change, `deps` only gains the optional `transport`.

```ts
// src/server/registrations/recipients.ts
import { and, eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import type { Tx } from '@/server/repo/context';

export interface RegistrationParty {
  partnerId: string;
  registeredById: string | null;
}

async function activeAdmins(tx: Tx, partnerId: string): Promise<string[]> {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.partnerId, partnerId), eq(users.role, 'partner_admin'), eq(users.status, 'active')));
  return rows.map((r) => r.id);
}

async function activeRegistrant(tx: Tx, userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.status, 'active')))
    .limit(1);
  return row?.id ?? null;
}

/** Who hears about a decision or a stage change: the person who registered it, or the partner admins when they are gone. */
export async function decisionRecipients(tx: Tx, reg: RegistrationParty): Promise<string[]> {
  const registrant = await activeRegistrant(tx, reg.registeredById);
  return registrant ? [registrant] : activeAdmins(tx, reg.partnerId);
}

/** Who hears about a message from CleanStart: the registrant and the partner admins, once each. */
export async function threadRecipients(tx: Tx, reg: RegistrationParty): Promise<string[]> {
  const registrant = await activeRegistrant(tx, reg.registeredById);
  const admins = await activeAdmins(tx, reg.partnerId);
  return [...new Set([...(registrant ? [registrant] : []), ...admins])];
}
```

```ts
// src/server/registrations/announce.ts
import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { partners, registrations } from '@/db/schema';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildDealStageChanged } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { absoluteUrl } from '@/server/urls';
import { decisionRecipients } from './recipients';

export type RegistrationChange =
  | { registrationId: string; kind: 'stage_changed'; stage: string }
  | { registrationId: string; kind: 'protection_end_changed'; protectionEnd: string }
  | { registrationId: string; kind: 'expired' };

/**
 * Called by the HubSpot poll and the expiry job (H4.8) after a change commits; they run on the system db and have no
 * after-commit hook, so this opens its own transaction. The in-app notification always exists; the email follows the
 * recipient's "stage" or "expiry" switch, and a changed end date is told in the app only.
 */
export async function announceRegistrationChange(
  deps: { db: Db; transport?: EmailTransport },
  change: RegistrationChange,
): Promise<void> {
  const loaded = await deps.db.transaction(async (tx) => {
    const [reg] = await tx
      .select({
        id: registrations.id,
        customer: registrations.customerName,
        product: registrations.product,
        partnerId: registrations.partnerId,
        registeredBy: registrations.registeredBy,
        partnerName: partners.name,
      })
      .from(registrations)
      .innerJoin(partners, eq(partners.id, registrations.partnerId))
      .where(eq(registrations.id, change.registrationId))
      .limit(1);
    if (!reg) return null;
    const recipients = await decisionRecipients(tx, { partnerId: reg.partnerId, registeredById: reg.registeredBy });
    const base = { body: PRODUCT_LABEL[reg.product], link: ROUTES.partner.deal(reg.id) };
    const items = recipients.map((userId): NewNotification => {
      if (change.kind === 'stage_changed') {
        return { userId, kind: 'registration_stage', title: `${reg.customer} moved to ${change.stage}`, ...base };
      }
      if (change.kind === 'protection_end_changed') {
        return { userId, kind: 'registration_stage', title: `${reg.customer} protection now ends ${fmtLong(change.protectionEnd)}`, ...base };
      }
      return { userId, kind: 'registration_expired', title: `${reg.customer} protection ended`, ...base };
    });
    await notifyUsers(tx, items);
    return { reg, items };
  });
  if (!loaded || change.kind === 'protection_end_changed') return;

  const stage = change.kind === 'stage_changed' ? change.stage : 'Registration expired';
  for (const to of await resolveEmailRecipients(loaded.items)) {
    await sendEmail(
      buildDealStageChanged({
        to: { email: to.email, name: to.name },
        recipientName: to.name,
        customer: loaded.reg.customer,
        productLabel: PRODUCT_LABEL[loaded.reg.product],
        stage,
        dealUrl: absoluteUrl(ROUTES.partner.deal(loaded.reg.id)),
      }),
      deps.transport,
    );
  }
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations/recipients.test.ts src/server/registrations/announce.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 3: Write the failing repo tests for messages and notifications**

```ts
// src/server/repo/messages.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { registrationMessages } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import { listMessages, postMessage } from './messages';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const manager = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const admin = await viewerFor(db, adminUser);
  const sales = await viewerFor(db, salesUser);
  const reg = await makeRegistration(db, { partnerId: partner.id, registeredBy: salesUser.id, managerId: manager.id, region: 'india' });
  return { manager, partner, admin, sales, adminUser, salesUser, reg };
};

describe('postMessage', () => {
  it('posts as a partner user, copies the author and company, and tells only the deal manager', async () => {
    const { manager, sales, reg, partner } = await setup();
    const out = await withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: '  Can we get a reference call?  ' }, clock));
    expect(out.message).toMatchObject({ side: 'partner', authorName: sales.name, authorOrg: 'Kestrel Systems', body: 'Can we get a reference call?', auto: false, createdAt: '2026-11-06T14:02:00.000Z' });
    expect(out.recipientUserIds).toEqual([manager.id]);
    expect(out.registration).toMatchObject({ id: reg.id, partnerId: partner.id, partnerName: 'Kestrel Systems', managerId: manager.id });
  });

  it('posts as staff and tells the registrant and the partner admins but not the author', async () => {
    const { manager, admin, sales, reg } = await setup();
    const out = await withViewer(manager, (tx) => postMessage(tx, manager, { registrationId: reg.id, body: 'Yes, two dates next week.' }, clock));
    expect(out.message).toMatchObject({ side: 'staff', authorOrg: 'CleanStart', authorId: manager.id });
    expect([...out.recipientUserIds].sort()).toEqual([admin.id, sales.id].sort());
  });

  it('rejects an empty message and a very long one', async () => {
    const { sales, reg } = await setup();
    await expect(withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: '   ' }, clock))).rejects.toBeInstanceOf(ValidationError);
    await expect(withViewer(sales, (tx) => postMessage(tx, sales, { registrationId: reg.id, body: 'x'.repeat(4001) }, clock))).rejects.toBeInstanceOf(ValidationError);
  });

  it('is not found for a colleague\'s deal seen by sales, another company, and a region outside staff sales scope', async () => {
    const { partner, admin, reg } = await setup();
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    const foreign = await makeRegistration(db, {});
    const gulf = await makeRegistration(db, { partnerId: partner.id, region: 'middle_east' });
    const staffIndia = await asStaff(db, 'sales', 'india');
    await expect(withViewer(other, (tx) => postMessage(tx, other, { registrationId: reg.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(admin, (tx) => postMessage(tx, admin, { registrationId: foreign.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(staffIndia, (tx) => postMessage(tx, staffIndia, { registrationId: gulf.id, body: 'hi' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('listMessages', () => {
  it('returns the thread oldest first and nothing for an invisible registration', async () => {
    const { admin, reg } = await setup();
    await db.insert(registrationMessages).values([
      { registrationId: reg.id, authorName: 'B', authorOrg: 'CleanStart', side: 'staff', body: 'second', createdAt: new Date('2026-11-02T10:00:00Z') },
      { registrationId: reg.id, authorName: 'A', authorOrg: 'Kestrel', side: 'partner', body: 'first', createdAt: new Date('2026-11-01T10:00:00Z') },
    ]);
    const thread = await withViewer(admin, (tx) => listMessages(tx, admin, { registrationId: reg.id }));
    expect(thread.map((m) => m.body)).toEqual(['first', 'second']);
    const foreign = await makeRegistration(db, {});
    await expect(withViewer(admin, (tx) => listMessages(tx, admin, { registrationId: foreign.id }))).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

```ts
// src/server/repo/notifications.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notifications } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { NotFoundError } from '@/server/errors';
import { withViewer } from './context';
import { listNotifications, markAllRead, markRead } from './notifications';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const add = (userId: string, title: string, createdAt: string, readAt: string | null = null) =>
  db.insert(notifications).values({
    userId, kind: 'registration_message', title, link: '/partner/deals', createdAt: new Date(createdAt), readAt: readAt ? new Date(readAt) : null,
  });

describe('listNotifications', () => {
  it('returns the viewer\'s own, newest first, with the unread count of all of them', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'oldest', '2026-11-01T10:00:00Z', '2026-11-02T10:00:00Z');
    await add(me.id, 'middle', '2026-11-02T10:00:00Z');
    await add(me.id, 'newest', '2026-11-03T10:00:00Z');
    await add(colleague.id, 'not mine', '2026-11-04T10:00:00Z');
    const out = await withViewer(me, (tx) => listNotifications(tx, me, { limit: 2 }));
    expect(out.items.map((i) => i.title)).toEqual(['newest', 'middle']);
    expect(out.unread).toBe(2);
    expect(out.items[0]).toMatchObject({ kind: 'registration_message', link: '/partner/deals', readAt: null, body: null });
  });
});

describe('markAllRead and markRead', () => {
  it('marks only the viewer\'s notifications and keeps an earlier read time', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'a', '2026-11-02T10:00:00Z');
    await add(me.id, 'b', '2026-11-03T10:00:00Z', '2026-11-03T11:00:00Z');
    await add(colleague.id, 'c', '2026-11-04T10:00:00Z');
    await withViewer(me, (tx) => markAllRead(tx, me, clock));
    const mine = await db.select().from(notifications);
    const read = Object.fromEntries(mine.map((n) => [n.title, n.readAt?.toISOString() ?? null]));
    expect(read).toEqual({ a: '2026-11-06T14:02:00.000Z', b: '2026-11-03T11:00:00.000Z', c: null });
    expect((await withViewer(me, (tx) => listNotifications(tx, me, {}))).unread).toBe(0);
  });

  it('marks one as read and answers not found for somebody else\'s or an unknown id', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await add(me.id, 'mine', '2026-11-02T10:00:00Z');
    await add(colleague.id, 'theirs', '2026-11-02T10:00:00Z');
    const [own] = await db.select().from(notifications).where(eq(notifications.userId, me.id));
    const [theirs] = await db.select().from(notifications).where(eq(notifications.userId, colleague.id));
    await withViewer(me, (tx) => markRead(tx, me, { id: own!.id }, clock));
    await withViewer(me, (tx) => markRead(tx, me, { id: own!.id }, clock));
    await expect(withViewer(me, (tx) => markRead(tx, me, { id: theirs!.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    await expect(withViewer(me, (tx) => markRead(tx, me, { id: 'nope' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/messages.test.ts src/server/repo/notifications.test.ts`
Expected: FAIL, "Cannot find module './messages'".

- [ ] **Step 4: Implement `toMessageDto`, `repo/messages.ts` and `repo/notifications.ts`**

In `src/server/registrations/mappers.ts` add (and use it in `toDetail`):

```ts
export const toMessageDto = (m: MessageRow): RegistrationMessageDto => ({
  id: m.id,
  authorId: m.authorId,
  authorName: m.authorName,
  authorOrg: m.authorOrg,
  side: m.side,
  body: m.body,
  createdAt: m.createdAt.toISOString(),
  auto: m.auto,
});
```

Add `RegistrationMessageDto` to the `@/lib/dto` type import of that file, and replace the whole `thread: parts.messages.map((m) => ({ ... })),` expression inside `toDetail` with `thread: parts.messages.map(toMessageDto),`.

```ts
// src/server/repo/messages.ts
import { randomUUID } from 'node:crypto';
import { and, asc, eq } from 'drizzle-orm';
import { registrationMessages, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import type { Product } from '@/lib/domain';
import type { RegistrationMessageDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError, ValidationError } from '@/server/errors';
import { toMessageDto } from '@/server/registrations/mappers';
import { threadRecipients } from '@/server/registrations/recipients';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { getRegistration } from './registrations';

const MAX_BODY = 4000;

/** The thread of one registration, oldest first. Same visibility as getRegistration. */
export async function listMessages(tx: Tx, viewer: Viewer, input: { registrationId: string }): Promise<RegistrationMessageDto[]> {
  assertUuid(input.registrationId, 'registration');
  const [visible] = await tx
    .select({ id: registrations.id })
    .from(registrations)
    .where(and(eq(registrations.id, input.registrationId), registrationScope(viewer)))
    .limit(1);
  if (!visible) throw new NotFoundError('registration');
  const rows = await tx
    .select()
    .from(registrationMessages)
    .where(eq(registrationMessages.registrationId, input.registrationId))
    .orderBy(asc(registrationMessages.createdAt), asc(registrationMessages.id));
  return rows.map(toMessageDto);
}

/**
 * Posts as the viewer: side 'partner' for partner users, 'staff' for staff; author_name and author_org copied now.
 * Returns the recipients (staff: the registrant plus partner admins; partner: the deal's manager) and the
 * registration header the notification and email need. No .returning() on the cross-user notification rows.
 */
export async function postMessage(
  tx: Tx,
  viewer: Viewer,
  input: { registrationId: string; body: string },
  clock: Clock,
): Promise<{
  message: RegistrationMessageDto;
  registration: { id: string; customer: string; product: Product; partnerId: string; partnerName: string; managerId: string | null };
  recipientUserIds: string[];
}> {
  const body = input.body.trim();
  if (!body) throw new ValidationError([{ path: 'body', message: 'Write a message first.' }]);
  if (body.length > MAX_BODY) throw new ValidationError([{ path: 'body', message: `Keep it under ${MAX_BODY} characters.` }]);
  const reg = await getRegistration(tx, viewer, input.registrationId);

  const id = randomUUID();
  const createdAt = clock.now();
  const side = viewer.kind === 'partner' ? 'partner' : 'staff';
  const authorOrg = viewer.kind === 'partner' ? viewer.partnerName : 'CleanStart';
  await tx.insert(registrationMessages).values({
    id,
    registrationId: reg.id,
    authorId: viewer.id,
    authorName: viewer.name,
    authorOrg,
    side,
    body,
    createdAt,
  });

  const audience =
    viewer.kind === 'staff'
      ? await threadRecipients(tx, { partnerId: reg.partnerId, registeredById: reg.registeredById })
      : reg.managerId
        ? [reg.managerId]
        : [];
  return {
    message: { id, authorId: viewer.id, authorName: viewer.name, authorOrg, side, body, createdAt: createdAt.toISOString(), auto: false },
    registration: {
      id: reg.id,
      customer: reg.customer,
      product: reg.product,
      partnerId: reg.partnerId,
      partnerName: reg.partnerName,
      managerId: reg.managerId,
    },
    recipientUserIds: audience.filter((userId) => userId !== viewer.id),
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'listMessages' | 'postMessage'>({
  listMessages: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => listMessages(tx, viewer, { registrationId: ctx.b.registrationId }) },
  postMessage: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => postMessage(tx, viewer, { registrationId: ctx.b.registrationId, body: 'isolation probe' }, probeClock),
  },
});
```

```ts
// src/server/repo/notifications.ts
import { randomUUID } from 'node:crypto';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { notifications } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import type { NotificationDto, NotificationsDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { NotFoundError } from '@/server/errors';
import { assertUuid } from '@/server/registrations/scope';
import type { Tx } from './context';
import { defineIsolation, type IsolationContext } from './isolation.registry';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const toDto = (row: typeof notifications.$inferSelect): NotificationDto => ({
  id: row.id,
  kind: row.kind,
  title: row.title,
  body: row.body,
  link: row.link,
  readAt: row.readAt ? row.readAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

/** The viewer's own notifications, newest first, plus how many are unread in total. RLS keeps other users' rows out as well. */
export async function listNotifications(tx: Tx, viewer: Viewer, input: { limit?: number }): Promise<NotificationsDto> {
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const rows = await tx
    .select()
    .from(notifications)
    .where(eq(notifications.userId, viewer.id))
    .orderBy(desc(notifications.createdAt), desc(notifications.id))
    .limit(limit);
  const [unread] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, viewer.id), isNull(notifications.readAt)));
  return { items: rows.map(toDto), unread: unread?.n ?? 0 };
}

export async function markAllRead(tx: Tx, viewer: Viewer, clock: Clock): Promise<void> {
  await tx
    .update(notifications)
    .set({ readAt: clock.now() })
    .where(and(eq(notifications.userId, viewer.id), isNull(notifications.readAt)));
}

/** Idempotent: an already read notification keeps its first read time. Throws NotFoundError for somebody else's id. */
export async function markRead(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<void> {
  assertUuid(input.id, 'notification');
  const rows = await tx
    .update(notifications)
    .set({ readAt: sql`coalesce(${notifications.readAt}, ${clock.now().toISOString()}::timestamptz)` })
    .where(and(eq(notifications.id, input.id), eq(notifications.userId, viewer.id)))
    .returning({ id: notifications.id });
  if (rows.length === 0) throw new NotFoundError('notification');
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

/** A notification for another user of the same company, written by the probing viewer (the insert policy allows it). */
const foreignNotification = async (tx: Tx, viewerId: string, ctx: IsolationContext): Promise<string> => {
  const owner = [ctx.a.userId, ctx.a.adminViewer.id, ctx.a.salesViewer.id].find((id) => id !== viewerId) ?? ctx.a.userId;
  const id = randomUUID();
  await tx.insert(notifications).values({ id, userId: owner, kind: 'document_new', title: 'isolation probe' });
  return id;
};

export const isolation = defineIsolation<'listNotifications' | 'markAllRead' | 'markRead'>({
  listNotifications: {
    scope: 'own-user',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => {
      await foreignNotification(tx, viewer.id, ctx);
      return (await listNotifications(tx, viewer, {})).items.filter((item) => item.title === 'isolation probe');
    },
  },
  markAllRead: {
    scope: 'own-user',
    expect: 'empty',
    probe: async (tx, viewer, ctx) => {
      await foreignNotification(tx, viewer.id, ctx);
      await markAllRead(tx, viewer, probeClock);
      return null;
    },
  },
  markRead: {
    scope: 'own-user',
    expect: 'not_found',
    probe: async (tx, viewer, ctx) => markRead(tx, viewer, { id: await foreignNotification(tx, viewer.id, ctx) }, probeClock),
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/messages.test.ts src/server/repo/notifications.test.ts src/server/repo/isolation.test.ts`
Expected: PASS (5 and 3 tests, and the isolation matrix with `messages` and `notifications` listed).

- [ ] **Step 5: Write the failing action tests**

```ts
// src/server/actions/registrations.messages.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));

import { notificationPrefs, notifications } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { postMessageAction } from './registrations';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
});

const setup = async () => {
  const manager = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example', name: 'Karan Malhotra' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example', name: 'Aditi Rao' });
  const reg = await makeRegistration(db, { partnerId: partner.id, registeredBy: salesUser.id, managerId: manager.id, customerName: 'Vardhan Capital' });
  return { manager, partner, salesUser, adminUser, reg };
};

describe('postMessageAction', () => {
  it('lets staff write to the partner: the registrant and the admin are told in the app, and by email when their switch allows', async () => {
    const { manager, salesUser, adminUser, reg } = await setup();
    await db.insert(notificationPrefs).values({ userId: adminUser.id, category: 'decision', email: false });
    session.viewer = manager;
    const result = await postMessageAction({ registrationId: reg.id, body: 'Two dates next week.' });
    expect(result.ok).toBe(true);
    const sales = await db.select().from(notifications).where(eq(notifications.userId, salesUser.id));
    expect(sales[0]).toMatchObject({ kind: 'registration_message', link: `/partner/deals/${reg.id}` });
    expect(await db.select().from(notifications).where(eq(notifications.userId, adminUser.id))).toHaveLength(1);
    expect(mail.transport!.to('karan@kestrel.example')).toHaveLength(1);
    expect(mail.transport!.to('aditi@kestrel.example')).toHaveLength(0);
  });

  it('lets a partner user write to the deal manager', async () => {
    const { manager, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    const result = await postMessageAction({ registrationId: reg.id, body: 'Can we get a reference call?' });
    expect(result.ok).toBe(true);
    const rows = await db.select().from(notifications).where(eq(notifications.userId, manager.id));
    expect(rows[0]).toMatchObject({ kind: 'registration_message', link: '/admin/approvals' });
    expect(mail.transport!.to(manager.email)).toHaveLength(1);
  });

  it('refuses the technical role, a colleague\'s deal for sales, an empty body and another company', async () => {
    const { partner, adminUser, reg } = await setup();
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'technical' });
    expect(await postMessageAction({ registrationId: reg.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    session.viewer = other;
    expect(await postMessageAction({ registrationId: reg.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    session.viewer = await viewerFor(db, adminUser);
    expect(await postMessageAction({ registrationId: reg.id, body: '   ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const foreign = await makeRegistration(db, {});
    expect(await postMessageAction({ registrationId: foreign.id, body: 'hi' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
```

```ts
// src/server/actions/notifications.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));

import { notifications } from '@/db/schema';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { markAllNotificationsReadAction, markNotificationReadAction } from './notifications';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  session.viewer = null;
});

describe('notification actions', () => {
  it('marks all of the viewer\'s notifications read and leaves a colleague\'s alone', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    await db.insert(notifications).values([
      { userId: me.id, kind: 'registration_message', title: 'a' },
      { userId: colleague.id, kind: 'registration_message', title: 'b' },
    ]);
    session.viewer = me;
    expect(await markAllNotificationsReadAction({})).toEqual({ ok: true, data: null });
    const rows = await db.select().from(notifications);
    expect(Object.fromEntries(rows.map((r) => [r.title, r.readAt !== null]))).toEqual({ a: true, b: false });
  });

  it('marks one read, and answers not found for somebody else\'s notification', async () => {
    const me = await asPartner(db, { role: 'partner_admin' });
    const colleague = await asPartner(db, { partnerId: me.partnerId, role: 'sales' });
    const [mine] = await db.insert(notifications).values({ userId: me.id, kind: 'registration_message', title: 'a' }).returning();
    const [theirs] = await db.insert(notifications).values({ userId: colleague.id, kind: 'registration_message', title: 'b' }).returning();
    session.viewer = me;
    expect(await markNotificationReadAction({ id: mine!.id })).toEqual({ ok: true, data: null });
    expect((await db.select().from(notifications).where(eq(notifications.id, mine!.id)))[0]?.readAt).not.toBeNull();
    expect(await markNotificationReadAction({ id: theirs!.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect(await markNotificationReadAction({ id: 'nope' })).toMatchObject({ ok: false, error: { code: 'validation' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/registrations.messages.test.ts src/server/actions/notifications.test.ts`
Expected: FAIL, "postMessageAction is not a function" and "Cannot find module './notifications'".

- [ ] **Step 6: Implement `postMessageAction` and the notification actions**

Add these imports to `src/server/actions/registrations.ts`: `import type { RegistrationMessageDto } from '@/lib/dto';` (merge into the existing dto import), `import { resolveEmailRecipients } from '@/server/notify';` (merge into the `@/server/notify` import), `import { sendEmail } from '@/server/email/send';`, `import { buildDealMessage } from '@/server/email/templates';`, `import { absoluteUrl } from '@/server/urls';`, `import { postMessage } from '@/server/repo/messages';`, and `getRegistration` into the `@/server/repo/registrations` import list. Append:

```ts
const postMessageSchema = z.object({
  registrationId: z.string().uuid(),
  body: z.string().trim().min(1, 'Write a message first.').max(4000),
});

const EXCERPT_CHARS = 280;

export async function postMessageAction(raw: unknown): Promise<ActionResult<RegistrationMessageDto>> {
  return runViewerAction({ name: 'registration.post_message', schema: postMessageSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await getRegistration(tx, ctx.viewer, input.registrationId);
      assertCan(ctx.viewer, 'registration.message', {
        partnerId: current.partnerId,
        region: current.region,
        ownerUserId: current.registeredById,
      });
      const posted = await postMessage(tx, ctx.viewer, input, ctx.clock);
      const toPartner = ctx.viewer.kind === 'staff';
      const items: NewNotification[] = posted.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_message',
        title: `${posted.message.authorName} wrote about ${posted.registration.customer}`,
        body: posted.message.body.slice(0, EXCERPT_CHARS),
        link: toPartner ? ROUTES.partner.deal(posted.registration.id) : ROUTES.admin.approvals,
      }));
      await notifyUsers(tx, items);
      return { posted, items, toPartner };
    });

    ctx.revalidate(ROUTES.partner.deal(outcome.posted.registration.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(outcome.items)) {
        await sendEmail(
          buildDealMessage({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            authorName: outcome.posted.message.authorName,
            authorOrg: outcome.posted.message.authorOrg,
            customer: outcome.posted.registration.customer,
            excerpt: outcome.posted.message.body.slice(0, EXCERPT_CHARS),
            dealUrl: absoluteUrl(outcome.toPartner ? ROUTES.partner.deal(outcome.posted.registration.id) : ROUTES.admin.approvals),
          }),
        );
      }
    });
    return outcome.posted.message;
  });
}
```

```ts
// src/server/actions/notifications.ts
'use server';

import { z } from 'zod';
import { assertCan } from '@/server/auth/policies';
import { withViewer } from '@/server/repo/context';
import { markAllRead, markRead } from '@/server/repo/notifications';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

export async function markAllNotificationsReadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'notification.mark_all_read', schema: z.object({}) }, raw, async (ctx) => {
    assertCan(ctx.viewer, 'notification.read');
    await withViewer(ctx.viewer, (tx) => markAllRead(tx, ctx.viewer, ctx.clock));
    return null;
  });
}

export async function markNotificationReadAction(raw: unknown): Promise<ActionResult<null>> {
  return runViewerAction({ name: 'notification.mark_read', schema: z.object({ id: z.string().uuid() }) }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'notification.read');
    await withViewer(ctx.viewer, (tx) => markRead(tx, ctx.viewer, input, ctx.clock));
    return null;
  });
}
```

Neither notification action calls `revalidate`: the bell reads through the layout (M4.4 refreshes it with `router.refresh()`), and revalidating every page would be wasteful.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions`
Expected: PASS, including the 3 message tests and the 2 notification tests, and the 11 registration tests from M2.1 still green.

- [ ] **Step 7: Rewrite the page `src/app/partner/deals/[id]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { DealDetail } from "@/components/screens/DealDetail";
import { systemClock } from "@/lib/clock";
import { sameCustomer } from "@/lib/customer";
import { requireCan } from "@/server/auth/viewer";
import { NotFoundError } from "@/server/errors";
import { getShell } from "@/server/repo/account";
import { withViewer } from "@/server/repo/context";
import { getRegistration, listRegistrations } from "@/server/repo/registrations";

export const metadata: Metadata = { title: "Deal detail" };

export default async function Page({ params }: { params: Promise<{ id: string }> }): Promise<React.JSX.Element> {
  const { id } = await params;
  const viewer = await requireCan("registration.read");
  const loaded = await withViewer(viewer, async (tx) => {
    try {
      const deal = await getRegistration(tx, viewer, id);
      const nearby = await listRegistrations(tx, viewer, { q: deal.customer, limit: 50 });
      const shell = await getShell(tx, viewer);
      return { deal, siblings: nearby.filter((d) => sameCustomer(d.customer, deal.customer)), shell };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  });
  return (
    <DealDetail
      deal={loaded?.deal ?? null}
      siblings={loaded?.siblings ?? []}
      today={systemClock.today()}
      partnerManager={loaded?.shell.manager ? { name: loaded.shell.manager.name, team: loaded.shell.manager.team } : null}
      senderEmail={loaded?.shell.viewerEmail ?? ""}
    />
  );
}
```

A deal that does not exist, belongs to another company, or belongs to a colleague of a sales user, renders the mock's "Deal not found" card, the same for all three, so ids cannot be probed.

- [ ] **Step 8: Edit `DealDetail.tsx`**

The extension request (`requestExtension` import and `sendExtension` body) stays on the mock slice until M2.4 replaces both; every other region converts now.

Edit 1, imports. Before:

```tsx
import Link from "next/link";
import { useCallback, useState } from "react";
import { type Deal, PRODUCTS, postDealMessage, requestExtension, useDeals } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { acceptedOn, sameCustomer, stageTrack, waitDays } from "../deals/derive";
import { daysLeft, fmtLong, fmtShort, plural, PROTECTION_DAYS } from "../deals/dates";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { ProductMark, StatusBadge } from "../deals/parts";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import { Icon } from "../icon";
import { KESTREL } from "../shell/personas";
import { Dialog } from "../ui/overlay";
```

After:

```tsx
import Link from "next/link";
import { useCallback, useState } from "react";
import { requestExtension } from "@/data/deals";
import { fmtTimestamp } from "@/lib/dates";
import {
  EVENT_SOURCE_LABEL,
  PARTNER_REGION_LABEL,
  PRODUCT_LABEL,
  PRODUCTS,
  REGISTRATION_STATUS_LABEL,
} from "@/lib/domain";
import type { RegistrationDetailDto, RegistrationListItem } from "@/lib/dto";
import { ROUTES } from "@/lib/routes";
import { postMessageAction } from "@/server/actions/registrations";
import { acceptedOn, firstWord, initialsOf, stageTrack, waitDays } from "../deals/derive";
import { daysLeft, fmtLong, fmtShort, plural, PROTECTION_DAYS } from "../deals/dates";
import { ManagerMessageDrawer } from "../deals/ManagerMessageDrawer";
import { ProductMark, StatusBadge } from "../deals/parts";
import { RejectedDealDrawer } from "../deals/RejectedDealDrawer";
import type { ManagerContact } from "../deals/types";
import { Icon } from "../icon";
import { Dialog } from "../ui/overlay";
```

Edit 2, `summaryFor`. Before (the whole function):

```tsx
function summaryFor(deal: Deal): SummaryKpi[] {
  const crm: SummaryKpi = {
    label: "CRM reference",
    value: deal.crmRef ?? (deal.status === "Pending" || deal.status === "Rejected" ? "Not created" : "Not recorded"),
    foot: deal.crmSynced ?? (deal.status === "Pending" ? "Created when accepted" : "In CleanStart's CRM"),
    small: true,
  };
  switch (deal.status) {
    case "Accepted": {
      const end = deal.protectionEnd ?? deal.registered;
      const left = daysLeft(end);
      const accepted = acceptedOn(deal);
```

After (only these lines change; the two `foot` expressions, the `case` labels and the three date calls):

```tsx
function summaryFor(deal: RegistrationDetailDto, today: string): SummaryKpi[] {
  const crm: SummaryKpi = {
    label: "CRM reference",
    value: deal.crmRef ?? (deal.status === "pending" || deal.status === "rejected" ? "Not created" : "Not recorded"),
    foot: deal.crmSyncedAt
      ? `Synced ${fmtTimestamp(deal.crmSyncedAt, today)}`
      : deal.status === "pending"
        ? "Created when accepted"
        : "In CleanStart's CRM",
    small: true,
  };
  switch (deal.status) {
    case "accepted": {
      const end = deal.protectionEnd ?? deal.registeredOn;
      const left = daysLeft(end, today);
      const accepted = acceptedOn(deal);
```

Before:
```tsx
    case "Pending": {
      const days = waitDays(deal);
```
After:
```tsx
    case "pending": {
      const days = waitDays(deal, today);
```

Before:
```tsx
    case "Rejected":
      return [
        { label: "Protection", value: "Not protected", foot: deal.decidedOn ? `Not accepted ${fmtShort(deal.decidedOn)}` : "Not accepted", small: true },
        { label: "Reviewed by", value: deal.decidedBy ?? deal.manager, foot: "Partner manager", small: true },
        crm,
      ];
    default:
      return [
        {
          label: deal.status === "Expired" ? "Ended" : "Closed",
          value: fmtLong(deal.closedOn ?? deal.registered),
          foot: deal.stage,
        },
        { label: "Outcome", value: deal.status, foot: "From CleanStart's CRM" },
        crm,
      ];
```
After:
```tsx
    case "rejected":
      return [
        { label: "Protection", value: "Not protected", foot: deal.decidedOn ? `Not accepted ${fmtShort(deal.decidedOn)}` : "Not accepted", small: true },
        { label: "Reviewed by", value: deal.decidedByLabel ?? deal.managerName ?? "CleanStart", foot: "Partner manager", small: true },
        crm,
      ];
    default:
      return [
        {
          label: deal.status === "expired" ? "Ended" : "Closed",
          value: fmtLong(deal.closedOn ?? deal.registeredOn),
          foot: deal.stage,
        },
        { label: "Outcome", value: REGISTRATION_STATUS_LABEL[deal.status], foot: "From CleanStart's CRM" },
        crm,
      ];
```

Edit 3, the component head. Before:

```tsx
export function DealDetail({ id }: { id: string }): React.JSX.Element {
  const toast = useToast();
  const all = useDeals();
  const deal = all.find((d) => d.id === id && d.partner === KESTREL.org);

  const [draft, setDraft] = useState("");
  const [draftTried, setDraftTried] = useState(false);
```
After:
```tsx
interface DealDetailProps {
  deal: RegistrationDetailDto | null;
  siblings: RegistrationListItem[];
  today: string;
  partnerManager: ManagerContact | null;
  senderEmail: string;
}

export function DealDetail({ deal, siblings, today, partnerManager, senderEmail }: DealDetailProps): React.JSX.Element {
  const toast = useToast();

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [draftTried, setDraftTried] = useState(false);
```

Edit 4, derived values and `sendNote`. Before:

```tsx
  const track = stageTrack(deal);
  const summary = summaryFor(deal);
  const primary = deal.contacts[0];
  const siblings = all.filter((d) => d.partner === deal.partner && sameCustomer(d.customer, deal.customer));
  const draftErr = draftTried && !draft.trim();
  const extErr = extTried && !extWhy.trim();

  const sendNote = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!draft.trim()) {
      setDraftTried(true);
      return;
    }
    postDealMessage(deal.id, draft);
    setDraft("");
    setDraftTried(false);
  };
```
After:
```tsx
  const track = stageTrack(deal);
  const summary = summaryFor(deal, today);
  const primary = deal.contacts[0];
  const managerFirst = firstWord(deal.managerName ?? "your partner manager");
  const draftErr = draftTried && !draft.trim();
  const extErr = extTried && !extWhy.trim();

  const sendNote = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!draft.trim()) {
      setDraftTried(true);
      return;
    }
    setSending(true);
    const result = await postMessageAction({ registrationId: deal.id, body: draft });
    setSending(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    setDraft("");
    setDraftTried(false);
  };
```

Edit 5, the header. Before:

```tsx
            {deal.product}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {deal.status === "Accepted" && !deal.extensionRequested ? (
```
After:
```tsx
            {PRODUCT_LABEL[deal.product]}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {deal.status === "accepted" && (deal.extensionStatus === "none" || deal.extensionStatus === "declined") ? (
```

Before: `{deal.extensionRequested ? (` After: `{deal.extensionStatus === "requested" ? (`.
Before: `{deal.status === "Rejected" ? (` (the "Fix and resubmit" button) After: `{deal.status === "rejected" ? (`.
Before: `onClick={() => setMessageSubject(\`${deal.customer}, ${deal.product}\`)}` After: `onClick={() => setMessageSubject(\`${deal.customer}, ${PRODUCT_LABEL[deal.product]}\`)}`.
Before: `{deal.status === "Rejected" && deal.rejectionReason ? (` After: `{deal.status === "rejected" && deal.rejectionReason ? (`.

Edit 6, the registration card. Before:

```tsx
                Submitted {fmtLong(deal.registered)}
                {deal.registeredTime ? `, ${deal.registeredTime}` : ""}
```
After:
```tsx
                Submitted {fmtLong(deal.registeredOn)}, {deal.registeredAt.slice(11, 16)}
```
Before:
```tsx
                <dt>Product</dt>
                <dd>{deal.product}</dd>
                <dt>Region</dt>
                <dd>{deal.region}</dd>
                <dt>Account manager</dt>
                <dd>{deal.manager}</dd>
```
After:
```tsx
                <dt>Product</dt>
                <dd>{PRODUCT_LABEL[deal.product]}</dd>
                <dt>Region</dt>
                <dd>{PARTNER_REGION_LABEL[deal.region]}</dd>
                <dt>Account manager</dt>
                <dd>{deal.managerName ?? "Not assigned"}</dd>
```
Before: `<dd>{deal.registeredBy ?? deal.partner}</dd>` After: `<dd>{deal.registeredByName}</dd>`.

Edit 7, the activity table. Before:

```tsx
                {deal.history.map((e, index) => (
                  <tr key={`${e.when}-${index}`}>
                    <td className="tnum t-sec">{e.when}</td>
                    <td>{e.text}</td>
                    <td className="t-sec">{e.by}</td>
                    <td className="t-muted">{e.source}</td>
                  </tr>
                ))}
```
After:
```tsx
                {deal.history.map((e) => (
                  <tr key={e.id}>
                    <td className="tnum t-sec">{fmtLong(e.at.slice(0, 10))}</td>
                    <td>{e.text}</td>
                    <td className="t-sec">{e.byLabel}</td>
                    <td className="t-muted">{EVENT_SOURCE_LABEL[e.source]}</td>
                  </tr>
                ))}
```

Edit 8, the conversation. Before: `<span className="card-meta">Farhan gets an email for each message</span>` After: `<span className="card-meta">{managerFirst} gets an email for each message</span>`.

Before:
```tsx
                    <span className={`av av-r ${m.self ? "av-me" : "av-2"}`}>{m.initials}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 600 }}>{m.who}</b>{" "}
                        <span className="t-muted">
                          {m.org}, {m.when}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: "#2A2838" }}>{m.text}</span>
```
After:
```tsx
                    <span className={`av av-r ${m.side === "partner" ? "av-me" : "av-2"}`}>{initialsOf(m.authorName)}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 600 }}>{m.authorName}</b>{" "}
                        <span className="t-muted">
                          {m.authorOrg}, {fmtTimestamp(m.createdAt, today)}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: "#2A2838" }}>{m.body}</span>
```
Before: `<div className="empty">No messages yet. Write to Farhan about this deal.</div>` After: `<div className="empty">No messages yet. Write to {managerFirst} about this deal.</div>`.
Before: `placeholder="Write to Farhan about this deal"` After: `placeholder={\`Write to ${managerFirst} about this deal\`}`.
Before:
```tsx
              <button type="submit" className="btn btn-p">
                <Icon name="send" />
                Send
              </button>
            </form>
```
After:
```tsx
              <button type="submit" className="btn btn-p" disabled={sending}>
                <Icon name="send" />
                Send
              </button>
            </form>
```

Edit 9, the sidebar cards. Before:

```tsx
            {PRODUCTS.filter((p) => p !== deal.product).map((product) => {
              const other = siblings.find((d) => d.product === product);
              return (
                <div className="li" key={product}>
                  <ProductMark product={product} />
                  <span className="li-t">
                    <span className="li-n">{product}</span>
                    <span className="li-s">
                      {other
                        ? `Registered ${fmtShort(other.registered)}${other.registeredBy ? `, ${other.registeredBy}` : ""}`
                        : "Not registered yet"}
```
After:
```tsx
            {PRODUCTS.filter((p) => p !== deal.product).map((product) => {
              const other = siblings.find((d) => d.product === product);
              return (
                <div className="li" key={product}>
                  <ProductMark product={product} />
                  <span className="li-t">
                    <span className="li-n">{PRODUCT_LABEL[product]}</span>
                    <span className="li-s">
                      {other
                        ? `Registered ${fmtShort(other.registeredOn)}, ${other.registeredByName}`
                        : "Not registered yet"}
```
The contacts card (`deal.contacts.map((c, index) => ...)`) needs no change: `DealContact` and `RegistrationContactDto` share `name`, `role`, `email` and `phone`, and `c.role` is `string | null` where the card writes `c.role ? ... : ...` and `(c.role ?? "Contact")`, both of which accept null.

Edit 10, the dialog subtitle and drawers. Before: ``subtitle={`${deal.customer}, ${deal.product}. Protection ends ${deal.protectionEnd ? fmtLong(deal.protectionEnd) : "when the registration closes"}.`}`` After: ``subtitle={`${deal.customer}, ${PRODUCT_LABEL[deal.product]}. Protection ends ${deal.protectionEnd ? fmtLong(deal.protectionEnd) : "when the registration closes"}.`}``.

Before:
```tsx
      {fixing && deal.status === "Rejected" ? (
        <RejectedDealDrawer
          deal={deal}
          onClose={() => setFixing(false)}
          onMessage={() => {
            setFixing(false);
            setMessageSubject(`${deal.customer}, ${deal.product}`);
          }}
        />
      ) : null}
      {messageSubject !== null ? (
        <ManagerMessageDrawer
          key={messageSubject}
          persona={KESTREL}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
```
After:
```tsx
      {fixing && deal.status === "rejected" ? (
        <RejectedDealDrawer
          deal={deal}
          onClose={() => setFixing(false)}
          onMessage={() => {
            setFixing(false);
            setMessageSubject(`${deal.customer}, ${PRODUCT_LABEL[deal.product]}`);
          }}
        />
      ) : null}
      {messageSubject !== null && partnerManager ? (
        <ManagerMessageDrawer
          key={messageSubject}
          manager={partnerManager}
          senderEmail={senderEmail}
          initialSubject={messageSubject}
          onClose={() => setMessageSubject(null)}
        />
      ) : null}
```

`NotFound`, the stage tracker, the extension dialog markup and every class stay unchanged. `sendExtension` still calls the mock `requestExtension(deal.id, extWhy)`; that is replaced in M2.4 step 11.

- [ ] **Step 9: Gate A and the manual check**

Run the Gate A block. Expected: all green; changed paths are the Files block.

Manual check (seed-dev data, signed in as Aditi Rao, Kestrel partner admin):
- `/partner/deals/<id of Vardhan Capital CleanSight>` (click it in the Deals list): the summary shows "Protected until 12 Jan 2027", days left and a bar, CRM reference `HS-48213` and "Synced ..." footer; the stage tracker reads Registered, Accepted, Technical evaluation, Proposal sent (now), Closed; Activity lists 5 events newest first with sources Portal and CRM; the thread shows Aditi's question and Farhan's answer.
- Write a message and press Send: it appears in the thread as "Aditi Rao Kestrel Systems, Today, hh:mm". Check `select title, kind, link from notifications` shows one row for Farhan (`registration_message`, link `/admin/approvals`) and, with the Brevo env unset, the log shows one skipped email.
- Open the Gulfway Freight deal: the thread is empty ("No messages yet. Write to Omar about this deal."), because that deal's manager is Omar.
- Open the rejected Saffron Retail Group deal by URL: the amber "Not accepted" note and a "Fix and resubmit" button open the same drawer as in the list.
- Open `/partner/deals/00000000-0000-0000-0000-000000000000` and another company's deal id: both render "Deal not found".
- "Request extension" still opens the old mock dialog and does nothing durable until M2.4.

- [ ] **Step 10: Commit**

```bash
git add apps/portal/src/server/registrations apps/portal/src/server/repo/messages.ts apps/portal/src/server/repo/messages.test.ts \
  apps/portal/src/server/repo/notifications.ts apps/portal/src/server/repo/notifications.test.ts \
  apps/portal/src/server/actions/registrations.ts apps/portal/src/server/actions/registrations.messages.test.ts \
  apps/portal/src/server/actions/notifications.ts apps/portal/src/server/actions/notifications.test.ts \
  apps/portal/src/components/screens/DealDetail.tsx "apps/portal/src/app/partner/deals/[id]/page.tsx" \
  docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M2.3 deal thread, notifications, stage change announcements, deal detail"
```

---
### Task M2.2: Approvals, decisions, conflict hints, undo

**Gate A:** the Gate A block in "Conventions", plus `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts` green with the new functions registered.

**Files:**
- Create: `src/server/registrations/conflict-hints.ts`, `src/server/registrations/conflict-hints.test.ts`
- Create: `src/server/repo/registrations.decide.test.ts`
- Create: `src/server/actions/decisions.ts`, `src/server/actions/decisions.test.ts`
- Modify: `src/server/repo/registrations.ts` (adds seven functions, replaces the import block and the `isolation` block), `src/server/registrations/mappers.ts` (adds `computeChecks`), `src/components/deals/derive.ts` and `derive.test.ts` (adds `describeCheck`, `defaultRejectReason`, `routingText`)
- Modify (edits printed below): `src/components/screens/AdminApprovals.tsx`
- Modify (rewrite): `src/app/admin/approvals/page.tsx`
- Test: the files above

Prerequisites: H4.4 merged (`enqueue`), H4.7 merged (`conflictingDeals`), M2.3 merged (`recipients.ts`, `postMessageAction`), and Contract change request 2 applied (the `registration_events` and `registration_messages` DELETE policy allows staff), otherwise the undo tests in step 4 fail on a silent RLS delete.

Rules this task implements (contracts H.7, H.19, M.3):
- Accept needs `pending`; sets `accepted`, stage `Accepted`, `protection_end = protectionEndFor(clock.today())` (89 days after the acceptance day), the decision fields, an automatic timeline event and an automatic thread line, enqueues `registration.create` with `version = String(Date.parse(decidedAt))`, notifies the registrant (or the partner admins when the registrant has left) and emails them.
- Reject needs a non empty reason of at most 500 characters; stage `Not accepted`; the partner sees the reason and can resubmit (M2.1).
- Undo only by the person who decided, within `UNDO_WINDOW_MINUTES` (10), and only while no HubSpot deal exists (`registrations.hubspot_deal_id` is null); otherwise `undo_window_closed` or `deal_in_crm`. It deletes only the two automatic lines written at that decision time, never earlier automatic lines from a previous decision.
- The 2 business day target drives the overdue badge (`isOverSla`).
- Conflict hint: a pending or accepted registration of another partner for the same customer and product (portal data), plus the HubSpot open deal check (`conflictingDeals`) fetched after the page renders through `hubspotConflictHintsAction`, never blocking the page or a decision. Staff only; partners never see these checks.
- A decision is never blocked by HubSpot being down: the action only writes the outbox row.

- [ ] **Step 1: Write the failing tests for the check wording and the routing text**

Append to `src/components/deals/derive.test.ts` (add `defaultRejectReason`, `describeCheck`, `routingText` to its import from `./derive`):

```ts
describe('describeCheck', () => {
  const deal = { partnerName: 'Kestrel Systems', registeredOn: '2026-11-03', product: 'images' as const };
  const rival = (over: Record<string, unknown> = {}) => ({
    kind: 'conflict' as const,
    other: {
      id: 'o', partnerName: 'Arbor Cyber', product: 'images' as const, status: 'pending' as const,
      registeredOn: '2026-11-05', protectionEnd: null, registeredFirst: false, ...over,
    },
  });

  it('says who was first when two partners wait', () => {
    expect(describeCheck(deal, rival())).toMatchObject({
      kind: 'conflict', label: 'Conflict', tone: 'pending', whyCls: 'why why-amber',
      why: 'Arbor Cyber also registered it on 5 Nov. Kestrel was first.',
    });
    expect(describeCheck(deal, rival({ registeredFirst: true })).why).toBe('Arbor Cyber registered it first, on 5 Nov.');
  });

  it('says the other partner already holds an accepted registration', () => {
    const accepted = rival({ status: 'accepted', protectionEnd: '2027-02-02', registeredFirst: true });
    expect(describeCheck(deal, accepted).why).toBe('Arbor Cyber already holds this, protected until 2 Feb 2027.');
  });

  it('reports the same customer under another product the partner already holds', () => {
    const info = { kind: 'info' as const, other: { id: 'o', partnerName: 'Kestrel Systems', product: 'libraries' as const, status: 'accepted' as const, registeredOn: '2026-10-01', protectionEnd: '2027-01-12', registeredFirst: false } };
    expect(describeCheck(deal, info)).toMatchObject({ kind: 'info', label: 'Same customer', tone: 'violet', why: 'Kestrel already holds Clean Libraries here, until 12 Jan 2027.', whyCls: 'why' });
  });

  it('is clear without a conflict, and a HubSpot hint turns a clear row into a conflict', () => {
    expect(describeCheck(deal, { kind: 'none' })).toMatchObject({ kind: 'none', label: 'Clear', tone: 'accepted', why: '' });
    const hinted = describeCheck(deal, { kind: 'none' }, { registrationId: 'r', holder: 'Dunes Networks', openDeals: 1 });
    expect(hinted).toMatchObject({ kind: 'conflict', why: 'Dunes Networks already has an open deal for this customer in HubSpot.' });
    expect(describeCheck(deal, { kind: 'none' }, { registrationId: 'r', holder: null, openDeals: 2 }).why).toBe('Another partner already has an open deal for this customer in HubSpot.');
  });

  it('keeps a portal conflict when HubSpot also reports one', () => {
    expect(describeCheck(deal, rival(), { registrationId: 'r', holder: 'X', openDeals: 1 }).why).toContain('Arbor Cyber');
  });
});

describe('defaultRejectReason', () => {
  it('pre-fills the reason when another partner registered first, and is empty otherwise', () => {
    const deal = { partnerName: 'Kestrel Systems', registeredOn: '2026-11-05', product: 'images' as const };
    const first = describeCheck(deal, { kind: 'conflict', other: { id: 'o', partnerName: 'Arbor Cyber', product: 'images', status: 'pending', registeredOn: '2026-11-03', protectionEnd: null, registeredFirst: true } });
    expect(defaultRejectReason(deal, first)).toBe('Arbor Cyber registered this customer for CleanStart Images on 3 Nov.');
    expect(defaultRejectReason(deal, describeCheck(deal, { kind: 'none' }))).toBe('');
  });
});

describe('routingText', () => {
  const m = (name: string, region: 'india' | 'middle_east' | 'all') => ({ id: name, name, region, team: 'x' });
  it('names the manager each region goes to', () => {
    expect(routingText([m('Farhan Qureshi', 'india'), m('Omar Nasser', 'middle_east')])).toBe('India goes to Farhan, Middle East to Omar.');
    expect(routingText([m('Farhan Qureshi', 'india')])).toBe('India goes to Farhan.');
    expect(routingText([])).toBe('');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/derive.test.ts`
Expected: FAIL, `describeCheck is not a function` (and the two other new exports).

- [ ] **Step 2: Implement the three derived helpers**

Append to `src/components/deals/derive.ts`. Its existing `@/lib/domain` import is type only, so add a separate value import `import { DEAL_REGIONS, PARTNER_REGION_LABEL, PRODUCT_LABEL } from "@/lib/domain";`, add `RegistrationCheckDto` to its dto type import (`ManagerOptionDto` is already there), and add `import type { HubspotHintDto } from "./types";`:

```ts
export interface Check {
  kind: "conflict" | "info" | "none";
  label: string;
  tone: BadgeTone;
  why: string;
  whyCls: string;
  /** The other partner's registration, when two partners claim the same customer and product. */
  rival?: { partnerName: string; registeredOn: string; registeredFirst: boolean };
}

type CheckedDeal = Pick<RegistrationListItem, "partnerName" | "registeredOn" | "product">;

/** The approvals "Checks" column: a rival registration, the same customer under another product, or clear. */
export function describeCheck(deal: CheckedDeal, check: RegistrationCheckDto, hint?: HubspotHintDto): Check {
  const other = check.other;
  if (check.kind === "conflict" && other) {
    let why: string;
    if (other.status === "accepted") {
      why = `${other.partnerName} already holds this, protected until ${fmtLong(other.protectionEnd ?? deal.registeredOn)}.`;
    } else if (!other.registeredFirst) {
      why = `${other.partnerName} also registered it on ${fmtShort(other.registeredOn)}. ${firstWord(deal.partnerName)} was first.`;
    } else {
      why = `${other.partnerName} registered it first, on ${fmtShort(other.registeredOn)}.`;
    }
    return {
      kind: "conflict",
      label: "Conflict",
      tone: "pending",
      why,
      whyCls: "why why-amber",
      rival: { partnerName: other.partnerName, registeredOn: other.registeredOn, registeredFirst: other.registeredFirst },
    };
  }
  if (hint) {
    return {
      kind: "conflict",
      label: "Conflict",
      tone: "pending",
      why: `${hint.holder ?? "Another partner"} already has an open deal for this customer in HubSpot.`,
      whyCls: "why why-amber",
    };
  }
  if (check.kind === "info" && other?.protectionEnd) {
    return {
      kind: "info",
      label: "Same customer",
      tone: "violet",
      why: `${firstWord(deal.partnerName)} already holds ${PRODUCT_LABEL[other.product]} here, until ${fmtLong(other.protectionEnd)}.`,
      whyCls: "why",
    };
  }
  return { kind: "none", label: "Clear", tone: "accepted", why: "", whyCls: "why" };
}

/** The reason the reject box starts with when another partner registered the same customer and product first. */
export function defaultRejectReason(deal: CheckedDeal, check: Check): string {
  const rival = check.rival;
  if (rival?.registeredFirst) {
    return `${rival.partnerName} registered this customer for ${PRODUCT_LABEL[deal.product]} on ${fmtShort(rival.registeredOn)}.`;
  }
  return "";
}

/** "India goes to Farhan, Middle East to Omar." from the managers partners can pick. */
export function routingText(managers: readonly ManagerOptionDto[]): string {
  const parts = DEAL_REGIONS.flatMap((region) => {
    const manager = managers.find((m) => m.region === region);
    return manager ? [{ region, first: firstWord(manager.name) }] : [];
  }).map((p, index) => `${PARTNER_REGION_LABEL[p.region]} ${index === 0 ? "goes to" : "to"} ${p.first}`);
  return parts.length ? `${parts.join(", ")}.` : "";
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/derive.test.ts`
Expected: PASS, 18 tests.

- [ ] **Step 3: Write the failing hint service tests**

```ts
// src/server/registrations/conflict-hints.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from '@/server/hubspot/fake';
import { hubspotConflictHints } from './conflict-hints';

const input = (over: Partial<{ registrationId: string; customerName: string; customerDomain: string | null; partnerHubspotCompanyId: string | null }> = {}) => ({
  registrationId: 'r1', customerName: 'Gulfway Freight', customerDomain: 'gulfwayfreight.ae', partnerHubspotCompanyId: '1', ...over,
});

const seed = async (hs: FakeHubspot) => {
  const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Gulfway Freight', domain: 'gulfwayfreight.ae', properties: {} });
  const mine = await hs.createDeal({ dealstage: hs.stageIds.Accepted, partner_company_id: '1', partner_name: 'Kestrel Systems' });
  const theirs = await hs.createDeal({ dealstage: hs.stageIds.Discovery, partner_company_id: '2', partner_name: 'Arbor Cyber' });
  await hs.associateDealWithCompany(mine.id, customer.id, 'customer');
  await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
  return { customer, mine, theirs };
};

describe('hubspotConflictHints', () => {
  it('names another partner that holds an open deal for the customer', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    expect(await hubspotConflictHints(hs, 'pipe-1', [input()])).toEqual({ r1: { registrationId: 'r1', holder: 'Arbor Cyber', openDeals: 1 } });
  });

  it('gives no hint when only the partner\'s own deal exists, when the customer is unknown, or when HubSpot is off', async () => {
    const hs = new FakeHubspot();
    const { theirs } = await seed(hs);
    hs.deals.delete(theirs.id);
    expect(await hubspotConflictHints(hs, 'pipe-1', [input()])).toEqual({});
    expect(await hubspotConflictHints(hs, 'pipe-1', [input({ customerName: 'Nobody Ltd', customerDomain: null })])).toEqual({});
    expect(await hubspotConflictHints(null, 'pipe-1', [input()])).toEqual({});
    expect(await hubspotConflictHints(hs, null, [input()])).toEqual({});
  });

  it('keeps the hints it already found when HubSpot fails part way, and never throws', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    const original = hs.findCompany.bind(hs);
    let calls = 0;
    hs.findCompany = async (args) => {
      calls += 1;
      if (calls === 2) throw new Error('429');
      return original(args);
    };
    const hints = await hubspotConflictHints(hs, 'pipe-1', [input(), input({ registrationId: 'r2' })]);
    expect(Object.keys(hints)).toEqual(['r1']);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations/conflict-hints.test.ts`
Expected: FAIL, "Cannot find module './conflict-hints'".

- [ ] **Step 4: Implement `conflict-hints.ts`**

```ts
// src/server/registrations/conflict-hints.ts
import type { HubspotHintDto } from '@/components/deals/types';
import { conflictingDeals } from '@/server/hubspot/lookup';
import type { HubspotApi } from '@/server/hubspot/types';
import { log } from '@/server/log';
import { withTimeout } from './hubspot-read';

const HINT_TIMEOUT_MS = 6000;

export interface ConflictInput {
  registrationId: string;
  customerName: string;
  customerDomain: string | null;
  /** The registering partner's HubSpot company, or null when it is not synced yet. */
  partnerHubspotCompanyId: string | null;
}

/**
 * Staff only. For each waiting registration: does another partner hold an open deal on the same HubSpot customer?
 * Read only, one lookup per row, one overall time limit. Failure, timeout or an unset token mean fewer hints, never an error.
 */
export async function hubspotConflictHints(
  hs: HubspotApi | null,
  pipelineId: string | null,
  inputs: readonly ConflictInput[],
): Promise<Record<string, HubspotHintDto>> {
  const hints: Record<string, HubspotHintDto> = {};
  if (!hs || !pipelineId) return hints;
  let stop = false;
  const work = (async (): Promise<void> => {
    for (const input of inputs) {
      if (stop) return;
      const company = await hs.findCompany({ domain: input.customerDomain, name: input.customerName });
      if (!company) continue;
      const open = await conflictingDeals(hs, {
        customerCompanyId: company.id,
        partnerCompanyId: input.partnerHubspotCompanyId ?? '',
        pipelineId,
      });
      if (open.length === 0) continue;
      hints[input.registrationId] = {
        registrationId: input.registrationId,
        holder: open[0]?.properties.partner_name ?? null,
        openDeals: open.length,
      };
    }
  })();
  try {
    if ((await withTimeout(work, HINT_TIMEOUT_MS)) === null) stop = true;
  } catch (error) {
    log.warn({ err: error }, 'HubSpot conflict hints failed');
  }
  return { ...hints };
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/registrations/conflict-hints.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the failing repo tests for decisions, queue and checks**

```ts
// src/server/repo/registrations.decide.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { registrationEvents, registrationMessages, registrations, users } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  acceptRegistration,
  conflictChecks,
  conflictInputs,
  countWaiting,
  getRegistration,
  listApprovalQueue,
  rejectRegistration,
  undoDecision,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems', hubspotCompanyId: '55' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', registeredBy: sales.id,
    managerId: farhan.id, region: 'india', registeredOn: '2026-11-04',
  });
  return { farhan, partner, sales, admin, reg };
};

describe('acceptRegistration', () => {
  it('accepts a pending registration: 89 days of protection after today, automatic lines and the recipients', async () => {
    const { farhan, sales, reg } = await setup();
    const result = await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    expect(result.registration).toMatchObject({
      status: 'accepted', stage: 'Accepted', protectionEnd: '2027-02-03', decidedByLabel: farhan.name,
      decidedAt: '2026-11-06T14:02:00.000Z', decidedOn: '2026-11-06', rejectionReason: null,
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Accepted, protected until 3 Feb 2027', byLabel: farhan.name, source: 'portal', auto: true });
    expect(result.registration.thread.at(-1)).toMatchObject({ body: 'Accepted. Protected until 3 Feb 2027.', side: 'staff', authorOrg: 'CleanStart', auto: true });
    expect(result.partnerName).toBe('Kestrel Systems');
    expect(result.decidedAt).toBe('2026-11-06T14:02:00.000Z');
    expect(result.recipientUserIds).toEqual([sales.id]);
  });

  it('tells the partner admins when the registrant has left', async () => {
    const { farhan, partner, admin, sales, reg } = await setup();
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, sales.id));
    const result = await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    expect(result.recipientUserIds).toEqual([admin.id]);
    expect(partner.id).toBe(result.registration.partnerId);
  });

  it('decides once: a second accept is already_decided', async () => {
    const { farhan, reg } = await setup();
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    const again = withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    await expect(again).rejects.toMatchObject({ reason: 'already_decided' });
    await expect(again).rejects.toBeInstanceOf(ConflictError);
  });

  it('is staff only and limited to the staff sales region', async () => {
    const { reg, partner } = await setup();
    const partnerViewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(partnerViewer, (tx) => acceptRegistration(tx, partnerViewer, { id: reg.id }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const gulf = await asStaff(db, 'sales', 'middle_east');
    await expect(withViewer(gulf, (tx) => acceptRegistration(tx, gulf, { id: reg.id }, clock))).rejects.toBeInstanceOf(NotFoundError);
    const india = await asStaff(db, 'sales', 'india');
    const done = await withViewer(india, (tx) => acceptRegistration(tx, india, { id: reg.id }, clock));
    expect(done.registration.status).toBe('accepted');
  });
});

describe('rejectRegistration', () => {
  it('needs a reason and then writes the reason into the timeline and the thread', async () => {
    const { farhan, reg } = await setup();
    const blank = withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: '   ' }, clock));
    await expect(blank).rejects.toBeInstanceOf(ValidationError);
    await expect(blank).rejects.toMatchObject({ issues: [{ path: 'reason' }] });
    const tooLong = withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: 'x'.repeat(501) }, clock));
    await expect(tooLong).rejects.toBeInstanceOf(ValidationError);
    const result = await withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: ' Add the budget owner. ' }, clock));
    expect(result.registration).toMatchObject({ status: 'rejected', stage: 'Not accepted', rejectionReason: 'Add the budget owner.', protectionEnd: null, decidedByLabel: farhan.name });
    expect(result.registration.history[0]).toMatchObject({ text: 'Not accepted: Add the budget owner.', auto: true });
    expect(result.registration.thread.at(-1)).toMatchObject({ body: 'Not accepted. Add the budget owner.', auto: true });
  });

  it('cannot reject what is already decided', async () => {
    const { farhan, reg } = await setup();
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    await expect(withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: 'late' }, clock))).rejects.toMatchObject({ reason: 'already_decided' });
  });
});

describe('undoDecision', () => {
  it('puts a fresh decision back in the queue and removes only its two automatic lines', async () => {
    const { farhan, reg } = await setup();
    await db.insert(registrationEvents).values({ registrationId: reg.id, at: new Date('2026-11-04T09:00:00Z'), text: 'Registered', byLabel: 'Karan Malhotra', source: 'portal' });
    await db.insert(registrationMessages).values({ registrationId: reg.id, authorName: 'Karan Malhotra', authorOrg: 'Kestrel Systems', side: 'partner', body: 'Any news?', createdAt: new Date('2026-11-05T09:00:00Z') });
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    const undone = await withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: reg.id }, fixedClock('2026-11-06T14:09:00Z')));
    expect(undone).toMatchObject({ status: 'pending', stage: 'Awaiting review', protectionEnd: null, decidedByLabel: null, decidedAt: null, rejectionReason: null });
    expect(undone.history.map((e) => e.text)).toEqual(['Registered']);
    expect(undone.thread.map((m) => m.body)).toEqual(['Any news?']);
  });

  it('keeps an older automatic line when a later decision is undone', async () => {
    const { farhan, reg } = await setup();
    await withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: 'First reason' }, fixedClock('2026-11-05T10:00:00Z')));
    await db.update(registrations).set({ status: 'pending', stage: 'Awaiting review', decidedBy: null, decidedAt: null, decidedByLabel: null, rejectionReason: null }).where(eq(registrations.id, reg.id));
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    const undone = await withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: reg.id }, clock));
    expect(undone.history.map((e) => e.text)).toEqual(['Not accepted: First reason']);
  });

  it('is refused after the window, for another person, once a HubSpot deal exists and for an undecided registration', async () => {
    const { farhan, reg } = await setup();
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    const late = withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: reg.id }, fixedClock('2026-11-06T14:13:00Z')));
    await expect(late).rejects.toMatchObject({ reason: 'undo_window_closed' });
    const colleague = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(colleague, (tx) => undoDecision(tx, colleague, { id: reg.id }, clock))).rejects.toMatchObject({ reason: 'undo_window_closed' });
    await db.update(registrations).set({ hubspotDealId: '4821' }).where(eq(registrations.id, reg.id));
    await expect(withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: reg.id }, clock))).rejects.toMatchObject({ reason: 'deal_in_crm' });
    const pending = await makeRegistration(db, { customerName: 'Other Co', managerId: farhan.id });
    await expect(withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: pending.id }, clock))).rejects.toMatchObject({ reason: 'not_decided' });
  });

  it('allows a decision to be taken again after an undo', async () => {
    const { farhan, reg } = await setup();
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    await withViewer(farhan, (tx) => undoDecision(tx, farhan, { id: reg.id }, clock));
    const second = await withViewer(farhan, (tx) => rejectRegistration(tx, farhan, { id: reg.id, reason: 'Duplicate' }, clock));
    expect(second.registration.history.filter((e) => e.auto)).toHaveLength(1);
  });
});

describe('listApprovalQueue', () => {
  const decide = (id: string, by: string, at: string, over: Partial<typeof registrations.$inferInsert> = {}) =>
    db.update(registrations).set({ decidedBy: by, decidedAt: new Date(at), ...over }).where(eq(registrations.id, id));

  it('lists waiting rows oldest first, keeps a fresh own decision with canUndo, and counts the rest', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    const omar = await asStaff(db, 'partner_manager', 'middle_east');
    const partner = await makePartner(db, {});
    const a = await makeRegistration(db, { partnerId: partner.id, customerName: 'A Co', registeredOn: '2026-11-02', managerId: farhan.id });
    const b = await makeRegistration(db, { partnerId: partner.id, customerName: 'B Co', registeredOn: '2026-11-06', managerId: farhan.id });
    const c = await makeRegistration(db, { partnerId: partner.id, customerName: 'C Co', registeredOn: '2026-11-03', status: 'accepted', managerId: farhan.id, protectionEnd: '2026-11-15' });
    await decide(c.id, farhan.id, '2026-11-06T14:00:00Z');
    const d = await makeRegistration(db, { partnerId: partner.id, customerName: 'D Co', registeredOn: '2026-11-01', status: 'rejected', managerId: farhan.id });
    await decide(d.id, omar.id, '2026-11-03T10:00:00Z');
    const e = await makeRegistration(db, { partnerId: partner.id, customerName: 'E Co', registeredOn: '2026-11-05', region: 'middle_east', managerId: omar.id });

    const all = await withViewer(farhan, (tx) => listApprovalQueue(tx, farhan, { scope: 'all' }, clock));
    expect(all.rows.map((r) => r.registration.id)).toEqual([a.id, c.id, e.id, b.id]);
    expect(all.rows.map((r) => [r.waitingBusinessDays, r.overSla, r.canUndo])).toEqual([[4, true, false], [3, false, true], [1, false, false], [0, false, false]]);
    expect(all.counts).toEqual({ waiting: 3, overSla: 1, conflicts: 0, acceptedLast7Days: 1, rejectedLast7Days: 1, expiringIn14Days: 1 });
    expect(all.recentDecisions.map((r) => r.id)).toEqual([c.id, d.id]);

    const mine = await withViewer(farhan, (tx) => listApprovalQueue(tx, farhan, { scope: 'mine' }, clock));
    expect(mine.rows.map((r) => r.registration.id)).toEqual([a.id, c.id, b.id]);
  });

  it('does not offer undo to another person, after the window or once a deal exists', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    const other = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const theirs = await makeRegistration(db, { partnerId: partner.id, customerName: 'T Co', status: 'accepted', managerId: farhan.id });
    await db.update(registrations).set({ decidedBy: other.id, decidedAt: new Date('2026-11-06T14:00:00Z') }).where(eq(registrations.id, theirs.id));
    const stale = await makeRegistration(db, { partnerId: partner.id, customerName: 'S Co', status: 'rejected', managerId: farhan.id });
    await db.update(registrations).set({ decidedBy: farhan.id, decidedAt: new Date('2026-11-06T13:00:00Z') }).where(eq(registrations.id, stale.id));
    const synced = await makeRegistration(db, { partnerId: partner.id, customerName: 'H Co', status: 'accepted', managerId: farhan.id, hubspotDealId: '9' });
    await db.update(registrations).set({ decidedBy: farhan.id, decidedAt: new Date('2026-11-06T14:00:00Z') }).where(eq(registrations.id, synced.id));
    const queue = await withViewer(farhan, (tx) => listApprovalQueue(tx, farhan, { scope: 'all' }, clock));
    expect(queue.rows).toEqual([]);
    expect(queue.recentDecisions).toHaveLength(3);
  });

  it('limits staff sales to their region and refuses partners and marketing', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'india');
    const partner = await makePartner(db, {});
    const india = await makeRegistration(db, { partnerId: partner.id, customerName: 'I Co', region: 'india', managerId: farhan.id });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'G Co', region: 'middle_east' });
    const salesIndia = await asStaff(db, 'sales', 'india');
    const queue = await withViewer(salesIndia, (tx) => listApprovalQueue(tx, salesIndia, { scope: 'all' }, clock));
    expect(queue.rows.map((r) => r.registration.id)).toEqual([india.id]);
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => listApprovalQueue(tx, viewer, { scope: 'all' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => listApprovalQueue(tx, marketing, { scope: 'all' }, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('reports conflicts in the counts', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { customerName: 'Gulfway Freight', product: 'images' });
    await makeRegistration(db, { customerName: 'Gulfway Freight', product: 'images' });
    const queue = await withViewer(farhan, (tx) => listApprovalQueue(tx, farhan, { scope: 'all' }, clock));
    expect(queue.counts.conflicts).toBe(2);
  });
});

describe('conflictChecks', () => {
  it('flags two partners waiting on the same customer and product, and says who was first', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'all');
    const kestrel = await makePartner(db, { name: 'Kestrel Systems' });
    const arbor = await makePartner(db, { name: 'Arbor Cyber' });
    const first = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Gulfway Freight', product: 'images', registeredOn: '2026-11-03' });
    const second = await makeRegistration(db, { partnerId: arbor.id, customerName: 'gulfway freight', product: 'images', registeredOn: '2026-11-05' });
    const checks = await withViewer(farhan, (tx) => conflictChecks(tx, farhan, { registrationIds: [first.id, second.id] }));
    expect(checks[first.id]).toEqual({ kind: 'conflict', other: { id: second.id, partnerName: 'Arbor Cyber', product: 'images', status: 'pending', registeredOn: '2026-11-05', protectionEnd: null, registeredFirst: false } });
    expect(checks[second.id]).toMatchObject({ kind: 'conflict', other: { id: first.id, partnerName: 'Kestrel Systems', registeredFirst: true } });
  });

  it('prefers an accepted rival, reports a partner\'s own other product as info and is clear otherwise', async () => {
    const farhan = await asStaff(db, 'partner_manager', 'all');
    const kestrel = await makePartner(db, {});
    const dunes = await makePartner(db, { name: 'Dunes Networks' });
    const harbourline = await makePartner(db, { name: 'Harbourline IT' });
    const mine = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Pearl Gulf Bank', product: 'cleansight' });
    await makeRegistration(db, { partnerId: dunes.id, customerName: 'Pearl Gulf Bank', product: 'cleansight', status: 'pending' });
    await makeRegistration(db, { partnerId: harbourline.id, customerName: 'Pearl Gulf Bank', product: 'cleansight', status: 'accepted', protectionEnd: '2027-02-02' });
    const held = await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Tejas Labs', product: 'libraries' });
    await makeRegistration(db, { partnerId: kestrel.id, customerName: 'Tejas Labs', product: 'images', status: 'accepted', protectionEnd: '2027-01-12' });
    const lonely = await makeRegistration(db, { customerName: 'Solo Customer' });
    const checks = await withViewer(farhan, (tx) => conflictChecks(tx, farhan, { registrationIds: [mine.id, held.id, lonely.id] }));
    expect(checks[mine.id]).toMatchObject({ kind: 'conflict', other: { partnerName: 'Harbourline IT', status: 'accepted', protectionEnd: '2027-02-02' } });
    expect(checks[held.id]).toMatchObject({ kind: 'info', other: { product: 'images', protectionEnd: '2027-01-12' } });
    expect(checks[lonely.id]).toEqual({ kind: 'none' });
  });

  it('is staff only', async () => {
    const viewer = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(viewer, (tx) => conflictChecks(tx, viewer, { registrationIds: [] }))).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('countWaiting and conflictInputs', () => {
  it('counts pending registrations in the staff scope, and is 0 for marketing', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { region: 'india' });
    await makeRegistration(db, { region: 'middle_east' });
    await makeRegistration(db, { region: 'india', status: 'accepted' });
    expect(await withViewer(manager, (tx) => countWaiting(tx, manager))).toBe(2);
    const india = await asStaff(db, 'sales', 'india');
    expect(await withViewer(india, (tx) => countWaiting(tx, india))).toBe(1);
    const marketing = await asStaff(db, 'marketing', 'all');
    expect(await withViewer(marketing, (tx) => countWaiting(tx, marketing))).toBe(0);
    const partner = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(partner, (tx) => countWaiting(tx, partner))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns what the HubSpot hint needs for waiting registrations only', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { hubspotCompanyId: '55' });
    const waiting = await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in' });
    const decided = await makeRegistration(db, { partnerId: partner.id, customerName: 'Other', status: 'accepted' });
    const inputs = await withViewer(manager, (tx) => conflictInputs(tx, manager, { registrationIds: [waiting.id, decided.id] }));
    expect(inputs).toEqual([{ registrationId: waiting.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in', partnerHubspotCompanyId: '55' }]);
  });
});

describe('detail after a decision', () => {
  it('shows through getRegistration for the partner who registered it', async () => {
    const { farhan, admin, reg } = await setup();
    await withViewer(farhan, (tx) => acceptRegistration(tx, farhan, { id: reg.id }, clock));
    const viewer = await asPartner(db, { partnerId: admin.partnerId!, role: 'partner_admin' });
    const seen = await withViewer(viewer, (tx) => getRegistration(tx, viewer, reg.id));
    expect(seen.status).toBe('accepted');
    expect(seen.thread.at(-1)?.auto).toBe(true);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.decide.test.ts`
Expected: FAIL, "acceptRegistration is not a function" (the module exists from M2.1 but lacks the new exports).

- [ ] **Step 6: Add `computeChecks` to `src/server/registrations/mappers.ts`**

Add `or, sql, and` to the `drizzle-orm` import (`import { and, asc, desc, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm';`) and `RegistrationCheckDto` to the dto type import, then append:

```ts
const sameNameIs = (name: string) => sql`lower(${registrations.customerName}) = ${name.toLowerCase()}`;

/** Accepted rivals first, then the earliest registration. */
const strongest = (a: ListRow, b: ListRow): number =>
  Number(b.status === 'accepted') - Number(a.status === 'accepted') || a.createdAt.getTime() - b.createdAt.getTime();

/**
 * Staff only data. Another partner's pending or accepted registration for the same customer and product is a conflict;
 * the same partner already holding an accepted registration for another product of that customer is information.
 * Region is not applied: the point of the check is to see across regions.
 */
export async function computeChecks(tx: Tx, rows: readonly ListRow[]): Promise<Record<string, RegistrationCheckDto>> {
  const checks: Record<string, RegistrationCheckDto> = {};
  const names = [...new Set(rows.map((r) => r.customerName.toLowerCase()))];
  if (names.length === 0) return checks;
  const others = await selectRows(tx).where(
    and(or(...names.map(sameNameIs)), inArray(registrations.status, ['pending', 'accepted'])),
  );
  for (const row of rows) {
    const same = others.filter((o) => o.id !== row.id && o.customerName.toLowerCase() === row.customerName.toLowerCase());
    const rival = same.filter((o) => o.product === row.product && o.partnerId !== row.partnerId).sort(strongest)[0];
    if (rival) {
      checks[row.id] = {
        kind: 'conflict',
        other: {
          id: rival.id,
          partnerName: rival.partnerName,
          product: rival.product,
          status: rival.status,
          registeredOn: rival.registeredOn,
          protectionEnd: rival.protectionEnd,
          registeredFirst: rival.createdAt.getTime() < row.createdAt.getTime(),
        },
      };
      continue;
    }
    const held = same.find((o) => o.partnerId === row.partnerId && o.product !== row.product && o.status === 'accepted' && o.protectionEnd);
    checks[row.id] = held
      ? {
          kind: 'info',
          other: {
            id: held.id,
            partnerName: held.partnerName,
            product: held.product,
            status: held.status,
            registeredOn: held.registeredOn,
            protectionEnd: held.protectionEnd,
            registeredFirst: false,
          },
        }
      : { kind: 'none' };
  }
  return checks;
}
```

- [ ] **Step 7: Implement the decision functions in `src/server/repo/registrations.ts`**

Replace the import block at the top of the file with:

```ts
import { randomUUID } from 'node:crypto';
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm';
import {
  partners,
  registrationContacts,
  registrationEvents,
  registrationMessages,
  registrations,
} from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { normalizeDomain } from '@/lib/customer';
import { addDays, fmtLong } from '@/lib/dates';
import {
  EXPIRING_SOON_DAYS,
  isOverSla,
  protectionEndFor,
  RECENT_DECISION_DAYS,
  UNDO_WINDOW_MINUTES,
  waitingBusinessDays,
} from '@/lib/deal-rules';
import type { StageLabel } from '@/server/hubspot/types';
import {
  type DealRegion,
  PRODUCT_LABEL,
  type Product,
  type RegistrationStatus,
  STAGE_AWAITING_REVIEW,
  STAGE_NOT_ACCEPTED,
} from '@/lib/domain';
import type {
  ApprovalQueueDto,
  ApprovalRowDto,
  CustomerSuggestionDto,
  DecisionResult,
  RegistrationCheckDto,
  RegistrationDetailDto,
  RegistrationListItem,
} from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { computeChecks, loadDetails, selectRows, toListItem } from '@/server/registrations/mappers';
import { isUniqueViolation } from '@/server/registrations/pg-errors';
import { decisionRecipients } from '@/server/registrations/recipients';
import { assertUuid, registrationScope } from '@/server/registrations/scope';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';
import { listManagerOptions } from './staff';
```

Append before the `const probeClock = ...` line:

```ts
const STAGE_ACCEPTED: StageLabel = 'Accepted';
const MAX_REASON = 500;
const DAY_MS = 86_400_000;

/** The automatic timeline event and thread line a decision writes, both stamped with the decision time so an undo finds exactly them. */
async function writeDecisionLines(
  tx: Tx,
  viewer: Viewer,
  registrationId: string,
  at: Date,
  eventText: string,
  threadText: string,
): Promise<void> {
  await tx.insert(registrationEvents).values({ registrationId, at, text: eventText, byLabel: viewer.name, source: 'portal', auto: true });
  await tx.insert(registrationMessages).values({
    id: randomUUID(),
    registrationId,
    authorId: viewer.id,
    authorName: viewer.name,
    authorOrg: 'CleanStart',
    side: 'staff',
    body: threadText,
    auto: true,
    createdAt: at,
  });
}

async function decisionResult(tx: Tx, viewer: Viewer, id: string, decidedAt: Date): Promise<DecisionResult> {
  const registration = await getRegistration(tx, viewer, id);
  const recipientUserIds = await decisionRecipients(tx, { partnerId: registration.partnerId, registeredById: registration.registeredById });
  return { registration, partnerName: registration.partnerName, decidedAt: decidedAt.toISOString(), recipientUserIds };
}

/**
 * Accept. Requires status 'pending' (else ConflictError('already_decided')). Sets status 'accepted', stage 'Accepted',
 * decided* fields, protection_end = protectionEndFor(clock.today()), writes the timeline event "Accepted, protected
 * until <d>" and the automatic thread line (both auto = true), and returns the recipients. The action audits, enqueues
 * registration.create and notifies.
 */
export async function acceptRegistration(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<DecisionResult> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'pending') throw new ConflictError('already_decided', 'This registration was already decided.');
  const now = clock.now();
  const end = protectionEndFor(clock.today());
  await tx
    .update(registrations)
    .set({
      status: 'accepted',
      stage: STAGE_ACCEPTED,
      decidedBy: viewer.id,
      decidedByLabel: viewer.name,
      decidedAt: now,
      protectionEnd: end,
      rejectionReason: null,
    })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await writeDecisionLines(tx, viewer, current.id, now, `Accepted, protected until ${fmtLong(end)}`, `Accepted. Protected until ${fmtLong(end)}.`);
  return decisionResult(tx, viewer, current.id, now);
}

/** Reject. Needs a non empty reason. Sets status 'rejected', stage 'Not accepted', and the auto event and thread line. */
export async function rejectRegistration(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<DecisionResult> {
  assertStaff(viewer);
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Add a reason the partner will see.' }]);
  if (reason.length > MAX_REASON) throw new ValidationError([{ path: 'reason', message: `Keep the reason under ${MAX_REASON} characters.` }]);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'pending') throw new ConflictError('already_decided', 'This registration was already decided.');
  const now = clock.now();
  await tx
    .update(registrations)
    .set({
      status: 'rejected',
      stage: STAGE_NOT_ACCEPTED,
      decidedBy: viewer.id,
      decidedByLabel: viewer.name,
      decidedAt: now,
      rejectionReason: reason,
    })
    .where(and(eq(registrations.id, current.id), eq(registrations.status, 'pending')));
  await writeDecisionLines(tx, viewer, current.id, now, `Not accepted: ${reason}`, `Not accepted. ${reason}`);
  return decisionResult(tx, viewer, current.id, now);
}

/**
 * Undo within UNDO_WINDOW_MINUTES by the person who decided. Back to 'pending', clears decision fields, deletes the
 * auto event and auto thread line. Throws ConflictError('undo_window_closed') and ConflictError('deal_in_crm') when
 * a HubSpot deal already exists.
 */
export async function undoDecision(tx: Tx, viewer: Viewer, input: { id: string }, clock: Clock): Promise<RegistrationDetailDto> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'accepted' && current.status !== 'rejected') {
    throw new ConflictError('not_decided', 'Only a registration that was just accepted or rejected can be undone.');
  }
  if (current.crmRef !== null) {
    throw new ConflictError('deal_in_crm', 'The HubSpot deal already exists, so this decision can no longer be undone here.');
  }
  const [raw] = await tx
    .select({ decidedBy: registrations.decidedBy, decidedAt: registrations.decidedAt })
    .from(registrations)
    .where(eq(registrations.id, current.id))
    .limit(1);
  const decidedAt = raw?.decidedAt;
  if (!raw || !decidedAt || raw.decidedBy !== viewer.id || clock.now().getTime() - decidedAt.getTime() > UNDO_WINDOW_MINUTES * 60_000) {
    throw new ConflictError('undo_window_closed', `A decision can be undone by the person who took it, within ${UNDO_WINDOW_MINUTES} minutes.`);
  }
  const events = await tx
    .delete(registrationEvents)
    .where(and(eq(registrationEvents.registrationId, current.id), eq(registrationEvents.auto, true), eq(registrationEvents.at, decidedAt)))
    .returning({ id: registrationEvents.id });
  if (events.length === 0) throw new Error(`undoDecision: no automatic timeline event at the decision time for ${current.id}`);
  await tx
    .delete(registrationMessages)
    .where(and(eq(registrationMessages.registrationId, current.id), eq(registrationMessages.auto, true), eq(registrationMessages.createdAt, decidedAt)));
  await tx
    .update(registrations)
    .set({
      status: 'pending',
      stage: STAGE_AWAITING_REVIEW,
      protectionEnd: null,
      decidedBy: null,
      decidedByLabel: null,
      decidedAt: null,
      rejectionReason: null,
    })
    .where(eq(registrations.id, current.id));
  return getRegistration(tx, viewer, current.id);
}

/** Conflict and same-customer hints from portal data. The HubSpot check is layered on by the action (H4.7). */
export async function conflictChecks(
  tx: Tx,
  viewer: Viewer,
  input: { registrationIds: string[] },
): Promise<Record<string, RegistrationCheckDto>> {
  assertStaff(viewer);
  if (input.registrationIds.length === 0) return {};
  const rows = await selectRows(tx).where(and(inArray(registrations.id, input.registrationIds), registrationScope(viewer)));
  return computeChecks(tx, rows);
}

const bySince = (a: RegistrationDetailDto, b: RegistrationDetailDto): number =>
  (a.resubmittedOn ?? a.registeredOn).localeCompare(b.resubmittedOn ?? b.registeredOn) || a.registeredAt.localeCompare(b.registeredAt);

/**
 * Staff (partner manager, staff sales in scope). `scope: 'mine'` = the viewer's region or managerId; 'all' = every region in
 * the viewer's scope. The counts always cover the viewer's whole scope, whichever rows are listed.
 */
export async function listApprovalQueue(
  tx: Tx,
  viewer: Viewer,
  input: { scope: 'mine' | 'all' },
  clock: Clock,
): Promise<ApprovalQueueDto> {
  assertStaff(viewer);
  const scope = registrationScope(viewer);
  const mine: SQL | undefined =
    input.scope === 'mine' && viewer.kind === 'staff'
      ? viewer.region === 'all'
        ? eq(registrations.managerId, viewer.id)
        : eq(registrations.region, viewer.region)
      : undefined;
  const now = clock.now();
  const today = clock.today();
  const undoCutoff = new Date(now.getTime() - UNDO_WINDOW_MINUTES * 60_000);
  const recentCutoff = new Date(now.getTime() - RECENT_DECISION_DAYS * DAY_MS);

  const rows = await selectRows(tx).where(
    and(
      scope,
      mine,
      or(
        eq(registrations.status, 'pending'),
        and(
          inArray(registrations.status, ['accepted', 'rejected']),
          eq(registrations.decidedBy, viewer.id),
          gte(registrations.decidedAt, undoCutoff),
          isNull(registrations.hubspotDealId),
        ),
      ),
    ),
  );
  const details = await loadDetails(tx, rows);
  const checks = await computeChecks(tx, rows);
  const queueRows: ApprovalRowDto[] = details
    .map((registration): ApprovalRowDto => {
      const since = registration.resubmittedOn ?? registration.registeredOn;
      return {
        registration,
        check: checks[registration.id] ?? { kind: 'none' },
        waitingBusinessDays: waitingBusinessDays(since, today),
        overSla: registration.status === 'pending' && isOverSla(since, today),
        canUndo: registration.status !== 'pending',
      };
    })
    .sort((a, b) => bySince(a.registration, b.registration));

  const decidedWhere = and(scope, isNotNull(registrations.decidedAt), gte(registrations.decidedAt, recentCutoff), ne(registrations.status, 'pending'));
  const [decided] = await tx
    .select({
      accepted: sql<number>`count(*) filter (where ${registrations.status} <> 'rejected')::int`,
      rejected: sql<number>`count(*) filter (where ${registrations.status} = 'rejected')::int`,
    })
    .from(registrations)
    .where(decidedWhere);
  const [expiring] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted'), gte(registrations.protectionEnd, today), lte(registrations.protectionEnd, addDays(today, EXPIRING_SOON_DAYS))));
  const recent = await selectRows(tx).where(decidedWhere).orderBy(desc(registrations.decidedAt), desc(registrations.id)).limit(50);

  const waiting = queueRows.filter((r) => r.registration.status === 'pending');
  return {
    rows: queueRows,
    counts: {
      waiting: waiting.length,
      overSla: waiting.filter((r) => r.overSla).length,
      conflicts: waiting.filter((r) => r.check.kind === 'conflict').length,
      acceptedLast7Days: decided?.accepted ?? 0,
      rejectedLast7Days: decided?.rejected ?? 0,
      expiringIn14Days: expiring?.n ?? 0,
    },
    recentDecisions: recent.map(toListItem),
  };
}

/** Staff. Pending registrations in the viewer's scope, for the nav badge. Marketing has no deals and counts 0. */
export async function countWaiting(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  if (viewer.role === 'marketing') return 0;
  const [row] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(registrationScope(viewer), eq(registrations.status, 'pending')));
  return row?.n ?? 0;
}

export interface ConflictHintInput {
  registrationId: string;
  customerName: string;
  customerDomain: string | null;
  partnerHubspotCompanyId: string | null;
}

/** Staff. What the read only HubSpot conflict hint needs for the waiting registrations among `registrationIds`. */
export async function conflictInputs(tx: Tx, viewer: Viewer, input: { registrationIds: string[] }): Promise<ConflictHintInput[]> {
  assertStaff(viewer);
  if (input.registrationIds.length === 0) return [];
  const rows = await tx
    .select({
      id: registrations.id,
      customerName: registrations.customerName,
      customerDomain: registrations.customerDomain,
      partnerHubspotCompanyId: partners.hubspotCompanyId,
    })
    .from(registrations)
    .innerJoin(partners, eq(partners.id, registrations.partnerId))
    .where(and(inArray(registrations.id, input.registrationIds), eq(registrations.status, 'pending'), registrationScope(viewer)));
  return rows.map((r) => ({
    registrationId: r.id,
    customerName: r.customerName,
    customerDomain: r.customerDomain,
    partnerHubspotCompanyId: r.partnerHubspotCompanyId,
  }));
}
```

Replace the whole `isolation` block at the end of the file with:

```ts
export const isolation = defineIsolation<
  | 'listRegistrations' | 'getRegistration' | 'lockRegistration' | 'createRegistrations' | 'resubmitRegistration'
  | 'customerSuggestions' | 'acceptRegistration' | 'rejectRegistration' | 'undoDecision' | 'conflictChecks'
  | 'listApprovalQueue' | 'countWaiting' | 'conflictInputs'
>({
  listRegistrations: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await listRegistrations(tx, viewer, { limit: 1000 })).filter((r) => r.partnerId !== viewer.partnerId),
  },
  getRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getRegistration(tx, viewer, ctx.b.registrationId) },
  lockRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => lockRegistration(tx, viewer, ctx.b.registrationId) },
  createRegistrations: {
    scope: 'tenant',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) =>
      createRegistrations(
        tx,
        viewer,
        { partnerId: ctx.b.partnerId, customer: 'Isolation Probe', website: null, products: ['images'], region: 'india', contact: null, expectedClose: null, notes: null },
        probeClock,
      ),
  },
  resubmitRegistration: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) =>
      resubmitRegistration(tx, viewer, { id: ctx.b.registrationId, contact: { name: 'Probe', role: null, email: 'probe@example.com' }, note: null }, probeClock),
  },
  customerSuggestions: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await customerSuggestions(tx, viewer, { q: '' })).flatMap((s) => s.registrations).filter((r) => r.id === ctx.b.registrationId),
  },
  acceptRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => acceptRegistration(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  rejectRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => rejectRegistration(tx, viewer, { id: ctx.b.registrationId, reason: 'probe' }, probeClock) },
  undoDecision: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => undoDecision(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  conflictChecks: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictChecks(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
  listApprovalQueue: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listApprovalQueue(tx, viewer, { scope: 'all' }, probeClock) },
  countWaiting: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => countWaiting(tx, viewer) },
  conflictInputs: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictInputs(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.decide.test.ts src/server/repo/registrations.create.test.ts src/server/repo/isolation.test.ts`
Expected: PASS: 20 tests in the decide file, 17 in the create file, and the isolation matrix green. If the `undoDecision` test fails with "no automatic timeline event" the DELETE policy of Contract change request 2 is missing: write a `blocked` line, do not work around it.

- [ ] **Step 8: Write the failing action tests**

```ts
// src/server/actions/decisions.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
});
const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
const crm = vi.hoisted(() => ({ hs: null as import('@/server/hubspot/types').HubspotApi | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));
vi.mock('@/server/hubspot/client', () => ({
  createHubspot: () => {
    if (!crm.hs) throw new Error('HUBSPOT_PORTAL_TOKEN is not set');
    return crm.hs;
  },
}));

import { auditLog, hubspotOutbox, notifications, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { systemClock } from '@/lib/clock';
import { protectionEndFor } from '@/lib/deal-rules';
import { FakeEmailTransport } from '@/server/email/fake';
import { FakeHubspot } from '@/server/hubspot/fake';
import {
  acceptRegistrationAction,
  hubspotConflictHintsAction,
  rejectRegistrationAction,
  undoDecisionAction,
} from './decisions';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  crm.hs = null;
  session.viewer = null;
});

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example', name: 'Karan Malhotra' });
  const reg = await makeRegistration(db, { partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', registeredBy: sales.id, managerId: farhan.id, region: 'india' });
  return { farhan, partner, sales, reg };
};

describe('acceptRegistrationAction', () => {
  it('accepts, audits once, queues exactly one HubSpot create, notifies and emails the registrant', async () => {
    const { farhan, sales, reg } = await setup();
    session.viewer = farhan;
    const result = await acceptRegistrationAction({ id: reg.id });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toMatchObject({ status: 'accepted', protectionEnd: protectionEndFor(systemClock.today()) });
    const audit = await db.select().from(auditLog).where(eq(auditLog.event, 'registration.accepted'));
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ kind: 'deal_decisions', who: 'staff', actorLabel: farhan.name, subjectId: reg.id, target: 'Vardhan Capital, CleanSight, from Kestrel Systems' });
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'registration.create', subjectId: reg.id, status: 'pending' });
    expect(outbox[0]?.idempotencyKey).toMatch(new RegExp(`^registration\\.create:${reg.id}:\\d{13}$`));
    const notes = await db.select().from(notifications).where(eq(notifications.userId, sales.id));
    expect(notes[0]).toMatchObject({ kind: 'registration_accepted', link: `/partner/deals/${reg.id}` });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Vardhan Capital');
  });

  it('is a conflict the second time and leaves one outbox row', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });

  it('is forbidden for a partner viewer and for staff sales outside their region', async () => {
    const { partner, reg } = await setup();
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asStaff(db, 'sales', 'middle_east');
    expect(await acceptRegistrationAction({ id: reg.id })).toMatchObject({ ok: false, error: { code: 'not_found' } });
    expect((await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]?.status).toBe('pending');
  });
});

describe('rejectRegistrationAction', () => {
  it('needs a reason, then rejects with the reason in the audit entry, the notification and the email', async () => {
    const { farhan, sales, reg } = await setup();
    session.viewer = farhan;
    expect(await rejectRegistrationAction({ id: reg.id, reason: '  ' })).toMatchObject({ ok: false, error: { code: 'validation', issues: [{ path: 'reason' }] } });
    const result = await rejectRegistrationAction({ id: reg.id, reason: 'Add the budget owner.' });
    expect(result.ok).toBe(true);
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.rejected')))[0]).toMatchObject({ note: 'Reason sent to the partner: Add the budget owner.' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, sales.id)))[0]).toMatchObject({ kind: 'registration_rejected', body: 'Add the budget owner.' });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Add the budget owner.');
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });
});

describe('undoDecisionAction', () => {
  it('undoes a fresh decision and writes an audit entry', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    const result = await undoDecisionAction({ id: reg.id });
    expect(result).toMatchObject({ ok: true, data: { status: 'pending', protectionEnd: null } });
    expect(await db.select().from(auditLog).where(eq(auditLog.event, 'registration.decision_undone'))).toHaveLength(1);
  });

  it('is refused after the window and once a deal exists, with a message the screen can show', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    await acceptRegistrationAction({ id: reg.id });
    await db.update(registrations).set({ decidedAt: new Date(Date.now() - 11 * 60_000) }).where(eq(registrations.id, reg.id));
    const late = await undoDecisionAction({ id: reg.id });
    expect(late).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(late.ok === false && late.error.message).toContain('10 minutes');
    await db.update(registrations).set({ decidedAt: new Date(), hubspotDealId: '77' }).where(eq(registrations.id, reg.id));
    const synced = await undoDecisionAction({ id: reg.id });
    expect(synced.ok === false && synced.error.message).toContain('HubSpot');
  });
});

describe('hubspotConflictHintsAction', () => {
  it('names another partner\'s open HubSpot deal for waiting registrations', async () => {
    const { farhan, reg } = await setup();
    session.viewer = farhan;
    const hs = new FakeHubspot();
    const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: null, properties: {} });
    const theirs = await hs.createDeal({ dealstage: hs.stageIds.Discovery, partner_company_id: '2', partner_name: 'Arbor Cyber' });
    await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
    crm.hs = hs;
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toEqual({
      ok: true,
      data: { [reg.id]: { registrationId: reg.id, holder: 'Arbor Cyber', openDeals: 1 } },
    });
  });

  it('returns no hints when HubSpot is not configured and is not for partners', async () => {
    const { farhan, partner, reg } = await setup();
    session.viewer = farhan;
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toEqual({ ok: true, data: {} });
    session.viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    expect(await hubspotConflictHintsAction({ ids: [reg.id] })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/decisions.test.ts`
Expected: FAIL, "Cannot find module './decisions'".

- [ ] **Step 9: Implement `src/server/actions/decisions.ts`**

The accept action is the worked example of contracts F.8 with two differences: the audit note uses the formatted date, and the HubSpot hint action is added.

```ts
// src/server/actions/decisions.ts
'use server';

import { z } from 'zod';
import type { HubspotHintDto } from '@/components/deals/types';
import { env } from '@/env';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildDealAccepted, buildDealRejected } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { rateLimit } from '@/server/rate-limit';
import { hubspotConflictHints } from '@/server/registrations/conflict-hints';
import { readOnlyHubspot } from '@/server/registrations/hubspot-read';
import { withViewer } from '@/server/repo/context';
import {
  acceptRegistration,
  conflictInputs,
  lockRegistration,
  rejectRegistration,
  undoDecision,
} from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const idSchema = z.object({ id: z.string().uuid() });
const rejectSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Add a reason the partner will see.').max(500),
});

const targetOf = (r: Pick<RegistrationDetailDto, 'customer' | 'product' | 'partnerName'>): string =>
  `${r.customer}, ${PRODUCT_LABEL[r.product]}, from ${r.partnerName}`;

export async function acceptRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.accept', schema: idSchema }, raw, async (ctx, input) => {
    const decision = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide', { partnerId: current.partnerId, region: current.region });
      const result = await acceptRegistration(tx, ctx.viewer, { id: current.id }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.accepted',
        target: targetOf(reg),
        note: `Protected until ${fmtLong(reg.protectionEnd ?? '')}. HubSpot deal queued.`,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      await enqueue(tx, { op: 'registration.create', subjectId: reg.id, version: String(Date.parse(result.decidedAt)) });
      const items: NewNotification[] = result.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_accepted',
        title: `${reg.customer} was accepted`,
        body: `${PRODUCT_LABEL[reg.product]}, protected until ${fmtLong(reg.protectionEnd ?? '')}`,
        link: ROUTES.partner.deal(reg.id),
      }));
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = decision.result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(decision.items)) {
        await sendEmail(
          buildDealAccepted({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            partnerName: decision.result.partnerName,
            protectionEnd: reg.protectionEnd ?? '',
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}

export async function rejectRegistrationAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.reject', schema: rejectSchema }, raw, async (ctx, input) => {
    const decision = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide', { partnerId: current.partnerId, region: current.region });
      const result = await rejectRegistration(tx, ctx.viewer, { id: current.id, reason: input.reason }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.rejected',
        target: targetOf(reg),
        note: `Reason sent to the partner: ${reg.rejectionReason ?? input.reason}`,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      const items: NewNotification[] = result.recipientUserIds.map((userId) => ({
        userId,
        kind: 'registration_rejected',
        title: `${reg.customer} was not accepted`,
        body: reg.rejectionReason ?? input.reason,
        link: ROUTES.partner.deal(reg.id),
      }));
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = decision.result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(decision.items)) {
        await sendEmail(
          buildDealRejected({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            reason: reg.rejectionReason ?? input.reason,
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}

export async function undoDecisionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.undo', schema: idSchema }, raw, async (ctx, input) => {
    const reg = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.undo_decision', { partnerId: current.partnerId, region: current.region });
      const undone = await undoDecision(tx, ctx.viewer, { id: current.id }, ctx.clock);
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.decision_undone',
        target: targetOf(undone),
        note: 'The registration is back in the approvals queue.',
        partnerId: undone.partnerId,
        subject: { type: 'registration', id: undone.id },
      });
      return undone;
    });
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    return reg;
  });
}

const hintsSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

/** Read only HubSpot check for the waiting rows, fetched by the approvals screen after it renders. Never blocks a decision. */
export async function hubspotConflictHintsAction(raw: unknown): Promise<ActionResult<Record<string, HubspotHintDto>>> {
  return runViewerAction({ name: 'registration.conflict_hints', schema: hintsSchema }, raw, async (ctx, input) => {
    assertCan(ctx.viewer, 'registration.read_queue');
    rateLimit(`hints:user:${ctx.viewer.id}`, { limit: 6, windowSeconds: 60 });
    const inputs = await withViewer(ctx.viewer, (tx) => conflictInputs(tx, ctx.viewer, { registrationIds: input.ids }));
    return hubspotConflictHints(readOnlyHubspot(), env.HUBSPOT_PARTNER_PIPELINE_ID ?? null, inputs);
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/decisions.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 10: Rewrite the page `src/app/admin/approvals/page.tsx`**

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApprovals } from "@/components/screens/AdminApprovals";
import { systemClock } from "@/lib/clock";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { listApprovalQueue } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Deal approvals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const data = await withViewer(viewer, async (tx) => ({
    queue: await listApprovalQueue(tx, viewer, { scope: "all" }, systemClock),
    managers: await listManagerOptions(tx, viewer),
  }));
  return (
    <AdminApprovals
      queue={data.queue}
      viewerId={viewer.id}
      viewerRegion={viewer.region}
      managers={data.managers}
      today={systemClock.today()}
    />
  );
}
```

- [ ] **Step 11: Edit `AdminApprovals.tsx`**

Copy changes in this task (all forced by real data): the KPI "Decided this month" is "Decided, last 7 days" (contracts H.0 counts seven days); the routing sentence names the managers from data; the accept toast and the accepted badge say the HubSpot deal is queued, because the outbox creates it within a minute; the Recent decisions HubSpot cell reads "Queued" for an accepted registration that has no deal yet. Additions (required by the route table, which lists `postMessageAction` for this screen): the drawer gets the deal conversation and a reply box. The extension requests card is added in M2.4.

Edit 1, imports. Before:

```tsx
import { useMemo, useState } from "react";
import { acceptDeal, type Deal, rejectDeal, undoDecision, useDeals } from "@/data/deals";
import { downloadCsv } from "../deals/csv";
import { daysBetween, fmtLong, fmtShort, plural, TODAY } from "../deals/dates";
import { avOf, type Check, checksFor, initialsOf, OVER_TARGET_DAYS, reviewSince, waitDays } from "../deals/derive";
import { Icon } from "../icon";
```
After:
```tsx
import { useEffect, useMemo, useState } from "react";
import { fmtTimestamp } from "@/lib/dates";
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL, PRODUCT_LABEL, type StaffRegion } from "@/lib/domain";
import type { ApprovalQueueDto, ManagerOptionDto, RegistrationDetailDto } from "@/lib/dto";
import {
  acceptRegistrationAction,
  hubspotConflictHintsAction,
  rejectRegistrationAction,
  undoDecisionAction,
} from "@/server/actions/decisions";
import { postMessageAction } from "@/server/actions/registrations";
import { issuesToErrors } from "@/server/actions/result";
import { downloadCsv } from "../deals/csv";
import { fmtLong, fmtShort, plural } from "../deals/dates";
import {
  avOf,
  CHIP_PRODUCT,
  type Check,
  defaultRejectReason,
  describeCheck,
  initialsOf,
  reviewSince,
  routingText,
} from "../deals/derive";
import type { HubspotHintDto } from "../deals/types";
import { Icon } from "../icon";
```

Edit 2, constants and row types. Before:

```tsx
const MY_REGION = "India";
const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
/** Decisions this month that are not in the slice: 12 accepted and 2 rejected before this session. */
const BASE_ACCEPTED = 12;
const BASE_REJECTED = 2;
/** Protected deals ending in 14 days across all partners. Only Kestrel's are in the slice, so this is fixed. */
const EXPIRING_ALL_PARTNERS = 5;
const SMALL_BTN = { height: 24, padding: "0 6px", fontSize: 12 } as const;

type RowState = "open" | "rejecting" | "approved" | "rejected";

interface QueueRow {
  deal: Deal;
  check: Check;
  state: RowState;
  age: number;
  over: boolean;
}
```
After:
```tsx
const ALL_PRODUCTS = "All products";
const ALL_REGIONS = "All regions";
const PRODUCT_OPTIONS = [ALL_PRODUCTS, "CleanStart Images", "Clean Libraries", "CleanSight"];
const REGION_OPTIONS = [ALL_REGIONS, "India", "Middle East"];
const SMALL_BTN = { height: 24, padding: "0 6px", fontSize: 12 } as const;
const HINT_LIMIT = 50;

type RowState = "open" | "rejecting" | "approved" | "rejected";

interface QueueRow {
  deal: RegistrationDetailDto;
  check: Check;
  state: RowState;
  age: number;
  over: boolean;
}
```

Edit 3, delete the mock `defaultReason` function. Before:

```tsx
function defaultReason(deal: Deal, check: Check): string {
  const rival = check.rival;
  if (rival && rival.registered < deal.registered) {
    return `${rival.partner} registered this customer for ${deal.product} on ${fmtShort(rival.registered)}.`;
  }
  return "";
}

```
After: nothing (the function and the blank line are removed; `defaultRejectReason` from `derive.ts` replaces it).

Edit 4, the component head through `undo`. Before (everything from the `export function AdminApprovals` line to the end of `const undo`):

```tsx
export function AdminApprovals(): React.JSX.Element {
  const toast = useToast();
  const deals = useDeals();

  const [queue, setQueue] = useState<"mine" | "all">("mine");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Record<string, Rejecting>>({});

  const rows = useMemo<QueueRow[]>(
    () =>
      deals
        .filter((d) => d.status === "Pending" || (d.decidedLive && (d.status === "Accepted" || d.status === "Rejected")))
        .sort((a, b) => reviewSince(a).localeCompare(reviewSince(b)))
        .map((deal) => {
          const age = waitDays(deal);
          const state: RowState =
            deal.status === "Accepted" ? "approved" : deal.status === "Rejected" ? "rejected" : deal.id in rejecting ? "rejecting" : "open";
          return {
            deal,
            check: checksFor(deal, deals),
            state,
            age,
            over: deal.status === "Pending" && age > OVER_TARGET_DAYS,
          };
        }),
    [deals, rejecting],
  );

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    ({ deal }) =>
      (queue === "all" || deal.region === MY_REGION) &&
      (!needle || `${deal.partner} ${deal.customer}`.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || deal.product === product) &&
      (region === ALL_REGIONS || deal.region === region),
  );

  const waiting = rows.filter((r) => r.state === "open" || r.state === "rejecting");
  const overCount = waiting.filter((r) => r.over).length;
  const conflictCount = waiting.filter((r) => r.check.kind === "conflict").length;
  const liveAccepted = rows.filter((r) => r.state === "approved").length;
  const liveRejected = rows.filter((r) => r.state === "rejected").length;
  const firstOpenId = visible.find((r) => r.state === "open")?.deal.id;
  const firstConflictId = visible.find((r) => r.check.kind === "conflict")?.deal.id;
  const viewing = rows.find((r) => r.deal.id === viewingId);

  const recentDecisions = deals
    .filter(
      (d) =>
        (d.status === "Accepted" || d.status === "Rejected") &&
        d.decidedOn !== undefined &&
        daysBetween(d.decidedOn, TODAY) <= 7,
    )
    .sort((a, b) => (b.decidedOn ?? "").localeCompare(a.decidedOn ?? ""));

  const accept = (row: QueueRow): void => {
    acceptDeal(row.deal.id);
    toast(`${row.deal.customer} accepted. HubSpot deal created.`);
  };

  const startReject = (row: QueueRow): void =>
    setRejecting((prev) => ({ ...prev, [row.deal.id]: { reason: defaultReason(row.deal, row.check), tried: false } }));

  const cancelReject = (id: string): void =>
    setRejecting((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

  const confirmReject = (row: QueueRow): void => {
    const entry = rejecting[row.deal.id];
    if (!entry) return;
    if (!entry.reason.trim()) {
      setRejecting((prev) => ({ ...prev, [row.deal.id]: { ...entry, tried: true } }));
      return;
    }
    rejectDeal(row.deal.id, entry.reason);
    cancelReject(row.deal.id);
    toast(`${row.deal.customer} rejected. The partner has been emailed.`);
  };

  const undo = (row: QueueRow): void => {
    if (row.state === "rejecting") cancelReject(row.deal.id);
    else undoDecision(row.deal.id);
  };
```
After:
```tsx
interface AdminApprovalsProps {
  queue: ApprovalQueueDto;
  viewerId: string;
  viewerRegion: StaffRegion;
  managers: ManagerOptionDto[];
  today: string;
}

export function AdminApprovals({ queue, viewerId, viewerRegion, managers, today }: AdminApprovalsProps): React.JSX.Element {
  const toast = useToast();

  const [view, setView] = useState<"mine" | "all">("mine");
  const [q, setQ] = useState("");
  const [product, setProduct] = useState(ALL_PRODUCTS);
  const [region, setRegion] = useState(ALL_REGIONS);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Record<string, Rejecting>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [hints, setHints] = useState<Record<string, HubspotHintDto>>({});
  const [reply, setReply] = useState("");
  const [replyTried, setReplyTried] = useState(false);
  const [replying, setReplying] = useState(false);

  const waitingIds = queue.rows
    .filter((r) => r.registration.status === "pending")
    .map((r) => r.registration.id)
    .join(",");

  useEffect(() => {
    if (!waitingIds) return;
    let cancelled = false;
    void hubspotConflictHintsAction({ ids: waitingIds.split(",").slice(0, HINT_LIMIT) }).then((result) => {
      if (!cancelled && result.ok) setHints(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, [waitingIds]);

  const rows = useMemo<QueueRow[]>(
    () =>
      queue.rows.map((entry) => {
        const deal = entry.registration;
        const state: RowState =
          deal.status === "accepted" ? "approved" : deal.status === "rejected" ? "rejected" : deal.id in rejecting ? "rejecting" : "open";
        return { deal, check: describeCheck(deal, entry.check, hints[deal.id]), state, age: entry.waitingBusinessDays, over: entry.overSla };
      }),
    [queue.rows, rejecting, hints],
  );

  const inMyQueue = (deal: RegistrationDetailDto): boolean =>
    viewerRegion === "all" ? deal.managerId === viewerId : deal.region === viewerRegion;

  const needle = q.trim().toLowerCase();
  const visible = rows.filter(
    ({ deal }) =>
      (view === "all" || inMyQueue(deal)) &&
      (!needle || `${deal.partnerName} ${deal.customer}`.toLowerCase().includes(needle)) &&
      (product === ALL_PRODUCTS || PRODUCT_LABEL[deal.product] === product) &&
      (region === ALL_REGIONS || PARTNER_REGION_LABEL[deal.region] === region),
  );

  const waiting = rows.filter((r) => r.state === "open" || r.state === "rejecting");
  const overCount = waiting.filter((r) => r.over).length;
  const conflictCount = waiting.filter((r) => r.check.kind === "conflict").length;
  const firstOpenId = visible.find((r) => r.state === "open")?.deal.id;
  const firstConflictId = visible.find((r) => r.check.kind === "conflict")?.deal.id;
  const viewing = rows.find((r) => r.deal.id === viewingId);
  const recentDecisions = queue.recentDecisions;

  const accept = async (row: QueueRow): Promise<void> => {
    setBusyId(row.deal.id);
    const result = await acceptRegistrationAction({ id: row.deal.id });
    setBusyId(null);
    toast(result.ok ? `${row.deal.customer} accepted. HubSpot deal queued.` : result.error.message);
  };

  const startReject = (row: QueueRow): void =>
    setRejecting((prev) => ({ ...prev, [row.deal.id]: { reason: defaultRejectReason(row.deal, row.check), tried: false } }));

  const cancelReject = (id: string): void =>
    setRejecting((prev) => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });

  const confirmReject = async (row: QueueRow): Promise<void> => {
    const entry = rejecting[row.deal.id];
    if (!entry) return;
    if (!entry.reason.trim()) {
      setRejecting((prev) => ({ ...prev, [row.deal.id]: { ...entry, tried: true } }));
      return;
    }
    setBusyId(row.deal.id);
    const result = await rejectRegistrationAction({ id: row.deal.id, reason: entry.reason });
    setBusyId(null);
    if (!result.ok) {
      toast(issuesToErrors(result.error).reason ?? result.error.message);
      return;
    }
    cancelReject(row.deal.id);
    toast(`${row.deal.customer} rejected. The partner has been emailed.`);
  };

  const undo = async (row: QueueRow): Promise<void> => {
    if (row.state === "rejecting") {
      cancelReject(row.deal.id);
      return;
    }
    setBusyId(row.deal.id);
    const result = await undoDecisionAction({ id: row.deal.id });
    setBusyId(null);
    if (!result.ok) toast(result.error.message);
  };

  const sendReply = async (event: React.FormEvent, deal: RegistrationDetailDto): Promise<void> => {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyTried(true);
      return;
    }
    setReplying(true);
    const result = await postMessageAction({ registrationId: deal.id, body: reply });
    setReplying(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    setReply("");
    setReplyTried(false);
  };
```

`ageLabel` and the `Rejecting` interface above and below this region are untouched.

Edit 5, the export CSV rows. Before:

```tsx
      ...visible.map((r) => [
        r.deal.partner,
        r.deal.customer,
        r.deal.product,
        r.deal.region,
        fmtLong(reviewSince(r.deal)),
```
After:
```tsx
      ...visible.map((r) => [
        r.deal.partnerName,
        r.deal.customer,
        PRODUCT_LABEL[r.deal.product],
        PARTNER_REGION_LABEL[r.deal.region],
        fmtLong(reviewSince(r.deal)),
```

Edit 6, the queue tabs. Before:

```tsx
    { key: "mine", label: "My queue", count: waiting.filter((r) => r.deal.region === MY_REGION).length },
```
After:
```tsx
    { key: "mine", label: "My queue", count: waiting.filter((r) => inMyQueue(r.deal)).length },
```
Before:
```tsx
                  className={`seg-b${queue === qv.key ? " seg-on" : ""}`}
                  aria-pressed={queue === qv.key}
                  onClick={() => setQueue(qv.key)}
```
After:
```tsx
                  className={`seg-b${view === qv.key ? " seg-on" : ""}`}
                  aria-pressed={view === qv.key}
                  onClick={() => setView(qv.key)}
```

Edit 7, the KPI strip. Before:

```tsx
        <div className="kpi">
          <span className="kpi-l">Decided this month</span>
          <span className="kpi-v">{BASE_ACCEPTED + BASE_REJECTED + liveAccepted + liveRejected}</span>
          <span className="kpi-f">
            Accepted {BASE_ACCEPTED + liveAccepted}, rejected {BASE_REJECTED + liveRejected}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Expiring in 14 days</span>
          <span className="kpi-v t-amber">{EXPIRING_ALL_PARTNERS}</span>
```
After:
```tsx
        <div className="kpi">
          <span className="kpi-l">Decided, last 7 days</span>
          <span className="kpi-v">{queue.counts.acceptedLast7Days + queue.counts.rejectedLast7Days}</span>
          <span className="kpi-f">
            Accepted {queue.counts.acceptedLast7Days}, rejected {queue.counts.rejectedLast7Days}
          </span>
        </div>
        <div className="kpi">
          <span className="kpi-l">Expiring in 14 days</span>
          <span className="kpi-v t-amber">{queue.counts.expiringIn14Days}</span>
```

Edit 8, the toolbar sentence. Before:

```tsx
            {visible.length} shown, oldest first. India goes to Farhan, Middle East to Omar.
```
After:
```tsx
            {visible.length} shown, oldest first. {routingText(managers)}
```

Edit 9, the table cells. Before:

```tsx
                        <span className={`av ${avOf(deal.partner)}`}>{initialsOf(deal.partner)}</span>
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {deal.partner}
                        </span>
```
After:
```tsx
                        <span className={`av ${avOf(deal.partnerName)}`}>{initialsOf(deal.partnerName)}</span>
                        <span className="li-n" style={{ fontSize: 13 }}>
                          {deal.partnerName}
                        </span>
```
Before:
```tsx
                      <ProductChip product={deal.product} />
                    </td>
                    <td className="t-sec">{deal.region}</td>
```
After:
```tsx
                      <ProductChip product={CHIP_PRODUCT[deal.product]} />
                    </td>
                    <td className="t-sec">{PARTNER_REGION_LABEL[deal.region]}</td>
```
The two row buttons read the partner name and are disabled while a request runs. Before:

```tsx
                            onClick={() => startReject(row)}
                            aria-label={`Reject ${deal.customer} from ${deal.partner}`}
```
After:
```tsx
                            onClick={() => startReject(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Reject ${deal.customer} from ${deal.partnerName}`}
```
Before:
```tsx
                            onClick={() => accept(row)}
                            aria-label={`Accept ${deal.customer} from ${deal.partner}`}
```
After:
```tsx
                            onClick={() => accept(row)}
                            disabled={busyId === deal.id}
                            aria-label={`Accept ${deal.customer} from ${deal.partnerName}`}
```

Edit 10, the decided states and the reject confirmation. Before:

```tsx
                          <span className="badge b-accepted">Accepted, in HubSpot</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} style={SMALL_BTN}>
                            Undo
                          </button>
```
After:
```tsx
                          <span className="badge b-accepted">Accepted, syncing to HubSpot</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} disabled={busyId === deal.id} style={SMALL_BTN}>
                            Undo
                          </button>
```
Before:
```tsx
                          <span className="badge b-rejected">Rejected, emailed</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} style={SMALL_BTN}>
                            Undo
                          </button>
```
After:
```tsx
                          <span className="badge b-rejected">Rejected, emailed</span>
                          <button type="button" className="btn btn-g" onClick={() => undo(row)} disabled={busyId === deal.id} style={SMALL_BTN}>
                            Undo
                          </button>
```
Before:
```tsx
                        <button type="button" className="btn btn-dd" onClick={() => confirmReject(row)}>
                          Reject and email
                        </button>
```
After:
```tsx
                        <button type="button" className="btn btn-dd" onClick={() => confirmReject(row)} disabled={busyId === deal.id}>
                          Reject and email
                        </button>
```

Edit 11, the Recent decisions table. Before:

```tsx
            {recentDecisions.map((d) => (
              <tr key={d.id}>
                <td className="tnum t-sec">{fmtShort(d.decidedOn ?? TODAY)}</td>
                <td>{d.partner}</td>
                <td style={{ fontWeight: 600 }}>{d.customer}</td>
                <td>
                  <ProductChip product={d.product} />
                </td>
                <td>
                  <span className={`badge ${d.status === "Accepted" ? "b-accepted" : "b-rejected"}`}>{d.status}</span>
                </td>
                <td className="tnum t-sec">{d.crmRef ?? "Not created"}</td>
              </tr>
            ))}
```
After:
```tsx
            {recentDecisions.map((d) => (
              <tr key={d.id}>
                <td className="tnum t-sec">{fmtShort(d.decidedOn ?? today)}</td>
                <td>{d.partnerName}</td>
                <td style={{ fontWeight: 600 }}>{d.customer}</td>
                <td>
                  <ProductChip product={CHIP_PRODUCT[d.product]} />
                </td>
                <td>
                  <span className={`badge ${d.status === "rejected" ? "b-rejected" : "b-accepted"}`}>
                    {d.status === "rejected" ? "Rejected" : "Accepted"}
                  </span>
                </td>
                <td className="tnum t-sec">{d.crmRef ?? (d.status === "rejected" ? "Not created" : "Queued")}</td>
              </tr>
            ))}
```

Edit 12, the drawer. Before:

```tsx
          title={viewing.deal.customer}
          subtitle={`Registered by ${viewing.deal.partner}, ${viewing.deal.partnerCategory}`}
```
After:
```tsx
          title={viewing.deal.customer}
          subtitle={`Registered by ${viewing.deal.partnerName}, ${PARTNER_CATEGORY_LABEL[viewing.deal.partnerCategory]}`}
```


Before:
```tsx
            <dt>Product</dt>
            <dd>{viewing.deal.product}</dd>
            <dt>Region</dt>
            <dd>{viewing.deal.region}</dd>
            <dt>Account manager</dt>
            <dd>{viewing.deal.manager}</dd>
            <dt>Partner</dt>
            <dd>{viewing.deal.partner}</dd>
```
After:
```tsx
            <dt>Product</dt>
            <dd>{PRODUCT_LABEL[viewing.deal.product]}</dd>
            <dt>Region</dt>
            <dd>{PARTNER_REGION_LABEL[viewing.deal.region]}</dd>
            <dt>Account manager</dt>
            <dd>{viewing.deal.managerName ?? "Not assigned"}</dd>
            <dt>Partner</dt>
            <dd>{viewing.deal.partnerName}</dd>
```
The drawer footer's accept and reject buttons keep calling `startReject(viewing)` and `accept(viewing)` unchanged (the handlers are now async and the drawer closes straight after, exactly as in the mock).

Addition, the conversation in the drawer. Before:

```tsx
          <div className="note note-violet">
            <span>Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner.</span>
          </div>
        </Drawer>
```
After:
```tsx
          <div className="note note-violet">
            <span>Accepting creates the deal in HubSpot, starts 90 days of protection and emails the partner.</span>
          </div>
          <div className="fg">
            <span className="lbl">Conversation with the partner</span>
            {viewing.deal.thread.length > 0 ? (
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {viewing.deal.thread.map((m) => (
                  <li key={m.id} style={{ display: "grid", gridTemplateColumns: "26px minmax(0, 1fr)", gap: 10 }}>
                    <span className={`av av-r ${m.side === "partner" ? "av-2" : "av-me"}`}>{initialsOf(m.authorName)}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 12.5 }}>
                        <b style={{ fontWeight: 600 }}>{m.authorName}</b>{" "}
                        <span className="t-muted">
                          {m.authorOrg}, {fmtTimestamp(m.createdAt, today)}
                        </span>
                      </span>
                      <span style={{ fontSize: 13, lineHeight: 1.55, color: "#2A2838" }}>{m.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <span className="hint">No messages yet.</span>
            )}
          </div>
          <form onSubmit={(event) => sendReply(event, viewing.deal)} noValidate className="fg">
            <label htmlFor="appr-reply" className="lbl">
              Reply to {viewing.deal.partnerName}
            </label>
            <textarea
              id="appr-reply"
              className={`field${replyTried && !reply.trim() ? " field-err" : ""}`}
              rows={3}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              aria-invalid={replyTried && !reply.trim() ? true : undefined}
            />
            {replyTried && !reply.trim() ? <span className="err">Write a message first.</span> : null}
            <span>
              <button type="submit" className="btn btn-s" disabled={replying}>
                <Icon name="send" />
                Send
              </button>
            </span>
          </form>
        </Drawer>
```

The Drawer's own footer form is not used (`onSubmit` is not set on this `Drawer`), so the nested `<form>` is valid.

- [ ] **Step 12: Gate A and the manual check**

Run the Gate A block. Expected: all green; changed paths are the Files block.

Manual check (seed-dev data, HubSpot env unset, signed in as Farhan Qureshi, staff partner manager India):
- `/admin/approvals`: "My queue 2", "All regions 4". Waiting 4 with the number "over the 2-day target" matching the dates (the seed rows were registered 3 to 5 Nov; with a dev date of 6 Nov none is over, a later date shows amber). With a conflict 2. Decided, last 7 days shows the seeded decisions; Expiring in 14 days shows the count of accepted deals ending within 14 days.
- The Kestrel Gulfway Freight row (Middle East, visible under "All regions") reads Conflict with "Arbor Cyber also registered it on 5 Nov. Kestrel was first."; the Arbor row reads "Kestrel Systems registered it first, on 3 Nov." Reject the Arbor row: the reason box is prefilled with "Kestrel Systems registered this customer for CleanStart Images on 3 Nov."; clearing it and pressing "Reject and email" shows "Add a reason the partner will see.".
- Accept Vardhan Capital (CleanSight is already accepted; this is the Libraries row): the row turns into "Accepted, syncing to HubSpot" with Undo, the toast says "HubSpot deal queued.", Decided, last 7 days goes up by one, Recent decisions lists it with "Queued". `select op, subject_id, status from hubspot_outbox` shows one `registration.create` row. Press Undo: the row returns to the queue; as Aditi the deal page has no automatic thread line.
- Accept it again and wait 11 minutes (or `update registrations set decided_at = now() - interval '11 minutes'` for the row): Undo now toasts "A decision can be undone by the person who took it, within 10 minutes." and the refresh keeps the row visible only while `canUndo` is true.
- Click a customer name: the drawer shows the conversation and a reply box; send a reply and check Aditi's bell data in `notifications` (the popover is M4.4).
- Sign in as Rahul Menon (staff sales, India): only India rows appear.
- With a HubSpot developer account configured in `.env`, a customer that another partner holds in HubSpot shows "Conflict" with "<partner> already has an open deal for this customer in HubSpot." a moment after the page loads; with HubSpot unreachable the page still loads and shows the portal checks only.

- [ ] **Step 13: Commit**

```bash
git add apps/portal/src/server/registrations apps/portal/src/server/repo/registrations.ts \
  apps/portal/src/server/repo/registrations.decide.test.ts apps/portal/src/server/actions/decisions.ts \
  apps/portal/src/server/actions/decisions.test.ts apps/portal/src/components/deals/derive.ts \
  apps/portal/src/components/deals/derive.test.ts apps/portal/src/components/screens/AdminApprovals.tsx \
  apps/portal/src/app/admin/approvals/page.tsx docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M2.2 deal approvals with decisions, undo rules and conflict hints"
```

---
### Task M2.4: Extension requests, expiry reminders, extension on the screens

**Gate A:** the Gate A block in "Conventions", plus `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts` green with the new functions registered.

**Files:**
- Create: `src/server/repo/registrations.extension.test.ts`
- Create: `src/server/actions/extension.ts`, `src/server/actions/extension.test.ts`
- Modify (replace the body of the W0-c stub): `src/server/jobs/expiry-reminders.ts`; Create: `src/server/jobs/expiry-reminders.test.ts`
- Modify: `src/server/repo/registrations.ts` (adds four functions, edits the import block, replaces the `isolation` block), `src/server/registrations/staff-alert.ts` (extracts `staffRecipients`)
- Modify (edits printed below): `src/components/screens/DealDetail.tsx`, `src/components/screens/AdminApprovals.tsx`
- Modify (rewrite): `src/app/admin/approvals/page.tsx`
- Not touched: `src/server/jobs/expiry.ts` and `reconcile.ts` (H4.8 owns them, contracts section M inconsistency 6)

Prerequisites: H4.4 merged (`enqueue`), H4.8 merged (`expireRegistrations` from `src/server/jobs/expiry.ts`, used only by one black box test below), M2.2 merged.

Rules this task implements (contracts H.7, H.19, G):
- One extension per registration: a partner on an `accepted` registration may request one with a reason. A request is allowed when the extension status is `none` or `declined`; `requested` and `granted` throw `extension_already_used` (a declined request does not use up the extension, a granted one does, `MAX_EXTENSIONS = 1`). A registration that is not accepted throws `not_accepted`.
- Staff (partner manager any region, staff sales in their region) grant or decline a requested extension. Granting adds `EXTENSION_DAYS` (30) to `protection_end`, in the same transaction enqueues `registration.update_end` with `version = <the new protection end, YYYY-MM-DD>`, writes the audit entry, notifies and emails the registrant (or the partner admins). Declining changes only the status. Deciding something that is not `requested` throws `extension_not_requested`.
- Reminders: the daily job `expiry-reminders` (05:00 UTC) finds `accepted` registrations whose `protection_end` is exactly 14 or exactly 3 days from today, writes an in-app notification and sends the email to the registrant plus the partner admins, and records `registration_reminders (registration_id, days_before, protection_end)` so a second run, a job restart or an overlap sends nothing twice. A granted extension changes `protection_end`, so the new date gets its own 14 and 3 day reminders. A day on which the job did not run loses that day's reminder (exact match, per the contracts).
- The nightly job that sets `expired` and enqueues `registration.expire` is H4.8's `expireRegistrations`. It expires a registration only when `protection_end` is before today, so the end date itself is still protected, and the 3 day reminder always precedes expiry. The black box test below pins both facts without editing that file.

- [ ] **Step 1: Write the failing repo tests**

```ts
// src/server/repo/registrations.extension.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { registrationReminders, registrations } from '@/db/schema';
import { asPartner, asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, NotFoundError, ValidationError } from '@/server/errors';
import { withViewer } from './context';
import {
  decideExtension,
  listReminderCandidates,
  markReminderSent,
  requestExtension,
} from './registrations';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
const actor = SYSTEM_ACTORS.portal;
beforeEach(() => resetDb(db));

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted',
    protectionEnd: '2027-01-12', registeredBy: sales.id, managerId: farhan.id, region: 'india',
  });
  return { farhan, partner, sales, admin, reg };
};

describe('requestExtension', () => {
  it('marks the registration requested, stores the reason, writes the timeline event and names the manager to notify', async () => {
    const { farhan, partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const result = await withViewer(viewer, (tx) => requestExtension(tx, viewer, { id: reg.id, reason: '  Procurement is slow  ' }, clock));
    expect(result.managerUserId).toBe(farhan.id);
    expect(result.partnerName).toBe('Kestrel Systems');
    expect(result.registration).toMatchObject({
      extensionStatus: 'requested', extensionReason: 'Procurement is slow', extensionRequestedAt: '2026-11-06T14:02:00.000Z',
      extensionGrantedAt: null, extensionDays: null, protectionEnd: '2027-01-12',
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Extension requested: Procurement is slow', byLabel: viewer.name, source: 'portal' });
  });

  it('needs a reason, an accepted registration, and only one request at a time or after a grant', async () => {
    const { partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    const ask = (reason: string, id = reg.id) => withViewer(viewer, (tx) => requestExtension(tx, viewer, { id, reason }, clock));
    await expect(ask('   ')).rejects.toBeInstanceOf(ValidationError);
    const pending = await makeRegistration(db, { partnerId: partner.id, customerName: 'Still waiting', status: 'pending' });
    await expect(ask('why', pending.id)).rejects.toMatchObject({ reason: 'not_accepted' });
    await ask('first');
    await expect(ask('again')).rejects.toMatchObject({ reason: 'extension_already_used' });
    await db.update(registrations).set({ extensionStatus: 'granted' }).where(eq(registrations.id, reg.id));
    await expect(ask('and again')).rejects.toMatchObject({ reason: 'extension_already_used' });
  });

  it('allows a new request after a decline', async () => {
    const { partner, reg } = await setup();
    const viewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await db.update(registrations).set({ extensionStatus: 'declined' }).where(eq(registrations.id, reg.id));
    const result = await withViewer(viewer, (tx) => requestExtension(tx, viewer, { id: reg.id, reason: 'New facts' }, clock));
    expect(result.registration.extensionStatus).toBe('requested');
  });

  it('is not found for a colleague\'s deal seen by sales and for another company', async () => {
    const { partner, reg } = await setup();
    const other = await asPartner(db, { partnerId: partner.id, role: 'sales' });
    await expect(withViewer(other, (tx) => requestExtension(tx, other, { id: reg.id, reason: 'x' }, clock))).rejects.toBeInstanceOf(NotFoundError);
    const outsider = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(outsider, (tx) => requestExtension(tx, outsider, { id: reg.id, reason: 'x' }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('decideExtension', () => {
  const requested = async () => {
    const ctx = await setup();
    await db.update(registrations).set({ extensionStatus: 'requested', extensionRequestedAt: new Date('2026-11-05T10:00:00Z'), extensionReason: 'Procurement is slow' }).where(eq(registrations.id, ctx.reg.id));
    return ctx;
  };

  it('grants 30 more days, returns the new end as the outbox version and the recipients', async () => {
    const { farhan, sales, reg } = await requested();
    const result = await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: ' Happy to help ' }, clock));
    expect(result).toMatchObject({ granted: true, newProtectionEnd: '2027-02-11', partnerName: 'Kestrel Systems', recipientUserIds: [sales.id] });
    expect(result.registration).toMatchObject({
      protectionEnd: '2027-02-11', extensionStatus: 'granted', extensionDays: 30, extensionGrantedAt: '2026-11-06T14:02:00.000Z',
    });
    expect(result.registration.history[0]).toMatchObject({ text: 'Extension granted, protected until 11 Feb 2027: Happy to help', byLabel: farhan.name });
  });

  it('declines without moving the end date', async () => {
    const { farhan, reg } = await requested();
    const result = await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'decline', note: null }, clock));
    expect(result).toMatchObject({ granted: false, newProtectionEnd: null });
    expect(result.registration).toMatchObject({ extensionStatus: 'declined', protectionEnd: '2027-01-12', extensionDays: null });
    expect(result.registration.history[0]?.text).toBe('Extension declined');
  });

  it('only decides a requested extension, once', async () => {
    const { farhan, reg } = await setup();
    await expect(withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toMatchObject({ reason: 'extension_not_requested' });
    await db.update(registrations).set({ extensionStatus: 'requested' }).where(eq(registrations.id, reg.id));
    await withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock));
    await expect(withViewer(farhan, (tx) => decideExtension(tx, farhan, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toMatchObject({ reason: 'extension_not_requested' });
  });

  it('is staff only and limited to the staff sales region', async () => {
    const { partner, reg } = await requested();
    const partnerViewer = await asPartner(db, { partnerId: partner.id, role: 'partner_admin' });
    await expect(withViewer(partnerViewer, (tx) => decideExtension(tx, partnerViewer, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const gulf = await asStaff(db, 'sales', 'middle_east');
    await expect(withViewer(gulf, (tx) => decideExtension(tx, gulf, { id: reg.id, decision: 'grant', note: null }, clock))).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('reminder candidates', () => {
  const accepted = (partnerId: string, name: string, protectionEnd: string, registeredBy?: string) =>
    makeRegistration(db, { partnerId, customerName: name, status: 'accepted', protectionEnd, ...(registeredBy ? { registeredBy } : {}) });

  it('finds accepted registrations ending in exactly 14 or 3 days, with the registrant and the admins once each', async () => {
    const partner = await makePartner(db, {});
    const sales = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const at14 = await accepted(partner.id, 'Fourteen', '2026-11-20', sales.id);
    const at3 = await accepted(partner.id, 'Three', '2026-11-09', admin.id);
    await accepted(partner.id, 'Thirteen', '2026-11-19');
    await accepted(partner.id, 'Fifteen', '2026-11-21');
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Pending', status: 'pending', protectionEnd: '2026-11-20' });
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Won', status: 'won', protectionEnd: '2026-11-09' });
    const found = await db.transaction((tx) => listReminderCandidates(tx, actor, clock));
    const byName = Object.fromEntries(found.map((c) => [c.customer, c]));
    expect(Object.keys(byName).sort()).toEqual(['Fourteen', 'Three']);
    expect(byName.Fourteen).toMatchObject({ registrationId: at14.id, daysBefore: 14, protectionEnd: '2026-11-20', partnerId: partner.id, product: 'images' });
    expect([...byName.Fourteen!.recipientUserIds].sort()).toEqual([admin.id, sales.id].sort());
    expect(byName.Three).toMatchObject({ registrationId: at3.id, daysBefore: 3 });
    expect(byName.Three!.recipientUserIds).toEqual([admin.id]);
  });

  it('stops offering a reminder once it is marked sent, which is idempotent, and offers the new date after an extension', async () => {
    const partner = await makePartner(db, {});
    await makeUser(db, { partnerId: partner.id, role: 'partner_admin' });
    const reg = await accepted(partner.id, 'Fourteen', '2026-11-20');
    expect(await db.transaction((tx) => listReminderCandidates(tx, actor, clock))).toHaveLength(1);
    const mark = () => db.transaction((tx) => markReminderSent(tx, actor, { registrationId: reg.id, daysBefore: 14, protectionEnd: '2026-11-20' }, clock));
    await mark();
    await mark();
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
    expect(await db.transaction((tx) => listReminderCandidates(tx, actor, clock))).toHaveLength(0);
    await db.update(registrations).set({ protectionEnd: '2026-12-20' }).where(eq(registrations.id, reg.id));
    const later = await db.transaction((tx) => listReminderCandidates(tx, actor, fixedClock('2026-12-06T05:00:00Z')));
    expect(later.map((c) => [c.daysBefore, c.protectionEnd])).toEqual([[14, '2026-12-20']]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.extension.test.ts`
Expected: FAIL, "requestExtension is not a function".

- [ ] **Step 2: Implement the four repo functions**

Edit the import block of `src/server/repo/registrations.ts`: add `notExists` to the `drizzle-orm` import; add `registrationReminders` to the `@/db/schema` import; add `EXPIRY_REMINDER_DAYS`, `EXTENSION_DAYS` and `extendedEnd` to the `@/lib/deal-rules` import; add `ExtensionDecisionResult`, `ExtensionResult` and `ReminderCandidateDto` to the `@/lib/dto` type import; change the recipients import to `import { decisionRecipients, threadRecipients } from '@/server/registrations/recipients';`; add `import type { SystemActor } from '@/server/auth/types';` next to the existing `Viewer` import (one statement: `import type { SystemActor, Viewer } from '@/server/auth/types';`). Append before `const probeClock`:

```ts
const MAX_EXTENSION_REASON = 1000;

/** Partner. Accepted only, once (MAX_EXTENSIONS). Throws ConflictError('extension_already_used'). */
export async function requestExtension(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; reason: string },
  clock: Clock,
): Promise<ExtensionResult> {
  const reason = input.reason.trim();
  if (!reason) throw new ValidationError([{ path: 'reason', message: 'Tell CleanStart why you need more time.' }]);
  if (reason.length > MAX_EXTENSION_REASON) {
    throw new ValidationError([{ path: 'reason', message: `Keep it under ${MAX_EXTENSION_REASON} characters.` }]);
  }
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.status !== 'accepted') throw new ConflictError('not_accepted', 'Only an accepted registration can be extended.');
  if (current.extensionStatus === 'requested') {
    throw new ConflictError('extension_already_used', 'An extension for this registration is already waiting for a decision.');
  }
  if (current.extensionStatus === 'granted') {
    throw new ConflictError('extension_already_used', 'This registration already had its one extension.');
  }
  const now = clock.now();
  await tx
    .update(registrations)
    .set({ extensionStatus: 'requested', extensionRequestedAt: now, extensionReason: reason, extensionGrantedAt: null, extensionDays: null })
    .where(eq(registrations.id, current.id));
  await tx.insert(registrationEvents).values({
    registrationId: current.id,
    at: now,
    text: `Extension requested: ${reason}`,
    byLabel: viewer.name,
    source: 'portal',
  });
  const registration = await getRegistration(tx, viewer, current.id);
  return { registration, partnerName: registration.partnerName, managerUserId: registration.managerId };
}

/**
 * Staff. Needs extension_status 'requested' (else ConflictError('extension_not_requested')). Granting adds
 * EXTENSION_DAYS to protection_end; the action enqueues registration.update_end with version newProtectionEnd.
 */
export async function decideExtension(
  tx: Tx,
  viewer: Viewer,
  input: { id: string; decision: 'grant' | 'decline'; note: string | null },
  clock: Clock,
): Promise<ExtensionDecisionResult> {
  assertStaff(viewer);
  const current = await lockRegistration(tx, viewer, input.id);
  if (current.extensionStatus !== 'requested') {
    throw new ConflictError('extension_not_requested', 'There is no extension request to decide.');
  }
  const note = input.note?.trim() || null;
  const suffix = note ? `: ${note}` : '';
  const now = clock.now();
  let newProtectionEnd: string | null = null;
  if (input.decision === 'grant') {
    if (current.status !== 'accepted' || !current.protectionEnd) {
      throw new ConflictError('not_accepted', 'Only an accepted registration can be extended.');
    }
    newProtectionEnd = extendedEnd(current.protectionEnd);
    await tx
      .update(registrations)
      .set({ protectionEnd: newProtectionEnd, extensionStatus: 'granted', extensionGrantedAt: now, extensionDays: EXTENSION_DAYS })
      .where(eq(registrations.id, current.id));
    await tx.insert(registrationEvents).values({
      registrationId: current.id,
      at: now,
      text: `Extension granted, protected until ${fmtLong(newProtectionEnd)}${suffix}`,
      byLabel: viewer.name,
      source: 'portal',
    });
  } else {
    await tx.update(registrations).set({ extensionStatus: 'declined' }).where(eq(registrations.id, current.id));
    await tx.insert(registrationEvents).values({
      registrationId: current.id,
      at: now,
      text: `Extension declined${suffix}`,
      byLabel: viewer.name,
      source: 'portal',
    });
  }
  const registration = await getRegistration(tx, viewer, current.id);
  const recipientUserIds = await decisionRecipients(tx, { partnerId: registration.partnerId, registeredById: registration.registeredById });
  return { registration, partnerName: registration.partnerName, granted: input.decision === 'grant', newProtectionEnd, recipientUserIds };
}

/**
 * Public (system actor, jobs/expiry-reminders.ts, M2.4). Accepted registrations whose protection ends in exactly
 * 14 or 3 days from today and that have no registration_reminders row for (id, daysBefore, protectionEnd).
 */
export async function listReminderCandidates(tx: Tx, _actor: SystemActor, clock: Clock): Promise<ReminderCandidateDto[]> {
  const today = clock.today();
  const candidates: ReminderCandidateDto[] = [];
  for (const daysBefore of EXPIRY_REMINDER_DAYS) {
    const end = addDays(today, daysBefore);
    const rows = await tx
      .select({
        id: registrations.id,
        customer: registrations.customerName,
        product: registrations.product,
        partnerId: registrations.partnerId,
        registeredBy: registrations.registeredBy,
      })
      .from(registrations)
      .where(
        and(
          eq(registrations.status, 'accepted'),
          eq(registrations.protectionEnd, end),
          notExists(
            tx
              .select({ one: sql`1` })
              .from(registrationReminders)
              .where(
                and(
                  eq(registrationReminders.registrationId, registrations.id),
                  eq(registrationReminders.daysBefore, daysBefore),
                  eq(registrationReminders.protectionEnd, end),
                ),
              ),
          ),
        ),
      )
      .orderBy(asc(registrations.createdAt), asc(registrations.id));
    for (const row of rows) {
      candidates.push({
        registrationId: row.id,
        customer: row.customer,
        product: row.product,
        partnerId: row.partnerId,
        protectionEnd: end,
        daysBefore,
        recipientUserIds: await threadRecipients(tx, { partnerId: row.partnerId, registeredById: row.registeredBy }),
      });
    }
  }
  return candidates;
}

/** Public. Inserts the registration_reminders row. Idempotent. */
export async function markReminderSent(
  tx: Tx,
  _actor: SystemActor,
  input: { registrationId: string; daysBefore: number; protectionEnd: string },
  clock: Clock,
): Promise<void> {
  await tx
    .insert(registrationReminders)
    .values({ registrationId: input.registrationId, daysBefore: input.daysBefore, protectionEnd: input.protectionEnd, sentAt: clock.now() })
    .onConflictDoNothing();
}
```

Replace the whole `isolation` block with the 17 function block:

```ts
export const isolation = defineIsolation<
  | 'listRegistrations' | 'getRegistration' | 'lockRegistration' | 'createRegistrations' | 'resubmitRegistration'
  | 'customerSuggestions' | 'acceptRegistration' | 'rejectRegistration' | 'undoDecision' | 'conflictChecks'
  | 'listApprovalQueue' | 'countWaiting' | 'conflictInputs' | 'requestExtension' | 'decideExtension'
  | 'listReminderCandidates' | 'markReminderSent'
>({
  listRegistrations: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await listRegistrations(tx, viewer, { limit: 1000 })).filter((r) => r.partnerId !== viewer.partnerId),
  },
  getRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => getRegistration(tx, viewer, ctx.b.registrationId) },
  lockRegistration: { scope: 'tenant', expect: 'not_found', probe: (tx, viewer, ctx) => lockRegistration(tx, viewer, ctx.b.registrationId) },
  createRegistrations: {
    scope: 'tenant',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) =>
      createRegistrations(
        tx,
        viewer,
        { partnerId: ctx.b.partnerId, customer: 'Isolation Probe', website: null, products: ['images'], region: 'india', contact: null, expectedClose: null, notes: null },
        probeClock,
      ),
  },
  resubmitRegistration: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) =>
      resubmitRegistration(tx, viewer, { id: ctx.b.registrationId, contact: { name: 'Probe', role: null, email: 'probe@example.com' }, note: null }, probeClock),
  },
  customerSuggestions: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer, ctx) =>
      (await customerSuggestions(tx, viewer, { q: '' })).flatMap((s) => s.registrations).filter((r) => r.id === ctx.b.registrationId),
  },
  acceptRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => acceptRegistration(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  rejectRegistration: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => rejectRegistration(tx, viewer, { id: ctx.b.registrationId, reason: 'probe' }, probeClock) },
  undoDecision: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => undoDecision(tx, viewer, { id: ctx.b.registrationId }, probeClock) },
  conflictChecks: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictChecks(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
  listApprovalQueue: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => listApprovalQueue(tx, viewer, { scope: 'all' }, probeClock) },
  countWaiting: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => countWaiting(tx, viewer) },
  conflictInputs: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer, ctx) => conflictInputs(tx, viewer, { registrationIds: [ctx.b.registrationId] }) },
  requestExtension: {
    scope: 'tenant',
    expect: 'not_found',
    probe: (tx, viewer, ctx) => requestExtension(tx, viewer, { id: ctx.b.registrationId, reason: 'isolation probe' }, probeClock),
  },
  decideExtension: {
    scope: 'staff-only',
    expect: 'forbidden',
    probe: (tx, viewer, ctx) => decideExtension(tx, viewer, { id: ctx.b.registrationId, decision: 'grant', note: null }, probeClock),
  },
  listReminderCandidates: { scope: 'public', reason: 'Takes a SystemActor and is called only by jobs/expiry-reminders.ts through withSystem.' },
  markReminderSent: { scope: 'public', reason: 'Takes a SystemActor and is called only by jobs/expiry-reminders.ts through withSystem.' },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/registrations.extension.test.ts src/server/repo/isolation.test.ts`
Expected: PASS, 10 tests in the extension file and the isolation matrix green.

- [ ] **Step 3: Extract `staffRecipients` in `staff-alert.ts`**

Replace `src/server/registrations/staff-alert.ts` with:

```ts
import { env } from '@/env';
import { type DealRegion, PARTNER_REGION_LABEL, PRODUCT_LABEL, type Product } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { sendEmail } from '@/server/email/send';
import { buildDealSubmittedStaffAlert } from '@/server/email/templates';
import type { EmailAddress } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, resolveEmailRecipients } from '@/server/notify';
import { absoluteUrl } from '@/server/urls';

/** The deal manager's address from their notification, or PARTNERS_NOTIFY_EMAIL when the deal has no manager. May be empty. */
export async function staffRecipients(items: readonly NewNotification[]): Promise<EmailAddress[]> {
  const recipients = await resolveEmailRecipients(items);
  const to: EmailAddress[] = recipients.map((r) => ({ email: r.email, name: r.name }));
  if (to.length === 0 && env.PARTNERS_NOTIFY_EMAIL) to.push({ email: env.PARTNERS_NOTIFY_EMAIL });
  return to;
}

export interface SubmissionAlert {
  partnerName: string;
  customer: string;
  products: Product[];
  region: DealRegion;
  registeredByName: string;
  resubmitted: boolean;
  /** The in-app notifications written for the deal's manager; their users get the email. */
  items: readonly NewNotification[];
}

/** After commit. Emails the deal's manager, or PARTNERS_NOTIFY_EMAIL when the deal has no manager. */
export async function sendSubmissionAlert(alert: SubmissionAlert): Promise<void> {
  const to = await staffRecipients(alert.items);
  if (to.length === 0) {
    log.warn({ customer: alert.customer }, 'no staff recipient for a registration alert');
    return;
  }
  await sendEmail(
    buildDealSubmittedStaffAlert({
      to,
      partnerName: alert.partnerName,
      customer: alert.customer,
      productLabel: alert.products.map((p) => PRODUCT_LABEL[p]).join(', '),
      regionLabel: PARTNER_REGION_LABEL[alert.region],
      registeredByName: alert.registeredByName,
      resubmitted: alert.resubmitted,
      approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
    }),
  );
}
```

- [ ] **Step 4: Write the failing action tests**

```ts
// src/server/actions/extension.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ viewer: null as import('@/server/auth/types').Viewer | null }));
const mail = vi.hoisted(() => ({ transport: null as import('@/server/email/fake').FakeEmailTransport | null }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/server/auth/viewer', () => ({
  requireActionViewer: async () => {
    if (!session.viewer) throw new Error('no viewer in test');
    return session.viewer;
  },
}));
vi.mock('@/server/email/send', () => ({
  sendEmail: (message: import('@/server/email/transport').EmailMessage) => {
    if (!mail.transport) throw new Error('no transport in test');
    return mail.transport.send(message);
  },
}));

import { auditLog, hubspotOutbox, notifications, registrations } from '@/db/schema';
import { asStaff, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { FakeEmailTransport } from '@/server/email/fake';
import { decideExtensionAction, requestExtensionAction } from './extension';

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mail.transport = new FakeEmailTransport();
  session.viewer = null;
});

const setup = async () => {
  const farhan = await asStaff(db, 'partner_manager', 'india');
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted',
    protectionEnd: '2027-01-12', registeredBy: salesUser.id, managerId: farhan.id, region: 'india',
  });
  return { farhan, partner, salesUser, reg };
};

describe('requestExtensionAction', () => {
  it('records the request, audits it and tells the deal manager in the app and by email', async () => {
    const { farhan, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    const result = await requestExtensionAction({ id: reg.id, reason: 'Procurement is slow' });
    expect(result).toMatchObject({ ok: true, data: { extensionStatus: 'requested' } });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_requested')))[0]).toMatchObject({ note: 'Procurement is slow', kind: 'deal_decisions' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, farhan.id)))[0]).toMatchObject({ kind: 'extension_requested', link: '/admin/approvals' });
    expect(mail.transport!.to(farhan.email)).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('refuses a second request, an empty reason, the technical role and a colleague\'s deal', async () => {
    const { partner, salesUser, reg } = await setup();
    session.viewer = await viewerFor(db, salesUser);
    await requestExtensionAction({ id: reg.id, reason: 'first' });
    expect(await requestExtensionAction({ id: reg.id, reason: 'second' })).toMatchObject({ ok: false, error: { code: 'conflict' } });
    expect(await requestExtensionAction({ id: reg.id, reason: '  ' })).toMatchObject({ ok: false, error: { code: 'validation' } });
    const technical = await makeUser(db, { partnerId: partner.id, role: 'technical' });
    session.viewer = await viewerFor(db, technical);
    expect(await requestExtensionAction({ id: reg.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    const colleague = await makeUser(db, { partnerId: partner.id, role: 'sales' });
    session.viewer = await viewerFor(db, colleague);
    expect(await requestExtensionAction({ id: reg.id, reason: 'x' })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});

describe('decideExtensionAction', () => {
  const asked = async () => {
    const ctx = await setup();
    await db.update(registrations).set({ extensionStatus: 'requested', extensionReason: 'Procurement is slow' }).where(eq(registrations.id, ctx.reg.id));
    return ctx;
  };

  it('grants: moves the end date, queues one update_end with the new date as its version, tells the registrant', async () => {
    const { farhan, salesUser, reg } = await asked();
    session.viewer = farhan;
    const result = await decideExtensionAction({ id: reg.id, decision: 'grant', note: 'Happy to help' });
    expect(result).toMatchObject({ ok: true, data: { protectionEnd: '2027-02-11', extensionStatus: 'granted' } });
    const outbox = await db.select().from(hubspotOutbox);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]).toMatchObject({ op: 'registration.update_end', subjectId: reg.id, idempotencyKey: `registration.update_end:${reg.id}:2027-02-11` });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_granted')))[0]).toMatchObject({ note: 'Protected until 11 Feb 2027. Happy to help' });
    expect((await db.select().from(notifications).where(eq(notifications.userId, salesUser.id)))[0]).toMatchObject({ kind: 'extension_decided', link: `/partner/deals/${reg.id}` });
    expect(mail.transport!.only('karan@kestrel.example').htmlContent).toContain('Vardhan Capital');
  });

  it('declines without an outbox row, and refuses to decide twice', async () => {
    const { farhan, reg } = await asked();
    session.viewer = farhan;
    expect(await decideExtensionAction({ id: reg.id, decision: 'decline', note: null })).toMatchObject({ ok: true, data: { extensionStatus: 'declined', protectionEnd: '2027-01-12' } });
    expect((await db.select().from(auditLog).where(eq(auditLog.event, 'registration.extension_declined')))).toHaveLength(1);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'conflict' } });
  });

  it('is forbidden for partners and staff sales outside their region', async () => {
    const { salesUser, reg } = await asked();
    session.viewer = await viewerFor(db, salesUser);
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'forbidden' } });
    session.viewer = await asStaff(db, 'sales', 'middle_east');
    expect(await decideExtensionAction({ id: reg.id, decision: 'grant', note: null })).toMatchObject({ ok: false, error: { code: 'not_found' } });
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/extension.test.ts`
Expected: FAIL, "Cannot find module './extension'".

- [ ] **Step 5: Implement `src/server/actions/extension.ts`**

```ts
// src/server/actions/extension.ts
'use server';

import { z } from 'zod';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import type { RegistrationDetailDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { recordAudit } from '@/server/audit/record';
import { assertCan } from '@/server/auth/policies';
import { sendEmail } from '@/server/email/send';
import { buildExtensionDecision, buildExtensionRequested } from '@/server/email/templates';
import { enqueue } from '@/server/hubspot/outbox';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { staffRecipients } from '@/server/registrations/staff-alert';
import { withViewer } from '@/server/repo/context';
import { decideExtension, lockRegistration, requestExtension } from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';
import type { ActionResult } from './result';
import { runViewerAction } from './run';

const requestSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().trim().min(1, 'Tell CleanStart why you need more time.').max(1000),
});

const decideSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(['grant', 'decline']),
  note: z
    .string()
    .trim()
    .max(500)
    .nullish()
    .transform((value) => (value ? value : null)),
});

const targetOf = (r: Pick<RegistrationDetailDto, 'customer' | 'product' | 'partnerName'>): string =>
  `${r.customer}, ${PRODUCT_LABEL[r.product]}, from ${r.partnerName}`;

export async function requestExtensionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.request_extension', schema: requestSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.request_extension', { partnerId: current.partnerId, ownerUserId: current.registeredById });
      const result = await requestExtension(tx, ctx.viewer, input, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: 'registration.extension_requested',
        target: targetOf(reg),
        note: input.reason,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      const items: NewNotification[] = result.managerUserId
        ? [
            {
              userId: result.managerUserId,
              kind: 'extension_requested',
              title: `${result.partnerName} asked for more time on ${reg.customer}`,
              body: input.reason,
              link: ROUTES.admin.approvals,
            },
          ]
        : [];
      await notifyUsers(tx, items);
      return { result, items };
    });

    const reg = outcome.result.registration;
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.afterCommit(async () => {
      const to = await staffRecipients(outcome.items);
      if (to.length === 0) return;
      await sendEmail(
        buildExtensionRequested({
          to,
          partnerName: outcome.result.partnerName,
          customer: reg.customer,
          productLabel: PRODUCT_LABEL[reg.product],
          reason: input.reason,
          approvalsUrl: absoluteUrl(ROUTES.admin.approvals),
        }),
      );
    });
    return reg;
  });
}

export async function decideExtensionAction(raw: unknown): Promise<ActionResult<RegistrationDetailDto>> {
  return runViewerAction({ name: 'registration.decide_extension', schema: decideSchema }, raw, async (ctx, input) => {
    const outcome = await withViewer(ctx.viewer, async (tx) => {
      const current = await lockRegistration(tx, ctx.viewer, input.id);
      assertCan(ctx.viewer, 'registration.decide_extension', { partnerId: current.partnerId, region: current.region });
      const result = await decideExtension(tx, ctx.viewer, { id: current.id, decision: input.decision, note: input.note }, ctx.clock);
      const reg = result.registration;
      await recordAudit(tx, ctx.viewer, {
        event: result.granted ? 'registration.extension_granted' : 'registration.extension_declined',
        target: targetOf(reg),
        note: result.granted
          ? `Protected until ${fmtLong(result.newProtectionEnd ?? '')}.${input.note ? ` ${input.note}` : ''}`
          : (input.note ?? 'Declined.'),
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      if (result.granted && result.newProtectionEnd) {
        await enqueue(tx, { op: 'registration.update_end', subjectId: reg.id, version: result.newProtectionEnd });
      }
      const items = result.recipientUserIds.map(
        (userId): NewNotification => ({
          userId,
          kind: 'extension_decided',
          title: `${reg.customer} extension ${result.granted ? 'granted' : 'declined'}`,
          ...(result.granted
            ? { body: `Protected until ${fmtLong(result.newProtectionEnd ?? '')}` }
            : input.note
              ? { body: input.note }
              : {}),
          link: ROUTES.partner.deal(reg.id),
        }),
      );
      await notifyUsers(tx, items);
      return { result, items };
    });

    const { result } = outcome;
    const reg = result.registration;
    ctx.revalidate(ROUTES.admin.approvals);
    ctx.revalidate(ROUTES.partner.deals);
    ctx.revalidate(ROUTES.partner.deal(reg.id));
    ctx.afterCommit(async () => {
      for (const to of await resolveEmailRecipients(outcome.items)) {
        await sendEmail(
          buildExtensionDecision({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: reg.customer,
            productLabel: PRODUCT_LABEL[reg.product],
            granted: result.granted,
            newEnd: result.newProtectionEnd,
            note: input.note,
            dealUrl: absoluteUrl(ROUTES.partner.deal(reg.id)),
          }),
        );
      }
    });
    return reg;
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/actions/extension.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Write the failing job tests**

```ts
// src/server/jobs/expiry-reminders.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { notificationPrefs, notifications, registrationReminders, registrations, users } from '@/db/schema';
import { makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeEmailTransport } from '@/server/email/fake';
import { expireRegistrations } from './expiry';
import { sendExpiryReminders } from './expiry-reminders';

const db = testDb();
const clock = fixedClock('2026-11-06T05:00:00Z');
beforeEach(() => resetDb(db));

const setup = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const sales = await makeUser(db, { partnerId: partner.id, role: 'sales', email: 'karan@kestrel.example' });
  const admin = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', email: 'aditi@kestrel.example' });
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', protectionEnd: '2026-11-20', registeredBy: sales.id,
  });
  return { partner, sales, admin, reg };
};

describe('sendExpiryReminders', () => {
  it('notifies and emails the registrant and the admin 14 days before, once', async () => {
    const { sales, admin, reg } = await setup();
    const transport = new FakeEmailTransport();
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    const rows = await db.select().from(notifications);
    expect(rows.map((r) => r.userId).sort()).toEqual([admin.id, sales.id].sort());
    expect(rows[0]).toMatchObject({ kind: 'registration_expiring', title: 'Vardhan Capital protection ends in 14 days', link: `/partner/deals/${reg.id}` });
    expect(transport.to('karan@kestrel.example')[0]?.htmlContent).toContain('Vardhan Capital');
    expect(transport.to('aditi@kestrel.example')).toHaveLength(1);
    expect(await db.select().from(registrationReminders)).toHaveLength(1);

    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 0 });
    expect(await db.select().from(notifications)).toHaveLength(2);
    expect(transport.sent).toHaveLength(2);
  });

  it('sends the 3 day reminder separately, and a new date after an extension gets its own', async () => {
    const { reg } = await setup();
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    await sendExpiryReminders({ clock: fixedClock('2026-11-17T05:00:00Z'), transport });
    expect((await db.select().from(registrationReminders)).map((r) => r.daysBefore).sort()).toEqual([14, 3]);
    await db.update(registrations).set({ protectionEnd: '2026-12-20' }).where(eq(registrations.id, reg.id));
    expect(await sendExpiryReminders({ clock: fixedClock('2026-12-06T05:00:00Z'), transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(3);
  });

  it('keeps the in-app notification but no email when the user switched expiry emails off', async () => {
    const { sales, admin } = await setup();
    await db.insert(notificationPrefs).values([
      { userId: sales.id, category: 'expiry', email: false },
      { userId: admin.id, category: 'expiry', email: false },
    ]);
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    expect(await db.select().from(notifications)).toHaveLength(2);
    expect(transport.sent).toHaveLength(0);
  });

  it('falls back to the admins when the registrant has left, and still marks the reminder sent when nobody is left', async () => {
    const { partner, sales, admin } = await setup();
    await db.update(users).set({ status: 'disabled' }).where(eq(users.id, sales.id));
    const transport = new FakeEmailTransport();
    await sendExpiryReminders({ clock, transport });
    expect((await db.select().from(notifications)).map((n) => n.userId)).toEqual([admin.id]);
    await db.update(users).set({ status: 'disabled' }).where(eq(users.partnerId, partner.id));
    await db.delete(registrationReminders);
    await db.delete(notifications);
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
    expect(await db.select().from(notifications)).toHaveLength(0);
  });

  it('does not stop at an email that fails', async () => {
    await setup();
    const transport = new FakeEmailTransport();
    transport.failNext = 'smtp down';
    expect(await sendExpiryReminders({ clock, transport })).toEqual({ candidates: 1 });
    expect(await db.select().from(registrationReminders)).toHaveLength(1);
  });
});

describe('with the nightly expiry job (H4.8, black box)', () => {
  it('lets the 3 day reminder go out before expiry, and sends nothing for a registration the job expired', async () => {
    const { partner } = await setup();
    await makeRegistration(db, { partnerId: partner.id, customerName: 'Ends today', status: 'accepted', protectionEnd: '2026-11-06' });
    const lapsed = await makeRegistration(db, { partnerId: partner.id, customerName: 'Lapsed', status: 'accepted', protectionEnd: '2026-11-05' });
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, lapsed.id)))[0]?.status).toBe('expired');
    const transport = new FakeEmailTransport();
    expect(await sendExpiryReminders({ clock: fixedClock('2026-11-03T05:00:00Z'), transport })).toEqual({ candidates: 1 });
    expect((await db.select().from(registrations).where(eq(registrations.customerName, 'Ends today')))[0]?.status).toBe('accepted');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/expiry-reminders.test.ts`
Expected: FAIL, `sendExpiryReminders` is not exported (the W0-c stub exports only `runExpiryReminders`).

- [ ] **Step 7: Implement `src/server/jobs/expiry-reminders.ts`**

```ts
// src/server/jobs/expiry-reminders.ts
import { type Clock, systemClock } from '@/lib/clock';
import { fmtLong } from '@/lib/dates';
import { PRODUCT_LABEL } from '@/lib/domain';
import { ROUTES } from '@/lib/routes';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { sendEmail } from '@/server/email/send';
import { buildProtectionExpiryReminder } from '@/server/email/templates';
import type { EmailTransport } from '@/server/email/transport';
import { log } from '@/server/log';
import { type NewNotification, notifyUsers, resolveEmailRecipients } from '@/server/notify';
import { withSystem } from '@/server/repo/context';
import { listReminderCandidates, markReminderSent } from '@/server/repo/registrations';
import { absoluteUrl } from '@/server/urls';

/**
 * Daily at 05:00 UTC. For every accepted registration ending in exactly 14 or 3 days: one in-app notification per person,
 * the email where their "expiry" switch allows it, and the registration_reminders row that makes a second run a no op.
 * The notification and the row commit together; the email goes after, so a crash in between loses an email, never
 * sends a duplicate. One failing registration never stops the others.
 */
export async function sendExpiryReminders(deps: { clock: Clock; transport?: EmailTransport }): Promise<{ candidates: number }> {
  const actor = SYSTEM_ACTORS.portal;
  const candidates = await withSystem(actor, (tx) => listReminderCandidates(tx, actor, deps.clock));
  for (const candidate of candidates) {
    try {
      const items = candidate.recipientUserIds.map(
        (userId): NewNotification => ({
          userId,
          kind: 'registration_expiring',
          title: `${candidate.customer} protection ends in ${candidate.daysBefore} days`,
          body: `${PRODUCT_LABEL[candidate.product]}, protected until ${fmtLong(candidate.protectionEnd)}`,
          link: ROUTES.partner.deal(candidate.registrationId),
        }),
      );
      await withSystem(actor, async (tx) => {
        await notifyUsers(tx, items);
        await markReminderSent(
          tx,
          actor,
          { registrationId: candidate.registrationId, daysBefore: candidate.daysBefore, protectionEnd: candidate.protectionEnd },
          deps.clock,
        );
      });
      for (const to of await resolveEmailRecipients(items)) {
        await sendEmail(
          buildProtectionExpiryReminder({
            to: { email: to.email, name: to.name },
            recipientName: to.name,
            customer: candidate.customer,
            productLabel: PRODUCT_LABEL[candidate.product],
            daysLeft: candidate.daysBefore,
            protectionEnd: candidate.protectionEnd,
            dealUrl: absoluteUrl(ROUTES.partner.deal(candidate.registrationId)),
          }),
          deps.transport,
        );
      }
    } catch (error) {
      log.error({ err: error, registrationId: candidate.registrationId }, 'expiry reminder failed');
    }
  }
  return { candidates: candidates.length };
}

export const runExpiryReminders = async (): Promise<void> => {
  await sendExpiryReminders({ clock: systemClock });
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/expiry-reminders.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 8: Rewrite the approvals page to load the extension requests**

Replace `src/app/admin/approvals/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminApprovals } from "@/components/screens/AdminApprovals";
import { systemClock } from "@/lib/clock";
import type { RegistrationDetailDto } from "@/lib/dto";
import { homeFor, requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getRegistration, listApprovalQueue, listRegistrations } from "@/server/repo/registrations";
import { listManagerOptions } from "@/server/repo/staff";

export const metadata: Metadata = { title: "Deal approvals" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("registration.read_queue");
  if (viewer.kind !== "staff") redirect(homeFor(viewer));
  const data = await withViewer(viewer, async (tx) => {
    const queue = await listApprovalQueue(tx, viewer, { scope: "all" }, systemClock);
    const managers = await listManagerOptions(tx, viewer);
    const accepted = await listRegistrations(tx, viewer, { status: ["accepted"], limit: 1000 });
    const extensions: RegistrationDetailDto[] = [];
    for (const item of accepted) {
      if (item.extensionStatus === "requested") extensions.push(await getRegistration(tx, viewer, item.id));
    }
    extensions.sort((a, b) => (a.extensionRequestedAt ?? "").localeCompare(b.extensionRequestedAt ?? ""));
    return { queue, managers, extensions };
  });
  return (
    <AdminApprovals
      queue={data.queue}
      extensions={data.extensions}
      viewerId={viewer.id}
      viewerRegion={viewer.region}
      managers={data.managers}
      today={systemClock.today()}
    />
  );
}
```

- [ ] **Step 9: Edit `AdminApprovals.tsx` for the extension requests**

Additions (new markup, existing classes only): a card "Extension requests" between the queue and Recent decisions, rendered only when there are requests, so a database with none looks exactly like the reviewed screen.

Edit 1, imports. Before: `import { postMessageAction } from "@/server/actions/registrations";` After:
```tsx
import { decideExtensionAction } from "@/server/actions/extension";
import { postMessageAction } from "@/server/actions/registrations";
```

Edit 2, props. Before:
```tsx
interface AdminApprovalsProps {
  queue: ApprovalQueueDto;
  viewerId: string;
```
After:
```tsx
interface AdminApprovalsProps {
  queue: ApprovalQueueDto;
  extensions: RegistrationDetailDto[];
  viewerId: string;
```
Before: `export function AdminApprovals({ queue, viewerId, viewerRegion, managers, today }: AdminApprovalsProps): React.JSX.Element {` After: `export function AdminApprovals({ queue, extensions, viewerId, viewerRegion, managers, today }: AdminApprovalsProps): React.JSX.Element {`.

Edit 3, the visible requests and the handler. Before:
```tsx
  const recentDecisions = queue.recentDecisions;
```
After:
```tsx
  const recentDecisions = queue.recentDecisions;
  const visibleExtensions = extensions.filter((d) => view === "all" || inMyQueue(d));

  const decideExt = async (deal: RegistrationDetailDto, decision: "grant" | "decline"): Promise<void> => {
    setBusyId(deal.id);
    const result = await decideExtensionAction({ id: deal.id, decision, note: null });
    setBusyId(null);
    toast(
      result.ok
        ? decision === "grant"
          ? `Extension granted for ${deal.customer}.`
          : `Extension declined for ${deal.customer}.`
        : result.error.message,
    );
  };
```

Edit 4, the card. Before:
```tsx
      <section aria-labelledby="recentdec" className="card clip">
```
After:
```tsx
      {visibleExtensions.length > 0 ? (
        <section aria-labelledby="extreq" className="card clip">
          <div className="card-h">
            <h2 id="extreq" className="card-t">
              Extension requests
            </h2>
            <span className="card-meta">{visibleExtensions.length}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Partner</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Product</th>
                  <th scope="col">Protected until</th>
                  <th scope="col">Reason</th>
                  <th scope="col" className="r">
                    Decision
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleExtensions.map((d) => (
                  <tr key={d.id}>
                    <td>{d.partnerName}</td>
                    <td style={{ fontWeight: 600 }}>{d.customer}</td>
                    <td>
                      <ProductChip product={CHIP_PRODUCT[d.product]} />
                    </td>
                    <td className="tnum t-sec">{d.protectionEnd ? fmtLong(d.protectionEnd) : ""}</td>
                    <td className="t-sec" style={{ whiteSpace: "normal", maxWidth: 360 }}>
                      {d.extensionReason}
                    </td>
                    <td className="r">
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        <button type="button" className="btn btn-s" onClick={() => decideExt(d, "decline")} disabled={busyId === d.id} style={SMALL_BTN}>
                          Decline
                        </button>
                        <button type="button" className="btn btn-p" onClick={() => decideExt(d, "grant")} disabled={busyId === d.id} style={SMALL_BTN}>
                          Grant 30 days
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="recentdec" className="card clip">
```

- [ ] **Step 10: Edit `DealDetail.tsx` for the extension**

Edit 1, the import. Before: `import { requestExtension } from "@/data/deals";` After: `import { requestExtensionAction } from "@/server/actions/extension";` (keep it with the other `@/server/actions` import, after `postMessageAction`; Biome does not enforce order).

Edit 2, state. Before:
```tsx
  const [extTried, setExtTried] = useState(false);
```
After:
```tsx
  const [extTried, setExtTried] = useState(false);
  const [extBusy, setExtBusy] = useState(false);
```

Edit 3, `sendExtension`. Before:
```tsx
  const sendExtension = (event: React.FormEvent): void => {
    event.preventDefault();
    if (!extWhy.trim()) {
      setExtTried(true);
      return;
    }
    requestExtension(deal.id, extWhy);
    setExtOpen(false);
    setExtWhy("");
    toast("Extension requested. CleanStart will reply by email.");
  };
```
After:
```tsx
  const sendExtension = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!extWhy.trim()) {
      setExtTried(true);
      return;
    }
    setExtBusy(true);
    const result = await requestExtensionAction({ id: deal.id, reason: extWhy });
    setExtBusy(false);
    if (!result.ok) {
      toast(result.error.message);
      return;
    }
    setExtOpen(false);
    setExtWhy("");
    toast("Extension requested. CleanStart will reply by email.");
  };
```

Edit 4 (addition), the granted badge. Before:
```tsx
          {deal.extensionStatus === "requested" ? (
            <span className="badge b-violet" style={{ height: 30, padding: "0 10px" }}>
              Extension requested, CleanStart will reply by email
            </span>
          ) : null}
```
After:
```tsx
          {deal.extensionStatus === "requested" ? (
            <span className="badge b-violet" style={{ height: 30, padding: "0 10px" }}>
              Extension requested, CleanStart will reply by email
            </span>
          ) : null}
          {deal.extensionStatus === "granted" && deal.protectionEnd ? (
            <span className="badge b-accepted" style={{ height: 30, padding: "0 10px" }}>
              Extension granted, protected until {fmtLong(deal.protectionEnd)}
            </span>
          ) : null}
```

Edit 5, the dialog button. Before:
```tsx
            <button type="submit" className="btn btn-p">
              Send request
            </button>
```
After:
```tsx
            <button type="submit" className="btn btn-p" disabled={extBusy}>
              Send request
            </button>
```

- [ ] **Step 11: Gate A and the manual check**

Run the Gate A block. Expected: all green; changed paths are the Files block.

Manual check (seed-dev data; `PORTAL_JOBS_ENABLED=false` in `.env` so nothing runs by itself):
- As Aditi Rao, open Vardhan Capital CleanSight (protected until 12 Jan 2027): "Request extension" opens the dialog; send with an empty box shows "Tell CleanStart why you need more time."; send a reason: toast, the button is replaced by "Extension requested, CleanStart will reply by email" and the Activity table gets "Extension requested: ...".
- As Farhan on `/admin/approvals`: a card "Extension requests 1" lists it with the reason. Press "Grant 30 days": toast "Extension granted for Vardhan Capital.", the card disappears. `select protection_end, extension_status from registrations where customer_name = 'Vardhan Capital' and product = 'cleansight'` shows `2027-02-11` and `granted`; `select op, idempotency_key from hubspot_outbox` shows `registration.update_end:<id>:2027-02-11`. As Aditi the deal shows "Extension granted, protected until 11 Feb 2027" and no request button.
- Decline path: request on Al Noor Logistics, then Decline: the status goes to `declined`, the request button comes back, no outbox row.
- Reminders: `update registrations set protection_end = (current_date + 14)::text::date where customer_name = 'Tejas Health Network'` then run `pnpm --filter @cleanstart/portal exec tsx --env-file=.env -e "import('./src/server/jobs/expiry-reminders').then((m) => m.runExpiryReminders())"`. A "protection ends in 14 days" notification row exists for Aditi and for Karan, one `registration_reminders` row exists, and a second run adds nothing.

- [ ] **Step 12: Commit**

```bash
git add apps/portal/src/server/repo/registrations.ts apps/portal/src/server/repo/registrations.extension.test.ts \
  apps/portal/src/server/registrations/staff-alert.ts apps/portal/src/server/actions/extension.ts \
  apps/portal/src/server/actions/extension.test.ts apps/portal/src/server/jobs/expiry-reminders.ts \
  apps/portal/src/server/jobs/expiry-reminders.test.ts apps/portal/src/components/screens/DealDetail.tsx \
  apps/portal/src/components/screens/AdminApprovals.tsx apps/portal/src/app/admin/approvals/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M2.4 protection extensions and expiry reminders"
```

---
### Task M2.6: Partner overview and admin reports from SQL aggregates

**Gate A:** the Gate A block in "Conventions", plus `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/isolation.test.ts` green with `getPartnerOverview` and `getAdminReports` registered.

**Files:**
- Create: `src/server/repo/overview.ts`, `src/server/repo/overview.test.ts`
- Create: `src/server/repo/reports.ts`, `src/server/repo/reports.test.ts`
- Create: `src/lib/report-view.ts`, `src/lib/report-view.test.ts`
- Create: `src/components/deals/overview.ts`, `src/components/deals/overview.test.ts`
- Modify (rewrite): `src/components/reports/partner-ui.ts`, `src/components/reports/FollowUpList.tsx`, `src/components/reports/ProductBreakdown.tsx`
- Modify (edits printed below): `src/components/screens/PartnerOverview.tsx`, `src/components/screens/AdminReports.tsx`
- Modify (rewrite): `src/app/partner/overview/page.tsx`, `src/app/admin/reports/page.tsx`
- Not touched: `src/components/reports/download-csv.ts` (unchanged, its signature already takes a CSV string)
- Test: the files above

Prerequisites: M3.2 merged (`listNewDocuments` in `src/server/repo/documents.ts`), W0-b `seedMockData` in `src/db/fixtures.ts`. If M3.2 is not merged, write a `blocked` line and start M4.4.

Rules this task implements (contracts H.10, M.3 item 5):
- The numbers on both screens are computed with SQL, never by reading every registration into memory except the few rows a list needs. The mock's hard coded numbers become the figures the seed produces (contracts J.5): the report is computed, so Kestrel shows registered 10, waiting 2, accepted 7 (3 accepted, 2 won, 1 lost, 1 expired), rejected 1, won 2, protected 3.
- "Accepted" in reports means ever accepted (status `accepted`, `won`, `lost` or `expired`); "Protected now" is status `accepted`; the accept rate is accepted over accepted plus rejected, computed in the client as the mock does.
- Partner sales see only their own deals on the Overview (`ownDealsOnly`); partner admin sees the company; the technical role and staff get `ForbiddenError`. Reports are for the partner manager (everything) and staff sales (their region: partners whose region matches, and registrations whose region matches).
- "Expiring in 14 days" is accepted registrations whose `protection_end` is from today to today plus 14 days, the same definition on the approvals screen, the Overview and Reports.
- Reports have no quarter filter in the contracts (`getAdminReports(tx, viewer, clock)` takes no period), so the screen says "All time" where the mock said "Q4 2026 so far", and every list partner appears (the mock hid 11 partners behind a hard coded "of 21").

- [ ] **Step 1: Write the failing tests for the pure report view**

```ts
// src/lib/report-view.test.ts
import { describe, expect, it } from 'vitest';
import type { PartnerReportRow } from './dto';
import { acceptRate, filterPartnerRows, partnersToCsv } from './report-view';

const row = (over: Partial<PartnerReportRow>): PartnerReportRow => ({
  partnerId: over.name ?? 'p', name: 'P', category: 'channel', region: 'india',
  registered: 0, waiting: 0, accepted: 0, rejected: 0, won: 0, protectedNow: 0, ...over,
});

const ROWS: PartnerReportRow[] = [
  row({ name: 'Kestrel Systems', category: 'channel', region: 'india', registered: 10, accepted: 7, rejected: 1, won: 2, protectedNow: 3 }),
  row({ name: 'Saffron Secure', category: 'distributor', region: 'india', registered: 9, accepted: 7, rejected: 1, won: 3, protectedNow: 6 }),
  row({ name: 'Arbor Cyber', category: 'integrator', region: 'middle_east', registered: 5, accepted: 3, rejected: 1, won: 1, protectedNow: 2 }),
  row({ name: 'Qamar Solutions', category: 'channel', region: 'middle_east' }),
];

describe('acceptRate', () => {
  it('is accepted over decided as a whole percent, and null before any decision', () => {
    expect(acceptRate(7, 1)).toBe(88);
    expect(acceptRate(36, 6)).toBe(86);
    expect(acceptRate(0, 0)).toBeNull();
  });
});

describe('filterPartnerRows', () => {
  it('filters by region and category', () => {
    expect(filterPartnerRows(ROWS, 'india', 'all', 'Name').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(filterPartnerRows(ROWS, 'all', 'channel', 'Name').map((r) => r.name)).toEqual(['Kestrel Systems', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'middle_east', 'distributor', 'Name')).toEqual([]);
  });

  it('sorts as the mock did, with ties broken the same way', () => {
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Most registered').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Most won').map((r) => r.name)).toEqual(['Saffron Secure', 'Kestrel Systems', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Highest accept rate').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Name').map((r) => r.name)).toEqual(['Arbor Cyber', 'Kestrel Systems', 'Qamar Solutions', 'Saffron Secure']);
  });

  it('adds the accept rate', () => {
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Name').map((r) => r.rate)).toEqual([75, 88, null, 88]);
  });
});

describe('partnersToCsv', () => {
  it('writes labels, the rate text and quotes cells that need it', () => {
    const csv = partnersToCsv(filterPartnerRows([row({ name: 'Acme, Inc', category: 'integrator', region: 'middle_east', registered: 2, accepted: 1, rejected: 1, won: 1, protectedNow: 1 }), row({ name: 'Idle Co' })], 'all', 'all', 'Name'));
    expect(csv.split('\n')).toEqual([
      'Partner,Category,Region,Registered,Accepted,Accept rate,Won,Protected now',
      '"Acme, Inc",System integrator,Middle East,2,1,50%,1,1',
      'Idle Co,Channel partner,India,0,0,None yet,0,0',
    ]);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/report-view.test.ts`
Expected: FAIL, "Cannot find module './report-view'".

- [ ] **Step 2: Implement `src/lib/report-view.ts`**

```ts
import {
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABEL,
  PARTNER_REGION_LABEL,
  PARTNER_REGIONS,
} from './domain';
import type { PartnerReportRow } from './dto';

export const SORTS = ['Most registered', 'Most won', 'Highest accept rate', 'Name'] as const;
export type ReportSort = (typeof SORTS)[number];

export const REGION_OPTIONS = [
  { value: 'all', label: 'All regions' },
  ...PARTNER_REGIONS.map((r) => ({ value: r, label: PARTNER_REGION_LABEL[r] })),
];
export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All partner categories' },
  ...PARTNER_CATEGORIES.map((c) => ({ value: c, label: PARTNER_CATEGORY_LABEL[c] })),
];

export interface PartnerReportView extends PartnerReportRow {
  /** Accepted over decided (accepted plus rejected) as a whole percent, or null before any decision. */
  rate: number | null;
}

export const acceptRate = (accepted: number, rejected: number): number | null => {
  const decided = accepted + rejected;
  return decided ? Math.round((accepted / decided) * 100) : null;
};

export function filterPartnerRows(
  rows: readonly PartnerReportRow[],
  region: string,
  category: string,
  sort: ReportSort,
): PartnerReportView[] {
  const views = rows
    .filter((p) => (region === 'all' || p.region === region) && (category === 'all' || p.category === category))
    .map((p): PartnerReportView => ({ ...p, rate: acceptRate(p.accepted, p.rejected) }));
  const rateKey = (p: PartnerReportView): number => p.rate ?? -1;
  const compare: Record<ReportSort, (a: PartnerReportView, b: PartnerReportView) => number> = {
    'Most registered': (a, b) => b.registered - a.registered || b.won - a.won,
    'Most won': (a, b) => b.won - a.won || b.registered - a.registered,
    'Highest accept rate': (a, b) => rateKey(b) - rateKey(a) || b.registered - a.registered,
    Name: (a, b) => a.name.localeCompare(b.name),
  };
  return views.sort(compare[sort]);
}

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function partnersToCsv(rows: readonly PartnerReportView[]): string {
  const header = ['Partner', 'Category', 'Region', 'Registered', 'Accepted', 'Accept rate', 'Won', 'Protected now'];
  const lines = rows.map((p) =>
    [
      p.name,
      PARTNER_CATEGORY_LABEL[p.category],
      PARTNER_REGION_LABEL[p.region],
      p.registered,
      p.accepted,
      p.rate === null ? 'None yet' : `${p.rate}%`,
      p.won,
      p.protectedNow,
    ]
      .map(csvCell)
      .join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/report-view.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 3: Write the failing tests for the overview view helpers**

```ts
// src/components/deals/overview.test.ts
import { describe, expect, it } from 'vitest';
import type { DocumentListItemDto, PartnerOverviewDto } from '@/lib/dto';
import { buildOverviewKpis, docIcon, docMeta } from './overview';

const overview = (over: Partial<PartnerOverviewDto>): PartnerOverviewDto => ({
  ownDealsOnly: false,
  waiting: { count: 0, oldestDays: 0 },
  protectedNow: { count: 0, byProduct: [] },
  expiring14: { count: 0, customers: [] },
  wonThisYear: { count: 0, customers: [] },
  attention: [],
  recent: [],
  newDocuments: [],
  ...over,
});

describe('buildOverviewKpis', () => {
  it('reads the four figures from the aggregates', () => {
    const kpis = buildOverviewKpis(overview({
      waiting: { count: 2, oldestDays: 3 },
      protectedNow: { count: 3, byProduct: [{ product: 'cleansight', count: 2 }, { product: 'libraries', count: 1 }] },
      expiring14: { count: 1, customers: ['Tejas Health Network'] },
      wonThisYear: { count: 2, customers: ['Indus Paytech', 'Kaveri Biotech'] },
    }));
    expect(kpis).toEqual([
      { label: 'Waiting', value: '2', foot: 'Oldest 3 days', cls: '' },
      { label: 'Protected', value: '3', foot: '2 CleanSight, 1 Libraries', cls: '' },
      { label: 'Expiring in 14 days', value: '1', foot: 'Tejas Health Network', cls: 't-amber' },
      { label: 'Won this year', value: '2', foot: 'Indus Paytech, Kaveri Biotech', cls: '' },
    ]);
  });

  it('says so when there is nothing', () => {
    expect(buildOverviewKpis(overview({})).map((k) => [k.value, k.foot, k.cls])).toEqual([
      ['0', 'Nothing waiting', ''], ['0', 'None yet', ''], ['0', 'None', ''], ['0', 'None yet', ''],
    ]);
    expect(buildOverviewKpis(overview({ waiting: { count: 1, oldestDays: 1 } }))[0]?.foot).toBe('Oldest 1 day');
  });
});

describe('new document rows', () => {
  const doc = (over: Partial<DocumentListItemDto>): DocumentListItemDto => ({
    id: 'd', title: 'T', type: 'datasheet', product: 'all', summary: null, durationMinutes: null, fileSize: 1, mime: 'application/pdf',
    originalName: 't.pdf', version: 1, updatedAt: '2026-10-30T09:00:00.000Z', ...over,
  });
  it('writes the type, the length of a video and the date', () => {
    expect(docMeta(doc({ type: 'video', durationMinutes: 14, updatedAt: '2026-11-04T09:00:00.000Z' }))).toBe('Video, 14 min, 4 Nov');
    expect(docMeta(doc({ type: 'solution_sheet' }))).toBe('Solution sheet, 30 Oct');
    expect(docMeta(doc({ type: 'video', durationMinutes: null }))).toBe('Video, 30 Oct');
  });
  it('shows a play icon for a video and a file icon for everything else', () => {
    expect(docIcon(doc({ type: 'video' }))).toBe('play');
    expect(docIcon(doc({ type: 'battlecard' }))).toBe('file');
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/overview.test.ts`
Expected: FAIL, "Cannot find module './overview'".

- [ ] **Step 4: Implement `src/components/deals/overview.ts`**

```ts
import { fmtShort, plural } from "@/lib/dates";
import { DOCUMENT_TYPE_LABEL, PRODUCT_SHORT_LABEL } from "@/lib/domain";
import type { AttentionItemDto, DocumentListItemDto, PartnerOverviewDto } from "@/lib/dto";
import type { IconName } from "../icon-paths";

export interface Kpi {
  label: string;
  value: string;
  foot: string;
  cls: string;
}

export function buildOverviewKpis(o: PartnerOverviewDto): Kpi[] {
  const byProduct = o.protectedNow.byProduct.map((x) => `${x.count} ${PRODUCT_SHORT_LABEL[x.product]}`);
  return [
    {
      label: "Waiting",
      value: String(o.waiting.count),
      foot: o.waiting.count ? `Oldest ${plural(o.waiting.oldestDays, "day")}` : "Nothing waiting",
      cls: "",
    },
    {
      label: "Protected",
      value: String(o.protectedNow.count),
      foot: byProduct.length ? byProduct.join(", ") : "None yet",
      cls: "",
    },
    {
      label: "Expiring in 14 days",
      value: String(o.expiring14.count),
      foot: o.expiring14.count ? o.expiring14.customers.join(", ") : "None",
      cls: o.expiring14.count ? "t-amber" : "",
    },
    {
      label: "Won this year",
      value: String(o.wonThisYear.count),
      foot: o.wonThisYear.count ? o.wonThisYear.customers.join(", ") : "None yet",
      cls: "",
    },
  ];
}

/** The icon and tint of a "Needs attention" row, by what it is about. */
export const ATTENTION_STYLE: Record<AttentionItemDto["kind"], { icon: IconName; tone: string }> = {
  access_request: { icon: "team", tone: "tone-violet" },
  expiring: { icon: "hg", tone: "tone-amber" },
  late: { icon: "clk", tone: "" },
  declined: { icon: "warn", tone: "tone-red" },
  invite_pending: { icon: "team", tone: "" },
};

/** "Video, 14 min, 4 Nov" */
export function docMeta(doc: DocumentListItemDto): string {
  const length = doc.type === "video" && doc.durationMinutes ? `, ${doc.durationMinutes} min` : "";
  return `${DOCUMENT_TYPE_LABEL[doc.type]}${length}, ${fmtShort(doc.updatedAt.slice(0, 10))}`;
}

export const docIcon = (doc: DocumentListItemDto): IconName => (doc.type === "video" ? "play" : "file");
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/components/deals/overview.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the failing repo tests for the overview**

```ts
// src/server/repo/overview.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { accessRequests, registrations } from '@/db/schema';
import { asPartner, asStaff, makeAccessRequest, makeDocument, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb, viewerFor } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getPartnerOverview } from './overview';

const db = testDb();
const clock = fixedClock('2026-11-06T14:20:00Z');
beforeEach(() => resetDb(db));

const seedKestrel = async () => {
  const partner = await makePartner(db, { name: 'Kestrel Systems' });
  const adminUser = await makeUser(db, { partnerId: partner.id, role: 'partner_admin', name: 'Aditi Rao' });
  const salesUser = await makeUser(db, { partnerId: partner.id, role: 'sales', name: 'Karan Malhotra' });
  const reg = (over: Parameters<typeof makeRegistration>[1]) => makeRegistration(db, { partnerId: partner.id, ...over });
  await reg({ customerName: 'Vardhan Capital', product: 'libraries', status: 'pending', registeredOn: '2026-11-04', registeredBy: adminUser.id });
  const gulfway = await reg({ customerName: 'Gulfway Freight', product: 'images', status: 'pending', registeredOn: '2026-11-02', registeredBy: salesUser.id });
  await reg({ customerName: 'Tejas Health Network', product: 'cleansight', status: 'accepted', protectionEnd: '2026-11-15', registeredBy: adminUser.id });
  await reg({ customerName: 'Al Noor Logistics', product: 'libraries', status: 'accepted', protectionEnd: '2026-12-21', registeredBy: salesUser.id });
  await reg({ customerName: 'Vardhan Capital', product: 'cleansight', status: 'accepted', protectionEnd: '2027-01-12', registeredBy: adminUser.id });
  await reg({ customerName: 'Indus Paytech', product: 'images', status: 'won', closedOn: '2026-09-19', registeredBy: adminUser.id });
  await reg({ customerName: 'Kaveri Biotech', product: 'images', status: 'won', closedOn: '2026-08-11', registeredBy: salesUser.id });
  await reg({ customerName: 'Won Last Year', product: 'images', status: 'won', closedOn: '2025-12-31' });
  const recentlyRejected = await reg({ customerName: 'Saffron Retail Group', product: 'images', status: 'rejected', registeredBy: salesUser.id });
  await db.update(registrations).set({ decidedAt: new Date('2026-11-04T10:00:00Z') }).where(eq(registrations.id, recentlyRejected.id));
  const oldRejected = await reg({ customerName: 'Old Rejection', product: 'images', status: 'rejected' });
  await db.update(registrations).set({ decidedAt: new Date('2026-09-10T10:00:00Z') }).where(eq(registrations.id, oldRejected.id));
  return { partner, adminUser, salesUser, gulfway };
};

describe('getPartnerOverview', () => {
  it('computes the four figures and the lists for a partner admin', async () => {
    const { adminUser } = await seedKestrel();
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.ownDealsOnly).toBe(false);
    expect(o.waiting).toEqual({ count: 2, oldestDays: 4 });
    expect(o.protectedNow).toEqual({ count: 3, byProduct: [{ product: 'cleansight', count: 2 }, { product: 'libraries', count: 1 }] });
    expect(o.expiring14).toEqual({ count: 1, customers: ['Tejas Health Network'] });
    expect(o.wonThisYear).toEqual({ count: 2, customers: ['Indus Paytech', 'Kaveri Biotech'] });
    expect(o.recent).toHaveLength(7);
    expect(o.recent.every((r) => ['pending', 'accepted', 'won'].includes(r.status))).toBe(true);
    const days = o.recent.map((r) => r.registeredOn);
    expect(days).toEqual([...days].sort().reverse());
  });

  it('lists what needs attention in the mock\'s order, with the mock\'s wording', async () => {
    const { partner, adminUser } = await seedKestrel();
    await makeAccessRequest(db, { partnerId: partner.id, email: 'rohit.desai@kestrel.example', name: 'Rohit Desai', requestedRole: 'sales', createdAt: new Date('2026-11-06T09:00:00Z') });
    await makeInvite(db, { partnerId: partner.id, kind: 'partner', role: 'sales', email: 'vikram.sethi@kestrel.example', createdAt: new Date('2026-11-05T09:00:00Z'), expiresAt: new Date('2026-11-12T09:00:00Z') });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.attention.map((a) => [a.kind, a.title, a.meta])).toEqual([
      ['access_request', 'Rohit Desai asked for a login', 'Sales, asked today'],
      ['expiring', 'Tejas Health Network expires in 9 days', 'CleanSight, protected until 15 Nov'],
      ['late', 'Gulfway Freight waiting 4 days', 'CleanStart Images, sent 2 Nov'],
      ['declined', 'Saffron Retail Group was not accepted', 'CleanStart Images, see the reason and resubmit'],
      ['invite_pending', 'vikram.sethi@kestrel.example has not accepted invite', 'Sales, invited 5 Nov'],
    ]);
    expect(o.attention.map((a) => a.href)).toEqual([
      '/partner/team', expect.stringMatching(/^\/partner\/deals\/[0-9a-f-]{36}$/), '/partner/deals', '/partner/deals', '/partner/team',
    ]);
    expect(new Set(o.attention.map((a) => a.key)).size).toBe(5);
  });

  it('shows a salesperson only their own deals, with no team items', async () => {
    const { partner, salesUser } = await seedKestrel();
    await makeAccessRequest(db, { partnerId: partner.id, email: 'x@kestrel.example', name: 'X', requestedRole: 'sales' });
    const sales = await viewerFor(db, salesUser);
    const o = await withViewer(sales, (tx) => getPartnerOverview(tx, sales, clock));
    expect(o.ownDealsOnly).toBe(true);
    expect(o.waiting.count).toBe(1);
    expect(o.protectedNow.count).toBe(1);
    expect(o.wonThisYear.customers).toEqual(['Kaveri Biotech']);
    expect(o.attention.map((a) => a.kind)).toEqual(['late', 'declined']);
    expect(o.recent.every((r) => r.registeredById === sales.id)).toBe(true);
    expect(await db.select().from(accessRequests)).toHaveLength(1);
  });

  it('never includes another company\'s deals and is not for the technical role or staff', async () => {
    const { adminUser } = await seedKestrel();
    await makeRegistration(db, { customerName: 'Other Company Customer', status: 'accepted', protectionEnd: '2026-11-10' });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.expiring14.customers).toEqual(['Tejas Health Network']);
    expect(o.recent.some((r) => r.customer === 'Other Company Customer')).toBe(false);
    const technical = await asPartner(db, { role: 'technical' });
    await expect(withViewer(technical, (tx) => getPartnerOverview(tx, technical, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const staff = await asStaff(db, 'partner_manager', 'all');
    await expect(withViewer(staff, (tx) => getPartnerOverview(tx, staff, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns the recently added documents the audience allows', async () => {
    const { adminUser } = await seedKestrel();
    await makeDocument(db, { title: 'CleanSight product walkthrough', type: 'video', durationMinutes: 14, updatedAt: new Date('2026-11-04T10:00:00Z'), fileKey: 'seed/walkthrough.mp4' });
    await makeDocument(db, { title: 'Old datasheet', updatedAt: new Date('2026-06-01T10:00:00Z'), fileKey: 'seed/old.pdf' });
    const admin = await viewerFor(db, adminUser);
    const o = await withViewer(admin, (tx) => getPartnerOverview(tx, admin, clock));
    expect(o.newDocuments.map((d) => d.title)).toEqual(['CleanSight product walkthrough']);
  });
});
```

Counting check for the first test (Kestrel, clock 6 Nov, a Friday): pending rows Vardhan Capital Libraries registered 4 Nov (2 business days) and Gulfway Freight registered 2 Nov (4 business days), so waiting 2 and oldest 4. Accepted: Tejas (CleanSight, ends 15 Nov), Al Noor (Libraries, 21 Dec), Vardhan CleanSight (12 Jan), so protected 3 and by product CleanSight 2, Libraries 1, expiring within 14 days only Tejas (9 days). Won this year: Indus (19 Sep), Kaveri (11 Aug), not "Won Last Year" (2025). The late item is Gulfway only (the 4 Nov row is 2 business days and not over the target). The salesperson's own rows are Gulfway (pending), Al Noor (accepted), Kaveri (won), Saffron (rejected 4 Nov): waiting 1, protected 1, won Kaveri only, attention late and declined. `recent` for the admin has 7 of the 8 pending, accepted or won rows.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/overview.test.ts`
Expected: FAIL, "Cannot find module './overview'".

- [ ] **Step 6: Implement `src/server/repo/overview.ts`**

```ts
// src/server/repo/overview.ts
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import { accessRequests, invites, registrations } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { addDays, daysBetween, daysLeft, fmtShort, plural } from '@/lib/dates';
import { EXPIRING_SOON_DAYS, isOverSla, RECENT_DECISION_DAYS, waitingBusinessDays } from '@/lib/deal-rules';
import {
  isOneOf,
  PARTNER_ROLE_LABEL,
  PARTNER_ROLES,
  PRODUCT_LABEL,
  PRODUCT_SHORT_LABEL,
} from '@/lib/domain';
import type { AttentionItemDto, PartnerOverviewDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { selectRows, toListItem } from '@/server/registrations/mappers';
import { registrationScope } from '@/server/registrations/scope';
import type { Tx } from './context';
import { listNewDocuments } from './documents';
import { defineIsolation } from './isolation.registry';

const DAY_MS = 86_400_000;
const NEW_DOCUMENTS = 3;
const RECENT_DEALS = 7;

const askedLabel = (at: Date, today: string): string => {
  const date = at.toISOString().slice(0, 10);
  const days = daysBetween(date, today);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : fmtShort(date);
};

/** Partner admin and partner sales. Sales: only deals they registered (ownDealsOnly = true). */
export async function getPartnerOverview(tx: Tx, viewer: Viewer, clock: Clock): Promise<PartnerOverviewDto> {
  if (viewer.kind !== 'partner' || viewer.role === 'technical') {
    throw new ForbiddenError('the overview is for partner admin and sales');
  }
  const today = clock.today();
  const scope = registrationScope(viewer);
  const horizon = addDays(today, EXPIRING_SOON_DAYS);
  const year = today.slice(0, 4);
  const recentCutoff = new Date(clock.now().getTime() - RECENT_DECISION_DAYS * DAY_MS);

  const waitingRows = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      registeredOn: registrations.registeredOn,
      resubmittedOn: registrations.resubmittedOn,
    })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'pending')))
    .orderBy(asc(registrations.registeredOn), asc(registrations.id));
  const waitingDays = waitingRows.map((r) => waitingBusinessDays(r.resubmittedOn ?? r.registeredOn, today));

  const byProduct = await tx
    .select({ product: registrations.product, count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted')))
    .groupBy(registrations.product)
    .orderBy(desc(sql`count(*)`), asc(registrations.product));

  const expiring = await tx
    .select({
      id: registrations.id,
      customer: registrations.customerName,
      product: registrations.product,
      end: registrations.protectionEnd,
    })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'accepted'), gte(registrations.protectionEnd, today), lte(registrations.protectionEnd, horizon)))
    .orderBy(asc(registrations.protectionEnd), asc(registrations.id));

  const won = await tx
    .select({ customer: registrations.customerName })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'won'), gte(registrations.closedOn, `${year}-01-01`), lte(registrations.closedOn, `${year}-12-31`)))
    .orderBy(desc(registrations.closedOn), asc(registrations.id));

  const declined = await tx
    .select({ id: registrations.id, customer: registrations.customerName, product: registrations.product })
    .from(registrations)
    .where(and(scope, eq(registrations.status, 'rejected'), gte(registrations.decidedAt, recentCutoff)))
    .orderBy(desc(registrations.decidedAt), asc(registrations.id));

  const recent = await selectRows(tx)
    .where(and(scope, inArray(registrations.status, ['pending', 'accepted', 'won'])))
    .orderBy(desc(registrations.registeredOn), desc(registrations.createdAt), desc(registrations.id))
    .limit(RECENT_DEALS);

  const attention: AttentionItemDto[] = [];
  if (viewer.role === 'partner_admin') {
    const requests = await tx
      .select()
      .from(accessRequests)
      .where(and(eq(accessRequests.partnerId, viewer.partnerId), eq(accessRequests.status, 'open')))
      .orderBy(asc(accessRequests.createdAt));
    for (const r of requests) {
      attention.push({
        key: `access-${r.id}`,
        kind: 'access_request',
        title: `${r.name} asked for a login`,
        meta: `${PARTNER_ROLE_LABEL[r.requestedRole]}, asked ${askedLabel(r.createdAt, today)}`,
        href: ROUTES.partner.team,
      });
    }
  }
  for (const d of expiring) {
    attention.push({
      key: `exp-${d.id}`,
      kind: 'expiring',
      title: `${d.customer} expires in ${plural(daysLeft(d.end ?? today, today), 'day')}`,
      meta: `${PRODUCT_SHORT_LABEL[d.product]}, protected until ${fmtShort(d.end ?? today)}`,
      href: ROUTES.partner.deal(d.id),
    });
  }
  waitingRows.forEach((r, index) => {
    if (!isOverSla(r.resubmittedOn ?? r.registeredOn, today)) return;
    attention.push({
      key: `late-${r.id}`,
      kind: 'late',
      title: `${r.customer} waiting ${plural(waitingDays[index] ?? 0, 'day')}`,
      meta: `${PRODUCT_LABEL[r.product]}, sent ${fmtShort(r.registeredOn)}`,
      href: ROUTES.partner.deals,
    });
  });
  for (const d of declined) {
    attention.push({
      key: `rej-${d.id}`,
      kind: 'declined',
      title: `${d.customer} was not accepted`,
      meta: `${PRODUCT_LABEL[d.product]}, see the reason and resubmit`,
      href: ROUTES.partner.deals,
    });
  }
  if (viewer.role === 'partner_admin') {
    const open = await tx
      .select()
      .from(invites)
      .where(and(eq(invites.partnerId, viewer.partnerId), isNull(invites.acceptedAt), isNull(invites.revokedAt), gte(invites.expiresAt, clock.now())))
      .orderBy(asc(invites.createdAt));
    for (const invite of open) {
      const role = isOneOf(PARTNER_ROLES, invite.role) ? PARTNER_ROLE_LABEL[invite.role] : invite.role;
      attention.push({
        key: `invite-${invite.id}`,
        kind: 'invite_pending',
        title: `${invite.email} has not accepted invite`,
        meta: `${role}, invited ${fmtShort(invite.createdAt.toISOString().slice(0, 10))}`,
        href: ROUTES.partner.team,
      });
    }
  }

  return {
    ownDealsOnly: viewer.role === 'sales',
    waiting: { count: waitingRows.length, oldestDays: Math.max(0, ...waitingDays) },
    protectedNow: {
      count: byProduct.reduce((n, p) => n + p.count, 0),
      byProduct: byProduct.map((p) => ({ product: p.product, count: p.count })),
    },
    expiring14: { count: expiring.length, customers: expiring.map((d) => d.customer) },
    wonThisYear: { count: won.length, customers: won.map((d) => d.customer) },
    attention,
    recent: recent.map(toListItem),
    newDocuments: await listNewDocuments(tx, viewer, { limit: NEW_DOCUMENTS }, clock),
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getPartnerOverview'>({
  getPartnerOverview: {
    scope: 'tenant',
    expect: 'empty',
    probe: async (tx, viewer) => (await getPartnerOverview(tx, viewer, probeClock)).recent.filter((r) => r.partnerId !== viewer.partnerId),
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/overview.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Write the failing repo tests for the reports**

```ts
// src/server/repo/reports.test.ts
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { partners, users } from '@/db/schema';
import { seedMockData } from '@/db/fixtures';
import { asPartner, asStaff, makeInvite, makePartner, makeRegistration, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { getAdminReports } from './reports';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');
beforeEach(() => resetDb(db));

describe('getAdminReports on the seed', () => {
  it('shows the computed figures, not the mock\'s hard coded ones', async () => {
    await seedMockData(db, { clock });
    const manager = await asStaff(db, 'partner_manager', 'all');
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.totalPartners).toBe(21);
    expect(report.totalRegistered).toBe(15);
    expect(report.partners).toHaveLength(21);
    const kestrel = report.partners.find((p) => p.name === 'Kestrel Systems');
    expect(kestrel).toMatchObject({ category: 'channel', region: 'india', registered: 10, waiting: 2, accepted: 7, rejected: 1, won: 2, protectedNow: 3 });
    expect(report.products.reduce((n, p) => n + p.registered, 0)).toBe(15);
    expect(report.products.map((p) => p.product)).toEqual(['images', 'libraries', 'cleansight']);
    expect(report.followUps.map((f) => f.name)).toEqual(expect.arrayContaining(['Qamar Solutions', 'Meghdoot Systems', 'Ironleaf Consulting']));
    expect(report.followUps.find((f) => f.name === 'Ironleaf Consulting')).toMatchObject({ status: 'inactive' });
  });
});

describe('getAdminReports', () => {
  it('counts every status the way the report defines it', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const partner = await makePartner(db, { name: 'Acme', category: 'integrator', region: 'middle_east' });
    const add = (status: Parameters<typeof makeRegistration>[1]['status'], n: number, product: 'images' | 'libraries' | 'cleansight' = 'images') =>
      Promise.all(Array.from({ length: n }, (_, i) => makeRegistration(db, { partnerId: partner.id, customerName: `${status}-${product}-${i}`, product, status })));
    await add('pending', 1);
    await add('accepted', 2, 'libraries');
    await add('won', 1, 'cleansight');
    await add('lost', 1);
    await add('expired', 1);
    await add('rejected', 2);
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.partners.find((p) => p.partnerId === partner.id)).toEqual({
      partnerId: partner.id, name: 'Acme', category: 'integrator', region: 'middle_east',
      registered: 8, waiting: 1, accepted: 5, rejected: 2, won: 1, protectedNow: 2,
    });
    expect(report.products).toEqual([
      { product: 'images', registered: 5, accepted: 2, won: 0 },
      { product: 'libraries', registered: 2, accepted: 2, won: 0 },
      { product: 'cleansight', registered: 1, accepted: 1, won: 1 },
    ]);
    expect(report.totalRegistered).toBe(8);
  });

  it('counts protected deals ending in the next 14 days', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-20' });
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-21' });
    await makeRegistration(db, { status: 'accepted', protectionEnd: '2026-11-06' });
    await makeRegistration(db, { status: 'pending', protectionEnd: '2026-11-10' });
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.expiringIn14Days).toBe(2);
  });

  it('builds the follow up reasons from real dates', async () => {
    const manager = await asStaff(db, 'partner_manager', 'all');
    const invited = await makePartner(db, { name: 'Qamar Solutions', status: 'onboarding' });
    await makeInvite(db, { partnerId: invited.id, kind: 'partner', role: 'partner_admin', email: 'yasmin@qamar.example', createdAt: new Date('2026-10-27T09:00:00Z') });
    const agreed = await makePartner(db, { name: 'Meghdoot Systems', status: 'onboarding' });
    await db.update(partners).set({ agreementAcceptedAt: new Date('2026-10-30T09:00:00Z') }).where(eq(partners.id, agreed.id));
    const idle = await makePartner(db, { name: 'Ironleaf Consulting', status: 'inactive' });
    const person = await makeUser(db, { partnerId: idle.id, role: 'partner_admin' });
    await db.update(users).set({ lastLoginAt: new Date('2026-08-02T09:00:00Z') }).where(eq(users.id, person.id));
    const silent = await makePartner(db, { name: 'Silent Co', status: 'inactive' });
    await makePartner(db, { name: 'Active Co', status: 'active' });
    await makePartner(db, { name: 'Suspended Co', status: 'suspended' });
    const report = await withViewer(manager, (tx) => getAdminReports(tx, manager, clock));
    expect(report.followUps).toEqual([
      { partnerId: agreed.id, name: 'Meghdoot Systems', why: 'Agreement accepted 30 Oct, no deal registered yet', status: 'onboarding' },
      { partnerId: invited.id, name: 'Qamar Solutions', why: 'Invited 27 Oct, has not accepted the agreement', status: 'onboarding' },
      { partnerId: idle.id, name: 'Ironleaf Consulting', why: 'No sign-in since 2 Aug', status: 'inactive' },
      { partnerId: silent.id, name: 'Silent Co', why: 'No sign-in yet', status: 'inactive' },
    ]);
  });

  it('limits staff sales to their region and refuses partners and marketing', async () => {
    const india = await makePartner(db, { name: 'India Co', region: 'india' });
    const gulf = await makePartner(db, { name: 'Gulf Co', region: 'middle_east' });
    await makeRegistration(db, { partnerId: india.id, region: 'india' });
    await makeRegistration(db, { partnerId: india.id, region: 'middle_east' });
    await makeRegistration(db, { partnerId: gulf.id, region: 'middle_east' });
    const sales = await asStaff(db, 'sales', 'india');
    const report = await withViewer(sales, (tx) => getAdminReports(tx, sales, clock));
    expect(report.partners.map((p) => [p.name, p.registered])).toEqual([['India Co', 1]]);
    expect(report.totalPartners).toBe(1);
    expect(report.totalRegistered).toBe(1);
    const partner = await asPartner(db, { role: 'partner_admin' });
    await expect(withViewer(partner, (tx) => getAdminReports(tx, partner, clock))).rejects.toBeInstanceOf(ForbiddenError);
    const marketing = await asStaff(db, 'marketing', 'all');
    await expect(withViewer(marketing, (tx) => getAdminReports(tx, marketing, clock))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/reports.test.ts`
Expected: FAIL, "Cannot find module './reports'".

- [ ] **Step 8: Implement `src/server/repo/reports.ts`**

```ts
// src/server/repo/reports.ts
import { and, asc, eq, gte, inArray, lte, max, min, sql } from 'drizzle-orm';
import { invites, partners, registrations, users } from '@/db/schema';
import { type Clock, fixedClock } from '@/lib/clock';
import { addDays, fmtShort } from '@/lib/dates';
import { EXPIRING_SOON_DAYS } from '@/lib/deal-rules';
import { PRODUCTS } from '@/lib/domain';
import type { AdminReportsDto, FollowUpDto, PartnerReportRow, ProductReportRow } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

const toDate = (value: Date | string | null): Date | null => (value === null ? null : new Date(value));
const dateOf = (value: Date): string => value.toISOString().slice(0, 10);

/**
 * Partner manager (all) and staff sales (own region). Aggregates only; `accepted` counts status accepted, won, lost
 * and expired. Filtering by region, category and sort, and the CSV, are client side (src/lib/report-view.ts).
 * Staff sales see the partners of their region and the registrations of their region.
 */
export async function getAdminReports(tx: Tx, viewer: Viewer, clock: Clock): Promise<AdminReportsDto> {
  assertStaff(viewer);
  if (viewer.role !== 'partner_manager' && viewer.role !== 'sales') {
    throw new ForbiddenError('reports are for partner managers and staff sales');
  }
  const region = viewer.role === 'sales' && viewer.region !== 'all' ? viewer.region : null;
  const today = clock.today();

  const partnerRows = await tx
    .select({
      id: partners.id,
      name: partners.name,
      category: partners.category,
      region: partners.region,
      status: partners.status,
      agreementAcceptedAt: partners.agreementAcceptedAt,
      createdAt: partners.createdAt,
    })
    .from(partners)
    .where(region ? eq(partners.region, region) : undefined)
    .orderBy(asc(partners.name), asc(partners.id));

  const regionFilter = region ? eq(registrations.region, region) : undefined;
  const perPartner = await tx
    .select({
      partnerId: registrations.partnerId,
      registered: sql<number>`count(*)::int`,
      waiting: sql<number>`(count(*) filter (where ${registrations.status} = 'pending'))::int`,
      accepted: sql<number>`(count(*) filter (where ${registrations.status} in ('accepted', 'won', 'lost', 'expired')))::int`,
      rejected: sql<number>`(count(*) filter (where ${registrations.status} = 'rejected'))::int`,
      won: sql<number>`(count(*) filter (where ${registrations.status} = 'won'))::int`,
      protectedNow: sql<number>`(count(*) filter (where ${registrations.status} = 'accepted'))::int`,
    })
    .from(registrations)
    .where(regionFilter)
    .groupBy(registrations.partnerId);
  const counts = new Map(perPartner.map((c) => [c.partnerId, c]));

  const partnerReport: PartnerReportRow[] = partnerRows.map((p) => {
    const c = counts.get(p.id);
    return {
      partnerId: p.id,
      name: p.name,
      category: p.category,
      region: p.region,
      registered: c?.registered ?? 0,
      waiting: c?.waiting ?? 0,
      accepted: c?.accepted ?? 0,
      rejected: c?.rejected ?? 0,
      won: c?.won ?? 0,
      protectedNow: c?.protectedNow ?? 0,
    };
  });

  const perProduct = await tx
    .select({
      product: registrations.product,
      registered: sql<number>`count(*)::int`,
      accepted: sql<number>`(count(*) filter (where ${registrations.status} in ('accepted', 'won', 'lost', 'expired')))::int`,
      won: sql<number>`(count(*) filter (where ${registrations.status} = 'won'))::int`,
    })
    .from(registrations)
    .where(regionFilter)
    .groupBy(registrations.product);
  const products: ProductReportRow[] = PRODUCTS.map((product) => {
    const c = perProduct.find((p) => p.product === product);
    return { product, registered: c?.registered ?? 0, accepted: c?.accepted ?? 0, won: c?.won ?? 0 };
  });

  const [expiring] = await tx
    .select({ n: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      and(
        regionFilter,
        eq(registrations.status, 'accepted'),
        gte(registrations.protectionEnd, today),
        lte(registrations.protectionEnd, addDays(today, EXPIRING_SOON_DAYS)),
      ),
    );

  const onboarding = partnerRows.filter((p) => p.status === 'onboarding');
  const inactive = partnerRows.filter((p) => p.status === 'inactive');
  const firstInvites =
    onboarding.length === 0
      ? []
      : await tx
          .select({ partnerId: invites.partnerId, first: min(invites.createdAt) })
          .from(invites)
          .where(inArray(invites.partnerId, onboarding.map((p) => p.id)))
          .groupBy(invites.partnerId);
  const lastLogins =
    inactive.length === 0
      ? []
      : await tx
          .select({ partnerId: users.partnerId, last: max(users.lastLoginAt) })
          .from(users)
          .where(inArray(users.partnerId, inactive.map((p) => p.id)))
          .groupBy(users.partnerId);

  const followUps: FollowUpDto[] = [];
  for (const p of onboarding) {
    if (p.agreementAcceptedAt) {
      followUps.push({ partnerId: p.id, name: p.name, why: `Agreement accepted ${fmtShort(dateOf(p.agreementAcceptedAt))}, no deal registered yet`, status: 'onboarding' });
      continue;
    }
    const invited = toDate(firstInvites.find((i) => i.partnerId === p.id)?.first ?? null) ?? p.createdAt;
    followUps.push({ partnerId: p.id, name: p.name, why: `Invited ${fmtShort(dateOf(invited))}, has not accepted the agreement`, status: 'onboarding' });
  }
  for (const p of inactive) {
    const last = toDate(lastLogins.find((l) => l.partnerId === p.id)?.last ?? null);
    followUps.push({ partnerId: p.id, name: p.name, why: last ? `No sign-in since ${fmtShort(dateOf(last))}` : 'No sign-in yet', status: 'inactive' });
  }

  return {
    totalPartners: partnerReport.length,
    totalRegistered: partnerReport.reduce((n, p) => n + p.registered, 0),
    partners: partnerReport,
    products,
    followUps,
    expiringIn14Days: expiring?.n ?? 0,
  };
}

const probeClock = fixedClock('2026-11-06T14:02:00Z');

export const isolation = defineIsolation<'getAdminReports'>({
  getAdminReports: { scope: 'staff-only', expect: 'forbidden', probe: (tx, viewer) => getAdminReports(tx, viewer, probeClock) },
});
```

`totalRegistered` is the sum of the partner rows, so it counts only registrations of partners in scope, which for a partner manager is every registration. Follow ups print onboarding partners first (agreed, then invited, in name order) and inactive partners after, which is the order the test expects.

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/reports.test.ts src/server/repo/overview.test.ts src/server/repo/isolation.test.ts`
Expected: PASS, 5 tests in the reports file (1 seed test and 4 more), 5 in the overview file, and the isolation matrix green with both new modules listed.

- [ ] **Step 9: Rewrite the report components**

`src/components/reports/partner-ui.ts` (complete file):

```ts
import type { PartnerCategory } from '@/lib/domain';

export const CATEGORY_BADGE: Record<PartnerCategory, string> = {
  distributor: 'b-violet',
  channel: 'b-blue',
  integrator: 'b-cyan',
};

export const initialsOf = (name: string): string =>
  name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const avatarClass = (index: number): string => `av-${(index % 4) + 1}`;
```

`src/components/reports/FollowUpList.tsx` (complete file):

```tsx
import Link from 'next/link';
import type { FollowUpDto } from '@/lib/dto';
import { ROUTES } from '@/lib/routes';
import { avatarClass, initialsOf } from './partner-ui';

export function FollowUpList({ items }: { items: FollowUpDto[] }): React.JSX.Element {
  return (
    <section
      aria-labelledby="fu"
      className="card clip"
      style={{ flex: '1 1 380px', minWidth: 300 }}
    >
      <div className="card-h">
        <h2 id="fu" className="card-t">
          Partners to follow up
        </h2>
        <span className="card-meta">{items.length}</span>
      </div>
      {items.map((f, i) => (
        <Link key={f.partnerId} href={ROUTES.admin.partners} className="li">
          <span className={`av ${avatarClass(i + 2)}`}>{initialsOf(f.name)}</span>
          <span className="li-t">
            <span className="li-n">{f.name}</span>
            <span className="li-s">{f.why}</span>
          </span>
          <span
            className={`badge ${f.status === 'inactive' ? 'b-expired' : 'b-pending'}`}
            style={{ marginLeft: 'auto' }}
          >
            {f.status === 'inactive' ? 'Inactive' : 'Onboarding'}
          </span>
        </Link>
      ))}
    </section>
  );
}
```

`src/components/reports/ProductBreakdown.tsx` (complete file; copy change: the card meta reads "Registered, all time" because the report has no quarter filter):

```tsx
import { CHIP_PRODUCT } from '@/components/deals/derive';
import { ProductChip } from '@/components/ui/badge';
import type { ProductReportRow } from '@/lib/dto';

export function ProductBreakdown({ rows, total }: { rows: ProductReportRow[]; total: number }): React.JSX.Element {
  return (
    <section aria-labelledby="bp" className="card clip" style={{ flex: '1 1 520px', minWidth: 0 }}>
      <div className="card-h">
        <h2 id="bp" className="card-t">
          By product
        </h2>
        <span className="card-meta">Registered, all time</span>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col" className="r">
              Registered
            </th>
            <th scope="col" className="r">
              Accepted
            </th>
            <th scope="col" className="r">
              Won
            </th>
            <th scope="col" style={{ width: '34%' }}>
              Share of registrations
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const share = total ? Math.round((b.registered / total) * 100) : 0;
            return (
              <tr key={b.product}>
                <td>
                  <ProductChip product={CHIP_PRODUCT[b.product]} />
                </td>
                <td className="tnum r">{b.registered}</td>
                <td className="tnum r">{b.accepted}</td>
                <td className="tnum r">{b.won}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="bar" style={{ flex: 1 }}>
                      <span style={{ width: `${share}%` }} />
                    </span>
                    <span className="tnum t-sec" style={{ width: 34, textAlign: 'right' }}>
                      {share}%
                    </span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 10: Rewrite the two pages**

`src/app/partner/overview/page.tsx`:

```tsx
import type { Metadata } from "next";
import { PartnerOverview } from "@/components/screens/PartnerOverview";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getPartnerOverview } from "@/server/repo/overview";

export const metadata: Metadata = { title: "Overview" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("overview.read");
  const now = systemClock.now();
  const overview = await withViewer(viewer, (tx) => getPartnerOverview(tx, viewer, systemClock));
  return <PartnerOverview overview={overview} today={systemClock.today()} asOf={now.toISOString()} />;
}
```

`src/app/admin/reports/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AdminReports } from "@/components/screens/AdminReports";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getAdminReports } from "@/server/repo/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("report.read");
  const report = await withViewer(viewer, (tx) => getAdminReports(tx, viewer, systemClock));
  return <AdminReports report={report} today={systemClock.today()} />;
}
```

- [ ] **Step 11: Edit `PartnerOverview.tsx`**

Copy changes: "Updated 6 Nov 2026, 14:20" now prints the time the page was rendered; the "New documents" rows come from the documents the viewer's audience allows (the mock listed three fixed titles). Nothing else in the visible text changes.

Edit 1, imports. Before:

```tsx
import Link from "next/link";
import { useMemo } from "react";
import { type Deal, PRODUCTS, useDeals } from "@/data/deals";
import { ROUTES } from "@/lib/routes";
import { KESTREL } from "../shell/personas";
import { Icon } from "../icon";
import type { IconName } from "../icon-paths";
import { daysLeft, fmtShort, plural, TODAY } from "../deals/dates";
import { PRODUCT_SHORT, waitDays } from "../deals/derive";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { Badge, ProductChip } from "../ui/badge";
```
After:
```tsx
import Link from "next/link";
import type { PartnerOverviewDto } from "@/lib/dto";
import { fmtLong } from "@/lib/dates";
import { ROUTES } from "@/lib/routes";
import { Icon } from "../icon";
import { CHIP_PRODUCT } from "../deals/derive";
import { ATTENTION_STYLE, buildOverviewKpis, docIcon, docMeta } from "../deals/overview";
import { CustomerMark, PLUS_PATH, ProtectionCell, StatusBadge } from "../deals/parts";
import { Badge, ProductChip } from "../ui/badge";
```

Edit 2, from the `Kpi` interface to the end of the `recent` memo. Before (verbatim, from `interface Kpi {` to the closing `);` of the `recent` memo):

```tsx
interface Kpi {
  label: string;
  value: string;
  foot: string;
  cls: string;
}

interface Attention {
  key: string;
  title: string;
  meta: string;
  icon: IconName;
  tone: string;
  href: string;
}

const NEW_DOCS: { title: string; meta: string; icon: IconName }[] = [
  { title: "CleanSight product walkthrough", meta: "Video, 14 min, 4 Nov", icon: "play" },
  { title: "Clean Libraries solution sheet", meta: "Solution sheet, 30 Oct", icon: "file" },
  { title: "Partner sales playbook 2026", meta: "Enablement guide, 27 Oct", icon: "file" },
];

function buildKpis(mine: Deal[]): Kpi[] {
  const waiting = mine.filter((d) => d.status === "Pending");
  const oldest = Math.max(0, ...waiting.map(waitDays));
  const protectedDeals = mine.filter((d) => d.status === "Accepted");
  const byProduct = PRODUCTS.map((p) => ({ p, n: protectedDeals.filter((d) => d.product === p).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => `${x.n} ${PRODUCT_SHORT[x.p]}`);
  const expiring = protectedDeals.filter((d) => d.protectionEnd && daysLeft(d.protectionEnd) <= 14);
  const year = TODAY.slice(0, 4);
  const won = mine
    .filter((d) => d.status === "Won" && d.closedOn?.startsWith(year))
    .sort((a, b) => (b.closedOn ?? "").localeCompare(a.closedOn ?? ""));
  return [
    {
      label: "Waiting",
      value: String(waiting.length),
      foot: waiting.length ? `Oldest ${plural(oldest, "day")}` : "Nothing waiting",
      cls: "",
    },
    {
      label: "Protected",
      value: String(protectedDeals.length),
      foot: byProduct.length ? byProduct.join(", ") : "None yet",
      cls: "",
    },
    {
      label: "Expiring in 14 days",
      value: String(expiring.length),
      foot: expiring.length ? expiring.map((d) => d.customer).join(", ") : "None",
      cls: expiring.length ? "t-amber" : "",
    },
    {
      label: "Won this year",
      value: String(won.length),
      foot: won.length ? won.map((d) => d.customer).join(", ") : "None yet",
      cls: "",
    },
  ];
}

function buildAttention(mine: Deal[]): Attention[] {
  const expiring = mine
    .filter((d) => d.status === "Accepted" && d.protectionEnd && daysLeft(d.protectionEnd) <= 14)
    .map<Attention>((d) => ({
      key: `exp-${d.id}`,
      title: `${d.customer} expires in ${plural(daysLeft(d.protectionEnd ?? TODAY), "day")}`,
      meta: `${PRODUCT_SHORT[d.product]}, protected until ${fmtShort(d.protectionEnd ?? TODAY)}`,
      icon: "hg",
      tone: "tone-amber",
      href: ROUTES.partner.deal(d.id),
    }));
  const late = mine
    .filter((d) => d.status === "Pending" && waitDays(d) > 2)
    .map<Attention>((d) => ({
      key: `late-${d.id}`,
      title: `${d.customer} waiting ${plural(waitDays(d), "day")}`,
      meta: `${d.product}, sent ${fmtShort(d.registered)}`,
      icon: "clk",
      tone: "",
      href: ROUTES.partner.deals,
    }));
  const declined = mine
    .filter((d) => d.status === "Rejected" && d.decidedLive)
    .map<Attention>((d) => ({
      key: `rej-${d.id}`,
      title: `${d.customer} was not accepted`,
      meta: `${d.product}, see the reason and resubmit`,
      icon: "warn",
      tone: "tone-red",
      href: ROUTES.partner.deals,
    }));
  return [
    {
      key: "team-login",
      title: "Rohit Desai asked for a login",
      meta: "Sales, asked today",
      icon: "team",
      tone: "tone-violet",
      href: ROUTES.partner.team,
    },
    ...expiring,
    ...late,
    ...declined,
    {
      key: "team-invite",
      title: "Vikram Sethi has not accepted invite",
      meta: "Sales, invited 5 Nov",
      icon: "team",
      tone: "",
      href: ROUTES.partner.team,
    },
  ];
}

export function PartnerOverview(): React.JSX.Element {
  const deals = useDeals();
  const mine = useMemo(() => deals.filter((d) => d.partner === KESTREL.org), [deals]);
  const kpis = useMemo(() => buildKpis(mine), [mine]);
  const attention = useMemo(() => buildAttention(mine), [mine]);
  const recent = useMemo(
    () =>
      mine
        .filter((d) => d.status === "Pending" || d.status === "Accepted" || d.status === "Won")
        .sort((a, b) => b.registered.localeCompare(a.registered))
        .slice(0, 7),
    [mine],
  );
```
After:
```tsx
interface PartnerOverviewProps {
  overview: PartnerOverviewDto;
  today: string;
  /** When the page was rendered, an ISO timestamp. */
  asOf: string;
}

export function PartnerOverview({ overview, today, asOf }: PartnerOverviewProps): React.JSX.Element {
  const kpis = buildOverviewKpis(overview);
  const attention = overview.attention;
  const recent = overview.recent;
  const newDocuments = overview.newDocuments;
```

Edit 3, the header text. Before: `<span className="h1-sub">Updated 6 Nov 2026, 14:20</span>` After: `<span className="h1-sub">Updated {fmtLong(today)}, {asOf.slice(11, 16)}</span>`.

Edit 4, the recent deals card. Before:

```tsx
                <span className="card-meta">{mine.length} total</span>
```
After:
```tsx
                <span className="card-meta">{recent.length} shown</span>
```
Before:
```tsx
                      <td>
                        <ProductChip product={d.product} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="t-sec">{d.stage}</td>
                      <ProtectionCell deal={d} mode="overview" />
```
After:
```tsx
                      <td>
                        <ProductChip product={CHIP_PRODUCT[d.product]} />
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="t-sec">{d.stage}</td>
                      <ProtectionCell deal={d} mode="overview" today={today} />
```

(Copy change: the mock said "{N} total", counting every deal of the company; the overview DTO carries the seven recent deals, not a total, and a wrong number is worse than a different word.)

Edit 5, the attention rows. Before:

```tsx
              <Link href={a.href} className="li" key={a.key}>
                <span className={`li-ic ${a.tone}`}>
                  <Icon name={a.icon} />
                </span>
```
After:
```tsx
              <Link href={a.href} className="li" key={a.key}>
                <span className={`li-ic ${ATTENTION_STYLE[a.kind].tone}`}>
                  <Icon name={ATTENTION_STYLE[a.kind].icon} />
                </span>
```

Edit 6, the new documents. Before:

```tsx
            {NEW_DOCS.map((f) => (
              <Link href={ROUTES.partner.documents} className="li" key={f.title}>
                <span className="li-ic">
                  <Icon name={f.icon} />
                </span>
                <span className="li-t">
                  <span className="li-n">{f.title}</span>
                  <span className="li-s">{f.meta}</span>
                </span>
              </Link>
            ))}
```
After:
```tsx
            {newDocuments.map((f) => (
              <Link href={ROUTES.partner.documents} className="li" key={f.id}>
                <span className="li-ic">
                  <Icon name={docIcon(f)} />
                </span>
                <span className="li-t">
                  <span className="li-n">{f.title}</span>
                  <span className="li-s">{docMeta(f)}</span>
                </span>
              </Link>
            ))}
```

- [ ] **Step 12: Edit `AdminReports.tsx`**

Copy changes (forced by the contracts' report, which has no quarter): the header sub reads "All time, up to 6 Nov 2026." instead of "Q4 2026 so far, 1 Oct to 6 Nov."; the CSV file is named `partner-report-<date>.csv` instead of `partner-report-q4-2026.csv`.

Edit 1, imports. Before:

```tsx
import { avatarClass, CATEGORY_BADGE, initialsOf } from '@/components/reports/partner-ui';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { ROUTES } from '@/lib/routes';
import {
  CATEGORIES,
  filterPartnerRows,
  partnersToCsv,
  REGIONS,
  SORTS,
  TOTAL_PARTNERS,
  type ReportSort,
} from '@/data/reports';
```
After:
```tsx
import { avatarClass, CATEGORY_BADGE, initialsOf } from '@/components/reports/partner-ui';
import { Dropdown } from '@/components/ui/dropdown';
import { useToast } from '@/components/ui/toast';
import { fmtLong } from '@/lib/dates';
import { PARTNER_CATEGORY_LABEL, PARTNER_REGION_LABEL } from '@/lib/domain';
import type { AdminReportsDto } from '@/lib/dto';
import {
  acceptRate,
  CATEGORY_OPTIONS,
  filterPartnerRows,
  partnersToCsv,
  REGION_OPTIONS,
  SORTS,
  type ReportSort,
} from '@/lib/report-view';
import { ROUTES } from '@/lib/routes';
```

Edit 2, the component head. Before:

```tsx
export function AdminReports(): React.JSX.Element {
  const toast = useToast();
  const [region, setRegion] = useState<string>('All regions');
  const [category, setCategory] = useState<string>('All partner categories');
  const [sort, setSort] = useState<ReportSort>('Most registered');

  const rows = useMemo(() => filterPartnerRows(region, category, sort), [region, category, sort]);

  const exportCsv = (): void => {
    downloadCsv('partner-report-q4-2026.csv', partnersToCsv(rows));
    toast(`Exported ${rows.length} partners to CSV`);
  };
```
After:
```tsx
interface AdminReportsProps {
  report: AdminReportsDto;
  today: string;
}

export function AdminReports({ report, today }: AdminReportsProps): React.JSX.Element {
  const toast = useToast();
  const [region, setRegion] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<ReportSort>('Most registered');

  const rows = useMemo(
    () => filterPartnerRows(report.partners, region, category, sort),
    [report.partners, region, category, sort],
  );
  const sum = (pick: (p: AdminReportsDto['partners'][number]) => number): number =>
    report.partners.reduce((n, p) => n + pick(p), 0);
  const accepted = sum((p) => p.accepted);
  const rejected = sum((p) => p.rejected);
  const rate = acceptRate(accepted, rejected);

  const exportCsv = (): void => {
    downloadCsv(`partner-report-${today}.csv`, partnersToCsv(rows));
    toast(`Exported ${rows.length} partners to CSV`);
  };
```

Edit 3, the header and KPI cards. Before: `<span className="h1-sub">Q4 2026 so far, 1 Oct to 6 Nov.</span>` After: `<span className="h1-sub">All time, up to {fmtLong(today)}.</span>`.

Before:
```tsx
          <span className="kpi-v">46</span>
          <span className="kpi-f">From 15 partners</span>
```
After:
```tsx
          <span className="kpi-v">{report.totalRegistered}</span>
          <span className="kpi-f">From {report.partners.filter((p) => p.registered > 0).length} partners</span>
```
Before:
```tsx
          <span className="kpi-v">36</span>
          <span className="kpi-f">86% accept rate, 6 rejected</span>
```
After:
```tsx
          <span className="kpi-v">{accepted}</span>
          <span className="kpi-f">{rate === null ? 'No decisions yet' : `${rate}% accept rate, ${rejected} rejected`}</span>
```
Before:
```tsx
          <span className="kpi-v">11</span>
          <span className="kpi-f">Closed won in HubSpot</span>
```
After:
```tsx
          <span className="kpi-v">{sum((p) => p.won)}</span>
          <span className="kpi-f">Closed won in HubSpot</span>
```
Before:
```tsx
          <span className="kpi-v">38</span>
          <span className="kpi-f">5 end in the next 14 days</span>
```
After:
```tsx
          <span className="kpi-v">{sum((p) => p.protectedNow)}</span>
          <span className="kpi-f">{report.expiringIn14Days} end in the next 14 days</span>
```

Edit 4, the partner table card. Before: `Showing {rows.length} of {TOTAL_PARTNERS} partners` After: `Showing {rows.length} of {report.totalPartners} partners`.
Before: `<Dropdown id="rr" value={region} options={REGIONS} onChange={setRegion} />` After: `<Dropdown id="rr" value={region} options={REGION_OPTIONS} onChange={setRegion} />`.
Before: `<Dropdown id="rc" value={category} options={CATEGORIES} onChange={setCategory} />` After: `<Dropdown id="rc" value={category} options={CATEGORY_OPTIONS} onChange={setCategory} />`.
Before:
```tsx
              {rows.map((p, i) => (
                <tr key={p.name}>
```
After:
```tsx
              {rows.map((p, i) => (
                <tr key={p.partnerId}>
```
Before:
```tsx
                    <span className={`badge ${CATEGORY_BADGE[p.category]}`}>{p.category}</span>
                  </td>
                  <td className="t-sec">{p.region}</td>
```
After:
```tsx
                    <span className={`badge ${CATEGORY_BADGE[p.category]}`}>{PARTNER_CATEGORY_LABEL[p.category]}</span>
                  </td>
                  <td className="t-sec">{PARTNER_REGION_LABEL[p.region]}</td>
```
Before:
```tsx
                onClick={() => {
                  setRegion('All regions');
                  setCategory('All partner categories');
                }}
```
After:
```tsx
                onClick={() => {
                  setRegion('all');
                  setCategory('all');
                }}
```

Edit 5, the two cards at the bottom. Before:
```tsx
        <ProductBreakdown />
        <FollowUpList />
```
After:
```tsx
        <ProductBreakdown rows={report.products} total={report.totalRegistered} />
        <FollowUpList items={report.followUps} />
```

- [ ] **Step 13: Gate A and the manual check**

Run the Gate A block. Expected: all green; changed paths are the Files block.

Manual check (seed-dev data, dev date 6 Nov 2026 or later):
- `/partner/overview` as Aditi Rao (partner admin): the four figures read Waiting 2 (foot "Oldest N days"), Protected 3 ("2 CleanSight, 1 Libraries"), Expiring in 14 days 1 ("Tejas Health Network") while the dev date is within 14 days of 15 Nov, Won this year 2 ("Indus Paytech, Kaveri Biotech"). Recent deals lists up to 7 rows with the protection cell colours as before. "Needs attention" shows the access request (Rohit Desai), the expiring deal, any deal waiting more than 2 business days and Vikram Sethi's invite (by email address). New documents lists the documents the Kestrel audience may open, by their real titles.
- Sign in as a Kestrel sales user: "Waiting", "Protected" and "Recent deals" count only the deals that person registered; the access request and invite lines are gone.
- `/admin/reports` as Farhan (partner manager): Registered 15, "From 4 partners" (partners that have a registration), Accepted and rate computed from the seed, Won 3, Protected now and "N end in the next 14 days". The table lists 21 partners; the Kestrel row reads Registered 10, Accepted 7, Accept rate 88%, Won 2, Protected now 3. Filtering to "Middle East" and sorting "Name" works; "Export CSV" downloads `partner-report-<today>.csv` with labels in the Category and Region columns. "Partners to follow up" lists Qamar Solutions, Meghdoot Systems and Ironleaf Consulting with reasons built from the seeded dates.
- Sign in as Rahul Menon (staff sales, India): only India partners and India deals are counted; as Ishita Bose (marketing) `/admin/reports` redirects to the documents home.

- [ ] **Step 14: Commit**

```bash
git add apps/portal/src/lib/report-view.ts apps/portal/src/lib/report-view.test.ts \
  apps/portal/src/components/deals/overview.ts apps/portal/src/components/deals/overview.test.ts \
  apps/portal/src/components/reports apps/portal/src/server/repo/overview.ts apps/portal/src/server/repo/overview.test.ts \
  apps/portal/src/server/repo/reports.ts apps/portal/src/server/repo/reports.test.ts \
  apps/portal/src/components/screens/PartnerOverview.tsx apps/portal/src/components/screens/AdminReports.tsx \
  apps/portal/src/app/partner/overview/page.tsx apps/portal/src/app/admin/reports/page.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M2.6 partner overview and admin reports from SQL aggregates"
```

---
### Task M4.4: Notifications and help popovers read real data

`shell.tsx` is a shared file: R does not edit it. This task delivers everything the shell needs (the popover component, the pure helpers, the repo functions and actions from M2.3) and prints the exact `shell.tsx` and layout change as Contract change request 5, which the orchestrator applies on `feat/portal-build` (W2-a).

**Gate A:** the Gate A block in "Conventions". The popover is not imported by anything until Contract change request 5 is applied, so its checks are lint, typecheck and build (they cover the file) plus the unit test of its pure helpers.

**Files:**
- Create: `src/lib/notification-view.ts`, `src/lib/notification-view.test.ts`
- Create: `src/components/shell/notifications-popover.tsx`
- Not touched here (orchestrator, Contract change request 5): `src/components/shell/shell.tsx`, `src/app/partner/layout.tsx`, `src/app/admin/layout.tsx`
- Test: `src/lib/notification-view.test.ts`

Prerequisite: M2.3 merged (`listNotifications`, `markAllNotificationsReadAction`, `markNotificationReadAction`).

Rules this task implements: the bell shows the viewer's own notifications, newest first, and the unread ones carry a dot; the ping shows while any notification is unread (the total, not only the ten shown); "Mark all read" and opening one mark them read; a notification with no safe app relative link is shown but not clickable; the list is refreshed each time the popover opens. The help popover needs no new data code: its "Message your partner manager" entry and the profile menu's "Message <name>" read the manager from `ShellDto.manager`, which `getShell` (M1.1) already loads, and that replaces the mock's `persona.manager` in the same W0-f change that replaces the persona. This task verifies it in the manual check instead of duplicating it.

- [ ] **Step 1: Write the failing tests for the pure helpers**

```ts
// src/lib/notification-view.test.ts
import { describe, expect, it } from 'vitest';
import { ICONS } from '@/components/icon-paths';
import { NOTIFICATION_KINDS } from './domain';
import { isAppLink, notificationIcon, notificationWhen } from './notification-view';

describe('notificationIcon', () => {
  it('has a real icon for every notification kind', () => {
    for (const kind of NOTIFICATION_KINDS) expect(Object.keys(ICONS)).toContain(notificationIcon(kind));
  });
  it('uses the mock\'s icons where the mock had one', () => {
    expect(notificationIcon('access_requested')).toBe('team');
    expect(notificationIcon('registration_expiring')).toBe('hg');
    expect(notificationIcon('application_new')).toBe('bld');
    expect(notificationIcon('registration_rejected')).toBe('warn');
  });
});

describe('notificationWhen', () => {
  const today = '2026-11-06';
  it('says Today, a number of days ago for the first week, then the date', () => {
    expect(notificationWhen('2026-11-06T09:30:00.000Z', today)).toBe('Today');
    expect(notificationWhen('2026-11-05T23:59:00.000Z', today)).toBe('1 day ago');
    expect(notificationWhen('2026-11-03T08:00:00.000Z', today)).toBe('3 days ago');
    expect(notificationWhen('2026-10-31T08:00:00.000Z', today)).toBe('6 days ago');
    expect(notificationWhen('2026-10-30T08:00:00.000Z', today)).toBe('30 Oct');
  });
});

describe('isAppLink', () => {
  it('accepts paths inside the app only', () => {
    expect(isAppLink('/partner/deals/123')).toBe(true);
    expect(isAppLink('//evil.example/x')).toBe(false);
    expect(isAppLink('https://evil.example')).toBe(false);
    expect(isAppLink('javascript:alert(1)')).toBe(false);
    expect(isAppLink(null)).toBe(false);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/notification-view.test.ts`
Expected: FAIL, "Cannot find module './notification-view'".

- [ ] **Step 2: Implement `src/lib/notification-view.ts`**

Days 2 to 6 read "N days ago"; from 7 days the date is shown.

```ts
import type { IconName } from '@/components/icon-paths';
import { daysBetween, fmtShort } from './dates';
import type { NotificationKind } from './domain';

const ICON: Record<NotificationKind, IconName> = {
  registration_submitted: 'approve',
  registration_accepted: 'deals',
  registration_rejected: 'warn',
  registration_resubmitted: 'approve',
  registration_stage: 'deals',
  registration_message: 'send',
  registration_expiring: 'hg',
  registration_expired: 'hg',
  extension_requested: 'clk',
  extension_decided: 'clk',
  document_new: 'file',
  access_requested: 'team',
  application_new: 'bld',
  team_joined: 'team',
  team_removed: 'team',
};

export const notificationIcon = (kind: NotificationKind): IconName => ICON[kind];

/** "Today", "3 days ago", then "30 Oct". `today` is the server date so the label is the same on every device. */
export function notificationWhen(createdAt: string, today: string): string {
  const date = createdAt.slice(0, 10);
  const days = daysBetween(date, today);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 7) return `${days} days ago`;
  return fmtShort(date);
}

/** Only paths inside this app are links. A stored link is our own, but a bell must never become an open redirect. */
export const isAppLink = (link: string | null): link is string => link !== null && link.startsWith('/') && !link.startsWith('//');
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/lib/notification-view.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 3: Write `src/components/shell/notifications-popover.tsx`**

The markup and classes are the mock's bell block, moved into a component: `pop-wrap`, `ibtn`, `ping`, `dd-scrim`, `pop`, `pop-h`, `pop-t`, `btn btn-t`, `li`, `li-ic`, `li-t`, `li-n`, `li-s`, `unread`. The only new element is the empty state, which reuses `empty`.

```tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NotificationDto, NotificationsDto } from "@/lib/dto";
import { isAppLink, notificationIcon, notificationWhen } from "@/lib/notification-view";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/actions/notifications";
import { Icon } from "../icon";

const BELL =
  "M220.07,176.94C214.41,167.2,206,139.73,206,104a78,78,0,1,0-156,0c0,35.74-8.42,63.2-14.08,72.94A14,14,0,0,0,48,198H90.48a38,38,0,0,0,75,0H208a14,14,0,0,0,12.06-21.06ZM128,218a26,26,0,0,1-25.29-20h50.58A26,26,0,0,1,128,218Zm81.71-33a1.9,1.9,0,0,1-1.7,1H48a1.9,1.9,0,0,1-1.7-1,2,2,0,0,1,0-2C53.87,170,62,139.69,62,104a66,66,0,1,1,132,0c0,35.68,8.14,65.95,15.71,79A2,2,0,0,1,209.71,185Z";

interface NotificationsPopoverProps {
  notifications: NotificationsDto;
  /** The server's UTC date, so "Today" reads the same on every device. */
  today: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/** The bell in the top bar and its popover. Reads the viewer's own notifications; the layout supplies and refreshes them. */
export function NotificationsPopover({ notifications, today, open, onToggle, onClose }: NotificationsPopoverProps): React.JSX.Element {
  const router = useRouter();
  const [readHere, setReadHere] = useState<ReadonlySet<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  // a fresh list from the server replaces what was marked read locally
  // biome-ignore lint/correctness/useExhaustiveDependencies: the list identity is the trigger
  useEffect(() => {
    setReadHere(new Set());
    setAllRead(false);
  }, [notifications]);

  // the layout does not re-run on client navigation, so ask it for fresh data whenever the popover opens
  useEffect(() => {
    if (open) router.refresh();
  }, [open, router]);

  const isUnread = (n: NotificationDto): boolean => n.readAt === null && !allRead && !readHere.has(n.id);
  const locallyRead = notifications.items.filter((n) => n.readAt === null && readHere.has(n.id)).length;
  const unreadCount = allRead ? 0 : Math.max(0, notifications.unread - locallyRead);

  const markAll = async (): Promise<void> => {
    setAllRead(true);
    const result = await markAllNotificationsReadAction({});
    if (result.ok) router.refresh();
  };

  const markOne = (n: NotificationDto): void => {
    if (isUnread(n)) {
      setReadHere((prev) => new Set(prev).add(n.id));
      void markNotificationReadAction({ id: n.id });
    }
    onClose();
  };

  return (
    <div className="pop-wrap">
      <button
        type="button"
        className="ibtn"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={onToggle}
      >
        <Icon d={BELL} />
        {unreadCount ? <span className="ping" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <>
          <div className="dd-scrim" onClick={onClose} aria-hidden="true" />
          <div className="pop" role="dialog" aria-label="Notifications">
            <div className="pop-h">
              <h2 className="pop-t">Notifications</h2>
              {unreadCount ? (
                <button type="button" className="btn btn-t" onClick={markAll}>
                  Mark all read
                </button>
              ) : null}
            </div>
            {notifications.items.length === 0 ? <div className="empty">No notifications yet.</div> : null}
            {notifications.items.map((n) => {
              const body = (
                <>
                  <span className="li-ic">
                    <Icon name={notificationIcon(n.kind)} />
                  </span>
                  <span className="li-t">
                    <span className="li-n" style={{ whiteSpace: "normal" }}>
                      {n.title}
                    </span>
                    <span className="li-s">{notificationWhen(n.createdAt, today)}</span>
                  </span>
                  {isUnread(n) ? <span className="unread" role="img" aria-label="Unread" /> : null}
                </>
              );
              return isAppLink(n.link) ? (
                <Link key={n.id} href={n.link} className="li" style={{ alignItems: "flex-start" }} onClick={() => markOne(n)}>
                  {body}
                </Link>
              ) : (
                <div key={n.id} className="li" style={{ alignItems: "flex-start" }}>
                  {body}
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Prepare the shell change (Contract change request 5)**

Nothing is edited in the shared files. The exact change is printed in the section "Contract change requests", item 5, and is copied into the task's progress-log `done` line as a pointer so the orchestrator finds it. Append, with one `printf`, a `note` line to the progress log: `M4.4 | note | R | notifications-popover ready, shell.tsx and layouts need Contract change request 5`.

- [ ] **Step 5: Gate A and the manual check**

Run the Gate A block. Expected: all green; changed paths are the Files block.

Manual check, done on `feat/portal-build` after the orchestrator applies Contract change request 5 (seed-dev data has no notifications, so create some first):
- As Aditi Rao, post a message on a deal (Deal detail), then as Farhan (a second browser profile) reply from the approvals drawer and accept a pending Kestrel registration. Back as Aditi, the bell shows a ping and its label reads "Notifications, 2 unread".
- Open the bell: "Farhan Qureshi wrote about Vardhan Capital" and "<customer> was accepted" appear newest first with the right icons and "Today"; each has the unread dot. "Mark all read" clears the dot and the ping; reload keeps them read.
- Click a notification: the page opens on the deal, the dot is gone and the popover closes. Open the bell again: the data is fresh (a notification created in the meantime appears without a full reload).
- With a user that has none, the popover reads "No notifications yet."
- Sign in as Farhan: his bell shows "<partner> asked for more time on <customer>" after Aditi requests an extension, linking to `/admin/approvals`.
- Help (the question mark) in the partner portal: the "Message your partner manager" entry names the real manager and team of the signed in company (for Kestrel, "Farhan Qureshi, CleanStart India"), and the profile menu reads "Message Farhan Qureshi". Sign in as a user of a company managed by Omar to see the other name.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/lib/notification-view.ts apps/portal/src/lib/notification-view.test.ts \
  apps/portal/src/components/shell/notifications-popover.tsx \
  docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
git commit -m "feat(portal): M4.4 notifications popover and helpers"
```

---
## Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Accept | Contracts E lists `not_rejected`, `not_accepted`, `not_decided`. |
| 2 | Accept | Added to contracts C.3 (`rls.sql`); plan 01 copies it mechanically. |
| 3 | Accept | Contracts H.20 gives the input shape; built in plan 03 M1.5. |
| 4 | Modify | Notifications and email are R's `announceRegistrationChange`, created as a no-op stub in W0-c so H4.8 compiles in any order; M2.3 replaces the body. The snippet is in the HubSpot plan 4.8 (adjusted: it uses `change.changed` and does not announce the echo of the portal's own expiry). The extension hazard is solved in 4.8 (portal end date wins while a `registration.update_end` is pending or failed, and a granted extension is never moved backwards) with seven new poll tests. M2.4's black box test now passes a clock. |
| 5 | Accept | Applied by W2-a Step 0 (plan 06 M5.4), before CCR-3 of plan 06; contracts K.1 and K.3. |
| 6 | Accept | Contracts H.7 (`conflictInputs`), H.20, H.17 (`sendExpiryReminders`), K.2; usage note kept. |

Each item below is something this plan needs that the contracts do not define, or a shared file R may not edit. R does not redefine, copy or code against a changed version of any of them; where a task depends on one, the task says so and stops with a `blocked` line when it is missing.

### 1. New `ConflictError` reasons (contracts section E)

Add to the list of reasons in use: `not_rejected` (resubmit on a registration that is not rejected), `not_accepted` (request or grant an extension on a registration that is not accepted), `not_decided` (undo on a registration that is not freshly accepted or rejected). Used by `repo/registrations.ts` in M2.1, M2.2 and M2.4. The existing reasons `duplicate_registration`, `already_decided`, `undo_window_closed`, `deal_in_crm`, `extension_already_used` and `extension_not_requested` are used as defined.

### 2. RLS: staff may delete the automatic decision lines (contracts C.3, `src/db/rls.sql`)

The `registration_events` and `registration_messages` DELETE policy is `app_is_system()` (the partner scoped loop). An undo (M2.2, `undoDecision`, contracts H.7: "deletes the auto event and auto thread line") runs as a staff viewer, so the delete silently affects zero rows. `DELETE` is already granted to `portal_app` on both tables. Add after the partner scoped `DO` block, in `rls.sql`:

```sql
DROP POLICY IF EXISTS registration_events_delete ON registration_events;
CREATE POLICY registration_events_delete ON registration_events FOR DELETE USING (app_is_staff());
DROP POLICY IF EXISTS registration_messages_delete ON registration_messages;
CREATE POLICY registration_messages_delete ON registration_messages FOR DELETE USING (app_is_staff());
```

A partner viewer still cannot delete either table. Until this is applied the M2.2 undo tests fail; `undoDecision` raises an explicit error when no automatic line was deleted, so a missing policy is loud, never silent.

### 3. `sendManagerMessageAction` input (contracts H.20, P, `actions/partners.ts`)

The contracts name the action but not its input. R's `ManagerMessageDrawer.tsx` (M2.1, used by Deals and Deal detail) calls `sendManagerMessageAction({ subject, body })` and reads `result.ok` and `result.error.message`. Requested shape: `{ subject: string (1 to 200 characters), body: string (1 to 4000 characters) }` returning `ActionResult<null>`, sent to the signed in partner user's manager through `buildManagerMessage`, permission `manager.message`. If P defines a different shape, only the one call in `ManagerMessageDrawer.tsx` changes.

### 4. H4.8: tell partners about stage changes, end date changes and expiry (HubSpot plan 4.8, `hubspot/poll.ts`, `jobs/expiry.ts`)

M2.3 delivers `announceRegistrationChange` (`src/server/registrations/announce.ts`, exact signature in M2.3 step 2). The poll and the expiry job have no after-commit hook, so each calls it once, after the transaction that wrote the change, wrapped so a failure only logs. In `pollDeals`, directly after the `await db.transaction(...)` that applies `change`:

```ts
const stageChanged = change.stageId !== reg.hubspotStageId;
const announce = change.status === 'expired'
  ? { registrationId: reg.id, kind: 'expired' as const }
  : stageChanged
    ? { registrationId: reg.id, kind: 'stage_changed' as const, stage: change.stage }
    : change.protectionEnd
      ? { registrationId: reg.id, kind: 'protection_end_changed' as const, protectionEnd: change.protectionEnd }
      : null;
if (announce) await announceRegistrationChange({ db }, announce).catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
```

and in `expireRegistrations`, after each registration's transaction: `await announceRegistrationChange({ db }, { registrationId: reg.id, kind: 'expired' }).catch((error: unknown) => log.warn({ err: error }, 'announce failed'));`. Without this change nothing breaks: partners simply get no notification for HubSpot driven changes.

Same task, a hazard found while writing M2.4: after an extension is granted the portal row holds the new `protection_end` and a `registration.update_end` outbox row is pending until the drain runs (up to a minute). A poll that sees the same deal modified for another reason (a stage move) in that window reads the old `protection_end_date`, and `decideInbound` writes it back over the extension; the `update_end` handler then sends the old date. Requested rule in `pollDeals`: when a `hubspot_outbox` row with `op = 'registration.update_end'`, `subject_id = <registration id>` and `status = 'pending'` exists, ignore the incoming `protection_end_date` for that registration in that pass (apply the stage only).

### 5. Shell and layouts: real notifications (shared files `shell.tsx`, `partner/layout.tsx`, `admin/layout.tsx`, applied by the orchestrator in W2-a)

The popover is `src/components/shell/notifications-popover.tsx` (M4.4). The change below is against the mock regions of `shell.tsx` that W0-f leaves alone (W0-f replaces the persona, the navigation and the approvals count). If W0-f changed the `Shell` signature, add the two new props to it.

In `shell.tsx`, imports. Delete `import { createSlice } from "@/lib/slice";` (only `notesRead` used it) and add:

```tsx
import type { NotificationsDto } from "@/lib/dto";
import { NotificationsPopover } from "./notifications-popover";
```

Delete the `Note` interface, the `partnerNotes` and `adminNotes` functions and the `notesRead` slice. Before:

```tsx
interface Note {
  title: string;
  when: string;
  href: string;
  icon: IconName;
  unread: boolean;
}
```
and
```tsx
const partnerNotes = (): [string, string, string, IconName, boolean][] => [
  ["Rohit Desai asked for a login", "Today", ROUTES.partner.team, "team", true],
  ["Gulfway Freight is waiting for review", "3 days ago", ROUTES.partner.deals, "clk", true],
  ["New document: CleanSight product walkthrough", "4 Nov", ROUTES.partner.documents, "play", true],
  ["Vardhan Capital moved to Proposal sent", "28 Oct", ROUTES.partner.deal("vardhan-capital"), "deals", false],
];
const adminNotes = (): [string, string, string, IconName, boolean][] => [
  ["Arbor Cyber registered Gulfway Freight, a conflict", "1 day ago", ROUTES.admin.approvals, "warn", true],
  ["Lattice Cloud Services applied to be a partner", "1 day ago", ROUTES.admin.partners, "bld", true],
  ["5 protected deals end in the next 14 days", "6 Nov", ROUTES.admin.reports, "hg", false],
];

const notesRead = createSlice<{ partner: boolean; admin: boolean }>("notes-read", {
  partner: false,
  admin: false,
});
```
After: nothing.

The `Shell` signature. Before:

```tsx
export function Shell({
  kind,
  children,
}: {
  kind: PortalKind;
  children: React.ReactNode;
}): React.JSX.Element {
```
After:
```tsx
export function Shell({
  kind,
  notifications,
  today,
  children,
}: {
  kind: PortalKind;
  notifications: NotificationsDto;
  today: string;
  children: React.ReactNode;
}): React.JSX.Element {
```

Delete the read state. Before: `  const read = notesRead.use()[kind];` After: nothing.

Delete the derived notes. Before:

```tsx
  const notes: Note[] = (kind === "partner" ? partnerNotes() : adminNotes()).map(
    ([title, when, href, icon, unread]) => ({ title, when, href, icon, unread: unread && !read }),
  );
  const unreadCount = notes.filter((n) => n.unread).length;
  const crumb = crumbFor(nav, pathname);
```
After:
```tsx
  const crumb = crumbFor(nav, pathname);
```

Replace the bell. Before (the second `pop-wrap` block of the top bar, after the help block):

```tsx
              <div className="pop-wrap">
                <button
                  type="button"
                  className="ibtn"
                  aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
                  aria-haspopup="dialog"
                  aria-expanded={pop === "notes"}
                  onClick={() => setPop(pop === "notes" ? null : "notes")}
                >
                  <Icon d={BELL} />
                  {unreadCount ? <span className="ping" aria-hidden="true" /> : null}
                </button>
                {pop === "notes" ? (
                  <>
                    <div className="dd-scrim" onClick={() => setPop(null)} aria-hidden="true" />
                    <div className="pop" role="dialog" aria-label="Notifications">
                      <div className="pop-h">
                        <h2 className="pop-t">Notifications</h2>
                        {unreadCount ? (
                          <button
                            type="button"
                            className="btn btn-t"
                            onClick={() => notesRead.set((s) => ({ ...s, [kind]: true }))}
                          >
                            Mark all read
                          </button>
                        ) : null}
                      </div>
                      {notes.map((n) => (
                        <Link key={n.title} href={n.href} className="li" style={{ alignItems: "flex-start" }}>
                          <span className="li-ic">
                            <Icon name={n.icon} />
                          </span>
                          <span className="li-t">
                            <span className="li-n" style={{ whiteSpace: "normal" }}>
                              {n.title}
                            </span>
                            <span className="li-s">{n.when}</span>
                          </span>
                          {n.unread ? <span className="unread" role="img" aria-label="Unread" /> : null}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
```
After:
```tsx
              <NotificationsPopover
                notifications={notifications}
                today={today}
                open={pop === "notes"}
                onToggle={() => setPop(pop === "notes" ? null : "notes")}
                onClose={() => setPop(null)}
              />
```

Delete the now unused `BELL` constant at the bottom of the file (the popover owns its own copy). Before:

```tsx
const BELL =
  "M220.07,176.94C214.41,167.2,206,139.73,206,104a78,78,0,1,0-156,0c0,35.74-8.42,63.2-14.08,72.94A14,14,0,0,0,48,198H90.48a38,38,0,0,0,75,0H208a14,14,0,0,0,12.06-21.06ZM128,218a26,26,0,0,1-25.29-20h50.58A26,26,0,0,1,128,218Zm81.71-33a1.9,1.9,0,0,1-1.7,1H48a1.9,1.9,0,0,1-1.7-1,2,2,0,0,1,0-2C53.87,170,62,139.69,62,104a66,66,0,1,1,132,0c0,35.68,8.14,65.95,15.71,79A2,2,0,0,1,209.71,185Z";
```
After: nothing.

The help popover: no code change beyond W0-f's persona removal. After that change its "Message your partner manager" entry and the profile menu entry read `ShellDto.manager` (`name`, `team`). M4.4's manual check verifies both.

In `src/app/partner/layout.tsx` and `src/app/admin/layout.tsx` (owned by W0-f), load the list in the layout's existing `withViewer` call and pass it down. Add the import lines `import { systemClock } from "@/lib/clock";` and `import { listNotifications } from "@/server/repo/notifications";`; add to the data loaded inside the layout's `withViewer(viewer, async (tx) => ({ ... }))` object the entry `notifications: await listNotifications(tx, viewer, { limit: 10 }),`; and change the element `<Shell kind="partner">` (admin: `kind="admin"`) to `<Shell kind="partner" notifications={data.notifications} today={systemClock.today()}>`, where `data` is the name the layout gives that object.

### 6. Additive contract entries and usage notes

- Section H.7 gains `conflictInputs(tx, viewer, { registrationIds }): Promise<ConflictHintInput[]>` in `repo/registrations.ts` (staff only; waiting registrations in scope with `customerName`, `customerDomain`, `partnerHubspotCompanyId`), and the exported interface `ConflictHintInput`. It feeds the HubSpot conflict hint and is registered in the isolation block.
- Section H.20 gains `hubspotConflictHintsAction` in `actions/decisions.ts` (read only, `registration.read_queue`, rate limited 6 per 60 seconds per user). The route map already says the approvals screen reaches `conflictingDeals` "through R's action".
- Section H.17: `jobs/expiry-reminders.ts` additionally exports `sendExpiryReminders({ clock, transport? })`, the testable body; `runExpiryReminders` calls it with `systemClock`.
- Section K.2 gains the R files that no map lists: `src/server/registrations/{scope,mappers,recipients,pg-errors,hubspot-read,customer-lookup,conflict-hints,staff-alert,announce}.ts` and their tests, `src/lib/customer.ts`, `src/lib/notification-view.ts`, `src/components/deals/{types,overview}.ts`, plus the test files named in each task.
- Usage note for `getShell` (P, M1.1): `countWaiting` throws `ForbiddenError` for a partner viewer and returns 0 for staff marketing, so `getShell` must call it for staff viewers only.
- The email templates `buildDealAccepted`, `buildDealRejected`, `buildDealSubmittedStaffAlert`, `buildDealMessage`, `buildDealStageChanged`, `buildExtensionRequested`, `buildExtensionDecision` and `buildProtectionExpiryReminder` are built by W0-g (contracts H.15, K.2). R writes no template; R's "email builders" are the calls to them in its actions, its job and `announce.ts`, with the recipients and the preference gate decided as contracts F.5 says.

## Known unknowns

*Consolidated, de-duplicated and ordered by first verifying task in contracts M.5 (integration review, 13 November 2026); this list stays as the local detail.*

Each is checked by the step named; a failed check is recorded in the progress log and fixed with the stated fallback.

1. **Drizzle: `select({ ...getTableColumns(t), x: other.col })` with joins, `.limit(1).for('update')` and the wrapped error shape.** M2.1 step 1 runs a scratch test. Verified while writing this plan against `drizzle-orm@0.44.7` typings: `for()` is available after `limit()` and `DrizzleQueryError` carries the driver error as `cause`. Fallback: `isUniqueViolation` already reads both shapes; if `getTableColumns` selection fails, list the `registrations` columns explicitly in `selectRows`.
2. **`notExists(tx.select(...).from(registrationReminders).where(... eq(registrationReminders.registrationId, registrations.id) ...))` as a correlated subquery** (M2.4 step 2). Fallback: a raw `sql` condition `not exists (select 1 from registration_reminders r where r.registration_id = registrations.id and r.days_before = ${daysBefore} and r.protection_end = ${end})`.
3. **Drizzle `min`/`max` on `timestamptz` columns return `Date`** (M2.6 step 8). `toDate` in `reports.ts` accepts a `Date` or a string, so either result works.
4. **`hubspotForRequest()` returns null when HubSpot is not configured and may throw when the token is invalid** (contracts H.13c, M.2 item 17). `readOnlyHubspot` maps null to "no suggestions" and catches any error, so a different failure mode is still safe.
5. **HubSpot plan signatures used as written:** `lookupCustomer(hs, query)` and `conflictingDeals(hs, { customerCompanyId, partnerCompanyId, pipelineId })` (task 4.7), `expireRegistrations({ db, clock })` (task 4.8, used by one black box test in M2.4), `FakeHubspot.createDeal`, `associateDealWithCompany` and the deal properties `partner_company_id` and `partner_name` (task 4.3 `dealProperties`). A signature that differs is a `blocked` line for the step that uses it.
6. **Test helper behaviour assumed from contracts J.3:** `makeRegistration` inserts no events or messages and leaves `decided_by` and `decided_at` empty (tests set them with `db.update`); `makeUser` takes `email`, `name`, `status` and `role`; `makeInvite` and `makeAccessRequest` take `createdAt`; `makeDocument` takes `updatedAt`; `asStaff(db, role, region)` returns a viewer with `email`. A helper that behaves differently is fixed in the test, not in the helper (W0 owns it).
7. **`listNewDocuments` semantics (D, H.11):** documents added or replaced in the last 30 days relative to the passed clock, filtered by the viewer's audience. The overview test creates one document inside and one outside that window.
8. **Email builder wording.** Tests assert that an email contains the customer name or the reason, never the exact date format a template prints.
9. **`seedMockData` figures (J.5):** the reports seed test asserts the numbers contracts J.5 states (21 partners, 15 registrations, Kestrel 10, 2, 7, 1, 2, 3). If the fixture differs, the test is wrong, not the report.
10. **Undo and the outbox race.** `undoDecision` refuses when `hubspot_deal_id` is set, but the drain stores that id only after `createDeal` returns, so a decision undone in the few milliseconds between HubSpot creating the deal and the id being stored would leave a HubSpot deal for a pending registration. The window is the length of one HubSpot call; the handler's `status = 'accepted'` precondition makes every later retry a no op. Accepted as a documented limit.
11. **Decision emails go out at once, inside the undo window.** A decision undone within 10 minutes leaves the partner's notification and email behind. The partner's deal page shows the true status. Delaying emails by the undo window would need an email outbox, which contracts M.3 item 15 rules out for v1.
12. **A sales user's duplicate of a colleague's registration** is caught only by the server (`duplicate_registration`, shown in the form's amber note), because the Register form's local hint reads the viewer's own deals. The company wide customer suggestions (`customerSuggestions`) do list the colleague's customer.
13. **A missed reminder day.** The reminder job matches exactly 14 and exactly 3 days (contracts H.7). If the process is down at 05:00 UTC on that day, that day's reminder is not sent later.
14. **Date handling is UTC** (contracts B.3). A registration submitted between 00:00 and 05:30 IST carries the previous Indian calendar day, and "Today" on a screen is the UTC date.

## Self-review

**Master plan coverage.** Every master task of this area maps to one plan task.

| Master task | Plan task | What implements it |
|---|---|---|
| 2.1 Registrations repo and the register form (multi product form, one registration per product, status `pending`, routing, customer lookup own first then HubSpot, name and website only) | M2.1 | `repo/registrations.ts` (`createRegistrations`, `customerSuggestions`, `listRegistrations`, `getRegistration`, `lockRegistration`, `resubmitRegistration`), `actions/registrations.ts` (`registerDealsAction`, `resubmitRegistrationAction`, `lookupCustomerAction`), `RegisterDeal.tsx`, `Deals.tsx`, the two drawers |
| 2.2 Approvals (accept sets `protection_end`, enqueues `registration.create`; reject needs a reason, partner can resubmit; undo; 2 business day overdue; conflict hint from portal data and HubSpot) | M2.2 | `acceptRegistration`, `rejectRegistration`, `undoDecision`, `listApprovalQueue`, `conflictChecks`, `conflictInputs`, `actions/decisions.ts`, `conflict-hints.ts`, `AdminApprovals.tsx`, `derive.ts` (`describeCheck`, `isOverTarget`) |
| 2.3 Conversation thread and notifications (in-app plus email by preference on every change and message) | M2.3 | `repo/messages.ts`, `repo/notifications.ts`, `postMessageAction`, `announce.ts`, the deal emails sent in M2.1, M2.2, M2.3 and M2.4 through `resolveEmailRecipients`, `DealDetail.tsx` |
| 2.4 Extension and expiry (request with a note, staff grant or decline, grant adds days and enqueues `registration.update_end`, nightly expiry, reminders at 14 and 3 days) | M2.4 | `requestExtension`, `decideExtension`, `actions/extension.ts`, `listReminderCandidates`, `markReminderSent`, `jobs/expiry-reminders.ts`; the nightly expiry itself is H4.8's `expireRegistrations` (contracts M inconsistency 6), pinned by a black box test |
| 2.5 HubSpot integration | not planned here | The H track. R calls `enqueue` with the versions in contracts G and uses `HubspotApi`, `FakeHubspot`, `createHubspot`, `lookupCustomer` and `conflictingDeals` as defined |
| 2.6 Overview and reports from SQL aggregates, mock numbers as fixtures | M2.6 | `repo/overview.ts`, `repo/reports.ts`, `report-view.ts`, `PartnerOverview.tsx`, `AdminReports.tsx`; the mock figures are asserted against `seedMockData` |
| 4.4 Notifications and help popovers read real data | M4.4 | `notifications-popover.tsx`, `notification-view.ts`, M2.3's repo and actions, and Contract change request 5 for the shared `shell.tsx` |

**Concrete rules from the brief.** One registration per product: unique index plus a pre check, tested in M2.1. Acceptance sets `protection_end` per the contracts: `protectionEndFor(clock.today())`, tested as 3 Feb 2027 for 6 Nov 2026 in M2.2. Reject needs a reason and the partner can resubmit: M2.2 and M2.1. Undo only per the contracts' decision: the deciding person, 10 minutes, no HubSpot deal, M2.2. Conflict hint: portal data plus `conflictingDeals`, staff only, never blocking, M2.2. Extension rules: M2.4. Reminders idempotent through `registration_reminders`: M2.4 tests a second run and a changed end date. No HubSpot call inside a request except the read only lookup and conflict hint: the only HubSpot imports in actions are `readOnlyHubspot` (customer lookup, hints) and `enqueue` (a database write). No edits to shared files: every shared change is in Contract change requests 1 to 6.

**Placeholder scan.** Run on the finished file; both commands must print nothing (the second matches the UTF-8 bytes of an em-dash and an en-dash, and the first spells its words with brackets so the pattern does not match itself):

```bash
grep -nE 'T[B]D|TOD[O]|FIXM[E]|implement late[r]|similar to Tas[k]|add appropriat[e]|write tests for the abov[e]' docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
grep -nE $'\xe2\x80\x94|\xe2\x80\x93' docs/superpowers/plans/2026-11-12-partner-portal-04-registrations.md
```

**Name consistency with the contracts.** Repo function names, parameter order, DTOs and error reasons are the contracts' (H.7 to H.10, E). The R specific additions are `conflictInputs` and `ConflictHintInput`, `hubspotConflictHintsAction` and `sendExpiryReminders`, and the three new `ConflictError` reasons, each listed in Contract change requests 1 and 6. Action file and export names are H.20's (`registerDealsAction`, `resubmitRegistrationAction`, `lookupCustomerAction`, `postMessageAction`, `acceptRegistrationAction`, `rejectRegistrationAction`, `undoDecisionAction`, `requestExtensionAction`, `decideExtensionAction`, `markAllNotificationsReadAction`, `markNotificationReadAction`). Outbox ops and versions are G's: `registration.create` with `String(Date.parse(decidedAt))`, `registration.update_end` with the new `YYYY-MM-DD` end. Audit events are the closed list in F.4 (`registration.submitted`, `.resubmitted`, `.accepted`, `.rejected`, `.decision_undone`, `.extension_requested`, `.extension_granted`, `.extension_declined`). Deal rules come only from `deal-rules.ts` (`protectionEndFor`, `acceptedOnFor`, `isOverSla`, `waitingBusinessDays`, `extendedEnd`, `EXTENSION_DAYS`, `EXPIRY_REMINDER_DAYS`, `EXPIRING_SOON_DAYS`, `UNDO_WINDOW_MINUTES`, `RECENT_DECISION_DAYS`, `REVIEW_SLA_BUSINESS_DAYS`).
