'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import {
  COMMAND_PRIORITY_LOW,
  type LexicalCommand,
  createCommand,
} from 'lexical';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { TableGridPicker } from './TableGridPicker';

import './TableGridPicker.scss';

export type OpenTableGridPayload = { anchor: HTMLElement };

export const OPEN_TABLE_GRID_COMMAND: LexicalCommand<OpenTableGridPayload> =
  createCommand('OPEN_TABLE_GRID_COMMAND');

export function TableGridPickerPlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return editor.registerCommand(
      OPEN_TABLE_GRID_COMMAND,
      (payload) => {
        anchorRef.current = payload.anchor;
        setRect(payload.anchor.getBoundingClientRect());
        setOpen(true);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  // Keep the picker glued to the toolbar button as the page scrolls
  // or resizes. Re-query the live rect from the same button element
  // we opened against, so position stays accurate regardless of
  // ancestor transforms or the editor's transform-context.
  useEffect(() => {
    if (!open) return;
    const update = (): void => {
      const anchor = anchorRef.current;
      if (!anchor || !anchor.isConnected) {
        setOpen(false);
        return;
      }
      setRect(anchor.getBoundingClientRect());
    };
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleDocClick = (event: MouseEvent): void => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleInsert = useCallback(
    (rows: number, columns: number): void => {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns: String(columns),
        includeHeaders: { columns: false, rows: true },
        rows: String(rows),
      });
      setOpen(false);
    },
    [editor],
  );

  if (!open || !rect) return null;

  // Portal to <body> (not the editor's floatingAnchorElem) so the
  // picker lives in viewport coordinates and can sit flush against
  // the toolbar button regardless of the editor's transform/scroll
  // context. Anchored to the button rect, not the selection.
  void anchorElem;
  return createPortal(
    <TableGridPicker
      anchorRect={rect}
      onInsert={handleInsert}
      ref={popoverRef}
    />,
    document.body,
  );
}
