'use client';

import type { ReactElement } from 'react';

type BytesCellProps = {
  cellData?: number | string | null;
};

const formatBytes = (raw: number | string | null | undefined): string => {
  if (raw == null) return '—';
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

/**
 * List-view filesize cell. Renders bytes as human-readable
 * (`53 KB`, `1.2 MB`, `2.40 GB`). Tooltip shows the raw byte count
 * for editors who need precision.
 */
export const BytesCell = (props: BytesCellProps): ReactElement => (
  <span
    className="cs-bytes-cell"
    title={typeof props.cellData === 'number' ? `${props.cellData} bytes` : undefined}
  >
    {formatBytes(props.cellData)}
  </span>
);

export default BytesCell;
