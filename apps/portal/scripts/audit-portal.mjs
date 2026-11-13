// Dependency audit for the portal only. `pnpm audit` covers the whole monorepo; this keeps the advisories whose
// dependency path starts at apps__portal, prints them, and exits 1 when any is high or critical (2 when the audit
// could not be read). Run from anywhere in the repo: pnpm --filter @cleanstart/portal audit:deps
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const BLOCKING = new Set(['high', 'critical']);
const ORDER = ['critical', 'high', 'moderate', 'low', 'info'];

// pnpm audit exits non-zero whenever it finds anything, so the exit code is not used; the JSON is.
const run = spawnSync('pnpm', ['audit', '--prod', '--json'], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
let report;
try {
  report = JSON.parse(run.stdout);
} catch {
  console.error('pnpm audit did not return JSON (offline or registry error):');
  console.error(run.stderr || run.stdout);
  process.exit(2);
}

const rows = new Map();
for (const advisory of Object.values(report.advisories ?? {})) {
  for (const finding of advisory.findings ?? []) {
    for (const dependencyPath of finding.paths ?? []) {
      if (!dependencyPath.startsWith('apps__portal>')) continue;
      const key = `${advisory.github_advisory_id}|${advisory.module_name}@${finding.version}`;
      rows.set(key, {
        severity: advisory.severity,
        id: advisory.github_advisory_id,
        module: `${advisory.module_name}@${finding.version}`,
        vulnerable: advisory.vulnerable_versions,
        patched: advisory.patched_versions,
        via: dependencyPath.replace('apps__portal>', ''),
      });
    }
  }
}

const list = [...rows.values()].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
for (const row of list) {
  console.info(`${row.severity.padEnd(9)} ${row.id}  ${row.module}  vulnerable ${row.vulnerable}  fixed in ${row.patched}  via ${row.via}`);
}
const blocking = list.filter((row) => BLOCKING.has(row.severity));
console.info(`\n${list.length} advisories for apps/portal, ${blocking.length} high or critical.`);
process.exit(blocking.length > 0 ? 1 : 0);
