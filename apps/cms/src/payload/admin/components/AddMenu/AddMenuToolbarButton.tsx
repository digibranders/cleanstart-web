'use client';

import type { LexicalEditor } from 'lexical';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $setBlocksType } from '@lexical/selection';
import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { INSERT_BLOCK_COMMAND } from '@payloadcms/richtext-lexical/client';

import { OPEN_TABLE_GRID_COMMAND } from '../TableGridPickerPlugin';
import { OPEN_INLINE_IMAGE_DIALOG_COMMAND } from '../InlineImage/InlineImagePlugin';
import { OPEN_EMBED_DIALOG_COMMAND } from '../Embed/EmbedPlugin';

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ICONS = {
  plus: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path {...stroke} d="M7 2v10M2 7h10" />
    </svg>
  ),
  h2: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path {...stroke} d="M3 3v10M9 3v10M3 8h6" />
      <text x="10" y="13" fontSize="6" fontWeight="700" fill="currentColor">2</text>
    </svg>
  ),
  h3: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path {...stroke} d="M3 3v10M9 3v10M3 8h6" />
      <text x="10" y="13" fontSize="6" fontWeight="700" fill="currentColor">3</text>
    </svg>
  ),
  quote: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path {...stroke} d="M4 6c-1 0-2 .8-2 2v3h3V8H3M11 6c-1 0-2 .8-2 2v3h3V8h-2" />
    </svg>
  ),
  ul: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="3" cy="4" r="1" fill="currentColor" />
      <circle cx="3" cy="8" r="1" fill="currentColor" />
      <circle cx="3" cy="12" r="1" fill="currentColor" />
      <path {...stroke} d="M6 4h8M6 8h8M6 12h8" />
    </svg>
  ),
  ol: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <text x="0" y="6" fontSize="5" fontWeight="700" fill="currentColor">1.</text>
      <text x="0" y="11" fontSize="5" fontWeight="700" fill="currentColor">2.</text>
      <text x="0" y="15" fontSize="5" fontWeight="700" fill="currentColor">3.</text>
      <path {...stroke} d="M6 4h8M6 9h8M6 13h8" />
    </svg>
  ),
  hr: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path {...stroke} d="M2 8h12" />
    </svg>
  ),
  table: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="12" height="12" rx="1.5" {...stroke} />
      <path {...stroke} d="M2 6h12M6 6v8" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" {...stroke} />
      <circle cx="6" cy="7" r="1.2" fill="currentColor" />
      <path {...stroke} d="M3 12l3-3 2 2 3-3 2 2" />
    </svg>
  ),
  embed: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="14" height="10" rx="1.5" {...stroke} />
      <path {...stroke} d="M5.5 6.5L3 8l2.5 1.5M10.5 6.5L13 8l-2.5 1.5M7.5 10l1-4" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path {...stroke} d="M6 5L3 8l3 3M10 5l3 3-3 3" />
    </svg>
  ),
  cta: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" {...stroke} />
      <path {...stroke} d="M4 7h5" />
      <rect x="9.5" y="9" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  ),
} as const;

type MenuItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactElement;
  readonly run: (editor: LexicalEditor, anchor: HTMLElement | null) => void;
};

const MENU_ITEMS: ReadonlyArray<MenuItem> = [
  {
    id: 'h2',
    label: 'Heading 2',
    icon: ICONS.h2,
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h2'));
      }),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    icon: ICONS.h3,
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h3'));
      }),
  },
  {
    id: 'quote',
    label: 'Quote',
    icon: ICONS.quote,
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createQuoteNode());
      }),
  },
  {
    id: 'ul',
    label: 'Bulleted list',
    icon: ICONS.ul,
    run: (editor) => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'ol',
    label: 'Numbered list',
    icon: ICONS.ol,
    run: (editor) => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'hr',
    label: 'Divider',
    icon: ICONS.hr,
    run: (editor) => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    id: 'table',
    label: 'Table',
    icon: ICONS.table,
    run: (editor, anchor) => {
      if (!anchor) return;
      editor.dispatchCommand(OPEN_TABLE_GRID_COMMAND, { anchor });
    },
  },
  {
    id: 'image',
    label: 'Image',
    icon: ICONS.image,
    run: (editor) => editor.dispatchCommand(OPEN_INLINE_IMAGE_DIALOG_COMMAND, undefined),
  },
  {
    id: 'embed',
    label: 'Embed',
    icon: ICONS.embed,
    run: (editor) => editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, {}),
  },
  {
    id: 'code',
    label: 'Code block',
    icon: ICONS.code,
    run: (editor) =>
      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
        blockName: '',
        blockType: 'codeBlock',
        language: 'bash',
        content: '',
        showLineNumbers: true,
      }),
  },
  {
    id: 'cta',
    label: 'CTA card',
    icon: ICONS.cta,
    run: (editor) =>
      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
        blockName: '',
        blockType: 'inlineCta',
        heading: '',
        buttonLabel: '',
        buttonUrl: '',
        variant: 'soft',
      }),
  },
];

export function AddMenuToolbarButton({
  editor,
}: {
  editor: LexicalEditor;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const close = (): void => setOpen(false);

    const onMouseDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) {
        close();
      }
    };

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const rect = btnRef.current?.getBoundingClientRect() ?? null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Insert block"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`toolbar-popup__button cs-add-menu__trigger${open ? ' is-active' : ''}`}
        data-button-key="cs-add-menu"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
      >
        {ICONS.plus}
      </button>

      {open && rect !== null && createPortal(
        <div
          ref={menuRef}
          role="menu"
          className="cs-add-menu"
          style={{ top: rect.bottom + 4, left: rect.left }}
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="cs-add-menu__item"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                item.run(editor, btnRef.current);
                setOpen(false);
              }}
            >
              <span className="cs-add-menu__icon" aria-hidden="true">{item.icon}</span>
              <span className="cs-add-menu__label">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}
