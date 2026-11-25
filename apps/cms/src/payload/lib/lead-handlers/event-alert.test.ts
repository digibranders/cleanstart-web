import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendBrevoEmail } from '../email/brevo';
import { buildAnswerRows, eventAlertHandler } from './event-alert';
import type { LeadSubmission } from './types';

vi.mock('../email/brevo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../email/brevo')>()),
  sendBrevoEmail: vi.fn(async () => ({ status: 'synced' as const })),
}));

const defs = [
  { name: 'full_name', type: 'text', label: 'Full Name' },
  { name: 'designation', type: 'text', label: 'Designation' },
  { name: 'company', type: 'text', label: 'Company Name' },
  { name: 'phone', type: 'tel', label: 'Phone Number' },
  {
    name: 'cab_required',
    type: 'select',
    label: 'Cab Required',
    options: [
      { label: 'Yes please', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  { name: 'pickup_location', type: 'text', label: 'Pick up location' },
];

const submission = (overrides: Partial<LeadSubmission> = {}): LeadSubmission => ({
  formId: 12,
  formSchemaVersion: 1,
  fields: {
    full_name: 'Asha <b>Rao</b>',
    designation: 'CISO',
    company: 'Northwind',
    phone: '+919820012345',
    cab_required: 'yes',
  },
  source: 'event:new-year-networking-event',
  utm: undefined,
  attribution: undefined,
  ip: undefined,
  userAgent: undefined,
  consent: undefined,
  ...overrides,
});

const ctx = (notifyTo: { email: string }[] | null = [{ email: 'a@x.com' }, { email: 'b@x.com' }], extra = {}) =>
  ({
    payload: {
      findByID: vi.fn(async () => ({ notifyTo })),
      find: vi.fn(async () => ({
        docs: [{ id: 3, title: 'New Year Networking Event', updatedAt: '2026-11-25T06:00:00.000Z', partners: [{ name: 'Upwind' }] }],
      })),
      count: vi.fn(async () => ({ totalDocs: 7 })),
    },
    primarySucceeded: true,
    leadId: 55,
    duplicateOfLeadId: undefined,
    formFieldDefs: defs,
    ...extra,
  }) as unknown as Parameters<typeof eventAlertHandler.run>[1];

beforeEach(() => vi.mocked(sendBrevoEmail).mockClear());

describe('eventAlertHandler', () => {
  it('emails every recipient on the form with the event in the subject', async () => {
    const result = await eventAlertHandler.run(submission(), ctx());
    expect(result).toMatchObject({ status: 'synced' });
    const sent = vi.mocked(sendBrevoEmail).mock.calls[0]?.[0];
    expect(sent?.to).toEqual([{ email: 'a@x.com' }, { email: 'b@x.com' }]);
    expect(sent?.subject).toBe('New registration: Asha <b>Rao</b> for New Year Networking Event');
  });

  it('shows the answers by label, the count, the banner and the CMS link, and escapes input', async () => {
    await eventAlertHandler.run(submission(), ctx());
    const html = vi.mocked(sendBrevoEmail).mock.calls[0]?.[0]?.htmlContent ?? '';
    expect(html).toContain('Yes please');
    expect(html).toContain('registration number 7');
    expect(html).toContain('/api/eventPages/banner/new-year-networking-event?v=');
    expect(html).toContain('/admin/collections/eventPages/3');
    expect(html).toContain('Hosted by CleanStart, Upwind');
    expect(html).not.toContain('<b>Rao</b>');
  });

  it('skips a lead that is not from an event', async () => {
    const result = await eventAlertHandler.run(submission({ source: 'https://www.cleanstart.com/contact-us' }), ctx());
    expect(result).toMatchObject({ status: 'skipped', reason: 'not-an-event' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('skips when the form has no recipients', async () => {
    const result = await eventAlertHandler.run(submission(), ctx([]));
    expect(result).toMatchObject({ status: 'skipped', reason: 'no-recipients' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('skips a duplicate submission', async () => {
    const result = await eventAlertHandler.run(submission(), ctx(undefined, { duplicateOfLeadId: 9 }));
    expect(result).toMatchObject({ status: 'skipped', reason: 'duplicate-submission' });
  });

  it('reports a send failure instead of throwing', async () => {
    vi.mocked(sendBrevoEmail).mockResolvedValueOnce({ status: 'failed', error: 'boom' });
    const result = await eventAlertHandler.run(submission(), ctx());
    expect(result).toMatchObject({ status: 'failed', error: 'boom' });
  });
});

describe('buildAnswerRows', () => {
  it('uses option labels and the form order, and leaves consent out', () => {
    const rows = buildAnswerRows(
      [...defs, { name: 'agree', type: 'consent', label: 'Agree' }],
      { cab_required: 'no', full_name: 'A', agree: true },
    );
    expect(rows.map(([label]) => label)).toEqual(defs.map((d) => d.label));
    expect(rows.find(([label]) => label === 'Cab Required')?.[1]).toBe('No');
  });
});
