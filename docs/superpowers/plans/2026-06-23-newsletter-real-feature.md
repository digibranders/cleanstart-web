# Newsletter Real-Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make newsletter signups actually *subscribe* contacts in HubSpot (single opt-in to a configurable subscription type) and capture explicit visible consent, so HubSpot campaigns + a welcome workflow can reach them.

**Architecture:** Add a `hubspotSubscriptionTypeId` field to the `forms` collection; when a form carries it, the existing Forms-API relay (`hubspot.ts`) includes `legalConsentOptions.consent.communications` (the marketing-subscription opt-in). The newsletter web CTAs gain a required visible consent checkbox. The "Newsletter" subscription type + welcome email/workflow are built in HubSpot (ops, documented — no code).

**Tech Stack:** Payload 3 · Next.js 16 · TypeScript strict · Vitest · Postgres (hand-authored migration). Spec: `docs/superpowers/specs/2026-06-23-newsletter-real-feature-design.md`.

**Branch:** Work on `development` (the running dev servers + DB are there for local verification). Stage specific paths only — never `git add -A`. The dev servers are running (CMS :3000, web :3001).

---

## File Structure

**CMS (`apps/cms`):**
- Modify `src/payload/collections/Forms.ts` — add `hubspotSubscriptionTypeId` field.
- Create `src/migrations/20260623_140000_add_forms_hubspot_subscription_type_id.ts` — add the column to `forms` + `_forms_v`.
- Modify `src/migrations/index.ts` — register it.
- Modify `src/payload/lib/lead-handlers/hubspot.ts` — read the field, emit the `communications` opt-in.
- Modify `src/payload/lib/lead-handlers/hubspot.test.ts` — assert the opt-in payload.
- Modify `scripts/seed-website-forms.ts` — set it on the `newsletter` form from env.
- Regenerate `src/payload-types.ts`.

**Web (`apps/web`):**
- Create `src/components/forms/NewsletterConsent.tsx` — dark-surface consent checkbox (forwardRef).
- Create `src/components/forms/NewsletterConsent.test.tsx` — renders + required.
- Modify `src/lib/leads/useNewsletterSignup.ts` — add `consentRef` + required-gating.
- Modify the 5 CTA forms — insert the checkbox below the email+button row.

**Docs:**
- Modify `CLAUDE.md` — rollout note (HubSpot ops: subscription type + welcome workflow).

---

## Task 1: Add `hubspotSubscriptionTypeId` to the Forms collection

**Files:**
- Modify: `apps/cms/src/payload/collections/Forms.ts`

- [ ] **Step 1: Add the field after `hubspotFormGuid`**

In `Forms.ts`, the fields array ends with the `schemaVersion` field then `hubspotFormGuid`. Add this new field immediately after the `hubspotFormGuid` field object (before the closing `]` of `fields`):

```ts
    {
      name: 'hubspotSubscriptionTypeId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Optional. HubSpot subscription type internal id this form opts the contact into (marketing subscription opt-in). Set for the newsletter form; leave empty for forms that should not subscribe.',
      },
    },
```

- [ ] **Step 2: Regenerate types**

Run: `pnpm --filter @cleanstart/cms generate:types`
Confirm: `grep -n "hubspotSubscriptionTypeId" apps/cms/src/payload-types.ts` shows it on the `Form` interface + `FormsSelect`.

- [ ] **Step 3: Typecheck + lint**

Run:
```bash
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec biome lint src/payload/collections/Forms.ts
```
Expected: pass.

- [ ] **Step 4: Commit (stage only these two paths)**

```bash
git add apps/cms/src/payload/collections/Forms.ts apps/cms/src/payload-types.ts
git commit -m "feat(cms): add hubspotSubscriptionTypeId field to forms"
```

> NOTE: if `payload-types.ts` shows unrelated drift (e.g. the known upload `prefix` reordering), still stage it — it's the generated truth. If the diff includes large unrelated blocks from concurrent work, regenerate again and re-check; only commit if the only meaningful change is `hubspotSubscriptionTypeId` (+ any pre-existing benign drift).

---

## Task 2: Migration for the new column (forms + _forms_v)

