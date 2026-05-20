#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Regenerates Payload types and asserts they match what's committed.
 * Fails CI when a collection / global / block schema changed without
 * the generated payload-types.ts being updated alongside.
 *
 * `generate:types` (scripts/generate-types.ts) owns the env-stripping
 * needed to make output deterministic across machines — this script
 * just invokes it and compares before/after.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '../../..');
const cmsRoot = path.resolve(dirname, '..');
const typesFile = path.resolve(cmsRoot, 'src/payload-types.ts');

const before = readFileSync(typesFile, 'utf8');

execFileSync('pnpm', ['--filter', '@cleanstart/cms', 'run', 'generate:types'], {
  stdio: 'inherit',
  cwd: repoRoot,
});

const after = readFileSync(typesFile, 'utf8');

if (before !== after) {
  // Surface the actual line-level diff so opaque drift (CI sees a
  // change that local doesn't) can be diagnosed without manually
  // diffing CI artifacts.
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const max = Math.max(beforeLines.length, afterLines.length);
  const diffLines: string[] = [];
  let diffCount = 0;
  for (let i = 0; i < max; i++) {
    if (beforeLines[i] !== afterLines[i]) {
      diffCount++;
      if (diffLines.length < 90) {
        diffLines.push(`  L${i + 1}:`);
        diffLines.push(`    - ${(beforeLines[i] ?? '').slice(0, 220)}`);
        diffLines.push(`    + ${(afterLines[i] ?? '').slice(0, 220)}`);
      }
    }
  }

  process.stderr.write(
    [
      '',
      '✖ Payload types drift detected.',
      `  ${typesFile}`,
      `  ${diffCount} line(s) differ between committed file and freshly generated output.`,
      ...diffLines,
      '  Run `pnpm --filter @cleanstart/cms generate:types` locally and commit the updated file.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

// Locked-schema presence assertions. CLAUDE.md "Schema decisions
// locked this session" pins specific field names for the launch
// posture; if a future Payload upgrade or refactor silently drops one,
// the file-equality check above would still pass (since it compares
// freshly-generated to committed). These checks fail loudly instead.
const REQUIRED_SYMBOLS: { context: string; needle: string }[] = [
  { context: 'Webinars', needle: 'registrationMode' },
  { context: 'Webinars', needle: 'registrationForm' },
  { context: 'Webinars', needle: 'registrationUrl' },
  { context: 'Resources', needle: 'gateForm' },
  { context: 'KnowledgeBase', needle: 'knowledgeBase' },
  { context: 'KnowledgeCategories', needle: 'knowledgeCategories' },
  { context: 'Leads', needle: 'piiRedactedAt' },
];

const missing = REQUIRED_SYMBOLS.filter(({ needle }) => !after.includes(needle));
if (missing.length > 0) {
  process.stderr.write(
    [
      '',
      '✖ Payload types missing locked-schema fields:',
      ...missing.map(
        ({ context, needle }) => `  - ${context}: \`${needle}\` not found in payload-types.ts`,
      ),
      '  These fields are pinned by CLAUDE.md and must round-trip through the generator.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

process.stdout.write('✓ Payload types are up to date.\n');
