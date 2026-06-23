import { describe, expect, it } from 'vitest';
import { buildDealName, buildDealProperties } from './deal-name';
import type { DealRegistrationSubmission } from './schema';

const sub: DealRegistrationSubmission = {
  partnerName: 'Acme Partners',
  partnerRep: { firstName: 'Jane', lastName: 'Doe', email: 'jane@acme.com', phone: '555' },
  prospect: { firstName: 'Sam', lastName: 'Lee', email: 'sam@prospect.com' },
  dealDetails: 'K8s images',
};

describe('buildDealName', () => {
  it('combines prospect name and partner name', () => {
    expect(buildDealName(sub)).toBe('Sam Lee — Acme Partners');
  });
});

describe('buildDealProperties', () => {
  it('maps to HubSpot deal properties with pipeline + stage', () => {
    const props = buildDealProperties(sub, { pipeline: 'default', stage: 'appointmentscheduled' });
    expect(props).toMatchObject({
      dealname: 'Sam Lee — Acme Partners',
      pipeline: 'default',
      dealstage: 'appointmentscheduled',
      partner_name: 'Acme Partners',
      partner_rep_name: 'Jane Doe',
      partner_rep_email: 'jane@acme.com',
      deal_details: 'K8s images',
    });
  });
  it('omits deal_details when absent', () => {
    const { dealDetails: _omit, ...noDetails } = sub;
    const props = buildDealProperties(noDetails, { pipeline: 'p', stage: 's' });
    expect('deal_details' in props).toBe(false);
  });
});
