import { describe, expect, it } from 'vitest';
import { DemoModeError, assertDemoModeAllowed, isDemoMode } from './demo';

const neon = 'postgresql://portal_app:pw@ep-demo-123.eu-central-1.aws.neon.tech/portal?sslmode=require';
const PASSWORD = 'review-password-16';
/** A complete hosted demo environment: every test changes one thing. */
const hostedDemo = {
  PORTAL_DEMO_MODE: '1',
  NODE_ENV: 'production',
  DATABASE_URL: neon,
  DATABASE_OWNER_URL: neon,
  PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech',
  PORTAL_REVIEW_PASSWORD: PASSWORD,
};
const withUrl = (url: string, extra: Record<string, string> = {}) => ({ ...hostedDemo, DATABASE_URL: url, DATABASE_OWNER_URL: url, PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech,example.net', ...extra });

describe('isDemoMode', () => {
  it('is on only for exactly 1', () => {
    expect(isDemoMode({ PORTAL_DEMO_MODE: '1' })).toBe(true);
    for (const value of [undefined, '', '0', 'true', 'yes', ' 1', '1 ', 'TRUE']) {
      expect(isDemoMode({ PORTAL_DEMO_MODE: value }), String(value)).toBe(false);
    }
  });
});

describe('assertDemoModeAllowed', () => {
  it('does nothing when the switch is off, whatever the environment', () => {
    expect(() => assertDemoModeAllowed({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost/d' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: 'true', NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@localhost/d', HUBSPOT_PORTAL_TOKEN: 'x' })).not.toThrow();
  });

  it('allows a hosted database in production', () => {
    expect(() => assertDemoModeAllowed(hostedDemo)).not.toThrow();
  });

  it('allows a local database outside production', () => {
    for (const NODE_ENV of ['development', 'test', undefined]) {
      expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV, DATABASE_URL: 'postgresql://u:p@localhost:5432/d' })).not.toThrow();
    }
  });

  it.each([
    'postgresql://u:p@localhost:5432/d',
    'postgresql://u:p@LOCALHOST.:5432/d',
    'postgresql://u:p@127.0.0.1:5432/d',
    'postgresql://u:p@127.8.9.10:5432/d',
    'postgresql://u:p@[::1]:5432/d',
    'postgresql://u:p@0.0.0.0:5432/d',
    'postgresql://u:p@db.localhost:5432/d',
    'postgresql://u:p@postgres:5432/cleanstart_portal',
  ])('refuses %s in production', (url) => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, DATABASE_URL: url, DATABASE_OWNER_URL: url, PORTAL_DEMO_DATABASE_HOSTS: 'localhost,postgres,127.0.0.1,0.0.0.0,[::1],::1' })).toThrow(DemoModeError);
  });

  it.each([
    ['hex', 'postgresql://u:p@0x7f.0.0.1/d'],
    ['octal', 'postgresql://u:p@0177.0.0.1/d'],
    ['decimal', 'postgresql://u:p@2130706433/d'],
    ['short', 'postgresql://u:p@127.1/d'],
    ['mapped IPv6', 'postgresql://u:p@[::ffff:7f00:1]/d'],
    ['mapped IPv6 dotted', 'postgresql://u:p@[::ffff:127.0.0.1]/d'],
    ['IPv6 any', 'postgresql://u:p@[::]/d'],
  ])('sees loopback behind the %s spelling', (_label, url) => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, DATABASE_URL: url, DATABASE_OWNER_URL: url, PORTAL_DEMO_DATABASE_HOSTS: '0x7f.0.0.1,0177.0.0.1,2130706433,127.1,[::ffff:7f00:1],[::ffff:127.0.0.1],[::]' })).toThrow(/loopback/);
  });

  it('refuses a host under cleanstart.com in any environment', () => {
    for (const NODE_ENV of ['production', 'development']) {
      expect(() => assertDemoModeAllowed({ ...hostedDemo, NODE_ENV, DATABASE_URL: 'postgresql://u:p@db.cleanstart.com/d', DATABASE_OWNER_URL: 'postgresql://u:p@db.cleanstart.com/d' })).toThrow(/cleanstart\.com/);
      expect(() => assertDemoModeAllowed({ ...hostedDemo, NODE_ENV, DATABASE_URL: 'postgresql://u:p@cleanstart.com/d' })).toThrow(DemoModeError);
    }
    expect(() => assertDemoModeAllowed(withUrl('postgresql://u:p@notcleanstart.com/d', { PORTAL_DEMO_DATABASE_HOSTS: 'notcleanstart.com' }))).not.toThrow();
  });

  it('refuses a percent encoded or multi dot spelling of the product domain', () => {
    for (const host of ['%63leanstart.com', 'cleanstart.com..', 'CLEANSTART.COM.', 'db.%63leanstart.com', 'cleanstart%2ecom']) {
      const url = `postgresql://u:p@${host}/d`;
      expect(() => assertDemoModeAllowed(withUrl(url, { NODE_ENV: 'development' })), host).toThrow(DemoModeError);
    }
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@cleanstart.com../d' })).toThrow(/cleanstart\.com/);
  });

  it('refuses a URL whose query parameters override the host, port or database the way pg lets them', () => {
    for (const query of ['host=db.cleanstart.com', 'hostaddr=203.0.113.5', 'port=6543', 'dbname=other']) {
      const url = `${neon}&${query}`;
      expect(() => assertDemoModeAllowed(withUrl(url)), query).toThrow(/query parameter/);
    }
  });

  it('refuses anything that is not a plain host name or address', () => {
    for (const url of ['postgresql://u:p@db_host.example.net/d', 'postgresql://u:p@db.example.net%2fx/d', 'postgresql:///d', 'postgresql://u:p@[zz]/d', 'postgresql://u:p@1.2.3.4.5/d']) {
      expect(() => assertDemoModeAllowed(withUrl(url, { NODE_ENV: 'development' })), url).toThrow(DemoModeError);
    }
    expect(() => assertDemoModeAllowed(withUrl('mysql://u:p@db.example.net/d'))).toThrow(/postgres/);
  });

  it('refuses a host on PORTAL_DEMO_DENY_HOSTS, exact or as a parent domain', () => {
    const env = { ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech,prod.example.net,203.0.113.7', PORTAL_DEMO_DENY_HOSTS: ' 203.0.113.7 , prod.example.net ' };
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: 'postgresql://u:p@203.0.113.7:5432/d', DATABASE_OWNER_URL: 'postgresql://u:p@203.0.113.7:5432/d' })).toThrow(/deny list/);
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: 'postgresql://u:p@db.prod.example.net/d', DATABASE_OWNER_URL: 'postgresql://u:p@db.prod.example.net/d' })).toThrow(/deny list/);
    expect(() => assertDemoModeAllowed({ ...env })).not.toThrow();
  });

  it('compares a denied address however the database URL spells it', () => {
    const env = { ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: '0xcb007105,203.0.113.5', PORTAL_DEMO_DENY_HOSTS: '203.0.113.5' };
    for (const host of ['0xcb007105', '3405803781', '0313.0.113.5']) {
      const url = `postgresql://u:p@${host}/d`;
      expect(() => assertDemoModeAllowed({ ...env, DATABASE_URL: url, DATABASE_OWNER_URL: url, PORTAL_DEMO_DATABASE_HOSTS: host }), host).toThrow(/deny list/);
    }
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech', PORTAL_DEMO_DENY_HOSTS: '0xcb007105' })).not.toThrow();
    const same = 'postgresql://u:p@203.0.113.5/d';
    expect(() => assertDemoModeAllowed({ ...hostedDemo, DATABASE_URL: same, DATABASE_OWNER_URL: same, PORTAL_DEMO_DATABASE_HOSTS: '203.0.113.5', PORTAL_DEMO_DENY_HOSTS: '0xcb007105' })).toThrow(/deny list/);
  });

  it('checks the owner URL as well as the app URL', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, DATABASE_OWNER_URL: 'postgresql://u:p@127.0.0.1/d' })).toThrow(/DATABASE_OWNER_URL/);
  });

  it('refuses the production portal address as APP_URL', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, APP_URL: 'https://partners.cleanstart.com' })).toThrow(/APP_URL/);
    expect(() => assertDemoModeAllowed({ ...hostedDemo, APP_URL: 'https://portal-demo.vercel.app' })).not.toThrow();
  });

  it('refuses a missing or unparseable database URL', () => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1' })).toThrow(/DATABASE_URL is not set/);
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', DATABASE_URL: 'not a url' })).toThrow(/not a valid URL/);
  });

  it('never prints a password', () => {
    try {
      assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:hunter2secret@localhost/d' });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain('hunter2secret');
    }
  });
});

