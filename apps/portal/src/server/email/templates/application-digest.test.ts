import { describe, expect, it } from 'vitest';
import { buildApplicationDigest } from './index';
import { describeTemplates } from './test-harness';

describeTemplates([
  {
    name: 'application digest',
    build: (f) =>
      buildApplicationDigest({
        to: { email: 'maya@cleanstart.example', name: 'Maya' },
        recipientName: f('recipientName', 'Maya'),
        applications: [
          { company: f('company', 'Orbit Labs'), applicantName: f('applicantName', 'Ravi'), categoryLabel: f('categoryLabel', 'Channel'), waitingBusinessDays: 4 },
          { company: 'Delta Networks', applicantName: 'Sana', categoryLabel: null, waitingBusinessDays: 3 },
        ],
        targetBusinessDays: 2,
        applicationsUrl: 'https://portal.example.com/admin/partners?astatus=new',
      }),
    subject: 'Application digest: 2 applications waiting',
    to: ['maya@cleanstart.example'],
    contains: ['Orbit Labs', 'Delta Networks', 'Waiting 4 business days', 'https://portal.example.com/admin/partners?astatus=new'],
  },
]);

describe('application digest copy', () => {
  it('uses the singular for one application', () => {
    const message = buildApplicationDigest({
      to: { email: 'a@b.example' },
      recipientName: 'A',
      applications: [{ company: 'X', applicantName: 'P', categoryLabel: null, waitingBusinessDays: 3 }],
      targetBusinessDays: 2,
      applicationsUrl: 'https://portal.example.com/admin/partners?astatus=new',
    });
    expect(message.subject).toBe('Application digest: 1 application waiting');
    expect(message.htmlContent).toContain('has waited more than 2 business days');
  });
});
