# Partner portal UX audit

Date: 2026-11-13. Branch `feat/portal-build` at `a6fd7dd6`, dev server on `localhost:3204`, database `cleanstart_portal` (dev seed). Read-only audit: no source file was edited. This file is the only thing written inside the repo and it is not committed.

Method: headless Chrome through Playwright from `apps/portal`, every route as seven roles, at 1440x900 and 390x844. Each page also ran axe (WCAG 2.0, 2.1, 2.2 A and AA plus best-practice), a computed-colour contrast scan of every text node, a line-count scan for wrapped labels, a tap-target scan, a dash scan of visible text and a console scan. Dialogs, drawers, popovers and the Ctrl K palette were opened and closed.

Screenshots and raw JSON are in `/private/tmp/claude-501/-Users-a12345-Desktop-AI-cleanstart-cleanstart-website/528f4e95-2603-46a1-a5f8-cf16b3e7e8fe/scratchpad/ux/`. File names in this document are relative to that folder. Naming: `<user>-<route>-<d|m>.png` (d = 1440, m = 390, `-full` = whole scroll height), `i-*` and `i2-*` are interaction states on desktop, `mob-*` are interaction states on mobile, `public-*` are signed-out pages, `empty-*` are new-partner states.

Roles covered: Aditi Rao (partner admin), Karan Malhotra (partner sales), Sneha Iyer (partner technical), all at Kestrel Systems; Arjun Pillai (Meghdoot, onboarding) and Seed Admin 01 (no deals) for empty states; Farhan Qureshi (partner manager), Rahul Menon (staff sales), Ishita Bose (marketing). `/accept-invite` was checked only with no token and a bad token: `scripts/dev-invite-link.ts` rotates an invite token in the database, so it was not run.

## Test data created by this audit

Two submits ran by mistake while probing form validation. Both are in the dev database `cleanstart_portal` and nothing was deleted or reverted:

| What | Where | Effect |
|---|---|---|
| Registration "Probe Co", CleanStart Images, pending, id `c0c0273c-8efe-4e72-8b5d-f4e352a16dbd` | Kestrel Systems, registered by Aditi Rao | Farhan's queue now reads Waiting 5 and My queue 3 (seed: 4 and 2). Screenshots taken after 15:50 show the extra row. |
| Invite to `someone@gmail.com`, role sales, pending | Kestrel Systems | Kestrel shows 5 people and "Someone" in the partner detail. |
| About 20 sign-ins as the roles above | sessions and last active | Kestrel's "Where you are signed in" lists 7 sessions, and Karan and Sneha read "Today". |

Remove the invite with the trash icon on the Kestrel Team page, and reject or delete the registration from the approvals queue, or tell me and I will do it. Also note: the sign-in endpoint allows 10 attempts a minute per IP, so a fast sweep hits a 429 (see UX-10).

## Summary

The portal is in good shape on the basics. Axe reports zero violations on every signed-in page at both widths, every text colour passes WCAG AA (lowest measured: 4.87:1 for muted text on the search pill, 5.38:1 for muted text on white, 5.56:1 for sidebar secondary text, 4.59:1 for sidebar icons against a 3:1 requirement), focus rings are 2 px everywhere, there are no console errors, no visible em or en dash, and destructive actions in Team already use a clear inline confirm. Skeleton, empty and error screens exist.

The problems are concentrated in four places:

