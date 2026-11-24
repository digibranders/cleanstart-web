# Partner portal reports: review and design

Written 2026-11-23 against `development` at `733f63ec`, from the running portal (staff view, India, seed data). Nothing in `apps/portal` was changed.

Files in this folder:

| File | What it is |
|---|---|
| `reports-hub.html` | Mock of the new `/admin/reports` page, in the portal's own look. |
| `partner-program-review.html` | The report itself: 6 fixed A4 pages, two editions (Internal, Shareable). Print it from a browser to get the PDF. |

Both open in any browser. Serve the folder over HTTP (`python3 -m http.server`) if you want the hub's live previews and links to work, since a plain `file://` open blocks the embedded pages in some browsers.

## 1. Review, as the person who runs the partner program

**Verdict.** The page is a good set of live numbers and a poor report. I cannot send it to a regional lead, attach it to a quarterly review or hand a partner their own figures. Everything useful is there, but it is eleven cards in a stack with no order, no story and one CSV button per card.

The audit file `AUDIT-2026-11-23.md` items REP-01, REP-02 and REP-04 are out of date: date range, value, win rate, time to decision and region and manager rollups now exist. What is left is not missing metrics. It is the shape of the page.

### Findings (each checked in the live app)

| ID | Finding | Evidence | Weight |
|---|---|---|---|
| R1 | Reports duplicates Overview. Both show period KPIs, funnel-like and trend views with the same range control. | `/admin/overview` and `/admin/reports` side by side | High |
| R2 | Two time frames on one page. A 90 day block, then an "All time" block that disagrees with it (18 registered against 33, 3 won against 6). | `AdminReports.tsx` lines 75 to 102 | High |
| R3 | No comparison. 18 deals and $1M mean nothing without the previous period. The previous 90 days had 7 deals and $529.5K. | `?range=custom&from=2026-05-28&to=2026-08-25` | High |
| R4 | Win rate reads 100% on 3 closed deals while 7 approved deals are still open. It is the most quoted number on the page and the least reliable. | KPI strip, funnel | High |
| R5 | Rejection reasons are raw free text and one names a customer ("Saffron Retail Group"). It cannot be grouped, and it is unsafe in anything shared. | Rejection reasons card | High |
| R6 | Document engagement contradicts itself. The card says "6 of 6 partners", the table shows "7 partners" for the top document. The top-documents query counts every partner in scope, the share counts only onboarding and active ones. | `server/repo/report-insights.ts` lines 78 to 106 | Medium |
| R7 | The same measure has two definitions. Reports shows median days (calendar). Overview shows average days (business days) and "64% within 2 days". Nothing says which is which. | Both pages | Medium |
| R8 | 5 of 18 deals have no USD value, so "$1M" is a floor. It appears as a grey footnote under the first tile. | KPI strip | Medium |
| R9 | The page-level Export CSV exports only the all-time partner table at the bottom, not what the page shows. Eight more CSV buttons sit on the cards. | `AdminReports.tsx` line 55, `RangedReport.tsx` | Medium |
| R10 | The most actionable block, "Partners to follow up", is last. | Page bottom | Medium |
| R11 | No printable or sendable output at all. No PDF, no share link, no schedule. | Whole feature | High |
| R12 | Partners have no reports. `app/partner` has no report route, so a partner cannot see a statement of their own deals, value and protection. | `apps/portal/src/app/partner` | Medium |
| R13 | Charts flash as empty grey cards before they draw. | First paint of `/admin/reports` | Low |

## 2. The shape I propose

Give each surface one job.

| Surface | Job | Changes |
|---|---|---|
| Overview | What needs doing now. Live. | None here. |
| Reports | Period documents you read, print and send. | Rebuilt as the hub in `reports-hub.html`. |
| Data exports | Raw CSV for people who want to analyse. | The eight scattered buttons become one short list on the hub. |

The current Reports cards are not lost. Their content is the report document: funnel, products, leaderboard, time to decision, rejections, engagement, region and manager rollups, follow-ups, and the all-time partner table.

## 3. The hub page

Sections, top to bottom. One solid primary button on the page (Generate PDF). No KPI tiles, because the numbers live in the report.

1. **Build a report.** Report type, period (the same 30d, 90d, 365d, Quarter, Custom presets as today), region, partners, edition. A live preview of the cover and summary sits beside the form, rendered from the real document so it cannot drift. Actions: Generate PDF, Open web view, Schedule.
2. **Recent reports.** Name, period, scope, edition, who prepared it, when. Open, PDF, Copy link.
3. **Scheduled.** A monthly or quarterly send, with recipients and edition.
4. **Data exports.** Four CSV rows to start.

### What can be built now and what needs storage

| Piece | Needs new tables? | Note |
|---|---|---|
| Build a report, web view, print to PDF | No | A route that takes `range`, `edition` and the viewer's regions from the session and renders the document on the server. Prior period is one more call to `getRangedReport` and `getReportInsights` with the shifted range. |
| Shareable edition | No | Anonymises partner names, drops managers and follow-ups at render time. |
| Recent reports, copy link | Yes | A saved report row and a signed link. |
| Scheduled | Yes | A schedule row, a job and recipients. Needs Brevo. |

`BUILD-HANDOFF.md` treats schema as batched work, so the first release should be the top two rows only, and the mock marks the other sections "Proposed".

## 4. The report document

### Structure (6 pages, A4)

