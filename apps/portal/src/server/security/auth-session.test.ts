import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authSessions } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from '@/server/auth/auth';
import { CLIENT_IP_HEADER } from './client-ip';

vi.mock('@/server/auth/auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

/**
 * Sessions through the real Better Auth handler: cookie flags, session fixation, logout, and which client address
 * the limiter and the session record trust. src/proxy.ts writes CLIENT_IP_HEADER; the handler is called directly
 * here, so the tests play the proxy by setting it (or leaving it out).
 */
const db = testDb();
const ORIGIN = process.env.APP_URL ?? 'http://localhost:3004';
const PASSWORD = 'Sess1on-Test!9';

interface CallInit {
  method?: string;
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
}

const call = (path: string, init: CallInit = {}): Promise<Response> =>
  auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, {
      method: init.method ?? 'GET',
      headers: {
        origin: ORIGIN,
        'content-type': 'application/json',
        ...(init.cookie ? { cookie: init.cookie } : {}),
        ...init.headers,
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    }),
  );

const signIn = (email: string, password: string, headers: Record<string, string> = {}): Promise<Response> =>
  call('/sign-in/email', { method: 'POST', body: { email, password }, headers });

const sessionSetCookie = (response: Response): string | null =>
  response.headers.getSetCookie().find((c) => /session_token=/.test(c)) ?? null;

/** "name=value" of a Set-Cookie header, as a browser would send it back. */
const pair = (setCookie: string): string => setCookie.split(';')[0] ?? '';

const newUser = async (email: string) => {
  const partner = await makePartner(db, { status: 'active' });
  return makeUser(db, { partnerId: partner.id, role: 'partner_admin', email, password: PASSWORD });
};

beforeEach(() => resetDb(db));

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax, site wide and expires', async () => {
    await newUser('flags@session.test');
    const response = await signIn('flags@session.test', PASSWORD);
    expect(response.status).toBe(200);
    const cookie = sessionSetCookie(response) ?? '';
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//i);
    expect(cookie).toMatch(/Max-Age=\d+/i);
  });

  it('is configured explicitly for Secure rather than left to the library default', () => {
    expect(typeof auth.options.advanced?.useSecureCookies).toBe('boolean');
  });
});

describe('session fixation and logout', () => {
  it('ignores a session cookie planted before sign in and issues a new one', async () => {
    await newUser('fixation@session.test');
    const planted = 'better-auth.session_token=attacker-chosen-value.signature';
    const response = await call('/sign-in/email', { method: 'POST', body: { email: 'fixation@session.test', password: PASSWORD }, cookie: planted });
    const issued = pair(sessionSetCookie(response) ?? '');
    expect(issued).not.toBe('');
    expect(issued).not.toContain('attacker-chosen-value');
    expect(await (await call('/get-session', { cookie: planted })).json()).toBeNull();
  });

  it('gives every sign in its own session', async () => {
    const user = await newUser('twice@session.test');
    const a = pair(sessionSetCookie(await signIn('twice@session.test', PASSWORD)) ?? '');
    const b = pair(sessionSetCookie(await signIn('twice@session.test', PASSWORD)) ?? '');
    expect(a).not.toBe(b);
    expect(await db.select().from(authSessions).where(eq(authSessions.userId, user.id))).toHaveLength(2);
  });

  it('ends the session on the server at sign out, not only in the browser', async () => {
    const user = await newUser('logout@session.test');
    const cookie = pair(sessionSetCookie(await signIn('logout@session.test', PASSWORD)) ?? '');
    expect((await (await call('/get-session', { cookie })).json())?.user?.email).toBe('logout@session.test');
    expect((await call('/sign-out', { method: 'POST', body: {}, cookie })).status).toBe(200);
    expect(await (await call('/get-session', { cookie })).json()).toBeNull();
    expect(await db.select().from(authSessions).where(eq(authSessions.userId, user.id))).toHaveLength(0);
  });
});

describe('which client address is trusted', () => {
  const attempts = async (count: number, headers: (i: number) => Record<string, string>): Promise<number[]> => {
    const statuses: number[] = [];
    for (let i = 0; i < count; i += 1) statuses.push((await signIn(`flood-${Math.random()}@session.test`, 'Wrong-Passw0rd!', headers(i))).status);
    return statuses;
  };

  it('is not the leftmost x-forwarded-for entry: rotating it does not give a fresh allowance', async () => {
    const statuses = await attempts(12, (i) => ({ 'x-forwarded-for': `198.51.100.${i + 1}` }));
    expect(statuses).toContain(429);
  });

  it('is the address the proxy resolved: one address is stopped, another still has its own allowance', async () => {
    const first = await attempts(12, () => ({ [CLIENT_IP_HEADER]: '198.51.100.200' }));
    expect(first).toContain(429);
    const other = await attempts(1, () => ({ [CLIENT_IP_HEADER]: '198.51.100.201' }));
    expect(other).toEqual([401]);
  });

  it('is what the session records', async () => {
    const user = await newUser('ip@session.test');
    await signIn('ip@session.test', PASSWORD, { [CLIENT_IP_HEADER]: '198.51.100.77', 'x-forwarded-for': '6.6.6.6' });
    const [row] = await db.select().from(authSessions).where(eq(authSessions.userId, user.id));
    expect(row?.ipAddress).toBe('198.51.100.77');
  });
});