1. Mobile (390 wide) is the weakest area. Tab strips are clipped by their card and the last tabs cannot be reached (Deals loses Expired, Won, Lost). Every wide table hides its status and action columns behind a horizontal scroll with no cue: Documents download, Team remove and resend, Deal approvals accept and reject, Partner applications approve and decline, Audit action. Page-level overflow is hidden, so the user cannot tell anything is missing.
2. Decisions with side effects are icon-only, 28 px, 4 px apart, with the same weight for accept and reject and a tooltip that exists only on hover. Accepting a deal creates a HubSpot deal and emails the partner; approving an application creates a partner and sends an invite. The labelled Accept and Reject buttons exist, but only inside a drawer that most users will not open.
3. Numbers and labels that disagree without explanation (Deal approvals nav badge and My queue say 3, the Waiting KPI says 5) and missing empty states (Recent decisions, a new partner's Overview and Deals).
4. One real accessibility gap that axe cannot see: control borders (inputs, selects, checkboxes) are 1.3:1 and 1.8:1 against the page, below the 3:1 of WCAG 1.4.11. Placeholder text is 4.49:1, a hair under 4.5.

Other confirmed items from the brief: the round "N" in the bottom left of the sidebar is the Next.js dev indicator, and `devIndicators: false` in `next.config.ts` removes it (Next 16.4.6 accepts `false`); the admin search placeholder wraps to two lines at 1440 (text needs 209 px, the box gives 197 px); the breadcrumb repeats the H1 on 13 of 15 signed-in routes.

Findings: 43 in total. P1: 5. P2: 16. P3: 22.

| Severity | Count | IDs |
|---|---|---|
| P1 | 5 | UX-23, UX-27, UX-32, UX-33, UX-34 |
| P2 | 16 | UX-01, UX-02, UX-03, UX-07, UX-08, UX-09, UX-13, UX-15, UX-16, UX-17, UX-19, UX-24, UX-25, UX-28, UX-35, UX-36 |
| P3 | 22 | UX-04, UX-05, UX-06, UX-10, UX-11, UX-12, UX-14, UX-18, UX-20, UX-21, UX-22, UX-26, UX-29, UX-30, UX-31, UX-37, UX-38, UX-39, UX-40, UX-41, UX-42, UX-43 |

## Findings by screen

All file paths are under `apps/portal/` and class names are in `src/styles/portal.css` unless stated.

### Shell (sidebar, top bar, popovers, palette)

**UX-01 (P2) The Next.js dev indicator covers the sidebar user name and avatar.**
Seen: a round black "N" sits on the avatar and the first letter of the user name at the bottom left, so "Aditi Rao" reads "Aditi Rao" with a clipped "A" (`aditi-partner_overview-d.png`, `farhan-admin_approvals-d.png`, every other signed-in shot). It also sits on the footer of the sign-in page (`public-sign-in-d.png`) and over the content on mobile (`aditi-partner_deals-m.png`). It is the `nextjs-portal` element (confirmed in the DOM), default position bottom-left. It exists only in `next dev`.
Why: it hides the one control in the sidebar footer (the profile menu) in every screenshot and manual QA session, and it will be reported as a bug by whoever reviews the dev build.
Fix: in `next.config.ts` add `devIndicators: false` to `nextConfig`. The type is `false | { position }` in Next 16.4.6, so `false` is valid. If you want to keep it, use `devIndicators: { position: "bottom-right" }`. No production effect either way.

**UX-02 (P2) The admin search placeholder wraps to two lines at 1440.**
Seen: "Search partners and registrations" breaks after "and", the pill keeps 30 px height so the text overflows its top and bottom edges (`farhan-admin_approvals-d.png`, all admin routes; the scan flagged it on six admin pages). Measured: text needs 208.7 px, the box gives 196.7 px (`.search` is 280 px wide, minus icon, gap, kbd and padding). The partner string "Search deals and documents" fits.
Why: it looks broken on the first screen a staff user sees.
Fix: two parts, so it cannot return. In `src/components/shell/shell.tsx` shorten the admin string to "Search partners and deals" (also used in the `aria-label`). In `portal.css` set `.search-t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}` and raise `.search{width:300px}`.

**UX-03 (P2) Two sidebar items are highlighted on "Register deal".**
Seen: on `/partner/deals/new` both "Deals" and "Register deal" carry the active fill (`aditi-partner_deals_new-d.png`). The active test in `shell.tsx` is `pathname === href || pathname.startsWith(href + "/")`, and `/partner/deals/new` starts with `/partner/deals/`.
Why: the current page is ambiguous and `aria-current="page"` is set on two links.
Fix: in `shell.tsx` mark only the nav item with the longest matching `href` (the same sort `crumbFor` already uses), keeping the Overview special case for `/partner/welcome`.

**UX-04 (P3) The breadcrumb repeats the H1 and is not navigable.**
Seen: "Kestrel Systems / Deals" over an H1 "Deals" on 13 of 15 routes (Welcome and Deal detail are the two that differ); on a deal the crumb still says "Deals" while the H1 is the customer, and "Deals" is not a link (`aditi-partner_deals_ID-d.png`). On mobile the centred title in the top bar repeats the H1 directly below it (`aditi-partner_overview-m.png`). Admin crumbs start with "CleanStart", which says nothing.
Why: the top bar spends its width saying nothing new, and on a detail page it is the one place a back link would help.
Fix: in `shell.tsx` render the crumb only when it adds information: on `/partner/deals/[id]` show `Deals / <customer>` with "Deals" as a `Link`; on `/partner/deals/new` show `Deals / Register deal`; on list pages show only the organisation name (partner) or nothing (admin). On mobile show the organisation name instead of the page name. No label or IA change.

**UX-05 (P3) Search and help copy.**
Seen: marketing (who only has Documents) sees "Search partners and registrations" (`ishita-admin_documents-d.png`); admin copy says "registrations" while the nav says "Deal approvals" and the partner side says "deals"; the hint reads "Ctrl K" on a Mac; the Help popover hard-codes a link titled "Partner sales playbook 2026" (`shell.tsx`), which goes stale when the document is renamed.
Fix: derive the placeholder from what the viewer can open (marketing: "Search documents"), use "deals" everywhere, show the modifier from `navigator.platform` after mount (command symbol on Mac), and build the Help link from the first enablement document or drop the title.

**UX-06 (P3) A page the role cannot open silently redirects.**
Seen: Sneha (technical) asking for Overview, Deals, Register deal or Team lands on Documents with no message; Karan (sales) asking for Team lands on Overview; Rahul asking for Documents, Team or Audit lands on Deal approvals; Ishita on anything but Documents (`sneha-partner_overview-d.png`, `rahul-admin_approvals-d.png`). The sidebar shows only the allowed items, so this is mostly reachable by bookmarks and links in email.
Fix: add a one-time toast "You do not have access to that page." on redirect (a `?denied=1` query handled in `Shell`, then cleaned), or at least keep the target visible in the crumb.

### Public pages: sign-in, reset password, apply, invite, error pages

**UX-07 (P2) The error page tells users to use a mock-era tool.**
Seen in code: `src/app/error.tsx` reads "If it keeps happening, reset the demo data from the Walkthrough panel or start from sign in." There is no Walkthrough panel and no demo data in the real app. (The error state could not be triggered safely, so this was read from source.)
Why: the one screen shown when something breaks sends the user to something that does not exist.
Fix: replace the paragraph with "Try again. If it keeps happening, sign in again or contact your partner manager." and keep the two buttons. Add the error digest in small text so support can find it (`error.digest` is already in props).

**UX-08 (P2) The 404 sends a signed-in user to sign in.**
Seen: `/no-such-page` shows "Back to sign in" as the only action even with a live session (`public-no-such-page-d.png`, `src/app/not-found.tsx`).
Fix: the not-found component is a server component, so call the viewer lookup used by `src/app/page.tsx` (`homeFor`) and link to the viewer's home ("Back to overview" or "Back to deal approvals"), falling back to "Back to sign in" when signed out.

**UX-09 (P2) Required and optional fields are not marked consistently on Apply.**
Seen: on `/apply` only "Phone (optional)" is marked. Company website and Job title are also optional (empty submit shows errors only on Company name, Your name, Work email and the message) but carry no marker, so every unmarked field reads as required (`public-apply-empty-d.png`). Register deal has the same pattern: Website and Expected close say "(optional)", Contact name, email and phone do not.
Fix: pick one rule and apply it everywhere: mark the optional ones, as the portal already does. In `src/components/screens/Apply.tsx` add `<span className="hint">(optional)</span>` to Company website and Job title.

**UX-10 (P3) Sign-in layout and copy details.**
Seen (`public-sign-in-d.png`, `public-sign-in-empty-d.png`, `probe2.png`): the form sits in the top 45% of the left column with a large empty lower half while the right panel text is vertically centred; "No login yet? Request access from your partner admin." reads as if "Request access" were the action but it is a button that opens an explanation; "Keep me signed in" is ticked by default on a shared sign-in used from managed laptops; the rate-limit error says "Too many attempts. Try again in a moment." without a time (the limit is 10 a minute per IP, which a QA sweep reached); a direct visit to `/reset-password` with no token shows "This reset link is not valid", which is harsh for someone who typed the address.
Fix: vertically centre the form block (`margin-block:auto` on the left column content in `src/components/partners/public-frame.tsx`); reword to "No login yet? Ask your partner admin to invite you."; default the checkbox off or label it "Keep me signed in on this device"; change `TOO_MANY` in `SignIn.tsx` to "Too many attempts. Wait a minute and try again."; on `ResetPassword.tsx` with no token show the request form instead of the error.

**UX-11 (P3) Public pages have no main landmark.**
Seen: axe `landmark-one-main` (moderate) on sign-in, reset, apply, apply done, accept-invite and the 404; `region` on the 404. Signed-in pages pass because `Shell` renders `<main id="main">`.
Fix: wrap the left column content in `<main>` in `public-frame.tsx` and the state card in `src/app/not-found.tsx` and `error.tsx`.

**UX-12 (P3) Apply on a phone.**
Seen (`public-apply-empty-m.png`): "Channel partner" and "System integrator" wrap to two lines inside the segmented control; the header "Partner program" and "Already a partner? Sign in" each wrap to two lines; the dark marketing panel is stacked under the form and adds a full screen of scroll after "Submit".
Fix: let `.seg` wrap its buttons as a column under 420 px or shorten the labels to "Channel" and "Integrator" on mobile only via a class; hide the right panel under 760 px in `public-frame.tsx`.

### Partner Overview and Welcome

**UX-13 (P2) A new partner's Overview is mostly empty with no guidance.**
Seen (`empty-arjun-_partner_overview-d.png`): four KPIs all "0", a Recent deals card with only column headers and "0 shown", a "Needs attention 0" card with an empty body, and a lot of empty page. The Welcome checklist exists but is only the landing right after a new admin accepts an invite (`landingPathFor` in `src/lib/people.ts`); Arjun, who is still onboarding, signed in and landed on this empty Overview, and nothing on it points at the checklist.
Fix: in `PartnerOverview.tsx` when `deals.length === 0` replace the table body with the `.empty` pattern: "No deals yet. Register your first deal to start 90 days of protection." plus a `btn btn-p` "Register deal", and hide the empty "Needs attention" card. Add a "Finish setting up" link to `/partner/welcome` while the checklist is incomplete.

**UX-14 (P3) The same fact appears three times.**
Seen (`aditi-partner_overview-d.png`): Tejas Health Network appears in the "Expiring in 14 days" KPI, in the table row ("15 Nov 2026 2d") and as "expires in 2 days" under Needs attention; Gulfway Freight and Vardhan Capital "waiting N days" appear in the table and again in Needs attention. The brief says no repeated data.
Fix: keep Needs attention for things that are not rows in the table above it (access requests, new documents) and drop the deal rows from it, or drop the "Expiring" customer name from the KPI footer.

**UX-22 (P3) Welcome checklist details.**
Seen (`aditi-partner_welcome-d.png`): the row buttons "Add details", "Book a call", "Open" are 26 px high while page buttons are 30 px; the bottom cards "You have registered deals" and "Your colleagues are set up" restate checklist items that are already marked Done; completed items are struck through at muted contrast, which is readable (checked) but loses meaning for a screen reader beyond the ", done" text.
Fix: use the standard `.btn btn-s` height, and show the two summary cards only when their checklist step is not done.

### Deals

**UX-15 (P2) A partner with no deals sees "No deals match these filters."**
Seen: for Seed Admin 01 and Arjun the Deals page shows eight zero tabs, four filters and the message "No deals match these filters." with no filter applied (`empty-seed1-_partner_deals-d.png`, text in `empty.json`). Same wording problem on Documents when nothing is shared.
Fix: in `Deals.tsx` distinguish `allRows.length === 0` (no filters can be at fault) from filtered-to-nothing. For the first, hide the tabs and filters and show "You have not registered a deal yet." with a "Register deal" button; keep "No deals match these filters." with a "Clear filters" button for the second (as `AdminAudit.tsx` already does).

### Register deal

**UX-16 (P2) Contact email and phone are silently dropped when the contact name is empty.**
Seen: a registration submitted with contact email "not-an-email" and phone "12" and no contact name succeeded with no error and stored no contact (the database has no `registration_contacts` row for it). In `RegisterDeal.tsx` the contact is only sent when `form.contactName.trim()` is set (line 167). With a name, the server does validate the email ("Enter a valid email.") but nothing marks the three contact fields as optional, so users either assume they are required or lose what they typed (`i2-aditi-reg-bad-d.png`).
Fix: mark "Contact name (optional)" in the label; if email or phone is filled and the name is empty, show "Add the contact's name or clear these fields." under the name field and block submit. Validate the email format on blur with the same `EMAIL` rule as the server.

**UX-17 (P2) The duplicate check card contradicts the suggestion list.**
Seen (`i-aditi-reg-suggest-d.png`): after typing "Var" the dropdown offers "Vardhan Capital, 2 deals with you" while the side card says "Kestrel Systems has no registrations at Var yet." The card also opens as "New customer for you" before anything is typed (`aditi-partner_deals_new-d.png`), stating a result with no input.
Fix: in `RegisterDeal.tsx` show the card only after the name is at least 3 characters and no suggestion matches; before that, show "Type the company name to check for existing registrations." Never interpolate a partial name into the sentence.

### Deal detail

**UX-18 (P3) Closed deals repeat themselves.**
Seen (`aditi-partner_deals_ID-d.png`, Expired deal): the H1 row carries an "Expired" badge and the KPI strip says "Outcome Expired"; "Not recorded" appears for CRM reference and again for Contact, with "Contacts 0 / No contacts added yet" below. Three of three KPI tiles are low information for an expired deal.
Fix: for closed deals (`expired`, `lost`, `rejected`) show one KPI ("Ended 30 Jul 2026, No activity") and drop the Outcome tile; show "Contact: none yet" only once.

### Documents (partner)

No desktop issues beyond the shared icon-action finding (UX-35) and the table and tab findings on mobile (UX-32, UX-33). The hover tooltip on the row icon ("Watch, MP4, 14 min") overlaps the "Updated" column header (`i-aditi-docs-hover-d.png`); it is positioned `bottom:100%` right-aligned, so on the first row it covers the header. Cosmetic.

### Team (partner)

**UX-19 (P2) Access requests: Accept and Decline are unlabelled icons of equal weight, and name and email run together.**
Seen (`aditi-partner_team-d.png`): "Rohit Desai rohit.desai@kestrelsystems.in" is one line with no separator, followed by a Sales or Technical toggle and a cross and a tick, both 28 px. Granting access to a person is a consequential action, and the tick sits where a user would expect "Save".
Fix: in `src/components/people/AccessRequests.tsx` put the email on the second line (`li-s`), and render two text buttons: `btn btn-s` "Decline" and `btn btn-p` "Approve as Sales" (the label follows the toggle). Same pattern as UX-23.

**UX-20 (P3) An invite to a free-mail address is accepted without a note.**
Seen: inviting `someone@gmail.com` to Kestrel succeeded with the toast "Invite sent to someone@gmail.com". The panel above it says access requests come from "People at kestrelsystems.in".
Fix: if the policy is company addresses only, validate against the partner domain; if not, show a one-line hint "This address is not at kestrelsystems.in" before sending.

### Account and Company

**UX-21 (P3) Save buttons and the session list.**
Seen: "Save profile" (Account) and "Save changes" (Company) are primary and enabled next to "All changes saved" (`aditi-partner_account-d.png`, `aditi-partner_company-d.png`), so the page says there is nothing to save and offers to save. The sessions card grows with every sign-in (7 after this audit, one "Sign out" button each) with no "Sign out of all other devices". Company Website, Main phone and Address have neither a hint nor an example.
Fix: disable the save button until a field differs from the saved value (the badge then switches to "Unsaved changes"); add "Sign out all other devices" to the sessions card header in `src/components/people/SessionsCard.tsx`; add hints such as "https://example.com" on the Company fields.

### Deal approvals (staff)

**UX-23 (P1) Accept and Reject are icon-only, adjacent and equal in weight.**
Seen (`farhan-admin_approvals-d.png`, `i-farhan-approvals-accept-hover-d.png`): per row a 28 px cross and a 28 px tick, 4 px apart (`.acts`, `.act`, `.act-no`, `.act-ok`). The meaning is in `aria-label` and a tooltip drawn only on hover or focus (`data-tip`), so a touch user, or anyone who has not hovered, sees two glyphs. Accept creates the HubSpot deal, starts 90 days of protection and emails the partner; Reject opens a reason box. Both look like neutral outlined squares until hovered. On mobile the column is off screen entirely (`mob-farhan-approvals.png`). The drawer has the right design: outlined red "Reject" and filled "Accept" with text (`i-farhan-approvals-drawer-d.png`).
Why: this is the core task of the staff app. An accidental accept sends email to a partner (an Undo exists, but the email has gone).
Fix: in `src/components/screens/AdminApprovals.tsx` replace the `.act` pair with the drawer's pair at table size: `btn btn-d` "Reject" (30 px, `Reject` text, the existing `startReject`) and `btn btn-p` "Accept" (existing `accept(row)`), 8 px gap. Keep the aria labels with the customer name. If the width is a concern, hide the product column first (see UX-33) rather than the labels.

**UX-24 (P2) "Waiting 5" does not match "My queue 3" or the nav badge.**
Seen (`i-farhan-approvals-reject-open-d.png`): the sidebar badge says 3, the default tab "My queue" says 3, the first KPI "Waiting" says 5 with "4 over the 2-day target", and "With a conflict 2" counts across all regions while the visible table shows one "Same customer" tag. Seed state is the same: Waiting 4, My queue 2, badge 2 (`farhan-admin_approvals-d.png`). For a sales user Waiting equals My queue, for a manager it does not, so the card changes meaning with the role.
Fix: in `AdminApprovals.tsx` compute the KPIs from the rows of the selected tab and label the first card "Waiting, my queue" / "Waiting, all regions" to match the toggle; or keep all-region totals but add the footer "3 in your queue". Make the nav badge tooltip "3 waiting in your queue" (`shell.tsx`, `title` on the count).

**UX-25 (P2) Recent decisions shows only headers when empty.**
Seen (`farhan-admin_approvals-d.png`): a card with a title, "Last 7 days" and six column headers, and nothing under them. In code `recentDecisions.map(...)` has no empty branch (lines 515 to 550 of `AdminApprovals.tsx`).
Fix: when `recentDecisions.length === 0` render `<div className="empty">No decisions in the last 7 days.</div>` instead of the table (the `.empty` class is already used by the queue above it).

**UX-26 (P3) KPI strip and reject box details.**
Seen: "Decided, last 7 days 0 / Accepted 0, rejected 0" repeats the Recent decisions card under it; "Expiring in 14 days 1 / Partners reminded" is about protection expiry, not about the approval queue; the inline reject box has a label "Reason the partner will see" but no placeholder or required marker, and the row says "Add a reason below" (`i-farhan-approvals-reject-open-d.png`).
Fix: replace the "Decided" card with "Oldest waiting" (days) which the page does not otherwise show, and drop "Expiring" from this page (it is on Reports as "Protected now"); add a placeholder "For example, already registered by another partner" and a `(required)` hint to the reason box.

### Partners (staff)

**UX-27 (P1) Clicking a partner appears to do nothing: the detail opens below the list.**
Seen (`i-farhan-partners-detail-d.png`, `i-farhan-partners-detail-bottom-d.png`): selecting Kestrel Systems only highlights the row; the detail card (people, recent deals, Change category, Suspend) renders after the last of 21 rows, about 800 px below the fold. With 21 partners the user must scroll to find the result of their click; with more partners it is further away. `AdminPartners.tsx` renders `<PartnerDetail>` after the table section and has no scroll or focus move in `select`.
Why: the only way to a partner's people, deals and actions looks broken.
Fix: minimal: in `select` in `AdminPartners.tsx` scroll the detail into view and move focus to its heading (`ref.scrollIntoView({block:"start"})` in an effect keyed on `detail.id`). Better and still within the layout: render the detail above the table (swap the two sections' order) so the selected partner is always at the top.

**UX-28 (P2) Approve and Decline on applications are the same icon pair.**
Seen (`i-farhan-partners-applications-d.png`, `mob-farhan-applications.png`): a tick that, for a portal application that already carries category and region, immediately creates the partner company, makes the applicant its admin and emails an invite (`startApprove` in `src/components/partners/applications-table.tsx` calls `onApprove` at once), next to a cross. There is an Undo toast. Same labelling problem as UX-23, and the page says the effect only in a small footer line.
Fix: use text buttons "Decline" (`btn btn-d`) and "Approve and invite" (`btn btn-p`), and move the footer sentence into the `title` of the approve button. Keep the existing reason box for decline.

**UX-29 (P3) KPI duplicates and long lists.**
Seen (`farhan-admin_partners-d.png`): "Applications 3" repeats the Applications tab count and the "3 waiting" line; "Protected deals 5, From 3 partners" repeats Reports' "Protected now 5". All 21 partners render with no page size ("Showing 21 of 21"), and 13 of the 21 rows are all zeros in the seed. The table has no sort.
Fix: replace the Applications KPI with "Oldest application (days)"; add a page size of 50 with "Show more" using the cursor approach `AdminAudit.tsx` already has; add `aria-sort` header buttons for Partner and Last active when the list passes 50.

### Documents (staff)

**UX-30 (P3) Admin documents: labels and affordances.**
Seen (`farhan-admin_documents-d.png`, `i-farhan-docs-row-click-d.png`, `i-farhan-docs-upload-drawer-d.png`): the column "Partners" (a count) sits next to "Who can open it" and could mean entitled or opened; rows open an edit drawer when clicked but nothing says so (title looks like plain text until hover); the drawer's primary button is "Done" while the title field is editable, so it is unclear whether edits are saved on Done or already saved; the upload form is an inline left column, not a drawer, and pushes the library 420 px to the right when opened. The default audience is "Categories" with none ticked (an intentional deny-by-default; the error text "Pick at least one category." exists) but a first-time uploader sees an empty row of checkboxes with no explanation.
Fix: rename the column "Opened by" with the unit ("17 partners"), style the title as `linkbtn`, label the drawer button "Save" (or "Close" if autosave is the behaviour), and add the hint "Nobody can open this until you choose who" under the audience control.

### Reports and CleanStart team (staff)

No findings beyond the shared ones (mobile tables UX-33, tap targets UX-35). Numeric columns on Reports are right-aligned with right-aligned headers, which is the model for the rest. The inline "Remove access" confirm on Team (`i2-aditi-team-remove-inline-d.png`) is the right pattern for destructive actions and should be reused rather than a dialog.

### Audit log

**UX-31 (P3) KPI strip and filter field.**
Seen (`farhan-admin_audit-d.png`, `mob-farhan-audit-drawer.png`): "Last HubSpot check: Never" with the footer "Checked every 5 minutes" contradicts itself (in dev HubSpot is off); "Last error: None" has no footer so the card is shorter than its neighbours; "Waiting to send 0" and "Failed 0" are two zero cards; the filter placeholder "Filter by partner, customer or person" is cut to "...or pers" in a 220 px field (`axe`-clean but visibly truncated, 202 px scroll width against 220 px box).
Fix: show "Checked every 5 minutes" only when a check has run, otherwise "HubSpot sync is off"; merge the two zero cards into "Sync queue 0, failed 0"; shorten the placeholder to "Filter by partner, customer or person" at `width:260px` or "Search the log".

### Cross-cutting (shared components)

**UX-32 (P1) Tab strips are clipped on mobile; the last tabs cannot be reached.**
Seen: `aditi-partner_deals-m.png` shows "All, Pending, Accepted, Rejected, Exp" and stops. The strip is 539 px wide (documents) inside a 364 px card, `.tabs` has `overflow: visible` and the card has `.clip` (overflow hidden), so `scrollLeft` cannot change (tested: set to 200, read back 0). Deals loses Expired, Won and Lost; Documents loses Battlecards and Enablement guides ("Solution sheets" wraps to two lines first). Also on Partners the Partners and Applications tabs fit, so this only bites where there are many.
Why: filtering a list by status is blocked for a phone user.
Fix: in `portal.css` add `.tabs{overflow-x:auto;scrollbar-width:none}` and `.tab{flex:none;white-space:nowrap}`, and a right fade `mask-image:linear-gradient(90deg,#000 calc(100% - 24px),transparent)` under 760 px.

**UX-33 (P1) Wide tables hide the status and action columns on mobile with no cue.**
Seen: Deals and Overview show Customer and Product and cut off Status (`aditi-partner_overview-m.png`, `aditi-partner_deals-m.png`); Documents hides Type, Product, Updated and the Watch or Download button (`aditi-partner_documents-m-full.png`); partner Team hides Status, Last active, Deals and the remove and resend buttons (`aditi-partner_team-m-full.png`); Deal approvals hides Product to Decision (`mob-farhan-approvals.png`); Applications hides Wants to be to Decision (`mob-farhan-applications.png`); Audit hides the Action column and rows are 96 px tall because Who wraps (`farhan-admin_audit-m.png`). `ScrollRegion` (`src/components/ui/scroll-region.tsx`) scrolls horizontally but gives no visual cue, and the page cannot scroll sideways because `.main` is `overflow-x:hidden`, so nothing signals that content is missing. 9 to 40 interactive elements per page are under 44 px on mobile.
Why: the most important column is the first thing to disappear.
Fix, shared: in `portal.css` add a media rule `@media (max-width:760px){.hide-sm{display:none}}` and give the low-value columns of each table (`th` and `td`) `className="hide-sm"` in the order Product, Registered by, Account manager, Stage, Last active, Type; keep Status, the primary action and the identifying name. Add a scroll-shadow cue to `ScrollRegion` (a 16 px gradient on the right edge while `scrollLeft + clientWidth < scrollWidth`). Row action pairs should become one "More" button under 760 px only if UX-23 does not fit.

**UX-34 (P1) Control borders fail the 3:1 non-text contrast rule.**
Measured against their backgrounds: input and select border `#E2E0E8` on white 1.31:1 (`.field`, `.finput` uses `#E8E6EE` on `#FCFCFD` 1.21:1, `.fsel`, `.rsel`, `.dd-btn`); checkbox and radio borders `#C4C2CE` on white 1.76:1 (`.chk`, `.radio`); secondary button border `#E2E0E8` 1.31:1 (the label identifies those, so those are fine). The border is the only thing that marks where an input is (`public-sign-in-d.png`, `i-aditi-reg-suggest-d.png`). WCAG 2.2 SC 1.4.11 needs 3:1. Axe does not test this, which is why the existing pass (`A11Y-PASS.md`) is clean. Text contrast, for the record, is fine everywhere (see Summary).
Fix: in `portal.css` set a single token for control borders, `#928FA5` (3.14:1 on white, 3.06:1 on `#FCFCFD`), on `.field`, `.finput`, `.fsel`, `.rsel`, `.dd-btn.fsel`, `.chk`, `.radio`, `.seg` (as a 1 px outline) and the unchecked checkbox. Keep card, table and divider lines as they are (decorative). The quiet look survives: only controls change, hairlines stay.

**UX-35 (P2) Touch targets and hover-only labels.**
Measured on mobile: `.ibtn` 30x30 (117 occurrences across the sweep), `.act` 28x28 (95), the collapsed `button.search` 29x30 with a grey fill unlike its neighbours (39), `a.cust` 24 px, `.finput` 28 px high, `.dd-btn` 28, `.tab` 32. WCAG 2.2 AA minimum (24 px) is met for most, the 44 px guideline is not. The `.act` icon buttons depend on `data-tip` (hover or focus) for their name, and touch devices never show it.
Fix: in `portal.css` under `@media (max-width:760px){}` set `.ibtn,.act{width:40px;height:40px}`, `.btn,.fsel,.finput,.dd-btn,.tab{min-height:40px}`, `button.search{background:transparent}`, and `.act{width:auto;padding:0 10px}` with the label visible once UX-23 and UX-28 are done.

**UX-36 (P2) Placeholder text is 4.49:1.**
Measured: Chrome's default placeholder `rgb(117,117,117)` on `#FCFCFD` = 4.49:1 (needs 4.5). Search pill placeholder `#6B687D` on `#F4F3F7` is 4.87:1, fine.
Fix: `::placeholder{color:#6B687D}` in `portal.css` (5.25:1 on `#FCFCFD`).

**UX-37 (P3) Control sizes and small targets on desktop.**
Distinct control heights found in the CSS and measurements: 15, 18, 22, 24, 26, 28, 30, 34, 36, 38 px. Notable: `.li .btn{height:18px}` makes "Turn on" two-step 52x18; `a.link-sm` ("View all", "All", "Add", "Queue") is 15 px tall; the document title buttons and audit Action buttons are 18 px tall; "Change" is 22 px; checkboxes are 15 px. WCAG 2.2 SC 2.5.8 wants 24 px unless spaced.
Fix: standardise to 28 (compact), 30 (default), 36 (public forms); in `portal.css` remove the `.li .btn,.li .badge{height:18px}` override for buttons, add `.link-sm{display:inline-flex;align-items:center;min-height:24px;padding:0 4px}`, and `.linkbtn{min-height:24px}`.

**UX-38 (P3) Dates use six formats.**
Seen: "4 Nov" (no year), "4 Nov 2026", "13 Nov 2026, 14:02", "Today, 14:02", "Yesterday", "Closed 19 Sep", "Waiting 7 days", "Invited 5 Nov", and the combined "12 Jan 2027 60d" in one cell. `fmtShort` in `src/lib/dates.ts` has no year, so a deal registered "28 May" and one registered a year later look the same.
Fix: one rule in `dates.ts`: same-year dates "4 Nov", other years "4 Nov 2025", times only in drawers and the audit log; keep relative words only for today and yesterday. Split the Protection cell into the date and, below it in `li-s`, "60 days left".

**UX-39 (P3) The same thing has different names.**
Seen: Waiting (KPI), Pending (badge and tab), Awaiting review (stage) for one state; "Account manager" (deals table, Register deal) and "Partner manager" (profile menu, Company, Message drawer) for the same person; "Register deal" (nav, page) and "Register a deal" (title, Welcome button); "registration" (audit, admin search) and "deal" (everywhere else); "Elsewhere" as a region.
Fix: choose Pending for the state, Partner manager for the person, Register deal for the action, deal in visible copy; apply in the screens and `src/lib/dto.ts` labels. Do not change the nav labels.

**UX-40 (P3) Page titles do not match the screen.**
Seen: browser titles "Deal detail" (H1 is the customer), "Register a deal" (H1 Register deal), "Manage documents" (H1 Documents), "CleanStart team" (nav Team), 404 and error pages without a specific title.
Fix: `generateMetadata` in `src/app/partner/deals/[id]/page.tsx` returning the customer name; align the others in each `page.tsx` `metadata`.

**UX-41 (P3) One loading skeleton for every screen.**
Seen in code: `loading-skeleton.tsx` always draws a title, four KPI blocks and five rows, used by `src/app/partner/loading.tsx` and `src/app/admin/loading.tsx`. Team, Account, Company, Register deal and Welcome have no KPI strip, so the skeleton jumps on load.
Fix: add a `variant` prop (`list`, `form`, `detail`) and add per-route `loading.tsx` for `account`, `company` and `deals/new`.

**UX-42 (P3) Drawers focus the wrong field.**
Seen: the Message drawer focuses Subject, which is already filled with the deal name, while the cursor should be in Message (`i-aditi-deal-msg-drawer-d.png`); the document edit drawer focuses Title. The Request material dialog does it right (it focuses the text box).
Fix: pass the intended `initialFocus` ref to `Drawer` in `src/components/deals/ManagerMessageDrawer.tsx`, `shell.tsx` (the message drawer there) and `partners/message-drawer.tsx`.

**UX-43 (P3) The smallest text is 10.5 to 11.5 px.**
Seen: `.li-s` is 11 px, `.tbl th`, `.hint`, `.kpi-f`, `.badge` are 11.5 px, `.kbd` and badges inside list rows are 10.5 px. Contrast passes, but on a phone these lines are hard to read, and the compact overrides in the "compact side panels" block of `portal.css` shrink them further.
Fix: raise the floor to 12 px under 760 px (`.li-s,.hint,.kpi-f,.tbl th{font-size:12px}`) and remove the 10.5 px override for `.li .badge,.li .btn`.

### Other observations that need no work

Skip link, `aria-current`, focus rings, inline confirm in Team, the labelled drawer buttons, the audit drawer's Before and After cards, the cursor-based audit paging, the `.empty` states on Documents, Deals (filtered), Audit and Reports, and the single-column mobile stacking of the KPI grid are all sound. No horizontal page scroll exists on any screen at 390 (the content is clipped, not scrolled: see UX-32 and UX-33). The sidebar, profile menu, mobile menu, toast and the public right panel all use the same dark palette. Note for maintainers: `portal.css` first defines a white sidebar and then overrides it to dark under "dark sidebar" lower in the same file, and also defines `.card-h`, `.li` and `.dl` twice (the second block wins). It works but makes the cascade hard to read; collapse the duplicates when WP1 touches the file.

## Cross-cutting: what to fix once

| Problem | Shared component or rule | Used by | Findings |
|---|---|---|---|
| Control borders and placeholder contrast | `.field`, `.finput`, `.fsel`, `.rsel`, `.dd-btn`, `.chk`, `.radio`, `.seg`, `::placeholder` in `portal.css` | every form and filter | UX-34, UX-36 |
| Tab strip overflow | `.tabs`, `.tab` | Deals, Documents, Partners | UX-32 |
| Wide tables on mobile | `.hide-sm` class and `ScrollRegion` cue | 12 tables in screens and `components/partners` | UX-33 |
| Icon-only decision buttons | replace `.act` pairs with `btn btn-d` and `btn btn-p` text buttons; `.act` remains for non-decisions (download, resend) | Deal approvals, applications, access requests | UX-23, UX-28, UX-19, UX-35 |
| Empty states | one `.empty` markup (message plus action) used when a list or table has no rows, in place of header-only tables | Recent decisions, Overview, Deals, Documents | UX-13, UX-15, UX-25 |
| Tap and click target sizes | `.ibtn`, `.act`, `.btn`, `.link-sm`, `.linkbtn`, `.li .btn` | everywhere | UX-35, UX-37 |
| Overlays | `Drawer` and `Dialog` `initialFocus` | 6 drawers, 5 dialogs | UX-42 |
| Dates and labels | `src/lib/dates.ts`, `dto.ts` labels | all tables | UX-38, UX-39 |
| Shell | `shell.tsx` active state, crumb, search copy | all signed-in screens | UX-02, UX-03, UX-04, UX-05, UX-06 |
| Dev only noise | `devIndicators: false` | `next dev` | UX-01 |

## Fix plan

Six work packages, in priority order. Each owns a disjoint set of files, so they can run in parallel. The only dependency: WP3 and WP4 use the class name `hide-sm` that WP1 defines; until WP1 lands the class does nothing, which is harmless. Every package ends with the portal checks from `docs/partner-portal/BUILD-HANDOFF.md`: `pnpm --filter @cleanstart/portal lint`, `typecheck`, `test`, `build`, and `node apps/portal/scripts/verify-copy.mjs` (no em or en dashes), and the e2e `a11y.spec.ts` at 1440 and 393 stays at zero violations.

### WP1. Global CSS and shared UI primitives (fixes UX-32, UX-33 shared part, UX-34, UX-35, UX-36, UX-37, UX-43)

Files: `apps/portal/src/styles/portal.css`, `apps/portal/src/components/ui/scroll-region.tsx`.
Work: scrolling tabs; control border token `#928FA5` on inputs, selects, dropdown buttons, checkbox and radio; `::placeholder{color:#6B687D}`; `.hide-sm`; scroll cue in `ScrollRegion`; mobile target sizes; remove the 18 px `.li .btn` override; `.link-sm` and `.linkbtn` minimum height 24 px; 12 px text floor under 760 px; `.search-t` nowrap and ellipsis, `.search` 300 px; collapse duplicated rule blocks.
Acceptance:
1. At 390 wide on `/partner/deals`, the Expired, Won and Lost tabs can be reached by horizontal swipe or scroll, and `document.querySelector('.tabs').scrollLeft = 200` reads back above 0.
2. A script measuring the border colour of `.field`, `.finput`, `.fsel`, `.dd-btn.field`, `.chk` against its parent background returns at least 3.0:1; `getComputedStyle(input,'::placeholder').color` is `rgb(107, 104, 125)`; the contrast scan used in this audit reports zero text nodes under AA.
3. At 390 wide, `.ibtn` and `.act` are at least 40x40, `.btn`, `.finput`, `.dd-btn` at least 40 px high; on desktop no interactive element is under 24 px high except inline text links in running text.
4. A table inside `ScrollRegion` that overflows shows a right-edge shadow that disappears when scrolled to the end.
5. axe on all 25 pages at both widths still shows zero serious or critical.

### WP2. Shell and app configuration (fixes UX-01, UX-02 copy part, UX-03, UX-04, UX-05, UX-06)

Files: `apps/portal/next.config.ts`, `apps/portal/src/components/shell/shell.tsx`, `apps/portal/src/components/shell/search-palette.tsx`, `apps/portal/src/components/shell/notifications-popover.tsx`, `apps/portal/src/lib/routes.ts`.
Work: `devIndicators: false`; longest-match active nav; crumb that adds information and links back on detail pages; admin search copy "Search partners and deals", viewer-specific placeholder, platform-aware shortcut hint, Help link without a hard-coded title; denied-redirect toast; nav badge tooltip text.
Acceptance:
1. Restart `next dev`: no `nextjs-portal` element in the DOM, and the sidebar user name at the bottom left is fully visible at 1440 and 390.
2. On `/partner/deals/new` exactly one `.nav-a` has `aria-current="page"` (Register deal), on `/partner/deals/<id>` exactly one (Deals).
3. At 1440 the top-bar search label for every admin role is one line (`getClientRects()` count of the text node is 1) and the button height is 30 px.
4. On a deal detail page the crumb contains a link to `/partner/deals`; on list pages the crumb does not repeat the H1; at 390 the top bar title is the organisation name.
5. Signed in as Ishita the placeholder reads "Search documents"; as Sneha, opening `/partner/team` shows the toast and lands on Documents.

### WP3. Partner-side screens (fixes UX-13, UX-14, UX-15, UX-16, UX-17, UX-18, UX-19, UX-20, UX-21, UX-22, UX-42 for partner drawers, the partner part of UX-33)

Files: `apps/portal/src/components/screens/PartnerOverview.tsx`, `Deals.tsx`, `RegisterDeal.tsx`, `DealDetail.tsx`, `Documents.tsx`, `Team.tsx`, `Account.tsx`, `Company.tsx`, `PartnerWelcome.tsx`; `apps/portal/src/components/people/AccessRequests.tsx`, `people/SessionsCard.tsx`, `people/PasswordCard.tsx`, `people/InviteCard.tsx`; `apps/portal/src/components/deals/ManagerMessageDrawer.tsx`.
Work: empty states for a new partner (Overview, Deals), contact field rules on Register deal, duplicate-check card copy, closed-deal KPIs, access request buttons with text, save buttons disabled until dirty, "Sign out all other devices", `hide-sm` on low-value columns (Product, Registered by, Account manager, Stage, Type, Last active), message drawer focus.
Acceptance:
1. Signed in as `admin@seed-partner-01.example.com`: Overview and Deals show a message and a "Register deal" button, with no tabs, filters or header-only table; with filters set to nothing on Aditi's Deals the message is "No deals match these filters." with a Clear filters button.
2. On `/partner/deals/new`, typing "Var" shows either the matching customer or the neutral hint, never "no registrations at Var"; submitting with a contact email and no name shows an inline message and does not create a registration.
3. At 390 wide, Deals shows Customer and Status without horizontal scrolling for the first view; Documents shows the Watch or Download control without scrolling; Team shows Role and the remove control.
4. Team access request shows an "Approve as Sales" and a "Decline" text button; the Account page "Save profile" is disabled until a field changes.
5. Existing unit and e2e specs for these screens pass (update the label queries in `e2e/support/ui.ts` if a name changes).

### WP4. Admin-side screens (fixes UX-23, UX-24, UX-25, UX-26, UX-27, UX-28, UX-29, UX-30, UX-31, the admin part of UX-33)

Files: `apps/portal/src/components/screens/AdminApprovals.tsx`, `AdminPartners.tsx`, `AdminDocuments.tsx`, `AdminReports.tsx`, `AdminTeam.tsx`, `AdminAudit.tsx`; `apps/portal/src/components/partners/applications-table.tsx`, `partners/partner-detail.tsx`, `partners/partners-table.tsx`; `apps/portal/src/components/documents/DocumentEditDrawer.tsx`, `documents/UploadDocumentForm.tsx`.
Work: text Accept and Reject buttons in the queue; KPI aligned to the selected tab; Recent decisions empty state; partner detail scroll into view (or placed above the list); text Approve and Decline on applications; KPI replacements; documents labels and drawer button; audit KPI wording; `hide-sm` on low-value columns; placeholders.
Acceptance:
1. `/admin/approvals` as Farhan: every open row shows buttons whose visible text is "Reject" and "Accept" (a Playwright `getByRole('button',{name:'Accept',exact:false})` finds the visible text, not only an aria-label); the Waiting KPI, the tab count and the nav badge agree for the selected queue (or the card names its scope).
2. With no decisions in 7 days the Recent decisions card shows "No decisions in the last 7 days." and no header row.
3. Clicking a row on `/admin/partners` brings the detail card into the viewport (its `getBoundingClientRect().top` is between 0 and 400 after the click) with focus on its heading.
4. Applications show "Approve and invite" and "Decline" text buttons; the Undo toast still appears.
5. At 390 wide, the queue shows Customer and the Accept and Reject buttons without horizontal scrolling; the Applications table shows company and decision; the audit table shows When, Action and Who without a 96 px row height.
6. The existing `admin.spec.ts` and `documents.spec.ts` pass (update `e2e/support/ui.ts` names for the new button text).

### WP5. Public pages, error and not-found states (fixes UX-07, UX-08, UX-09, UX-10, UX-11, UX-12)

Files: `apps/portal/src/app/error.tsx`, `apps/portal/src/app/not-found.tsx`, `apps/portal/src/app/(public)/layout.tsx`, `apps/portal/src/components/screens/SignIn.tsx`, `ResetPassword.tsx`, `Apply.tsx`, `ApplyDone.tsx`, `AcceptInvite.tsx`, `apps/portal/src/components/partners/public-frame.tsx`.
Work: real error copy; not-found that links to the viewer's home; optional markers on Apply; sign-in copy, rate-limit text, default for "Keep me signed in"; `<main>` landmark; vertical centring; mobile segmented labels and hidden marketing panel; reset page without a token shows the request form.
Acceptance:
1. `grep -n "Walkthrough\|demo data" apps/portal/src` returns nothing; the error page shows an action list that exists.
2. Signed in, `/no-such-page` links to the viewer's home; signed out it links to sign in.
3. axe on `/sign-in`, `/reset-password`, `/apply`, `/accept-invite` and the 404 reports no `landmark-one-main` or `region`.
4. On `/apply` at 1440, Company website and Job title show "(optional)"; at 390 the "Partner type" options are on one line each and the dark panel is hidden.
5. `/reset-password` with no token shows the email form, not "This reset link is not valid".

### WP6. Titles, dates, labels and skeletons (fixes UX-38, UX-39, UX-40, UX-41, UX-42 for shared overlays)

Files: `apps/portal/src/lib/dates.ts`, `apps/portal/src/lib/dates.test.ts`, `apps/portal/src/lib/dto.ts` (label maps only), `apps/portal/src/components/screens/loading-skeleton.tsx`, `apps/portal/src/app/partner/loading.tsx`, `apps/portal/src/app/admin/loading.tsx`, new `loading.tsx` files under `apps/portal/src/app/partner/account`, `company` and `deals/new`, and the `metadata` exports in `apps/portal/src/app/partner/**/page.tsx` and `apps/portal/src/app/admin/**/page.tsx`, plus `apps/portal/src/components/ui/overlay.tsx` (initial focus prop).
Work: year rule for `fmtShort`; "60 days left" label helper; Pending, Partner manager, Register deal naming; deal title via `generateMetadata`; skeleton variants; `Drawer` and `Dialog` accept `initialFocus`.
Acceptance:
1. `dates.test.ts` covers same-year and other-year output; a date from 2025 renders with its year on the Deals table and the Partners "Last active" column.
2. Browser titles: `/partner/deals/<id>` is "<customer> | CleanStart Partner Portal", `/partner/deals/new` is "Register deal", `/admin/documents` is "Documents".
3. Throttling the network to Slow 3G, `/partner/account` shows a form-shaped skeleton with no KPI blocks.
4. `grep -rn "Awaiting review\|Account manager" apps/portal/src/components` lists only the CRM stage name and none of the person labels, and `verify-copy.mjs` passes.
5. Opening the partner message drawer places focus in the Message field.

Order of work if only one person is available: WP1, WP4, WP2, WP3, WP5, WP6. The five P1 findings close with WP1 (UX-32, UX-34, and the shared part of UX-33), WP3 and WP4 (the per-table part of UX-33) and WP4 (UX-23, UX-27).
