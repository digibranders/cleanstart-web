import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { brevoHandler } from './brevo';
import { companyFromDomainHandler } from './company-from-domain';
import {
  __resetSecondaryHandlers,
  registerSecondaryHandler,
  submitLead,
} from './registry';
import type { LeadSubmission } from './types';

/**
 * Integration test: full LeadHandler chain wired with the *real*
 * primary, brevo, and company-from-domain handlers. Validates the
 * end-to-end orchestration, not any single handler in isolation.
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
  Reflect.deleteProperty(process.env, 'BREVO_API_KEY');
  Reflect.deleteProperty(process.env, 'BREVO_TEMPLATE_ID');
});

afterEach(() => {
  __resetSecondaryHandlers();
  vi.unstubAllGlobals();
});

describe('LeadHandler chain (integration)', () => {
  it('writes a lead row, runs brevo + enrichment in parallel, and persists syncedTo', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ messageId: 'msg-1' }),
      } as never),
    );

    registerSecondaryHandler(brevoHandler);
    registerSecondaryHandler(companyFromDomainHandler);

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
    expect(byHandler.brevo).toBe('synced');
    expect(byHandler['company-from-domain']).toBe('synced');
  });

  it('flags a duplicate within 24h and skips brevo (via duplicate-submission)', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messageId: 'msg-1' }),
    } as never);
    vi.stubGlobal('fetch', fetchSpy);

    registerSecondaryHandler(brevoHandler);

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

    const brevoEntry = result.secondaries.find((s) => s.handler === 'brevo');
    expect(brevoEntry?.status).toBe('skipped');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('records brevo failure on syncedTo without aborting the chain', async () => {
    process.env.BREVO_API_KEY = 'k';
    process.env.BREVO_TEMPLATE_ID = '42';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: async () => 'bad gateway',
      } as never),
    );

    registerSecondaryHandler(brevoHandler);
    registerSecondaryHandler(companyFromDomainHandler);

    const { payload, state } = makeFakePayload();
    const result = await submitLead(payload, submission, { formFieldDefs });

    expect(result.ok).toBe(true);
    const lead = state.leads.get(1);
    const syncedTo = (lead?.syncedTo ?? []) as { handler: string; status: string }[];
    expect(syncedTo.find((s) => s.handler === 'brevo')?.status).toBe('failed');
    expect(syncedTo.find((s) => s.handler === 'company-from-domain')?.status).toBe('synced');
  });
});
