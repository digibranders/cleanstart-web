import { and } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { parseStaffDealFacet, parseStaffDealParams } from '@/lib/staff-deals-dto';
import { overdueCutoff, staffDealConditions, staffDealOrder } from './staff-deal-query';

const dialect = new PgDialect();
const render = (parts: ReturnType<typeof staffDealConditions>): { sql: string; params: unknown[] } =>
  dialect.sqlToQuery(and(...parts) ?? (undefined as never));

describe('overdueCutoff', () => {
  it('on a Thursday is the Monday before: three business days back', () => {
    expect(overdueCutoff('2026-11-19')).toBe('2026-11-16');
  });
  it('skips the weekend', () => {
    expect(overdueCutoff('2026-11-23')).toBe('2026-11-18');
  });
});

describe('parseStaffDealParams', () => {
  it('defaults to the waiting queue', () => {
    expect(parseStaffDealFacet({})).toBe('waiting');
    expect(parseStaffDealParams({}).status).toEqual(['pending']);
  });
  it('maps a facet, and "all" means no status filter', () => {
    expect(parseStaffDealParams({ status: 'won' }).status).toEqual(['won']);
    expect(parseStaffDealParams({ status: 'all' }).status).toEqual([]);
  });
  it('drops one bad value without resetting the others', () => {
    const f = parseStaffDealParams({ status: 'lost', partner: 'nope', page: '3', overdue: '1' });
    expect(f).toMatchObject({ status: ['lost'], page: 3, overdue: true });
    expect(f.partnerId).toBeUndefined();
  });
});

describe('staffDealConditions', () => {
  const today = '2026-11-23';
  const base = parseStaffDealParams({ status: 'all' });

  it('has no condition for the default filters', () => {
    expect(staffDealConditions(base, today, { withStatus: true }).filter(Boolean)).toHaveLength(0);
  });
  it('leaves status out for facet counts', () => {
    const f = parseStaffDealParams({ status: 'won' });
    expect(staffDealConditions(f, today, { withStatus: false }).filter(Boolean)).toHaveLength(0);
    expect(render(staffDealConditions(f, today, { withStatus: true })).params).toContain('won');
  });
  it('escapes LIKE wildcards in the search', () => {
    const q = render(staffDealConditions({ ...base, q: '50%_x' }, today, { withStatus: true }));
    expect(q.params).toContain('%50\\%\\_x%');
  });
  it('overdue is pending plus the cutoff date', () => {
    const q = render(staffDealConditions({ ...base, overdue: true }, today, { withStatus: true }));
    expect(q.params).toEqual(expect.arrayContaining(['pending', '2026-11-18']));
  });
  it('conflict is an exists over another partner', () => {
    const q = render(staffDealConditions({ ...base, conflict: true }, today, { withStatus: true }));
    expect(q.sql).toMatch(/exists \(select 1 from "registrations" "rival"/);
  });
});

describe('staffDealOrder', () => {
  it('puts nulls last for manager and protection and always ends on id', () => {
    const [primary, tie] = staffDealOrder('protection', 'asc');
    expect(dialect.sqlToQuery(primary!).sql).toMatch(/asc nulls last/);
    expect(dialect.sqlToQuery(tie!).sql).toMatch(/"id" desc/);
  });
});
