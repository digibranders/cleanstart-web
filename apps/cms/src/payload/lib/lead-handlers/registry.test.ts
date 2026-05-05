import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock db-primary BEFORE registry import so the orchestrator picks up the
// stubbed primary handler. Each test rewires the mock implementation.
const dbPrimaryMock = vi.fn();
vi.mock('./db-primary', () => ({
  dbPrimaryHandler: {
    name: 'db-primary',
    kind: 'primary',
    run: (...args: unknown[]) => dbPrimaryMock(...args),
  },
}));

import {
  __resetSecondaryHandlers,
  registerSecondaryHandler,
  submitLead,
} from './registry';
import type { LeadHandler, LeadSubmission } from './types';

const fakePayload = {
  update: vi.fn().mockResolvedValue({}),
} as unknown as Parameters<typeof submitLead>[0];

const submission: LeadSubmission = {
  formId: 1,
  formSchemaVersion: 1,
  fields: { email: 'jane@example.com' },
  source: '/contact',
  utm: undefined,
  ip: '1.2.3.4',
  userAgent: 'test',
  consent: undefined,
};

const makeSecondary = (
  name: string,
  outcome: 'synced' | 'failed' | 'skipped',
): LeadHandler => ({
  name,
  kind: 'secondary',
  async run() {
    if (outcome === 'synced') return { handler: name, status: 'synced', externalId: 'x' };
    if (outcome === 'failed') return { handler: name, status: 'failed', error: 'boom' };
    return { handler: name, status: 'skipped', reason: 'cfg' };
  },
});

beforeEach(() => {
  dbPrimaryMock.mockReset();
  __resetSecondaryHandlers();
  (fakePayload as unknown as { update: ReturnType<typeof vi.fn> }).update.mockClear();
});

afterEach(() => {
  __resetSecondaryHandlers();
});

describe('submitLead orchestrator', () => {
  it('returns ok=false and skips secondaries when primary fails', async () => {
    dbPrimaryMock.mockResolvedValue({
      handler: 'db-primary',
      status: 'failed',
      error: 'db-down',
    });
    const secondary = makeSecondary('brevo', 'synced');
    const spy = vi.spyOn(secondary, 'run');
    registerSecondaryHandler(secondary);

    const result = await submitLead(fakePayload, submission);
    expect(result.ok).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('runs every secondary in parallel when primary succeeds', async () => {
    dbPrimaryMock.mockImplementation(async (_s, ctx) => {
      ctx.leadId = 42;
      return { handler: 'db-primary', status: 'synced', externalId: '42' };
    });
    const a = makeSecondary('a', 'synced');
    const b = makeSecondary('b', 'failed');
    const c = makeSecondary('c', 'skipped');
    registerSecondaryHandler(a);
    registerSecondaryHandler(b);
    registerSecondaryHandler(c);

    const result = await submitLead(fakePayload, submission);
    expect(result.ok).toBe(true);
    expect(result.leadId).toBe(42);
    expect(result.secondaries).toHaveLength(3);
    expect(result.secondaries.map((r) => `${r.handler}:${r.status}`).sort()).toEqual([
      'a:synced',
      'b:failed',
      'c:skipped',
    ]);
  });

  it('isolates secondary throws so they appear as failed instead of crashing the chain', async () => {
    dbPrimaryMock.mockImplementation(async (_s, ctx) => {
      ctx.leadId = 7;
      return { handler: 'db-primary', status: 'synced' };
    });
    registerSecondaryHandler({
      name: 'crashy',
      kind: 'secondary',
      async run() {
        throw new Error('uncaught');
      },
    });

    const result = await submitLead(fakePayload, submission);
    expect(result.ok).toBe(true);
    expect(result.secondaries).toHaveLength(1);
    expect(result.secondaries[0]).toMatchObject({
      handler: 'crashy',
      status: 'failed',
      error: 'uncaught',
    });
  });

  it('persists every sync outcome onto leads.syncedTo via payload.update', async () => {
    dbPrimaryMock.mockImplementation(async (_s, ctx) => {
      ctx.leadId = 99;
      return { handler: 'db-primary', status: 'synced' };
    });
    registerSecondaryHandler(makeSecondary('a', 'synced'));
    registerSecondaryHandler(makeSecondary('b', 'failed'));

    await submitLead(fakePayload, submission);
    const update = (fakePayload as unknown as { update: ReturnType<typeof vi.fn> }).update;
    expect(update).toHaveBeenCalledTimes(1);
    const callArgs = update.mock.calls[0]?.[0];
    expect(callArgs?.collection).toBe('leads');
    expect(callArgs?.id).toBe(99);
    expect(callArgs?.data?.syncedTo).toHaveLength(3); // primary + 2 secondaries
  });

  it('threads formFieldDefs through the context for handlers to consume', async () => {
    let observed: unknown;
    dbPrimaryMock.mockImplementation(async (_s, ctx) => {
      observed = ctx.formFieldDefs;
      ctx.leadId = 1;
      return { handler: 'db-primary', status: 'synced' };
    });
    await submitLead(fakePayload, submission, {
      formFieldDefs: [{ name: 'email', type: 'email' }],
    });
    expect(observed).toEqual([{ name: 'email', type: 'email' }]);
  });
});
