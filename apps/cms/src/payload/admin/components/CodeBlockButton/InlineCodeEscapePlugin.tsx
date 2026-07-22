'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_SPACE_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

/**
 * Exit the inline-code mark on Space.
 *
 * The backtick markdown transform consumes the closing backtick but leaves
 * the caret INSIDE the code-formatted text node, so every character typed
 * after it inherits the code format — the chip grows forever and even new
 * backticks become literal text inside it. Matching editor convention
 * (Notion, Slack): pressing Space with the caret at the very end of an
 * inline-code run inserts a PLAIN space and moves the caret out of the mark,
 * so subsequent typing is normal text. Spaces typed anywhere inside the run
 * (caret not at the end) are untouched — `npm install` keeps its space.
 */
export function InlineCodeEscapePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_SPACE_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }
        const anchor = selection.anchor;
        if (anchor.type !== 'text') return false;
        const node = anchor.getNode();
        if (!$isTextNode(node) || !node.hasFormat('code')) return false;
        if (anchor.offset !== node.getTextContentSize()) return false;
        // Caret sits at the very end of an inline-code run: this space ends
        // the chip instead of growing it.
        event.preventDefault();
        const plain = $createTextNode(' ');
        node.insertAfter(plain);
        plain.select(1, 1);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
