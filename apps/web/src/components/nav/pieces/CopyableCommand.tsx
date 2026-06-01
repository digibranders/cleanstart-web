"use client";

import { useState } from "react";

type Props = {
  /** The full command, including any `$` prompt prefix. */
  command: string;
  /** Optional explicit override of what gets written to the clipboard. Defaults to `command` minus a leading `$ ` if present. */
  clipboardText?: string;
};

export function CopyableCommand({ command, clipboardText }: Props) {
  const [copied, setCopied] = useState(false);

  const textToCopy = clipboardText ?? command.replace(/^\$\s+/, "");

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard API can throw on insecure contexts or when permissions are
      // denied. Fail silently — the command is still visible/selectable.
    }
  }

  // Stop the parent <a> link from navigating when the user clicks or
  // keyboard-activates the code text (e.g. to triple-click and copy manually).
  function handleBoxInteraction(
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
  ) {
    e.stopPropagation();
  }

  return (
    // role="presentation" marks this wrapper as non-interactive for assistive
    // technology — the copy <button> inside it is the actual interactive target.
    // The click/keydown handlers exist only to stop propagation so manual
    // text selection inside the box doesn't bubble up to the enclosing <a>.
    <div
      role="presentation"
      onClick={handleBoxInteraction}
      onKeyDown={handleBoxInteraction}
      className="cs-surface-recess flex items-center gap-2 rounded-[8px] py-1.5 pl-2.5 pr-1.5 font-mono text-[11px] text-white/90"
    >
      <code className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {command.startsWith("$") ? (
          <>
            <span className="text-white/35">$</span>
            {command.slice(1)}
          </>
        ) : (
          command
        )}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] border transition-colors duration-150 ${
          copied
            ? "border-[rgba(108,255,194,0.35)] bg-[rgba(108,255,194,0.10)] text-[#6cffc2]"
            : "cs-chip border-transparent text-white/55 hover:text-white"
        }`}
        aria-label={copied ? "Copied" : "Copy command to clipboard"}
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
