import { describe, expect, it } from 'vitest';

import { buildHrApplicationEmail } from './hr-email';

describe('buildHrApplicationEmail', () => {
  const base = {
    jobTitle: 'Senior Engineer',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+1 555 0100',
    coverLetter: 'I build engines.',
    linkedinUrl: 'https://linkedin.com/in/ada',
  };

  it('puts the job title in the subject', () => {
    const { subject } = buildHrApplicationEmail(base);
    expect(subject).toContain('Senior Engineer');
  });

  it('includes applicant details and escapes HTML in user input', () => {
    const { htmlContent } = buildHrApplicationEmail({ ...base, firstName: '<script>' });
    expect(htmlContent).toContain('ada@example.com');
    expect(htmlContent).toContain('&lt;script&gt;');
    expect(htmlContent).not.toContain('<script>');
  });

  it('omits optional rows when absent', () => {
    const { htmlContent } = buildHrApplicationEmail({ ...base, phone: undefined, linkedinUrl: undefined, coverLetter: undefined });
    expect(htmlContent).not.toContain('LinkedIn');
  });

  it('shows the location row when provided and omits it otherwise', () => {
    const withLoc = buildHrApplicationEmail({ ...base, jobLocation: 'Remote · Austin' });
    expect(withLoc.htmlContent).toContain('Location');
    expect(withLoc.htmlContent).toContain('Remote · Austin');

    const withoutLoc = buildHrApplicationEmail({ ...base, jobLocation: undefined });
    expect(withoutLoc.htmlContent).not.toContain('Location');
  });
});
