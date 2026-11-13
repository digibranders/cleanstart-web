import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applications, auditLog, hubspotSyncState } from '@/db/schema';
import { makePartner, resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import {
  type CmsPartnerApplication,
  createCmsClient,
  createHttpCmsClient,
  importWebsiteApplications,
  mapCmsApplication,
} from './website-applications';
import { type StubCms, type StubCmsRow, startStubCms } from './stub-cms';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
let stub: StubCms;

const row = (n: number, overrides: Partial<StubCmsRow> = {}): StubCmsRow => ({
  id: `cms-${n}`,
  createdAt: `2026-11-0${n}T09:00:00.000Z`,
  firstName: 'Neha',
  lastName: `Joshi${n}`,
  email: `neha${n}@tidewaterinfosec.in`,
  phone: '+91 98200 41377',
  company: `Tidewater ${n}`,
  website: 'https://www.tidewaterinfosec.in/about',
  partnerReason: 'We resell security tooling.',
  honeypot: null,
  turnstilePassed: true,
  piiRedactedAt: null,
  ...overrides,
});
const run = () =>
  importWebsiteApplications({ db, cms: createHttpCmsClient({ baseUrl: stub.url, apiKey: stub.apiKey }), clock });
const cursorRow = () => db.select().from(hubspotSyncState);

beforeEach(async () => {
  await resetDb(db);
});
afterEach(async () => {
  await stub?.close();
});

describe('importWebsiteApplications', () => {
  it('imports a row once even when the job runs twice', async () => {
    stub = await startStubCms([row(1)]);
    const first = await run();
    expect(first).toMatchObject({ fetched: 1, imported: 1, cursor: '2026-11-01T09:00:00.000Z' });
    const second = await run();
    expect(second).toMatchObject({ fetched: 1, imported: 0, skipped: { duplicate: 1 } });
    expect(await db.select().from(applications)).toHaveLength(1);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });

  it('skips honeypot, redacted and failed-Turnstile rows but still moves the cursor past them', async () => {
    stub = await startStubCms([
      row(1, { honeypot: 'bot' }),
      row(2, { piiRedactedAt: '2026-11-03T00:00:00.000Z' }),
      row(3, { turnstilePassed: false }),
      row(4),
    ]);
    const result = await run();
    expect(result).toMatchObject({
      fetched: 4,
      imported: 1,
      skipped: { honeypot: 1, redacted: 1, turnstile: 1, duplicate: 0 },
      cursor: '2026-11-04T09:00:00.000Z',
    });
    expect((await db.select().from(applications)).map((a) => a.sourceRef)).toEqual(['cms-4']);
  });

  it('skips a row it cannot import, keeps going, and never takes the cursor from the bad row', async () => {
    stub = await startStubCms([row(1), row(2, { createdAt: 'not-a-date' }), row(3)]);
    const result = await run();
    expect(result).toMatchObject({ fetched: 3, imported: 2, failed: 1, cursor: '2026-11-03T09:00:00.000Z' });
    expect((await db.select().from(applications)).map((a) => a.sourceRef).sort()).toEqual(['cms-1', 'cms-3']);
  });

  it('imports a personal address with the badge instead of rejecting it', async () => {
    stub = await startStubCms([row(1, { email: 'neha@gmail.com' })]);
    await run();
    const [saved] = await db.select().from(applications);
    expect(saved).toMatchObject({ personalEmail: true, existingDomain: false, email: 'neha@gmail.com' });
  });

  it('marks an application whose domain already belongs to a partner', async () => {
    await makePartner(db, { name: 'Tidewater Infosec', domain: 'tidewaterinfosec.in' });
    stub = await startStubCms([row(1)]);
    await run();
    const [saved] = await db.select().from(applications);
    expect(saved).toMatchObject({ existingDomain: true, personalEmail: false });
  });

  it('does not advance the cursor when the CMS fails part way, and the next run finishes the job', async () => {
    stub = await startStubCms([row(1), row(2), row(3)], { pageSize: 1 });
    stub.failPage = { page: 2, status: 500 };
    await expect(run()).rejects.toMatchObject({ service: 'cms', upstreamStatus: 500 });
    expect(await cursorRow()).toHaveLength(0);
    expect(await db.select().from(applications)).toHaveLength(1);
    stub.failPage = null;
    const result = await run();
    expect(result).toMatchObject({ imported: 2, skipped: { duplicate: 1 }, cursor: '2026-11-03T09:00:00.000Z' });
    expect(await db.select().from(applications)).toHaveLength(3);
  });

  it('asks only for rows at or after the stored cursor, ascending, with the API key', async () => {
    stub = await startStubCms([row(1)]);
    await run();
    stub.rows.push(row(2));
    const result = await run();
    expect(result).toMatchObject({ imported: 1, skipped: { duplicate: 1 }, cursor: '2026-11-02T09:00:00.000Z' });
    const request = stub.requests.at(-1);
    expect(request?.authorization).toBe('users API-Key stub-key');
    const params = new URLSearchParams(request?.search);
    expect(params.get('where[createdAt][greater_than_equal]')).toBe('2026-11-01T09:00:00.000Z');
    expect(params.get('sort')).toBe('createdAt');
    expect(params.get('depth')).toBe('0');
    expect(params.get('limit')).toBe('100');
  });
});

describe('CMS client', () => {
  it('throws an integration error carrying the upstream status', async () => {
    stub = await startStubCms([row(1)]);
    const client = createHttpCmsClient({ baseUrl: stub.url, apiKey: 'wrong-key' });
    await expect(client.listPartnerApplications({ since: null, page: 1, limit: 10 })).rejects.toMatchObject({
      service: 'cms',
      upstreamStatus: 403,
    });
  });

  it('is null when no API key is configured', () => {
    expect(createCmsClient({ apiKey: undefined, baseUrl: 'http://cms.local' })).toBeNull();
    expect(createCmsClient({ apiKey: 'k', baseUrl: 'http://cms.local' })).not.toBeNull();
  });
});

describe('mapCmsApplication', () => {
  const base: CmsPartnerApplication = {
    id: '17',
    createdAt: '2026-10-30T08:15:00.000Z',
    firstName: 'Sameer',
    lastName: 'Al Harthy',
    email: 'Sameer@FalconRidge.ae',
    phone: ' +968 9123 4567 ',
    company: ' Falcon Ridge IT ',
    website: 'https://www.falconridge.ae/en',
    partnerReason: ' Distributor. ',
  };

  it('maps names, domain, phone and reason', () => {
    expect(mapCmsApplication(base, new Set())).toEqual({
      company: 'Falcon Ridge IT',
      domain: 'falconridge.ae',
      applicantName: 'Sameer Al Harthy',
      email: 'sameer@falconridge.ae',
      role: null,
      phone: '+968 9123 4567',
      category: null,
      region: null,
      reason: 'Distributor.',
      source: 'website',
      sourceRef: '17',
      personalEmail: false,
      existingDomain: false,
      submittedAt: new Date('2026-10-30T08:15:00.000Z'),
    });
  });

  it('falls back to the email domain when the website is missing or not a domain', () => {
    expect(mapCmsApplication({ ...base, website: null }, new Set()).domain).toBe('falconridge.ae');
    expect(mapCmsApplication({ ...base, website: 'asdf' }, new Set()).domain).toBe('falconridge.ae');
  });

  it('flags an existing partner by website or email domain', () => {
    expect(mapCmsApplication(base, new Set(['falconridge.ae'])).existingDomain).toBe(true);
    expect(mapCmsApplication({ ...base, website: 'https://other.com' }, new Set(['falconridge.ae'])).existingDomain).toBe(true);
    expect(mapCmsApplication(base, new Set(['elsewhere.com'])).existingDomain).toBe(false);
  });

  it('flags a personal address from the full free-mail corpus', () => {
    expect(mapCmsApplication({ ...base, email: 'sameer@tutanota.com' }, new Set()).personalEmail).toBe(true);
  });
});