**Files:**
- Create: `apps/cms/src/migrations/20260623_140000_add_forms_hubspot_subscription_type_id.ts`
- Modify: `apps/cms/src/migrations/index.ts`

- [ ] **Step 1: Write the migration**

Create `apps/cms/src/migrations/20260623_140000_add_forms_hubspot_subscription_type_id.ts` (modeled on `20260602_115320_add_hubspot_form_guid.ts` — `forms` is versioned, so both tables get the column):

```ts
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// hubspotSubscriptionTypeId on the forms collection: the HubSpot marketing
// subscription type a form opts the contact into. forms has versions:{drafts}
// so the _forms_v table gets the version_-prefixed column too.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" ADD COLUMN "hubspot_subscription_type_id" varchar;
  ALTER TABLE "_forms_v" ADD COLUMN "version_hubspot_subscription_type_id" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "forms" DROP COLUMN "hubspot_subscription_type_id";
  ALTER TABLE "_forms_v" DROP COLUMN "version_hubspot_subscription_type_id";`)
}
```

- [ ] **Step 2: Register in index.ts**

In `apps/cms/src/migrations/index.ts`, add the import after the last existing import:
```ts
import * as migration_20260623_140000_add_forms_hubspot_subscription_type_id from './20260623_140000_add_forms_hubspot_subscription_type_id';
```
and add the array entry as the LAST element of `migrations`:
```ts
  {
    up: migration_20260623_140000_add_forms_hubspot_subscription_type_id.up,
    down: migration_20260623_140000_add_forms_hubspot_subscription_type_id.down,
    name: '20260623_140000_add_forms_hubspot_subscription_type_id',
  },
```

- [ ] **Step 3: Verify up+down on a throwaway DB (never the real one)**

```bash
cd /Users/a12345/Desktop/AI/cleanstart/cleanstart-website
MAIN_ENV=apps/cms/.env
base_uri=$(grep -E "^DATABASE_URI=" "$MAIN_ENV" | head -1 | cut -d= -f2- | tr -d '"')
secret=$(grep -E "^PAYLOAD_SECRET=" "$MAIN_ENV" | head -1 | cut -d= -f2- | tr -d '"')
TMPDB=cleanstart_migtest_news
tmp=$(python3 - "$base_uri" "$TMPDB" <<'PY'
import sys, urllib.parse as u
p=u.urlparse(sys.argv[1]); p=p._replace(path='/'+sys.argv[2]); print(u.urlunparse(p))
PY
)
psql "$base_uri" -c "DROP DATABASE IF EXISTS $TMPDB;" >/dev/null 2>&1
psql "$base_uri" -c "CREATE DATABASE $TMPDB;" >/dev/null 2>&1
DATABASE_URI="$tmp" PAYLOAD_SECRET="$secret" pnpm --filter @cleanstart/cms migrate 2>&1 | tail -2
# confirm both columns exist
psql "$tmp" -tAc "SELECT count(*) FROM information_schema.columns WHERE table_name='forms' AND column_name='hubspot_subscription_type_id';"
psql "$tmp" -tAc "SELECT count(*) FROM information_schema.columns WHERE table_name='_forms_v' AND column_name='version_hubspot_subscription_type_id';"
# isolated down() check
psql "$tmp" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
ALTER TABLE "forms" DROP COLUMN "hubspot_subscription_type_id";
ALTER TABLE "_forms_v" DROP COLUMN "version_hubspot_subscription_type_id";
COMMIT;
SQL
echo "down exit: $?"
psql "$base_uri" -c "DROP DATABASE IF EXISTS $TMPDB;" >/dev/null 2>&1 && echo "dropped"
```
Expected: migrate ends "Done."; both column counts = `1`; down exit `0`.

- [ ] **Step 4: Apply to the running dev DB (so the local API accepts the field)**

The local DB is push-mode; the running CMS dev server (:3000) will push the new collection field on its next restart, OR run migrate against the dev DB once. Simplest: it's already covered because Task 1 changed the collection and the dev server hot-reloads + pushes. Confirm the column exists in dev:
```bash
base_uri=$(grep -E "^DATABASE_URI=" apps/cms/.env | head -1 | cut -d= -f2- | tr -d '"')
psql "$base_uri" -tAc "SELECT COALESCE((SELECT 'yes' FROM information_schema.columns WHERE table_name='forms' AND column_name='hubspot_subscription_type_id' LIMIT 1),'no');"
```
If `no`, restart the CMS dev server (it pushes on boot). Expected eventually: `yes`.

- [ ] **Step 5: Lint + commit**

```bash
pnpm --filter @cleanstart/cms exec biome lint src/migrations/20260623_140000_add_forms_hubspot_subscription_type_id.ts
git add apps/cms/src/migrations/20260623_140000_add_forms_hubspot_subscription_type_id.ts apps/cms/src/migrations/index.ts
git commit -m "feat(cms): migration for forms.hubspotSubscriptionTypeId"
```

---

## Task 3: Emit the subscription opt-in in the HubSpot relay

**Files:**
- Modify: `apps/cms/src/payload/lib/lead-handlers/hubspot.ts`
- Test: `apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts`

- [ ] **Step 1: Write the failing tests**

In `hubspot.test.ts`, change the `ctx` helper to accept an optional subscription id, and add two tests. Replace the existing `ctx` helper:

```ts
const ctx = (guid: string | null, subscriptionTypeId?: string) =>
  ({
    payload: {
      findByID: vi.fn(async () =>
        guid
          ? { id: 7, hubspotFormGuid: guid, hubspotSubscriptionTypeId: subscriptionTypeId ?? null }
          : { id: 7 },
      ),
    },
    primarySucceeded: true,
    leadId: 7,
    duplicateOfLeadId: undefined,
    formFieldDefs: [{ name: 'email', type: 'email' }],
  }) as unknown as Parameters<typeof hubspotHandler.run>[1];
