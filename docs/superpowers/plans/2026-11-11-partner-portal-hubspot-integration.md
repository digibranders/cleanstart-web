# Partner Portal: HubSpot Integration Implementation Plan

## Reconciliation with the shared contracts (2026-11-12)

This plan now follows `2026-11-12-partner-portal-00-contracts.md` (the contracts). The HubSpot internals (API shapes, mappers, outbox semantics, the stage mapping) are unchanged; everything shared (schema, errors, conventions, outbox signature, job infrastructure, environment, test helpers, file ownership) is as the contracts say. Task headings keep their 4.n numbers; in logs, commits and briefs the ids are H4.1 to H4.10 (BUILD-HANDOFF). What changed:

1. `hubspot/types.ts` re-exports `DependencyPending` from `@/server/errors` and the `RegistrationStatus` type from `@/lib/domain` instead of defining them (contracts M.2 item 1). `HubspotError` stays a plain `Error` subclass, so the outbox still treats every error as retryable.
2. Product and region are stored as codes (`libraries`, `middle_east`). `dealProperties` still takes display labels; the `registration.create` handler maps codes with `PRODUCT_LABEL` and `PARTNER_REGION_LABEL`, and a new handler test pins the HubSpot values (`clean_libraries`, `cleanstart_images`, `india`, `middle_east`) (M.2 item 2).
3. The inbound poll writes its audit entry with `recordAudit(tx, SYSTEM_ACTORS.hubspot, ...)` using the closed events `registration.stage_changed` and `registration.protection_end_changed`; it no longer inserts into `audit_log`, which has a NOT NULL `event` column (M.2 item 3, F.4). `decideInbound` returns a `changed` field so the poll can pick the event.
4. The nightly expiry also writes one `registration.expired` audit entry per registration through `recordAudit(tx, SYSTEM_ACTORS.portal, ...)` (F.4: every state change writes exactly one).
5. `enqueue` is declared exactly as contracts G (`tx: Pick<Db | Tx, 'insert'>`) and `outbox.ts` re-exports `OutboxOp` from `@/lib/domain` instead of defining it (M.2 item 5). New tests pin the key shape, the decision-time version for `registration.create` (M.2 item 4) and a call inside `withViewer`.
6. Job infrastructure is Wave 0 (W0-c): `jobs/{lock,schedule,index}.ts`, `lock.test.ts`, `src/instrumentation.ts`, a stub per job module and the `node-cron` dependency. H4.4 fills only the body of `jobs/hubspot-outbox.ts`; H4.8 fills only `hubspot-poll.ts`, `expiry.ts` and `reconcile.ts`. No task edits `jobs/index.ts` (M.2 item 6, H.17).
7. Tests use truncate per test and one database per Vitest worker: `testDb()`, `resetDb(db)` in `beforeEach`, `asPartner`, `asStaff`, `makePartner`, `makeUser`, `makeRegistration`, `makeSyncedDeal` from `@/db/test-helpers` (contracts J.1 and J.3). No test relies on a wrapping rolled back transaction. A concurrency test shows two overlapping drains handle each row once.
8. `HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_PARTNER_PIPELINE_ID` and `HUBSPOT_WEBHOOK_SECRET` are optional outside production (contracts I). `createHubspot()` throws `IntegrationError('hubspot', 'HUBSPOT_PORTAL_TOKEN is not set')`; new `readHubspotConfig()` returns `null` when the token or pipeline id is unset; the outbox, poll and reconcile jobs log a warning and return; the webhook route answers 503 when the secret is unset (M.2 item 17). Expiry still expires and enqueues (see Contract change requests).
9. No shared file is edited any more: `src/env.ts` (W0-b already has `HUBSPOT_USE_ASSOCIATION_LABELS`), `src/db/schema.ts`, `src/db/client.ts` (it already exports `db`, `pool`, `Db`), `src/db/test-helpers.ts` (it already exports `testPool`), `package.json` and `pnpm-lock.yaml` (W0-a installs `@hubspot/api-client`, `node-cron`, `@sentry/nextjs`; the `@cleanstart/forms` workspace dependency is added there too and nothing in this plan imports it), `jobs/index.ts`, `instrumentation.ts` (M.2 item 18).
10. No action file and no `AdminApprovals.tsx` is edited (M.2 item 19). The "wire it" steps of 4.5, 4.6 and 4.7 now say what the owning track writes: P adds the `partner.upsert` and `user.upsert` enqueue calls, R adds `registration.create` (version `String(Date.parse(decidedAt))`, not `'1'`), `registration.update_end`, `lookupCustomerAction` (10 per 60 seconds per user through `rateLimit`) and the conflict hint, calling H's `lookupCustomer` and `conflictingDeals` with a portal-only fallback when HubSpot errors or is unconfigured.
11. 4.10 does not edit `AdminAudit.tsx`: track A builds `IntegrationHealthCard.tsx` from H's `integrationHealth(db: Pick<Db | Tx, 'select'>)`, which returns the contracts `IntegrationHealthDto`. 4.10 adds `retryFailedOutbox(tx, viewer)` (contracts H.13b) and the `isolation` export every repo module needs (F.6; `integrationHealth` is `rls-only`, `retryFailedOutbox` is `staff-only`).
12. Time comes from a `Clock` (contracts B.3, handoff amendment 6): `drainOutbox`, `pollDeals`, `expireRegistrations` and `buildHandlers` take `clock: Clock` instead of `now` and `today` functions; jobs pass `systemClock`; tests pass `fixedClock(...)`.
13. The poll writes the `deals_cursor` row after every successful run, not only when the cursor moves, so `hubspot_sync_state.updated_at` is the last poll time that `IntegrationHealthDto.lastPollAt` reports.
14. `registration.expire` now returns without error when the registration has no HubSpot deal and is already expired (the deal was never created, so there is nothing to move); before, it waited on `DependencyPending` forever.
15. `mappers.ts` imports `fmtLong` from `@/lib/dates` instead of keeping a second copy.
16. The production runbook is written to `docs/partner-portal/HUBSPOT-PROVISIONING.md`, because `docs/operations/PARTNER-PORTAL.md` is W2-f's file. `scripts/import-partners.ts`, which contracts K.2 gives to this track and which 4.10 only mentioned, now has code and a test.
17. The webhook route reports a failed background poll to Sentry instead of leaving an unhandled rejection.
18. `FakeHubspot.stageIds` and `FakeHubspot.createDeal` are frozen names: W0-b's `makeSyncedDeal` uses them.
19. Commit messages carry the `H4.n` id, and the closing gate is BUILD-HANDOFF Gate A (including the build lock and the dash check).
20. The outbox tests use a fixed clock in 2099: rows are due from the database's `now()`, so the earlier fixed date (6 November 2026) would have made every new row "not due yet" once the real date passed it.
21. A final section, "Contract change requests", records what this plan needs changed in the contracts, with the integration review's decision on each (2026-11-13).
22. Integration review additions. (a) `hubspotForRequest()` is exported from `lookup.ts` (task 4.7, contracts H.13c) for track R's read only calls. (b) After a change commits, `pollDeals` and `expireRegistrations` call `announceRegistrationChange` (track R's `src/server/registrations/announce.ts`, created as a no-op stub by W0-c so this plan compiles in any track order); a failure only logs. The portal's own expiry echo is not announced twice. (c) The poll never moves a granted extension's end date backwards and ignores HubSpot's end date while a `registration.update_end` write is pending or failed; tests pin both. (d) The database pools are request 6 and system 8 (contracts C.2), which is the size this plan asked for.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is Task 2.5 of `2026-11-11-partner-portal-master-plan.md`. It assumes Wave 0 of `docs/partner-portal/BUILD-HANDOFF.md` is done (W0-a to W0-g: dependencies, database and test helpers, environment, tenant isolation layer, job infrastructure) and the `portal-w0` tag exists. Each task ends like every handoff task: Gate A, then Gate B, then a commit staged by path with the plan steps ticked.

**Goal:** Partners, their users, customers and approved deal registrations are created in HubSpot from the portal, and every change HubSpot sales makes to a deal comes back to the partner's dashboard within 5 minutes.

**Architecture:** The portal never calls HubSpot inside a user request. Server actions write to Postgres and add a row to `hubspot_outbox` in the same transaction. A scheduled job inside the portal process drains the outbox with retries and backoff through a small `HubspotApi` interface (real client, plus an in-memory fake for tests). A HubSpot webhook triggers an immediate poll of deals modified since a cursor in the partner pipeline, and a scheduled poll every 5 minutes does the same as the safety net; both apply stage changes through one code path. HubSpot owns the deal after approval; the portal owns the pending registration and the 90 day expiry.

**Tech Stack:** `@hubspot/api-client` (`^13.5.0`, already used by the CMS), Drizzle, Zod, Vitest, node-cron with Postgres advisory locks (the portal runs on the droplet, master plan D5).

**Does not touch:** the CMS deal-registration pipeline (`apps/cms/src/payload/lib/deal-registrations/`), the public `/deal-registration` form, the 6 deals already in the default Sales Pipeline, or the lead relay (`LeadHandler`). The portal creates companies, contacts and deals only, never leads.

---

## 1. Contract: what lives where

| Portal record | HubSpot object | Direction | Trigger |
|---|---|---|---|
| Partner company | Company with `cleanstart_partner = true`, `partner_category`, `partner_portal_id` | Portal to HubSpot | Application approved, or partner edited |
| Partner user | Contact associated with the partner company | Portal to HubSpot | Invite accepted |
| Customer account | Company (found by domain, then name, created if new, never marked as partner) | Portal to HubSpot | Registration approved |
| Customer contacts | Contacts associated with the deal | Portal to HubSpot | Registration approved |
| Approved registration | Deal in the **Partner deals** pipeline, `portal_registration_id` unique | Portal to HubSpot | Registration approved |
| Deal stage after approval | `dealstage` | HubSpot to portal | Poll every 5 minutes |
| Protection end date | `protection_end_date` | Portal to HubSpot | Accept, extension granted |
| Expired registration | Stage **Registration expired** | Portal to HubSpot | Nightly expiry job |
| Pending or rejected registration | Nothing | none | Stays in the portal only |

The exact outbox operations, who enqueues each and the `version` each caller passes are in contracts section G; this plan implements the handlers and the drain.

## 2. Stage and status mapping

| HubSpot stage (label) | Probability | Portal status | Notes |
|---|---|---|---|
| Accepted | 0.1 | accepted | Created here on approval |
| Discovery | 0.2 | accepted | |
| Technical evaluation | 0.4 | accepted | |
| Proposal sent | 0.6 | accepted | |
| Closed won | 1.0 | won | HubSpot treats probability 1.0 as closed won |
| Closed lost | 0.0 | lost | |
| Registration expired | 0.0 | expired | Written by the portal only |

Labels are fixed in code; stage ids are read from the pipeline at runtime (cached 10 minutes) so nobody pastes ids into env vars. Only `HUBSPOT_PARTNER_PIPELINE_ID` is configured (required in production, optional elsewhere).

## 3. HubSpot account setup and scopes

- **Development:** a HubSpot sandbox if our paid plan includes one, otherwise a free developer test account (master plan D7; Task 0.1 checks the tier). Run the old `setup-hubspot-deal-properties.ts` there too, because the new code reuses `partner_name`, `partner_rep_name`, `partner_rep_email` and `deal_details`.
- **Private app for the portal** (separate from the CMS token, so a leak of one does not expose the other). Scopes: `crm.objects.companies.read`, `crm.objects.companies.write`, `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.deals.read`, `crm.objects.deals.write`, `crm.schemas.companies.write`, `crm.schemas.deals.write`, `crm.schemas.companies.read`, `crm.schemas.deals.read`. Token in `HUBSPOT_PORTAL_TOKEN` (required in production, optional elsewhere: without it the jobs skip with a warning and the webhook answers 503).
- **Rate limit:** private apps allow roughly 100 to 190 requests per 10 seconds depending on plan (confirmed in master Task 0.1). Drain batches are capped at 20 operations and the SDK retries 429s three times.

## 4. Tasks

File map for this plan:

```
apps/portal/scripts/provision-hubspot.ts          schema and pipeline setup (task 4.1)
apps/portal/scripts/hubspot-smoke.ts              manual end to end check (task 4.10)
apps/portal/scripts/import-partners.ts            one-off import of the current partners (task 4.10)
apps/portal/src/server/hubspot/schema-spec.ts     pure schema and pipeline spec (4.1)
apps/portal/src/server/hubspot/types.ts           shared types and the HubspotApi interface (4.2)
apps/portal/src/server/hubspot/client.ts          real client and HubSpot configuration (4.2)
apps/portal/src/server/hubspot/fake.ts            in-memory client for tests (4.2)
apps/portal/src/server/hubspot/mappers.ts         pure mapping functions (4.3)
apps/portal/src/server/hubspot/outbox.ts          enqueue, drain, backoff (4.4)
apps/portal/src/server/hubspot/handlers.ts        one handler per outbox operation (4.5, 4.6)
apps/portal/src/server/hubspot/lookup.ts          customer lookup and conflict check (4.7)
apps/portal/src/server/hubspot/poll.ts            inbound poll and reconcile (4.8)
apps/portal/src/server/hubspot/signature.ts       webhook signature check (4.9)
apps/portal/src/server/jobs/{hubspot-outbox,hubspot-poll,reconcile,expiry}.ts   job bodies only (4.4, 4.8); the files exist as stubs from W0-c
apps/portal/src/app/api/hubspot/webhook/route.ts  webhook receiver (4.9)
apps/portal/src/server/repo/integration-health.ts health data and retry (4.10)
docs/partner-portal/HUBSPOT-PROVISIONING.md       production runbook (4.10)
```

Provided by Wave 0 and never edited by this plan: `package.json`, `src/env.ts`, `src/db/{schema,client,rls.sql,test-helpers,test-setup}.ts`, `src/server/errors.ts`, `src/server/audit/*`, `src/server/auth/types.ts`, `src/server/log.ts`, `src/server/jobs/{lock,schedule,index}.ts` and `lock.test.ts`, `src/instrumentation.ts`. Not edited because other tracks own them: every file in `src/server/actions/`, `AdminApprovals.tsx`, `AdminAudit.tsx`, `docs/operations/PARTNER-PORTAL.md`.

Testing: every test here runs against the real Postgres of its Vitest worker (one database per worker, contracts J.1). Each test file calls `beforeEach(() => resetDb(db))`, which truncates every table; nothing is wrapped in a rolled back transaction, because the outbox drain opens its own transactions and `FOR UPDATE SKIP LOCKED` needs real connections. Fixtures come from `@/db/test-helpers` (J.3), time from `fixedClock` (`@/lib/clock`), and HubSpot is always the `FakeHubspot` from Task 4.2.

### Task 4.1: Provision the HubSpot schema

**Files:**
- Create: `apps/portal/scripts/provision-hubspot.ts`
- Create: `apps/portal/src/server/hubspot/schema-spec.ts`
- Test: `apps/portal/src/server/hubspot/schema-spec.test.ts`

The spec is a pure object so it can be tested; the script only applies it. The script defaults to a dry run and needs `--apply`. It must never run against production without the explicit go-ahead in master Task 5.7.

- [ ] **Step 1: Write the failing test**

```ts
// schema-spec.test.ts
import { describe, expect, it } from 'vitest';
import { PIPELINE_SPEC, COMPANY_PROPERTIES, DEAL_PROPERTIES } from './schema-spec';

describe('schema spec', () => {
  it('has the seven stages in order with closed won at probability 1 and lost types at 0', () => {
    expect(PIPELINE_SPEC.stages.map((s) => s.label)).toEqual([
      'Accepted', 'Discovery', 'Technical evaluation', 'Proposal sent',
      'Closed won', 'Closed lost', 'Registration expired',
    ]);
    const byLabel = Object.fromEntries(PIPELINE_SPEC.stages.map((s) => [s.label, s.metadata.probability]));
    expect(byLabel['Closed won']).toBe('1.0');
    expect(byLabel['Closed lost']).toBe('0.0');
    expect(byLabel['Registration expired']).toBe('0.0');
  });

  it('makes portal_registration_id unique so a retried create cannot duplicate a deal', () => {
    const prop = DEAL_PROPERTIES.find((p) => p.name === 'portal_registration_id');
    expect(prop?.hasUniqueValue).toBe(true);
  });

  it('defines the partner flag on companies', () => {
    expect(COMPANY_PROPERTIES.map((p) => p.name)).toEqual(
      expect.arrayContaining(['cleanstart_partner', 'partner_category', 'partner_portal_id', 'partner_manager']),
    );
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/schema-spec.test.ts`
Expected: FAIL, "Cannot find module './schema-spec'".

- [ ] **Step 3: Implement the spec**

