# CleanStart CMS — Product & Experience Recommendations

> Consolidated product/experience roadmap from the holistic CMS review. The engineering bug-fix plan lives separately in `04-FIX-PLAN.md` — this document deliberately does **not** duplicate code-bug fixes. It focuses on editor experience, content modeling, feature completeness, design language, and the keep/simplify/remove value decisions the owner needs to make.

## Executive verdict

CleanStart's CMS is, on the evidence, an unusually mature and well-engineered custom Payload build — it ships SEO tooling, a GDPR lead pipeline, a JSON-LD engine, a command palette, and an admin theme that most commercial CMSes charge premium-plugin money for, and the underlying content model and access layer are clean and consistent. The weighted **average score is 6.9/10**, and that number is honest: the foundation is excellent, but the product is built for a team of two or three editors and starts showing seams at six or more. The recurring themes across every reviewer are the same three: (1) the **author role is a ghost** and there is **no editorial workflow** — anyone with publish rights ships unreviewed; (2) several **half-built or speculative surfaces** (hidden `schemaAddons`, dead `MediaPicker`, dormant analytics cron, `closedAt`/auto-close cron that were never wired) train the team to trust features that do not actually work; and (3) **editor-facing polish lags engineering polish** — overloaded sidebars, a spartan block picker, jargon in help text, and a `News`/`Guides`/`Jobs`/`Pages` SEO-fallback chain that points at fields that do not exist. Fix the workflow gap, finish-or-delete the half-built surfaces, and trim the editor cognitive load, and this is a 8+/10 platform.

### Per-area scores

| Area | Score |
|---|---|
| Content Modeling Quality | 8/10 |
| Microcopy, labels, help text & editor guidance | 8/10 |
| Visual & Interaction Design (Admin SCSS system) | 8/10 |
| Authoring experience — article-type content (Blogs, News, Guides, KB) | 7/10 |
| Pages block builder + block library | 7/10 |
| Admin IA, Navigation & Dashboard | 7/10 |
| Feature Completeness & Product Gaps | 7/10 |
| Value-vs-Complexity (Custom Admin) | 7/10 |
| UX Consistency, Component States & Interaction Patterns | 7/10 |
| Taxonomy, People, Galleries & Media | 6.5/10 |
| Authoring experience — Events/Webinars/Podcast/Resources/Jobs | 6/10 |
| Accessibility posture | 6/10 |
| Roles, Permissions & Multi-User Editorial Workflow | 5/10 |
| **Weighted average** | **6.9/10** |

The two lowest scores — Roles/Permissions (5) and Accessibility (6) — are where the platform is most under-built relative to its ambition. They should anchor the roadmap.

---

## Top opportunities (ranked)

The highest-leverage improvements to editor experience and product value, ordered by payoff-to-effort.

### 1. Make the `author` role real — or delete it
**Why it matters:** The author role grants admin-panel access but **zero write permission on any collection**. An author logs in, sees everything, and cannot save a single draft. The role description ("Author = own drafts only") is a promise the code does not keep, generating support tickets and eroding trust in the whole permission system. This is the single most incoherent thing in the product.
**Affected areas:** Roles/Permissions, Content Modeling, Admin IA.
**Effort:** Medium (implement `isAuthorOrEditor` scoped to own records + field-level publish guard) — or Trivial (remove the role, simplify to admin/editor, fix the description).
**Payoff:** Removes the #1 source of editor confusion; unlocks a real contributor tier if you keep it.

### 2. Add a lightweight editorial review/approval workflow
**Why it matters:** Any editor can publish anything to production instantly with no second pair of eyes. There is no "submitted for review," no assignee, no notification — authors who finish a piece have no in-system way to request publication and coordinate out-of-band on Slack. This is the #1 reason content teams keep paying for Contentful/Sanity even with a custom CMS, and the cost grows with every writer added.
**Affected areas:** Roles/Permissions, Feature Completeness.
**Effort:** Medium for a `reviewState` field + notification on transition + a publish gate for authors; Large for full reviewer-assignment + inline comments.
**Payoff:** Content quality and team scalability — the difference between a 2-person and a 6-person editorial org.

