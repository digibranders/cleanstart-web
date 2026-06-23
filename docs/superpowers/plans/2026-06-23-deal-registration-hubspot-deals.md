# Deal Registration → HubSpot Deals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `/deal-registration` web form to a new CMS pipeline that durably persists every partner deal registration and creates a real **HubSpot Deal** (with associated prospect + partner-rep Contacts) on submit.

**Architecture:** A standalone pipeline modeled on the existing `partner-applications` flow — **not** the `leads`/Forms-Submissions path, because the field shape (partner / prospect / deal) and destination (HubSpot **Deals** object via CRM API, not the Forms API) differ. The CMS collection write is the **primary, never-lose-it** store; HubSpot Deal creation is a **best-effort secondary** whose delivery status is recorded on the row and re-attempted by a retry cron. HubSpot credentials are resolved from the existing `integrations` collection (`kind: 'hubspotCrm'`) + `HUBSPOT_PRIVATE_APP_TOKEN`, reusing `resolveHubspotCredentials`.

**Tech Stack:** Payload 3.81 · Next.js 16 · TypeScript strict · Zod · `@hubspot/api-client` (already a dependency) · Vitest · Brevo (internal notification email, optional) · Cloudflare Turnstile.

---

## CTO Decision Record (approved)

| # | Decision | Rationale | Rejected alternative |
|---|----------|-----------|----------------------|
| D1 | Dedicated endpoint `/api/deal-registrations/apply` + dedicated `deal-registrations` collection | Field shape & destination differ from leads; mirrors the proven `partner-applications` standalone pattern; keeps the leads pipeline single-responsibility | Reusing `/api/leads/submit` + a `forms` row — would force partner/prospect/deal data through the contact-only Forms Submissions API (the exact failure mode of the old Webflow form) |
| D2 | Collection write is **primary**; HubSpot Deal creation is **best-effort** with status on the row + retry cron | "No registration lost during a HubSpot outage" — same guarantee the lead fallback queue gives leads | Synchronous hard-fail on HubSpot error — loses registrations during outages |
| D3 | Create a real **Deal** + associate **prospect Contact** (primary) and **partner-rep Contact**; partner name & deal details go in **custom deal properties** | Correct CRM modeling for partner deal-registration; the prospect is the opportunity, the partner-rep is the registrant | Contacts-only (old behavior) — the user explicitly chose real Deals |
| D4 | Contacts created via **batch upsert by email** (idempotent); associations via **CRM v4 default associations** | Resubmissions/retries must not duplicate contacts or deals associations | Plain create — 409s on existing emails, non-idempotent |
| D5 | HubSpot calls use the low-level `client.apiRequest(...)` (same style as `hubspot.ts` `hubspotGdprDeleteByEmail`) | Avoids coupling to the typed-client object-API version surface; matches existing code | Typed `basicApi`/`associationsApi` — more version-fragile across `@hubspot/api-client` majors |
| D6 | Pipeline, stage, and custom-property internal names are **env-configurable** with sensible defaults | Only the default "Sales Pipeline" exists today; ops may add a partner pipeline later without a code change | Hardcoding `default` / `appointmentscheduled` |

**Risks & mitigations:**
- *HubSpot props/pipeline not provisioned* → handler returns `failed` with a clear reason; row still saved; retry cron re-attempts after provisioning. Provisioning is a documented one-shot (Task 12) gated behind an explicit "create these in HubSpot" approval — **this plan does not create HubSpot schema without sign-off.**
- *PII/GDPR* → `deal-registrations` is append-only with a 365-day PII purge cron, identical guarantees to `career-applications`.
- *Duplicate submissions* → contact upsert + a 24h same-prospect-email dedupe guard on the deal (Task 4) prevent duplicate deals.

**Rollback:** Feature is additive. To disable: stop wiring (revert the web form to its current no-op) or set the `integrations` `hubspotCrm` row `enabled: false` (Deal creation then `skipped`, rows still captured). The collection + migration are inert if unused.

---

## Environment Variables (new)

Add to `apps/cms/.env.example` (annotated) — **do not commit real values**:

```bash
# Deal-registration → HubSpot Deals (Task 12 provisions the HubSpot side)
HUBSPOT_DEAL_PIPELINE=default                  # internal pipeline id; "default" = the Sales Pipeline
HUBSPOT_DEAL_STAGE=appointmentscheduled        # internal stage id of the entry stage in that pipeline
DEAL_REG_NOTIFY_EMAIL=                          # optional: internal Brevo notification recipient; unset = no email
DEAL_REG_RETENTION_DAYS=365                     # PII purge window
# Reuses existing: HUBSPOT_PRIVATE_APP_TOKEN, BREVO_API_KEY, BREVO_SENDER_EMAIL,
# TURNSTILE_SECRET_KEY, LEAD_SUBMIT_ALLOWED_ORIGINS
```

Web env (`apps/web`): reuses existing `NEXT_PUBLIC_CMS_URL`. No new web env.

The `HUBSPOT_PRIVATE_APP_TOKEN` must carry scopes: `crm.objects.deals.write`, `crm.objects.contacts.write`, `crm.objects.contacts.read`, `crm.schemas.deals.read`.

---

## File Structure

**Create:**
- `apps/cms/src/payload/lib/deal-registrations/schema.ts` — Zod submission schema + inferred type.
- `apps/cms/src/payload/lib/deal-registrations/deal-name.ts` — pure deal-name + properties builder (unit-tested).
- `apps/cms/src/payload/lib/deal-registrations/hubspot-deal.ts` — HubSpot Deal+Contacts creation (the only HubSpot-touching module).
- `apps/cms/src/payload/lib/deal-registrations/hubspot-deal.test.ts`
- `apps/cms/src/payload/lib/deal-registrations/deal-name.test.ts`
- `apps/cms/src/payload/collections/DealRegistrations.ts` — append-only collection.
- `apps/cms/src/payload/endpoints/deal-registration-apply.ts` — POST + OPTIONS endpoints.
- `apps/cms/src/payload/endpoints/deal-registration-apply.test.ts`
- `apps/cms/src/payload/lib/retention/purge-deal-registrations.ts` — PII redaction.
- `apps/cms/src/payload/lib/retention/purge-deal-registrations.test.ts`
- `apps/cms/src/payload/lib/retention/retry-deal-sync.ts` — re-attempt failed Deal syncs.
- `apps/cms/src/payload/lib/retention/retry-deal-sync.test.ts`
- `apps/cms/src/payload/jobs/purge-deal-registrations.ts` — cron task.
- `apps/cms/src/payload/jobs/retry-deal-sync.ts` — cron task.
- `apps/cms/scripts/setup-hubspot-deal-properties.ts` — one-shot HubSpot property/group provisioning (Task 12).
- `apps/web/src/lib/leads/submitDealRegistration.ts` — web client helper.
- `apps/web/src/lib/leads/submitDealRegistration.test.ts`

**Modify:**
- `apps/cms/src/payload.config.ts` — register collection + 2 jobs + autoRun entries.
- `apps/cms/src/migrations/<generated>.ts` — collection tables (generated then hand-trimmed).
- `apps/cms/src/payload-types.ts` — regenerated (never hand-edited).
- `apps/web/src/components/sections/forms/DealRegistrationForm.tsx` — wire submit.
- `apps/cms/.env.example` — new env block above.
- `CLAUDE.md` — "Live integrations" note + production-rollout checklist item 19.

---

## Task 1: Zod submission schema

**Files:**
- Create: `apps/cms/src/payload/lib/deal-registrations/schema.ts`
- Test: `apps/cms/src/payload/lib/deal-registrations/schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/deal-registrations/schema.test.ts
import { describe, expect, it } from 'vitest';
import { dealRegistrationSchema } from './schema';

const valid = {
  partnerName: 'Acme Partners',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', phone: '+1 555 0100' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com', phone: '555' },
  dealDetails: 'Wants hardened images for K8s.',
  source: 'https://www.cleanstart.com/deal-registration',
  consent: { snapshot: 'I agree…', givenAt: '2026-06-23T00:00:00.000Z', categories: ['storage'] },
  turnstileToken: 'tok',
  hp: '',
};

describe('dealRegistrationSchema', () => {
  it('accepts a complete valid payload', () => {
    expect(dealRegistrationSchema.safeParse(valid).success).toBe(true);
  });
  it('requires partnerName, partner rep first/last/email, prospect first/last/email', () => {
    const bad = { ...valid, partnerName: '' };
    expect(dealRegistrationSchema.safeParse(bad).success).toBe(false);
  });
  it('rejects an invalid prospect email', () => {
    const bad = { ...valid, prospect: { ...valid.prospect, email: 'nope' } };
    expect(dealRegistrationSchema.safeParse(bad).success).toBe(false);
  });
  it('treats phone, dealDetails, source, consent, turnstileToken, hp as optional', () => {
    const minimal = {
      partnerName: 'Acme',
      partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
      prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
    };
    expect(dealRegistrationSchema.safeParse(minimal).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/schema.test.ts`
