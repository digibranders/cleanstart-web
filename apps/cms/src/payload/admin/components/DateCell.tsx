'use client';

import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

type DateCellProps = {
  cellData?: string | number | Date | null;
  /** Allow Payload's row data shape to flow through without typing pressure. */
  rowData?: Record<string, unknown>;
};

const ONE_MIN = 60_000;
const ONE_HOUR = 60 * ONE_MIN;
const ONE_DAY = 24 * ONE_HOUR;
const SEVEN_DAYS = 7 * ONE_DAY;

const toMillis = (input: DateCellProps['cellData']): number | null => {
  if (input == null) return null;
  if (input instanceof Date) {
    const t = input.getTime();
    return Number.isFinite(t) ? t : null;
  }
  const t = new Date(input).getTime();
  return Number.isFinite(t) ? t : null;
};

const formatRelative = (ms: number): string => {
  const diff = Date.now() - ms;
  if (diff < 0) {
    // Future date — fall through to absolute formatting.
    return new Date(ms).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  if (diff < ONE_MIN) return 'just now';
  if (diff < ONE_HOUR) {
    const m = Math.floor(diff / ONE_MIN);
    return `${m}m ago`;
  }
  if (diff < ONE_DAY) {
    const h = Math.floor(diff / ONE_HOUR);
    return `${h}h ago`;
  }
  if (diff < SEVEN_DAYS) {
    const d = Math.floor(diff / ONE_DAY);
    return d === 1 ? 'yesterday' : `${d}d ago`;
  }
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * List-view date cell. Renders relative time ("2m ago", "yesterday")
 * for anything within the last 7 days, then snaps to an absolute
 * `Jan 15, 2026` format. Tooltip always carries the full ISO string +
 * locale time so a hover discloses precision when it matters.
 *
 * Re-renders every 60s while mounted so a row that says "2m ago"
 * doesn't sit there saying "2m ago" five hours later.
 */
export const DateCell = (props: DateCellProps): ReactElement => {
  const ms = toMillis(props.cellData);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (ms == null) return undefined;
    const i = window.setInterval(() => setTick((t) => t + 1), ONE_MIN);
    return () => window.clearInterval(i);
  }, [ms]);

  if (ms == null) {
    return <span className="cs-date-cell cs-date-cell--missing">—</span>;
  }

  const isRelative = Date.now() - ms < SEVEN_DAYS;
  const iso = new Date(ms).toISOString();
  const absolute = new Date(ms).toLocaleString();

  return (
    <time
      className={`cs-date-cell ${isRelative ? 'cs-date-cell--relative' : ''}`.trim()}
      dateTime={iso}
      title={absolute}
    >
      {formatRelative(ms)}
    </time>
  );
};

export default DateCell;
