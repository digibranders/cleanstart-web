# Forms → Payload → HubSpot — Verification & Operations

**Status:** All five marketing-site lead forms verified end-to-end (web form → `/api/leads/submit` → Payload lead row → HubSpot Forms API → HubSpot contact). Last verified 2026-06-02 against a local CMS built from the slug-resolution code, with HubSpot relay live to portal `245478611` (NA2).

This doc is the operational companion to `docs/integrations/forms-hubspot-overview.html` (the visual spec). It records the final architecture, the **HubSpot form configuration that is load-bearing for the API relay**, the gotchas found during verification, and how to reproduce the local end-to-end test.

---

## 1. Architecture (as built)

```
Web form (apps/web)                     CMS (apps/cms)                         HubSpot
─────────────────                       ──────────────                         ───────
<form> → submitLead({ formSlug, … }) ─► POST /api/leads/submit
                                         • Zod parse (formId OR formSlug)
                                         • resolve form by slug → id + schemaVersion
                                         • Turnstile verify (unless slug exempt)
                                         • validateFields against forms.fields[]
                                         • LeadHandler chain:
                                            1. db-primary    → leads row (always)
                                            2. company-from-domain
                                            3. hubspot       → POST Forms Submissions API ─► contact + form submission
```

- **Slug, not id.** Web forms reference the CMS `forms` row by **stable slug** (`book-a-demo`, `contact`, `become-a-partner`, `newsletter`, `resource-capture`). The endpoint resolves the slug to the live id + current `schemaVersion`. DB ids differ per environment; slugs don't. Helper: `apps/web/src/lib/leads/submitLead.ts`.
- **No mapping layer.** Each Payload `forms` field `name` **equals the HubSpot internal property name**, so the hubspot handler posts `submission.fields` verbatim. Seeded by `apps/cms/scripts/seed-website-forms.ts`.
- **Relay = Forms Submissions API.** `POST https://api.hsforms.com/submissions/v3/integration/submit/{HUBSPOT_PORTAL_ID}/{hubspotFormGuid}`. The GUID lives on the `forms` row (`hubspotFormGuid`). HubSpot creates/updates the contact and fires the form's own follow-up + notification emails. Handler: `apps/cms/src/payload/lib/lead-handlers/hubspot.ts`.
- **Consent** is sent as `legalConsentOptions` (from the snapshot) — it is NOT a HubSpot form field.
- **No lead is lost if HubSpot fails.** `db-primary` writes the lead row first; the hubspot relay is a secondary handler whose failure is recorded on `leads.synced_to[]` and retried by the dead-letter cron. HubSpot being down/misconfigured never blocks lead capture.

---

## 2. HubSpot form configuration — REQUIRED for the API relay

Each `website-*` form in the HubSpot **"website" folder** must be configured as below. These are not cosmetic — the Forms Submissions API **rejects** submissions otherwise.

| Setting | Required value | Why |
|---|---|---|
| **CAPTCHA (spam prevention)** | **OFF** | If ON, the API returns `400 "Form can't receive API submissions as Captcha (SPAM prevention) is enabled."` We submit server-side and protect the public forms with Cloudflare Turnstile instead; the HubSpot form is never embedded, so its captcha only blocks the relay. |
| **Automatically create new contacts from unknown email addresses** | **ON** | If OFF, a submission with a new email updates nothing — the lead never becomes a contact. New-editor forms default this **OFF**, so it must be turned on. |
| **Set new contacts as marketing contacts** | ON (current) | Every captured lead becomes a marketing contact (counts against the 2,000 marketing-contact cap on Marketing Hub Pro). Flip off if a non-marketing default is wanted — product decision, not a relay requirement. |
| Field internal names | Must match the Payload `forms` field `name`s | The API validates submitted field names against the form; an unknown field is ignored, a **missing required** field 400s. |

