'use client';

import { $generateNodesFromDOM } from '@lexical/html';
import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import { useEffect } from 'react';

import { looksLikeRichDoc, normalizeRichHtml } from '../../lib/normalize-rich-html';

type LexicalDomElement = HTMLElement & {
  __lexicalEditor?: LexicalEditor;
};

const insertCleanedNodes = (editor: LexicalEditor, cleanedDoc: Document): void => {
  editor.update(() => {
    const nodes = $generateNodesFromDOM(editor, cleanedDoc);
    if (nodes.length === 0) return;
    // If the user's caret isn't a RangeSelection (focus shifted out
    // mid-paste, or the editor was just clicked into and selection
    // hasn't synced yet), append at the end of the root so the
    // paste never silently no-ops.
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      $getRoot().selectEnd();
    }
    $insertNodes(nodes);
  });
};

const handleDocumentPaste = (event: ClipboardEvent): void => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const editorRoot = target.closest(
    '[data-lexical-editor="true"]',
  ) as LexicalDomElement | null;
  if (!editorRoot) return;
  const editor = editorRoot.__lexicalEditor;
  if (!editor) return;

  const html = event.clipboardData?.getData('text/html');
  if (!html || !looksLikeRichDoc(html)) return;

  let parsed: Document;
  try {
    parsed = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return;
  }
  try {
    normalizeRichHtml(parsed.body);
  } catch {
    return;
  }
  if (!parsed.body.innerHTML.trim()) return;

  // Capture-phase document listener fires before any element-level
  // listener (including Lexical's own paste handler). Suppress the
  // original event end-to-end so Lexical never sees the Word-soup
  // HTML; we drive the insertion ourselves through the editor's
  // own `update()` API.
  event.preventDefault();
  event.stopImmediatePropagation();
  insertCleanedNodes(editor, parsed);

  // Surface a passing toast so editors get a confirmation pulse —
  // otherwise the paste reads as silent magic.
  try {
    window.dispatchEvent(new CustomEvent('cs-cms:toast', {
      detail: { message: 'Rich text pasted and cleaned.', type: 'success' },
    }));
  } catch {
    // ignore — toast is best-effort.
  }
};

/**
 * Mount-once admin component that registers a single capture-phase
 * paste listener on `document`. When the clipboard carries Word /
 * Word Online / Google Docs HTML, we normalise it (drop MSO cruft,
 * promote MsoHeading paragraphs to `<h{n}>`, rewrite font-weight /
 * font-style spans into `<strong>`/`<em>`/`<u>`) and feed the
 * cleaned tree directly into the active Lexical editor via
 * `$generateNodesFromDOM` + `$insertNodes`. Document-level capture
 * guarantees we run before any per-editor listener (including
 * Lexical's built-in paste handler), so existing posts and new
 * posts behave identically — no race against editor mount order.
 */
export const RichPastePlugin = (): null => {
  useEffect(() => {
    document.addEventListener('paste', handleDocumentPaste, true);
    return () => {
      document.removeEventListener('paste', handleDocumentPaste, true);
    };
  }, []);
  return null;
};
