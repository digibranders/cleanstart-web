import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

const example = parseEnv(readFileSync(new URL('../.env.example', import.meta.url), 'utf8'));

describe('.env.example', () => {
  it('fails until AUTH_SECRET is filled in, naming it', () => {
    expect(() => loadEnv(example)).toThrow(/AUTH_SECRET/);
  });

  it('is a valid environment once AUTH_SECRET is set, so a copy of it boots', () => {
    const env = loadEnv({ ...example, AUTH_SECRET: 'x'.repeat(32) });
    expect(env.APP_URL).toBe('http://localhost:3204');
    expect(env.PORTAL_JOBS_ENABLED).toBe(false);
  });
});
