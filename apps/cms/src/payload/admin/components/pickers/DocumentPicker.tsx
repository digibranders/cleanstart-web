'use client';

import type { ReactElement, SyntheticEvent } from 'react';
import { useId, useRef } from 'react';

import { Dialog, DialogBody, DialogHeader } from '../ui/Dialog';

type Props = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly relationTo: string;
  /** Doc id to edit. Pass `null` to create a new document. */
  readonly id?: string | null;
  readonly title?: string;
  /** Called after the embedded editor reports a successful save. */
  readonly onSaved?: (id: string) => void;
};

const buildAdminUrl = (relationTo: string, id: string | null | undefined): string => {
  const base = `/admin/collections/${relationTo}`;
  return id ? `${base}/${id}` : `${base}/create`;
};

/**
 * CSS injected into the embedded admin frame on load. Hides the side nav,
 * the nav toggler, and the global header so the inner edit form has the
 * whole modal surface and doesn't look like a CMS-in-CMS. The form is
 * what editors care about — they reached this modal *from* a relationship
 * picker, so giving them a second copy of the sidebar is just noise that
 * also lets them navigate away from the picker context.
 */
const EMBED_STYLE = `
  /* Hide the entire side-nav rail */
  .nav,
  .template-default__nav,
  [class*="template-default__nav"],
  /* Hide the nav-collapse toggler shown in the header */
  .nav-toggler,
  [class*="nav-toggler"],
  /* Hide the top app header (logo, search, user menu) — keep just the doc
     edit form which Payload renders in the main column */
  .app-header,
  [class*="app-header"],
  /* CleanStart-specific bits we slotted into beforeNavLinks / afterNavLinks */
  .cs-sidebar-header,
  .cs-user-menu,
  /* The skip-to-main-content link */
  .skip-link {
    display: none !important;
  }

  /* Reclaim the space the sidebar was holding */
  body, .template-default, [class*="template-default"] {
    --nav-width: 0 !important;
    grid-template-columns: 1fr !important;
  }
  .template-default__wrap,
  [class*="template-default__wrap"] {
    margin-inline-start: 0 !important;
    padding-inline-start: 0 !important;
    width: 100% !important;
  }
  .doc-controls,
  .gutter {
    padding-inline: var(--cs-space-4, 16px) !important;
  }
`;

const injectEmbedStyles = (frame: HTMLIFrameElement): void => {
  try {
    const doc = frame.contentDocument;
    if (!doc) return;
    // Same-origin iframe (both parent and frame run on localhost:3000),
    // so we can reach in. If a future deploy splits origins, this becomes
    // a no-op (try/catch) and the frame will just look like the full
    // admin — graceful degradation.
    //
    // We deliberately do NOT setAttribute on doc.body — Next.js shares
    // the same React tree between parent and iframe (both render
    // RootLayout), and any DOM mutation on body during hydration causes a
    // mismatch on the parent ("server rendered <body data-cs-embed>,
    // client doesn't"). Stylesheet injection alone is enough.
    const existing = doc.getElementById('cs-document-picker-embed-styles');
    if (existing) return;
    const style = doc.createElement('style');
    style.id = 'cs-document-picker-embed-styles';
    style.textContent = EMBED_STYLE;
    doc.head.appendChild(style);
  } catch {
    // cross-origin frame, nothing we can do — leave the full admin
  }
};

/**
 * Drawer-hosted document editor. First-pass implementation embeds the
 * standard Payload edit URL in an iframe so we get every field, every
 * validation, every hook for free, while the surrounding chrome stays
 * CleanStart-owned.
 *
 * A native (non-iframe) version that mounts Payload's RSC `RenderEdit`
 * directly is a follow-up; the iframe path lets us replace
 * `useDocumentDrawer` everywhere immediately without re-implementing
 * field rendering.
 *
 * Save signalling: the embedded admin posts `payload-document-saved`
 * messages on save (Payload 3 behavior in <iframe> contexts). We listen
 * and forward to `onSaved` if provided.
 */
export const DocumentPicker = (props: Props): ReactElement => {
  const { open, onClose, relationTo, id, title, onSaved } = props;
  const titleId = useId();
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  const src = buildAdminUrl(relationTo, id);

  const onLoad = (e: SyntheticEvent<HTMLIFrameElement>): void => {
    const frame = e.currentTarget ?? frameRef.current;
    if (frame) injectEmbedStyles(frame);

    if (!onSaved) return;
    const handler = (ev: MessageEvent): void => {
      const data = ev.data as { type?: string; id?: string } | null;
      if (data && data.type === 'payload-document-saved' && data.id) {
        onSaved(data.id);
      }
    };
    window.addEventListener('message', handler);
    const detach = (): void => window.removeEventListener('message', handler);
    window.setTimeout(detach, 1000 * 60 * 30);
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} size="xl">
      <DialogHeader
        id={titleId}
        title={title ?? (id ? 'Edit document' : 'Create document')}
        description={relationTo}
        onClose={onClose}
      />
      <DialogBody>
        <iframe
          ref={frameRef}
          className="cs-document-picker__frame"
          title={title ?? 'Document editor'}
          src={src}
          onLoad={onLoad}
        />
      </DialogBody>
    </Dialog>
  );
};
