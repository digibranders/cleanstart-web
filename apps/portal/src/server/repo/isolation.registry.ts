// src/server/repo/isolation.registry.ts
import type { PartnerViewer, StaffViewer } from '@/server/auth/types';
import type { Tx } from './context';

/** Ids and viewers of two seeded partners plus a staff viewer. Built by seedTwoTenants() in src/db/test-helpers.ts. */
export interface TenantFixture {
  partnerId: string;
  viewer: PartnerViewer;
  adminViewer: PartnerViewer;
  salesViewer: PartnerViewer;
  userId: string;
  registrationId: string;
  messageId: string;
  contactId: string;
  inviteId: string;
  accessRequestId: string;
  documentId: string;
  openId: string;
}

export interface IsolationContext {
  a: TenantFixture;
  b: TenantFixture;
  staff: StaffViewer;
  /** A document restricted to partner B by audience; partner A must not see it. */
  documentForBOnly: string;
  /** An application, a staff user, an audit row: staff only data. */
  applicationId: string;
  staffUserId: string;
  auditId: string;
}

export type IsolationExpect =
  | 'empty'       // result is [], null, 0, an empty page, or an object whose every array is empty
  | 'not_found'   // throws NotFoundError
  | 'forbidden'   // throws ForbiddenError
  | 'unchanged';  // returns normally and the targeted rows are byte-for-byte unchanged afterwards

export type IsolationEntry =
  | {
      /** Call as partner A with partner B's ids. Must leak nothing and change nothing. */
      scope: 'tenant';
      probe: (tx: Tx, viewer: PartnerViewer, ctx: IsolationContext) => Promise<unknown>;
      expect: IsolationExpect;
      /** Rows (table and id) that must be unchanged afterwards. */
      untouched?: (ctx: IsolationContext) => Array<{ table: string; id: string }>;
    }
  | {
      /** Staff only. Called as a partner viewer, must throw ForbiddenError (assertStaff) or return nothing. */
      scope: 'staff-only';
      probe: (tx: Tx, viewer: PartnerViewer, ctx: IsolationContext) => Promise<unknown>;
      expect: 'forbidden' | 'empty';
    }
  | {
      /** The row belongs to a user. Called as another user of the same partner, must see nothing of the first user. */
      scope: 'own-user';
      probe: (tx: Tx, viewer: PartnerViewer, ctx: IsolationContext) => Promise<unknown>;
      expect: 'empty' | 'not_found';
    }
  | {
      /** Takes (db or tx) only and relies on RLS (integrationHealth). Called with a partner A transaction, must return zeros. */
      scope: 'rls-only';
      probe: (tx: Tx, ctx: IsolationContext) => Promise<unknown>;
      check: (result: unknown) => void;
    }
  | {
      /** No viewer: a public flow taking a SystemActor. Validated by its own unit test, not probed here. */
      scope: 'public';
      reason: string;
    }
  | {
      /** A pure helper that does no data access (a row to DTO mapper). */
      scope: 'exempt';
      reason: string;
    };

export type IsolationMap<Names extends string> = { [K in Names]: IsolationEntry };

/**
 * Usage, at the bottom of a repo module:
 *   export const isolation = defineIsolation<keyof typeof exportedFns>({ ... });
 * `exportedFns` is a local object literal that groups the module's exported functions. The central test
 * compares Object.keys(isolation) with the module's function exports (excluding `isolation` itself).
 */
export const defineIsolation = <Names extends string>(entries: IsolationMap<Names>): IsolationMap<Names> => entries;
