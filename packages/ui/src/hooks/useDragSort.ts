'use client';

import { useCallback, useRef, useState } from 'react';

type Args = {
  readonly onReorder: (fromIndex: number, toIndex: number) => void;
};

type DragHandlers = {
  readonly onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  readonly onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  readonly onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  readonly onDrop: (e: React.DragEvent<HTMLElement>) => void;
  readonly onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
};

type UseDragSort = {
  readonly draggingIndex: number | null;
  readonly hoverIndex: number | null;
  readonly itemHandlers: (index: number) => DragHandlers;
};

/**
 * HTML5-DnD reorder hook. Each item exposes the same handler bundle
 * (drag start tracks the source index; drag over highlights the
 * target; drop fires `onReorder`).
 *
 * Hand-rolled to avoid `react-dnd` (~25 KB) and `dnd-kit` (~70 KB)
 * for the shallow reorder cases inside admin fields. Keyboard reorder
 * (Up/Down + Space-grab) lives in the consuming component since the
 * a11y model differs per surface.
 */
export const useDragSort = (args: Args): UseDragSort => {
  const { onReorder } = args;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const sourceRef = useRef<number | null>(null);

  const itemHandlers = useCallback(
    (index: number): DragHandlers => ({
      onDragStart: (e) => {
        sourceRef.current = index;
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      },
      onDragOver: (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (hoverIndex !== index) setHoverIndex(index);
      },
      onDragLeave: () => {
        setHoverIndex((cur) => (cur === index ? null : cur));
      },
      onDrop: (e) => {
        e.preventDefault();
        const from = sourceRef.current;
        if (from != null && from !== index) onReorder(from, index);
        sourceRef.current = null;
        setDraggingIndex(null);
        setHoverIndex(null);
      },
      onDragEnd: () => {
        sourceRef.current = null;
        setDraggingIndex(null);
        setHoverIndex(null);
      },
    }),
    [hoverIndex, onReorder],
  );

  return { draggingIndex, hoverIndex, itemHandlers };
};
