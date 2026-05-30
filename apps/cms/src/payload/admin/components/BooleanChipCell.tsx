'use client';

import type { ReactElement } from 'react';

type BooleanChipCellProps = {
  cellData?: boolean | string | number | null;
};

const truthy = (v: BooleanChipCellProps['cellData']): boolean =>
  v === true || v === 1 || v === 'true' || v === '1';

const falsy = (v: BooleanChipCellProps['cellData']): boolean =>
  v === false || v === 0 || v === 'false' || v === '0';

/**
 * List-view boolean cell. Payload renders booleans as raw `true` / `false`
 * text (reads like a debug log); this promotes them to a coloured chip —
 * green for true, neutral for false — via the `.bool-cell[data-bool]`
 * rules in `_paper-cuts.scss`. A null/undefined value (field never set)
 * renders a dim em dash rather than a misleading "No" chip.
 *
 * React-rendered (no DOM mutation) — wired onto every `checkbox` field's
 * `Cell` slot in `wire-custom-fields.ts`.
 */
export const BooleanChipCell = ({ cellData }: BooleanChipCellProps): ReactElement => {
  if (truthy(cellData)) {
    return (
      <span className="bool-cell" data-bool="true">
        Yes
      </span>
    );
  }
  if (falsy(cellData)) {
    return (
      <span className="bool-cell" data-bool="false">
        No
      </span>
    );
  }
  return <span className="cs-date-cell cs-date-cell--missing">—</span>;
};

export default BooleanChipCell;
