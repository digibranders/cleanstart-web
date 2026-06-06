// Merge the agent judgment layer into the factual manifest and generate the
// human-readable audit report. Reads image-audit.json + the per-group agent
// results + the md5 duplicate map; writes an enriched image-audit.json and
// docs/web/IMAGE-AUDIT.md. AUDIT ONLY — recommends, changes nothing.
//
// Usage: node scripts/build-image-audit-report.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(SCRIPT_DIR, "..");
const MANIFEST = join(WEB_ROOT, "image-audit.json");
const REPORT = join(WEB_ROOT, "../../docs/web/IMAGE-AUDIT.md");
const JUDGMENTS = "/tmp/img-audit/judgments.json";
const DUPES = "/tmp/img-audit/dupes.json";

// --- savings model (clearly-labelled estimates; delete savings are exact) ----
const WEBP_FACTOR = 0.6; // a straight PNG->WebP keeps ~60% of bytes (≈40% saving), conservative
const RESIZE_FALLBACK = 0.2; // resize+convert with no parseable target → assume 20% of bytes

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const judgments = JSON.parse(readFileSync(JUDGMENTS, "utf8"));
const dupeGroups = JSON.parse(readFileSync(DUPES, "utf8"));

const kb = (b) => Math.round(b / 1024);
const mb = (b) => +(b / 1024 / 1024).toFixed(1);
const folderOf = (p) => (p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "(public root)");

// --- merge judgment + compute finalStatus / estimated size --------------------
function estSize(a, j) {
  if (!j) return a.status === "orphan" ? 0 : a.bytes; // unjudged orphan → deleted
  const act = j.recommendedAction;
  if (act === "delete") return 0;
  if (a.svg || a.format === "svg") return a.bytes; // svg never shrinks (rename only)
  if (act === "resize+convert") {
    const m = (j.resizeHint || "").match(/(\d{2,4})\s*px/);
    if (m && a.width && a.height) {
      const ratio = Math.min(1, +m[1] / Math.max(a.width, a.height));
      return Math.max(2048, Math.round(a.bytes * ratio * ratio * WEBP_FACTOR));
    }
    return Math.round(a.bytes * RESIZE_FALLBACK);
  }
  if (act === "convert" || act === "rename+convert") return Math.round(a.bytes * WEBP_FACTOR);
  return a.bytes; // keep / rename / fix-ext / fix-alt / to-next-image
}

for (const a of manifest.assets) {
  const j = judgments[a.path] || null;
  a.judgment = j;
  a.finalStatus = a.excluded ? "excluded" : j ? j.confirmedStatus : a.status;
  a.action = a.excluded ? "exclude" : j ? j.recommendedAction : a.finalStatus === "orphan" ? "delete" : "keep";
  a.estBytes = estSize(a, j);
}

const A = manifest.assets;
const lookup = Object.fromEntries(A.map((a) => [a.path, a]));

// --- buckets ------------------------------------------------------------------
const isDelete = (a) => a.action === "delete" || a.empty || a.finalStatus === "orphan";
const dele = A.filter(isDelete);
const convert = A.filter((a) => !isDelete(a) && (a.action === "convert" || a.action === "rename+convert"));
const resize = A.filter((a) => !isDelete(a) && a.action === "resize+convert");
const renames = A.filter((a) => !isDelete(a) && a.judgment?.proposedName);
const fixExt = A.filter((a) => !isDelete(a) && (a.action === "fix-ext" || (a.actualFormat === "svg" && a.format !== "svg")));
const altFix = A.filter((a) => !isDelete(a) && /needs-alt/.test(a.judgment?.altStatus || ""));
const toNext = A.filter((a) => !isDelete(a) && a.action === "to-next-image");
const excluded = A.filter((a) => a.finalStatus === "excluded");
const keptSvg = A.filter((a) => !isDelete(a) && !a.excluded && (a.format === "svg") && a.action === "keep");

// reclassified: agent flipped a script-"used*/dynamic" asset to orphan
const reclassed = A.filter((a) => a.judgment && a.judgment.confirmedStatus === "orphan" && a.status !== "orphan");

