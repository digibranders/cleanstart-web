# Integrations dashboard — research note

Status: **research, not yet committed schema**. Companion to `docs/BACKLOG.md` "Future — Integrations dashboard" and `docs/cleanstart-cms-architecture.html` §`#webhooks`, §`#forms`, §`#marketing-tags`.

This doc answers three questions the backlog leaves open:

1. What integrations should the admin surface support, and at what tier?
2. How does each integrate (auth, events, payload, owner, cost, blockers)?
3. Microsoft Teams specifically — multiple channels, multiple recipients, cross-tenant @mentions (e.g. `user@fynix.digital` notified from a `cleanstart.com` tenant).

Decisions that affect schema land back in `cleanstart-cms-architecture.html` and `BACKLOG.md`. Until then, env-vars + Brevo cover launch volume per the existing trigger rule.

---

## 0. Headline finding — Teams "Incoming Webhook" is being retired

The arch doc §`#webhooks` currently specifies *"a single Teams Incoming Webhook URL with `format: 'generic'` JSON"*. That is the **Office 365 Connector** path, which Microsoft is retiring:

- **2024-08**: deprecation announced.
- **2025-01-31**: existing connector URLs had to be re-issued.
- **2025-12-31**: connector service originally retired (extended).
- **2026-05-18**: **final cutoff** — connector-based webhooks stop posting to Teams. ~13 days from today (2026-05-05).

The replacement is the **Workflows** app inside Teams (powered by Power Automate). Editors install the *"Post to a channel when a webhook request is received"* template, which mints a fresh HTTPS URL that accepts JSON and posts an Adaptive Card or plain text. Same `POST { body }` shape on our side; different URL host (`prod-XX.westus.logic.azure.com:443/workflows/...`) and a different payload contract (Workflows expects an Adaptive Card JSON; the older connector accepted a `MessageCard`).

**Action this forces on us, even before any "Integrations dashboard" lands**:

- The Phase G `WebhookEmitter` (BACKLOG G1/G2) must target Workflows URLs from day one. Building the legacy connector path would be DOA.
- Arch doc §`#webhooks` "Incoming Webhook URL" wording needs an update; payload examples need to reference Adaptive Card JSON, not MessageCard.
- The current code state already removed the prototype Teams handler (commit `cbb0fbd`); restoring it should restore *the new path*, not the old.

This is the single most time-sensitive item in this research note.

---

## 1. Teams integration — answers to the specific questions

### 1.1 Can we send to multiple channels?

Yes, but the unit of "destination" in Teams Workflows is **one URL = one (team, channel) pair**. There is no native fan-out. The model is:

- A `#leads` channel and a `#content-publishes` channel each install their own Workflow → two URLs.
- An additional `#sales-eng-leads` channel for routed high-intent leads → a third URL.

Inside our CMS this means the `integrations` collection should let an admin add **multiple Teams rows** (each row = one Workflow URL + label). The `WebhookEmitter` then evaluates a routing rule per row to decide whether the current event ships to that destination.

Routing model that covers the obvious cases (without over-engineering):

```
event ∈ ['document.published', 'lead.submitted']  required
collections: string[]                              optional · empty = all
formSlugs: string[]                                optional · only meaningful for lead.submitted
minLeadScore: number                               optional · only meaningful for lead.submitted
```

Three destinations, three rules — done. Don't build expression languages or boolean trees until a real editor asks.

### 1.2 Can we notify multiple members in a channel?

Yes — Adaptive Cards posted via Workflows webhooks support `<at>` mentions resolved against an `msteams.entities[]` array. Each mention requires the user's **AAD Object ID** (a GUID) and **UPN** (e.g. `alex@cleanstart.com`). Plain `@displayname` strings do **not** notify; only entity-resolved mentions do.

Implementation shape (single Adaptive Card, multi-mention):

```json
{
  "type": "message",
  "attachments": [{
    "contentType": "application/vnd.microsoft.card.adaptive",
    "content": {
      "type": "AdaptiveCard",
      "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
      "version": "1.4",
      "body": [{
        "type": "TextBlock",
        "text": "New lead — assigning <at>Alex</at> and <at>Priya</at>",
        "wrap": true
      }],
      "msteams": {
        "entities": [
          { "type": "mention", "text": "<at>Alex</at>",
            "mentioned": { "id": "<aad-object-id>", "name": "alex@cleanstart.com" } },
          { "type": "mention", "text": "<at>Priya</at>",
            "mentioned": { "id": "<aad-object-id>", "name": "priya@cleanstart.com" } }
        ]
      }
    }
  }]
}
```

