import { describe, expect, it } from 'vitest';

import {
  buildDealRegistrationNotificationEmail,
  type DealRegistrationNotificationInput,
} from './notification-email';

const base: DealRegistrationNotificationInput = {
  partnerName: 'Global Cybersecurity Innovation Pvt Ltd',
  partnerRep: { firstName: 'Leeshma', lastName: 'Madaiah', email: 'leeshma@thegcsi.com', phone: '+1 555 010 0001' },
  prospect: { firstName: 'Vinya', lastName: 'Ramananda', email: 'vinya@wipro.com', phone: '+1 555 010 0002' },
  dealDetails: 'Container Images',
};

describe('buildDealRegistrationNotificationEmail', () => {
  it('builds the deal-name subject as {prospect} — {partner}', () => {
    expect(buildDealRegistrationNotificationEmail(base).subject).toBe(
      'New partner deal registration — Vinya Ramananda — Global Cybersecurity Innovation Pvt Ltd',
    );
  });

  it('includes partner, rep, prospect and deal details in the body', () => {
    const { htmlContent } = buildDealRegistrationNotificationEmail(base);
    expect(htmlContent).toContain('Global Cybersecurity Innovation Pvt Ltd');
    expect(htmlContent).toContain('Leeshma Madaiah');
    expect(htmlContent).toContain('leeshma@thegcsi.com');
    expect(htmlContent).toContain('vinya@wipro.com');
    expect(htmlContent).toContain('Container Images');
  });

  it('HTML-escapes submitter-supplied values', () => {
    const { htmlContent } = buildDealRegistrationNotificationEmail({ ...base, partnerName: '<script>x</script>' });
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).not.toContain('<script>x</script>');
  });

  it('renders the HubSpot deal link only when dealId + portalId are present', () => {
    const withLink = buildDealRegistrationNotificationEmail({ ...base, dealId: '333564186301', portalId: '245478611' });
    expect(withLink.htmlContent).toContain(
      'https://app.hubspot.com/contacts/245478611/record/0-3/333564186301',
    );
    expect(withLink.htmlContent).toContain('Open the deal in HubSpot');

    const withoutLink = buildDealRegistrationNotificationEmail(base);
    expect(withoutLink.htmlContent).not.toContain('app.hubspot.com');
    expect(withoutLink.htmlContent).not.toContain('Open the deal in HubSpot');
  });

  it('omits optional rows (phone, details) when absent', () => {
    const { htmlContent } = buildDealRegistrationNotificationEmail({
      ...base,
      partnerRep: { firstName: 'Leeshma', lastName: 'Madaiah', email: 'leeshma@thegcsi.com' },
      prospect: { firstName: 'Vinya', lastName: 'Ramananda', email: 'vinya@wipro.com' },
      dealDetails: undefined,
    });
    expect(htmlContent).not.toContain('Rep phone');
    expect(htmlContent).not.toContain('Prospect phone');
    expect(htmlContent).not.toContain('Deal details');
  });
});