```ts
// schema-spec.ts
export const GROUP = { name: 'partner_portal', label: 'Partner portal' } as const;

export interface PropertySpec {
  name: string;
  label: string;
  type: 'string' | 'date' | 'enumeration';
  fieldType: 'text' | 'textarea' | 'date' | 'select' | 'booleancheckbox';
  hasUniqueValue?: boolean;
  options?: ReadonlyArray<{ label: string; value: string }>;
}

const opt = (...labels: string[]): Array<{ label: string; value: string }> =>
  labels.map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, '_') }));

export const COMPANY_PROPERTIES: PropertySpec[] = [
  { name: 'cleanstart_partner', label: 'CleanStart partner', type: 'enumeration', fieldType: 'booleancheckbox',
    options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
  { name: 'partner_category', label: 'Partner category', type: 'enumeration', fieldType: 'select',
    options: opt('Distributor', 'Channel partner', 'System integrator') },
  { name: 'partner_portal_id', label: 'Partner portal id', type: 'string', fieldType: 'text', hasUniqueValue: true },
  { name: 'partner_manager', label: 'Partner manager', type: 'string', fieldType: 'text' },
];

export const DEAL_PROPERTIES: PropertySpec[] = [
  { name: 'portal_registration_id', label: 'Portal registration id', type: 'string', fieldType: 'text', hasUniqueValue: true },
  { name: 'protection_end_date', label: 'Protection end date', type: 'date', fieldType: 'date' },
  { name: 'partner_product', label: 'Partner product', type: 'enumeration', fieldType: 'select',
    options: opt('CleanStart Images', 'Clean Libraries', 'CleanSight') },
  { name: 'partner_region', label: 'Partner region', type: 'enumeration', fieldType: 'select',
    options: opt('India', 'Middle East') },
  { name: 'partner_company_id', label: 'Partner company id', type: 'string', fieldType: 'text' },
];

const stage = (label: string, displayOrder: number, probability: string) => ({
  label, displayOrder, metadata: { probability },
});

export const PIPELINE_SPEC = {
  label: 'Partner deals',
  displayOrder: 5,
  stages: [
    stage('Accepted', 0, '0.1'),
    stage('Discovery', 1, '0.2'),
    stage('Technical evaluation', 2, '0.4'),
    stage('Proposal sent', 3, '0.6'),
    stage('Closed won', 4, '1.0'),
    stage('Closed lost', 5, '0.0'),
    stage('Registration expired', 6, '0.0'),
  ],
} as const;
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/schema-spec.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Write the script (applies the spec, idempotent, dry run by default)**

```ts
// scripts/provision-hubspot.ts
import { Client } from '@hubspot/api-client';
import { COMPANY_PROPERTIES, DEAL_PROPERTIES, GROUP, PIPELINE_SPEC, type PropertySpec } from '../src/server/hubspot/schema-spec';

const apply = process.argv.includes('--apply');
const token = process.env.HUBSPOT_PORTAL_TOKEN;
if (!token) throw new Error('HUBSPOT_PORTAL_TOKEN is required');
const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });

const call = async (method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> =>
  client.apiRequest({ method, path, ...(body ? { body } : {}) });

const ensure = async (label: string, path: string, body: unknown): Promise<void> => {
  if (!apply) return void console.info(`[dry-run] would create ${label}`);
  const res = await call('POST', path, body);
  if (res.status === 409) return void console.info(`exists, skipped: ${label}`);
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status} ${await res.text()}`);
  console.info(`created: ${label}`);
};

const ensureProperties = async (object: 'companies' | 'deals', props: PropertySpec[]): Promise<void> => {
  await ensure(`${object} group ${GROUP.name}`, `/crm/v3/properties/${object}/groups`, { ...GROUP, displayOrder: -1 });
  for (const p of props) {
    await ensure(`${object}.${p.name}`, `/crm/v3/properties/${object}`, {
      ...p,
      groupName: GROUP.name,
      ...(p.options ? { options: p.options.map((o, i) => ({ ...o, displayOrder: i })) } : {}),
    });
  }
};

const main = async (): Promise<void> => {
  console.info(apply ? 'APPLY mode' : 'DRY RUN (pass --apply to write)');
  await ensureProperties('companies', COMPANY_PROPERTIES);
  await ensureProperties('deals', DEAL_PROPERTIES);

  const existing = (await (await call('GET', '/crm/v3/pipelines/deals')).json()) as {
    results: Array<{ id: string; label: string }>;
  };
  const found = existing.results.find((p) => p.label === PIPELINE_SPEC.label);
  if (found) console.info(`pipeline exists: set HUBSPOT_PARTNER_PIPELINE_ID=${found.id}`);
  else if (apply) {
    const res = await call('POST', '/crm/v3/pipelines/deals', PIPELINE_SPEC);
    if (!res.ok) throw new Error(`pipeline: HTTP ${res.status} ${await res.text()}`);
    const created = (await res.json()) as { id: string };
    console.info(`created pipeline: set HUBSPOT_PARTNER_PIPELINE_ID=${created.id}`);
  } else console.info(`[dry-run] would create pipeline ${PIPELINE_SPEC.label}`);

  // Association labels (partner and customer on the deal to company link) need a plan that
  // supports custom labels; Task 0.1 records the answer. Without labels the code falls back to
  // the default association plus the partner_company_id deal property.
  for (const name of ['Partner', 'Customer']) {
    await ensure(`deal to company label ${name}`, '/crm/v4/associations/deals/companies/labels', {
      label: name, name: name.toLowerCase(),
    });
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
```

- [ ] **Step 6: Dry run against the developer account, then apply** (manual: needs a person and a developer account token, so it is not run in an unattended build; steps 1 to 5 and 7 are)

Run: `cd apps/portal && pnpm exec tsx --env-file=.env scripts/provision-hubspot.ts`
Expected: lines starting `[dry-run] would create` for every property, the pipeline and both labels.
Run: `pnpm exec tsx --env-file=.env scripts/provision-hubspot.ts --apply`, then run it again. Expected: second run prints `exists, skipped` for everything and the pipeline id line.

- [ ] **Step 7: Commit**

```bash
git add apps/portal/scripts/provision-hubspot.ts apps/portal/src/server/hubspot/schema-spec.ts apps/portal/src/server/hubspot/schema-spec.test.ts
git commit -m "feat(portal): H4.1 HubSpot schema spec and idempotent provisioning script"
```

### Task 4.2: The HubspotApi interface, the real client and the fake

**Files:**
- Create: `apps/portal/src/server/hubspot/types.ts`, `client.ts`, `fake.ts`
- Test: `apps/portal/src/server/hubspot/client.test.ts`

- [ ] **Step 1: Write the types (the contract every later task uses)**

```ts
// types.ts
// Shared definitions live elsewhere (contracts M.2 item 1); re-exported so `instanceof` and imports work from either path.
export { DependencyPending } from '@/server/errors';
export type { RegistrationStatus } from '@/lib/domain';

export const STAGE_LABELS = [
  'Accepted', 'Discovery', 'Technical evaluation', 'Proposal sent',
  'Closed won', 'Closed lost', 'Registration expired',
] as const;
export type StageLabel = (typeof STAGE_LABELS)[number];
export type StageIds = Record<StageLabel, string>;

export interface HsDeal {
  id: string;
  stageId: string;
  properties: Record<string, string | null>;
  /** hs_lastmodifieddate as epoch milliseconds. */
  modifiedAt: number;
}
export interface HsCompany { id: string; name: string | null; domain: string | null }
export interface DealSearchPage { deals: HsDeal[]; next: string | null }
export type AssociationRole = 'partner' | 'customer';

export interface HubspotApi {
  getStageIds(pipelineId: string): Promise<StageIds>;
  findCompany(input: { domain: string | null; name: string }): Promise<HsCompany | null>;
  searchCompanies(query: string): Promise<HsCompany[]>;
  createOrUpdateCompany(input: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }>;
  upsertContact(input: { email: string; firstName: string; lastName: string; phone?: string }): Promise<{ id: string }>;
  associateContactWithCompany(contactId: string, companyId: string): Promise<void>;
  findDealByRegistrationId(registrationId: string): Promise<HsDeal | null>;
  createDeal(properties: Record<string, string>): Promise<HsDeal>;
  updateDeal(dealId: string, properties: Record<string, string>): Promise<void>;
  associateDealWithCompany(dealId: string, companyId: string, role: AssociationRole): Promise<void>;
  associateDealWithContact(dealId: string, contactId: string): Promise<void>;
  searchDealsModifiedSince(pipelineId: string, sinceMs: number, after: string | null): Promise<DealSearchPage>;
  readDeals(ids: string[]): Promise<HsDeal[]>;
  listOpenDealsForCompany(companyId: string, pipelineId: string): Promise<HsDeal[]>;
}

export class HubspotError extends Error {
  constructor(readonly status: number, readonly body: string, message: string) {
    super(message);
    this.name = 'HubspotError';
  }
}
```

`DependencyPending` (thrown by an outbox handler when a record it needs has not been synced yet, retried without counting as a failure) is the `PortalError` subclass in `src/server/errors.ts` (contracts E). `HubspotError` stays a plain `Error` subclass: the outbox treats every thrown error except `DependencyPending` as retryable. `types.ts` and `mappers.ts` import nothing that is server only, so the contracts' `deal-rules.ts` can re-export `STAGE_LABELS` and `STAGE_TO_STATUS` into client code.

- [ ] **Step 2: Write the fake (used by every later test)**

`FakeHubspot` is imported as is by W0-b's `makeSyncedDeal` (contracts J.3, J.4) and by tracks P and R through the `HubspotApi` interface. Keep the public members `stageIds`, `createDeal`, `deals`, `companies`, `associations`, `failNext` and `calls` under these names.

```ts
// fake.ts
import type {
  AssociationRole, DealSearchPage, HsCompany, HsDeal, HubspotApi, StageIds,
} from './types';
import { STAGE_LABELS } from './types';

export class FakeHubspot implements HubspotApi {
  companies = new Map<string, HsCompany & { properties: Record<string, string> }>();
  contacts = new Map<string, { id: string; email: string }>();
  deals = new Map<string, HsDeal>();
  associations: Array<{ from: string; to: string; kind: string }> = [];
  failNext: Error | null = null;
  calls: string[] = [];
  private seq = 100;
  /** Advance to make modifiedAt values deterministic in tests. */
  clock = 1_000;
  readonly stageIds: StageIds = Object.fromEntries(STAGE_LABELS.map((l, i) => [l, `stage-${i}`])) as StageIds;

  private next(): string { this.seq += 1; return String(this.seq); }
  private maybeFail(call: string): void {
    this.calls.push(call);
    if (this.failNext) { const e = this.failNext; this.failNext = null; throw e; }
  }

  async getStageIds(): Promise<StageIds> { return this.stageIds; }

  async findCompany({ domain, name }: { domain: string | null; name: string }): Promise<HsCompany | null> {
    this.maybeFail('findCompany');
    const all = [...this.companies.values()];
    return (domain ? all.find((c) => c.domain === domain) : undefined) ?? all.find((c) => c.name?.toLowerCase() === name.toLowerCase()) ?? null;
  }
  async searchCompanies(query: string): Promise<HsCompany[]> {
    return [...this.companies.values()].filter((c) => `${c.name} ${c.domain}`.toLowerCase().includes(query.toLowerCase()));
  }
  async createOrUpdateCompany(i: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }> {
    this.maybeFail('createOrUpdateCompany');
    const id = i.existingId ?? this.next();
    this.companies.set(id, { id, name: i.name, domain: i.domain, properties: i.properties });
    return { id };
  }
  async upsertContact(i: { email: string }): Promise<{ id: string }> {
    this.maybeFail('upsertContact');
    const found = [...this.contacts.values()].find((c) => c.email === i.email);
    if (found) return { id: found.id };
    const id = this.next();
    this.contacts.set(id, { id, email: i.email });
    return { id };
  }
  async associateContactWithCompany(c: string, co: string): Promise<void> { this.associations.push({ from: c, to: co, kind: 'contact-company' }); }
  async findDealByRegistrationId(rid: string): Promise<HsDeal | null> {
    return [...this.deals.values()].find((d) => d.properties.portal_registration_id === rid) ?? null;
  }
  async createDeal(properties: Record<string, string>): Promise<HsDeal> {
    this.maybeFail('createDeal');
    const id = this.next();
    this.clock += 1;
    const deal: HsDeal = { id, stageId: properties.dealstage ?? '', properties: { ...properties }, modifiedAt: this.clock };
    this.deals.set(id, deal);
    return deal;
  }
  async updateDeal(id: string, properties: Record<string, string>): Promise<void> {
    this.maybeFail('updateDeal');
    const d = this.deals.get(id);
    if (!d) throw new Error(`no deal ${id}`);
    this.clock += 1;
    this.deals.set(id, { ...d, properties: { ...d.properties, ...properties }, stageId: properties.dealstage ?? d.stageId, modifiedAt: this.clock });
  }
  async associateDealWithCompany(d: string, c: string, role: AssociationRole): Promise<void> { this.associations.push({ from: d, to: c, kind: `deal-company:${role}` }); }
  async associateDealWithContact(d: string, c: string): Promise<void> { this.associations.push({ from: d, to: c, kind: 'deal-contact' }); }
  async searchDealsModifiedSince(_p: string, sinceMs: number, after: string | null): Promise<DealSearchPage> {
    this.maybeFail('searchDealsModifiedSince');
    const rows = [...this.deals.values()].filter((d) => d.modifiedAt >= sinceMs).sort((a, b) => a.modifiedAt - b.modifiedAt);
    const start = after ? Number(after) : 0;
    const page = rows.slice(start, start + 2);
    return { deals: page, next: start + 2 < rows.length ? String(start + 2) : null };
  }
  async readDeals(ids: string[]): Promise<HsDeal[]> { return ids.flatMap((id) => this.deals.get(id) ?? []); }
  async listOpenDealsForCompany(companyId: string): Promise<HsDeal[]> {
    const dealIds = this.associations.filter((a) => a.kind.startsWith('deal-company') && a.to === companyId).map((a) => a.from);
    return dealIds.flatMap((id) => this.deals.get(id) ?? []);
  }
}
```

The page size of 2 in `searchDealsModifiedSince` is deliberate: it forces the poller tests through the paging path.

- [ ] **Step 3: Write the failing contract test for the real client**

The real client takes an `apiRequest` function so the test can assert the request bodies without a network.

```ts
// client.test.ts
import { describe, expect, it, vi } from 'vitest';
import { IntegrationError } from '@/server/errors';
import { createHubspot, readHubspotConfig, RealHubspot } from './client';

const mockEnv = vi.hoisted(() => ({
  HUBSPOT_PORTAL_TOKEN: undefined as string | undefined,
  HUBSPOT_PARTNER_PIPELINE_ID: undefined as string | undefined,
  HUBSPOT_USE_ASSOCIATION_LABELS: false,
}));
vi.mock('@/env', () => ({ env: mockEnv }));

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('RealHubspot', () => {
  it('searches deals by pipeline and last modified, oldest first', async () => {
    const apiRequest = vi.fn().mockResolvedValue(json({ results: [], paging: undefined }));
    const hs = new RealHubspot(apiRequest);
    await hs.searchDealsModifiedSince('pipe-1', 5000, null);
    const call = apiRequest.mock.calls[0]![0];
    expect(call.path).toBe('/crm/v3/objects/deals/search');
    expect(call.body.filterGroups[0].filters).toEqual([
      { propertyName: 'pipeline', operator: 'EQ', value: 'pipe-1' },
      { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: '5000' },
    ]);
    expect(call.body.sorts).toEqual([{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }]);
  });

  it('returns the next cursor when HubSpot pages', async () => {
    const apiRequest = vi.fn().mockResolvedValue(
      json({ results: [{ id: '9', properties: { dealstage: 's1', hs_lastmodifieddate: '2026-11-06T10:00:00Z' } }], paging: { next: { after: '100' } } }),
    );
    const page = await new RealHubspot(apiRequest).searchDealsModifiedSince('p', 0, null);
    expect(page.next).toBe('100');
    expect(page.deals[0]).toMatchObject({ id: '9', stageId: 's1', modifiedAt: Date.parse('2026-11-06T10:00:00Z') });
  });

  it('throws HubspotError with the status on a failed call', async () => {
    const apiRequest = vi.fn().mockResolvedValue(json({ message: 'bad' }, 400));
    await expect(new RealHubspot(apiRequest).createDeal({ dealname: 'x' })).rejects.toMatchObject({ name: 'HubspotError', status: 400 });
  });
});

describe('configuration', () => {
  it('throws a typed IntegrationError when the token is unset', () => {
    mockEnv.HUBSPOT_PORTAL_TOKEN = undefined;
    expect(() => createHubspot()).toThrow(IntegrationError);
    expect(() => createHubspot()).toThrow('HUBSPOT_PORTAL_TOKEN is not set');
  });

  it('reports no configuration until both the token and the pipeline id are set', () => {
    mockEnv.HUBSPOT_PORTAL_TOKEN = 'token';
    mockEnv.HUBSPOT_PARTNER_PIPELINE_ID = undefined;
    expect(readHubspotConfig()).toBeNull();
    mockEnv.HUBSPOT_PARTNER_PIPELINE_ID = 'pipe-1';
    expect(readHubspotConfig()).toEqual({ token: 'token', pipelineId: 'pipe-1' });
  });
});
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/client.test.ts`
Expected: FAIL, "Cannot find module './client'".

- [ ] **Step 5: Implement the real client**

```ts
// client.ts
import { Client } from '@hubspot/api-client';
import { env } from '@/env';
import { IntegrationError } from '@/server/errors';
import {
  type AssociationRole, type DealSearchPage, type HsCompany, type HsDeal, type HubspotApi,
  HubspotError, STAGE_LABELS, type StageIds,
} from './types';

type ApiRequest = (opts: { method: string; path: string; body?: unknown }) => Promise<Response>;

const DEAL_PROPS = ['dealname', 'dealstage', 'pipeline', 'closedate', 'hs_lastmodifieddate',
  'portal_registration_id', 'protection_end_date', 'partner_company_id'];

interface RawDeal { id: string; properties: Record<string, string | null> }

const toDeal = (raw: RawDeal): HsDeal => ({
  id: raw.id,
  stageId: raw.properties.dealstage ?? '',
  properties: raw.properties,
  modifiedAt: Date.parse(raw.properties.hs_lastmodifieddate ?? '') || 0,
});

export class RealHubspot implements HubspotApi {
  private stageCache: { at: number; ids: StageIds } | null = null;
  private labelIds: { partner: number; customer: number } | null | undefined;

  constructor(private readonly apiRequest: ApiRequest) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.apiRequest({ method, path, ...(body !== undefined ? { body } : {}) });
    if (!res.ok) {
      const text = await res.text();
      throw new HubspotError(res.status, text, `HubSpot ${method} ${path} failed with ${res.status}`);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  async getStageIds(pipelineId: string): Promise<StageIds> {
    if (this.stageCache && Date.now() - this.stageCache.at < 600_000) return this.stageCache.ids;
    const pipe = await this.call<{ stages: Array<{ id: string; label: string }> }>('GET', `/crm/v3/pipelines/deals/${pipelineId}`);
    const ids = {} as StageIds;
    for (const label of STAGE_LABELS) {
      const s = pipe.stages.find((x) => x.label === label);
      if (!s) throw new HubspotError(500, '', `Pipeline ${pipelineId} has no stage "${label}". Run provision-hubspot.ts.`);
      ids[label] = s.id;
    }
    this.stageCache = { at: Date.now(), ids };
    return ids;
  }

  private async searchCompany(propertyName: string, value: string): Promise<HsCompany | null> {
    const r = await this.call<{ results: Array<{ id: string; properties: { name?: string; domain?: string } }> }>(
      'POST', '/crm/v3/objects/companies/search',
      { filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value }] }], properties: ['name', 'domain'], limit: 1 },
    );
    const hit = r.results[0];
    return hit ? { id: hit.id, name: hit.properties.name ?? null, domain: hit.properties.domain ?? null } : null;
  }

  async findCompany({ domain, name }: { domain: string | null; name: string }): Promise<HsCompany | null> {
    return (domain ? await this.searchCompany('domain', domain) : null) ?? (await this.searchCompany('name', name));
  }

  async searchCompanies(query: string): Promise<HsCompany[]> {
    const r = await this.call<{ results: Array<{ id: string; properties: { name?: string; domain?: string } }> }>(
      'POST', '/crm/v3/objects/companies/search', { query, properties: ['name', 'domain'], limit: 5 },
    );
    return r.results.map((c) => ({ id: c.id, name: c.properties.name ?? null, domain: c.properties.domain ?? null }));
  }

  async createOrUpdateCompany(i: { existingId: string | null; name: string; domain: string | null; properties: Record<string, string> }): Promise<{ id: string }> {
    const properties = { name: i.name, ...(i.domain ? { domain: i.domain } : {}), ...i.properties };
    if (i.existingId) {
      await this.call('PATCH', `/crm/v3/objects/companies/${i.existingId}`, { properties });
      return { id: i.existingId };
    }
    return this.call<{ id: string }>('POST', '/crm/v3/objects/companies', { properties });
  }

  async upsertContact(i: { email: string; firstName: string; lastName: string; phone?: string }): Promise<{ id: string }> {
    const r = await this.call<{ results: Array<{ id: string }> }>('POST', '/crm/v3/objects/contacts/batch/upsert', {
      inputs: [{ idProperty: 'email', id: i.email, properties: {
        email: i.email, firstname: i.firstName, lastname: i.lastName, ...(i.phone ? { phone: i.phone } : {}),
      } }],
    });
    const first = r.results[0];
    if (!first) throw new HubspotError(500, '', 'Contact upsert returned no result');
    return { id: first.id };
  }

  async associateContactWithCompany(contactId: string, companyId: string): Promise<void> {
    await this.call('PUT', `/crm/v4/objects/contacts/${contactId}/associations/default/companies/${companyId}`);
  }

  async findDealByRegistrationId(registrationId: string): Promise<HsDeal | null> {
    const r = await this.call<{ results: RawDeal[] }>('POST', '/crm/v3/objects/deals/search', {
      filterGroups: [{ filters: [{ propertyName: 'portal_registration_id', operator: 'EQ', value: registrationId }] }],
      properties: DEAL_PROPS, limit: 1,
    });
    const hit = r.results[0];
    return hit ? toDeal(hit) : null;
  }

  async createDeal(properties: Record<string, string>): Promise<HsDeal> {
    return toDeal(await this.call<RawDeal>('POST', '/crm/v3/objects/deals', { properties }));
  }

  async updateDeal(dealId: string, properties: Record<string, string>): Promise<void> {
    await this.call('PATCH', `/crm/v3/objects/deals/${dealId}`, { properties });
  }

  private async companyLabels(): Promise<{ partner: number; customer: number } | null> {
    if (this.labelIds !== undefined) return this.labelIds;
    if (!env.HUBSPOT_USE_ASSOCIATION_LABELS) return (this.labelIds = null);
    const r = await this.call<{ results: Array<{ typeId: number; label: string | null; category: string }> }>(
      'GET', '/crm/v4/associations/deals/companies/labels',
    );
    const find = (l: string): number | undefined => r.results.find((x) => x.label === l && x.category === 'USER_DEFINED')?.typeId;
    const partner = find('Partner');
    const customer = find('Customer');
    return (this.labelIds = partner && customer ? { partner, customer } : null);
  }

  async associateDealWithCompany(dealId: string, companyId: string, role: AssociationRole): Promise<void> {
    const labels = await this.companyLabels();
    if (!labels) {
      await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/default/companies/${companyId}`);
      return;
    }
    await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/companies/${companyId}`, [
      { associationCategory: 'USER_DEFINED', associationTypeId: labels[role] },
    ]);
  }

  async associateDealWithContact(dealId: string, contactId: string): Promise<void> {
    await this.call('PUT', `/crm/v4/objects/deals/${dealId}/associations/default/contacts/${contactId}`);
  }

  async searchDealsModifiedSince(pipelineId: string, sinceMs: number, after: string | null): Promise<DealSearchPage> {
    const r = await this.call<{ results: RawDeal[]; paging?: { next?: { after: string } } }>('POST', '/crm/v3/objects/deals/search', {
      filterGroups: [{ filters: [
        { propertyName: 'pipeline', operator: 'EQ', value: pipelineId },
        { propertyName: 'hs_lastmodifieddate', operator: 'GTE', value: String(sinceMs) },
      ] }],
      sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'ASCENDING' }],
      properties: DEAL_PROPS, limit: 100, ...(after ? { after } : {}),
    });
    return { deals: r.results.map(toDeal), next: r.paging?.next?.after ?? null };
  }

  async readDeals(ids: string[]): Promise<HsDeal[]> {
    if (ids.length === 0) return [];
    const r = await this.call<{ results: RawDeal[] }>('POST', '/crm/v3/objects/deals/batch/read', {
      properties: DEAL_PROPS, inputs: ids.map((id) => ({ id })),
    });
    return r.results.map(toDeal);
  }

  async listOpenDealsForCompany(companyId: string, pipelineId: string): Promise<HsDeal[]> {
    const assoc = await this.call<{ results: Array<{ toObjectId: number }> }>('GET', `/crm/v4/objects/companies/${companyId}/associations/deals`);
    const deals = await this.readDeals(assoc.results.map((a) => String(a.toObjectId)));
    return deals.filter((d) => d.properties.pipeline === pipelineId);
  }
}

export interface HubspotConfig { token: string; pipelineId: string }

/** null when the portal token or the partner pipeline id is unset (development, tests, a fresh environment). Jobs use it to skip with a warning. */
export const readHubspotConfig = (): HubspotConfig | null => {
  const token = env.HUBSPOT_PORTAL_TOKEN;
  const pipelineId = env.HUBSPOT_PARTNER_PIPELINE_ID;
  return token && pipelineId ? { token, pipelineId } : null;
};

export const createHubspot = (): HubspotApi => {
  const token = env.HUBSPOT_PORTAL_TOKEN;
  if (!token) throw new IntegrationError('hubspot', 'HUBSPOT_PORTAL_TOKEN is not set');
  const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });
  return new RealHubspot((opts) => client.apiRequest({ method: opts.method, path: opts.path, ...(opts.body !== undefined ? { body: opts.body } : {}) }));
};
```

`HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_PARTNER_PIPELINE_ID` and `HUBSPOT_USE_ASSOCIATION_LABELS` already exist in `src/env.ts` and `.env.example` (W0-b and W0-c, contracts I; the first two are optional outside production, the labels flag defaults to `false`), so this task edits neither file. `createHubspot()` is the only place that needs the token and it throws a typed `IntegrationError` when it is unset; callers that must degrade (the jobs, and track R's lookup action) check `readHubspotConfig()` first or treat the thrown error as "HubSpot unavailable". If the installed `@hubspot/api-client` has no `apiRequest` (contracts M.1 item 15), replace the body of the arrow function with a thin `fetch` wrapper that sends the bearer token and retries a 429; `RealHubspot` takes any function with that shape.

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/client.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/portal/src/server/hubspot
git commit -m "feat(portal): H4.2 HubspotApi interface, real client and in-memory fake"
```

### Task 4.3: Pure mappers

**Files:**
- Create: `apps/portal/src/server/hubspot/mappers.ts`
- Test: `apps/portal/src/server/hubspot/mappers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// mappers.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from './fake';
import { decideInbound, dealProperties, isoDate, nextDelayMs, STAGE_TO_STATUS } from './mappers';

const stageIds = new FakeHubspot().stageIds;

describe('dealProperties', () => {
  it('builds the deal body from a registration', () => {
    const props = dealProperties(
      { id: 'r1', customerName: 'Vardhan Capital', product: 'Clean Libraries', region: 'India', protectionEnd: '2027-02-02' },
      { name: 'Kestrel Systems', hubspotCompanyId: '55' },
      stageIds,
      'pipe-1',
    );
    expect(props).toEqual({
      dealname: 'Vardhan Capital | Clean Libraries | Kestrel Systems',
      pipeline: 'pipe-1',
      dealstage: stageIds.Accepted,
      portal_registration_id: 'r1',
      protection_end_date: '2027-02-02',
      partner_product: 'clean_libraries',
      partner_region: 'india',
      partner_name: 'Kestrel Systems',
      partner_company_id: '55',
    });
  });
});

describe('isoDate', () => {
  it('reads a date or an epoch at midnight UTC', () => {
    expect(isoDate('2027-02-02')).toBe('2027-02-02');
    expect(isoDate(String(Date.UTC(2027, 1, 2)))).toBe('2027-02-02');
    expect(isoDate(null)).toBeNull();
    expect(isoDate('')).toBeNull();
  });
});

describe('decideInbound', () => {
  const reg = { status: 'accepted' as const, hubspotStageId: stageIds.Accepted, protectionEnd: '2027-02-02' };
  const idToLabel = Object.fromEntries(Object.entries(stageIds).map(([l, id]) => [id, l]));

  it('returns null when nothing changed', () => {
    const deal = { id: '1', stageId: stageIds.Accepted, modifiedAt: 1, properties: { protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toBeNull();
  });

  it('maps a stage move to a timeline event and keeps the status accepted', () => {
    const deal = { id: '1', stageId: stageIds['Technical evaluation'], modifiedAt: 1, properties: { protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({
      status: 'accepted', stage: 'Technical evaluation', closedOn: null, changed: 'stage',
      eventText: 'Stage moved to Technical evaluation',
    });
  });

  it('closes the registration on Closed won and stamps the close date from HubSpot', () => {
    const deal = { id: '1', stageId: stageIds['Closed won'], modifiedAt: 1, properties: { closedate: '2026-12-01', protection_end_date: '2027-02-02' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({ status: 'won', closedOn: '2026-12-01' });
  });

  it('ignores a stage that is not one of ours', () => {
    const deal = { id: '1', stageId: 'unknown', modifiedAt: 1, properties: {} };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toBeNull();
  });

  it('picks up a protection end changed in HubSpot', () => {
    const deal = { id: '1', stageId: stageIds.Accepted, modifiedAt: 1, properties: { protection_end_date: '2027-03-01' } };
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({ protectionEnd: '2027-03-01', changed: 'protection_end', eventText: 'Protection end changed to 1 Mar 2027' });
  });
});

describe('nextDelayMs', () => {
  it('backs off 1 minute, 5 minutes, 30 minutes, 2 hours, 12 hours and then stops', () => {
    expect([1, 2, 3, 4, 5].map(nextDelayMs)).toEqual([60_000, 300_000, 1_800_000, 7_200_000, 43_200_000]);
    expect(nextDelayMs(6)).toBeNull();
  });
});

describe('STAGE_TO_STATUS', () => {
  it('covers every stage label', () => {
    expect(Object.keys(STAGE_TO_STATUS)).toHaveLength(7);
  });
});
```

`dealProperties` takes display labels (`'Clean Libraries'`, `'India'`), not the stored codes (`libraries`, `india`): the enumeration values must match the spec's `opt()` helper exactly (`clean_libraries`, `cleanstart_images`, `india`, `middle_east`), which is why the test spells them out. The `registration.create` handler maps the stored codes to labels before calling it (Task 4.6).

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/mappers.test.ts`
Expected: FAIL, "Cannot find module './mappers'".

- [ ] **Step 3: Implement**

```ts
// mappers.ts
import { fmtLong } from '@/lib/dates';
import type { HsDeal, RegistrationStatus, StageIds, StageLabel } from './types';

export const STAGE_TO_STATUS: Record<StageLabel, RegistrationStatus> = {
  Accepted: 'accepted',
  Discovery: 'accepted',
  'Technical evaluation': 'accepted',
  'Proposal sent': 'accepted',
  'Closed won': 'won',
  'Closed lost': 'lost',
  'Registration expired': 'expired',
};

const slug = (v: string): string => v.toLowerCase().replace(/\s+/g, '_');

/** HubSpot returns a date property as YYYY-MM-DD or as epoch milliseconds at midnight UTC. */
export const isoDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const ms = Number(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null;
};

/** `product` and `region` are display labels (PRODUCT_LABEL, PARTNER_REGION_LABEL), not the stored codes. */
export interface RegistrationForSync {
  id: string; customerName: string; product: string; region: string; protectionEnd: string;
}
export interface PartnerForSync { name: string; hubspotCompanyId: string }

export const dealProperties = (
  reg: RegistrationForSync, partner: PartnerForSync, stageIds: StageIds, pipelineId: string,
): Record<string, string> => ({
  dealname: `${reg.customerName} | ${reg.product} | ${partner.name}`,
  pipeline: pipelineId,
  dealstage: stageIds.Accepted,
  portal_registration_id: reg.id,
  protection_end_date: reg.protectionEnd,
  partner_product: slug(reg.product),
  partner_region: slug(reg.region),
  partner_name: partner.name,
  partner_company_id: partner.hubspotCompanyId,
});

export interface InboundChange {
  status: RegistrationStatus;
  stage: StageLabel;
  stageId: string;
  closedOn: string | null;
  protectionEnd: string | null;
  /** What moved, so the poll can pick the audit event. A stage move wins when both moved. */
  changed: 'stage' | 'protection_end';
  eventText: string;
}

export const decideInbound = (
  reg: { status: RegistrationStatus; hubspotStageId: string | null; protectionEnd: string | null },
  deal: HsDeal,
  stageLabelById: Record<string, string>,
  today: string,
): InboundChange | null => {
  const label = stageLabelById[deal.stageId] as StageLabel | undefined;
  if (!label) return null;
  const incomingEnd = isoDate(deal.properties.protection_end_date);
  const stageChanged = deal.stageId !== reg.hubspotStageId;
  const endChanged = incomingEnd !== null && incomingEnd !== reg.protectionEnd;
  if (!stageChanged && !endChanged) return null;

  const status = STAGE_TO_STATUS[label];
  const closed = status === 'won' || status === 'lost' || status === 'expired';
  return {
    status,
    stage: label,
    stageId: deal.stageId,
    closedOn: closed ? (isoDate(deal.properties.closedate) ?? today) : null,
    protectionEnd: endChanged ? incomingEnd : null,
    changed: stageChanged ? 'stage' : 'protection_end',
    eventText: stageChanged ? `Stage moved to ${label}` : `Protection end changed to ${fmtLong(incomingEnd ?? '')}`,
  };
};

const DELAYS_MS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000];
/** Delay before attempt number `attempts + 1`, or null once the operation should be marked failed. */
export const nextDelayMs = (attempts: number): number | null => DELAYS_MS[attempts - 1] ?? null;
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/mappers.test.ts`
Expected: PASS, all tests.

- [ ] **Step 5: Commit**

```bash
git add apps/portal/src/server/hubspot/mappers.ts apps/portal/src/server/hubspot/mappers.test.ts
git commit -m "feat(portal): H4.3 HubSpot mappers for deal properties, inbound decisions and backoff"
```

### Task 4.4: The outbox

**Files:**
- Create: `apps/portal/src/server/hubspot/outbox.ts`
- Modify (body only): `apps/portal/src/server/jobs/hubspot-outbox.ts` (W0-c created it as `export const runHubspotOutbox = async (): Promise<void> => {}`; keep the export name)
- Test: `apps/portal/src/server/hubspot/outbox.test.ts`
- Test: `apps/portal/src/server/jobs/hubspot-outbox.test.ts`

This task relies on Wave 0 and edits none of it: the `hubspot_outbox` table (contracts C.1), the `db` and `pool` exports of `@/db/client` (C.2), `testDb` and `resetDb` (J.3), `src/server/jobs/{lock,schedule,index}.ts` with `JOBS` already listing `hubspot-outbox` (H.17), `src/instrumentation.ts`, `node-cron` and `@sentry/nextjs` (W0-a). The advisory lock helper `runLocked` and its test (`lock.test.ts`) belong to W0-c; this task only uses the registered job. The op names and the exact `version` each caller passes are fixed by contracts section G; the enqueue calls themselves are written by tracks P and R.

- [ ] **Step 1: Write the failing tests** (real test database, one per Vitest worker, truncated before each test; fake HubSpot)

```ts
// outbox.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { asPartner, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { withViewer } from '@/server/repo/context';
import { drainOutbox, enqueue, type Handlers } from './outbox';
import { DependencyPending, HubspotError } from './types';

const db = testDb();
beforeEach(() => resetDb(db));

// New rows are due from the database's now(), so the fixed clock sits after any real date the tests can run on.
const clock = fixedClock('2099-01-01T10:00:00Z');
const NOW = clock.now();
const row = async (): Promise<typeof hubspotOutbox.$inferSelect> =>
  (await db.select().from(hubspotOutbox))[0]!;

describe('enqueue', () => {
  it('ignores a duplicate with the same idempotency key', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });

  it('builds the key from the op, the subject and the version', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793959320000' });
    expect((await row()).idempotencyKey).toBe('registration.create:r1:1793959320000');
  });

  it('treats a second decision time as a new operation (accept, undo, accept again)', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793959320000' });
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1793962920000' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(2);
  });

  it('can be called inside a viewer transaction, where the handle is a transaction', async () => {
    const viewer = await asPartner(db);
    await withViewer(viewer, (tx) => enqueue(tx, { op: 'partner.upsert', subjectId: viewer.partnerId, version: '1' }));
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('drainOutbox', () => {
  it('marks a successful operation done', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers: Handlers = { 'partner.upsert': vi.fn().mockResolvedValue(undefined) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out).toEqual({ done: 1, retried: 0, failed: 0, waiting: 0 });
    expect((await row()).status).toBe('done');
  });

  it('retries with backoff and records the error', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new HubspotError(500, 'x', 'boom')) } as unknown as Handlers;
    await drainOutbox({ db, handlers, clock });
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 1, lastError: 'boom' });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('marks the operation failed after the fifth attempt', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ attempts: 5 }).where(eq(hubspotOutbox.op, 'partner.upsert'));
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new Error('still broken')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out.failed).toBe(1);
    expect((await row()).status).toBe('failed');
  });

  it('reschedules a dependency wait without counting an attempt', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    const handlers = { 'registration.create': vi.fn().mockRejectedValue(new DependencyPending('partner not synced')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, clock });
    expect(out.waiting).toBe(1);
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 0 });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('skips rows that are not due yet', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ nextAttemptAt: new Date(NOW.getTime() + 1000) });
    const handler = vi.fn();
    const out = await drainOutbox({ db, handlers: { 'partner.upsert': handler } as unknown as Handlers, clock });
    expect(handler).not.toHaveBeenCalled();
    expect(out).toEqual({ done: 0, retried: 0, failed: 0, waiting: 0 });
  });

  it('lets two concurrent drains handle each row once (FOR UPDATE SKIP LOCKED)', async () => {
    for (const id of ['a', 'b', 'c', 'd']) await enqueue(db, { op: 'partner.upsert', subjectId: id, version: '1' });
    const handler = vi.fn(async (): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    const handlers = { 'partner.upsert': handler } as unknown as Handlers;
    const [first, second] = await Promise.all([drainOutbox({ db, handlers, clock }), drainOutbox({ db, handlers, clock })]);
    expect(first.done + second.done).toBe(4);
    expect(handler).toHaveBeenCalledTimes(4);
  });
});
```

- [ ] **Step 2: Run and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/outbox.test.ts`
Expected: FAIL, "Cannot find module './outbox'".

- [ ] **Step 3: Implement**

```ts
// outbox.ts
import { and, eq, lte, sql } from 'drizzle-orm';
import * as Sentry from '@sentry/nextjs';
import type { Db } from '@/db/client';
import { hubspotOutbox } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import type { OutboxOp } from '@/lib/domain';
import type { Tx } from '@/server/repo/context';
import { nextDelayMs } from './mappers';
import { DependencyPending } from './types';

export type { OutboxOp };

export type Handlers = Record<OutboxOp, (subjectId: string, payload: Record<string, unknown>) => Promise<void>>;

/** Contracts G. Safe inside withViewer: hubspot_outbox allows INSERT for every identity. */
export async function enqueue(
  tx: Pick<Db | Tx, 'insert'>,
  input: { op: OutboxOp; subjectId: string; version: string; payload?: Record<string, unknown> },
): Promise<void> {
  await tx.insert(hubspotOutbox).values({
    op: input.op,
    subjectId: input.subjectId,
    payload: input.payload ?? {},
    idempotencyKey: `${input.op}:${input.subjectId}:${input.version}`,
  }).onConflictDoNothing({ target: hubspotOutbox.idempotencyKey });
}

export interface DrainResult { done: number; retried: number; failed: number; waiting: number }

// shortcut: rows stay locked while their HubSpot calls run (batch of 20; the advisory lock skips a tick while a drain is still running); move to
// a claimed status with a lease if a single drain ever needs more than that.
export const drainOutbox = async (deps: {
  db: Db; handlers: Handlers; clock: Clock; batch?: number;
}): Promise<DrainResult> => {
  const result: DrainResult = { done: 0, retried: 0, failed: 0, waiting: 0 };
  await deps.db.transaction(async (tx) => {
    const due = await tx.select().from(hubspotOutbox)
      .where(and(eq(hubspotOutbox.status, 'pending'), lte(hubspotOutbox.nextAttemptAt, deps.clock.now())))
      .orderBy(hubspotOutbox.createdAt).limit(deps.batch ?? 20).for('update', { skipLocked: true });

    for (const row of due) {
      try {
        await deps.handlers[row.op](row.subjectId, row.payload);
        await tx.update(hubspotOutbox).set({ status: 'done', lastError: null, updatedAt: sql`now()` }).where(eq(hubspotOutbox.id, row.id));
        result.done += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (err instanceof DependencyPending) {
          await tx.update(hubspotOutbox).set({ nextAttemptAt: new Date(deps.clock.now().getTime() + 60_000), lastError: message }).where(eq(hubspotOutbox.id, row.id));
          result.waiting += 1;
          continue;
        }
        const attempts = row.attempts + 1;
        const delay = nextDelayMs(attempts);
        if (delay === null) {
          await tx.update(hubspotOutbox).set({ status: 'failed', attempts, lastError: message }).where(eq(hubspotOutbox.id, row.id));
          Sentry.captureException(err, { tags: { op: row.op }, extra: { subjectId: row.subjectId } });
          result.failed += 1;
        } else {
          await tx.update(hubspotOutbox).set({ attempts, lastError: message, nextAttemptAt: new Date(deps.clock.now().getTime() + delay) }).where(eq(hubspotOutbox.id, row.id));
          result.retried += 1;
        }
      }
    }
  });
  return result;
};
```

- [ ] **Step 4: Run the tests**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/outbox.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit the outbox**

```bash
git add apps/portal/src/server/hubspot/outbox.ts apps/portal/src/server/hubspot/outbox.test.ts
git commit -m "feat(portal): H4.4 HubSpot outbox with idempotent enqueue, retries and backoff"
```

- [ ] **Step 6: Write the failing job test**

`buildHandlers` reaches its final four argument form in Task 4.6, so the job body and its test are written now but compiled, run and committed at the end of Task 4.6 (its step 5 stages them). That keeps every commit compiling. The scheduled job runs under the advisory lock that W0-c's `schedule.ts` applies to every `JOBS` entry, so this task tests only the job body. HubSpot may be unconfigured (the token and pipeline id are optional outside production, contracts I and M.2 item 17): the job must then log a warning and leave the outbox untouched, never throw.

```ts
// src/server/jobs/hubspot-outbox.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makePartner, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox, partners } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { enqueue } from '@/server/hubspot/outbox';
import { runHubspotOutbox } from './hubspot-outbox';

const mocks = vi.hoisted(() => ({
  config: null as { token: string; pipelineId: string } | null,
  createHubspot: vi.fn(),
}));
vi.mock('@/server/hubspot/client', () => ({
  readHubspotConfig: () => mocks.config,
  createHubspot: mocks.createHubspot,
}));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mocks.config = null;
  mocks.createHubspot.mockReset();
});

describe('runHubspotOutbox', () => {
  it('leaves the outbox alone and builds no client while HubSpot is not configured', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await runHubspotOutbox();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
    expect((await db.select().from(hubspotOutbox))[0]).toMatchObject({ status: 'pending', attempts: 0 });
  });

  it('drains the outbox through the client when HubSpot is configured', async () => {
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(new FakeHubspot());
    const partner = await makePartner(db, {});
    await enqueue(db, { op: 'partner.upsert', subjectId: partner.id, version: '1' });
    await runHubspotOutbox();
    expect((await db.select().from(hubspotOutbox))[0]!.status).toBe('done');
    expect((await db.select().from(partners))[0]!.hubspotCompanyId).toBeTruthy();
  });
});
```

- [ ] **Step 7: Implement the job body**

Replace the stub in `src/server/jobs/hubspot-outbox.ts`; do not touch `jobs/index.ts`, it already registers this job every minute.

```ts
// src/server/jobs/hubspot-outbox.ts
import { db } from '@/db/client';
import { systemClock } from '@/lib/clock';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { buildHandlers } from '@/server/hubspot/handlers';
import { drainOutbox } from '@/server/hubspot/outbox';
import { log } from '@/server/log';

export const runHubspotOutbox = async (): Promise<void> => {
  const config = readHubspotConfig();
  if (!config) {
    log.warn({ job: 'hubspot-outbox' }, 'HubSpot is not configured; outbox left as is');
    return;
  }
  const result = await drainOutbox({
    db,
    handlers: buildHandlers(db, createHubspot(), config.pipelineId, systemClock),
    clock: systemClock,
  });
  if (result.done + result.retried + result.failed + result.waiting > 0) log.info({ job: 'hubspot-outbox', ...result }, 'outbox drained');
};
```

- [ ] **Step 8: Hand over to Task 4.6.** Leave `hubspot-outbox.ts` and `hubspot-outbox.test.ts` uncommitted; Task 4.6 step 5 runs `vitest run src/server/hubspot src/server/jobs/hubspot-outbox.test.ts` and commits them. The registered job and its schedule (every minute) are already in W0-c's `JOBS`.

### Task 4.5: Partner and user handlers

**Files:**
- Create: `apps/portal/src/server/hubspot/handlers.ts`
- Test: `apps/portal/src/server/hubspot/handlers.partner.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// handlers.partner.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeUser } from '@/db/test-helpers';
import { partners, users } from '@/db/schema';
import { FakeHubspot } from './fake';
import { buildHandlers } from './handlers';
import { DependencyPending } from './types';

const db = testDb();
beforeEach(() => resetDb(db));

describe('partner.upsert', () => {
  it('creates a partner company, flags it and stores the HubSpot id', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel' });
    await buildHandlers(db, hs, 'pipe-1')['partner.upsert'](p.id, {});
    const saved = (await db.select().from(partners).where(eq(partners.id, p.id)))[0]!;
    expect(saved.hubspotCompanyId).toBeTruthy();
    expect(hs.companies.get(saved.hubspotCompanyId!)?.properties).toMatchObject({
      cleanstart_partner: 'true', partner_category: 'channel_partner', partner_portal_id: p.id,
    });
  });

  it('updates the existing company on a second run instead of creating another', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
    const h = buildHandlers(db, hs, 'pipe-1');
    await h['partner.upsert'](p.id, {});
    await h['partner.upsert'](p.id, {});
    expect(hs.companies.size).toBe(1);
  });
});

describe('user.upsert', () => {
  it('waits when the partner company is not in HubSpot yet', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, {});
    const u = await makeUser(db, { partnerId: p.id, email: 'aditi.rao@kestrelsystems.in' });
    await expect(buildHandlers(db, hs, 'pipe-1')['user.upsert'](u.id, {})).rejects.toBeInstanceOf(DependencyPending);
  });

  it('creates the contact and links it to the partner company', async () => {
    const hs = new FakeHubspot();
    const p = await makePartner(db, {});
    const h = buildHandlers(db, hs, 'pipe-1');
    await h['partner.upsert'](p.id, {});
    const u = await makeUser(db, { partnerId: p.id, email: 'aditi.rao@kestrelsystems.in', name: 'Aditi Rao' });
    await h['user.upsert'](u.id, {});
    const saved = (await db.select().from(users).where(eq(users.id, u.id)))[0]!;
    expect(saved.hubspotContactId).toBeTruthy();
    expect(hs.associations).toContainEqual({ from: saved.hubspotContactId, to: expect.any(String), kind: 'contact-company' });
  });
});
```

The category value in HubSpot is `channel_partner` because `opt('Channel partner')` slugs the label; the handler maps the portal enum (`distributor`, `channel`, `integrator`) to the three labels through a lookup table, not by slugging the portal value.

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/handlers.partner.test.ts`. Expected: FAIL, "Cannot find module './handlers'".