What this means for the `integrations` admin surface:

- Each Teams row needs an optional `mentions: { displayName, aadObjectId, upn }[]` sub-list.
- The first version doesn't have to *resolve* names — admins paste AAD Object IDs (copyable from the Entra portal). A later iteration can add a Microsoft Graph "people picker" lookup if anyone asks.
- Mention list can vary by event type if needed (`lead.submitted` mentions sales; `document.published` mentions editors). Same shape as the multi-channel case — store on each row, not globally.

**Caveat**: messages posted via Workflow webhooks always show the **Flow bot** as the author. Bot icon and name customization that the legacy Connector supported is **not** carried forward. That's a Microsoft platform constraint, not something we can work around.

### 1.3 Can we notify someone outside the tenant — e.g. `user@fynix.digital` from a `cleanstart.com` Teams?

Yes. Two distinct paths, with very different administrative cost:

#### Path A — invite as a guest (B2B Collaboration)

- A `cleanstart.com` admin invites `user@fynix.digital` as a **guest** in the `cleanstart.com` Entra tenant.
- The guest accepts and is added to the relevant Team(s) and channel(s) in `cleanstart.com`.
- Their UPN inside the `cleanstart.com` directory takes the form
  `user_fynix.digital#EXT#@cleanstart.onmicrosoft.com`. The `#EXT#` segment is the marker that they're a guest. Their **AAD Object ID** is a fresh GUID issued by `cleanstart.com`'s tenant.
- Once that ID is known, the Adaptive Card mention pattern from §1.2 works exactly the same — paste the `#EXT#` UPN as `mentioned.name`, paste the AAD Object ID as `mentioned.id`, and they get pinged.

This is the pragmatic answer for "can my `fynix.digital` account get pings from the `cleanstart.com` Teams?" — **yes, by being a guest**. No code work, just a directory invite.

Trade-offs of guest path: guest accounts are managed in two places (their home tenant for sign-in, the `cleanstart.com` tenant for membership and licensing). They count toward Entra guest limits; some org policies restrict what guests can see. They sign in with their `fynix.digital` credentials but see `cleanstart.com` resources.

#### Path B — Shared Channels via B2B Direct Connect (Teams Connect)

- **Both** tenants (`cleanstart.com` and `fynix.digital`) configure cross-tenant access policies in Entra to mutually trust each other for B2B Direct Connect.
- A `cleanstart.com` admin creates a *shared channel* in a Team and invites `user@fynix.digital` directly (not as a guest, as a native external participant).
- The user signs in with `fynix.digital` credentials and accesses the shared channel **without a tenant switch and without a guest account**.

Trade-offs: requires admin coordination on both tenants. Guests **cannot** be added to shared channels — it's one mechanism or the other, not both. Limits on number of shared channels per Team. More setup overhead, fewer ongoing user-management surprises.

**For the CleanStart use case** (one or two `fynix.digital` operators want pings during the build-out): Path A (guest invite) is right. It's a 5-minute admin task and the Adaptive Card mention payload is identical to a same-tenant member.

Path B becomes worth it later if there's an ongoing partnership where multiple `fynix.digital` users need persistent access to specific Teams channels and don't want to manage guest accounts.

### 1.4 What our schema needs to capture for Teams

```ts
// Sketch — refined version of BACKLOG.md "Future — Integrations dashboard"
type TeamsIntegration = {
  kind: 'teams';
  label: string;                         // "Sales channel · #sales-eng-leads"
  enabled: boolean;
  webhookUrl: string;                    // Workflows URL (encrypted at rest)
  signingSecret?: string;                // optional Standard Webhooks HMAC; Teams ignores it,
                                         // but downstream proxies (n8n, Zapier) may not
  routing: {
    events: ('document.published' | 'lead.submitted')[];
    collections?: string[];              // empty = all
    formSlugs?: string[];                // only checked for lead.submitted
    minLeadScore?: number;               // only checked for lead.submitted
  };
  mentions?: Array<{
    displayName: string;                 // "Alex"
    aadObjectId: string;                 // GUID
    upn: string;                         // alex@cleanstart.com OR
                                         // user_fynix.digital#EXT#@cleanstart.onmicrosoft.com
    triggerOn?: ('document.published' | 'lead.submitted')[];
  }>;
};
```

