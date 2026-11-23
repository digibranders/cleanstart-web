import { beforeEach, describe, expect, it } from 'vitest';
import { applications, auditLog } from '@/db/schema';
import { asStaff, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { publicActor } from '@/server/auth/types';
import { FakeEmailTransport } from '@/server/email/fake';
import { approveApplication, createPortalApplication } from '@/server/repo/applications';
import { withSystem, withViewer } from '@/server/repo/context';
import { sendInviteReminders } from './invite-reminders';

const db = testDb();
beforeEach(() => resetDb(db));

const approvedOn = async (iso: string) => {
  const actor = publicActor('Neha');
  const clock = fixedClock(iso);
  const { application } = await withSystem(actor, (tx) =>
    createPortalApplication(
      tx,
      actor,
      {
        company: 'Tidewater Infosec', domain: 'tidewaterinfosec.in', applicantName: 'Neha Joshi', email: 'neha.joshi@tidewaterinfosec.in', role: null, phone: null,
        category: 'channel', region: 'india', reason: 'x', source: 'portal', sourceRef: null, personalEmail: false, existingDomain: false,
      },
      clock,
    ),
  );
  const staff = await asStaff(db, 'partner_manager', 'india');
  await withViewer(staff, (tx) => approveApplication(tx, staff, { id: application.id, category: 'channel', region: 'india' }, clock));
  return application;
};

describe('sendInviteReminders', () => {
  it('sends nothing before day 5, then one email with a fresh invite link, once', async () => {
    const application = await approvedOn('2026-11-12T10:00:00Z');
    const transport = new FakeEmailTransport();
    expect(await sendInviteReminders({ clock: fixedClock('2026-11-16T10:00:00Z'), transport })).toEqual({ sent: 0 });
    expect(await sendInviteReminders({ clock: fixedClock('2026-11-17T10:00:00Z'), transport })).toEqual({ sent: 1 });
    const mail = transport.only('neha.joshi@tidewaterinfosec.in');
    expect(mail.subject).toBe('Your CleanStart partner invite is waiting');
    expect(mail.htmlContent).toMatch(/accept-invite\?token=[\w-]{43}/u);
    expect(await sendInviteReminders({ clock: fixedClock('2026-11-18T10:00:00Z'), transport })).toEqual({ sent: 0 });
    expect(transport.sent).toHaveLength(1);
    const [row] = await db.select().from(applications);
    expect(row?.id).toBe(application.id);
    expect(row?.inviteReminderSentAt).toBeInstanceOf(Date);
    expect((await db.select().from(auditLog)).map((a) => a.event)).toContain('application.invite_reminder_sent');
  });

  it('sends once when two runs overlap', async () => {
    await approvedOn('2026-11-12T10:00:00Z');
    const transport = new FakeEmailTransport();
    const clock = fixedClock('2026-11-18T10:00:00Z');
    await Promise.all([sendInviteReminders({ clock, transport }), sendInviteReminders({ clock, transport })]);
    expect(transport.sent).toHaveLength(1);
  });
});
