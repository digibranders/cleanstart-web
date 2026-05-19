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
import {
  ENABLE_SLASH_MENU_COMMAND,
  INSERT_BLOCK_COMMAND,
} from '@payloadcms/richtext-lexical/client';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { OPEN_EMBED_DIALOG_COMMAND } from './Embed/EmbedPlugin';
import { OPEN_INLINE_IMAGE_DIALOG_COMMAND } from './InlineImage/InlineImagePlugin';

type SlashItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactElement;
  readonly keywords: ReadonlyArray<string>;
  readonly run: (editor: LexicalEditor) => void;
};

// Stroke-icon set. Sized inline at 16px so they line up cleanly with
// the row label without an explicit wrapper width. `currentColor` lets
// the theme drive icon tint (matches the stock toolbar's icon style).
const stroke = { stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const ICON = {
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
} as const;

const ITEMS: ReadonlyArray<SlashItem> = [
  {
    id: 'h2',
    label: 'Heading 2',
    icon: ICON.h2,
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
    icon: ICON.h3,
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
    icon: ICON.quote,
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
    icon: ICON.ul,
    keywords: ['ul', 'bullet', 'list', 'unordered'],
    run: (editor) => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'ol',
    label: 'Numbered list',
    icon: ICON.ol,
    keywords: ['ol', 'number', 'list', 'ordered'],
    run: (editor) => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    id: 'hr',
    label: 'Divider',
    icon: ICON.hr,
    keywords: ['hr', 'divider', 'horizontal', 'rule'],
    run: (editor) => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    id: 'image',
    label: 'Image',
    icon: ICON.image,
    keywords: ['image', 'img', 'picture', 'photo', 'media', 'upload'],
    run: (editor) => editor.dispatchCommand(OPEN_INLINE_IMAGE_DIALOG_COMMAND, undefined),
  },
  {
    id: 'embed',
    label: 'Embed',
    icon: ICON.embed,
    keywords: ['embed', 'video', 'youtube', 'vimeo', 'loom', 'iframe',
               'script', 'calendly', 'typeform', 'figma', 'wistia', 'widget'],
    run: (editor) => editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, {}),
  },
  {
    id: 'code',
    label: 'Code block',
    icon: ICON.code,
    keywords: ['code', 'snippet', 'pre', 'mono', 'shell', 'bash', 'json',
               'typescript', 'javascript', 'python', 'yaml', 'dockerfile', 'sql'],
    run: (editor) =>
      editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
        blockName: '',
        blockType: 'codeBlock',
        language: 'bash',
        content: '',
        showLineNumbers: true,
      }),
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

  // Position the hidden anchor span below a given block DOM element.
  const positionAnchorAt = useCallback((dom: HTMLElement): void => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = dom.getBoundingClientRect();
    anchor.style.position = 'fixed';
    anchor.style.top = `${rect.bottom}px`;
    anchor.style.left = `${rect.left}px`;
    anchor.style.width = '1px';
    anchor.style.height = '1px';
    anchor.style.pointerEvents = 'none';
  }, []);

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
          const dom = par ? editor.getElementByKey(par.getKey()) : null;
          if (dom) positionAnchorAt(dom);
          setOpen(true);
          setActiveIdx(0);
        } else {
          setOpen(false);
        }
        // Avoid unused-var lint by referencing `text` (kept for clarity)
        void text;
      });
    });
  }, [editor, positionAnchorAt]);

  // Handle the stock Payload row-level `+` button (AddBlockHandlePlugin).
  // It dispatches ENABLE_SLASH_MENU_COMMAND with the target paragraph node;
  // we intercept it and open our custom slash menu anchored to that block.
  useEffect(() => {
    return editor.registerCommand(
      ENABLE_SLASH_MENU_COMMAND,
      (payload) => {
        const node = (payload as { node?: { getKey?: () => string } } | null)?.node;
        if (!node || typeof node.getKey !== 'function') return false;
        const dom = editor.getElementByKey(node.getKey());
        if (dom) positionAnchorAt(dom);
        setQuery('');
        setOpen(true);
        setActiveIdx(0);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, positionAnchorAt]);

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
                <span className="cs-slash-menu__icon" aria-hidden="true">{it.icon}</span>
                <span className="cs-slash-menu__label">{it.label}</span>
              </button>
            );
          })}
        </div>
      </Popover>
    </>
  );
};
