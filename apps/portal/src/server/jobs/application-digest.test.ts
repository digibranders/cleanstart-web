import { beforeEach, describe, expect, it } from 'vitest';
import { makeApplication, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { FakeEmailTransport } from '@/server/email/fake';
import { type OpenApplication, sendApplicationDigests, staleApplications } from './application-digest';

// Monday 2026-11-23, 10:05 IST.
const clock = fixedClock('2026-11-23T04:35:00Z');
const open = (over: Partial<OpenApplication>): OpenApplication => ({ company: 'Acme', applicantName: 'A', category: null, since: '2026-11-23', ...over });

describe('staleApplications', () => {
  it('keeps only applications past the 2 business day target, longest waiting first', () => {
    const rows = staleApplications(
      [
        open({ company: 'today', since: '2026-11-23' }),
        open({ company: 'two-days', since: '2026-11-19' }),
        open({ company: 'three-days', since: '2026-11-18', category: 'channel' }),
        open({ company: 'six-days', since: '2026-11-13' }),
      ],
      '2026-11-23',
    );
    expect(rows.map((r) => [r.company, r.waitingBusinessDays, r.categoryLabel])).toEqual([
      ['six-days', 6, null],
      ['three-days', 3, 'Channel partner'],
    ]);
  });

  it('does not count a weekend as waiting', () => {
    expect(staleApplications([open({ since: '2026-11-20' })], '2026-11-23')).toEqual([]);
  });
});

describe('sendApplicationDigests', () => {
  const db = testDb();
  beforeEach(() => resetDb(db));
  const days = (n: number): Date => new Date(Date.parse('2026-11-23T03:00:00Z') - n * 86_400_000);

  it('emails each active partner manager once about undecided applications waiting past the target, and nobody else', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'maya@cleanstart.example', name: 'Maya' });
    await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'gone@cleanstart.example', status: 'disabled' });
    await makeUser(db, { kind: 'staff', role: 'sales', email: 'sam@cleanstart.example' });
    await makeUser(db, { kind: 'staff', role: 'marketing', email: 'mia@cleanstart.example' });
    await makeApplication(db, { company: 'Stale Co', status: 'new', createdAt: days(6) });
    await makeApplication(db, { company: 'Fresh Co', status: 'new', createdAt: days(0) });
    await makeApplication(db, { company: 'Approved Co', status: 'approved', createdAt: days(10) });
    await makeApplication(db, { company: 'Declined Co', status: 'declined', createdAt: days(10) });
    const transport = new FakeEmailTransport();
    expect(await sendApplicationDigests({ clock, transport })).toEqual({ sent: 1 });
    expect(transport.sent).toHaveLength(1);
    const html = transport.to('maya@cleanstart.example')[0]?.htmlContent ?? '';
    expect(html).toContain('Stale Co');
    expect(html).not.toContain('Fresh Co');
    expect(html).not.toContain('Approved Co');
    expect(html).not.toContain('Declined Co');
  });

  it('sends nothing when no application waits past the target', async () => {
    await makeUser(db, { kind: 'staff', role: 'partner_manager', email: 'maya@cleanstart.example' });
    await makeApplication(db, { company: 'Fresh Co', status: 'new', createdAt: days(0) });
    await makeApplication(db, { company: 'Approved Co', status: 'approved', createdAt: days(10) });
    const transport = new FakeEmailTransport();
    expect(await sendApplicationDigests({ clock, transport })).toEqual({ sent: 0 });
    expect(transport.sent).toHaveLength(0);
  });
});
