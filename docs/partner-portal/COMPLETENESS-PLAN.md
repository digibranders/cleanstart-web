# Partner portal completeness plan

Written 2026-11-23. Scope: `apps/portal`. This plan joins three inputs: what a real partner and a real CleanStart admin need from the portal, the review of the Eventus Security partner portal, and a screen by screen audit of our own app (every route, nothing run, the top claims re-checked in code).

Finding ids (for example `DEAL-01`) point at the audit, `docs/partner-portal/AUDIT-2026-11-23.md`, which holds file and line evidence for each one. The audit is a copy of the working file the review produced.

## 1. What is wrong, in one paragraph

The build covers the happy path of each screen, but a real user hits dead ends within minutes. Staff have no account page. A partner cannot fix or withdraw a registration. Nobody can edit a team member. Staff can see only waiting deals, never the deal list or an accepted deal. The video player is a black box. The deal form collects too little to be useful to a sales team or to HubSpot (no value, country, industry or stage). Several server actions exist with no screen behind them. The product is not wrong, it is about 70 percent finished, and the missing 30 percent is the part users judge it by.

## 2. Requirements from the people who will use it

### Partner admin (runs the CleanStart relationship at a partner company)

- Get through onboarding without chasing anyone: apply, see where the application stands, accept the invite and agreement, finish a setup checklist that points at real documents.
- Manage my team: invite, correct a name or email, change a role with a confirmation, deactivate, bring someone back, and move a leaver's deals to someone else.
- Register a deal fast with enough detail that CleanStart accepts it the first time: customer, contacts, products, value, stage, expected close, competitor. Save a draft. Get a reference number and a confirmation by email.
- Fix a mistake: edit or withdraw a pending registration, add a contact, register again after an expiry or a loss.
- Prove protection: a downloadable confirmation (customer, product, protected from and until, reference) to show a customer.
- Know what needs me today: expiring deals, rejected deals, replies from my manager, new material. Open a filtered list straight from the overview.
- Find material quickly (grouped by purpose and product, with previews), watch a video in the portal, and request something that is missing and see its status.
- See performance: pipeline value, stage mix, win rate, by person.
- Keep my account safe: password, two-step, sessions. Know what a password reset does.

### Partner sales

- Register and track my own deals and see only them, with the page saying so.
- Sales material (price lists, battlecards, playbooks) one click away, and a confirmation PDF per accepted deal.

### Partner technical

- Technical documents and onboarding guides, with a clear explanation of why deals are not shown.

### CleanStart partner manager (India or Middle East)

- Work the queue fast: every fact I need to decide on one screen (value, customer, contacts, notes, expected close, conflict), the clock against the 2 day target, accept or reject with a reason, ask for more information, bulk actions.
- See all deals, not only waiting ones, by status, partner, manager and overdue, and open any deal including accepted, won, lost and expired ones.
- Correct things on behalf of a partner: edit a registration, reassign the manager or region, register a deal for a partner, fix company details, invite a replacement admin when the only admin left, reset a lost two-step device.
- Review applications properly: full applicant details, internal notes, request more information, a daily digest of what is waiting.
- Keep partners healthy: who is inactive, whose deals expire soon, follow-ups, message a partner and see the history.
- Suspend with a recorded reason.

### CleanStart sales and operations

- Read-only deals, reports by period (value, win rate, time to decision, funnel, by region and manager) and follow-ups, with links that land on the partner or deal.

### CleanStart marketing

- Publish material with proper metadata (summary, duration, type, product), versions and expiry, see who opened what and who has not, and work an inbox of material requests.

### CleanStart administrator

- Manage staff, regions and invites, an account page for myself, the audit log filtered by partner and linked to the object, and integration health with per record retry.

## 3. Ideas taken from the Eventus review

| Idea | Why | Where it lands |
|---|---|---|
| Daily digest of pending approvals and applications for reviewers | Keeps the 2 day target visible without opening the portal | Phase B (B9) |
| Downloadable deal registration confirmation PDF | Partners use it as proof with the customer | Phase B (B6) |
| Visible next step for applicants | Removes "did they get it" emails | Phase C (C9) |
| Status facet filters on staff lists | Faster triage | Phase B (B8) |
| Program page (benefits, eligibility, protection rules, support contact) and a support card | New partners learn the rules in one place | Phase E (E4) |
| Application questions: partner type, current security vendors, products of interest | Better routing and fewer follow-up calls | Phase C (C8) |
| Library grouped by purpose with thumbnails | Matches how partners look for material | Phase D (D2) |

What we do not copy from Eventus: the role kept in browser storage that drives the UI, passwords sent by email, public static files for resources, content hard coded in source, placeholders used as labels, and dead routes.

## 4. Decisions needed from the product owner

