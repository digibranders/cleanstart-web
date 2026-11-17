/** Variables read here, never from env.ts: this module must stay importable before (and by) the environment parser. */
type Source = Record<string, string | undefined>;

/** Raised at startup when the demo switch is on in an environment that could be the real portal. */
export class DemoModeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DemoModeError';
  }
}

/** The demo switch. Exactly "1" turns it on: "true", " 1" or anything else is off. */
export const isDemoMode = (source: Source = process.env): boolean => source.PORTAL_DEMO_MODE === '1';

const PRODUCT_DOMAIN = 'cleanstart.com';
const PRODUCTION_APP_HOST = 'partners.cleanstart.com';

/** Lower case, no brackets, no trailing dot: the form every rule below compares. */
const normalise = (hostname: string): string => hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');

const isLoopback = (host: string): boolean =>
  host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host === '::' || host === '0.0.0.0' || /^127\./.test(host);

/** One label and not an IP: a container or intranet name such as the droplet's "postgres". A hosted database always has a dotted name. */
const isInternalName = (host: string): boolean => !host.includes('.') && !host.includes(':');

const matches = (host: string, entry: string): boolean => host === entry || host.endsWith(`.${entry}`);

const hostOf = (name: string, value: string): string => {
  if (!URL.canParse(value)) throw new DemoModeError(`Demo mode refused: ${name} is not a valid URL.`);
  return normalise(new URL(value).hostname);
};

/**
 * Throws DemoModeError when PORTAL_DEMO_MODE=1 is set where the real portal could be running. Demo mode swaps HubSpot,
 * R2 and email for fakes and `demo:reset` truncates every table, so it must never meet the production database:
 * in production the database may not be loopback or a bare internal name (the droplet's Postgres is "postgres" on the
 * compose network); in every environment it may not be under cleanstart.com or on PORTAL_DEMO_DENY_HOSTS (comma
 * separated hosts or parent domains). APP_URL may not be the production portal address. No password is ever put in a message.
 * shortcut: a hostname check cannot see an IP alias of a denied host; list such an address in PORTAL_DEMO_DENY_HOSTS.
 */
export function assertDemoModeAllowed(source: Source): void {
  if (!isDemoMode(source)) return;
  const production = source.NODE_ENV === 'production';
  const denied = (source.PORTAL_DEMO_DENY_HOSTS ?? '').split(',').map((entry) => normalise(entry.trim())).filter((entry) => entry !== '');
  if (!source.DATABASE_URL) throw new DemoModeError('Demo mode refused: DATABASE_URL is not set.');

  for (const name of ['DATABASE_URL', 'DATABASE_OWNER_URL'] as const) {
    const value = source[name];
    if (!value) continue;
    const host = hostOf(name, value);
    if (matches(host, PRODUCT_DOMAIN)) throw new DemoModeError(`Demo mode refused: ${name} host "${host}" is under ${PRODUCT_DOMAIN}.`);
    if (denied.some((entry) => matches(host, entry))) throw new DemoModeError(`Demo mode refused: ${name} host "${host}" is on the PORTAL_DEMO_DENY_HOSTS deny list.`);
    if (production && isLoopback(host)) throw new DemoModeError(`Demo mode refused: NODE_ENV is "production" and ${name} host "${host}" is loopback.`);
    if (production && isInternalName(host)) throw new DemoModeError(`Demo mode refused: NODE_ENV is "production" and ${name} host "${host}" is an internal name, not a hosted database.`);
  }

  if (source.APP_URL) {
    const host = hostOf('APP_URL', source.APP_URL);
    if (host === PRODUCTION_APP_HOST || denied.some((entry) => matches(host, entry))) {
      throw new DemoModeError(`Demo mode refused: APP_URL host "${host}" is the production portal or on the deny list.`);
    }
  }
}
