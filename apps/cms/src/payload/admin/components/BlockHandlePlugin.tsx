'use client';

import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import type { ReactElement } from 'react';
import { useRef } from 'react';

const HANDLE_CLASS = 'cs-block-handle';
const TARGET_CLASS = 'cs-block-handle__target';

const isOnMenu = (el: HTMLElement): boolean => Boolean(el.closest(`.${HANDLE_CLASS}`));

/**
 * Wave 7 part 2 — Lexical block handle. Renders a left-rail grip
 * next to the hovered block (paragraph / heading / list / quote /
 * etc.) that lets editors drag the whole block to reorder.
 *
 * Uses Lexical's experimental DraggableBlockPlugin under the hood.
 * Our chrome owns the visual + interaction; the plugin owns the
 * caret math + reorder.
 */
export const BlockHandlePlugin = (props: { readonly anchorElem?: HTMLElement }): ReactElement => {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const targetLineRef = useRef<HTMLDivElement | null>(null);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      {...(props.anchorElem ? { anchorElem: props.anchorElem } : {})}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={HANDLE_CLASS} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16">
            <title>Drag block</title>
            <circle cx="6" cy="4" r="1" fill="currentColor" />
            <circle cx="10" cy="4" r="1" fill="currentColor" />
            <circle cx="6" cy="8" r="1" fill="currentColor" />
            <circle cx="10" cy="8" r="1" fill="currentColor" />
            <circle cx="6" cy="12" r="1" fill="currentColor" />
            <circle cx="10" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
      }
      targetLineComponent={<div ref={targetLineRef} className={TARGET_CLASS} aria-hidden="true" />}
      isOnMenu={isOnMenu}
    />
  );
};