These change the build. Each has a default so work can start.

| Id | Decision | Default if you do not decide |
|---|---|---|
| D1 | Deal registration fields to add: value and currency, customer country, industry, use case, competing product, seats or volume, sales stage, decision date, contact role, multiple contacts | All of them, with value optional. They also map to HubSpot deal properties, so the provisioning script grows |
| D2 | Can a partner edit a registration? | Yes while pending. After acceptance only the partner manager can change it, with an audit entry |
| D3 | Can a partner withdraw a registration? | Yes while pending. After acceptance the partner manager releases protection |
| D4 | How do videos play? | The private file from storage in an HTML5 player (no third party). A YouTube or Vimeo link option can come later |
| D5 | PDF generation | On the server, one template shared by the confirmation and later documents |
| D6 | Can staff register a deal for a partner? | Yes, with a partner picker, recorded in the audit log as "on behalf of" |
| D7 | Email change for a user | Requested by the partner admin or manager, confirmed by a link to the new address, audited |
| D8 | Agreement text and PDF | Blocked on legal. The plan builds the re-accept flow and the version history, and ships the text when it exists |
| D9 | Applicant status | A private status link in the receipt email, no account needed |

## 5. Phases

Effort: S under half a day, M 1 to 2 days, L more. Totals are one person working alone. Every phase gets its own detailed test first plan (the same method as the original build) before any code is written, and each phase ends with the demo reseeded and redeployed.

### Phase A: close the obvious gaps (about 6 to 8 days, mostly S items)

Nothing here needs a decision. Do it first because every item is something a user trips over today.

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| A1 | Staff account page and menu entry (the component already supports staff) | AACC-01 | S |
| A2 | "Message manager" hidden when there is no manager, and fixed label | SHELL-01, WEL-02 | S |
| A3 | Password reset: validate the token on load, "request a new link" button, resend with a cooldown, say how long the link lasts, and say other sessions were signed out | RESET-01 to RESET-04 | S |
| A4 | Sign-in message for a suspended company or disabled user | SIGN-01 | S |
| A5 | Team: confirmation and a toast on role change, role change for invited people, notify the person | TEAM-02, ATM-04 | S |
| A6 | Staff team: region change and invite resend controls (the actions exist) | ATM-01, ATM-02 | S |
| A7 | Partners list search and sort, application filters by status and text, partner links from reports and search selecting the record | PTN-01, PTN-05, REP-03, SHELL-04 | S |
| A8 | Audit: partner filter, rows linked to their object | AUD-01, AUD-02 | S |
| A9 | Admin documents: search, type and product filters, edit type, product and summary, duration at upload, summary and duration shown | ADOC-01, ADOC-02, DOC-03 | S |
| A10 | Decision drawer shows notes, expected close, website, all contacts; extension decline takes a reason | APR-03, APR-04 | S |
| A11 | Deal form quick fixes: real date picker, contact role, default region from the partner | REG-02, REG-03, REG-05 | S |
| A12 | Deal detail shows expected close, website, extension reason; rejected deals open the detail page; sortable columns and a fuller CSV | DET-02, DEAL-02, DEAL-03, DEAL-04 | S |
| A13 | Welcome and account copy that no longer promises things that do not exist, "Start here" pulls real documents, notification wording matches the reminders | WEL-01, WEL-03, ACC-02 to ACC-04, INV-03, DONE-02, OVR-03 | S |

### Phase B: deals, end to end (about 15 to 20 days)

The largest gap and the one partners and CleanStart both care about most. Order matters: schema first.

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| B1 | Migration and types for the new registration fields (D1), a registration reference number, and the HubSpot property mapping (update the provisioning script, the mapper and the fake) | REG-01 | L |
| B2 | Rebuild the deal form in three clear sections (customer and contacts, opportunity, notes and consent), several contacts, field help, draft save, unsaved changes warning, a duplicate check that shows the existing registration | REG-01, REG-03, REG-06 | L |
| B3 | After submit: reference number, link to the new deal, and a confirmation email to the partner | REG-04, MAIL-01 | M |
| B4 | Edit and withdraw a pending registration, add or edit contacts, register again after an expiry or a loss with the customer prefilled (D2, D3) | DET-01, DET-03, DET-05 | M |
| B5 | Staff Deals screen: all deals in one list, status facets (waiting, accepted, rejected, expired, won, lost), partner, manager, overdue and conflict filters, sorting, server side paging | APR-01, APR-02, DEAL-01 | L |
| B6 | Staff deal detail page (the decision drawer becomes a view of it), partner deal confirmation PDF (D5), recent decisions rows open it, notifications and search land on the deal | APR-01, APR-07, DET-04, SHELL-04, SHELL-05 | L |
| B7 | Reassign manager or region on a pending registration, bulk accept and reject with a reason, conflict badge opens the other registration | APR-05, APR-07, APR-08 | M |
| B8 | Overview tiles open filtered lists (filters in the URL), pipeline value and stage mix on the overview | OVR-01, OVR-02 | M |
| B9 | Daily digest of waiting registrations and applications at 10:00 IST for each reviewer, and an escalation when a registration passes the target | APR-06, PTN-07, MAIL-02 | M |
| B10 | Staff register a deal on behalf of a partner (D6) | REG-07 | M |