`webhookUrl` and `signingSecret` are encrypted at rest (same field-encryption layer used for any future API key — see §3 below).

---

## 2. Integration landscape — what to support, and when

The arch doc already names the launch surface (Brevo, GTM, GA4, GSC, Cloudflare, Vercel, Sentry, BetterStack). This research scopes the **post-launch integrations dashboard** — the editor-facing surface where channels are added without a code change. Tier ordering reflects how often a real editor will request the integration based on the existing arch doc and the lead-handler design in §`#forms`.

| Tier | Integration | What it does | Auth | Events consumed | Cost | Owner |
|------|-------------|--------------|------|-----------------|------|-------|
| **1 — day 1 of dashboard** | Microsoft Teams | Channel pings for `lead.submitted` and `document.published`; multi-channel and multi-mention per §1 | Workflows webhook URL (per channel) | both | $0 (uses existing M365) | Editor self-serve |
| 1 | Slack | Channel pings, optional `<@user>` mentions, Block Kit message blocks | Slack Incoming Webhook URL **or** Slack App OAuth (`chat:write`) | both | $0 free tier | Editor self-serve |
| 1 | Generic webhook | Catch-all for Zapier / n8n / Make / custom HTTPS endpoints; Standard Webhooks signing | Target URL + signing secret | both | varies (Zapier paid above 100 tasks/mo) | Editor or eng |
| **2 — primary CRM (in use)** | **Zoho CRM** | `lead.submitted` → Leads or Contacts upsert, optional Deal create, optional Campaign list membership; `deleteByEmail()` cascade for GDPR Art. 17 | Zoho OAuth 2.0 self-client (data-centre-scoped: `accounts.zoho.com` / `.eu` / `.in` / `.com.au` / `.jp`) → long-lived refresh token | `lead.submitted` only | Bundled in existing Zoho One / CRM subscription | Eng wires; sales owns mapping |
| 2 | HubSpot | `lead.submitted` → contact upsert, deal create, list membership | OAuth (Public App) → refresh token | `lead.submitted` only | Free CRM tier; Marketing Hub paid for automation | Future — only if sales tooling changes |
| 2 | Salesforce | Same as HubSpot, different object model (Lead, Contact, Account) | OAuth Connected App + refresh token | `lead.submitted` only | $$$ (Sales Cloud) | Future — only if sales tooling changes |
| 2 | Pipedrive | Lighter-weight CRM | OAuth or API token | `lead.submitted` only | $$ (Essential ~$15/user) | Future |
| 2 | Google Sheets | Append-row sink — cheap audit trail alongside Zoho or as fallback during a Zoho outage | Service account JSON + spreadsheet ID | both | $0 | Eng (one-time) |
| **3 — analytics / SEO server-side** | GA4 (Measurement Protocol) | Server-side events (`generate_lead`, `purchase`) joined to the GA4 stream — survives ad-blockers, captures CMS-side lead source | Measurement ID + API secret | `lead.submitted` | $0 | Marketing |
| 3 | Google Search Console / Indexing API | Auto-ping Google on slug change or new doc; surfaces GSC coverage data on the dashboard | Service account JSON, owner role on GSC property | `document.published`, slug-change cron | $0 | Eng |
| 3 | IndexNow | Generic "URL changed" ping accepted by Bing, Yandex, Naver | Static key file at site root | `document.published` | $0 | Eng |
| **4 — comms beyond chat** | SMS via Twilio | High-intent leads (deal-registration form, demo request) ping a phone number | Twilio Account SID + Auth token + From number | `lead.submitted` (filtered by formSlug or score) | $0.0079/SMS US | Sales |
| 4 | Discord | Same shape as Slack/Teams — relevant if community Discord exists | Discord Incoming Webhook URL | both | $0 | Editor self-serve |
| 4 | Email digest (Brevo template) | Daily/weekly digest of leads or new content for stakeholders not in chat | Existing Brevo API key | both, batched | $0 (free 300/day) | Editor |
| **5 — booking / chat widgets — frontend, not dashboard** | Calendly · Chili Piper · HubSpot Meetings | Inline demo-booker on `apps/web` once sales adopts a tool | Provider-specific embed/iframe | n/a | varies | Eng + sales |
| 5 | Intercom · Drift · Crisp | Chat widget on the public site; lead capture from chat → `LeadHandler` | Provider widget + webhook back into `/api/leads/submit` | reverse: external → `lead.submitted` | $$ | Eng + support |

