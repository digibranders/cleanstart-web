import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { purgeDealRegistrations } from './purge-deal-registrations';

const oldRow = { id: 1, prospectEmail: 'sam@prospect.com', partnerRepEmail: 'jane@acme.com', piiRedactedAt: null };

const makePayload = () => ({
  find: vi.fn().mockResolvedValue({ docs: [oldRow] }),
  update: vi.fn().mockResolvedValue({}),
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
});

beforeEach(() => {});
afterEach(() => {
  vi.clearAllMocks();
});

describe('purgeDealRegistrations', () => {
  it('nulls PII fields and stamps piiRedactedAt for eligible rows', async () => {
    const payload = makePayload();
    const result = await purgeDealRegistrations(payload as never, { retentionDays: 365 });
    expect(result.redacted).toBe(1);
    const upd = payload.update.mock.calls[0]?.[0];
    expect(upd.collection).toBe('deal-registrations');
    expect(upd.data.prospectEmail).toBeNull();
    expect(upd.data.partnerRepEmail).toBeNull();
    expect(upd.data.ip).toBeNull();
    expect(upd.data.piiRedactedAt).toBeTruthy();
  });
});