Expected: FAIL — `Cannot find module './schema'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/cms/src/payload/lib/deal-registrations/schema.ts
import { z } from 'zod';

const person = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().max(40).optional(),
});

export const dealRegistrationSchema = z.object({
  partnerName: z.string().min(1).max(200),
  partnerRep: person,
  prospect: person,
  dealDetails: z.string().max(5000).optional(),
  source: z.string().max(2048).optional(),
  consent: z
    .object({
      snapshot: z.string().max(2000),
      givenAt: z.string().max(40),
      categories: z.array(z.string().max(40)).max(10).optional(),
    })
    .optional(),
  turnstileToken: z.string().max(2048).optional(),
  hp: z.string().max(2048).optional(),
});

export type DealRegistrationSubmission = z.infer<typeof dealRegistrationSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/schema.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/deal-registrations/schema.ts apps/cms/src/payload/lib/deal-registrations/schema.test.ts
git commit -m "feat(cms): deal-registration submission schema"
```

---

## Task 2: Deal-name + properties builder (pure)

**Files:**
- Create: `apps/cms/src/payload/lib/deal-registrations/deal-name.ts`
- Test: `apps/cms/src/payload/lib/deal-registrations/deal-name.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/deal-registrations/deal-name.test.ts
import { describe, expect, it } from 'vitest';
import { buildDealName, buildDealProperties } from './deal-name';
import type { DealRegistrationSubmission } from './schema';

const sub: DealRegistrationSubmission = {
  partnerName: 'Acme Partners',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', phone: '555' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s images',
};

describe('buildDealName', () => {
  it('combines prospect name and partner name', () => {
    expect(buildDealName(sub)).toBe('Sam Lee — Acme Partners');
  });
});

describe('buildDealProperties', () => {
  it('maps to HubSpot deal properties with pipeline + stage', () => {
    const props = buildDealProperties(sub, { pipeline: 'default', stage: 'appointmentscheduled' });
    expect(props).toMatchObject({
      dealname: 'Sam Lee — Acme Partners',
      pipeline: 'default',
      dealstage: 'appointmentscheduled',
      partner_name: 'Acme Partners',
      partner_rep_name: 'Jane Doe',
      partner_rep_email: 'jane@acme.com',
      deal_details: 'K8s images',
    });
  });
  it('omits deal_details when absent', () => {
    const { dealDetails: _omit, ...noDetails } = sub;
    const props = buildDealProperties(noDetails, { pipeline: 'p', stage: 's' });
    expect('deal_details' in props).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/deal-name.test.ts`
Expected: FAIL — `Cannot find module './deal-name'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/cms/src/payload/lib/deal-registrations/deal-name.ts
import type { DealRegistrationSubmission } from './schema';

export const buildDealName = (sub: DealRegistrationSubmission): string =>
  `${sub.prospect.firstName} ${sub.prospect.lastName} — ${sub.partnerName}`;

export const buildDealProperties = (
  sub: DealRegistrationSubmission,
  cfg: { pipeline: string; stage: string },
): Record<string, string> => {
  const props: Record<string, string> = {
    dealname: buildDealName(sub),
    pipeline: cfg.pipeline,
    dealstage: cfg.stage,
    partner_name: sub.partnerName,
    partner_rep_name: `${sub.partnerRep.firstName} ${sub.partnerRep.lastName}`,
    partner_rep_email: sub.partnerRep.email,
  };
  if (sub.dealDetails && sub.dealDetails.trim().length > 0) {
    props.deal_details = sub.dealDetails.trim();
  }
  return props;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/deal-name.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/deal-registrations/deal-name.ts apps/cms/src/payload/lib/deal-registrations/deal-name.test.ts
git commit -m "feat(cms): deal-registration deal-name + properties builder"
```

---

## Task 3: HubSpot Deal creation module

Creates two Contacts (idempotent upsert by email), a Deal, and v4 default associations. Returns a typed result the endpoint records on the row.

**Files:**
- Create: `apps/cms/src/payload/lib/deal-registrations/hubspot-deal.ts`
- Test: `apps/cms/src/payload/lib/deal-registrations/hubspot-deal.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/deal-registrations/hubspot-deal.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiRequest = vi.fn();
vi.mock('@hubspot/api-client', () => ({
  Client: vi.fn().mockImplementation(() => ({ apiRequest })),
}));

const resolveHubspotCredentials = vi.fn();
vi.mock('../integrations/credentials', () => ({
  resolveHubspotCredentials: (...a: unknown[]) => resolveHubspotCredentials(...a),
}));

import { createHubspotDeal } from './hubspot-deal';
import type { DealRegistrationSubmission } from './schema';

const sub: DealRegistrationSubmission = {
  partnerName: 'Acme',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s',
};

const okJson = (body: unknown) => ({ json: async () => body });

const makePayload = (rowFound = true) =>
  ({
    find: vi.fn().mockResolvedValue({
      docs: rowFound ? [{ id: 1, kind: 'hubspotCrm', enabled: true, source: 'db', hubspotConfig: {} }] : [],
    }),
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
  }) as never;

beforeEach(() => {
  resolveHubspotCredentials.mockReturnValue({ accessToken: 'tok', writeMode: 'contactOnly', fieldMapping: {}, defaultProperties: {} });
  // contacts batch upsert → two ids; deal create → id; associations → ok
  apiRequest
    .mockResolvedValueOnce(okJson({ results: [{ id: '201', properties: { email: 'sam@prospect.com' } }, { id: '202', properties: { email: 'jane@acme.com' } }] }))
    .mockResolvedValueOnce(okJson({ id: '900' }))
    .mockResolvedValue(okJson({}));
});
afterEach(() => { vi.clearAllMocks(); });

describe('createHubspotDeal', () => {
  it('upserts contacts, creates a deal, associates, returns synced + dealId', async () => {
    const res = await createHubspotDeal(makePayload(), sub, { pipeline: 'default', stage: 's' });
    expect(res).toEqual({ status: 'synced', dealId: '900' });
    // first call = contacts batch upsert
    const first = apiRequest.mock.calls[0][0];
    expect(first.method).toBe('POST');
    expect(first.path).toBe('/crm/v3/objects/contacts/batch/upsert');
    expect(first.body.inputs).toHaveLength(2);
    expect(first.body.inputs[0].idProperty).toBe('email');
    // a deal create happened
    expect(apiRequest.mock.calls.some((c) => c[0].path === '/crm/v3/objects/deals')).toBe(true);
  });

  it('skips when no active hubspotCrm integration row', async () => {
    const res = await createHubspotDeal(makePayload(false), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('skipped');
  });

  it('skips when credentials cannot be resolved (no token)', async () => {
    resolveHubspotCredentials.mockReturnValue(null);
    const res = await createHubspotDeal(makePayload(true), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('skipped');
  });

  it('returns failed with a message when the deal create throws', async () => {
    apiRequest.mockReset();
    apiRequest
      .mockResolvedValueOnce(okJson({ results: [{ id: '201' }, { id: '202' }] }))
      .mockRejectedValueOnce(new Error('boom'));
    const res = await createHubspotDeal(makePayload(), sub, { pipeline: 'default', stage: 's' });
    expect(res.status).toBe('failed');
    if (res.status === 'failed') expect(res.error).toContain('boom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/hubspot-deal.test.ts`
