/**
 * Pure date-range computation for `ExportDrawer`'s preset dropdown.
 * Extracted from the client component so it can be unit-tested without
 * a DOM / React harness (mirrors `display-published-at-state.ts`).
 */

export type DatePreset = 'allTime' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';

export const DATE_PRESET_OPTIONS: ReadonlyArray<{ value: DatePreset; label: string }> = [
  { value: 'allTime', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];

const pad2 = (n: number): string => `${n}`.padStart(2, '0');

/** Local-calendar `YYYY-MM-DD` — matches `DateTimePicker`'s own
 * `formatStorage` for `mode="date"` (packages/ui/src/primitives/DateTimePicker.tsx). */
const toLocalDateString = (d: Date): string =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/**
 * Pure date-range computation for the preset dropdown. All arithmetic is
 * local-calendar time (the editor's own "today"), not UTC.
 */
export const computePresetRange = (preset: DatePreset): { from: string | null; to: string | null } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'allTime':
      return { from: null, to: null };
    case 'today':
      return { from: toLocalDateString(today), to: toLocalDateString(today) };
    case 'last7': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toLocalDateString(from), to: toLocalDateString(today) };
    }
    case 'last30': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: toLocalDateString(from), to: toLocalDateString(today) };
    }
    case 'thisMonth': {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toLocalDateString(from), to: toLocalDateString(today) };
    }
    case 'lastMonth': {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toLocalDateString(from), to: toLocalDateString(to) };
    }
    case 'custom':
      return { from: null, to: null };
    default: {
      const exhaustiveCheck: never = preset;
      return exhaustiveCheck;
    }
  }
};
