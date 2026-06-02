# Forms → Payload → HubSpot Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the marketing-site forms actually submit — web form → Payload `/api/leads/submit` (lead row + R2 fallback) → HubSpot via the Forms API — so every submission lands as a lead in Payload and a contact in HubSpot.

**Architecture:** Each web form POSTs the same JSON shape `FormRenderer` already uses. Payload validates against a `forms` collection row, writes the lead (primary handler), then the **HubSpot secondary handler** submits to that form's HubSpot **Forms API** endpoint using a GUID stored on the `forms` row. Payload form-field `name`s are chosen to match HubSpot field internal names, so no mapping layer is needed.

**Tech Stack:** Payload 3 / Next 16 (apps/cms), Next 16 / React 19 (apps/web), Vitest, HubSpot Forms Submissions API v3.

---

## Scope

**In scope:** Book a Demo, Contact, Become-a-Partner, Newsletter (×4 CTAs), Resource Lead Capture, plus the gated-resource flow (already live via `FormRenderer`).

**Out of scope (deferred):**
- **Deal Registration** — needs the two-contact + Deal-object model (pending a marketing decision). Leave `DealRegistrationForm.tsx` as a stub and create no `forms` row for it yet.
- **Career** — keeps `mailto:` for v1 unless explicitly wired later.