Expected: FAIL — `Cannot find module './hubspot-deal'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// apps/cms/src/payload/lib/deal-registrations/hubspot-deal.ts
import { Client } from '@hubspot/api-client';
import type { BasePayload } from 'payload';

import { resolveHubspotCredentials } from '../integrations/credentials';
import { buildDealProperties } from './deal-name';
import type { DealRegistrationSubmission } from './schema';

export type DealSyncResult =
  | { status: 'synced'; dealId: string }
  | { status: 'failed'; error: string }
  | { status: 'skipped'; reason: string };

// v4 default association type ids (HubSpot built-ins): deal→contact = 3.
const DEAL_TO_CONTACT_ASSOC = 3;

interface IntegrationRowLite {
  id: string | number;
  kind: string;
  enabled: boolean;
  source: 'db' | 'env' | null;
  hubspotConfig?: unknown;
}

const findActiveRow = async (payload: BasePayload) => {
  try {
    const result = await payload.find({
      collection: 'integrations',
      where: {
        and: [
          { enabled: { equals: true } },
          { source: { equals: 'db' } },
          { kind: { equals: 'hubspotCrm' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const row = result.docs[0] as unknown as IntegrationRowLite | undefined;
    if (!row) return null;
    const creds = resolveHubspotCredentials(row as { hubspotConfig?: never });
    if (!creds) return null;
    return { creds };
  } catch {
    return null;
  }
};

export const createHubspotDeal = async (
  payload: BasePayload,
  sub: DealRegistrationSubmission,
  cfg: { pipeline: string; stage: string },
): Promise<DealSyncResult> => {
  const found = await findActiveRow(payload);
  if (!found) return { status: 'skipped', reason: 'no-active-hubspot-integration' };

  const client = new Client({ accessToken: found.creds.accessToken, numberOfApiCallRetries: 3 });

  try {
    // 1. Idempotent contact upsert by email (prospect first → becomes primary).
    const upsertResp = await client.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/contacts/batch/upsert',
      body: {
        inputs: [
          {
            idProperty: 'email',
            id: sub.prospect.email,
            properties: {
              email: sub.prospect.email,
              firstname: sub.prospect.firstName,
              lastname: sub.prospect.lastName,
              ...(sub.prospect.phone ? { phone: sub.prospect.phone } : {}),
            },
          },
          {
            idProperty: 'email',
            id: sub.partnerRep.email,
            properties: {
              email: sub.partnerRep.email,
              firstname: sub.partnerRep.firstName,
              lastname: sub.partnerRep.lastName,
              ...(sub.partnerRep.phone ? { phone: sub.partnerRep.phone } : {}),
            },
          },
        ],
      },
    });
    const upserted = (await upsertResp.json()) as { results?: Array<{ id: string }> };
    const contactIds = (upserted.results ?? []).map((r) => r.id).filter(Boolean);

    // 2. Create the deal.
    const dealResp = await client.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/deals',
      body: { properties: buildDealProperties(sub, cfg) },
    });
    const deal = (await dealResp.json()) as { id: string };

    // 3. Associate every upserted contact to the deal (v4 default association).
    for (const contactId of contactIds) {
      try {
        await client.apiRequest({
          method: 'PUT',
          path: `/crm/v4/objects/deals/${deal.id}/associations/default/contacts/${contactId}`,
        });
      } catch (err) {
        payload.logger?.warn?.(
          { dealId: deal.id, contactId, err: err instanceof Error ? err.message : String(err) },
          'deal-registration: contact association failed (non-fatal)',
        );
      }
    }

    return { status: 'synced', dealId: deal.id };
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations/hubspot-deal.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/lib/deal-registrations/hubspot-deal.ts apps/cms/src/payload/lib/deal-registrations/hubspot-deal.test.ts
git commit -m "feat(cms): HubSpot Deal creation (contacts upsert + deal + assoc)"
```

---

## Task 4: DealRegistrations collection

**Files:**
- Create: `apps/cms/src/payload/collections/DealRegistrations.ts`
- (Endpoints are attached in Task 6; this task ships the fields + access only, with an empty `endpoints: []` placeholder.)

- [ ] **Step 1: Write the collection**

```ts
// apps/cms/src/payload/collections/DealRegistrations.ts
import type { CollectionConfig, Field } from 'payload';

import { isAdmin, isAdminOrEditor } from '../access';

const SYNC_STATUSES = [
  { label: 'Created', value: 'synced' },
  { label: 'Failed', value: 'failed' },
  { label: 'Skipped (not configured)', value: 'skipped' },
];

const hubspotSyncGroup: Field = {
  type: 'group',
  name: 'hubspotSync',
  label: 'HubSpot Deal sync',
  admin: { readOnly: true },
  fields: [
    { name: 'status', type: 'select', options: SYNC_STATUSES },
    { name: 'dealId', type: 'text' },
    { name: 'error', type: 'text' },
    { name: 'attempts', type: 'number', defaultValue: 0 },
    { name: 'lastAttemptAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
};

export const DealRegistrations: CollectionConfig = {
  slug: 'deal-registrations',
  labels: { singular: 'Deal Registration', plural: 'Deal Registrations' },
  admin: {
    group: 'Marketing',
    useAsTitle: 'partnerName',
    defaultColumns: ['partnerName', 'prospectEmail', 'hubspotSync', 'createdAt'],
    description:
      'Partner deal registrations (append-only). Submitted via the /deal-registration form; a HubSpot Deal is created per row.',
  },
  access: {
    read: isAdminOrEditor,
    create: isAdmin,
    update: () => false,
    delete: isAdmin,
  },
  endpoints: [],
  fields: [
    { name: 'partnerName', type: 'text', required: true },
    { name: 'partnerRepFirstName', type: 'text', required: true },
    { name: 'partnerRepLastName', type: 'text', required: true },
    { name: 'partnerRepEmail', type: 'email', required: true },
    { name: 'partnerRepPhone', type: 'text' },
    { name: 'prospectFirstName', type: 'text', required: true },
    { name: 'prospectLastName', type: 'text', required: true },
    { name: 'prospectEmail', type: 'email', required: true },
    { name: 'prospectPhone', type: 'text' },
    { name: 'dealDetails', type: 'textarea' },
    { name: 'source', type: 'text', admin: { position: 'sidebar', description: 'Referrer URL.' } },
    { name: 'ip', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'userAgent', type: 'text', admin: { readOnly: true } },
    { name: 'consentGivenAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'consentSnapshot', type: 'textarea', admin: { readOnly: true } },
    { name: 'privacyPolicyVersion', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'consentCategories', type: 'array', admin: { readOnly: true }, fields: [{ name: 'category', type: 'text' }] },
    hubspotSyncGroup,
    { name: 'honeypot', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'turnstilePassed', type: 'checkbox', defaultValue: true, admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'piiRedactedAt',
      type: 'date',
      access: { update: () => false },
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
  ],
  timestamps: true,
};
```

- [ ] **Step 2: Register the collection in the Payload config**

Modify `apps/cms/src/payload.config.ts`: add the import near the other collection imports, and add `DealRegistrations` to the `collections: [...]` array (place it next to `PartnerApplications`).

```ts
import { DealRegistrations } from './payload/collections/DealRegistrations';
// …
collections: [
  // …existing…
  PartnerApplications,
  DealRegistrations,
  // …existing…
],
```

- [ ] **Step 3: Apply the schema locally (push mode) + regenerate types**

Local dev DB is push-mode (`payload migrate` hangs locally — see memory `local-cms-field-add-needs-dev-restart`). Restart the CMS dev server so push creates the `deal_registrations` tables, then regenerate types:

