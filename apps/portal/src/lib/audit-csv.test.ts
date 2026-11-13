import { describe, expect, it } from 'vitest';
import type { AuditEntryDto } from '@/lib/dto';
import { auditToCsv, csvCell, fullTimestamp } from './audit-csv';

const entry = (over: Partial<AuditEntryDto> = {}): AuditEntryDto => ({
  id: 'e1',
  at: '2026-11-06T14:02:00.000Z',
  actorId: null,
  actorLabel: 'Omar Nasser',
  actorRole: 'Partner manager',
  whoKind: 'staff',
  kind: 'deal_decisions',
  event: 'registration.accepted',
  action: 'Accepted a registration',
  target: 'Pearl Gulf Bank, CleanSight',
  source: 'portal',
  before: null,
  after: null,
  note: 'Protected until 3 Feb 2027.',
  partnerId: null,
  ...over,
});

describe('csvCell', () => {
  it('quotes and doubles embedded quotes', () => {
    expect(csvCell('say "hi", now')).toBe('"say ""hi"", now"');
  });

  it.each(['=SUM(A1:A9)', '+1', '-2', '@cmd', '\tx'])('neutralises a formula start: %s', (value) => {
    expect(csvCell(value)).toBe(`"'${value}"`);
  });
});

describe('auditToCsv', () => {
  it('writes a header and one row per event with the source label', () => {
    const csv = auditToCsv([entry(), entry({ id: 'e2', actorRole: null, note: null, source: 'crm', target: '=HYPERLINK("x")' })]);
    expect(csv.split('\n')).toEqual([
      '"When","Who","Role","Action","On","Source","Details"',
      '"6 Nov 2026, 14:02","Omar Nasser","Partner manager","Accepted a registration","Pearl Gulf Bank, CleanSight","Portal","Protected until 3 Feb 2027."',
      '"6 Nov 2026, 14:02","Omar Nasser","","Accepted a registration","\'=HYPERLINK(""x"")","CRM",""',
    ]);
  });

  it('formats the timestamp in UTC like the drawer', () => {
    expect(fullTimestamp('2026-11-06T23:59:00.000Z')).toBe('6 Nov 2026, 23:59');
  });
});