**External prerequisites (not code — track separately):**
- The parallel HubSpot session finishes the per-form field edits in the `website` folder.
- HubSpot form follow-up + team-notification emails configured per form (marketing).
- "Set new contacts as marketing contacts" turned **off** by default (marketing).
- `HUBSPOT_PORTAL_ID` available (it's `245478611`).

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `apps/cms/src/payload/collections/Forms.ts` | add `hubspotFormGuid` field | Modify |
| `apps/cms/src/payload/lib/lead-handlers/hubspot.ts` | swap contacts-upsert → Forms API submit | Modify |
| `apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts` | unit tests for the Forms API submit | Create |
| `apps/cms/.env.example` | document `HUBSPOT_PORTAL_ID` | Modify |
| `apps/web/src/lib/leads/submitLead.ts` | shared client helper to POST a lead | Create |
| `apps/web/src/components/sections/forms/BookDemoForm.tsx` | wire onSubmit | Modify |
| `apps/web/src/components/sections/contact/ContactForm.tsx` | wire onSubmit | Modify |
| `apps/web/src/components/sections/partners/BecomePartnerCta.tsx` | wire onSubmit | Modify |
| Newsletter CTA components (Blog/Blogs/Webinars/Events) | wire onSubmit | Modify |
| `apps/web/src/components/sections/resource/ResourceDetailLeadCapture.tsx` | wire onSubmit | Modify |

Payload `forms` rows (data, not files) are created in Phase 2 via the admin UI or a seed script.

---

## Phase 0 — Confirm prerequisites (no code)

- [ ] **Step 1: Confirm HubSpot field edits are done.** Open the `website` folder; confirm each form's fields/internal-names match the per-form spec (see `docs/forms-hubspot-overview.html` §1 spec). Record each form's **GUID** (already in that doc) and the **field internal names** the form expects.
- [ ] **Step 2: Set env.** Add to the droplet `.env` and local `apps/cms/.env`:
```
HUBSPOT_PORTAL_ID=245478611
```
(`HUBSPOT_PRIVATE_APP_TOKEN` is only needed if we later add contacts/Deal API calls; the Forms API submit endpoint does not require it.)
- [ ] **Step 3: Confirm `NEXT_PUBLIC_CMS_URL`** is set for `apps/web` (already used by `FormRenderer`); it must point at the CMS origin in each environment.

---

## Phase 1 — Backend: Forms API handler

### Task 1.1: Add `hubspotFormGuid` to the Forms collection

**Files:**
- Modify: `apps/cms/src/payload/collections/Forms.ts`

- [ ] **Step 1: Add the field.** In the `Forms` collection `fields` array, add an admin-only text field (place it in the sidebar group near `slug`/`schemaVersion`):
```ts
{
  name: 'hubspotFormGuid',
  type: 'text',
  admin: {
    position: 'sidebar',
    description:
      'GUID of the matching HubSpot form in the "website" folder. Set this to relay submissions to HubSpot via the Forms API. Leave empty to skip HubSpot sync.',
  },
},
```

- [ ] **Step 2: Regenerate types.**

Run: `pnpm --filter @cleanstart/cms generate:types`
Expected: `payload-types.ts` rewritten; `Form` type now has `hubspotFormGuid?: string | null`.

- [ ] **Step 3: Update the schema-surface snapshot.**

Run: `pnpm --filter @cleanstart/cms exec vitest run -u src/payload/collections/schema-surface.test.ts`
Expected: 1 snapshot updated, tests pass.

- [ ] **Step 4: Create the migration.**

Run: `pnpm --filter @cleanstart/cms migrate:create add_hubspot_form_guid`
Then open the generated `src/migrations/*_add_hubspot_form_guid.ts` and **fix its signatures to match the baseline convention** (`import { type MigrateUpArgs, type MigrateDownArgs, sql }` and `up({ db })` / `down({ db })` only) so lint/typecheck pass. Confirm it only adds the `hubspot_form_guid` column.

- [ ] **Step 5: Verify + commit.**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck`
Expected: clean.
```bash
git add apps/cms/src/payload/collections/Forms.ts apps/cms/src/payload-types.ts \
  apps/cms/src/payload/collections/__snapshots__/Forms.snap.json \
  apps/cms/src/migrations/*_add_hubspot_form_guid.* apps/cms/src/migrations/index.ts
git commit -m "feat(cms): add hubspotFormGuid to forms collection"
```

### Task 1.2: Rework `hubspot.ts` to submit via the Forms API

**Files:**
- Modify: `apps/cms/src/payload/lib/lead-handlers/hubspot.ts`
- Test: `apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts`

**Context:** The handler receives a `LeadSubmission` (with `formId`, `fields`, `source`, `consent`) and `ctx` (`payload`, `duplicateOfLeadId`, `formFieldDefs`). New flow: look up the form's `hubspotFormGuid`, then `POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`. Field `name`s in `submission.fields` are assumed to already be HubSpot internal names (enforced in Phase 2). Keep `hubspotGdprDeleteByEmail` as-is (it still uses the contacts API + token).

- [ ] **Step 1: Write the failing test.**

Create `apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hubspotHandler } from './hubspot';
import type { LeadSubmission } from './types';

const submission: LeadSubmission = {
  formId: 7,
  formSchemaVersion: 1,
  fields: { email: 'cto@acme.com', firstname: 'Pat', company: 'Acme' },
  source: 'https://cleanstart.com/contact',
  utm: undefined, ip: '1.2.3.4', userAgent: 'curl',
  consent: { snapshot: 'I agree…', givenAt: '2026-06-02T00:00:00Z' },
};

const ctx = (guid: string | null) => ({
  payload: {
    findByID: vi.fn(async () => (guid ? { id: 7, hubspotFormGuid: guid } : { id: 7 })),
  },
  primarySucceeded: true,
  leadId: 7,
  duplicateOfLeadId: undefined,
  formFieldDefs: [{ name: 'email', type: 'email' }],
}) as unknown as Parameters<typeof hubspotHandler.run>[1];

beforeEach(() => { process.env.HUBSPOT_PORTAL_ID = '245478611'; });
afterEach(() => { vi.unstubAllGlobals(); Reflect.deleteProperty(process.env, 'HUBSPOT_PORTAL_ID'); });

describe('hubspotHandler (Forms API)', () => {
  it('skips a duplicate submission', async () => {
    const c = ctx('guid-1'); (c as { duplicateOfLeadId?: number }).duplicateOfLeadId = 99;
    const r = await hubspotHandler.run(submission, c);
    expect(r).toMatchObject({ handler: 'hubspot', status: 'skipped', reason: 'duplicate-submission' });
  });

  it('skips when the form has no hubspotFormGuid', async () => {
    const r = await hubspotHandler.run(submission, ctx(null));
    expect(r).toMatchObject({ status: 'skipped', reason: 'no-hubspot-form-guid' });
  });

  it('posts mapped fields to the Forms API and returns synced', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);
    const r = await hubspotHandler.run(submission, ctx('guid-1'));
    expect(r.status).toBe('synced');
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.hsforms.com/submissions/v3/integration/submit/245478611/guid-1');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.fields).toEqual(
      expect.arrayContaining([{ name: 'email', value: 'cto@acme.com' }, { name: 'firstname', value: 'Pat' }]),
    );
    expect(sent.legalConsentOptions).toBeDefined();
  });

  it('returns failed on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' }));
    const r = await hubspotHandler.run(submission, ctx('guid-1'));
    expect(r.status).toBe('failed');
  });
});
```

- [ ] **Step 2: Run it to verify it fails.**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lead-handlers/hubspot.test.ts`
Expected: FAIL (current handler hits the contacts API, not the Forms endpoint).

- [ ] **Step 3: Rewrite the handler.** Replace the body of `hubspotHandler.run` in `hubspot.ts` (keep imports for `extractEmail`/`extractName` and the `hubspotGdprDeleteByEmail` export). New `run`:
```ts
export const hubspotHandler: LeadHandler = {
  name: 'hubspot',
  kind: 'secondary',
  async run(submission, ctx): Promise<LeadHandlerResult> {
    if (ctx.duplicateOfLeadId != null) {
      return { handler: 'hubspot', status: 'skipped', reason: 'duplicate-submission' };
    }
    const portalId = process.env.HUBSPOT_PORTAL_ID;
    if (!portalId) {
      return { handler: 'hubspot', status: 'skipped', reason: 'env-not-configured' };
    }

    const form = (await ctx.payload.findByID({
      collection: 'forms',
      id: submission.formId,
      depth: 0,
      overrideAccess: true,
    })) as { hubspotFormGuid?: string | null } | null;
    const guid = form?.hubspotFormGuid?.trim();
    if (!guid) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-hubspot-form-guid' };
    }

    // Field names in submission.fields are HubSpot internal names by design.
    const fields = Object.entries(submission.fields)
      .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([name, v]) => ({ name, value: String(v) }));
    if (fields.length === 0) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-fields' };
    }

    const body: Record<string, unknown> = {
      fields,
      context: { pageUri: submission.source ?? '' },
    };
    if (submission.consent) {
      body.legalConsentOptions = {
        consent: {
          consentToProcess: true,
          text: submission.consent.snapshot,
        },
      };
    }

    try {
      const resp = await fetch(
        `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${guid}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        return { handler: 'hubspot', status: 'failed', error: `HubSpot ${resp.status}: ${detail.slice(0, 200)}` };
      }
      return { handler: 'hubspot', status: 'synced' };
    } catch (err) {
      return {
        handler: 'hubspot',
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
};
```
Remove now-unused imports (`Client`, `resolveHubspotCredentials`, `mapProperties`, `findActiveRow`) **only if** `hubspotGdprDeleteByEmail` no longer needs them — it does still use `@hubspot/api-client` + `resolveHubspotCredentials`, so keep those; remove only the parts solely used by the old `run` (`mapProperties`, `isRateLimitDaily`).

- [ ] **Step 4: Run tests to verify they pass.**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lead-handlers/hubspot.test.ts`
Expected: 4 passing.

- [ ] **Step 5: Full check + commit.**

Run: `pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test`
Expected: clean; all tests pass.
```bash
git add apps/cms/src/payload/lib/lead-handlers/hubspot.ts apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts apps/cms/.env.example
git commit -m "feat(cms): submit leads to HubSpot via Forms API by form GUID"
```

---

## Phase 2 — Create the Payload `forms` rows

Create one `forms` row per in-scope form, in the CMS admin (`/admin/collections/forms/create`) **or** a seed script. **Field `name`s must equal HubSpot internal names** so the handler needs no mapping.

- [ ] **Step 1: Create the rows.** For each form below, set: `name`, `slug`, fields (with the listed `name`s + types + required), a `consent` field, `notifyTo[]` recipients, and `hubspotFormGuid` (from §1 of `docs/forms-hubspot-overview.html`).

| Payload form (slug) | hubspotFormGuid | Fields (`name`:type, required\*) |
|---|---|---|
| `book-a-demo` | `3a491549-929f-41df-8446-32702d793780` | firstname\*, lastname, email\*:email, company\*, country, phone\*:tel, "how did you hear" (`hs_…`/custom), consent_marketing:consent, consent_storage:consent\* |
| `contact` | `380525d8-f536-4ef8-a01a-2815ea542e5d` | firstname\*, lastname, email\*:email, company, phone:tel, message\* (textarea), consent_marketing, consent_storage\* |
| `become-a-partner` | `ea66c444-acfe-4237-9a54-aea500f5e6d7` | firstname\*, lastname\*, phone:tel, email\*:email, company\*, website, message (textarea), consent_marketing, consent_storage\* |
| `newsletter` | `d23691e3-fabd-41d1-8d19-3384d6043179` | email\*:email, consent_marketing |
| `resource-capture` | `82790e37-d079-428c-8145-70749a164fe8` | email\*:email, consent_storage\* |

> The "message"/textarea + "how did you hear" fields need matching HubSpot properties — confirm names against what the HubSpot session produced; rename the Payload field `name` to match. If a HubSpot property doesn't exist, drop that field from the Payload row (don't invent a property).

- [ ] **Step 2: Record the resulting `formId` for each** (shown in the admin URL / list). These IDs go into the web forms in Phase 3.
- [ ] **Step 3: Verify** each row saved with the correct `hubspotFormGuid` and `schemaVersion` (defaults to 1).

*(No commit — this is data, not code. If a seed script is used, commit it under `apps/cms/scripts/`.)*

---

## Phase 3 — Wire the web forms

### Task 3.1: Shared submit helper

**Files:**
- Create: `apps/web/src/lib/leads/submitLead.ts`

- [ ] **Step 1: Write the helper.**
```ts
const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3000";

export interface LeadConsent { snapshot: string; givenAt: string; }

export interface SubmitLeadInput {
  formId: number;
  formSchemaVersion: number;
  fields: Record<string, string>;
  source?: string;
  consent?: LeadConsent;
  /** honeypot value — pass the hidden input's value, normally "" */
  website?: string;
}

