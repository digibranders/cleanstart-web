import { beforeEach, describe, expect, it } from 'vitest';
import { env } from '@/env';
import { fixedClock } from '@/lib/clock';
import { makeInvite, makePartner, resetDb, testDb } from '@/db/test-helpers';
import { RateLimitError } from '@/server/errors';
import { loadInvitePreview } from './invite-preview';

const db = testDb();
const clock = fixedClock('2026-11-12T10:00:00Z');
let n = 0;
const ip = (): string => {
  n += 1;
  return `203.0.113.${n}`;
};

beforeEach(async () => {
  await resetDb(db);
});

describe('loadInvitePreview', () => {
  it('adds the configured agreement version when the agreement is needed', async () => {
    const partner = await makePartner(db, { status: 'onboarding' });
    const { token } = await makeInvite(db, { kind: 'partner', partnerId: partner.id, role: 'partner_admin', email: 'a@x.example', expiresAt: new Date('2026-11-19T00:00:00Z') });
    expect(await loadInvitePreview(token, ip(), clock)).toMatchObject({ state: 'ok', needsAgreement: true, agreementVersion: env.PARTNER_AGREEMENT_VERSION });
  });

  it('answers unknown for a bad token and rate limits one IP', async () => {
    const same = ip();
    for (let i = 0; i < 20; i += 1) expect(await loadInvitePreview('nope', same, clock)).toEqual({ state: 'unknown' });
    await expect(loadInvitePreview('nope', same, clock)).rejects.toBeInstanceOf(RateLimitError);
  });

  it('limits an unknown address too, in one shared bucket, instead of skipping the limit', async () => {
    for (let i = 0; i < 20; i += 1) expect(await loadInvitePreview('nope', null, clock)).toEqual({ state: 'unknown' });
    await expect(loadInvitePreview('nope', null, clock)).rejects.toBeInstanceOf(RateLimitError);
  });
});