```

Add these tests (inside the existing `describe`):

```ts
  it('includes a marketing-subscription opt-in when the form has hubspotSubscriptionTypeId', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);
    await hubspotHandler.run(submission, ctx('guid-1', '42'));
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.legalConsentOptions.consent.communications).toEqual([
      { value: true, subscriptionTypeId: 42, text: 'I agree…' },
    ]);
    expect(sent.legalConsentOptions.consent.consentToProcess).toBe(true);
  });

  it('omits communications when the form has no hubspotSubscriptionTypeId', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);
    await hubspotHandler.run(submission, ctx('guid-1'));
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.legalConsentOptions.consent.communications).toBeUndefined();
  });
```

- [ ] **Step 2: Run, confirm the new tests FAIL**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lead-handlers/hubspot.test.ts`
Expected: the two new tests fail (communications undefined / shape mismatch).

- [ ] **Step 3: Implement**

In `hubspot.ts`, widen the form cast (line ~109) and read the id:

```ts
    const form = (await ctx.payload.findByID({
      collection: 'forms',
      id: submission.formId,
      depth: 0,
      overrideAccess: true,
    })) as { hubspotFormGuid?: string | null; hubspotSubscriptionTypeId?: string | null } | null;
    const guid = form?.hubspotFormGuid?.trim();
    if (!guid) {
      return { handler: 'hubspot', status: 'skipped', reason: 'no-hubspot-form-guid' };
    }
    const subscriptionTypeId = Number(form?.hubspotSubscriptionTypeId);
```

Replace the consent block (lines ~127-134):

```ts
    if (submission.consent) {
      const consent: Record<string, unknown> = {
        consentToProcess: true,
        text: submission.consent.snapshot,
      };
      if (Number.isFinite(subscriptionTypeId)) {
        consent.communications = [
          { value: true, subscriptionTypeId, text: submission.consent.snapshot },
        ];
      }
      body.legalConsentOptions = { consent };
    }
```

- [ ] **Step 4: Run tests, confirm PASS**

Run: `pnpm --filter @cleanstart/cms exec vitest run src/payload/lib/lead-handlers/hubspot.test.ts`
Expected: all pass (existing + 2 new).

- [ ] **Step 5: Typecheck + lint + commit**

```bash
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec biome lint src/payload/lib/lead-handlers/hubspot.ts src/payload/lib/lead-handlers/hubspot.test.ts
git add apps/cms/src/payload/lib/lead-handlers/hubspot.ts apps/cms/src/payload/lib/lead-handlers/hubspot.test.ts
git commit -m "feat(cms): relay marketing-subscription opt-in to HubSpot for subscribed forms"
```

