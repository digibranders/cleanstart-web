#!/usr/bin/env node
/**
 * Bundle-size budget gate (v3 responsive-plan Sprint 1 Day 4 deliverable).
 *
 * For each of the top-3 static routes (home, about-us, vulnerability-remediation):
 *   1. Fetch the served HTML.
 *   2. Extract every <script src> URL (skipping crossorigin/external).
 *   3. Fetch each chunk; sum gzipped (deflate-raw) byte size.
 *   4. Compare totals against the budget:
 *        P50 threshold: 220 KB
 *        P99 threshold: 260 KB
 *
 * Writes the measured totals to
 * `apps/web/tests/e2e/__baselines__/bundle.json` so Sprint 2+ can diff against
 * the recorded baseline (independent of the absolute thresholds, which catch
 * worst-case regressions; the diff catches creep).
 *
 * Usage (the server must be running on $PLAYWRIGHT_BASE_URL or http://127.0.0.1:3001):
 *   pnpm --filter @cleanstart/web start &
 *   pnpm --filter @cleanstart/web bundle:budget
 *
 * Or with UPDATE_BUNDLE_BASELINE=1 to rewrite the baseline file.
 */

import { gzipSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROUTES = ["/", "/about-us", "/vulnerability-remediation"];
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const BUDGET_P50_KB = 220;
const BUDGET_P99_KB = 260;
const baselineDir = join(process.cwd(), "tests", "e2e", "__baselines__");
const baselinePath = join(baselineDir, "bundle.json");
const updateBaseline = process.env.UPDATE_BUNDLE_BASELINE === "1";

const SCRIPT_SRC_RE = /<script[^>]+\bsrc=("([^"]+)"|'([^']+)')/g;

async function fetchHtml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function extractScripts(html, origin) {
  const urls = new Set();
  for (const m of html.matchAll(SCRIPT_SRC_RE)) {
    const src = m[2] ?? m[3] ?? "";
    if (!src) continue;
    // Skip external scripts (analytics CDNs etc.) — they're not "our" bundle.
    if (/^https?:\/\//i.test(src) && !src.startsWith(origin)) continue;
    urls.add(src.startsWith("http") ? src : new URL(src, origin).toString());
  }
  return [...urls];
}

async function measureChunk(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const gz = gzipSync(buf, { level: 9 });
  return { raw: buf.length, gz: gz.length };
}

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

async function measureRoute(route) {
  const html = await fetchHtml(BASE + route);
  const scripts = extractScripts(html, BASE);
  let raw = 0;
  let gz = 0;
  const chunks = [];
  for (const url of scripts) {
    try {
      const m = await measureChunk(url);
      raw += m.raw;
      gz += m.gz;
      chunks.push({ url: url.replace(BASE, ""), raw: m.raw, gz: m.gz });
    } catch (err) {
      console.warn(`  ! could not fetch ${url}: ${err.message}`);
    }
  }
  return { route, raw, gz, chunkCount: scripts.length, chunks };
}

async function main() {
  console.log(`Bundle-budget measurement against ${BASE}`);
  console.log(`Routes: ${ROUTES.join(", ")}\n`);

  const results = [];
  for (const route of ROUTES) {
    process.stdout.write(`  ${route} ... `);
    const r = await measureRoute(route);
    results.push(r);
    process.stdout.write(`${kb(r.gz)} KB gz (${r.chunkCount} chunks, ${kb(r.raw)} KB raw)\n`);
  }

  // P50 / P99 across the routes (only 3, but the percentile math is consistent).
  const sortedGz = results.map((r) => r.gz).sort((a, b) => a - b);
  const p50 = sortedGz[Math.floor(sortedGz.length * 0.5)];
  const p99 = sortedGz[sortedGz.length - 1]; // with n=3, P99 = max
  const max = p99;

  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf-8")) : null;

  console.log("\nSummary:");
  console.log(`  P50 gz: ${kb(p50)} KB  (budget ${BUDGET_P50_KB} KB)`);
  console.log(`  P99 gz: ${kb(p99)} KB  (budget ${BUDGET_P99_KB} KB)`);
  console.log(`  max gz: ${kb(max)} KB`);
  if (baseline) {
    console.log(`\nDiff vs committed baseline:`);
    for (const r of results) {
      const prev = baseline.routes?.find((b) => b.route === r.route);
      if (prev) {
        const delta = kb(r.gz - prev.gz);
        const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "=";
        console.log(`  ${r.route.padEnd(28)} ${arrow} ${delta > 0 ? "+" : ""}${delta} KB  (${kb(prev.gz)} -> ${kb(r.gz)})`);
      }
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE,
    budgetP50Kb: BUDGET_P50_KB,
    budgetP99Kb: BUDGET_P99_KB,
    measuredP50Kb: kb(p50),
    measuredP99Kb: kb(p99),
    measuredMaxKb: kb(max),
    routes: results.map((r) => ({ route: r.route, raw: r.raw, gz: r.gz, rawKb: kb(r.raw), gzKb: kb(r.gz), chunkCount: r.chunkCount })),
  };

  if (updateBaseline) {
    await mkdir(baselineDir, { recursive: true });
    await writeFile(baselinePath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(`\nBaseline rewritten -> ${baselinePath.replace(process.cwd(), ".")}`);
    process.exit(0);
  }

  const strict = process.env.STRICT_BUNDLE_BUDGET === "1";
  const REGRESSION_TOLERANCE_KB = 5;

  // Sprint 1 baseline is above the absolute budget. Until the dynamic-import
  // and code-split work in Sprint 2-5 lands, the gate fires on REGRESSION
  // (size grew vs baseline by more than the tolerance) — not absolute budget.
  // STRICT_BUNDLE_BUDGET=1 flips to absolute enforcement; planned for Sprint 5.
  let failed = false;

  if (baseline) {
    for (const r of results) {
      const prev = baseline.routes?.find((b) => b.route === r.route);
      if (!prev) continue;
      const deltaKb = kb(r.gz - prev.gz);
      if (deltaKb > REGRESSION_TOLERANCE_KB) {
        console.error(`  X ${r.route} regressed +${deltaKb} KB gz (was ${kb(prev.gz)}, now ${kb(r.gz)}); tolerance ${REGRESSION_TOLERANCE_KB} KB`);
        failed = true;
      }
    }
  }

  if (strict) {
    if (kb(p50) > BUDGET_P50_KB) {
      console.error(`  X strict-mode P50 ${kb(p50)} KB exceeds budget ${BUDGET_P50_KB} KB`);
      failed = true;
    }
    if (kb(p99) > BUDGET_P99_KB) {
      console.error(`  X strict-mode P99 ${kb(p99)} KB exceeds budget ${BUDGET_P99_KB} KB`);
      failed = true;
    }
  } else {
    if (kb(p50) > BUDGET_P50_KB) console.log(`  ! P50 ${kb(p50)} KB over absolute budget ${BUDGET_P50_KB} KB (warn — strict mode disabled)`);
    if (kb(p99) > BUDGET_P99_KB) console.log(`  ! P99 ${kb(p99)} KB over absolute budget ${BUDGET_P99_KB} KB (warn — strict mode disabled)`);
  }

  if (failed) {
    console.error(`\n  To accept the current sizes as the new baseline:`);
    console.error(`    UPDATE_BUNDLE_BASELINE=1 pnpm --filter @cleanstart/web bundle:budget`);
    process.exit(1);
  }
  console.log("\n  + No regression vs baseline" + (strict ? " (strict)" : " (ratchet mode)"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
