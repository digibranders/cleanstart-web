#!/usr/bin/env node
/**
 * Copy gate: no em-dashes or en-dashes in the copy visitors read.
 *
 * Run after `next build`. Scans every prerendered page in
 * `.next/server/app/**\/*.html` with <script>/<style> removed, and looks for
 * U+2014 / U+2013 in text nodes and in the attributes that carry copy
 * (content, alt, title, aria-label, aria-description, placeholder).
 *
 * Two classes of route, because the CMS still holds ~1,770 dashed strings:
 *
 *   enforced      code-owned pages. A dash here fails the build.
 *   report-only   CMS-backed routes (CMS_BACKED below). Counted and printed,
 *                 never fatal. Editors clean these up from
 *                 docs/web/CMS-DASH-REPORT.md. When a route is clean, delete
 *                 it from CMS_BACKED so it is enforced from then on.
 *
 * Source comments are not covered. This is a rule about what readers see.
 *
 * Usage:
 *   pnpm --filter @cleanstart/web build && pnpm --filter @cleanstart/web verify:copy
 *   VERIFY_COPY_JSON=out.json  also writes every finding (incl. report-only).
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const APP_DIR = join(process.cwd(), ".next", "server", "app");
const DASH = /[–—]/g;
const COPY_ATTRS = ["content", "alt", "title", "aria-label", "aria-description", "placeholder"];

/**
 * Route prefixes whose HTML includes CMS-authored text (titles, bodies, card
 * blurbs). Matched against the route path, with `/` meaning the home page only.
 */
const CMS_BACKED = [
  /^\/$/,
  /^\/(blogs?|knowledge-hub|careers|jobs?|news|events?|webinars?|case-studies|resources?|resource-center|guide|guides|authors?|podcasts?|legal|privacy-policy|email-signatures)(\/|$)/,
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function routeOf(file) {
  const rel = relative(APP_DIR, file).replace(/\.html$/, "").replace(/\\/g, "/");
  return rel === "index" ? "/" : `/${rel.replace(/\/index$/, "")}`;
}

function decodeNumericEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–");
}

/** Returns each distinct dashed string found in rendered copy, as a short snippet. */
export function findDashes(html) {
  const body = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");
  const hits = new Set();
  const snippet = (s, i) => s.slice(Math.max(0, i - 40), i + 41).replace(/\s+/g, " ").trim();

  // Text nodes: everything between tags.
  for (const m of body.matchAll(/>([^<]+)</g)) {
    const text = decodeNumericEntities(m[1]);
    for (const d of text.matchAll(DASH)) hits.add(`text: ${snippet(text, d.index)}`);
  }
  // Copy-bearing attributes.
  const attrRe = new RegExp(`\\b(${COPY_ATTRS.join("|")})=("([^"]*)"|'([^']*)')`, "gi");
  for (const m of body.matchAll(attrRe)) {
    const value = decodeNumericEntities(m[3] ?? m[4] ?? "");
    for (const d of value.matchAll(DASH)) hits.add(`${m[1].toLowerCase()}: ${snippet(value, d.index)}`);
  }
  return [...hits];
}

function main() {
  if (!existsSync(APP_DIR)) {
    console.error(`verify:copy: ${APP_DIR} not found. Run \`next build\` first.`);
    process.exit(2);
  }
  const files = walk(APP_DIR).sort();
  const enforced = [];
  const reportOnly = [];
  for (const file of files) {
    const route = routeOf(file);
    const hits = findDashes(readFileSync(file, "utf8"));
    if (hits.length === 0) continue;
    (CMS_BACKED.some((re) => re.test(route)) ? reportOnly : enforced).push({ route, hits });
  }

  if (process.env.VERIFY_COPY_JSON) {
    writeFileSync(process.env.VERIFY_COPY_JSON, JSON.stringify({ enforced, reportOnly }, null, 2));
  }

  const count = (list) => list.reduce((n, r) => n + r.hits.length, 0);
  console.log(`verify:copy scanned ${files.length} pages`);
  console.log(
    `  report-only (CMS-backed): ${count(reportOnly)} dashed strings on ${reportOnly.length} routes`,
  );
  if (enforced.length === 0) {
    console.log("  enforced (code-owned): 0 dashes. OK");
    return;
  }
  console.error(`\n  enforced (code-owned): ${count(enforced)} dashed strings on ${enforced.length} routes\n`);
  for (const { route, hits } of enforced) {
    console.error(`  ${route}`);
    for (const h of hits.slice(0, 5)) console.error(`    ${h}`);
    if (hits.length > 5) console.error(`    ...and ${hits.length - 5} more`);
  }
  console.error(
    "\nW-1: no em-dashes or en-dashes in rendered copy. Use a comma, colon, full stop or brackets; write ranges as \"5 to 10\".",
  );
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