// --- duplicate consolidation (≥2 copies still USED after audit) ---------------
const dupeConsolidation = [];
let dupeSavings = 0;
for (const g of dupeGroups) {
  const paths = g.files.map((f) => f.split(":").slice(1).join(":"));
  const used = paths.filter((p) => lookup[p] && lookup[p].finalStatus === "used");
  if (used.length >= 2) {
    const bytes = lookup[used[0]].bytes;
    const extra = (used.length - 1) * bytes;
    dupeSavings += extra;
    dupeConsolidation.push({ kb: kb(bytes), copies: used, extraKb: kb(extra) });
  }
}
dupeConsolidation.sort((a, b) => b.extraKb - a.extraKb);

// --- totals -------------------------------------------------------------------
const totalNow = A.reduce((s, a) => s + a.bytes, 0);
const totalEst = A.reduce((s, a) => s + a.estBytes, 0);
const deleteBytes = dele.reduce((s, a) => s + a.bytes, 0);
const convNowBytes = [...convert, ...resize].reduce((s, a) => s + a.bytes, 0);
const convEstBytes = [...convert, ...resize].reduce((s, a) => s + a.estBytes, 0);

manifest.summary.final = {
  delete: { count: dele.length, mb: mb(deleteBytes) },
  convert: { count: convert.length },
  resizeConvert: { count: resize.length },
  rename: { count: renames.length },
  fixExt: { count: fixExt.length },
  altFix: { count: altFix.length },
  excluded: { count: excluded.length },
  duplicateGroupsUsed: { count: dupeConsolidation.length, extraMb: mb(dupeSavings) },
  totalNowMb: mb(totalNow),
  estAfterMb: mb(totalEst),
};
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

// ============================ REPORT ==========================================
const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
const L = [];
const p = (s = "") => L.push(s);

p("# Image Audit — `apps/web`");
p("");
p(`> **Status: AUDIT ONLY — nothing has been deleted, converted, or renamed.** This report is the`);
p("> reviewable worklist. Execution happens in gated phases *after* you approve it. Machine-readable");
p("> manifest with every per-asset decision: [`apps/web/image-audit.json`](../../apps/web/image-audit.json).");
p(">");
p("> Regenerate: `node apps/web/scripts/audit-images.mjs` then `node apps/web/scripts/build-image-audit-report.mjs`.");
p(`> Spec: [\`docs/superpowers/specs/2026-06-06-image-audit-cleanup-design.md\`](../superpowers/specs/2026-06-06-image-audit-cleanup-design.md). Generated for the \`development\` branch.`);
p("");

