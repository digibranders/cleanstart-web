#!/usr/bin/env -S node --no-warnings --experimental-strip-types
/**
 * Deterministic wrapper around `payload generate:types`.
 *
 * Some Payload plugins reshape collection field order based on env
 * vars (e.g. `@payloadcms/storage-s3` splices and re-pushes the
 * Media.prefix field when R2 credentials are configured). That makes
 * the generated `payload-types.ts` non-deterministic — different
 * outputs depending on which dev has `.env` populated.
 *
 * Strategy: temporarily move `.env*` files aside so Payload's
 * `@next/env`-based loader sees no plugin-toggling env vars during
 * generation. CI runs without `.env*` files at all, so this wrapper
 * makes local generation match CI's output byte-for-byte.
 *
 * This is the single source of truth for type generation; the
 * `verify:types` drift check calls this same script.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const cmsRoot = path.resolve(dirname, '..');

const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local'];

const renamed: { from: string; to: string }[] = [];
for (const name of ENV_FILES) {
  const from = path.join(cmsRoot, name);
  if (existsSync(from)) {
    const to = `${from}.types-gen.bak`;
    renameSync(from, to);
    renamed.push({ from, to });
  }
}

const childEnv: NodeJS.ProcessEnv = {
  ...process.env,
  // Stubs so Payload's config can boot without the real `.env` present.
  // Never used at runtime from generate:types — Payload only needs them
  // to instantiate the DB adapter at module-load time.
  DATABASE_URI: process.env.DATABASE_URI ?? 'postgres://stub@localhost:5432/stub',
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET ?? 'stub',
};

// Renaming `.env*` files aside is not enough: `@payloadcms/storage-s3`
// gates on `process.env.R2_*` (see payload.config.ts `r2EnvComplete`), and
// when those four are present it splices/re-pushes the upload `prefix`
// field — shifting its position in the generated types. A dev with R2
// creds exported via their shell / direnv (not a `.env` file) would still
// trigger the plugin and produce output that mismatches CI (which has no
// R2 vars), causing the recurring `Media.prefix` drift. Strip every R2_*
// var from the child env so the plugin is consistently disabled during
// generation, matching CI byte-for-byte regardless of the local shell.
for (const key of Object.keys(childEnv)) {
  if (key.startsWith('R2_')) {
    delete childEnv[key];
  }
}

try {
  execFileSync('npx', ['payload', 'generate:types'], {
    stdio: 'inherit',
    cwd: cmsRoot,
    env: { ...childEnv, NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --no-deprecation`.trim() },
  });
} finally {
  for (const { from, to } of renamed) {
    if (existsSync(to)) renameSync(to, from);
  }
}