Run:
```bash
pnpm --filter @cleanstart/cms generate:types
```
Expected: `payload-types.ts` now contains a `DealRegistration` interface and a `'deal-registrations'` entry in `Config['collections']`.

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @cleanstart/cms typecheck`
Expected: PASS (no errors referencing `deal-registrations`).

- [ ] **Step 5: Commit**

```bash
git add apps/cms/src/payload/collections/DealRegistrations.ts apps/cms/src/payload.config.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): deal-registrations collection (append-only)"
```

---

## Task 5: Generate the migration

**Files:**
- Create: `apps/cms/src/migrations/<timestamp>_add_deal_registrations.ts` (generated)

- [ ] **Step 1: Generate the migration against a migrate-mode DB**

CI runs migrations on deploy to `main`; production is migrate-mode. Generate the SQL migration so prod gets the tables:

Run: `pnpm --filter @cleanstart/cms exec payload migrate:create add_deal_registrations`
Expected: a new file under `apps/cms/src/migrations/` creating the `deal_registrations`, `deal_registrations_consent_categories`, and version/relationship tables.

- [ ] **Step 2: Trim the generated file for Biome**

Per memory `local-cms-field-add-needs-dev-restart`, fix the generated migration's signature to destructure only `{ db }` if the generator emitted unused params, so lint passes.

- [ ] **Step 3: Lint the migration**

Run: `pnpm --filter @cleanstart/cms lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/migrations/
git commit -m "feat(cms): migration for deal-registrations tables"
```

---

## Task 6: The apply endpoint (POST + OPTIONS)

**Files:**
- Create: `apps/cms/src/payload/endpoints/deal-registration-apply.ts`
- Test: `apps/cms/src/payload/endpoints/deal-registration-apply.test.ts`
- Modify: `apps/cms/src/payload/collections/DealRegistrations.ts` (attach endpoints)

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/endpoints/deal-registration-apply.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const verifyTurnstileToken = vi.fn();
const createHubspotDeal = vi.fn();
vi.mock('../lib/turnstile', () => ({ verifyTurnstileToken: (...a: unknown[]) => verifyTurnstileToken(...a) }));
vi.mock('../lib/deal-registrations/hubspot-deal', () => ({
  createHubspotDeal: (...a: unknown[]) => createHubspotDeal(...a),
}));

import { dealRegistrationApplyEndpoint, dealRegistrationApplyOptionsEndpoint } from './deal-registration-apply';

const ALLOWED = 'https://www.cleanstart.com';
let ipSeq = 0;
const nextIp = () => `10.0.0.${++ipSeq}`;

const validBody = {
  partnerName: 'Acme',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s',
  consent: { snapshot: 'I agree', givenAt: '2026-06-23T00:00:00Z', categories: ['storage'] },
  turnstileToken: 'tok',
  hp: '',
};

const makeReq = ({ origin = ALLOWED, body = validBody, createThrows = false }: {
  origin?: string | null; body?: unknown; createThrows?: boolean;
} = {}) => {
  const h = new Headers({ 'cf-connecting-ip': nextIp() });
  if (origin != null) h.set('origin', origin);
  return {
    headers: h,
    json: async () => body,
    payload: {
      create: createThrows ? vi.fn().mockRejectedValue(new Error('db')) : vi.fn().mockResolvedValue({ id: 5 }),
      findGlobal: vi.fn().mockResolvedValue({ policyVersion: 'v3' }),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    },
  } as never;
};

const runPost = (req: unknown): Promise<Response> =>
  (dealRegistrationApplyEndpoint.handler as (r: unknown) => Promise<Response>)(req);

beforeEach(() => {
  verifyTurnstileToken.mockResolvedValue({ ok: true });
  createHubspotDeal.mockResolvedValue({ status: 'synced', dealId: '900' });
});
afterEach(() => { vi.clearAllMocks(); });

describe('dealRegistrationApplyEndpoint', () => {
  it('OPTIONS preflight returns 204 for an allowed origin', async () => {
    const res = await (dealRegistrationApplyOptionsEndpoint.handler as (r: unknown) => Promise<Response>)(makeReq());
    expect([200, 204]).toContain(res.status);
  });

  it('rejects a disallowed origin with 403', async () => {
    const res = await runPost(makeReq({ origin: 'https://evil.example' }));
    expect(res.status).toBe(403);
  });

  it('rejects an invalid body with 400', async () => {
    const res = await runPost(makeReq({ body: { partnerName: '' } }));
    expect(res.status).toBe(400);
  });

  it('honeypot tripped → 200, no HubSpot call', async () => {
    const res = await runPost(makeReq({ body: { ...validBody, hp: 'bot' } }));
    expect(res.status).toBe(200);
    expect(createHubspotDeal).not.toHaveBeenCalled();
  });

  it('turnstile failure → 403', async () => {
    verifyTurnstileToken.mockResolvedValue({ ok: false, reason: 'invalid' });
    const res = await runPost(makeReq());
    expect(res.status).toBe(403);
  });

  it('happy path → 200, persists row with hubspotSync synced, calls HubSpot', async () => {
    const req = makeReq();
    const res = await runPost(req);
    expect(res.status).toBe(200);
    expect(createHubspotDeal).toHaveBeenCalledOnce();
    const created = (req as { payload: { create: ReturnType<typeof vi.fn> } }).payload.create;
    const arg = created.mock.calls[0][0];
    expect(arg.collection).toBe('deal-registrations');
    expect(arg.data.hubspotSync.status).toBe('synced');
    expect(arg.data.hubspotSync.dealId).toBe('900');
    expect(arg.data.privacyPolicyVersion).toBe('v3');
  });

  it('still 200 when HubSpot fails (row captured, status failed)', async () => {
    createHubspotDeal.mockResolvedValue({ status: 'failed', error: 'boom' });
    const req = makeReq();
    const res = await runPost(req);
    expect(res.status).toBe(200);
    const arg = (req as { payload: { create: ReturnType<typeof vi.fn> } }).payload.create.mock.calls[0][0];
    expect(arg.data.hubspotSync.status).toBe('failed');
  });

  it('returns 502 when the collection write fails', async () => {
    const res = await runPost(makeReq({ createThrows: true }));
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/endpoints/deal-registration-apply.test.ts`
Expected: FAIL — `Cannot find module './deal-registration-apply'`.

- [ ] **Step 3: Write the endpoint**