| Page | Content | Why it is there |
|---|---|---|
| Cover | Title, period, scope, preparer, timestamp. The three funnel bars (18, 10, 3) drawn as the cover art. | The art is the quarter's real numbers, not decoration, so it changes every time. |
| Summary | A one sentence headline, four KPIs with the previous period beside each, "What changed" in five labelled lines, "Needs attention" with three actions. | A director reads this page and stops. |
| Pipeline | Funnel against the previous period, where the 18 deals stand, how each product's deals ended up, product table with value bars. | Answers where deals are being lost. |
| Partners | One concentration figure (86% of won value from one partner), leaderboard, managers, all-time partner table. | Names who carries the program. |
| Decisions and quality | Time to decision against the 2 day target and previous period, grouped rejection reasons, document engagement, follow-ups. | The service-level view. |
| Method | Definitions, comparison period, scope, preparer, sources, reading notes. | Lets anyone check any number. |

### Rules the design follows

* **Honest numbers.** Every figure comes from the app. Where a number is weak it says so on the page: the win rate sentence, the "5 deals have no USD value" note, the calendar versus business day note.
* **Comparison is built in.** Each KPI shows change from the previous period of the same length, ending the day before. Grey is last period, violet is this period, everywhere.
* **Colour is meaning.** Violet is the only accent. Green, amber, red and indigo appear only for approved, waiting, rejected and won. Product colours are the same three the portal charts use.
* **Print is a first class output.** `@page { size: A4; margin: 0 }`, fixed 210 by 297 mm pages, `print-color-adjust: exact`, one page break per section. Checked by printing to PDF: exactly 6 pages, no overflow, in both editions.
* **Two editions.** Internal has everything. Shareable replaces partner names with Partner A to G and removes the manager table and follow-ups. Free-text rejection reasons never appear in either, only grouped ones.
* **Type.** Manrope, as the portal. 12.5px body, 10.5px captions, 24px page titles, 27px summary headline, 31px KPI figures, 58px cover title. Tabular figures on every number.

### Data the build must add

1. Prior period figures (a second range call).
2. A reason grouping for rejections: a short fixed list in the decision form, with free text kept as a note. Until then the document cannot group them.
3. The engagement query fix (R6): count document openers only among onboarding and active partners, matching the share.
4. A one line definition shown next to the Overview time figure, or the same measure on both pages (R7).

### Illustrative in the mock

Everything in the document is read from the app except these, which are design decisions to confirm:

* The two sample rows in Recent reports beyond the first, and the scheduled row ("monthly, first working day, 3 people"). All are sample content in sections marked Proposed.
* "Partners to follow up" owners and the three "Needs attention" actions are written by hand from live data. In the build they would be generated from rules (waiting deals past target, concentration above a threshold, lowest approval product).
* The quarter preset's comparison period (previous period of the same length, so a part quarter compares with the days before it). A full previous quarter is the other reasonable choice.

## 5. Questions for the product owner

1. Should a partner get their own statement (the Partner scorecard template) in the first release? It is the one report partners ask for.
2. Who may use the Shareable edition: any staff member, or partner managers only?
3. Should rejection reasons become a fixed list in the decision form? The report is better with it, and it is the only change that touches an existing flow.
4. Is the 2 day decision target business days everywhere? The document says so on page 5 and in the definitions.

## 6. What was verified, and what was not

Verified: the PDF prints to exactly 6 A4 pages in both editions; the hub renders at 1440 px with live previews; no em or en dashes in any file; every figure in the document was read from `/admin/reports` for the two periods (current 26 Aug to 23 Nov 2026, previous 28 May to 25 Aug 2026).

Not run: lint, typecheck and build, because these are static files and no app code changed. The hub's period buttons update the hint text only; the web view and PDF always open the 90 day sample. The 365d and quarter comparison ranges in the hint text were computed by hand.

## 7. Built (2026-11-24)

First release, on `development`, not committed. No schema change.

| Piece | Where |
|---|---|
| Hub | `/admin/reports`: period and edition in the URL, Generate PDF, Open web view, a live preview of the cover and summary, and the Data exports list. |
| Web and print view | `/admin/reports/program-review?range=&from=&to=&edition=`. Lives in the `(print)` route group so the admin shell does not wrap it; `?autoprint=1` opens the print dialog. |
| Figures and wording | `src/lib/program-review.ts`, pure and tested. Headline, "What changed" and "Needs attention" are written by rules from the figures. |
| Data | `src/server/reports/program-review.ts`: the existing viewer scoped repo calls, once for the period and once for the previous period of the same length. |

Where the build differs from the mock:

* **Shareable is made on the server.** Partner names, managers, follow-ups and rejection reasons are removed before render, so they are not in the HTML. One partner keeps one letter in every table.
* **Rejection reasons are not grouped.** The mock's grouped reasons need the fixed reason list (section 4, item 2). Internal shows each reason as the approver wrote it, capped at 5 rows. Shareable shows only the count.
* **"Approved, not won"** replaces "approved, still open" in the per product bars, because approved includes lost and expired deals. The status bar splits those out.
* **Tables are capped** (leaderboard 6, managers 4, all time partners 7, reasons 5, follow-ups 4), with an "N more" note and totals over every row, so a wide scope cannot overflow a fixed A4 page.
* **Left out of this release:** the Region and Partners selects, the template list, Recent reports, Scheduled, and the Schedule button. They need new storage or repo parameters.
* **Removed from `/admin/reports`:** the live cards, the filterable all time partner table and the in-page follow-up list. Every CSV is still on the hub under Data exports (nine, the all time partner file is now unfiltered). Follow-ups appear in the Internal report.
* The attention rule for slow decisions cannot say how many waiting deals are past the target, because no figure carries it. It states the target instead.

Checked: the PDF prints to exactly 6 A4 pages for Internal, Shareable, a 365 day range and an empty range, with no page clipped; axe finds nothing on the hub or the report in both editions; typecheck, lint on the changed files and a production build pass; the pure tests pass (35).
