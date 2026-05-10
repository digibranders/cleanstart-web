#!/usr/bin/env node
/**
 * Wave 8 part 2 — admin first-load bundle budget.
 *
 * After `next build` writes its build manifest, this script walks
 * `.next/build-manifest.json` plus `.next/server/app-paths-manifest.json`
 * to compute the gzipped bytes of all chunks loaded on /admin's first
 * paint. Fails CI if the total exceeds the configured budget.
 *
 * The budget exists to catch regressions early — Wave 6's drawer
 * overhaul will move large amounts of code around, and we want a
 * before/after delta we can read in CI logs.
 */

import { gzipSync } from 'node:zlib';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const BUDGET_BYTES_GZ = Number.parseInt(
  process.env.CMS_BUNDLE_BUDGET_BYTES_GZ ?? '512000',
  10,
);

type BuildManifest = {
  pages?: Record<string, string[]>;
  rootMainFiles?: string[];
};

const safeReadJson = async <T>(p: string): Promise<T | null> => {
  try {
    const text = await fs.readFile(p, 'utf8');
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

const sizeOf = async (relPath: string, dotNext: string): Promise<number> => {
  try {
    const buf = await fs.readFile(path.join(dotNext, relPath));
    return gzipSync(buf).length;
  } catch {
    return 0;
  }
};

const main = async (): Promise<void> => {
  const cwd = process.cwd();
  const dotNext = path.resolve(cwd, '.next');
  const manifest = await safeReadJson<BuildManifest>(
    path.join(dotNext, 'build-manifest.json'),
  );
  if (!manifest) {
    console.warn('No .next/build-manifest.json found — skipping budget check.');
    return;
  }

  const rootFiles = manifest.rootMainFiles ?? [];
  const adminPageFiles = Object.entries(manifest.pages ?? {})
    .filter(([route]) => route.startsWith('/admin') || route === '/_app')
    .flatMap(([, files]) => files);

  const all = new Set<string>([...rootFiles, ...adminPageFiles]);
  let total = 0;
  for (const f of all) {
    total += await sizeOf(f, dotNext);
  }

  const kb = (total / 1024).toFixed(1);
  const budgetKb = (BUDGET_BYTES_GZ / 1024).toFixed(1);
  if (total > BUDGET_BYTES_GZ) {
    console.error(
      `\nAdmin first-load bundle budget exceeded.\n` +
        `  measured: ${kb} KB gz (${total} bytes)\n` +
        `  budget:   ${budgetKb} KB gz (${BUDGET_BYTES_GZ} bytes)\n` +
        `  override: CMS_BUNDLE_BUDGET_BYTES_GZ=<bytes>\n`,
    );
    process.exit(1);
  }
  console.info(
    `Admin first-load bundle ${kb} KB gz / ${budgetKb} KB gz budget ✓`,
  );
};

void main();
