'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $insertNodes,
  COMMAND_PRIORITY_LOW,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { $createEmbedNode, $isEmbedNode } from './EmbedNode';
import type { EmbedDialogData } from './EmbedDialog';
import { EmbedDialog } from './EmbedDialog';

export type OpenEmbedDialogPayload = { nodeKey?: string };

/**
 * Dispatched to open the embed insert/edit dialog.
 * - No payload (or empty object) → insert mode.
 * - `{ nodeKey }` → edit mode, pre-populates from the existing node.
 */
export const OPEN_EMBED_DIALOG_COMMAND: LexicalCommand<OpenEmbedDialogPayload> =
  createCommand('OPEN_EMBED_DIALOG_COMMAND');

/**
 * Backing plugin for the embed feature. Mounts at the `floatingAnchorElem`
 * slot so it shares the lifecycle of other Cleanstart plugins.
 *
 * Responsibilities:
 *   - Registers OPEN_EMBED_DIALOG_COMMAND and manages dialog open state.
 *   - On confirm: inserts a new EmbedNode or updates an existing one.
 */
export const EmbedPlugin = (): ReactElement | null => {
  const [editor] = useLexicalComposerContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editNodeKey, setEditNodeKey] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<EmbedDialogData | null>(null);

  useEffect(() => {
    return editor.registerCommand<OpenEmbedDialogPayload>(
      OPEN_EMBED_DIALOG_COMMAND,
      ({ nodeKey } = {}) => {
        if (nodeKey) {
          editor.read(() => {
            const node = $getNodeByKey(nodeKey);
            if (!$isEmbedNode(node)) return;
            setInitialData({
              mode: node.getMode(),
              url: node.getUrl(),
              embedUrl: node.getEmbedUrl(),
              provider: node.getProvider(),
              rawHtml: node.getRawHtml(),
              title: node.getTitle(),
              aspectRatio: node.getAspectRatio(),
              caption: node.getCaption(),
            });
            setEditNodeKey(nodeKey);
          });
        } else {
          setInitialData(null);
          setEditNodeKey(null);
        }
        setDialogOpen(true);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  const handleClose = useCallback((): void => {
    setDialogOpen(false);
    setEditNodeKey(null);
    setInitialData(null);
  }, []);

  const handleConfirm = useCallback(
    (data: EmbedDialogData): void => {
      editor.update(() => {
        if (editNodeKey) {
          const node = $getNodeByKey(editNodeKey);
          if ($isEmbedNode(node)) {
            node.setMode(data.mode);
            node.setUrl(data.url, data.embedUrl, data.provider);
            node.setRawHtml(data.rawHtml);
            node.setTitle(data.title);
            node.setAspectRatio(data.aspectRatio);
            node.setCaption(data.caption);
          }
        } else {
          const embedNode = $createEmbedNode({
            mode: data.mode,
            url: data.url,
            embedUrl: data.embedUrl,
            provider: data.provider,
            rawHtml: data.rawHtml,
            title: data.title,
            aspectRatio: data.aspectRatio,
            caption: data.caption,
          });
          const sel = $getSelection();
          if (sel) {
            $insertNodes([embedNode]);
          } else {
            // No active selection: move focus to the end of the root node
            // and insert there so the embed lands somewhere meaningful.
            $getRoot().selectEnd();
            $insertNodes([embedNode]);
          }
        }
      });
      handleClose();
    },
    [editor, editNodeKey, handleClose],
  );

  return (
    <EmbedDialog
      initialData={initialData}
      onClose={handleClose}
      onConfirm={handleConfirm}
      open={dialogOpen}
    />
  );
};
