# Partner Portal: HubSpot Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is Task 2.5 of `2026-11-11-partner-portal-master-plan.md`. It assumes Phase 0 (database, env, test database) and Task 1.2 (tenant isolation layer) are done.

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

Labels are fixed in code; stage ids are read from the pipeline at runtime (cached 10 minutes) so nobody pastes ids into env vars. Only `HUBSPOT_PARTNER_PIPELINE_ID` is configured.

## 3. HubSpot account setup and scopes

- **Development:** a HubSpot sandbox if our paid plan includes one, otherwise a free developer test account (master plan D7; Task 0.1 checks the tier). Run the old `setup-hubspot-deal-properties.ts` there too, because the new code reuses `partner_name`, `partner_rep_name`, `partner_rep_email` and `deal_details`.
- **Private app for the portal** (separate from the CMS token, so a leak of one does not expose the other). Scopes: `crm.objects.companies.read`, `crm.objects.companies.write`, `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.deals.read`, `crm.objects.deals.write`, `crm.schemas.companies.write`, `crm.schemas.deals.write`, `crm.schemas.companies.read`, `crm.schemas.deals.read`. Token in `HUBSPOT_PORTAL_TOKEN`.
- **Rate limit:** private apps allow roughly 100 to 190 requests per 10 seconds depending on plan (confirmed in master Task 0.1). Drain batches are capped at 20 operations and the SDK retries 429s three times.

## 4. Tasks

File map for this plan:

```
apps/portal/scripts/provision-hubspot.ts          schema and pipeline setup (task 4.1)
apps/portal/scripts/hubspot-smoke.ts              manual end to end check (task 4.10)
apps/portal/src/server/hubspot/types.ts           shared types and the HubspotApi interface (4.2)
apps/portal/src/server/hubspot/client.ts          real client (4.2)
apps/portal/src/server/hubspot/fake.ts            in-memory client for tests (4.2)
apps/portal/src/server/hubspot/mappers.ts         pure mapping functions (4.3)
apps/portal/src/server/hubspot/outbox.ts          enqueue, drain, backoff (4.4)
apps/portal/src/server/hubspot/handlers.ts        one handler per outbox operation (4.5, 4.6)
apps/portal/src/server/hubspot/lookup.ts          customer lookup and conflict check (4.7)
apps/portal/src/server/hubspot/poll.ts            inbound poll and reconcile (4.8)
apps/portal/src/server/jobs/{lock,schedule,index}.ts       advisory lock and the in-process scheduler (4.4)
apps/portal/src/server/jobs/{hubspot-outbox,hubspot-poll,expiry,reconcile}.ts   job entry points (4.4, 4.8)
apps/portal/src/instrumentation.ts                 starts the scheduler (4.4)
apps/portal/src/app/api/hubspot/webhook/route.ts  webhook receiver (4.9)
```

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

- [ ] **Step 6: Dry run against the developer account, then apply**

Run: `cd apps/portal && pnpm exec tsx --env-file=.env scripts/provision-hubspot.ts`
Expected: lines starting `[dry-run] would create` for every property, the pipeline and both labels.
Run: `pnpm exec tsx --env-file=.env scripts/provision-hubspot.ts --apply`, then run it again. Expected: second run prints `exists, skipped` for everything and the pipeline id line.

- [ ] **Step 7: Commit**

```bash
git add apps/portal/scripts/provision-hubspot.ts apps/portal/src/server/hubspot/schema-spec.ts apps/portal/src/server/hubspot/schema-spec.test.ts
git commit -m "feat(portal): HubSpot schema spec and idempotent provisioning script"
```

### Task 4.2: The HubspotApi interface, the real client and the fake

**Files:**
- Create: `apps/portal/src/server/hubspot/types.ts`, `client.ts`, `fake.ts`
- Test: `apps/portal/src/server/hubspot/client.test.ts`

- [ ] **Step 1: Write the types (the contract every later task uses)**

```ts
// types.ts
export const STAGE_LABELS = [
  'Accepted', 'Discovery', 'Technical evaluation', 'Proposal sent',
  'Closed won', 'Closed lost', 'Registration expired',
] as const;
export type StageLabel = (typeof STAGE_LABELS)[number];
export type StageIds = Record<StageLabel, string>;
export type RegistrationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'won' | 'lost';

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
/** Thrown by an outbox handler when a record it needs has not been synced yet. Retried without counting as a failure. */
export class DependencyPending extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DependencyPending';
  }
}
```

- [ ] **Step 2: Write the fake (used by every later test)**

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
import { RealHubspot } from './client';

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
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/client.test.ts`
Expected: FAIL, "Cannot find module './client'".

- [ ] **Step 5: Implement the real client**

```ts
// client.ts
import { Client } from '@hubspot/api-client';
import { env } from '@/env';
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

