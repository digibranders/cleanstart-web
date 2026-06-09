import { describe, expect, it, vi } from 'vitest';

import { deleteCareerApplicationsByEmail } from './dsar';

describe('deleteCareerApplicationsByEmail', () => {
  it('deletes resumes then applications for the email, returns the count', async () => {
    const deleted: Array<{ collection: string; id: number }> = [];
    const payload = {
      find: vi.fn(async () => ({ docs: [{ id: 1, resume: 11 }, { id: 2, resume: 22 }] })),
      delete: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
        deleted.push({ collection, id });
        return { id };
      }),
      logger: { warn: vi.fn() },
    };
    const result = await deleteCareerApplicationsByEmail(payload as never, 'ada@example.com');
    expect(result.deleted).toBe(2);
    expect(deleted).toContainEqual({ collection: 'resumes', id: 11 });
    expect(deleted).toContainEqual({ collection: 'career-applications', id: 1 });
  });
});
