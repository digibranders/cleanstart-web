import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * M0.7 decision gate. Runs the S1 to S7 spike tests and prints one line per item and a verdict.
 * Exit 0: keep Better Auth. Exit 1: take the Auth.js v5 fallback (plan task M0.7-F).
 * Run: pnpm --filter @cleanstart/portal exec tsx scripts/auth-spike-gate.ts
 */
const SPIKE_FILE = 'src/server/auth/auth.spike.test.ts';
/** S6 only checks the OAuth configuration. Signing in with Google or Microsoft needs a dev OAuth app. */
const CONFIG_ONLY = 'S6';

interface Assertion {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
}
interface Report {
  testResults: Array<{ assertionResults: Assertion[]; message?: string }>;
}

const vitestEntry = join(dirname(createRequire(import.meta.url).resolve('vitest/package.json')), 'vitest.mjs');
const outputFile = join(tmpdir(), `auth-spike-${process.pid}.json`);
const run = spawnSync(
  process.execPath,
  [vitestEntry, 'run', SPIKE_FILE, '--reporter=json', `--outputFile=${outputFile}`],
  { stdio: ['ignore', 'ignore', 'inherit'], env: process.env },
);

let report: Report;
try {
  report = JSON.parse(readFileSync(outputFile, 'utf8')) as Report;
} catch {
  console.error(`DECISION: authjs-v5 (the spike did not run, exit code ${run.status ?? 'none'})`);
  process.exit(1);
}

const items = report.testResults.flatMap((file) => file.assertionResults);
let failed = items.length === 0;
for (const item of items) {
  const id = item.title.split(' ')[0] ?? '?';
  const ok = item.status === 'passed';
  if (!ok && id !== CONFIG_ONLY) failed = true;
  console.info(`${ok ? 'pass' : 'FAIL'}  ${item.title}`);
}

if (failed) {
  console.info('DECISION: authjs-v5. Follow task M0.7-F.');
  process.exit(1);
}
console.info('DECISION: better-auth. Result: PROVISIONAL (OAuth unverified). Record it in AUTH-SPIKE.md.');