export const createHubspot = (): HubspotApi => {
  const client = new Client({ accessToken: env.HUBSPOT_PORTAL_TOKEN, numberOfApiCallRetries: 3 });
  return new RealHubspot((opts) => client.apiRequest({ method: opts.method, path: opts.path, ...(opts.body !== undefined ? { body: opts.body } : {}) }));
};
```

Add `HUBSPOT_USE_ASSOCIATION_LABELS` (boolean, default `false`) to `src/env.ts` and `.env.example`.

- [ ] **Step 6: Run the tests**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/client.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/portal/src/server/hubspot apps/portal/src/env.ts apps/portal/.env.example
git commit -m "feat(portal): HubspotApi interface, real client and in-memory fake"
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
      status: 'accepted', stage: 'Technical evaluation', closedOn: null,
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
    expect(decideInbound(reg, deal, idToLabel, '2026-11-06')).toMatchObject({ protectionEnd: '2027-03-01', eventText: 'Protection end changed to 1 Mar 2027' });
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

The enumeration values must match the spec's `opt()` helper exactly (`clean_libraries`, `india`), which is why the test spells them out.

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/mappers.test.ts`
Expected: FAIL, "Cannot find module './mappers'".

- [ ] **Step 3: Implement**

```ts
// mappers.ts
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtLong = (iso: string): string => {
  const [y = '', m = '1', d = '1'] = iso.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''} ${y}`;
};

/** HubSpot returns a date property as YYYY-MM-DD or as epoch milliseconds at midnight UTC. */
export const isoDate = (value: string | null | undefined): string | null => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const ms = Number(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString().slice(0, 10) : null;
};

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
git commit -m "feat(portal): HubSpot mappers for deal properties, inbound decisions and backoff"
```

### Task 4.4: The outbox

**Files:**
- Modify: `apps/portal/src/db/schema.ts` (the `hubspot_outbox` table from the master plan, if not already present)
- Create: `apps/portal/src/server/hubspot/outbox.ts`, `apps/portal/src/server/jobs/{lock.ts,schedule.ts,index.ts,hubspot-outbox.ts}`, `apps/portal/src/instrumentation.ts`
- Modify: `apps/portal/src/db/client.ts` (export the `pg` `pool` next to `db`), `apps/portal/src/db/test-helpers.ts` (export `testPool`)
- Test: `apps/portal/src/server/jobs/lock.test.ts`
- Test: `apps/portal/src/server/hubspot/outbox.test.ts`

- [ ] **Step 1: Write the failing tests** (real test database, fake HubSpot)

```ts
// outbox.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testDb, resetDb } from '@/db/test-helpers';
import { hubspotOutbox } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { drainOutbox, enqueue, type Handlers } from './outbox';
import { DependencyPending, HubspotError } from './types';

const db = testDb();
beforeEach(() => resetDb(db));

const NOW = new Date('2026-11-06T10:00:00Z');
const row = async (): Promise<typeof hubspotOutbox.$inferSelect> =>
  (await db.select().from(hubspotOutbox))[0]!;

describe('enqueue', () => {
  it('ignores a duplicate with the same idempotency key', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    expect(await db.select().from(hubspotOutbox)).toHaveLength(1);
  });
});

