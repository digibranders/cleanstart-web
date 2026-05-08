import { describe, expect, it } from 'vitest';

import { eventStatusTimestampsHook } from './event-status-timestamps';

const runHook = (
  data: Record<string, unknown>,
  originalDoc: Record<string, unknown> = {},
) => {
  const args = {
    data,
    originalDoc,
    req: {} as never,
    operation: 'update' as const,
    collection: { slug: 'events' } as never,
    context: {} as never,
  };
  return eventStatusTimestampsHook(args as never);
};

describe('eventStatusTimestampsHook', () => {
  it('stamps cancelledAt on the transition to cancelled', async () => {
    const result = (await runHook(
      { eventStatus: 'cancelled' },
      { eventStatus: 'scheduled' },
    )) as { cancelledAt?: string | null };
    expect(typeof result.cancelledAt).toBe('string');
    expect(result.cancelledAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('does not re-stamp cancelledAt when already cancelled', async () => {
    const original = '2026-01-01T10:00:00.000Z';
    const result = (await runHook(
      { eventStatus: 'cancelled' },
      { eventStatus: 'cancelled', cancelledAt: original },
    )) as { cancelledAt?: string | null };
    expect(result.cancelledAt).toBe(undefined);
  });

  it('clears cancelledAt when status flips back to scheduled', async () => {
    const result = (await runHook(
      { eventStatus: 'scheduled' },
      { eventStatus: 'cancelled', cancelledAt: '2026-01-01T10:00:00.000Z' },
    )) as { cancelledAt?: string | null };
    expect(result.cancelledAt).toBeNull();
  });

  it('captures previousStartDate when postponed AND startsAt changes', async () => {
    const result = (await runHook(
      { eventStatus: 'postponed', startsAt: '2026-09-12T10:00:00Z' },
      { eventStatus: 'scheduled', startsAt: '2026-09-10T10:00:00Z' },
    )) as { previousStartDate?: string | null };
    expect(result.previousStartDate).toBe('2026-09-10T10:00:00Z');
  });

  it('does not overwrite an editor-set previousStartDate', async () => {
    const result = (await runHook(
      {
        eventStatus: 'postponed',
        startsAt: '2026-09-12T10:00:00Z',
        previousStartDate: '2026-08-01T00:00:00Z',
      },
      { eventStatus: 'scheduled', startsAt: '2026-09-10T10:00:00Z' },
    )) as { previousStartDate?: string | null };
    expect(result.previousStartDate).toBe('2026-08-01T00:00:00Z');
  });

  it('does not capture previousStartDate when status is not postponed', async () => {
    const result = (await runHook(
      { eventStatus: 'scheduled', startsAt: '2026-09-12T10:00:00Z' },
      { eventStatus: 'scheduled', startsAt: '2026-09-10T10:00:00Z' },
    )) as { previousStartDate?: string | null };
    expect(result.previousStartDate).toBeUndefined();
  });
});
