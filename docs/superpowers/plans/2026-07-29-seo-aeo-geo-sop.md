# SEO / AEO / GEO Documentation & SOP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a verified, reusable SEO/AEO/GEO SOP in `docs/seo/` — domain modules of individually-sourced rules, a lifecycle operator checklist, and a CleanStart conformance report with a ranked gap backlog.

**Architecture:** Rules live in domain modules and are referenced everywhere else by stable ID. Evidence is gathered before any rule is written, verified adversarially before any rule ships, and checked mechanically by a linter before any commit lands. Two small Node scripts do the mechanical work (rule-schema linting, live-site evidence capture); everything else is research and writing.

**Tech Stack:** Markdown; Node 22 ESM `.mjs` with the built-in `node --test` runner (no vitest config changes, no new dependencies); `curl` for header/HTTP checks; the environment's `seo-*` agent fleet for domain research.

**Spec:** `docs/superpowers/specs/2026-07-29-seo-aeo-geo-sop-design.md`

## Global Constraints

Every task's requirements implicitly include these.

- **No application code changes.** This workstream touches only `docs/` and `scripts/seo-sop/`. Gaps found in `apps/web` or `apps/cms` become backlog entries in module 91 — never edits.
- **Evidence before rules.** No rule may be authored in Phase 4 that lacks a Phase 1 evidence record and a Phase 2 source.
- **Source tiers.** Tier 1 = official spec/vendor docs (Google Search Central, Schema.org, IETF, W3C/WHATWG, Bing Webmaster, IndexNow spec, OpenAI/Anthropic/Perplexity/Google-Extended crawler docs, llmstxt.org, web.dev). Tier 2 = first-party platform docs (Next.js, Vercel, Payload). Tier 3 = dated, named empirical studies — supporting only. Tier 4 = practitioner consensus — labelled `Convention — not vendor-confirmed`, never authority.
- **Every rule needs ≥1 Tier 1 or Tier 2 source**, or the explicit `Convention — not vendor-confirmed` label.
- **Verdict vocabulary, exactly:** `Pass` · `Partial` · `Fail` · `N/A` · `Unverified — <reason>`.
- **Never fabricate a verdict or a metric.** Where verification fails, `Unverified — <reason>` is the correct output. This is the single most important constraint in the plan.
- **Precedence:** where CleanStart contradicts a primary source, the source defines the rule; CleanStart is recorded `Fail`/`Partial`.
- **Rule IDs are never reused.** Deprecated rules stay, marked `Superseded by <ID>`.
- **Every conditional module** (`C1`–`C5`) opens with the banner: `> **Not exercised by CleanStart — verified against primary documentation only.**`
- **Commit style:** `docs(seo): <description>` for docs, `chore(seo-sop): <description>` for tooling. Stage explicit paths only — never `git add -A` or `git add .`.
- **Branch:** `development`.
- **Repo lint conventions for `scripts/seo-sop/*.mjs`:** biome lints root `scripts/` and its `noConsole` rule allows only `console.error`, `console.warn`, `console.info` — use `console.info` for success output, never `console.log`. Before committing any `.mjs` file, run `npx biome format --write scripts/seo-sop/` and `npx biome lint scripts/seo-sop/`; both must be clean for the files this workstream adds.

---

## File Structure

**Tooling** — `scripts/seo-sop/`

| File | Responsibility |
| --- | --- |
| `lint-rules.mjs` | Parse rule blocks from module markdown; assert schema completeness, severity/verdict vocabulary, source tiering, ID uniqueness. Exports pure functions + a CLI. |
| `lint-rules.test.mjs` | `node --test` unit tests for the parser and each lint assertion. |
| `capture-live.mjs` | Fetch a URL matrix from production; record status, redirect chain, SEO-relevant headers, and extracted head signals to a compact JSON evidence file. Exports pure extractors + a CLI. |
| `capture-live.test.mjs` | `node --test` unit tests for the extractors against fixture HTML. |

**Documentation** — `docs/seo/`

| File | Responsibility |
| --- | --- |
| `00-index.md` | How to use, rule-ID scheme, severity model, evidence tiers, verdict vocabulary, glossary, review cadence, status of superseded prior docs |
| `01-crawl-and-index-control.md` … `11-semantics-accessibility-overlap.md` | Core rule modules, one domain each |
| `conditional/C1-international-hreflang.md` … `C5-news-publisher.md` | Conditional rule modules |
| `90-operator-checklist.md` | Lifecycle checklist — rule IDs and pass criteria only, no restated rule text |
| `91-cleanstart-conformance.md` | Verdict + evidence per rule ID; ranked, effort-estimated gap backlog |
| `evidence/url-matrix.json` | One production URL per page template, with template label |
| `evidence/live-capture.json` | Output of `capture-live.mjs` — the live-site evidence record |
| `evidence/codebase-inventory.md` | Per-domain findings from the codebase audit, with `file:line` |
| `evidence/field-data.md` | CrUX / GA4 / GSC results, with explicit `Unverified` where access failed |
| `evidence/sources/<domain>.md` | Tier-labelled primary-source citations per domain |
| `evidence/tool-scoring.md` | How Ahrefs/Semrush/Screaming Frog/Sitebulb/Lighthouse label and weight each issue class |
| `evidence/verification-log.md` | Adversarial verification verdicts for every rule candidate and every conformance verdict |

Raw captured HTML is written to the session scratchpad, not committed. `live-capture.json` is the committed, compact record.

---

## Rule Block Format

Authoring and linting both depend on this exact shape. Module 00 documents it; `lint-rules.mjs` enforces it.

```markdown
### CRAWL-04 — Canonical URLs are absolute and self-referencing

- **Severity:** P1
- **Applies:** Always
- **Rule:** Every indexable page emits exactly one `<link rel="canonical">` that is absolute, self-referencing, and byte-identical to the URL published in the XML sitemap.
- **Why:** Google consolidates duplicate signals onto the canonical it selects; a relative, cross-referencing, or sitemap-mismatched canonical hands that selection to heuristics instead of declaring it.
- **Acceptance:**
  - Exactly one `link[rel=canonical]` element in the rendered HTML
  - Absolute, `https://`, production host
  - Byte-identical to the sitemap entry (trailing slash, case, query params)
- **Verify:** `curl -s https://www.cleanstart.com/ | grep -c 'rel="canonical"'` → `1`
- **Reference:** `apps/web/src/lib/seo/canonical.ts:41`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- **Tools:** Screaming Frog `Canonicalised`; Ahrefs `Canonical points to redirect`; Sitebulb `Multiple canonical tags` (Critical)
- **Anti-patterns:** Building the canonical from request headers — breaks behind a proxy or CDN and emits the origin host.
- **CleanStart:** Pass
```

Field rules enforced by the linter: heading must match `### PREFIX-NN — Title`; hard-required keys are `Severity`, `Rule`, `Acceptance`, `Verify`, `Source`; `Severity ∈ {P0,P1,P2,P3}`; `Source` must contain `[Tier 1]`, `[Tier 2]`, or `Convention — not vendor-confirmed`; `CleanStart` must match the verdict vocabulary; IDs unique corpus-wide.

---

## Task 1: Rule-schema linter

