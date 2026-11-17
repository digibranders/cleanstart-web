import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureRequestError: vi.fn() }));

describe('register with an invalid environment', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('SKIP_ENV_VALIDATION', undefined);
    vi.stubEnv('DATABASE_URL', undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('prints the combined message and exits non-zero in production, so the container does not stay up serving 500s', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { register } = await import('./instrumentation');
    await register();
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL: DATABASE_URL is required'));
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('still throws outside production so the dev overlay and the tests see the error', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const { register } = await import('./instrumentation');
    await expect(register()).rejects.toThrow('Invalid environment');
    expect(exit).not.toHaveBeenCalled();
  });
});