p("## Executive summary");
p("");
p("**Current state — `apps/web/public`:**");
p("");
p("| Format | Files | Size |");
p("|---|--:|--:|");
const fmtRows = {};
for (const a of A) {
  const f = a.format.toUpperCase();
  (fmtRows[f] ??= { n: 0, b: 0 });
  fmtRows[f].n++;
  fmtRows[f].b += a.bytes;
}
for (const [f, o] of Object.entries(fmtRows).sort((x, y) => y[1].b - x[1].b)) p(`| ${f} | ${o.n} | ${mb(o.b)} MB |`);
p(`| **Total** | **${A.length}** | **${mb(totalNow)} MB** |`);
p("");
p("**Findings & recommended actions:**");
p("");
p("| Action | Files | Notes |");
p("|---|--:|---|");
p(`| 🗑 **Delete** (orphans + junk + empty) | ${dele.length} | reclaims **${mb(deleteBytes)} MB** (exact) |`);
p(`| 🔄 **Convert → WebP** (near-lossless, no resize) | ${convert.length} | icons/logos/photos at render size |`);
p(`| 📐 **Resize + convert → WebP** | ${resize.length} | oversized photos/gradients (huge wins) |`);
p(`| ✏️ **Rename** (generic/Figma-junk → descriptive) | ${renames.length} | references rewritten |`);
p(`| 🏷 **Fix extension** (\`.png\` that is really SVG) | ${fixExt.length} | rename to \`.svg\` |`);
p(`| ♿ **Add/fix alt text** | ${altFix.length} | informative images with empty alt |`);
p(`| 🧬 **Consolidate cross-page duplicates** | ${dupeConsolidation.length} groups | +**${mb(dupeSavings)} MB** if deduped |`);
p(`| ✅ **Keep as-is** | ${A.filter((a) => !isDelete(a) && a.action === "keep").length} | incl. ${keptSvg.length} used SVGs |`);
p(`| 🚫 **Excluded** (hero-tech-logos) | ${excluded.length} | untouched per rule |`);
p("");
p("**Projected weight:**");
p("");
p(`- **Delete (exact):** −${mb(deleteBytes)} MB → from ${mb(totalNow)} MB down to ${mb(totalNow - deleteBytes)} MB.`);
p(`- **Convert + resize (estimated):** the ${convert.length + resize.length} convert/resize candidates are **${mb(convNowBytes)} MB** today; estimated **~${mb(convEstBytes)} MB** after (saving ~${mb(convNowBytes - convEstBytes)} MB).`);
p(`- **Combined estimated end state: ~${mb(totalEst)} MB** (from ${mb(totalNow)} MB) — a **~${Math.round((1 - totalEst / totalNow) * 100)}% reduction**.`);
p(`- Plus up to **${mb(dupeSavings)} MB** more if cross-page exact duplicates are consolidated to shared assets.`);
p("");
p("> **Savings caveat:** *Delete* is measured exactly. *Convert/resize* figures are **conservative** estimates — real `sharp` WebP conversions came in well under them: `hero-cube` 3047 KB → **44 KB** (1%), `fits-icon-2` (3200px, near-lossless) 2128 KB → **184 KB** (9%), `ciso/hero-photo` 2392 KB → **49 KB** (2%), `Ball1` icon 13 KB → **5 KB** (38%). Real end-state is likely **smaller** than ~37 MB. Exact per-asset sizes are finalised in Phase 2.");
p("");
p("> **WebP tooling:** `sharp` 0.34.5 (libvips 8.17.3) installed globally & verified ✓ — Phase 2 can proceed. **Transparency rule upheld (verified):** sharp keeps real transparency (alpha min < 255 → preserved on hero-cube/fits-icon/platforms-3d) and only strips redundant *fully-opaque* alpha channels (Figma artifacts, e.g. ciso/hero-photo alpha min=255 → dropped with no visible change). No image with actual transparent pixels loses it.");
p("");

// per-page summary
p("## Per-page summary");
p("");
p("| Folder | Files | Keep | Delete | Convert | Resize | Rename | Alt | MB now | MB est |");
p("|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|");
const groups = {};
for (const a of A) {
  const seg = a.path.startsWith("images/") && a.path.split("/").length >= 3 ? a.path.split("/").slice(0, 2).join("/") : folderOf(a.path);
  const g = (groups[seg] ??= { n: 0, keep: 0, del: 0, conv: 0, rz: 0, rn: 0, alt: 0, now: 0, est: 0 });
  g.n++;
  g.now += a.bytes;
  g.est += a.estBytes;
  if (isDelete(a)) g.del++;
  else if (a.action === "resize+convert") g.rz++;
  else if (a.action === "convert" || a.action === "rename+convert") g.conv++;
  else g.keep++;
  if (a.judgment?.proposedName) g.rn++;
  if (/needs-alt/.test(a.judgment?.altStatus || "")) g.alt++;
}
for (const [g, o] of Object.entries(groups).sort((x, y) => y[1].now - x[1].now)) {
  if (o.now < 1024 * 30 && o.n < 3) continue; // fold tiny noise
  p(`| ${g} | ${o.n} | ${o.keep} | ${o.del} | ${o.conv} | ${o.rz} | ${o.rn} | ${o.alt} | ${mb(o.now)} | ${mb(o.est)} |`);
}
p("");

