export type SyncRow = {
  handler?: string | null;
  status?: string | null;
  error?: string | null;
};

export type SyncState = 'ok' | 'pending' | 'failed';

export type SyncSummary = {
  state: SyncState;
  label: string;
  detail: string;
  done: number;
  total: number;
};

/**
 * Condenses a lead's `syncedTo` rows into one list-view label.
 *
 * `skipped` counts as done: it means a handler had nothing to do (a free-mail
 * domain for company lookup, a duplicate), not that delivery was lost.
 */
export function summarizeSync(rows: readonly SyncRow[] | null | undefined): SyncSummary | null {
  if (!rows || rows.length === 0) return null;

  let done = 0;
  let failed = 0;
  for (const row of rows) {
    if (row.status === 'synced' || row.status === 'skipped') done += 1;
    else if (row.status === 'failed') failed += 1;
  }
  const total = rows.length;
  const pending = total - done - failed;
  const synced = `${done}/${total} synced`;

  const state: SyncState = failed > 0 ? 'failed' : pending > 0 ? 'pending' : 'ok';
  const label =
    state === 'failed'
      ? `${failed} failed · ${synced}`
      : state === 'pending'
        ? `${synced} · ${pending} pending`
        : synced;

  const detail = rows
    .map((row) => {
      const line = `${row.handler ?? 'unknown'}: ${row.status ?? 'unknown'}`;
      return row.error ? `${line} (${row.error})` : line;
    })
    .join('\n');

  return { state, label, detail, done, total };
}
