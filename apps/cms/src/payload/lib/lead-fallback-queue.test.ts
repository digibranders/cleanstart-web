import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  claimNextBatch,
  incrementAttempts,
  listQuarantined,
  listQueuedSubmissions,
  parkSubmission,
  quarantineSubmission,
  removeQueuedSubmission,
} from './lead-fallback-queue';
import type { LeadSubmission } from './lead-handlers/types';
import { __resetR2Client } from './r2';

let queueDir: string;

const fixtureSubmission = (formId = 1): LeadSubmission => ({
  formId,
  formSchemaVersion: 1,
  fields: { email: 'jane@example.com' },
  source: '/contact',
  utm: undefined,
  attribution: undefined,
  ip: '1.2.3.4',
  userAgent: 'test-agent',
  consent: undefined,
});

beforeEach(async () => {
  queueDir = await mkdtemp(path.join(tmpdir(), 'lfq-'));
  vi.stubEnv('LEAD_QUEUE_LOCAL_DIR', queueDir);
  // Force the local sink — clear any cached R2 client.
  vi.stubEnv('R2_ENDPOINT', '');
  vi.stubEnv('R2_ACCESS_KEY_ID', '');
  vi.stubEnv('R2_SECRET_ACCESS_KEY', '');
  vi.stubEnv('R2_BUCKET', '');
  __resetR2Client();
});

afterEach(async () => {
  await rm(queueDir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe('lead-fallback-queue (local-fs sink)', () => {
  it('parks → lists → removes round-trip', async () => {
    const parked = await parkSubmission(fixtureSubmission(), 'db-down');
    expect(parked.ok).toBe(true);
    if (!parked.ok) return;

    const list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    expect(list[0]?.key).toBe(parked.key);
    expect(list[0]?.attempts).toBe(0);
    expect(list[0]?.reason).toBe('db-down');

    await removeQueuedSubmission(parked.key);
    expect(await listQueuedSubmissions()).toHaveLength(0);
  });

  it('persists attempts across incrementAttempts', async () => {
    const parked = await parkSubmission(fixtureSubmission(), 'db-down');
    if (!parked.ok) throw new Error('park failed');

    expect(await incrementAttempts(parked.key, 'still-down')).toBe(true);
    expect(await incrementAttempts(parked.key, 'still-down 2')).toBe(true);

    const list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    expect(list[0]?.attempts).toBe(2);
    expect(list[0]?.reason).toBe('still-down 2');
  });

  it('parkSubmission accepts a starting attempts value', async () => {
    const parked = await parkSubmission(fixtureSubmission(), 'replay', 3);
    if (!parked.ok) throw new Error('park failed');
    const list = await listQueuedSubmissions();
    expect(list[0]?.attempts).toBe(3);
  });

  it('claimNextBatch grants a lease; concurrent claim sees zero items', async () => {
    await parkSubmission(fixtureSubmission(1), 'db-down');
    await parkSubmission(fixtureSubmission(2), 'db-down');

    const claimedA = await claimNextBatch('worker-A', 60_000);
    expect(claimedA).toHaveLength(2);
    expect(claimedA[0]?.leaseId).toBe('worker-A');
    expect(claimedA[0]?.leasedUntil).toBeDefined();

    const claimedB = await claimNextBatch('worker-B', 60_000);
    expect(claimedB).toHaveLength(0);
  });

  it('expired lease is reclaimable', async () => {
    await parkSubmission(fixtureSubmission(), 'db-down');

    const claimedA = await claimNextBatch('worker-A', 1); // 1ms TTL
    expect(claimedA).toHaveLength(1);

    await new Promise((resolve) => setTimeout(resolve, 10));

    const claimedB = await claimNextBatch('worker-B', 60_000);
    expect(claimedB).toHaveLength(1);
    expect(claimedB[0]?.leaseId).toBe('worker-B');
  });

  it('quarantineSubmission moves entry under abandoned/', async () => {
    const parked = await parkSubmission(fixtureSubmission(), 'db-down');
    if (!parked.ok) throw new Error('park failed');

    const list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    const entry = list[0];
    if (!entry) throw new Error('expected one entry');

    await quarantineSubmission({ ...entry, attempts: 5, reason: 'abandoned' });

    expect(await listQueuedSubmissions()).toHaveLength(0);
    const quarantined = await listQuarantined();
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0]?.attempts).toBe(5);
    expect(quarantined[0]?.reason).toBe('abandoned');

    const abandonedDir = path.join(queueDir, 'abandoned');
    const files = await readdir(abandonedDir);
    expect(files).toHaveLength(1);
    const text = await readFile(path.join(abandonedDir, files[0] as string), 'utf8');
    expect(JSON.parse(text)).toMatchObject({ attempts: 5, reason: 'abandoned' });
  });

  it('listQueuedSubmissions skips the abandoned/ subdirectory', async () => {
    await parkSubmission(fixtureSubmission(1), 'db-down');
    const parked = await parkSubmission(fixtureSubmission(2), 'db-down');
    if (!parked.ok) throw new Error('park failed');
    const list = await listQueuedSubmissions();
    const entry = list.find((e) => e.key === parked.key);
    if (!entry) throw new Error('expected entry');
    await quarantineSubmission(entry);

    const remaining = await listQueuedSubmissions();
    expect(remaining).toHaveLength(1);
    const quarantined = await listQuarantined();
    expect(quarantined).toHaveLength(1);
  });

  it('incrementAttempts on a missing key is a no-op (returns false)', async () => {
    const ok = await incrementAttempts('does-not-exist.json', 'whatever');
    expect(ok).toBe(false);
  });

  it('incrementAttempts clears any stale lease fields', async () => {
    const parked = await parkSubmission(fixtureSubmission(), 'db-down');
    if (!parked.ok) throw new Error('park failed');
    await claimNextBatch('worker-A', 60_000);

    const ok = await incrementAttempts(parked.key, 'after-failure');
    expect(ok).toBe(true);

    const list = await listQueuedSubmissions();
    expect(list[0]?.leaseId).toBeUndefined();
    expect(list[0]?.leasedUntil).toBeUndefined();
    expect(list[0]?.attempts).toBe(1);
  });
});