---

## Task 4: Seed the newsletter form's subscription id from env

**Files:**
- Modify: `apps/cms/scripts/seed-website-forms.ts`

- [ ] **Step 1: Add the field to the SeedForm type + newsletter entry + data object**

In `seed-website-forms.ts`:
1. Add `hubspotSubscriptionTypeId?: string;` to the `SeedForm` type (find the `type SeedForm = {` definition and add it).
2. Set it on the newsletter entry, sourced from env so it isn't hardcoded before the id exists:

```ts
  {
    slug: 'newsletter',
    name: 'Newsletter',
    hubspotFormGuid: 'd23691e3-fabd-41d1-8d19-3384d6043179',
    ...(process.env.HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID
      ? { hubspotSubscriptionTypeId: process.env.HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID }
      : {}),
    fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
  },
```

3. In the `data` object passed to create/update, add the field:
```ts
    const data = {
      name: form.name,
      slug: form.slug,
      fields: form.fields,
      submitLabel: 'Submit',
      postSubmit: { kind: 'message' as const },
      crmHandlers: ['hubspot' as const],
      hubspotFormGuid: form.hubspotFormGuid,
      ...(form.hubspotSubscriptionTypeId
        ? { hubspotSubscriptionTypeId: form.hubspotSubscriptionTypeId }
        : {}),
      _status: 'published' as const,
    };
```

- [ ] **Step 2: Typecheck + lint**

