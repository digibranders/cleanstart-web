#!/usr/bin/env node
/**
 * Verify every route in `apps/web/src/app` has a matching row in
 * `PAGE_REGISTRY_SEED`. A route with no row gets no Schema Manager entry
 * AND no ⌘K search entry (pageRegistry is the only thing that indexes a
 * hardcoded static page — see `buildSearchDocument` in
 * `src/payload/lib/search/index-schema.ts`), so a page that ships without
 * one silently has neither, with nothing else in CI to catch it.
 *
 * Run via:
 *   pnpm --filter @cleanstart/cms verify:page-registry
 *
 * Two kinds of drift, handled differently:
 *   - MISSING (a route exists, no seed row) — fails CI. This is the "forgot
 *     to register a new page" case this check exists for.
 *   - ORPHANED (a seed row exists, no matching route) — printed as a
 *     warning, never fails CI. Removing a row is a deliberate, separate
 *     decision (redirects, Schema Manager history) — not something this
 *     script should force.
 *
 * The diffing logic (`routeFromPageFile`, `diffPageRegistryCoverage`,
 * `INTENTIONALLY_UNREGISTERED`) lives in
 * `src/payload/lib/page-registry-coverage.ts` and is unit-tested there —
 * vitest only picks up `src/**` here, not `scripts/**`, and the logic is
 * pure (no filesystem access) so it's worth keeping out of this I/O shell
 * either way. This script is intentionally a small, dep-free node
 * executable so it can run in CI alongside `verify:types` /
 * `verify:payload-ui` without a biome plugin.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { diffPageRegistryCoverage, routeFromPageFile } from '../src/payload/lib/page-registry-coverage.ts';

/** Recursively collect every `page.tsx` / `page.ts` under `appDir`. */
const findPageRoutes = async (appDir: string): Promise<string[]> => {
  const routes: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        await walk(full);
      } else if (entry.isFile() && (entry.name === 'page.tsx' || entry.name === 'page.ts')) {
        routes.push(routeFromPageFile(path.relative(appDir, full)));
      }
    }
  };
  await walk(appDir);
  return routes;
};

const main = async (): Promise<void> => {
  const cmsRoot = path.resolve(fileURLToPath(import.meta.url), '..', '..');
  const webAppDir = path.resolve(cmsRoot, '..', 'web', 'src', 'app');

  const [{ PAGE_REGISTRY_SEED }, webRoutes] = await Promise.all([
    import(path.resolve(cmsRoot, 'src/payload/lib/page-registry-seed.ts')) as Promise<{
      PAGE_REGISTRY_SEED: ReadonlyArray<{ path: string }>;
    }>,
    findPageRoutes(webAppDir),
  ]);

  const { missing, orphaned } = diffPageRegistryCoverage(
    webRoutes,
    PAGE_REGISTRY_SEED.map((r) => r.path),
  );

  if (orphaned.length > 0) {
    console.warn(
      `\npageRegistry has ${orphaned.length} row(s) with no matching apps/web route (non-blocking):\n`,
    );
    for (const p of orphaned) console.warn(`  - ${p}`);
    console.warn(
      '\nIf the page was intentionally removed, delete its row via the admin UI (kept for\n' +
        'redirect/history reasons otherwise). If it moved, update PAGE_REGISTRY_SEED instead\n' +
        'of leaving a stale row.\n',
    );
  }

  if (missing.length > 0) {
    console.error(
      `\npageRegistry coverage check FAILED — ${missing.length} apps/web route(s) have no seed row:\n`,
    );
    for (const p of missing) console.error(`  - ${p}`);
    console.error(
      '\nEvery static page or CMS listing page needs a row in\n' +
        'apps/cms/src/payload/lib/page-registry-seed.ts (PAGE_REGISTRY_SEED) — it is what\n' +
        'gives the page a Schema Manager entry AND makes it searchable in the ⌘K command\n' +
        'palette (pageRegistry rows feed the Meilisearch content index; nothing else\n' +
        'indexes a hardcoded static page). Add a row, then run:\n' +
        '  pnpm exec tsx --env-file=.env scripts/seed-page-registry.ts\n' +
        'to create it (creation always fires the search-sync hook, no --force needed).\n\n' +
        'If a route is deliberately unindexed (an internal tool, a noindex utility page),\n' +
        'add it to INTENTIONALLY_UNREGISTERED in\n' +
        'src/payload/lib/page-registry-coverage.ts instead, with a comment explaining why.\n',
    );
    process.exit(1);
  }

  console.info(
    `pageRegistry coverage ✓ — ${webRoutes.length} apps/web routes, all accounted for${
      orphaned.length > 0 ? ` (${orphaned.length} orphaned row warning above).` : '.'
    }`,
  );
};

void main();
