import { desc } from 'drizzle-orm';
import { beforeEach, describe, expect, it } from 'vitest';
import { auditLog } from '@/db/schema';
import { asPartner, asStaff, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { SYSTEM_ACTORS } from '@/server/auth/types';
import { withSystem, withViewer } from '@/server/repo/context';
import { AUDIT_EVENT_NAMES, AUDIT_EVENTS } from './events';
import { recordAudit } from './record';

const latest = async () => {
  const rows = await withSystem(SYSTEM_ACTORS.portal, (tx) => tx.select().from(auditLog).orderBy(desc(auditLog.at)).limit(1));
  const row = rows[0];
  if (!row) throw new Error('no audit row');
  return row;
};

describe('recordAudit', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('writes a staff entry with the role label and the event vocabulary', async () => {
    const staff = await asStaff(testDb(), 'partner_manager', 'india');
    const partner = await makePartner(testDb(), { name: 'Kestrel Systems' });
    await withViewer(staff, (tx) =>
      recordAudit(tx, staff, {
        event: 'registration.accepted',
        target: 'Vardhan Capital, CleanSight, from Kestrel Systems',
        note: 'Protected until 2027-01-12.',
        partnerId: partner.id,
        subject: { type: 'registration', id: 'r1' },
      }),
    );
    const row = await latest();
    expect(row).toMatchObject({
      actorId: staff.id,
      actorLabel: staff.name,
      actorRole: 'Partner manager',
      who: 'staff',
      kind: 'deal_decisions',
      event: 'registration.accepted',
      action: 'Accepted a registration',
      target: 'Vardhan Capital, CleanSight, from Kestrel Systems',
      text: 'Accepted a registration: Vardhan Capital, CleanSight, from Kestrel Systems',
      source: 'portal',
      note: 'Protected until 2027-01-12.',
      partnerId: partner.id,
      subjectType: 'registration',
      subjectId: 'r1',
    });
  });

  it('writes a partner entry inside the partner transaction even though the partner cannot read audit_log', async () => {
    const partner = await asPartner(testDb(), { role: 'partner_admin' });
    await withViewer(partner, (tx) => recordAudit(tx, partner, { event: 'team.invited', target: 'Vikram Sethi, sales' }));
    const row = await latest();
    expect(row).toMatchObject({ who: 'partner', kind: 'people_access', actorRole: `${partner.partnerName}, partner admin` });
  });

  it('marks system actors as sync and the HubSpot sync as source system unless told otherwise', async () => {
    await withSystem(SYSTEM_ACTORS.hubspot, (tx) =>
      recordAudit(tx, SYSTEM_ACTORS.hubspot, { event: 'registration.stage_changed', target: 'Vardhan Capital', source: 'crm' }),
    );
    expect(await latest()).toMatchObject({ actorId: null, actorLabel: 'HubSpot sync', who: 'sync', source: 'crm' });
    await withSystem(SYSTEM_ACTORS.portal, (tx) => recordAudit(tx, SYSTEM_ACTORS.portal, { event: 'registration.expired', target: 'Acme' }));
    expect(await latest()).toMatchObject({ who: 'sync', source: 'system' });
  });

  it('has an action text and a kind for every event name', () => {
    expect(AUDIT_EVENT_NAMES.length).toBeGreaterThan(40);
    for (const name of AUDIT_EVENT_NAMES) {
      expect(AUDIT_EVENTS[name].action.length).toBeGreaterThan(3);
    }
  });
});
