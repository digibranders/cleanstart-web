import { describe, expect, it } from 'vitest';
import type { PartnerReportRow } from './dto';
import { acceptRate, filterPartnerRows, partnersToCsv } from './report-view';

const row = (over: Partial<PartnerReportRow>): PartnerReportRow => ({
  partnerId: over.name ?? 'p', name: 'P', category: 'channel', region: 'india',
  registered: 0, waiting: 0, accepted: 0, rejected: 0, won: 0, protectedNow: 0, ...over,
});

const ROWS: PartnerReportRow[] = [
  row({ name: 'Kestrel Systems', category: 'channel', region: 'india', registered: 10, accepted: 7, rejected: 1, won: 2, protectedNow: 3 }),
  row({ name: 'Saffron Secure', category: 'distributor', region: 'india', registered: 9, accepted: 7, rejected: 1, won: 3, protectedNow: 6 }),
  row({ name: 'Arbor Cyber', category: 'channel', region: 'middle_east', registered: 5, accepted: 3, rejected: 1, won: 1, protectedNow: 2 }),
  row({ name: 'Qamar Solutions', category: 'channel', region: 'middle_east' }),
];

describe('acceptRate', () => {
  it('is accepted over decided as a whole percent, and null before any decision', () => {
    expect(acceptRate(7, 1)).toBe(88);
    expect(acceptRate(36, 6)).toBe(86);
    expect(acceptRate(0, 0)).toBeNull();
  });
});

describe('filterPartnerRows', () => {
  it('filters by region and category', () => {
    expect(filterPartnerRows(ROWS, 'india', 'all', 'Name').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure']);
    expect(filterPartnerRows(ROWS, 'all', 'channel', 'Name').map((r) => r.name)).toEqual(['Arbor Cyber', 'Kestrel Systems', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'middle_east', 'distributor', 'Name')).toEqual([]);
  });

  it('sorts as the mock did, with ties broken the same way', () => {
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Most registered').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Most won').map((r) => r.name)).toEqual(['Saffron Secure', 'Kestrel Systems', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Highest accept rate').map((r) => r.name)).toEqual(['Kestrel Systems', 'Saffron Secure', 'Arbor Cyber', 'Qamar Solutions']);
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Name').map((r) => r.name)).toEqual(['Arbor Cyber', 'Kestrel Systems', 'Qamar Solutions', 'Saffron Secure']);
  });

  it('adds the accept rate', () => {
    expect(filterPartnerRows(ROWS, 'all', 'all', 'Name').map((r) => r.rate)).toEqual([75, 88, null, 88]);
  });
});

describe('partnersToCsv', () => {
  it('writes labels, the rate text and quotes cells that need it', () => {
    const csv = partnersToCsv(filterPartnerRows([row({ name: 'Acme, Inc', category: 'channel', region: 'middle_east', registered: 2, accepted: 1, rejected: 1, won: 1, protectedNow: 1 }), row({ name: 'Idle Co' })], 'all', 'all', 'Name'));
    expect(csv.split('\n')).toEqual([
      'Partner,Category,Region,Registered,Accepted,Accept rate,Won,Protected now',
      '"Acme, Inc",Channel partner,Middle East,2,1,50%,1,1',
      'Idle Co,Channel partner,India,0,0,None yet,0,0',
    ]);
  });
});

describe('partnersToCsv formula cells', () => {
  it('prefixes an apostrophe to a name a spreadsheet would run', () => {
    const rows = ['=SUM(A1)', '+1', '-1', '@x', '\tx', '\rx'].map((name) => ({ ...row({ name }), rate: null }));
    const lines = partnersToCsv(rows).split('\n').slice(1);
    expect(lines.map((l) => l.split(',')[0])).toEqual(["'=SUM(A1)", "'+1", "'-1", "'@x", "'\tx", "'\rx"].map((c) => (/[",\n]/.test(c) ? `"${c}"` : c)));
  });
});
