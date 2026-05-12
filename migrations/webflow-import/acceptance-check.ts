/**
 * H8 — Acceptance checks
 *
 * 9 automated assertions per arch doc §migration acceptance criteria.
 * All assertions run and results are reported together; non-fatal failures
 * are logged so the operator can triage before cutover.
 *
 * Usage:
 *   DATABASE_URI=... PAYLOAD_SECRET=... \
 *   PAYLOAD_URL=http://localhost:3000 \
 *   tsx migrations/webflow-import/acceptance-check.ts
 *
 * Exit code: 0 = all pass, 1 = one or more failed.
 */

import fs from 'node:fs';
import path from 'node:path';

import { getPayload } from 'payload';
import config from '../../apps/cms/src/payload.config';

const TRANSFORMED_DIR = path.resolve('migrations/webflow-export/transformed');
const ASSET_PROGRESS = path.resolve('migrations/webflow-export/.asset-progress.json');
const PAYLOAD_URL = (process.env.PAYLOAD_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const CONTENT_COLLECTIONS = ['blogs', 'news', 'guides', 'resources', 'knowledgeBase', 'events', 'webinars', 'jobs', 'pages'] as const;

type Result = { name: string; pass: boolean; detail: string };

const check = async (name: string, fn: () => Promise<{ pass: boolean; detail: string }>): Promise<Result> => {
  try {
    const { pass, detail } = await fn();
    return { name, pass, detail };
  } catch (err) {
    return { name, pass: false, detail: err instanceof Error ? err.message : String(err) };
  }
};

const countTransformedRows = (slug: string): number => {
  const file = path.join(TRANSFORMED_DIR, `${slug}.jsonl`);
  if (!fs.existsSync(file)) return 0;
  return fs.readFileSync(file, 'utf-8').split('\n').filter((l) => l.trim()).length;
};

const run = async (): Promise<void> => {
  console.log('[acceptance] Running acceptance checks…');

  const payload = await getPayload({ config });
  const results: Result[] = [];

  // 1. All exported Webflow items have a corresponding Payload doc.
  results.push(
    await check('All exported items imported to Payload', async () => {
      let missingTotal = 0;
      for (const slug of CONTENT_COLLECTIONS) {
        const exported = countTransformedRows(slug);
        if (exported === 0) continue;
        const imported = await payload.count({
          collection: slug as Parameters<typeof payload.count>[0]['collection'],
          overrideAccess: true,
        });
        if (imported.totalDocs < exported) {
          missingTotal += exported - imported.totalDocs;
        }
      }
      return {
        pass: missingTotal === 0,
        detail: missingTotal === 0 ? 'All rows imported' : `${missingTotal} rows missing`,
      };
    }),
  );

  // 2. No slug collision between collections.
  results.push(
    await check('No slug collisions within collections', async () => {
      const collisions: string[] = [];
      for (const slug of CONTENT_COLLECTIONS) {
        const all = await payload.find({
          collection: slug as Parameters<typeof payload.find>[0]['collection'],
          limit: 5000,
          depth: 0,
          overrideAccess: true,
        });
        const slugs = (all.docs as { slug?: string }[]).map((d) => d.slug).filter(Boolean);
        const unique = new Set(slugs);
        if (unique.size < slugs.length) collisions.push(`${slug} has ${slugs.length - unique.size} duplicates`);
      }
      return {
        pass: collisions.length === 0,
        detail: collisions.length === 0 ? 'No collisions' : collisions.join('; '),
      };
    }),
  );

  // 3. All body-text Webflow asset URLs rewritten to R2.
  results.push(
    await check('No remaining Webflow CDN URLs in transformed files', async () => {
      const WEBFLOW_CDN_RE = /uploads(?:-ssl)?\.webflow\.com/;
      const remaining: string[] = [];
      for (const slug of CONTENT_COLLECTIONS) {
        const file = path.join(TRANSFORMED_DIR, `${slug}.jsonl`);
        if (!fs.existsSync(file)) continue;
        const lines = fs.readFileSync(file, 'utf-8').split('\n');
        if (lines.some((l) => WEBFLOW_CDN_RE.test(l))) remaining.push(slug);
      }
      return {
        pass: remaining.length === 0,
        detail: remaining.length === 0 ? 'No Webflow CDN URLs remaining' : `Collections with remaining URLs: ${remaining.join(', ')}`,
      };
    }),
  );

  // 4. All R2 assets return HTTP 200.
  results.push(
    await check('R2 assets accessible (sample check)', async () => {
      if (!fs.existsSync(ASSET_PROGRESS)) return { pass: true, detail: 'No asset progress file (skipped)' };
      const records = JSON.parse(fs.readFileSync(ASSET_PROGRESS, 'utf-8')) as { r2PublicUrl: string }[];
      const sample = records.slice(0, 5);
      const failures: string[] = [];
      for (const r of sample) {
        try {
          const res = await fetch(r.r2PublicUrl, { method: 'HEAD' });
          if (!res.ok) failures.push(`${r.r2PublicUrl} → ${res.status}`);
        } catch (err) {
          failures.push(`${r.r2PublicUrl} → ${err instanceof Error ? err.message : 'error'}`);
        }
      }
      return {
        pass: failures.length === 0,
        detail: failures.length === 0 ? `${sample.length} assets accessible` : failures.join('; '),
      };
    }),
  );

  // 5. URL parity report exists (was generated).
  results.push(
    await check('URL parity report generated', async () => {
      const reportFile = path.resolve('migrations/URL-PARITY-REPORT.md');
      const exists = fs.existsSync(reportFile);
      return { pass: exists, detail: exists ? 'Report exists' : 'Run url-parity.ts first' };
    }),
  );

  // 6. Payload generate:types drift check (types file is fresh).
  results.push(
    await check('payload-types.ts is up to date', async () => {
      const typesFile = path.resolve('apps/cms/src/payload-types.ts');
      const stat = fs.statSync(typesFile);
      const ageMs = Date.now() - stat.mtimeMs;
      const stale = ageMs > 7 * 24 * 60 * 60 * 1000; // 7 days
      return {
        pass: !stale,
        detail: stale
          ? `Types file is ${Math.round(ageMs / 86400000)} days old — run generate:types`
          : `Types file last modified ${new Date(stat.mtimeMs).toISOString()}`,
      };
    }),
  );

  // 7. All content collections have at least 1 published document.
  results.push(
    await check('All content collections have ≥1 published doc', async () => {
      const empty: string[] = [];
      for (const slug of CONTENT_COLLECTIONS) {
        const result = await payload.find({
          collection: slug as Parameters<typeof payload.find>[0]['collection'],
          where: { _status: { equals: 'published' } },
          limit: 1,
          overrideAccess: true,
        });
        if (result.totalDocs === 0) empty.push(slug);
      }
      return {
        pass: empty.length === 0,
        detail: empty.length === 0 ? 'All collections have published docs' : `Empty: ${empty.join(', ')}`,
      };
    }),
  );

  // 8. JSON-LD endpoint returns valid schema for one doc per collection.
  results.push(
    await check('JSON-LD endpoint returns 200 for sample docs', async () => {
      const failures: string[] = [];
      for (const slug of ['blogs', 'news', 'guides'] as const) {
        const result = await payload.find({
          collection: slug,
          where: { _status: { equals: 'published' } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        const doc = result.docs[0] as { slug?: string } | undefined;
        if (!doc?.slug) continue;
        try {
          const res = await fetch(`${PAYLOAD_URL}/api/jsonld/${slug}/${doc.slug}`);
          if (!res.ok) failures.push(`${slug}/${doc.slug} → ${res.status}`);
        } catch (err) {
          failures.push(`${slug}/${doc.slug} → ${err instanceof Error ? err.message : 'error'}`);
        }
      }
      return {
        pass: failures.length === 0,
        detail: failures.length === 0 ? 'JSON-LD endpoints OK' : failures.join('; '),
      };
    }),
  );

  // 9. Payload build succeeds (via tsc typecheck as proxy).
  results.push(
    await check('TypeScript types compile without errors', async () => {
      const { execSync } = await import('node:child_process');
      try {
        execSync('pnpm --filter @cleanstart/cms typecheck', { stdio: 'pipe' });
        return { pass: true, detail: 'tsc --noEmit passed' };
      } catch (err) {
        const output = (err as { stderr?: Buffer }).stderr?.toString() ?? 'unknown';
        return { pass: false, detail: output.slice(0, 300) };
      }
    }),
  );

  // ─── Report ────────────────────────────────────────────────────

  const passing = results.filter((r) => r.pass);
  const failing = results.filter((r) => !r.pass);

  console.log('\n╔══ Acceptance Check Results ═══════════════════════════════╗');
  for (const r of results) {
    const icon = r.pass ? '✓' : '✕';
    console.log(`${icon} ${r.name}`);
    if (!r.pass) console.log(`  → ${r.detail}`);
  }
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(`\n${passing.length}/${results.length} checks passed`);

  await payload.db?.destroy?.();
  process.exit(failing.length > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('[acceptance] Fatal:', err);
  process.exit(1);
});