**Files:**
- Create: `scripts/seo-sop/lint-rules.mjs`
- Test: `scripts/seo-sop/lint-rules.test.mjs`

**Interfaces:**
- Produces: `parseRules(markdown, file)` → `Array<{heading, file, fields}>`; `lintRule(rule)` → `string[]`; `lintCorpus(rules)` → `string[]`. Every later task runs the CLI as its gate.

- [ ] **Step 1: Write the failing test**

Create `scripts/seo-sop/lint-rules.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parseRules, lintRule, lintCorpus } from "./lint-rules.mjs";

const VALID = `## Rules

### CRAWL-01 — Robots allows indexable paths

- **Severity:** P0
- **Applies:** Always
- **Rule:** Production robots.txt must not disallow any indexable path.
- **Why:** A disallowed path cannot be crawled, so its content never enters the index.
- **Acceptance:**
  - No Disallow rule matches an indexable URL
- **Verify:** \`curl -s https://example.com/robots.txt\`
- **Reference:** \`apps/web/src/lib/seo/robots.ts:12\`
- **Source:** [Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro
- **Tools:** Screaming Frog \`Blocked by robots.txt\`
- **Anti-patterns:** Shipping a staging robots.txt to production.
- **CleanStart:** Pass
`;

test("parseRules extracts one rule with its fields", () => {
  const rules = parseRules(VALID, "01-crawl.md");
  assert.equal(rules.length, 1);
  assert.equal(rules[0].heading, "CRAWL-01 — Robots allows indexable paths");
  assert.equal(rules[0].fields.Severity, "P0");
  assert.equal(rules[0].fields.CleanStart, "Pass");
});

test("parseRules folds continuation lines into the field", () => {
  const rules = parseRules(VALID, "01-crawl.md");
  assert.match(rules[0].fields.Acceptance, /No Disallow rule matches an indexable URL/);
});

test("lintRule accepts a well-formed rule", () => {
  assert.deepEqual(lintRule(parseRules(VALID, "f.md")[0]), []);
});

test("lintRule rejects a malformed heading", () => {
  const bad = parseRules(VALID.replace("CRAWL-01 — Robots", "Robots"), "f.md")[0];
  assert.match(lintRule(bad).join(), /heading must be/);
});

test("lintRule rejects a missing hard-required field", () => {
  const bad = parseRules(VALID.replace(/- \*\*Verify:\*\*.*\n/, ""), "f.md")[0];
  assert.match(lintRule(bad).join(), /missing required field Verify/);
});

test("lintRule rejects an invalid severity", () => {
  const bad = parseRules(VALID.replace("P0", "High"), "f.md")[0];
  assert.match(lintRule(bad).join(), /severity/i);
});

test("lintRule rejects an untiered source", () => {
  const bad = parseRules(VALID.replace("[Tier 1] ", ""), "f.md")[0];
  assert.match(lintRule(bad).join(), /Tier 1.*Tier 2.*Convention/);
});

test("lintRule accepts an explicit Convention label instead of a tier", () => {
  const ok = parseRules(
    VALID.replace("[Tier 1] https://developers.google.com/search/docs/crawling-indexing/robots/intro", "Convention — not vendor-confirmed"),
    "f.md",
  )[0];
  assert.deepEqual(lintRule(ok), []);
});

test("lintRule rejects an out-of-vocabulary verdict", () => {
  const bad = parseRules(VALID.replace("**CleanStart:** Pass", "**CleanStart:** Mostly fine"), "f.md")[0];
  assert.match(lintRule(bad).join(), /verdict/i);
});

test("lintRule accepts an Unverified verdict carrying a reason", () => {
  const ok = parseRules(VALID.replace("**CleanStart:** Pass", "**CleanStart:** Unverified — GSC access pending"), "f.md")[0];
  assert.deepEqual(lintRule(ok), []);
});

test("lintCorpus rejects a duplicate rule ID across files", () => {
  const rules = [...parseRules(VALID, "a.md"), ...parseRules(VALID, "b.md")];
  assert.match(lintCorpus(rules).join(), /duplicate rule ID CRAWL-01/);
});

test("parseRules ignores rule headings inside fenced code blocks", () => {
  // 00-index.md documents the rule format by example; the example must not lint as a real rule.
  const doc = ["## Format", "", "```markdown", VALID, "```", ""].join("\n");
  assert.deepEqual(parseRules(doc, "00-index.md"), []);
});

const RULE_LINE = "- **Rule:** Production robots.txt must not disallow any indexable path.";

test("an unindented continuation is flagged rather than silently dropped", () => {
  const doc = VALID.replace(
    RULE_LINE,
    "- **Rule:** Production robots.txt must not disallow any indexable path\nbecause a disallowed path is never crawled.",
  );
  const rule = parseRules(doc, "f.md")[0];
  assert.match(rule.parseErrors.join(), /unindented continuation line after "Rule"/);
  assert.match(lintRule(rule).join(), /unindented continuation line after "Rule"/);
});

test("an indented continuation is folded into the field", () => {
  const doc = VALID.replace(
    RULE_LINE,
    "- **Rule:** Production robots.txt must not disallow any indexable path\n  because a disallowed path is never crawled.",
  );
  const rule = parseRules(doc, "f.md")[0];
  assert.deepEqual(rule.parseErrors, []);
  assert.match(rule.fields.Rule, /path because a disallowed path is never crawled\./);
});

test("prose after a blank line is not mistaken for a truncated field", () => {
  const rule = parseRules(`${VALID}\nA closing note that belongs to no field.\n`, "f.md")[0];
  assert.deepEqual(rule.parseErrors, []);
});