export interface SubmitLeadResult { ok: boolean; error?: string; duplicate?: boolean; }

export async function submitLead(input: SubmitLeadInput): Promise<SubmitLeadResult> {
  try {
    const res = await fetch(`${CMS_URL}/api/leads/submit`, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        formId: input.formId,
        formSchemaVersion: input.formSchemaVersion,
        fields: input.fields,
        source: input.source,
        consent: input.consent,
        website: input.website ?? "",
      }),
    });
    const json = (await res.json().catch(() => null)) as SubmitLeadResult | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.error ?? "submit_failed" };
    }
    return { ok: true, duplicate: json.duplicate };
  } catch {
    return { ok: false, error: "network_error" };
  }
}
```

- [ ] **Step 2: Verify build of the helper.**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: clean.

- [ ] **Step 3: Commit.**
```bash
git add apps/web/src/lib/leads/submitLead.ts
git commit -m "feat(web): shared submitLead client helper"
```

### Task 3.2: Wire Book a Demo (reference pattern for all forms)

**Files:**
- Modify: `apps/web/src/components/sections/forms/BookDemoForm.tsx`

- [ ] **Step 1: Replace the stub `onSubmit`.** Read the form values, map input `name`s to HubSpot internal names, build consent, call `submitLead`. Use the form's real `formId`/`schemaVersion` from Phase 2 (constants at top of file). The existing native `<form>` inputs already use `name="firstName"` etc. — collect with `new FormData(e.currentTarget)` and remap:
```tsx
import { submitLead } from "@/lib/leads/submitLead";

