import { sql } from 'drizzle-orm';
import { appDb, type Db, systemDb } from '@/db/client';
import type { SystemActor, Viewer } from '@/server/auth/types';
import { ForbiddenError } from '@/server/errors';
import { log } from '@/server/log';

/** The transaction handle every repo function receives. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Anything that can run a query: the system `db` (jobs, tests) or a transaction. Used by helpers shared with the HubSpot code. */
export type Queryable = Db | Tx;

/**
 * Runs `fn` in one transaction on the request pool with the viewer's identity set for row level security.
 * set_config(..., true) is transaction local: the settings vanish at commit or rollback, so a pooled connection
 * never carries one request's identity into the next. Pages and server actions are the only callers.
 */
export const withViewer = <T>(viewer: Viewer, fn: (tx: Tx) => Promise<T>): Promise<T> =>
  appDb.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.kind', ${viewer.kind}, true),
                 set_config('app.partner_id', ${viewer.partnerId ?? ''}, true),
                 set_config('app.user_id', ${viewer.id}, true)`,
    );
    return fn(tx);
  });

/**
 * Runs `fn` in one transaction on the system pool (app.kind = 'system' on every connection, set at connect).
 * For code with no viewer. The actor is for logging and for audit entries the callee writes; it grants nothing.
 * Public repo functions (scope "public" in the isolation registry) are the only repo functions called through this.
 */
export const withSystem = <T>(actor: SystemActor, fn: (tx: Tx) => Promise<T>): Promise<T> =>
  systemDb.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.kind', 'system', true), set_config('app.user_id', '', true), set_config('app.partner_id', '', true)`);
    log.debug({ actor: actor.label }, 'withSystem');
    return fn(tx);
  });

/** Throws ForbiddenError unless the viewer is CleanStart staff. Cheap guard for staff only repo functions. */
export const assertStaff = (viewer: Viewer): void => {
  if (viewer.kind !== 'staff') throw new ForbiddenError('staff only');
};
