import type { PoolConfig } from 'pg';
import { isDemoMode } from '../server/demo';

/**
 * The connection settings for a Postgres URL. node-postgres (pg-connection-string 2.x) reads `sslmode=require` as
 * `verify-full`, which refuses the self signed certificate of the demo database. Here `sslmode=require` means what it
 * means in libpq: encrypt, do not verify the certificate (shortcut: the link is open to a man in the middle; the demo
 * database holds mock data only, a real database uses verify-full with a CA). That rewrite happens only when demo mode
 * is on (PORTAL_DEMO_MODE=1 in the process environment); with the switch off every URL is returned as it was, so the
 * real portal's TLS handling does not change. Every other URL is returned as it was in demo mode too. Used by db/client.ts, scripts/migrate.ts, scripts/demo.ts and the drizzle config.
 */
export function poolConnection(url: string): Pick<PoolConfig, 'connectionString' | 'ssl'> {
  if (!isDemoMode(process.env) || !URL.canParse(url)) return { connectionString: url };
  const parsed = new URL(url);
  if (parsed.searchParams.get('sslmode') !== 'require' || parsed.searchParams.has('uselibpqcompat')) return { connectionString: url };
  parsed.searchParams.delete('sslmode');
  return { connectionString: parsed.toString(), ssl: { rejectUnauthorized: false } };
}
