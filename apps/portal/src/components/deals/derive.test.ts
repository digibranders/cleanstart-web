import { describe, expect, it } from 'vitest';
import { PROTECTION_DAYS } from './dates';
import { acceptedOn, isOverTarget, managerFor, protectionView, reviewSince, stageTrack, waitDays } from './derive';

const base = {
  registeredOn: '2026-11-02',
  resubmittedOn: null,
  status: 'pending' as const,
  stage: 'Awaiting review',
  protectionEnd: null,
  closedOn: null,
};

describe('protection arithmetic', () => {
  it('counts the acceptance day: protection ends 89 days after it', () => {
    expect(PROTECTION_DAYS).toBe(90);
    expect(acceptedOn({ protectionEnd: '2027-02-02' })).toBe('2026-11-05');
    expect(acceptedOn({ protectionEnd: null })).toBeNull();
  });
});

describe('review target', () => {
  it('counts business days since the first submission', () => {
    expect(waitDays(base, '2026-11-06')).toBe(4);
    expect(waitDays({ ...base, registeredOn: '2026-11-06' }, '2026-11-09')).toBe(1);
  });

  it('is over the 2 business day target only on the third business day', () => {
    expect(isOverTarget(base, '2026-11-04')).toBe(false);
    expect(isOverTarget(base, '2026-11-05')).toBe(true);
  });

  it('restarts from the resubmission date and ignores decided registrations', () => {
    expect(reviewSince({ ...base, resubmittedOn: '2026-11-05' })).toBe('2026-11-05');
    expect(isOverTarget({ ...base, resubmittedOn: '2026-11-05' }, '2026-11-06')).toBe(false);
    expect(isOverTarget({ ...base, status: 'accepted' as const }, '2026-11-30')).toBe(false);
  });
});

describe('protectionView', () => {
  it('describes a waiting registration, flagging the target only in the deals list', () => {
    expect(protectionView({ ...base, registeredOn: '2026-11-06' }, 'deals', '2026-11-06')).toEqual({ until: 'Sent today', left: '', cls: 't-muted' });
    expect(protectionView(base, 'deals', '2026-11-06')).toEqual({ until: 'Waiting 4 days', left: 'over 2-day target', cls: 't-amber' });
    expect(protectionView(base, 'overview', '2026-11-06')).toEqual({ until: 'Waiting 4 days', left: '', cls: 't-amber' });
    expect(protectionView({ ...base, resubmittedOn: '2026-11-06' }, 'deals', '2026-11-06')).toEqual({ until: 'Resent today', left: '', cls: 't-muted' });
  });

  it('shows days left for protected deals and turns amber at 14 days', () => {
    const accepted = { ...base, status: 'accepted' as const, stage: 'Discovery' };
    expect(protectionView({ ...accepted, protectionEnd: '2027-01-12' }, 'deals', '2026-11-06')).toEqual({ until: '12 Jan 2027', left: '67d', cls: 't-ink' });
    expect(protectionView({ ...accepted, protectionEnd: '2026-11-20' }, 'deals', '2026-11-06')).toEqual({ until: '20 Nov 2026', left: '14d', cls: 't-amber' });
  });

  it('describes closed, expired and rejected registrations', () => {
    expect(protectionView({ ...base, status: 'won' as const, closedOn: '2026-09-19' }, 'deals', '2026-11-06').until).toBe('Closed 19 Sep');
    expect(protectionView({ ...base, status: 'expired' as const, closedOn: '2026-07-30' }, 'deals', '2026-11-06').until).toBe('Ended 30 Jul');
    expect(protectionView({ ...base, status: 'rejected' as const }, 'deals', '2026-11-06').until).toBe('Not protected');
  });
});

describe('stageTrack', () => {
  it('starts at Registered for a pending registration', () => {
    expect(stageTrack(base)?.map((s) => [s.label, s.state])).toEqual([
      ['Registered', 'now'], ['Accepted', 'todo'], ['Technical evaluation', 'todo'], ['Proposal sent', 'todo'], ['Closed', 'todo'],
    ]);
  });

  it('adds Discovery only when the deal is in it, and closes a won deal', () => {
    const discovery = stageTrack({ status: 'accepted', stage: 'Discovery' });
    expect(discovery?.map((s) => s.label)).toContain('Discovery');
    expect(discovery?.find((s) => s.state === 'now')?.label).toBe('Discovery');
    const won = stageTrack({ status: 'won', stage: 'Closed won' });
    expect(won?.at(-1)).toEqual({ label: 'Closed won', state: 'done' });
  });

  it('has no track for rejected or expired registrations', () => {
    expect(stageTrack({ status: 'rejected', stage: 'Not accepted' })).toBeNull();
    expect(stageTrack({ status: 'expired', stage: 'Registration expired' })).toBeNull();
  });
});

describe('managerFor', () => {
  const managers = [
    { id: 'm-in', name: 'Farhan Qureshi', region: 'india' as const, team: 'CleanStart India' },
    { id: 'm-me', name: 'Omar Nasser', region: 'middle_east' as const, team: 'CleanStart Middle East' },
  ];
  it('picks the manager of the deal region, else the first, else nothing', () => {
    expect(managerFor(managers, 'middle_east')).toBe('m-me');
    expect(managerFor([managers[0]!], 'middle_east')).toBe('m-in');
    expect(managerFor([], 'india')).toBe('');
  });
});
