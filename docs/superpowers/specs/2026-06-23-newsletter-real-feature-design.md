# Newsletter — "real feature" design

**Date:** 2026-06-23
**Status:** Design / awaiting spec review → implementation plan

## Goal

Make the newsletter genuinely functional: subscribers are properly **subscribed** in HubSpot (single opt-in to a dedicated **"Newsletter"** subscription type) so marketing campaigns **and** an automated welcome email actually reach them; the web form captures **explicit, visible consent**; and the path is covered by **newsletter-specific tests**.

## Background & the gap

**Capture already works** (verified 2026-06-23):
- 5 CTA render sites — `BlogsCTA` (/blog), `BlogDetailCTA` (/blog/[slug]), `GuidesCTA` (/guide), `EventsCTA` (/event), `WebinarsCTA` (/webinars) — all use `useNewsletterSignup` → `POST /api/leads/submit` with `formSlug: "newsletter"` → `leads` DB (primary) + HubSpot Contact via the Forms Submissions API (GUID `d23691e3-fabd-41d1-8d19-3384d6043179`). Email field internal name is `email` end-to-end. Turnstile-exempt.

**The gap:** the HubSpot relay (`hubspot.ts`) sends only `legalConsentOptions.consent.{ consentToProcess, text }` — **not** `communications` (the subscription opt-in). So contacts are **created but not subscribed** to any subscription type. HubSpot campaigns send to **subscription types / lists**, so form-captured contacts are **not in the audience** of the 20 active "Marketing Information" emails. We collect the email but can't reliably email them.

**HubSpot state (verified in dashboard):**
- Subscription types: **"Marketing Information"** (Active, used in 20 emails) + **"One to One"** (HubSpot default). **No "Newsletter" type.**
- **Double opt-in is OFF** (single opt-in) — matches the welcome-email choice.
- `website-newsletter` form Published, 3 submissions, last June 5.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Send scope | **Subscribe-only + automated welcome email** |
| Where sending lives | **HubSpot** (workflows + marketing email); our code only captures + opts-in |
| Subscription type | **New dedicated "Newsletter" type** (created in HubSpot) |
| Config mechanism | **`hubspotSubscriptionTypeId` field on the `forms` collection** (editor-configurable, reusable) |
| Opt-in style | **Single opt-in** (double opt-in stays off) |
| Web consent | **Visible required consent checkbox** on the newsletter form |

## Architecture

### A. HubSpot setup (ops — done in the HubSpot UI; documented, not code)

1. **Create a "Newsletter" subscription type** (Settings → Marketing → Email → Subscription Types → Create). Record its **internal id**. *(Dev + prod share the same portal `245478611`, so this is created once and serves both.)*
2. **Create a "Welcome" marketing email** + a **workflow**: enrollment trigger = contact becomes subscribed to "Newsletter" (or submits the `website-newsletter` form) → action: send the Welcome email. Marketing authors the content.
3. **Confirm Double opt-in stays OFF** for single-opt-in behavior.

### B. CMS code (`apps/cms`)

1. **`forms` collection** — add an optional field:
   ```ts
   {
     name: 'hubspotSubscriptionTypeId',
     type: 'text',
     admin: { description: 'Optional. HubSpot subscription type internal id this form opts the contact into (marketing subscription). Leave blank for forms that should not subscribe.' },
   }
   ```
2. **Migration** — hand-authored `add_forms_hubspot_subscription_type_id` (per project memory `migrate-create-needs-tty`, `migrate:create` is unusable headless): `ALTER TABLE "forms" ADD COLUMN "hubspot_subscription_type_id" varchar;` (+ the `_forms_v` version column if forms is versioned). Verify up+down on a throwaway sibling DB.
3. **`hubspot.ts` handler** — it already fetches the form by id to read `hubspotFormGuid`; read `hubspotSubscriptionTypeId` from the same fetch. When it is set **and** `submission.consent` is present, extend the Forms API body:
   ```ts
   legalConsentOptions: {
     consent: {
       consentToProcess: true,
       text: submission.consent.snapshot,
       communications: [
         { value: true, subscriptionTypeId: Number(hubspotSubscriptionTypeId), text: submission.consent.snapshot },
       ],
     },
   }
   ```
   **Backward compatible:** form without the field → no `communications` array (exactly today's behavior). Guard: only emit when `Number.isFinite(Number(id))`.
4. **`seed-website-forms.ts`** — set `hubspotSubscriptionTypeId` on the `newsletter` form to the new Newsletter type id (a committed constant once the id is known; until then left blank → no regression).
5. **Regenerate `payload-types.ts`** and commit.

### C. Web (`apps/web`)

1. **Visible consent checkbox on the newsletter form.** The 5 CTAs are bespoke Figma designs — do **not** rewrite them into one component. Instead add a small **shared `<NewsletterConsent>`** checkbox+label snippet (mirrors the existing `LeadConsent` pattern) and render it inside each of the 5 CTA forms. Compact, single required checkbox; its label is the consent text (links to Privacy Policy).
2. **`useNewsletterSignup` hook** — require the checkbox before submit (block + show an inline error if unchecked); send the explicit consent snapshot + `categories: ["marketing"]` (unchanged shape, now user-affirmed).
   - *Conversion note for review:* a required checkbox on inline content CTAs adds friction. Alternative considered: a visible "By subscribing you agree to the Privacy Policy" **notice line** (implied consent, lower friction, weaker explicit opt-in). **Recommendation: checkbox** (explicit opt-in is correct for a marketing subscription). Flagged so it can be revisited at spec review.

### D. Tests

- `hubspot.ts`: with a form carrying `hubspotSubscriptionTypeId` + consent → body includes `communications: [{ value:true, subscriptionTypeId:<n>, text }]`; without the field → no `communications`. Non-numeric id → skipped safely.
- web: `NewsletterForm`/hook blocks submit until consent checked; `submitLead` payload carries consent.
- Update `schema-surface` snapshot for the new `forms` field if asserted.

## Data flow (unchanged except the opt-in + checkbox)

```
Newsletter CTA (email + required consent checkbox)
  → POST /api/leads/submit { formSlug:"newsletter", fields:{email}, consent }
  → leads DB (primary)
  → hubspot.ts → Forms Submissions API (email + legalConsentOptions.consent.communications opt-in)
  → HubSpot subscribes the contact to "Newsletter"
  → HubSpot workflow sends the Welcome email
  → contact is now in the audience for Newsletter/marketing campaigns
```

## Rollout (prod)

1. Create the "Newsletter" subscription type in HubSpot (shared portal) → id.
2. Set `forms.hubspotSubscriptionTypeId` on the prod `newsletter` form (seed re-run with the id, or via admin).
3. Build the Welcome email + workflow in HubSpot.
4. Migration ships via CI on deploy to `main`.

## Out of scope (YAGNI)

- Recurring auto-digest newsletter (not chosen).
- Double opt-in / confirmation flow (not chosen; HubSpot setting stays off).
- Building any send infrastructure in our backend — HubSpot owns all sending.

## Testing strategy

- **Unit:** the `hubspot.ts` opt-in payload + the web consent-gating.
- **Verification:** local smoke — subscribe via a CTA, confirm the contact shows **subscribed to "Newsletter"** in HubSpot and the Welcome workflow fires.
