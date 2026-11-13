import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeUser, resetDb, testDb } from '@/db/test-helpers';
import { auth } from '@/server/auth/auth';
import { sendPasswordResetEmail } from '@/server/auth/auth-mail';

const scope = vi.hoisted(() => ({ queued: [] as Array<() => unknown>, outsideRequest: false }));

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  // The real `after` throws outside a request scope (unit tests, scripts); this one can play both cases.
  after: (task: () => unknown) => {
    if (scope.outsideRequest) throw new Error('`after` was called outside a request scope');
    scope.queued.push(task);
  },
}));

vi.mock('@/server/auth/auth-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => undefined),
  sendPasswordChangedEmail: vi.fn(async () => undefined),
}));

const db = testDb();
const ask = (email: string) => auth.api.requestPasswordReset({ body: { email, redirectTo: '/reset-password' } });

beforeEach(async () => {
  vi.clearAllMocks();
  scope.queued.length = 0;
  scope.outsideRequest = false;
  await resetDb(db);
});

describe('the reset email is sent after the response', () => {
  it('queues the send for after the response instead of running it inside the request', async () => {
    const user = await makeUser(db, { password: 'Sample#Pass1' });
    await ask(user.email);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(scope.queued).toHaveLength(1);
    await scope.queued[0]?.();
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0].to.email).toBe(user.email);
  });

  it('answers a known and an unknown address the same way, and queues nothing for the unknown one', async () => {
    const user = await makeUser(db, { password: 'Sample#Pass1' });
    const known = await ask(user.email);
    scope.queued.length = 0;
    const unknown = await ask('nobody@example.com');
    expect(unknown).toEqual(known);
    expect(scope.queued).toHaveLength(0);
  });

  it('logs a failed send and does not throw from the queued task', async () => {
    const user = await makeUser(db, { password: 'Sample#Pass1' });
    vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce(new Error('brevo down'));
    await ask(user.email);
    await expect(Promise.resolve(scope.queued[0]?.())).resolves.toBeUndefined();
  });

  it('still sends when there is no request scope to hang the task on', async () => {
    scope.outsideRequest = true;
    const user = await makeUser(db, { password: 'Sample#Pass1' });
    await ask(user.email);
    await vi.waitFor(() => expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1));
  });
});
