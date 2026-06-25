'use client';

import type { ReactElement } from 'react';

type SourcePageCellProps = {
  cellData?: string | null;
  rowData?: { sourceCollection?: string; sourceDocId?: string | number };
};

/**
 * List cell for a broken link's source page. Renders the page title as a
 * link straight to the source doc's admin edit page, so an editor goes
 * from the broken-links table to the page that needs fixing in one click.
 */
export const SourcePageCell = (props: SourcePageCellProps): ReactElement => {
  const title = props.cellData?.trim();
  const collection = props.rowData?.sourceCollection;
  const id = props.rowData?.sourceDocId;
  if (!collection || id == null) {
    return <span>{title || '—'}</span>;
  }
  return (
    <a href={`/admin/collections/${collection}/${id}`} className="cs-source-page-cell">
      {title || `${collection}/${id}`}
    </a>
  );
};

export default SourcePageCell;
