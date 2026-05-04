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
  process.stderr.write(
    [
      '',
      '✖ Payload types drift detected.',
      `  ${typesFile}`,
      '  was out of date with the current collection/global/block schemas.',
      '  Run `pnpm --filter @cleanstart/cms generate:types` locally and commit the updated file.',
      '',
    ].join('\n'),
  );
  process.exit(1);
}

process.stdout.write('✓ Payload types are up to date.\n');