describe('drainOutbox', () => {
  it('marks a successful operation done', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers: Handlers = { 'partner.upsert': vi.fn().mockResolvedValue(undefined) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, now: () => NOW });
    expect(out).toEqual({ done: 1, retried: 0, failed: 0, waiting: 0 });
    expect((await row()).status).toBe('done');
  });

  it('retries with backoff and records the error', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new HubspotError(500, 'x', 'boom')) } as unknown as Handlers;
    await drainOutbox({ db, handlers, now: () => NOW });
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 1, lastError: 'boom' });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('marks the operation failed after the fifth attempt', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ attempts: 5 }).where(eq(hubspotOutbox.op, 'partner.upsert'));
    const handlers = { 'partner.upsert': vi.fn().mockRejectedValue(new Error('still broken')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, now: () => NOW });
    expect(out.failed).toBe(1);
    expect((await row()).status).toBe('failed');
  });

  it('reschedules a dependency wait without counting an attempt', async () => {
    await enqueue(db, { op: 'registration.create', subjectId: 'r1', version: '1' });
    const handlers = { 'registration.create': vi.fn().mockRejectedValue(new DependencyPending('partner not synced')) } as unknown as Handlers;
    const out = await drainOutbox({ db, handlers, now: () => NOW });
    expect(out.waiting).toBe(1);
    const r = await row();
    expect(r).toMatchObject({ status: 'pending', attempts: 0 });
    expect(r.nextAttemptAt.getTime()).toBe(NOW.getTime() + 60_000);
  });

  it('skips rows that are not due yet', async () => {
    await enqueue(db, { op: 'partner.upsert', subjectId: 'p1', version: '1' });
    await db.update(hubspotOutbox).set({ nextAttemptAt: new Date(NOW.getTime() + 1000) });
    const handler = vi.fn();
    const out = await drainOutbox({ db, handlers: { 'partner.upsert': handler } as unknown as Handlers, now: () => NOW });
    expect(handler).not.toHaveBeenCalled();
    expect(out).toEqual({ done: 0, retried: 0, failed: 0, waiting: 0 });
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
import { nextDelayMs } from './mappers';
import { DependencyPending } from './types';

export type OutboxOp =
  | 'partner.upsert' | 'user.upsert'
  | 'registration.create' | 'registration.update_end' | 'registration.expire';

export type Handlers = Record<OutboxOp, (subjectId: string, payload: Record<string, unknown>) => Promise<void>>;

export const enqueue = async (
  tx: Pick<Db, 'insert'>,
  input: { op: OutboxOp; subjectId: string; version: string; payload?: Record<string, unknown> },
): Promise<void> => {
  await tx.insert(hubspotOutbox).values({
    op: input.op,
    subjectId: input.subjectId,
    payload: input.payload ?? {},
    idempotencyKey: `${input.op}:${input.subjectId}:${input.version}`,
  }).onConflictDoNothing({ target: hubspotOutbox.idempotencyKey });
};

export interface DrainResult { done: number; retried: number; failed: number; waiting: number }

// shortcut: rows stay locked while their HubSpot calls run (batch of 20; the advisory lock skips a tick while a drain is still running); move to
// a claimed status with a lease if a single drain ever needs more than that.
export const drainOutbox = async (deps: {
  db: Db; handlers: Handlers; now: () => Date; batch?: number;
}): Promise<DrainResult> => {
  const result: DrainResult = { done: 0, retried: 0, failed: 0, waiting: 0 };
  await deps.db.transaction(async (tx) => {
    const due = await tx.select().from(hubspotOutbox)
      .where(and(eq(hubspotOutbox.status, 'pending'), lte(hubspotOutbox.nextAttemptAt, deps.now())))
      .orderBy(hubspotOutbox.createdAt).limit(deps.batch ?? 20).for('update', { skipLocked: true });

    for (const row of due) {
      try {
        await deps.handlers[row.op as OutboxOp](row.subjectId, row.payload as Record<string, unknown>);
        await tx.update(hubspotOutbox).set({ status: 'done', lastError: null, updatedAt: sql`now()` }).where(eq(hubspotOutbox.id, row.id));
        result.done += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (err instanceof DependencyPending) {
          await tx.update(hubspotOutbox).set({ nextAttemptAt: new Date(deps.now().getTime() + 60_000), lastError: message }).where(eq(hubspotOutbox.id, row.id));
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
          await tx.update(hubspotOutbox).set({ attempts, lastError: message, nextAttemptAt: new Date(deps.now().getTime() + delay) }).where(eq(hubspotOutbox.id, row.id));
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
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the failing lock test**

Every scheduled job runs under a Postgres advisory lock so two app instances (or a webhook trigger overlapping the 5 minute poll) never run the same job at once. The lock is session level, so it must be taken and released on the same connection.

```ts
// src/server/jobs/lock.test.ts
import { describe, expect, it, vi } from 'vitest';
import { testPool } from '@/db/test-helpers';
import { runLocked } from './lock';

const pool = testPool();

describe('runLocked', () => {
  it('runs the job and reports true', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    expect(await runLocked(pool, 'demo', fn)).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips the job while another connection holds the lock', async () => {
    const holder = await pool.connect();
    await holder.query("select pg_advisory_lock(hashtext('portal:demo'))");
    const fn = vi.fn();
    expect(await runLocked(pool, 'demo', fn)).toBe(false);
    expect(fn).not.toHaveBeenCalled();
    await holder.query("select pg_advisory_unlock(hashtext('portal:demo'))");
    holder.release();
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });

  it('releases the lock when the job throws', async () => {
    await expect(runLocked(pool, 'demo', () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(await runLocked(pool, 'demo', vi.fn().mockResolvedValue(undefined))).toBe(true);
  });
});
```

- [ ] **Step 6: Run it and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs/lock.test.ts`. Expected: FAIL, "Cannot find module './lock'".

- [ ] **Step 7: Implement the lock, the scheduler and the outbox job**

```ts
// src/server/jobs/lock.ts
import type { Pool } from 'pg';

/** Returns false without running `fn` when another connection already holds the lock for `name`. */
export const runLocked = async (pool: Pool, name: string, fn: () => Promise<void>): Promise<boolean> => {
  const key = `portal:${name}`;
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{ ok: boolean }>('select pg_try_advisory_lock(hashtext($1)) as ok', [key]);
    if (!rows[0]?.ok) return false;
    try {
      await fn();
      return true;
    } finally {
      await client.query('select pg_advisory_unlock(hashtext($1))', [key]);
    }
  } finally {
    client.release();
  }
};
```

```ts
// src/server/jobs/hubspot-outbox.ts
import { db } from '@/db/client';
import { env } from '@/env';
import { createHubspot } from '@/server/hubspot/client';
import { buildHandlers } from '@/server/hubspot/handlers';
import { drainOutbox } from '@/server/hubspot/outbox';

export const runHubspotOutbox = async (): Promise<void> => {
  await drainOutbox({
    db,
    handlers: buildHandlers(db, createHubspot(), env.HUBSPOT_PARTNER_PIPELINE_ID),
    now: () => new Date(),
  });
};
```

```ts
// src/server/jobs/schedule.ts
import * as Sentry from '@sentry/nextjs';
import cron from 'node-cron';
import { pool } from '@/db/client';
import { runLocked } from './lock';

export interface JobSpec {
  name: string;
  /** Cron expression, evaluated in UTC. */
  schedule: string;
  run: () => Promise<void>;
}

export const startScheduler = (jobs: readonly JobSpec[]): void => {
  for (const job of jobs) {
    cron.schedule(
      job.schedule,
      () => {
        runLocked(pool, job.name, job.run).catch((err: unknown) =>
          Sentry.captureException(err, { tags: { job: job.name } }),
        );
      },
      { timezone: 'UTC' },
    );
  }
};
```

```ts
// src/server/jobs/index.ts
import { runHubspotOutbox } from './hubspot-outbox';
import type { JobSpec } from './schedule';

// Later tasks append to this list (poll, expiry, reconcile, intake, purge). Every job needs a test.
export const JOBS: readonly JobSpec[] = [
  { name: 'hubspot-outbox', schedule: '* * * * *', run: runHubspotOutbox },
];
```

```ts
// src/instrumentation.ts
export async function register(): Promise<void> {
  // Same gate as PAYLOAD_AUTO_RUN in the CMS: tests and local runs must not fire jobs by accident.
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.PORTAL_JOBS_ENABLED !== 'true') return;
  const [{ startScheduler }, { JOBS }] = await Promise.all([import('@/server/jobs/schedule'), import('@/server/jobs')]);
  startScheduler(JOBS);
}
```

Add `node-cron` to `apps/portal/package.json` (`pnpm --filter @cleanstart/portal add node-cron` and `-D @types/node-cron`). The app must run as a single long-lived Node process (it does in the Docker image), so `PORTAL_JOBS_ENABLED=true` is set only in `portal.env` on the droplet.

- [ ] **Step 8: Run the lock and outbox tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/jobs src/server/hubspot/outbox.test.ts`. Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/portal/src/server/hubspot/outbox.ts apps/portal/src/server/hubspot/outbox.test.ts apps/portal/src/server/jobs apps/portal/src/instrumentation.ts apps/portal/src/db apps/portal/package.json pnpm-lock.yaml
git commit -m "feat(portal): HubSpot outbox with idempotent enqueue, retries and backoff"
```

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

- [ ] **Step 5: Wire the enqueue calls.** In `actions/applications.ts` (Task 1.4) call `enqueue(tx, { op: 'partner.upsert', subjectId: partner.id, version: '1' })` inside the approve transaction; in `actions/invites.ts` (Task 1.5) call `enqueue(tx, { op: 'user.upsert', subjectId: user.id, version: '1' })` when the invite is accepted; in the partner edit action (Task 1.7) call `partner.upsert` with `version: String(updatedAt.getTime())` so every edit syncs. Add one assertion to each action's existing test that the outbox row exists.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/server/hubspot/handlers.ts apps/portal/src/server/hubspot/handlers.partner.test.ts apps/portal/src/server/actions
git commit -m "feat(portal): sync partner companies and users to HubSpot through the outbox"
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
});
```

`buildHandlers` now takes a third argument, the pipeline id. Update Task 4.5's tests and the outbox job to pass it (`env.HUBSPOT_PARTNER_PIPELINE_ID`); the partner tests can pass `'pipe-1'`.

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/handlers.registration.test.ts`. Expected: FAIL ("implemented in task 4.6").

- [ ] **Step 3: Implement**

```ts
// handlers.ts (replace the three stubs; add the pipeline parameter)
export const buildHandlers = (db: Db, hs: HubspotApi, pipelineId: string): Handlers => {
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
          { id: reg.id, customerName: reg.customerName, product: reg.product, region: reg.region, protectionEnd: reg.protectionEnd },
          { name: partner.name, hubspotCompanyId: partner.hubspotCompanyId }, stageIds, pipelineId,
        ));
      }
      // Save the id first: a failure in the association calls below then retries against the same deal.
      await db.update(registrations).set({ hubspotDealId: deal.id, hubspotStageId: deal.stageId, hubspotSyncedAt: new Date() })
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
      const dealId = requireDeal(reg);
      const stageIds = await hs.getStageIds(pipelineId);
      await hs.updateDeal(dealId, { dealstage: stageIds['Registration expired'] });
      await db.update(registrations).set({ hubspotStageId: stageIds['Registration expired'], hubspotSyncedAt: new Date() }).where(eq(registrations.id, reg.id));
    },
  };
};
```

Add the missing imports (`registrations`, `registrationContacts`, `dealProperties`). Note the order inside `registration.create`: the deal id is stored before the associations, so a failed association retries against the same deal (the `findDealByRegistrationId` check covers the case where the portal crashed before saving the id).

- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot`. Expected: PASS for every file in the folder.

- [ ] **Step 5: Wire the enqueue calls** in `actions/decisions.ts` (accept enqueues `registration.create`, version `'1'`), `actions/extension.ts` (grant enqueues `registration.update_end`, version is the new end date), and `jobs/expiry.ts` (task 4.8 adds it). Each action's test asserts the outbox row.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/server/hubspot apps/portal/src/server/actions
git commit -m "feat(portal): create, extend and expire HubSpot deals from approved registrations"
```

### Task 4.7: Customer lookup and conflict check (read only)

**Files:**
- Create: `apps/portal/src/server/hubspot/lookup.ts`
- Test: `apps/portal/src/server/hubspot/lookup.test.ts`
- Modify: `apps/portal/src/server/actions/registrations.ts` (customer lookup action), `AdminApprovals.tsx` (conflict hint)

Rules: the partner-facing lookup returns only name and domain of a matching HubSpot company, and a boolean "known customer". It never returns deals, owners or other partners. The staff-facing conflict check returns the open deals on the customer company that belong to a different partner.

- [ ] **Step 1: Write the failing tests**

```ts
// lookup.test.ts
import { describe, expect, it } from 'vitest';
import { FakeHubspot } from './fake';
import { conflictingDeals, lookupCustomer } from './lookup';

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
import type { HsDeal, HubspotApi } from './types';

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

- [ ] **Step 4: Run the tests.** Expected: PASS, 3 tests.

- [ ] **Step 5: Wire it.** The register form calls a server action `lookupCustomerAction(query)` (auth: any partner user who may register deals; rate limited to 10 calls a minute per user). The approvals screen calls `conflictingDeals` when a registration is opened and shows the existing hint ("Another partner already holds this customer") using the result, falling back to the portal-only check when HubSpot is unreachable (never block a decision on HubSpot being up). Add a test for the action that a user from another company gets the same response shape and no deal data.

- [ ] **Step 6: Commit**

```bash
git add apps/portal/src/server/hubspot/lookup.ts apps/portal/src/server/hubspot/lookup.test.ts apps/portal/src/server/actions apps/portal/src/components/screens
git commit -m "feat(portal): HubSpot customer lookup and cross-partner conflict check"
```

### Task 4.8: Inbound poll, expiry job and reconcile

**Files:**
- Create: `apps/portal/src/server/hubspot/poll.ts`, `apps/portal/src/server/jobs/{expiry.ts,hubspot-poll.ts,reconcile.ts}`
- Modify: `apps/portal/src/server/jobs/index.ts` (register the three jobs)
- Test: `apps/portal/src/server/hubspot/poll.test.ts`, `apps/portal/src/server/jobs/expiry.test.ts`

- [ ] **Step 1: Write the failing poll tests**

```ts
// poll.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeRegistration, makeSyncedDeal } from '@/db/test-helpers';
import { hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import { FakeHubspot } from './fake';
import { pollDeals, reconcileDeals } from './poll';

const db = testDb();
beforeEach(() => resetDb(db));
const PIPE = 'pipe-1';
const TODAY = '2026-11-06';

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
    const out = await pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY });
    expect(out.applied).toBe(1);
    const reg = (await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]!;
    expect(reg).toMatchObject({ stage: 'Technical evaluation', status: 'accepted' });
    const events = await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id));
    expect(events.map((e) => [e.text, e.source])).toContainEqual(['Stage moved to Technical evaluation', 'crm']);
    expect((await db.select().from(hubspotSyncState))[0]!.key).toBe('deals_cursor');
  });

  it('is idempotent: polling twice records one event', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds.Discovery });
    await pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY });
    await pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY });
    expect(await db.select().from(registrationEvents).where(eq(registrationEvents.registrationId, r!.id))).toHaveLength(1);
  });

  it('walks every page when HubSpot returns more than one', async () => {
    const hs = new FakeHubspot();
    const regs = await seed(hs, 5);
    for (const r of regs) await hs.updateDeal(r.dealId, { dealstage: hs.stageIds.Discovery });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY });
    expect(out.applied).toBe(5);
  });

  it('skips a deal the portal does not know and keeps going', async () => {
    const hs = new FakeHubspot();
    const [r] = await seed(hs);
    await hs.createDeal({ dealstage: hs.stageIds.Accepted, portal_registration_id: 'ghost' });
    await hs.updateDeal(r!.dealId, { dealstage: hs.stageIds['Closed won'], closedate: '2026-12-01' });
    const out = await pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY });
    expect(out).toMatchObject({ applied: 1, unknown: 1 });
    expect((await db.select().from(registrations).where(eq(registrations.id, r!.id)))[0]).toMatchObject({ status: 'won', closedOn: '2026-12-01' });
  });

  it('does not advance the cursor when HubSpot errors', async () => {
    const hs = new FakeHubspot();
    await seed(hs);
    hs.failNext = new Error('429');
    await expect(pollDeals({ db, hs, pipelineId: PIPE, today: () => TODAY })).rejects.toThrow('429');
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

`makeSyncedDeal` (test helper) creates an accepted registration and the matching deal in the fake, stores the deal id and stage id on the registration, and returns `{ id, dealId }`.

- [ ] **Step 2: Run and confirm it fails.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/poll.test.ts`. Expected: FAIL, "Cannot find module './poll'".

- [ ] **Step 3: Implement**

```ts
// poll.ts
import { eq, inArray, isNotNull, and } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { auditLog, hubspotSyncState, registrationEvents, registrations } from '@/db/schema';
import { decideInbound } from './mappers';
import type { HubspotApi } from './types';

const CURSOR_KEY = 'deals_cursor';
/** HubSpot search indexing lags by a few seconds, so each poll re-reads a minute of overlap. Applying is idempotent. */
const OVERLAP_MS = 60_000;

export interface PollResult { applied: number; unchanged: number; unknown: number }

export const pollDeals = async (deps: {
  db: Db; hs: HubspotApi; pipelineId: string; today: () => string;
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
      const change = decideInbound(
        { status: reg.status, hubspotStageId: reg.hubspotStageId, protectionEnd: reg.protectionEnd },
        deal, labelById, deps.today(),
      );
      if (!change) { result.unchanged += 1; continue; }
      await db.transaction(async (tx) => {
        await tx.update(registrations).set({
          status: change.status, stage: change.stage, hubspotStageId: change.stageId, hubspotSyncedAt: new Date(),
          hubspotMissing: false, ...(change.closedOn ? { closedOn: change.closedOn } : {}),
          ...(change.protectionEnd ? { protectionEnd: change.protectionEnd } : {}),
        }).where(eq(registrations.id, reg.id));
        await tx.insert(registrationEvents).values({
          registrationId: reg.id, text: change.eventText, byLabel: 'HubSpot', source: 'crm',
        });
        await tx.insert(auditLog).values({
          actorLabel: 'HubSpot sync', who: 'sync', kind: 'deal_decisions', text: `${change.eventText} on registration ${reg.id}`,
          subjectType: 'registration', subjectId: reg.id,
        });
      });
      result.applied += 1;
    }
    after = page.next;
  } while (after);

  if (newest > cursor) {
    await db.insert(hubspotSyncState).values({ key: CURSOR_KEY, value: { ms: newest } })
      .onConflictDoUpdate({ target: hubspotSyncState.key, set: { value: { ms: newest } } });
  }
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


- [ ] **Step 4: Run the tests.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot/poll.test.ts`. Expected: PASS, 6 tests. Why the cursor test passes: the poller only writes the cursor after the loop completes, so a thrown error leaves it untouched.

- [ ] **Step 5: Write the failing expiry tests**

```ts
// src/server/jobs/expiry.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb, resetDb, makePartner, makeRegistration } from '@/db/test-helpers';
import { hubspotOutbox, registrations } from '@/db/schema';
import { expireRegistrations } from './expiry';

const db = testDb();
beforeEach(() => resetDb(db));

describe('expireRegistrations', () => {
  it('expires accepted registrations whose protection ended and queues the HubSpot write', async () => {
    const p = await makePartner(db, {});
    const old = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-05' });
    const live = await makeRegistration(db, { partnerId: p.id, status: 'accepted', protectionEnd: '2026-11-06', customerName: 'Live Co' });
    const won = await makeRegistration(db, { partnerId: p.id, status: 'won', protectionEnd: '2026-01-01', customerName: 'Won Co' });
    const out = await expireRegistrations({ db, today: () => '2026-11-06' });
    expect(out.expired).toBe(1);
    expect((await db.select().from(registrations).where(eq(registrations.id, old.id)))[0]).toMatchObject({ status: 'expired', stage: 'Registration expired', closedOn: '2026-11-06' });
    expect((await db.select().from(registrations).where(eq(registrations.id, live.id)))[0]!.status).toBe('accepted');
    expect((await db.select().from(registrations).where(eq(registrations.id, won.id)))[0]!.status).toBe('won');
    expect((await db.select().from(hubspotOutbox)).map((r) => r.op)).toEqual(['registration.expire']);
  });
});
```

Protection runs through the end date, so a registration whose `protection_end` is today is still protected (the `live` row), matching the mock's `daysLeft`.

- [ ] **Step 6: Implement the expiry job**

```ts
// src/server/jobs/expiry.ts
import { and, eq, lt, sql } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { registrationEvents, registrations } from '@/db/schema';
import { enqueue } from '@/server/hubspot/outbox';

export const expireRegistrations = async (deps: { db: Db; today: () => string }): Promise<{ expired: number }> => {
  const today = deps.today();
  const due = await deps.db.select().from(registrations)
    .where(and(eq(registrations.status, 'accepted'), lt(registrations.protectionEnd, today)));
  for (const reg of due) {
    await deps.db.transaction(async (tx) => {
      await tx.update(registrations).set({ status: 'expired', stage: 'Registration expired', closedOn: today, updatedAt: sql`now()` })
        .where(eq(registrations.id, reg.id));
      await tx.insert(registrationEvents).values({
        registrationId: reg.id, text: 'Protection ended, registration expired', byLabel: 'Portal', source: 'system',
      });
      await enqueue(tx, { op: 'registration.expire', subjectId: reg.id, version: today });
    });
  }
  return { expired: due.length };
};
```

- [ ] **Step 7: Run the tests and register the jobs.** Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/hubspot src/server/jobs`. Expected: PASS. Add the job entry points (each builds its dependencies the way `hubspot-outbox.ts` does and calls the function above; `expiry.ts` passes `today: () => new Date().toISOString().slice(0, 10)`; `hubspot-poll.ts` also exports `triggerPoll`, used by the webhook in Task 4.9) and register them in `JOBS`:

```ts
{ name: 'hubspot-poll', schedule: '*/5 * * * *', run: runHubspotPoll },
{ name: 'expiry', schedule: '10 0 * * *', run: runExpiry },
{ name: 'hubspot-reconcile', schedule: '30 2 * * *', run: runReconcile },
```

- [ ] **Step 8: Commit**

```bash
git add apps/portal/src/server/hubspot/poll.ts apps/portal/src/server/hubspot/poll.test.ts apps/portal/src/server/jobs
git commit -m "feat(portal): poll HubSpot deal stages, expire registrations nightly, reconcile missing deals"
```

### Task 4.9: Webhook trigger

The webhook makes stage changes show up in seconds instead of minutes; the 5 minute poll stays as the safety net, so a missed or delayed webhook costs nothing. Build the receiver as written, but confirm in Task 0.1 that our plan lets the private app subscribe to `deal.propertyChange` for `dealstage` and `protection_end_date`. If it does not, skip this task and ship polling alone.

**Files:**
- Create: `apps/portal/src/app/api/hubspot/webhook/route.ts`, `apps/portal/src/server/hubspot/signature.ts`
- Test: `apps/portal/src/server/hubspot/signature.test.ts`

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

- [ ] **Step 4: The route.** It verifies the signature, then triggers the same poll the scheduler runs. The lock makes an overlapping trigger a no-op, and the next scheduled poll catches anything that arrived while one was running. Sign the URL HubSpot called, not the internal one Caddy forwards to, so use `APP_URL`.

```ts
// src/app/api/hubspot/webhook/route.ts
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { verifyV3 } from '@/server/hubspot/signature';
import { triggerPoll } from '@/server/jobs/hubspot-poll';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const valid = verifyV3({
    secret: env.HUBSPOT_WEBHOOK_SECRET,
    method: 'POST',
    uri: `${env.APP_URL}/api/hubspot/webhook`,
    body,
    timestamp: request.headers.get('x-hubspot-request-timestamp') ?? '',
    signature: request.headers.get('x-hubspot-signature-v3') ?? '',
    now: Date.now(),
  });
  if (!valid) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  void triggerPoll();
  return NextResponse.json({ ok: true });
}
```

```ts
// in src/server/jobs/hubspot-poll.ts
import { pool } from '@/db/client';
import { runLocked } from './lock';

