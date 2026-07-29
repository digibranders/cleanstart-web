#!/usr/bin/env node
/**
 * Rule-schema linter for the SEO SOP modules in docs/seo/.
 *
 * Enforces the rule block format documented in docs/seo/00-index.md so that
 * "every rule is verifiable" is a mechanical property, not an aspiration.
 *
 * Usage: node scripts/seo-sop/lint-rules.mjs docs/seo
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3']);
const HARD_KEYS = ['Severity', 'Rule', 'Acceptance', 'Verify', 'Source'];
const VERDICT = /^(Pass|Partial|Fail|N\/A|Unverified — .+)$/;
const HEADING = /^([A-Z]+)-(\d{2}) — (.+)$/;

function parseFields(bodyLines) {
  const fields = {};
  let key = null;
  for (const line of bodyLines) {
    const m = /^- \*\*([A-Za-z-]+):\*\*\s*(.*)$/.exec(line);
    if (m) {
      key = m[1];
      fields[key] = m[2].trim();
      continue;
    }
    if (key && /^\s+\S/.test(line)) fields[key] = `${fields[key]} ${line.trim()}`.trim();
  }
  return fields;
}

export function parseRules(markdown, file) {
  const out = [];
  let current = null;
  let fenced = false;
  const flush = () => {
    if (current) out.push({ ...current, fields: parseFields(current.body) });
    current = null;
  };
  for (const line of markdown.split('\n')) {
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
  const errs = [];
  const where = `${rule.file}: ${rule.heading}`;
  if (!HEADING.test(rule.heading)) {
    errs.push(`${where}: heading must be "PREFIX-NN — Title"`);
    return errs;
  }
  const f = rule.fields;
  for (const k of HARD_KEYS) if (!f[k]) errs.push(`${where}: missing required field ${k}`);
  if (f.Severity && !SEVERITIES.has(f.Severity)) {
    errs.push(`${where}: severity must be one of P0, P1, P2, P3 — got "${f.Severity}"`);
  }
  if (
    f.Source &&
    !/\[Tier [12]\]/.test(f.Source) &&
    !/Convention — not vendor-confirmed/.test(f.Source)
  ) {
    errs.push(
      `${where}: Source must cite [Tier 1] or [Tier 2], or be labelled "Convention — not vendor-confirmed"`,
    );
  }
  if (f.CleanStart && !VERDICT.test(f.CleanStart)) {
    errs.push(
      `${where}: verdict must be Pass, Partial, Fail, N/A, or "Unverified — <reason>" — got "${f.CleanStart}"`,
    );
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
    else if (entry.name.endsWith('.md')) found.push(path);
  }
  return found;
}

async function main() {
  const root = process.argv[2] ?? 'docs/seo';
  const files = (await markdownFiles(root)).filter((f) => !f.includes('/evidence/'));
  const rules = [];
  for (const file of files) rules.push(...parseRules(await readFile(file, 'utf8'), file));

  const errs = [...rules.flatMap(lintRule), ...lintCorpus(rules)];
  if (errs.length) {
    for (const e of errs) console.error(`✗ ${e}`);
    console.error(`\n${errs.length} problem(s) across ${rules.length} rule(s)`);
    process.exit(1);
  }
  console.info(`✓ ${rules.length} rule(s) across ${files.length} file(s) — schema clean`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
