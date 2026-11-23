import { describe, expect, it } from 'vitest';
import type { RegionDto } from '@/lib/regions';
import { buildDigests, type DigestReviewer, type WaitingRegistration } from './pending-digest';

// Monday 2026-11-23.
const today = '2026-11-23';
const regionList: RegionDto[] = [
  { key: 'india', name: 'India', sortOrder: 10, active: true },
  { key: 'middle_east', name: 'Middle East', sortOrder: 20, active: true },
  { key: 'eu', name: 'EU', sortOrder: 30, active: true },
];
const reviewer = (over: Partial<DigestReviewer>): DigestReviewer => ({ id: 'r1', name: 'Maya', email: 'maya@cleanstart.example', role: 'partner_manager', regions: 'all', ...over });
const reg = (over: Partial<WaitingRegistration>): WaitingRegistration => ({
  customer: 'Acme', partnerName: 'Kestrel', product: 'images', region: 'india', managerId: 'r1', since: '2026-11-23', ...over,
});

describe('buildDigests', () => {
  it('sends nothing when nothing waits', () => {
    expect(buildDigests([reviewer({})], [], today, regionList)).toEqual([]);
  });

  it('skips marketing', () => {
    expect(buildDigests([reviewer({ role: 'marketing' })], [reg({})], today, regionList)).toEqual([]);
  });

  it('lists overdue registrations first, then the longest waiting, and flags the target', () => {
    // 2026-11-16 is 5 business days ago (overdue), 11-19 is 2 (on target), 11-18 is 3 (past target, not overdue), 11-13 is 6.
    const [digest] = buildDigests(
      [reviewer({})],
      [reg({ customer: 'on-target', since: '2026-11-19' }), reg({ customer: 'late', since: '2026-11-18' }), reg({ customer: 'overdue-5', since: '2026-11-16' }), reg({ customer: 'overdue-6', since: '2026-11-13' })],
      today,
      regionList,
    );
    expect(digest?.registrations.map((r) => [r.customer, r.pastTarget, r.overdue])).toEqual([
      ['overdue-6', true, true],
      ['overdue-5', true, true],
      ['late', true, false],
      ['on-target', false, false],
    ]);
  });

  it('scopes like the approvals queue', () => {
    const rows = [
      reg({ customer: 'mine', managerId: 'r1', region: 'india' }),
      reg({ customer: 'theirs', managerId: 'other', region: 'india' }),
      reg({ customer: 'unrouted', managerId: null, region: 'middle_east' }),
    ];
    const names = (r: DigestReviewer): string[] => (buildDigests([r], rows, today, regionList)[0]?.registrations ?? []).map((x) => x.customer).sort();
    expect(names(reviewer({ regions: 'all' }))).toEqual(['mine', 'unrouted']);
    expect(names(reviewer({ regions: ['middle_east'] }))).toEqual(['unrouted']);
    expect(names(reviewer({ id: 's1', role: 'sales', regions: ['india'] }))).toEqual(['mine', 'theirs']);
    expect(names(reviewer({ id: 's2', role: 'sales', regions: 'all' }))).toEqual(['mine', 'theirs', 'unrouted']);
    // Several regions: the union, for a manager and for sales.
    expect(names(reviewer({ regions: ['india', 'middle_east'] }))).toEqual(['mine', 'theirs', 'unrouted']);
    expect(names(reviewer({ id: 's3', role: 'sales', regions: ['middle_east', 'eu'] }))).toEqual(['unrouted']);
  });
});
