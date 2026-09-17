import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  attributionHubspotFields,
  hubspotHandler,
  hubspotLegalConsent,
  invalidHubspotFieldNames,
} from './hubspot';
import type { LeadSubmission } from './types';

const submission: LeadSubmission = {
  formId: 7,
  formSchemaVersion: 1,
  fields: { email: 'cto@acme.com', firstname: 'Pat', company: 'Acme' },
  source: 'https://cleanstart.com/contact',
  utm: undefined,
  attribution: undefined,
  ip: '1.2.3.4',
  userAgent: 'curl',
  consent: { snapshot: 'I agree…', givenAt: '2026-06-02T00:00:00Z' },
};

const ctx = (guid: string | null, subscriptionTypeId?: string) =>
  ({
    payload: {
      findByID: vi.fn(async () =>
        guid
          ? { id: 7, hubspotFormGuid: guid, hubspotSubscriptionTypeId: subscriptionTypeId ?? null }
          : { id: 7 },
      ),
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

  interface SentBody {
    legalConsentOptions: {
      consent: {
        consentToProcess: boolean;
        text: string;
        communications?: { value: boolean; subscriptionTypeId: number; text: string }[];
      };
    };
  }
  const sentBody = (fetchSpy: ReturnType<typeof vi.fn>): SentBody => {
    const [, init] = fetchSpy.mock.calls[0] ?? [];
    return JSON.parse((init as RequestInit).body as string) as SentBody;
  };
  const okFetch = (): ReturnType<typeof vi.fn> => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', spy);
    return spy;
  };
  const ticked = (categories: string[] | undefined): LeadSubmission => ({
    ...submission,
    consent: { snapshot: 'I agree…', givenAt: '2026-06-02T00:00:00Z', categories },
  });

  it('subscribes a visitor who ticked marketing, when the form names a subscription type', async () => {
    const fetchSpy = okFetch();
    await hubspotHandler.run(ticked(['storage', 'marketing']), ctx('guid-1', '42'));
    const sent = sentBody(fetchSpy);
    expect(sent.legalConsentOptions.consent.communications).toEqual([
      { value: true, subscriptionTypeId: 42, text: 'I agree…' },
    ]);
    expect(sent.legalConsentOptions.consent.consentToProcess).toBe(true);
  });

  // The regression this guards: the form's subscription type used to be enough
  // on its own, so every visitor was subscribed whether or not they ticked.
  it('does not subscribe a visitor who left marketing unticked', async () => {
    const fetchSpy = okFetch();
    await hubspotHandler.run(ticked(['storage']), ctx('guid-1', '42'));
    const sent = sentBody(fetchSpy);
    expect(sent.legalConsentOptions.consent.communications).toBeUndefined();
    expect(sent.legalConsentOptions.consent.consentToProcess).toBe(true);
  });

  it('does not subscribe when the consent carries no categories at all', async () => {
    const fetchSpy = okFetch();
    await hubspotHandler.run(submission, ctx('guid-1', '42'));
    expect(sentBody(fetchSpy).legalConsentOptions.consent.communications).toBeUndefined();
  });

  it('omits communications when the form has no hubspotSubscriptionTypeId, even if ticked', async () => {
    const fetchSpy = okFetch();
    await hubspotHandler.run(ticked(['storage', 'marketing']), ctx('guid-1'));
    const sent = sentBody(fetchSpy);
    expect(sent.legalConsentOptions.consent.communications).toBeUndefined();
    expect(sent.legalConsentOptions.consent.consentToProcess).toBe(true);
  });

  it('returns failed on a non-2xx response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400, text: async () => 'bad' }));
    const r = await hubspotHandler.run(submission, ctx('guid-1'));
    expect(r.status).toBe('failed');
  });
});

describe('attributionHubspotFields', () => {
  const withAttribution: LeadSubmission = {
    ...submission,
    utm: { source: 'google', medium: 'cpc', campaign: 'spring' },
    attribution: { channel: undefined, gclid: 'gc1', firstTouch: undefined },
  };

  afterEach(() => {
    Reflect.deleteProperty(process.env, 'HUBSPOT_FORWARD_ATTRIBUTION');
  });

  it('returns nothing when the flag is off', () => {
    expect(attributionHubspotFields(withAttribution)).toEqual([]);
  });

  it('forwards non-empty utm + click IDs when enabled', () => {
    process.env.HUBSPOT_FORWARD_ATTRIBUTION = 'true';
    expect(attributionHubspotFields(withAttribution)).toEqual([
      { name: 'utm_source', value: 'google' },
      { name: 'utm_medium', value: 'cpc' },
      { name: 'utm_campaign', value: 'spring' },
      { name: 'gclid', value: 'gc1' },
    ]);
  });

  it('emits nothing when enabled but no attribution present', () => {
    process.env.HUBSPOT_FORWARD_ATTRIBUTION = 'true';
    expect(attributionHubspotFields(submission)).toEqual([]);
  });
});

