import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { companyFromDomainHandler } from './company-from-domain';
import {
  __resetSecondaryHandlers,
  registerSecondaryHandler,
  submitLead,
} from './registry';
import type { LeadHandler, LeadSubmission } from './types';

/**
 * Integration test: the full LeadHandler chain wired with the *real*
 * primary + company-from-domain handlers plus mock secondaries. Validates
 * the end-to-end orchestration (parallel fan-out, syncedTo persistence,
 * duplicate-skip propagation, failure isolation) — not any single handler.
 */

type Lead = {
  id: number;
  form: number;
  fields: Record<string, unknown>;
  enriched?: Record<string, unknown> | null;
  syncedTo?: unknown[];
  duplicateOf?: number | null;
};

type Form = {
  id: number;
  name: string;
  notifyTo: { email: string }[];
};

/** A configurable mock secondary handler for exercising the chain. */
const mockSecondary = (
  name: string,
  behavior: (ctx: { duplicateOfLeadId?: number | undefined }) =>
    | { status: 'synced'; externalId?: string }
    | { status: 'failed'; error: string }
    | { status: 'skipped'; reason: string },
): LeadHandler => ({
  name,
  kind: 'secondary',
  run: async (_submission, ctx) => ({ handler: name, ...behavior(ctx) }),
});

const makeFakePayload = () => {
  const leads = new Map<number, Lead>();
  const forms = new Map<number, Form>([
    [1, { id: 1, name: 'Contact', notifyTo: [{ email: 'sales@cleanstart.com' }] }],
  ]);
  let nextId = 1;

  const find = vi.fn(async (args: { collection: string; where?: unknown }) => {
    if (args.collection !== 'leads') return { docs: [] };
    return { docs: [...leads.values()] };
  });
  const findByID = vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
    if (collection === 'leads') return leads.get(id) ?? null;
    if (collection === 'forms') return forms.get(id) ?? null;
    return null;
  });
  const create = vi.fn(async (args: { collection: string; data: Record<string, unknown> }) => {
    if (args.collection !== 'leads') throw new Error(`unexpected create on ${args.collection}`);
    const lead: Lead = { ...(args.data as unknown as Lead), id: nextId++, enriched: null };
    leads.set(lead.id, lead);
    return lead;
  });
  const update = vi.fn(async (args: { collection: string; id: number; data: Record<string, unknown> }) => {
    if (args.collection !== 'leads') throw new Error(`unexpected update on ${args.collection}`);
    const merged = { ...leads.get(args.id), ...args.data } as Lead;
    leads.set(args.id, merged);
    return merged;
  });

  return {
    payload: { find, findByID, create, update } as unknown as Parameters<typeof submitLead>[0],
    state: { leads, forms },
  };
};

const submission: LeadSubmission = {
  formId: 1,
  formSchemaVersion: 1,
  fields: { email: 'cto@acme-corp.com', name: 'Pat' },
  source: '/contact',
  utm: undefined,
  ip: '1.2.3.4',
  userAgent: 'curl',
  consent: undefined,
};

const formFieldDefs = [
  { name: 'email', type: 'email' },
  { name: 'name', type: 'text' },
];

beforeEach(() => {
  __resetSecondaryHandlers();
});

afterEach(() => {
  __resetSecondaryHandlers();
  vi.unstubAllGlobals();
});

describe('LeadHandler chain (integration)', () => {
  it('writes a lead row, runs secondaries in parallel, and persists syncedTo', async () => {
    registerSecondaryHandler(companyFromDomainHandler);
    registerSecondaryHandler(mockSecondary('crm', () => ({ status: 'synced', externalId: 'ext-1' })));

    const { payload, state } = makeFakePayload();
    const result = await submitLead(payload, submission, { formFieldDefs });

    expect(result.ok).toBe(true);
    expect(result.leadId).toBe(1);

    const lead = state.leads.get(1);
    expect(lead?.fields).toEqual(submission.fields);
    expect(lead?.enriched).toMatchObject({
      'company-from-domain': expect.objectContaining({ domain: 'acme-corp.com' }),
    });

    const syncedTo = (lead?.syncedTo ?? []) as { handler: string; status: string }[];
    const byHandler = Object.fromEntries(syncedTo.map((s) => [s.handler, s.status]));
    expect(byHandler['db-primary']).toBe('synced');
    expect(byHandler.crm).toBe('synced');
    expect(byHandler['company-from-domain']).toBe('synced');
  });

  it('flags a duplicate within 24h and propagates duplicateOfLeadId to secondaries', async () => {
    registerSecondaryHandler(
      mockSecondary('crm', (ctx) =>
        ctx.duplicateOfLeadId != null
          ? { status: 'skipped', reason: 'duplicate-submission' }
          : { status: 'synced' },
      ),
    );

    const { payload, state } = makeFakePayload();
    // Pre-seed a recent lead with the same email on the same form.
    state.leads.set(99, {
      id: 99,
      form: 1,
      fields: { email: 'cto@acme-corp.com' },
    });

    const result = await submitLead(payload, submission, { formFieldDefs });
    expect(result.ok).toBe(true);
    expect(result.duplicateOfLeadId).toBe(99);

    const crmEntry = result.secondaries.find((s) => s.handler === 'crm');
    expect(crmEntry?.status).toBe('skipped');
  });

  it('records a secondary failure on syncedTo without aborting the chain', async () => {
    registerSecondaryHandler(mockSecondary('crm', () => ({ status: 'failed', error: 'upstream 502' })));
    registerSecondaryHandler(companyFromDomainHandler);

    const { payload, state } = makeFakePayload();
    const result = await submitLead(payload, submission, { formFieldDefs });

    expect(result.ok).toBe(true);
    const lead = state.leads.get(1);
    const syncedTo = (lead?.syncedTo ?? []) as { handler: string; status: string }[];
    expect(syncedTo.find((s) => s.handler === 'crm')?.status).toBe('failed');
    expect(syncedTo.find((s) => s.handler === 'company-from-domain')?.status).toBe('synced');
  });
});