export const triggerPoll = (): Promise<boolean> => runLocked(pool, 'hubspot-poll', runHubspotPoll);
```

The route test (`webhook/route.test.ts`) mocks `triggerPoll` and asserts a bad signature returns 401 without calling it, and a valid one returns 200 and calls it once. Verify the header names and which secret signs a private app's webhooks against HubSpot's current docs for the app type Task 0.1 found before relying on them.

- [ ] **Step 5: Configure the subscription (manual, developer account or sandbox first).** In the private app's Webhooks settings: target URL `https://partners.cleanstart.com/api/hubspot/webhook`, subscriptions `deal.propertyChange` for `dealstage` and for `protection_end_date`. While developing, expose the local server with a Cloudflare Tunnel (`cloudflared`), not ngrok, whose interstitial page breaks requests. In production, make sure the Cloudflare WAF rule set in front of `partners.cleanstart.com` does not challenge HubSpot's requests to `/api/hubspot/webhook` (a skip rule scoped to that path, with the signature check as the real gate).

- [ ] **Step 6: Run tests, commit**

```bash
git add apps/portal/src/app/api/hubspot apps/portal/src/server/hubspot/signature.ts apps/portal/src/server/hubspot/signature.test.ts
git commit -m "feat(portal): verified HubSpot webhook trigger that runs the same poll"
```