const DEMO_FORM_ID = /* from Phase 2 */ 0;
const DEMO_FORM_VERSION = 1;
const NAME_MAP: Record<string, string> = {
  firstName: "firstname", lastName: "lastname", email: "email",
  company: "company", country: "country", phone: "phone",
  referralSource: "how_did_you_hear",
};

const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (inFlightRef.current) return;
  inFlightRef.current = true;
  const fd = new FormData(e.currentTarget);
  const fields: Record<string, string> = {};
  for (const [k, hsName] of Object.entries(NAME_MAP)) {
    const v = fd.get(k);
    if (typeof v === "string" && v.trim()) fields[hsName] = v.trim();
  }
  const consent =
    fd.get("consent_storage") === "on"
      ? { snapshot: "I agree to allow CleanStart to store and process my personal data.", givenAt: new Date().toISOString() }
      : undefined;
  const res = await submitLead({
    formId: DEMO_FORM_ID, formSchemaVersion: DEMO_FORM_VERSION,
    fields, consent, source: typeof window !== "undefined" ? window.location.href : undefined,
    website: String(fd.get("website") ?? ""),
  });
  if (res.ok) { e.currentTarget.reset(); setSubmitted(true); }
  else { setTopError("We couldn't submit the form. Please try again."); }
  window.setTimeout(() => { setSubmitted(false); inFlightRef.current = false; }, 5000);
};
```
Add a `topError` state + render it above the submit button (mirror `FormRenderer`'s `topError` markup).

- [ ] **Step 2: Verify in preview.** Start the web preview, open the demo page, submit with a test email. Confirm: a lead row appears in the CMS (`/admin/collections/leads`), and (if `HUBSPOT_PORTAL_ID` set + GUID present) a contact appears in HubSpot.

Run: `pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web lint`
Expected: clean.

- [ ] **Step 3: Commit.**
```bash
git add apps/web/src/components/sections/forms/BookDemoForm.tsx
git commit -m "feat(web): wire Book a Demo form to /api/leads/submit"
```

### Task 3.3–3.6: Wire the remaining forms (same pattern as 3.2)

Repeat Task 3.2's pattern for each form below — same `submitLead` call, each with its own `formId`, `NAME_MAP`, and consent handling. Commit each separately.

- [ ] **3.3 Contact** (`ContactForm.tsx`) — map `firstName→firstname, lastName→lastname, email→email, company→company, phone→phone, brief→message`. It uses controlled `values` state, so build `fields` from `values` (not FormData). Replace the 600ms fake-delay block with `submitLead`.
- [ ] **3.4 Become-a-Partner** (`BecomePartnerCta.tsx`) — map `firstName→firstname, lastName→lastname, phone→phone, email→email, company→company, website→website, partnerReason→message`. Build from `FormData(e.currentTarget)`.
- [ ] **3.5 Newsletter** (Blog/Blogs/Webinars/Events CTA components) — single `email` field → `email`, optional `consent_marketing`. Extract a small shared `NewsletterForm` if the four CTAs duplicate logic.
- [ ] **3.6 Resource Lead Capture** (`ResourceDetailLeadCapture.tsx`) — `email→email` + `consent`. (The gated-download flow already works via `FormRenderer`; this is the separate inline capture.)

Each: verify a lead row is written + typecheck/lint clean, then commit `feat(web): wire <form> to /api/leads/submit`.

---

## Phase 4 — End-to-end verification

- [ ] **Step 1: Per form**, submit a test entry and confirm:
  1. A `leads` row is created in Payload (`/admin/collections/leads`) with the consent snapshot + policy version.
  2. `leads.syncedTo[]` shows `hubspot: synced` (or `skipped: no-hubspot-form-guid` if a GUID wasn't set).
  3. A contact appears/updates in HubSpot under the matching `website-*` form's submissions.
  4. The HubSpot form's follow-up email (to the user) + internal notification (to the team) fire — *depends on the marketing email setup*.
- [ ] **Step 2: Outage drill.** Temporarily point `NEXT_PUBLIC_CMS_URL`/handler at a bad host or stub a 500; confirm the lead still parks in the R2 fallback queue and drains later (the primary-handler guarantee is unchanged by this work).
- [ ] **Step 3: Consent check.** Submit without ticking `consent_storage` (where required) → client blocks it; submit with only `consent_storage` → lead has consent snapshot, contact created **non-marketing** (assuming the HubSpot default is off); tick `consent_marketing` → contact eligible for marketing.
- [ ] **Step 4: Final gate.** Run full checks for both packages:
```
pnpm --filter @cleanstart/cms lint && pnpm --filter @cleanstart/cms typecheck && pnpm --filter @cleanstart/cms test && pnpm --filter @cleanstart/cms build
pnpm --filter @cleanstart/web lint && pnpm --filter @cleanstart/web typecheck && pnpm --filter @cleanstart/web build
```

---

## Notes / risks to confirm during implementation

- **Turnstile token:** `FormRenderer` does not send a Turnstile token in its body today, yet the gated flow works — so confirm how `endpoints/submit-lead.ts` enforces Turnstile before relying on it. If it expects a `turnstileToken`/`cf-turnstile-response` field, read the token the `TurnstileWidget` injects and include it in the `submitLead` body (extend the helper).
- **Field-name alignment is the linchpin:** the Payload form field `name`s must equal the HubSpot field internal names; otherwise the Forms API rejects unknown fields. Verify against the HubSpot session's output before creating the rows.
- **HubSpot rejects unknown fields** in a Forms API submit — only send fields that exist on the target HubSpot form.
- **Deal Registration stays out** until the marketing decision (Deal-object model). Don't create its `forms` row or wire its component yet.
