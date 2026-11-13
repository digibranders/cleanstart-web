// src/server/repo/isolation.test.ts  (W0-d, M1.2; every later repo module is picked up automatically)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { NotFoundError, ForbiddenError } from '@/server/errors';
import { resetDb, seedTwoTenants, testDb } from '@/db/test-helpers';
import { withViewer } from './context';
import type { IsolationContext, IsolationEntry } from './isolation.registry';

const REPO_DIR = join(__dirname);
const NOT_REPO = new Set(['context', 'isolation.registry', 'isolation', 'imports']);

const files = readdirSync(REPO_DIR)
  .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((name) => !NOT_REPO.has(name));

/** Absolute path and @vite-ignore: Vite cannot analyse a variable import inside its own directory. */
const loadRepoModule = (name: string): Promise<unknown> => import(/* @vite-ignore */ join(REPO_DIR, `${name}.ts`));

const isEmptyResult = (value: unknown): boolean => {
  if (value === null || value === undefined || value === 0) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isEmptyResult);
  return false;
};

describe('repo isolation matrix', () => {
  let ctx: IsolationContext;
  beforeAll(async () => {
    await resetDb(testDb());
    ctx = await seedTwoTenants(testDb());
  });

  it('seeds two tenants that cannot see each other through withViewer', async () => {
    for (const [mine, theirs] of [[ctx.a, ctx.b], [ctx.b, ctx.a]] as const) {
      const seen = await withViewer(mine.viewer, async (tx) => {
        const rows = await tx.execute(sql`select partner_id from registrations union all select partner_id from registration_messages union all select partner_id from registration_contacts union all select partner_id from registration_events union all select partner_id from document_opens union all select partner_id from access_requests`);
        return rows.rows.map((row) => row.partner_id);
      });
      expect(seen.length).toBeGreaterThan(0);
      expect(seen.every((partnerId) => partnerId === mine.partnerId)).toBe(true);
      expect(seen).not.toContain(theirs.partnerId);
    }
  });

  for (const name of files) {
    describe(name, () => {
      it('registers every exported function in `isolation`', async () => {
        const mod = (await loadRepoModule(name)) as Record<string, unknown>;
        const registry = mod.isolation as Record<string, IsolationEntry> | undefined;
        expect(registry, `${name}.ts must export \`isolation\``).toBeDefined();
        const exported = Object.entries(mod)
          .filter(([key, value]) => key !== 'isolation' && typeof value === 'function')
          .map(([key]) => key)
          .sort();
        expect(Object.keys(registry ?? {}).sort()).toEqual(exported);
      });

      it('leaks nothing across tenants', async () => {
        const mod = (await loadRepoModule(name)) as Record<string, unknown>;
        const registry = (mod.isolation ?? {}) as Record<string, IsolationEntry>;
        for (const [fnName, entry] of Object.entries(registry)) {
          if (entry.scope === 'public' || entry.scope === 'exempt') continue;
          const outcome = await withViewer(ctx.a.viewer, async (tx) => {
            try {
              const result = entry.scope === 'rls-only' ? await entry.probe(tx, ctx) : await entry.probe(tx, ctx.a.viewer, ctx);
              return { ok: true as const, result };
            } catch (error) {
              return { ok: false as const, error };
            }
          });
          const label = `${name}.${fnName}`;
          if (entry.scope === 'rls-only') {
            expect(outcome.ok, label).toBe(true);
            if (outcome.ok) entry.check(outcome.result);
            continue;
          }
          if (entry.expect === 'empty') expect(outcome.ok && isEmptyResult(outcome.result), label).toBe(true);
          else if (entry.expect === 'not_found') expect(!outcome.ok && outcome.error instanceof NotFoundError, label).toBe(true);
          else if (entry.expect === 'forbidden') expect(!outcome.ok && outcome.error instanceof ForbiddenError, label).toBe(true);
          else expect(outcome.ok, label).toBe(true);
        }
      });
    });
  }
});