### Task 4.10: Health panel, smoke script and production provisioning

**Files:**
- Create: `apps/portal/src/server/repo/integration-health.ts`, `apps/portal/scripts/hubspot-smoke.ts`
- Modify: `AdminAudit.tsx` (a compact health card at the top; no new board needed, confirm with the user)
- Test: `apps/portal/src/server/repo/integration-health.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// integration-health.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { testDb, resetDb } from '@/db/test-helpers';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';
import { integrationHealth } from './integration-health';

const db = testDb();
beforeEach(() => resetDb(db));

describe('integrationHealth', () => {
  it('reports pending and failed counts and the last poll time', async () => {
    await db.insert(hubspotOutbox).values([
      { op: 'partner.upsert', subjectId: 'a', payload: {}, idempotencyKey: 'a', status: 'pending' },
      { op: 'partner.upsert', subjectId: 'b', payload: {}, idempotencyKey: 'b', status: 'failed', lastError: 'boom' },
    ]);
    await db.insert(hubspotSyncState).values({ key: 'deals_cursor', value: { ms: 1 }, updatedAt: new Date('2026-11-06T10:00:00Z') });
    expect(await integrationHealth(db)).toMatchObject({ pending: 1, failed: 1, lastPollAt: new Date('2026-11-06T10:00:00Z'), lastError: 'boom' });
  });
});
```