**Zoho specifics** (since it's the active CRM):

- **Data-centre scoping is load-bearing.** Zoho splits OAuth + API hosts by data centre — `accounts.zoho.com` + `www.zohoapis.com` (US), `accounts.zoho.eu` + `www.zohoapis.eu` (EU), `accounts.zoho.in` + `www.zohoapis.in` (India), and so on for `.com.au` / `.jp`. The integration row's `config` must store the DC ("us" / "eu" / "in" / …); a refresh token from one DC will not work against another. Confirm CleanStart's actual DC before wiring.
- **Self-client OAuth is fine** for a server-to-server lead-handler (no user-facing OAuth flow required). Generate a self-client in Zoho Developer Console, exchange for a refresh token once, store encrypted. Refresh tokens are long-lived but revocable; the access token TTL is ~1 hour.
- **Object model**: `Leads` for unqualified inbound (sales-led companies use this), `Contacts` for known accounts, `Deals` for active pipeline. The deal-registration form in arch doc §`#forms` should likely create `Leads` + `Deals` together; the contact form just creates `Leads`. Mapping per form is editor-configurable, not hardcoded.
- **Field mapping**: Zoho's standard fields (`Last_Name`, `Email`, `Company`, `Lead_Source`, `Description`) are renamed in some orgs via the field-customizer. The integration row's `config` should let an admin paste the actual API name per field, not assume defaults.
- **Bigin vs CRM**: Zoho also offers Bigin (lighter pipeline tool) — it has a different REST surface. The integration row's `kind` should be `zoho-crm` specifically, with a separate `zoho-bigin` row available later if needed.
- **GDPR Art. 17 cascade**: Zoho's "Delete Records" API deletes by record ID. The `deleteByEmail()` cascade hook needs a search-by-email step first, then delete by returned IDs.

**What's intentionally absent** (don't build until a real editor surfaces the need):

- LinkedIn Lead Gen Forms inbound (low signal — most B2B forms live on the site, not LinkedIn).
- Marketo, Eloqua, Pardot — heavier-weight than the CRMs above; ride on the same OAuth pattern when needed.
- Freshsales, Close — same shape as HubSpot; one-row-per-vendor in the CRM tier when adopted.
- Webhook receivers FROM the CMS (e.g. Stripe → CMS) — out of scope; arch doc has "no ecommerce".
- AI/MCP surfaces — arch doc §`#decisions` already defers MCP server card / WebMCP / api-catalog.

---

## 3. How the dashboard wires up — design notes

The schema sketch in `BACKLOG.md` is right in shape. Three refinements from this research:

### 3.1 Per-row routing, not per-handler

Don't model "kind = teams" as a single global handler. Model **each row** as an independent destination with its own routing predicate. Three Teams rows with different filters is the common case (sales channel, content channel, exec digest).

### 3.2 Encryption of `config`

The `config` JSON column carries webhook URLs, OAuth refresh tokens, signing secrets, and service-account JSON. It must be encrypted at rest with a tenant-managed key (Postgres `pgcrypto` or app-layer `node:crypto` with the key in `PAYLOAD_SECRET`-adjacent env). Plaintext in Postgres is unacceptable for OAuth tokens.

Surface implication: the admin form shows the secret once on save, then masks (`••••••••`) on every reopen. A "Rotate" button generates new credentials for re-paste. No "show secret" toggle once stored.

### 3.3 Reuse the Phase G dead-letter machinery

The arch doc §`#webhooks` already specifies the 5-attempt retry → `webhooks_dead_letter` table → admin "Failed webhooks" view. The `integrations` collection rides on top of it: every row's outbound delivery uses the same emitter, same retry curve (immediate / 5m / 15m / 1h / 6h), same dead-letter UX. Don't fork.

### 3.4 Per-row operations the admin form needs

For each row, regardless of kind:

- **Test button** — sends a fixture event to the destination immediately, returns HTTP status + latency. Phase G6 wrapper.
- **Health badge** — green / yellow / red based on the last 24 h of `webhooks_dead_letter` activity for this row. Red = ≥ 3 dead-letters in the window.
- **Pause** — disable without deleting; preserves config for re-enable.
- **Audit trail** — every row's update writes a `lifecycleAudit[]` entry per the existing arch doc audit pattern (who, when, what changed; secret values redacted).

