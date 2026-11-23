import { buildRegistrationReceived } from './index';
import { describeTemplates } from './test-harness';

describeTemplates([
  {
    name: 'registration received',
    build: (f) =>
      buildRegistrationReceived({
        to: { email: 'partner@example.com', name: 'Partner' },
        customer: f('customer', 'Acme Bank'),
        productLabel: f('productLabel', 'Verified dependencies'),
        regionLabel: f('regionLabel', 'Europe'),
        dealsUrl: 'https://portal.example.com/partner/deals',
      }),
    subject: 'Registration received: Acme Bank',
    to: ['partner@example.com'],
    contains: ['Acme Bank', 'Verified dependencies', 'Europe', 'within 2 business days', 'https://portal.example.com/partner/deals'],
  },
]);
