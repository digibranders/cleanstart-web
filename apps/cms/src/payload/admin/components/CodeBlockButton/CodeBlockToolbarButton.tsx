'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_BLOCK_COMMAND } from '@payloadcms/richtext-lexical/client';
import type { ReactElement } from 'react';

// `<>` glyph — the same chevron pair the slash menu uses for its code
// entry, so the toolbar button reads as "code" at a glance and matches
// the look of the inline-code button it replaces.
const codeIcon = (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 5L3 8l3 3M10 5l3 3-3 3"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Fixed-toolbar button that inserts a CodeBlock decorator. Registered into
 * the stock `format` toolbar group (see CleanstartCodeBlockFeatureClient) so
 * it sits where the inline-code `<>` button used to live — but instead of
 * toggling an inline-code mark it drops the full CodeBlock (Language /
 * Content / line-number) card. This is the single code affordance on the
 * toolbar; the redundant stock BlocksFeature dropdown is suppressed in CSS.
 */
export function CodeBlockToolbarButton(): ReactElement {
  const [editor] = useLexicalComposerContext();

  return (
    <button
      type="button"
      aria-label="Code block"
      title="Code block"
      className="toolbar-popup__button cs-code-block__trigger"
      data-button-key="cs-code-block"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        editor.dispatchCommand(INSERT_BLOCK_COMMAND, {
          blockName: '',
          blockType: 'codeBlock',
          language: 'bash',
          content: '',
          showLineNumbers: true,
        });
      }}
    >
      {codeIcon}
    </button>
  );
}
