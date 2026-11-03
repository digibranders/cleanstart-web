import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendBrevoEmail } from '../email/brevo';
import { notificationHandler } from './notification';
import type { LeadSubmission } from './types';

vi.mock('../email/brevo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../email/brevo')>()),
  sendBrevoEmail: vi.fn(async () => ({ status: 'synced' as const })),
}));

const submission = (fields: Record<string, unknown> = {}): LeadSubmission => ({
  formId: 10,
  formSchemaVersion: 1,
  fields: {
    firstname: 'Priya',
    lastname: 'Nair',
    email: 'priya@acme.com',
    company: 'Acme <b>Corp</b>',
    jobtitle: 'Head of Platform',
    ...fields,
  },
  source: 'https://www.cleanstart.com/cleansight-campaign',
  utm: { campaign: 'cleansight-q4' },
  attribution: undefined,
  ip: '1.2.3.4',
  userAgent: 'curl',
  consent: undefined,
});

const ctx = (slug: string | null, overrides: Record<string, unknown> = {}) =>
  ({
    payload: { findByID: vi.fn(async () => (slug ? { id: 10, slug } : null)) },
    primarySucceeded: true,
    leadId: 55,
    duplicateOfLeadId: undefined,
    formFieldDefs: [{ name: 'email', type: 'email' }],
    ...overrides,
  }) as unknown as Parameters<typeof notificationHandler.run>[1];

beforeEach(() => vi.mocked(sendBrevoEmail).mockClear());
afterEach(() => vi.mocked(sendBrevoEmail).mockResolvedValue({ status: 'synced' }));

describe('notificationHandler', () => {
  it('alerts marketing@ about a scan request, replying to the visitor', async () => {
    const result = await notificationHandler.run(submission(), ctx('cleansight-campaign'));
    expect(result).toMatchObject({ status: 'synced' });
    expect(sendBrevoEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: [{ email: 'marketing@cleanstart.com' }],
        replyTo: { email: 'priya@acme.com' },
        senderName: 'CleanStart',
        subject: expect.stringContaining('Priya Nair'),
      }),
    );
  });

  it('carries the details, a CMS link, and escapes visitor input', async () => {
    await notificationHandler.run(submission(), ctx('cleansight-campaign'));
    const html = vi.mocked(sendBrevoEmail).mock.calls[0]?.[0]?.htmlContent ?? '';
    expect(html).toContain('Head of Platform');
    expect(html).toContain('cleansight-q4');
    expect(html).toContain('/admin/collections/leads/55');
    expect(html).not.toContain('<b>Corp</b>');
  });

  it('sends nothing for a form with no alert', async () => {
    const result = await notificationHandler.run(submission(), ctx('contact'));
    expect(result).toMatchObject({ status: 'skipped' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('does not alert twice for a duplicate', async () => {
    const result = await notificationHandler.run(
      submission(),
      ctx('cleansight-campaign', { duplicateOfLeadId: 3 }),
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'duplicate-submission' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('reports a failed send instead of throwing', async () => {
    vi.mocked(sendBrevoEmail).mockResolvedValueOnce({ status: 'failed', error: 'brevo 500' });
    const result = await notificationHandler.run(submission(), ctx('cleansight-campaign'));
    expect(result).toEqual({ handler: 'notification-email', status: 'failed', error: 'brevo 500' });
  });
});
