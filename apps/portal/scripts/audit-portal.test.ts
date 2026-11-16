import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = join(process.cwd(), 'scripts/audit-portal.mjs');

describe('audit-portal.mjs fails closed', () => {
  it('exits 2 and prints the registry error when the audit endpoint is unreachable', () => {
    // Port 9 (discard) refuses the connection at once; zero retries keeps pnpm from backing off for a minute.
    const run = spawnSync('node', [SCRIPT], {
      encoding: 'utf8',
      timeout: 30_000,
      env: { ...process.env, npm_config_registry: 'http://127.0.0.1:9/', npm_config_fetch_retries: '0' },
    });
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('ECONNREFUSED');
    expect(run.stdout).not.toContain('0 advisories');
  });
});