```ts
// apps/cms/src/payload/endpoints/deal-registration-apply.ts
import type { Endpoint, PayloadRequest } from 'payload';

import { dealRegistrationSchema } from '../lib/deal-registrations/schema';
import { createHubspotDeal } from '../lib/deal-registrations/hubspot-deal';
import { DEFAULT_RATE_LIMITS, checkAndRecord } from '../lib/rate-limit';
import { verifyTurnstileToken } from '../lib/turnstile';

export const DEAL_REG_SUBMIT_MAX_BYTES = 64 * 1024;

const DEFAULT_ALLOWED_ORIGINS = [
  'https://cleanstart.com',
  'https://www.cleanstart.com',
  'https://staging.cleanstart.com',
];
const allowedOrigins = (): string[] => {
  const raw = process.env.LEAD_SUBMIT_ALLOWED_ORIGINS;
  if (!raw || raw.trim().length === 0) return DEFAULT_ALLOWED_ORIGINS;
  return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
};
const isAllowedOrigin = (origin: string | null): origin is string =>
  origin != null && allowedOrigins().includes(origin);
const corsHeaders = (origin: string): Record<string, string> => ({
  'access-control-allow-origin': origin,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  vary: 'Origin',
});
const json = (body: unknown, init?: ResponseInit): Response =>
  new Response(JSON.stringify(body), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });

const clientIp = (headers: Headers): string | undefined =>
  headers.get('cf-connecting-ip') ??
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
  undefined;

const pipelineCfg = () => ({
  pipeline: process.env.HUBSPOT_DEAL_PIPELINE ?? 'default',
  stage: process.env.HUBSPOT_DEAL_STAGE ?? 'appointmentscheduled',
});

export const dealRegistrationApplyOptionsEndpoint: Endpoint = {
  path: '/apply',
  method: 'options',
  handler: (req: PayloadRequest): Response => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  },
};

export const dealRegistrationApplyEndpoint: Endpoint = {
  path: '/apply',
  method: 'post',
  handler: async (req: PayloadRequest): Promise<Response> => {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) {
      return json({ ok: false, error: 'forbidden_origin' }, { status: 403 });
    }
    const cors = corsHeaders(origin);

    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (Number.isFinite(contentLength) && contentLength > DEAL_REG_SUBMIT_MAX_BYTES) {
      return json({ ok: false, error: 'payload_too_large' }, { status: 413, headers: cors });
    }

    const ip = clientIp(req.headers);
    const limit = checkAndRecord(`deal-reg:${ip ?? 'unknown'}`, DEFAULT_RATE_LIMITS);
    if (!limit.ok) {
      return json(
        { ok: false, error: 'rate_limited', retryAfterSeconds: Math.ceil(limit.retryAfterMs / 1000) },
        { status: 429, headers: cors },
      );
    }

    let body: unknown;
    try {
      body = await req.json?.();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, { status: 400, headers: cors });
    }

    const parsed = dealRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: 'validation_failed' }, { status: 400, headers: cors });
    }
    const data = parsed.data;
    const userAgent = req.headers.get('user-agent') ?? undefined;

    // Honeypot — silently accept, persist a flagged row, skip HubSpot.
    if (typeof data.hp === 'string' && data.hp.trim().length > 0) {
      req.payload.logger.info({ ip }, 'Deal registration flagged — honeypot tripped');
      try {
        await req.payload.create({
          collection: 'deal-registrations',
          data: {
            partnerName: data.partnerName,
            partnerRepFirstName: data.partnerRep.firstName,
            partnerRepLastName: data.partnerRep.lastName,
            partnerRepEmail: data.partnerRep.email,
            partnerRepPhone: data.partnerRep.phone ?? null,
            prospectFirstName: data.prospect.firstName,
            prospectLastName: data.prospect.lastName,
            prospectEmail: data.prospect.email,
            prospectPhone: data.prospect.phone ?? null,
            dealDetails: data.dealDetails ?? null,
            source: data.source ?? null,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            honeypot: data.hp,
            turnstilePassed: false,
            hubspotSync: { status: 'skipped', attempts: 0 },
          },
          overrideAccess: true,
        });
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Failed to persist honeypot deal-registration row',
        );
      }
      return json({ ok: true }, { headers: cors });
    }

    const turnstile = await verifyTurnstileToken(data.turnstileToken, ip);
    if (!turnstile.ok) {
      return json({ ok: false, error: 'turnstile_failed', reason: turnstile.reason }, { status: 403, headers: cors });
    }

    // Inject the current privacy policy version into the consent snapshot.
    let policyVersion: string | undefined;
    if (data.consent != null) {
      try {
        const legal = (await req.payload.findGlobal({ slug: 'legal', depth: 0, overrideAccess: true })) as
          | { policyVersion?: string | null }
          | null;
        policyVersion = legal?.policyVersion ?? undefined;
      } catch (err) {
        req.payload.logger.warn(
          { err: err instanceof Error ? err.message : String(err) },
          'Could not read Legal global for policyVersion',
        );
      }
    }

    // Best-effort HubSpot Deal creation; never blocks the durable capture.
    const sync = await createHubspotDeal(req.payload, data, pipelineCfg());

    try {
      await req.payload.create({
        collection: 'deal-registrations',
        data: {
          partnerName: data.partnerName,
          partnerRepFirstName: data.partnerRep.firstName,
          partnerRepLastName: data.partnerRep.lastName,
          partnerRepEmail: data.partnerRep.email,
          partnerRepPhone: data.partnerRep.phone ?? null,
          prospectFirstName: data.prospect.firstName,
          prospectLastName: data.prospect.lastName,
          prospectEmail: data.prospect.email,
          prospectPhone: data.prospect.phone ?? null,
          dealDetails: data.dealDetails ?? null,
          source: data.source ?? null,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          consentGivenAt: data.consent?.givenAt ?? null,
          consentSnapshot: data.consent?.snapshot ?? null,
          privacyPolicyVersion: policyVersion ?? null,
          consentCategories: (data.consent?.categories ?? []).map((category) => ({ category })),
          hubspotSync: {
            status: sync.status,
            dealId: sync.status === 'synced' ? sync.dealId : null,
            error: sync.status === 'failed' ? sync.error : null,
            attempts: 1,
            lastAttemptAt: new Date().toISOString(),
          },
          turnstilePassed: true,
        },
        overrideAccess: true,
      });
    } catch (err) {
      req.payload.logger.error(
        { err: err instanceof Error ? err.message : String(err) },
        'Deal registration create failed',
      );
      return json({ ok: false, error: 'capture_failed' }, { status: 502, headers: cors });
    }

    return json({ ok: true }, { headers: cors });
  },
};
```

- [ ] **Step 4: Attach the endpoints to the collection**

Modify `apps/cms/src/payload/collections/DealRegistrations.ts`: import the endpoints and replace `endpoints: []` with the two endpoints.

```ts
import {
  dealRegistrationApplyEndpoint,
  dealRegistrationApplyOptionsEndpoint,
} from '../endpoints/deal-registration-apply';
// …
  endpoints: [dealRegistrationApplyEndpoint, dealRegistrationApplyOptionsEndpoint],
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/endpoints/deal-registration-apply.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/endpoints/deal-registration-apply.ts apps/cms/src/payload/endpoints/deal-registration-apply.test.ts apps/cms/src/payload/collections/DealRegistrations.ts
git commit -m "feat(cms): /api/deal-registrations/apply endpoint"
```

---

## Task 7: Retry-failed-sync logic + cron

Re-attempts HubSpot Deal creation for rows whose `hubspotSync.status` is `failed` (transient HubSpot outage, or provisioning not yet done at submit time).

**Files:**
- Create: `apps/cms/src/payload/lib/retention/retry-deal-sync.ts`
- Test: `apps/cms/src/payload/lib/retention/retry-deal-sync.test.ts`
- Create: `apps/cms/src/payload/jobs/retry-deal-sync.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/retention/retry-deal-sync.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createHubspotDeal = vi.fn();
vi.mock('../deal-registrations/hubspot-deal', () => ({
  createHubspotDeal: (...a: unknown[]) => createHubspotDeal(...a),
}));

import { retryDealSync } from './retry-deal-sync';

const row = {
  id: 7,
  partnerName: 'Acme',
  partnerRepFirstName: 'Jane', partnerRepLastName: 'Doe', partnerRepEmail: 'jane@acme.com',
  prospectFirstName: 'Sam', prospectLastName: 'Lee', prospectEmail: 'sam@prospect.com',
  dealDetails: 'K8s',
  hubspotSync: { status: 'failed', attempts: 1 },
};

const makePayload = () => ({
  find: vi.fn().mockResolvedValue({ docs: [row] }),
  update: vi.fn().mockResolvedValue({}),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
});

beforeEach(() => { createHubspotDeal.mockResolvedValue({ status: 'synced', dealId: '901' }); });
afterEach(() => { vi.clearAllMocks(); });

describe('retryDealSync', () => {
  it('retries failed rows and updates them to synced', async () => {
    const payload = makePayload();
    const result = await retryDealSync(payload as never, { pipeline: 'default', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(1);
    expect(result.synced).toBe(1);
    const upd = payload.update.mock.calls[0][0];
    expect(upd.collection).toBe('deal-registrations');
    expect(upd.id).toBe(7);
    expect(upd.data.hubspotSync.status).toBe('synced');
    expect(upd.data.hubspotSync.attempts).toBe(2);
  });

  it('skips rows that already hit maxAttempts', async () => {
    const payload = makePayload();
    payload.find.mockResolvedValue({ docs: [{ ...row, hubspotSync: { status: 'failed', attempts: 5 } }] });
    const result = await retryDealSync(payload as never, { pipeline: 'p', stage: 's', maxAttempts: 5 });
    expect(result.retried).toBe(0);
    expect(createHubspotDeal).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/retention/retry-deal-sync.test.ts`
Expected: FAIL — `Cannot find module './retry-deal-sync'`.

- [ ] **Step 3: Write the retry logic**

