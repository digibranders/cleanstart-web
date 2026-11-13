import { sql } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { appDb } from '@/db/client';
import { resetDb, seedTwoTenants, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import type { IsolationContext } from './isolation.registry';
import { assertStaff, withSystem, withViewer } from './context';
import { ForbiddenError } from '@/server/errors';

describe('withViewer and withSystem', () => {
  let ctx: IsolationContext;
  beforeAll(async () => {
    await resetDb();
    ctx = await seedTwoTenants(testDb());
  });

  it('sets the three identity settings for the length of the transaction', async () => {
    const seen = await withViewer(ctx.a.viewer, async (tx) => {
      const rows = await tx.execute(sql`select app_kind() as kind, app_partner_id() as partner, app_user_id() as usr`);
      return rows.rows[0];
    });
    expect(seen).toEqual({ kind: 'partner', partner: ctx.a.partnerId, usr: ctx.a.viewer.id });
  });

  it('does not leak one request identity into the next on a pooled connection', async () => {
    await withViewer(ctx.a.viewer, async (tx) => void (await tx.execute(sql`select 1`)));
    const after = await appDb.execute(sql`select app_kind() as kind, app_partner_id() as partner`);
    expect(after.rows[0]).toEqual({ kind: 'none', partner: null });
    const staffSees = await withViewer(ctx.staff, async (tx) => (await tx.execute(sql`select count(*)::int as n from registrations`)).rows[0]);
    expect(staffSees).toEqual({ n: 2 });
  });

  it('rolls back everything when the callback throws', async () => {
    await expect(
      withViewer(ctx.staff, async (tx) => {
        await tx.execute(sql`update partners set name = 'Changed' where id = ${ctx.a.partnerId}`);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    const name = await withSystem(SYSTEM_ACTORS.portal, async (tx) => (await tx.execute(sql`select name from partners where id = ${ctx.a.partnerId}`)).rows[0]);
    expect(name).toEqual({ name: 'Alpha' });
  });

  it('runs withSystem with system scope and no partner', async () => {
    const seen = await withSystem(SYSTEM_ACTORS.hubspot, async (tx) => (await tx.execute(sql`select app_kind() as kind, app_partner_id() as partner`)).rows[0]);
    expect(seen).toEqual({ kind: 'system', partner: null });
  });

  it('assertStaff passes staff and throws ForbiddenError for a partner', () => {
    expect(() => assertStaff(ctx.staff)).not.toThrow();
    expect(() => assertStaff(ctx.a.viewer)).toThrow(ForbiddenError);
  });
});
