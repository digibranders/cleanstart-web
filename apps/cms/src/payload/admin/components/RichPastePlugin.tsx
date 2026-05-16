'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { useDocumentInfo } from '@payloadcms/ui';
import { $createUploadNode } from '@payloadcms/richtext-lexical/client';
import {
  $getRoot,
  $getSelection,
  $insertNodes,
  $isParagraphNode,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import { useEffect } from 'react';

import {
  extractInlineImages,
  type ExtractedInlineImage,
  INLINE_IMAGE_PLACEHOLDER_PREFIX,
  looksLikeRichDoc,
  normalizeRichHtml,
} from '../../lib/normalize-rich-html';
import { inlineImageFolderForCollection } from './InlineImage/folder';
import {
  ingestMediaFromUrl,
  normalizeUploadValue,
} from './InlineImage/upload-media-file';

type LexicalDomElement = HTMLElement & {
  __lexicalEditor?: LexicalEditor;
};

const toast = (message: string, type: 'success' | 'error' = 'success'): void => {
  try {
    window.dispatchEvent(
      new CustomEvent('cs-cms:toast', { detail: { message, type } }),
    );
  } catch {
    // ignore — toast is best-effort.
  }
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

// Find the placeholder paragraph for a given placeholderId inside the
// active Lexical state. Returns null if it has been removed (the user
// edited the doc mid-ingest, undid the paste, etc.). Must be called
// from inside an `editor.update()` or `editor.read()` scope.
const $findPlaceholderParagraph = (placeholderId: string) => {
  const target = `${INLINE_IMAGE_PLACEHOLDER_PREFIX}${placeholderId}`;
  for (const child of $getRoot().getChildren()) {
    if (!$isParagraphNode(child)) continue;
    if (child.getTextContent().trim() === target) return child;
  }
  return null;
};

// Serial — not parallel — so we don't slam the upload pipeline or
// trigger races against the inline-image plugin's own state. For
// each ingested URL, swap the placeholder paragraph at the original
// image position for an UploadNode. On failure, remove the
// placeholder so the cleaned text doesn't carry magic-string
// artefacts. The placeholder lookup runs on-demand inside each
// `editor.update()` so we always read against the latest committed
// state — never a stale upfront map captured before the cleaned
// nodes finished settling.
const ingestImagesAfterPaste = async (
  editor: LexicalEditor,
  images: ExtractedInlineImage[],
  folder: string,
): Promise<void> => {
  if (images.length === 0) return;
  toast(`Pasted text — ingesting ${images.length} image${images.length === 1 ? '' : 's'}…`);

  let succeeded = 0;
  let failed = 0;
  for (const img of images) {
    const result = await ingestMediaFromUrl(img.src, {
      folder,
      ...(img.alt ? { alt: img.alt } : {}),
    });
    if (result.ok) {
      succeeded += 1;
      const doc = result.doc;
      editor.update(() => {
        const uploadNode = $createUploadNode({
          data: {
            relationTo: 'media',
            value: normalizeUploadValue(doc.id),
            fields: {
              alt: doc.alt ?? img.alt ?? '',
              caption: '',
              alignment: 'center',
              size: 'large',
              decorative: false,
            },
          },
        });
        const placeholder = $findPlaceholderParagraph(img.placeholderId);
        if (placeholder) {
          placeholder.replace(uploadNode);
        } else {
          // Placeholder vanished (editor was edited mid-ingest, undo,
          // etc.) — fall back to end-of-root insertion so the upload
          // is not lost.
          $getRoot().selectEnd();
          $insertNodes([uploadNode]);
        }
      });
    } else {
      failed += 1;
      editor.update(() => {
        const placeholder = $findPlaceholderParagraph(img.placeholderId);
        if (placeholder) placeholder.remove();
      });
    }
  }

  if (failed === 0) {
    toast(`Ingested ${succeeded} image${succeeded === 1 ? '' : 's'}.`);
  } else if (succeeded === 0) {
    toast(`Could not ingest any of the ${failed} pasted images.`, 'error');
  } else {
    toast(
      `Ingested ${succeeded} image${succeeded === 1 ? '' : 's'}; ${failed} failed.`,
      'error',
    );
  }
};

const handlePaste = (
  event: ClipboardEvent,
  ownEditor: LexicalEditor,
  folder: string,
): void => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const editorRoot = target.closest(
    '[data-lexical-editor="true"]',
  ) as LexicalDomElement | null;
  if (!editorRoot) return;
  // Multi-editor pages mount one of these listeners per editor. Only
  // the plugin owned by the focused editor should act — bail out for
  // every other instance.
  if (editorRoot.__lexicalEditor !== ownEditor) return;

  const html = event.clipboardData?.getData('text/html');
  if (!html || !looksLikeRichDoc(html)) return;

  let parsed: Document;
  try {
    parsed = new DOMParser().parseFromString(html, 'text/html');
  } catch {
    return;
  }
  let collectedImages: ExtractedInlineImage[] = [];
  try {
    // Strip <img> first — before normalize and before Lexical sees the
    // DOM. Each `<img>` is replaced with a `<p>` placeholder at the
    // image's original position so the paste plugin can swap each
    // placeholder for a real UploadNode once the URL has been
    // ingested server-side. This prevents Payload's
    // `UploadNode.importDOM` from creating shimmer-stuck "pending"
    // nodes (its bundled UploadPlugin transform cannot resolve them
    // for cross-origin URLs — no CORS, no try/catch, no timeout).
    collectedImages = extractInlineImages(parsed.body);
    normalizeRichHtml(parsed.body);
  } catch {
    return;
  }
  if (!parsed.body.innerHTML.trim() && collectedImages.length === 0) return;

  // Capture-phase document listener fires before any element-level
  // listener (including Lexical's own paste handler). Suppress the
  // original event end-to-end so Lexical never sees the Word-soup
  // HTML; we drive the insertion ourselves through the editor's
  // own `update()` API.
  event.preventDefault();
  event.stopImmediatePropagation();
  insertCleanedNodes(ownEditor, parsed);

  if (collectedImages.length > 0) {
    void ingestImagesAfterPaste(ownEditor, collectedImages, folder);
  } else {
    toast('Rich text pasted and cleaned.');
  }
};

/**
 * Per-editor Lexical plugin that registers a single capture-phase
 * `paste` listener on `document` (one per mounted editor; each
 * listener only acts when its own editor is the paste target).
 *
 * When the clipboard carries Word / Word Online / Google Docs /
 * Webflow HTML we:
 *
 *   1. Replace every `<img>` with a `<p>placeholder</p>` paragraph at
 *      the image's original position (so Lexical's stock
 *      `UploadNode.importDOM` never sees `<img>` tags it would turn
 *      into shimmer pending nodes that the bundled UploadPlugin
 *      cannot resolve cross-origin).
 *   2. Normalise the cleaned HTML (drop MSO cruft, promote
 *      MsoHeading paragraphs to `<h{n}>`, rewrite font-weight /
 *      font-style spans into `<strong>`/`<em>`/`<u>`).
 *   3. Insert the cleaned tree via `$generateNodesFromDOM` +
 *      `$insertNodes`.
 *   4. Sequentially ingest each stripped image URL through the
 *      server-side `/api/media-ingest-url` endpoint (which bypasses
 *      the browser CORS boundary) and swap the matching placeholder
 *      paragraph for a real `upload` node at the same position in
 *      the editor. Failed ingests remove their placeholder so no
 *      magic-string artefact is left in the document.
 *
 * Document-level capture guarantees we run before any per-editor
 * listener (including Lexical's built-in paste handler), so existing
 * posts and new posts behave identically — no race against editor
 * mount order.
 */
export const RichPastePlugin = (): null => {
  const [editor] = useLexicalComposerContext();
  const { collectionSlug } = useDocumentInfo();
  const folder = inlineImageFolderForCollection(collectionSlug);

  useEffect(() => {
    const handler = (event: ClipboardEvent): void => {
      handlePaste(event, editor, folder);
    };
    document.addEventListener('paste', handler, true);
    return () => {
      document.removeEventListener('paste', handler, true);
    };
  }, [editor, folder]);
  return null;
};