- [ ] **Step 3: Implement the first two handlers**

```ts
// handlers.ts
import { eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { partners, users } from '@/db/schema';
import type { Handlers } from './outbox';
import { DependencyPending, type HubspotApi } from './types';

const CATEGORY_VALUE = { distributor: 'distributor', channel: 'channel_partner', integrator: 'system_integrator' } as const;

const need = <T>(value: T | undefined | null, what: string): T => {
  if (value === undefined || value === null) throw new Error(`${what} not found`);
  return value;
};

export const buildHandlers = (db: Db, hs: HubspotApi, _pipelineId: string): Handlers => ({
  'partner.upsert': async (partnerId) => {
    const p = need((await db.select().from(partners).where(eq(partners.id, partnerId)))[0], `partner ${partnerId}`);
    const manager = p.managerId ? (await db.select().from(users).where(eq(users.id, p.managerId)))[0] : undefined;
    const existing = p.hubspotCompanyId ?? (await hs.findCompany({ domain: p.domain, name: p.name }))?.id ?? null;
    const { id } = await hs.createOrUpdateCompany({
      existingId: existing,
      name: p.name,
      domain: p.domain,
      properties: {
        cleanstart_partner: 'true',
        partner_category: CATEGORY_VALUE[p.category],
        partner_portal_id: p.id,
        ...(manager ? { partner_manager: manager.name } : {}),
      },
    });
    await db.update(partners).set({ hubspotCompanyId: id }).where(eq(partners.id, p.id));
  },

  'user.upsert': async (userId) => {
    const u = need((await db.select().from(users).where(eq(users.id, userId)))[0], `user ${userId}`);
    if (u.kind !== 'partner' || !u.partnerId) return;
    const p = need((await db.select().from(partners).where(eq(partners.id, u.partnerId)))[0], `partner ${u.partnerId}`);
    if (!p.hubspotCompanyId) throw new DependencyPending(`partner ${p.id} is not in HubSpot yet`);
    const [firstName = '', ...rest] = u.name.split(' ');
    const { id } = await hs.upsertContact({ email: u.email, firstName, lastName: rest.join(' ') });
    await hs.associateContactWithCompany(id, p.hubspotCompanyId);
    await db.update(users).set({ hubspotContactId: id }).where(eq(users.id, u.id));
  },

  'registration.create': async () => { throw new Error('implemented in task 4.6'); },
  'registration.update_end': async () => { throw new Error('implemented in task 4.6'); },
  'registration.expire': async () => { throw new Error('implemented in task 4.6'); },
});
```

The three stubs above are replaced in the next task, in the same file; they exist only so the file typechecks between commits.

- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/handlers.partner.test.ts`. Expected: PASS, 4 tests.

- [ ] **Step 5: Confirm what the enqueue calls must look like (no edits here).** The two handlers above are driven by calls that track P writes in its own files (contracts G): `partner.upsert` with `version: '1'` inside the approve-application and Add partner transactions (`actions/applications.ts`, `actions/partners.ts`), `partner.upsert` with `version: String(updatedAt.getTime())` after a profile, category, manager or status edit so every edit syncs, and `user.upsert` with `version: '1'` when an invite is accepted (`actions/invites.ts`). P adds an outbox assertion to each of those action tests. This task edits no file under `src/server/actions/`; the idempotency key shape and a call made inside `withViewer` are already pinned by the Task 4.4 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/server/hubspot/handlers.ts apps/portal/src/server/hubspot/handlers.partner.test.ts
git commit -m "feat(portal): H4.5 sync partner companies and users to HubSpot through the outbox"
```

