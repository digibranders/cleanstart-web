/**
 * Pure resolver for `DisplayPublishedAtField`'s UX state machine.
 * Extracted from the client component so it can be unit-tested
 * without a DOM / React harness.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NEAR_NOW_HOURS = 24;
const HARD_WARN_DAYS = 30;

export type PickerState =
  | { kind: 'empty' }
  | { kind: 'near-now' }
  | { kind: 'backdate-soft'; days: number }
  | { kind: 'backdate-hard'; days: number }
  | { kind: 'future-draft' }
  | { kind: 'future-published' };

export const PICKER_NEAR_NOW_HOURS = NEAR_NOW_HOURS;
export const PICKER_HARD_WARN_DAYS = HARD_WARN_DAYS;

/**
 * Resolve the editor-facing picker state from the current value and
 * the document's draft/published status.
 *
 *  - `null` / empty / unparseable      → `empty`
 *  - within ±24h of now                → `near-now`
 *  - past, within 30 days              → `backdate-soft`
 *  - past, beyond 30 days              → `backdate-hard`
 *  - future, status published          → `future-published`
 *  - future, status draft / unknown    → `future-draft`
 */
export const resolveDisplayPublishedAtState = (
  value: string | null | undefined,
  status: string | null | undefined,
  now: number = Date.now(),
): PickerState => {
  if (!value) return { kind: 'empty' };
  const picked = new Date(value).getTime();
  if (!Number.isFinite(picked)) return { kind: 'empty' };
  const deltaMs = picked - now;
  const absHours = Math.abs(deltaMs) / (60 * 60 * 1000);
  if (absHours <= NEAR_NOW_HOURS) return { kind: 'near-now' };
  if (deltaMs > 0) {
    return status === 'published' ? { kind: 'future-published' } : { kind: 'future-draft' };
  }
  const days = Math.floor(Math.abs(deltaMs) / MS_PER_DAY);
  return days > HARD_WARN_DAYS
    ? { kind: 'backdate-hard', days }
    : { kind: 'backdate-soft', days };
};
