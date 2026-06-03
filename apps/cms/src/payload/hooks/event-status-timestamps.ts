import type { CollectionBeforeChangeHook } from 'payload';

interface EventDoc {
  eventStatus?: string | null;
  cancelledAt?: string | null;
  startsAt?: string | null;
  previousStartDate?: string | null;
}

/**
 * `beforeChange` hook for Events + Webinars. Maintains the lifecycle
 * timestamps that go alongside `eventStatus` so editors don't have to
 * remember to fill them by hand:
 *
 *   - When `eventStatus` flips to `cancelled`, stamp `cancelledAt =
 *     now` (only on the transition — re-saving an already-cancelled
 *     event keeps the original timestamp).
 *   - When `eventStatus` flips back to `scheduled` from a previously
 *     cancelled state, clear `cancelledAt`.
 *   - When `startsAt` changes AND `eventStatus` is `postponed`,
 *     remember the OLD startsAt as `previousStartDate` so the
 *     Schema.org Event blob can emit it (Google's reschedule signal).
 *     Editors can override `previousStartDate` manually if they want
 *     to suppress the public banner.
 */
export const eventStatusTimestampsHook: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  if (!data) return data;
  const next = data as EventDoc;
  const prev = (originalDoc ?? {}) as EventDoc;

  const result: EventDoc = { ...next };

  // cancelledAt lifecycle.
  if (next.eventStatus === 'cancelled' && prev.eventStatus !== 'cancelled') {
    result.cancelledAt = new Date().toISOString();
  } else if (next.eventStatus !== 'cancelled' && prev.eventStatus === 'cancelled') {
    result.cancelledAt = null;
  }

  // previousStartDate auto-capture: only when the editor flipped to
  // postponed AND moved startsAt in the same save. If they changed
  // startsAt without flipping to postponed (e.g. fixing a typo on a
  // scheduled event), don't churn previousStartDate.
  if (
    next.eventStatus === 'postponed' &&
    typeof prev.startsAt === 'string' &&
    typeof next.startsAt === 'string' &&
    prev.startsAt !== next.startsAt &&
    !next.previousStartDate
  ) {
    result.previousStartDate = prev.startsAt;
  }

  // Clear previousStartDate when returning from postponed to any other
  // status — a stale date would otherwise appear in Schema.org JSON-LD.
  if (next.eventStatus !== 'postponed' && prev.eventStatus === 'postponed') {
    result.previousStartDate = null;
  }

  return result;
};
