import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { brevoHandler } from './brevo';
import type { LeadHandlerContext, LeadSubmission } from './types';

const submission: LeadSubmission = {
  formId: 5,
  formSchemaVersion: 1,
  fields: { email: 'jane@example.com', name: 'Jane' },
  source: '/contact',
  utm: undefined,
  attribution: undefined,
  ip: undefined,
  userAgent: undefined,
  consent: undefined,
};

const makeCtx = (form: { name?: string; notifyTo?: { email: string }[] } | null = {
  name: 'Contact Us',
  notifyTo: [{ email: 'sales@cleanstart.com' }],
}): LeadHandlerContext => ({
  payload: {
    findByID: vi.fn().mockResolvedValue(form),
  } as unknown as LeadHandlerContext['payload'],
  leadId: 1,
  primarySucceeded: true,
  duplicateOfLeadId: undefined,
  formFieldDefs: [
    { name: 'email', type: 'email' },
    { name: 'name', type: 'text' },
  ],
});

beforeEach(() => {
  Reflect.deleteProperty(process.env, 'BREVO_API_KEY');
  Reflect.deleteProperty(process.env, 'BREVO_TEMPLATE_ID');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('brevoHandler', () => {
  it('skips when env not configured', async () => {
    const result = await brevoHandler.run(submission, makeCtx());
    expect(result).toMatchObject({ status: 'skipped', reason: 'env-not-configured' });
  });

  it('fails when BREVO_TEMPLATE_ID is non-numeric', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = 'nope';
    const result = await brevoHandler.run(submission, makeCtx());
    expect(result.status).toBe('failed');
  });

  it('skips when submission is a duplicate', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    const ctx = makeCtx();
    ctx.duplicateOfLeadId = 99;
    const result = await brevoHandler.run(submission, ctx);
    expect(result).toMatchObject({ status: 'skipped', reason: 'duplicate-submission' });
  });

  it('skips when form has no notifyTo recipients', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    const result = await brevoHandler.run(submission, makeCtx({ name: 'F', notifyTo: [] }));
    expect(result).toMatchObject({ status: 'skipped', reason: 'no-recipients' });
  });

  it('posts to Brevo and returns synced with messageId', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'abc-123' }),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const result = await brevoHandler.run(submission, makeCtx());
    expect(result).toEqual({ handler: 'brevo', status: 'synced', externalId: 'abc-123' });
    expect(fetchMock).toHaveBeenCalledOnce();
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error('fetch was not called');
    const init = call[1] as { body: string };
    const body = JSON.parse(init.body);
    expect(body.templateId).toBe(42);
    expect(body.to).toEqual([{ email: 'sales@cleanstart.com' }]);
    expect(body.replyTo).toEqual({ email: 'jane@example.com' });
    expect(body.params.formName).toBe('Contact Us');
    expect(body.params.visitorEmail).toBe('jane@example.com');
  });

  it('reports network errors as failed with timeout/network classification', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout exceeded')));
    const result = await brevoHandler.run(submission, makeCtx());
    expect(result).toMatchObject({ status: 'failed', error: 'timeout' });
  });

  it('reports HTTP error responses as failed', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'upstream',
      } as unknown as Response),
    );
    const result = await brevoHandler.run(submission, makeCtx());
    expect(result).toMatchObject({ status: 'failed' });
    if (result.status === 'failed') {
      expect(result.error).toMatch(/Brevo 500/);
    }
  });
});
