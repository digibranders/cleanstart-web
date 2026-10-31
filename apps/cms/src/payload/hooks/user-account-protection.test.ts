import { describe, expect, it, vi } from 'vitest';

import { flagCredentialChange, requireCurrentPasswordForSelf, revokeSessionsOnAccountChange } from './user-account-protection';

// Hotfix: over REST a user could change their own email or password without the current password, old sessions
// survived a password change, and disabling an account left its tokens and API key working until they expired.
const self = { id: 7, collection: 'users', roles: ['author'], _sid: 'current-session' };
const original = { id: 7, email: 'a@example.com', enabled: true, sessions: [] };

const makeReq = (user: unknown, login = vi.fn().mockResolvedValue({}), updateOne = vi.fn().mockResolvedValue({}), sessions: unknown[] = []) => ({
  req: { user, payload: { login, db: { updateOne, findOne: vi.fn().mockResolvedValue({ ...original, sessions }) } } },
  login,
  updateOne,
});

type BeforeArgs = Parameters<typeof requireCurrentPasswordForSelf>[0];
const runBefore = async (user: unknown, data: Record<string, unknown>, login?: ReturnType<typeof vi.fn>) => {
  const { req, login: l } = makeReq(user, login);
  const result = requireCurrentPasswordForSelf({ req, data, originalDoc: original, operation: 'update', context: {}, collection: { slug: 'users' } } as unknown as BeforeArgs);
  return { result: await result, login: l };
};

// ValidationError keeps the field message in data.errors; its own message is generic.
const rejection = async (promise: Promise<unknown>): Promise<string> => {
  try {
    await promise;
  } catch (error) {
    return (error as { data?: { errors?: { message: string }[] } }).data?.errors?.[0]?.message ?? '';
  }
  return 'resolved';
};

describe('requireCurrentPasswordForSelf', () => {
  it('refuses a self password change with no current password', async () => {
    expect(await rejection(runBefore(self, { password: 'a-brand-new-password-1' }))).toMatch(/current password/i);
  });

  it('refuses a self email change with no current password', async () => {
    expect(await rejection(runBefore(self, { email: 'new@example.com' }))).toMatch(/current password/i);
  });

  it('refuses when the current password is wrong', async () => {
    const login = vi.fn().mockRejectedValue(new Error('bad credentials'));
    expect(await rejection(runBefore(self, { password: 'a-brand-new-password-1', currentPassword: 'wrong' }, login))).toMatch(/incorrect/i);
  });

  it('verifies the current password against the stored email, then removes it from the data', async () => {
    const { result, login } = await runBefore(self, { email: 'new@example.com', currentPassword: 'right' });
    expect(login).toHaveBeenCalledWith(expect.objectContaining({ collection: 'users', data: { email: 'a@example.com', password: 'right' } }));
    expect(result).not.toHaveProperty('currentPassword');
    expect(result).toMatchObject({ email: 'new@example.com' });
  });

  it('does not ask when the email is sent unchanged (the account form always sends it)', async () => {
    const { login } = await runBefore(self, { name: 'New Name', email: 'A@Example.com' });
    expect(login).not.toHaveBeenCalled();
  });

  it('does not ask for a profile-only change', async () => {
    const { login } = await runBefore(self, { name: 'New Name' });
    expect(login).not.toHaveBeenCalled();
  });

  it('does not ask an admin who resets another account', async () => {
    const admin = { id: 1, collection: 'users', roles: ['admin'] };
    const { login } = await runBefore(admin, { password: 'a-brand-new-password-1' });
    expect(login).not.toHaveBeenCalled();
  });

  it('leaves server-side calls with no user alone', async () => {
    const { login } = await runBefore(null, { password: 'a-brand-new-password-1' });
    expect(login).not.toHaveBeenCalled();
  });
});

// What the before hook records for the after hook, run the way Payload runs them: before first, then after on the same context.
type BeforeFlagArgs = Parameters<typeof flagCredentialChange>[0];
type AfterArgs = Parameters<typeof revokeSessionsOnAccountChange>[0];
const runAfter = async (user: unknown, data: Record<string, unknown>, sessions: unknown[] = []) => {
  const context: Record<string, unknown> = {};
  const { req, updateOne } = makeReq(user, undefined, undefined, sessions);
  await flagCredentialChange({ req, data, originalDoc: original, operation: 'update', context, collection: { slug: 'users' } } as unknown as BeforeFlagArgs);
  await revokeSessionsOnAccountChange({ req, data: {}, previousDoc: original, doc: { ...original, id: 7 }, operation: 'update', context, collection: { slug: 'users' } } as unknown as AfterArgs);
  return updateOne;
};

describe('revokeSessionsOnAccountChange', () => {
  it('keeps only the current session after a password change by the owner', async () => {
    const updateOne = await runAfter(self, { password: 'a-brand-new-password-1' }, [{ id: 'old' }, { id: 'current-session' }]);
    expect(updateOne.mock.calls[0]?.[0].data.sessions).toEqual([{ id: 'current-session' }]);
    expect(updateOne.mock.calls[0]?.[0]).toMatchObject({ id: 7, collection: 'users', returning: false });
  });

  it('writes the whole row back, because updateOne upserts and the row has required columns', async () => {
    const updateOne = await runAfter(self, { password: 'a-brand-new-password-1' }, [{ id: 'old' }]);
    expect(updateOne.mock.calls[0]?.[0].data).toMatchObject({ email: 'a@example.com', enabled: true, updatedAt: null });
  });

  it('revokes every session when an admin resets another account', async () => {
    const updateOne = await runAfter({ id: 1, collection: 'users', roles: ['admin'] }, { password: 'a-brand-new-password-1' }, [{ id: 'old' }]);
    expect(updateOne.mock.calls[0]?.[0].data.sessions).toEqual([]);
  });

  it('revokes every session after an email change by the owner except the current one', async () => {
    const updateOne = await runAfter(self, { email: 'new@example.com' }, [{ id: 'old' }, { id: 'current-session' }]);
    expect(updateOne.mock.calls[0]?.[0].data.sessions).toEqual([{ id: 'current-session' }]);
  });

  it('revokes every session and the API key when an account is disabled, even the actor own', async () => {
    const updateOne = await runAfter({ id: 1, collection: 'users', roles: ['admin'] }, { enabled: false }, [{ id: 'old' }]);
    expect(updateOne.mock.calls[0]?.[0].data).toMatchObject({ sessions: [], enableAPIKey: false });
  });

  it('does nothing for a profile-only change', async () => {
    expect(await runAfter(self, { name: 'New Name' })).not.toHaveBeenCalled();
  });

  it('does nothing when the email is sent unchanged', async () => {
    expect(await runAfter(self, { email: 'a@example.com' })).not.toHaveBeenCalled();
  });

  it('does nothing when an already disabled account is saved as disabled again', async () => {
    const context: Record<string, unknown> = {};
    const { req, updateOne } = makeReq({ id: 1, collection: 'users', roles: ['admin'] });
    await flagCredentialChange({ req, data: { enabled: false }, originalDoc: { ...original, enabled: false }, operation: 'update', context, collection: { slug: 'users' } } as unknown as BeforeFlagArgs);
    await revokeSessionsOnAccountChange({ req, data: {}, previousDoc: original, doc: { ...original, id: 7 }, operation: 'update', context, collection: { slug: 'users' } } as unknown as AfterArgs);
    expect(updateOne).not.toHaveBeenCalled();
  });
});
