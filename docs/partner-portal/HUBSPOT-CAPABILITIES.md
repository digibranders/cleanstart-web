# HubSpot capability check (master plan Task 0.1)

Status: UNVERIFIED. The check needs a HubSpot developer test account and a private app, which an unattended build does not have. A person runs it and replaces each `UNVERIFIED` below with the answer and a screenshot or API response saved next to it. Until then the build uses the fallback named in each row, and every fallback ships working.

| # | Question | Answer | Fallback used until verified |
|---|---|---|---|
| a | Can we create custom association labels (partner and customer on the deal to company link)? | UNVERIFIED | `HUBSPOT_USE_ASSOCIATION_LABELS=false` (the default): the deal uses the default association plus the deal property `partner_company_id` (HubSpot plan, Task 4.1). |
| b | Can a private app subscribe to `deal.propertyChange` webhooks for `dealstage` and `protection_end_date`? | UNVERIFIED | Polling alone every 5 minutes. The webhook receiver (HubSpot plan, Task 4.9) is built and unit tested but stays unsubscribed. |
| c | What is the API rate limit on our production plan? | UNVERIFIED | None needed: drain batches are already capped at 20 operations and the client retries 429 responses three times (HubSpot plan, Task 4.2). |
| d | Are unique-value custom properties allowed? | UNVERIFIED | `portal_registration_id` becomes a plain property. Every create first searches for it, so a retried create still cannot duplicate a deal (HubSpot plan, section 5). |
| e | Does `hs_lastmodifieddate` search work on the partner pipeline? | UNVERIFIED | The HubSpot plan defines no fallback: the inbound poll (Task 4.8) is built on this search, so a negative answer is a decision for a person. |

Decided by these answers: HubSpot plan Tasks 4.1 (schema provisioning) and 4.9 (webhook).
