import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { partners, users } from '@/db/schema';
import { makePartner, makeUser, resetDb, testDb } from '@/db/test-helpers';
import { PATH_HEADER } from '@/lib/next-path';
import { UnauthenticatedError } from '@/server/errors';
import { auth } from './auth';
import { type Action, can } from './policies';
import type { RoleKey, Viewer } from './types';
import { getViewer, homeFor, requireActionViewer, requireCan, requireKind, requireViewer } from './viewer';

const mocks = vi.hoisted(() => ({ requestHeaders: new Headers(), cookieStore: null as string | null }));
// cookies() answers with the cookie store of the render: the request cookie, or what a server action has just set.
vi.mock('next/headers', () => ({
  headers: async () => mocks.requestHeaders,
  cookies: async () => ({ toString: () => mocks.cookieStore ?? mocks.requestHeaders.get('cookie') ?? '' }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('./auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

const PASSWORD = 'Sample#Pass1';

/** Signs the user in and makes the next request carry that session cookie (and the path the proxy would add). */
const signInAs = async (email: string, path?: string): Promise<void> => {
  const { headers } = await auth.api.signInEmail({ body: { email, password: PASSWORD }, returnHeaders: true });
  const cookie = headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
  mocks.requestHeaders = new Headers(path ? { cookie, [PATH_HEADER]: path } : { cookie });
};

const redirectOf = async (run: () => Promise<unknown>): Promise<string | null> => {
  try {
    await run();
    return null;
  } catch (error) {
    const match = /^REDIRECT (.+)$/.exec((error as Error).message);
    if (!match) throw error;
    return match[1] ?? null;
  }
};

beforeEach(async () => {
  mocks.requestHeaders = new Headers();
  mocks.cookieStore = null;
  await resetDb(testDb());
});

describe('homeFor', () => {
  const partner = (role: 'partner_admin' | 'sales' | 'technical'): Viewer => ({
    id: 'u',
    kind: 'partner',
    role,
    partnerId: 'p',
    partnerName: 'P',
    email: 'e@x.co',
    name: 'N',
  });
  const staff = (role: 'partner_manager' | 'sales' | 'marketing'): Viewer => ({
    id: 'u',
    kind: 'staff',
    role,
    partnerId: null,
    partnerName: null,
    region: 'india',
    email: 'e@x.co',
    name: 'N',
  });

  const HOMES: Array<[RoleKey, Viewer, string, Action]> = [
    ['partner.partner_admin', partner('partner_admin'), '/partner/overview', 'overview.read'],
    ['partner.sales', partner('sales'), '/partner/overview', 'overview.read'],
    ['partner.technical', partner('technical'), '/partner/documents', 'document.read'],
    ['staff.partner_manager', staff('partner_manager'), '/admin/overview', 'overview.read_staff'],
    ['staff.sales', staff('sales'), '/admin/overview', 'overview.read_staff'],
    ['staff.marketing', staff('marketing'), '/admin/overview', 'overview.read_staff'],
  ];

  it.each(HOMES)('%s lands on %s and may open it', (_key, viewer, home, action) => {
    expect(homeFor(viewer)).toBe(home);
    expect(can(viewer, action)).toBe(true);
  });
});

describe('guards', () => {
  it('sends a signed out visitor to sign in with the page they asked for', async () => {
    mocks.requestHeaders = new Headers({ [PATH_HEADER]: '/partner/deals?status=pending' });
    expect(await redirectOf(requireViewer)).toBe('/sign-in?next=%2Fpartner%2Fdeals%3Fstatus%3Dpending');
  });

  it('sends a signed out visitor to plain sign in when the path is unknown or unsafe', async () => {
    expect(await redirectOf(requireViewer)).toBe('/sign-in');
    mocks.requestHeaders = new Headers({ [PATH_HEADER]: '//evil.example.com' });
    expect(await redirectOf(requireViewer)).toBe('/sign-in');
  });

  it('sends a stale cookie the same way as no cookie', async () => {
    mocks.requestHeaders = new Headers({
      cookie: 'better-auth.session_token=not-a-real-token.signature',
      [PATH_HEADER]: '/admin/audit',
    });
    expect(await redirectOf(requireViewer)).toBe('/sign-in?next=%2Fadmin%2Faudit');
  });

  it('tells a signed in user whose company was suspended that the account is paused', async () => {
    const partner = await makePartner(testDb(), {});
    const user = await makeUser(testDb(), { partnerId: partner.id, password: PASSWORD });
    await signInAs(user.email, '/partner/deals');
    await testDb().update(partners).set({ status: 'suspended' }).where(eq(partners.id, partner.id));
    expect(await redirectOf(requireViewer)).toBe('/sign-in?next=%2Fpartner%2Fdeals&reason=paused');
  });

  it('tells a disabled user the same, and never hints at a missing account', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    await testDb().update(users).set({ status: 'disabled' }).where(eq(users.id, user.id));
    expect(await redirectOf(requireViewer)).toBe('/sign-in?reason=paused');
    mocks.requestHeaders = new Headers();
    expect(await redirectOf(requireViewer)).toBe('/sign-in');
  });

  it('sends a partner who opens /admin to /partner/overview, and a technical user to Documents', async () => {
    const partner = await makePartner(testDb(), {});
    const admin = await makeUser(testDb(), { partnerId: partner.id, role: 'partner_admin', password: PASSWORD });
    const technical = await makeUser(testDb(), { partnerId: partner.id, role: 'technical', password: PASSWORD });
    await signInAs(admin.email);
    expect(await redirectOf(() => requireKind('staff'))).toBe('/partner/overview');
    await signInAs(technical.email);
    expect(await redirectOf(() => requireKind('staff'))).toBe('/partner/documents');
  });

  it('sends staff who open /partner to their own home', async () => {
    const manager = await makeUser(testDb(), { kind: 'staff', role: 'partner_manager', password: PASSWORD });
    const marketing = await makeUser(testDb(), { kind: 'staff', role: 'marketing', password: PASSWORD });
    await signInAs(manager.email);
    expect(await redirectOf(() => requireKind('partner'))).toBe('/admin/overview');
    await signInAs(marketing.email);
    expect(await redirectOf(() => requireKind('partner'))).toBe('/admin/overview');
  });

  it('returns the viewer when the kind matches', async () => {
    const manager = await makeUser(testDb(), { kind: 'staff', role: 'partner_manager', password: PASSWORD });
    await signInAs(manager.email);
    expect((await requireKind('staff')).id).toBe(manager.id);
  });

  it('requireCan lets a role through and bounces one that may not', async () => {
    const partner = await makePartner(testDb(), {});
    const sales = await makeUser(testDb(), { partnerId: partner.id, role: 'sales', password: PASSWORD });
    await signInAs(sales.email);
    expect((await requireCan('registration.create')).id).toBe(sales.id);
    expect(await redirectOf(() => requireCan('team.read'))).toBe('/partner/overview?denied=1');
    expect(await redirectOf(() => requireCan('registration.read', { partnerId: 'another-company' }))).toBe('/partner/overview?denied=1');
  });

  it('requireActionViewer throws instead of redirecting', async () => {
    await expect(requireActionViewer()).rejects.toBeInstanceOf(UnauthenticatedError);
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    expect((await requireActionViewer()).id).toBe(user.id);
  });

  it('getViewer reads the request headers', async () => {
    expect(await getViewer()).toBeNull();
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    expect((await getViewer())?.id).toBe(user.id);
  });

  it('getViewer follows a session cookie replaced during the request, as when a server action changes the password', async () => {
    const user = await makeUser(testDb(), { password: PASSWORD });
    await signInAs(user.email);
    const staleCookie = mocks.requestHeaders.get('cookie') ?? '';
    await signInAs(user.email);
    mocks.cookieStore = mocks.requestHeaders.get('cookie');
    await auth.api.signOut({ headers: new Headers({ cookie: staleCookie }) });
    mocks.requestHeaders = new Headers({ cookie: staleCookie });
    expect((await getViewer())?.id).toBe(user.id);
  });
});
