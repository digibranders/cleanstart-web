# Image Audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a comprehensive, reviewable image audit (`docs/web/IMAGE-AUDIT.md` + `apps/web/image-audit.json` manifest) covering every raster asset under `apps/web/public` — usage, size, format, dimensions, alpha, render method, alt text, and a recommended action — without deleting/converting/renaming anything yet.

**Architecture:** A dependency-free Node ESM script (`apps/web/scripts/audit-images.mjs`, matching the existing `scripts/*.mjs` convention) gathers the *factual* layer (size/format/dims/alpha via `sips` for raster + SVG text-parse; usage via path/basename/dynamic-prefix matching against `apps/web/src`). It emits `image-audit.json`. Then parallel read-only subagents (one per page/folder group) read the referencing source to add the *judgment* layer (confirm orphan, render method, alt grade, icon-vs-photo class, proposed rename, recommended action). Results merge into the final Markdown report + enriched manifest.

**Tech Stack:** Node 24 (ESM), `sips` (macOS), vitest, Agent tool (read-only subagents).

**Conversion/scope rules come from** `docs/superpowers/specs/2026-06-06-image-audit-cleanup-design.md` — this round is **audit only**.

---

### Task 1: Pure matching helpers + unit test

**Files:**
- Create: `apps/web/scripts/audit-lib.mjs`
- Test: `apps/web/scripts/audit-lib.test.mjs`

Factor the load-bearing, fs-free logic so it can be tested (it decides what gets called an orphan → drives deletion).

- [ ] **Step 1: Write failing test** for three helpers:

```js
// audit-lib.test.mjs
import { describe, it, expect } from "vitest";
import { toPublicPath, classifyUsage, extractDynamicPrefixes } from "./audit-lib.mjs";

describe("toPublicPath", () => {
  it("maps a public-relative file path to its served URL", () => {
    expect(toPublicPath("images/about/founders-photo.png")).toBe("/images/about/founders-photo.png");
  });
});

describe("extractDynamicPrefixes", () => {
  it("captures the static prefix of a template-literal image path", () => {
    const src = "const s = `/images/logos/${name}.svg`;";
    expect(extractDynamicPrefixes(src)).toContain("/images/logos/");
  });
  it("captures concatenation-built paths", () => {
    const src = 'const s = "/images/flags/" + code + ".png";';
    expect(extractDynamicPrefixes(src)).toContain("/images/flags/");
  });
});

describe("classifyUsage", () => {
  const corpus = [
    'src={"/images/about/founders-photo.png"}',
    "background: url(/images/hero/grid.svg)",
  ].join("\n");
  it("flags a full-path hit as used", () => {
    expect(classifyUsage("/images/about/founders-photo.png", "founders-photo.png", corpus, []).status).toBe("used");
  });
  it("flags an unreferenced file as orphan", () => {
    expect(classifyUsage("/images/about/ghost.png", "ghost.png", corpus, []).status).toBe("orphan");
  });
  it("flags a dynamic-prefix match as dynamic-unsure, not orphan", () => {
    expect(classifyUsage("/images/flags/in.png", "in.png", corpus, ["/images/flags/"]).status).toBe("dynamic-unsure");
  });
  it("flags basename-only hits as used-weak", () => {
    const c = "const icon = 'founders-photo.png'";
    expect(classifyUsage("/images/about/founders-photo.png", "founders-photo.png", c, []).status).toBe("used-weak");
  });
});
```

- [ ] **Step 2: Run, verify it fails** — `pnpm --filter @cleanstart/web exec vitest run scripts/audit-lib.test.mjs` → FAIL (module not found).

- [ ] **Step 3: Implement `audit-lib.mjs`** with exactly these exports:

```js
// audit-lib.mjs
export function toPublicPath(relFromPublic) {
  return "/" + relFromPublic.split(/[\\/]/).join("/");
}

// Find the static prefix of any dynamically-built image path in a source string.
export function extractDynamicPrefixes(src) {
  const prefixes = new Set();
  const exts = "png|jpe?g|webp|gif|avif|svg|ico";
  // template literal: `/images/...${...}...`
  const tpl = /`(\/?[\w./-]*?)\$\{/g;
  let m;
  while ((m = tpl.exec(src))) {
    if (/\/?images?\//i.test(m[1]) || new RegExp(`\\.(${exts})`).test(src.slice(m.index, m.index + 200))) {
      if (m[1].includes("/")) prefixes.add(m[1].replace(/[^/]*$/, ""));
    }
  }
  // concatenation: "/images/.../" + x + ".png"
  const cat = /["'](\/?[\w./-]*\/)["']\s*\+/g;
  while ((m = cat.exec(src))) {
    if (/images?\//i.test(m[1])) prefixes.add(m[1]);
  }
  return [...prefixes];
}

// status: used | used-weak | dynamic-unsure | orphan
export function classifyUsage(publicPath, basename, corpus, dynamicPrefixes) {
  if (corpus.includes(publicPath)) return { status: "used", reason: "full-path" };
  for (const p of dynamicPrefixes) {
    if (publicPath.startsWith(p)) return { status: "dynamic-unsure", reason: `dynamic:${p}` };
  }
  if (new RegExp(`["'\`/(]${basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(corpus))
    return { status: "used-weak", reason: "basename-only" };
  return { status: "orphan", reason: "no-reference" };
}
```

- [ ] **Step 4: Run, verify pass** — same vitest command → PASS (6 tests).

- [ ] **Step 5: Commit** — `git add apps/web/scripts/audit-lib.mjs apps/web/scripts/audit-lib.test.mjs && git commit -m "test(web): add image-audit usage-matching helpers"`

---

### Task 2: The audit script — factual layer

**Files:**
- Create: `apps/web/scripts/audit-images.mjs`

- [ ] **Step 1: Implement** the script. Responsibilities, in order:
  1. **Enumerate** raster files under `public/` (png/jpg/jpeg/webp/gif/avif/ico) + SVG files (for the rename/usage pass only — SVGs are flagged `svg:true`, never measured for conversion). **Exclude** `public/images/hero-tech-logos/**`.
  2. **Measure** each raster via batched `sips -g pixelWidth -g pixelHeight -g hasAlpha -g format <files...>` (batches of 150; parse the indented blocks). For SVG, regex `width`/`height`/`viewBox` from the file text. Record byte size via `statSync`.
  3. **Build the src corpus:** read every `apps/web/src/**/*.{ts,tsx,js,jsx,mjs,css,mdx,json}` into one big string, plus `apps/web/next.config.*` and `apps/web/public/manifest*`/root metadata files. Collect `dynamicPrefixes` by running `extractDynamicPrefixes` over each file.
  4. **Classify** each asset with `classifyUsage`. For `used`/`used-weak`, also record the referencing files + line numbers (cheap grep over the per-file map) and a **best-effort render+alt snippet**: for each occurrence capture ±200 chars, regex out `alt\s*[:=]\s*["'{]([^"'}]*)` and detect `<Image`/`<img`/`background`/`url(` to guess render method.
  5. **Emit** `apps/web/image-audit.json`: `{ generatedAt, summary, assets: [{ path, publicPath, basename, svg, format, bytes, width, height, hasAlpha, status, reason, refs:[{file,line}], altRaw, renderGuess }] }`. (`generatedAt` is passed in via `process.argv`/env so the script stays deterministic.)
  6. **Print** a console summary: counts per status, total bytes, orphan bytes, png bytes.

- [ ] **Step 2: Run it** — `node apps/web/scripts/audit-images.mjs --out apps/web/image-audit.json`. Expected: prints summary (≈480 raster + ≈555 svg assets; orphan count + reclaimable MB). Eyeball that orphan count is in the ~hundreds range from earlier scan, and that `dynamic-unsure` is non-empty (flags folders like `contact/flags`, `hero-tech-logos` already excluded).

- [ ] **Step 3: Sanity-check the JSON** — spot-check 5 known-used heroes (e.g. `about/founders-photo.png`) show `status:"used"`, and the two root flare SVGs / a known-unused asset show `orphan`.

- [ ] **Step 4: Commit** — `git add apps/web/scripts/audit-images.mjs apps/web/image-audit.json && git commit -m "feat(web): add image-audit factual-layer script + manifest"`

---

### Task 3: Judgment layer — parallel per-folder subagents

No file changes — orchestration. For each folder group in the manifest with `used`/`used-weak`/`dynamic-unsure`/`orphan` assets (≈30 groups), dispatch a **read-only** subagent (Explore/general-purpose) with: the group's asset rows (path, status, refs, altRaw, renderGuess, dims, bytes, hasAlpha) and the spec's rules.

- [ ] **Step 1:** Each agent returns structured JSON per asset: `confirmedStatus` (used/orphan — resolve weak/unsure by actually reading the ref sites), `renderMethod` (next/image | img | css-bg | passed-prop | none), `altStatus` (good | generic | empty-ok | missing | n/a), `iconClass` (icon-or-logo | photo-or-gradient | ui-chrome), `proposedName`, `recommendedAction` (keep | delete | convert | resize+convert | rename | rename+convert), and a one-line `note`.
- [ ] **Step 2:** Merge agent results back into the manifest (`assets[i].judgment = {...}`). Reconcile conflicts (script says orphan, agent found a dynamic ref → flip to used).
- [ ] **Step 3:** Hold — no commit until report assembled in Task 4.

---

### Task 4: Assemble the report

**Files:**
- Create: `docs/web/IMAGE-AUDIT.md`
- Modify: `apps/web/image-audit.json` (enriched with judgment)

- [ ] **Step 1: Write `docs/web/IMAGE-AUDIT.md`** with:
  - **Summary:** total files/MB; counts + reclaimable MB per action (delete/convert/resize/rename); top-20 heaviest; projected post-cleanup size.
  - **Buckets:** (1) Confirmed orphans → delete; (2) `dynamic-unsure` → needs human eyes; (3) Convert/resize candidates (with current→target format & dims, alpha noted); (4) Rename map (`current → proposed`, grouped by page); (5) Alt-text issues (missing/generic, by page); (6) `<img>`-that-should-be-`next/image`; (7) Excluded (`hero-tech-logos`, SVG-as-is content, CMS/docs).
  - **Per-folder tables:** `current path → proposed name · used? · format · KB · WxH · alpha · render · alt · action`.
- [ ] **Step 2: Update** `docs/web/WEB-PAGES.md`? No — out of scope; leave it.
- [ ] **Step 3: Commit** — `git add docs/web/IMAGE-AUDIT.md apps/web/image-audit.json && git commit -m "docs(web): add comprehensive image audit report + manifest"`
- [ ] **Step 4: Present** the report summary to the user for review and approval of the execution phases. **Do not** start deletion/conversion/rename.

---

## Self-Review notes
- Spec coverage: facts (Task 2) ↔ §4a; judgment (Task 3) ↔ §4b; report+manifest (Task 4) ↔ §4c; exclusions (`hero-tech-logos`, SVG-no-convert) enforced in Task 2 step 1 + Task 3 rules ↔ §2/§3; transparency captured via `hasAlpha` ↔ §3.4.
- No deletion/conversion/rename in any task — audit only, matching the spec's "reviewable audit only".
- Helper names (`toPublicPath`, `classifyUsage`, `extractDynamicPrefixes`) are consistent between Task 1 definition and Task 2 usage.