describe('the positive allow list of database hosts', () => {
  it('is required in production and fails closed when unset or empty', () => {
    for (const PORTAL_DEMO_DATABASE_HOSTS of [undefined, '', ' , ']) {
      expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS }), String(PORTAL_DEMO_DATABASE_HOSTS)).toThrow(/PORTAL_DEMO_DATABASE_HOSTS/);
    }
  });

  it('accepts an exact host or a parent domain, for both URLs', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'ep-demo-123.eu-central-1.aws.neon.tech' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: ' other.example.org , neon.tech ' })).not.toThrow();
  });

  it('refuses a host that is not on it, app URL or owner URL', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'demo-vm.example.org' })).toThrow(/allow list/);
    const other = 'postgresql://portal_owner:pw@demo-vm.example.org/portal';
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech', DATABASE_OWNER_URL: other })).toThrow(/DATABASE_OWNER_URL.*allow list/);
  });

  it('is optional outside production, and still enforced there when set', () => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@localhost/d' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@localhost/d', PORTAL_DEMO_DATABASE_HOSTS: 'neon.tech' })).toThrow(/allow list/);
  });

  it('keeps the deny list as a second check', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DENY_HOSTS: 'neon.tech' })).toThrow(/deny list/);
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'cleanstart.com', DATABASE_URL: 'postgresql://u:p@db.cleanstart.com/d', DATABASE_OWNER_URL: 'postgresql://u:p@db.cleanstart.com/d' })).toThrow(/cleanstart\.com/);
  });
});