// Bucket: delete
p("## 🗑 Delete — orphans, junk & empty files");
p("");
p("Junk to remove outright:");
p("");
p("- `光斑 flare.svg`, `光斑 flare-1.svg` — stray untracked Figma exports at the **repo root** (792 KB each).");
p("- `.playwright-mcp/` — ~28 MB of Playwright console logs; add to `.gitignore`.");
const empties = A.filter((a) => a.empty);
for (const e of empties) p(`- \`${e.path}\` — **0-byte empty file**.`);
p("");
p(`**${dele.length} unreferenced image files → ${mb(deleteBytes)} MB.** Includes **${reclassed.length} basename-collision false-positives** the audit reclassified from \"used\" to orphan (a copy lives in another folder; nothing references *this* path).`);
p("");
const delByFolder = {};
for (const a of dele) (delByFolder[folderOf(a.path)] ??= []).push(a);
for (const [f, list] of Object.entries(delByFolder).sort((x, y) => y[1].reduce((s, a) => s + a.bytes, 0) - x[1].reduce((s, a) => s + a.bytes, 0))) {
  const sub = list.reduce((s, a) => s + a.bytes, 0);
  p(`<details><summary><b>${f}</b> — ${list.length} files, ${mb(sub)} MB</summary>`);
  p("");
  for (const a of list.sort((x, y) => y.bytes - x.bytes)) {
    const tag = a.empty ? " _(empty)_" : reclassed.includes(a) ? ` _(was ${a.status} — ${a.judgment?.note ? esc(a.judgment.note).slice(0, 60) : "basename collision"})_` : "";
    p(`- \`${a.basename}\` — ${kb(a.bytes)} KB${tag}`);
  }
  p("");
  p("</details>");
}
p("");

// Bucket: convert/resize
p("## 📐 Convert & resize candidates");
p("");
p("All conversions preserve alpha (WebP, never JPEG). Icons/logos convert near-lossless with **no downscaling**; only oversized photos/gradients are resized. `est` = estimated post size.");
p("");
p("| Path | Class | Fmt | KB now | WxH | alpha | Action | Target | Resize | est KB | Why |");
p("|---|---|---|--:|---|:-:|---|---|---|--:|---|");
for (const a of [...resize, ...convert].sort((x, y) => y.bytes - x.bytes)) {
  const j = a.judgment || {};
  p(`| ${a.path} | ${j.klass || "?"} | ${a.format} | ${kb(a.bytes)} | ${a.width}×${a.height} | ${a.hasAlpha ? "✓" : ""} | ${j.recommendedAction} | ${j.targetFormat || "webp"} | ${esc(j.resizeHint || "")} | ${kb(a.estBytes)} | ${esc(j.note || "").slice(0, 80)} |`);
}
p("");

// Bucket: duplicates
p("## 🧬 Cross-page duplicate consolidation");
p("");
p(`${dupeConsolidation.length} sets of **byte-identical** files are each still used on ≥2 pages. Keeping one canonical copy (e.g. under \`images/shared/\`) and repointing references reclaims **~${mb(dupeSavings)} MB** beyond orphan deletion. (Exact md5 dupes; orphan-only dupe sets are already counted under Delete.)`);
p("");
p("| KB each | Used copies | Extra KB if deduped |");
p("|--:|---|--:|");
for (const d of dupeConsolidation) p(`| ${d.kb} | ${d.copies.map((c) => `\`${c}\``).join("<br>")} | ${d.extraKb} |`);
p("");

// Bucket: rename
p("## ✏️ Rename map (generic / Figma-junk → descriptive)");
p("");
p("References are rewritten in the same change. Includes SVGs (rename allowed; never converted).");
p("");
p("| Current | → Proposed | Action | Note |");
p("|---|---|---|---|");
for (const a of renames.sort((x, y) => x.path.localeCompare(y.path))) {
  const j = a.judgment;
  p(`| \`${a.path}\` | \`${j.proposedName}\` | ${j.recommendedAction} | ${esc(j.note || "").slice(0, 70)} |`);
}
if (fixExt.length) {
  p("");
  p("**Extension fixes (`.png`/`.jpg` that are really SVG):**");
  p("");
  for (const a of fixExt) p(`- \`${a.path}\` → \`.svg\` ${isDelete(a) ? "_(but orphan — will be deleted instead)_" : "_(rename + update refs)_"}`);
}
p("");