- [ ] **Step 2: Run and confirm it fails, implement, run again.**

```ts
// integration-health.ts
import { count, desc, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { hubspotOutbox, hubspotSyncState } from '@/db/schema';

export const integrationHealth = async (db: Db) => {
  const byStatus = await db.select({ status: hubspotOutbox.status, n: count() }).from(hubspotOutbox).groupBy(hubspotOutbox.status);
  const n = (s: string): number => byStatus.find((r) => r.status === s)?.n ?? 0;
  const failed = (await db.select().from(hubspotOutbox).where(eq(hubspotOutbox.status, 'failed')).orderBy(desc(hubspotOutbox.updatedAt)).limit(1))[0];
  const cursor = (await db.select().from(hubspotSyncState).where(eq(hubspotSyncState.key, 'deals_cursor')))[0];
  return { pending: n('pending'), failed: n('failed'), lastPollAt: cursor?.updatedAt ?? null, lastError: failed?.lastError ?? null };
};
```

Run: `pnpm --filter @cleanstart/portal exec vitest run src/server/repo/integration-health.test.ts`. Expected: FAIL first, then PASS. The card shows pending, failed, last poll time, the last error and a Retry button that sets failed rows back to `pending` with `attempts = 0` (staff only, audited, covered by a test).

- [ ] **Step 3: Smoke script (manual, developer account only).** `scripts/hubspot-smoke.ts` runs the real client end to end: upsert a test partner company, create a deal with `portal_registration_id = smoke-<timestamp>`, associate, move it to Discovery, run `pollDeals` against a scratch table, then archive the test records it created. It refuses to run unless `HUBSPOT_PORTAL_ID` equals the value in `HUBSPOT_DEV_PORTAL_ID`, so it cannot touch production.

