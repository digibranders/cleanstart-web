import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  resolveCalcomCredentials,
  resolveClarityCredentials,
  resolveCloudflareCredentials,
  resolveGa4Credentials,
  resolveGenericCredentials,
  resolveGscCredentials,
  resolveHubspotCredentials,
  resolveTeamsCredentials,
} from './credentials';
import { encrypt } from './secrets';

const ENV_KEYS = [
  'PAYLOAD_SECRET',
  'WEBHOOK_TEAMS_URL',
  'WEBHOOK_GENERIC_URL',
  'WEBHOOK_GENERIC_SIGNING_SECRET',
  'HUBSPOT_PRIVATE_APP_TOKEN',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'CLARITY_API_TOKEN',
  'CLOUDFLARE_ACCOUNT_TAG',
  'CLOUDFLARE_API_TOKEN',
  'CALCOM_SIGNING_SECRET',
] as const;

const snapshot: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    snapshot[k] = process.env[k];
    process.env[k] = '';
  }
  process.env.PAYLOAD_SECRET = 'test-payload-secret-deterministic-key-material';
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    process.env[k] = snapshot[k] ?? '';
  }
});

describe('resolveTeamsCredentials', () => {
  it('returns null when neither row nor env supplies a url', () => {
    expect(resolveTeamsCredentials(null)).toBeNull();
    expect(resolveTeamsCredentials({ teamsConfig: { webhookUrl: '' } })).toBeNull();
  });

  it('falls back to the env webhook url', () => {
    process.env.WEBHOOK_TEAMS_URL = 'https://env.example/teams';
    expect(resolveTeamsCredentials(null)).toEqual({ webhookUrl: 'https://env.example/teams' });
  });

  it('prefers the per-row url over env', () => {
    process.env.WEBHOOK_TEAMS_URL = 'https://env.example/teams';
    const creds = resolveTeamsCredentials({ teamsConfig: { webhookUrl: 'https://row.example/c' } });
    expect(creds?.webhookUrl).toBe('https://row.example/c');
  });

  it('decrypts an encrypted per-row url', () => {
    const creds = resolveTeamsCredentials({
      teamsConfig: { webhookUrl: encrypt('https://secret.example/teams') },
    });
    expect(creds?.webhookUrl).toBe('https://secret.example/teams');
  });

  it('passes mentions through only when present', () => {
    const mentions = [
      { displayName: 'A', aadObjectId: 'x', upn: 'a@x', triggerOn: ['lead.submitted' as const] },
    ];
    const withM = resolveTeamsCredentials({
      teamsConfig: { webhookUrl: 'https://row.example', mentions },
    });
    expect(withM?.mentions).toEqual(mentions);
    const without = resolveTeamsCredentials({ teamsConfig: { webhookUrl: 'https://row.example' } });
    expect(without && 'mentions' in without).toBe(false);
  });
});

describe('resolveGenericCredentials', () => {
  it('returns null unless both url and secret resolve', () => {
    process.env.WEBHOOK_GENERIC_URL = 'https://env.example/hook';
    expect(resolveGenericCredentials(null)).toBeNull(); // secret missing
    process.env.WEBHOOK_GENERIC_URL = '';
    process.env.WEBHOOK_GENERIC_SIGNING_SECRET = 'whsec';
    expect(resolveGenericCredentials(null)).toBeNull(); // url missing
  });

  it('resolves from env with a db-derived key id', () => {
    process.env.WEBHOOK_GENERIC_URL = 'https://env.example/hook';
    process.env.WEBHOOK_GENERIC_SIGNING_SECRET = 'whsec';
    expect(resolveGenericCredentials({ id: 42 })).toEqual({
      url: 'https://env.example/hook',
      signingSecret: 'whsec',
      signingKeyId: 'db-42',
    });
  });

  it('uses an explicit per-row key id and decrypts row secret/url', () => {
    const creds = resolveGenericCredentials({
      id: 7,
      genericConfig: {
        url: encrypt('https://row.example/hook'),
        signingSecret: encrypt('row-secret'),
        signingKeyId: 'key-prod-1',
      },
    });
    expect(creds).toEqual({
      url: 'https://row.example/hook',
      signingSecret: 'row-secret',
      signingKeyId: 'key-prod-1',
    });
  });

  it('falls back to db-unknown when no id is present', () => {
    process.env.WEBHOOK_GENERIC_URL = 'https://env.example/hook';
    process.env.WEBHOOK_GENERIC_SIGNING_SECRET = 'whsec';
    expect(resolveGenericCredentials(null)?.signingKeyId).toBe('db-unknown');
  });
});