// Bucket: alt
p("## ♿ Alt-text fixes");
p("");
if (altFix.length === 0) p("_None — every informative image already has good alt, and decorative images correctly use `alt=\"\"`._");
else {
  p("| Path | Render | Current alt | Suggested alt |");
  p("|---|---|---|---|");
  for (const a of altFix) {
    const j = a.judgment;
    p(`| \`${a.path}\` | ${j.renderMethod} | ${a.altRaw === "" ? "_(empty)_" : a.altRaw === null ? "_(none)_" : esc(a.altRaw)} | ${esc(j.suggestedAlt || "")} |`);
  }
}
p("");

// img -> next/image
if (toNext.length) {
  p("## 🖼 `<img>` → `next/image` candidates");
  p("");
  for (const a of toNext) p(`- \`${a.path}\` — ${esc(a.judgment?.note || "")}`);
  p("");
}

// Excluded / keep
p("## 🚫 Excluded & kept-as-is");
p("");
p(`- **\`images/hero-tech-logos/\` (${excluded.length} SVG tech logos)** — untouched entirely (your rule).`);
p(`- **${keptSvg.length} used SVGs** kept verbatim (never rasterized); renamed only if generic.`);
p("- **CMS admin logo** (embedded JSX) and **`docs/` images** — out of scope.");
p("");

// Notable corrections
const corrections = [];
for (const f of ["cleansight", "about", "for-developers", "attack-surface-reduction", "ciso", "partners-trusted", "sbom", "sca", "teams-factory", "fips", "resource-center", "cleanstart-platform", "vulnerability-remediation", "blogs", "community", "misc-1", "misc-2", "cleanstart-images"]) {
  try {
    const r = JSON.parse(readFileSync(`/tmp/img-audit/results/${f}.json`, "utf8"));
    for (const c of r.corrections || []) {
      let text;
      if (typeof c === "string") {
        text = c;
      } else {
        const path = c.path ? `\`${c.path}\` — ` : "";
        const flip = c.wasStatus && c.nowStatus ? `${c.wasStatus}→${c.nowStatus}: ` : c.was && c.shouldBe ? `${c.was}→${c.shouldBe}: ` : "";
        const detail = c.note || c.reason || c.detail || c.evidence || c.issue || JSON.stringify(c);
        text = `${path}${flip}${detail}`;
      }
      corrections.push(`- **${r.group}:** ${esc(text)}`);
    }
  } catch {
    /* ignore */
  }
}
if (corrections.length) {
  p("## 🔎 Auditor corrections & notable findings");
  p("");
  for (const c of corrections) p(c);
  p("");
}

p("## Methodology");
p("");
p("1. **Factual layer** — `scripts/audit-images.mjs` walks `public/`, measures size/format/dimensions/alpha (`sips` + SVG `viewBox` parse), cross-references usage against `src/` (exact path, import, and runtime-built `${…}` prefix detection), and content-sniffs mislabeled/empty files. Unit-tested matching logic in `scripts/audit-lib.test.mjs`.");
p("2. **Judgment layer** — 18 read-only sub-agents (one per page group) resolved `used-weak`/`dynamic-unsure`, classified each asset (icon/logo/photo/gradient/decorative), graded alt text, proposed descriptive names, and recommended actions against the conversion-safety rules.");
p("3. **Dedup** — md5 across all assets surfaced byte-identical duplicates.");
p("4. **Merge + report** — `scripts/build-image-audit-report.mjs` (this file).");
p("");

writeFileSync(REPORT, L.join("\n"));
console.log("Wrote", REPORT.replace(WEB_ROOT + "/", ""));
console.log("Wrote enriched", MANIFEST.replace(WEB_ROOT + "/", ""));
console.log(`delete ${dele.length} (${mb(deleteBytes)}MB) · convert ${convert.length} · resize ${resize.length} · rename ${renames.length} · fixExt ${fixExt.length} · alt ${altFix.length} · dupes ${dupeConsolidation.length} (+${mb(dupeSavings)}MB)`);
console.log(`weight ${mb(totalNow)}MB now → ~${mb(totalEst)}MB est (${Math.round((1 - totalEst / totalNow) * 100)}% reduction), excl ${excluded.length}`);
