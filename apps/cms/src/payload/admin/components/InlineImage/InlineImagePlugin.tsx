'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import {
  $createUploadNode,
  $isUploadNode,
  UploadNode,
} from '@payloadcms/richtext-lexical/client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $insertNodes,
  $nodesOfType,
  COMMAND_PRIORITY_HIGH,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  PASTE_COMMAND,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { inlineImageFolderForCollection } from './folder';
import {
  InlineImageEditDialog,
  DEFAULT_INLINE_IMAGE_FIELDS,
  type InlineImageFields,
} from './InlineImageEditDialog';
import { InlineImageInsertDialog } from './InlineImageInsertDialog';
import { InlineImagePreviewDialog } from './InlineImagePreviewDialog';
import {
  uploadMediaFile,
  type UploadedMediaDoc,
} from './upload-media-file';

/**
 * Public command to open the inline-image insert dialog. Dispatched
 * from the slash menu (`/image`) and any future toolbar button.
 */
export const OPEN_INLINE_IMAGE_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_INLINE_IMAGE_DIALOG_COMMAND',
);

const extractImageFiles = (list: FileList | DataTransferItemList | null | undefined): File[] => {
  if (!list) return [];
  const files: File[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const entry = list[i] as File | DataTransferItem | undefined;
    if (!entry) continue;
    if (entry instanceof File) {
      if (entry.type.startsWith('image/')) files.push(entry);
    } else if ('kind' in entry && entry.kind === 'file') {
      const file = entry.getAsFile();
      if (file?.type.startsWith('image/')) files.push(file);
    }
  }
  return files;
};

/**
 * The single Lexical plugin that backs the custom inline-image
 * experience.
 *
 *  - `PASTE_COMMAND` (HIGH): intercepts pasted `image/*` files,
 *    uploads them, inserts as `upload` nodes with sensible default
 *    `fields` (alt from the Media doc, alignment center, size large).
 *    Returns `true` to short-circuit the stock UploadPlugin's
 *    LOW-priority paste handler.
 *  - `DRAGOVER_COMMAND` / `DROP_COMMAND` (HIGH): same flow for
 *    drag-drop. preventDefault on dragover so the browser doesn't
 *    open the image in a new tab.
 *  - `OPEN_INLINE_IMAGE_DIALOG_COMMAND`: opens the three-tab insert
 *    dialog (Device / Browse / URL).
 *
 * The plugin reads `useDocumentInfo().collectionSlug` once to derive
 * the Media folder hint so uploads land in `web/blog`, `web/guide`,
 * or `web/general` to match the hero image's `folderHint`.
 */
