'use client';

import type { ReactElement } from 'react';

import { type SyncRow, summarizeSync } from '@/payload/lib/lead-handlers/sync-summary';

type LeadSyncCellProps = {
  cellData?: SyncRow[] | null;
};

/**
 * Leads list cell for `syncedTo`. Payload's default array cell prints the row
 * count under the plural label ("4 Sync attempts"), which reads as four
 * retries. This shows how many handler steps finished instead, with the
 * per-handler breakdown on hover.
 */
export const LeadSyncCell = ({ cellData }: LeadSyncCellProps): ReactElement => {
  const summary = summarizeSync(cellData);
  if (!summary) {
    return <span className="cs-date-cell cs-date-cell--missing">—</span>;
  }
  return (
    <span className="sync-cell" data-state={summary.state} title={summary.detail}>
      {summary.label}
    </span>
  );
};

export default LeadSyncCell;