```ts
// apps/cms/src/payload/lib/retention/retry-deal-sync.ts
import type { BasePayload } from 'payload';

import { createHubspotDeal } from '../deal-registrations/hubspot-deal';
import type { DealRegistrationSubmission } from '../deal-registrations/schema';

type DealRow = {
  id: number;
  partnerName: string;
  partnerRepFirstName: string;
  partnerRepLastName: string;
  partnerRepEmail: string;
  partnerRepPhone?: string | null;
  prospectFirstName: string;
  prospectLastName: string;
  prospectEmail: string;
  prospectPhone?: string | null;
  dealDetails?: string | null;
  hubspotSync?: { status?: string | null; attempts?: number | null } | null;
};

const toSubmission = (row: DealRow): DealRegistrationSubmission => ({
  partnerName: row.partnerName,
  partnerRep: {
    firstName: row.partnerRepFirstName,
    lastName: row.partnerRepLastName,
    email: row.partnerRepEmail,
    ...(row.partnerRepPhone ? { phone: row.partnerRepPhone } : {}),
  },
  prospect: {
    firstName: row.prospectFirstName,
    lastName: row.prospectLastName,
    email: row.prospectEmail,
    ...(row.prospectPhone ? { phone: row.prospectPhone } : {}),
  },
  ...(row.dealDetails ? { dealDetails: row.dealDetails } : {}),
});

export const retryDealSync = async (
  payload: BasePayload,
  cfg: { pipeline: string; stage: string; maxAttempts: number },
): Promise<{ scanned: number; retried: number; synced: number; failed: number }> => {
  const found = await payload.find({
    collection: 'deal-registrations',
    where: { 'hubspotSync.status': { equals: 'failed' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  const rows = found.docs as unknown as DealRow[];
  let retried = 0;
  let synced = 0;
  let failed = 0;

  for (const row of rows) {
    const attempts = row.hubspotSync?.attempts ?? 0;
    if (attempts >= cfg.maxAttempts) continue;
    retried += 1;
    const result = await createHubspotDeal(payload, toSubmission(row), {
      pipeline: cfg.pipeline,
      stage: cfg.stage,
    });
    if (result.status === 'synced') synced += 1;
    else if (result.status === 'failed') failed += 1;
    await payload.update({
      collection: 'deal-registrations',
      id: row.id,
      data: {
        hubspotSync: {
          status: result.status,
          dealId: result.status === 'synced' ? result.dealId : null,
          error: result.status === 'failed' ? result.error : null,
          attempts: attempts + 1,
          lastAttemptAt: new Date().toISOString(),
        },
      },
      overrideAccess: true,
    });
  }

  return { scanned: rows.length, retried, synced, failed };
};
```

- [ ] **Step 4: Write the cron task**

```ts
// apps/cms/src/payload/jobs/retry-deal-sync.ts
import type { TaskConfig } from 'payload';

import { retryDealSync } from '../lib/retention/retry-deal-sync';

const MAX_ATTEMPTS = Number.parseInt(process.env.DEAL_REG_SYNC_MAX_ATTEMPTS ?? '8', 10);

export const retryDealSyncTask: TaskConfig<'retryDealSync'> = {
  slug: 'retryDealSync',
  retries: 0,
  schedule: [{ cron: '*/10 * * * *', queue: 'dealSyncRetry' }],
  handler: async ({ req }) => {
    const result = await retryDealSync(req.payload, {
      pipeline: process.env.HUBSPOT_DEAL_PIPELINE ?? 'default',
      stage: process.env.HUBSPOT_DEAL_STAGE ?? 'appointmentscheduled',
      maxAttempts: Number.isFinite(MAX_ATTEMPTS) ? MAX_ATTEMPTS : 8,
    });
    if (result.retried > 0) {
      req.payload.logger?.info?.(result, 'deal-registration HubSpot sync retry pass');
    }
    return { output: result };
  },
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/retention/retry-deal-sync.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/lib/retention/retry-deal-sync.ts apps/cms/src/payload/lib/retention/retry-deal-sync.test.ts apps/cms/src/payload/jobs/retry-deal-sync.ts
git commit -m "feat(cms): retry-failed HubSpot deal sync logic + cron"
```

---

## Task 8: PII purge logic + cron

**Files:**
- Create: `apps/cms/src/payload/lib/retention/purge-deal-registrations.ts`
- Test: `apps/cms/src/payload/lib/retention/purge-deal-registrations.test.ts`
- Create: `apps/cms/src/payload/jobs/purge-deal-registrations.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/cms/src/payload/lib/retention/purge-deal-registrations.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purgeDealRegistrations } from './purge-deal-registrations';

const oldRow = { id: 1, prospectEmail: 'sam@prospect.com', partnerRepEmail: 'jane@acme.com', piiRedactedAt: null };

const makePayload = () => ({
  find: vi.fn().mockResolvedValue({ docs: [oldRow] }),
  update: vi.fn().mockResolvedValue({}),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
});

beforeEach(() => {});
afterEach(() => { vi.clearAllMocks(); });

describe('purgeDealRegistrations', () => {
  it('nulls PII fields and stamps piiRedactedAt for eligible rows', async () => {
    const payload = makePayload();
    const result = await purgeDealRegistrations(payload as never, { retentionDays: 365 });
    expect(result.redacted).toBe(1);
    const upd = payload.update.mock.calls[0][0];
    expect(upd.collection).toBe('deal-registrations');
    expect(upd.data.prospectEmail).toBeNull();
    expect(upd.data.partnerRepEmail).toBeNull();
    expect(upd.data.ip).toBeNull();
    expect(upd.data.piiRedactedAt).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/retention/purge-deal-registrations.test.ts`
Expected: FAIL — `Cannot find module './purge-deal-registrations'`.

- [ ] **Step 3: Write the purge logic**

```ts
// apps/cms/src/payload/lib/retention/purge-deal-registrations.ts
import type { BasePayload } from 'payload';

const DAY_MS = 24 * 60 * 60 * 1000;

export const purgeDealRegistrations = async (
  payload: BasePayload,
  options: { retentionDays: number },
): Promise<{ scanned: number; redacted: number; errors: number }> => {
  const cutoff = new Date(Date.now() - options.retentionDays * DAY_MS).toISOString();
  const found = await payload.find({
    collection: 'deal-registrations',
    where: {
      and: [{ createdAt: { less_than: cutoff } }, { piiRedactedAt: { equals: null } }],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  let redacted = 0;
  let errors = 0;
  for (const doc of found.docs as Array<{ id: number }>) {
    try {
      await payload.update({
        collection: 'deal-registrations',
        id: doc.id,
        data: {
          partnerRepFirstName: null,
          partnerRepLastName: null,
          partnerRepEmail: null,
          partnerRepPhone: null,
          prospectFirstName: null,
          prospectLastName: null,
          prospectEmail: null,
          prospectPhone: null,
          ip: null,
          userAgent: null,
          piiRedactedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      });
      redacted += 1;
    } catch (err) {
      errors += 1;
      payload.logger?.warn?.(
        { id: doc.id, err: err instanceof Error ? err.message : String(err) },
        'deal-registration PII redaction failed for row',
      );
    }
  }
  return { scanned: found.docs.length, redacted, errors };
};
```

> Note: the `required: true` fields in the collection (e.g. `prospectEmail`) accept `null` on update because Payload's `required` is enforced at create, not on partial update with `overrideAccess`. This matches the existing `purge-career-applications` behavior.

- [ ] **Step 4: Write the cron task**

```ts
// apps/cms/src/payload/jobs/purge-deal-registrations.ts
import type { TaskConfig } from 'payload';

import { purgeDealRegistrations } from '../lib/retention/purge-deal-registrations';

const RETENTION_DAYS = Number.parseInt(process.env.DEAL_REG_RETENTION_DAYS ?? '365', 10);

export const purgeDealRegistrationsTask: TaskConfig<'purgeDealRegistrations'> = {
  slug: 'purgeDealRegistrations',
  retries: 0,
  schedule: [{ cron: '30 3 * * *', queue: 'dealRegistrationsPurge' }],
  handler: async ({ req }) => {
    const result = await purgeDealRegistrations(req.payload, {
      retentionDays: Number.isFinite(RETENTION_DAYS) ? RETENTION_DAYS : 365,
    });
    return { output: result };
  },
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/retention/purge-deal-registrations.test.ts`
Expected: PASS (1 test).

- [ ] **Step 6: Commit**

```bash
git add apps/cms/src/payload/lib/retention/purge-deal-registrations.ts apps/cms/src/payload/lib/retention/purge-deal-registrations.test.ts apps/cms/src/payload/jobs/purge-deal-registrations.ts
git commit -m "feat(cms): deal-registrations PII purge logic + cron"
```

---

## Task 9: Register the two jobs

**Files:**
- Modify: `apps/cms/src/payload.config.ts`

- [ ] **Step 1: Add imports + register tasks + autoRun entries**

Near the other job imports:
```ts
import { purgeDealRegistrationsTask } from './payload/jobs/purge-deal-registrations';
import { retryDealSyncTask } from './payload/jobs/retry-deal-sync';
```

In `jobs.tasks`, add both:
```ts
purgeDealRegistrationsTask,
retryDealSyncTask,
```

