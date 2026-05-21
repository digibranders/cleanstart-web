'use client';

import { DropdownMenu, type DropdownMenuItem } from '@cleanstart/ui';
import { useDocumentInfo } from '@payloadcms/ui';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { ShareLinkDialog } from './CopyPreviewLink';

const EyeIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.25" />
  </svg>
);

const ExternalIcon = (): ReactElement => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6 3H3v10h10v-3M9 3h4v4M13 3 7.5 8.5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M6.5 9.5a2.5 2.5 0 0 0 3.54 0l2-2a2.5 2.5 0 1 0-3.54-3.54l-.7.7M9.5 6.5a2.5 2.5 0 0 0-3.54 0l-2 2a2.5 2.5 0 1 0 3.54 3.54l.7-.7"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PaneIcon = (): ReactElement => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
    <path d="M8 2.5v11" stroke="currentColor" strokeWidth="1.25" />
  </svg>
);

/**
 * Unified "Preview" split-button mounted in `beforeDocumentControls`.
 * Collapses the three legacy preview affordances (toolbar Preview link,
 * Live Preview toggler, and the standalone Copy-preview-link button)
 * into a single action with a dropdown.
 *
 *   [ Preview ▾ ]
 *      ├ Open in new tab     (default click = this)
 *      ├ Toggle live preview pane    (only when the Live Preview is wired)
 *      └ Copy shareable link…        (opens ShareLinkDialog)
 *
 * Payload's own `#preview-button` and `#live-preview-toggler` are
 * hidden via CSS to keep the toolbar to a single button — but we still
 * delegate the live-preview toggle to Payload's button (one-line
 * `.click()`) so we don't fork its iframe state machine.
 */
export const PreviewMenu = (): ReactElement | null => {
  const { id, collectionSlug } = useDocumentInfo();
  // Anchor the dropdown to the whole split-button wrapper (not just the
  // chevron). That way the menu drops from the bottom of the entire
  // button group with its right edge aligned to the chevron's right
  // edge — visually it reads as "this dropdown belongs to the button
  // above it", not as a free-floating popup near a tiny caret.
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const previewUrl = useMemo(() => {
    if (!collectionSlug || id == null) return null;
    return `/api/preview/redirect?collection=${encodeURIComponent(collectionSlug)}&docId=${encodeURIComponent(String(id))}`;
  }, [collectionSlug, id]);

  const openInNewTab = useCallback((): void => {
    if (!previewUrl) return;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  }, [previewUrl]);

  const toggleLivePreview = useCallback((): void => {
    // Defer to Payload's stock toggler so its iframe/`useLivePreview` state
    // stays the source of truth. The button is hidden via CSS but still
    // mounted in the DOM.
    const stock = document.getElementById('live-preview-toggler') as HTMLButtonElement | null;
    stock?.click();
  }, []);

  const items = useMemo<DropdownMenuItem[]>(
    () => [
      {
        kind: 'item',
        id: 'open',
        icon: <ExternalIcon />,
        label: 'Open in new tab',
        onSelect: openInNewTab,
      },
      {
        kind: 'item',
        id: 'pane',
        icon: <PaneIcon />,
        label: 'Toggle live preview pane',
        onSelect: toggleLivePreview,
      },
      { kind: 'separator', id: 'sep' },
      {
        kind: 'item',
        id: 'share',
        icon: <LinkIcon />,
        label: 'Copy shareable link…',
        onSelect: () => setShareOpen(true),
      },
    ],
    [openInNewTab, toggleLivePreview],
  );

  if (!collectionSlug || id == null) return null;

  return (
    <div className="cs-preview-menu" ref={anchorRef}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium cs-preview-menu__primary"
        onClick={openInNewTab}
        title="Open preview in a new tab"
      >
        <EyeIcon />
        <span>Preview</span>
      </button>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium cs-preview-menu__chevron"
        aria-label="More preview actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M3 4.5l3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <DropdownMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        items={items}
        placement="bottom-end"
        ariaLabel="Preview actions"
      />
      <ShareLinkDialog open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
};

export default PreviewMenu;
