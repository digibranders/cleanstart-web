import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { sendBrevoEmail } from '../email/brevo';
import { confirmationHandler } from './confirmation';
import type { LeadSubmission } from './types';

vi.mock('../email/brevo', () => ({
  sendBrevoEmail: vi.fn(async () => ({ status: 'synced' as const })),
}));

const submission = (fields: Record<string, unknown> = {}): LeadSubmission => ({
  formId: 7,
  formSchemaVersion: 1,
  fields: { email: 'jane@acme.com', firstname: 'Jane', ...fields },
  source: 'https://www.cleanstart.com/book-a-demo',
  utm: undefined,
  attribution: undefined,
  ip: '1.2.3.4',
  userAgent: 'curl',
  consent: undefined,
});

const ctx = (slug: string | null, overrides: Record<string, unknown> = {}) =>
  ({
    payload: { findByID: vi.fn(async () => (slug ? { id: 7, slug } : null)) },
    primarySucceeded: true,
    leadId: 7,
    duplicateOfLeadId: undefined,
    formFieldDefs: [
      { name: 'email', type: 'email' },
      { name: 'firstname', type: 'text' },
    ],
    ...overrides,
  }) as unknown as Parameters<typeof confirmationHandler.run>[1];

beforeEach(() => vi.mocked(sendBrevoEmail).mockClear());
afterEach(() => vi.mocked(sendBrevoEmail).mockResolvedValue({ status: 'synced' }));

describe('confirmationHandler', () => {
  it.each([
    ['book-a-demo', 'Your CleanStart demo request'],
    ['contact', "We've received your message"],
    ['newsletter', "You're subscribed to CleanStart"],
  ])('sends the %s confirmation to the visitor', async (slug, subject) => {
    const result = await confirmationHandler.run(submission(), ctx(slug));
    expect(result).toMatchObject({ status: 'synced' });
    expect(sendBrevoEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: [{ email: 'jane@acme.com' }], subject }),
    );
  });

  it('greets by first name when the form collected one', async () => {
    await confirmationHandler.run(submission(), ctx('book-a-demo'));
    const html = vi.mocked(sendBrevoEmail).mock.calls[0]?.[0]?.htmlContent ?? '';
    expect(html).toContain('Thanks, Jane');
  });

  it('falls back to a neutral greeting with no name', async () => {
    const defs = [{ name: 'email', type: 'email' }];
    await confirmationHandler.run(
      { ...submission(), fields: { email: 'jane@acme.com' } },
      ctx('book-a-demo', { formFieldDefs: defs }),
    );
    const html = vi.mocked(sendBrevoEmail).mock.calls[0]?.[0]?.htmlContent ?? '';
    expect(html).toContain('Thanks for getting in touch');
  });

  it('sends nothing for a form with no template, so a new form cannot start emailing by accident', async () => {
    const result = await confirmationHandler.run(submission(), ctx('resource-capture'));
    expect(result).toMatchObject({ status: 'skipped' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('does not acknowledge a duplicate twice', async () => {
    const result = await confirmationHandler.run(
      submission(),
      ctx('book-a-demo', { duplicateOfLeadId: 3 }),
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'duplicate-submission' });
    expect(sendBrevoEmail).not.toHaveBeenCalled();
  });

  it('skips when the submission carries no email', async () => {
    const result = await confirmationHandler.run(
      { ...submission(), fields: { firstname: 'Jane' } },
      ctx('book-a-demo'),
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'no-email-field' });
  });

  it('reports a send failure rather than swallowing it', async () => {
    vi.mocked(sendBrevoEmail).mockResolvedValueOnce({ status: 'failed', error: 'brevo 500' });
    const result = await confirmationHandler.run(submission(), ctx('book-a-demo'));
    expect(result).toMatchObject({ status: 'failed', error: 'brevo 500' });
  });

  it('survives a form lookup failure without throwing into the chain', async () => {
    const broken = ctx('book-a-demo', {
      payload: { findByID: vi.fn(async () => { throw new Error('db down'); }) },
    });
    const result = await confirmationHandler.run(submission(), broken);
    expect(result).toMatchObject({ status: 'skipped', reason: 'form-lookup-failed' });
  });
});
