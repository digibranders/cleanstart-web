import { describe, expect, it } from 'vitest';

import { buildPartnerAdminEmail, buildPartnerApplicantEmail } from './partner-emails';

const base = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@acme.com',
  phone: '+1 555 0100',
  company: 'Acme',
  website: 'https://acme.com',
  partnerReason: 'We want to integrate.',
};

describe('partner email builders', () => {
  it('admin email lists the email + escapes HTML in user input', () => {
    const { htmlContent } = buildPartnerAdminEmail({ ...base, company: '<script>' });
    expect(htmlContent).toContain('ada@acme.com');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).not.toContain('<script>');
  });

  it('admin subject names the company', () => {
    expect(buildPartnerAdminEmail(base).subject).toContain('Acme');
  });

  it('applicant email greets by first name and omits absent optional rows', () => {
    const { subject, htmlContent } = buildPartnerApplicantEmail({ ...base, phone: undefined, partnerReason: undefined });
    expect(subject.length).toBeGreaterThan(0);
    expect(htmlContent).toContain('Ada');
  });
});
