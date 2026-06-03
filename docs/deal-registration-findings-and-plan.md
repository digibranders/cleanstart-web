# Deal Registration — Findings & Plan

> **Status:** investigation complete, build **blocked on a data-model decision** (see §6).
> **Date:** 2026-06-02 · **Author:** investigation via HubSpot (portal `245478611`) + live site + repo.
> **Scope:** the "Deal Registration" form only. Nothing in this doc has been built or changed in HubSpot — it is a findings + plan record.

Deal registration is unique among the CleanStart forms: it collects **two different people** (a partner representative submitting *on behalf of* a prospect) plus partner/deal metadata. A HubSpot form natively maps to **one** Contact, so this form does not fit the standard "one form → one contact" pattern the other 7 website forms use. This document captures the current state across all four touchpoints and what it will take to do it correctly.

---

## 1. Old / live website form (Webflow — `www.cleanstart.com/deal-registration`)

The current **production** site is still the old Webflow site (the new `apps/web` is not deployed yet).

- **Markup:** `<form id="email-form" class="form flex" method="get">` — **no `action`** (relies on the HubSpot tracking script to capture; see §2).
- **Page title / conversion-page name in HubSpot:** "Deal reg".
- **Sections (visual):** Partner Details · Partner Rep Details · Prospect Details · Deal Details · reCAPTCHA · Submit.
- **Submit button label:** `Submit`.
- **Bot protection:** Google **reCAPTCHA** (`g-recaptcha-response`).

### Live form fields (10 + reCAPTCHA) — exact `name` attributes

| # | `name` attribute | Type | Placeholder | Required (live) |
|---|---|---|---|---|
| 1 | `Partner-Name` | text | Partner Name | **Yes** |
| 2 | `Partner-Rep-First-Name` | text | First Name | **Yes** |
| 3 | `Partner-Rep-Last-Name` | text | Last Name | **Yes** |
| 4 | `Partner-Rep-Phone-Number` | text | Phone Number | **Yes** |
| 5 | `Partner-Rep-Email` | text | Email | **Yes** |
| 6 | `Prospect-First-Name` | text | First Name | **Yes** |
| 7 | `Prospect-Last-Name` | text | Last Name | **Yes** |
| 8 | `Prospect-Phone-Number` | text | Phone Number | **Yes** |
| 9 | `Prospect-Email` | text | Email | **Yes** |
| 10 | `Deal-Details` | textarea | Deal Details | No |

- **No consent checkboxes** on the live Webflow form (the new form adds GDPR consent — see §3).
- ⚠️ **Note:** the live form marks *every* field required (including both phone numbers); the new React form relaxes phones to optional. This needs reconciling (§7).

---

## 2. How the live form is handled today (integration)

It is **not** a HubSpot-embedded form. The Webflow site loads the **HubSpot tracking code site-wide** (portal `245478611`) and HubSpot's **collected-forms** script passively scrapes the native Webflow form submission.

Scripts present on the live page:

| Script | Role |
|---|---|
| `js-na2.hs-scripts.com/245478611.js` | Main HubSpot tracking loader (`_hsq` present) |
| **`js-na2.hscollectedforms.net/collectedforms.js`** | **Collected forms** — auto-detects any HTML form submit and ships values to HubSpot |
| `js-na2.hs-analytics.net/analytics/.../245478611.js` | Analytics |
| `js-na2.hs-banner.com/v2/245478611/banner.js` | Cookie banner |

**Mechanism:** `collectedforms.js` observes the submit, then *guesses* which HubSpot contact property each field maps to using the input's name / label / **placeholder**. There is **no property mapping configured** — it is pure heuristic scraping.

> ⚠️ The Forms-API / collected-script path **only works for HTML form submits**. The new Next.js form posts **JSON**, which `collectedforms.js` cannot observe — so this collection path **stops working at cutover** (documented in [`docs/forms-hubspot-overview.html`](forms-hubspot-overview.html)).

---

## 3. Current HubSpot **collected** form (the live one's record in HubSpot)

- **Name:** `#wf-form-Deal-Registration-Form .form, .flex`
- **Type:** Non-HubSpot **collected** form (no editable field config, no property mapping).
- **Form identifier (CSS selector):** `#wf-form-Deal-Registration-Form, .form, .flex`
- **Created:** May 16 2026 · **Last submission:** May 18 2026
- **Submissions:** **15** — almost all **test data** ("Test Test", "Sid Sid"). No evidence of real production leads.
- **Workflows:** 0 · **Marketing campaign:** none.

