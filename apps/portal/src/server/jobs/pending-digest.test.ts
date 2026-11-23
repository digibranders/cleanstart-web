import { describe, expect, it } from 'vitest';
import { buildDigests, type DigestReviewer, type WaitingRegistration } from './pending-digest';

// Monday 2026-11-23.
const today = '2026-11-23';
const reviewer = (over: Partial<DigestReviewer>): DigestReviewer => ({ id: 'r1', name: 'Maya', email: 'maya@cleanstart.example', role: 'partner_manager', region: 'all', ...over });
const reg = (over: Partial<WaitingRegistration>): WaitingRegistration => ({
  customer: 'Acme', partnerName: 'Kestrel', product: 'images', region: 'india', managerId: 'r1', since: '2026-11-23', ...over,
});

describe('buildDigests', () => {
  it('sends nothing when nothing waits', () => {
    expect(buildDigests([reviewer({})], [], [], today)).toEqual([]);
  });

  it('skips marketing', () => {
    expect(buildDigests([reviewer({ role: 'marketing' })], [reg({})], [{ company: 'C', applicantName: 'A', since: today }], today)).toEqual([]);
  });

  it('lists overdue registrations first, then the longest waiting, and flags the target', () => {
    // 2026-11-16 is 5 business days ago (overdue), 11-19 is 2 (on target), 11-18 is 3 (past target, not overdue), 11-13 is 6.
    const [digest] = buildDigests(
      [reviewer({})],
      [reg({ customer: 'on-target', since: '2026-11-19' }), reg({ customer: 'late', since: '2026-11-18' }), reg({ customer: 'overdue-5', since: '2026-11-16' }), reg({ customer: 'overdue-6', since: '2026-11-13' })],
      [],
      today,
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
    const names = (r: DigestReviewer): string[] => (buildDigests([r], rows, [], today)[0]?.registrations ?? []).map((x) => x.customer).sort();
    expect(names(reviewer({ region: 'all' }))).toEqual(['mine', 'unrouted']);
    expect(names(reviewer({ region: 'middle_east' }))).toEqual(['unrouted']);
    expect(names(reviewer({ id: 's1', role: 'sales', region: 'india' }))).toEqual(['mine', 'theirs']);
    expect(names(reviewer({ id: 's2', role: 'sales', region: 'all' }))).toEqual(['mine', 'theirs', 'unrouted']);
  });

  it('adds open applications for partner managers only, longest waiting first', () => {
    const apps = [
      { company: 'new', applicantName: 'A', since: '2026-11-23' },
      { company: 'old', applicantName: 'B', since: '2026-11-17' },
    ];
    const [manager] = buildDigests([reviewer({})], [], apps, today);
    expect(manager?.applications.map((a) => [a.company, a.pastTarget])).toEqual([['old', true], ['new', false]]);
    expect(buildDigests([reviewer({ id: 's1', role: 'sales' })], [], apps, today)).toEqual([]);
  });
});
