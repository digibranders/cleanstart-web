#!/usr/bin/env node
/**
 * Lint warn-count ratchet (v3 responsive-plan Sprint 1 Day 4 deliverable).
 *
 * Runs ESLint over src/**, tallies warnings by rule message, compares
 * against `tests/e2e/__baselines__/lint.json`. Fails when the total
 * warn-count exceeds the baseline OR when any per-rule bucket increases.
 *
 * Re-record after a remediation sprint shrinks the count:
 *   UPDATE_LINT_BASELINE=1 pnpm --filter @cleanstart/web lint:eslint:count
 *
 * Strict-mode flag STRICT_LINT_BASELINE=1 also fails on errors (Sprint 5
 * flip — by then there should be zero of either).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baselineDir = join(process.cwd(), "tests", "e2e", "__baselines__");
const baselinePath = join(baselineDir, "lint.json");
const updateBaseline = process.env.UPDATE_LINT_BASELINE === "1";

const proc = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["--no-install", "eslint", "src/**/*.{ts,tsx}", "--format", "json"],
  { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 },
);

const raw = proc.stdout ?? "";
const start = raw.indexOf("[");
const end = raw.lastIndexOf("]");
if (start < 0 || end < 0) {
  console.error("Could not locate ESLint JSON output. Raw:");
  console.error(raw.slice(0, 2000));
  console.error(proc.stderr?.slice(0, 2000));
  process.exit(1);
}
const results = JSON.parse(raw.slice(start, end + 1));

let warnCount = 0;
let errorCount = 0;
const byRule = {};
for (const r of results) {
  for (const m of r.messages ?? []) {
    if (m.severity === 1) {
      warnCount++;
      // Bucket by the first sentence after the "v3 Consistency Layer:" prefix
      // so the seven distinct rule messages stay distinct.
      const stripped = m.message.replace(/^v3 Consistency Layer:\s*/, "");
      const key = stripped.split(/[.!]/)[0]?.trim().slice(0, 90) || m.message.slice(0, 90);
      byRule[key] = (byRule[key] ?? 0) + 1;
    } else if (m.severity === 2) {
      errorCount++;
    }
  }
}

const summary = {
  measuredAt: new Date().toISOString().slice(0, 10),
  totals: { files: results.length, warnings: warnCount, errors: errorCount },
  byRule,
};

console.log(`ESLint: ${results.length} files | ${warnCount} warnings | ${errorCount} errors`);
console.log("By rule:");
for (const [k, v] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(4)} ${k}`);
}

if (updateBaseline) {
  mkdirSync(baselineDir, { recursive: true });
  writeFileSync(baselinePath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\nBaseline rewritten -> ${baselinePath.replace(process.cwd(), ".")}`);
  process.exit(0);
}

if (!existsSync(baselinePath)) {
  console.error("\n  No lint baseline committed. Re-record with:");
  console.error("    UPDATE_LINT_BASELINE=1 pnpm --filter @cleanstart/web lint:eslint:count");
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));
const strict = process.env.STRICT_LINT_BASELINE === "1";

let failed = false;
if (warnCount > baseline.totals.warnings) {
  console.error(`\n  X Lint warn-count regressed: ${warnCount} > baseline ${baseline.totals.warnings}`);
  failed = true;
}
for (const [k, v] of Object.entries(byRule)) {
  const prev = baseline.byRule?.[k] ?? 0;
  if (v > prev) {
    console.error(`  X rule "${k}" regressed: ${v} > baseline ${prev}`);
    failed = true;
  }
}
if (strict && errorCount > 0) {
  console.error(`  X strict-mode: ${errorCount} ESLint error(s) present`);
  failed = true;
}

if (failed) {
  console.error("\n  To accept the current count as the new baseline:");
  console.error("    UPDATE_LINT_BASELINE=1 pnpm --filter @cleanstart/web lint:eslint:count");
  process.exit(1);
}
console.log("\n  + No regression vs lint baseline");