describe('invalidHubspotFieldNames', () => {
  it('pulls the field name out of the Forms API error text', () => {
    expect(
      invalidHubspotFieldNames(
        `{"status":"error","message":"Error in 'fields.enter_message'","errors":[{"message":"Error in 'fields.enter_message'","errorType":"INVALID_METADATA"}]}`,
      ),
    ).toEqual(['enter_message']);
  });

  it('collects every named field once', () => {
    expect(
      invalidHubspotFieldNames("Error in 'fields.utm_source'. Error in 'fields.gclid'."),
    ).toEqual(['utm_source', 'gclid']);
  });

  it('returns nothing for an error that names no field', () => {
    expect(invalidHubspotFieldNames('{"status":"error","message":"Internal error"}')).toEqual([]);
  });
});

describe('hubspotHandler — unknown field recovery', () => {
  it('retries without the rejected field so the contact still syncs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(`{"message":"Error in 'fields.enter_message'"}`, { status: 400 }),
      )
      .mockResolvedValueOnce(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await hubspotHandler.run(
      { ...submission, fields: { ...submission.fields, enter_message: 'Need a demo next week' } },
      ctx('3a491549-929f-41df-8446-32702d793780'),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retried = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as {
      fields: { name: string }[];
    };
    expect(retried.fields.map((f) => f.name)).toEqual(['email', 'firstname', 'company']);
    expect(result).toMatchObject({
      status: 'synced',
      reason: 'dropped-unknown-fields: enter_message',
    });
  });

  it('does not retry when the 400 names no field', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"message":"Internal error"}', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await hubspotHandler.run(submission, ctx('guid-1'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 'failed' });
  });

  it('does not retry when every field was rejected, since there is nothing left to send', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          `{"message":"Error in 'fields.email'. Error in 'fields.firstname'. Error in 'fields.company'."}`,
          { status: 400 },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await hubspotHandler.run(submission, ctx('guid-1'));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ status: 'failed' });
  });

  it('reports failed when the retry also fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(`{"message":"Error in 'fields.enter_message'"}`, { status: 400 }),
      )
      .mockResolvedValueOnce(new Response('{"message":"nope"}', { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await hubspotHandler.run(
      { ...submission, fields: { ...submission.fields, enter_message: 'hi' } },
      ctx('guid-1'),
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ status: 'failed' });
  });
});

describe('hubspotHandler — company and context', () => {
  const sentBody = (mock: ReturnType<typeof vi.fn>) =>
    JSON.parse(String(mock.mock.calls[0]?.[1]?.body)) as {
      fields: { name: string; value: string }[];
      context: Record<string, unknown>;
    };

  it('does not derive company from the email domain: that blocks HubSpot enrichment', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hubspotHandler.run(
      { ...submission, fields: { email: 'gaurav@fynix.digital', firstname: 'Gaurav' } },
      ctx('guid-1'),
    );

    const names = sentBody(fetchMock).fields.map((f) => f.name);
    expect(names).not.toContain('company');
  });

  it('still forwards a company the visitor actually typed', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hubspotHandler.run(
      { ...submission, fields: { email: 'pat@cleanstart.com', company: 'CleanStart Inc.' } },
      ctx('guid-1'),
    );

    const company = sentBody(fetchMock).fields.find((f) => f.name === 'company');
    expect(company?.value).toBe('CleanStart Inc.');
  });

  it('sends the visitor IP so HubSpot form analytics are not blank', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hubspotHandler.run(submission, ctx('guid-1'));

    expect(sentBody(fetchMock).context).toMatchObject({ ipAddress: '1.2.3.4' });
  });

  it('omits ipAddress rather than sending an empty one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hubspotHandler.run({ ...submission, ip: undefined }, ctx('guid-1'));

    expect(sentBody(fetchMock).context).not.toHaveProperty('ipAddress');
  });

  it('passes the country the phone selector resolved straight through', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await hubspotHandler.run(
      {
        ...submission,
        fields: { email: 'pat@cleanstart.com', phone: '+919876543210', country: 'India' },
      },
      ctx('guid-1'),
    );

    const sent = Object.fromEntries(sentBody(fetchMock).fields.map((f) => [f.name, f.value]));
    expect(sent.country).toBe('India');
    expect(sent.phone).toBe('+919876543210');
  });
});

describe('hubspotLegalConsent', () => {
  const consent = (categories?: string[]) => ({
    snapshot: 'I agree…',
    givenAt: '2026-06-02T00:00:00Z',
    ...(categories ? { categories } : {}),
  });

  it('returns nothing when the visitor gave no consent', () => {
    expect(hubspotLegalConsent(undefined, 42)).toBeUndefined();
  });

  it('always records consent to process', () => {
    expect(hubspotLegalConsent(consent(['storage']), 42)).toEqual({
      consent: { consentToProcess: true, text: 'I agree…' },
    });
  });

  it('adds the subscription only for a marketing opt-in on a form that has one', () => {
    expect(hubspotLegalConsent(consent(['storage', 'marketing']), 42)).toEqual({
      consent: {
        consentToProcess: true,
        text: 'I agree…',
        communications: [{ value: true, subscriptionTypeId: 42, text: 'I agree…' }],
      },
    });
  });

  it('never subscribes without an opt-in, whatever the subscription type', () => {
    for (const categories of [undefined, [], ['storage']]) {
      expect(hubspotLegalConsent(consent(categories), 42)?.consent).not.toHaveProperty(
        'communications',
      );
    }
  });

  it('ignores an opt-in when the form has no subscription type', () => {
    expect(hubspotLegalConsent(consent(['marketing']), Number.NaN)?.consent).not.toHaveProperty(
      'communications',
    );
  });
});
