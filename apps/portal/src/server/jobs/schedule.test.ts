import * as Sentry from '@sentry/nextjs';
import cron from 'node-cron';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '@/server/log';
import { runLocked } from './lock';
import { startScheduler } from './schedule';

vi.mock('node-cron', () => ({ default: { schedule: vi.fn(), validate: vi.fn() } }));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/db/client', () => ({ pool: { tag: 'system-pool' } }));
vi.mock('@/server/log', () => ({ log: { error: vi.fn(), info: vi.fn() } }));
vi.mock('./lock', () => ({ runLocked: vi.fn() }));

const tick = (index: number): (() => void) => {
  const call = vi.mocked(cron.schedule).mock.calls[index];
  if (!call) throw new Error(`no schedule call ${index}`);
  return call[1] as () => void;
};

describe('startScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('schedules each job in UTC with its own name', () => {
    const run = vi.fn();
    startScheduler([{ name: 'demo', schedule: '*/5 * * * *', run }]);
    expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function), { timezone: 'UTC', name: 'demo', noOverlap: true });
  });

  it('runs a tick through the advisory lock on the system pool', () => {
    vi.mocked(runLocked).mockResolvedValue(true);
    const run = vi.fn();
    startScheduler([{ name: 'demo', schedule: '* * * * *', run }]);
    tick(0)();
    expect(runLocked).toHaveBeenCalledWith({ tag: 'system-pool' }, 'demo', run);
  });

  it('reports a failing job to Sentry with its name and keeps going', async () => {
    const failure = new Error('boom');
    vi.mocked(runLocked).mockRejectedValue(failure);
    startScheduler([{ name: 'demo', schedule: '* * * * *', run: vi.fn() }]);
    tick(0)();
    await vi.waitFor(() => expect(Sentry.captureException).toHaveBeenCalledWith(failure, { tags: { job: 'demo' } }));
  });

  it('logs a failing job so it is visible without Sentry', async () => {
    const failure = new Error('boom');
    vi.mocked(runLocked).mockRejectedValue(failure);
    startScheduler([{ name: 'demo', schedule: '* * * * *', run: vi.fn() }]);
    tick(0)();
    await vi.waitFor(() => expect(log.error).toHaveBeenCalledWith({ job: 'demo', err: failure }, 'job failed'));
  });
});
