import { describe, expect, it } from 'vitest';
import { PROTECTION_DAYS } from './dates';
import { acceptedOn, defaultRejectReason, describeCheck, isOverTarget, managerFor, protectionLength, protectionView, reviewSince, routingText, stageTrack, waitDays } from './derive';

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
    expect(acceptedOn({ protectionEnd: '2027-02-02', decidedOn: null })).toBe('2026-11-05');
    expect(acceptedOn({ protectionEnd: null, decidedOn: null })).toBeNull();
  });

  it('keeps the real acceptance day after an extension moves the end date', () => {
    expect(acceptedOn({ protectionEnd: '2027-02-11', decidedOn: '2026-10-15' })).toBe('2026-10-15');
  });

  it('counts a granted extension in the protection length', () => {
    expect(protectionLength({ extensionStatus: 'none', extensionDays: null })).toBe(90);
    expect(protectionLength({ extensionStatus: 'requested', extensionDays: null })).toBe(90);
    expect(protectionLength({ extensionStatus: 'declined', extensionDays: null })).toBe(90);
    expect(protectionLength({ extensionStatus: 'granted', extensionDays: 30 })).toBe(120);
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
    expect(protectionView(base, 'deals', '2026-11-06')).toEqual({ until: 'Pending 4 days', left: 'over 2-day target', cls: 't-amber' });
    expect(protectionView(base, 'overview', '2026-11-06')).toEqual({ until: 'Pending 4 days', left: '', cls: 't-amber' });
    expect(protectionView({ ...base, resubmittedOn: '2026-11-06' }, 'deals', '2026-11-06')).toEqual({ until: 'Resent today', left: '', cls: 't-muted' });
  });

  it('shows days left for protected deals and turns amber at 14 days', () => {
    const accepted = { ...base, status: 'accepted' as const, stage: 'Discovery' };
    expect(protectionView({ ...accepted, protectionEnd: '2027-01-12' }, 'deals', '2026-11-06')).toEqual({ until: '12 Jan 2027', left: '67 days left', cls: 't-ink' });
    expect(protectionView({ ...accepted, protectionEnd: '2026-11-20' }, 'deals', '2026-11-06')).toEqual({ until: '20 Nov 2026', left: '14 days left', cls: 't-amber' });
    expect(protectionView({ ...accepted, protectionEnd: '2026-11-07' }, 'deals', '2026-11-06').left).toBe('1 day left');
    expect(protectionView({ ...accepted, protectionEnd: '2026-11-06' }, 'deals', '2026-11-06').left).toBe('Ends today');
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

describe('describeCheck', () => {
  const deal = { partnerName: 'Kestrel Systems', registeredOn: '2026-11-03', product: 'images' as const };
  const rival = (over: Record<string, unknown> = {}) => ({
    kind: 'conflict' as const,
    other: {
      id: 'o', partnerName: 'Arbor Cyber', product: 'images' as const, status: 'pending' as const,
      registeredOn: '2026-11-05', protectionEnd: null, registeredFirst: false, ...over,
    },
  });

  it('says who was first when two partners wait', () => {
    expect(describeCheck(deal, rival())).toMatchObject({
      kind: 'conflict', label: 'Conflict', tone: 'pending', whyCls: 'why why-amber',
      why: 'Arbor Cyber also registered it on 5 Nov. Kestrel was first.',
    });
    expect(describeCheck(deal, rival({ registeredFirst: true })).why).toBe('Arbor Cyber registered it first, on 5 Nov.');
  });

  it('says the other partner already holds an accepted registration', () => {
    const accepted = rival({ status: 'accepted', protectionEnd: '2027-02-02', registeredFirst: true });
    expect(describeCheck(deal, accepted).why).toBe('Arbor Cyber already holds this, protected until 2 Feb 2027.');
  });

  it('reports the same customer under another product the partner already holds', () => {
    const info = { kind: 'info' as const, other: { id: 'o', partnerName: 'Kestrel Systems', product: 'libraries' as const, status: 'accepted' as const, registeredOn: '2026-10-01', protectionEnd: '2027-01-12', registeredFirst: false } };
    expect(describeCheck(deal, info)).toMatchObject({ kind: 'info', label: 'Same customer', tone: 'violet', why: 'Kestrel already holds Clean Libraries here, until 12 Jan 2027.', whyCls: 'why' });
  });

  it('is clear without a conflict, and a HubSpot hint turns a clear row into a conflict', () => {
    expect(describeCheck(deal, { kind: 'none' })).toMatchObject({ kind: 'none', label: 'Clear', tone: 'accepted', why: '' });
    const hinted = describeCheck(deal, { kind: 'none' }, { registrationId: 'r', holder: 'Dunes Networks', openDeals: 1 });
    expect(hinted).toMatchObject({ kind: 'conflict', why: 'Dunes Networks already has an open deal for this customer in HubSpot.' });
    expect(describeCheck(deal, { kind: 'none' }, { registrationId: 'r', holder: null, openDeals: 2 }).why).toBe('Another partner already has an open deal for this customer in HubSpot.');
  });

  it('keeps a portal conflict when HubSpot also reports one', () => {
    expect(describeCheck(deal, rival(), { registrationId: 'r', holder: 'X', openDeals: 1 }).why).toContain('Arbor Cyber');
  });
});

describe('defaultRejectReason', () => {
  it('pre-fills the reason when another partner registered first, and is empty otherwise', () => {
    const deal = { partnerName: 'Kestrel Systems', registeredOn: '2026-11-05', product: 'images' as const };
    const first = describeCheck(deal, { kind: 'conflict', other: { id: 'o', partnerName: 'Arbor Cyber', product: 'images', status: 'pending', registeredOn: '2026-11-03', protectionEnd: null, registeredFirst: true } });
    expect(defaultRejectReason(deal, first)).toBe('Another partner registered this customer for CleanStart Images on 3 Nov.');
    expect(defaultRejectReason(deal, describeCheck(deal, { kind: 'none' }))).toBe('');
  });
});

describe('routingText', () => {
  const m = (name: string, region: 'india' | 'middle_east' | 'all') => ({ id: name, name, region, team: 'x' });
  it('names the manager each region goes to', () => {
    expect(routingText([m('Farhan Qureshi', 'india'), m('Omar Nasser', 'middle_east')])).toBe('India goes to Farhan, Middle East to Omar.');
    expect(routingText([m('Farhan Qureshi', 'india')])).toBe('India goes to Farhan.');
    expect(routingText([])).toBe('');
  });
});