```bash
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec biome lint scripts/seed-website-forms.ts
```
Expected: pass. (Do NOT run the seed here — it's run at rollout once the subscription id exists.)

- [ ] **Step 3: Commit**

```bash
git add apps/cms/scripts/seed-website-forms.ts
git commit -m "feat(cms): seed newsletter form subscription id from env"
```

---

## Task 5: `NewsletterConsent` component (dark-surface checkbox)

**Files:**
- Create: `apps/web/src/components/forms/NewsletterConsent.tsx`
- Test: `apps/web/src/components/forms/NewsletterConsent.test.tsx`

The newsletter CTAs sit on dark/glass surfaces (white text), so this mirrors `LeadConsent`'s structure but with light-on-dark colors. It forwards a ref to the checkbox so the hook can read `.checked`.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/components/forms/NewsletterConsent.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { NewsletterConsent } from "./NewsletterConsent";

describe("NewsletterConsent", () => {
  it("renders a required checkbox named consent_newsletter linked to the ref", () => {
    const ref = createRef<HTMLInputElement>();
    render(<NewsletterConsent ref={ref} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box).toBe(ref.current);
    expect(box.name).toBe("consent_newsletter");
    expect(box.required).toBe(true);
  });

  it("links to the privacy policy", () => {
    render(<NewsletterConsent ref={createRef<HTMLInputElement>()} />);
    expect(screen.getByRole("link", { name: /privacy policy/i })).toHaveAttribute(
      "href",
      "/privacy-policy",
    );
  });
});
```

- [ ] **Step 2: Run, confirm FAIL** (module missing)

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/forms/NewsletterConsent.test.tsx`

- [ ] **Step 3: Implement**

Create `apps/web/src/components/forms/NewsletterConsent.tsx`:

```tsx
import Link from "next/link";
import { forwardRef } from "react";

/**
 * Required consent checkbox for the newsletter CTAs. These sit on dark/glass
 * surfaces, so the copy is light-on-dark (unlike LeadConsent, which targets
 * white surfaces). Forwards a ref to the input so the signup hook can gate
 * submission on `.checked`.
 */
export const NewsletterConsent = forwardRef<HTMLInputElement>(
  function NewsletterConsent(_props, ref): React.ReactElement {
    return (
      <label
        className="flex items-start cursor-pointer text-left"
        style={{ gap: "8px" }}
      >
        <span
          className="inline-flex shrink-0 items-center"
          style={{ height: "1.4em", fontSize: "var(--fs-caption)" }}
        >
          <span className="relative inline-flex" style={{ width: "18px", height: "18px" }}>
            <input
              ref={ref}
              type="checkbox"
              name="consent_newsletter"
              required
              aria-required
              className="peer w-full h-full appearance-none cursor-pointer rounded-[4px] bg-white/15 border-[1.5px] border-white/50 checked:bg-white checked:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            />
            <svg
              aria-hidden
              viewBox="0 0 16 16"
              className="pointer-events-none absolute inset-0 m-auto hidden peer-checked:block"
              width="12"
              height="12"
            >
              <path
                d="M3 8.5l3 3 7-7"
                fill="none"
                stroke="#0F123E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </span>
        <span
          style={{
            fontFamily: "var(--font-sans), 'Sora', sans-serif",
            fontWeight: 400,
            fontSize: "var(--fs-caption)",
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          I agree to receive the CleanStart newsletter and to the storage &amp; processing of my
          email per the{" "}
          <Link href="/privacy-policy" className="underline" style={{ color: "#EDCBFF" }}>
            Privacy Policy
          </Link>
          <span className="ml-0.5 text-[#FFB4B4]">*</span>
        </span>
      </label>
    );
  },
);
```

- [ ] **Step 4: Run, confirm PASS**

Run: `pnpm --filter @cleanstart/web exec vitest run src/components/forms/NewsletterConsent.test.tsx`
Expected: 2 pass. (If `@testing-library/react`/`jsdom` isn't configured for web vitest, check `apps/web/vitest.config` — match however existing component tests run; if web has no component-test setup, convert these to a lighter assertion that the component renders the expected props, or skip the test file and rely on typecheck + the manual smoke. Report which.)

- [ ] **Step 5: Typecheck + lint + commit**

```bash
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web exec biome lint src/components/forms/NewsletterConsent.tsx src/components/forms/NewsletterConsent.test.tsx
git add apps/web/src/components/forms/NewsletterConsent.tsx apps/web/src/components/forms/NewsletterConsent.test.tsx
git commit -m "feat(web): newsletter consent checkbox (dark surface)"
```

---

## Task 6: Gate the signup hook on the consent checkbox

**Files:**
- Modify: `apps/web/src/lib/leads/useNewsletterSignup.ts`

- [ ] **Step 1: Add `consentRef` + required-gating**

Update `useNewsletterSignup.ts`:
1. Add to the interface: `consentRef: React.RefObject<HTMLInputElement | null>;`
2. In the hook body, add `const consentRef = useRef<HTMLInputElement>(null);`
3. In `handleSubmit`, after the `email` guard and before `inFlightRef`, add:
```ts
    if (!consentRef.current?.checked) {
      setError("Please agree to the Privacy Policy to subscribe.");
      return;
    }
```
4. Return `consentRef` in the returned object.

Full updated file:

```ts
"use client";

import { useRef, useState } from "react";
import { submitLead } from "./submitLead";

const NEWSLETTER_CONSENT_TEXT =
  "I agree to receive the CleanStart newsletter and to the storage & processing of my email per the Privacy Policy.";

export interface NewsletterSignup {
  emailRef: React.RefObject<HTMLInputElement | null>;
  consentRef: React.RefObject<HTMLInputElement | null>;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function useNewsletterSignup(): NewsletterSignup {
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const email = emailRef.current?.value.trim();
    if (!email) return;
    if (!consentRef.current?.checked) {
      setError("Please agree to the Privacy Policy to subscribe.");
      return;
    }
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    const result = await submitLead({
      formSlug: "newsletter",
      fields: { email },
      consent: {
        snapshot: NEWSLETTER_CONSENT_TEXT,
        givenAt: new Date().toISOString(),
        categories: ["marketing"],
      },
      ...(typeof window !== "undefined" ? { source: window.location.href } : {}),
    });

    inFlightRef.current = false;
    setSubmitting(false);
    if (result.ok) {
      setSubmitted(true);
      if (emailRef.current) emailRef.current.value = "";
      if (consentRef.current) consentRef.current.checked = false;
      window.setTimeout(() => setSubmitted(false), 5000);
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  return { emailRef, consentRef, submitted, submitting, error, handleSubmit };
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @cleanstart/web typecheck`
Expected: this will surface type errors in the 5 CTAs only if they spread the hook — they destructure named fields, so adding `consentRef` to the interface won't break them yet. Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/leads/useNewsletterSignup.ts
git commit -m "feat(web): require consent checkbox in newsletter signup hook"
```

---

## Task 7: Wire the checkbox into the 5 CTA forms

Each CTA currently renders a horizontal `email + Subscribe` row as the `<form>`. Apply this exact transformation to **each** file: (1) destructure `consentRef` from the hook, (2) make the `<form>` a vertical stack, (3) wrap the existing email+button row in a `<div>`, (4) render `<NewsletterConsent ref={consentRef} />` below it.

**Files (apply to all 5):**
- `apps/web/src/components/sections/blogs/BlogsCTA.tsx`
- `apps/web/src/components/sections/blog/BlogDetailCTA.tsx`
- `apps/web/src/components/sections/guides/GuidesCTA.tsx`
- `apps/web/src/components/sections/events/EventsCTA.tsx`
- `apps/web/src/components/sections/webinars/WebinarsCTA.tsx`

- [ ] **Step 1: Worked example — BlogsCTA.tsx**

Add the import at the top:
```tsx
import { NewsletterConsent } from "@/components/forms/NewsletterConsent";
```
Change the hook destructure (line 10) to include `consentRef`:
```tsx
  const { emailRef, consentRef, submitted, submitting, error, handleSubmit } = useNewsletterSignup();
```
Restructure the `<form>` (the email+button row gets wrapped; the form becomes a column and gains the checkbox). Replace the existing `<form …>…</form>` with:

```tsx
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 w-full"
                aria-label="Newsletter subscription"
              >
                <div className="relative flex items-center w-full">
                  {/* existing email <div>…<input ref={emailRef} …/></div> and the
                      existing <button type="submit">…</button> go here UNCHANGED */}
                </div>
                <NewsletterConsent ref={consentRef} />
              </form>
```
i.e. keep the original email-wrapper `<div>` and `<button>` verbatim, just move them inside the new inner `<div className="relative flex items-center w-full">`, and put `<NewsletterConsent ref={consentRef} />` after that div. The outer `<form>` className changes from `relative flex items-center w-full` to `flex flex-col gap-3 w-full`.

- [ ] **Step 2: Apply the same transformation to the other 4 CTAs**

For each of `BlogDetailCTA.tsx`, `GuidesCTA.tsx`, `EventsCTA.tsx`, `WebinarsCTA.tsx`: READ the file, then (a) add the `NewsletterConsent` import, (b) add `consentRef` to the `useNewsletterSignup()` destructure, (c) take that file's existing `<form>`'s direct children (the email wrapper + submit button), wrap them in a single `<div>` that carries the form's CURRENT flex/row classes, change the `<form>` className to `flex flex-col gap-3 w-full` (preserve each form's existing `aria-label` and any width class), and add `<NewsletterConsent ref={consentRef} />` as the form's last child. Do not alter the email input / button markup itself.

- [ ] **Step 3: Typecheck + lint all five**

```bash
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web exec biome lint src/components/sections/blogs/BlogsCTA.tsx src/components/sections/blog/BlogDetailCTA.tsx src/components/sections/guides/GuidesCTA.tsx src/components/sections/events/EventsCTA.tsx src/components/sections/webinars/WebinarsCTA.tsx
```
Expected: pass.

- [ ] **Step 4: Visual smoke (dev server is on :3001)**

Open http://localhost:3001/blog and http://localhost:3001/webinars — confirm each newsletter CTA now shows the email row with a consent checkbox below it, on the dark surface, white label text + Privacy Policy link. The Subscribe button should be disabled-until-checked behavior via native `required` (clicking Subscribe with the box unchecked shows the browser's "check this box" prompt).

- [ ] **Step 5: Commit (stage only the 5 CTA files)**

```bash
git add apps/web/src/components/sections/blogs/BlogsCTA.tsx apps/web/src/components/sections/blog/BlogDetailCTA.tsx apps/web/src/components/sections/guides/GuidesCTA.tsx apps/web/src/components/sections/events/EventsCTA.tsx apps/web/src/components/sections/webinars/WebinarsCTA.tsx
git commit -m "feat(web): add consent checkbox to the 5 newsletter CTAs"
```

---

## Task 8: Docs — HubSpot ops + rollout

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a production-rollout checklist item**

Append a new numbered item to the "Production rollout checklist" in `CLAUDE.md` (use the next number after the current last item):

```markdown
N. **Newsletter subscription opt-in + welcome email (HubSpot ops + env).** Newsletter signups now send a HubSpot marketing-subscription opt-in (`legalConsentOptions.consent.communications`) keyed off `forms.hubspotSubscriptionTypeId`. To make it live: (a) in HubSpot (Settings → Marketing → Email → Subscription Types) create a **"Newsletter"** subscription type and copy its internal id; (b) set `HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID=<id>` in the CMS env (droplet + local) and run `scripts/seed-website-forms.ts` (or set `hubspotSubscriptionTypeId` on the `newsletter` form in Content → SEO → Forms) so the relay opts subscribers in; (c) build a HubSpot **workflow** (trigger: Newsletter subscription = subscribed, or newsletter-form submission) that sends a **Welcome** marketing email. Double opt-in stays OFF (single opt-in). The migration `20260623_140000_add_forms_hubspot_subscription_type_id` ships via CI. Verify: subscribe via a site CTA → the contact shows **subscribed to "Newsletter"** in HubSpot and the welcome workflow fires.
```

- [ ] **Step 2: Add the env var to `.env.example`**

In `apps/cms/.env.example`, near the HubSpot block, add:
```bash
# Newsletter → HubSpot marketing-subscription opt-in. The internal id of the
# "Newsletter" subscription type (Settings → Marketing → Email → Subscription
# Types). When set, the seed assigns it to the newsletter form so signups are
# opted into that subscription. Leave blank until the type is created.
HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID=
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md apps/cms/.env.example
git commit -m "docs(cms): newsletter subscription opt-in rollout + env"
```

---

## Task 9: Full verification gate

- [ ] **Step 1: Run the matrix**

```bash
pnpm --filter @cleanstart/cms lint
pnpm --filter @cleanstart/cms typecheck
pnpm --filter @cleanstart/cms exec vitest run
pnpm --filter @cleanstart/web lint
pnpm --filter @cleanstart/web typecheck
pnpm --filter @cleanstart/web exec vitest run
```
Expected: all pass. (Full `build`s are optional here — the CMS build was exercised recently; run `pnpm --filter @cleanstart/cms build` if you want the extra gate.)

- [ ] **Step 2: Types-drift guard**

Run: `pnpm --filter @cleanstart/cms generate:types` then `git diff --stat apps/cms/src/payload-types.ts` — expect no diff (already committed in Task 1).

- [ ] **Step 3: Optional live smoke (creates a real HubSpot subscribe)**

Only after the HubSpot "Newsletter" subscription type exists + `HUBSPOT_NEWSLETTER_SUBSCRIPTION_TYPE_ID` is set + the newsletter form carries the id: subscribe via http://localhost:3001/blog and confirm in HubSpot the contact is subscribed to "Newsletter". (Skip if the subscription type isn't created yet — the mechanism is unit-tested regardless.)

---

## Self-Review (plan author)

**Spec coverage:** subscription opt-in (Tasks 1–4), visible consent checkbox (Tasks 5–7), newsletter tests (Tasks 3, 5), HubSpot ops + welcome email documented (Task 8), single opt-in preserved (no double-opt-in code). All spec sections covered.

**Placeholder scan:** No TBD/TODO. The one "apply same transformation to 4 more files" (Task 7 Step 2) is a precise mechanical rule with a full worked example (Step 1) — the 5 CTAs share structure but differ in bespoke classes, so the implementer reads each and applies the exact documented wrap; this is intentional, not a vague placeholder.

**Type consistency:** `hubspotSubscriptionTypeId` (string field) → `Number(...)` + `Number.isFinite` guard in hubspot.ts; test passes `'42'` → asserts `subscriptionTypeId: 42`. `consentRef` added to the `NewsletterSignup` interface and returned. `consent_newsletter` checkbox name consistent between component + (native required) gating. Migration column names match the `add_hubspot_form_guid` precedent (`hubspot_subscription_type_id` / `version_hubspot_subscription_type_id`).

**Open execution note:** Task 5 Step 4 flags that `apps/web` may not have a jsdom/react component-test setup — the implementer must check and either match the existing setup or fall back to typecheck + the Task 7 visual smoke. This is the one environmental unknown.