describe('the two database URLs', () => {
  it('must name the same host, port and database', () => {
    const app = 'postgresql://portal_app:pw@demo.example.net:5432/portal_demo';
    const env = { ...hostedDemo, PORTAL_DEMO_DATABASE_HOSTS: 'example.net', DATABASE_URL: app };
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_OWNER_URL: 'postgresql://portal_owner:other@DEMO.example.net./portal_demo' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@other.example.net:5432/portal_demo' })).toThrow(/same host, port and database/);
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@demo.example.net:5433/portal_demo' })).toThrow(/same host, port and database/);
    expect(() => assertDemoModeAllowed({ ...env, DATABASE_OWNER_URL: 'postgresql://portal_owner:pw@demo.example.net:5432/cleanstart_portal' })).toThrow(/same host, port and database/);
  });

  it('may differ in the user name and the password', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, DATABASE_OWNER_URL: neon.replace('portal_app:pw', 'portal_owner:other') })).not.toThrow();
  });
});

describe('real service credentials next to demo mode', () => {
  it.each(['HUBSPOT_PORTAL_TOKEN', 'HUBSPOT_WEBHOOK_SECRET', 'R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'BREVO_API_KEY', 'CMS_INTAKE_API_KEY'])('refuses %s', (name) => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, [name]: 'value' })).toThrow(new RegExp(name));
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', DATABASE_URL: 'postgresql://u:p@localhost/d', [name]: 'value' })).toThrow(new RegExp(name));
    expect(() => assertDemoModeAllowed({ ...hostedDemo, [name]: '' })).not.toThrow();
  });
});

describe('the review password in a hosted demo', () => {
  it('is required, at least 16 characters, in production', () => {
    for (const PORTAL_REVIEW_PASSWORD of [undefined, '', 'x'.repeat(15)]) {
      expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_REVIEW_PASSWORD }), String(PORTAL_REVIEW_PASSWORD)).toThrow(/PORTAL_REVIEW_PASSWORD is required in demo mode/);
    }
    expect(() => assertDemoModeAllowed({ ...hostedDemo, PORTAL_REVIEW_PASSWORD: 'x'.repeat(16) })).not.toThrow();
  });

  it('is not required outside production', () => {
    expect(() => assertDemoModeAllowed({ PORTAL_DEMO_MODE: '1', NODE_ENV: 'development', DATABASE_URL: 'postgresql://u:p@localhost/d' })).not.toThrow();
  });
});

describe('Turnstile keys in demo mode', () => {
  it('accepts unset and Cloudflare test keys, refuses anything else', () => {
    expect(() => assertDemoModeAllowed({ ...hostedDemo, TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA' })).not.toThrow();
    expect(() => assertDemoModeAllowed({ ...hostedDemo, TURNSTILE_SECRET_KEY: '0x4AAAAAAAreal' })).toThrow(/TURNSTILE_SECRET_KEY must be Cloudflare's test key in demo mode/);
    expect(() => assertDemoModeAllowed({ ...hostedDemo, NEXT_PUBLIC_TURNSTILE_SITE_KEY: '0x4AAAAAAAreal' })).toThrow(/NEXT_PUBLIC_TURNSTILE_SITE_KEY must be Cloudflare's test key in demo mode/);
  });
});
