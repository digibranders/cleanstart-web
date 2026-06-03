import { describe, expect, it, vi } from 'vitest';

import { purgeCareerApplications } from './purge-career-applications';

const makePayload = (docs: Array<{ id: number; resume: number | null }>) => {
  const deleted: Array<{ collection: string; id: number }> = [];
  const updated: Array<{ collection: string; id: number }> = [];
  return {
    deleted,
    updated,
    find: vi.fn(async () => ({ docs })),
    delete: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
      deleted.push({ collection, id });
      return { id };
    }),
    update: vi.fn(async ({ collection, id }: { collection: string; id: number }) => {
      updated.push({ collection, id });
      return { id };
    }),
  };
};

describe('purgeCareerApplications', () => {
  it('deletes the resume file and redacts the application for each expired row', async () => {
    const payload = makePayload([{ id: 1, resume: 11 }, { id: 2, resume: null }]);
    const result = await purgeCareerApplications(payload as never, { retentionDays: 365, now: new Date('2027-01-01T00:00:00Z') });
    expect(result.redacted).toBe(2);
    expect(payload.deleted).toContainEqual({ collection: 'resumes', id: 11 });
    expect(payload.updated).toHaveLength(2);
  });

  it('is a no-op when nothing is expired', async () => {
    const payload = makePayload([]);
    const result = await purgeCareerApplications(payload as never, { retentionDays: 365, now: new Date('2027-01-01T00:00:00Z') });
    expect(result.redacted).toBe(0);
  });
});