### 3. Trim the article sidebar from ~20 items to ~12
**Why it matters:** A Blog article sidebar carries roughly 20 discrete cards (11 from `seoSidebarFields` alone, plus slug, permalink, displayPublishedAt, journeyMirror, tocDepth, featured, pinned, SEO group). A writer publishing their fourth post of the day scrolls past 15 collapsed cards to reach Publish on every save. Guides compound this with five post-body arrays (articleSections, FAQs, howTo, citations, keywords).
**Affected areas:** Authoring experience (articles), Admin IA.
**Effort:** Medium — move URL Change History, Hreflang, and Redirect (each touched <5% of publishes) into a dedicated "URL & Redirects" tab; group featured/pinned/tocDepth into one "Display options" collapsible.
**Payoff:** Faster, calmer daily publishing for the highest-frequency workflow in the system.

### 4. Finish or delete the half-built surfaces
**Why it matters:** Several features are modeled, partially built, then hidden or orphaned — which is worse than not having them, because they train developers to believe they work. The `schemaAddons` blocks field (6 Schema.org types) is `hidden: true` on ten collections with no re-activation ticket. `MediaPicker.tsx` is a complete, well-built component that nothing imports. The Jobs `closedAt` field is `readOnly` but no hook ever stamps it, and the "Phase G auto-close cron" it references does not exist. The `SavedIndicator` SCSS is 91 lines suppressed with `display:none !important`.
**Affected areas:** Content Modeling, Value-vs-Complexity, Feature Completeness, Visual Design.
**Effort:** Mixed — auto-close cron is Trivial; `schemaAddons` re-enable is Medium; the deletions are Trivial each.
**Payoff:** Restores trust in the schema surface; removes maintenance debt that will drift on every dependency upgrade.

### 5. Fix the broken SEO description fallback chains
**Why it matters:** `Guides`, `Jobs`, and `Pages` all call `seoSidebarFields({ descriptionSource: 'abstract' })` (or `'abstract'`/`'summary'`) pointing at a field **that does not exist in the collection**. Every guide, job, and page silently falls through to the site-default meta description and the SERP preview shows a blank snippet — on Guides, the single most SEO-invested collection in the schema. `News.abstract` exists but has no label or help text despite being the SEO source.
**Affected areas:** Content Modeling, Microcopy, Authoring experience.
**Effort:** Trivial — add the missing `abstract`/`summary` textareas with the standard ≤160-char hint and regenerate types.
**Payoff:** Immediate, measurable SEO correctness on three high-volume surfaces.

### 6. Rebuild the page-builder block picker and add collapse-by-default
**Why it matters:** The "Add block" dialog is a flat alphabetical list of label/slug pairs with no descriptions, categories, icons, or previews — a new editor cannot tell `Stats` from `Metrics bar`. Every block also renders fully expanded, so a 12-block product page is a wall of hundreds of vertical pixels. There is no insert-at-position; blocks always append to the bottom.
**Affected areas:** Pages block builder, Authoring experience.
**Effort:** Medium — add one-line descriptions + category grouping to the picker; render rows collapsed-by-default with a derived summary line; add collapse-all/expand-all and insert-at-index.
**Payoff:** The single change that most improves day-to-day editing of complex marketing pages.

### 7. Make the keyboard-inaccessible widgets navigable
**Why it matters:** Four core widgets are unusable for keyboard-only users: the DateTimePicker calendar is 42 individually-tabbable cells with no arrow-key navigation; the CommandPalette input has no `aria-label` and its active item is CSS-only (not announced); the MediaPicker tile grid has no keyboard operability; and the ContextMenu (Lexical table cells, list-view rows) only opens on right-click with no keyboard trigger at all. This is a legal/WCAG exposure for an admin tool used daily.
**Affected areas:** Accessibility (the lowest-but-one score).
**Effort:** Medium per widget — roving tabIndex + ARIA grid pattern is well-defined in the APG.
**Payoff:** Moves accessibility from "thoughtful foundation with practical gaps" to production-grade.

### 8. Resolve the dual toast systems
**Why it matters:** Two independent toast stacks coexist — `ToastBus` (`cs-cms:toast` on `window`, 2500ms TTL, max 3) and the `@cleanstart/ui` `ToastProvider` (`cs:toast` on `document`, 4000ms TTL, no cap). They have different payload shapes, TTLs, and DOM homes. A developer calling `dispatchToast` vs `showToast` hits a completely different stack; two dismiss timers fight over the same screen space. New flows will keep landing on the wrong one.
**Affected areas:** UX Consistency, Component States.
**Effort:** Small — delete `ToastBus`, migrate call sites to the `@cleanstart/ui` API, absorb the action-registry pattern.
**Payoff:** One coherent notification grammar; eliminates a class of "why didn't my toast show?" bugs.

