import { describe, expect, it } from 'vitest';
import { type AuditView, auditViewToExportFilter, auditViewToQuery, parseAuditView } from './audit-filters';

const NONE = { from: null, to: null, event: null } as const;
const view = (over: Partial<AuditView>): AuditView => ({
  period: '30d',
  ...NONE,
  kind: null,
  who: null,
  partnerId: null,
  q: '',
  cursor: null,
  ...over,
});

describe('parseAuditView', () => {
  it('defaults to the last 30 days with no other filter', () => {
    expect(parseAuditView({})).toEqual(view({}));
  });

  it('reads known values and ignores unknown ones', () => {
    expect(parseAuditView({ period: '7d', kind: 'partners', who: 'sync', q: ' pearl ' })).toEqual(
      view({ period: '7d', kind: 'partners', who: 'sync', q: 'pearl' }),
    );
    expect(parseAuditView({ period: '1y', kind: 'drop table', who: 'robots', event: 'nope' })).toMatchObject({
      period: '30d',
      kind: null,
      who: null,
      event: null,
    });
  });

  it('accepts the 24 hour preset and a known event type', () => {
    expect(parseAuditView({ period: '24h', event: 'registration.accepted' })).toMatchObject({
      period: '24h',
      event: 'registration.accepted',
    });
  });

  it('takes the first value of a repeated parameter and caps the search text', () => {
    expect(parseAuditView({ period: ['90d', '7d'] }).period).toBe('90d');
    expect(parseAuditView({ q: 'x'.repeat(500) }).q).toHaveLength(100);
    expect(parseAuditView({ cursor: 'c'.repeat(301) }).cursor).toBeNull();
  });

  describe('custom range', () => {
    it('keeps a valid from and to', () => {
      expect(parseAuditView({ period: 'custom', from: '2026-10-01', to: '2026-10-31' })).toMatchObject({
        period: 'custom',
        from: '2026-10-01',
        to: '2026-10-31',
      });
      expect(parseAuditView({ period: 'custom', from: '2026-10-05', to: '2026-10-05' }).period).toBe('custom');
    });

    it('falls back to the default when a day is missing, impossible or out of order', () => {
      for (const params of [
        { period: 'custom' },
        { period: 'custom', from: '2026-10-01' },
        { period: 'custom', from: '2026-02-30', to: '2026-03-01' },
        { period: 'custom', from: '2026-10-31', to: '2026-10-01' },
        { period: 'custom', from: 'yesterday', to: 'today' },
      ]) {
        expect(parseAuditView(params)).toMatchObject({ period: '30d', from: null, to: null });
      }
    });

    it('drops from and to when the period is a preset', () => {
      expect(parseAuditView({ period: '7d', from: '2026-10-01', to: '2026-10-31' })).toMatchObject({
        period: '7d',
        from: null,
        to: null,
      });
    });
  });
});

describe('auditViewToQuery', () => {
  it('writes nothing for the default view and only the changed filters otherwise', () => {
    expect(auditViewToQuery(parseAuditView({}))).toBe('');
    expect(auditViewToQuery(view({ period: '7d', kind: 'documents', q: 'a b', cursor: 'abc' }))).toBe(
      '?period=7d&kind=documents&q=a+b&cursor=abc',
    );
  });

  it('round trips through parseAuditView', () => {
    const full = view({
      period: 'custom',
      from: '2026-10-01',
      to: '2026-10-31',
      kind: 'people_access',
      event: 'registration.accepted',
      who: 'staff',
      partnerId: '0b6f7c1e-2f4a-4c7e-9a55-1d3c8e2f9a10',
      q: 'Omar',
    });
    const params = Object.fromEntries(new URLSearchParams(auditViewToQuery(full)));
    expect(parseAuditView(params)).toEqual(full);
  });
});

describe('auditViewToExportFilter', () => {
  it('leaves out the cursor and the unset filters', () => {
    expect(auditViewToExportFilter(view({ period: '7d', who: 'sync', cursor: 'abc' }))).toEqual({
      period: '7d',
      who: 'sync',
    });
    expect(auditViewToExportFilter(view({ period: '7d', partnerId: 'p1' }))).toEqual({ period: '7d', partnerId: 'p1' });
  });

  it('carries the custom range and the event type', () => {
    expect(
      auditViewToExportFilter(view({ period: 'custom', from: '2026-10-01', to: '2026-10-31', event: 'partner.created' })),
    ).toEqual({ period: 'custom', from: '2026-10-01', to: '2026-10-31', event: 'partner.created' });
  });
});
