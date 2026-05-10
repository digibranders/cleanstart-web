'use client';

import { forwardRef, useState } from 'react';

const MAX_ROWS = 8;
const MAX_COLS = 10;

const POPOVER_WIDTH = 230;
const POPOVER_HEIGHT_ESTIMATE = 220;
const VIEWPORT_PAD = 8;

const computePosition = (
  rect: DOMRect,
): { left: number; top: number } => {
  const viewportWidth =
    typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight =
    typeof window !== 'undefined' ? window.innerHeight : 768;

  let left = rect.left;
  if (left + POPOVER_WIDTH > viewportWidth - VIEWPORT_PAD) {
    left = viewportWidth - POPOVER_WIDTH - VIEWPORT_PAD;
  }
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD;

  // Word-style dropdown: 4px gap below the button so the panel reads
  // as an attached dropdown, not a free-floating popover. If there
  // isn't room below, flip above the button.
  const GAP = 4;
  let top = rect.bottom + GAP;
  if (top + POPOVER_HEIGHT_ESTIMATE > viewportHeight - VIEWPORT_PAD) {
    top = rect.top - POPOVER_HEIGHT_ESTIMATE - GAP;
  }
  if (top < VIEWPORT_PAD) top = VIEWPORT_PAD;

  return { left, top };
};

type Props = {
  anchorRect: DOMRect;
  onInsert: (rows: number, columns: number) => void;
};

export const TableGridPicker = forwardRef<HTMLDivElement, Props>(
  function TableGridPicker({ anchorRect, onInsert }, ref) {
    const [hover, setHover] = useState<{ row: number; col: number } | null>(
      null,
    );

    const position = computePosition(anchorRect);
    const label = hover
      ? `${hover.row + 1} × ${hover.col + 1} table`
      : 'Pick size';

    return (
      <div
        className="cs-table-picker"
        ref={ref}
        style={{ left: `${position.left}px`, top: `${position.top}px` }}
      >
        <div className="cs-table-picker__label">{label}</div>
        <div
          className="cs-table-picker__grid"
          onMouseLeave={() => setHover(null)}
        >
          {Array.from({ length: MAX_ROWS }).map((_, row) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid, indices stable
            <div className="cs-table-picker__row" key={row}>
              {Array.from({ length: MAX_COLS }).map((__, col) => {
                const active =
                  hover != null && row <= hover.row && col <= hover.col;
                return (
                  <button
                    aria-label={`${row + 1} by ${col + 1}`}
                    className={`cs-table-picker__cell${
                      active ? ' cs-table-picker__cell--active' : ''
                    }`}
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid
                    key={col}
                    onClick={() => onInsert(row + 1, col + 1)}
                    onMouseEnter={() => setHover({ col, row })}
                    type="button"
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