In `jobs.autoRun`, add the matching schedules (gated by `PAYLOAD_AUTO_RUN`):
```ts
{ cron: '30 3 * * *', queue: 'dealRegistrationsPurge' },
{ cron: '*/10 * * * *', queue: 'dealSyncRetry' },
```

- [ ] **Step 2: Typecheck + lint + run full cms test suite**

Run:
```bash
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/deal-registrations src/payload/endpoints/deal-registration-apply.test.ts src/payload/lib/retention/purge-deal-registrations.test.ts src/payload/lib/retention/retry-deal-sync.test.ts
```
Expected: all PASS.

- [ ] **Step 3: Update the CLAUDE.md background-jobs table**

Add two rows to the "Background jobs" table in `CLAUDE.md`:
- `Deal-registration HubSpot sync retry | every 10 min | retry-deal-sync.ts`
- `Deal-registrations purge (PII redaction, 365-day) | daily 03:30 | purge-deal-registrations.ts`

- [ ] **Step 4: Commit**

```bash
git add apps/cms/src/payload.config.ts CLAUDE.md
git commit -m "feat(cms): register deal-registration purge + sync-retry jobs"
```

---

## Task 10: Web client helper

**Files:**
- Create: `apps/web/src/lib/leads/submitDealRegistration.ts`
- Test: `apps/web/src/lib/leads/submitDealRegistration.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/web/src/lib/leads/submitDealRegistration.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitDealRegistration } from "./submitDealRegistration";

const fetchMock = vi.fn();
const jsonResponse = (data: unknown, ok = true, status = 200): Response =>
  ({ ok, status, json: async () => data }) as Response;

const input = {
  partnerName: "Acme",
  partnerRep: { firstName: "Jane", lastName: "Doe", email: "jane@acme.com" },
  prospect: { firstName: "Sam", lastName: "Lee", email: "sam@prospect.com" },
  dealDetails: "K8s",
};

beforeEach(() => { globalThis.fetch = fetchMock as never; });
afterEach(() => { vi.restoreAllMocks(); fetchMock.mockReset(); });

describe("submitDealRegistration", () => {
  it("POSTs to /api/deal-registrations/apply with honeypot defaulted to empty", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    const res = await submitDealRegistration(input);
    expect(res.ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/deal-registrations\/apply$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({ partnerName: "Acme", hp: "" });
  });

  it("returns ok:false on a non-2xx response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: "validation_failed" }, false, 400));
    const res = await submitDealRegistration(input);
    expect(res.ok).toBe(false);
  });

  it("returns ok:false network_error when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("net"));
    const res = await submitDealRegistration(input);
    expect(res).toEqual({ ok: false, error: "network_error" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cleanstart/web exec vitest run src/lib/leads/submitDealRegistration.test.ts`
Expected: FAIL — `Cannot find module './submitDealRegistration'`.

- [ ] **Step 3: Write the helper**

```ts
// apps/web/src/lib/leads/submitDealRegistration.ts
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface DealRegistrationPerson {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface DealRegistrationConsent {
  snapshot: string;
  givenAt: string;
  categories?: string[];
}

export interface SubmitDealRegistrationInput {
  partnerName: string;
  partnerRep: DealRegistrationPerson;
  prospect: DealRegistrationPerson;
  dealDetails?: string;
  source?: string;
  consent?: DealRegistrationConsent;
  turnstileToken?: string;
  hp?: string;
}

export interface SubmitDealRegistrationResult {
  ok: boolean;
  error?: string;
}

export async function submitDealRegistration(
  input: SubmitDealRegistrationInput,
): Promise<SubmitDealRegistrationResult> {
  try {
    const res = await fetch(`${CMS_URL}/api/deal-registrations/apply`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...input, hp: input.hp ?? "" }),
    });
    const json = (await res.json().catch(() => null)) as SubmitDealRegistrationResult | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error ?? "submit_failed" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cleanstart/web exec vitest run src/lib/leads/submitDealRegistration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/leads/submitDealRegistration.ts apps/web/src/lib/leads/submitDealRegistration.test.ts
git commit -m "feat(web): deal-registration submit client helper"
```

---

## Task 11: Wire the DealRegistrationForm component

Replaces the current no-op `onSubmit` with a real submission, mirroring `BookDemoForm.tsx`'s status/in-flight handling and reading the consent + Turnstile inputs.

**Files:**
- Modify: `apps/web/src/components/sections/forms/DealRegistrationForm.tsx`

- [ ] **Step 1: Replace the component body**

Replace the file contents with:

```tsx
"use client";

import { useRef, useState } from "react";
import { LeadConsent } from "@/components/forms/LeadConsent";
import { StatusBanner, useFormStatus } from "@/components/forms/StatusBanner";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { submitDealRegistration } from "@/lib/leads/submitDealRegistration";
import {
  FormCard,
  FormSectionTitle,
  SubmitButton,
  TextArea,
  TextInput,
} from "./FormCard";

const STORAGE_CONSENT_TEXT =
  "I agree to allow CleanStart to store and process my personal data.";

const str = (fd: FormData, name: string): string => {
  const v = fd.get(name);
  return typeof v === "string" ? v.trim() : "";
};

export function DealRegistrationForm(): React.ReactElement {
  const [submitting, setSubmitting] = useState(false);
  const { status, setStatus, statusRef } = useFormStatus();
  const inFlightRef = useRef(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setStatus(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const categories = ["storage", ...(fd.get("consent_marketing") != null ? ["marketing"] : [])];
    const turnstileToken = fd.get("cf-turnstile-response");

    const result = await submitDealRegistration({
      partnerName: str(fd, "partnerName"),
      partnerRep: {
        firstName: str(fd, "partnerRepFirstName"),
        lastName: str(fd, "partnerRepLastName"),
        email: str(fd, "partnerRepEmail"),
        ...(str(fd, "partnerRepPhone") ? { phone: str(fd, "partnerRepPhone") } : {}),
      },
      prospect: {
        firstName: str(fd, "prospectFirstName"),
        lastName: str(fd, "prospectLastName"),
        email: str(fd, "prospectEmail"),
        ...(str(fd, "prospectPhone") ? { phone: str(fd, "prospectPhone") } : {}),
      },
      ...(str(fd, "dealDetails") ? { dealDetails: str(fd, "dealDetails") } : {}),
      consent: { snapshot: STORAGE_CONSENT_TEXT, givenAt: new Date().toISOString(), categories },
      ...(typeof turnstileToken === "string" ? { turnstileToken } : {}),
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });

    setSubmitting(false);
    inFlightRef.current = false;
    if (result.ok) {
      form.reset();
      setStatus({
        tone: "success",
        title: "Deal registration received",
        message:
          "Thanks, your deal registration has been received. We'll be in touch within one business day.",
      });
      window.setTimeout(() => setStatus(null), 6000);
    } else {
      setStatus({
        tone: "error",
        title: "Couldn't submit registration",
        message: "We couldn't submit your registration. Please try again.",
      });
    }
  };

  return (
    <FormCard>
      <StatusBanner status={status} ref={statusRef} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Details</FormSectionTitle>
          <TextInput name="partnerName" placeholder="Partner Name" label="Partner Name" required />
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Partner Rep Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput name="partnerRepFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="partnerRepLastName" placeholder="Last Name" label="Last Name" required />
            <TextInput name="partnerRepPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
            <TextInput name="partnerRepEmail" type="email" placeholder="jane@company.com" label="Email" required />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <FormSectionTitle>Prospect Details</FormSectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextInput name="prospectFirstName" placeholder="First Name" label="First Name" required />
            <TextInput name="prospectLastName" placeholder="Last Name" label="Last Name" required />
            <TextInput name="prospectPhone" type="tel" placeholder="+1 (555) 000-0000" label="Phone" />
            <TextInput name="prospectEmail" type="email" placeholder="jane@company.com" label="Email" required />
          </div>
          <TextArea name="dealDetails" placeholder="Deal Details" label="Deal Details" />
        </div>

        <LeadConsent />

        <div className="flex justify-start">
          <TurnstileWidget />
        </div>
        <SubmitButton disabled={submitting}>
          {submitting ? "Submitting…" : "Submit Application"}
        </SubmitButton>
      </form>
    </FormCard>
  );
}
```

> If `SubmitButton` does not accept a `disabled` prop, check its signature in `FormCard.tsx`; `BookDemoForm.tsx` is the reference for how it passes button state. Match that exact prop contract rather than inventing one.