### What HubSpot actually stored per submission (from a real captured submission)

| Captured key | Example value | Result in HubSpot |
|---|---|---|
| `partner_name` | Test | ❌ **dropped** — "isn't a Contact property" |
| `prospect_first_name` | Test | ❌ **dropped** |
| `prospect_last_name` | Test | ❌ **dropped** |
| `deal_details` | Test | ❌ **dropped** |
| `first_name_first_name` | 1234567890 | ❌ **dropped** (mangled key; a *phone* value in a name field) |
| `phone_numberphone_number` | test@gmail.com | ❌ **dropped** (mangled key; an *email* value in a phone field) |
| **First Name** | Test | ✅ saved to contact |
| **Last Name** | Test | ✅ saved to contact |
| **Email** | test@gmail.com | ✅ saved to contact |
| **Phone** | 1234567890 | ✅ saved to contact |

**Why the mangling happens:** the form has **two of every generic field** (partner-rep *and* prospect both use "First Name" / "Last Name" / "Phone Number" / "Email" placeholders). HubSpot's heuristic collides the duplicates → garbled keys (`first_name_first_name`, `phone_numberphone_number`), and the deal-specific fields have no matching property so they're discarded.

**Net effect today:** the integration captures **one garbled generic contact** and **silently discards partner name, the prospect person, and deal details.** There is effectively **no structured "deal registration" data in HubSpot.**

---

## 4. New website form (React — not yet deployed)

- **File:** [`apps/web/src/components/sections/forms/DealRegistrationForm.tsx`](../apps/web/src/components/sections/forms/DealRegistrationForm.tsx)
- **Status:** **UI stub only** — `onSubmit` just calls `setSubmitted(true)`; it does **not** post anywhere yet.
- **Planned submit target:** `POST /api/leads/submit` (CMS Payload endpoint) through the `LeadHandler` adapter, with a Cloudflare **Turnstile** token (replacing reCAPTCHA).
- **Submit button label:** `Submit Application`.

### New form fields (camelCase) + required flags

| Field name | Type | Required (React) |
|---|---|---|
| `partnerName` | text | Yes |
| `partnerRepFirstName` | text | Yes |
| `partnerRepLastName` | text | Yes |
| `partnerRepPhone` | tel | No |
| `partnerRepEmail` | email | Yes |
| `prospectFirstName` | text | Yes |
| `prospectLastName` | text | Yes |
| `prospectPhone` | tel | No |
| `prospectEmail` | email | Yes |
| `dealDetails` | textarea | No |
| `consent_marketing` | checkbox | No |
| `consent_storage` | checkbox | **Yes** (GDPR) |

**Improvement vs live:** adds GDPR consent (marketing optional + storage required), uses distinct field names per person (no collisions), and uses Turnstile instead of reCAPTCHA.

---

## 5. New HubSpot form (`website-deal-registration`)

- **GUID:** `9d7c0791-ce24-40d6-8a36-e3cd03a48cfe` · **Editor:** modern · **Folder:** `website` · **State:** Published.
- **Current fields:** ❌ does **not** match the website form. It still carries the generic "book-a-demo" template — First Name, Last Name, Email, Company, Country/Region, Phone, "How did you hear about CleanStart?", + consent block. It was **never built out** for deal registration and was left untouched (flag-only) during the forms cleanup.
- **Property availability:** verified in the form's property picker — searching **"prospect"** and **"deal"** both return **"No related properties found."** None of the deal-specific properties exist.

### Backend / plan context (repo)

- HubSpot lead handler submits via Forms API `POST https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}` — [`apps/cms/src/payload/lib/lead-handlers/hubspot.ts`](../apps/cms/src/payload/lib/lead-handlers/hubspot.ts).
- Deal Registration is **deliberately deferred** — [`docs/superpowers/plans/2026-06-02-forms-hubspot-wiring.md`](superpowers/plans/2026-06-02-forms-hubspot-wiring.md): "needs the two-contact + Deal-object model (pending a marketing decision). Leave `DealRegistrationForm.tsx` as a stub and create no `forms` row for it yet."
- Not seeded in [`apps/cms/scripts/seed-website-forms.ts`](../apps/cms/scripts/seed-website-forms.ts).
- [`docs/BACKLOG.md`](BACKLOG.md): deal-reg should create **Leads + Deals** (vs the contact form which creates Leads only).

