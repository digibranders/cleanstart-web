'use client';

import { useEffect } from 'react';

// Hover tooltips (native `title`, the same mechanism the code-block and embed
// buttons already use) + aria-labels for every toolbar control that ships
// without one. Icon-only buttons are ambiguous — inline code, code block and
// embed all read as "some brackets" — and Payload's stock toolbar renders
// them with no title and mostly no aria-label.
//
// Keyed by the stable per-item class Payload puts on each toolbar control
// (`toolbar-popup__button-<key>` / `toolbar-popup__dropdown-<key>`). Buttons
// that already carry their own title (cs-code-block, cs-embed) are skipped by
// the only-if-missing guard, and the CSS-hidden stock `link` button and
// `blocks` dropdown are simply never hovered, so titling them is harmless.
const TOOLBAR_TIPS: ReadonlyArray<readonly [selector: string, tip: string]> = [
  ['.cs-add-menu__trigger', 'Insert block'],
  ['.toolbar-popup__dropdown-add', 'Insert menu'],
  ['.toolbar-popup__dropdown-text', 'Text style'],
  ['.toolbar-popup__dropdown-align', 'Text alignment'],
  ['.toolbar-popup__button-indentDecrease', 'Decrease indent'],
  ['.toolbar-popup__button-indentIncrease', 'Increase indent'],
  ['.toolbar-popup__button-bold', 'Bold (Ctrl/⌘ B)'],
  ['.toolbar-popup__button-italic', 'Italic (Ctrl/⌘ I)'],
  ['.toolbar-popup__button-underline', 'Underline (Ctrl/⌘ U)'],
  ['.toolbar-popup__button-strikethrough', 'Strikethrough'],
  ['.toolbar-popup__button-subscript', 'Subscript'],
  ['.toolbar-popup__button-superscript', 'Superscript'],
  ['.toolbar-popup__button-inlineCode', 'Inline code — `text` or Ctrl/⌘ E'],
  ['.toolbar-popup__button-cs-link', 'Add / edit link'],
  ['.toolbar-popup__button-cs-table', 'Insert table'],
];

const applyTips = (): void => {
  for (const [selector, tip] of TOOLBAR_TIPS) {
    for (const el of document.querySelectorAll(selector)) {
      if (!el.getAttribute('title')) el.setAttribute('title', tip);
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', tip);
    }
  }
};

// Admin-wide singleton: the toolbar re-renders on every selection change and
// each rich-text field (including drawers) mounts its own toolbar, so a
// per-editor pass would miss re-created buttons. One body-level observer,
// coalesced to a frame, re-applies to whatever appeared. childList-only so
// our own setAttribute calls can't re-trigger it.
let installed = false;

export function ToolbarTipsPlugin(): null {
  useEffect(() => {
    if (installed) return;
    installed = true;
    applyTips();
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        applyTips();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }, []);

  return null;
}