### 3.5 Admin view UX

Single list view sorted by `kind` then `label`, with row badges for `kind`, `enabled`, and health. Filter chips: kind, event subscription, enabled state. Edit drawer per row — kind picker disabled after creation (changing kind = delete + recreate; cleaner than mutating config shape).

---

## 4. What this research changes upstream

Specific edits queued for `cleanstart-cms-architecture.html` and `BACKLOG.md` once the dashboard work is scheduled:

1. **§`#webhooks`** — replace "Microsoft Teams Incoming Webhook URL" wording with "Microsoft Teams Workflows webhook URL" and update the example payload to Adaptive Card JSON. Reference the May 2026 connector retirement explicitly so future readers don't reintroduce the legacy path.
2. **§`#forms`** — add `gateForm`-style cross-references for the new CRM rows once OAuth wiring lands (HubSpot, Salesforce). Link to the per-row routing model in §3.1 here.
3. **§`#marketing-tags`** — leave the GTM-first matrix untouched; that's launch-tier code-side wiring, not dashboard-tier editor wiring. The dashboard's GA4 row is server-side **Measurement Protocol**, complementary to GTM, not a replacement.
4. **`BACKLOG.md` "Future — Integrations dashboard"** — replace the day-1 candidate list with the Tier-1 set from §2 (Teams, Slack, generic webhook). Tiers 2–4 stay backlog. Schema sketch updated to match §1.4 (per-row routing + mentions).
5. **Phase G — Webhooks** — note explicitly that G1's "Webhook emitter: `document.published` + `lead.submitted` to Teams" must target the Workflows URL shape, not the legacy connector. This is the only ticket where the May 2026 deadline directly bites.

None of these edits are made by this research note; they land when the dashboard work is scheduled. Until then, this doc is the authoritative reference for *what* the dashboard supports and *why*.

---

## 5. Open questions for the next planning session

Things this research note is deliberately silent on, because they need a product call:

- **Default channel routing on day 1**: ship with one Teams row pre-seeded from `siteSettings.webhooks[]` (back-fill from existing config), or make the editor add the first row by hand?
- **Per-form routing in the admin**: surface `formSlugs[]` as a multi-select on Teams/Slack rows, or keep per-form routing in the form's `crmHandlers[]` field and have the dashboard read-only show "this form fires X destinations"?
- **OAuth callback hosting**: HubSpot/Salesforce OAuth needs a stable redirect URI on `cms.cleanstart.com`. Settle on `/api/oauth/callback/[provider]` route shape before any CRM row lands.
- **Lead-score field for the `minLeadScore` routing predicate**: arch doc §`#forms` doesn't define a lead-score column today. Either drop the predicate or land it together with whatever first scoring rule (form type, domain enrichment quality, UTM source) the editor cares about.

---

## Sources

Microsoft platform docs and posts that grounded the Teams findings:

- [Retirement of Office 365 connectors within Microsoft Teams — Microsoft 365 Developer Blog](https://devblogs.microsoft.com/microsoft365dev/retirement-of-office-365-connectors-within-microsoft-teams/)
- [Migration update for Office 365 connectors retirement in Teams — webhook URL support (MC1181996)](https://mc.merill.net/message/MC1181996)
- [Create an Incoming Webhook — Microsoft Learn (legacy + migration callout)](https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
- [Use adaptive cards with mention in Microsoft Teams — DEV.to (entity-resolved @mention pattern)](https://dev.to/kenakamu/use-adaptive-cards-with-mention-in-microsoft-teams-4580)
- [How to mention a user in Adaptive Cards in MS Teams — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/2071168/how-to-mention-a-user-in-adaptive-cards-in-ms-team)
- [Notifying users on Teams channel using adaptive cards in incoming webhooks — Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1191797/notifying-users-on-teams-channel-using-adaptive-ca)
- [Shared channels in Microsoft Teams — Microsoft Learn](https://learn.microsoft.com/en-us/microsoftteams/shared-channels)
- [Collaborate with external participants in a shared channel (B2B Direct Connect) — Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-365/solutions/collaborate-teams-direct-connect)
- [B2B direct connect Microsoft Entra overview — Microsoft Learn](https://learn.microsoft.com/en-us/entra/external-id/b2b-direct-connect-overview)
- [Standard Webhooks specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md)
