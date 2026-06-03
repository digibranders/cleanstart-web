'use client';

import { useTableColumns } from '@payloadcms/ui';
import type { Column } from 'payload';
import type { ReactElement } from 'react';

type Props = {
  readonly columnState: ReadonlyArray<Column>;
};

/**
 * Column visibility + order picker. Wraps Payload's `useTableColumns`
 * data hook (active-flag toggle, persisted via Payload's preferences
 * system). Reordering lands in Wave 8 hardening — needs the shared
 * `useDragSort` hook.
 */
export const ColumnPicker = (props: Props): ReactElement => {
  const { columnState } = props;
  const { columns, toggleColumn } = useTableColumns();

  const activeByAccessor = new Map<string, boolean>(
    columns.map((c) => [c.accessor, !!c.active]),
  );

  const toggle = (accessor: string): void => {
    void toggleColumn(accessor);
  };

  const labelOf = (col: Column): string => {
    const f = col.field as { label?: unknown } | undefined;
    if (typeof f?.label === 'string') return f.label;
    if (f?.label && typeof f.label === 'object' && 'en' in f.label) {
      return String((f.label as Record<string, unknown>).en ?? col.accessor);
    }
    return col.accessor;
  };

  return (
    <div className="cs-column-picker">
      <ul className="cs-column-picker__list">
        {columnState.map((col) => {
          const label = labelOf(col);
          const checked = activeByAccessor.get(col.accessor) ?? !!col.active;
          return (
            <li key={col.accessor} className="cs-column-picker__row">
              <label className="cs-column-picker__row-label">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(col.accessor)}
                />
                <span>{label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
