import { describe, expect, it } from 'vitest';
import { buildPendingDigest } from './index';
import { describeTemplates } from './test-harness';

describeTemplates([
  {
    name: 'pending digest',
    build: (f) =>
      buildPendingDigest({
        to: { email: 'maya@cleanstart.example', name: 'Maya' },
        recipientName: f('recipientName', 'Maya'),
        registrations: [
          { customer: f('customer', 'Acme Bank'), partnerName: f('partnerName', 'Kestrel'), productLabel: 'Images', regionLabel: 'India', waitingBusinessDays: 5, pastTarget: true, overdue: true },
        ],
        targetBusinessDays: 2,
        approvalsUrl: 'https://portal.example.com/admin/approvals',
      }),
    subject: 'Review digest: 1 registration waiting, 1 overdue',
    to: ['maya@cleanstart.example'],
    contains: ['Acme Bank', 'OVERDUE', 'Waiting 5 business days', 'https://portal.example.com/admin/approvals'],
  },
]);

describe('pending digest copy', () => {
  it('omits the overdue note', () => {
    const message = buildPendingDigest({
      to: { email: 'a@b.example' },
      recipientName: 'A',
      registrations: [{ customer: 'X', partnerName: 'P', productLabel: 'Images', regionLabel: 'India', waitingBusinessDays: 3, pastTarget: true, overdue: false }],
      targetBusinessDays: 2,
      approvalsUrl: 'https://portal.example.com/admin/approvals',
    });
    expect(message.subject).toBe('Review digest: 1 registration waiting');
    expect(message.htmlContent).toContain('past the target');
    expect(message.htmlContent).not.toContain('OVERDUE');
  });
});
