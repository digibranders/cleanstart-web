import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sentry/nextjs', () => ({ captureRequestError: vi.fn() }));

describe('register with demo mode in the wrong place', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PORTAL_DEMO_MODE', '1');
    vi.stubEnv('DATABASE_URL', 'postgresql://portal_app:pw@postgres:5432/cleanstart_portal');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('prints the refusal and exits non-zero before the environment is parsed, even with validation skipped', async () => {
    vi.stubEnv('SKIP_ENV_VALIDATION', '1');
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const stderr = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { register } = await import('./instrumentation');
    await register();
    expect(stderr).toHaveBeenCalledWith(expect.stringContaining('Demo mode refused'));
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('still throws outside production so the dev overlay and the tests see it', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('DATABASE_URL', 'postgresql://portal_app:pw@db.cleanstart.com/d');
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const { register } = await import('./instrumentation');
    await expect(register()).rejects.toThrow('Demo mode refused');
    expect(exit).not.toHaveBeenCalled();
  });
});