describe('resolveHubspotCredentials', () => {
  it('returns null without the env token (token is env-exclusive)', () => {
    expect(resolveHubspotCredentials({ hubspotConfig: { writeMode: 'contactAndLead' } })).toBeNull();
  });

  it('builds the field mapping, skipping incomplete entries, and applies defaults', () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'pat-123';
    const creds = resolveHubspotCredentials({
      hubspotConfig: {
        fieldMapping: [
          { submissionField: 'email', hubspotProperty: 'email' },
          { submissionField: 'company', hubspotProperty: null },
          { submissionField: null, hubspotProperty: 'orphan' },
        ],
      },
    });
    expect(creds).toEqual({
      accessToken: 'pat-123',
      writeMode: 'contactOnly',
      fieldMapping: { email: 'email' },
      defaultProperties: { lifecyclestage: 'lead', hs_lead_status: 'NEW' },
    });
  });

  it('honours row write mode and default lifecycle/lead status', () => {
    process.env.HUBSPOT_PRIVATE_APP_TOKEN = 'pat-123';
    const creds = resolveHubspotCredentials({
      hubspotConfig: {
        writeMode: 'contactAndLead',
        defaultLifecycleStage: 'opportunity',
        defaultLeadStatus: 'OPEN',
      },
    });
    expect(creds?.writeMode).toBe('contactAndLead');
    expect(creds?.defaultProperties).toEqual({
      lifecyclestage: 'opportunity',
      hs_lead_status: 'OPEN',
    });
  });
});

describe('resolveGa4Credentials / resolveGscCredentials', () => {
  const sa = { type: 'service_account', client_email: 'svc@x.iam' };

  it('GA4 requires both a propertyId and the service-account env', () => {
    expect(resolveGa4Credentials({ ga4Config: { propertyId: '123' } })).toBeNull(); // no SA
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify(sa);
    expect(resolveGa4Credentials(null)).toBeNull(); // no propertyId
    expect(resolveGa4Credentials({ ga4Config: { propertyId: '123' } })).toEqual({
      propertyId: '123',
      serviceAccountJson: sa,
    });
  });

  it('GA4 returns null when the service-account env is not valid JSON', () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = '{not json';
    expect(resolveGa4Credentials({ ga4Config: { propertyId: '123' } })).toBeNull();
  });

  it('GSC requires both a siteUrl and the service-account env', () => {
    expect(resolveGscCredentials({ gscConfig: { siteUrl: 'https://x' } })).toBeNull();
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify(sa);
    expect(resolveGscCredentials(null)).toBeNull();
    expect(resolveGscCredentials({ gscConfig: { siteUrl: 'https://x' } })).toEqual({
      siteUrl: 'https://x',
      serviceAccountJson: sa,
    });
  });
});

describe('resolveClarityCredentials', () => {
  it('is env-only', () => {
    expect(resolveClarityCredentials()).toBeNull();
    process.env.CLARITY_API_TOKEN = 'clarity-tok';
    expect(resolveClarityCredentials()).toEqual({ apiToken: 'clarity-tok' });
  });
});

describe('resolveCloudflareCredentials', () => {
  it('needs an api token from env plus an account tag (row or env)', () => {
    process.env.CLOUDFLARE_ACCOUNT_TAG = 'acct-env';
    expect(resolveCloudflareCredentials(null)).toBeNull(); // no token
    process.env.CLOUDFLARE_API_TOKEN = 'cf-tok';
    expect(resolveCloudflareCredentials(null)).toEqual({
      accountTag: 'acct-env',
      apiToken: 'cf-tok',
    });
  });

  it('prefers the per-row account tag', () => {
    process.env.CLOUDFLARE_ACCOUNT_TAG = 'acct-env';
    process.env.CLOUDFLARE_API_TOKEN = 'cf-tok';
    expect(
      resolveCloudflareCredentials({ cloudflareConfig: { accountTag: 'acct-row' } })?.accountTag,
    ).toBe('acct-row');
  });
});

describe('resolveCalcomCredentials', () => {
  it('returns null without the signing secret env', () => {
    expect(resolveCalcomCredentials({ calcomConfig: { fallbackFormId: 5 } })).toBeNull();
  });

  it('resolves the secret and carries the fallback form id (defaulting to null)', () => {
    process.env.CALCOM_SIGNING_SECRET = 'cal-secret';
    expect(resolveCalcomCredentials(null)).toEqual({
      signingSecret: 'cal-secret',
      fallbackFormId: null,
    });
    expect(resolveCalcomCredentials({ calcomConfig: { fallbackFormId: 9 } })?.fallbackFormId).toBe(9);
  });
});
