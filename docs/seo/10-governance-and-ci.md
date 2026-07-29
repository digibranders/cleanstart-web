# Governance & CI Enforcement

**Module:** 10 — Governance & CI enforcement
**Prefix:** `GOV`
**Review cadence:** Not listed in `00-index.md` §9 — no fixed cadence stated; update opportunistically when a rule is found stale or a client engagement surfaces a gap (`00-index.md` §9, closing note).
**Scope:** SEO as code — tests, lint gates, publishing checklist, editor guardrails, drift tests, ownership/RACI (`00-index.md` §8, module map row 10).
**Evidence base:** `docs/seo/evidence/sources/governance.md` (13 researched items plus the mechanically-testable-vs-human-review taxonomy); `docs/seo/evidence/verification-log.md` corrections #29–#31 (all three applied below); `docs/seo/evidence/codebase-inventory.md` §"Measurement & Governance" (mechanisms, configuration, and the enforcement-inventory table) and §"Performance & Core Web Vitals" (bundle-budget mechanics); a direct `gh api` branch-protection re-check against `digibranders/cleanstart-website`, run on 2026-07-29 while authoring this module, which reconfirmed the codebase inventory's own finding: `404 "Branch not protected"` on both `main` and `development`.

## A module with unusually little authority to borrow

Every other core module in this SOP rests, for its most important rules, on a vendor telling you directly what to do: Google's own documentation on canonicalization, structured-data requirements, robots directives. This module cannot do that, because no vendor documents the assembled practice of *governing* a codebase's SEO correctness. Google, GitHub, and Lighthouse each document a piece — what a Lighthouse audit checks, how a required status check gates a merge, what a `noindex` directive does once discovered — but nobody publishes "how to build your SEO CI pipeline end to end." Most of what follows is those pieces wired together, which is exactly why the majority of the rules below carry the `Convention — not vendor-confirmed` label rather than a `[Tier 1]`/`[Tier 2]` citation. Of the twelve rules in this module, five rest on at least one genuine Tier 1/2 citation (GitHub's own required-status-check documentation, Vitest's and Turborepo's own configuration docs, Google's structured-data policy page, and Lighthouse CI's own assert-configuration reference); the remaining seven are `Convention` in the sense this SOP defines it — retained because they are genuinely useful, not because they carry borrowed authority they don't have.

This module also corrects its own evidence base in three places before any rule below relies on it. First, the researched claim that Google's structured-data policy page (`sd-policies`) names "Rich Results Test / Schema Markup Validator" as two distinct Google-recommended tools does not survive a direct fetch of that page — it names only the Rich Results Test; the "Schema Markup Validator" name belongs to schema.org's own independent tool at `validator.schema.org`, never Google's. GOV-04 below cites each correctly, separately. Second, the evidence file's own summary table assigned a single "Tier 2" tier to a rule combining "Lighthouse CI can be configured to fail a build on a score threshold" (genuinely Tier 2 — Lighthouse's own docs) with "a team should gate every PR on that threshold" (never stated by any vendor) — every other mixed rule in the same source file splits its vendor-backed mechanical component from its Convention-labeled policy component; this was the one row that didn't. GOV-03 and GOV-11 below split it, as the other mixed rules already did. Third, the original taxonomy filed "structured data truthfulness" as human-only-forever with no carve-out for the narrower, genuinely mechanical case of checking that a JSON-LD field matches its own CMS source field — GOV-05 below restores that carve-out.

## What is mechanically testable

This taxonomy is the backbone of the module: it is what determines whether a given SEO property belongs in a CI test (engineering-owned, §P0–P3 below) or in the publishing checklist a human reviews at the moment of publish (GOV-10). The two-column split itself is this SOP's own synthesis — no vendor publishes a "testable vs. not" taxonomy — but every individual claim inside each column is sourced or convention-labeled at the rule that operationalizes it.

**Mechanically testable in CI (deterministic, no external dependency, no human judgment required):**

- Canonical tag presence, self-reference, exactly-one-per-page, absolute-URL form (module 03)
- Title/meta-description presence and length (module 03); title **uniqueness** across a defined route set — a string-diff across a known set of rendered titles, not a judgment call
- Sitemap XML well-formedness, `<loc>` count/size limits, sitemap-vs-route-manifest parity (module 02; GOV-08's post-deploy analogue)
- JSON-LD syntactic validity (parses as JSON, matches the declared `@type`'s required-property shape) — GOV-04
- **JSON-LD field values matching their corresponding CMS source fields** (`price`, `datePublished`, `author.name`, `availability`, and similar 1:1-mapped fields) — a plain equality check, not a content judgment — GOV-05
- Robots meta tag / `X-Robots-Tag` value correctness per environment (module 01)
- Redirect-map integrity: every entry resolves, no cycles, no chain beyond a small fixed hop count — GOV-07
- Internal link status codes: no internal `<a href>` pointing at a 404/5xx (module 02; GOV-09's live-drift analogue)
- A fixed-threshold Lighthouse category score, as a floor — GOV-11

**Requires human review (cannot be asserted mechanically, ever — not a tooling-maturity gap, a permanent property):**

- Whether a title or meta description is *good* — accurate, compelling, non-cannibalizing in intent. Sharpen this against the item directly above it: title **uniqueness** (does string A equal string B) is a mechanical diff; title **quality** (is this a good title) is not, and no amount of tooling investment closes that gap — it is a different kind of question, not a harder version of the same one.
- Whether structured data is *truthful* to the page's actual content, in the full sense — Google's own guidance says markup must not be "misleading," which is a content judgment. This is **narrower** than it first appears, per the carve-out above: a JSON-LD field can be perfectly *consistent* with its CMS source field (mechanically checkable, GOV-05) while that source field is itself wrong, stale, or misleading (not mechanically checkable, ever). The consistency check rules out one specific, common defect class — the builder silently diverging from its own source of truth — without pretending to certify truthfulness in the broader sense.
- Whether a page will actually rank, get a rich result, or get indexed at all — Google states sitemap inclusion and even fully valid structured data are hints, not guarantees.
- E-E-A-T / content-quality signals.
- Whether a redirect *should* exist (a business/editorial decision) vs. whether it is mechanically correct (GOV-07's concern, a different question).
- Whether the sitemap's chosen canonical URL is the *right* one when duplicates exist — Google's own framing is "choose the URL you prefer," an editorial call no machine can make on your behalf.

## CleanStart: the enforcement gap, plainly stated

CleanStart is the most instructive evidence this module has, and the finding generalizes past this one repo: **the site has genuine SEO tests and genuine CI, and yet almost nothing is actually enforced.**

- **Neither `main` nor `development` has GitHub branch protection.** `gh api repos/digibranders/cleanstart-website/branches/{main,development}/protection` returns `404 "Branch not protected"` for both, reconfirmed live while writing this module. Nothing — no failing test, no red Lighthouse score, no failed lint — currently blocks a merge or a direct push to either branch (GOV-01).
- **`packages/schema`'s roughly 65 test assertions never run in any CI job.** The package defines its own `"test": "vitest run"` script and it passes when run locally, but no workflow references it: `apps/web/vitest.config.ts`'s `include` is scoped to `apps/web/src/**` only, and `grep -rn "schema" .github/workflows/*.yml` returns no hits at all (GOV-02). These are not incidental tests — they are exactly the JSON-LD override-validation, rich-result-lint, template-builder, breadcrumb-builder, and graph-composition tests that GOV-04 and GOV-05 below say should exist.
- **Lighthouse's `categories:seo` check runs on every build but is `warn`-level**, so it cannot fail a job even when the score falls below the configured `minScore: 1.0` — and unlike the bundle-budget gap below, no comment anywhere in `.lighthouserc.json` documents this as a deliberate, dated tradeoff (GOV-03, GOV-11).
- **The bundle-budget script runs in CI but without `STRICT_BUNDLE_BUDGET=1`,** so only the regression-vs-baseline check can fail the job — the absolute P50/P99 ceiling never fires. Unlike Lighthouse, this gap is explicitly documented in the script itself as intentional and temporary, with a named target (GOV-06).
- **All 8 of `apps/web/src/lib/seo/*.test.ts` genuinely do run in CI** (`web.yml`'s test step, included by `vitest.config.ts`'s `apps/web/src/**` glob) — this is real, working enforcement, and it sits right next to all four gaps above without protecting against any of them, because none of it is wired to a required status check on an unprotected branch.

The lesson is not "CleanStart's CI is bad" — several individual pieces are well-built, and the bundle-budget gap is a model of how to document a known, temporary permissiveness honestly. The lesson is that **a green check, a passing local test, and a well-configured assertion are three different things, and only one of them (a required status check on a protected branch) actually stops a bad change from shipping.** A team can build all the SEO tests in the world and still enforce none of them if the last, cheapest step — turning on branch protection — is skipped.

---

## P0 — causes deindexing, traffic loss, or serves the wrong content to crawlers

### GOV-01 — A CI check only blocks anything if it is a required status check on a protected branch

- **Severity:** P0
- **Applies:** Always
- **Rule:** Configure branch protection with required status checks on every branch that deploys to production. A CI job that reports red with no required-status-check configuration on its branch blocks nothing — anyone can merge or push past it regardless of what the job found.
- **Why:** GitHub (and equivalent platforms) only prevent a merge when a specific check is explicitly listed as required in that branch's protection rule. An unprotected branch treats every CI job, however comprehensive, as informational output attached to the PR, not a gate. This SOP rates the gap P0 — not because the missing protection itself deindexes anything, but on the same blast-radius reasoning CRAWL-02 uses for a robots.txt 5xx: every other automated protection this module and this SOP describe, including checks that would catch genuinely P0-class regressions elsewhere (a soft-404 fallback silently breaking, a `NOINDEX_HOSTS` list emptying, a sitemap-vs-route drift), inherits this same nullification. The check exists; whether it protects anything depends entirely on this one platform setting.
- **Acceptance:**
  - `gh api repos/<org>/<repo>/branches/<branch>/protection` returns a protection object, not a 404, for every branch that deploys to production
  - The required-status-checks list includes the job name for every CI check this project treats as blocking
- **Verify:** `gh api repos/digibranders/cleanstart-website/branches/main/protection`
- **Reference:** None — no reference implementation
- **Source:** Convention — not vendor-confirmed for the specific claim that SEO CI checks must be in the required list. The underlying mechanism — a required status check is the only thing that blocks a merge — is documented first-party platform behavior: [Tier 2] https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches.
- **Tools:** Not applicable — no SEO tool surveyed in this SOP audits repository merge-gating configuration; this is a platform-configuration property, not a crawlable-site property.
- **Anti-patterns:** Treating a red GitHub Actions check as proof a regression "can't" ship. Without required-status-check configuration, a failing check is a strong hint a reviewer might ignore or a direct push might bypass entirely — not a technical block.
- **Evidence:** `gh api repos/digibranders/cleanstart-website/branches/main/protection` and the equivalent call for `development` both returned `404 "Branch not protected"`, confirmed both in `docs/seo/evidence/codebase-inventory.md` §"Measurement & Governance" and by a direct re-check on 2026-07-29 while authoring this module. Every check named elsewhere in this module — the 8 `apps/web/src/lib/seo/*.test.ts` files, the Lighthouse `categories:seo` audit, the bundle-budget regression check — can go red on either branch with zero effect on whether a PR can be merged or a direct push accepted.
- **CleanStart:** Fail

---

## P1 — material organic or AI-visibility impact, no immediate loss

### GOV-02 — A package's own passing test script is not "enforced" unless a CI job's scope actually reaches it

- **Severity:** P1
- **Applies:** Always
- **Rule:** Verify that every package containing SEO-relevant tests is reachable by an actually-executed CI job's test scope. A package defining its own `"test"` script, or a root `test` script that exists but is never invoked by a workflow, provides zero regression protection no matter how many assertions it contains or how reliably they pass locally.
- **Why:** A test runner's `include` glob is scoped per invocation, and a monorepo task runner's dependency graph (e.g. `dependsOn: ["^build"]`) building a package's dependencies does not imply that package's own `test` task also runs. A developer who sees `packages/schema`'s tests pass locally has no way to tell, from that fact alone, whether CI ever calls them.
- **Acceptance:**
  - For every package containing an SEO-relevant `*.test.ts` file, at least one CI workflow job's command scope reaches that package's tests — directly, or via a task-runner dependency graph that actually includes `test`, not only `build`
  - `grep` for the package name across all workflow files returns at least one hit tied to a test-running step
- **Verify:** `grep -rn "schema" .github/workflows/*.yml`
- **Reference:** `packages/schema/package.json` (own `"test": "vitest run"` script, no workflow reference); `apps/web/vitest.config.ts:11` (`include` scoped to `apps/web/src/**` only); `.github/workflows/web.yml:79-83`; `.github/workflows/ci.yml:95-96`
- **Source:** Convention — not vendor-confirmed for the governance rule itself; it follows from combining Vitest's own `include`-scoping behavior ([Tier 2] https://vitest.dev/config/#include) with Turborepo's own `dependsOn` semantics ([Tier 2] https://turborepo.com/docs/reference/configuration#dependson), neither of which prescribes this as a practice — each only documents the mechanism the gap depends on.
- **Tools:** Not applicable — no SEO tool surveyed audits CI test-glob coverage; this is a repository-configuration property.
- **Anti-patterns:** Adding a new SEO invariant test to a shared package and considering it "covered" because `vitest run` passes locally or in a pre-commit hook — neither confirms the pipeline that gates the actual deploy branch ever executes it.
- **Evidence:** `packages/schema/**/*.test.ts` — 7 files, roughly 65 test cases covering JSON-LD override validation, rich-result linting, template builders, breadcrumb-trail construction, core JSON-LD entity builders, and graph-composition logic — never execute in CI. `apps/web/vitest.config.ts:11`'s `include` is scoped to `src/**/*.test.ts` relative to `apps/web` and cannot reach `packages/schema/src/**`; `web.yml:79-83` and `ci.yml:95-96` each run only their own package's test script; `grep -rn "schema" .github/workflows/*.yml` returns no hits at all.
- **CleanStart:** Fail

---

### GOV-03 — Gating a merge on a Lighthouse (or any) score threshold, and choosing the score, is a team's own policy decision

- **Severity:** P1
- **Applies:** Sites running Lighthouse CI in their pipeline
- **Rule:** Treat the decision of *whether* to make a Lighthouse category threshold a required, merge-blocking check — and *what* score to require — as a team policy call informed by, but not dictated by, the tool's defaults. Do not cite Lighthouse's own documentation as the authority for a specific gating decision it never makes.
- **Why:** Lighthouse's documentation specifies how to configure an assertion and what its presets default to; it does not state that a team must gate merges on any particular category or score, at what level, or at all. This module's own evidence base originally cited Lighthouse's docs as a single, undifferentiated Tier 2 source for a combined claim — "gate every PR on this threshold" plus "here is the assert syntax" — that conflates a vendor-documented mechanism (see GOV-11) with an ungrounded policy prescription.
- **Acceptance:** The chosen threshold and its gating status (blocking vs. advisory) are recorded as an explicit team decision — in this module, an ADR, or an equivalent artifact — not presented or treated as a vendor requirement.
- **Verify:** `grep -c '"error"' apps/web/.lighthouserc.json`
- **Reference:** `apps/web/.lighthouserc.json`
- **Source:** Convention — not vendor-confirmed. This corrects an overstatement in `docs/seo/evidence/sources/governance.md`'s own summary table (§8), which listed a single Tier 2 tag for a rule combining genuinely vendor-documented tool mechanics (Tier 2 per GOV-11's own source) with a gating-policy claim no vendor page states. Every other mixed rule in that same source file (canonical, sitemap parity, robots-per-environment, preventing preview indexing) correctly separates its vendor-backed mechanical component from its Convention-labeled policy component; this was the one row that didn't, despite identical structure.
- **Tools:** Not applicable — this is a policy-authorship note, not a tool-scored property.
- **Anti-patterns:** Writing "Lighthouse requires gating at 0.9" in an internal runbook — Lighthouse documents how to configure a gate at 0.9; it does not say 0.9, or gating at all, is the correct choice for your product.
- **Evidence:** `apps/web/.lighthouserc.json` sets every category assertion, including `seo ≥ 1.0`, at `warn` severity, and no comment in the file records this as a deliberate, dated policy choice the way `apps/web/scripts/bundle-budget.mjs:146-149` documents its own equivalent gap (contrast with GOV-06). The decision this rule requires to be explicit is, for CleanStart today, simply absent.
- **CleanStart:** Fail

---

### GOV-04 — Every page emitting JSON-LD needs a CI test asserting syntactic validity and required-property presence

- **Severity:** P1
- **Applies:** Any page emitting JSON-LD structured data
- **Rule:** For every page template emitting `<script type="application/ld+json">`, run a CI test that extracts the payload from server-rendered HTML, asserts it parses as JSON, and asserts every property Google's documentation marks "required" for the emitted `@type` is present and non-empty.
- **Why:** A JSON syntax error inside a `dangerouslySetInnerHTML` script tag does not throw at runtime — the page "looks fine" to a human reviewing rendered HTML, and Google's crawler silently fails to parse the same broken payload, forfeiting rich-result eligibility with no visible signal anywhere in the build or the rendered page.
- **Acceptance:**
  - For every collection/template emitting JSON-LD, a CI-executed test asserts `JSON.parse` succeeds on the extracted payload
  - The same test asserts presence of every property Google's per-type reference lists as required for the emitted `@type`
- **Verify:** `pnpm --filter @cleanstart/schema test -- jsonld`
- **Reference:** `packages/schema/src/builders/jsonld.test.ts`, `packages/schema/src/validate/rich-result-lint.test.ts`
- **Source:** [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies — "Specify all required properties listed in the documentation for your specific rich result type. Items that are missing required properties are not eligible for rich results." Corrected per `verification-log.md` correction #29: this page names only the Rich Results Test as a recommended eligibility check; it does not mention a second tool called "Schema Markup Validator," a name that belongs to schema.org's own independent validator at `validator.schema.org` and should never be attributed to this Google page.
- **Tools:** The Rich Results Test is Google's own recommended eligibility spot-check (per-URL, not automatable at CI scale); `validator.schema.org` checks generic schema.org shape validity independent of Google-specific eligibility — the two are complementary tools from different maintainers, not "the two tools Google recommends" as an earlier draft of this module's evidence base incorrectly stated.
- **Anti-patterns:** Treating "no JS console error on page load" as proof the JSON-LD is valid — a parse failure inside `dangerouslySetInnerHTML` is silent at runtime for both a human reviewer and Googlebot alike.
- **Evidence:** `packages/schema/src/builders/jsonld.test.ts` and `packages/schema/src/validate/rich-result-lint.test.ts` exist and cover exactly this ground, but per GOV-02, neither file is reachable by any CI workflow — `grep -rn "schema" .github/workflows/*.yml` returns no hits. The test this rule requires already exists in this codebase; it simply never runs where it would matter.
- **CleanStart:** Fail

---

### GOV-05 — JSON-LD field values must be checked for equality against their CMS source fields, distinct from full truthfulness

- **Severity:** P1
- **Applies:** Any JSON-LD field whose value is meant to mirror a specific CMS/source-of-truth field (price, dates, author name, availability, and similar 1:1-mapped fields)
- **Rule:** Assert, in CI, that structured-data field values which claim to represent a specific CMS field are equal (after normalization) to that CMS field's current value. This is a plain equality check and is distinct from, and does not require, judging whether the content is truthful in the broader editorial sense.
- **Why:** Full semantic truthfulness — does this markup accurately represent what the page means — is a human judgment call no test can make, and this module's evidence base correctly says so. But a narrower defect is fully mechanical: a JSON-LD builder reading a stale, hardcoded, or wrongly-mapped field instead of the current CMS value. Filing "structured data truthfulness" as human-only-forever with no carve-out for this narrower case throws away a real, commonly-implemented CI check that catches an entire defect class — a CMS field rename the JSON-LD builder silently doesn't follow.
- **Acceptance:**
  - For each JSON-LD field mapped 1:1 from a CMS source field, a CI test asserts the built graph's value equals the source document's field value for a representative sample of real or fixture documents
  - This test does not attempt to judge whether the content itself is accurate or non-misleading — only that the copy is faithful to its stated source
- **Verify:** `pnpm --filter @cleanstart/schema test -- compose-graph`
- **Reference:** `packages/schema/src/compose/compose-graph.test.ts`
- **Source:** Convention — not vendor-confirmed for the specific CI-implementation pattern; this corrects `verification-log.md` correction #31, which found this exact carve-out missing from an earlier taxonomy draft's "structured data truthfulness = human-only-forever" claim. The reason full truthfulness stays human-only is grounded in [Tier 1] https://developers.google.com/search/docs/appearance/structured-data/sd-policies, which frames "misleading" markup as a content-quality judgment, not a schema-shape check — that framing is what makes the narrower equality check here a genuinely different, mechanical question.
- **Tools:** Not applicable — no SEO tool surveyed asserts CMS-to-schema field equality; this is necessarily a repo-specific test against a team's own source-of-truth fields.
- **Anti-patterns:** Treating "schema-to-source-field consistency passes" as proof the structured data is truthful — a field can be perfectly consistent with a CMS value that is itself wrong, stale, or misleading. This check only rules out the narrower defect of the builder diverging from its own source of truth.
- **Evidence:** A verifier read all 7 of `packages/schema`'s own test files and all 8 of `apps/web/src/lib/seo/*.test.ts` — every test file this codebase has that could plausibly contain this check. None asserts CMS-field-to-JSON-LD equality: every test compares the builder's output against a literal fixture string typed directly into the test itself (e.g. `expect(article?.headline).toBe("override")` in `compose-graph.test.ts`), never against a real CMS document's live field value. `compose-graph.test.ts` (its closest analogue, 9 cases including its own "INV-5" invariants) exercises graph-composition determinism and merge behavior against fixture input only — it is a real, useful test, but not the CMS-field-to-schema equality check this rule requires, and per GOV-02 it does not run in CI regardless.
- **CleanStart:** Fail

---

## P2 — meaningful improvement, non-urgent

### GOV-06 — A feature-flagged absolute-budget gate that ships default-off must document why, and for how long

- **Severity:** P2
- **Applies:** Any two-tier budget or threshold gate — an absolute ceiling plus a regression-vs-baseline check — where the absolute check is conditional on an environment flag
- **Rule:** If an absolute-budget check is implemented behind a flag (e.g., `STRICT_BUNDLE_BUDGET=1`) that no CI workflow currently sets, the code must document the flag's default state and a plan or target for enabling it — an unset flag that silently downgrades "hard ceiling" to "log a warning" is an acceptable, known gap only if it is written down as one.
- **Why:** A regression-vs-baseline check alone can never independently discover a pre-existing budget violation — it only prevents new regressions on top of whatever the current baseline already is. Both tiers are needed to actually enforce a stated absolute number; if the strict branch never activates, the "absolute budget" named in the file is descriptive documentation, not a gate, and a reader needs to be told that plainly rather than discover it by tracing the code.
- **Acceptance:**
  - If a two-tier budget check ships with the absolute tier default-off, the code states the reason and a plan or target date for enabling it — not merely an unowned, undated `TODO`
  - CI output makes clear, on every run, whether the absolute tier fired or was skipped
- **Verify:** `grep -n "STRICT_BUNDLE_BUDGET" apps/web/scripts/bundle-budget.mjs`
- **Reference:** `apps/web/scripts/bundle-budget.mjs:143-176`
- **Source:** Convention — not vendor-confirmed. No vendor documents "a feature-flagged gate must state a target date for full enforcement" as a named practice; it follows from the general principle that an unenforced check with no visible acknowledgment is indistinguishable, to a future reader, from a check nobody remembered to finish.
- **Tools:** Not applicable — no SEO/performance tool surveyed audits whether a repo's own custom budget script is fully wired.
- **Anti-patterns:** Deleting the warn-only log line once the team gets used to ignoring it, leaving no signal at all that the absolute budget is currently unenforced.
- **Evidence:** `bundle-budget.mjs:146-149` documents the gap explicitly and constructively: "Sprint 1 baseline is above the absolute budget. Until the dynamic-import and code-split work in Sprint 2-5 lands, the gate fires on REGRESSION... `STRICT_BUNDLE_BUDGET=1` flips to absolute enforcement; planned for Sprint 5." `grep` across `.github/workflows/*.yml` and `apps/web` confirms the flag is never set to `"1"` anywhere, so only the regression check can fail `web.yml`'s bundle-budget step today — exactly as the comment predicts, and exactly what the comment says will change. This is the one CI-permissiveness gap in this module's evidence that is documented as a deliberate, dated tradeoff rather than a silent one; contrast with GOV-03's Lighthouse gap, which has no equivalent comment anywhere.
- **CleanStart:** Pass

---

### GOV-07 — Redirect-map integrity belongs in a pre-deploy CI gate, not left to production 404s to reveal

- **Severity:** P2
- **Applies:** Sites maintaining a redirect map, whether framework-level, CMS-managed, or both
- **Rule:** Run a CI script that loads the complete redirect map as a directed graph and asserts every destination resolves to a live 2xx (after following any further redirect), no cycle exists, and no chain exceeds a small fixed hop count — before merge or promote, not only discoverable later via a live 404.
- **Why:** A broken or looping redirect is pure graph integrity: either the destination resolves or it doesn't, with no judgment call involved, making it exactly the class of property this module's taxonomy calls mechanically testable. Catching it only after a previously-ranking URL starts 404ing is strictly worse than catching it in CI, since by then the redirect that was meant to preserve that URL's indexed equity has already failed to do so.
- **Acceptance:**
  - A CI job loads the framework-level redirect config and any CMS-managed redirect collection as one combined graph
  - The job fails on any unresolved destination, any cycle, or any chain exceeding the team's chosen hop ceiling
- **Verify:** `grep -rln "redirect" .github/workflows/*.yml`
- **Reference:** `apps/web/next.config.ts:62-99`, `apps/cms/src/payload/collections/Redirects.ts`
- **Source:** Convention — not vendor-confirmed. No vendor documents "redirect-map graph validation" as a named CI practice; the underlying HTTP semantics (a redirect chain terminates at a non-3xx status) trace to general HTTP semantics, but the governance rule — validate this pre-deploy — is practitioner convention.
- **Tools:** Screaming Frog and Ahrefs both flag redirect chains/loops in a live crawl, but neither runs pre-deploy against a build artifact — they audit the already-live site, which is the post-deploy monitoring tier (GOV-08), not a merge gate.
- **Anti-patterns:** Relying solely on the daily broken-link job to catch a redirect regression — that catches it in production, up to 24 hours after it ships, not before.
- **Evidence:** No step in `.github/workflows/ci.yml` or `web.yml` performs redirect-graph validation. The only redirect-adjacent CI presence is unrelated (`payload generate:types` drift checking), and the `cms-e2e` Playwright suite that could plausibly cover this is disabled — `if: false` at `ci.yml:124,205,261`.
- **CleanStart:** Fail

---

### GOV-08 — Split CI checks by failure domain: pre-deploy gates a build artifact; post-deploy monitoring only alerts

- **Severity:** P2
- **Applies:** Always
- **Rule:** Split SEO CI checks into two tiers with different consequences. Pre-deploy checks run against a build artifact or preview deployment and can block merge/promote. Post-deploy monitoring covers properties only observable after an external system has actually processed the live URL — indexing status, rendered rich-result eligibility, ranking, CrUX field data — and must never block a deploy.
- **Why:** Indexing status, rendered rich-result eligibility, and ranking are only knowable after Google (or another engine) has crawled and processed the live URL, which Google's own documentation says can take months for a low-priority page. A pipeline that tries to block on that timeline is operationally unworkable, and faking the dependency — asserting an indexing verdict against an unpublished preview URL — produces false confidence rather than a real signal, since the relevant API only returns data for already-live, already-verified properties.
- **Acceptance:**
  - No pipeline step calls the Search Console URL Inspection API, the CrUX API, or a rank-tracking service as a blocking condition for merge or deploy
  - Any such external-dependency check that does exist runs as a scheduled job against already-live URLs and raises an alert, not a build failure
- **Verify:** `grep -rniE "search.?console|crux|url.?inspection" .github/workflows/*.yml`
- **Reference:** `apps/cms/src/payload/jobs/refresh-crux.ts`, `apps/cms/src/payload/jobs/refresh-content-insights.ts`
- **Source:** Convention — not vendor-confirmed. No vendor states this two-tier split explicitly as a named practice; it follows from combining Google's own "may take months" and "not a guarantee" statements, documented in this SOP's crawl and structured-data modules, with the practical constraint that a CI pipeline cannot block on an indeterminate external timeline.
- **Tools:** Not applicable — this is a pipeline-architecture rule, not a defect any SEO tool scores.
- **Anti-patterns:** A CI step calling the URL Inspection API against a not-yet-deployed preview URL expecting an indexing verdict — the API only returns data for the live, Search-Console-verified property, so this either silently no-ops or errors instead of providing the intended signal.
- **Evidence:** This split already holds for CleanStart as implemented: `refresh-crux.ts` (daily 06:45 UTC) and `refresh-content-insights.ts` (daily 06:30 UTC) are both registered as Payload cron `jobs.tasks`, gated by `PAYLOAD_AUTO_RUN`, and neither is invoked from any workflow file — `grep` across `.github/workflows/*.yml` for Search Console/CrUX/URL-inspection terms returns no hits. No external-dependency check currently blocks a merge or deploy.
- **CleanStart:** Pass

---

### GOV-09 — Re-run mechanically-testable invariants against the live site on a schedule, not only at deploy time

- **Severity:** P2
- **Applies:** Sites where SEO-relevant properties (titles, JSON-LD fields, redirects, sitemap membership) are editable by non-engineering staff through a CMS
- **Rule:** Re-run the mechanically-testable invariants — canonical presence, title uniqueness, sitemap-vs-route parity, redirect-map integrity, no broken internal links — on a recurring schedule against the live production site, because CMS-driven content can drift out of compliance with zero corresponding code deploy and therefore zero CI run to catch it.
- **Why:** Every invariant that depends on CMS-authored content can regress purely through content operations — an editor renaming a slug, leaving a title blank, unpublishing a document another page still links to — none of which triggers a deploy or a CI run. This project already has direct precedent for exactly this drift class: sitemap-vs-listing drift from a stale query cache, and slug-rename 404s, are both documented incidents in this codebase's own history, not hypothetical risks.
- **Acceptance:** A scheduled job re-runs sitemap-parity, redirect-integrity, and broken-internal-link checks against the live production site — not merely the build artifact — and raises an alert on any regression, on a cadence matching or tighter than the site's own content-publish frequency.
- **Verify:** `grep -n "cron" apps/cms/src/payload/jobs/check-broken-links.ts`
- **Reference:** `apps/cms/src/payload/jobs/check-broken-links.ts:25-28`
- **Source:** Convention — not vendor-confirmed for the general "monitor drift on a schedule" rule. The specific job-pattern precedent (`check-broken-links.ts` running daily) is this project's own prior engineering decision, cited as internal precedent, not a vendor source.
- **Tools:** Not applicable — this is a job-architecture rule, not a tool-scored defect.
- **Anti-patterns:** Assuming CI green at deploy time means the site stays compliant indefinitely — every invariant sourced from live CMS data has a shelf life bounded by the next content edit, not the next code deploy.
- **Evidence:** CleanStart already runs one job in this family — `checkBrokenLinksTask`, daily `30 4 * * *` UTC, gated by `PAYLOAD_AUTO_RUN` — but no equivalent scheduled job exists for sitemap-vs-route parity or redirect-map integrity; both remain deploy-time-only concerns, and per GOV-07, not reliably checked even then. The broken-link job is itself post-deploy-only with no pre-deploy equivalent — this rule's own named anti-pattern, currently true of CleanStart's actual setup.
- **CleanStart:** Partial

---

### GOV-10 — The publishing checklist's mechanically-checkable items must be hard CMS blocks, not advisory copy

- **Severity:** P2
- **Applies:** Any CMS collection where an editor can publish content missing SEO-required fields
- **Rule:** For SEO properties that depend on human judgment (title/description quality, structured-data truthfulness, whether a redirect is the right business decision), enforce the mechanically-checkable subset — a required field being present — as a hard validation in the CMS collection schema that blocks the publish action outright. The judgment-dependent subset still requires a human reviewer at the same gate; it is not what this rule is asking to be automated.
- **Why:** CI runs against code and build artifacts; it has no visibility into a specific unpublished document's title quality or whether its structured data still matches freshly-edited body content. The only enforcement point for content-level judgment is the authoring workflow itself, at the moment a human is looking at that specific content — but the presence-of-a-required-field piece of that same checklist is mechanically checkable and should not be left to the same honor system as the judgment calls sitting next to it.
- **Acceptance:**
  - The CMS publish action is blocked, not merely warned, when a required SEO field is absent
  - The judgment-dependent checklist items are presented at the same gate and reviewed by a human before publish
- **Verify:** `grep -rn "required: true" apps/cms/src/payload/collections/Blogs.ts`
- **Reference:** `apps/cms/src/payload/hooks/publish-gate.ts:49-148` (`runPublishChecks` — per-check `severity` assignment), `:162-176` (`publishGateHook` — only `'blocker'`-severity failures throw)
- **Source:** Convention — not vendor-confirmed in the sense that no vendor prescribes checklist-gating as an SEO practice, but this is this project's own documented, binding internal policy — referenced in this repo's `CLAUDE.md` as "the editor-facing safety gate" that must never be bypassed — rather than an unverified practitioner habit.
- **Tools:** Not applicable — this is a CMS-schema and editorial-process property, not a crawlable-site defect any SEO tool scores.
- **Anti-patterns:** Treating the publishing checklist as advisory copy an editor can skim past — if it can be bypassed, it isn't a gate, it's documentation, and documentation doesn't prevent regressions.
- **Evidence:** A verifier read `apps/cms/src/payload/hooks/publish-gate.ts` — the actual publish-time gate this rule is about — and its `runPublishChecks()` function tags each check with a `severity: 'blocker' | 'warn'`. Only two checks are `'blocker'` (`slug`, `jsonld-override`); the mechanically-checkable presence checks this rule specifically names — `seo-title` (`:59-74`) and `meta-description` (`:76-91`) — are both hardcoded `severity: 'warn'`, meaning `publishGateHook()` (`:162-176`) never throws a `ValidationError` for either, only for checks in `blockers = checks.filter((c) => c.severity === 'blocker' && !c.pass)`. An editor can publish a document with no `seo.title` and no `seo.description` set; the checklist banner will show a warning, but the publish action itself is not blocked. This is the exact defect this rule is written to catch — a mechanically-checkable field-presence item left as advisory copy rather than a hard schema-level or hook-level block.
- **CleanStart:** Fail

---

## P3 — hygiene, marginal or speculative gain

### GOV-11 — Lighthouse CI can be configured to fail a build on a category-score threshold

- **Severity:** P3
- **Applies:** Sites running Lighthouse CI (`lhci`) in their pipeline
- **Rule:** Configure `lighthouserc`'s `assert.assertions` block with `"categories:<id>": ["error", {"minScore": N}]` (or an equivalent preset) for any Lighthouse category the team wants to be a build-failing gate. The `error` level, not `warn`, is what causes `lhci assert`'s exit code to fail the CI step.
- **Why:** Lighthouse CI's assertion levels are `off`/`warn`/`error`; only `error` produces a non-zero exit code from `lhci assert`. A `warn`-level assertion prints a warning in the CI log and still exits 0 — functionally identical, from a merge-gating standpoint, to having no assertion for that category at all.
- **Acceptance:**
  - Every category the team intends to gate has an `error`-level, not `warn`-level, entry in `lighthouserc`'s `assert.assertions`
  - `lhci assert` run locally against a build that deliberately violates the threshold exits non-zero
- **Verify:** `grep -A1 '"categories:seo"' apps/web/.lighthouserc.json`
- **Reference:** `apps/web/.lighthouserc.json`
- **Source:** [Tier 2] https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md — assert-configuration syntax (`level | [level, options]`, `categories:<id>` keying) and assertion-level semantics (`off`/`warn`/`error`), documented on the same page. GoogleChrome/lighthouse-ci is the official Google-maintained tool.
- **Tools:** Lighthouse CI itself is the tool in question; no other tool surveyed in this SOP overlaps this specific assert-configuration mechanic.
- **Anti-patterns:** Reading a `"categories:seo": ["warn", {...}]` line and assuming the CI job "checks SEO" in the sense of blocking a bad score — it logs the score, nothing more. Whether that is the right call for this project is GOV-03's question, not this one.
- **Evidence:** `apps/web/.lighthouserc.json` uses valid, well-formed assert syntax throughout — the mechanics this rule describes are correctly implemented. Every assertion, including `categories:seo`, is simply configured at `warn` rather than `error`, which is a valid configuration choice under this rule's own terms; whether `warn` was the right choice, and whether that choice was ever made deliberately, is GOV-03's separate concern.
- **CleanStart:** Pass

---

### GOV-12 — Every CI gate, checklist requirement, and monitoring job needs one named, accountable owner

- **Severity:** P3
- **Applies:** Always
- **Rule:** Assign each governance layer to a distinct, named owner: engineering owns the mechanically-testable CI gates, the content/editorial team owns the publishing-checklist judgment calls, and a named individual or rotation owns drift-monitoring alerts with a stated triage SLA — distinct from whoever gets paged for infrastructure incidents.
- **Why:** A check with no owner decays. An assertion that starts failing gets silenced or worked around rather than fixed if nobody is accountable for the specific failure class it represents. This project's own background-jobs table already names a schedule and a file for every cron job but not an owner — the exact gap this rule closes.
- **Acceptance:** Each CI gate, each publishing-checklist requirement, and each drift-monitoring job has a named owning team or individual documented alongside it.
- **Verify:** `grep -c "Owner" CLAUDE.md`
- **Reference:** `CLAUDE.md` (`## Background jobs` table — has Job/Schedule/File columns, no Owner column)
- **Source:** Convention — not vendor-confirmed. No vendor documentation prescribes an ownership model for SEO governance; this is standard engineering-org practice applied to this domain, not an SEO-specific finding.
- **Tools:** Not applicable — an organizational property, not machine-testable; verification is a periodic ownership audit, not a CI assertion.
- **Anti-patterns:** A shared, no-owner alert channel as the entire monitoring-response mechanism — alerts accumulate unread, and the eventual "why has this been broken for three weeks" question has no answer, because no individual was ever accountable for the first one.
- **Evidence:** `CLAUDE.md`'s "Background jobs" table (12 cron tasks, including three of direct SEO relevance — broken-links scan, Meilisearch reindex, CrUX refresh) names a schedule and a file per job but no owner column; no other document reviewed in this pass names an individual or team accountable for any specific CI gate or monitoring job described in this module.
- **CleanStart:** Fail
