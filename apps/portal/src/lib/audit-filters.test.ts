import { describe, expect, it } from 'vitest';
import { auditViewToExportFilter, auditViewToQuery, parseAuditView } from './audit-filters';

describe('parseAuditView', () => {
  it('defaults to the last 30 days with no other filter', () => {
    expect(parseAuditView({})).toEqual({ period: '30d', kind: null, who: null, partnerId: null, q: '', cursor: null });
  });

  it('reads known values and ignores unknown ones', () => {
    expect(parseAuditView({ period: '7d', kind: 'partners', who: 'sync', q: ' pearl ' })).toEqual({
      period: '7d',
      kind: 'partners',
      who: 'sync',
      partnerId: null,
      q: 'pearl',
      cursor: null,
    });
    expect(parseAuditView({ period: '1y', kind: 'drop table', who: 'robots' })).toMatchObject({
      period: '30d',
      kind: null,
      who: null,
    });
  });

  it('takes the first value of a repeated parameter and caps the search text', () => {
    expect(parseAuditView({ period: ['90d', '7d'] }).period).toBe('90d');
    expect(parseAuditView({ q: 'x'.repeat(500) }).q).toHaveLength(100);
    expect(parseAuditView({ cursor: 'c'.repeat(301) }).cursor).toBeNull();
  });
});

describe('auditViewToQuery', () => {
  it('writes nothing for the default view and only the changed filters otherwise', () => {
    expect(auditViewToQuery(parseAuditView({}))).toBe('');
    expect(auditViewToQuery({ period: '7d', kind: 'documents', who: null, partnerId: null, q: 'a b', cursor: 'abc' })).toBe(
      '?period=7d&kind=documents&q=a+b&cursor=abc',
    );
  });

  it('round trips through parseAuditView', () => {
    const view = { period: '90d', kind: 'people_access', who: 'staff', partnerId: '0b6f7c1e-2f4a-4c7e-9a55-1d3c8e2f9a10', q: 'Omar', cursor: null } as const;
    const params = Object.fromEntries(new URLSearchParams(auditViewToQuery(view)));
    expect(parseAuditView(params)).toEqual(view);
  });
});

describe('auditViewToExportFilter', () => {
  it('leaves out the cursor and the unset filters', () => {
    expect(auditViewToExportFilter({ period: '7d', kind: null, who: 'sync', partnerId: null, q: '', cursor: 'abc' })).toEqual({
      period: '7d',
      who: 'sync',
    });
    expect(
      auditViewToExportFilter({ period: '7d', kind: null, who: null, partnerId: 'p1', q: '', cursor: null }),
    ).toEqual({ period: '7d', partnerId: 'p1' });
  });
});
