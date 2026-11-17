import { sql } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { recordAudit } from '@/server/audit/record';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { ForbiddenError, ValidationError } from '@/server/errors';
import { exportAudit, listAudit } from './audit';
import { withViewer } from './context';

const db = testDb();
const clock = fixedClock('2026-11-06T14:02:00Z');

type NewRow = Partial<typeof auditLog.$inferInsert> & { at: Date };

const daysAgo = (days: number): Date => new Date(clock.now().getTime() - days * 86_400_000);

const insertRows = async (rows: NewRow[]): Promise<void> => {
  await db.insert(auditLog).values(
    rows.map((row, index) => ({
      actorLabel: 'Omar Nasser',
      actorRole: 'Partner manager',
      who: 'staff' as const,
      kind: 'deal_decisions' as const,
      event: 'registration.accepted',
      action: 'Accepted a registration',
      target: `Customer ${index}`,
      text: `Accepted a registration: Customer ${index}`,
      ...row,
    })),
  );
};

beforeEach(() => resetDb(db));

describe('listAudit', () => {
  it('returns the period newest first with the full count', async () => {
    const staff = await asStaff(db);
    await insertRows([
      { at: daysAgo(1), target: 'Yesterday deal' },
      { at: daysAgo(10), target: 'Ten days ago deal' },
      { at: daysAgo(40), target: 'Forty days ago deal' },
    ]);
    const page = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '30d' }, clock));
    expect(page.rows.map((r) => r.target)).toEqual(['Yesterday deal', 'Ten days ago deal']);
    expect(page.total).toBe(2);
    expect(page.nextCursor).toBeNull();
    const wide = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '90d' }, clock));
    expect(wide.total).toBe(3);
    const narrow = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '7d' }, clock));
    expect(narrow.total).toBe(1);
  });

  it('filters by kind, who and partner', async () => {
    const staff = await asStaff(db);
    const partner = await makePartner(db, {});
    await insertRows([
      { at: daysAgo(1), kind: 'partners', who: 'staff', partnerId: partner.id, target: 'A' },
      { at: daysAgo(1), kind: 'documents', who: 'staff', target: 'B' },
      { at: daysAgo(1), kind: 'deal_decisions', who: 'sync', target: 'C' },
    ]);
    const run = (filter: Parameters<typeof listAudit>[2]) =>
      withViewer(staff, async (tx) => (await listAudit(tx, staff, filter, clock)).rows.map((r) => r.target));
    expect(await run({ period: '30d', kind: 'partners' })).toEqual(['A']);
    expect(await run({ period: '30d', who: 'sync' })).toEqual(['C']);
    expect(await run({ period: '30d', partnerId: partner.id })).toEqual(['A']);
  });

  it('searches actor, action and target, and treats % and _ as plain characters', async () => {
    const staff = await asStaff(db);
    await insertRows([
      { at: daysAgo(1), target: 'Pearl 100% Gulf Bank' },
      { at: daysAgo(2), target: 'Dunes Networks', actorLabel: 'Gaurav Jadhav' },
      { at: daysAgo(3), target: 'Plain name' },
    ]);
    const run = (q: string) =>
      withViewer(staff, async (tx) => (await listAudit(tx, staff, { period: '30d', q }, clock)).rows.map((r) => r.target));
    expect(await run('100%')).toEqual(['Pearl 100% Gulf Bank']);
    expect(await run('gaurav')).toEqual(['Dunes Networks']);
    expect(await run('_')).toEqual([]);
    expect(await run('accepted a reg')).toHaveLength(3);
  });

  it('pages with a cursor without skipping or repeating rows that share a timestamp', async () => {
    const staff = await asStaff(db);
    const same = daysAgo(1);
    await insertRows([0, 1, 2, 3, 4].map((i) => ({ at: same, target: `Row ${i}` })));
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await withViewer(staff, (tx) =>
        listAudit(tx, staff, { period: '30d', limit: 2, ...(cursor ? { cursor } : {}) }, clock),
      );
      seen.push(...page.rows.map((r) => r.target));
      expect(page.total).toBe(5);
      cursor = page.nextCursor ?? undefined;
      pages += 1;
    } while (cursor);
    expect(pages).toBe(3);
    expect(new Set(seen).size).toBe(5);
  });

  it('rejects a cursor that is not one of ours', async () => {
    const staff = await asStaff(db);
    await expect(
      withViewer(staff, (tx) => listAudit(tx, staff, { period: '30d', cursor: 'not-a-cursor' }, clock)),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('rejects a well formed cursor whose timestamp is not a timestamp', async () => {
    const staff = await asStaff(db);
    const forged = Buffer.from(JSON.stringify({ at: '2026-13-45 99:99:99', id: '3f2b8c1e-5d4a-4f6b-9c7d-1a2b3c4d5e6f' })).toString('base64url');
    await expect(
      withViewer(staff, (tx) => listAudit(tx, staff, { period: '30d', cursor: forged }, clock)),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('shows what recordAudit wrote, including the HubSpot sync actor', async () => {
    const staff = await asStaff(db);
    await db.transaction(async (tx) => {
      await recordAudit(tx, SYSTEM_ACTORS.hubspot, {
        event: 'registration.stage_changed',
        target: 'Vardhan Capital, CleanSight',
        note: 'Stage changed to Proposal sent',
        source: 'crm',
      });
    });
    const page = await withViewer(staff, (tx) => listAudit(tx, staff, { period: '7d' }, fixedClock(new Date().toISOString())));
    expect(page.rows[0]).toMatchObject({
      actorLabel: 'HubSpot sync',
      whoKind: 'sync',
      source: 'crm',
      action: 'Stage changed',
      target: 'Vardhan Capital, CleanSight',
    });
  });

  it('refuses a partner viewer before the database does', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => listAudit(tx, partner, { period: '30d' }, clock))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});

describe('exportAudit', () => {
  it('returns every matching row without paging', async () => {
    const staff = await asStaff(db);
    await insertRows([0, 1, 2].map((i) => ({ at: daysAgo(i + 1) })));
    const rows = await withViewer(staff, (tx) => exportAudit(tx, staff, { period: '30d' }, clock));
    expect(rows).toHaveLength(3);
  });

  it('stops at 5000 rows with a ValidationError that names the period field', async () => {
    const staff = await asStaff(db);
    await db.execute(sql`
      insert into audit_log (at, actor_label, who, kind, event, text)
      select now() - (g || ' seconds')::interval, 'Bulk', 'staff', 'partners', 'partner.created', 'Added partner: ' || g
      from generate_series(1, 5001) as g`);
    const attempt = withViewer(staff, (tx) => exportAudit(tx, staff, { period: '7d' }, fixedClock(new Date().toISOString())));
    await expect(attempt).rejects.toMatchObject({ issues: [{ path: 'period' }] });
  });

  it('refuses a partner viewer', async () => {
    const partner = await asPartner(db);
    await expect(withViewer(partner, (tx) => exportAudit(tx, partner, { period: '30d' }, clock))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });
});