### Where these settings live
- **Classic editor** (e.g. `website-contact-us`): CAPTCHA is a form element under **Form tab → "Other form elements (Captcha, data privacy and more)" → CAPTCHA (spam prevention)** toggle. Contact-creation toggles are under **Options → Other submission settings**.
- **New editor** (book-a-demo, partner, newsletter, resource-capture): CAPTCHA is a removable **canvas element** ("protected by reCAPTCHA") — select it on the canvas and delete it (the tree-selection's toolbar can target the neighbouring element, so click the badge directly). Contact-creation toggles are under the **gear → Settings → General** ("Automatically create new contacts…").

---

## 3. Confirmed field mapping (HubSpot internal names)

| Form (slug) | hubspotFormGuid | Fields (HubSpot internal names) |
|---|---|---|
| `book-a-demo` | `3a491549-929f-41df-8446-32702d793780` | `firstname`, `lastname`, `email`, `company`, `country`, `phone`, `how_did_you_hear_about_cleanstart_` |
| `contact` | `380525d8-f536-4ef8-a01a-2815ea542e5d` | `firstname`, `lastname`, `email`, `company`, `phone`, `enter_message` |
| `become-a-partner` | `ea66c444-acfe-4237-9a54-aea500f5e6d7` | `firstname`, `lastname`, `email`, `company`, `phone`, `website`, `enter_message` |
| `newsletter` | `d23691e3-fabd-41d1-8d19-3384d6043179` | `email` |
| `resource-capture` | `82790e37-d079-428c-8145-70749a164fe8` | `email` |

Note the non-obvious names: the message fields are **`enter_message`** (a custom property, not `message`), and "how did you hear" is **`how_did_you_hear_about_cleanstart_`** (trailing underscore).

---

## 4. Gotchas found & fixed during verification (2026-06-02)

1. **CAPTCHA blocks the API (all 5 forms).** Initial relay attempts all failed with `400 … Captcha (SPAM prevention) is enabled`. An earlier assumption that "reCAPTCHA is harmless for the API path" was **wrong**. Fix: disabled CAPTCHA on all five `website-*` forms.
2. **New-editor forms default "create new contacts" to OFF (4 forms).** book-a-demo, partner, newsletter, resource-capture all had it off → new emails would not create contacts. Fix: turned it on for each.
3. **book-a-demo "Phone Number" was mis-connected to property `number` (a Number-type property), and that property was required.** Relay 400'd with `Required field 'number' is missing` while our submission sent `phone`. Fix: deleted the misconfigured field and re-added a field bound to the standard contact **`phone`** property — now consistent with contact/partner. No code change (the seed already used `phone`).
4. **Preview-automation artifact (not a product bug).** Driving the React forms by setting `input.value` directly in an isolated-world eval did not register for `new FormData(form)`. Real keystrokes (and the React-compatible native value setter + `requestSubmit()`) populate FormData normally; the forms work for real users.

After fixes, all five relays return **synced** and the test contacts appear in HubSpot with correct name/email/phone.

---

## 5. Local end-to-end test (how to reproduce)

**Turnstile test keys** (Cloudflare public always-pass, work on `localhost` — real keys are domain-locked and fail there). Set in the gitignored local env (documented in both `.env.example`s):
- `apps/cms/.env`: `TURNSTILE_SITE_KEY=1x00000000000000000000AA`, `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`, `LEAD_SUBMIT_ALLOWED_ORIGINS=http://localhost:3001`
- `apps/web/.env.local`: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`, `NEXT_PUBLIC_CMS_URL=http://localhost:3000`

**Seed the forms** (idempotent, by slug):
```bash
cd apps/cms
pnpm exec tsx --env-file=.env scripts/seed-website-forms.ts
```

**Run the CMS with the relay on** (Docker image built from current code, pointed at host Postgres, migrate-on-boot skipped because the host schema is push-built):
```bash
docker build -f apps/cms/Dockerfile -t cleanstart-cms:local .
docker run -d --name cms-local -p 3000:3000 --env-file apps/cms/.env \
  -e DATABASE_URI="postgres://postgres:<pass>@host.docker.internal:5432/cleanstart" \
  -e PAYLOAD_AUTO_RUN=false \
  -e HUBSPOT_PORTAL_ID=245478611 \
  cleanstart-cms:local sh -c "pnpm start"
```
> ⚠️ `HUBSPOT_PORTAL_ID` makes every local submission create a **real** HubSpot contact. Leave it **unset** for routine local dev to avoid polluting the portal + the marketing-contact cap; set it only when explicitly testing the relay.

**Submit** (server-to-server example; the browser path is identical via the real forms):
```bash
curl -s -X POST http://localhost:3000/api/leads/submit -H 'content-type: application/json' \
  -d '{"formSlug":"newsletter","fields":{"email":"qa@example.com"},
       "consent":{"snapshot":"nl","givenAt":"2026-06-02T20:00:00Z","categories":["marketing"]}}'
```

**Verify** — lead row + per-handler sync status:
```sql
select l.fields->>'email', st.handler, st.status, coalesce(st.external_id, left(st.error,80))
from leads l join leads_synced_to st on st._parent_id = l.id
where l.fields->>'email' = 'qa@example.com';
```
Expect `db-primary = synced`, `hubspot = synced`. A `hubspot = failed` row carries the HubSpot error verbatim (re-read §2 — almost always a form-config issue).

---

## 6. Open items / cleanup

- **Test data.** Verification created throwaway leads in the local DB and `@example.com` contacts in HubSpot (`hs-ok-*`, `hs-ok2-demo`, plus UI-test rows). The HubSpot ones count against the marketing-contact cap — delete them when done verifying.
- **Restore real Turnstile keys** in local env before any staging/prod parity test (the test keys accept any token).
- **Deal Registration** form relay is still deferred pending the marketing decision on the Deal-object model (see overview doc §7).