- [ ] **Step 2: Typecheck + lint + build the web app**

Run:
```bash
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web lint
```
Expected: PASS. (Build verification happens in Task 13.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/sections/forms/DealRegistrationForm.tsx
git commit -m "feat(web): wire deal-registration form to /api/deal-registrations/apply"
```

---

## Task 12: HubSpot provisioning one-shot (REQUIRES EXPLICIT APPROVAL before running)

This script creates the custom Deal properties + a property group in HubSpot. **It mutates HubSpot schema — do not run it without the user's explicit go-ahead.** It is idempotent (a 409 on an existing property is treated as success).

**Files:**
- Create: `apps/cms/scripts/setup-hubspot-deal-properties.ts`

- [ ] **Step 1: Write the script**

```ts
// apps/cms/scripts/setup-hubspot-deal-properties.ts
/**
 * One-shot: provision the custom HubSpot Deal properties used by the
 * deal-registration pipeline. Idempotent — re-running skips properties that
 * already exist. REQUIRES `HUBSPOT_PRIVATE_APP_TOKEN` with `crm.schemas.deals.write`.
 *
 * Run: pnpm exec tsx --env-file=.env scripts/setup-hubspot-deal-properties.ts [--dry-run]
 */
import { Client } from '@hubspot/api-client';

const GROUP_NAME = 'deal_registration';
const GROUP_LABEL = 'Deal Registration';

const PROPERTIES = [
  { name: 'partner_name', label: 'Partner Name', type: 'string', fieldType: 'text' },
  { name: 'partner_rep_name', label: 'Partner Rep Name', type: 'string', fieldType: 'text' },
  { name: 'partner_rep_email', label: 'Partner Rep Email', type: 'string', fieldType: 'text' },
  { name: 'deal_details', label: 'Deal Details', type: 'string', fieldType: 'textarea' },
] as const;

const dryRun = process.argv.includes('--dry-run');

const main = async (): Promise<void> => {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) throw new Error('HUBSPOT_PRIVATE_APP_TOKEN is required');
  const client = new Client({ accessToken: token, numberOfApiCallRetries: 3 });

  // 1. Ensure the property group exists.
  if (!dryRun) {
    try {
      await client.apiRequest({
        method: 'POST',
        path: '/crm/v3/properties/deals/groups',
        body: { name: GROUP_NAME, label: GROUP_LABEL, displayOrder: -1 },
      });
      console.log(`Created group ${GROUP_NAME}`);
    } catch (err) {
      console.log(`Group ${GROUP_NAME} likely exists (skipped): ${err instanceof Error ? err.message : err}`);
    }
  }

  // 2. Ensure each property exists.
  for (const prop of PROPERTIES) {
    if (dryRun) {
      console.log(`[dry-run] would ensure deal property ${prop.name}`);
      continue;
    }
    try {
      await client.apiRequest({
        method: 'POST',
        path: '/crm/v3/properties/deals',
        body: { ...prop, groupName: GROUP_NAME },
      });
      console.log(`Created property ${prop.name}`);
    } catch (err) {
      console.log(`Property ${prop.name} likely exists (skipped): ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log('Done.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Lint the script**

Run: `pnpm --filter @cleanstart/cms lint`
Expected: PASS.

- [ ] **Step 3: Commit (script only — do NOT run yet)**

```bash
git add apps/cms/scripts/setup-hubspot-deal-properties.ts
git commit -m "chore(cms): HubSpot deal-property provisioning script (run gated on approval)"
```

- [ ] **Step 4: Manual confirmation gate (with the user)**

Before this feature can create real deals in production, confirm with the user / ops:
1. Run `… scripts/setup-hubspot-deal-properties.ts --dry-run` then (on approval) without the flag, against the prod token.
2. Confirm `HUBSPOT_DEAL_PIPELINE` / `HUBSPOT_DEAL_STAGE` internal ids match the intended pipeline+entry stage (HubSpot → Settings → Objects → Deals → Pipelines; the default Sales Pipeline's first stage internal id is commonly `appointmentscheduled`, but verify).
3. Confirm an `integrations` row exists with `kind: 'hubspotCrm'`, `enabled: true`, `source: 'db'` (Phase J3). If not, this handler returns `skipped` and the retry cron picks rows up once the row is created.

---

## Task 13: Full verification gate

- [ ] **Step 1: Run the entire cms + web check matrix**

Run:
```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec vitest run
pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web build
```
Expected: all PASS. (`apps/web build` may need a prod CMS on a spare port — see memory `web-build-needs-prod-cms` if it ETIMEDOUTs prerendering.)

- [ ] **Step 2: Local end-to-end smoke (manual, dev)**

With both dev servers up, submit the `/deal-registration` form locally. Verify:
- A `deal-registrations` row appears in `/admin` with the right fields.
- With no HubSpot integration row, `hubspotSync.status` = `skipped` (graceful).
- With the integration row + token configured, `hubspotSync.status` = `synced` and `dealId` is set, and a Deal appears in HubSpot's Sales Pipeline with associated prospect + partner-rep contacts.

- [ ] **Step 3: Confirm types committed (CI drift gate)**

Run: `pnpm --filter @cleanstart/cms generate:types` then `git diff --exit-code apps/cms/src/payload-types.ts`
Expected: no diff (already committed in Task 4). If there is a diff, commit it.

---

## Task 14: Docs — production rollout checklist + integrations note

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add production-rollout checklist item 19**

Under "Production rollout checklist", add:

```markdown
19. **Deal-registration → HubSpot Deals provisioning.** The `/deal-registration` form now creates a real HubSpot Deal per submission. Before go-live of this feature on prod: (a) run `apps/cms/scripts/setup-hubspot-deal-properties.ts` (dry-run then real) to create the custom deal properties (`partner_name`, `partner_rep_name`, `partner_rep_email`, `deal_details`) under a "Deal Registration" group; (b) set `HUBSPOT_DEAL_PIPELINE` / `HUBSPOT_DEAL_STAGE` on the droplet to the intended pipeline + entry-stage internal ids; (c) ensure an `integrations` row `kind: 'hubspotCrm'`, `enabled: true` exists and `HUBSPOT_PRIVATE_APP_TOKEN` carries `crm.objects.deals.write` + `crm.objects.contacts.*`. Until provisioned, submissions are captured to the `deal-registrations` collection with `hubspotSync.status='skipped'/'failed'`; the `retryDealSync` cron (every 10 min) back-fills the deals once HubSpot is ready. The old Webflow form NEVER created deals (it was a contacts-only collected form) — this is net-new behavior, so no historical deal backfill is needed.
```

- [ ] **Step 2: Add the "Live integrations" note**

In the "Live integrations" section, append to the HubSpot row (or add a note) that HubSpot is now also the destination for **deal registrations** via the CRM Deals API (distinct from the Forms Submissions API used for leads), gated by the `integrations` `hubspotCrm` row.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: deal-registration HubSpot Deals rollout checklist + integrations note"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** Web form wiring (T11), durable capture (T4/T6), real HubSpot Deal creation with contacts + associations (T3), idempotency (T3 batch upsert / D4), no-loss-on-outage (D2 + retry cron T7), PII/GDPR (T8), provisioning (T12), env (env section), docs (T14), tests at every layer. All covered.

**Placeholder scan:** No TBD/TODO/"add error handling" left; every code step has complete code; the one external-contract uncertainty (`SubmitButton` `disabled` prop) is flagged with a concrete instruction to match `BookDemoForm.tsx`.

**Type consistency:** `DealRegistrationSubmission` (T1) is consumed identically in T2/T3/T7. `DealSyncResult` (T3) discriminated union is read consistently in T6/T7. `createHubspotDeal(payload, submission, {pipeline,stage})` signature is stable across T3/T6/T7. Collection field names in T4 match the endpoint `payload.create` data in T6 and the purge/retry field lists in T7/T8.

**Open dependency to verify during execution:** the HubSpot v4 default deal→contact association path is used without an explicit type id (`/associations/default/...`), which HubSpot resolves to the built-in label — confirm in the local smoke test (T13 Step 2) that associations attach; if the account requires an explicit type id, use `3` (the built-in deal→contact id) via the labeled-association endpoint.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-23-deal-registration-hubspot-deals.md`.