---

## 6. The decision that blocks everything (data model)

A deal registration is fundamentally **a deal between two people**. There are two viable models; **someone needs to choose** before the form can be built correctly. Both require **creating things in HubSpot that don't exist today** (which is why this is paused — no properties were created).

### Option A — Deal object + associated contacts (recommended)

Form submission creates:
- a **Deal** (with `dealDetails`, partner/prospect context, on a "Partner / Deal Registration" pipeline), and
- a **Partner Rep contact** + a **Prospect contact**, each associated to the Deal (with association labels like "Partner Rep" / "Prospect").

- ✅ Correct CRM modeling; both people become real, de-duplicated contacts; deal is reportable in the pipeline.
- ➖ More setup: a Deal pipeline + stage, association labels, and `LeadHandler` logic to create deal + two contacts (the Forms API is contact-only, so this needs the CRM/objects API or a custom-coded handler).

### Option B — single contact + custom contact properties (quicker, weaker)

Map the **partner rep** to standard `firstname`/`lastname`/`email`/`phone`, and create **custom contact properties** for everything else:
`partner_name`, `prospect_first_name`, `prospect_last_name`, `prospect_email`, `prospect_phone`, `deal_details`.

- ✅ Fits the existing Forms-API contact pipeline; fastest to ship.
- ➖ Puts two people on one Contact record (poor hygiene); the prospect never becomes its own contact; reporting is awkward. Essentially the "make it not lose data" version.

---

## 7. What we need to do — action checklist

**Step 0 — Decide the model (Option A vs B above). Everything else depends on this.** ⛔ *owner: marketing/RevOps*

Then, regardless of option:

1. **Create the HubSpot structure** for the chosen model:
   - *Option A:* a Deal pipeline + stage(s), association labels (Partner Rep / Prospect), and any deal property for `deal_details`.
   - *Option B:* the custom **contact** properties listed in §6 (Option B). *(This is the "never create a property" rule being explicitly lifted for this form — needs sign-off.)*
2. **Rebuild the `website-deal-registration` HubSpot form** (`9d7c0791…`) to match:
   - remove the generic template fields (Company, Country, "How did you hear…", and the single First/Last/Email/Phone set);
   - add the 10 deal-reg fields, each mapped to a **distinct** property (no duplicate placeholders → no collisions);
   - add the consent block (marketing optional + storage required);
   - set the submit label and required flags (reconcile §7 item 5).
3. **Wire the React form** — replace the `DealRegistrationForm.tsx` stub with a real `POST /api/leads/submit` (formId + fields + consent + Turnstile token), and add routing in `LeadHandler` to create the Deal + contacts (Option A) or the single mapped contact (Option B).
4. **Seed the `forms` row** in [`apps/cms/scripts/seed-website-forms.ts`](../apps/cms/scripts/seed-website-forms.ts) so the CMS knows about the deal-reg form.
5. **Reconcile required-flag + name-policy conflicts:**
   - Live form: *all* fields required (incl. both phones). React form: phones optional. → pick one policy.
   - The site-wide rule we applied to other forms ("First Name required, Last Name optional") **conflicts** with deal-reg, where the website marks *both* names required for *both* people. → confirm the intended rule for this form specifically.
6. **Bot protection:** confirm the cutover from reCAPTCHA (live) → Turnstile (new) is wired for this form.
7. **Cutover / data safety:**
   - The 15 existing collected submissions are **test data** — no migration needed (confirm there are no real leads before retiring the collected form).
   - Plan the cutover so retiring the `collectedforms.js` path (which stops working once the JSON form goes live) does not silently drop leads — the new `/api/leads/submit` + Forms API/CRM path must be live first.
8. **Retire the old collected form** (`#wf-form-Deal-Registration-Form`) once the new path is verified capturing real submissions.

---

## 8. One-line summary

> Today, deal registration is an old Webflow form that HubSpot's tracking pixel passively scrapes — and because of duplicate generic fields and no property mapping, HubSpot **drops the partner name, the entire prospect, and the deal details**, keeping only one garbled contact. To fix it we must first **decide the data model** (Deal object — recommended — vs custom contact properties), then build the HubSpot structure, rebuild the `website-deal-registration` form to match, and wire the new React form through `LeadHandler`. Nothing should be built until that model decision is made.
