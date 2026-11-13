import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { register } from './instrumentation';

const { startScheduler, info, envLoaded } = vi.hoisted(() => ({ startScheduler: vi.fn(), info: vi.fn(), envLoaded: vi.fn() }));

vi.mock('@sentry/nextjs', () => ({ captureRequestError: vi.fn() }));
vi.mock('@/env', () => {
  envLoaded();
  return { env: {} };
});
vi.mock('../sentry.server.config', () => ({}));
vi.mock('../sentry.edge.config', () => ({}));
vi.mock('@/server/jobs/schedule', () => ({ startScheduler }));
vi.mock('@/server/jobs', () => ({ JOBS: [{ name: 'demo', schedule: '* * * * *', run: async () => undefined }] }));
vi.mock('@/server/log', () => ({ log: { info } }));

describe('register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('validates the environment when the Node server starts, and only then', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    await register();
    expect(envLoaded).not.toHaveBeenCalled();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    await register();
    expect(envLoaded).toHaveBeenCalledOnce();
  });

  it('does not start the scheduler unless PORTAL_JOBS_ENABLED is true', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'false');
    await register();
    expect(startScheduler).not.toHaveBeenCalled();
  });

  it('starts the scheduler with the job registry on the Node runtime when enabled', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'true');
    await register();
    expect(startScheduler).toHaveBeenCalledOnce();
    expect(info).toHaveBeenCalledWith({ jobs: ['demo'] }, 'job scheduler started');
  });

  it('never starts jobs on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('PORTAL_JOBS_ENABLED', 'true');
    await register();
    expect(startScheduler).not.toHaveBeenCalled();
  });
});