- [ ] **Step 4: Production provisioning runbook** (write to `docs/operations/PARTNER-PORTAL.md`; executed only in master Task 5.7 after explicit approval):
  1. Create the production private app with the scopes in section 3. Add the token and the webhook client secret as GitHub secrets (`HUBSPOT_PORTAL_TOKEN`, `HUBSPOT_WEBHOOK_SECRET`); the deploy workflow renders them into `/opt/cleanstart/portal.env` on the droplet (chmod 600). Never put them in `/opt/cleanstart/.env`, which is the CMS's file.
  2. Run `provision-hubspot.ts` in dry run and read it. Get the go-ahead. Run with `--apply`. Record the pipeline id in `HUBSPOT_PARTNER_PIPELINE_ID`.
  3. Import the roughly 20 current partners: `import-partners.ts` creates them in the portal and enqueues `partner.upsert`. Confirm each company appears in HubSpot with `cleanstart_partner = true`.
  4. Approve one test registration for a partner contact, watch it appear in the Partner deals pipeline, move its stage in HubSpot, and confirm the partner sees the change within 5 minutes. Then delete that deal.
  5. Check the health card shows 0 failed and a recent poll time before inviting partners.

- [ ] **Step 5: Run the full gate and commit**

Run: `pnpm --filter @cleanstart/portal lint && pnpm --filter @cleanstart/portal typecheck && pnpm --filter @cleanstart/portal test && pnpm --filter @cleanstart/portal build`
Expected: all four pass.

```bash
git add apps/portal/src/server/repo/integration-health.ts apps/portal/src/server/repo/integration-health.test.ts apps/portal/scripts/hubspot-smoke.ts apps/portal/src/components/screens/AdminAudit.tsx docs/operations/PARTNER-PORTAL.md
git commit -m "feat(portal): HubSpot health card, smoke script and production runbook"
```

## 5. Idempotency and failure rules

- **A create can be retried safely.** `portal_registration_id` is a unique deal property and every create first searches for it. A timeout after HubSpot created the deal does not produce a duplicate on retry.
- **Save the HubSpot id before the second call.** `registration.create` stores the deal id before the associations, so each later step retries against the same deal.
- **HubSpot being down never blocks a partner or an approver.** Portal actions commit locally, the outbox catches up, and the health card shows the backlog. The one read-only HubSpot call in a request path (customer lookup and conflict hint) degrades to "no suggestions".
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
- [ ] The 6 existing deals in the default Sales Pipeline are untouched.
- [ ] A partner user cannot read another partner's deal through the customer lookup, the deal page or the thread.
