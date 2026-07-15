import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  listQuarantined,
  listQueuedSubmissions,
  parkSubmission,
} from '../lib/lead-fallback-queue';
import { __resetR2Client } from '../lib/r2';
import type { LeadSubmission } from '../lib/lead-handlers/types';
import type { SubmitResult } from '../lib/lead-handlers';

// Mock the lead-handlers barrel so we can drive submitLead's outcome per test.
const submitLeadMock = vi.fn<
  (payload: unknown, submission: LeadSubmission) => Promise<SubmitResult>
>();

vi.mock('../lib/lead-handlers', () => ({
  submitLead: (payload: unknown, submission: LeadSubmission) =>
    submitLeadMock(payload, submission),
}));

// Imported AFTER the mock so the drain task picks up the mocked submitLead.
import { drainLeadQueueTask } from './drain-lead-queue';

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

const fakeLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const fakeReq = {
  payload: { logger: fakeLogger },
};

// Payload's TaskConfig.handler is typed as `string | TaskHandler<…>` to allow
// both inline functions and module paths. We know we registered an inline
// function, so narrow once via `as unknown` and call it directly.
type HandlerFn = (args: {
  input: unknown;
  req: unknown;
  job: unknown;
  tasks: unknown;
  inlineTask: unknown;
}) => Promise<{ output: { processed: number; drained: number; requeued: number; abandoned: number } }>;

const handler = drainLeadQueueTask.handler as unknown as HandlerFn;

const runDrain = () =>
  handler({ input: {}, req: fakeReq, job: {}, tasks: {}, inlineTask: {} });

beforeEach(async () => {
  queueDir = await mkdtemp(path.join(tmpdir(), 'drain-'));
  vi.stubEnv('LEAD_QUEUE_LOCAL_DIR', queueDir);
  vi.stubEnv('R2_ENDPOINT', '');
  vi.stubEnv('R2_ACCESS_KEY_ID', '');
  vi.stubEnv('R2_SECRET_ACCESS_KEY', '');
  vi.stubEnv('R2_BUCKET', '');
  __resetR2Client();
  submitLeadMock.mockReset();
  fakeLogger.info.mockClear();
  fakeLogger.warn.mockClear();
  fakeLogger.error.mockClear();
});

afterEach(async () => {
  await rm(queueDir, { recursive: true, force: true });
  vi.unstubAllEnvs();
});

describe('drainLeadQueueTask', () => {
  it('returns zeros when the queue is empty', async () => {
    const out = await runDrain();
    expect(out.output).toEqual({ processed: 0, drained: 0, requeued: 0, abandoned: 0 });
    expect(submitLeadMock).not.toHaveBeenCalled();
  });

  it('drains a successful submission and removes it from the queue', async () => {
    await parkSubmission(fixtureSubmission(), 'db-down');
    submitLeadMock.mockResolvedValue({
      ok: true,
      leadId: 42,
      primary: { handler: 'db-primary', status: 'synced', externalId: '42' },
      secondaries: [],
    } as SubmitResult);

    const out = await runDrain();
    expect(out.output).toMatchObject({ processed: 1, drained: 1, requeued: 0, abandoned: 0 });
    expect(await listQueuedSubmissions()).toHaveLength(0);
  });

  it('on continued failure, increments attempts in place (not re-park with attempts=0)', async () => {
    await parkSubmission(fixtureSubmission(), 'db-down');
    submitLeadMock.mockResolvedValue({
      ok: false,
      primary: { handler: 'db-primary', status: 'failed', error: 'connection refused' },
      secondaries: [],
    } as SubmitResult);

    await runDrain();
    let list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    expect(list[0]?.attempts).toBe(1);

    // Second drain — same outcome, attempts must be 2 (would be 1 again under the old bug).
    await runDrain();
    list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    expect(list[0]?.attempts).toBe(2);
  });

  it('quarantines the entry once attempts reaches MAX_ATTEMPTS (5)', async () => {
    await parkSubmission(fixtureSubmission(), 'db-down', 4); // already at 4 → next bump → 5 → abandon
    submitLeadMock.mockResolvedValue({
      ok: false,
      primary: { handler: 'db-primary', status: 'failed', error: 'still down' },
      secondaries: [],
    } as SubmitResult);

    const out = await runDrain();
    expect(out.output).toMatchObject({ abandoned: 1 });
    expect(await listQueuedSubmissions()).toHaveLength(0);

    const dlq = await listQuarantined();
    expect(dlq).toHaveLength(1);
    expect(dlq[0]?.attempts).toBe(5);
    expect(fakeLogger.error).toHaveBeenCalled();
  });

  it('on submitLead throw, leaves the lease to expire (does not delete the entry)', async () => {
    await parkSubmission(fixtureSubmission(), 'db-down');
    submitLeadMock.mockRejectedValue(new Error('boom'));

    const out = await runDrain();
    expect(out.output).toMatchObject({ processed: 1, drained: 0, requeued: 0, abandoned: 0 });

    // Entry still on disk, attempts unchanged, lease will expire naturally.
    const list = await listQueuedSubmissions();
    expect(list).toHaveLength(1);
    expect(list[0]?.attempts).toBe(0);
    expect(fakeLogger.warn).toHaveBeenCalled();
  });

  it('two drains do not double-process the same key (lease isolates the batch)', async () => {
    await parkSubmission(fixtureSubmission(1), 'db-down');
    await parkSubmission(fixtureSubmission(2), 'db-down');

    let runs = 0;
    submitLeadMock.mockImplementation(async () => {
      runs += 1;
      return {
        ok: true,
        leadId: runs,
        primary: { handler: 'db-primary', status: 'synced' },
        secondaries: [],
      } as SubmitResult;
    });

    const [a, b] = await Promise.all([runDrain(), runDrain()]);
    const totalProcessed = (a.output?.processed ?? 0) + (b.output?.processed ?? 0);
    expect(totalProcessed).toBe(2);
    expect(submitLeadMock).toHaveBeenCalledTimes(2);
  });
});
