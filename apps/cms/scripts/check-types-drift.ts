#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Regenerates Payload types and asserts they match what's committed.
 * Fails CI when a collection / global / block schema changed without
 * the generated payload-types.ts being updated alongside.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '../../..');
const typesFile = path.resolve(dirname, '..', 'src/payload-types.ts');

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

process.stdout.write('✓ Payload types are up to date.\n');
