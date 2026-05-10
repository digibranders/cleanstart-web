import { describe, expect, it, vi } from 'vitest';

import { companyFromDomainHandler } from './company-from-domain';
import type { LeadHandlerContext, LeadSubmission } from './types';

const makeSubmission = (
  fields: Record<string, unknown> = { email: 'cto@acme-corp.com' },
): LeadSubmission => ({
  formId: 1,
  formSchemaVersion: 1,
  fields,
  source: undefined,
  utm: undefined,
  ip: undefined,
  userAgent: undefined,
  consent: undefined,
});

const makeCtx = (
  leadId: number | undefined = 7,
  existing: Record<string, unknown> | null = null,
): { ctx: LeadHandlerContext; findByID: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } => {
  const findByID = vi.fn().mockResolvedValue(existing ? { enriched: existing } : { enriched: null });
  const update = vi.fn().mockResolvedValue({});
  return {
    findByID,
    update,
    ctx: {
      payload: { findByID, update } as unknown as LeadHandlerContext['payload'],
      leadId,
      primarySucceeded: true,
      duplicateOfLeadId: undefined,
      formFieldDefs: [{ name: 'email', type: 'email' }],
    },
  };
};

describe('companyFromDomainHandler', () => {
  it('skips when leadId is not set (primary failed earlier)', async () => {
    const { ctx } = makeCtx();
    ctx.leadId = undefined;
    const result = await companyFromDomainHandler.run(makeSubmission(), ctx);
    expect(result).toMatchObject({ status: 'skipped', reason: 'no-lead-id' });
  });

  it('skips when no email field is present', async () => {
    const { ctx } = makeCtx(7);
    const result = await companyFromDomainHandler.run(makeSubmission({ name: 'Jane' }), ctx);
    expect(result).toMatchObject({ status: 'skipped', reason: 'no-email-field' });
  });

  it('skips a free-mail address (gmail) without writing', async () => {
    const { ctx, update } = makeCtx(7);
    const result = await companyFromDomainHandler.run(
      makeSubmission({ email: 'jane@gmail.com' }),
      ctx,
    );
    expect(result).toMatchObject({ status: 'skipped', reason: 'free-mail-or-generic' });
    expect(update).not.toHaveBeenCalled();
  });

  it('writes enrichment under the company-from-domain key for a work email', async () => {
    const { ctx, update } = makeCtx(7);
    const result = await companyFromDomainHandler.run(
      makeSubmission({ email: 'cto@acme-corp.com' }),
      ctx,
    );
    expect(result.status).toBe('synced');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        id: 7,
        overrideAccess: true,
        data: expect.objectContaining({
          enriched: expect.objectContaining({
            'company-from-domain': expect.objectContaining({ domain: 'acme-corp.com' }),
          }),
        }),
      }),
    );
  });

  it('preserves existing enriched data when merging', async () => {
    const { ctx, update } = makeCtx(7, { other: { tag: 'kept' } });
    await companyFromDomainHandler.run(
      makeSubmission({ email: 'cto@acme-corp.com' }),
      ctx,
    );
    const data = (update.mock.calls[0]?.[0] as { data: { enriched: Record<string, unknown> } }).data;
    expect(data.enriched.other).toEqual({ tag: 'kept' });
    expect(data.enriched['company-from-domain']).toBeDefined();
  });
});