### Phase C: people and companies (about 12 to 15 days)

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| C1 | Edit a team member: name, title, phone, role; email change with a confirmation link (D7); audited | TEAM-01, ACC-01 | M |
| C2 | Team list search, sort and filter; show removed people and reactivate | TEAM-03 | M |
| C3 | Reassign a person's deals when they are removed or leave | TEAM-04 | M |
| C4 | Invite sets the person's name; derive the permissions table from the real policies on both screens | TEAM-05, TEAM-06, ROLE-02, ATM-03 | S |
| C5 | Staff manage a partner's people: invite, resend, change role, remove, replace the last admin; reset a lost two-step device with an audit entry | PTN-03, SIGN-02, ROLE-01 | M |
| C6 | Staff edit company profile; rename, domain and region change; suspend with a reason | PTN-02, PTN-04, CO-02 | M |
| C7 | Company profile fields (legal name, tax id, HQ country, headcount, billing and support contact, logo) and the manager card shows email and phone | CO-01, CO-05 | L |
| C8 | Application form: partner type detail, current security vendors, products of interest, country, consent; reviewers see all of it, with internal notes and a "request more information" action | APPLY-01 to APPLY-04, PTN-06 | M |
| C9 | Applicant status page from a private link (D9), "under review" and "invite not used" emails, a "send me a new invite" action on an expired invite | DONE-01, DONE-03, INV-02, MAIL-03 | M |
| C10 | Access requests: confirm before approving or declining, and keep a history | TEAM-07, SIGN-04 | S |

### Phase D: documents library (about 8 to 10 days)

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| D1 | A real video player for the private files (D4), with captions field and a poster image | DOC-01 | M |
| D2 | Partner library grouped by purpose and product, with thumbnails or covers and an inline PDF preview | DOC-02 | M |
| D3 | Material requests become tracked: the partner sees status, the marketing team works an inbox and links the resulting file | DOC-04, ADOC-05 | M |
| D4 | Engagement view per document: who opened it, last opened, who has not | ADOC-03 | M |
| D5 | Versions with a change note and restore, expiry date, draft and unpublish, honest delete wording, drag and drop and multiple upload | ADOC-04 | M |
| D6 | Server side filters and URL filters for documents; "new document" email on by default | DOC-05, DOC-06 | S |

### Phase E: insight, help and notifications (about 8 to 10 days)

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| E1 | Reports with a date range, comparison, value, win rate, time to decision, rejection reasons, application funnel, document engagement, region and manager rollups; titles that match | REP-01, REP-02, REP-04, REP-05 | L |
| E2 | Audit: custom range, per record failed sync list with retry | AUD-03, AUD-04 | M |
| E3 | Notifications page (all, unread filter, dismiss) and palette "see all" | SHELL-03, SHELL-04 | M |
| E4 | Program page for partners (benefits, eligibility, protection and extension rules, support contact) and a real Help (FAQ and contacts) for partners and staff | WEL-04, SIGN-03, SHELL-02 | M |

### Phase F: legal blocked (starts when legal delivers the text)

| Id | Task | Audit ids | Effort |
|---|---|---|---|
| F1 | Real agreement text, version label, PDF download | INV-01, CO-03 | S |
| F2 | Re-accept a new agreement version, with history | CO-04 | M |

## 6. How to run it

- One phase at a time, each with its own detailed plan, then built by one agent per task in a worktree, as the original build did. Under the machine health rule (one agent at a time, targeted checks only) wall time grows, so expect the totals above to be real elapsed days, not parallel ones.
- Order of value: A, then B, then C, then D, then E. Phase B depends on D1 to D3 of section 4. Phase D can start in parallel with C if a second person is available.
- Every phase adds or updates tests for the actions it touches and keeps the isolation matrix passing. UI follows the existing portal tokens and components. No new design system.
- After each phase: migrate and reseed the demo, redeploy, and walk the changed screens as each role.
- Verification so far: the five biggest claims (no staff account route, the video player stub, no edit or withdraw action for registrations, no value, country or industry columns, no action to edit a member) were checked against the code. The other findings come from the audit's reading of the code and were not run.

## 7. Next step

Approve or change the defaults in section 4, then start Phase A. Phase A needs no decisions and can begin immediately.
