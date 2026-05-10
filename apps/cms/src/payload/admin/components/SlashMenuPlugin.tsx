'use client';

import { Popover } from '@cleanstart/ui';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SlashItem = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly keywords: ReadonlyArray<string>;
  readonly run: (editor: LexicalEditor) => void;
};

const ITEMS: ReadonlyArray<SlashItem> = [
  {
    id: 'h2',
    label: 'Heading 2',
    description: 'Large section heading.',
    keywords: ['h2', 'heading', 'section'],
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h2'));
      }),
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Sub-section heading.',
    keywords: ['h3', 'heading'],
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createHeadingNode('h3'));
      }),
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Pull-quote block.',
    keywords: ['quote', 'blockquote', 'pull'],
    run: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) $setBlocksType(sel, () => $createQuoteNode());
      }),
  },
  {
    id: 'ul',
    label: 'Bulleted list',
    description: 'Unordered list of items.',
    keywords: ['ul', 'bullet', 'list', 'unordered'],
    run: (editor) => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'ol',
    label: 'Numbered list',
    description: 'Ordered, numbered list.',
    keywords: ['ol', 'number', 'list', 'ordered'],
    run: (editor) => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'hr',
    label: 'Divider',
    description: 'Horizontal rule.',
    keywords: ['hr', 'divider', 'horizontal', 'rule'],
    run: (editor) => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
];

const filterItems = (query: string): ReadonlyArray<SlashItem> => {
  if (!query) return ITEMS;
  const q = query.toLowerCase();
  return ITEMS.filter(
    (it) =>
      it.label.toLowerCase().includes(q) || it.keywords.some((k) => k.includes(q)),
  );
};

/**
 * Slash menu plugin. Triggered when a paragraph starts with `/`.
 * Renders an anchored Popover containing a tiny single-column menu
 * (we render it inline rather than reusing DropdownMenu so the
 * keyboard-down behaviour can be wired directly to the editor's
 * KEY_DOWN_COMMAND priority chain).
 */
export const SlashMenuPlugin = (): ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const anchorRef = useRef<HTMLSpanElement | null>(null);

  // Track the slash trigger by inspecting the current paragraph's first
  // text node on every selection change. When it starts with `/`,
  // mount the popover.
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel) || !sel.isCollapsed()) {
          setOpen(false);
          return;
        }
        const node = sel.anchor.getNode();
        const text = $isTextNode(node) ? node.getTextContent() : '';
        // Only fire at the start of an empty / fresh paragraph
        const par = node.getParent();
        const parText = par?.getTextContent() ?? '';
        if (parText.startsWith('/') && !parText.includes(' ')) {
          setQuery(parText.slice(1));
          // Anchor to the DOM node of the current paragraph.
          const dom = par ? editor.getElementByKey(par.getKey()) : null;
          if (dom && anchorRef.current) {
            const rect = dom.getBoundingClientRect();
            const anchor = anchorRef.current;
            anchor.style.position = 'fixed';
            anchor.style.top = `${rect.bottom}px`;
            anchor.style.left = `${rect.left}px`;
            anchor.style.width = '1px';
            anchor.style.height = '1px';
            anchor.style.pointerEvents = 'none';
          }
          setOpen(true);
          setActiveIdx(0);
        } else {
          setOpen(false);
        }
        // Avoid unused-var lint by referencing `text` (kept for clarity)
        void text;
      });
    });
  }, [editor]);

  const items = useMemo(() => filterItems(query), [query]);

  // Wire arrow keys + Enter while menu is open. We register at LOW
  // priority so we don't fight the default Lexical behaviour outside.
  useEffect(() => {
    if (!open) return undefined;
    return editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setActiveIdx((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setActiveIdx((i) => (i - 1 + items.length) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[activeIdx];
          if (!item) return false;
          event.preventDefault();
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
              const par = sel.anchor.getNode().getParent();
              // Wipe the trigger characters before running the action.
              if (par) {
                for (const c of par.getChildren()) c.remove();
              }
            }
          });
          item.run(editor);
          setOpen(false);
          return true;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, open, items, activeIdx]);

  return (
    <>
      <span ref={anchorRef} aria-hidden="true" />
      <Popover
        open={open && items.length > 0}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        placement="bottom-start"
        ariaLabel="Insert block"
        role="menu"
        restoreFocus={false}
      >
        <div className="cs-slash-menu">
          {items.map((it, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={it.id}
                type="button"
                aria-pressed={isActive}
                className={`cs-slash-menu__item${isActive ? ' is-active' : ''}`}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.update(() => {
                    const sel = $getSelection();
                    if ($isRangeSelection(sel)) {
                      const par = sel.anchor.getNode().getParent();
                      if (par) {
                        for (const c of par.getChildren()) c.remove();
                      }
                    }
                  });
                  it.run(editor);
                  setOpen(false);
                }}
              >
                <span className="cs-slash-menu__label">{it.label}</span>
                <span className="cs-slash-menu__description">{it.description}</span>
              </button>
            );
          })}
        </div>
      </Popover>
    </>
  );
};