export const InlineImagePlugin = (): ReactElement => {
  const [editor] = useLexicalComposerContext();
  const { collectionSlug } = useDocumentInfo();
  const folder = inlineImageFolderForCollection(collectionSlug);

  const [dialogOpen, setDialogOpen] = useState(false);
  // When non-null the insert dialog runs in "swap" mode: a successful
  // pick replaces the `value` of this nodeKey rather than inserting a
  // new node at the current selection.
  const [swapNodeKey, setSwapNodeKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<
    | {
        nodeKey: string;
        mediaId: string;
        fields: InlineImageFields;
      }
    | null
  >(null);

  const [previewTarget, setPreviewTarget] = useState<
    | { url: string; alt: string; caption: string | null }
    | null
  >(null);

  const insertUploadedDoc = useCallback(
    (doc: UploadedMediaDoc, replaceNodeKey: string | null) => {
      editor.update(() => {
        if (replaceNodeKey) {
          // Swap mode — keep the existing node's per-placement fields
          // (alignment, size, caption) but point at the new media.
          // Fall back to inserting if the node is gone (rare race).
          const existing = $getNodeByKey(replaceNodeKey);
          if (existing && $isUploadNode(existing)) {
            const current = existing.getData();
            existing.setData({
              ...current,
              value: doc.id,
              fields: {
                ...(current.fields as InlineImageFields),
                alt: (current.fields as InlineImageFields)?.alt || doc.alt || '',
              },
            });
            return;
          }
        }
        const node = $createUploadNode({
          data: {
            relationTo: 'media',
            value: doc.id,
            fields: {
              alt: doc.alt ?? '',
              caption: '',
              alignment: 'center',
              size: 'large',
              decorative: false,
            },
          },
        });
        $insertNodes([node]);
      });
    },
    [editor],
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      for (const file of files) {
        const result = await uploadMediaFile(file, { folder });
        if (result.ok) {
          insertUploadedDoc(result.doc, null);
        } else {
          setError(result.error);
          // Stop on first failure so the editor sees a clear toast and
          // the user can retry rather than thrashing through a batch.
          break;
        }
      }
    },
    [folder, insertUploadedDoc],
  );

  // Resolve the upload-node key that a clicked toolbar button (Edit
  // pencil / Swap arrows) belongs to. We walk every UploadNode in
  // the current editor state and check which one's rendered DOM
  // element contains the click target. There's no `lexicalKey` data
  // attribute on the wrapper, so DOM ancestry is the most stable
  // path that doesn't rely on Lexical internals.
  const findUploadNodeKeyForElement = useCallback(
    (target: Element): string | null => {
      let matched: string | null = null;
      editor.getEditorState().read(() => {
        const nodes = $nodesOfType(UploadNode);
        for (const node of nodes) {
          const dom = editor.getElementByKey(node.getKey());
          if (dom?.contains(target)) {
            matched = node.getKey();
            return;
          }
        }
      });
      return matched;
    },
    [editor],
  );

  const openEditForNode = useCallback(
    (nodeKey: string) => {
      let payload:
        | {
            mediaId: string;
            fields: InlineImageFields;
          }
        | null = null;
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if (!node || !$isUploadNode(node)) return;
        const data = node.getData();
        const rawFields = (data.fields ?? {}) as Partial<InlineImageFields>;
        const value = data.value;
        const mediaId = typeof value === 'object' && value !== null
          ? String((value as { id?: unknown }).id ?? '')
          : String(value ?? '');
        if (!mediaId) return;
        payload = {
          mediaId,
          fields: { ...DEFAULT_INLINE_IMAGE_FIELDS, ...rawFields },
        };
      });
      if (payload) {
        const resolved = payload as { mediaId: string; fields: InlineImageFields };
        setEditTarget({ nodeKey, ...resolved });
      }
    },
    [editor],
  );

  const saveEdit = useCallback(
    (nodeKey: string, next: InlineImageFields) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!node || !$isUploadNode(node)) return;
        const current = node.getData();
        node.setData({ ...current, fields: next });
      });
      setEditTarget(null);
    },
    [editor],
  );

  const removeNode = useCallback(
    (nodeKey: string) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) node.remove();
      });
      setEditTarget(null);
    },
    [editor],
  );

  // PASTE_COMMAND at HIGH priority — beat the stock UploadPlugin's
  // LOW-priority paste handler (which would otherwise open the media
  // browser drawer).
  useEffect(() => {
    return editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const files = extractImageFiles(event.clipboardData?.items ?? null);
        if (files.length === 0) return false;
        event.preventDefault();
        void handleFiles(files);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, handleFiles]);

  // DRAGOVER_COMMAND — preventDefault so the browser accepts the drop
  // (without this it would open the image in a new tab).
  useEffect(() => {
    return editor.registerCommand<DragEvent>(
      DRAGOVER_COMMAND,
      (event) => {
        const items = event.dataTransfer?.items;
        if (!items || items.length === 0) return false;
        let hasImage = false;
        for (let i = 0; i < items.length; i += 1) {
          const item = items[i];
          if (item && item.kind === 'file' && item.type.startsWith('image/')) {
            hasImage = true;
            break;
          }
        }
        if (!hasImage) return false;
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  // DROP_COMMAND at HIGH priority.
  useEffect(() => {
    return editor.registerCommand<DragEvent>(
      DROP_COMMAND,
      (event) => {
        const files = extractImageFiles(event.dataTransfer?.files ?? null);
        if (files.length === 0) return false;
        event.preventDefault();
        void handleFiles(files);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, handleFiles]);

  // Dialog open command — wired from the slash menu.
  useEffect(() => {
    return editor.registerCommand<void>(
      OPEN_INLINE_IMAGE_DIALOG_COMMAND,
      () => {
        setDialogOpen(true);
        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor]);

  // Intercept the fixed-toolbar "+" → Upload click. The stock
  // `UploadFeatureClient` registers a toolbar entry with
  // `data-item-key="upload"` that dispatches Payload's
  // `INSERT_UPLOAD_WITH_DRAWER_COMMAND` (opens the media browser
  // drawer). That command is not in the public client export, so we
  // can't intercept it as a Lexical command — instead we swallow the
  // click in capture phase and dispatch our own dialog command.
  //
  // The DropDown component portals its items to `document.body`, so
  // the click target is not inside the editor's DOM subtree —
  // listening at document level is the only option. To avoid
  // cross-editor crosstalk on pages with multiple Lexical editors,
  // we only open this plugin's dialog if the editor is currently
  // focused / editable.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const isEditorActive = (): boolean => {
      if (!editor.isEditable()) return false;
      const rootEl = editor.getRootElement();
      if (!rootEl) return false;
      const focusedEditor = rootEl.ownerDocument.querySelector(
        '.rich-text-lexical:focus-within',
      );
      if (!focusedEditor) return true;
      return focusedEditor.contains(rootEl) || rootEl.closest('.rich-text-lexical') === focusedEditor;
    };

    const onCapture = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 1) Fixed-toolbar "+" → Upload entry (portaled to document.body).
      const toolbarUpload = target.closest<HTMLElement>('[data-item-key="upload"]');
      if (toolbarUpload) {
        if (!isEditorActive()) return;
        event.preventDefault();
        event.stopPropagation();
        setSwapNodeKey(null);
        editor.dispatchCommand(OPEN_INLINE_IMAGE_DIALOG_COMMAND, undefined);
        return;
      }

      // 2) Upload card "Edit" (pencil) button — opens the stock
      // FieldsDrawer with per-placement fields. We route to our
      // custom InlineImageEditDialog instead.
      const editBtn = target.closest<HTMLElement>(
        '.LexicalEditorTheme__upload__upload-drawer-toggler',
      );
      if (editBtn) {
        const nodeKey = findUploadNodeKeyForElement(editBtn);
        if (!nodeKey) return;
        event.preventDefault();
        event.stopPropagation();
        openEditForNode(nodeKey);
        return;
      }

      // 3) Upload card "Swap" (arrows) button — dispatches Payload's
      // INSERT_UPLOAD_WITH_DRAWER_COMMAND that opens the stock list
      // drawer for picking a different media doc. We open our 3-tab
      // insert dialog in swap mode instead.
      const swapBtn = target.closest<HTMLElement>(
        '.LexicalEditorTheme__upload__swap-drawer-toggler',
      );
      if (swapBtn) {
        const nodeKey = findUploadNodeKeyForElement(swapBtn);
        if (!nodeKey) return;
        event.preventDefault();
        event.stopPropagation();
        setSwapNodeKey(nodeKey);
        setDialogOpen(true);
        return;
      }

      // 4) Upload card filename label — Payload wraps this in a
      // `DocumentDrawerToggler` that opens the full Media admin
      // drawer (overkill — the editor just wants a closer look).
      // Open a lightweight image-preview modal instead.
      const filenameToggler = target.closest<HTMLElement>(
        '.LexicalEditorTheme__upload__doc-drawer-toggler',
      );
      if (filenameToggler) {
        const nodeKey = findUploadNodeKeyForElement(filenameToggler);
        if (!nodeKey) return;
        const dom = editor.getElementByKey(nodeKey);
        const img = dom?.querySelector<HTMLImageElement>('img');
        const url = img?.currentSrc || img?.src;
        if (!url) return;
        const filename = dom?.getAttribute('data-filename') ?? null;
        const altAttr = img?.getAttribute('alt') ?? '';
        event.preventDefault();
        event.stopPropagation();
        setPreviewTarget({ url, alt: altAttr, caption: filename });
      }
    };

    document.addEventListener('click', onCapture, true);
    document.addEventListener('mousedown', onCapture, true);
    return () => {
      document.removeEventListener('click', onCapture, true);
      document.removeEventListener('mousedown', onCapture, true);
    };
  }, [editor, findUploadNodeKeyForElement, openEditForNode]);

  return (
    <>
      <InlineImageInsertDialog
        open={dialogOpen}
        folder={folder}
        mode={swapNodeKey ? 'swap' : 'insert'}
        onClose={() => {
          setDialogOpen(false);
          setSwapNodeKey(null);
        }}
        onInsert={(doc) => {
          insertUploadedDoc(doc, swapNodeKey);
          setDialogOpen(false);
          setSwapNodeKey(null);
        }}
      />
      {previewTarget && (
        <InlineImagePreviewDialog
          open
          url={previewTarget.url}
          alt={previewTarget.alt}
          caption={previewTarget.caption}
          onClose={() => setPreviewTarget(null)}
        />
      )}
      {editTarget && (
        <InlineImageEditDialog
          open
          mediaId={editTarget.mediaId}
          initial={editTarget.fields}
          onClose={() => setEditTarget(null)}
          onSave={(next) => saveEdit(editTarget.nodeKey, next)}
          onReplace={() => {
            const key = editTarget.nodeKey;
            setEditTarget(null);
            setSwapNodeKey(key);
            setDialogOpen(true);
          }}
          onRemove={() => removeNode(editTarget.nodeKey)}
        />
      )}
      {error && (
        <div
          role="alert"
          className="cs-inline-image__toast"
          onAnimationEnd={() => setError(null)}
        >
          {error}
        </div>
      )}
    </>
  );
};

