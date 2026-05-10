import { describe, expect, it, vi } from 'vitest';

import { dbPrimaryHandler } from './db-primary';
import type { LeadHandlerContext, LeadSubmission } from './types';

const baseSubmission: LeadSubmission = {
  formId: 1,
  formSchemaVersion: 2,
  fields: { email: 'jane@example.com', name: 'Jane' },
  source: '/contact',
  utm: { campaign: 'spring', source: 'twitter' },
  ip: '1.2.3.4',
  userAgent: 'curl/8',
  consent: {
    givenAt: '2026-05-01T00:00:00.000Z',
    snapshot: 'I agree',
    policyVersion: 'v3',
    categories: ['marketing'],
  },
};

const makeCtx = (
  overrides: Partial<{ findDocs: { id: number; fields: Record<string, unknown> }[]; createdId: number }> = {},
): { ctx: LeadHandlerContext; spies: { find: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> } } => {
  const find = vi.fn().mockResolvedValue({ docs: overrides.findDocs ?? [] });
  const create = vi
    .fn()
    .mockResolvedValue({ id: overrides.createdId ?? 100 });
  return {
    spies: { find, create },
    ctx: {
      payload: { find, create } as unknown as LeadHandlerContext['payload'],
      leadId: undefined,
      primarySucceeded: false,
      duplicateOfLeadId: undefined,
      formFieldDefs: [
        { name: 'email', type: 'email' },
        { name: 'name', type: 'text' },
      ],
    },
  };
};

describe('dbPrimaryHandler', () => {
  it('creates a lead row and stamps ctx.leadId on success', async () => {
    const { ctx, spies } = makeCtx({ createdId: 555 });
    const result = await dbPrimaryHandler.run(baseSubmission, ctx);
    expect(result).toEqual({ handler: 'db-primary', status: 'synced', externalId: '555' });
    expect(ctx.leadId).toBe(555);
    expect(spies.create).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        overrideAccess: true,
        data: expect.objectContaining({
          form: 1,
          formSchemaVersion: 2,
          ip: '1.2.3.4',
          userAgent: 'curl/8',
          duplicateOf: null,
          syncedTo: [],
        }),
      }),
    );
  });

  it('flattens utm fields with null fallback', async () => {
    const { ctx, spies } = makeCtx();
    const submission = { ...baseSubmission, utm: { campaign: 'x' } };
    await dbPrimaryHandler.run(submission, ctx);
    const data = (spies.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
    expect(data.utm).toEqual({
      campaign: 'x',
      source: null,
      medium: null,
      term: null,
      content: null,
    });
  });

  it('flags duplicate when same email on same form within 24h', async () => {
    const { ctx, spies } = makeCtx({
      findDocs: [{ id: 11, fields: { email: 'jane@example.com', name: 'Jane' } }],
    });
    await dbPrimaryHandler.run(baseSubmission, ctx);
    expect(ctx.duplicateOfLeadId).toBe(11);
    const dupData = (spies.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
    expect(dupData.duplicateOf).toBe(11);
  });

  it('does not flag duplicate when emails differ', async () => {
    const { ctx } = makeCtx({
      findDocs: [{ id: 11, fields: { email: 'someone-else@example.com' } }],
    });
    await dbPrimaryHandler.run(baseSubmission, ctx);
    expect(ctx.duplicateOfLeadId).toBeUndefined();
  });

  it('skips dedup lookup when no email field present', async () => {
    const { ctx, spies } = makeCtx();
    const submission = {
      ...baseSubmission,
      fields: { name: 'Jane' },
    };
    await dbPrimaryHandler.run(submission, ctx);
    expect(spies.find).not.toHaveBeenCalled();
  });

  it('persists consent metadata as a list of category objects', async () => {
    const { ctx, spies } = makeCtx();
    await dbPrimaryHandler.run(baseSubmission, ctx);
    const data = (spies.create.mock.calls[0]?.[0] as { data: Record<string, unknown> }).data;
    expect(data.consentGivenAt).toBe('2026-05-01T00:00:00.000Z');
    expect(data.consentSnapshot).toBe('I agree');
    expect(data.privacyPolicyVersion).toBe('v3');
    expect(data.consentCategories).toEqual([{ category: 'marketing' }]);
  });
});
