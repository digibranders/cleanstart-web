import { describe, expect, it, vi } from 'vitest';

import { deletePartnerApplicationsByEmail } from './dsar';

describe('deletePartnerApplicationsByEmail', () => {
  it('deletes all partner rows for the email and returns the count', async () => {
    const deleted: number[] = [];
    const payload = {
      find: vi.fn(async () => ({ docs: [{ id: 1 }, { id: 2 }] })),
      delete: vi.fn(async ({ id }: { id: number }) => {
        deleted.push(id);
        return { id };
      }),
      logger: { warn: vi.fn() },
    };
    const result = await deletePartnerApplicationsByEmail(payload as never, 'ada@acme.com');
    expect(result.deleted).toBe(2);
    expect(deleted).toEqual([1, 2]);
  });

  it('returns 0 when there are no matches', async () => {
    const payload = { find: vi.fn(async () => ({ docs: [] })), delete: vi.fn(), logger: { warn: vi.fn() } };
    const result = await deletePartnerApplicationsByEmail(payload as never, 'none@acme.com');
    expect(result.deleted).toBe(0);
  });
});
