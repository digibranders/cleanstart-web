import { beforeEach, describe, expect, it } from 'vitest';
import { applications, hubspotSyncState } from '@/db/schema';
import { resetDb, testDb } from '@/db/test-helpers';
import { fixedClock } from '@/lib/clock';
import { createHttpCmsClient } from '@/server/intake/website-applications';
import { startStubCms } from '@/server/intake/stub-cms';
import { runIntakeWith } from './intake';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');

beforeEach(async () => {
  await resetDb(db);
});

describe('website-intake job', () => {
  it('does nothing when CMS_INTAKE_API_KEY is unset (no client)', async () => {
    await expect(runIntakeWith({ db, cms: null, clock })).resolves.toBeUndefined();
    expect(await db.select().from(applications)).toHaveLength(0);
    expect(await db.select().from(hubspotSyncState)).toHaveLength(0);
  });

  it('imports through the client it is given', async () => {
    const stub = await startStubCms([
      { id: 1, createdAt: '2026-11-01T09:00:00.000Z', firstName: 'A', lastName: 'B', email: 'a@acme-sec.com', company: 'Acme Sec' },
    ]);
    try {
      await runIntakeWith({ db, cms: createHttpCmsClient({ baseUrl: stub.url, apiKey: stub.apiKey }), clock });
      expect(await db.select().from(applications)).toHaveLength(1);
    } finally {
      await stub.close();
    }
  });
});
