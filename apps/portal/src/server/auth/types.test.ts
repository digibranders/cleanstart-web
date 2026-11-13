import { describe, expect, it } from 'vitest';
import { publicActor, roleKey, SYSTEM_ACTORS, type Viewer } from './types';

const partner: Viewer = { id: 'u1', kind: 'partner', role: 'sales', partnerId: 'p1', partnerName: 'Kestrel Systems', email: 'a@b.co', name: 'A' };
const staff: Viewer = { id: 'u2', kind: 'staff', role: 'partner_manager', partnerId: null, partnerName: null, region: 'all', email: 'c@d.co', name: 'C' };

describe('auth types', () => {
  it('builds the role key from kind and role', () => {
    expect(roleKey(partner)).toBe('partner.sales');
    expect(roleKey(staff)).toBe('staff.partner_manager');
  });

  it('describes the system actors for the audit log', () => {
    expect(SYSTEM_ACTORS.hubspot).toEqual({ kind: 'system', label: 'HubSpot sync', who: 'sync', roleLabel: 'Automatic sync' });
    expect(publicActor('Neha Joshi')).toEqual({ kind: 'system', label: 'Neha Joshi', who: 'partner', roleLabel: 'Applicant' });
  });
});
