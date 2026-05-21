/**
 * Pure resolver for `DisplayPublishedAtField`'s UX state machine.
 * Extracted from the client component so it can be unit-tested
 * without a DOM / React harness.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const NEAR_NOW_HOURS = 24;
const HARD_WARN_DAYS = 30;

export type PickerState =
  | { kind: 'empty' }
  /**
   * Value matches what the form loaded with — the editor has not
   * touched the field. We deliberately render nothing in this state:
   * a historical publish date (e.g. 8 months ago on an existing post)
   * already reflects reality and warning about it would be noise.
   */
  | { kind: 'unchanged' }
  | { kind: 'near-now' }
  /**
   * `days` reflects how far EARLIER the editor moved the value from
   * its baseline (initial loaded value, or `now()` for a fresh draft),
   * not the absolute distance from `now`. That keeps the warning tied
   * to the editor's decision in this session, not to how old the post
   * happens to be.
   */
  | { kind: 'backdate-soft'; days: number }
  | { kind: 'backdate-hard'; days: number }
  | { kind: 'future-draft' }
  | { kind: 'future-published' };

export const PICKER_NEAR_NOW_HOURS = NEAR_NOW_HOURS;
export const PICKER_HARD_WARN_DAYS = HARD_WARN_DAYS;

const parseIso = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Resolve the editor-facing picker state.
 *
 * Decision tree (in order):
 *  1. No value                          → `empty`
 *  2. Unparseable                       → `empty`
 *  3. Value identical to `initialValue` → `unchanged` (silent)
 *  4. Picked > now + 24h                → `future-{draft|published}`
 *  5. |picked − baseline| ≤ 24h         → `near-now`
 *  6. picked > baseline                 → `near-now` (editor moved
 *                                         FORWARD — un-backdating;
 *                                         no warning needed)
 *  7. picked < baseline (past)          → `backdate-soft|hard`
 *                                         using days moved earlier
 *
 * `baseline` = `initialValue` when present, else `now`. That way an
 * editor opening an existing post with a months-old `publishedAt`
 * stays in `unchanged` until they touch the picker; small
 * adjustments (1-day cleanup) stay in `near-now`; only meaningful
 * backward shifts in this session surface the warning.
 */
export const resolveDisplayPublishedAtState = (
  value: string | null | undefined,
  initialValue: string | null | undefined,
  status: string | null | undefined,
  now: number = Date.now(),
): PickerState => {
  if (!value) return { kind: 'empty' };
  const picked = parseIso(value);
  if (picked === null) return { kind: 'empty' };

  // Unchanged from load — the date represents historical truth, not
  // a fresh editor decision. Stay silent.
  if (initialValue && value === initialValue) return { kind: 'unchanged' };

  // Future detection always uses `now` — a date past `now` is in the
  // future regardless of where the editor started.
  if (picked - now > NEAR_NOW_HOURS * MS_PER_HOUR) {
    return status === 'published'
      ? { kind: 'future-published' }
      : { kind: 'future-draft' };
  }

  // Gate the backdating warning on the editor's CHANGE this session,
  // not on absolute distance from `now`. New drafts (initialValue
  // missing) use `now` as the baseline — declaring an old date on a
  // brand-new post is still backdating.
  const baseline = parseIso(initialValue) ?? now;
  const deltaFromBaseline = picked - baseline;
  const absHoursFromBaseline = Math.abs(deltaFromBaseline) / MS_PER_HOUR;

  if (absHoursFromBaseline <= NEAR_NOW_HOURS) return { kind: 'near-now' };

  // Editor moved forward (toward `now`) — that's the opposite of
  // backdating; no warning.
  if (deltaFromBaseline > 0) return { kind: 'near-now' };

  const days = Math.floor(Math.abs(deltaFromBaseline) / MS_PER_DAY);
  return days > HARD_WARN_DAYS
    ? { kind: 'backdate-hard', days }
    : { kind: 'backdate-soft', days };
};
