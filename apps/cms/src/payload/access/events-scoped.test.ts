import type { Access } from 'payload';
import { describe, expect, it, vi } from 'vitest';

import { formsUpdateAccess, mediaUpdateAccess } from './events-scoped';

const run = (fn: Access, user: unknown, payload: unknown = {}): ReturnType<Access> =>
  (fn as (a: { req: { user: unknown; payload: unknown } }) => ReturnType<Access>)({
    req: { user, payload },
  });

const roleUser = (role: string) => ({ id: 1, roles: [role] });

describe('mediaUpdateAccess', () => {
  it('is unrestricted for admin and editor', () => {
    expect(run(mediaUpdateAccess, roleUser('admin'))).toBe(true);
    expect(run(mediaUpdateAccess, roleUser('editor'))).toBe(true);
  });

  it('limits events to the event and webinar folders', () => {
    expect(run(mediaUpdateAccess, roleUser('events'))).toEqual({
      folder: { in: ['web/event', 'web/webinar'] },
    });
  });

  it('denies other roles and anonymous users', () => {
    for (const user of [roleUser('hr'), roleUser('legal'), roleUser('author'), null]) {
      expect(run(mediaUpdateAccess, user)).toBe(false);
    }
  });
});

describe('formsUpdateAccess', () => {
  const payloadWith = (events: unknown[], webinars: unknown[]) => ({
    find: vi.fn(async ({ collection }: { collection: string }) => ({
      docs: collection === 'events' ? events : webinars,
    })),
  });

  it('is unrestricted for admin and editor without querying', async () => {
    const payload = payloadWith([], []);
    expect(await run(formsUpdateAccess, roleUser('admin'), payload)).toBe(true);
    expect(await run(formsUpdateAccess, roleUser('editor'), payload)).toBe(true);
    expect(payload.find).not.toHaveBeenCalled();
  });

  it('limits events to forms attached to events or webinars, drafts included', async () => {
    const payload = payloadWith(
      [{ registrationForm: 4 }, { registrationForm: null }],
      [{ registrationForm: { id: 9 } }, { registrationForm: 4 }, {}],
    );
    expect(await run(formsUpdateAccess, roleUser('events'), payload)).toEqual({
      id: { in: [4, 9] },
    });
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({ draft: true, overrideAccess: true, pagination: false }),
    );
  });

  it('denies events when no form is attached yet', async () => {
    expect(await run(formsUpdateAccess, roleUser('events'), payloadWith([{}], []))).toBe(false);
  });

  it('denies other roles and anonymous users', async () => {
    for (const user of [roleUser('hr'), roleUser('legal'), roleUser('author'), null]) {
      expect(await run(formsUpdateAccess, user, payloadWith([], []))).toBe(false);
    }
  });
});