### Task 4.6: Registration handlers (create, update end, expire)

**Files:**
- Modify: `apps/portal/src/server/hubspot/handlers.ts`
- Test: `apps/portal/src/server/hubspot/handlers.registration.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// handlers.registration.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeRegistration } from '@/db/test-helpers';
import { registrations } from '@/db/schema';
import { FakeHubspot } from './fake';
import { buildHandlers } from './handlers';
import { DependencyPending } from './types';

const db = testDb();
beforeEach(() => resetDb(db));
const PIPE = 'pipe-1';

const setup = async () => {
  const hs = new FakeHubspot();
  const partner = await makePartner(db, { name: 'Kestrel Systems', domain: 'kestrelsystems.in' });
  const h = buildHandlers(db, hs, PIPE);
  await h['partner.upsert'](partner.id, {});
  const reg = await makeRegistration(db, {
    partnerId: partner.id, customerName: 'Vardhan Capital', customerDomain: 'vardhancapital.in',
    product: 'Clean Libraries', region: 'India', status: 'accepted', protectionEnd: '2027-02-02',
    contacts: [{ name: 'Rohan Mehta', email: 'rohan.mehta@vardhancapital.in' }],
  });
  return { hs, h, partner, reg };
};

describe('registration.create', () => {
  it('creates the deal, the customer company and links partner, customer and contact', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    const saved = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!;
    expect(saved.hubspotDealId).toBeTruthy();
    expect(saved.hubspotStageId).toBe(hs.stageIds.Accepted);
    const kinds = hs.associations.map((a) => a.kind).sort();
    expect(kinds).toEqual(['deal-company:customer', 'deal-company:partner', 'deal-contact']);
    const customer = [...hs.companies.values()].find((c) => c.domain === 'vardhancapital.in')!;
    expect(customer.properties.cleanstart_partner).toBeUndefined();
  });

  it('does not create a second deal when it runs twice (a retry after a timeout)', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await db.update(registrations).set({ hubspotDealId: null }).where(eq(registrations.id, reg.id));
    await h['registration.create'](reg.id, {});
    expect(hs.deals.size).toBe(1);
  });

  it('reuses an existing customer company', async () => {
    const { hs, h, reg } = await setup();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital Pvt Ltd', domain: 'vardhancapital.in', properties: {} });
    await h['registration.create'](reg.id, {});
    expect([...hs.companies.values()].filter((c) => c.domain === 'vardhancapital.in')).toHaveLength(1);
  });

  it('does nothing for a registration that is no longer accepted', async () => {
    const { hs, h, reg } = await setup();
    await db.update(registrations).set({ status: 'rejected' }).where(eq(registrations.id, reg.id));
    await h['registration.create'](reg.id, {});
    expect(hs.deals.size).toBe(0);
  });

  it('maps the stored codes to HubSpot labels and values', async () => {
    const { hs, h, partner } = await setup();
    const reg = await makeRegistration(db, {
      partnerId: partner.id, customerName: 'Gulfway Freight', product: 'images', region: 'middle_east',
      status: 'accepted', protectionEnd: '2027-02-02',
    });
    await h['registration.create'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.properties).toMatchObject({
      dealname: 'Gulfway Freight | CleanStart Images | Kestrel Systems',
      partner_product: 'cleanstart_images',
      partner_region: 'middle_east',
    });
  });
});

describe('registration.update_end and registration.expire', () => {
  it('waits for the deal to exist', async () => {
    const { h, reg } = await setup();
    await expect(h['registration.update_end'](reg.id, {})).rejects.toBeInstanceOf(DependencyPending);
  });

  it('writes the new protection end', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await db.update(registrations).set({ protectionEnd: '2027-03-04' }).where(eq(registrations.id, reg.id));
    await h['registration.update_end'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.properties.protection_end_date).toBe('2027-03-04');
  });

  it('moves the deal to Registration expired', async () => {
    const { hs, h, reg } = await setup();
    await h['registration.create'](reg.id, {});
    await h['registration.expire'](reg.id, {});
    const dealId = (await db.select().from(registrations).where(eq(registrations.id, reg.id)))[0]!.hubspotDealId!;
    expect(hs.deals.get(dealId)?.stageId).toBe(hs.stageIds['Registration expired']);
  });

  it('has nothing to move when an expired registration never reached HubSpot', async () => {
    const { hs, h, reg } = await setup();
    await db.update(registrations).set({ status: 'expired' }).where(eq(registrations.id, reg.id));
    await h['registration.expire'](reg.id, {});
    expect(hs.deals.size).toBe(0);
  });
});
```

`buildHandlers` now takes a third argument, the pipeline id, and an optional fourth, the `Clock` (default `systemClock`; tests that pin a time pass `fixedClock(...)`). Task 4.5's tests already pass `'pipe-1'`; the outbox job passes `config.pipelineId` from `readHubspotConfig()`.

The tests set `product` and `region` as display labels in `setup` and as stored codes in the mapping test: `makeRegistration` accepts either and stores the code (contracts J.3), so the handler must always go through the label maps.

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/handlers.registration.test.ts`. Expected: FAIL ("implemented in task 4.6").

- [ ] **Step 3: Implement**

```ts
// handlers.ts (replace the three stubs; add the pipeline and clock parameters)
import { PARTNER_REGION_LABEL, PRODUCT_LABEL } from '@/lib/domain';
import { type Clock, systemClock } from '@/lib/clock';
import { registrationContacts, registrations } from '@/db/schema';
import { dealProperties } from './mappers';

const REGION_LABEL = PARTNER_REGION_LABEL;

export const buildHandlers = (db: Db, hs: HubspotApi, pipelineId: string, clock: Clock = systemClock): Handlers => {
  const loadReg = async (id: string) => {
    const reg = need((await db.select().from(registrations).where(eq(registrations.id, id)))[0], `registration ${id}`);
    const partner = need((await db.select().from(partners).where(eq(partners.id, reg.partnerId)))[0], `partner ${reg.partnerId}`);
    return { reg, partner };
  };
  const requireDeal = (reg: { id: string; hubspotDealId: string | null }): string => {
    if (!reg.hubspotDealId) throw new DependencyPending(`registration ${reg.id} has no HubSpot deal yet`);
    return reg.hubspotDealId;
  };

  return {
    // ...partner.upsert and user.upsert from task 4.5 unchanged...

    'registration.create': async (registrationId) => {
      const { reg, partner } = await loadReg(registrationId);
      if (reg.status !== 'accepted' || reg.hubspotDealId) return;
      if (!partner.hubspotCompanyId) throw new DependencyPending(`partner ${partner.id} is not in HubSpot yet`);
      if (!reg.protectionEnd) throw new Error(`registration ${reg.id} is accepted without a protection end`);

      const stageIds = await hs.getStageIds(pipelineId);
      let deal = await hs.findDealByRegistrationId(reg.id);
      if (!deal) {
        deal = await hs.createDeal(dealProperties(
          {
            id: reg.id, customerName: reg.customerName, product: PRODUCT_LABEL[reg.product],
            region: REGION_LABEL[reg.region], protectionEnd: reg.protectionEnd,
          },
          { name: partner.name, hubspotCompanyId: partner.hubspotCompanyId }, stageIds, pipelineId,
        ));
      }
      // Save the id first: a failure in the association calls below then retries against the same deal.
      await db.update(registrations).set({ hubspotDealId: deal.id, hubspotStageId: deal.stageId, hubspotSyncedAt: clock.now() })
        .where(eq(registrations.id, reg.id));

      const customer = (await hs.findCompany({ domain: reg.customerDomain, name: reg.customerName }))
        ?? (await hs.createOrUpdateCompany({ existingId: null, name: reg.customerName, domain: reg.customerDomain, properties: {} }));
      await hs.associateDealWithCompany(deal.id, partner.hubspotCompanyId, 'partner');
      await hs.associateDealWithCompany(deal.id, customer.id, 'customer');

      const contacts = await db.select().from(registrationContacts).where(eq(registrationContacts.registrationId, reg.id));
      for (const c of contacts) {
        if (!c.email) continue;
        const [firstName = '', ...rest] = c.name.split(' ');
        const { id } = await hs.upsertContact({ email: c.email, firstName, lastName: rest.join(' '), ...(c.phone ? { phone: c.phone } : {}) });
        await hs.associateDealWithContact(deal.id, id);
        await db.update(registrationContacts).set({ hubspotContactId: id }).where(eq(registrationContacts.id, c.id));
      }
    },

    'registration.update_end': async (registrationId) => {
      const { reg } = await loadReg(registrationId);
      const dealId = requireDeal(reg);
      if (!reg.protectionEnd) return;
      await hs.updateDeal(dealId, { protection_end_date: reg.protectionEnd });
    },

    'registration.expire': async (registrationId) => {
      const { reg } = await loadReg(registrationId);
      // An expired registration that never got a deal (its create never ran, and now never will) has nothing to move.
      if (!reg.hubspotDealId && reg.status === 'expired') return;
      const dealId = requireDeal(reg);
      const stageIds = await hs.getStageIds(pipelineId);
      await hs.updateDeal(dealId, { dealstage: stageIds['Registration expired'] });
      await db.update(registrations).set({ hubspotStageId: stageIds['Registration expired'], hubspotSyncedAt: clock.now() }).where(eq(registrations.id, reg.id));
    },
  };
};
```

The imports at the top of the block join the existing ones in `handlers.ts`. Note the order inside `registration.create`: the deal id is stored before the associations, so a failed association retries against the same deal (the `findDealByRegistrationId` check covers the case where the portal crashed before saving the id).

- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot src/server/jobs/hubspot-outbox.test.ts`. Expected: PASS for every file in the folder, including the Task 4.4 job test (both of its cases now run against the real handlers).

- [ ] **Step 5: Confirm what the enqueue calls must look like (no edits here).** Track R writes them in its own files (contracts G): `actions/decisions.ts` enqueues `registration.create` on accept with `version: String(Date.parse(decidedAt))`, the decision time in milliseconds, not `'1'`; an undone and re-accepted registration then gets a new key instead of colliding with the first (undo is only allowed while no deal exists, `ConflictError('deal_in_crm')` otherwise). `actions/extension.ts` enqueues `registration.update_end` with the new `protection_end` as the version when an extension is granted. `jobs/expiry.ts` enqueues `registration.expire` (Task 4.8). R asserts the outbox row in each action's test. This task edits no file under `src/server/actions/`.

- [ ] **Step 6: Commit** (this commit also stages the Task 4.4 job body and its test, which could not compile before `buildHandlers` had its final form)

```bash
git add apps/portal/src/server/hubspot/handlers.ts apps/portal/src/server/hubspot/handlers.registration.test.ts apps/portal/src/server/jobs/hubspot-outbox.ts apps/portal/src/server/jobs/hubspot-outbox.test.ts
git commit -m "feat(portal): H4.6 create, extend and expire HubSpot deals from approved registrations"
```

### Task 4.7: Customer lookup and conflict check (read only)

**Files:**
- Create: `apps/portal/src/server/hubspot/lookup.ts`
- Test: `apps/portal/src/server/hubspot/lookup.test.ts`

This task is read-only HubSpot logic and edits no action file and not `AdminApprovals.tsx`; track R owns those and calls the two functions below (contracts M.2 item 19, H.20, L).

Rules: the partner-facing lookup returns only name and domain of a matching HubSpot company, and a boolean "known customer". It never returns deals, owners or other partners. The staff-facing conflict check returns the open deals on the customer company that belong to a different partner.

- [ ] **Step 1: Write the failing tests**

```ts
// lookup.test.ts
import { describe, expect, it } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHubspot, readHubspotConfig } from './client';
import { FakeHubspot } from './fake';
import { conflictingDeals, hubspotForRequest, lookupCustomer } from './lookup';

vi.mock('./client', () => ({ readHubspotConfig: vi.fn(), createHubspot: vi.fn() }));

beforeEach(() => {
  vi.mocked(readHubspotConfig).mockReset();
  vi.mocked(createHubspot).mockReset();
});

describe('hubspotForRequest', () => {
  it('is null while HubSpot is not configured, and builds no client', () => {
    vi.mocked(readHubspotConfig).mockReturnValue(null);
    expect(hubspotForRequest()).toBeNull();
    expect(createHubspot).not.toHaveBeenCalled();
  });

  it('returns the client and the pipeline id when HubSpot is configured', () => {
    const hs = new FakeHubspot();
    vi.mocked(readHubspotConfig).mockReturnValue({ token: 'token', pipelineId: 'pipe-1' });
    vi.mocked(createHubspot).mockReturnValue(hs);
    expect(hubspotForRequest()).toEqual({ hs, pipelineId: 'pipe-1' });
  });
});

describe('lookupCustomer', () => {
  it('returns name and domain only', async () => {
    const hs = new FakeHubspot();
    await hs.createOrUpdateCompany({ existingId: null, name: 'Vardhan Capital', domain: 'vardhancapital.in', properties: { secret: 'x' } });
    expect(await lookupCustomer(hs, 'vardhan')).toEqual([{ name: 'Vardhan Capital', domain: 'vardhancapital.in' }]);
  });

  it('returns nothing for a query shorter than 3 characters', async () => {
    expect(await lookupCustomer(new FakeHubspot(), 'va')).toEqual([]);
  });
});

describe('conflictingDeals', () => {
  it('returns open deals on the customer that belong to another partner', async () => {
    const hs = new FakeHubspot();
    const customer = await hs.createOrUpdateCompany({ existingId: null, name: 'Gulfway Freight', domain: 'gulfwayfreight.ae', properties: {} });
    const mine = await hs.createDeal({ dealstage: hs.stageIds.Accepted, partner_company_id: '1' });
    const theirs = await hs.createDeal({ dealstage: hs.stageIds.Discovery, partner_company_id: '2' });
    await hs.associateDealWithCompany(mine.id, customer.id, 'customer');
    await hs.associateDealWithCompany(theirs.id, customer.id, 'customer');
    const found = await conflictingDeals(hs, { customerCompanyId: customer.id, partnerCompanyId: '1', pipelineId: 'p' });
    expect(found.map((d) => d.id)).toEqual([theirs.id]);
  });
});
```

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/lookup.test.ts`. Expected: FAIL, "Cannot find module './lookup'".

- [ ] **Step 3: Implement**

```ts
// lookup.ts
import { createHubspot, readHubspotConfig } from './client';
import type { HsDeal, HubspotApi } from './types';

/**
 * The read only client for a request path (contracts H.13c): null when HubSpot is not configured, otherwise the client
 * and the pipeline id. Track R calls this and nothing else of the client; a thrown error from createHubspot() is the
 * caller's "no suggestions".
 */
export const hubspotForRequest = (): { hs: HubspotApi; pipelineId: string } | null => {
  const config = readHubspotConfig();
  return config ? { hs: createHubspot(), pipelineId: config.pipelineId } : null;
};

export const lookupCustomer = async (hs: HubspotApi, query: string): Promise<Array<{ name: string; domain: string | null }>> => {
  if (query.trim().length < 3) return [];
  const found = await hs.searchCompanies(query.trim());
  return found.flatMap((c) => (c.name ? [{ name: c.name, domain: c.domain }] : []));
};

export const conflictingDeals = async (
  hs: HubspotApi,
  input: { customerCompanyId: string; partnerCompanyId: string; pipelineId: string },
): Promise<HsDeal[]> => {
  const open = await hs.listOpenDealsForCompany(input.customerCompanyId, input.pipelineId);
  return open.filter((d) => d.properties.partner_company_id && d.properties.partner_company_id !== input.partnerCompanyId);
};
```

- [ ] **Step 4: Run the tests.** Expected: PASS, 5 tests (2 for `hubspotForRequest`, 2 for `lookupCustomer`, 1 for `conflictingDeals`).

- [ ] **Step 5: Confirm how track R uses it (no edits here).** R's `lookupCustomerAction(query)` (partner roles that may register deals; rate limited to 10 calls per 60 seconds per user through `rateLimit('lookup:user:<id>', ...)`) gets the client from `hubspotForRequest()` and calls `lookupCustomer(hs, query)`; it returns the same response shape to every user and no deal data. R's approvals screen calls `hs.findCompany` for the customer, then `conflictingDeals(hs, { customerCompanyId, partnerCompanyId, pipelineId })` with `partners.hubspot_company_id` and the pipeline id from `hubspotForRequest()`, and shows the existing hint ("Another partner already holds this customer"). Any error from HubSpot, and a null from `hubspotForRequest()` (HubSpot not configured), degrades to "no suggestions" and the portal-only check: a decision is never blocked on HubSpot being up. R gets its client from `hubspotForRequest()` (contracts H.13c, added in this task); it never imports `createHubspot` itself. The signatures `lookupCustomer(hs, query)`, `conflictingDeals(hs, input)` and `hubspotForRequest()` are fixed so R can code against them.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/server/hubspot/lookup.ts apps/portal/src/server/hubspot/lookup.test.ts
git commit -m "feat(portal): H4.7 HubSpot customer lookup and cross-partner conflict check"
```

### Task 4.8: Inbound poll, expiry job and reconcile