test("parseRules exposes only heading, file, fields and parseErrors", () => {
  const rule = parseRules(VALID, "f.md")[0];
  assert.deepEqual(Object.keys(rule).sort(), ["fields", "file", "heading", "parseErrors"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test scripts/seo-sop/lint-rules.test.mjs
```

Expected: FAIL — `Cannot find module './lint-rules.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/seo-sop/lint-rules.mjs`:

```js
#!/usr/bin/env node
/**
 * Rule-schema linter for the SEO SOP modules in docs/seo/.
 *
 * Enforces the rule block format documented in docs/seo/00-index.md so that
 * "every rule is verifiable" is a mechanical property, not an aspiration.
 *
 * Usage: node scripts/seo-sop/lint-rules.mjs docs/seo
 */
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const SEVERITIES = new Set(["P0", "P1", "P2", "P3"]);
const HARD_KEYS = ["Severity", "Rule", "Acceptance", "Verify", "Source"];
const VERDICT = /^(Pass|Partial|Fail|N\/A|Unverified — .+)$/;
const HEADING = /^([A-Z]+)-(\d{2}) — (.+)$/;

function parseFields(bodyLines) {
  const fields = {};
  const errors = [];
  let key = null;
  for (const line of bodyLines) {
    const m = /^- \*\*([A-Za-z-]+):\*\*\s*(.*)$/.exec(line);
    if (m) {
      key = m[1];
      fields[key] = m[2].trim();
      continue;
    }
    // A blank line closes the field; anything after it is prose, not a continuation.
    if (!line.trim()) {
      key = null;
      continue;
    }
    if (/^\s+\S/.test(line)) {
      if (key) fields[key] = `${fields[key]} ${line.trim()}`.trim();
      continue;
    }
    // Markdown would fold an unindented line into the preceding list item, but a
    // silently half-captured rule field defeats the entire point of this gate.
    if (key) {
      errors.push(
        `unindented continuation line after "${key}" — indent continuation lines by two spaces: "${line.trim()}"`,
      );
    }
  }
  return { fields, errors };
}

export function parseRules(markdown, file) {
  const out = [];
  let current = null;
  let fenced = false;
  const flush = () => {
    if (current) {
      const { fields, errors } = parseFields(current.body);
      out.push({ heading: current.heading, file: current.file, fields, parseErrors: errors });
    }
    current = null;
  };
  for (const line of markdown.split("\n")) {
    // 00-index.md documents the rule format by example inside a fence; those
    // headings are documentation, not rules.
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      if (current) current.body.push(line);
      continue;
    }
    if (fenced) {
      if (current) current.body.push(line);
      continue;
    }
    const h = /^### (.+)$/.exec(line);
    if (h) {
      flush();
      current = { heading: h[1].trim(), file, body: [] };
      continue;
    }
    if (/^#{1,2} /.test(line)) {
      flush();
      continue;
    }
    if (current) current.body.push(line);
  }
  flush();
  return out;
}

export function lintRule(rule) {
  const where = `${rule.file}: ${rule.heading}`;
  const errs = (rule.parseErrors ?? []).map((e) => `${where}: ${e}`);
  if (!HEADING.test(rule.heading)) {
    errs.push(`${where}: heading must be "PREFIX-NN — Title"`);
    return errs;
  }
  const f = rule.fields;
  for (const k of HARD_KEYS) if (!f[k]) errs.push(`${where}: missing required field ${k}`);
  if (f.Severity && !SEVERITIES.has(f.Severity)) {
    errs.push(`${where}: severity must be one of P0, P1, P2, P3 — got "${f.Severity}"`);
  }
  if (f.Source && !/\[Tier [12]\]/.test(f.Source) && !/Convention — not vendor-confirmed/.test(f.Source)) {
    errs.push(`${where}: Source must cite [Tier 1] or [Tier 2], or be labelled "Convention — not vendor-confirmed"`);
  }
  if (f.CleanStart && !VERDICT.test(f.CleanStart)) {
    errs.push(`${where}: verdict must be Pass, Partial, Fail, N/A, or "Unverified — <reason>" — got "${f.CleanStart}"`);
  }
  return errs;
}

export function lintCorpus(rules) {
  const errs = [];
  const seen = new Map();
  for (const rule of rules) {
    const m = HEADING.exec(rule.heading);
    if (!m) continue;
    const id = `${m[1]}-${m[2]}`;
    if (seen.has(id)) errs.push(`duplicate rule ID ${id} in ${seen.get(id)} and ${rule.file}`);
    else seen.set(id, rule.file);
  }
  return errs;
}

async function markdownFiles(dir) {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await markdownFiles(path)));
    else if (entry.name.endsWith(".md")) found.push(path);
  }
  return found;
}

async function main() {
  const root = process.argv[2] ?? "docs/seo";
  const files = (await markdownFiles(root)).filter((f) => !f.includes("/evidence/"));
  const rules = [];
  for (const file of files) rules.push(...parseRules(await readFile(file, "utf8"), file));

  const errs = [...rules.flatMap(lintRule), ...lintCorpus(rules)];
  if (errs.length) {
    for (const e of errs) console.error(`✗ ${e}`);
    console.error(`\n${errs.length} problem(s) across ${rules.length} rule(s)`);
    process.exit(1);
  }
  console.info(`✓ ${rules.length} rule(s) across ${files.length} file(s) — schema clean`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test scripts/seo-sop/lint-rules.test.mjs
```

Expected: PASS — 16 tests, 0 failures.

- [ ] **Step 5: Format and lint, then commit**

```bash
npx biome format --write scripts/seo-sop/ && npx biome lint scripts/seo-sop/
```

Expected: no errors and no warnings for these two files.

```bash
git add scripts/seo-sop/lint-rules.mjs scripts/seo-sop/lint-rules.test.mjs
git commit -m "chore(seo-sop): add rule-schema linter with tests"
```

---

## Task 2: Conventions document (`00-index.md`)

**Files:**
- Create: `docs/seo/00-index.md`

**Interfaces:**
- Consumes: nothing. Produces: the authoring contract every Phase 4 task follows.

- [ ] **Step 1: Write `docs/seo/00-index.md`**

It must contain, in this order, with no placeholders:

1. **Purpose and audience** — engineers and SEO leads building any website on this team.
2. **How to use** — new build → read module 00, run the pre-build section of `90-operator-checklist.md`; audit → run the full checklist; per-client → decide which `C*` modules apply.
3. **Rule-ID scheme** — prefix table exactly as in spec §5.2, including `SEM` for module 11; IDs never reused; deprecated rules retained as `Superseded by <ID>`.
4. **Rule block format** — reproduce the format block from this plan verbatim, as the authoring contract. State two authoring constraints explicitly:
   - **A field that wraps onto a second line must indent the continuation by two spaces.** An unindented continuation is a lint error, not a silent truncation — the linter rejects it by design.
   - **`Verify` must be a single-line inline code span**, never an indented fenced block. An indented fence inside a rule field folds into the field text as literal backticks. A check that genuinely needs multiple commands belongs in a named script under `scripts/seo-sop/`, referenced from `Verify` by path.
5. **Severity model** — the P0–P3 table from spec §5.4, plus the statement that severity derives from mechanism and blast radius, cross-checked against tool weighting, with disagreements stated explicitly.
6. **Evidence tiers** — the four-tier table from spec §5.5 and the ≥1 Tier 1/2 requirement.
7. **Verdict vocabulary** — `Pass` · `Partial` · `Fail` · `N/A` · `Unverified — <reason>`, with the explicit statement that fabricating a verdict is prohibited.
8. **Module map** — table of all core, conditional, and derived modules with one-line scope each.
9. **Review cadence** — modules 01–04 and 06–08 reviewed semi-annually; module 05 (AEO/GEO) reviewed quarterly because AI-search behaviour and crawler policy change fastest; module 09 reviewed when analytics tooling changes.
10. **Status of prior documents** — `docs/web/SEO-AUDIT-REPORT.md`, `docs/web/SEO-IMPLEMENTATION-PLAN.md`, `docs/web/CleanStart-SEO-AEO-AI-Readiness-Audit.html` marked **Historical — superseded for rules; retained for launch-phase task history.** State that surviving findings are re-verified into module 91.
11. **Glossary** — AEO, GEO, canonical, crawl budget, E-E-A-T, entity graph, field vs lab data, hreflang, INP, ISR, JSON-LD `@id`, LCP, llms.txt, rich result, soft-404, SERP feature.
12. **Tooling** — `node scripts/seo-sop/lint-rules.mjs docs/seo` is the schema gate; `node scripts/seo-sop/capture-live.mjs` refreshes live evidence.

- [ ] **Step 2: Run the linter against the new directory**

```bash
node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: `✓ 0 rule(s) across 1 file(s) — schema clean`. Module 00's example rule block **must** sit inside a fenced ```` ```markdown ```` block — the linter is fence-aware (Task 1) and skips it. A count other than `0` means the fence is missing or unbalanced.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/00-index.md
git commit -m "docs(seo): add SOP index, rule schema, severity model and evidence tiers"
```

---

## Task 3: Live-evidence capture script

**Files:**
- Create: `scripts/seo-sop/capture-live.mjs`
- Test: `scripts/seo-sop/capture-live.test.mjs`

**Interfaces:**
- Produces: `extractHead(html)` → `{title, description, canonical, canonicalCount, metaRobots, h1Count, jsonLdTypes, hreflangCount, ogTitle, ogImage}`; `summarizeHeaders(headers)` → `{xRobotsTag, cacheControl, contentType, link}`; CLI writing `docs/seo/evidence/live-capture.json`.

- [ ] **Step 1: Write the failing test**

Create `scripts/seo-sop/capture-live.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { extractHead, summarizeHeaders } from "./capture-live.mjs";

const HTML = `<!doctype html><html><head>
<title>Hardened Container Images | CleanStart</title>
<meta name="description" content="Near-zero CVE base images.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="https://www.cleanstart.com/cleanstart-images"/>
<link rel="alternate" hreflang="en" href="https://www.cleanstart.com/x"/>
<meta property="og:title" content="Hardened Container Images"/>
<meta property="og:image" content="https://www.cleanstart.com/api/og?t=x"/>
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"WebPage"},{"@type":"Organization"}]}</script>
</head><body><h1>Images</h1><h1>Second</h1></body></html>`;

test("extractHead pulls the title and description", () => {
  const h = extractHead(HTML);
  assert.equal(h.title, "Hardened Container Images | CleanStart");
  assert.equal(h.description, "Near-zero CVE base images.");
});

test("extractHead counts canonicals and returns the href", () => {
  const h = extractHead(HTML);
  assert.equal(h.canonicalCount, 1);
  assert.equal(h.canonical, "https://www.cleanstart.com/cleanstart-images");
});

test("extractHead reports the robots meta and hreflang count", () => {
  const h = extractHead(HTML);
  assert.equal(h.metaRobots, "index,follow,max-image-preview:large");
  assert.equal(h.hreflangCount, 1);
});

test("extractHead counts h1 elements so duplicates are detectable", () => {
  assert.equal(extractHead(HTML).h1Count, 2);
});

test("extractHead collects JSON-LD @type values including @graph members", () => {
  assert.deepEqual(extractHead(HTML).jsonLdTypes.sort(), ["Organization", "WebPage"]);
});

test("extractHead reports zero canonicals rather than throwing when absent", () => {
  const h = extractHead("<html><head><title>t</title></head><body></body></html>");
  assert.equal(h.canonicalCount, 0);
  assert.equal(h.canonical, null);
});

test("extractHead tolerates malformed JSON-LD without throwing", () => {
  const h = extractHead(`<script type="application/ld+json">{not json}</script>`);
  assert.deepEqual(h.jsonLdTypes, []);
  assert.equal(h.jsonLdParseErrors, 1);
});

test("an apostrophe in a double-quoted value does not truncate it", () => {
  const html = `<meta name="description" content="CleanStart's hardened images, near-zero CVEs.">`;
  assert.equal(extractHead(html).description, "CleanStart's hardened images, near-zero CVEs.");
});

test("single-quoted attribute values are still captured", () => {
  const html = `<meta property='og:title' content='Hardened Images'/>`;
  assert.equal(extractHead(html).ogTitle, "Hardened Images");
});

test("extractHead counts duplicate canonicals", () => {
  const html = `<link rel="canonical" href="https://a.example/x"/><link rel="canonical" href="https://a.example/y"/>`;
  const h = extractHead(html);
  assert.equal(h.canonicalCount, 2);
  assert.equal(h.canonical, "https://a.example/x");
});

test("extractHead collects array-valued JSON-LD @type", () => {
  const html = `<script type="application/ld+json">{"@type":["Article","NewsArticle"]}</script>`;
  assert.deepEqual(extractHead(html).jsonLdTypes.sort(), ["Article", "NewsArticle"]);
});

test("summarizeHeaders lifts the SEO-relevant headers", () => {
  const headers = new Headers({
    "x-robots-tag": "max-image-preview:large",
    "cache-control": "public, max-age=0, must-revalidate",
    "content-type": "text/html; charset=utf-8",
  });
  assert.deepEqual(summarizeHeaders(headers), {
    xRobotsTag: "max-image-preview:large",
    cacheControl: "public, max-age=0, must-revalidate",
    contentType: "text/html; charset=utf-8",
    link: null,
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test scripts/seo-sop/capture-live.test.mjs
```

Expected: FAIL — `Cannot find module './capture-live.mjs'`.

- [ ] **Step 3: Write the implementation**

Create `scripts/seo-sop/capture-live.mjs`:

```js
#!/usr/bin/env node
/**
 * Capture live-site SEO evidence for the SOP conformance report.
 *
 * Regex extraction is deliberate: this records what the server actually sent
 * on the wire, before any DOM normalisation. It is evidence capture, not a
 * spec-compliant parser.
 *
 * Usage: node scripts/seo-sop/capture-live.mjs docs/seo/evidence/url-matrix.json
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const UA = "Mozilla/5.0 (compatible; CleanStart-SEO-Audit/1.0)";

const TIMEOUT_MS = 15_000;

const attr = (html, re, group = 1) => {
  const m = re.exec(html);
  return m ? m[group].trim() : null;
};

export function extractHead(html) {
  const canonicals = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/gi) ?? [];
  const jsonLdTypes = new Set();
  let jsonLdParseErrors = 0;

  for (const block of html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? []) {
    const body = block.replace(/^[\s\S]*?>/, "").replace(/<\/script>$/i, "");
    try {
      // for...of rather than forEach: biome's noForEach rule governs root scripts/.
      const collect = (node) => {
        if (Array.isArray(node)) {
          for (const item of node) collect(item);
          return;
        }
        if (!node || typeof node !== "object") return;
        if (typeof node["@type"] === "string") jsonLdTypes.add(node["@type"]);
        if (Array.isArray(node["@type"])) {
          for (const t of node["@type"]) jsonLdTypes.add(t);
        }
        if (node["@graph"]) collect(node["@graph"]);
      };
      collect(JSON.parse(body));
    } catch {
      jsonLdParseErrors += 1;
    }
  }

  // Attribute values are captured with a quote backreference — (["'])(...)\1 — so a
  // double-quoted value containing an apostrophe ("CleanStart's images") is not
  // truncated at the apostrophe. The captured value is group 2.
  return {
    title: attr(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: attr(html, /<meta[^>]+name=["']description["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    metaRobots: attr(html, /<meta[^>]+name=["']robots["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    canonical: canonicals.length ? attr(canonicals[0], /href=(["'])([\s\S]*?)\1/i, 2) : null,
    canonicalCount: canonicals.length,
    hreflangCount: (html.match(/hreflang=["'][^"']+["']/gi) ?? []).length,
    h1Count: (html.match(/<h1[\s>]/gi) ?? []).length,
    ogTitle: attr(html, /<meta[^>]+property=["']og:title["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    ogImage: attr(html, /<meta[^>]+property=["']og:image["'][^>]+content=(["'])([\s\S]*?)\1/i, 2),
    jsonLdTypes: [...jsonLdTypes],
    jsonLdParseErrors,
  };
}

export function summarizeHeaders(headers) {
  return {
    xRobotsTag: headers.get("x-robots-tag"),
    cacheControl: headers.get("cache-control"),
    contentType: headers.get("content-type"),
    link: headers.get("link"),
  };
}

async function trace(url) {
  const chain = [];
  let current = url;
  for (let hop = 0; hop < 10; hop += 1) {
    const res = await fetch(current, {
      redirect: "manual",
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    chain.push({ url: current, status: res.status });
    const location = res.headers.get("location");
    if (!location) return { chain, final: res };
    current = new URL(location, current).toString();
  }
  return { chain, final: null };
}

async function main() {
  const matrixPath = process.argv[2] ?? "docs/seo/evidence/url-matrix.json";
  const outPath = process.argv[3] ?? "docs/seo/evidence/live-capture.json";
  const matrix = JSON.parse(await readFile(matrixPath, "utf8"));

  const pages = [];
  for (const { template, url } of matrix.urls) {
    let traced;
    try {
      traced = await trace(url);
    } catch (err) {
      // A timeout or transport failure is evidence too — record it and keep going,
      // rather than aborting a 50-URL capture run on one bad response.
      pages.push({ template, url, error: `fetch failed: ${err.message}` });
      continue;
    }
    const { chain, final } = traced;
    if (!final) {
      pages.push({ template, url, error: "redirect loop or >10 hops", chain });
      continue;
    }
    const html = final.headers.get("content-type")?.includes("text/html") ? await final.text() : "";
    pages.push({
      template,
      url,
      status: chain.at(-1).status,
      redirects: chain.length - 1,
      chain,
      headers: summarizeHeaders(final.headers),
      head: html ? extractHead(html) : null,
    });
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify({ capturedAt: new Date().toISOString(), pages }, null, 2)}\n`);
  console.info(`✓ captured ${pages.length} URL(s) → ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
node --test scripts/seo-sop/capture-live.test.mjs
```

Expected: PASS — 12 tests, 0 failures.

- [ ] **Step 5: Format and lint, then commit**

```bash
npx biome format --write scripts/seo-sop/ && npx biome lint scripts/seo-sop/
```

Expected: no errors and no warnings for these files.

```bash
git add scripts/seo-sop/capture-live.mjs scripts/seo-sop/capture-live.test.mjs
git commit -m "chore(seo-sop): add live-site SEO evidence capture with tests"
```

---

## Task 4: Build the URL matrix and capture live evidence

**Files:**
- Create: `docs/seo/evidence/url-matrix.json`, `docs/seo/evidence/live-capture.json`

**Interfaces:**
- Consumes: `capture-live.mjs` from Task 3. Produces: `live-capture.json`, cited by Phase 4 authoring and module 91.

- [ ] **Step 1: Enumerate every page template**

```bash
find apps/web/src/app -name 'page.tsx' | sed 's|apps/web/src/app||; s|/page.tsx||' | sort
```

Each distinct route shape is one template. For dynamic segments (`[slug]`), pick one real published URL from the live sitemap:

```bash
curl -s https://www.cleanstart.com/sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed 's|</\?loc>||g' | head -80
```

- [ ] **Step 2: Write `docs/seo/evidence/url-matrix.json`**

Shape — one entry per template, covering every static route plus one live example per dynamic route (`blogs/[slug]`, `guide/[slug]`, `case-studies/[slug]`, `news/[slug]`, `event/[slug]`, `knowledge-hub/[slug]`, `resource-center/[slug]`, `careers/[slug]`, `legal/[slug]`):

```json
{
  "host": "https://www.cleanstart.com",
  "urls": [
    { "template": "home", "url": "https://www.cleanstart.com/" },
    { "template": "listing:blogs", "url": "https://www.cleanstart.com/blogs" },
    { "template": "detail:blog", "url": "https://www.cleanstart.com/blogs/<real-published-slug>" }
  ]
}
```

Additionally include control URLs that test index-control behaviour: a known 404 path, `https://www.cleanstart.com/sitemap.xml`, `https://www.cleanstart.com/llms.txt`, and **every legacy redirect source documented in `docs/web/SEO-AUDIT-REPORT.md` §4** as its own `control:legacy-redirect:<slug>` row.

Capture the whole redirect map, not a sample. Whether those 301s are actually live is a P0-class question — indexed legacy URLs returning 404 lose their accumulated link equity — and a conclusion about it must rest on committed evidence, not on an ad-hoc spot check that a later reader cannot reproduce.

- [ ] **Step 3: Run the capture**

```bash
node scripts/seo-sop/capture-live.mjs docs/seo/evidence/url-matrix.json docs/seo/evidence/live-capture.json
```

Expected: `✓ captured N URL(s) → docs/seo/evidence/live-capture.json`.

- [ ] **Step 4: Resolve the pending metadata question**

```bash
node -e "const d=require('./docs/seo/evidence/live-capture.json');const m=new Map();for(const p of d.pages){if(!p.head)continue;m.set(p.head.title,[...(m.get(p.head.title)||[]),p.url])};for(const [t,u] of m) if(u.length>1) console.log('DUPLICATE TITLE:',JSON.stringify(t),u.join(' '))"
```

Record the actual result. This settles whether the 11 metadata-less listing pages emit duplicate titles in production or are covered some other way. Do not assert the finding before running this.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/evidence/url-matrix.json docs/seo/evidence/live-capture.json
git commit -m "docs(seo): capture live-site SEO evidence across the template matrix"
```

---

## Task 5: Codebase inventory (parallel agents)

**Files:**
- Create: `docs/seo/evidence/codebase-inventory.md`

**Interfaces:**
- Produces: per-domain findings with `file:line`, consumed by Phase 4 authoring and module 91.

- [ ] **Step 1: Dispatch one auditor per domain**

Dispatch these concurrently in a single message. Agent type `Explore` for breadth, `seo-technical` / `seo-schema` / `seo-geo` / `seo-performance` where the domain matches. Each gets this prompt, with `<DOMAIN>` and `<SCOPE>` filled in:

> You are auditing the CleanStart monorepo for **<DOMAIN>** SEO implementation. Scope: `<SCOPE>`.
>
> Report **only what the code actually does**, with `file:line` for every claim. Do not recommend, do not judge against best practice, do not speculate about intent — a later phase does the judging. If something is ambiguous or you could not determine it, say `UNDETERMINED` and state what you would need to resolve it.
>
> Return markdown with these sections: **Mechanisms** (what exists and where), **Configuration** (env vars, constants, thresholds, and where they are read), **Coverage** (which routes/templates it applies to and which it skips), **Tests** (what is test-covered and what is not), **Dead or unreachable code** (anything built but not consumed at runtime — state the evidence for non-consumption).

Domains and scopes:

| Domain | Scope |
| --- | --- |
| Crawl & index control | `apps/web/src/lib/seo/{robots,indexing,legacy-params}.ts`, `apps/web/src/app/robots.txt/`, middleware, `next.config.*` |
| URL architecture & sitemaps | `apps/web/src/app/sitemap.ts`, route tree under `apps/web/src/app`, redirect config, `apps/cms` redirects collection |
| On-page metadata | `apps/web/src/lib/seo/{compose-page,cms-seo,seo-defaults,canonical,og}.ts`, every `generateMetadata` in `apps/web/src/app`, `apps/web/src/app/api/og/` |
| Structured data | `packages/schema/**`, `apps/web/src/lib/seo/jsonld.tsx`, `apps/web/src/components/JsonLdGraph.tsx`, plus **whether `packages/schema` is imported by `apps/web` at all** |
| AEO / GEO | `apps/web/public/llms.txt`, robots.txt AI-crawler and Content-Signal directives, `.well-known/`, `link` response headers, any AI-crawler handling in middleware |
| Performance | `apps/web/next.config.*`, image/font config, `apps/web/scripts/bundle-budget.mjs`, `apps/cms/src/payload/jobs/refresh-crux.ts` |
| Rendering & delivery | Route segment configs (`dynamic`, `revalidate`, `dynamicParams`), `notFound()` usage, `apps/web/src/app/api/revalidate`, caching headers |
| Measurement & governance | GA4/GSC wiring in `apps/web/src/components/analytics/` and `apps/web/src/lib/analytics/`, `apps/cms` content-insights and IndexNow jobs, existing SEO tests under `apps/web/src/lib/seo/*.test.ts` |

- [ ] **Step 2: Assemble `docs/seo/evidence/codebase-inventory.md`**

One `##` section per domain containing the agent's report verbatim-in-substance. Add a top section **Contradictions to resolve** listing anything where two agents disagree or an agent returned `UNDETERMINED`.

- [ ] **Step 3: Resolve the schema-engine question explicitly**

```bash
grep -rn "@cleanstart/schema" apps/web/src apps/web/package.json || echo "NOT IMPORTED BY apps/web"
```

Record the literal output in the inventory. This settles the known contradiction from the spec.

- [ ] **Step 4: Commit**

```bash
git add docs/seo/evidence/codebase-inventory.md
git commit -m "docs(seo): record codebase SEO implementation inventory"
```

---

## Task 6: Field data (CrUX, GA4, GSC)

**Files:**
- Create: `docs/seo/evidence/field-data.md`

- [ ] **Step 1: Fetch CrUX for the top templates**

`CRUX_API_KEY` is in `apps/cms/.env`. Query the CrUX API for origin-level and URL-level LCP/INP/CLS p75 for the home page and the three highest-traffic templates. Record the JSON response summary.

- [ ] **Step 2: Attempt GA4**

Property `508401576`, credentials in `GOOGLE_APPLICATION_CREDENTIALS_JSON` in `apps/cms/.env`. Pull organic landing-page sessions for the last 28 days. **If it fails, record the exact error** and mark the section `Unverified — <error>`.

- [ ] **Step 3: Attempt GSC**

Spec §11 records GSC access grants as pending. Attempt the Search Console API for indexation coverage and top queries. **If it fails, record the exact error and mark the section `Unverified — GSC access pending`.** Do not substitute estimates.

- [ ] **Step 4: Write `docs/seo/evidence/field-data.md`**

One section per source. Each states: what was requested, what returned, the date of capture, and a `Verified` / `Unverified — <reason>` status line. No inferred or illustrative numbers anywhere in the file.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/evidence/field-data.md
git commit -m "docs(seo): record CrUX/GA4/GSC field-data evidence"
```

---

## Task 7: Primary-source research (parallel agents)

**Files:**
- Create: `docs/seo/evidence/sources/{crawl,architecture,metadata,schema,geo,performance,rendering,migrations,measurement,governance,semantics}.md`
- Create: `docs/seo/evidence/sources/conditional/{international,ecommerce,local,programmatic,news}.md`

- [ ] **Step 1: Dispatch one researcher per domain**

Concurrently, one agent per file above. Prompt template:

> Research **<DOMAIN>** SEO requirements from primary sources only. Use WebSearch and WebFetch. Target: the current documented behaviour as of 2026, not folklore.
>
> **Tier 1** = official spec/vendor docs: Google Search Central, Schema.org, IETF RFCs, W3C/WHATWG, Bing Webmaster, IndexNow spec, OpenAI/Anthropic/Perplexity/Google-Extended crawler docs, llmstxt.org, web.dev/Chrome. **Tier 2** = Next.js/Vercel/Payload docs. **Tier 3** = named, dated empirical studies. **Tier 4** = practitioner consensus.
>
> For each requirement return: the rule as an imperative sentence; the mechanism (how the system actually consumes the signal); an objectively testable acceptance criterion; a verification method that is a runnable command or an explicit procedure; the source URL with its tier; and known anti-patterns.
>
> Flag explicitly: anything **deprecated or changed in the last 24 months**, and anything widely repeated by SEO practitioners that the primary source does **not** actually support. Both are high-value.
>
> Return markdown. Do not invent URLs — if you cannot retrieve a source, say so.

- [ ] **Step 2: Verify every cited URL actually resolves**

```bash
grep -rhoE 'https?://[^ )]+' docs/seo/evidence/sources | sort -u | while read -r u; do printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' -A 'Mozilla/5.0' --max-time 15 "$u")" "$u"; done | grep -v '^200' || echo "all sources resolve"
```

Remove or replace any non-resolving citation. A hallucinated URL is the highest-severity failure mode in this project.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/evidence/sources
git commit -m "docs(seo): record tier-labelled primary-source research per domain"
```

---

## Task 8: Tool-scoring conventions

**Files:**
- Create: `docs/seo/evidence/tool-scoring.md`

- [ ] **Step 1: Research how the major tools label and weight each issue class**

Ahrefs Site Audit, Semrush Site Audit, Screaming Frog, Sitebulb, and Lighthouse/PageSpeed Insights. Source from each vendor's published issue documentation. **These are documentation-derived, not API-observed** — the Ahrefs/Semrush MCP servers require OAuth unavailable in this session. State that limitation at the top of the file.

- [ ] **Step 2: Build the mapping table**

Columns: issue class · Ahrefs label & severity · Semrush label & severity · Screaming Frog label · Sitebulb label & severity · Lighthouse audit ID. Add a **Disagreements** section for issue classes where the tools materially differ from each other, since those are where our own severity must be argued rather than inherited.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/evidence/tool-scoring.md
git commit -m "docs(seo): map issue classes to major-tool severity conventions"
```

---

## Task 9: Adversarial verification of rule candidates

**Files:**
- Create: `docs/seo/evidence/verification-log.md`

- [ ] **Step 1: Assemble the candidate rule list**

From `docs/seo/evidence/sources/`, produce a flat list of every candidate rule with its proposed severity and source. Number them `CAND-001`…

- [ ] **Step 2: Dispatch refutation agents**

**Batching.** Per-candidate fan-out (3 verifiers × ~150 rules ≈ 450 agents) is not affordable and approaches the hard agent cap. Instead: **one verifier per domain per lens** — 16 domains × 3 lenses ≈ 48 agents — each receiving that domain's full candidate list and returning a verdict per candidate. Escalate to dedicated per-rule verification only for (a) every P0 candidate, and (b) any candidate a batch verifier marks `contested`. This preserves independent multi-lens refutation while keeping the pass tractable.

Each verifier gets one lens over one domain's candidates. Prompt:

> Attempt to **refute** this proposed SEO rule. You are not asked to confirm it.
>
> Rule: `<statement>` · Proposed severity: `<severity>` · Cited source: `<url>` (`<tier>`)
>
> Lens: **<correctness | currency | overreach>**
> - *correctness* — does the cited source actually say this? Fetch it and check. Is the stated mechanism accurate?
> - *currency* — has this been deprecated, superseded, or changed? Is the source current as of 2026?
> - *overreach* — is the severity justified by evidence, or inflated? Is the rule stated more absolutely than the source supports?
>
> Default to `refuted: true` when uncertain. Return `{refuted, reason, correction}` where `correction` is the rule restated accurately if it is salvageable.

- [ ] **Step 3: Apply the majority verdict**

≥2 of 3 refuted → drop the rule, or adopt the `correction` and re-verify. Refuted on *overreach* only → keep the rule, lower the severity. Record every candidate's outcome in `verification-log.md` with all three verdicts, including the survivors — the log must show what was tested, not only what failed.

- [ ] **Step 4: Commit**

```bash
git add docs/seo/evidence/verification-log.md
git commit -m "docs(seo): record adversarial verification of rule candidates"
```

---

## Task 10: Adversarial verification of CleanStart verdicts

**Files:**
- Modify: `docs/seo/evidence/verification-log.md`

- [ ] **Step 1: Draft a verdict per surviving rule**

For each rule, propose `Pass` / `Partial` / `Fail` / `N/A` / `Unverified — <reason>` from `codebase-inventory.md`, `live-capture.json`, and `field-data.md`.

- [ ] **Step 2: Dispatch verdict verifiers**

> Attempt to refute this conformance verdict about the CleanStart website.
>
> Rule: `<statement>` · Proposed verdict: `<verdict>` · Cited evidence: `<file:line or live-capture entry>`
>
> Check the cited evidence yourself. Does it actually support the verdict? Is there contradicting evidence elsewhere in the repo or in `live-capture.json`? A `Pass` asserted from code alone, where live evidence exists and was not consulted, must be refuted. Return `{refuted, reason, correctedVerdict}`.

- [ ] **Step 3: Reconcile and record**

Any verdict where code and live evidence disagree becomes `Partial` with both facts stated — that divergence is itself a finding worth a backlog entry.

- [ ] **Step 4: Commit**

```bash
git add docs/seo/evidence/verification-log.md
git commit -m "docs(seo): record adversarial verification of CleanStart conformance verdicts"
```

---

## Task 11: Author core modules 01–04

**Files:**
- Create: `docs/seo/01-crawl-and-index-control.md`, `02-site-and-url-architecture.md`, `03-onpage-and-metadata.md`, `04-structured-data.md`

**Interfaces:**
- Consumes: verified rules from Task 9, verdicts from Task 10, sources from Task 7, tool mapping from Task 8.

- [ ] **Step 1: Write modules 01–04**

Each module: a `## Scope` paragraph, then `## Rules` containing rule blocks in the Task-1 format, ordered by severity descending. Every rule carries the `Reference` (`file:line` or `None — no reference implementation`) and the `CleanStart` verdict from Task 10.

Module 03 must additionally include a **`## Title and description formulas`** section — per template type (home, product, listing, article detail, resource detail, job posting, legal), the pattern, length budget in both characters and approximate pixels, uniqueness requirement, and worked examples drawn from the live capture. This is the agreed content boundary: formulas and templates, never per-page copy.

Module 04 must state the resolution of the schema-engine question from Task 5 Step 3 as an explicit finding.

- [ ] **Step 2: Run the linter**

```bash
node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: `✓ N rule(s) … schema clean`. Fix every reported problem before committing.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/01-crawl-and-index-control.md docs/seo/02-site-and-url-architecture.md docs/seo/03-onpage-and-metadata.md docs/seo/04-structured-data.md
git commit -m "docs(seo): add crawl, architecture, metadata and structured-data modules"
```

---

## Task 12: Author core modules 05–07

**Files:**
- Create: `docs/seo/05-aeo-geo.md`, `06-performance-core-web-vitals.md`, `07-rendering-and-delivery.md`

- [ ] **Step 1: Write modules 05–07**

Module 05 (`GEO-*`) must cover, each as its own rule: AI crawler access policy and the robots.txt directives that express it; Content Signals; `llms.txt` structure and its actual support status per primary sources — including honestly stating which AI vendors do and do not document consuming it; passage-level citability (answer-first structure, self-contained passages, factual density); entity and brand consistency across the `Organization` graph and `sameAs`; and how AI citation is measured. Where a practice is widely promoted but not vendor-confirmed, label it `Convention — not vendor-confirmed` rather than dropping or overstating it.

Module 06 must distinguish field from lab data explicitly and cite the CrUX results from Task 6.

Module 07 must cover the indexing consequences of ISR/`dynamicParams` — including the documented soft-404 behaviour recorded in the codebase inventory — and HTTP status-code semantics for crawlers.

- [ ] **Step 2: Run the linter**

```bash
node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: clean pass.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/05-aeo-geo.md docs/seo/06-performance-core-web-vitals.md docs/seo/07-rendering-and-delivery.md
git commit -m "docs(seo): add AEO/GEO, performance and rendering modules"
```

---

## Task 13: Author core modules 08–11

**Files:**
- Create: `docs/seo/08-migrations.md`, `09-measurement.md`, `10-governance-and-ci.md`, `11-semantics-accessibility-overlap.md`

- [ ] **Step 1: Write modules 08–11**

Module 08 (`MIG-*`) draws on the real CleanStart Webflow→Next migration recorded in the prior audit docs, re-verified against the live capture — redirect mapping, 301 vs 410, launch-day protocol, monitoring window, rollback.

Module 10 (`GOV-*`) specifies SEO-as-code: which rules are enforceable by automated test, which by CI gate, which only by human checklist. It must reference the existing `apps/web/src/lib/seo/*.test.ts` suite as the reference implementation and name specific rules that *should* be test-enforced but currently are not.

Module 11 (`SEM-*`) is deliberately narrow — semantic HTML and accessibility properties with a documented search or AI-extraction consequence. State the boundary explicitly so it does not drift into a general a11y document; point to the `accessibility` skill for that.

- [ ] **Step 2: Run the linter**

```bash
node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: clean pass.

- [ ] **Step 3: Commit**

```bash
git add docs/seo/08-migrations.md docs/seo/09-measurement.md docs/seo/10-governance-and-ci.md docs/seo/11-semantics-accessibility-overlap.md
git commit -m "docs(seo): add migrations, measurement, governance and semantics modules"
```

---

## Task 14: Author conditional modules C1–C5

**Files:**
- Create: `docs/seo/conditional/C1-international-hreflang.md`, `C2-ecommerce.md`, `C3-local.md`, `C4-programmatic-faceted.md`, `C5-news-publisher.md`

- [ ] **Step 1: Write each conditional module**

Each opens with the mandatory banner:

```markdown
> **Not exercised by CleanStart — verified against primary documentation only.**
```

Each starts with a `## When this module applies` section stating the trigger condition, so an engineer can decide in under a minute whether it is relevant to a given client. Every rule's `CleanStart` verdict is `N/A`, and every `Reference` is `None — no reference implementation`.

- [ ] **Step 2: Run the linter**

```bash
node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: clean pass.

- [ ] **Step 3: Verify every conditional module carries the banner**

```bash
for f in docs/seo/conditional/*.md; do grep -q 'Not exercised by CleanStart' "$f" || echo "MISSING BANNER: $f"; done; echo "banner check done"
```

- [ ] **Step 4: Commit**

```bash
git add docs/seo/conditional
git commit -m "docs(seo): add conditional modules for international, ecommerce, local, programmatic and news"
```

---

## Task 15: Operator checklist

**Files:**
- Create: `docs/seo/90-operator-checklist.md`

- [ ] **Step 1: Write the checklist**

Sections: **Pre-build** (decisions that are expensive to reverse — URL taxonomy, rendering strategy, CMS field model), **Build**, **Pre-launch**, **Launch day**, **Week 1**, **Monthly**, **Quarterly**.

Each line is exactly: rule ID · one-line pass criterion · the verification command. **No restated rule text** — the ID is the link to the canonical statement.

- [ ] **Step 2: Verify every referenced ID exists**

```bash
node -e "
const fs=require('fs'),path=require('path');
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())w(p);else if(e.name.endsWith('.md')&&!p.includes('/evidence/')&&!p.includes('90-'))files.push(p)}})('docs/seo');
const defined=new Set(files.flatMap(f=>[...fs.readFileSync(f,'utf8').matchAll(/^### ([A-Z]+-\d{2}) — /gm)].map(m=>m[1])));
const used=new Set([...fs.readFileSync('docs/seo/90-operator-checklist.md','utf8').matchAll(/\b([A-Z]+-\d{2})\b/g)].map(m=>m[1]));
const missing=[...used].filter(id=>!defined.has(id));
console.log(missing.length?'UNDEFINED IDS: '+missing.join(', '):'✓ all '+used.size+' referenced IDs are defined');
"
```

Expected: `✓ all N referenced IDs are defined`.

- [ ] **Step 3: Verify coverage in the other direction**

Same script, inverted — list defined IDs absent from the checklist. Every P0 and P1 rule must appear. P2/P3 omissions are acceptable and should be deliberate.

- [ ] **Step 4: Commit**

```bash
git add docs/seo/90-operator-checklist.md
git commit -m "docs(seo): add lifecycle operator checklist"
```

---

## Task 16: CleanStart conformance report and gap backlog

**Files:**
- Create: `docs/seo/91-cleanstart-conformance.md`

- [ ] **Step 1: Write the conformance table**

One row per rule: ID · rule title · severity · verdict · evidence (`file:line` or live-capture URL) · backlog rank if not `Pass`.

- [ ] **Step 2: Write the ranked gap backlog**

Every `Fail` and `Partial` becomes an entry: what is wrong, why it matters (from the rule's mechanism), the fix, effort estimate (S ≤2h / M ≤1d / L >1d), and the rule ID it closes. Sort by severity, then effort ascending — cheap P0s first.

- [ ] **Step 3: Write the summary**

Counts by verdict and severity; the three highest-impact gaps stated plainly; and an explicit **Unverified** section listing everything that could not be verified and what access would be needed to close it.

- [ ] **Step 4: Reconcile the prior audit docs**

Add a section mapping each still-open finding from `docs/web/SEO-AUDIT-REPORT.md` and `SEO-IMPLEMENTATION-PLAN.md` to either a rule ID in this SOP, or `Resolved — <evidence>`, or `Obsolete — <reason>`. Nothing from the prior docs may be silently dropped.

- [ ] **Step 5: Commit**

```bash
git add docs/seo/91-cleanstart-conformance.md
git commit -m "docs(seo): add CleanStart conformance report and ranked gap backlog"
```

---

## Task 17: Completeness critic and final gate

**Files:**
- Modify: any module with a gap found

- [ ] **Step 1: Run the full mechanical gate**

```bash
node --test scripts/seo-sop/*.test.mjs && node scripts/seo-sop/lint-rules.mjs docs/seo
```

Expected: all tooling tests pass, and the corpus lints clean.

- [ ] **Step 2: Dispatch the completeness critic**

> Review the SEO SOP in `docs/seo/` for what is **missing**, not what is present. Report:
> - Rules whose `Verify` command was never actually executed during the audit — cross-check against `docs/seo/evidence/`
> - Claims about CleanStart with no `file:line` or live-capture citation
> - Page templates in `docs/seo/evidence/url-matrix.json` that no rule's verdict references
> - Sources cited in `docs/seo/evidence/sources/` that no rule uses — either a missing rule or dead research
> - Any rule stated more absolutely than its cited source supports
> - Any domain in the module map with suspiciously few rules relative to its scope
>
> Return a concrete gap list. Do not summarise the documents.

- [ ] **Step 3: Close the gaps**

Loop back to the relevant authoring task for each gap. Re-run Step 1 after each fix.

- [ ] **Step 4: Verify the acceptance criteria from spec §9**

Walk all eight criteria explicitly and record the result of each in the final commit message body.

- [ ] **Step 5: Commit**

```bash
git add docs/seo
git commit -m "docs(seo): close completeness-critic gaps and verify acceptance criteria"
```

---

## Self-Review

**Spec coverage:** §5.1 spine → Tasks 2/15/16. §5.2 ID scheme → Task 2, enforced Task 1. §5.3 rule schema → Task 1 (mechanical) + Task 2 (documented). §5.4 severity → Task 2 + Task 8. §5.5 evidence tiers → Task 1 (enforced), 7 (produced), 9 (verified). §6 module set → Tasks 11–16. §7 pipeline phases 1–5 → Tasks 4–6, 7–8, 9–10, 11–14, 17. §8 deliverables → all file paths match. §9 acceptance criteria → Task 17 Step 4. §10 risks → adversarial verification (T9/T10), honest `Unverified` (T6), conditional banners (T14), URL-resolution check (T7).

**Placeholder scan:** no `TBD`/`TODO`/"handle edge cases"; every code step contains complete runnable code; every agent step contains the actual prompt text.

**Type consistency:** `parseRules(markdown, file)`, `lintRule(rule)`, `lintCorpus(rules)`, `extractHead(html)`, `summarizeHeaders(headers)` are used with identical signatures in tests, implementations, and CLI callers. `live-capture.json` shape (`{capturedAt, pages[{template,url,status,redirects,chain,headers,head}]}`) is consistent between Task 3's writer and the consumers in Tasks 4, 11, 16, 17.

**Gap found and fixed during review:** Task 15 originally verified only that referenced IDs exist; added Step 3 for the reverse direction, since a P0 rule silently absent from the checklist is the more dangerous failure.
