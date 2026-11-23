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

/** Cloudflare's published always-pass Turnstile test keys: the only values demo mode accepts. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

/** Credentials of the real services: they must never sit next to the fakes. */
const REAL_CREDENTIALS = ['HUBSPOT_PORTAL_TOKEN', 'HUBSPOT_WEBHOOK_SECRET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'BREVO_API_KEY', 'CMS_INTAKE_API_KEY'] as const;
const REVIEW_PASSWORD_MIN = 16;

/**
 * One spelling of a host, so a name and its aliases compare equal: lower case, no trailing dots, IPv4 in dotted decimal
 * whatever the input form (hex, octal, decimal, short), IPv6 compressed without brackets, IPv4 mapped IPv6 as IPv4.
 * Null for anything that is not a plain host name, IPv4 or bracketed IPv6 address.
 */
const canonicalHost = (raw: string): string | null => {
  const host = raw.trim().toLowerCase().replace(/\.+$/, '');
  if (host === '' || !(/^\[[0-9a-f:.]+\]$/.test(host) || /^[a-z0-9.-]+$/.test(host))) return null;
  let canonical: string;
  try {
    canonical = new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, '').replace(/\.+$/, '');
  } catch {
    return null;
  }
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(canonical);
  if (!mapped) return canonical;
  const high = Number.parseInt(mapped[1] ?? '', 16);
  const low = Number.parseInt(mapped[2] ?? '', 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
};

/** A list entry (host, parent domain or address, IPv6 with or without brackets) in the same spelling. */
const entryHost = (entry: string): string => canonicalHost(entry.includes(':') && !entry.includes('[') ? `[${entry}]` : entry) ?? entry.trim().toLowerCase().replace(/\.+$/, '');

const hostList = (value: string | undefined): string[] => (value ?? '').split(',').map((entry) => entry.trim()).filter((entry) => entry !== '').map(entryHost);

const isLoopback = (host: string): boolean =>
  host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host === '::' || /^(127|0)\./.test(host);

/** One label and not an IP: a container or intranet name such as the droplet's "postgres". A hosted database always has a dotted name. */
const isInternalName = (host: string): boolean => !host.includes('.') && !host.includes(':');

const matches = (host: string, entry: string): boolean => host === entry || host.endsWith(`.${entry}`);

interface DatabaseTarget {
  host: string;
  port: string;
  database: string;
}

/** Query parameters pg-connection-string lets override the address of the URL (and libpq's hostaddr). */
const OVERRIDING_PARAMETERS = ['host', 'hostaddr', 'port', 'dbname'] as const;

const safeDecode = (value: string): string => {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
};

/**
 * The host, port and database the way node-postgres will use them (pg-connection-string 2.13 reads the URL with
 * `new URL`, decodes the host with decodeURIComponent and lets query parameters win). Anything that makes the two
 * readings differ is refused instead of interpreted: overriding query parameters, a % in the host, a host that is not
 * a plain name or address.
 */
const targetOf = (name: string, value: string): DatabaseTarget => {
  if (!URL.canParse(value)) throw new DemoModeError(`Demo mode refused: ${name} is not a valid URL.`);
  const url = new URL(value);
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') throw new DemoModeError(`Demo mode refused: ${name} must be a postgres:// or postgresql:// URL.`);
  const overriding = OVERRIDING_PARAMETERS.find((key) => url.searchParams.has(key));
  if (overriding) throw new DemoModeError(`Demo mode refused: ${name} has a "${overriding}" query parameter, which overrides the address the URL shows.`);
  if (url.hostname.includes('%')) throw new DemoModeError(`Demo mode refused: ${name} has a percent encoded host.`);
  const host = canonicalHost(url.hostname);
  if (host === null) throw new DemoModeError(`Demo mode refused: ${name} host is not a plain host name or IP address.`);
  return { host, port: url.port || '5432', database: safeDecode(url.pathname.slice(1)) };
};

const appHostOf = (value: string): string => {
  if (!URL.canParse(value)) throw new DemoModeError('Demo mode refused: APP_URL is not a valid URL.');
  return canonicalHost(new URL(value).hostname) ?? new URL(value).hostname.toLowerCase();
};

/**
 * Throws DemoModeError when PORTAL_DEMO_MODE=1 is set where the real portal could be running. Demo mode swaps HubSpot,
 * R2 and email for fakes and `demo:reset` truncates every table, so it must never meet the production database.
 * Positive proof first: in production PORTAL_DEMO_DATABASE_HOSTS (comma separated hosts or parent domains) is required
 * and both database URLs must be on it (when set elsewhere it is enforced too). Then the deny rules: no host under
 * cleanstart.com or on PORTAL_DEMO_DENY_HOSTS, and in production no loopback or bare internal name (the droplet's
 * Postgres is "postgres" on the compose network). Both URLs must name the same host, port and database. Real service
 * credentials may not be set, a hosted demo needs a review password of 16 characters or more, and Turnstile keys must be
 * Cloudflare's test keys. APP_URL may not be the production portal address. No password is ever put in a message.
 * Runs from the raw process environment (instrumentation.ts), so SKIP_ENV_VALIDATION does not skip it.
 */
export function assertDemoModeAllowed(source: Source): void {
  if (!isDemoMode(source)) return;
  const production = source.NODE_ENV === 'production';
  const denied = hostList(source.PORTAL_DEMO_DENY_HOSTS);
  const allowed = hostList(source.PORTAL_DEMO_DATABASE_HOSTS);
  if (!source.DATABASE_URL) throw new DemoModeError('Demo mode refused: DATABASE_URL is not set.');

  for (const name of REAL_CREDENTIALS) {
    if (source[name]) throw new DemoModeError(`Demo mode refused: ${name} is set. Real service credentials must not be set in demo mode.`);
  }
  if (production && (source.PORTAL_REVIEW_PASSWORD ?? '').length < REVIEW_PASSWORD_MIN) {
    throw new DemoModeError(`Demo mode refused: PORTAL_REVIEW_PASSWORD is required in demo mode in production and must be at least ${REVIEW_PASSWORD_MIN} characters, so a hosted demo is never open.`);
  }
  if (source.TURNSTILE_SECRET_KEY !== undefined && source.TURNSTILE_SECRET_KEY !== TURNSTILE_TEST_SECRET_KEY) {
    throw new DemoModeError("Demo mode refused: TURNSTILE_SECRET_KEY must be Cloudflare's test key in demo mode.");
  }
  if (source.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== undefined && source.NEXT_PUBLIC_TURNSTILE_SITE_KEY !== TURNSTILE_TEST_SITE_KEY) {
    throw new DemoModeError("Demo mode refused: NEXT_PUBLIC_TURNSTILE_SITE_KEY must be Cloudflare's test key in demo mode.");
  }
  if (production && allowed.length === 0) {
    throw new DemoModeError('Demo mode refused: PORTAL_DEMO_DATABASE_HOSTS is not set. A hosted demo names the database hosts it may use (comma separated hosts or parent domains).');
  }

  const targets: DatabaseTarget[] = [];
  for (const name of ['DATABASE_URL', 'DATABASE_OWNER_URL'] as const) {
    const value = source[name];
    if (!value) continue;
    const target = targetOf(name, value);
    const { host } = target;
    if (matches(host, PRODUCT_DOMAIN)) throw new DemoModeError(`Demo mode refused: ${name} host "${host}" is under ${PRODUCT_DOMAIN}.`);
    if (denied.some((entry) => matches(host, entry))) throw new DemoModeError(`Demo mode refused: ${name} host "${host}" is on the PORTAL_DEMO_DENY_HOSTS deny list.`);
    if (production && isLoopback(host)) throw new DemoModeError(`Demo mode refused: NODE_ENV is "production" and ${name} host "${host}" is loopback.`);
    if (production && isInternalName(host)) throw new DemoModeError(`Demo mode refused: NODE_ENV is "production" and ${name} host "${host}" is an internal name, not a hosted database.`);
    if (allowed.length > 0 && !allowed.some((entry) => matches(host, entry))) throw new DemoModeError(`Demo mode refused: ${name} host "${host}" is not on the PORTAL_DEMO_DATABASE_HOSTS allow list.`);
    targets.push(target);
  }
  const [first, second] = targets;
  if (first && second && (first.host !== second.host || first.port !== second.port || first.database !== second.database)) {
    throw new DemoModeError('Demo mode refused: DATABASE_URL and DATABASE_OWNER_URL must name the same host, port and database.');
  }

  if (source.APP_URL) {
    const host = appHostOf(source.APP_URL);
    if (host === PRODUCTION_APP_HOST || denied.some((entry) => matches(host, entry))) {
      throw new DemoModeError(`Demo mode refused: APP_URL host "${host}" is the production portal or on the deny list.`);
    }
  }
}
