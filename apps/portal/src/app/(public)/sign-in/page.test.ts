import { eq } from 'drizzle-orm';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { users } from '@/db/schema';
import { makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from '@/server/auth/auth';
import Page from './page';

const mocks = vi.hoisted(() => ({ requestHeaders: new Headers() }));
vi.mock('next/headers', () => ({
  headers: async () => mocks.requestHeaders,
  cookies: async () => ({ toString: () => mocks.requestHeaders.get('cookie') ?? '' }),
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));
vi.mock('@/components/screens/SignIn', () => ({ SignIn: () => null }));
vi.mock('@/server/auth/auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));
// Vitest compiles the page's JSX with the classic runtime (tsconfig keeps jsx as preserve), which reads a global React.
(globalThis as { React?: unknown }).React = React;

const PASSWORD = 'Sample#Pass1';

const cookieFor = async (email: string): Promise<string> => {
  const { headers } = await auth.api.signInEmail({ body: { email, password: PASSWORD }, returnHeaders: true });
  return headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');
};

beforeEach(async () => {
  mocks.requestHeaders = new Headers();
  await resetDb(testDb());
});

describe('sign in page', () => {
  it('shows the sign in screen to a visitor with no cookie', async () => {
    const element = (await Page()) as unknown as { type: unknown };
    expect(element.type).toBeDefined();
  });

  it('sends a signed in viewer to their role home', async () => {
    await makeUser(testDb(), { email: 'tech@kestrel.test', role: 'technical', password: PASSWORD });
    mocks.requestHeaders = new Headers({ cookie: await cookieFor('tech@kestrel.test') });
    await expect(Page()).rejects.toThrow('REDIRECT /partner/documents');
  });

  it('does not loop on a stale cookie: a garbage cookie renders the screen', async () => {
    mocks.requestHeaders = new Headers({ cookie: 'better-auth.session_token=not-a-real-token.abc' });
    await expect(Page()).resolves.toMatchObject({ type: expect.anything() });
  });

  it('does not loop on a stale cookie: a session whose user was since disabled renders the screen', async () => {
    const user = await makeUser(testDb(), { email: 'gone@kestrel.test', password: PASSWORD });
    mocks.requestHeaders = new Headers({ cookie: await cookieFor('gone@kestrel.test') });
    await testDb().update(users).set({ status: 'disabled' }).where(eq(users.id, user.id));
    await expect(Page()).resolves.toMatchObject({ type: expect.anything() });
  });
});
