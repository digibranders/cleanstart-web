'use client';

import type { LexicalEditor } from 'lexical';
import { useRef } from 'react';

import { TableGridPickerIcon } from './TableGridPickerIcon';
import { OPEN_TABLE_GRID_COMMAND } from './TableGridPickerPlugin';

/**
 * Custom toolbar button rendered via the `Component` slot of the
 * Lexical toolbar item. We render the button ourselves (instead of
 * using `ChildComponent` + `onSelect`) so the click handler can pass
 * the button's actual DOM element to the picker plugin — the plugin
 * uses it to re-anchor on scroll/resize, instead of guessing via a
 * `querySelector` that could match a duplicate cs-table button in
 * the inline toolbar and place the picker mid-page.
 */
export function TableToolbarButton({
  editor,
}: {
  editor: LexicalEditor;
}): React.ReactElement {
  const ref = useRef<HTMLButtonElement | null>(null);

  return (
    <button
      className="toolbar-popup__button toolbar-popup__button-cs-table"
      data-button-key="cs-table"
      onClick={() => {
        if (!ref.current) return;
        editor.dispatchCommand(OPEN_TABLE_GRID_COMMAND, {
          anchor: ref.current,
        });
      }}
      onMouseDown={(event) => event.preventDefault()}
      ref={ref}
      type="button"
    >
      <TableGridPickerIcon />
    </button>
  );
}
