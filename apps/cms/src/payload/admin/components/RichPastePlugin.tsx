'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { useDocumentInfo } from '@payloadcms/ui';
import {
  $createUploadNode,
  INSERT_BLOCK_COMMAND,
} from '@payloadcms/richtext-lexical/client';
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
import { buildInlineMediaContextHint } from './InlineImage/context-hint';
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
  contextHint: string,
): Promise<void> => {
  if (images.length === 0) return;
  toast(`Pasted text — ingesting ${images.length} image${images.length === 1 ? '' : 's'}…`);

  let succeeded = 0;
  let failed = 0;
  for (const img of images) {
    const result = await ingestMediaFromUrl(img.src, {
      folder,
      ...(img.alt ? { alt: img.alt } : {}),
      ...(contextHint ? { contextHint } : {}),
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

// Normalise common language aliases to the 12 keys supported by the
// CodeBlock schema. Anything we don't recognise becomes 'text' — the
// rendered output will still be readable, just unhighlighted.
const SUPPORTED_LANGS = new Set([
  'bash',
  'dockerfile',
  'yaml',
  'json',
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'sql',
  'hcl',
  'text',
]);
const LANG_ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  typescriptreact: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  javascriptreact: 'javascript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  zsh: 'bash',
  terraform: 'hcl',
  tf: 'hcl',
  golang: 'go',
  rs: 'rust',
  plain: 'text',
  plaintext: 'text',
  txt: 'text',
};
const normalizeLang = (raw: string | null | undefined): string => {
  if (!raw) return 'text';
  const lower = raw.toLowerCase().trim();
  if (SUPPORTED_LANGS.has(lower)) return lower;
  if (LANG_ALIASES[lower]) return LANG_ALIASES[lower] as string;
  return 'text';
};

interface DetectedCode {
  language: string;
  content: string;
}

// VS Code (and Cursor / IDEs forked from it) ships a `vscode-editor-data`
// MIME entry on copy with the source language. Stack Overflow / GitHub /
// Slack / Discord wrap copied code in <pre> / <code class="language-…">.
// Detect those high-confidence cases; otherwise return null and let the
// existing rich-paste path run.
const detectCodeFromClipboard = (
  clipboardData: DataTransfer,
): DetectedCode | null => {
  const types = clipboardData.types;
  const plain = clipboardData.getData('text/plain');

  // 1. VS Code / Cursor — they include a JSON blob naming the source mode.
  if (types.includes('vscode-editor-data') && plain) {
    try {
      const raw = clipboardData.getData('vscode-editor-data');
      const parsed = raw ? (JSON.parse(raw) as { mode?: string }) : {};
      return { language: normalizeLang(parsed.mode), content: plain };
    } catch {
      return { language: 'text', content: plain };
    }
  }

  // 2. HTML clipboard with a <pre> or language-tagged <code> at the root.
  //    GitHub, Slack, Discord, Stack Overflow, MDN all emit this shape.
  const html = clipboardData.getData('text/html');
  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      // Strip wrapping <html><body> noise to find the meaningful root.
      const body = doc.body;
      // Skip empty-body / commentary-only pastes.
      const significantChildren = Array.from(body.children).filter(
        (el) => el.tagName !== 'META' && (el.textContent ?? '').trim().length > 0,
      );
      if (significantChildren.length === 1) {
        const only = significantChildren[0] as HTMLElement;
        const pre = only.tagName === 'PRE' ? only : only.querySelector('pre');
        if (pre) {
          // language-… class can be on the <pre> itself or a child <code>.
          const codeEl = pre.querySelector('code') ?? pre;
          const langClass = Array.from(codeEl.classList).find((c) =>
            c.startsWith('language-'),
          );
          const dataLang =
            codeEl.getAttribute('data-language') ??
            pre.getAttribute('data-language') ??
            null;
          const language = normalizeLang(
            langClass ? langClass.slice('language-'.length) : dataLang,
          );
          // Prefer text/plain — preserves indentation and whitespace
          // accurately. Fall back to textContent for clipboards that omit
          // plain text (rare; some embedded widgets).
          const content = plain || (pre.textContent ?? '');
          if (content.trim().length > 0) return { language, content };
        }
      }
    } catch {
      // Malformed HTML — fall through to normal paste.
    }
  }

  return null;
};

const handlePaste = (
  event: ClipboardEvent,
  ownEditor: LexicalEditor,
  folder: string,
  contextHint: string,
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

  // High-confidence code paste? Convert to a CodeBlock and stop. We
  // only trip this for clipboards that mark themselves as code
  // (VS Code MIME, <pre>/<code class="language-…">) — never for raw
  // plain text, to avoid false positives mangling pasted prose.
  const clipboardData = event.clipboardData;
  if (clipboardData) {
    const detected = detectCodeFromClipboard(clipboardData);
    if (detected) {
      event.preventDefault();
      event.stopImmediatePropagation();
      ownEditor.dispatchCommand(INSERT_BLOCK_COMMAND, {
        blockName: '',
        blockType: 'codeBlock',
        language: detected.language,
        content: detected.content,
        showLineNumbers: true,
      });
      toast('Pasted as code block.');
      return;
    }
  }

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
    void ingestImagesAfterPaste(ownEditor, collectedImages, folder, contextHint);
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
// Keyboard shortcuts that the browser handles natively for <input> /
// <textarea> / <select> elements and that Lexical's editor-wide
// KEY_DOWN handler would otherwise hijack (Cmd+A selects the whole
// rich-text body, Cmd+Z undoes editor-wide changes, etc.). When focus
// is inside a form control hosted by a Lexical block decorator, the
// user expects the control's native behaviour — not the editor's.
const isEditingShortcut = (e: KeyboardEvent): boolean => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod) {
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'c' || k === 'v' || k === 'x' || k === 'z' || k === 'y') {
      return true;
    }
  }
  return false;
};

const isFormControlInsideDecorator = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return false;
  return !!target.closest('[data-lexical-decorator="true"]');
};

const guardDecoratorInputKeys = (event: KeyboardEvent): void => {
  if (!isFormControlInsideDecorator(event.target)) return;
  if (!isEditingShortcut(event)) return;
  // Capture-phase stopImmediatePropagation prevents Lexical's KEY_DOWN
  // listeners from ever running; the browser's native form-control
  // handling still proceeds because we never call preventDefault().
  event.stopImmediatePropagation();
};

export const RichPastePlugin = (): null => {
  const [editor] = useLexicalComposerContext();
  const { collectionSlug, id, title } = useDocumentInfo();
  const folder = inlineImageFolderForCollection(collectionSlug);
  const contextHint = buildInlineMediaContextHint(collectionSlug, title, id);

  useEffect(() => {
    const handler = (event: ClipboardEvent): void => {
      handlePaste(event, editor, folder, contextHint);
    };
    document.addEventListener('paste', handler, true);
    document.addEventListener('keydown', guardDecoratorInputKeys, true);
    return () => {
      document.removeEventListener('paste', handler, true);
      document.removeEventListener('keydown', guardDecoratorInputKeys, true);
    };
  }, [editor, folder, contextHint]);
  return null;
};
