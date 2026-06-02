import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { hubspotHandler } from './hubspot';
import type { LeadSubmission } from './types';

const submission: LeadSubmission = {
  formId: 7,
  formSchemaVersion: 1,
  fields: { email: 'cto@acme.com', firstname: 'Pat', company: 'Acme' },
  source: 'https://cleanstart.com/contact',
  utm: undefined,
  ip: '1.2.3.4',
  userAgent: 'curl',
  consent: { snapshot: 'I agree…', givenAt: '2026-06-02T00:00:00Z' },
};

const ctx = (guid: string | null) =>
  ({
    payload: {
      findByID: vi.fn(async () => (guid ? { id: 7, hubspotFormGuid: guid } : { id: 7 })),
    },
    primarySucceeded: true,
    leadId: 7,
    duplicateOfLeadId: undefined,
    formFieldDefs: [{ name: 'email', type: 'email' }],
  }) as unknown as Parameters<typeof hubspotHandler.run>[1];

beforeEach(() => {
  process.env.HUBSPOT_PORTAL_ID = '245478611';
});
afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(process.env, 'HUBSPOT_PORTAL_ID');
});

describe('hubspotHandler (Forms API)', () => {
  it('skips a duplicate submission', async () => {
    const c = ctx('guid-1');
    (c as { duplicateOfLeadId?: number }).duplicateOfLeadId = 99;
    const r = await hubspotHandler.run(submission, c);
    expect(r).toMatchObject({ handler: 'hubspot', status: 'skipped', reason: 'duplicate-submission' });
  });

  it('skips when the form has no hubspotFormGuid', async () => {
    const r = await hubspotHandler.run(submission, ctx(null));
    expect(r).toMatchObject({ status: 'skipped', reason: 'no-hubspot-form-guid' });
  });

  it('posts mapped fields to the Forms API and returns synced', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchSpy);
    const r = await hubspotHandler.run(submission, ctx('guid-1'));
    expect(r.status).toBe('synced');
    const [url, init] = fetchSpy.mock.calls[0] ?? [];
    expect(url).toBe('https://api.hsforms.com/submissions/v3/integration/submit/245478611/guid-1');
    const sent = JSON.parse((init as RequestInit).body as string);
    expect(sent.fields).toEqual(
      expect.arrayContaining([
        { name: 'email', value: 'cto@acme.com' },
        { name: 'firstname', value: 'Pat' },
      ]),
    );
    expect(sent.legalConsentOptions).toBeDefined();
  });

  it('returns failed on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' }));
    const r = await hubspotHandler.run(submission, ctx('guid-1'));
    expect(r.status).toBe('failed');
  });
});
