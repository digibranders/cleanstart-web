import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '@/env';
import { poolSizes } from './pool-size';
import * as schema from './schema';

export type Db = NodePgDatabase<typeof schema> & { $client: Pool };

const POOL_SIZES = poolSizes(process.env);
/** A caller that cannot get a connection within this time fails (and is reported) instead of waiting for ever. */
const CONNECTION_TIMEOUT_MS = 30_000;

const globalForDb = globalThis as unknown as { portalPools?: { app: Pool; system: Pool } };

const createPools = (): { app: Pool; system: Pool } => ({
  app: new Pool({ connectionString: env.DATABASE_URL, max: POOL_SIZES.request, connectionTimeoutMillis: CONNECTION_TIMEOUT_MS }),
  system: new Pool({
    connectionString: env.DATABASE_URL,
    max: POOL_SIZES.system,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
    options: '-c app.kind=system',
  }),
});

// Next dev reloads modules; keep one pair of pools per process so the role's connection limit is not exhausted.
const pools = globalForDb.portalPools ?? createPools();
globalForDb.portalPools = pools;

/** Request scope. Import only from src/server/repo/context.ts (enforced by src/server/repo/imports.test.ts). */
export const appDb: Db = drizzle(pools.app, { schema });
/** System scope: app.kind = 'system' on every connection. Jobs, HubSpot, auth, public intake, test helpers. */
export const db: Db = drizzle(pools.system, { schema });
export const systemDb: Db = db;
/** The system pool, for advisory locks (src/server/jobs/lock.ts). */
export const pool: Pool = pools.system;