### 9. Complete the Webinars/Events parity and on-demand handling
**Why it matters:** Webinars and Events diverge in ways that confuse anyone managing both. Webinars lack the `postEventCta` group and `ctaLabel` that Events has (identical need: surface a recording link after a live session). Worse, on-demand webinars still show `registrationMode`, `registrationUrl`, `eventStatus`, and `attendeesCap` — fields that are meaningless for a replay, yet the editor must fill them or hit a validation error.
**Affected areas:** Authoring experience (events), Content Modeling.
**Effort:** Small — add `postEventCta`/`ctaLabel` to Webinars; condition the live-only fields on `webinarType !== 'on-demand'`.
**Payoff:** Removes a daily friction point for the events/marketing team.

### 10. Role-scope the dashboard and quick actions
**Why it matters:** The dashboard is identical for all roles. Authors see "Review leads" and "Audit log" quick links they cannot use; the "Drafts pending" KPI counts nine collections but links only to the Blogs draft filter (click it and you may land on an empty list). Quick Actions omit Guides and Resources — the two highest-frequency content types for a security company — while including admin-only "Audit log."
**Affected areas:** Admin IA, Authoring experience, Roles/Permissions.
**Effort:** Small — the Dashboard is a server component that already receives the user; filter `QUICK_LINKS` and pulse cards by role, swap Audit log for New guide / New resource.
**Payoff:** A relevant, trustworthy landing screen per role.

### 11. Reorganize the sidebar grouping taxonomy
**Why it matters:** The "System" group swallows 10 collections for admins by mixing daily editorial tools (Media, Redirects) with pure infra-debug tables (AnalyticsCache, WebhookDeadLetter, BrokenLinks, SearchLog, PreviewAudit) that editors should never navigate to. "People" is a one-item group (Authors) that adds a header for no benefit. PodcastEpisodes is missing from the command palette entirely.
**Affected areas:** Admin IA.
**Effort:** Small — split out an "Infrastructure/Ops" group, hide AnalyticsCache, give Media its own "Assets" home, merge People into Content, add Podcast to the palette.
**Payoff:** Admins stop scanning past six machine-written tables to reach Media.

### 12. Add usage-tracking and a missing-alt dashboard to Media
**Why it matters:** The media pipeline is genuinely excellent, but there is no way to (a) see which docs reference an image before deleting it, or (b) find all records with empty alt text + `decorative=false`. The first is a "safe delete" gap; the second is an accessibility-governance gap that WCAG auditors and lawyers care about (deployed pages, not CMS validation state).
**Affected areas:** Taxonomy/People/Media, Accessibility, Feature Completeness.
**Effort:** Small — a `referencedBy` endpoint and a saved list-view filter / dashboard shortcut for `alt[exists]=false`.
**Payoff:** Confident media cleanup + auditable accessibility coverage.

---

## Decisions needed

Every `question`-severity and `value-vs-complexity` finding, framed as a crisp keep / simplify / remove / which-way decision for the owner.

### Keep / simplify / remove

