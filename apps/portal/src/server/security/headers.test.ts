import { afterEach, describe, expect, it, vi } from 'vitest';

type HeaderRule = { source: string; headers: Array<{ key: string; value: string }> };

/** Loads next.config.ts fresh, because it reads NODE_ENV and NEXT_OUTPUT when it is evaluated. */
const loadConfig = async (env: Record<string, string>) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import('../../../next.config')).default;
};

const headersOf = async (env: Record<string, string>): Promise<Map<string, string>> => {
  const config = await loadConfig(env);
  const rules = (await config.headers?.()) as HeaderRule[];
  const all = rules.find((r) => r.source === '/:path*');
  return new Map((all?.headers ?? []).map((h) => [h.key, h.value]));
};

afterEach(() => vi.unstubAllEnvs());

describe('next.config security headers', () => {
  it('sends the static protections on every path', async () => {
    const headers = await headersOf({ NODE_ENV: 'production' });
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('Permissions-Policy')).toContain('camera=()');
    expect(headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin');
    expect(headers.get('Cross-Origin-Resource-Policy')).toBe('same-origin');
    expect(headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  });

  it('adds HSTS in production only', async () => {
    expect((await headersOf({ NODE_ENV: 'production' })).get('Strict-Transport-Security')).toBe('max-age=31536000; includeSubDomains');
    expect((await headersOf({ NODE_ENV: 'development' })).has('Strict-Transport-Security')).toBe(false);
  });

  it('gives the API routes a closed policy', async () => {
    const config = await loadConfig({ NODE_ENV: 'production' });
    const rules = (await config.headers?.()) as HeaderRule[];
    const api = rules.find((r) => r.source === '/api/:path*');
    expect(api?.headers).toEqual([{ key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" }]);
  });

  it('turns on standalone output only when asked, and always hides the framework header', async () => {
    expect((await loadConfig({ NEXT_OUTPUT: 'standalone' })).output).toBe('standalone');
    const plain = await loadConfig({ NEXT_OUTPUT: '' });
    expect(plain.output).toBeUndefined();
    expect(plain.poweredByHeader).toBe(false);
  });
});