**Files:**
- Create: `apps/portal/src/server/hubspot/poll.ts`
- Modify (bodies only; W0-c created each as an empty `export const runX = async (): Promise<void> => {}`; keep the export names): `apps/portal/src/server/jobs/hubspot-poll.ts`, `apps/portal/src/server/jobs/expiry.ts`, `apps/portal/src/server/jobs/reconcile.ts`
- Test: `apps/portal/src/server/hubspot/poll.test.ts`, `apps/portal/src/server/jobs/expiry.test.ts`, `apps/portal/src/server/jobs/hubspot-poll.test.ts`, `apps/portal/src/server/jobs/reconcile.test.ts`

Do not edit `jobs/index.ts`: W0-c already registers `hubspot-poll` (every 5 minutes), `expiry` (00:10 UTC) and `hubspot-reconcile` (02:30 UTC). The reminder emails 14 and 3 days before the end are `jobs/expiry-reminders.ts`, which track R owns; this task only expires. After a change commits, the poll and the expiry job call `announceRegistrationChange` from track R's `src/server/registrations/announce.ts`, which W0-c created as a no-op stub (contracts H.17): import it, never edit it, and keep the call wrapped so a failure only logs. Every state change here writes its audit entry through `recordAudit` (contracts F.4) and never inserts into `audit_log` directly; the poll's `registration_events` insert is unchanged (`partner_id` is filled by the child trigger).

- [ ] **Step 1: Write the failing poll tests**

```ts
// poll.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeSyncedDeal, resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { announceRegistrationChange } from '@/server/registrations/announce';
import { FakeHubspot } from './fake';
import { enqueue } from './outbox';
import { pollDeals, reconcileDeals } from './poll';

vi.mock('@/server/registrations/announce', () => ({ announceRegistrationChange: vi.fn(async () => undefined) }));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  vi.mocked(announceRegistrationChange).mockClear();
});
const PIPE = 'pipe-1';
const clock = fixedClock('2026-11-06T10:00:00Z');

const seed = async (hs: FakeHubspot, n = 1) => {
  const partner = await makePartner(db, {});
  const regs = [];
  for (let i = 0; i < n; i++) regs.push(await makeSyncedDeal(db, hs, { partnerId: partner.id, customerName: `Customer ${i}` }));
  return regs;
};

describe('pollDeals', () => {
  it('applies a stage move, writes a timeline event and stores the cursor', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(1);
    const reg = (await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!;
    expect(reg).toMatchObject({ stage: 'Technical evaluation', status: 'accepted' });
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id));
    expect(events.map((e) => [e.text, e.source])).toContainEqual(['Stage moved to Technical evaluation', 'crm']);
    expect((await db.select().from(hubspotSyncState))[0]!.key).toBe('deals_cursor');
  });

  it('writes the audit entry through recordAudit, as the HubSpot sync actor', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    const reg = (await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!;
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: 'registration.stage_changed', kind: 'deal_decisions', who: 'sync', source: 'crm',
      actorLabel: 'HubSpot sync', partnerId: reg.partnerId, subjectType: 'registration',
      note: 'Stage moved to Discovery',
    });
  });

  it('writes the protection end event name when only the end date changed', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-03-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id));
    expect(entries.map((e) => e.event)).toEqual(['registration.protection_end_changed']);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-03-01');
  });

  it('is idempotent: polling twice records one event and one audit entry', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id))).toHaveLength(1);
    expect(await db.select().from(auditLog).where(eq(auditLog.subjectId, r!.id))).toHaveLength(1);
  });

  it('walks every page when HubSpot returns more than one', async () => {
    const hs = new FakeHubspot();
    const regs = await seed(hs, 5);
    for (const r of regs) await hs.updateDeal(r.dealId, { dealstage: hs.stageIds.Discovery });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(5);
  });

  it('skips a deal the portal does not know and keeps going', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.createDeal({ dealstage: hs.stageIds.Accepted, portal_registration_id: 'ghost' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Closed won'], closedate: '2026-12-01' });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out).toMatchObject({ applied: 1, unknown: 1 });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({ status: 'won', closedOn: '2026-12-01' });
  });

  it('keeps a granted extension while its update_end write is queued, and still applies the stage', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await enqueue(db, { op: 'registration.update_end', subjectId: r!.id, version: '2027-03-04' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({
      stage: 'Technical evaluation', protectionEnd: '2027-03-04',
    });
  });

  it('keeps the same extension when the queued write has failed (HubSpot still holds the old date)', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await enqueue(db, { op: 'registration.update_end', subjectId: r!.id, version: '2027-03-04' });
    await db.update(hubspotOutbox).set({ status: 'failed' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-03-04');
  });

  it('never moves a granted extension backwards, even when the write is done and HubSpot reads stale', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery, protection_end_date: '2027-02-02' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({
      stage: 'Discovery', protectionEnd: '2027-03-04',
    });
  });

  it('still takes a later end date typed in HubSpot for a registration that has an extension', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await db.update(registrations).set({ protectionEnd: '2027-03-04', extensionStatus: 'granted' }).where(eq(registrations.id, r!.id));
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-05-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.protectionEnd).toBe('2027-05-01');
  });

  it('announces a stage move once, and an end date change in the app only', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Technical evaluation'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenCalledTimes(1);
    expect(announceRegistrationChange).toHaveBeenCalledWith({ db }, { registrationId: r!.id, kind: 'stage_changed', stage: 'Technical evaluation' });
    await hs.updateDeal(r!.dealId, { protection_end_date: '2027-03-01' });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenLastCalledWith({ db }, { registrationId: r!.id, kind: 'protection_end_changed', protectionEnd: '2027-03-01' });
  });

  it('does not announce the echo of the portal own expiry, but does announce an expiry made in HubSpot', async () => {
    const hs = new FakeHubspot();
    const [mine, theirs] = await seed(hs, 2);
    await db.update(registrations).set({ status: 'expired', stage: 'Registration expired' }).where(eq(registrations.id, mine!.id));
    await hs.updateDeal(mine!.dealId, { dealstage: hs.stageIds['Registration expired'] });
    await hs.updateDeal(theirs!.dealId, { dealstage: hs.stageIds['Registration expired'] });
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(announceRegistrationChange).toHaveBeenCalledTimes(1);
    expect(announceRegistrationChange).toHaveBeenCalledWith({ db }, { registrationId: theirs!.id, kind: 'expired' });
  });

  it('a failing announcement is logged and does not fail the poll', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    vi.mocked(announceRegistrationChange).mockRejectedValueOnce(new Error('smtp down'));
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(out.applied).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!.stage).toBe('Discovery');
  });

  it('records the poll time even when nothing changed, so the health card can show it', async () => {
    const hs = new FakeHubspot();
    await pollDeals({ db, hs, pipelineId: PIPE, clock });
    expect(await db.select().from(hubspotSyncState)).toHaveLength(1);
  });

  it('does not advance the cursor when HubSpot errors', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    hs.failNext = new Error('429');
    await expect(pollDeals({ db, hs, pipelineId: PIPE, clock })).rejects.toThrow('429');
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });
});

describe('reconcileDeals', () => {
  it('flags a deal that no longer exists in HubSpot and leaves the status alone', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    hs.deals.delete(r!.dealId);
    const out = await reconcileDeals({ db, hs });
    expect(out.missing).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({ hubspotMissing: true, status: 'accepted' });
  });
});
```

`makeSyncedDeal` is a Wave 0 helper (contracts J.3, `src/db/test-helpers.ts`): it creates an accepted registration and the matching deal in the fake, stores the deal id and the Accepted stage id on the registration, and returns `{ id, dealId }`. It relies only on `FakeHubspot.stageIds` and `FakeHubspot.createDeal`, which Task 4.2 must not rename.

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/poll.test.ts`. Expected: FAIL, "Cannot find module './poll'".

- [ ] **Step 3: Implement**

```ts
// poll.ts
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { hubspotOutbox, hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import type { Clock } from '@/lib/clock';
import { PRODUCT_LABEL } from '@/lib/domain';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { log } from '@/server/log';
import { announceRegistrationChange, type RegistrationChange } from '@/server/registrations/announce';
import { decideInbound, isoDate } from './mappers';
import type { HsDeal, HubspotApi } from './types';

const CURSOR_KEY = 'deals_cursor';
/** HubSpot search indexing lags by a few seconds, so each poll re-reads a minute of overlap. Applying is idempotent. */
const OVERLAP_MS = 60_000;

export interface PollResult { applied: number; unchanged: number; unknown: number }

/**
 * True when the portal's end date must win over the one HubSpot reports for this registration in this pass: an
 * extension write (`registration.update_end`) is still queued or has failed, so HubSpot holds the old date, or the
 * registration has a granted extension and HubSpot reports an earlier date than ours (search index lag after the write
 * was sent). The portal's extension is never moved backwards by the poll; a later date typed in HubSpot still applies.
 */
const portalEndDateWins = async (
  db: Db,
  reg: { id: string; protectionEnd: string | null; extensionStatus: string },
  incomingEnd: string | null,
): Promise<boolean> => {
  if (reg.extensionStatus === 'granted' && incomingEnd !== null && reg.protectionEnd !== null && incomingEnd < reg.protectionEnd) return true;
  const [queued] = await db.select({ id: hubspotOutbox.id }).from(hubspotOutbox)
    .where(and(
      eq(hubspotOutbox.op, 'registration.update_end'),
      eq(hubspotOutbox.subjectId, reg.id),
      inArray(hubspotOutbox.status, ['pending', 'failed']),
    ))
    .limit(1);
  return queued !== undefined;
};

/** What partners are told after a change commits. An echo of our own expiry (the portal already expired it) says nothing. */
const announcementFor = (
  reg: { id: string; status: string },
  change: { status: string; stage: string; changed: 'stage' | 'protection_end'; protectionEnd: string | null },
): RegistrationChange | null => {
  if (change.status === 'expired') return reg.status === 'expired' ? null : { registrationId: reg.id, kind: 'expired' };
  if (change.changed === 'stage') return { registrationId: reg.id, kind: 'stage_changed', stage: change.stage };
  return change.protectionEnd ? { registrationId: reg.id, kind: 'protection_end_changed', protectionEnd: change.protectionEnd } : null;
};

export const pollDeals = async (deps: {
  db: Db; hs: HubspotApi; pipelineId: string; clock: Clock;
}): Promise<PollResult> => {
  const { db, hs } = deps;
  const state = (await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, CURSOR_KEY)))[0];
  const cursor = (state?.value as { ms?: number } | undefined)?.ms ?? 0;
  const stageIds = await hs.getStageIds(deps.pipelineId);
  const labelById = Object.fromEntries(Object.entries(stageIds).map(([label, id]) => [id, label]));

  const result: PollResult = { applied: 0, unchanged: 0, unknown: 0 };
  let newest = cursor;
  let after: string | null = null;
  do {
    const page = await hs.searchDealsModifiedSince(deps.pipelineId, Math.max(0, cursor - OVERLAP_MS), after);
    for (const deal of page.deals) {
      newest = Math.max(newest, deal.modifiedAt);
      const reg = (await db.select().from(registrations).where(eq(registrations.hubspotDealId, deal.id)))[0];
      if (!reg) { result.unknown += 1; continue; }
      const seen: HsDeal = await portalEndDateWins(db, reg, isoDate(deal.properties.protection_end_date))
        ? { ...deal, properties: { ...deal.properties, protection_end_date: null } }
        : deal;
      const change = decideInbound(
        { status: reg.status, hubspotStageId: reg.hubspotStageId, protectionEnd: reg.protectionEnd },
        seen, labelById, deps.clock.today(),
      );
      if (!change) { result.unchanged += 1; continue; }
      await db.transaction(async (tx) => {
        await tx.update(registrations).set({
          status: change.status, stage: change.stage, hubspotStageId: change.stageId, hubspotSyncedAt: deps.clock.now(),
          hubspotMissing: false, ...(change.closedOn ? { closedOn: change.closedOn } : {}),
          ...(change.protectionEnd ? { protectionEnd: change.protectionEnd } : {}),
        }).where(eq(registrations.id, reg.id));
        await tx.insert(registrationEvents).values({
          registrationId: reg.id, text: change.eventText, byLabel: 'HubSpot', source: 'crm',
        });
        await recordAudit(tx, SYSTEM_ACTORS.hubspot, {
          event: change.changed === 'stage' ? 'registration.stage_changed' : 'registration.protection_end_changed',
          source: 'crm',
          target: `${reg.customerName}, ${PRODUCT_LABEL[reg.product]}`,
          note: change.eventText,
          partnerId: reg.partnerId,
          subject: { type: 'registration', id: reg.id },
        });
      });
      result.applied += 1;
      const announcement = announcementFor(reg, change);
      if (announcement) {
        await announceRegistrationChange({ db }, announcement).catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
      }
    }
    after = page.next;
  } while (after);

  // Written after every successful run, even when nothing moved: updated_at is the last poll time the health card reports.
  await db.insert(hubspotSyncState).values({ key: CURSOR_KEY, value: { ms: newest } })
    .onConflictDoUpdate({ target: hubspotSyncState.key, set: { value: { ms: newest } } });
  return result;
};

export const reconcileDeals = async (deps: { db: Db; hs: HubspotApi }): Promise<{ checked: number; missing: number }> => {
  const rows = await deps.db.select().from(registrations)
    .where(and(isNotNull(registrations.hubspotDealId), inArray(registrations.status, ['accepted', 'expired'])));
  const ids = rows.map((r) => r.hubspotDealId!).filter(Boolean);
  const found = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    for (const d of await deps.hs.readDeals(ids.slice(i, i + 100))) found.add(d.id);
  }
  let missing = 0;
  for (const r of rows) {
    const gone = !found.has(r.hubspotDealId!);
    if (gone) missing += 1;
    if (gone !== r.hubspotMissing) {
      await deps.db.update(registrations).set({ hubspotMissing: gone }).where(eq(registrations.id, r.id));
    }
  }
  return { checked: rows.length, missing };
};
```

- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/poll.test.ts`. Expected: PASS, 16 tests (7 new: four for the extension rule, two for announcements and one for a failing announcement). Why the cursor test passes: the poller only writes the cursor after the loop completes, so a thrown error leaves it untouched.

- [ ] **Step 5: Write the failing expiry tests**

`expireRegistrations` is the pure core (the clock is an argument); `runExpiry` is the job body. Expiry is a portal rule and does not depend on HubSpot: with HubSpot unconfigured the job still expires registrations and still queues `registration.expire` (a database write), the queued rows wait in the outbox until HubSpot is configured, and the job logs a warning.

```ts
// src/server/jobs/expiry.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeRegistration, resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, registrations } from '@/db/schema';
import { fixedClock } from '@/lib/clock';
import { announceRegistrationChange } from '@/server/registrations/announce';
import { expireRegistrations, runExpiry } from './expiry';

vi.mock('@/server/hubspot/client', () => ({ readHubspotConfig: () => null }));
vi.mock('@/server/registrations/announce', () => ({ announceRegistrationChange: vi.fn(async () => undefined) }));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  vi.mocked(announceRegistrationChange).mockClear();
});

describe('expireRegistrations', () => {
  it('expires accepted registrations whose protection ended and queues the HubSpot write', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    const live = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-06', customerName: 'Live Co' });
    const won = await makeRegistration(db, { partnerId: p.id, status: 'won', protectionEnd: '2026-01-01', customerName: 'Won Co' });
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, old.id)))[0]).toMatchObject({ status: 'expired', stage: 'Registration expired', closedOn: '2026-11-06' });
    expect((await db.select().from(registrations).where(eq(registrations.id, live.id)))[0]!.status).toBe('accepted');
    expect((await db.select().from(registrations).where(eq(registrations.id, won.id)))[0]!.status).toBe('won');
    expect((await db.select().from(hubspotOutbox)).map((r) => [r.op, r.idempotencyKey])).toEqual([
      ['registration.expire', `registration.expire:${old.id}:2026-11-06`],
    ]);
  });

  it('writes one audit entry per expired registration through recordAudit', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    const entries = await db.select().from(auditLog).where(eq(auditLog.subjectId, old.id));
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      event: 'registration.expired', kind: 'deal_decisions', who: 'sync', source: 'system',
      actorLabel: 'CleanStart', partnerId: p.id, subjectType: 'registration',
    });
  });

  it('announces each expiry once, after it committed, and a failing announcement does not stop the job', async () => {
    const p = await makePartner(db, {});
    const a = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05', customerName: 'A Co' });
    const b = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-04', customerName: 'B Co' });
    vi.mocked(announceRegistrationChange).mockRejectedValueOnce(new Error('smtp down'));
    const out = await expireRegistrations({ db, clock: fixedClock('2026-11-06T00:10:00Z') });
    expect(out.expired).toBe(2);
    expect(vi.mocked(announceRegistrationChange).mock.calls.map(([, change]) => change)).toEqual(
      expect.arrayContaining([{ registrationId: a.id, kind: 'expired' }, { registrationId: b.id, kind: 'expired' }]),
    );
    expect(announceRegistrationChange).toHaveBeenCalledTimes(2);
  });

  it('does nothing the second time it runs on the same day', async () => {
    const p = await makePartner(db, {});
    await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    const clock = fixedClock('2026-11-06T00:10:00Z');
    await expireRegistrations({ db, clock });
    expect((await expireRegistrations({ db, clock })).expired).toBe(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('runExpiry', () => {
  it('still expires and queues the HubSpot write while HubSpot is not configured', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2020-01-01' });
    await runExpiry();
    expect((await db.select().from(registrations).where(eq(registrations.id, old.id)))[0]!.status).toBe('expired');
    expect((await db.select().from(hubspotOutbox)).map((r) => r.op)).toEqual(['registration.expire']);
  });
});
```