- **The `author` role — keep-and-implement, or remove?** Today it is non-functional (see Top Opportunity #1). Decide: invest in scoped author write access + review workflow, or collapse to admin/editor and fix the misleading description. *Recommendation: this depends on team size — if you will ever have non-staff contributors, keep and implement; otherwise remove now.*

- **`schemaAddons` Layer-2 JSON-LD — fix the editor surface, or delete the dead block definitions?** Six Schema.org types (HowTo, VideoObject, Review, etc.) are modeled correctly but hidden because the renderer is half-broken. Decide: finish the SchemaPreviewField rendering and expose it, or remove the field from all ten collections to stop advertising a non-feature. *Recommendation: fix it — the modeling work is done and the SEO value is real; the gap is only the sidebar render.*

- **`MediaPicker.tsx` — wire it in as the canonical picker, or delete it?** It is a well-built Drawer-based picker with pagination that nothing imports; it duplicates the inline browse dialog. Decide: make it the one coherent picker (replacing the inline dialogs in MediaField/MediaBrowseDialog), or delete the dead code now. *Recommendation: delete now, revisit when you next refactor the browse experience.*

- **The four-provider analytics cache layer — keep dormant, or pause the cron?** GA4/GSC/Clarity/Cloudflare caching, two cron cadences, and a Postgres collection are all built, but no provider is live and the dashboard reads "Connect analytics" for all four. The 15-minute cron runs against empty rows. Decide: leave the infrastructure (it is correct for when J2 lands) but disable the frequent cron until at least one provider is connected. The `gscUrlInspectionApi` per-document kind is even more speculative — consider removing until the basic case ships. *Recommendation: keep code, pause cron, drop URL-inspection kind.*

- **Three category collections (Categories / NewsCategories / KnowledgeCategories) — keep the URL-justified split, or consolidate behind a `scope` discriminator?** The split is genuinely justified by URL parity but costs editors three mental models and blocks cross-collection tagging. Decide: live with the split (and at minimum add per-collection descriptions naming which content type each serves), or schedule a `scope`-field consolidation for the next major cycle (breaking change — needs migration + slug-redirect backfill). *Recommendation: keep for now with better descriptions; revisit at v2.*

- **`AboutGalleries` as a versioned collection — keep, or convert to an array on a global?** Each gallery image is a standalone record with its own draft/publish state and a manual `displayOrder`; the promised drag-to-reorder was never built. Decide: convert to an array field on an AboutUs global (native drag-reorder, one save, no per-image publish state) and migrate. *Recommendation: convert; gallery images don't need their own publish lifecycle.*

- **Authors as a full CV — keep the structured arrays, or collapse them?** education/experience/skills/awards arrays suit a professional directory, not a blog byline; the existence of LegacyBioViewer suggests editors aren't filling them. Decide: keep them but move into a collapsed "Extended profile / JSON-LD" group, or collapse to a single freeform textarea. *Recommendation: keep behind a collapsed group; default closed.*

- **Authors `topicAreas` — free-text keywords, or taxonomy relationship?** Currently free-text, disconnected from the category graph, so JSON-LD `knowsAbout` is whatever the editor typed and there is no "filter posts by author expertise." Decide which it is. *Recommendation: keep free-text for JSON-LD but document the independence; only relate it if you build expertise-based filtering.*

- **`A/B testing / personalization` — invest, or explicitly defer to v2?** No variant concept exists anywhere. For a conversion-critical B2B marketing site this is high value, but adding it later requires multi-variant storage or edge-middleware flagging. Decide explicitly so the team doesn't build features that assume single-variant. *Recommendation: defer to v2, document the decision and the chosen implementation path.*

- **`Localization / i18n` — enable now, or commit to English-only?** No locale field exists on any collection; the hreflang tooling assumes manual URL entry. Payload's config-level localization is far cheaper to add before content volume grows. Decide now — the migration cost only rises. *Recommendation: if multi-language is even possible on the roadmap, enable Payload localization on Blogs/KB/Pages before volume accrues; otherwise document English-only and stop building hreflang features.*

- **`SavedViews` storage in `users.preferences` — keep, or move to a collection?** Per-user JSON blob works for a small team but has multi-device staleness and last-write-wins clobber across tabs. Decide based on team size. *Recommendation: keep for ≤3-4 editors; add an optimistic `setUser` after PATCH and document the multi-device caveat.*

- **Full field-replacement layer (~3,350 lines, 18 custom field components) — keep all, or revert the cosmetic ones?** TextField, TextareaField, RelationshipField, SelectField, and BlocksField add real behavior; Checkbox/Radio/Email/Number/Point/Group/Row/Join/Code appear to be cosmetic reskins that carry a per-Payload-minor upgrade tax. Decide: revert the cosmetic group to stock and reserve custom components for the five with genuine value. *Recommendation: revert cosmetic reskins; the styling delta is not worth the upgrade tax.*

- **HubSpot lead handler (173 lines, registered, dormant) — keep in registry, or move to `future/`?** CLAUDE.md marks HubSpot as J3 and Zoho as the J2 primary CRM; the handler will likely need a model update when Zoho's schema stabilizes. Decide: move to `future/` and exclude from the registry, or pin the SDK and mark dormant. *Recommendation: move to `future/`, pin the SDK.*

### Which-way modeling decisions

- **Events/Webinars topic taxonomy — add a `categories` relationship, or stay ungrouped?** Blogs/Guides have categories; Events/Webinars have only type/region/status. A content team running many events will want topic filtering. Decide yes/no and document either way.

- **PodcastEpisodes scope — full content collection, or lightweight?** It is missing SEO fields, search-sync, webhook/IndexNow hooks, schema, categories, showNotes, speakers, host, season, and transcript — i.e., it is modeled as a card stub, not a real show. Decide how much of the standard content-collection suite it should get. *Recommendation: at minimum add showNotes (no detail-page body without it), SEO fields, search-sync, and a speakers relationship.*

- **Blogs `categories` — single or multi?** Blogs is `hasMany: false` while News is `hasMany: true`. Decide parity (a blog post that spans topics cannot today). *Recommendation: make Blogs multi for parity.*

- **`Testimonial` block — single quote, or relationship to a reusable Testimonials collection?** The block conflates a page-layout unit with a data entity; the same quote on six pages is six independent copies. Decide: add a Testimonials collection + relationship (correct content-modeling answer) or at least a repeating-items array (quick carousel). *Recommendation: Testimonials collection.*

- **`Forms.crmHandlers` (hubspot/salesforce multi-select) vs the Integrations collection** — these are parallel CRM-routing surfaces; Salesforce is a dead option with no Integrations kind. Decide: replace `crmHandlers` with a filtered relationship to `integrations` so routing is explicit and the phantom option disappears.

- **`Legal` global — one record for all three policies, or split per document?** A single global means bumping the Privacy Policy version also versions the unchanged Terms/AUP, and you cannot stage one policy independently — risky given Leads snapshot `policyVersion` at submit time. Decide: split into PrivacyPolicy/TermsOfService/AcceptableUsePolicy globals each with drafts + `effectiveAt`.

- **Section block layout range** — only Stack and Two-column exist. Decide whether to add three-column / asymmetric (1:2, 2:1) variants, or keep Section minimal and push grids to FeatureGrid. *Recommendation: add the variants; they're CSS-grid-only, no new render logic.*

- **Stats vs MetricsBar** — near-duplicate social-proof blocks. Decide: merge into one block with a display-style select, or keep both with clear descriptions. *Recommendation: at minimum add disambiguating descriptions; merging is cleaner.*

- **`IntegrationLogos` category list** — hardcoded 7-value select. Decide: keep hardcoded (developer adds categories) or promote to an `IntegrationCategories` collection like the other taxonomies. *Recommendation: promote, for editor self-serve consistency.*

---

## Quick wins

Trivial/small-effort changes with outsized experience payoff. Most are one-to-three-line edits.

- **Add the missing `abstract`/`summary` SEO-source fields** to Guides, Jobs, and Pages, and add the `≤160 char` hint + label to `News.abstract`. Fixes blank meta descriptions on the highest-volume SEO surfaces.
- **Add the Jobs auto-close cron** (`auto-close-jobs.ts`) and a `jobStatusTimestampsHook` to stamp `closedAt`. Removes a permanently-null audit field and stops stale "open" listings from being indexed.
- **Set `AnalyticsCache` to `hidden: true`** — its own description says "server-managed, do not edit." One-line change that shortens the System group.
- **Add editor-facing help text** to the Webinars/Events `registrationMode` field ("In-house form: leads captured in CMS. External URL: handled by Zoom/Eventbrite, no leads captured.") replacing the developer note "Per-record switchable per locked schema decision."
- **Replace developer jargon in editor-facing descriptions:** "ISO 8601 duration" → "e.g. PT30M for 30 minutes"; "AEO/GEO signal" → "Helps AI assistants surface this content"; "dead-letters" → "failed deliveries" on HealthBadge; HTTP-status raw output → "Test sent successfully" / "Test failed — destination did not respond" on TestButton.
- **Strip "Phase E/F/G" and Webflow-migration provenance** from live field descriptions (Forms.crmHandlers, Resources.downloadCount, Guides.articleSections/citations/keywords). Move provenance to code comments; write functional descriptions instead.
- **Add `maxRows: 3` to Blogs `relatedPosts`** so the "pin up to 3" guidance is enforced instead of advisory.
- **Make Resources `type` required** (or default it) so resources stop publishing untyped and breaking CTA-copy fallback and mega-menu filtering.
- **Add a "Fix mirror" button** to JourneyMirrorWarning (it already has currentId/targetId/direction) — turns a read-only diagnosis into a one-click fix, or add an afterChange hook that mirrors automatically.
- **Add `--success` and `--error` variants** to the dashboard pulse cards (the status tokens already exist) so a stalled lead queue or broken-links count can signal red.
- **Replace all `alert()`/`window.confirm()` calls** (DsarActionsPanel, DisableUserAction, FaqBulkPaste Clear-all) with the themed Notice/ConfirmDialog/toast already used everywhere else.
- **Replace bespoke `cs-embed-dialog__cancel/__confirm` button classes** with the standard `cs-btn` system; delete the redundant SCSS.
- **Add an "Enable account" button** to DisableUserAction when already disabled (today the only re-enable path contradicts the field guidance).
- **Server-enforce the 12-char password minimum** via `auth.minPasswordLength` (currently client-side HTML only — bypassable via API).
- **Fix the "Drafts pending" KPI link** — make it non-clickable or relabel it "Blog drafts pending," since it counts nine collections but links to the Blogs filter.
- **Add PodcastEpisodes to the command palette** NAV_TARGETS and SEARCHABLE_COLLECTIONS (currently unreachable via Cmd+K).
- **Swap "Audit log" for "New guide"/"New resource"** in dashboard Quick Actions.
- **Remove the `outline: none` on the skip-link focus** state and add the focus ring to the radio pill (`:focus-visible` not forwarded today) — two trivial keyboard-visibility fixes.
- **Use `<Spinner>` instead of the raw `'…'`/"Loading…"** strings in SchedulePublishDialog delete, MediaBrowseDialog, and replace the `×` glyph buttons with the aria-hidden SVG X used in DialogHeader.
- **Improve the `pageLayout` and `tocDepth` descriptions** with concrete outcomes ("Default: 1440px container; Narrow: 720px prose; Full-bleed: edge-to-edge") and drop the confusing "Re-save to apply" microcopy.

---

## Bigger bets

Large-effort items worth planning deliberately, not squeezing into a sprint.

- **Editorial workflow + roles overhaul.** Combine the `author`-role fix, a `reviewState` lifecycle (draft → submitted → changes-requested → approved), reviewer notifications, and a publish gate for non-approvers. This is the platform's biggest single value lever and the lowest-scoring area. Pair with per-collection / content-scoped editor roles (e.g. `jobs-editor`, `events-editor`) so HR, dev-rel, and marketing can co-exist without cross-contamination. Access functions in `access/index.ts` are the right single choke point.

- **Inline comments / collaborative annotation on drafts.** A `comments` relationship per content collection (`{ author, fieldPath, anchorText, body, resolved }`) with pinned chips in the edit view. This is the feature that most often keeps teams paying for SaaS CMSes. Large, but it removes the entire out-of-band-review tax.

- **Version diff/compare UI.** Payload stores versions but ships no visual diff. A custom field-level/word-level diff (reusing the existing `lexicalToPlainText` + a `diff` library) makes the version history actually useful for auditing what an author changed. Medium-to-large.

- **Real DAM, beyond a flat folder select.** Folders-as-collection (tree + relationship), usage tracking (`referencedBy`), bulk retag/delete of orphans, and a missing-alt dashboard. Start with usage tracking (small) and grow into folder browsing (medium).

- **Unified taxonomy.** Consolidate the three category collections behind a `scope` discriminator, give Guides and Resources a first-class category relationship, and unify topic tagging across Events/Webinars/Podcast. Breaking change — needs migration and slug-redirect backfill; schedule as a major cycle.

- **Localization / i18n.** If on the roadmap, enable Payload config-level localization before content volume makes the migration expensive. The hreflang tooling is already built and waiting.

- **Bulk content operations.** Custom endpoints + `beforeListTable` action bar for bulk publish/unpublish, recategorize, and author-reassign (the single-doc `ReassignContentAction` logic generalizes). Saves the "open and re-save 40 posts after a taxonomy change" grind. Medium.

- **Content reuse / shared snippets.** A `Snippets` collection (or a reusable-CTA library) referenced from blocks, so the same CTA copy on six pages updates once. Medium; pain grows with site size.

- **Block-builder previews.** Per-block-type thumbnails in the picker and a derived headline/summary on collapsed block rows (the Sanity/Contentful/Builder.io standard). The biggest qualitative upgrade to the page-building experience. Medium.

- **Accessibility hardening pass.** Roving-tabIndex + ARIA grid on DateTimePicker, TableGridPicker, and MediaPicker; CommandPalette listbox + `aria-activedescendant`; ContextMenu keyboard trigger; Popover initial focus. Several medium items that together move the a11y score from 6 to production-grade.

- **A weekly editorial digest cron.** Top posts (GA4), high-impression/low-CTR opportunities (GSC), new broken links, upcoming scheduled publishes — pushed to Teams/Brevo. Most of the data pipeline already exists; medium effort, recurring value.

---

## What's already excellent (preserve these)

Genuine strengths the team should guard against regressing.

**SEO & schema tooling — best-in-class for a custom build.**
- Auto-synced SEO title/description with a Yoast-style manual-override toggle.
- Pixel-budget SERP preview using canvas `measureText` that genuinely mirrors Google's truncation.
- Live JSON-LD health badge with per-check expand and Rich Results link, plus an admin-only override ingest.
- The JSON-LD dispatch engine (~5k lines, 14 type files) covering Article/NewsArticle/TechArticle/Event/Person/Organization/JobPosting/HowTo/FAQPage — pure, well-tested, and rare at this depth.
- BodyAuditField at-a-glance signals (link counts, alt coverage, readability band, featured-snippet candidates).
- Layered SEO Advanced panel correctly deferring robots/speakable behind double progressive disclosure.

**Content model & data integrity.**
- Shared field builders (`buildTaxonomyFields`, `seoSidebarFields`, `publishedAtField`, `displayPublishedAtField`, `mediaUploadField`) eliminate per-collection drift.
- The two-stamp date model (locked `publishedAt` + editor-overridable `displayPublishedAt` with audit logging and contextual backdate warnings) — exactly the right approach for GDPR-defensible backdating.
- Append-only, immutable Leads model with consent snapshot, `formSchemaVersion` stamp, PII redaction, DSAR endpoints, and Brevo email-health lifecycle.
- Registration discriminator (internal/external) with per-branch conditional validation; event lifecycle automation (`cancelledAt`, `previousStartDate` on postpone), unit-tested.
- Cycle-detection on Pages `parent`; "no Section-inside-Section" enforced; PodcastEpisodes YouTube-URL normalization to a stable ID; Integrations kind-immutability + AES-256-GCM secrets at rest.

**Media pipeline — meaningfully better than stock Payload.**
- Canonical-filename pipeline (slugify, short-hash, collision check, junk-slug detection) that survives ISR invalidation.
- DOMPurify SVG sanitisation (an XSS class most Payload projects skip).
- Inline alt-text editing in the field card; MediaSizeWarningField CWV chip that guides without blocking; PDF first-page thumbnailing via dynamic-imported pdfjs.

**Admin productivity & IA.**
- A production-quality Cmd+K command palette (recent history, debounced live search, grouped results, keyboard-native) rivaling Linear's.
- Server-rendered dashboard with day-grouped activity timeline, editorial pulse metrics, and a graceful analytics empty-state.
- NavGroupPersistence + NavOpenOnDesktop + live NavBadges draft counts.
- Saved-views infrastructure for per-editor list preferences.

**Design system & component foundation.**
- A real three-tier token architecture (primitives → theme remap → semantic intent) so light/dark inversion is automatic; restrained, meaningful use of brand cyan; motion codified at three levels honoring `prefers-reduced-motion`.
- The deliberate doc-controls button hierarchy (Save Draft promoted, Publish demoted) and safety-first leave-without-saving modal swap.
- Native `<dialog>`-based primitives (Dialog, Drawer, CommandPalette) giving focus-trap, top-layer rendering, and ESC for free.
- Full ARIA patterns on Combobox, TabsField, DropdownMenu, Tooltip; correct `role=alert`/`role=status` urgency mapping on toasts; a skip-link wired via MutationObserver for the SPA.

**Microcopy & safety.**
- PublishChecklistBanner's three-state, severity-tiered, collapsible feedback.
- LeadsImmutableBanner explaining the GDPR "why" behind the lock; the CSV-truncation banner.
- DisplayPublishedAtField's five contextual states with inline "schedule from here."
- The two-audience Integrations approach (plain-English for business admins, secrets machinery hidden).
- DSAR two-step confirmation citing the GDPR article at the point of action.

**Ops & integrations depth.**
- Redirects with auto-creation on slug change, cycle guard, hit counter, and bulk CSV import.
- Revocable preview-share JWTs with an audit trail.
- Broken-links cron with per-source-doc tracking.
- The 15-provider embed library with per-provider URL validation and a test-enforced CSP origin list.
- The composable LeadHandler pipeline with the R2 fallback queue guarantee ("no lead lost during outage").
