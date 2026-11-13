import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const startScheduler = vi.fn();
const flags = { enabled: false };

vi.mock('@sentry/nextjs', () => ({ captureRequestError: vi.fn() }));
vi.mock('@/env', () => ({
  env: {
    get PORTAL_JOBS_ENABLED() {
      return flags.enabled;
    },
  },
}));
vi.mock('../sentry.server.config', () => ({}));
vi.mock('@/server/jobs/schedule', () => ({ startScheduler }));
vi.mock('@/server/jobs', () => ({ JOBS: [{ name: 'demo' }] }));
vi.mock('@/server/log', () => ({ log: { info: vi.fn() } }));

describe('register', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    startScheduler.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('starts the scheduler when the parsed flag is on (true or 1)', async () => {
    flags.enabled = true;
    const { register } = await import('./instrumentation');
    await register();
    expect(startScheduler).toHaveBeenCalledOnce();
  });

  it('does not start the scheduler when the flag is off', async () => {
    flags.enabled = false;
    const { register } = await import('./instrumentation');
    await register();
    expect(startScheduler).not.toHaveBeenCalled();
  });
});
