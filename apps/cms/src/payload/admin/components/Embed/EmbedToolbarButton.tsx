'use client';

import type { LexicalEditor } from 'lexical';

import { OPEN_EMBED_DIALOG_COMMAND } from './EmbedPlugin';

function EmbedIcon(): React.ReactElement {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="16"
    >
      <rect height="10" rx="1.5" width="14" x="1" y="3" />
      <path d="M5.5 6.5L3 8l2.5 1.5M10.5 6.5L13 8l-2.5 1.5M7.5 10l1-4" />
    </svg>
  );
}

export function EmbedToolbarButton({
  editor,
}: {
  editor: LexicalEditor;
}): React.ReactElement {
  return (
    <button
      aria-label="Insert embed"
      className="toolbar-popup__button toolbar-popup__button-cs-embed"
      data-button-key="cs-embed"
      onClick={() => {
        editor.dispatchCommand(OPEN_EMBED_DIALOG_COMMAND, {});
      }}
      onMouseDown={(event) => event.preventDefault()}
      title="Embed (YouTube, Vimeo, Calendly, script widgets…)"
      type="button"
    >
      <EmbedIcon />
    </button>
  );
}
