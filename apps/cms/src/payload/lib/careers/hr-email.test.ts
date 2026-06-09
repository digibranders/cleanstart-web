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

  it('shows the role-location row when provided and omits it otherwise', () => {
    const withLoc = buildHrApplicationEmail({ ...base, jobLocation: 'Remote · Austin' });
    expect(withLoc.htmlContent).toContain('Role location');
    expect(withLoc.htmlContent).toContain('Remote · Austin');

    const withoutLoc = buildHrApplicationEmail({ ...base, jobLocation: undefined });
    expect(withoutLoc.htmlContent).not.toContain('Role location');
  });

  it('renders applicant location, how-they-heard, and a cover-letter-file note', () => {
    const { htmlContent } = buildHrApplicationEmail({
      ...base,
      location: 'Berlin, DE',
      howDidYouHear: 'LinkedIn',
      coverLetterAttached: true,
    });
    expect(htmlContent).toContain('Based in');
    expect(htmlContent).toContain('Berlin, DE');
    expect(htmlContent).toContain('Heard via');
    expect(htmlContent).toContain('LinkedIn');
    expect(htmlContent).toContain('Cover letter file attached');

    const without = buildHrApplicationEmail(base);
    expect(without.htmlContent).not.toContain('Based in');
    expect(without.htmlContent).not.toContain('Heard via');
    expect(without.htmlContent).not.toContain('Cover letter file attached');
  });
});