Protection runs through the end date, so a registration whose `protection_end` is today is still protected (the `live` row), matching the mock's `daysLeft`.

- [ ] **Step 6: Implement the expiry job**

```ts
// src/server/jobs/expiry.ts
import { and, eq, lt, sql } from 'drizzle-orm';
import { db, type Db } from '@/db/client';
import { registrationEvents, registrations } from '@/db/schema';
import { type Clock, systemClock } from '@/lib/clock';
import { PRODUCT_LABEL } from '@/lib/domain';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { readHubspotConfig } from '@/server/hubspot/client';
import { enqueue } from '@/server/hubspot/outbox';
import { log } from '@/server/log';
import { announceRegistrationChange } from '@/server/registrations/announce';

export const expireRegistrations = async (deps: { db: Db; clock: Clock }): Promise<{ expired: number }> => {
  const today = deps.clock.today();
  const due = await deps.db.select().from(registrations)
    .where(and(eq(registrations.status, 'accepted'), lt(registrations.protectionEnd, today)));
  for (const reg of due) {
    await deps.db.transaction(async (tx) => {
      await tx.update(registrations).set({ status: 'expired', stage: 'Registration expired', closedOn: today, updatedAt: sql`now()` })
        .where(eq(registrations.id, reg.id));
      await tx.insert(registrationEvents).values({
        registrationId: reg.id, text: 'Protection ended, registration expired', byLabel: 'Portal', source: 'system',
      });
      await recordAudit(tx, SYSTEM_ACTORS.portal, {
        event: 'registration.expired',
        source: 'system',
        target: `${reg.customerName}, ${PRODUCT_LABEL[reg.product]}`,
        note: `Protection ended on ${reg.protectionEnd ?? today}`,
        partnerId: reg.partnerId,
        subject: { type: 'registration', id: reg.id },
      });
      await enqueue(tx, { op: 'registration.expire', subjectId: reg.id, version: today });
    });
    // After commit; the partner hears about it, and a failure here must never undo or stop an expiry.
    await announceRegistrationChange({ db: deps.db }, { registrationId: reg.id, kind: 'expired' })
      .catch((error: unknown) => log.warn({ err: error }, 'announce failed'));
  }
  return { expired: due.length };
};

export const runExpiry = async (): Promise<void> => {
  const { expired } = await expireRegistrations({ db, clock: systemClock });
  if (expired === 0) return;
  log.info({ job: 'expiry', expired }, 'registrations expired');
  if (!readHubspotConfig()) log.warn({ job: 'expiry', expired }, 'HubSpot is not configured; registration.expire writes wait in the outbox');
};
```

- [ ] **Step 7: Run the tests and write the poll and reconcile job bodies.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot src/server/jobs/expiry.test.ts`. Expected: PASS. Then replace the two stubs. Each job reads the configuration first and returns with a warning when the token or the pipeline id is unset, builds its dependencies the way `hubspot-outbox.ts` does, and reads the date through `systemClock`:

```ts
// src/server/jobs/hubspot-poll.ts
import { db } from '@/db/client';
import { systemClock } from '@/lib/clock';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { pollDeals } from '@/server/hubspot/poll';
import { log } from '@/server/log';

export const runHubspotPoll = async (): Promise<void> => {
  const config = readHubspotConfig();
  if (!config) {
    log.warn({ job: 'hubspot-poll' }, 'HubSpot is not configured; poll skipped');
    return;
  }
  const result = await pollDeals({ db, hs: createHubspot(), pipelineId: config.pipelineId, clock: systemClock });
  if (result.applied > 0 || result.unknown > 0) log.info({ job: 'hubspot-poll', ...result }, 'HubSpot changes applied');
};
```

(`triggerPoll` is added to this same file in Task 4.9.)

```ts
// src/server/jobs/reconcile.ts
import { db } from '@/db/client';
import { createHubspot, readHubspotConfig } from '@/server/hubspot/client';
import { reconcileDeals } from '@/server/hubspot/poll';
import { log } from '@/server/log';

export const runReconcile = async (): Promise<void> => {
  if (!readHubspotConfig()) {
    log.warn({ job: 'hubspot-reconcile' }, 'HubSpot is not configured; reconcile skipped');
    return;
  }
  const result = await reconcileDeals({ db, hs: createHubspot() });
  if (result.missing > 0) log.warn({ job: 'hubspot-reconcile', ...result }, 'deals missing in HubSpot');
};
```

Job tests (both follow the Task 4.4 job test: the client module is mocked so no network is touched):

```ts
// src/server/jobs/hubspot-poll.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDb, testDb } from '@/db/test-helpers';
import { hubspotSyncState } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { runHubspotPoll } from './hubspot-poll';

const mocks = vi.hoisted(() => ({
  config: null as { token: string; pipelineId: string } | null,
  createHubspot: vi.fn(),
}));
vi.mock('@/server/hubspot/client', () => ({
  readHubspotConfig: () => mocks.config,
  createHubspot: mocks.createHubspot,
}));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mocks.config = null;
  mocks.createHubspot.mockReset();
});

describe('runHubspotPoll', () => {
  it('does nothing while HubSpot is not configured', async () => {
    await runHubspotPoll();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });

  it('polls and stores the cursor when HubSpot is configured', async () => {
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(new FakeHubspot());
    await runHubspotPoll();
    expect((await db.select().from(hubspotSyncState))[0]!.key).toBe('deals_cursor');
  });
});
```

```ts
// src/server/jobs/reconcile.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { makePartner, makeSyncedDeal, resetDb, testDb } from '@/db/test-helpers';
import { registrations } from '@/db/schema';
import { FakeHubspot } from '@/server/hubspot/fake';
import { runReconcile } from './reconcile';

const mocks = vi.hoisted(() => ({
  config: null as { token: string; pipelineId: string } | null,
  createHubspot: vi.fn(),
}));
vi.mock('@/server/hubspot/client', () => ({
  readHubspotConfig: () => mocks.config,
  createHubspot: mocks.createHubspot,
}));

const db = testDb();
beforeEach(async () => {
  await resetDb(db);
  mocks.config = null;
  mocks.createHubspot.mockReset();
});

describe('runReconcile', () => {
  it('does nothing while HubSpot is not configured', async () => {
    await runReconcile();
    expect(mocks.createHubspot).not.toHaveBeenCalled();
  });

  it('flags a deal that is gone from HubSpot when configured', async () => {
    const hs = new FakeHubspot();
    mocks.config = { token: 'token', pipelineId: 'pipe-1' };
    mocks.createHubspot.mockReturnValue(hs);
    const partner = await makePartner(db, {});
    const deal = await makeSyncedDeal(db, hs, { partnerId: partner.id, customerName: 'Gone Co' });
    hs.deals.delete(deal.dealId);
    await runReconcile();
    expect((await db.select().from(registrations).where(eq(registrations.id, deal.id)))[0]!.hubspotMissing).toBe(true);
  });
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/portal/src/server/hubspot/poll.ts apps/portal/src/server/hubspot/poll.test.ts apps/portal/src/server/jobs/hubspot-poll.ts apps/portal/src/server/jobs/hubspot-poll.test.ts apps/portal/src/server/jobs/expiry.ts apps/portal/src/server/jobs/expiry.test.ts apps/portal/src/server/jobs/reconcile.ts apps/portal/src/server/jobs/reconcile.test.ts
git commit -m "feat(portal): H4.8 poll HubSpot deal stages, expire registrations nightly, reconcile missing deals"
```

### Task 4.9: Webhook trigger

The webhook makes stage changes show up in seconds instead of minutes; the 5 minute poll stays as the safety net, so a missed or delayed webhook costs nothing. Build the receiver as written, but confirm in Task 0.1 that our plan lets the private app subscribe to `deal.propertyChange` for `dealstage` and `protection_end_date`. If it does not, skip this task and ship polling alone. In an unattended build the capability check is a stub (`docs/partner-portal/HUBSPOT-CAPABILITIES.md`, every answer `UNVERIFIED`): build the receiver as written, since it is exercised only by unit tests until a person configures the subscription, and note the `UNVERIFIED` item in the progress log.

**Files:**
- Create: `apps/portal/src/app/api/hubspot/webhook/route.ts`, `apps/portal/src/server/hubspot/signature.ts`
- Modify (add one export; W0-c created the file with `runHubspotPoll`, which Task 4.8 filled): `apps/portal/src/server/jobs/hubspot-poll.ts`
- Test: `apps/portal/src/server/hubspot/signature.test.ts`, `apps/portal/src/app/api/hubspot/webhook/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// signature.test.ts
import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verifyV3 } from './signature';

const secret = 's3cret';
const sign = (method: string, uri: string, body: string, ts: string): string =>
  createHmac('sha256', secret).update(`${method}${uri}${body}${ts}`).digest('base64');

describe('verifyV3', () => {
  const now = 1_800_000_000_000;
  const ts = String(now - 1000);
  const uri = 'https://partners.cleanstart.com/api/hubspot/webhook';
  const body = '[{"objectId":1}]';

  it('accepts a valid signature', () => {
    expect(verifyV3({ secret, method: 'POST', uri, body, timestamp: ts, signature: sign('POST', uri, body, ts), now })).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifyV3({ secret, method: 'POST', uri, body: '[]', timestamp: ts, signature: sign('POST', uri, body, ts), now })).toBe(false);
  });
  it('rejects a timestamp older than 5 minutes', () => {
    const old = String(now - 6 * 60_000);
    expect(verifyV3({ secret, method: 'POST', uri, body, timestamp: old, signature: sign('POST', uri, body, old), now })).toBe(false);
  });
});
```

- [ ] **Step 2: Run and confirm it fails.** Expected: FAIL, "Cannot find module './signature'".

- [ ] **Step 3: Implement**

```ts
// signature.ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export const verifyV3 = (i: {
  secret: string; method: string; uri: string; body: string; timestamp: string; signature: string; now: number;
}): boolean => {
  if (Math.abs(i.now - Number(i.timestamp)) > 5 * 60_000) return false;
  const expected = createHmac('sha256', i.secret).update(`${i.method}${i.uri}${i.body}${i.timestamp}`).digest();
  const given = Buffer.from(i.signature, 'base64');
  return given.length === expected.length && timingSafeEqual(given, expected);
};
```

- [ ] **Step 4: The route.** It answers 503 when `HUBSPOT_WEBHOOK_SECRET` is unset (the secret is optional outside production, contracts I and L), otherwise verifies the signature and triggers the same poll the scheduler runs. The lock makes an overlapping trigger a no-op, and the next scheduled poll catches anything that arrived while one was running. Sign the URL HubSpot called, not the internal one Caddy forwards to, so use `APP_URL`.

```ts
// src/app/api/hubspot/webhook/route.ts
import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { verifyV3 } from '@/server/hubspot/signature';
import { triggerPoll } from '@/server/jobs/hubspot-poll';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.HUBSPOT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'webhook not configured' }, { status: 503 });
  const body = await request.text();
  const valid = verifyV3({
    secret,
    method: 'POST',
    uri: `${env.APP_URL}/api/hubspot/webhook`,
    body,
    timestamp: request.headers.get('x-hubspot-request-timestamp') ?? '',
    signature: request.headers.get('x-hubspot-signature-v3') ?? '',
    now: Date.now(),
  });
  if (!valid) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  void triggerPoll().catch((err: unknown) => Sentry.captureException(err, { tags: { job: 'hubspot-poll', trigger: 'webhook' } }));
  return NextResponse.json({ ok: true });
}
```

```ts
// in src/server/jobs/hubspot-poll.ts (add the pool and lock imports to the existing ones, and this export under runHubspotPoll)
import { pool } from '@/db/client';
import { runLocked } from './lock';

export const triggerPoll = (): Promise<boolean> => runLocked(pool, 'hubspot-poll', runHubspotPoll);
```

The route test (`webhook/route.test.ts`) mocks `@/env` (the secret set, then unset) and `triggerPoll`, and asserts: the secret unset returns 503 without calling it; a bad signature returns 401 without calling it; a valid one returns 200 and calls it once; a rejected `triggerPoll` still returns 200 and reaches Sentry. Verify the header names and which secret signs a private app's webhooks against HubSpot's current docs for the app type Task 0.1 found before relying on them.

- [ ] **Step 5: Configure the subscription (manual, developer account or sandbox first).** In the private app's Webhooks settings: target URL `https://partners.cleanstart.com/api/hubspot/webhook`, subscriptions `deal.propertyChange` for `dealstage` and for `protection_end_date`. While developing, expose the local server with a Cloudflare Tunnel (`cloudflared`), not ngrok, whose interstitial page breaks requests. In production, make sure the Cloudflare WAF rule set in front of `partners.cleanstart.com` does not challenge HubSpot's requests to `/api/hubspot/webhook` (a skip rule scoped to that path, with the signature check as the real gate).

- [ ] **Step 6: Run tests, commit**

```bash
git add apps/portal/src/app/api/hubspot apps/portal/src/server/hubspot/signature.ts apps/portal/src/server/hubspot/signature.test.ts apps/portal/src/server/jobs/hubspot-poll.ts
git commit -m "feat(portal): H4.9 verified HubSpot webhook trigger that runs the same poll"
```

### Task 4.10: Health data, smoke script, partner import and production provisioning

**Files:**
- Create: `apps/portal/src/server/repo/integration-health.ts`, `apps/portal/scripts/hubspot-smoke.ts`, `apps/portal/scripts/import-partners.ts`, `docs/partner-portal/HUBSPOT-PROVISIONING.md`
- Test: `apps/portal/src/server/repo/integration-health.test.ts`, `apps/portal/scripts/import-partners.test.ts`

Not edited here: `AdminAudit.tsx` and the health card. Track A builds `src/components/audit/IntegrationHealthCard.tsx` from this task's `integrationHealth`, the `/admin/audit` page passes the DTO in, and A's `retryFailedOutboxAction` calls this task's `retryFailedOutbox` and writes the `integration.outbox_retried` audit entry. Also not edited: `docs/operations/PARTNER-PORTAL.md`, which W2-f owns; the runbook below lives in `docs/partner-portal/HUBSPOT-PROVISIONING.md` and W2-f links to it.

`integrationHealth` and `retryFailedOutbox` are the contracts H.13b signatures. `integrationHealth` takes `Pick<Db | Tx, 'select'>` and no viewer: it is registered in the isolation matrix with scope `rls-only`, and its page calls it inside `withViewer` for a partner manager, where row level security gives a partner transaction zeros. Like every repo module, the file ends with an `isolation` export (contracts F.6); the central isolation test fails when a function is missing from it.

- [ ] **Step 1: Write the failing test**

```ts
// integration-health.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { asPartner, asStaff, resetDb, testDb } from '@/db/test-helpers';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';
import { ForbiddenError } from '@/server/errors';
import { withViewer } from './context';
import { integrationHealth, retryFailedOutbox } from './integration-health';

const db = testDb();
beforeEach(() => resetDb(db));

const seedOutbox = async (): Promise<void> => {
  await db.insert(hubspotOutbox).values([
    { op: 'partner.upsert', subjectId: 'a', payload: {}, idempotencyKey: 'a', status: 'pending' },
    { op: 'partner.upsert', subjectId: 'b', payload: {}, idempotencyKey: 'b', status: 'failed', attempts: 6, lastError: 'boom' },
    { op: 'partner.upsert', subjectId: 'c', payload: {}, idempotencyKey: 'c', status: 'failed', attempts: 6, lastError: 'boom' },
    { op: 'partner.upsert', subjectId: 'd', payload: {}, idempotencyKey: 'd', status: 'done' },
  ]);
};

describe('integrationHealth', () => {
  it('reports pending and failed counts and the last poll time', async () => {
    await db.insert(hubspotOutbox).values([
      { op: 'partner.upsert', subjectId: 'a', payload: {}, idempotencyKey: 'a', status: 'pending' },
      { op: 'partner.upsert', subjectId: 'b', payload: {}, idempotencyKey: 'b', status: 'failed', lastError: 'boom' },
    ]);
    await db.insert(hubspotSyncState).values({ key: 'deals_cursor', value: { ms: 1 }, updatedAt: new Date('2026-11-06T10:00:00Z') });
    expect(await integrationHealth(db)).toMatchObject({ pending: 1, failed: 1, lastPollAt: new Date('2026-11-06T10:00:00Z'), lastError: 'boom' });
  });

  it('reads as zeros inside a partner transaction, because row level security hides the outbox', async () => {
    await seedOutbox();
    const partner = await asPartner(db);
    const health = await withViewer(partner, (tx) => integrationHealth(tx));
    expect(health).toEqual({ pending: 0, failed: 0, lastPollAt: null, lastError: null });
  });
});

describe('retryFailedOutbox', () => {
  it('sets failed rows back to pending with attempts 0 for staff and reports how many', async () => {
    await seedOutbox();
    const staff = await asStaff(db, 'partner_manager');
    const count = await withViewer(staff, (tx) => retryFailedOutbox(tx, staff));
    expect(count).toBe(2);
    const rows = await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.idempotencyKey, 'b'));
    expect(rows[0]).toMatchObject({ status: 'pending', attempts: 0, lastError: null });
    expect((await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.status, 'failed')))).toHaveLength(0);
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => retryFailedOutbox(tx, partner))).rejects.toBeInstanceOf(ForbiddenError);
  });
});
```

