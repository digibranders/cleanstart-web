import { z } from 'zod';

/** The dashboards a person can arrange. Each has its own card list in code and its own saved layout. */
export const DASHBOARD_IDS = ['staff-overview', 'partner-overview'] as const;
export type DashboardId = (typeof DASHBOARD_IDS)[number];

export const GRID_COLUMNS = 12;
/** The widths offered in the size picker, in grid columns, narrowest first. */
export const SIZE_STEPS = [4, 6, 8, 12] as const;
export const SIZE_LABEL: Record<number, string> = { 4: 'Small', 6: 'Medium', 8: 'Large', 12: 'Full width' };

/** What the code knows about a card. Its content is rendered by the page; this is only how it may be laid out. */
export interface DashboardCardDef {
  id: string;
  title: string;
  /** One line shown in the Add cards list. */
  description: string;
  /** Width in columns when the person has not chosen one. */
  span: number;
  min: number;
  max: number;
  /** Offered through Add cards, not shown until the person adds it. */
  defaultHidden?: boolean;
}

/** One card in a person's layout. Order in the array is the order on the page. */
export interface LayoutEntry {
  id: string;
  hidden: boolean;
  /** The width the person chose, or null to use the card's own. */
  span: number | null;
}

export const MAX_SAVED_CARDS = 40;

export const savedLayoutSchema = z.object({
  cards: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z0-9-]{0,47}$/u),
        hidden: z.boolean().optional(),
        span: z.number().int().min(1).max(GRID_COLUMNS).optional(),
      }),
    )
    .max(MAX_SAVED_CARDS),
});
export type SavedLayout = z.infer<typeof savedLayoutSchema>;

const clamp = (value: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, value));

/**
 * Merges what a person saved with what the page offers today. Cards that no longer exist are dropped, a saved card keeps its place,
 * and a card added since the layout was saved goes to the end (hidden if it is hidden by default). With nothing saved the result is the
 * page's own order. A saved width is kept inside the card's limits.
 */
export function reconcileLayout(defs: readonly DashboardCardDef[], saved: SavedLayout | null | undefined): LayoutEntry[] {
  const byId = new Map(defs.map((d) => [d.id, d]));
  const seen = new Set<string>();
  const out: LayoutEntry[] = [];
  for (const entry of saved?.cards ?? []) {
    const def = byId.get(entry.id);
    if (!def || seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push({ id: entry.id, hidden: entry.hidden === true, span: entry.span === undefined ? null : clamp(entry.span, def.min, def.max) });
  }
  for (const def of defs) {
    if (!seen.has(def.id)) out.push({ id: def.id, hidden: def.defaultHidden === true, span: null });
  }
  return out;
}

export function toSaved(entries: readonly LayoutEntry[]): SavedLayout {
  return { cards: entries.map((e) => ({ id: e.id, ...(e.hidden ? { hidden: true } : {}), ...(e.span === null ? {} : { span: e.span }) })) };
}

export interface PackItem {
  /** The width asked for, already inside min and max. */
  span: number;
  min: number;
  max: number;
}

/**
 * Turns the cards' wanted widths into the widths actually used. Cards fill a row of 12 columns in order; a card that does not fit
 * starts the next row, and each row's leftover columns are handed to its cards (last first, one column at a time) up to their maximum,
 * so a row never ends with a gap that a card could fill.
 */
export function packSpans(items: readonly PackItem[], columns: number = GRID_COLUMNS): number[] {
  const result: number[] = items.map((i) => i.span);
  let row: number[] = [];
  let used = 0;

  const close = (): void => {
    let spare = columns - used;
    let progressed = true;
    while (spare > 0 && progressed) {
      progressed = false;
      for (let k = row.length - 1; k >= 0 && spare > 0; k -= 1) {
        const at = row[k];
        const item = at === undefined ? undefined : items[at];
        if (item && (result[at as number] ?? 0) < item.max) {
          result[at as number] = (result[at as number] ?? 0) + 1;
          spare -= 1;
          progressed = true;
        }
      }
    }
    row = [];
    used = 0;
  };

  items.forEach((item, index) => {
    const want = clamp(item.span, item.min, Math.min(item.max, columns));
    result[index] = want;
    if (used + want > columns) close();
    row.push(index);
    used += want;
  });
  close();
  return result;
}