- [ ] **Step 2: Run and confirm it fails, implement, run again.**

```ts
// integration-health.ts
import { strict as assert } from 'node:assert';
import { count, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';
import type { IntegrationHealthDto } from '@/lib/dto';
import type { Viewer } from '@/server/auth/types';
import { assertStaff, type Tx } from './context';
import { defineIsolation } from './isolation.registry';

export async function integrationHealth(db: Pick<Db | Tx, 'select'>): Promise<IntegrationHealthDto> {
  const byStatus = await db.select({ status: hubspotOutbox.status, n: count() }).from(hubspotOutbox).groupBy(hubspotOutbox.status);
  const n = (s: string): number => byStatus.find((r) => r.status === s)?.n ?? 0;
  const failed = (await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.status, 'failed')).orderBy(desc(hubspotOutbox.updatedAt)).limit(1))[0];
  const cursor = (await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, 'deals_cursor')))[0];
  return { pending: n('pending'), failed: n('failed'), lastPollAt: cursor?.updatedAt ?? null, lastError: failed?.lastError ?? null };
}

/** Partner manager only (the action checks the role; this guard keeps a partner viewer out before RLS runs). */
export async function retryFailedOutbox(tx: Tx, viewer: Viewer): Promise<number> {
  assertStaff(viewer);
  const rows = await tx.update(hubspotOutbox)
    .set({ status: 'pending', attempts: 0, nextAttemptAt: sql`now()`, lastError: null })
    .where(eq(hubspotOutbox.status, 'failed'))
    .returning({ id: hubspotOutbox.id });
  return rows.length;
}

const exportedFns = { integrationHealth, retryFailedOutbox };

export const isolation = defineIsolation<keyof typeof exportedFns>({
  integrationHealth: {
    scope: 'rls-only',
    probe: (tx) => integrationHealth(tx),
    check: (result) => assert.deepEqual(result, { pending: 0, failed: 0, lastPollAt: null, lastError: null }),
  },
  retryFailedOutbox: {
    scope: 'staff-only',
    probe: (tx, viewer) => retryFailedOutbox(tx, viewer),
    expect: 'forbidden',
  },
});
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/integration-health.test.ts src/server/repo/isolation.test.ts`. Expected: FAIL first, then PASS (the isolation test picks the new module up automatically). The card shows pending, failed, last poll time, the last error and a Retry button; the button, the audit entry and the card are track A's.

- [ ] **Step 3: Write the failing import test, then the import script.** The 20 or so current partners are imported once, in master Task 5.7, from a JSON file the product owner supplies (`[{ "name": "...", "domain": "...", "category": "channel", "region": "india" }]`). The script creates each partner as `onboarding` (the first registered deal moves it to `active`), writes one `partner.created` audit entry, and enqueues `partner.upsert` with version `'1'` so the company appears in HubSpot through the normal outbox. It skips a domain that already exists, defaults to a dry run and needs `--apply`. Inviting the partners' admins is the Add partner flow (track P), not this script.

```ts
// scripts/import-partners.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { resetDb, testDb } from '@/db/test-helpers';
import { auditLog, hubspotOutbox, partners } from '@/db/schema';
import { importPartners, type PartnerImportRow } from './import-partners';

const db = testDb();
beforeEach(() => resetDb(db));

const ROWS: readonly PartnerImportRow[] = [
  { name: 'Kestrel Systems', domain: 'kestrelsystems.in', category: 'channel', region: 'india' },
];

describe('importPartners', () => {
  it('writes nothing on a dry run', async () => {
    expect(await importPartners(db, ROWS, false)).toEqual({ created: 1, skipped: 0 });
    expect(await db.select().from(partners)).toHaveLength(0);
    expect(await db.select().from(hubspotOutbox)).toHaveLength(0);
  });

  it('creates an onboarding partner, one audit entry and one partner.upsert', async () => {
    expect(await importPartners(db, ROWS, true)).toEqual({ created: 1, skipped: 0 });
    const saved = (await db.select().from(partners))[0]!;
    expect(saved).toMatchObject({ name: 'Kestrel Systems', domain: 'kestrelsystems.in', status: 'onboarding' });
    expect((await db.select().from(hubspotOutbox)).map((r) => r.idempotencyKey)).toEqual([`partner.upsert:${saved.id}:1`]);
    expect((await db.select().from(auditLog).where(eq(auditLog.subjectId, saved.id))).map((e) => e.event)).toEqual(['partner.created']);
  });

  it('skips a domain that is already a partner, so a second run changes nothing', async () => {
    await importPartners(db, ROWS, true);
    expect(await importPartners(db, ROWS, true)).toEqual({ created: 0, skipped: 1 });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});
```

```ts
// scripts/import-partners.ts
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, type Db } from '../src/db/client';
import { partners } from '../src/db/schema';
import { PARTNER_CATEGORIES, PARTNER_REGIONS } from '../src/lib/domain';
import { recordAudit } from '../src/server/audit/record';
import { SYSTEM_ACTORS } from '../src/server/auth/types';
import { enqueue } from '../src/server/hubspot/outbox';

const rowSchema = z.object({
  name: z.string().trim().min(1),
  domain: z.string().trim().min(3).transform((value) => value.toLowerCase()),
  category: z.enum(PARTNER_CATEGORIES),
  region: z.enum(PARTNER_REGIONS),
});
export const partnerFileSchema = z.array(rowSchema).min(1);
export type PartnerImportRow = z.output<typeof rowSchema>;

export const importPartners = async (
  database: Db, rows: readonly PartnerImportRow[], apply: boolean,
): Promise<{ created: number; skipped: number }> => {
  let created = 0;
  let skipped = 0;
  for (const row of rows) {
    const existing = await database.select({ id: partners.id }).from(partners).where(eq(partners.domain, row.domain));
    if (existing.length > 0) { skipped += 1; continue; }
    if (!apply) {
      console.info(`[dry-run] would import ${row.name} (${row.domain})`);
      created += 1;
      continue;
    }
    const inserted = await database.transaction(async (tx) => {
      const [partner] = await tx.insert(partners).values({ ...row, status: 'onboarding' })
        .onConflictDoNothing({ target: partners.domain }).returning({ id: partners.id });
      if (!partner) return false;
      await recordAudit(tx, SYSTEM_ACTORS.portal, {
        event: 'partner.created',
        target: row.name,
        note: 'Imported from the current partner list',
        partnerId: partner.id,
        subject: { type: 'partner', id: partner.id },
      });
      await enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: '1' });
      return true;
    });
    if (inserted) created += 1;
    else skipped += 1;
  }
  return { created, skipped };
};

const main = async (): Promise<void> => {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: tsx --env-file=.env scripts/import-partners.ts <partners.json> [--apply]');
  const rows = partnerFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
  const apply = process.argv.includes('--apply');
  console.info(apply ? 'APPLY mode' : 'DRY RUN (pass --apply to write)');
  const result = await importPartners(db, rows, apply);
  console.info(`${result.created} ${apply ? 'created' : 'would be created'}, ${result.skipped} already present`);
  await db.$client.end();
};

if (process.argv[1]?.endsWith('import-partners.ts')) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
```

Run: `pnpm --filter @cleanstart/portal exec vitest run scripts/import-partners.test.ts`. Expected: FAIL first ("Cannot find module './import-partners'"), then PASS, 3 tests.

- [ ] **Step 4: Smoke script (manual, developer account only).** `scripts/hubspot-smoke.ts` runs the real client end to end: upsert a test partner company, create a deal with `portal_registration_id = smoke-<timestamp>`, associate, move it to Discovery, run `pollDeals` (with `clock: systemClock`) against the development database, then archive the test records it created. It refuses to run unless `HUBSPOT_PORTAL_ID` equals the value in `HUBSPOT_DEV_PORTAL_ID`, so it cannot touch production. It is never run overnight (no real HubSpot call without a person, BUILD-HANDOFF).

- [ ] **Step 5: Production provisioning runbook** (write to `docs/partner-portal/HUBSPOT-PROVISIONING.md`, which W2-f links from `docs/operations/PARTNER-PORTAL.md`; executed only in master Task 5.7 after explicit approval):
  1. Create the production private app with the scopes in section 3. Add the token and the webhook client secret as GitHub secrets (`HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_WEBHOOK_SECRET`); the deploy workflow renders them into `/opt/cleanstart/portal.env` on the droplet (chmod 600). Never put them in `/opt/cleanstart/.env`, which is the CMS's file. All three HubSpot variables are required in production and optional everywhere else (contracts I): the app refuses to start in production without them.
  2. Run `provision-hubspot.ts` in dry run and read it. Get the go-ahead. Run with `--apply`. Record the pipeline id in `HUBSPOT_PARTNER_PIPELINE_ID`.
  3. Import the roughly 20 current partners: `import-partners.ts` (dry run first, then `--apply`) creates them in the portal and enqueues `partner.upsert`. Confirm each company appears in HubSpot with `cleanstart_partner = true`.
  4. Approve one test registration for a partner contact, watch it appear in the Partner deals pipeline, move its stage in HubSpot, and confirm the partner sees the change within 5 minutes. Then delete that deal.
  5. Check the health card shows 0 failed and a recent poll time before inviting partners.

- [ ] **Step 6: Run the full gate and commit**

Run Gate A from `docs/partner-portal/BUILD-HANDOFF.md` (lint, typecheck, test, the locked `build`, the dash check and the allowed-paths check).
Expected: every command passes.

```bash
git add apps/portal/src/server/repo/integration-health.ts apps/portal/src/server/repo/integration-health.test.ts apps/portal/scripts/hubspot-smoke.ts apps/portal/scripts/import-partners.ts apps/portal/scripts/import-partners.test.ts docs/partner-portal/HUBSPOT-PROVISIONING.md
git commit -m "feat(portal): H4.10 HubSpot health data, smoke script, partner import and provisioning runbook"
```

## 5. Idempotency and failure rules

- **A create can be retried safely.** `portal_registration_id` is a unique deal property and every create first searches for it. A timeout after HubSpot created the deal does not produce a duplicate on retry.
- **Save the HubSpot id before the second call.** `registration.create` stores the deal id before the associations, so each later step retries against the same deal.
- **HubSpot being down never blocks a partner or an approver.** Portal actions commit locally, the outbox catches up, and the health card shows the backlog. The one read-only HubSpot call in a request path (customer lookup and conflict hint) degrades to "no suggestions".
- **HubSpot not configured is the same as HubSpot being down.** Outside production the token, pipeline id and webhook secret are optional: the outbox, poll and reconcile jobs log a warning and return, `createHubspot()` throws a typed `IntegrationError`, the webhook answers 503, and rows queued in the meantime (including `registration.expire`) wait in the outbox until HubSpot is configured.
- **HubSpot wins after approval.** The poll overwrites stage, status and protection end from HubSpot. The portal writes only the expired stage and an extension's end date.
- **No echo loops.** The poll treats a change as a no-op when the stage id and end date already match the portal row, so the portal's own writes come back and do nothing.
- **Deletes are flagged, not applied.** A deal deleted in HubSpot sets `hubspot_missing` and shows on the health card; a person decides what to do.
- **Never log tokens or request bodies.** Errors store the status and a trimmed message only; Sentry events scrub the `Authorization` header.

## 6. Verification checklist (run before calling the integration done)

- [ ] Approve a registration in staging: a deal appears in the Partner deals pipeline with the right name, product, region, protection end, partner company, customer company and contact.
- [ ] Move the deal through every stage in HubSpot: the partner's deal page timeline and the dashboard update within 5 minutes, and Closed won shows as Won.
- [ ] Grant an extension in the portal: HubSpot's protection end date changes.
- [ ] Let a registration pass its end date: the nightly job expires it and the HubSpot deal moves to Registration expired.
- [ ] Switch HubSpot off (revoke the token): approvals still work, the health card shows a growing backlog, and restoring the token drains it with no duplicates.
- [ ] Approve the same registration twice by double click: one deal.
- [ ] Accept, undo, then accept again before the deal exists: one deal, and the second accept queued its own `registration.create` (the version is the decision time).
- [ ] With `HUBSPOT_PORTAL_TOKEN` unset (development): approvals work, the jobs log "HubSpot is not configured" and change nothing, and the webhook answers 503.
- [ ] The 6 existing deals in the default Sales Pipeline are untouched.
- [ ] A partner user cannot read another partner's deal through the customer lookup, the deal page or the thread.

## 7. Contract change requests

**Integration review resolution (13 November 2026).** Every request below was decided; the contracts and the plans were edited accordingly, so the request text is kept only as the record of what was asked.

| # | Decision | Reason and where it landed |
|---|---|---|
| 1 | Accept | Contracts C.2: system 8, request 6, 30 second connection timeout; `portal_app` limit 20 (the plan asked for 15, which would leave no spare). |
| 2 | Accept | Contracts M.2 item 17 rewritten: `runExpiry` still expires and enqueues, and only logs a warning. |
| 3 | Accept | `hubspotForRequest()` added to H4.7 with tests; contracts H.13c; plan 04 `readOnlyHubspot` uses it. |
| 4 | Modify | Owner is track R's `announceRegistrationChange` (a W0-c stub), called by `pollDeals` and `expireRegistrations` after commit (reconciliation item 22). The proposed `notifyStageChange(tx, ...)` inside the transaction is rejected: it would make H depend on R's repo and send email inside a transaction. |
| 5 | Accept | Contracts K.2. |

Per the contracts' Contract Change rule, this plan codes against the contracts as written and lists here what it needs changed. The orchestrator folds approved items into `2026-11-12-partner-portal-00-contracts.md` and tells the affected tracks.

1. **System pool size (C.2) can starve the jobs.** `SYSTEM_POOL_MAX` is 3, but `runLocked` holds one pooled connection for the whole job (the advisory lock is session level), `drainOutbox` holds a second inside its transaction while it runs, and the handlers use a third through `db`. One outbox drain therefore needs all three connections, and the outbox (every minute), the poll and the website intake (every 5 minutes) start together. With `pg`'s default `connectionTimeoutMillis` of 0, two jobs that each hold their lock connection can wait on each other for ever. Request: raise `SYSTEM_POOL_MAX` to at least 8 and lower `REQUEST_POOL_MAX` to 6 so the two pools stay under the role's 15 connections (14 in use), set `connectionTimeoutMillis: 30_000` on both pools so a starved caller fails and is reported instead of hanging, and update the capacity sentence in C.4 (the portal then uses 14, not 11). The alternative that avoids the pool arithmetic is for `runLocked` to take its lock on a dedicated client created outside the pool; that changes `lock.ts` (W0-c) only.
2. **M.2 item 17, wording for `runExpiry`.** The contracts say `runExpiry`'s enqueue returns early with a warning when HubSpot is unconfigured. This plan keeps expiring registrations and keeps enqueuing `registration.expire` (a database write that needs no token) and only logs a warning, because skipping the enqueue would lose the HubSpot stage write for every registration that expires before HubSpot is configured, and nothing would ever re-queue it. Request: change the item to "`runHubspotOutbox`, `runHubspotPoll` and `runReconcile` return early with a logged warning; `runExpiry` still expires and enqueues, and logs a warning".
3. **A HubSpot client for track R.** M.2 item 19 has R call H's `lookupCustomer` and `conflictingDeals`, both of which take a `HubspotApi`, while BUILD-HANDOFF says R never imports the real client. R needs a runtime instance and the pipeline id. Request: add to the registry an export of `src/server/hubspot/lookup.ts`, `hubspotForRequest(): { hs: HubspotApi; pipelineId: string } | null` (null when `readHubspotConfig()` is null, otherwise `createHubspot()` and the pipeline id), and have R call it, treating null and any thrown error as "no suggestions". H4.7 adds it when this is approved; until then R calls `createHubspot()` and `readHubspotConfig()` from `@/server/hubspot/client`, which exist.
4. **No owner for stage and expiry notifications.** `NOTIFICATION_KINDS` has `registration_stage` and `registration_expired`, and H.15 has `buildDealStageChanged`, but no task creates those notifications. The only places those states change are the HubSpot poll (stage moves, won, lost) and the expiry job, both H4.8, which have no viewer and no after-commit hook. This plan writes the audit entry and the timeline event and sends nothing. Request: assign an owner, for example a function in H.9 `notifyStageChange(tx: Tx, input: { registrationId: string; kind: 'registration_stage' | 'registration_expired'; stage: string }): Promise<NewNotification[]>` that R provides and H4.8 calls inside the same transaction, with the email sent after commit by the job through `resolveEmailRecipients`.
5. **Module map (K.2) additions.** `docs/partner-portal/HUBSPOT-PROVISIONING.md` owned by H (H4.10), so H does not write into W2-f's `docs/operations/PARTNER-PORTAL.md`; `scripts/import-partners.test.ts` and the job tests `src/server/jobs/{hubspot-outbox,hubspot-poll,reconcile,expiry}.test.ts` and `src/app/api/hubspot/webhook/route.test.ts` owned by H; `readHubspotConfig` and `HubspotConfig` as exports of `src/server/hubspot/client.ts`.
